const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
const EXTERNAL_DATA_URL = "https://movies.umairlab.com";

export default async function sitemap() {
  const staticRoutes = [
    "",
    "/search",
    "/watch-later",
    // Add other static routes here
  ].map((route) => ({
    url: `${EXTERNAL_DATA_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: route === "" ? 1 : 0.8,
  }));

  let movieRoutes = [];
  try {
    // Fetch popular movies and TV shows
    // We'll fetch 15 pages of movies and 15 pages of TV shows (20 items per page = 600 total)
    const pagesToFetch = 15;
    const moviePromises = [];
    const tvPromises = [];

    for (let i = 1; i <= pagesToFetch; i++) {
      moviePromises.push(
        fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&page=${i}`).then(
          (res) => res.json(),
        ),
      );
      tvPromises.push(
        fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}&page=${i}`).then(
          (res) => res.json(),
        ),
      );
    }

    const [movieResults, tvResults] = await Promise.all([
      Promise.all(moviePromises),
      Promise.all(tvPromises),
    ]);

    const allMovies = movieResults.flatMap((data) => data.results || []);
    const allTV = tvResults.flatMap((data) => data.results || []);

    const createSlug = (title, id, type = "movie") => {
      if (!title) return id;
      const prefix = type === "tv" ? "tv-" : "";
      return `${prefix}${title.toLowerCase().replace(/[^\w-]+/g, "")}-${id}`;
    };

    const formattedMovies = allMovies.map((movie) => ({
      url: `${EXTERNAL_DATA_URL}/movie/${createSlug(movie.title, movie.id, "movie")}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const formattedTV = allTV.map((show) => ({
      url: `${EXTERNAL_DATA_URL}/movie/${createSlug(show.name, show.id, "tv")}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    movieRoutes = [...formattedMovies, ...formattedTV];
  } catch (error) {
    console.error("Error generating sitemap:", error);
  }

  return [...staticRoutes, ...movieRoutes];
}
