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

    // 1. Fetch Global Trending Keywords first for the footer
    let trendingKeywords = [];
    try {
      const trendingUrl = urls.trendingToday;
      const trendingRes = await fetch(trendingUrl, {
        next: { revalidate: 3600 },
      });
      if (!trendingRes.ok) {
        if (trendingRes.status === 401) {
          console.warn("TMDB API Key is missing or invalid. Please update NEXT_PUBLIC_TMDB_KEY in .env.local.");
        } else {
          console.error(`Trending fetch failed: ${trendingRes.status}`);
        }
        return { rows: {}, trendingKeywords: [] };
      }
      const trendingData = await trendingRes.json();
      const topMovies = (trendingData.results || []).slice(0, 6);

      const keywordRequests = topMovies.map((movie) =>
        fetch(`${BASE_URL}/movie/${movie.id}/keywords?api_key=${API_KEY}`, {
          next: { revalidate: 86400 },
        })
          .then((res) => res.json())
          .catch(() => ({ keywords: [] })),
      );

      const keywordsData = await Promise.all(keywordRequests);
      const allKeywords = keywordsData.flatMap((data) => data.keywords || []);
      const uniqueKeywordsMap = new Map();
      allKeywords.forEach((k) => {
        if (!uniqueKeywordsMap.has(k.id)) uniqueKeywordsMap.set(k.id, k);
      });
      trendingKeywords = Array.from(uniqueKeywordsMap.values()).slice(0, 50);
    } catch (err) {
      console.error("Failed to fetch trending keywords", err);
    }

    // 2. Fetch all rows in parallel
    const rowRequests = Object.entries(urls).map(async ([key, url]) => {
      try {
        const res = await fetch(url, { next: { revalidate: 3600 } });
        if (!res.ok) return [key, { results: [], keywords: [] }];
        const data = await res.json();
        let rawResults = data.results || [];

        // Apply deduplication (sequential in resultsArr processing, but let's filter what we can)
        // Note: For true global deduplication, we might need a serial approach,
        // but for SSR we just want content to be there. We'll let Home.js handle final dedup.
        const results = rawResults.slice(0, 20);

        // Fetch keywords for the first 3 movies in each row (except hero)
        let rowKeywords = [];
        if (key !== "hero" && results.length > 0) {
          try {
            const topMovies = results.slice(0, 3);
            const keywordRequests = topMovies.map((movie) =>
              fetch(
                `${BASE_URL}/movie/${movie.id}/keywords?api_key=${API_KEY}`,
                { next: { revalidate: 86400 } },
              )
                .then((res) => res.json())
                .catch(() => ({ keywords: [] })),
            );
            const keywordsData = await Promise.all(keywordRequests);
            const allKeywords = keywordsData.flatMap(
              (d) => d.keywords || d.results || [],
            );
            const uniqueKeywordsMap = new Map();
            allKeywords.forEach((k) => {
              if (!uniqueKeywordsMap.has(k.id)) uniqueKeywordsMap.set(k.id, k);
            });
            rowKeywords = Array.from(uniqueKeywordsMap.values()).slice(0, 15);
          } catch (err) {
            console.error(`Failed keywords for ${key}`, err);
          }
        }

        return [key, { results, keywords: rowKeywords }];
      } catch (err) {
        console.error(`Failed row ${key}`, err);
        return [key, { results: [], keywords: [] }];
      }
    });

    const resultsArr = await Promise.all(rowRequests);
    const rows = Object.fromEntries(resultsArr);

    return {
      rows,
      trendingKeywords,
    };
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
