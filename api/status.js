// api/status.js
// Polled by the dashboard every 30s.
// Returns: live stock status + whether the workflow is active or disabled.

export const config = { runtime: "edge" };

export default async function handler(req) {
  const pat  = process.env.GH_PAT;
  const repo = process.env.GH_REPO;

  let workflowState = "unknown";
  let stockStatus   = "unknown";

  // ── Workflow state from GitHub ───────────────────────────────────────────
  if (pat && repo) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${repo}/actions/workflows`,
        {
          headers: {
            "Authorization": `Bearer ${pat}`,
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "OWN-Stock-Alert",
          },
        }
      );
      if (res.ok) {
        const { workflows } = await res.json();
        const wf = workflows.find(w => w.name === "Stock Checker");
        workflowState = wf ? wf.state : "not_found";
      }
    } catch (_) {
      workflowState = "error";
    }
  }

  // ── Live stock check ─────────────────────────────────────────────────────
  try {
    const res = await fetch(
      "https://onlywhatsneeded.in/product/plant-coffee-1kg",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "en-IN,en;q=0.9",
          "Referer": "https://onlywhatsneeded.in/",
        },
      }
    );
    if (res.ok) {
      const html = (await res.text()).toLowerCase();
      // if (html.includes("order now"))  stockStatus = "in_stock";
      // else if (html.includes("notify me")) stockStatus = "out_of_stock";
      if (html.includes("notify me"))       stockStatus = "out_of_stock";
      else if (html.includes("order now")) stockStatus = "in_stock";
    }
  } catch (_) {
    stockStatus = "error";
  }

  return new Response(
    JSON.stringify({
      workflowState,    // "active" | "disabled" | "unknown"
      stockStatus,      // "in_stock" | "out_of_stock" | "unknown" | "error"
      checkedAt: new Date().toISOString(),
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-store",
      },
    }
  );
}
