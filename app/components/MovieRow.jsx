"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
// Using standard img for direct TMDB asset loading & reliability
import { Plus, Check, Play } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const MovieRow = ({
  title,
  fetchURL,
  viewAllLink,
  movies: propMovies,
  isPriority = false,
}) => {
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
                <div className="w-full h-full bg-linear-to-b from-gray-700 to-gray-800" />
                <div className="absolute top-2 right-2 w-10 h-5 bg-gray-700 rounded-full" />
              </div>

              <div className="space-y-2">
                <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                <div className="h-3 bg-gray-800 rounded w-1/2"></div>
              </div>
            </div>
          ))
          : movies.map((movie, index) => {
            const isSaved = watchLater.some(
              (item) => item.id === movie.id.toString(),
            );
            const isHighPriority = isPriority && index < 4;
            return (
              <Link
                href={`/movie/${createSlug(
                  movie.title || movie.name,
                  movie.id,
                  movie.media_type || (movie.first_air_date ? "tv" : "movie"),
                )}`}
                key={movie.id}
                className="w-[45vw] lg:w-[16vw] group cursor-pointer shrink-0 relative transition-transform duration-300 z-0 hover:z-50 hover:scale-110"
              >
                {/* Image Container */}
                <div className="relative w-full aspect-3/4 rounded-lg overflow-hidden shadow-lg">
                  {movie.poster_path ? (
                    <img
                      className="absolute inset-0 w-full h-full object-cover"
                      src={`https://image.tmdb.org/t/p/w500/${movie.poster_path || movie.backdrop_path
                        }`}
                      alt={`${movie.title || movie.name} poster`}
                      loading={isHighPriority ? "eager" : "lazy"}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-800">
                      No Image
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-linear-to-t font-poppins from-black via-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <div className="transform  translate-y-4 group-hover:translate-y-0 transition-transform duration-300 space-y-2">
                      <h3 className="text-white font-medium text-sm lg:text-base line-clamp-2 ">
                        {movie.title || movie.name}
                      </h3>

                      <div className="flex items-center gap-2 text-xs text-gray-300 font-medium">
                        <span className="text-primary font-bold">
                          {(movie.vote_average || 0).toFixed(1)} Rating
                        </span>
                        <span>
                          {movie.release_date?.split("-")[0] ||
                            movie.first_air_date?.split("-")[0]}
                        </span>
                        <span className="border border-gray-500 px-1 rounded text-[10px]">
                          HD
                        </span>
                      </div>

                      <div className="hidden lg:block">
                        <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                          {movie.overview}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <button className="bg-white/90 cursor-pointer text-black text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-white transition-colors">
                            <Play size={14} fill="black"/>
                          Play
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleWatchLater(movie);
                          }}
                          className="bg-gray-600/60 text-white p-1.5 rounded-full hover:bg-gray-500/80 transition-colors grid place-items-center"
                        >
                          {isSaved ? (
                            <Check size={14} className="text-primary" />
                          ) : (
                            <Plus size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Badge Overlay (Visible when not hovering/mobile) */}
                  <div className="absolute top-2 right-2 font-poppins lg:group-hover:hidden transition-opacity duration-200">
                    <div className="px-2 py-0.5 flex items-center justify-center bg-primary rounded-full backdrop-blur-sm bg-opacity-90">
                      <span className="text-[8px] italic font-semibold text-black uppercase font-poppins">
                        {movie.media_type === "tv" || movie.first_air_date
                          ? "Series"
                          : "HD"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content Info (Hidden on Desktop Hover because it's in the overlay, visible on mobile) */}
                <div className="block lg:group-hover:hidden space-y-1 font-poppins mt-2 transition-opacity duration-300">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm lg:text-sm font-medium text-white line-clamp-1 flex-1">
                      {movie.title || movie.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <p className="text-xs text-primary">
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
