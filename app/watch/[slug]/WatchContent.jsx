"use client";
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Share2, Check, Plus, MoreVertical } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Navbar from "../../components/Navbar";
import ShareModal from "../../components/ShareModal";
import TrailerModal from "../../components/TrailerModal";
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

const WatchContent = ({ initialData, slug, id, mediaType = "movie" }) => {
  const [movie, setMovie] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [trailer, setTrailer] = useState(null);
  const [isTrailerModalOpen, setIsTrailerModalOpen] = useState(false);

  // Server Switcher States
  const providers = [
    { name: "Server 1", value: "https://vidsrc.to/embed", id: "vidsrc_to" },
    { name: "Server 2", value: "https://vidsrc.me/embed", id: "vidsrc_me" },
    { name: "Server 3", value: "https://vidsrc.cc/v2/embed", id: "vidsrc_cc" },
    { name: "Server 4", value: "https://www.2embed.cc/embed", id: "2embed" },
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
  const [fetchStrategy, setFetchStrategy] = useState("recommendations"); // 'recommendations' | 'genre' | 'popular'
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

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
    setFetchStrategy("recommendations");
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

  // 3. Sidebar Fetch Logic
  const fetchSidebarData = async (pageNum) => {
    if (!id) return;
    try {
      setLoadingMoreRecs(true);
      let endpoint = "";

      if (fetchStrategy === "recommendations") {
        endpoint = `${BASE_URL}/${mediaType}/${id}/recommendations?api_key=${API_KEY}&page=${pageNum}`;
      } else if (fetchStrategy === "genre" && movie?.genres?.length > 0) {
        const genreId = movie.genres[0].id;
        endpoint = `${BASE_URL}/discover/${mediaType}?api_key=${API_KEY}&with_genres=${genreId}&sort_by=popularity.desc&page=${pageNum}`;
      } else {
        endpoint = `${BASE_URL}/${mediaType}/popular?api_key=${API_KEY}&page=${pageNum}`;
      }

      const res = await axios.get(endpoint);
      const data = res.data.results;

      if (data.length === 0) {
        if (fetchStrategy === "recommendations") {
          setFetchStrategy("genre");
          setRecPage(1);
        } else if (fetchStrategy === "genre") {
          setFetchStrategy("popular");
          setRecPage(1);
        } else {
          setHasMoreRecs(false);
        }
        setLoadingMoreRecs(false);
        return;
      }

      const unsafeKeywords = ["sexy", "porn", "nude", "adult", "sex", "18+"];
      const safeResults = data.filter((item) => {
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
        if (fetchStrategy === "recommendations") setFetchStrategy("genre");
        else if (fetchStrategy === "genre") setFetchStrategy("popular");
        else setHasMoreRecs(false);
      }

      setLoadingMoreRecs(false);
    } catch (error) {
      console.error("Sidebar fetch error:", error);
      setLoadingMoreRecs(false);
    }
  };

  useEffect(() => {
    fetchSidebarData(recPage);
  }, [recPage, fetchStrategy, movie]);

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
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black z-10" />
          <img
            src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
            alt={`Watch ${movie.title || movie.name} (${
              (movie.release_date || movie.first_air_date || "").split("-")[0]
            }) Cinematic Background HD`}
            title={`Watch ${movie.title || movie.name} Full HD`}
            className="w-full h-full object-cover opacity-70 lg:opacity-100 blur-sm"
          />
        </div>
      )}

      <div className="relative z-10">
        <Navbar />
        <div className="flex flex-col lg:flex-row gap-[4vw] justify-center lg:px-[5vw] md:py-[8vw] py-[40vw]">
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
              <span className="text-white font-bold mr-1">Note:</span>
              Try changing{" "}
              <span className="text-primary font-bold">Server</span> or{" "}
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
              <div className="flex flex-wrap  px-2  items-center gap-4 mb-6">
                <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                  <label className="text-[10px] uppercase font-bold text-gray-500">
                    Season
                  </label>
                  <select
                    value={selectedSeason}
                    onChange={handleSeasonChange}
                    className="bg-zinc-900 border border-zinc-800 text-white text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 outline-none cursor-pointer"
                  >
                    {seasons.map((s) => (
                      <option key={s.id} value={s.season_number}>
                        {s.name || `Season ${s.season_number}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                  <label className="text-[10px] uppercase font-bold text-gray-500">
                    Episode
                  </label>
                  <select
                    value={selectedEpisode}
                    onChange={(e) =>
                      setSelectedEpisode(parseInt(e.target.value))
                    }
                    className="bg-zinc-900 border border-zinc-800 text-white text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 outline-none cursor-pointer"
                    disabled={loadingTV}
                  >
                    {loadingTV ? (
                      <option>Loading...</option>
                    ) : (
                      episodes.map((e) => (
                        <option key={e.id} value={e.episode_number}>
                          Ep {e.episode_number}: {e.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            )}

            <div className="flex flex-col  px-2  gap-6 relative z-10">
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
                    <div className="flex items-center gap-4 mt-2">
                      <button
                        onClick={() => toggleWatchLater(movie)}
                        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-bold bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-white/5 hover:border-primary/50"
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
                          className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-bold bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-white/5 hover:border-primary/50"
                        >
                          <Play size={16} fill="currentColor" />
                          <span>Watch Trailer</span>
                        </button>
                      )}
                    </div>
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
                    <h3 className="text-lg   font-poppins mb-4 text-white">
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
          </div>

          <div className="w-full  px-2  lg:w-[25vw] flex flex-col gap-4">
            <h3 className="text-lg font-semibold font-poppins md:pb-[0.5vw]">
              {fetchStrategy === "recommendations"
                ? "Recommended"
                : fetchStrategy === "genre"
                  ? `More ${movie?.genres?.[0]?.name}`
                  : "Trending Now"}
            </h3>
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
                        <h4 className="text-md lg:text-[0.9vw] leading-normal font-poppins line-clamp-2 group-hover:text-primary transition">
                          {rec.title || rec.name}
                        </h4>
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
      </div>
    </main>
  );
};

export default WatchContent;
