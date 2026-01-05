"use client";
import React, { useState, useEffect } from "react";
import { PlayIcon, SearchIcon, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [genres, setGenres] = useState([]);
  const router = useRouter();

  const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
  const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        if (!API_KEY) return;
        const req = await axios.get(
          `${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=en-US`
        );
        setGenres(req.data.genres);
      } catch (err) {
        console.error("Failed to fetch genres", err);
      }
    };
    fetchGenres();
  }, [API_KEY, BASE_URL]);

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/search/${encodeURIComponent(searchQuery)}`);
      setIsSidebarOpen(false);
    }
  };

  const hubs = [
    { name: "Hollywood", slug: "hollywood" },
    { name: "Bollywood", slug: "bollywood" },
    { name: "Korean", slug: "korean" },
    { name: "Anime", slug: "anime" },
  ];

  return (
    <>
      <header className="px-4 py-6 absolute top-0 left-0 w-full  lg:px-[5vw] lg:py-[1.5vw] flex lg:flex-row flex-col lg:items-center justify-between  z-[60]">
        <div className="flex items-center justify-between w-full lg:w-auto">
          <Link
            href="/"
            className="text-white flex items-center w-fit gap-2 lg:gap-[0.5vw] text-2xl font-comfortaa font-bold"
          >
            <PlayIcon
              fill="#2eafff"
              className="text-primary lg:w-[2vw] lg:h-[2vw] rotate-45"
            />
            <div className="flex gap-1">
              Movies<span className="text-primary font-comfortaa">lab</span>
            </div>
          </Link>
        </div>

        <nav className="flex items-center w-full lg:w-fit gap-2 pt-5 md:pt-0 lg:gap-[1vw]">
          <div className="bg-zinc-900/50 backdrop-blur-xs border border-white/5 w-full lg:w-[25vw] lg:px-[1.2vw] lg:py-[0.6vw] px-4 py-3 rounded-full flex items-center gap-2 text-white focus-within:border-primary/50 transition-all">
            <SearchIcon className="text-primary/50" size={20} />
            <input
              type="search"
              className="bg-transparent border-none outline-none text-white text-sm lg:text-base w-full"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="bg-zinc-900/50 backdrop-blur-xs border border-white/5 p-3 lg:p-[0.7vw] rounded-full flex items-center justify-center text-white hover:bg-primary transition-all group"
          >
            <Menu className="text-white group-hover:scale-110 transition-transform" />
          </button>
        </nav>
      </header>

      {/* Sidebar Component */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop: Removed lg:hidden so it works on all screens */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
            />

            {/* Sidebar: Changed left-0 to right-0 and removed lg:hidden */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3, ease: "circOut" }}
              className="fixed top-0 right-0 h-full w-[300px] lg:w-[350px] bg-zinc-950 border-l border-white/10 p-8 z-[110] shadow-2xl overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-bold font-comfortaa text-white">Discover</h2>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 hover:bg-primary/20 hover:text-primary text-gray-400 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Hubs Section */}
              <div className="mb-10">
                <h3 className="text-primary text-[10px] font-black mb-4 uppercase tracking-[0.2em]">
                  Cinema Hubs
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {hubs.map((hub) => (
                    <Link
                      key={hub.slug}
                      href={`/discover/${hub.slug}`}
                      onClick={() => setIsSidebarOpen(false)}
                      className="bg-zinc-900 font-poppins border border-white/5 p-3 rounded-xl text-center hover:bg-primary hover:border-primary transition-all  text-sm"
                    >
                      {hub.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Genres Section */}
              <div>
                <h3 className="text-gray-500 text-[10px] font-black mb-4 uppercase tracking-[0.2em]">
                  Browse Genres
                </h3>
                <div className="flex flex-col gap-1">
                  {genres.map((genre) => (
                    <Link
                      key={genre.id}
                      href={`/discover/${genre.name.toLowerCase().replace(/ /g, "-")}-${genre.id}`}
                      onClick={() => setIsSidebarOpen(false)}
                      className="px-4 py-3 rounded-xl hover:bg-white/5 flex items-center justify-between group transition-all"
                    >
                      <span className="text-gray-300 group-hover:text-white group-hover:translate-x-1 transition-all">
                        {genre.name}
                      </span>
                      <span className="text-gray-700 group-hover:text-primary transition-colors">
                        ›
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;