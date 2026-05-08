// api/check-stock.js
// Called by GitHub Actions every minute.
// Only checks stock status — alerting logic lives in the workflow itself.
//
// Stock detection (confirmed by checking both pages on onlywhatsneeded.in):
//   IN STOCK    → page contains "Order Now"
//   OUT OF STOCK → page contains "Notify Me"

export const config = { runtime: "edge" };

// const PRODUCT_URL  = "https://onlywhatsneeded.in/product/plant-coffee-1kg";
const PRODUCT_URL  = "https://onlywhatsneeded.in/product/whey-protein-2";

async function fetchStockStatus() {
  try {
    const res = await fetch(PRODUCT_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
          "AppleWebKit/537.36 (KHTML, like Gecko) " +
          "Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-IN,en;q=0.9",
        "Referer": "https://onlywhatsneeded.in/",
      },
      redirect: "follow",
    });

    if (!res.ok) return { status: "error", detail: `HTTP ${res.status}` };

    const html = (await res.text()).toLowerCase();

    if (html.includes("order now"))  return { status: "in_stock" };
    if (html.includes("notify me"))  return { status: "out_of_stock" };
    return { status: "unknown", detail: "Neither button text found in HTML" };

  } catch (e) {
    return { status: "error", detail: String(e) };
  }
}

export default async function handler(req) {
  // Verify secret — only GitHub Actions can call this
  const auth   = req.headers.get("authorization") || "";
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { status, detail } = await fetchStockStatus();

  return new Response(
    JSON.stringify({ status, detail, checkedAt: new Date().toISOString() }),
    { headers: { "Content-Type": "application/json" } }
  );
}
