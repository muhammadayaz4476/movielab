"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "@/app/components/Navbar";
import Link from "next/link";
import Footer from "@/app/components/Footer";

// Skeleton Component
const SkeletonCard = () => (
  <div className="animate-pulse">
    <div className="bg-zinc-800 rounded-xl mb-3 aspect-2/3"></div>
    <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2"></div>
    <div className="flex justify-between">
      <div className="h-3 bg-zinc-800 rounded w-1/4"></div>
      <div className="h-3 bg-zinc-800 rounded w-1/6"></div>
    </div>
  </div>
);

const SearchContent = ({ query }) => {
  const decodedQuery = decodeURIComponent(query);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("");
  const [filteredResults, setFilteredResults] = useState([]);
  const [displayQuery, setDisplayQuery] = useState(decodedQuery);
  const [personInfo, setPersonInfo] = useState(null);
  const observerRef = React.useRef(null);

  const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
  const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;

  const fetchSearchResults = async (
    pageNum,
    isInitial = false,
    typeFilterOverride = null,
    yearFilterOverride = null,
  ) => {
    if (!decodedQuery) return;
    const currentTypeFilter =
      typeFilterOverride !== null ? typeFilterOverride : typeFilter;
    const currentYearFilter =
      yearFilterOverride !== null ? yearFilterOverride : yearFilter;

    try {
      if (isInitial) {
        setLoading(true);
        setResults([]);
        setHasMore(true);
        setPersonInfo(null);
      } else {
        setLoadingMore(true);
      }

      let newResults = [];
      let extraCredits = [];

      if (decodedQuery.startsWith("kw-")) {
        const kwId = decodedQuery.split("-")[1];
        let endpoints = [];
        if (currentTypeFilter === "all" || currentTypeFilter === "movie") {
          endpoints.push(
            `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_keywords=${kwId}&include_adult=false&sort_by=popularity.desc&page=${pageNum}${currentYearFilter ? `&primary_release_year=${currentYearFilter}` : ""}`,
          );
        }
        if (currentTypeFilter === "all" || currentTypeFilter === "tv") {
          endpoints.push(
            `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_keywords=${kwId}&include_adult=false&sort_by=popularity.desc&page=${pageNum}${currentYearFilter ? `&first_air_date_year=${currentYearFilter}` : ""}`,
          );
        }

        const responses = await Promise.all(
          endpoints.map((url) => axios.get(url)),
        );

        responses.forEach((res, idx) => {
          const type = endpoints[idx].includes("/movie") ? "movie" : "tv";
          newResults = [
            ...newResults,
            ...(res.data.results || []).map((item) => ({
              ...item,
              media_type: type,
            })),
          ];
          if (res.data.page >= res.data.total_pages) {
            if (
              currentTypeFilter !== "all" ||
              responses.every((r) => r.data.page >= r.data.total_pages)
            ) {
              setHasMore(false);
            }
          }
        });
      } else {
        const res = await axios.get(
          `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${decodedQuery}&include_adult=false&page=${pageNum}`,
        );
        newResults = res.data.results || [];

        if (isInitial && pageNum === 1 && newResults.length > 0) {
          const topResult = newResults[0];
          if (topResult.media_type === "person" && topResult.profile_path) {
            const queryLower = decodedQuery.toLowerCase().trim();
            const nameLower = topResult.name.toLowerCase().trim();

            if (nameLower === queryLower) {
              setPersonInfo(topResult);
              try {
                const creditsRes = await axios.get(
                  `${BASE_URL}/person/${topResult.id}/combined_credits?api_key=${API_KEY}`,
                );
                extraCredits = (creditsRes.data.cast || [])
                  .sort((a, b) => b.popularity - a.popularity)
                  .slice(0, 50);
              } catch (e) {
                console.error("Credits Error:", e);
              }
            }
          }
        }

        if (res.data.page >= res.data.total_pages) setHasMore(false);
      }

      const unsafeKeywords = [
        "sexy",
        "erotic",
        "porn",
        "xxx",
        "nude",
        "breast",
        "sex",
        "18+",
      ];
      const filtered = [...newResults, ...extraCredits].filter((item) => {
        const isMedia = item.media_type === "movie" || item.media_type === "tv";
        const title = (item.title || item.name || "").toLowerCase();
        const overview = (item.overview || "").toLowerCase();
        const hasUnsafe = unsafeKeywords.some(
          (k) => title.includes(k) || overview.includes(k),
        );

        if (!decodedQuery.startsWith("kw-")) {
          if (
            currentTypeFilter !== "all" &&
            item.media_type !== currentTypeFilter
          )
            return false;
          if (currentYearFilter) {
            const date = item.release_date || item.first_air_date;
            if (!date || !date.startsWith(currentYearFilter)) return false;
          }
        }

        return isMedia && !item.adult && !hasUnsafe;
      });

      setResults((prev) => {
        const merged = isInitial ? filtered : [...prev, ...filtered];
        return Array.from(
          new Map(merged.map((i) => [i.id + i.media_type, i])).values(),
        );
      });

      if (filtered.length === 0 && hasMore) {
        setPage((prev) => prev + 1);
      }

      setLoading(false);
      setLoadingMore(false);
    } catch (error) {
      console.error("Search Error:", error);
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchSearchResults(1, true, typeFilter, yearFilter);
    if (decodedQuery.startsWith("kw-")) {
      const kwName = decodedQuery
        .split("-")
        .slice(2)
        .join(" ")
        .replace(/-/g, " ");
      setDisplayQuery(`#${kwName}`);
    } else {
      setDisplayQuery(decodedQuery);
    }
  }, [decodedQuery, typeFilter, yearFilter]);

  useEffect(() => {
    if (page > 1) fetchSearchResults(page);
  }, [page]);

  useEffect(() => {
    if (loading || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 },
    );
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [loading, loadingMore, hasMore, filteredResults.length]);

  useEffect(() => {
    setFilteredResults(
      [...results].sort((a, b) => b.popularity - a.popularity),
    );
  }, [results]);

  const createSlug = (title, id, type = "movie") => {
    if (!title) return id;
    const prefix = type === "tv" ? "tv-" : "";
    return `${prefix}${title
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "")}-${id}`;
  };

  return (
    <main className="w-full min-h-screen bg-black text-white">
      <Navbar />
      <div className="px-4 lg:px-[5vw] md:py-[10vw] py-[40vw]">
        {/* Header & Filter Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h1 className="text-2xl lg:text-3xl font-comfortaa font-bold">
            Results for "<span className="text-primary">{displayQuery}</span>"
          </h1>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-zinc-900 p-1 rounded-lg border border-white/5 flex">
              {["all", "movie", "tv"].map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                    typeFilter === type
                      ? "bg-primary text-black"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {type === "all" ? "All" : type === "movie" ? "Movies" : "TV"}
                </button>
              ))}
            </div>

            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="bg-zinc-900 border border-white/5 text-white text-xs font-bold uppercase px-3 py-2 rounded-lg outline-none cursor-pointer focus:border-primary/50"
            >
              <option value="">Year</option>
              {Array.from({ length: 40 }).map((_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Starring Section (Only for exact person match) */}
        {personInfo && (
          <div className="mb-10 w-full bg-linear-to-r from-zinc-900 to-black border border-white/10 p-6 rounded-2xl flex items-center gap-6">
            <div className="w-20 h-20 md:w-26 md:h-26 shrink-0 rounded-full overflow-hidden relative">
              {personInfo.profile_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w200${personInfo.profile_path}`}
                  alt={personInfo.name}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-lg font-bold text-gray-500">
                  {personInfo.name?.[0]}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold font-comfortaa text-white">
                {personInfo.name}
              </h2>
              <p className="text-zinc-400 text-xs md:text-sm mt-1">
                Found {results.length} titles featuring this actor.
              </p>
            </div>
          </div>
        )}

        {loading || (hasMore && filteredResults.length === 0) ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-[1.5vw]">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredResults.length > 0 ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-[2vw] font-poppins">
              {filteredResults.map((item, index) => (
                <Link
                  href={`/movie/${createSlug(
                    item.title || item.name,
                    item.id,
                    item.media_type,
                  )}`}
                  key={`${item.id}-${item.media_type}-${index}`}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-2/3 rounded-xl overflow-hidden mb-3 lg:rounded-[1vw] bg-container">
                    {item.poster_path ? (
                      <img
                        className="w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-105"
                        src={`https://image.tmdb.org/t/p/w500/${item.poster_path}`}
                        alt={item.title || item.name}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 bg-zinc-900">
                        No Image
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-primary px-2 py-0.5 rounded text-[8px] lg:text-[10px] uppercase text-black font-comfortaa font-bold">
                      {item.media_type === "tv" ? "Series" : "Movie"}
                    </div>
                  </div>
                  <h2 className="font-medium text-white line-clamp-1 group-hover:text-primary transition-colors text-sm lg:text-lg">
                    {item.title || item.name}
                  </h2>
                  <div className="flex items-center justify-between text-[10px] lg:text-sm text-gray-400 mt-1">
                    <span>
                      {item.release_date || item.first_air_date
                        ? (item.release_date || item.first_air_date).split(
                            "-",
                          )[0]
                        : "N/A"}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span>{item.vote_average?.toFixed(1)}</span>
                    </div>
                  </div>
                </Link>
              ))}

              {/* Infinite Scroll Trigger (Skeleton Cards) */}
              {(hasMore || loadingMore) &&
                Array.from({ length: 5 }).map((_, i) => (
                  <div ref={i === 0 ? observerRef : null} key={`skeleton-${i}`}>
                    <SkeletonCard />
                  </div>
                ))}
            </div>

            {/* {loadingMore && (
              <div className="w-full py-10 flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold">
                  Loading Page {page}...
                </p>
              </div>
            )} */}

            {!hasMore && !loadingMore && filteredResults.length > 10 && (
              <>
              <div className="text-center py-20 text-white/80 text-[15px]  font-poppins   uppercase tracking-widest mt-10 border-t border-white/15">
                You've reached the end!
              </div>
              <Footer />
              </>
            )}
          </>
        ) : (
          !loading && (
            <>
            <div className="text-center py-40 text-gray-400 font-comfortaa">
              No results found for your search.
            </div>
              <Footer />

            </>
          )
        )}
      </div>
    </main>
  );
};

export default SearchContent;
