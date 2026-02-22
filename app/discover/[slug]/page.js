import DiscoverContent from "./DiscoverContent";

const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;

async function getDiscoveryData(slug, page = 1, year = "") {
  const decodedSlug = decodeURIComponent(slug);
  const mediaType = slug === "web-series" ? "tv" : "movie";

  let endpoint = "";
  const commonFilters = `&include_adult=false${mediaType === "tv" ? "&vote_count.gte=0" : "&vote_count.gte=10"}`;
  const yearParam =
    mediaType === "tv" ? "first_air_date_year" : "primary_release_year";
  const yearFilter = year ? `&${yearParam}=${year}` : "";
  const baseParams = `&page=${page}&sort_by=popularity.desc${commonFilters}${yearFilter}`;

  if (
    ["hollywood", "bollywood", "korean", "anime", "japanese"].includes(
      decodedSlug,
    )
  ) {
    const langMap = {
      hollywood: "en",
      bollywood: "hi",
      korean: "ko",
      anime: "ja",
      japanese: "ja",
    };
    if (decodedSlug === "anime") {
      endpoint = `${BASE_URL}/discover/${mediaType}?api_key=${API_KEY}&with_genres=16&with_original_language=ja${baseParams}`;
    } else {
      endpoint = `${BASE_URL}/discover/${mediaType}?api_key=${API_KEY}&with_original_language=${langMap[decodedSlug] || "en"}${baseParams}`;
    }
  } else if (
    [
      "trending",
      "top-rated",
      "popular",
      "new-releases",
      "hidden-gems",
      "feel-good",
      "web-series",
    ].includes(decodedSlug)
  ) {
    if (
      (decodedSlug === "trending" ||
        decodedSlug === "top-rated" ||
        decodedSlug === "popular") &&
      !year
    ) {
      const endpoints = {
        trending: `${BASE_URL}/trending/${mediaType}/day?api_key=${API_KEY}&page=${page}`,
        "top-rated": `${BASE_URL}/${mediaType}/top_rated?api_key=${API_KEY}&page=${page}`,
        popular: `${BASE_URL}/${mediaType}/popular?api_key=${API_KEY}&page=${page}`,
      };
      endpoint = endpoints[decodedSlug];
    } else if (decodedSlug === "new-releases") {
      const releaseTypeFilter =
        !year || parseInt(year) >= 2024 ? "&with_release_type=2|3" : "";
      endpoint = `${BASE_URL}/discover/${mediaType}?api_key=${API_KEY}${baseParams}${releaseTypeFilter}`;
    } else if (decodedSlug === "hidden-gems")
      endpoint = `${BASE_URL}/discover/${mediaType}?api_key=${API_KEY}&vote_average.gte=7&vote_count.lte=300${baseParams}`;
    else if (decodedSlug === "feel-good")
      endpoint = `${BASE_URL}/discover/${mediaType}?api_key=${API_KEY}&with_genres=35,10749${baseParams}`;
    else if (decodedSlug === "web-series") {
      endpoint = year
        ? `${BASE_URL}/discover/tv?api_key=${API_KEY}${baseParams}`
        : `${BASE_URL}/tv/popular?api_key=${API_KEY}&page=${page}`;
    } else if (
      ["trending", "top-rated", "popular"].includes(decodedSlug) &&
      year
    ) {
      // Use discover for year filtering on trending/popular categories
      endpoint = `${BASE_URL}/discover/${mediaType}?api_key=${API_KEY}${baseParams}`;
    }
  } else {
    const genreId = decodedSlug.split("-").pop();
    endpoint = `${BASE_URL}/discover/${mediaType}?api_key=${API_KEY}&with_genres=${genreId}${baseParams}`;
  }

  try {
    const res = await fetch(endpoint, { next: { revalidate: 3600 } });
    if (!res.ok) return { results: [] };
    return res.json();
  } catch (error) {
    return { results: [] };
  }
}

export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const { year } = (await searchParams) || {};
  const decodedSlug = decodeURIComponent(slug);
  const data = await getDiscoveryData(slug, 1, year);
  const topTitles = data.results
    ?.slice(0, 3)
    .map((m) => m.title || m.name)
    .join(", ");

  let title = "Discover Movies";
  const capitals = {
    hollywood: "Hollywood",
    bollywood: "Bollywood",
    korean: "Korean",
    anime: "Anime",
    japanese: "Japanese",
  };

  if (capitals[decodedSlug]) {
    title = `${capitals[decodedSlug]} Movies & Series`;
  } else if (
    [
      "trending",
      "top-rated",
      "popular",
      "new-releases",
      "hidden-gems",
      "feel-good",
      "web-series",
    ].includes(decodedSlug)
  ) {
    const categoryTitles = {
      trending: "Trending Now",
      "top-rated": "Top Rated",
      popular: "Popular Content",
      "new-releases": "New Releases 2024",
      "hidden-gems": "Hidden Gems",
      "feel-good": "Feel Good",
      "web-series": "Must Watch Web Series",
    };
    title = categoryTitles[decodedSlug] || "Discover";
  } else {
    const parts = decodedSlug.split("-");
    parts.pop();
    title = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
  }

  const yearSuffix = year ? ` (${year})` : "";

  return {
    title: `Watch Best ${title}${yearSuffix} Online | ${topTitles ? `Featuring ${topTitles} | ` : ""}MovieLab`,
    description: `Explore our curated selection of ${title}${yearSuffix}. ${topTitles ? `Watch hits like ${topTitles} and more. ` : ""}Stream in HD 1080p, download for free with zero ads on MovieLab.`,
    alternates: {
      canonical: `https://movies.umairlab.com/discover/${slug}${year ? `?year=${year}` : ""}`,
    },
  };
}

export default async function Page({ params, searchParams }) {
  const { slug } = await params;
  const { year } = (await searchParams) || {};
  const initialData = await getDiscoveryData(slug, 1, year);
  const decodedSlug = decodeURIComponent(slug);

  // Schema Markup
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://movies.umairlab.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Discover",
        item: `https://movies.umairlab.com/discover/${slug}`,
      },
    ],
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: initialData.results?.slice(0, 10).map((item, index) => {
      const title = item.title || item.name || "";
      const id = item.id;
      const type = slug === "web-series" ? "tv" : "movie";
      const prefix = type === "tv" ? "tv-" : "";
      const itemSlug = `${prefix}${title
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "")}-${id}`;

      return {
        "@type": "ListItem",
        position: index + 1,
        url: `https://movies.umairlab.com/movie/${itemSlug}`,
        name: title,
      };
    }),
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Where can I watch ${decodedSlug.replace(/-/g, " ")} for free?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `You can watch high-quality content in the ${decodedSlug.replace(/-/g, " ")} category on MovieLab for free with no registration and zero ads.`,
        },
      },
      {
        "@type": "Question",
        name: `What are the best movies in this category?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Our top picks currently include ${initialData.results
            ?.slice(0, 3)
            .map((m) => m.title || m.name)
            .join(", ")}.`,
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <DiscoverContent
        slug={slug}
        initialResults={initialData.results || []}
        initialYear={year}
      />
    </>
  );
}
