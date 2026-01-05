import DiscoverContent from "./DiscoverContent";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  let title = "Discover Movies";

  if (
    ["hollywood", "bollywood", "korean", "anime", "japanese"].includes(
      decodedSlug
    )
  ) {
    title = decodedSlug.charAt(0).toUpperCase() + decodedSlug.slice(1);
  } else if (
    [
      "trending",
      "top-rated",
      "popular",
      "new-releases",
      "hidden-gems",
      "feel-good",
    ].includes(decodedSlug)
  ) {
    const categoryTitles = {
      trending: "Trending Movies",
      "top-rated": "Top Rated Movies",
      popular: "Popular Movies",
      "new-releases": "New Releases",
      "hidden-gems": "Hidden Gems",
      "feel-good": "Feel Good Movies",
    };
    title = categoryTitles[decodedSlug] || "Discover";
  } else {
    const parts = decodedSlug.split("-");
    parts.pop(); // remove id
    const name = parts.join(" ");
    title = name.charAt(0).toUpperCase() + name.slice(1);
  }

  return {
    title: `${title} | MovieLab`,
    description: `Explore the best ${title} on MovieLab. Stream and download high-quality content.`,
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  return <DiscoverContent slug={slug} />;
}
