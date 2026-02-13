const TMDB_BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
const EXTERNAL_DATA_URL = "https://movies.umairlab.com";

export async function GET(request, { params }) {
  const { id } = await params;
  console.log(`Sitemap Part: Request received for ID: ${id}`);

  // Strip .xml if present
  const cleanId = id.replace(".xml", "");
  const sitemapId = parseInt(cleanId);

  try {
    const pagesPerSitemap = 40;
    const promises = [];
    let mediaType = "movie";
    let startPage = 1;

    switch (sitemapId) {
      case 0:
        mediaType = "movie";
        startPage = 1;
        break;
      case 1:
        mediaType = "movie";
        startPage = 41;
        break;
      case 2:
        mediaType = "movie";
        startPage = 81;
        break;
      case 3:
        mediaType = "tv";
        startPage = 1;
        break;
      case 4:
        mediaType = "tv";
        startPage = 41;
        break;
      // New sitemap parts
      case 5:
        mediaType = "movie";
        startPage = 121;
        break;
      case 6:
        mediaType = "movie";
        startPage = 161;
        break;
      case 7:
        mediaType = "movie";
        startPage = 201;
        break;
      case 8:
        mediaType = "tv";
        startPage = 81;
        break;
      case 9:
        mediaType = "tv";
        startPage = 121;
        break;
      default:
        return new Response("Not Found", { status: 404 });
    }

    const endPage = startPage + pagesPerSitemap - 1;

    for (let i = startPage; i <= endPage; i++) {
      promises.push(
        fetch(
          `${TMDB_BASE_URL}/${mediaType}/popular?api_key=${API_KEY}&page=${i}`,
        )
          .then((res) => res.json())
          .then((data) =>
            (data.results || []).map((item) => ({
              ...item,
              media_type: mediaType,
              page: i,
            })),
          )
          .catch(() => []),
      );
    }

    const results = await Promise.all(promises);
    const allItems = results.flat();

    const createSlug = (title, id, type) => {
      if (!title) return id;
      const prefix = type === "tv" ? "tv-" : "";
      return `${prefix}${title.toLowerCase().replace(/[^\w-]+/g, "")}-${id}`;
    };

    const filteredItems = allItems.filter((item) => {
      const date = item.release_date || item.first_air_date;
      if (!date) return false;
      const year = new Date(date).getFullYear();
      return year >= 2000;
    });

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    if (sitemapId === 0) {
      ["", "/search", "/watch-later"].forEach((route) => {
        xml += "  <url>\n";
        xml += `    <loc>${EXTERNAL_DATA_URL}${route}</loc>\n`;
        xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
        xml += `    <changefreq>${route === "" ? "daily" : "weekly"}</changefreq>\n`;
        xml += `    <priority>${route === "" ? "1.0" : "0.8"}</priority>\n`;
        xml += "  </url>\n";
      });
    }

    filteredItems.forEach((item, index) => {
      const slug = createSlug(
        item.title || item.name,
        item.id,
        item.media_type,
      );

      // Dynamic Priority Logic
      let priority = "0.7";
      if (sitemapId === 0 || sitemapId === 3) {
        // First page of most popular items get 1.0, rest of these sitemaps get 0.9
        priority = item.page === 1 ? "1.0" : "0.9";
      } else if (sitemapId === 1 || sitemapId === 4) {
        priority = "0.8";
      }

      xml += "  <url>\n";
      xml += `    <loc>${EXTERNAL_DATA_URL}/movie/${slug}</loc>\n`;
      xml += `    <lastmod>${new Date().toISOString()}</lastmod>\n`;
      xml += "    <changefreq>weekly</changefreq>\n";
      xml += `    <priority>${priority}</priority>\n`;
      xml += "  </url>\n";
    });

    xml += "</urlset>";

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
      },
    });
  } catch (error) {
    console.error(`Sitemap part ${sitemapId} error:`, error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
