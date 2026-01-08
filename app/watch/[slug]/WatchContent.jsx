"use client";
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Share2 } from "lucide-react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import ShareModal from "../../components/ShareModal";

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

  // Server Switcher States
  const providers = [
    { name: "Server 1", value: "https://vidsrc.to/embed", id: "vidsrc_to" },
    { name: "Server 2", value: "https://vidsrc.me/embed", id: "vidsrc_me" },
    { name: "Server 3", value: "https://vidsrc.cc/v2/embed", id: "vidsrc_cc" },
    { name: "Server 4", value: "https://www.2embed.cc/embed", id: "2embed" },
  ];
  const [selectedServer, setSelectedServer] = useState(providers[2]);

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
            `${BASE_URL}/${mediaType}/${id}?api_key=${API_KEY}&append_to_response=credits`
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
        `${BASE_URL}/tv/${id}/season/${seasonNum}?api_key=${API_KEY}`
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
      const safeResults = data.filter((item) => {
        const title = (item.title || "").toLowerCase();
        const hasUnsafe = unsafeKeywords.some((k) => title.includes(k));
        return (
          !item.adult && !hasUnsafe && item.id.toString() !== id.toString()
        );
      });

      setRecommendations((prev) =>
        pageNum === 1 ? safeResults : [...prev, ...safeResults]
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
      { threshold: 0.1 }
    );
    if (recObserverRef.current) observer.observe(recObserverRef.current);
    return () => observer.disconnect();
  }, [loadingMoreRecs, hasMoreRecs]);

  // 4. Popup Blocker logic
  useEffect(() => {
    const originalOpen = window.open;
    window.open = function (...args) {
      const popup = originalOpen.apply(window, args);
      if (popup) {
        try {
          popup.blur();
          window.focus();
          setTimeout(() => {
            try {
              popup.close();
            } catch (e) {}
          }, 50);
        } catch (e) {}
      }
      return popup;
    };
    const onBlur = () => setTimeout(() => window.focus(), 10);
    window.addEventListener("blur", onBlur);
    return () => {
      window.open = originalOpen;
      window.removeEventListener("blur", onBlur);
    };
  }, []);

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
        <div className="flex flex-col lg:flex-row gap-6 px-4 lg:px-[5vw] md:py-[8vw] py-[40vw] animate-pulse">
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
    <main className="w-full min-h-screen bg-black text-white">
      <Navbar />
      <div className="flex flex-col lg:flex-row gap-[4vw] justify-center px-4 lg:px-[5vw] md:py-[8vw] py-[40vw]">
        <div className="flex-1 md:pb-0 pb-10">
          {/* Main Player */}
          <div className="w-full aspect-video bg-black rounded-xl overflow-hidden mb-4 border border-zinc-800">
            <iframe
              src={
                mediaType === "tv"
                  ? selectedServer.id === "vidsrc_me"
                    ? `${selectedServer.value}/tv?tmdb=${id}&sea=${selectedSeason}&epi=${selectedEpisode}`
                    : selectedServer.id === "2embed"
                    ? `${selectedServer.value}/embedtv/${id}&s=${selectedSeason}&e=${selectedEpisode}`
                    : `${selectedServer.value}/tv/${id}/${selectedSeason}/${selectedEpisode}`
                  : selectedServer.id === "vidsrc_me"
                  ? `${selectedServer.value}/movie?tmdb=${id}`
                  : selectedServer.id === "2embed"
                  ? `${selectedServer.value}/embed/${id}`
                  : `${selectedServer.value}/movie/${id}`
              }
              allow="autoplay; fullscreen"
              referrerPolicy="origin"
              className="w-full h-full"
            />
          </div>

          {/* Server Switcher */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
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
          <div className="bg-zinc-900 font-poppins text-[10px] lg:text-xs text-zinc-400 py-2 px-4 rounded-lg w-fit mb-6 border border-white/5">
            <span className="text-white font-bold mr-1">Note:</span>
            Try changing <span className="text-primary font-bold">
              Server
            </span>{" "}
            or{" "}
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
            <div className="flex flex-wrap items-center gap-4 mb-6">
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
                  onChange={(e) => setSelectedEpisode(parseInt(e.target.value))}
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

          <div className="flex flex-nowrap justify-between items-center ">
            <h1 className="text-xl lg:text-2xl font-comfortaa font-semibold py-4 lg:py-[2vw]">
              {movie?.title || movie?.name}{" "}
              {mediaType === "tv" && `(S${selectedSeason} E${selectedEpisode})`}
            </h1>
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="bg-zinc-900 p-2 rounded-full hover:bg-zinc-800 transition"
            >
              <Share2 size={18} />
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="font- text-lg lg:text-xl">
                  {movie?.production_companies?.[0]?.name || "Official Studio"}
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
          </div>
        </div>

        <div className="w-full lg:w-[25vw] flex flex-col gap-4">
          <h3 className="text-lg font-semibold font-poppins md:pb-[0.5vw]">
            {fetchStrategy === "recommendations"
              ? "Recommended"
              : fetchStrategy === "genre"
              ? `More ${movie?.genres?.[0]?.name}`
              : "Trending Now"}
          </h3>
          <div className="flex flex-col gap-3">
            {recommendations.map((rec, index) => (
              <Link
                key={`${rec.id}-${index}`}
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
                <div className="flex flex-col min-w-0">
                  <h4 className="text-md leading-normal font-poppins line-clamp-2 group-hover:text-primary transition">
                    {rec.title || rec.name}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    {(rec.release_date || rec.first_air_date)?.split("-")[0]} •{" "}
                    {mediaType === "tv" ? "Series" : "Movie"}
                  </p>
                </div>
              </Link>
            ))}
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
    </main>
  );
};

export default WatchContent;
