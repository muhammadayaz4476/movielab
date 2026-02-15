"use client";
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Navbar from "../../components/Navbar";
import Link from "next/link";

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

const DiscoverContent = ({ slug }) => {
  const decodedSlug = decodeURIComponent(slug);

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filters
  const [mediaType, setMediaType] = useState("movie"); // 'movie' or 'tv'
  const [year, setYear] = useState("");

  const observerRef = useRef();

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

    try {
      let endpoint = "";
      let params = `&page=${pageNum}&sort_by=popularity.desc&include_adult=false&vote_count.gte=10`;

      if (currentYear) {
        if (currentType === "movie")
          params += `&primary_release_year=${currentYear}`;
        if (currentType === "tv")
          params += `&first_air_date_year=${currentYear}`;
      }

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
        if (pageNum === 1) setTitle(capitals[decodedSlug]);
        const langMap = {
          hollywood: "en",
          bollywood: "hi",
          korean: "ko",
          anime: "ja",
          japanese: "ja",
        };
        if (decodedSlug === "anime") {
          endpoint = `${BASE_URL}/discover/${currentType}?api_key=${API_KEY}&with_genres=16&with_original_language=ja${params}`;
        } else if (decodedSlug === "hollywood") {
          endpoint = `${BASE_URL}/discover/${currentType}?api_key=${API_KEY}&with_original_language=en${params}`;
        } else {
          endpoint = `${BASE_URL}/discover/${currentType}?api_key=${API_KEY}&with_original_language=${langMap[decodedSlug]}${params}`;
        }
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
        const categoryTitles = {
          trending: "Trending Today",
          "top-rated": "Top Rated Movies",
          popular: "Popular Now",
          "new-releases": "New Releases",
          "hidden-gems": "Hidden Gems",
          "feel-good": "Feel Good Movies",
          "web-series": "Web Series",
        };
        if (pageNum === 1) setTitle(categoryTitles[decodedSlug]);
        if (decodedSlug === "trending")
          endpoint = `${BASE_URL}/trending/${currentType}/day?api_key=${API_KEY}${params}`;
        else if (decodedSlug === "top-rated")
          endpoint = `${BASE_URL}/${currentType}/top_rated?api_key=${API_KEY}${params}`;
        else if (decodedSlug === "popular")
          endpoint = `${BASE_URL}/${currentType}/popular?api_key=${API_KEY}${params}`;
        else if (decodedSlug === "new-releases")
          endpoint = `${BASE_URL}/discover/${currentType}?api_key=${API_KEY}&primary_release_date.gte=2024-01-01&sort_by=release_date.desc${params}`;
        else if (decodedSlug === "hidden-gems")
          endpoint = `${BASE_URL}/discover/${currentType}?api_key=${API_KEY}&vote_average.gte=7&vote_count.lte=300&sort_by=vote_average.desc${params}`;
        else if (decodedSlug === "feel-good")
          endpoint = `${BASE_URL}/discover/${currentType}?api_key=${API_KEY}&with_genres=35,10749&sort_by=popularity.desc${params}`;
        else if (decodedSlug === "web-series")
          endpoint = `${BASE_URL}/${currentType}/popular?api_key=${API_KEY}${params}`;
      } else {
        const parts = decodedSlug.split("-");
        const id = parts.pop();
        const name = parts.join(" ");
        if (pageNum === 1)
          setTitle(name.charAt(0).toUpperCase() + name.slice(1));
        if (!id || isNaN(id)) {
          setLoading(false);
          return;
        }
        endpoint = `${BASE_URL}/discover/${currentType}?api_key=${API_KEY}&with_genres=${id}${params}`;
      }

      const req = await axios.get(endpoint);
      const unsafeKeywords = [
        "sexy",
        "erotic",
        "porn",
        "xxx",
        "nude",
        "adult",
        "busty",
        "breast",
        "sex",
        "18+",
      ];
      const safeResults = req.data.results.filter((item) => {
        const title = (item.title || item.name || "").toLowerCase();
        const overview = (item.overview || "").toLowerCase();
        const isAdult = item.adult;
        const hasUnsafeKeyword = unsafeKeywords.some(
          (keyword) => title.includes(keyword) || overview.includes(keyword),
        );
        return !isAdult && !hasUnsafeKeyword;
      });

      if (safeResults.length === 0) {
        if (req.data.results.length === 0) setHasMore(false);
      } else {
        setResults((prev) =>
          pageNum === 1 ? safeResults : [...prev, ...safeResults],
        );
      }
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

  useEffect(() => {
    setResults([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    const initialType = decodedSlug === "web-series" ? "tv" : "movie";
    setMediaType(initialType);
    setYear("");
    fetchDiscovery(1, initialType, "");
  }, [decodedSlug]);

  useEffect(() => {
    if (page > 1) fetchDiscovery(page);
  }, [page]);

  useEffect(() => {
    if (loading) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) setPage((prev) => prev + 1);
    });
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [loading, hasMore]);

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
      <div className="px-4 lg:px-[5vw] md:py-[10vw] py-[40vw]">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl lg:text-3xl font-comfortaa font-bold capitalize">
            {title || "Discover"}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-container p-1 rounded-lg flex">
              <button
                onClick={() => handleFilterChange("movie", year)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  mediaType === "movie"
                    ? "bg-primary text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Movies
              </button>
              <button
                onClick={() => handleFilterChange("tv", year)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  mediaType === "tv"
                    ? "bg-primary text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                TV Shows
              </button>
            </div>
            <div className="relative">
              <select
                value={year}
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
                ▼
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-[1.5vw]">
          {results.map((item, index) => (
            <Link
              href={`/movie/${createSlug(
                item.title || item.name,
                item.id,
                mediaType,
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
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    No Image
                  </div>
                )}

                {/* Badge Overlay */}
                <div className="absolute top-2 right-2 lg:top-[0.8vw] lg:right-[0.8vw]">
                  <div className="px-2 py-0.5 lg:px-2 lg:py-1 bg-primary rounded-md backdrop-blur-sm bg-opacity-90">
                    <span className="text-[8px] lg:text-[10px] font-black text-black uppercase tracking-[0.1em] font-poppins">
                      {mediaType === "tv" ? "Series" : "Movie"}
                    </span>
                  </div>
                </div>
              </div>
              <h2 className="font-medium text-white line-clamp-1 group-hover:text-primary transition-colors">
                {item.title || item.name}
              </h2>
              <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
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
          {(loading || hasMore) &&
            Array.from({ length: 4 }).map((_, i) => (
              <div ref={i === 0 ? observerRef : null} key={i}>
                <SkeletonCard />
              </div>
            ))}
        </div>
        {!hasMore && results.length > 0 && (
          <div className="text-center py-10 text-gray-500">
            You've reached the end!
          </div>
        )}
        {!loading && results.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            No results found.
          </div>
        )}
      </div>
    </main>
  );
};

export default DiscoverContent;
