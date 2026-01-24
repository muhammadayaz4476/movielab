"use client";
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Share2, Plus, Check, PlayIcon, X, MoreVertical, Download, DownloadCloud, DownloadCloudIcon } from "lucide-react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import ShareModal from "../../components/ShareModal";
import NoticeModal from "../../components/NoticeModal";
import { useAuth } from "@/context/AuthContext";

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
  const { toggleWatchLater, watchLater, user } = useAuth();
  const recObserverRef = useRef();

  const [activeMenuId, setActiveMenuId] = useState(null);

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
      <div className="flex flex-col lg:flex-row gap-6 px-0 lg:px-[5vw] md:py-[8vw] py-[40vw]">
        <div className="flex-1">
          <div className="w-full aspect-video bg-gray-900 lg:rounded-xl overflow-hidden mb-4 relative group">
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

          <div className="flex items-center px-2  gap-3 justify-between flex-wrap md:gap-0 py-[2vw] md:pr-[1vw]">
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
                className="bg-primary   text-black font-extrabold lg:px-[1vw] px-2 py-2 lg:py-[0.9vw]   text-sm lg:text-lg  rounded-md lg:rounded-[0.51vw]  font-comfortaa transition"
              > 
                
                Watch Now
              </Link>
              <button
                onClick={() => setIsNoticeModalOpen(true)}
                className="bg-white/10 backdrop-blur-md text-lg text-white lg:px-[1vw] px-2 py-2 lg:py-[0.9vw]   text-sm lg:text-lg rounded-md lg:rounded-[0.51vw] font-bold font-comfortaa flex items-center gap-3 hover:bg-white/20 transition-all group border border-white/10"
              >
                Download
                <DownloadCloudIcon
                  className="group-hover:text-primary size-3 lg:size-[1.3vw] transition-colors"
                />
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

          <div className="bg rounded-xl px-2 md:mb-[2vw] mb-10">
            <div className="flex gap-3 text-sm font-bold mb-2">
              <span>{movie?.release_date}</span>
            </div>
            <p className="md:text-lg font-poppins text-sm w-full md:w-3/4 text-gray-400 leading-relaxed">
              {movie?.overview}
            </p>

            {/* Top Cast Section */}
            {movie?.credits?.cast?.length > 0 && (
              <div className="pt-6 lg:pt-[3vw] w-full md:w-[90%]">
                <h3 className="text-lg font-poppins mb-4 text-white">
                  Top Cast
                </h3>
                <div className="flex overflow-x-auto lg:grid lg:grid-cols-6 gap-4 pb-4 lg:pb-0 scrollbar-hide snap-x">
                  {movie.credits.cast.slice(0, 6).map((actor) => (
                    <Link
                      href={`/search/${encodeURIComponent(actor.name)}`}
                      key={actor.id}
                      className="min-w-[100px] lg:min-w-0 snap-start flex flex-col gap-2 cursor-pointer group"
                    >
                      <div className="w-full aspect-[3/4] bg-zinc-900 rounded-lg overflow-hidden relative">
                        {actor.profile_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w200${actor.profile_path}`}
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
          </div>
        </div>

        <div className="w-full px-2 lg:w-[25vw] flex flex-col gap-4">
          <h3 className="text-lg font-bold mb-1">
            {isFallbackMode ? "Trending Content" : "Related Movies"}
          </h3>
          <div className="flex flex-col gap-4">
            {recommendations.map((rec, index) => {
              const isRecSaved = watchLater.some(
                (item) => item.id === rec.id.toString()
              );
              return (
                <div key={`${rec.id}-${index}`} className="relative group">
                  <Link
                    href={`/watch/${createSlug(
                      rec.title || rec.name,
                      rec.id,
                      mediaType
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
                      <h4 className="text-md lg:text-[0.9vw] leading-normal font-poppins line-clamp-2 group-hover:text-primary transition">
                        {rec.title || rec.name}
                      </h4>
                      <p className="text-xs md:text-[0.7vw] text-zinc-400 mt-1">
                        {
                          (rec.release_date || rec.first_air_date)?.split(
                            "-"
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
