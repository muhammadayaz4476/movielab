import SearchContent from "./SearchContent";

export async function generateMetadata({ params }) {
  const { query } = await params;
  const decodedQuery = decodeURIComponent(query);

  return {
    title: `Search results for "${decodedQuery}" | MovieLab`,
    description: `Explore search results for "${decodedQuery}" on MovieLab. Find your favorite movies and TV shows.`,
  };
}

export default async function Page({ params }) {
  const { query } = await params;
  return <SearchContent query={query} />;
}
