import SearchContent from "./SearchContent";

export async function generateMetadata({ params }) {
  const { query } = await params;
  const decodedQuery = decodeURIComponent(query);

  const title = `Watch "${decodedQuery}" Free Online - Search Results | MovieLab`;
  const description = `Stream "${decodedQuery}" in Full HD 1080p for free on MovieLab. Browse our library for "${decodedQuery}" movies and TV series with English subtitles.`;

  return {
    title: title,
    description: description,
    keywords: `watch ${decodedQuery} free, stream ${decodedQuery}, ${decodedQuery} online free, download ${decodedQuery} 1080p`,
    openGraph: {
      title: title,
      description: description,
      url: `https://movies.umairlab.com/search/${query}`,
      siteName: "MovieLab",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
    },
    robots: {
      index: false, 
      follow: true,
    },
  };
}

export default async function Page({ params }) {
  const { query } = await params;
  return <SearchContent query={query} />;
}
