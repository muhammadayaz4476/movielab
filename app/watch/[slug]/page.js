import axios from "axios";
import WatchContent from "./WatchContent";

const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const id = slug?.split("-").pop();

  try {
    const res = await axios.get(`${BASE_URL}/movie/${id}?api_key=${API_KEY}`);
    const movie = res.data;

    return {
      title: `Watching ${movie.title} | MovieLab`,
      description: `Watch ${movie.title} in high quality on MovieLab. ${movie.overview}`,
      openGraph: {
        title: `Watch ${movie.title} | MovieLab`,
        description: movie.overview,
        images: [`https://image.tmdb.org/t/p/w780${movie.backdrop_path}`],
      },
    };
  } catch (error) {
    return {
      title: "Watch Movie | MovieLab",
    };
  }
}

export default async function Page({ params }) {
  const { slug } = await params;
  const id = slug?.split("-").pop();

  let movie = null;
  try {
    const res = await axios.get(
      `${BASE_URL}/movie/${id}?api_key=${API_KEY}&append_to_response=credits`
    );
    movie = res.data;
  } catch (error) {
    console.error("Error fetching movie for watch page:", error);
  }

  return <WatchContent initialMovie={movie} slug={slug} id={id} />;
}
