import { NextResponse } from "next/server";

const TMDB_BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
const EXTERNAL_DATA_URL = "https://movies.umairlab.com";
const INDEXNOW_KEY = "f6742ad82b834857b4a502013346ca9d";

export async function POST() {
  try {
    const pagesToFetch = 25; // Consistent with sitemap
    const promises = [];

    // Fetch popular movies
    for (let i = 1; i <= pagesToFetch; i++) {
      promises.push(
        fetch(`${TMDB_BASE_URL}/movie/popular?api_key=${API_KEY}&page=${i}`)
          .then((res) => res.json())
          .then((data) => data.results || [])
          .then((results) =>
            results.map((item) => ({ ...item, media_type: "movie" })),
          )
          .catch(() => []),
      );
    }

    // Fetch popular TV
    for (let i = 1; i <= pagesToFetch; i++) {
      promises.push(
        fetch(`${TMDB_BASE_URL}/tv/popular?api_key=${API_KEY}&page=${i}`)
          .then((res) => res.json())
          .then((data) => data.results || [])
          .then((results) =>
            results.map((item) => ({ ...item, media_type: "tv" })),
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

    // Filter items from Year 2000 to NOW
    const filteredItems = allItems.filter((item) => {
      const date = item.release_date || item.first_air_date;
      if (!date) return false;
      const year = new Date(date).getFullYear();
      return year >= 2000;
    });

    const urls = filteredItems.map(
      (item) =>
        `${EXTERNAL_DATA_URL}/movie/${createSlug(item.title || item.name, item.id, item.media_type)}`,
    );

    // Add static routes
    const staticRoutes = [
      `${EXTERNAL_DATA_URL}`,
      `${EXTERNAL_DATA_URL}/search`,
      `${EXTERNAL_DATA_URL}/watch-later`,
    ];

    const allUrls = [...staticRoutes, ...urls];

    // Submit to IndexNow
    const payload = {
      host: "movies.umairlab.com",
      key: INDEXNOW_KEY,
      keyLocation: `https://movies.umairlab.com/${INDEXNOW_KEY}.txt`,
      urlList: allUrls,
    };

    const response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: `Submitted ${allUrls.length} URLs to IndexNow`,
      });
    } else {
      const errorText = await response.text();
      return NextResponse.json(
        { success: false, error: errorText },
        { status: response.status },
      );
    }
  } catch (error) {
    console.error("IndexNow submission error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
