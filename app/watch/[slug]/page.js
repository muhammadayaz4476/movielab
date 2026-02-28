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
    // Fetch comprehensive data for better metadata
    const res = await axios.get(
      `${BASE_URL}/${mediaType}/${id}?api_key=${API_KEY}&append_to_response=credits,videos,keywords,release_dates,external_ids`,
    );
    const data = res.data;
    const title = data.title || data.name;
    const overview = data.overview || "";
    const backdrop = data.backdrop_path;
    const poster = data.poster_path;
    const releaseDate = data.release_date || data.first_air_date || "";
    const year = releaseDate ? new Date(releaseDate).getFullYear() : "";
    const voteAverage = data.vote_average || 0;
    const voteCount = data.vote_count || 0;

    // Enhanced keywords generation
    const keywords = new Set();

    // Primary keywords
    if (title) {
      keywords.add(title);
      keywords.add(`${title} ${year}`);
      keywords.add(`watch ${title}`);
      keywords.add(`${title} streaming`);
      keywords.add(`${title} online`);
      keywords.add(`${title} free`);
      keywords.add(`${title} HD`);
      keywords.add(`${title} 1080p`);
      keywords.add(`${title} full ${mediaType}`);
      keywords.add(`${title} live stream`);
    }

    // Genre keywords
    if (data.genres) {
      data.genres.forEach((g) => {
        keywords.add(g.name);
        keywords.add(`${g.name} streaming`);
        keywords.add(`${g.name} online`);
        keywords.add(`${g.name} watch`);
      });
    }

    // Cast keywords (top 3)
    if (data.credits && data.credits.cast) {
      data.credits.cast.slice(0, 3).forEach((actor) => {
        keywords.add(actor.name);
        keywords.add(`${actor.name} movies`);
        keywords.add(`watch ${actor.name}`);
      });
    }

    // Crew keywords (director)
    if (data.credits && data.credits.crew) {
      const director = data.credits.crew.find(
        (person) => person.job === "Director",
      );
      if (director) {
        keywords.add(director.name);
        keywords.add(`${director.name} films`);
        keywords.add(`${director.name} movies`);
      }
    }

    // TMDB keywords
    if (data.keywords) {
      const kws = data.keywords.keywords || data.keywords.results || [];
      kws.forEach((k) => keywords.add(k.name));
    }

    // Year-based keywords
    if (year) {
      keywords.add(`${year} movies`);
      keywords.add(`${year} ${mediaType}s`);
      keywords.add(`watch ${year} movies`);
    }

    // Quality and platform keywords
    keywords.add("watch movies");
    keywords.add("online streaming");
    keywords.add("HD streaming");
    keywords.add("1080p streaming");
    keywords.add("free streaming");
    keywords.add("no ads");
    keywords.add("fast streaming");
    keywords.add("MovieLab");
    keywords.add("live streaming");

    // Enhanced SEO description
    const genreNames = data.genres
      ? data.genres.map((g) => g.name).join(", ")
      : "Entertainment";

    const director = data.credits?.crew?.find(
      (person) => person.job === "Director",
    )?.name;

    const topActors = data.credits?.cast
      ?.slice(0, 3)
      .map((actor) => actor.name)
      .join(", ");

    const prefix = `Watch ${title} (${year})${director ? ` directed by ${director}` : ""} Full ${mediaType === "tv" ? "Series" : "Movie"} Online Live. `;
    const storyBrief = overview ? `${overview.substring(0, 120)}... ` : "";
    const castInfo = topActors ? `Starring ${topActors}. ` : "";
    const genreInfo = `Stream this ${genreNames} ${mediaType === "tv" ? "series" : "film"} with ${voteAverage.toFixed(1)}/10 rating from ${voteCount.toLocaleString()} votes. `;
    const suffix = `Watch ${title} in HD 1080p on MovieLab with zero ads, instant playback, and no registration required.`;

    let description = `${prefix}${storyBrief}${castInfo}${genreInfo}${suffix}`;
    if (description.length > 320) {
      description = description.substring(0, 317) + "...";
    }

    return {
      title: `Watch ${title} (${year}) Full ${mediaType === "tv" ? "Series" : "Movie"} Online Live HD 1080p | MovieLab`,
      description: description,
      keywords: Array.from(keywords).join(", "),
      authors: director ? [director] : [],
      creator: director || "MovieLab",
      publisher: "MovieLab",
      formatDetection: {
        email: false,
        address: false,
        telephone: false,
      },
      metadataBase: new URL("https://movies.umairlab.com"),
      alternates: {
        canonical: `https://movies.umairlab.com/watch/${slug}`,
      },
      openGraph: {
        title: `Watch ${title} (${year}) Full ${mediaType === "tv" ? "Series" : "Movie"} Online Live HD | MovieLab`,
        description: description,
        url: `https://movies.umairlab.com/watch/${slug}`,
        siteName: "MovieLab",
        images: [
          {
            url: `https://image.tmdb.org/t/p/original${backdrop}`,
            width: 1920,
            height: 1080,
            alt: `Watch ${title} Full Movie Live Stream`,
          },
          {
            url: `https://image.tmdb.org/t/p/w500${poster}`,
            width: 500,
            height: 750,
            alt: `${title} Movie Poster`,
          },
        ],
        type: isTV ? "video.episode" : "video.movie",
        locale: "en_US",
        countryName: "United States",
        videos: data.videos?.results?.find(
          (v) => v.type === "Trailer" && v.site === "YouTube",
        )
          ? [
              {
                url: `https://www.youtube.com/watch?v=${data.videos.results.find((v) => v.type === "Trailer" && v.site === "YouTube").key}`,
                type: "text/html",
                name: `${title} Official Trailer`,
                description: `Watch the official trailer for ${title}`,
                uploadDate: data.release_date || data.first_air_date,
              },
            ]
          : [],
      },
      twitter: {
        card: "summary_large_image",
        title: `Watch ${title} (${year}) Full ${mediaType === "tv" ? "Series" : "Movie"} Online Live HD | MovieLab`,
        description: description,
        images: [`https://image.tmdb.org/t/p/original${backdrop}`],
        creator: "@MovieLab",
        site: "@MovieLab",
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },
      verification: {
        google: "your-google-verification-code",
        yandex: "your-yandex-verification-code",
      },
    };
  } catch (error) {
    return {
      title: "Watch Movie | MovieLab - Watch Movies Online Free",
      description:
        "Watch movies and TV shows online for free on MovieLab. Stream in HD quality with no ads and instant playback.",
      robots: {
        index: true,
        follow: true,
      },
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
      `${BASE_URL}/${mediaType}/${id}?api_key=${API_KEY}&append_to_response=credits,videos,keywords,release_dates,external_ids`,
    );
    data = res.data;
  } catch (error) {
    console.error("Error fetching content for watch page:", error);
  }

  // Enhanced Schema Markup (JSON-LD) for watch page
  const director = data?.credits?.crew?.find(
    (person) => person.job === "Director",
  );
  const topActors = data?.credits?.cast?.slice(0, 5);
  const productionCompany = data?.production_companies?.[0];
  const trailer = data?.videos?.results?.find(
    (v) => v.type === "Trailer" && v.site === "YouTube",
  );

  const schemaData = {
    "@context": "https://schema.org",
    "@type": isTV ? "TVSeries" : "Movie",
    name: data?.title || data?.name,
    alternateName: data?.original_title || data?.original_name,
    image: [
      data?.poster_path
        ? `https://image.tmdb.org/t/p/w500${data.poster_path}`
        : "",
      data?.backdrop_path
        ? `https://image.tmdb.org/t/p/original${data.backdrop_path}`
        : "",
    ].filter(Boolean),
    description: data?.overview,
    datePublished: data?.release_date || data?.first_air_date,
    dateCreated: data?.release_date || data?.first_air_date,
    inLanguage: data?.original_language || "en",
    genre: data?.genres?.map((g) => g.name) || [],
    keywords: data?.keywords?.keywords?.map((k) => k.name)?.join(", ") || "",
    contentRating: data?.adult ? "R" : "PG-13",
    duration: isTV ? undefined : `PT${data?.runtime || 0}M`,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: data?.vote_average || 0,
      bestRating: "10",
      worstRating: "0",
      ratingCount: data?.vote_count || 0,
      reviewingOrganization: {
        "@type": "Organization",
        name: "TMDB",
      },
    },
    director: director
      ? {
          "@type": "Person",
          name: director.name,
          sameAs: director.profile_path
            ? `https://image.tmdb.org/t/p/w185${director.profile_path}`
            : undefined,
        }
      : undefined,
    actor: topActors?.map((actor) => ({
      "@type": "Person",
      name: actor.name,
      role: {
        "@type": "PerformanceRole",
        characterName: actor.character,
      },
    })),
    productionCompany: productionCompany
      ? {
          "@type": "Organization",
          name: productionCompany.name,
        }
      : undefined,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "MovieLab",
        url: "https://movies.umairlab.com",
      },
      validFrom: data?.release_date || data?.first_air_date,
    },
    trailer: trailer
      ? {
          "@type": "VideoObject",
          name: `${data?.title || data?.name} Official Trailer`,
          description: `Watch the official trailer for ${data?.title || data?.name}`,
          thumbnailUrl: `https://img.youtube.com/vi/${trailer.key}/maxresdefault.jpg`,
          embedUrl: `https://www.youtube.com/embed/${trailer.key}`,
          uploadDate: data?.release_date || data?.first_air_date,
        }
      : undefined,
    potentialAction: {
      "@type": "WatchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `https://movies.umairlab.com/watch/${slug}`,
        inLanguage: "en",
        actionPlatform: [
          "https://schema.org/DesktopWebPlatform",
          "https://schema.org/MobileWebPlatform",
        ],
      },
      actionStatus: "ActiveActionStatus",
    },
    broadcastEvent: {
      "@type": "BroadcastEvent",
      isLiveBroadcast: true,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      name: `Watch ${data?.title || data?.name} Live`,
      description: `Live streaming of ${data?.title || data?.name} on MovieLab`,
    },
  };

  // Add TV series specific schema
  if (isTV && data?.number_of_seasons) {
    schemaData.numberOfSeasons = data.number_of_seasons;
    schemaData.containsSeason = data.seasons?.slice(0, 3).map((season) => ({
      "@type": "TVSeason",
      name: season.name,
      seasonNumber: season.season_number,
      numberOfEpisodes: season.episode_count,
    }));
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <WatchContent
        initialData={data}
        slug={slug}
        id={id}
        mediaType={mediaType}
      />
    </>
  );
}
