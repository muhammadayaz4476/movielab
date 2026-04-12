import DiscoverContent from "./DiscoverContent";

const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;

async function getDiscoveryData(slug, page = 1, year = "", type = "all") {
  const decodedSlug = decodeURIComponent(slug);
  const isWebSeries = slug === "web-series";
  
  const getTVGenreId = (movieGenreId) => {
    const mapping = {
      27: 10765, // Horror -> Sci-Fi & Fantasy (Most horror series are here)
      28: 10759, // Action -> Action & Adventure
      12: 10759, // Adventure -> Action & Adventure
      878: 10765, // Sci-Fi -> Sci-Fi & Fantasy
      14: 10765, // Fantasy -> Sci-Fi & Fantasy
      10752: 10768, // War -> War & Politics
      53: 9648, // Thriller -> Mystery
      36: 10768, // History -> War & Politics
    };
    return mapping[movieGenreId] || movieGenreId;
  };

  // Helper to fetch single type
  const fetchSingle = async (mType, p) => {
    const sortBy = mType === "tv" ? "first_air_date.desc" : "primary_release_date.desc";
    const commonFilters = `&include_adult=true&vote_count.gte=10`;
    const yearParam = mType === "tv" ? "first_air_date_year" : "primary_release_year";
    const yearFilter = year ? `&${yearParam}=${year}` : "";
    const baseParams = `&page=${p}&sort_by=${sortBy}${commonFilters}${yearFilter}`;

    let endpoint = "";
    if (["hollywood", "bollywood", "korean", "anime", "japanese"].includes(decodedSlug)) {
      const langMap = { hollywood: "en", bollywood: "hi", korean: "ko", anime: "ja", japanese: "ja" };
      endpoint = `${BASE_URL}/discover/${mType}?api_key=${API_KEY}&with_original_language=${langMap[decodedSlug] || "en"}${baseParams}`;
      if (decodedSlug === "anime") endpoint += "&with_genres=16";
    } else if (["trending", "top-rated", "popular", "new-releases", "hidden-gems", "feel-good", "web-series"].includes(decodedSlug)) {
      endpoint = `${BASE_URL}/discover/${mType}?api_key=${API_KEY}${baseParams}`;
      if (decodedSlug === "trending") endpoint += "&vote_count.gte=100";
      else if (decodedSlug === "top-rated") endpoint += "&vote_average.gte=7.5&vote_count.gte=300";
      else if (decodedSlug === "popular") endpoint += "&vote_count.gte=500";
      else if (decodedSlug === "new-releases") endpoint += "&with_release_type=2|3";
      else if (decodedSlug === "hidden-gems") endpoint += "&vote_average.gte=7&vote_count.lte=300";
      else if (decodedSlug === "feel-good") endpoint += "&with_genres=35,10749";
      else if (decodedSlug === "web-series" && mType === "tv") endpoint += "&with_original_language=hi";
    } else if (decodedSlug.startsWith("actor-")) {
      const id = decodedSlug.split("-").pop();
      endpoint = `${BASE_URL}/discover/${mType}?api_key=${API_KEY}&with_cast=${id}${baseParams}`;
    } else if (decodedSlug.startsWith("country-")) {
      const code = decodedSlug.split("-").pop().toUpperCase();
      endpoint = `${BASE_URL}/discover/${mType}?api_key=${API_KEY}&with_origin_country=${code}${baseParams}`;
    } else {
      let gId = decodedSlug.split("-").pop();
      if (mType === "tv") gId = getTVGenreId(gId);
      endpoint = `${BASE_URL}/discover/${mType}?api_key=${API_KEY}&with_genres=${gId}${baseParams}`;
    }

    try {
      const res = await fetch(endpoint, { next: { revalidate: 3600 } });
      if (!res.ok) {
        console.error(`TMDB fetch failed for ${mType}: ${res.status}`);
        return { results: [] };
      }
      return await res.json();
    } catch (err) {
      console.error(`Fetch error for ${mType}:`, err);
      return { results: [] };
    }
  };

  if (isWebSeries) {
    const data = await fetchSingle("tv", page);
    return { ...data, lastPageFetched: page, type: "tv" };
  }

  // Determine if we should fetch both
  const shouldFetchBoth = type === "all" && !isWebSeries;

  if (shouldFetchBoth) {
    const [movieData, tvData] = await Promise.all([
      fetchSingle("movie", page),
      fetchSingle("tv", page),
    ]);

    const results = [
      ...(movieData.results || []).map(r => ({ ...r, media_type: "movie" })),
      ...(tvData.results || []).map(r => ({ ...r, media_type: "tv" })),
    ].sort((a, b) => {
      const dateA = a.release_date || a.first_air_date || "0000-00-00";
      const dateB = b.release_date || b.first_air_date || "0000-00-00";
      return dateB.localeCompare(dateA);
    });

    return {
      results,
      page,
      total_pages: Math.max(movieData.total_pages || 0, tvData.total_pages || 0),
      lastPageFetched: page,
      type: "all"
    };
  } else {
    const data = await fetchSingle(type, page);
    return { ...data, lastPageFetched: page, type };
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

  const mediaLabel = data.type === "all" ? "Movies & Series" : (data.type === "tv" ? "TV Series" : "Movies");

  if (capitals[decodedSlug]) {
    title = `${capitals[decodedSlug]} ${mediaLabel}`;
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
      "new-releases": "New Releases",
      "hidden-gems": "Hidden Gems",
      "feel-good": "Feel Good",
      "web-series": "Must Watch Web Series",
    };
    title = `${categoryTitles[decodedSlug] || "Discover"} ${mediaLabel}`;
  } else if (decodedSlug.startsWith("actor-")) {
    const nameParts = decodedSlug.split("-").slice(1, -1);
    const actorName = nameParts
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
    title = `${actorName}'s ${mediaLabel}`;
  } else if (decodedSlug.startsWith("country-")) {
    const nameParts = decodedSlug.split("-").slice(1, -1);
    const countryName = nameParts
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" ");
    title = `${countryName} ${mediaLabel}`;
  } else {
    const parts = decodedSlug.split("-");
    parts.pop();
    title = `${parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ")} ${mediaLabel}`;
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
  const decodedSlug = decodeURIComponent(slug);

  return (
    <>
      <DiscoverContent
        slug={slug}
        initialResults={[]}
        initialYear={year}
        initialLastPage={0}
      />
    </>
  );
}
