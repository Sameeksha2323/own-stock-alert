export const config = { runtime: "edge" };

export default async function handler(req) {
  const res = await fetch("https://onlywhatsneeded.in/product/whey-protein-2", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "en-IN,en;q=0.9",
      "Referer": "https://onlywhatsneeded.in/",
    },
  });

  const html = await res.text();

  return new Response(
    JSON.stringify({
      httpStatus: res.status,
      containsOrderNow: html.toLowerCase().includes("order now"),
      containsNotifyMe: html.toLowerCase().includes("notify me"),
      first500chars: html.slice(0, 500),
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}
