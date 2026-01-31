import axios from "axios";
import WatchContent from "./WatchContent";

const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const id = slug?.split("-").pop();
  const isTV = slug?.startsWith("tv-");
  const mediaType = isTV ? "tv" : "movie";

  try {
    const res = await axios.get(
      `${BASE_URL}/${mediaType}/${id}?api_key=${API_KEY}`,
    );
    const data = res.data;
    const title = data.title || data.name;

    return {
      title: `Watching ${title} | MovieLab`,
      description: `Watch ${title} in high quality on MovieLab. ${data.overview}`,
      openGraph: {
        title: `Watch ${title} | MovieLab`,
        description: data.overview,
        images: [`https://image.tmdb.org/t/p/w780${data.backdrop_path}`],
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
  const isTV = slug?.startsWith("tv-");
  const mediaType = isTV ? "tv" : "movie";

  let data = null;
  try {
    const res = await axios.get(
      `${BASE_URL}/${mediaType}/${id}?api_key=${API_KEY}&append_to_response=credits,videos`,
    );
    data = res.data;
  } catch (error) {
    console.error("Error fetching content for watch page:", error);
  }

  return (
    <WatchContent
      initialData={data}
      slug={slug}
      id={id}
      mediaType={mediaType}
    />
  );
}
