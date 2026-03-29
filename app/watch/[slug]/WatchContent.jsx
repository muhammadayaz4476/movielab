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
  Info,
  Layers,
  Play,
  ChevronLeft,
  ChevronRight,
  DownloadCloudIcon,
} from "lucide-react";
import Link from "next/link";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useAuth } from "@/context/AuthContext";
import { trackEvent, G_EVENTS } from "../../utils/analytics";
import Navbar from "../../components/Navbar";
import ShareModal from "../../components/ShareModal";
import NoticeModal from "../../components/NoticeModal";
import TrailerModal from "../../components/TrailerModal";
import Reviews from "../../components/Reviews";
import { motion } from "framer-motion";
import Marquee from "react-fast-marquee";

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

const EpisodePlaylist = ({
  episodes,
  seasons,
  selectedEpisode,
  onEpisodeClick,
  season,
  totalSeasons,
  handleSeasonChange,
  onSeasonChange,
  movieName,
  isLoading,
}) => {
  const activeRef = useRef(null);

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedEpisode, isLoading]);

  const handlePrevSeason = () => {
    if (season > 1) onSeasonChange(season - 1);
  };

  const handleNextSeason = () => {
    if (season < totalSeasons) onSeasonChange(season + 1);
  };

  return (
    <div className="flex flex-col bg-white/10 w-full backdrop-blur-xl rounded-lg  overflow-hidden h-[450px] lg:h-[550px] shadow-2xl">
      {/* Playlist Header */}
      <div className="p-4 bg-black/20 border-b border-white/5 backdrop-blur-md">
        <div className="flex items-center justify-between mb-1">
          <select
            value={season}
            onChange={handleSeasonChange}
            className="bg-white/10  text-sm px-3 py-2 text-zinc-300 rounded px-2 py-1 outline-none border border-white/5 hover:border-primary/30 transition-colors"
          >
            {seasons.map((s) => (
              <option
                key={s.id}
                value={s.season_number}
                className="bg-gray-800 my-2 mx-3"
              >
                Season {s.season_number}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevSeason}
              disabled={season <= 1}
              className="p-1.5 hover:bg-white/10 rounded-full disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-zinc-400 hover:text-primary"
              title="Previous Season"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNextSeason}
              disabled={season >= totalSeasons}
              className="p-1.5 hover:bg-white/10 rounded-full disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-zinc-400 hover:text-primary"
              title="Next Season"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <p className="text-[10px] text-zinc-500 truncate font-poppins uppercase tracking-wider">
          {movieName} • {episodes.length} Episodes
        </p>
      </div>

      {/* Episodes List */}
      <div
        className="flex-1 overflow-y-auto custom-scrollbar p-1.5 smooth-scroll space-y-1 overscroll-contain"
        data-lenis-prevent
      >
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-2 animate-pulse">
                <div className="w-24 aspect-video bg-white/5 rounded-lg" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 bg-white/5 rounded w-full" />
                  <div className="h-2 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))
          : episodes.map((e) => {
              const isActive = selectedEpisode === e.episode_number;
              return (
                <div
                  key={e.id}
                  ref={isActive ? activeRef : null}
                  onClick={() => onEpisodeClick(e.episode_number)}
                  className={`flex gap-3 p-2 rounded-xl cursor-pointer transition-all duration-300 group relative ${
                    isActive ? "bg-primary/5 " : "hover:bg-white/5"
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative w-40 aspect-video rounded-lg overflow-hidden shrink-0 shadow-lg">
                    {e.still_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w300${e.still_path}`}
                        alt={e.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                        <Info size={16} className="text-zinc-600" />
                      </div>
                    )}
                    {isActive ? (
                      <div className="absolute inset-0 bg-black/50  flex items-center justify-center">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-primary ">
                          <Play fill="currentColor" size={12} className="" />
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play
                          fill="white"
                          size={14}
                          className="text-white transform scale-90 group-hover:scale-100 transition-transform"
                        />
                      </div>
                    )}
                    <div className="absolute bottom-1 right-1 bg-gray-600/10 px-1.5 py-0.5 rounded text-xs font-poppins text-white backdrop-blur-sm border border-white/5">
                      EP {e.episode_number}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex flex-col justify-center min-w-0 pr-2">
                    <h4
                      className={`text-md lg:text-[0.9vw font-poppins leading-normal line-clamp-2 transition-colors ${isActive ? "text-primary" : "text-zinc-200 group-hover:text-primary"}`}
                    >
                      {e.name}
                    </h4>
                    <div className="flex items-center justify-between gap-2 mt-[0.3vw]">
                      {e.runtime && (
                        <p className="text-sm  text-gray-200 flex  justify-center items-center gap-[0.2vw]">
                          {/* <Clock size={12} /> */}
                          {e.runtime}m
                        </p>
                      )}
                      {isActive && (
                        <span className="text-xs text-red-300 font-poppins animate-pulse  uppercase">
                          Playing
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
};

const WatchContent = ({ initialData, slug, id, mediaType = "movie" }) => {
  const [movie, setMovie] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [trailer, setTrailer] = useState(null);
  const [isTrailerModalOpen, setIsTrailerModalOpen] = useState(false);

  // Storyline expansion state (controls truncation similar to YouTube description)
  const [storyExpanded, setStoryExpanded] = useState(false);

  // Server Switcher States
  const providers = [
    // replaced original server1 with new vidking service as requested
    { name: "Server 1", value: "https://www.vidking.net", id: "vidking" },
    { name: "Server 2", value: "https://multiembed.mov/", id: "multiembed" },
    { name: "Server 3", value: "https://vidsrc.me/embed", id: "vidsrc_me" },
    { name: "Server 4", value: "https://vidsrc.cc/v2/embed", id: "vidsrc_cc" },
  ];
  const [selectedServer, setSelectedServer] = useState(providers[0]);
  const iframeRef = useRef(null);

  // Server Switcher States

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
            `${BASE_URL}/${mediaType}/${id}?api_key=${API_KEY}&append_to_response=credits,videos,keywords,recommendations,similar`,
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

  // 2. Similarity Scoring Function
  const getSimilarityScore = (item, currentMovie) => {
    let score = 0;
    if (!item || !currentMovie) return 0;

    // 1. Franchise / Collection Priority (Highest)
    if (
      currentMovie.belongs_to_collection &&
      item.belongs_to_collection?.id === currentMovie.belongs_to_collection.id
    ) {
      score += 100;
    }

    // 2. Genre Parity
    const currentGenres = currentMovie.genres?.map((g) => g.id) || [];
    const itemGenres = item.genre_ids || item.genres?.map((g) => g.id) || [];
    const matchingGenres = itemGenres.filter((id) =>
      currentGenres.includes(id),
    );
    score += matchingGenres.length * 20;

    // 3. Keyword / Topic Overlap
    const currentKeywords = (
      currentMovie.keywords?.keywords ||
      currentMovie.keywords?.results ||
      []
    ).map((k) => k.id);
    const itemKeywords = (
      item.keywords?.keywords ||
      item.keywords?.results ||
      []
    ).map((k) => k.id);
    if (currentKeywords.length > 0 && itemKeywords.length > 0) {
      const matchingKeywords = itemKeywords.filter((id) =>
        currentKeywords.includes(id),
      );
      score += Math.min(matchingKeywords.length * 10, 50); // Cap at 5 points
    }

    // 4. Cast Overlap
    const currentCast =
      currentMovie.credits?.cast?.slice(0, 5).map((c) => c.id) || [];
    const itemCast = item.credits?.cast?.slice(0, 5).map((c) => c.id) || [];
    if (currentCast.length > 0 && itemCast.length > 0) {
      const matchingCast = itemCast.filter((id) => currentCast.includes(id));
      score += matchingCast.length * 10;
    }

    // 5. Popularity/Vote Weight
    score += (item.vote_average || 0) * 2;
    score += Math.min((item.popularity || 0) / 100, 10);

    return score;
  };

  // 3. Fetch Sidebar Content (Infinite Scroll)
  const fetchSidebarData = async (pageNum) => {
    if (!id) return;
    try {
      setLoadingMoreRecs(true);
      let endpoint = "";
      let newItems;

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
          // 1. If page 1 and we have recommendations in movie metadata, use them
          if (
            pageNum === 1 &&
            movie?.id?.toString() === id.toString() &&
            movie?.recommendations?.results?.length > 0
          ) {
            newItems = movie.recommendations.results;
            break;
          }

          if (isFallbackMode) {
            // Find movies with same genres and highest popularity
            const genreIds =
              movie?.genres
                ?.slice(0, 2)
                .map((g) => g.id)
                .join(",") || primaryGenreId;
            const keywords =
              movie?.keywords?.keywords || movie?.keywords?.results || [];
            const keywordIds = keywords
              .slice(0, 3)
              .map((k) => k.id)
              .join("|");

            // Use discover with Genre + Keyword OR match
            endpoint = `${BASE_URL}/discover/${mediaType}?api_key=${API_KEY}&with_genres=${genreIds}&with_keywords=${keywordIds}&vote_count.gte=50&page=${pageNum}&sort_by=popularity.desc`;

            // If still no results or first page of fallback, try broader discover
            if (!keywordIds || pageNum > 1) {
              endpoint = `${BASE_URL}/discover/${mediaType}?api_key=${API_KEY}&with_genres=${genreIds}&vote_count.gte=100&page=${pageNum}&sort_by=popularity.desc`;
            }
          } else {
            // Try Recommendations first, then Similar
            endpoint = `${BASE_URL}/${mediaType}/${id}/recommendations?api_key=${API_KEY}&page=${pageNum}`;
          }
      }

      if (!newItems && endpoint) {
        // 1. Fetch from calculated endpoint (discover or recommendations)
        const res = await axios.get(endpoint);
        newItems = res.data.results || [];

        // 2. If Page 1 and movie belongs to a collection, fetch that collection!
        if (
          pageNum === 1 &&
          movie?.belongs_to_collection?.id &&
          activeTab === "all"
        ) {
          try {
            const collectionRes = await axios.get(
              `${BASE_URL}/collection/${movie.belongs_to_collection.id}?api_key=${API_KEY}`,
            );
            if (collectionRes.data?.parts) {
              // Prepend collection parts to newItems so they are guaranteed to be evaluated
              const collectionParts = collectionRes.data.parts.filter(
                (p) => p.id !== parseInt(id),
              );
              newItems = [...collectionParts, ...newItems];
            }
          } catch (e) {
            console.error("Failed to fetch collection for scoring", e);
          }
        }

        // Handle fallback trigger
        if (newItems.length === 0 && activeTab === "all" && !isFallbackMode) {
          setIsFallbackMode(true);
          setRecPage(1);
          setLoadingMoreRecs(false);
          return;
        }
      }

      if (!newItems || newItems.length === 0) {
        setHasMoreRecs(false);
        setLoadingMoreRecs(false);
        return;
      }

      const unsafeKeywords = [];
      const scoredResults = newItems.map((item) => ({
        ...item,
        _similarityScore: getSimilarityScore(item, movie),
      }));

      const safeResults = scoredResults
        .filter((item) => {
          const title = (item.title || "").toLowerCase();
          const hasUnsafe = unsafeKeywords.some((k) => title.includes(k));
          return (
            !item.adult && !hasUnsafe && item.id.toString() !== id.toString()
          );
        })
        .sort((a, b) => b._similarityScore - a._similarityScore);

      // Deduplicate results
      const uniqueResultsMap = new Map();
      safeResults.forEach((item) => {
        if (!uniqueResultsMap.has(item.id)) {
          uniqueResultsMap.set(item.id, item);
        }
      });
      const uniqueSafeResults = Array.from(uniqueResultsMap.values());

      setRecommendations((prev) =>
        pageNum === 1 ? uniqueSafeResults : [...prev, ...uniqueSafeResults],
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
  }, [recPage, isFallbackMode, id, mediaType, activeTab, movie?.id]);

  // Handle Tab Change
  useEffect(() => {
    setRecommendations([]);
    setRecPage(1);
    setHasMoreRecs(true);
    setIsFallbackMode(false);
    // fetchSidebarData is triggered by recPage/activeTab/isFallbackMode change
  }, [activeTab, id]);
  // Added id to dependencies to ensure fetch on initial load after id is set

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
    if (server.id === "vidking") {
      // vidking endpoints as provided in instruction
      if (type === "tv") {
        return `${server.value}/embed/tv/${mId}/${sea}/${epi}?color=2eafff&autoPlay=true&nextEpisode=true&episodeSelector=true`;
      }
      return `${server.value}/embed/movie/${mId}?color=2eafff&autoPlay=true`;
    }

    if (server.id === "multiembed") {
      if (type === "tv") {
        return `${server.value}?video_id=${mId}&tmdb=1&s=${sea}&e=${epi}`;
      } else {
        return `${server.value}?video_id=${mId}&tmdb=1`;
      }
    }
    if (type === "tv") {
      // if (server.id === "vidsrc_me")  return `${server.value}/tv/${mId}/${sea}/${epi}`;
      if (server.id === "2embed")
        return `${server.value}/embedtv/${mId}&s=${sea}&e=${epi}`;
      return `${server.value}/tv/${mId}/${sea}/${epi}`;
    } else {
      // if (server.id === "vidsrc_me") return `${server.value}/movie/${mId}`;
      if (server.id === "2embed") return `${server.value}/embed/${mId}`;
      return `${server.value}/movie/${mId}`;
    }
  };

  // Episode Resume Logic
  useEffect(() => {
    if (mediaType === "tv" && id) {
      const savedResume = localStorage.getItem(`movielab_resume_${id}`);
      if (savedResume) {
        try {
          const { season, episode } = JSON.parse(savedResume);
          setSelectedSeason(season);
          setSelectedEpisode(episode);
          fetchEpisodes(season);
        } catch (e) {
          console.error("Error parsing resume state", e);
        }
      }
    }
  }, [id, mediaType]);

  useEffect(() => {
    if (mediaType === "tv" && id && !loading) {
      localStorage.setItem(
        `movielab_resume_${id}`,
        JSON.stringify({ season: selectedSeason, episode: selectedEpisode }),
      );
    }
  }, [id, mediaType, selectedSeason, selectedEpisode, loading]);

  // History Tracking Logic
  useEffect(() => {
    if (movie && id && !loading) {
      const historyItem = {
        id,
        slug,
        title: movie.title || movie.name,
        poster_path: movie.poster_path,
        media_type: mediaType,
        season: mediaType === "tv" ? selectedSeason : null,
        episode: mediaType === "tv" ? selectedEpisode : null,
        watchedAt: new Date().toISOString(),
      };

      try {
        const existingHistory = JSON.parse(
          localStorage.getItem("movielab_history") || "[]",
        );
        // Remove existing entry for this movie/show to avoid duplicates and move to top
        const filteredHistory = existingHistory.filter(
          (item) => item.id !== id,
        );
        const newHistory = [historyItem, ...filteredHistory].slice(0, 50);
        localStorage.setItem("movielab_history", JSON.stringify(newHistory));
      } catch (e) {
        console.error("Error updating history", e);
      }
    }
  }, [id, movie, mediaType, selectedSeason, selectedEpisode, slug, loading]);

  const createSlug = (title, id, type = "movie") => {
    const prefix = type === "tv" ? "tv-" : "";
    return `${prefix}${(title || "")
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "")}-${id}`;
  };

  const createPersonSlug = (name, id) => {
    if (!name || !id) return "";
    return `${name
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "")}-${id}`;
  };

  const getUniqueSummary = () => {
    const title = movie?.title || movie?.name;
    const year =
      movie?.release_date || movie?.first_air_date
        ? new Date(movie.release_date || movie.first_air_date).getFullYear()
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
    const year =
      movie?.release_date || movie?.first_air_date
        ? new Date(movie.release_date || movie.first_air_date).getFullYear()
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

  if (loading)
    return (
      <main className="w-full min-h-screen bg-black text-white">
        <Navbar />
        <div className="flex flex-col lg:flex-row gap-6 px-2 lg:px-[2vw] md:py-[8vw] py-[40vw] animate-pulse">
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
      {/* <div className="w-full opacity-60   z-[60] font-poppins   py-[0.3vw]  overflow-hidden">
        <Marquee
          speed={10} // Sets the speed (approx. matches the previous 40s animation duration)
          gradient={false} // Assuming you don't need the fade gradient effect
          loop={0} // 0 means infinite loop
        >
          <span className="mx-[10px] lg:mx-[3vw]    text-white/80 md:text-base text-[12px]">
            Please Install the{" "}
            <Link
              href="https://chromewebstore.google.com/detail/adguard-adblocker/bgnkhhnnamicmpeenaelnjfhikgbkllg?hl=en"
              target="_blank"
              className=" text-primary underline font-semibold"
            >
              AdGuard browser extension
            </Link>{" "}
            {""}
            or mobile app to block intrusive ads and popups
          </span>
          <span className=" mx-[10px] lg:mx-[3vw]    text-secondary md:text-base text-[12px]">
            | Movies lab |
          </span>
          <span className="mx-[10px] lg:mx-[3vw]   text-white/80 md:text-base text-[12px]">
            Please Install the{" "}
            <Link
              href="https://chromewebstore.google.com/detail/adguard-adblocker/bgnkhhnnamicmpeenaelnjfhikgbkllg?hl=en"
              target="_blank"
              className=" text-primary underline font-semibold"
            >
              AdGuard browser extension
            </Link>{" "}
            {""}
            or mobile app to block intrusive ads and popups
          </span>
          <span className=" mx-[10px] lg:mx-[3vw]    text-secondary md:text-base text-[12px]">
            | Movies lab |
          </span>

          <span className="mx-[10px] lg:mx-[3vw]   text-white/80 md:text-base text-[12px]">
            Please Install the{" "}
            <Link
              href="https://chromewebstore.google.com/detail/adguard-adblocker/bgnkhhnnamicmpeenaelnjfhikgbkllg?hl=en"
              target="_blank"
              className=" text-primary underline font-semibold"
            >
              AdGuard browser extension
            </Link>{" "}
            {""}
            or mobile app to block intrusive ads and popups
          </span>
          <span className=" mx-[10px] lg:mx-[3vw]    text-secondary md:text-base text-[12px]">
            | Movies lab |
          </span>
        </Marquee>
      </div> */}

      <div className="relative z-10 ">
        <Navbar />
        <div className="flex flex-col lg:flex-row gap-10 justify-center lg:px-[2vw] md:py-[8vw] py-[160px]">
          <div className="flex-1 md:pb-0 pb-10">
            {/* Main Player */}
            <div className="w-full aspect-video bg-black lg:rounded-xl overflow-hidden mb-4 border border-zinc-800 relative group">
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
            </div>

            {/* Server Switcher */}
            <div className="flex flex-wrap  font-poppins    items-center gap-2 mb-4">
              {/* <span className="text-xs uppercase font-bold text-gray-500 mr-2">
                Servers:
              </span> */}
              {providers.map((provider) => (
                <button
                  key={provider.name}
                  onClick={() => setSelectedServer(provider)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition ${
                    selectedServer.name === provider.name
                      ? "bg-primary text-black"
                      : "bg-white/15 text-gray-300 hover:bg-zinc-700"
                  }`}
                >
                  {provider.name}
                </button>
              ))}
            </div>

            {/* User Note */}
            {/* User Note */}
            <div className="bg-white/10 backdrop-blur-sm  lg:w-fit  w-[98%]  px-2  font-poppins text-[12px] lg:text-xs  text-gray-300 py-2 px-2 rounded-lg   border border-white/5">
              {/* <span className="text-white font- mr-1">Note:</span> */}
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

            <div className="flex flex-col   pt-[2vh] lg:pt-[1vw]   px-2  gap-6 relative z-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between ">
                <div className="flex items-start justify-between w-full">
                  <div>
                    <h1 className="text-2xl md:text-4xl font-bold font-comfortaa text-white mb-4">
                      {mediaType === "movie"
                        ? movie.title
                        : movie.name +
                          ` (S${selectedSeason} E${selectedEpisode})`}
                    </h1>
                    {mediaType === "tv" && (
                      <div className="lg:hidden block mb-[2vh] w-full mx-auto">
                        <EpisodePlaylist
                          seasons={seasons}
                          episodes={episodes}
                          handleSeasonChange={handleSeasonChange}
                          selectedEpisode={selectedEpisode}
                          onEpisodeClick={setSelectedEpisode}
                          season={selectedSeason}
                          totalSeasons={seasons.length}
                          onSeasonChange={setSelectedSeason}
                          movieName={movie?.name}
                          isLoading={loadingTV}
                        />
                      </div>
                    )}
                    <div className="flex flex-nowrap  items-center md:mt-[4vw] gap-3 lg:gap-[1vw]">
                      <Link
                        href={`/movie/${createSlug(
                          movie?.title || movie?.name,
                          movie?.id,
                          mediaType,
                        )}`}
                        rel="nofollow"
                        className="bg-primary   text-black font-extrabold lg:px-[1vw] px-2 py-2 lg:py-[0.9vw]   text-sm lg:text-lg  rounded-md lg:rounded-[0.51vw]  font-comfortaa transition"
                      >
                        Watch Trailer
                      </Link>
                      <button
                        onClick={() => {
                          setIsNoticeModalOpen(true);
                          trackEvent(G_EVENTS.DOWNLOAD_NOW, {
                            event_category: "conversion",
                            event_label: movie?.title || movie?.name,
                          });
                        }}
                        className="bg-white/10 backdrop-blur-md text-lg text-white lg:px-[1vw] px-2 py-2 lg:py-[0.9vw]   text-sm lg:text-lg rounded-md lg:rounded-[0.51vw] font-bold font-comfortaa flex items-center gap-3 hover:bg-white/20 transition-all group border border-white/10"
                      >
                        Download Now
                        <DownloadCloudIcon className="group-hover:text-primary size-3 lg:size-[1.3vw] transition-colors" />
                      </button>
                      <button
                        onClick={() => toggleWatchLater(movie)}
                        className="bg-white/10 backdrop-blur-md text-white p-2 lg:p-[0.9vw] rounded-md md:rounded-[0.51vw] font-bold border border-white/10 hover:bg-zinc-700 hover:border-primary/50 transition-all group"
                        title={
                          isSaved
                            ? "Remove from Watch Later"
                            : "Add to Watch Later"
                        }
                      >
                        {isSaved ? (
                          <div className="flex items-center gap-2">
                            <div className="bg-primary text-black rounded-full p-0.5">
                              <Check size={20} strokeWidth={3} />
                            </div>
                            {/* <span className="font-comfortaa capitalize">
                      More Like This
                    </span> */}
                          </div>
                        ) : (
                          <Plus
                            size={24}
                            className="text-zinc-400 group-hover:text-white transition-colors"
                          />
                        )}
                      </button>
                    </div>
                    {/* Watch Later Button (Mobile/Desktop) */}
                  </div>
                  {/* 
                  <button
                    onClick={() => setIsShareModalOpen(true)}
                    className="bg-zinc-900 p-2 rounded-full hover:bg-zinc-800 transition md:hidden"
                  >
                    <Share2 size={18} />
                  </button> */}
                </div>

                {/* <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="bg-zinc-900 p-2 rounded-full hover:bg-zinc-800 transition hidden md:block"
                >
                  <Share2 size={18} />
                </button> */}
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
                <motion.div
                  layout
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className=" relative w-full md:w-[95%] bg-white/10  backdrop-blur-md rounded-xl  p-[1vw]"
                >
                  {(() => {
                    const words = getExpandedStoryline().split(" ");
                    const PREVIEW_LIMIT = 25; // Approximate words that fit in 3 lines
                    const previewText = words.slice(0, PREVIEW_LIMIT).join(" ");
                    const remainingWords = words.slice(PREVIEW_LIMIT);

                    return (
                      <p
                        className={`text-sm md:text-xl font-light p-2  font-poppins w-full overflow-hidden text-red-50 leading-relaxed transition-all ${storyExpanded ? "" : "h-[100px] md:h-[90px]"}`}
                      >
                        <span>{previewText} </span>
                        <motion.span
                          initial="hidden"
                          animate={storyExpanded ? "visible" : "hidden"}
                          variants={{
                            visible: {
                              transition: {
                                staggerChildren: 0.04,
                              },
                            },
                          }}
                        >
                          {remainingWords.map((word, i) => (
                            <motion.span
                              key={i}
                              variants={{
                                hidden: {
                                  opacity: 0,
                                  y: 10,
                                  filter: "blur(10px)",
                                },
                                visible: {
                                  opacity: 1,
                                  y: 0,
                                  filter: "blur(0px)",
                                  transition: { duration: 1, ease: "easeOut" },
                                },
                              }}
                              className="inline-block mr-1.5"
                            >
                              {word}
                            </motion.span>
                          ))}
                        </motion.span>
                      </p>
                    );
                  })()}

                  {/* gradient fade shown only when collapsed */}
                  {!storyExpanded && (
                    <div className="absolute  hidden  bottom-0 left-0 rounded-2xl  w-full h-3/4 md:h-1/2 pointer-events-none bg-gradient-to-b from-transparent to-white/50" />
                  )}
                  {getExpandedStoryline().length > 200 && (
                    <button
                      onClick={() => setStoryExpanded((prev) => !prev)}
                      className="text-primary    absolute -bottom-5  md:bottom-2 right-1/2 translate-x-1/4 text-sm md:text-sm mt-1 font-poppins"
                    >
                      {storyExpanded ? "" : "Read more"}
                    </button>
                  )}
                </motion.div>

                {/* Top Cast Section */}
                {movie?.credits?.cast?.length > 0 && (
                  <div className="pt-6 lg:pt-[3vw] mt-[4vh] w-full md:w-[90%]">
                    <h2 className="text-lg   font-poppins mb-4 text-white">
                      Top Cast
                    </h2>
                    <div className="flex overflow-x-auto lg:grid lg:grid-cols-6 gap-4 pb-4 lg:pb-0 scrollbar-hide snap-x">
                      {movie.credits.cast.slice(0, 8).map((actor) => (
                        <Link
                          href={`/actor/${createPersonSlug(actor.name, actor.id)}`}
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

          <div className="w-full  px-2  lg:w-[30vw] flex flex-col gap-6">
            {/* Playlist Sidebar for TV */}
            {mediaType === "tv" && (
              <div className="lg:block hidden mb-[1vw]">
                <EpisodePlaylist
                  seasons={seasons}
                  episodes={episodes}
                  handleSeasonChange={handleSeasonChange}
                  selectedEpisode={selectedEpisode}
                  onEpisodeClick={setSelectedEpisode}
                  season={selectedSeason}
                  totalSeasons={seasons.length}
                  onSeasonChange={setSelectedSeason}
                  movieName={movie?.name}
                  isLoading={loadingTV}
                />
              </div>
            )}

            <div className="mb-2 overflow-x-auto scrollbar-hide scroll-smooth">
              <div className="flex items-center gap-2 pb-2 scroll-smooth">
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
                    className={`px-4 py-1.5 rounded-full font-poppins text-sm  font-medium whitespace-nowrap transition-all border ${
                      activeTab === tab.id
                        ? "bg-white text-black border-white"
                        : "bg-white/10 backdrop-blur-md  text-zinc-400 border-white/5 hover:border-white/20 hover:text-white"
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
