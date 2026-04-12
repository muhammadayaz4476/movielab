import Home from "./components/Home";

const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;

export const metadata = {
  title: "Home | MovieLab - Trending Movies & Series",
  description:
    "Discover the latest trending movies, new releases, and curated collections on MovieLab. Your ultimate destination for entertainment.",
};

export default async function Page() {
  return (
    <>
      <Home initialData={{}} />
    </>
  );
}
