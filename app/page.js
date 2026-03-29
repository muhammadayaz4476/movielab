import Home from "./components/Home";

const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;

export const metadata = {
  title: "Home | MovieLab - Trending Movies & Series",
  description:
    "Discover the latest trending movies, new releases, and curated collections on MovieLab. Your ultimate destination for entertainment.",
};

async function getInitialData() {
  try {
    const urls = {
      hero: `${BASE_URL}/trending/all/day?api_key=${API_KEY}&include_adult=false`,
      trendingToday: `${BASE_URL}/trending/movie/day?api_key=${API_KEY}&include_adult=false`,
      horrorMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=27&sort_by=popularity.desc&include_adult=false`,
      sciFiMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=878&sort_by=popularity.desc&include_adult=false`,
      movies2024: `${BASE_URL}/discover/movie?api_key=${API_KEY}&primary_release_year=2024&sort_by=popularity.desc&include_adult=false`,
      movies2025: `${BASE_URL}/discover/movie?api_key=${API_KEY}&primary_release_year=2025&sort_by=popularity.desc&include_adult=false`,
      movies2026: `${BASE_URL}/discover/movie?api_key=${API_KEY}&primary_release_year=2026&sort_by=popularity.desc&include_adult=false`,
      actionMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=28&sort_by=popularity.desc&include_adult=false`,
      topRated: `${BASE_URL}/movie/top_rated?api_key=${API_KEY}&include_adult=false`,
      comedyMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=35&sort_by=popularity.desc&include_adult=false`,
      popularNow: `${BASE_URL}/movie/popular?api_key=${API_KEY}&include_adult=false`,
      romanceMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=10749&sort_by=popularity.desc&include_adult=false`,
      koreanMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_original_language=ko&sort_by=popularity.desc&include_adult=false`,
      indianMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_original_language=hi&sort_by=popularity.desc&include_adult=false`,
      hiddenGems: `${BASE_URL}/discover/movie?api_key=${API_KEY}&vote_average.gte=7&vote_count.lte=300&sort_by=vote_average.desc&include_adult=false`,
      feelGoodMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=35,10749&sort_by=popularity.desc&include_adult=false`,
    };

    // Global seen IDs for server-side deduplication
    const seenIds = new Set();

    const rowKeys = Object.keys(urls);

    // 1. Fetch Trending Keywords and 3 pages for Popular rows (2 for others) in parallel
    const [trendingKeywordsRes, ...allRowsRes] = await Promise.all([
      fetch(urls.trendingToday, { next: { revalidate: 3600 } }).catch(() => null),
      ...rowKeys.flatMap((key) => {
        const url = urls[key];
        const separator = url.includes("?") ? "&" : "?";
        const pages = (key === "popularNow" || key === "trendingToday" || key === "actionMovies") ? 4 : 2;
        const reqs = [];
        for (let p = 1; p <= pages; p++) {
          reqs.push(fetch(`${url}${separator}page=${p}`, { next: { revalidate: 3600 } }).catch(() => null));
        }
        return reqs;
      }),
    ]);

    // 2. Process Trending Keywords first
    let trendingKeywords = [];
    if (trendingKeywordsRes && trendingKeywordsRes.ok) {
      try {
        const trendingData = await trendingKeywordsRes.json();
        const topMovies = (trendingData.results || []).slice(0, 6);
        const keywordRequests = topMovies.map((movie) =>
          fetch(`${BASE_URL}/movie/${movie.id}/keywords?api_key=${API_KEY}`, { next: { revalidate: 86400 } })
            .then((res) => res.json())
            .catch(() => ({ keywords: [] }))
        );
        const keywordsData = await Promise.all(keywordRequests);
        const allKeywords = keywordsData.flatMap((data) => data.keywords || []);
        const uniqueKeywordsMap = new Map();
        allKeywords.forEach((k) => {
          if (!uniqueKeywordsMap.has(k.id)) uniqueKeywordsMap.set(k.id, k);
        });
        trendingKeywords = Array.from(uniqueKeywordsMap.values()).slice(0, 50);
      } catch (err) {
        console.error("Failed keywords processing", err);
      }
    }

    // 3. Process all rows sequentially to ensure global deduplication works
    const rawRowsData = await Promise.all(
      allRowsRes.map(async (res) => {
        if (!res || !res.ok) return { results: [] };
        try { return await res.json(); } catch (e) { return { results: [] }; }
      })
    );

    const rows = {};
    let currentIndex = 0;
    const priorityRows = ["trendingToday", "horrorMovies", "sciFiMovies"];

    for (const key of rowKeys) {
      const pages = (key === "popularNow" || key === "trendingToday" || key === "actionMovies") ? 4 : 2;
      const unfilteredResults = [];
      for (let p = 0; p < pages; p++) {
        const data = rawRowsData[currentIndex + p];
        if (data && data.results) unfilteredResults.push(...data.results);
      }
      currentIndex += pages;

      // Sort by newest to oldest
      unfilteredResults.sort((a, b) => {
        const dateA = a.release_date || a.first_air_date || "0000-00-00";
        const dateB = b.release_date || b.first_air_date || "0000-00-00";
        return dateB.localeCompare(dateA);
      });

      const results = [];
      for (const movie of unfilteredResults) {
        if (!movie.id || seenIds.has(movie.id)) continue;
        seenIds.add(movie.id);
        results.push(movie);
        if (results.length >= 20) break;
      }
      rows[key] = { results, keywords: [] };
    }

    // 4. Fetch keywords for priority rows after they are populated
    await Promise.all(priorityRows.map(async (key) => {
      const row = rows[key];
      if (row && row.results.length > 0) {
        try {
          const keywordRequests = row.results.slice(0, 3).map((movie) =>
            fetch(`${BASE_URL}/movie/${movie.id}/keywords?api_key=${API_KEY}`, { next: { revalidate: 86400 } })
              .then((res) => res.json())
              .catch(() => ({ keywords: [] }))
          );
          const keywordsDataArr = await Promise.all(keywordRequests);
          const allKeywords = keywordsDataArr.flatMap((d) => d.keywords || d.results || []);
          const uniqueKeywordsMap = new Map();
          allKeywords.forEach((k) => { if (!uniqueKeywordsMap.has(k.id)) uniqueKeywordsMap.set(k.id, k); });
          row.keywords = Array.from(uniqueKeywordsMap.values()).slice(0, 10);
        } catch (err) {
          console.error(`Failed keywords for ${key}`, err);
        }
      }
    }));

    return { rows, trendingKeywords };
  } catch (error) {
    console.error("Server-side fetch error:", error);
    return {
      rows: {},
      trendingKeywords: [],
    };
  }
}

export default async function Page() {
  const initialData = await getInitialData();

  return (
    <>
      <Home initialData={initialData} />
    </>
  );
}
