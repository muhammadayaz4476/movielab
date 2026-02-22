export async function GET() {
  const EXTERNAL_DATA_URL = "https://movies.umairlab.com";

  const sitemaps = ["static.xml", "movies.xml", "webseries.xml"];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  sitemaps.forEach((sm) => {
    xml += "  <sitemap>\n";
    xml += `    <loc>${EXTERNAL_DATA_URL}/${sm}</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
    xml += "  </sitemap>\n";
  });

  xml += "</sitemapindex>";

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
