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

    const requests = Object.entries(urls).map(async ([key, url]) => {
      const res = await fetch(url, { next: { revalidate: 3600 } }); // Cache for 1 hour
      if (!res.ok) return [key, []];
      const data = await res.json();
      return [key, data.results || []];
    });

    const results = await Promise.all(requests);
    return Object.fromEntries(results);
  } catch (error) {
    console.error("Server-side fetch error:", error);
    return { hero: [], trendingToday: [], horrorMovies: [], sciFiMovies: [] };
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
