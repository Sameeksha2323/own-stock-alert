// api/control.js
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

  const pat          = process.env.GH_PAT;
  const repo         = process.env.GH_REPO;
  const cronApiKey   = process.env.CRONJOB_API_KEY;
  const cronJobId    = process.env.CRONJOB_ID;

  if (!pat || !repo || !cronApiKey || !cronJobId) {
    return new Response(
      JSON.stringify({ error: "Missing env vars", missing: { pat: !pat, repo: !repo, cronApiKey: !cronApiKey, cronJobId: !cronJobId } }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── GitHub: enable/disable workflow ─────────────────────────────────────
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
      JSON.stringify({ error: "Workflow 'Stock Checker' not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const ghAction = action === "enable" ? "enable" : "disable";
  const actionRes = await fetch(
    `https://api.github.com/repos/${repo}/actions/workflows/${workflow.id}/${ghAction}`,
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
      JSON.stringify({ error: `Failed to ${ghAction} GitHub workflow: ${actionRes.status}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // ── cron-job.org: pause/resume ───────────────────────────────────────────
  // enabled: true = running, false = paused
  const cronEnabled = action === "enable";
  const cronRes = await fetch(
    `https://api.cron-job.org/jobs/${cronJobId}`,
    {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${cronApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ job: { enabled: cronEnabled } }),
    }
  );

  if (!cronRes.ok) {
    return new Response(
      JSON.stringify({ error: `Failed to ${action} cron-job: ${cronRes.status}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, action, workflowId: workflow.id, cronJobId }),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
