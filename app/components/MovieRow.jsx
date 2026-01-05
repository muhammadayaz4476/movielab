"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

const MovieRow = ({ title, fetchURL, viewAllLink }) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
            (keyword) => title.includes(keyword) || overview.includes(keyword)
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
  }, [fetchURL]);

  const createSlug = (title, id) => {
    if (!title) return id;
    return `${title
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "")}-${id}`;
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
                className="w-[45vw] lg:w-[21vw] shrink-0 animate-pulse"
              >
                <div className="bg-gray-800 rounded-xl lg:rounded-[1vw] mb-3 lg:mb-[0.8vw] aspect-3/4 lg:aspect-video"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                </div>
              </div>
            ))
          : movies.map((movie) => (
              <Link
                href={`/movie/${createSlug(
                  movie.title || movie.name,
                  movie.id
                )}`}
                key={movie.id}
                className="w-[45vw] lg:w-[21vw] group cursor-pointer shrink-0"
              >
                {/* Image Container */}
                <div className="relative w-full aspect-3/4 rounded-lg overflow-hidden group">
                  {movie.poster_path ? (
                    <img
                      className="w-full h-full object-cover transform lg:group-hover:scale-105 transition-transform duration-300"
                      src={`https://image.tmdb.org/t/p/w500/${
                        movie.poster_path || movie.backdrop_path
                      }`}
                      alt={movie.title}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      No Image
                    </div>
                  )}

                  {/* Badge Overlay */}
                  <div className="absolute top-3 right-3 lg:top-[0.8vw] lg:right-[0.8vw] px-2 py-1 bg-red-600 rounded-md flex items-center gap-1 backdrop-blur-sm bg-opacity-90">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                    <span className="text-[10px] lg:text-xs font-bold text-white uppercase tracking-wider">
                      {movie.vote_average
                        ? movie.vote_average.toFixed(1)
                        : "NEW"}
                    </span>
                  </div>
                </div>

                {/* Content Infio */}
                <div className="space-y-1 font-poppins lg:space-y-[0.3vw] lg:mt-[0.5vw]">
                  <h3 className="text-base lg:text-xl font-medium text-white line-clamp-1">
                    {movie.title || movie.name}
                  </h3>
                  <div className="flex items-center gap-2 text-gray-400">
                    {/* {movie.poster_path && (
                      <img
                        src={`https://image.tmdb.org/t/p/w200/${movie.poster_path}`}
                        className="w-5 h-5 lg:w-[1.5vw] lg:h-[1.5vw] rounded-full object-cover"
                        alt=""
                      />
                    )} */}
                    <p className="text-xs lg:text-sm text-primary">
                      {movie.release_date || movie.first_air_date}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
      </div>
    </div>
  );
};

export default MovieRow;
