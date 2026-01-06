"use client";
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Share2 } from "lucide-react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import ShareModal from "../../components/ShareModal";
import NoticeModal from "../../components/NoticeModal";

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
  const [loading, setLoading] = useState(!initialData);

  // Recommendations / Sidebar State
  const [recommendations, setRecommendations] = useState([]);
  const [recPage, setRecPage] = useState(1);
  const [hasMoreRecs, setHasMoreRecs] = useState(true);
  const [loadingMoreRecs, setLoadingMoreRecs] = useState(false);
  const [isFallbackMode, setIsFallbackMode] = useState(false); // If true, we fetch Popular movies instead of Recs
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);

  const recObserverRef = useRef();

  const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
  const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;

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
        setLoading(false);
      } else {
        try {
          setLoading(true);
          const res = await axios.get(
            `${BASE_URL}/${mediaType}/${id}?api_key=${API_KEY}&append_to_response=videos,credits`
          );
          setMovie(res.data);
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

      const endpoint = isFallbackMode
        ? `${BASE_URL}/${mediaType}/popular?api_key=${API_KEY}&page=${pageNum}`
        : `${BASE_URL}/${mediaType}/${id}/recommendations?api_key=${API_KEY}&page=${pageNum}`;

      const res = await axios.get(endpoint);
      const newItems = res.data.results;

      if (newItems.length === 0) {
        if (!isFallbackMode) {
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
          (k) => title.includes(k) || overview.includes(k)
        );
        return (
          !item.adult && !hasUnsafe && item.id.toString() !== id.toString()
        );
      });

      setRecommendations((prev) =>
        pageNum === 1 && !isFallbackMode
          ? safeResults
          : [...prev, ...safeResults]
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
  }, [recPage, isFallbackMode, id, mediaType]);

  useEffect(() => {
    if (loadingMoreRecs || !hasMoreRecs) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setRecPage((prev) => prev + 1);
      },
      { threshold: 0.1 }
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

  if (loading) {
    return (
      <main className="w-full min-h-screen bg-black text-white">
        <Navbar />
        <div className="flex flex-col lg:flex-row gap-6 px-4 lg:px-[5vw] md:py-[8vw] py-[40vw] animate-pulse">
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
      <div className="flex flex-col lg:flex-row gap-6 px-4 lg:px-[5vw] md:py-[8vw] py-[40vw]">
        <div className="flex-1">
          <div className="w-full aspect-video bg-gray-900 rounded-xl overflow-hidden mb-4 relative group">
            {trailer ? (
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=0`}
                title="Trailer"
                frameBorder="0"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800">
                <img
                  src={`https://image.tmdb.org/t/p/original${movie?.backdrop_path}`}
                  className="absolute inset-0 w-full h-full object-cover opacity-30"
                  alt={movie?.title}
                />
                <p className="relative z-10 font-medium">
                  Trailer not available
                </p>
                <p className="relative z-10 font-medium text-center">
                  Check back later
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 justify-between flex-wrap md:gap-0 py-[2vw] md:pr-[1vw]">
            <h1 className="text-xl lg:text-2xl w-full md:w-[60%] font-bold font-comfortaa">
              {movie?.title || movie?.name}{" "}
              <span className="text-gray-400">
                ~ {mediaType === "tv" ? "Series Trailer" : "Movie Trailer"}
              </span>
            </h1>
            <div className="flex flex-nowrap items-center gap-3 lg:gap-[1vw]">
              <Link
                href={`/watch/${createSlug(
                  movie?.title || movie?.name,
                  movie?.id,
                  mediaType
                )}`}
                className="bg-primary text-black font-extrabold px-4 py-2 text-sm md:px-[1vw] md:py-[0.7vw] rounded-full font-comfortaa transition"
              >
                Watch Now
              </Link>
              <button
                onClick={() => setIsNoticeModalOpen(true)}
                className="border-2 border-primary text-white px-4 py-2 text-sm md:px-[1vw] md:py-[0.7vw] rounded-full font-comfortaa transition"
              >
                Download Now
              </button>
            </div>
          </div>

          <div className="flex font-poppins flex-wrap items-center justify-between gap-4 mb-6 pt-10 md:py-[2vw]">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="md:font-semibold text-lg font-poppins md:text-xl">
                  {movie?.production_companies?.[0]?.name || "Official Studio"}
                </h3>
                <p className="text-xs text-gray-400">
                  {movie?.vote_count?.toLocaleString()} votes ~ IMDB
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pr-[1vw]">
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="bg-zinc-800 p-2 rounded-full hover:bg-zinc-700 transition"
              >
                <Share2 size={16} />
              </button>
            </div>
          </div>

          <div className="bg rounded-xl md:mb-[2vw] mb-10">
            <div className="flex gap-3 text-sm font-bold mb-2">
              <span>{movie?.release_date}</span>
            </div>
            <p className="md:text-lg font-poppins text-sm w-full md:w-3/4 text-gray-400 leading-relaxed">
              {movie?.overview}
            </p>
          </div>
        </div>

        <div className="w-full lg:w-[25vw] flex flex-col gap-4">
          <h3 className="text-lg font-bold mb-1">
            {isFallbackMode ? "Trending Content" : "Related Movies"}
          </h3>
          <div className="flex flex-col gap-4">
            {recommendations.map((item, index) => (
              <Link
                key={`${item.id}-${index}`}
                href={`/movie/${createSlug(
                  item.title || item.name,
                  item.id,
                  mediaType
                )}`}
                className="flex gap-3 group cursor-pointer"
              >
                <div className="relative w-40 lg:w-[12vw] aspect-video rounded-lg overflow-hidden shrink-0 bg-zinc-800">
                  <img
                    src={`https://image.tmdb.org/t/p/w300${
                      item.backdrop_path || item.poster_path
                    }`}
                    alt={item.title || item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute bottom-1 right-1 bg-black/80 px-1 text-[10px] rounded">
                    4K
                  </div>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <h4 className="text-md font-poppins line-clamp-2 group-hover:text-primary transition">
                    {item.title || item.name}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">
                    {(item.release_date || item.first_air_date)?.split("-")[0]}{" "}
                    • {mediaType === "tv" ? "Series" : "Movie"}
                  </p>
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-[10px] bg-zinc-800 px-1 py-0.5 rounded text-gray-300">
                      ★ {item.vote_average?.toFixed(1)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
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
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={movie?.title}
        url={typeof window !== "undefined" ? window.location.href : ""}
      />
      <NoticeModal
        isOpen={isNoticeModalOpen}
        onClose={() => setIsNoticeModalOpen(false)}
        message="We are still working on this feature. Please check back later!"
      />
    </main>
  );
};

export default MovieContent;
