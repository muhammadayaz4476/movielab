export async function GET() {
  console.log("Manual Sitemap Index: Request received");
  const EXTERNAL_DATA_URL = "https://movies.umairlab.com";
  const sitemapCount = 5;

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (let i = 0; i < sitemapCount; i++) {
    xml += "  <sitemap>\n";
    xml += `    <loc>${EXTERNAL_DATA_URL}/sitemap/${i}</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
    xml += "  </sitemap>\n";
  }

  xml += "</sitemapindex>";

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
