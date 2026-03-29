"use client";
import React from "react";
import { Plus, Check, Play } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { trackEvent, G_EVENTS } from "../utils/analytics";

const HoverOverlay = ({
  movie,
  isSaved,
  toggleWatchLater,
  createSlug,
  mediaType,
}) => {
  return (
    <div className="absolute inset-0 bg-linear-to-t font-poppins from-black via-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
      <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 space-y-2">
        <h3 className="text-white font-medium text-sm lg:text-base line-clamp-2">
          {movie.title || movie.name}
        </h3>

        <div className="flex items-center gap-2 text-xs text-gray-300 font-medium">
          <span className="text-primary font-bold">
            {(movie.vote_average || 0).toFixed(1)} Match
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
          <Link
            href={`/movie/${createSlug(
              movie.title || movie.name,
              movie.id,
              movie.media_type || mediaType,
            )}`}
            onClick={() =>
              trackEvent(
                G_EVENTS.TRAILER,
                "engagement",
                movie.title || movie.name,
              )
            }
            className="bg-white/90 cursor-pointer text-black text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-white transition-colors"
          >
            {/* <Play size={14} fill="black" /> */}
            Trailer
          </Link>
          <Link
            href={`/watch/${createSlug(
              movie.title || movie.name,
              movie.id,
              movie.media_type || mediaType,
            )}`}
            onClick={() =>
              trackEvent(
                G_EVENTS.WATCH_NOW,
                "conversion",
                movie.title || movie.name,
              )
            }
            rel="nofollow"
            className="bg-white/90 cursor-pointer text-black text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 hover:bg-white transition-colors"
          >
            <Play size={14} fill="black" />
            Watch Now
          </Link>
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
  );
};

export default HoverOverlay;
