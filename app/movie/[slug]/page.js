import axios from "axios";
import MovieContent from "./MovieContent";

const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const id = slug?.split("-").pop();
  const isTV = slug?.startsWith("tv-");
  const mediaType = isTV ? "tv" : "movie";

  try {
    const res = await axios.get(
      `${BASE_URL}/${mediaType}/${id}?api_key=${API_KEY}&append_to_response=keywords,credits,external_ids`,
    );
    const data = res.data;
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

    // Construct a longer, SEO-friendly description
    const genreNames = data.genres
      ? data.genres.map((g) => g.name).join(", ")
      : "Movies";
    const prefix = `Watch ${title} (${year}) Full ${mediaType === "tv" ? "Series" : "Movie"} Online Free - `;
    const suffix = ` - Stream ${title} in HD on MovieLab. Discover the best ${genreNames} and more accurately.`;

    let description = `${prefix}${overview}${suffix}`;
    // Ensure description is not too long (Google typically displays ~160 characters, but for meta tag we can go up to 300 safe, providing more context)
    // But user complained about "too short", so we ensure it's robust.
    if (description.length > 300) {
      description = description.substring(0, 297) + "...";
    }

    return {
      title: `${title} (${year}) - Watch Free Online | MovieLab`,
      description: description,
      keywords: keywords.join(", "),
      openGraph: {
        title: `${title} (${year}) - Watch Free Online | MovieLab`,
        description: description,
        url: `https://movies.umairlab.com/movie/${slug}`,
        siteName: "MovieLab",
        images: [
          {
            url: `https://image.tmdb.org/t/p/w1280${backdrop}`,
            width: 1280,
            height: 720,
            alt: title,
          },
          {
            url: `https://image.tmdb.org/t/p/w500${data.poster_path}`,
            width: 500,
            height: 750,
            alt: `${title} Poster`,
          },
        ],
        type: isTV ? "video.tv_show" : "video.movie",
        locale: "en_US",
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} (${year}) - Watch Free Online | MovieLab`,
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
    const res = await axios.get(
      `${BASE_URL}/${mediaType}/${id}?api_key=${API_KEY}&append_to_response=videos,credits`,
    );
    data = res.data;
  } catch (error) {
    console.error("Error fetching content in server component:", error);
  }

  return (
    <MovieContent
      initialData={data}
      slug={slug}
      id={id}
      mediaType={mediaType}
    />
  );
}
