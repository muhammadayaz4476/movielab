"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "@/app/components/Navbar";
import Link from "next/link";

const SearchContent = ({ query }) => {
  const decodedQuery = decodeURIComponent(query);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("");
  const [filteredResults, setFilteredResults] = useState([]);

  const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
  const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;

  useEffect(() => {
    let final = results;
    if (typeFilter !== "all") {
      final = final.filter((item) => item.media_type === typeFilter);
    }
    if (yearFilter) {
      final = final.filter((item) => {
        const date = item.release_date || item.first_air_date;
        return date && date.startsWith(yearFilter);
      });
    }
    setFilteredResults(final);
  }, [results, typeFilter, yearFilter]);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!decodedQuery) return;
      try {
        setLoading(true);
        const req = await axios.get(
          `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${decodedQuery}&include_adult=false`
        );
        const filtered = req.data.results.filter((item) => {
          const isMedia =
            item.media_type === "movie" || item.media_type === "tv";
          const title = (item.title || item.name || "").toLowerCase();
          const overview = (item.overview || "").toLowerCase();
          const isAdult = item.adult;
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
          const hasUnsafeKeyword = unsafeKeywords.some(
            (keyword) => title.includes(keyword) || overview.includes(keyword)
          );
          return isMedia && !isAdult && !hasUnsafeKeyword;
        });
        setResults(filtered);
        setLoading(false);
      } catch (error) {
        console.error("Error searching:", error);
        setLoading(false);
      }
    };
    fetchSearchResults();
  }, [decodedQuery, API_KEY, BASE_URL]);

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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl lg:text-3xl font-comfortaa font-bold">
            Results for "<span className="text-primary">{decodedQuery}</span>"
          </h1>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-zinc-900 p-1 rounded-lg border border-white/5">
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
              {Array.from({ length: 30 }).map((_, i) => {
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

        {loading ? (
          <div className="text-center py-20">Loading...</div>
        ) : filteredResults.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-[1.5vw]">
            {filteredResults.map((item) => (
              <Link
                href={`/movie/${createSlug(
                  item.title || item.name,
                  item.id,
                  item.media_type
                )}`}
                key={item.id}
                className="group cursor-pointer"
              >
                <div className="relative aspect-2/3 rounded-xl overflow-hidden mb-3 lg:rounded-[1vw] bg-container">
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
                  <div className="absolute top-2 right-2 bg-primary px-2 py-0.5 rounded text-[8px] lg:text-[10px] font-black uppercase text-black tracking-[0.1em] font-poppins">
                    {item.media_type === "tv" ? "Series" : "Movie"}
                  </div>
                </div>
                <h3 className="font-medium text-white line-clamp-1 group-hover:text-primary transition-colors">
                  {item.title || item.name}
                </h3>
                <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
                  <span>
                    {item.release_date || item.first_air_date || "N/A"}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">★</span>
                    <span>{item.vote_average?.toFixed(1)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            No results found.
          </div>
        )}
      </div>
    </main>
  );
};

export default SearchContent;
