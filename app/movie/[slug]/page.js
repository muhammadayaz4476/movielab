import axios from "axios";
import MovieContent from "./MovieContent";

const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const id = slug?.split("-").pop();
  const isTV = slug?.startsWith("tv-");
  const mediaType = isTV ? "tv" : "movie";

  try {
    const res = await axios.get(
      `${BASE_URL}/${mediaType}/${id}?api_key=${API_KEY}`
    );
    const data = res.data;
    const title = data.title || data.name;
    const description = data.overview;
    const backdrop = data.backdrop_path;

    return {
      title: `${title} | MovieLab`,
      description: description,
      openGraph: {
        title: `${title} | MovieLab`,
        description: description,
        images: [`https://image.tmdb.org/t/p/w780${backdrop}`],
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} | MovieLab`,
        description: description,
        images: [`https://image.tmdb.org/t/p/w780${backdrop}`],
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
  const isTV = slug?.startsWith("tv-");
  const mediaType = isTV ? "tv" : "movie";

  let data = null;
  try {
    const res = await axios.get(
      `${BASE_URL}/${mediaType}/${id}?api_key=${API_KEY}&append_to_response=videos,credits`
    );
    data = res.data;
  } catch (error) {
    console.error("Error fetching content in server component:", error);
  }

  return (
    <MovieContent
      initialData={data}
      slug={slug}
      id={id}
      mediaType={mediaType}
    />
  );
}
