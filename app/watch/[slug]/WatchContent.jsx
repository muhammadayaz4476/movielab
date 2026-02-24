"use client";
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Share2,
  Check,
  Plus,
  MoreVertical,
  Clock,
  Calendar,
  Star,
  Info,
  DownloadCloudIcon,
} from "lucide-react";
import Link from "next/link";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useAuth } from "@/context/AuthContext";
import Navbar from "../../components/Navbar";
import ShareModal from "../../components/ShareModal";
import NoticeModal from "../../components/NoticeModal";
import TrailerModal from "../../components/TrailerModal";
import Reviews from "../../components/Reviews";
import { motion } from "framer-motion";
import { Play } from "lucide-react";

const SidebarSkeleton = () => (
  <div className="flex gap-3 animate-pulse px-1">
    <div className="w-40 lg:w-[10vw] aspect-video bg-zinc-900 rounded-lg shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-zinc-900 rounded w-full" />
      <div className="h-3 bg-zinc-900 rounded w-1/2" />
    </div>
  </div>
);

const EpisodeCard = ({ episode: e, isActive, onClick }) => (
  <div
    onClick={onClick}
    className={`group relative flex flex-col bg-white/15 rounded-lg  overflow-hidden cursor-pointer transition-all duration-300 border-2 ${
      isActive
        ? "border-primary/50 ring-4 ring-primary/20 scale-[1.02] bg-zinc-900"
        : "border-transparent hover:border-zinc-700 hover:bg-zinc-800"
    }`}
  >
    {/* Thumbnail */}
    <div className="relative aspect-video overflow-hidden">
      {e.still_path ? (
        <img
          src={`https://image.tmdb.org/t/p/w500${e.still_path}`}
          alt={e.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500">
          <Info size={32} className="opacity-20" />
        </div>
      )}

      {/* Episode Tag */}
      {/* <div className="absolute top-3 left-3 px-3 py-1 bg-black/80 backdrop-blur-md rounded-full text-[10px] font-bold text-white border border-white/10">
        Ep {e.episode_number}
      </div> */}

      {/* Play Overlay */}
      <div
        className={`absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? "opacity-100" : ""}`}
      >
        <div className="size-12  bg-primary text-black rounded-full flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
          <Play fill="black" size={18} className="ml-1" />
        </div>
      </div>
    </div>

    {/* Content */}
    <div className="p-4 flex flex-col gap-2">
      <h3
        className={`font-medium text-sm line-clamp-1 transition-colors ${isActive ? "text-primary" : "text-white group-hover:text-primary"}`}
      >
        {e.name}
      </h3>

      <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium">
        <div className="flex items-center gap-3">
          {e.runtime && (
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {e.runtime}m
            </span>
          )}
          {e.air_date && (
            <span className="flex items-center gap-1">
              <Calendar size={10} />
              {new Date(e.air_date).toLocaleDateString()}
            </span>
          )}
        </div>
        {/* {e.vote_average > 0 && (
          <span className="flex items-center gap-1 text-primary">
            <Star size={10} fill="currentColor" />
            {e.vote_average.toFixed(1)}
          </span>
        )} */}
      </div>

      <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
        <span className="text-lg font-poppins text-white transition-colors">
           Episode {e.episode_number}
        </span>
      </div>
    </div>
  </div>
);

const WatchContent = ({ initialData, slug, id, mediaType = "movie" }) => {
  const [movie, setMovie] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [trailer, setTrailer] = useState(null);
  const [isTrailerModalOpen, setIsTrailerModalOpen] = useState(false);

  // Server Switcher States
  const providers = [
    { name: "Server 1", value: "https://vidsrc.to/embed", id: "vidsrc_to" },
    { name: "Server 2", value: "https://multiembed.mov/", id: "multiembed" },
    { name: "Server 3", value: "https://vidsrc.me/embed", id: "vidsrc_me" },
    { name: "Server 4", value: "https://vidsrc.cc/v2/embed", id: "vidsrc_cc" },
  ];
  const [selectedServer, setSelectedServer] = useState(providers[0]);
  const iframeRef = useRef(null);

  // Server Verification State
  const [verifying, setVerifying] = useState(true);
  const [serverError, setServerError] = useState(false);

  // TV Series States
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [loadingTV, setLoadingTV] = useState(false);

  // Sidebar States
  const [recommendations, setRecommendations] = useState([]);
  const [recPage, setRecPage] = useState(1);
  const [hasMoreRecs, setHasMoreRecs] = useState(true);
  const [loadingMoreRecs, setLoadingMoreRecs] = useState(false);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const { toggleWatchLater, watchLater, user } = useAuth();
  const isSaved = watchLater.some((item) => item.id === id);

  const recObserverRef = useRef();

  const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
  const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;

  // 1. Handle movie change
  useEffect(() => {
    const fetchData = async () => {
      if (initialData && initialData.id.toString() === id.toString()) {
        setMovie(initialData);
        setLoading(false);
      } else {
        try {
          setLoading(true);
          const res = await axios.get(
            `${BASE_URL}/${mediaType}/${id}?api_key=${API_KEY}&append_to_response=credits,videos`,
          );
          setMovie(res.data);
          setLoading(false);
        } catch (error) {
          console.error("Error fetching data:", error);
          setLoading(false);
        }
      }
    };

    fetchData();
    setRecommendations([]);
    setRecPage(1);
    setHasMoreRecs(true);
  }, [id, initialData, mediaType]);

  // Extract Trailer
  useEffect(() => {
    if (movie?.videos?.results) {
      const videos = movie.videos.results;
      const trailerData =
        videos.find((v) => v.type === "Trailer" && v.site === "YouTube") ||
        videos[0];
      setTrailer(trailerData);
    }
  }, [movie]);

  // 2. Fetch Season/Episode data for TV shows
  useEffect(() => {
    if (mediaType === "tv" && movie) {
      setSeasons(movie.seasons || []);
      // Auto-fetch episodes for Season 1
      fetchEpisodes(1);
    }
  }, [movie, mediaType]);

  const fetchEpisodes = async (seasonNum) => {
    try {
      setLoadingTV(true);
      const res = await axios.get(
        `${BASE_URL}/tv/${id}/season/${seasonNum}?api_key=${API_KEY}`,
      );
      setEpisodes(res.data.episodes || []);
      setLoadingTV(false);
    } catch (error) {
      console.error("Error fetching episodes:", error);
      setLoadingTV(false);
    }
  };

  const handleSeasonChange = (e) => {
    const s = parseInt(e.target.value);
    setSelectedSeason(s);
    setSelectedEpisode(1);
    fetchEpisodes(s);
  };

  const sliderSettings = {
    dots: false,
    infinite: false,
    speed: 500,
    slidesToShow: 1.2,
    slidesToScroll: 1,
    arrows: false,
    responsive: [
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1.1,
          slidesToScroll: 1,
        },
      },
    ],
  };

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
        default: // 'all' tab
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

      const unsafeKeywords = ["sexy", "porn", "nude", "adult", "sex", "18+"];
      const safeResults = newItems.filter((item) => {
        const title = (item.title || "").toLowerCase();
        const hasUnsafe = unsafeKeywords.some((k) => title.includes(k));
        return (
          !item.adult && !hasUnsafe && item.id.toString() !== id.toString()
        );
      });

      setRecommendations((prev) =>
        pageNum === 1 ? safeResults : [...prev, ...safeResults],
      );

      if (res.data.page >= res.data.total_pages) {
        if (activeTab === "all" && !isFallbackMode) {
          setIsFallbackMode(true);
          setRecPage(1);
        } else {
          setHasMoreRecs(false);
        }
      }

      setLoadingMoreRecs(false);
    } catch (error) {
      console.error("Sidebar fetch error:", error);
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
    if (id) {
      // Only fetch if ID is available
      fetchSidebarData(1);
    }
  }, [activeTab, id]); // Added id to dependencies to ensure fetch on initial load after id is set

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

  // 4. Server Verification Logic
  const constructServerUrl = (server, type, mId, sea, epi) => {
    if (server.id === "multiembed") {
      if (type === "tv") {
        return `${server.value}?video_id=${mId}&tmdb=1&s=${sea}&e=${epi}`;
      } else {
        return `${server.value}?video_id=${mId}&tmdb=1`;
      }
    }
    if (type === "tv") {
      if (server.id === "vidsrc_me")
        return `${server.value}/tv?tmdb=${mId}&sea=${sea}&epi=${epi}`;
      if (server.id === "2embed")
        return `${server.value}/embedtv/${mId}&s=${sea}&e=${epi}`;
      return `${server.value}/tv/${mId}/${sea}/${epi}`;
    } else {
      if (server.id === "vidsrc_me") return `${server.value}/movie?tmdb=${mId}`;
      if (server.id === "2embed") return `${server.value}/embed/${mId}`;
      return `${server.value}/movie/${mId}`;
    }
  };

  useEffect(() => {
    // Run verification only when the video ID or Episode changes
    // Only run if we are definitely ready (have movie data)
    if (!id || (mediaType === "tv" && !episodes.length)) return;

    const findWorkingServer = async () => {
      setVerifying(true);
      setServerError(false);

      for (const provider of providers) {
        const testUrl = constructServerUrl(
          provider,
          mediaType,
          id,
          selectedSeason,
          selectedEpisode,
        );
        try {
          console.log(`Checking ${provider.name}...`);
          const res = await axios.post("/api/verify-server", { url: testUrl });

          if (res.data.working) {
            console.log(`%c ${provider.name} is working!`, "color: green");
            setSelectedServer(provider);
            setVerifying(false);
            return;
          } else {
            console.log(`%c ${provider.name} failed.`, "color: red");
          }
        } catch (error) {
          console.error(`Error verifying ${provider.name}:`, error);
        }
      }

      // If loop finishes, no server worked
      // Fallback to Server 1 (vidsrc.to) or vidsrc.me so user can at least try
      // Cloudflare often blocks API but allows browser, so we shouldn't block user access.
      console.warn("All verifications failed. Falling back to Server 1.");
      setSelectedServer(providers[0]); // Default to Server 1
      setServerError(false); // Do not show error overlay
      setVerifying(false);
    };

    findWorkingServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, mediaType, selectedSeason, selectedEpisode, episodes.length]);

  const createSlug = (title, id, type = "movie") => {
    const prefix = type === "tv" ? "tv-" : "";
    return `${prefix}${(title || "")
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "")}-${id}`;
  };

  if (loading)
    return (
      <main className="w-full min-h-screen bg-black text-white">
        <Navbar />
        <div className="flex flex-col lg:flex-row gap-6 px-2 lg:px-[5vw] md:py-[8vw] py-[40vw] animate-pulse">
          <div className="flex-1">
            <div className="w-full aspect-video bg-zinc-900 rounded-xl mb-4" />
          </div>
          <div className="w-full lg:w-[25vw] flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SidebarSkeleton key={i} />
            ))}
          </div>
        </div>
      </main>
    );

  return (
    <main className="w-full min-h-screen bg-black text-white relative">
      {/* Cinematic Background */}
      {movie?.backdrop_path && (
        <div className="fixed inset-0 z-0">
          <motion.div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-10" />
          <motion.div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black z-10" />
          <motion.img
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
            alt={`Watch ${movie.title || movie.name} (${
              (movie.release_date || movie.first_air_date || "").split("-")[0]
            }) Cinematic Background HD`}
            title={`Watch ${movie.title || movie.name} Full HD`}
            className="w-full h-screen object-cover lg:opacity-100 blur-xs opacity-70  "
          />
        </div>
      )}

      <div className="relative z-10">
        <Navbar />
        <div className="flex flex-col lg:flex-row gap-[4vw] justify-center lg:px-[5vw] md:py-[8vw] py-[160px]">
          <div className="flex-1 md:pb-0 pb-10">
            {/* Main Player */}
            <div className="w-full aspect-video bg-black lg:rounded-xl overflow-hidden mb-4 border border-zinc-800 relative group">
              {verifying ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 z-50">
                  <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                  <p className="text-zinc-400 animate-pulse font-poppins">
                    Finding best server...
                  </p>
                </div>
              ) : serverError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 z-50">
                  <p className="text-red-500 font-bold mb-2">
                    No working servers found.
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-2 py-2 bg-zinc-800 rounded hover:bg-zinc-700 transition"
                  >
                    Try Reloading
                  </button>
                </div>
              ) : (
                <iframe
                  ref={iframeRef}
                  src={constructServerUrl(
                    selectedServer,
                    mediaType,
                    id,
                    selectedSeason,
                    selectedEpisode,
                  )}
                  allow="autoplay; fullscreen"
                  referrerPolicy="origin"
                  className="w-full h-full"
                />
              )}
            </div>

            {/* Server Switcher */}
            <div className="flex flex-wrap  px-2  items-center gap-2 mb-4">
              <span className="text-xs uppercase font-bold text-gray-500 mr-2">
                Servers:
              </span>
              {providers.map((provider) => (
                <button
                  key={provider.name}
                  onClick={() => setSelectedServer(provider)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                    selectedServer.name === provider.name
                      ? "bg-primary text-black"
                      : "bg-zinc-800 text-gray-400 hover:bg-zinc-700"
                  }`}
                >
                  {provider.name}
                </button>
              ))}
            </div>

            {/* User Note */}
            <div className="bg-zinc-900  px-2  font-poppins text-[10px] lg:text-xs text-zinc-400 py-2 px-2 rounded-lg w-fit mb-6 border border-white/5">
              <span className="text-white font- mr-1">Note:</span>
              Try changing <span className="text-primary font-">
                Server
              </span> or{" "}
              <button
                onClick={() => window.location.reload()}
                className="underline text-primary hover:text-white transition-colors"
              >
                Reload
              </button>{" "}
              if not playing.
            </div>

            {/* TV Selectors */}
            {mediaType === "tv" && (
              <div className="flex flex-col  gap-6 mb-10 px-2 lg:px-0">
                <div className="flex items-center flex-wrap justify-between w-full   gap-2  ">
                  <label className="text-lg  font-poppins text-">
                    Season Selection :
                  </label>
                  <select
                    value={selectedSeason}
                    onChange={handleSeasonChange}
                    className="bg-zinc-900 border  w-full md:w-1/2   border-zinc-800 text-white text-sm rounded-md focus:ring-primary focus:border-primary block w-full p-3 outline-none cursor-pointer transition-all hover:border-zinc-700"
                  >
                    {seasons.map((s) => (
                      <option key={s.id} value={s.season_number}>
                        {s.name || `Season ${s.season_number}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg md:text-xl  font-bold font-comfortaa text-white flex items-center gap-2">
                      <div className="w-2 h-8 bg-primary rounded-full" />
                      Episodes List
                      <span className="text-zinc-500 text-sm font-light ml-2">
                        Season {selectedSeason} ({episodes.length} episodes)
                      </span>
                    </h2>
                  </div>

                  {loadingTV ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div
                          key={i}
                          className="aspect-video bg-zinc-900 rounded-2xl animate-pulse"
                        />
                      ))}
                    </div>
                  ) : (
                    <>
                      {/* Mobile Slider */}
                      <div className="sm:hidden -mx-2">
                        <Slider {...sliderSettings}>
                          {episodes.map((e) => (
                            <div key={e.id} className="px-2 pb-4">
                              <EpisodeCard
                                episode={e}
                                isActive={selectedEpisode === e.episode_number}
                                onClick={() =>
                                  setSelectedEpisode(e.episode_number)
                                }
                              />
                            </div>
                          ))}
                        </Slider>
                      </div>

                      {/* Desktop Grid */}
                      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {episodes.map((e) => (
                          <EpisodeCard
                            key={e.id}
                            episode={e}
                            isActive={selectedEpisode === e.episode_number}
                            onClick={() => setSelectedEpisode(e.episode_number)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div className="flex  flex-wrap items-center gap-4 mt-4">
                      <button
                        onClick={() => toggleWatchLater(movie)}
                        className="flex items-center gap-2 text-white transition-colors text-md font-poppins bg-primary/15 px-3 py-4 rounded-lg"
                      >
                        {isSaved ? (
                          <>
                            <div className="bg-primary text-black rounded-full p-0.5">
                              <Check size={14} strokeWidth={3} />
                            </div>
                            <span>Saved</span>
                          </>
                        ) : (
                          <>
                            <Plus size={16} />
                            <span>Watch Later</span>
                          </>
                        )}
                      </button>
                      {trailer && (
                        <button
                          onClick={() => setIsTrailerModalOpen(true)}
                          className="flex items-center gap-2 text-white hover:text-white transition-colors text-md backdrop-blur-sm font-poppins bg-white/10 px-4 cursor-pointer  py-4 rounded-lg  "
                        >
                          <Play size={16} fill="currentColor" />
                          <span>Watch Trailer</span>
                        </button>
                      )}
                      <button
                        onClick={() => setIsNoticeModalOpen(true)}
                        className="flex items-center gap-2 text-black transition-all duration-300 ease-in-out text-md font-poppins bg-primary px-4 cursor-pointer shadow-xl shadow-white/30 hover:shadow-2xl  py-3 rounded-lg border border-white/5 hover:border-primary/50"
                        >
                        <DownloadCloudIcon className="" size={18} />
                        <span>Download <span className="font-bold">EP-{selectedEpisode}</span></span>
                      </button>
                    </div>
              </div>
            )}

            <div className="flex flex-col  pt-[6vw]  px-2  gap-6 relative z-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex items-start justify-between w-full">
                  <div>
                    
                    <h1 className="text-2xl md:text-4xl font-bold font-comfortaa text-white mb-2">
                      {mediaType === "movie"
                        ? movie.title
                        : movie.name +
                          ` (S${selectedSeason} E${selectedEpisode})`}
                    </h1>
                    {/* Watch Later Button (Mobile/Desktop) */}
                    
                  </div>

                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="bg-zinc-900 p-2 rounded-full hover:bg-zinc-800 transition md:hidden"
                  >
                    <Share2 size={18} />
                  </button>
                </div>

                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="bg-zinc-900 p-2 rounded-full hover:bg-zinc-800 transition hidden md:block"
                >
                  <Share2 size={18} />
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="font- text-lg lg:text-xl">
                      {movie?.production_companies?.[0]?.name ||
                        "Official Studio"}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      {movie?.vote_count?.toLocaleString()} votes ~ IMDB
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-[1vw]">
                <p className="text-lg font-poppins mb-1">
                  {movie?.release_date || movie?.first_air_date} •{" "}
                  {mediaType === "tv"
                    ? `${movie?.number_of_seasons} Seasons`
                    : `${movie?.runtime} min`}
                </p>
                <p className="text-sm md:text-lg font-light w-full md:w-[80%] text-zinc-400 leading-relaxed cursor-pointer transition-all">
                  {movie?.overview}
                </p>

                {/* Top Cast Section */}
                {movie?.credits?.cast?.length > 0 && (
                  <div className="pt-6 lg:pt-[3vw] w-full md:w-[90%]">
                    <h2 className="text-lg   font-poppins mb-4 text-white">
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
                <div className=" lg: py-12   ">
                  <div className="w-full ">
                    <Reviews movieId={id} type={movie?.media_type || "movie"} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full  px-2  lg:w-[25vw] flex flex-col gap-4">
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
                      ? `With ${movie.credits.cast[0].name.split(" ")[0]}`
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
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
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
            <div className="flex flex-col gap-3">
              {recommendations.map((rec, index) => {
                const isRecSaved = watchLater.some(
                  (item) => item.id === rec.id.toString(),
                );
                return (
                  <div key={`${rec.id}-${index}`} className="relative group">
                    <Link
                      href={`/watch/${createSlug(
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
                        setActiveMenuId(
                          activeMenuId === rec.id ? null : rec.id,
                        );
                      }}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white lg:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 z-20"
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
                  <div className="space-y-3">
                    <SidebarSkeleton />
                    <SidebarSkeleton />
                  </div>
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
        <TrailerModal
          isOpen={isTrailerModalOpen}
          onClose={() => setIsTrailerModalOpen(false)}
          trailerKey={trailer?.key}
        />
        <NoticeModal
          isOpen={isNoticeModalOpen}
          onClose={() => setIsNoticeModalOpen(false)}
          title={movie?.title || movie?.name}
          downloadLink={
            mediaType === "movie"
              ? `https://dl.vidsrc.vip/movie/${id}`
              : `https://dl.vidsrc.vip/tv/${id}/${selectedSeason}/${selectedEpisode}`
          }
        />
      </div>

      {/* Reviews Section */}
    </main>
  );
};

export default WatchContent;
