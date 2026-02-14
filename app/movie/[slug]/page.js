import MovieContent from "./MovieContent";

const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;

async function getTMDBData(mediaType, id, appendToResponse = "") {
  const url = `${BASE_URL}/${mediaType}/${id}?api_key=${API_KEY}${appendToResponse ? `&append_to_response=${appendToResponse}` : ""}`;
  const res = await fetch(url, { next: { revalidate: 3600 } }); // Cache for 1 hour
  if (!res.ok) {
    throw new Error(`Failed to fetch TMDB data: ${res.statusText}`);
  }
  return res.json();
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const id = slug?.split("-").pop();
  const isTV = slug?.startsWith("tv-");
  const mediaType = isTV ? "tv" : "movie";

  try {
    const data = await getTMDBData(
      mediaType,
      id,
      "keywords,credits,external_ids,release_dates,watch/providers",
    );
    const title = data.title || data.name;
    const overview = data.overview || "";
    const backdrop = data.backdrop_path;
    const releaseDate = data.release_date || data.first_air_date || "";
    const year = releaseDate ? new Date(releaseDate).getFullYear() : "";

    // Generate keywords
    const keywords = [];
    if (title) keywords.push(title);
    if (year) keywords.push(`${title} ${year}`);
    keywords.push(
      `watch ${title} free`,
      `stream ${title} online`,
      `download ${title}`,
    );

    // Add genres to keywords
    if (data.genres) {
      data.genres.forEach((g) => keywords.push(g.name));
      keywords.push(...data.genres.map((g) => `${g.name} movies`));
    }

    // Add Cast to keywords (top 5)
    if (data.credits && data.credits.cast) {
      data.credits.cast.slice(0, 5).forEach((actor) => {
        keywords.push(actor.name);
        keywords.push(`${actor.name} movies`);
      });
    }

    // Add TMDB keywords
    if (data.keywords) {
      const kws = data.keywords.keywords || data.keywords.results || [];
      kws.forEach((k) => keywords.push(k.name));
    }

    // Aggressive SEO Description
    const genreNames = data.genres
      ? data.genres.map((g) => g.name).join(", ")
      : "Movies";
    const director = data.credits?.crew?.find(
      (person) => person.job === "Director",
    )?.name;
    const prefix = `Watch ${title} (${year})${director ? ` directed by ${director}` : ""} Full ${mediaType === "tv" ? "Series" : "Movie"} Online Free. `;
    const storyBrief = overview ? `${overview.substring(0, 150)}... ` : "";
    const suffix = `Stream ${title} in 1080p HD on MovieLab. Experience ${genreNames} content with zero ads and fast buffering.`;

    let description = `${prefix}${storyBrief}${suffix}`;
    if (description.length > 300) {
      description = description.substring(0, 297) + "...";
    }

    return {
      title: `${title} (${year}) - Watch Free 1080p HD | MovieLab`,
      description: description,
      keywords: keywords.join(", "),
      openGraph: {
        title: `${title} (${year}) - Watch Free Online (1080p) | MovieLab`,
        description: description,
        url: `https://movies.umairlab.com/movie/${slug}`,
        siteName: "MovieLab",
        images: [
          {
            url: `https://image.tmdb.org/t/p/w1280${backdrop}`,
            width: 1280,
            height: 720,
            alt: `Watch ${title} Full Movie`,
          },
          {
            url: `https://image.tmdb.org/t/p/w500${data.poster_path}`,
            width: 500,
            height: 750,
            alt: `${title} Movie Poster`,
          },
        ],
        type: isTV ? "video.tv_show" : "video.movie",
        locale: "en_US",
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} (${year}) - Watch Free 1080p | MovieLab`,
        description: description,
        images: [`https://image.tmdb.org/t/p/w1280${backdrop}`],
      },
      alternates: {
        canonical: `https://movies.umairlab.com/movie/${slug}`,
      },
    };
  } catch (error) {
    return {
      title: "Movie Details | MovieLab",
      description: "Watch movies and TV shows online for free on MovieLab.",
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
    data = await getTMDBData(
      mediaType,
      id,
      "videos,credits,keywords,release_dates,external_ids,watch/providers",
    );
  } catch (error) {
    console.error("Error fetching content in server component:", error);
  }

  // Schema Markup (JSON-LD)
  const schemaData = {
    "@context": "https://schema.org",
    "@type": isTV ? "TVSeries" : "Movie",
    name: data?.title || data?.name,
    image: data?.poster_path
      ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
      : "",
    description: data?.overview,
    datePublished: data?.release_date || data?.first_air_date,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: data?.vote_average || 0,
      bestRating: "10",
      ratingCount: data?.vote_count || 0,
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <MovieContent
        initialData={data}
        slug={slug}
        id={id}
        mediaType={mediaType}
      />
    </>
  );
}
