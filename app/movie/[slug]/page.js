import axios from "axios";
import MovieContent from "./MovieContent";

const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const id = slug?.split("-").pop();

  try {
    const res = await axios.get(`${BASE_URL}/movie/${id}?api_key=${API_KEY}`);
    const movie = res.data;

    return {
      title: `${movie.title} | MovieLab`,
      description: movie.overview,
      openGraph: {
        title: `${movie.title} | MovieLab`,
        description: movie.overview,
        images: [`https://image.tmdb.org/t/p/w780${movie.backdrop_path}`],
      },
      twitter: {
        card: "summary_large_image",
        title: `${movie.title} | MovieLab`,
        description: movie.overview,
        images: [`https://image.tmdb.org/t/p/w780${movie.backdrop_path}`],
      },
    };
  } catch (error) {
    return {
      title: "Movie Details | MovieLab",
    };
  }
}

export default async function Page({ params }) {
  const { slug } = await params;
  const id = slug?.split("-").pop();

  let movie = null;
  try {
    const res = await axios.get(
      `${BASE_URL}/movie/${id}?api_key=${API_KEY}&append_to_response=videos,credits`
    );
    movie = res.data;
  } catch (error) {
    console.error("Error fetching movie in server component:", error);
  }

  return <MovieContent initialMovie={movie} slug={slug} id={id} />;
}
