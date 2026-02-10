"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import Image from "next/image";
import { Plus, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const MovieRow = ({ title, fetchURL, viewAllLink, movies: propMovies }) => {
  const [movies, setMovies] = useState(propMovies || []);
  const [loading, setLoading] = useState(!propMovies);
  const { watchLater, toggleWatchLater } = useAuth();

  useEffect(() => {
    if (propMovies) {
      setMovies(propMovies);
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const request = await axios.get(fetchURL);
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
        const safeResults = request.data.results.filter((item) => {
          const title = (item.title || item.name || "").toLowerCase();
          const overview = (item.overview || "").toLowerCase();
          const isAdult = item.adult;
          const hasUnsafeKeyword = unsafeKeywords.some(
            (keyword) => title.includes(keyword) || overview.includes(keyword),
          );
          return !isAdult && !hasUnsafeKeyword;
        });
        setMovies(safeResults);
        // console.log(safeResults);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching movies:", error);
        setLoading(false);
      }
    }
    fetchData();
  }, [fetchURL, propMovies]);

  const createSlug = (title, id, type = "movie") => {
    if (!title) return id;
    const prefix = type === "tv" ? "tv-" : "";
    return `${prefix}${title.toLowerCase().replace(/[^\w-]+/g, "")}-${id}`;
  };

  return (
    <div className="px-4 lg:px-[5vw] py-8">
      <div className="flex items-center justify-between mb-4 lg:mb-[1vw]">
        <h2 className="text-xl lg:text-3xl font-comfortaa font-bold text-white">
          {title}
        </h2>
        <Link
          href={viewAllLink || "/"}
          className="text-sm lg:text-base bg-container hover:bg-white/10 text-gray-300 px-4 py-2 rounded-lg transition-colors cursor-pointer"
        >
          View All
        </Link>
      </div>

      <div className="flex items-start gap-4 lg:gap-[1.5vw] overflow-x-auto pb-4 scrollbar-hide scroll-smooth">
        {loading
          ? Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="w-[45vw] lg:w-[16vw] shrink-0 animate-pulse"
              >
                <div className="relative w-full aspect-3/4 rounded-lg overflow-hidden bg-gray-800 mb-3 lg:mb-[0.8vw]">
                  <div className="w-full h-full bg-gradient-to-b from-gray-700 to-gray-800" />
                  <div className="absolute top-2 right-2 w-10 h-5 bg-gray-700 rounded-full" />
                </div>

                <div className="space-y-2">
                  <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                </div>
              </div>
            ))
          : movies.map((movie) => {
              const isSaved = watchLater.some(
                (item) => item.id === movie.id.toString(),
              );
              return (
                <Link
                  href={`/movie/${createSlug(
                    movie.title || movie.name,
                    movie.id,
                    movie.media_type || (movie.first_air_date ? "tv" : "movie"),
                  )}`}
                  key={movie.id}
                  className="w-[45vw] lg:w-[16vw] group cursor-pointer shrink-0"
                >
                  {/* Image Container */}
                  <div className="relative w-full aspect-3/4 rounded-lg overflow-hidden group">
                    {movie.poster_path ? (
                      <Image
                        fill
                        className="object-cover transform lg:group-hover:scale-105 transition-transform duration-300"
                        src={`https://image.tmdb.org/t/p/w500/${
                          movie.poster_path || movie.backdrop_path
                        }`}
                        alt={`${movie.title || movie.name} poster`}
                        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 16vw"
                        quality={80}
                        priority={false}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-800">
                        No Image
                      </div>
                    )}

                    {/* Badge Overlay */}
                    <div className="absolute top-2 right-2 font-poppins lg:top-[0.8vw] lg:right-[0.8vw]">
                      <div className="px-2 py-0.5 lg:px-[0.6vw] lg:py-[0.2vw] flex items-center justify-center bg-primary rounded-full backdrop-blur-sm bg-opacity-90">
                        <span className="text-[8px] italic lg:text-[0.5vw]  font-semibold text-black uppercase  font-poppins">
                          {movie.media_type === "tv" || movie.first_air_date
                            ? "Series"
                            : "HD"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Content Infio */}
                  <div className="space-y-1 font-poppins lg:space-y-[0.3vw] lg:mt-[0.5vw]">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base lg:text-xl font-medium text-white line-clamp-1 flex-1">
                        {movie.title || movie.name}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleWatchLater(movie);
                        }}
                        className="text-white hover:text-primary transition-colors p-1"
                      >
                        {isSaved ? (
                          <Check size={18} className="text-primary" />
                        ) : (
                          <Plus size={18} />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <p className="text-xs lg:text-sm text-primary">
                        {movie.release_date || movie.first_air_date}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
      </div>
    </div>
  );
};

export default MovieRow;
