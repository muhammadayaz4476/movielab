"use client";
import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Play, X } from "lucide-react";

export default function WatchLaterPage() {
  const { user, watchLater, loading, toggleWatchLater ,setIsLoginModalOpen} = useAuth();
    // const { user, logout, isLoginModalOpen, setIsLoginModalOpen } = useAuth();
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const createSlug = (title, id, type = "movie") => {
    if (!title) return id;
    const prefix = type === "tv" ? "tv-" : "";
    return `${prefix}${title
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "")}-${id}`;
  };

  if (!mounted || loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[80vh] px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold font-comfortaa mb-6">
            Sign In to Access Your List
          </h1>
          <p className="text-zinc-400 mb-8 max-w-md">
            Save movies and shows to watch later. Use your username to sync
            across devices.
          </p>
          <button onClick={() => setIsLoginModalOpen(true)} className="text-primary mt-4 inline-block hover:underline">
            Sign In
          </button>
          {/* Note: In a real app we'd have a trigger here, but Navbar has the login button */}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="px-4 lg:px-[5vw] py-24 lg:py-32">
        <header className="mb-12 flex items-end gap-4">
          <h1 className="text-3xl md:text-4xl font-bold font-comfortaa">
            Watch Now
          </h1>
          {/* <span className="text-zinc-500 text-lg mb-1 font-poppins">
            {watchLater.length} Found
          </span> */}
        </header>

        {watchLater.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-white/5">
            <p className="text-zinc-500 text-lg">Your list is empty.</p>
            <Link
              href="/"
              className="text-primary mt-4 inline-block hover:underline"
            >
              Browse Movies
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
            {watchLater.map((item) => (
              <div key={item.id} className="group relative">
                <Link
                  href={`/movie/${createSlug(
                    item.title,
                    item.id,
                    item.media_type
                  )}`}
                  className="block relative aspect-2/3 bg-zinc-800 rounded-xl overflow-hidden"
                >
                  {item.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-500">
                      No Poster
                    </div>
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center text-black shadow-lg scale-0 group-hover:scale-100 transition-transform delay-100">
                      <Play fill="black" size={20} className="ml-1" />
                    </div>
                  </div>
                </Link>

                <div className="mt-3 flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <Link
                      href={`/movie/${createSlug(
                        item.title,
                        item.id,
                        item.media_type
                      )}`}
                    >
                      <h3 className="font-semibold text-sm md:text-base leading-tight truncate hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                    </Link>
                    <p className="text-[10px] md:text-xs text-zinc-500 mt-1 uppercase tracking-wide">
                      {item.media_type === "tv" ? "TV Series" : "Movie"} •{" "}
                      {item.release_date?.split("-")[0]}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleWatchLater(item)}
                    className="p-1.5 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-red-500 transition-colors"
                    title="Remove from list"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
