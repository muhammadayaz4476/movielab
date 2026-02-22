const TMDB_BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
const EXTERNAL_DATA_URL = "https://movies.umairlab.com";

export async function GET() {
  try {
    const genresResponse = await fetch(
      `${TMDB_BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=en-US`,
    );
    const genresData = await genresResponse.json();
    const genres = genresData.genres || [];

    const hubs = [
      { name: "Hollywood", slug: "hollywood" },
      { name: "Bollywood", slug: "bollywood" },
      { name: "Korean", slug: "korean" },
      { name: "Anime", slug: "anime" },
      { name: "Web Series", slug: "web-series" },
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Core static pages
    const mainPages = [
      { url: "/", priority: "1.0", changefreq: "daily" },
      { url: "/search", priority: "0.9", changefreq: "weekly" },
      // { url: "/watch-later", priority: "0.9", changefreq: "weekly" },
    ];

    mainPages.forEach((page) => {
      xml += "  <url>\n";
      xml += `    <loc>${EXTERNAL_DATA_URL}${page.url}</loc>\n`;
      xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += "  </url>\n";
    });

    // Hubs
    hubs.forEach((hub) => {
      xml += "  <url>\n";
      xml += `    <loc>${EXTERNAL_DATA_URL}/discover/${hub.slug}</loc>\n`;
      xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
      xml += "    <changefreq>weekly</changefreq>\n";
      xml += "    <priority>0.9</priority>\n";
      xml += "  </url>\n";
    });

    // Genres
    genres.forEach((genre) => {
      const slug = `${genre.name.toLowerCase().replace(/ /g, "-")}-${genre.id}`;
      xml += "  <url>\n";
      xml += `    <loc>${EXTERNAL_DATA_URL}/discover/${slug}</loc>\n`;
      xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
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
    console.error("Static sitemap error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
