// api/trigger.js
// Called by Vercel cron every minute.
// Checks stock, and if in stock + workflow not already running, triggers GitHub Actions.
export const config = { runtime: "edge" };

export default async function handler(req) {
  const secret = process.env.CRON_SECRET;
  const pat    = process.env.GH_PAT;
  const repo   = process.env.GH_REPO;
  const vercelUrl = process.env.VERCEL_URL;

  // ── Check stock ────────────────────────────────────────────────────────
  const stockRes = await fetch(`${vercelUrl}/api/check-stock`, {
    headers: { "Authorization": `Bearer ${secret}` }
  });
  const { status } = await stockRes.json();

  if (status !== "in_stock") {
    return new Response(JSON.stringify({ triggered: false, status }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  // ── Check if workflow is already running ───────────────────────────────
  const runsRes = await fetch(
    `https://api.github.com/repos/${repo}/actions/workflows/stock-checker.yml/runs?status=in_progress`,
    {
      headers: {
        "Authorization": `Bearer ${pat}`,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "OWN-Stock-Alert",
      }
    }
  );
  const { workflow_runs } = await runsRes.json();
  if (workflow_runs.length > 0) {
    return new Response(JSON.stringify({ triggered: false, reason: "already_running" }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  // ── Trigger GitHub Actions ─────────────────────────────────────────────
  const ghRes = await fetch(
    `https://api.github.com/repos/${repo}/actions/workflows/stock-checker.yml/dispatches`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${pat}`,
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "OWN-Stock-Alert",
      },
      body: JSON.stringify({ ref: "main" }),
    }
  );

  return new Response(JSON.stringify({ triggered: ghRes.ok, status }), {
    headers: { "Content-Type": "application/json" }
  });
}
