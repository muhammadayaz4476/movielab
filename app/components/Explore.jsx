"use client";
import React, { useState } from "react";
import Link from "next/link";

const Explore = () => {
  const [trendingKeywords] = useState([
    { id: "action", name: "Action Movies" },
    { id: "horror", name: "Horror Films" },
    { id: "romance", name: "Romantic Movies" },
    { id: "comedy", name: "Comedy Films" },
    { id: "thriller", name: "Thriller Movies" },
    { id: "scifi", name: "Sci-Fi Movies" },
    { id: "drama", name: "Drama Films" },
    { id: "animation", name: "Animation" },
  ]);

  return (
    <div className="space-y-8">
      {/* Dynamic Trending Keywords */}
      {trendingKeywords && trendingKeywords.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Trending Now
          </h4>
          <div className="flex flex-wrap gap-2">
            {trendingKeywords.map((keyword) => (
              <Link
                key={keyword.id}
                href={`/search/kw-${keyword.id}-${encodeURIComponent(
                  keyword.name.replace(/\s+/g, "-").toLowerCase()
                )}`}
                className="bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-xs text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
              >
                {keyword.name}
              </Link>
            ))}
            <Link
              href="/discover/trending"
              className="bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-xs text-primary hover:text-white hover:border-primary/50 transition-colors"
            >
              Browse All Trending
            </Link>
          </div>
        </div>
      )}

      {/* Genres */}
      <div>
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Movies by Genre
        </h4>
        <div className="flex flex-wrap gap-2">
          {[
            { name: "Action", id: 28 },
            { name: "Adventure", id: 12 },
            { name: "Animation", id: 16 },
            { name: "Comedy", id: 35 },
            { name: "Crime", id: 80 },
            { name: "Documentary", id: 99 },
            { name: "Drama", id: 18 },
            { name: "Family", id: 10751 },
            { name: "Fantasy", id: 14 },
            { name: "History", id: 36 },
            { name: "Horror", id: 27 },
            { name: "Music", id: 10402 },
            { name: "Mystery", id: 9648 },
            { name: "Romance", id: 10749 },
            { name: "Science Fiction", id: 878 },
            { name: "Thriller", id: 53 },
            { name: "War", id: 10752 },
            { name: "Western", id: 37 },
          ].map((genre) => (
            <Link
              key={genre.id}
              href={`/search/genre-${genre.id}-${genre.name.toLowerCase()}`}
              className="bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-xs text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
            >
              {genre.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Years */}
      <div>
        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Movies by Year
        </h4>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 15 }, (_, i) => 2026 - i).map((year) => (
            <Link
              key={year}
              href={`/search/year-${year}`}
              className="bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-xs text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
            >
              {year}
            </Link>
          ))}
          <Link
            href="/discover/classics"
            className="bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-xs text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
          >
            Older...
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Explore;