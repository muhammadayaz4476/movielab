const TMDB_BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
const EXTERNAL_DATA_URL = "https://movies.umairlab.com";

const createSlug = (title, id, type) => {
  if (!title) return id;
  const prefix = type === "tv" ? "tv-" : "";
  return `${prefix}${title.toLowerCase().replace(/[^\w-]+/g, "")}-${id}`;
};

export async function GET() {
  try {
    const totalPages = 50; // 50 pages * 20 items = 1000 items
    const promises = [];

    for (let i = 1; i <= totalPages; i++) {
      promises.push(
        fetch(
          `${TMDB_BASE_URL}/discover/tv?api_key=${API_KEY}&sort_by=popularity.desc&first_air_date.gte=2000-01-01&page=${i}`,
        )
          .then((res) => res.json())
          .then((data) => data.results || [])
          .catch(() => []),
      );
    }

    const results = await Promise.all(promises);
    const series = results.flat();

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    series.forEach((item) => {
      const slug = createSlug(item.name, item.id, "tv");
      xml += "  <url>\n";
      xml += `    <loc>${EXTERNAL_DATA_URL}/movie/${slug}</loc>\n`;
      xml += `    <lastmod>${new Date(item.first_air_date || new Date()).toISOString()}</lastmod>\n`;
      xml += "    <changefreq>weekly</changefreq>\n";
      xml += "    <priority>0.8</priority>\n";
      xml += "  </url>\n";
    });

    xml += "</urlset>";

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
      },
    });
  } catch (error) {
    console.error("Webseries sitemap error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
