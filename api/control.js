// api/control.js
// Called by dashboard Start / Stop buttons.
// Enables or disables the "Stock Checker" GitHub Actions workflow.

export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { action } = body;
  if (!["enable", "disable"].includes(action)) {
    return new Response("Invalid action — must be 'enable' or 'disable'", { status: 400 });
  }

  const pat  = process.env.GH_PAT;
  const repo = process.env.GH_REPO;   // e.g. "yourname/own-stock-alert"

  if (!pat || !repo) {
    return new Response(
      JSON.stringify({ error: "GH_PAT or GH_REPO not configured in Vercel env vars" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Get the workflow ID for "Stock Checker"
  const listRes = await fetch(
    `https://api.github.com/repos/${repo}/actions/workflows`,
    {
      headers: {
        "Authorization": `Bearer ${pat}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "OWN-Stock-Alert",
      },
    }
  );

  if (!listRes.ok) {
    return new Response(
      JSON.stringify({ error: `GitHub API error: ${listRes.status}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const { workflows } = await listRes.json();
  const workflow = workflows.find(w => w.name === "Stock Checker");

  if (!workflow) {
    return new Response(
      JSON.stringify({ error: "Workflow named 'Stock Checker' not found in repo" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  // Enable or disable
  const actionRes = await fetch(
    `https://api.github.com/repos/${repo}/actions/workflows/${workflow.id}/${action}`,
    {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${pat}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "OWN-Stock-Alert",
      },
    }
  );

  if (!actionRes.ok) {
    return new Response(
      JSON.stringify({ error: `Failed to ${action} workflow: ${actionRes.status}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, action, workflowId: workflow.id }),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
