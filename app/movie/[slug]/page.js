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
      "keywords,credits,external_ids,release_dates,watch/providers,videos",
    );

    const title = data.title || data.name;
    const overview = data.overview || "";
    const backdrop = data.backdrop_path;
    const poster = data.poster_path;
    const releaseDate = data.release_date || data.first_air_date || "";
    const year = releaseDate ? new Date(releaseDate).getFullYear() : "";
    const runtime = data.runtime || data.episode_run_time?.[0] || 0;
    const voteAverage = data.vote_average || 0;
    const voteCount = data.vote_count || 0;

    // Enhanced keywords generation
    const keywords = new Set();

    // Primary keywords
    if (title) {
      keywords.add(title);
      keywords.add(`${title} ${year}`);
      keywords.add(`${title} full ${mediaType}`);
      keywords.add(`${title} online`);
      keywords.add(`${title} free`);
      keywords.add(`${title} streaming`);
      keywords.add(`${title} download`);
      keywords.add(`${title} HD`);
      keywords.add(`${title} 1080p`);
      keywords.add(`${title} 4K`);
    }

    // Genre keywords
    if (data.genres) {
      data.genres.forEach((g) => {
        keywords.add(g.name);
        keywords.add(`${g.name} ${mediaType}s`);
        keywords.add(`${g.name} online`);
        keywords.add(`${g.name} free`);
        keywords.add(`${g.name} streaming`);
      });
    }

    // Cast keywords (top 5)
    if (data.credits && data.credits.cast) {
      data.credits.cast.slice(0, 5).forEach((actor) => {
        keywords.add(actor.name);
        keywords.add(`${actor.name} movies`);
        keywords.add(`${actor.name} films`);
      });
    }

    // Crew keywords (director, writer)
    if (data.credits && data.credits.crew) {
      const director = data.credits.crew.find(
        (person) => person.job === "Director",
      );
      const writer = data.credits.crew.find(
        (person) => person.job === "Writer" || person.job === "Screenplay",
      );

      if (director) {
        keywords.add(director.name);
        keywords.add(`${director.name} films`);
        keywords.add(`${director.name} movies`);
      }

      if (writer) {
        keywords.add(writer.name);
        keywords.add(`${writer.name} writer`);
      }
    }

    // Production company keywords
    if (data.production_companies && data.production_companies.length > 0) {
      data.production_companies.slice(0, 3).forEach((company) => {
        keywords.add(company.name);
        keywords.add(`${company.name} movies`);
      });
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
      keywords.add(`movies from ${year}`);
    }

    // Quality and platform keywords
    keywords.add("free movies");
    keywords.add("online streaming");
    keywords.add("HD movies");
    keywords.add("1080p movies");
    keywords.add("4K movies");
    keywords.add("no ads");
    keywords.add("fast streaming");
    keywords.add("MovieLab");

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

    const prefix = `Watch ${title} (${year})${director ? ` directed by ${director}` : ""} Full ${mediaType === "tv" ? "Series" : "Movie"} Online Free. `;
    const storyBrief = overview ? `${overview.substring(0, 120)}... ` : "";
    const castInfo = topActors ? `Starring ${topActors}. ` : "";
    const genreInfo = `A ${genreNames} ${mediaType === "tv" ? "series" : "film"} with ${voteAverage.toFixed(1)}/10 rating from ${voteCount.toLocaleString()} votes. `;
    const suffix = `Stream ${title} in HD 1080p on MovieLab with zero ads, fast buffering, and no registration required. Download ${title} for offline viewing.`;

    let description = `${prefix}${storyBrief}${castInfo}${genreInfo}${suffix}`;
    if (description.length > 320) {
      description = description.substring(0, 317) + "...";
    }

    return {
      title: `${title} (${year}) - Watch Full ${mediaType === "tv" ? "Series" : "Movie"} Online Free HD 1080p | MovieLab`,
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
        canonical: `https://movies.umairlab.com/movie/${slug}`,
      },
      openGraph: {
        title: `${title} (${year}) - Watch Full ${mediaType === "tv" ? "Series" : "Movie"} Online Free HD | MovieLab`,
        description: description,
        url: `https://movies.umairlab.com/movie/${slug}`,
        siteName: "MovieLab",
        images: [
          {
            url: `https://image.tmdb.org/t/p/original${backdrop}`,
            width: 1920,
            height: 1080,
            alt: `Watch ${title} Full Movie HD Backdrop`,
          },
          {
            url: `https://image.tmdb.org/t/p/w500${poster}`,
            width: 500,
            height: 750,
            alt: `${title} Movie Poster`,
          },
        ],
        type: isTV ? "video.tv_show" : "video.movie",
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
        title: `${title} (${year}) - Watch Full ${mediaType === "tv" ? "Series" : "Movie"} Online Free HD | MovieLab`,
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
      title: "Movie Details | MovieLab - Watch Movies Online Free",
      description:
        "Watch movies and TV shows online for free on MovieLab. Stream in HD quality with no ads and fast buffering.",
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
    data = await getTMDBData(
      mediaType,
      id,
      "videos,credits,keywords,release_dates,external_ids,watch/providers,recommendations,similar",
    );
  } catch (error) {
    console.error("Error fetching content in server component:", error);
  }

  // Enhanced Schema Markup (JSON-LD)
  const director = data?.credits?.crew?.find(
    (person) => person.job === "Director",
  );
  const topActors = data?.credits?.cast?.slice(0, 5);
  const productionCompany = data?.production_companies?.[0];
  const trailer = data?.videos?.results?.find(
    (v) => v.type === "Trailer" && v.site === "YouTube",
  );

  // Breadcrumb Schema
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
        name: isTV ? "TV Series" : "Movies",
        item: `https://movies.umairlab.com/discover/${isTV ? "web-series" : "popular"}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: data?.title || data?.name,
        item: `https://movies.umairlab.com/movie/${slug}`,
      },
    ],
  };

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
      availability: "https://schema.org/OnlineOnly",
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
          hasPart: [
            {
              "@type": "Clip",
              name: "Introduction",
              startOffset: 0,
              endOffset: 30,
              url: `https://movies.umairlab.com/movie/${slug}#t=0`,
            },
            {
              "@type": "Clip",
              name: "Main Plot Points",
              startOffset: 30,
              endOffset: 90,
              url: `https://movies.umairlab.com/movie/${slug}#t=30`,
            },
          ],
          potentialAction: {
            "@type": "SeekToAction",
            target: `https://movies.umairlab.com/movie/${slug}#t={seek_to_second_number}`,
            "startOffset-input": "required name=seek_to_second_number",
          },
        }
      : undefined,
    potentialAction: [
      {
        "@type": "WatchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `https://movies.umairlab.com/movie/${slug}`,
          inLanguage: "en",
          actionPlatform: [
            "https://schema.org/DesktopWebPlatform",
            "https://schema.org/MobileWebPlatform",
          ],
        },
        actionStatus: "ActiveActionStatus",
        expectation: "Available to stream now",
      },
    ],
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
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
