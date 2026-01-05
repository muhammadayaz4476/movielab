"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "@/app/components/Navbar";
import Link from "next/link";

const SearchContent = ({ query }) => {
  const decodedQuery = decodeURIComponent(query);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
  const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!decodedQuery) return;
      try {
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
  }, [decodedQuery]);

  const createSlug = (title, id) => {
    if (!title) return id;
    return `${title
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "")}-${id}`;
  };

  return (
    <main className="w-full min-h-screen bg-black text-white">
      <Navbar />
      <div className="px-4 lg:px-[5vw] md:py-[10vw] py-[40vw]">
        <h1 className="text-2xl lg:text-3xl font-comfortaa font-bold mb-6">
          Results for "<span className="text-primary">{decodedQuery}</span>"
        </h1>
        {loading ? (
          <div className="text-center py-20">Loading...</div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-[1.5vw]">
            {results.map((item) => (
              <Link
                href={`/movie/${createSlug(item.title || item.name, item.id)}`}
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
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-xs font-bold uppercase">
                    {item.media_type}
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
