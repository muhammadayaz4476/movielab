"use client";
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Navbar from "../../components/Navbar";
import Link from "next/link";
import HoverOverlay from "@/app/components/HoverOverlay";
import { useAuth } from "@/context/AuthContext";
import { ChevronDown } from "lucide-react";

// Skeleton Component
const SkeletonCard = () => (
  <div className="animate-pulse">
    <div className="bg-gray-800 rounded-xl mb-3 aspect-2/3"></div>
    <div className="h-4 bg-gray-800 rounded w-3/4 mb-2"></div>
    <div className="flex justify-between">
      <div className="h-3 bg-gray-800 rounded w-1/4"></div>
      <div className="h-3 bg-gray-800 rounded w-1/6"></div>
    </div>
  </div>
);

const DiscoverContent = ({
  slug,
  initialResults = [],
  initialYear = "",
  initialLastPage = 1,
}) => {
  const decodedSlug = decodeURIComponent(slug);

  const [results, setResults] = useState(initialResults);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [page, setPage] = useState(initialLastPage);
  const [hasMore, setHasMore] = useState(initialResults.length >= 10);

  // Filters
  const [mediaType, setMediaType] = useState(
    initialResults[0]?.media_type || (decodedSlug === "web-series" ? "tv" : "all"),
  );
  const [year, setYear] = useState(initialYear);

  const observerRef = useRef();
  const { toggleWatchLater, watchLater } = useAuth();

  const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
  const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;

  // Fetch Logic
  const fetchDiscovery = async (
    pageNum,
    typeOverride = null,
    yearOverride = null,
  ) => {
    if (!decodedSlug) return;

    const currentType = typeOverride || mediaType;
    const currentYear = yearOverride !== null ? yearOverride : year;

    setLoading(true);
    try {
      const getTVGenreId = (movieGenreId) => {
        const mapping = {
          28: 10759, 12: 10759, 878: 10765, 14: 10765, 10752: 10768, 53: 9648
        };
        return mapping[movieGenreId] || movieGenreId;
      };

      const fetchType = async (mType) => {
        const sortBy = mType === "tv" ? "first_air_date.desc" : "primary_release_date.desc";
        const commonFilters = `&include_adult=false&vote_count.gte=10`;
        const yearParam = mType === "tv" ? "first_air_date_year" : "primary_release_year";
        const yearFilter = currentYear ? `&${yearParam}=${currentYear}` : "";
        const baseParams = `&page=${pageNum}&sort_by=${sortBy}${commonFilters}${yearFilter}`;

        let endpoint = "";
        if (["hollywood", "bollywood", "korean", "anime", "japanese"].includes(decodedSlug)) {
          const langMap = { hollywood: "en", bollywood: "hi", korean: "ko", anime: "ja", japanese: "ja" };
          endpoint = `${BASE_URL}/discover/${mType}?api_key=${API_KEY}&with_original_language=${langMap[decodedSlug] || "en"}${baseParams}`;
          if (decodedSlug === "anime") endpoint += "&with_genres=16";
        } else if (["trending", "top-rated", "popular", "new-releases", "hidden-gems", "feel-good", "web-series"].includes(decodedSlug)) {
          endpoint = `${BASE_URL}/discover/${mType}?api_key=${API_KEY}${baseParams}`;
          if (decodedSlug === "trending") endpoint += "&vote_count.gte=100";
          else if (decodedSlug === "top-rated") endpoint += "&vote_average.gte=7.5&vote_count.gte=300";
          else if (decodedSlug === "popular") endpoint += "&vote_count.gte=500";
          else if (decodedSlug === "new-releases") endpoint += "&with_release_type=2|3";
          else if (decodedSlug === "hidden-gems") endpoint += "&vote_average.gte=7&vote_count.lte=300";
          else if (decodedSlug === "feel-good") endpoint += "&with_genres=35,10749";
          else if (decodedSlug === "web-series" && mType === "tv") endpoint += "&with_original_language=hi";
        } else if (decodedSlug.startsWith("actor-")) {
          endpoint = `${BASE_URL}/discover/${mType}?api_key=${API_KEY}&with_cast=${decodedSlug.split("-").pop()}${baseParams}`;
        } else if (decodedSlug.startsWith("country-")) {
          endpoint = `${BASE_URL}/discover/${mType}?api_key=${API_KEY}&with_origin_country=${decodedSlug.split("-").pop().toUpperCase()}${baseParams}`;
        } else {
          let gId = decodedSlug.split("-").pop();
          if (mType === "tv") gId = getTVGenreId(gId);
          endpoint = `${BASE_URL}/discover/${mType}?api_key=${API_KEY}&with_genres=${gId}${baseParams}`;
        }

        try {
          const res = await axios.get(endpoint);
          return { 
            results: (res.data.results || []).map(r => ({ ...r, media_type: mType })),
            total_pages: res.data.total_pages 
          };
        } catch (err) {
          console.error(`Client fetch error for ${mType}:`, err);
          return { results: [], total_pages: 0 };
        }
      };

      let combinedResults = [];
      let totalPages = 0;

      if (currentType === "all") {
        const [movieData, tvData] = await Promise.all([
          fetchType("movie"),
          fetchType("tv")
        ]);
        combinedResults = [...movieData.results, ...tvData.results].sort((a, b) => {
          const dateA = a.release_date || a.first_air_date || "0000-00-00";
          const dateB = b.release_date || b.first_air_date || "0000-00-00";
          return dateB.localeCompare(dateA);
        });
        totalPages = Math.max(movieData.total_pages, tvData.total_pages);
      } else {
        const data = await fetchType(currentType);
        combinedResults = data.results;
        totalPages = data.total_pages;
      }

      const unsafeKeywords = ["sexy", "erotic", "porn", "xxx", "nude", "adult", "busty", "breast", "sex", "18+"];
      const safeBatch = combinedResults.filter((item) => {
        const titleText = (item.title || item.name || "").toLowerCase();
        const overviewText = (item.overview || "").toLowerCase();
        return (
          !item.adult &&
          !unsafeKeywords.some((k) => titleText.includes(k) || overviewText.includes(k))
        );
      });

      setResults((prev) => (pageNum === 1 ? safeBatch : [...prev, ...safeBatch]));
      setHasMore(pageNum < totalPages && combinedResults.length > 0);
      setLoading(false);
    } catch (error) {
      console.error("Error discovering:", error);
      setLoading(false);
    }
  };

  const handleFilterChange = (newType, newYear) => {
    setResults([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    setMediaType(newType);
    setYear(newYear);
    fetchDiscovery(1, newType, newYear);
  };

  // Initialization
  useEffect(() => {
    const initialType = decodedSlug === "web-series" ? "tv" : (initialResults[0]?.media_type || "all");
    setMediaType(initialType);
    setYear(initialYear);

    if (initialResults.length > 0) {
      setResults(initialResults);
      setPage(initialLastPage);
      setLoading(false);
      setHasMore(initialResults.length >= 10);
    } else {
      setResults([]);
      setPage(1);
      setHasMore(true);
      fetchDiscovery(1, initialType, initialYear);
    }
    // console.log(initialResults);
  }, [decodedSlug, initialYear]);

  // Infinite Scroll Effect
  useEffect(() => {
    if (page > 1 && page > initialLastPage) {
      fetchDiscovery(page);
    }
  }, [page]);

  useEffect(() => {
    if (loading || !hasMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setPage((prev) => prev + 1);
    });
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [loading, hasMore]);

  // Title Effect
  useEffect(() => {
    const mediaLabel = mediaType === "all" ? "Movies & TV" : (mediaType === "movie" ? "Movies" : "TV Shows");
    let finalTitle = "";
    if (
      ["hollywood", "bollywood", "korean", "anime", "japanese"].includes(
        decodedSlug,
      )
    ) {
      const capitals = {
        hollywood: "Hollywood",
        bollywood: "Bollywood",
        korean: "Korean",
        anime: "Anime",
        japanese: "Japanese",
      };
      finalTitle = `${capitals[decodedSlug]} ${mediaLabel}`;
    } else if (
      [
        "trending",
        "top-rated",
        "popular",
        "new-releases",
        "hidden-gems",
        "feel-good",
        "web-series",
      ].includes(decodedSlug)
    ) {
      const titles = {
        trending: "Trending",
        "top-rated": "Top Rated",
        popular: "Popular",
        "new-releases": "New Releases",
        "hidden-gems": "Hidden Gems",
        "feel-good": "Feel Good",
        "web-series": "Web Series",
      };
      finalTitle = `${titles[decodedSlug]} ${mediaLabel}`;
    } else if (
      decodedSlug.startsWith("actor-") ||
      decodedSlug.startsWith("country-")
    ) {
      const parts = decodedSlug.split("-");
      const name = parts
        .slice(1, -1)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ");
      finalTitle = `${name} ${mediaType === "tv" ? "Series" : "Productions"}`;
    } else {
      const parts = decodedSlug.split("-");
      const name = parts.slice(0, -1).join(" ");
      finalTitle = `${name.charAt(0).toUpperCase() + name.slice(1)} ${mediaLabel}`;
    }
    setTitle(`${finalTitle}${year ? " in " + year : ""}`);
  }, [decodedSlug, year, mediaType]);

  const createSlug = (title, id, type = "movie") => {
    if (!title) return id;
    const prefix = type === "tv" ? "tv-" : "";
    return `${prefix}${title
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "")}-${id}`;
  };

  const years = Array.from(
    { length: 40 },
    (_, i) => new Date().getFullYear() - i,
  );

  return (
    <main className="w-full min-h-screen bg-black text-white">
      <Navbar />
      <div className="px-4 lg:px-[3vw] md:py-[10vw] py-[40vw]">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl lg:text-3xl font-comfortaa font-bold capitalize">
            {title || "Discover"}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-container p-1 rounded-lg flex">
              <button
                onClick={() => handleFilterChange("all", year)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mediaType === "all" ? "bg-primary text-white" : "text-gray-400 hover:text-white"}`}
              >
                All
              </button>
              <button
                onClick={() => handleFilterChange("movie", year)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mediaType === "movie" ? "bg-primary text-white" : "text-gray-400 hover:text-white"}`}
              >
                Movies
              </button>
              <button
                onClick={() => handleFilterChange("tv", year)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mediaType === "tv" ? "bg-primary text-white" : "text-gray-400 hover:text-white"}`}
              >
                TV Shows
              </button>
            </div>
            <div className="relative">
              <select
                value={year[0]}
                onChange={(e) => handleFilterChange(mediaType, e.target.value)}
                className="appearance-none bg-container text-white text-sm px-4 py-2 pr-8 rounded-lg outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="">All Years</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-[1.5vw]">
          {results.map((item, index) => (
            <Link
              href={`/movie/${createSlug(
                item.title || item.name,
                item.id,
                item.media_type || (mediaType === "all" ? "movie" : mediaType),
              )}`}
              key={`${item.id}-${index}`}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-xl lg:rounded-[1vw] mb-3 aspect-2/3 bg-container">
                {item.poster_path ? (
                  <img
                    className="w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-105"
                    src={`https://image.tmdb.org/t/p/w500/${item.poster_path}`}
                    alt={item.title || item.name}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs text-center p-2 italic bg-gray-900 rounded-xl">
                    No Image Available
                  </div>
                )}

                <HoverOverlay
                createSlug={createSlug}
                mediaType={mediaType}
                  movie={item}
                  isSaved={watchLater.some(
                    (watchItem) => watchItem.id === item.id.toString(),
                  )}
                  toggleWatchLater={toggleWatchLater}
                />

                <div className="absolute top-2 right-2 lg:top-[0.8vw] lg:right-[0.8vw] lg:group-hover:hidden transition-opacity duration-200">
                  <div className="px-2 py-0.5 lg:px-2 flex items-center justify-center lg:py-1 bg-primary rounded-md backdrop-blur-sm bg-opacity-90">
                    <span className="text-xs lg:text-xs font-black text-black uppercase tracking-widest font-poppins">
                      {/* {mediaType === "tv" ? "Series" : "Movie"} */}
                      {item.original_language}
                    </span>
                  </div>
                </div>
              </div>
              <h2 className="font-medium text-white line-clamp-1 group-hover:text-primary transition-colors lg:group-hover:hidden">
                {item.title || item.name}
              </h2>
              <div className="flex items-center justify-between text-xs text-gray-400 mt-1 lg:group-hover:hidden">
                <span>
                  {item.release_date || item.first_air_date
                    ? (item.release_date || item.first_air_date).split("-")[0]
                    : "N/A"}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500">★</span>
                  <span>{item.vote_average?.toFixed(1)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Sentinel for Infinite Scroll */}
        {hasMore && (
          <div ref={observerRef} className="h-10 w-full" aria-hidden="true" />
        )}

        {loading && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-[1.5vw] mt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {!loading && results.length === 0 && (
          <div className="py-20 text-center text-gray-500 italic">
            No content found for this category. try changing filters!
          </div>
        )}
      </div>
    </main>
  );
};

export default DiscoverContent;
