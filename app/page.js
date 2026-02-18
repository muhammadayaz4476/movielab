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
    };

    // Trending Keywords Fetching
    let trendingKeywords = [];
    try {
      const trendingUrl = urls.trendingToday;
      const trendingRes = await fetch(trendingUrl, {
        next: { revalidate: 3600 },
      });
      const trendingData = await trendingRes.json();
      const topMovies = (trendingData.results || []).slice(0, 6);

      const keywordRequests = topMovies.map((movie) =>
        fetch(
          `${BASE_URL}/movie/${movie.id}/keywords?api_key=${API_KEY}`,
          { next: { revalidate: 86400 } }, // Cache keywords for 24 hours
        ).then((res) => res.json()),
      );

      const keywordsData = await Promise.all(keywordRequests);
      const allKeywords = keywordsData.flatMap((data) => data.keywords || []);

      // Deduplicate by ID
      const uniqueKeywordsMap = new Map();
      allKeywords.forEach((k) => {
        if (!uniqueKeywordsMap.has(k.id)) {
          uniqueKeywordsMap.set(k.id, { id: k.id, name: k.name });
        }
      });

      trendingKeywords = Array.from(uniqueKeywordsMap.values()).slice(0, 50);
    } catch (err) {
      console.error("Failed to fetch trending keywords", err);
    }

    const requests = Object.entries(urls).map(async ([key, url]) => {
      const res = await fetch(url, { next: { revalidate: 3600 } }); // Cache for 1 hour
      if (!res.ok) return [key, []];
      const data = await res.json();
      let results = data.results || [];
      if (key === "hero") results = results.slice(0, 5);
      return [key, results];
    });

    const results = await Promise.all(requests);
    return { ...Object.fromEntries(results), trendingKeywords };
  } catch (error) {
    console.error("Server-side fetch error:", error);
    return {
      hero: [],
      trendingToday: [],
      horrorMovies: [],
      sciFiMovies: [],
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
