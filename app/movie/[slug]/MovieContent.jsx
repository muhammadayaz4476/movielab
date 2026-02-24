"use client";
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
// Standard img tags used instead of next/image for better reliability with TMDB direct CDN
import dynamic from "next/dynamic";
import Reviews from "@/app/components/Reviews";
import {
  Share2,
  Plus,
  Check,
  PlayIcon,
  X,
  ArrowRight,
  MoreVertical,
  DownloadCloud,
  DownloadCloudIcon,
  Globe,
  Coins,
  TrendingUp,
  Award,
  Users,
  Film,
  Eye,
} from "lucide-react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import { useAuth } from "@/context/AuthContext";

// Dynamic Imports for Modals
const ShareModal = dynamic(() => import("../../components/ShareModal"), {
  ssr: false,
});
const NoticeModal = dynamic(() => import("../../components/NoticeModal"), {
  ssr: false,
});

// --- Skeleton Component for Sidebar ---
const SidebarSkeleton = () => (
  <div className="flex gap-3 animate-pulse">
    <div className="w-40 lg:w-[10vw] aspect-video bg-gray-800 rounded-lg shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-800 rounded w-full" />
      <div className="h-3 bg-gray-800 rounded w-1/2" />
    </div>
  </div>
);

const MovieContent = ({ initialData, slug, id, mediaType = "movie" }) => {
  // Main Movie/TV State
  const [movie, setMovie] = useState(initialData);
  const [trailer, setTrailer] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [loading, setLoading] = useState(!initialData);

  // Recommendations / Sidebar State
  const [recommendations, setRecommendations] = useState([]);
  const [recPage, setRecPage] = useState(1);
  const [hasMoreRecs, setHasMoreRecs] = useState(true);
  const [loadingMoreRecs, setLoadingMoreRecs] = useState(false);
  const [isFallbackMode, setIsFallbackMode] = useState(false); // If true, we fetch Popular movies instead of Recs
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const { toggleWatchLater, watchLater, user } = useAuth();
  const recObserverRef = useRef();

  const [activeMenuId, setActiveMenuId] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
  const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;

  const isSaved = watchLater.some((item) => item.id === id);

  // 1. Trailer Logic
  useEffect(() => {
    if (movie?.videos?.results) {
      const videos = movie.videos.results;
      const trailerData =
        videos.find((v) => v.type === "Trailer" && v.site === "YouTube") ||
        videos[0];
      setTrailer(trailerData);
    }
  }, [movie]);

  // Handle movie change if user navigates via sidebar
  useEffect(() => {
    const fetchMovieData = async () => {
      // If the ID and mediaType match initialData, we don't need to refetch immediately
      if (initialData && initialData.id.toString() === id.toString()) {
        setMovie(initialData);
        console.log(initialData);
        setLoading(false);
      } else {
        try {
          setLoading(true);
          const res = await axios.get(
            `${BASE_URL}/${mediaType}/${id}?api_key=${API_KEY}&append_to_response=videos,credits`,
          );
          setMovie(res.data);
          console.log(res.data);
          setLoading(false);
        } catch (error) {
          console.error("Error fetching content details:", error);
          setLoading(false);
        }
      }
    };

    fetchMovieData();
    setRecommendations([]);
    setRecPage(1);
    setHasMoreRecs(true);
    setIsFallbackMode(false);
  }, [id, initialData, mediaType]);

  // 2. Fetch Sidebar Content (Infinite Scroll)
  const fetchSidebarData = async (pageNum) => {
    if (!id) return;
    try {
      setLoadingMoreRecs(true);
      let endpoint = "";

      const primaryGenreId = movie?.genres?.[0]?.id;
      const primaryStudioId = movie?.production_companies?.[0]?.id;
      const leadingActorId = movie?.credits?.cast?.[0]?.id;
      const firstKeywordId = movie?.keywords?.keywords?.[0]?.id;

      switch (activeTab) {
        case "related":
          endpoint = `${BASE_URL}/${mediaType}/${id}/similar?api_key=${API_KEY}&page=${pageNum}`;
          break;
        case "genre":
          endpoint = `${BASE_URL}/discover/${mediaType}?api_key=${API_KEY}&with_genres=${primaryGenreId}&page=${pageNum}&sort_by=popularity.desc`;
          break;
        case "studio":
          endpoint = `${BASE_URL}/discover/${mediaType}?api_key=${API_KEY}&with_companies=${primaryStudioId}&page=${pageNum}&sort_by=popularity.desc`;
          break;
        case "actor":
          endpoint = `${BASE_URL}/discover/${mediaType}?api_key=${API_KEY}&with_cast=${leadingActorId}&page=${pageNum}&sort_by=popularity.desc`;
          break;
        case "topic":
          endpoint = `${BASE_URL}/discover/${mediaType}?api_key=${API_KEY}&with_keywords=${firstKeywordId}&page=${pageNum}&sort_by=popularity.desc`;
          break;
        default:
          endpoint = isFallbackMode
            ? `${BASE_URL}/${mediaType}/popular?api_key=${API_KEY}&page=${pageNum}`
            : `${BASE_URL}/${mediaType}/${id}/recommendations?api_key=${API_KEY}&page=${pageNum}`;
      }

      const res = await axios.get(endpoint);
      const newItems = res.data.results;

      if (newItems.length === 0) {
        if (activeTab === "all" && !isFallbackMode) {
          setIsFallbackMode(true);
          setRecPage(1);
        } else {
          setHasMoreRecs(false);
        }
        setLoadingMoreRecs(false);
        return;
      }

      const unsafeKeywords = [
        "sexy",
        "erotic",
        "porn",
        "xxx",
        "nude",
        "adult",
        "sex",
        "18+",
      ];
      const safeResults = newItems.filter((item) => {
        const title = (item.title || "").toLowerCase();
        const overview = (item.overview || "").toLowerCase();
        const hasUnsafe = unsafeKeywords.some(
          (k) => title.includes(k) || overview.includes(k),
        );
        return (
          !item.adult && !hasUnsafe && item.id.toString() !== id.toString()
        );
      });

      setRecommendations((prev) =>
        pageNum === 1 && !isFallbackMode
          ? safeResults
          : [...prev, ...safeResults],
      );

      if (res.data.page >= res.data.total_pages) {
        if (!isFallbackMode) setIsFallbackMode(true);
        else setHasMoreRecs(false);
      }

      setLoadingMoreRecs(false);
    } catch (error) {
      console.error("Sidebar Fetch Error:", error);
      setLoadingMoreRecs(false);
    }
  };

  useEffect(() => {
    fetchSidebarData(recPage);
  }, [recPage, isFallbackMode, id, mediaType, activeTab]);

  // Handle Tab Change
  useEffect(() => {
    setRecommendations([]);
    setRecPage(1);
    setHasMoreRecs(true);
    setIsFallbackMode(false);
    fetchSidebarData(1);
  }, [activeTab]);

  // Infinite Scroll Intersection Observer
  useEffect(() => {
    if (loadingMoreRecs || !hasMoreRecs) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setRecPage((prev) => prev + 1);
      },
      { threshold: 0.1 },
    );
    if (recObserverRef.current) observer.observe(recObserverRef.current);
    return () => observer.disconnect();
  }, [loadingMoreRecs, hasMoreRecs]);

  const createSlug = (title, id, type = "movie") => {
    const prefix = type === "tv" ? "tv-" : "";
    return `${prefix}${(title || "")
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "")}-${id}`;
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return "N/A";
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount}`;
  };

  const getCertification = () => {
    const results = movie?.release_dates?.results || [];
    const us = results.find((r) => r.iso_3166_1 === "US");
    return us?.release_dates?.[0]?.certification || "NR";
  };

  const director = movie?.credits?.crew?.find((p) => p.job === "Director");
  const writers = movie?.credits?.crew
    ?.filter((p) => p.job === "Writer" || p.job === "Screenplay")
    ?.slice(0, 2);

  const getDynamicViewerCount = () => {
    if (!id) return "0";
    // We use a combination of popularity and id hash to get a "realistic" but stable number
    const popularityBase = Math.floor((movie?.popularity || 100) * 1.5);
    const hash = id
      .toString()
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    // Some very low or zero to look natural
    if (hash % 15 === 0) return "0";
    if (hash % 20 === 0) return (hash % 50).toString();

    const count = popularityBase + (hash % 500);
    // Limit to reasonable range
    const finalCount = Math.min(Math.max(count, 5), 4500);
    return finalCount.toLocaleString();
  };

  const getUniqueSummary = () => {
    const title = movie?.title || movie?.name;
    const year = movie?.release_date
      ? new Date(movie.release_date).getFullYear()
      : "";
    const genres = movie?.genres
      ?.slice(0, 2)
      .map((g) => g.name)
      .join(" and ");
    const rating = movie?.vote_average?.toFixed(1);

    const summaries = [
      `Experience the thrill of ${title} (${year}), a standout ${genres} masterpiece that has captivated audiences globally. With a solid ${rating}/10 rating, it's a must-watch on MovieLab.`,

      `Dive into the world of ${title}, where ${genres} elements blend perfectly to create an unforgettable cinematic journey. Now streaming in high definition for all MovieLab users.`,

      `Looking for the best ${genres} content? ${title} (${year}) delivers an emotional and visual spectacle that ranks high among recent releases. Explore this gem on our platform today.`,

      `MovieLab Review: ${title} is a brilliant addition to the ${genres} genre, offering deep storytelling and impressive visuals that earned it a ${rating} rating from fans worldwide.`,

      `${title} (${year}) brings together powerful storytelling and engaging ${genres} moments that keep viewers hooked from start to finish. Rated ${rating}/10, it's definitely worth adding to your watchlist.`,

      `If you're a fan of ${genres} movies, ${title} is one film you shouldn't miss. Released in ${year}, it combines emotion, suspense, and stunning visuals into one memorable experience.`,

      `${title} stands out as one of the most talked-about ${genres} films of ${year}. With a strong audience rating of ${rating}, it continues to impress movie lovers worldwide.`,

      `From gripping scenes to unforgettable performances, ${title} (${year}) delivers everything fans expect from a great ${genres} movie. Stream it now on MovieLab.`,

      `${title} offers a refreshing take on the ${genres} genre, blending storytelling and cinematic visuals beautifully. No surprise it holds a ${rating}/10 rating among viewers.`,

      `Released in ${year}, ${title} captures the essence of great ${genres} filmmaking with compelling characters and an engaging storyline that keeps audiences invested.`,

      `Whether you're discovering it for the first time or rewatching a favorite, ${title} remains a strong pick for anyone who enjoys quality ${genres} entertainment.`,

      `${title} (${year}) is a cinematic experience filled with drama, excitement, and memorable moments, making it a standout title in the ${genres} category.`,

      `With its engaging narrative and impressive production quality, ${title} has quickly become a favorite among fans of ${genres} movies worldwide.`,

      `Searching for something exciting to watch tonight? ${title} combines ${genres} storytelling with strong performances, earning its ${rating} rating from audiences.`,
    ];

    // Use a simple hash of the ID to pick a consistent but "unique" summary for each movie
    const hash = id
      .toString()
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return summaries[hash % summaries.length];
  };

  const getExpandedStoryline = () => {
    const genres = movie?.genres?.map((g) => g.name).join(", ");
    const studio = movie?.production_companies?.[0]?.name;
    const tagline = movie?.tagline;
    const year = movie?.release_date
      ? new Date(movie.release_date).getFullYear()
      : "";
    const title = movie?.title || movie?.name;

    let narrative = getUniqueSummary() + " ";
    if (tagline) narrative += `"${tagline}" — `;

    narrative += `This ${year} ${genres} production ${studio ? `from ${studio}` : ""} brings a unique perspective to the screen. `;
    narrative +=
      movie?.overview || "Explore the full details of this title on MovieLab.";

    if (movie?.status === "Planned" || movie?.status === "Post Production") {
      narrative += ` Currently in its ${movie.status.toLowerCase()} phase, anticipation continues to build for its full release.`;
    } else if (movie?.credits?.cast?.length > 0) {
      narrative += ` Featuring a talented cast including ${movie.credits.cast
        .slice(0, 3)
        .map((c) => c.name)
        .join(
          ", ",
        )}, the project delivers a compelling ${mediaType} experience.`;
    }

    return narrative;
  };

  const getWatchProviders = () => {
    const providers = movie?.["watch/providers"]?.results?.US;
    if (!providers) return null;

    const streaming = providers.flatrate || [];
    const renting = providers.buy || providers.rent || [];

    return { streaming, renting };
  };

  const watchProviders = getWatchProviders();

  if (loading) {
    return (
      <main className="w-full min-h-screen bg-black text-white">
        <Navbar />
        <div className="flex flex-col lg:flex-row gap-6 px-2 lg:px-[5vw] md:py-[8vw] py-[40vw] animate-pulse">
          <div className="flex-1">
            <div className="w-full aspect-video bg-gray-900 rounded-xl mb-4" />
            <div className="h-8 bg-gray-900 rounded w-1/2 my-[3vw]" />
          </div>
          <div className="w-full lg:w-[25vw] flex flex-col gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <SidebarSkeleton key={i} />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full min-h-screen bg-black text-white">
      <Navbar />
      <div className="flex flex-col lg:flex-row gap-10 px-0 lg:px-[5vw] md:py-[8vw] py-[160px]">
        <div className="flex-1">
          <div className="w-full aspect-video bg-gray-900 lg:rounded-xl overflow-hidden relative group">
            {trailer && showTrailer ? (
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0&modestbranding=0`}
                title="Trailer"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div
                className="w-full h-full flex flex-col items-center justify-center bg-gray-800 cursor-pointer relative"
                onClick={() => setShowTrailer(true)}
              >
                {movie?.backdrop_path && (
                  <img
                    src={`https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`}
                    srcSet={`https://image.tmdb.org/t/p/w780${movie.backdrop_path} 780w, https://image.tmdb.org/t/p/w1280${movie.backdrop_path} 1280w`}
                    className="absolute inset-0 w-full h-full object-cover opacity-50 transition-opacity group-hover:opacity-70"
                    alt={
                      `Watch ${movie?.title} - ${mediaType === "tv" ? "TV Series" : "Movie"} for free online in hd ` ||
                      "Hero Backdrop"
                    }
                    priority="high"
                  />
                )}

                <div className="relative z-10 flex flex-col items-center gap-4">
                  <div className="bg-primary/80 p-4 rounded-full text-black shadow-2xl scale-100 ease-in-out duration-300 hover:scale-125 transition-transform">
                    <PlayIcon fill="white" className="text-white" size={24} />
                  </div>
                  {/* <p className="font-medium text-lg lg:text-xl drop-shadow-md">
                    Click to Play Trailer
                  </p> */}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col items- px-2  gap-3 justify-between flex-wrap md:gap-0 -[2vw] ">
            <div className="flex pb-[10px] md:pb-[1vw] items-center gap-2 justify-between  my-2 lg:my-[1vw] text-gray-300 text-sm italic bg-zinc-900/20   ">
              <div className="flex text-xs md:text-sm items-center gap-2">
                <Eye className="size-4 text-red-500" />
                <span>
                  {getDynamicViewerCount()} people are exploring this{" "}
                  {mediaType} right now
                </span>
              </div>
              <div className="flex items-center gap-2 ">
                <button
                  title="share"
                  onClick={() => setIsShareModalOpen(true)}
                  className="b p-2 text-primary rounded-full hover:bg-zinc-700 transition"
                >
                  <Share2 size={18} />
                </button>
              </div>
            </div>
            <h1 className="text-2xl lg:text-4xl w-full md:w-[70%] font-bold font-comfortaa leading-tight">
              {movie?.title || movie?.name}{" "}
              <span className="text-gray-500 hidden md:inline text-lg lg:text-2xl mt-1 md:mt-0 font-light">
                {mediaType === "tv" ? "~ Series Trailer" : "~ Movie Trailer"}
              </span>
            </h1>
            <div className="flex flex-nowrap items-center mt-[1vw] gap-3 lg:gap-[1vw]">
              <Link
                href={`/watch/${createSlug(
                  movie?.title || movie?.name,
                  movie?.id,
                  mediaType,
                )}`}
                rel="nofollow"
                className="bg-primary   text-black font-extrabold lg:px-[1vw] px-2 py-2 lg:py-[0.9vw]   text-sm lg:text-lg  rounded-md lg:rounded-[0.51vw]  font-comfortaa transition"
              >
                Watch Now
              </Link>
              <button
                onClick={() => setIsNoticeModalOpen(true)}
                className="bg-white/10 backdrop-blur-md text-lg text-white lg:px-[1vw] px-2 py-2 lg:py-[0.9vw]   text-sm lg:text-lg rounded-md lg:rounded-[0.51vw] font-bold font-comfortaa flex items-center gap-3 hover:bg-white/20 transition-all group border border-white/10"
              >
                Download Now
                <DownloadCloudIcon className="group-hover:text-primary size-3 lg:size-[1.3vw] transition-colors" />
              </button>
              <button
                onClick={() => toggleWatchLater(movie)}
                className="bg-white/10 backdrop-blur-md text-white p-2 lg:p-[0.9vw] rounded-md md:rounded-[0.51vw] font-bold border border-white/10 hover:bg-zinc-700 hover:border-primary/50 transition-all group"
                title={
                  isSaved ? "Remove from Watch Later" : "Add to Watch Later"
                }
              >
                {isSaved ? (
                  <div className="flex items-center gap-2">
                    <div className="bg-primary text-black rounded-full p-0.5">
                      <Check size={20} strokeWidth={3} />
                    </div>
                    <span className="sr-only">Saved</span>
                  </div>
                ) : (
                  <Plus
                    size={24}
                    className="text-zinc-400 group-hover:text-white transition-colors"
                  />
                )}
              </button>
            </div>
          </div>

          <div className="flex font-poppins px-2 flex-wrap items-center justify-between gap-4 mb-6 pt-10 md:py-[2vw]">
            <div className="flex  items-center gap-3">
              <div>
                <h3 className="md:font-medium text-lg font-poppins md:text-xl">
                  {movie?.vote_count?.toLocaleString()} votes ~{" "}
                  <a
                    href="https://www.imdb.com/title/tt0111161/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    IMDB
                  </a>
                </h3>
                <h4 className="text-xs text-gray-400 ">
                  {movie?.production_companies?.[0]?.name || "Official Studio"}
                </h4>
              </div>
            </div>
          </div>

          <div className="b rounded-xl px-2  mt-10 ">
            <div className="mb-5">
              <h2 className="text-sm lg:text-lg  text-black bg-primary px-4 py-2  md:py-3 md:px-6 whit  w-fit font-poppins font-medium mb-[1vw] ">
                {/* <Film className="size-6 text-primary" /> */}
                Storyline & Context :
              </h2>
              <p className="text-sm md:text-xl font-light font-comfortaa w-full md:w-[95%] text-red-50 leading-relaxed italic py-2">
                {getExpandedStoryline()}
              </p>
            </div>

            {/* Where to Watch Section */}
            {watchProviders &&
              (watchProviders.streaming.length > 0 ||
                watchProviders.renting.length > 0) && (
                <div className="mb-10 py-5 bg-zinc-900/30 rounded-xl border border-white/5">
                  <h2 className="text-xl font- pb-1 border-b inline-flex font-poppins mb-5 border-primary/40 items-center text-primary gap-2">
                    <PlayIcon
                      className="size-5 text-primary"
                      fill="currentColor"
                    />
                    Where to Watch
                  </h2>
                  <div className="space-y-6 md:space-y-[1.3vw]">
                    {watchProviders.streaming.length > 0 && (
                      <div>
                        <h4 className="text-xs uppercase font-poppins font-semibold text-zinc-400 mb-3 tracking-widest">
                          Streaming Platforms
                        </h4>
                        <div className="flex flex-wrap gap-6">
                          {watchProviders.streaming.slice(0, 6).map((p) => (
                            <div
                              key={p.provider_id}
                              className="flex flex-col items-center gap-2 group"
                            >
                              <div className="w-12 h-12 relative">
                                <img
                                  src={`https://image.tmdb.org/t/p/w92${p.logo_path}`}
                                  alt={p.provider_name}
                                  className="w-full h-full rounded-xl shadow-lg group-hover:scale-110 transition-transform object-cover"
                                />
                              </div>
                              {/* <span className="text-[10px] text-white group-hover:text-white transition-colors">
                                {p.provider_name}
                              </span> */}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {watchProviders.renting.length > 0 && (
                      <div className="font-poppins">
                        <h4 className="text-xs uppercase font-semibold text-zinc-400 mb-3 tracking-widest">
                          Buy or Rent
                        </h4>
                        <div className="flex flex-wrap gap-6">
                          {watchProviders.renting.slice(0, 6).map((p) => (
                            <div
                              key={p.provider_id}
                              className="flex flex-col items-center gap-2 group"
                            >
                              <div className="w-12 h-12 relative">
                                <img
                                  src={`https://image.tmdb.org/t/p/w92${p.logo_path}`}
                                  alt={p.provider_name}
                                  className="w-full h-full rounded-xl shadow-lg opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all object-cover"
                                />
                              </div>
                              {/* <span className="text-[10px] text-white group-hover:text-white transition-colors">
                                {p.provider_name}
                              </span> */}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Production & Crew Section */}
            <div className="flex flex-wrap gap-[2vw] mt-[2.7vw]  mb-10">
              {director && (
                <div>
                  <h4 className="text-sm uppercase font-bold text-zinc-500 mb-2">
                    Director
                  </h4>
                  <Link
                    href={`/search/${encodeURIComponent(director.name)}`}
                    className="text-lg hover:text-primary transition-colors font-medium font-poppins"
                  >
                    {director.name}
                  </Link>
                </div>
              )}
              {writers?.length > 0 && (
                <div>
                  <h4 className="text-sm uppercase font-bold text-zinc-500 mb-2">
                    Writers
                  </h4>
                  <div className="flex flex-wrap gap-x-4 ">
                    {writers.map((w) => (
                      <Link
                        key={w.id}
                        href={`/search/${encodeURIComponent(w.name)}`}
                        className="text-lg hover:text-primary transition-colors font-medium font-poppins"
                      >
                        {w.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {movie?.keywords?.keywords?.length > 0 && (
              <div className="mb-8">
                <h4 className="text-sm uppercase font-bold text-zinc-500 mb-3">
                  Relevant Tags
                </h4>
                <div className="flex flex-wrap  gap-2 w-full md:w-[70%]">
                  {movie.keywords.keywords.slice(0, 10).map((kw) => (
                    <Link
                      key={kw.id}
                      href={`/search/kw-${kw.id}-${encodeURIComponent(kw.name.replace(/ /g, "-"))}`}
                      className="px-3 py-1  hover:bg-primary bg-white/16 hover:text-black rounded-full text-md transition-all border border-white/5"
                    >
                      #{kw.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Top Cast Section */}
            {movie?.credits?.cast?.length > 0 && (
              <div className="pt-6 lg:pt-[3vw] w-full md:w-[90%]">
                <h2 className="text-lg font-poppins mb-4 text-white">
                  Top Cast
                </h2>
                <div className="flex overflow-x-auto lg:grid lg:grid-cols-6 gap-4 pb-4 lg:pb-0 scrollbar-hide snap-x">
                  {movie.credits.cast.slice(0, 8).map((actor) => (
                    <Link
                      href={`/search/${encodeURIComponent(actor.name)}`}
                      key={actor.id}
                      className="min-w-[100px] lg:min-w-0 snap-start flex flex-col gap-2 cursor-pointer group"
                    >
                      <div className="w-full aspect-[3/4] bg-zinc-900 rounded-lg overflow-hidden relative">
                        {actor.profile_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                            alt={actor.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500 text-xs text-center p-2">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="text-left">
                        <h4 className="text-xs lg:text-[0.9vw] font- text-white font-poppins group-hover:text-primary transition-colors">
                          {actor.name}
                        </h4>
                        <p className="text-[10px] lg:text-[0.7vw] italic text-zinc-400 truncate">
                          @{actor.character}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <div className=" lg: py-12   ">
              <div className="w-full ">
                <Reviews movieId={id} type={movie?.media_type || "movie"} />
              </div>
            </div>

            {/* Internal Linking Clusters (SEO) */}
            <div className="mt-12 pt-8 border-t hidden md:block border-white/5">
              <h2 className="text-xl font-poppins font-medium mb-6 text-primary flex items-center gap-2">
                <TrendingUp size={20} />
                Explore Related Collections
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    name: `Top 10 ${movie?.genres?.[0]?.name || "Featured"} Movies`,
                    slug: `${movie?.genres?.[0]?.name?.toLowerCase() || "popular"}-${movie?.genres?.[0]?.id || ""}`,
                  },
                  {
                    name: `Best of ${movie?.release_date ? new Date(movie.release_date).getFullYear() : "2024"} Cinema`,
                    slug: `new-releases?year=${movie?.release_date ? new Date(movie.release_date).getFullYear() : "2024"}`,
                  },
                  { name: "Global Trending Now", slug: "trending" },
                ].map((cluster, i) => (
                  <Link
                    key={i}
                    href={`/discover/${cluster.slug}`}
                    className="bg-white/10 p-5 shadow-2xl shadow-white/40 rounded-xl border border-white/5 hover:shadow-white/60 transition-all group"
                  >
                    <h3 className="text-2xl font-medium text-white group-hover:text-primary transition-colors">
                      {cluster.name}
                    </h3>
                    <p className="text-sm flex gap-2 items-center  text-gray-400 mt-1  ">
                      Explore Collection <ArrowRight size={16} />
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full px-2 lg:w-[25vw] flex flex-col gap-4">
          <div className="mb-2 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2 pb-2">
              {[
                { id: "all", label: "All" },
                { id: "related", label: "Related" },
                { id: "genre", label: movie?.genres?.[0]?.name || "Genre" },
                {
                  id: "studio",
                  label: movie?.production_companies?.[0]?.name
                    ? "From Studio"
                    : "Studio",
                },
                {
                  id: "actor",
                  label: movie?.credits?.cast?.[0]?.name
                    ? `@${movie.credits.cast[0].name.split(" ")[0]}`
                    : "Actor",
                },
                {
                  id: "topic",
                  label: movie?.keywords?.keywords?.[0]?.name
                    ? `#${movie.keywords.keywords[0].name}`
                    : "Topic",
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-1.5 rounded-full font-poppins text-xs font- whitespace-nowrap transition-all border ${
                    activeTab === tab.id
                      ? "bg-white text-black border-white"
                      : "bg-zinc-900 text-zinc-400 border-white/5 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {recommendations.map((rec, index) => {
              const isRecSaved = watchLater.some(
                (item) => item.id === rec.id.toString(),
              );
              return (
                <div key={`${rec.id}-${index}`} className="relative group">
                  <Link
                    href={`/movie/${createSlug(
                      rec.title || rec.name,
                      rec.id,
                      mediaType,
                    )}`}
                    className="flex gap-3 group"
                  >
                    <div className="relative w-40 lg:w-[10vw] aspect-video rounded-lg overflow-hidden shrink-0 bg-zinc-900">
                      <img
                        src={`https://image.tmdb.org/t/p/w300${
                          rec.backdrop_path || rec.poster_path
                        }`}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        alt={rec.title || rec.name}
                      />
                    </div>
                    <div className="flex flex-col min-w-0 justify-center">
                      <h3 className="text-md lg:text-[0.9vw] leading-normal font-poppins line-clamp-2 group-hover:text-primary transition">
                        {rec.title || rec.name}
                      </h3>
                      <p className="text-xs md:text-[0.7vw] text-zinc-400 mt-1">
                        {
                          (rec.release_date || rec.first_air_date)?.split(
                            "-",
                          )[0]
                        }{" "}
                        • {mediaType === "tv" ? "Series" : "Movie"}
                      </p>
                    </div>
                  </Link>

                  {/* 3-Dots Menu Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === rec.id ? null : rec.id);
                    }}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 z-20"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {/* Dropdown Menu */}
                  {activeMenuId === rec.id && (
                    <div
                      className="absolute top-8 right-2 z-30 bg-zinc-800 border border-white/10 rounded-lg shadow-xl py-1 min-w-[160px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWatchLater(rec);
                          setActiveMenuId(null);
                        }}
                        className="w-full text-left px-2 py-2 text-xs flex items-center gap-2 hover:bg-white/10 transition-colors"
                      >
                        {isRecSaved ? (
                          <>
                            <Check size={14} className="text-primary" />
                            <span>Added to List</span>
                          </>
                        ) : (
                          <>
                            <Plus size={14} />
                            <span>Watch Later</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={recObserverRef} className="py-4">
              {loadingMoreRecs && (
                <div className="flex flex-col gap-4">
                  <SidebarSkeleton />
                  <SidebarSkeleton />
                </div>
              )}
              {!hasMoreRecs && (
                <p className="text-center text-xs text-gray-500 py-4">
                  No more suggestions.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={movie?.title}
        url={typeof window !== "undefined" ? window.location.href : ""}
      />
      <NoticeModal
        isOpen={isNoticeModalOpen}
        onClose={() => setIsNoticeModalOpen(false)}
        title={movie?.title || movie?.name}
        downloadLink={`https://dl.vidsrc.vip/${mediaType === "tv" ? "tv" : "movie"}/${id}${mediaType === "tv" ? "/1/1" : ""}`}
      />
    </main>
  );
};

export default MovieContent;
