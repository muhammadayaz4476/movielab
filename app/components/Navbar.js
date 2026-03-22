"use client";
import React, { useState, useEffect } from "react";
import {
  Search as SearchIcon,
  Play as PlayIcon,
  User,
  Menu,
  ListPlus,
  ChevronRight,
  X,
  Layers,
  PlaySquareIcon,
} from "lucide-react";
// Using standard img tag for direct TMDB asset loading & reliability
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import Marquee from "react-fast-marquee";

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [genres, setGenres] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [placeholderText, setPlaceholderText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);

  const searchRef = React.useRef(null);
  const router = useRouter();

  const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
  const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;

  // Placeholder Animation Logic
  const { user, logout, isLoginModalOpen, setIsLoginModalOpen } = useAuth();
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhraseIndex((prev) => (prev + 1) % 4); // 4 phrases
    }, 3000); // Change every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const phrases = [
    "Search movies...",
    "Search by actor...",
    "Search web series...",
    "Explore genres...",
  ];

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        if (!API_KEY) return;
        const req = await axios.get(
          `${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=en-US`,
        );
        setGenres(req.data.genres);
      } catch (err) {
        console.error("Failed to fetch genres", err);
      }
    };
    fetchGenres();
  }, [API_KEY, BASE_URL]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        try {
          setIsSearching(true);
          const response = await axios.get(
            `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(
              searchQuery,
            )}&include_adult=false`,
          );

          let results = response.data.results
            .filter(
              (item) =>
                item.media_type === "movie" ||
                item.media_type === "tv" ||
                item.media_type === "person",
            )
            .slice(0, 5);

          // Genre Detection
          const matchedGenre = genres.find(
            (g) => g.name.toLowerCase() === searchQuery.toLowerCase().trim(),
          );

          if (matchedGenre) {
            results = [
              {
                id: `genre-${matchedGenre.id}`,
                title: matchedGenre.name,
                isGenre: true,
                media_type: "genre",
              },
              ...results,
            ].slice(0, 5);
          }

          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error("Error fetching suggestions:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, API_KEY, BASE_URL, genres]);

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/search/${encodeURIComponent(searchQuery)}`);
      setIsSidebarOpen(false);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (item) => {
    if (item.isGenre) {
      router.push(
        `/discover/${item.title.toLowerCase().replace(/ /g, "-")}-${
          item.id.split("-")[1]
        }`,
      );
    } else if (item.media_type === "person") {
      const slug = createSlug(item.name, item.id, "person");
      router.push(`/actor/${slug}`);
    } else {
      const slug = createSlug(
        item.title || item.name,
        item.id,
        item.media_type,
      );
      router.push(`/movie/${slug}`);
    }
    setSearchQuery("");
    setShowSuggestions(false);
  };

  const createSlug = (title, id, type = "movie") => {
    if (!title) return id;
    const prefix = type === "tv" ? "tv-" : "";
    return `${prefix}${title
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "")}-${id}`;
  };

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Always show at the very top
      if (currentScrollY < 50) {
        setIsVisible(true);
      } else {
        // Hide if scrolling down past a threshold, show if scrolling up
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          setIsVisible(false);
        } else {
          setIsVisible(true);
        }
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const hubs = [
    { name: "Hollywood", slug: "hollywood" },
    { name: "Bollywood", slug: "bollywood" },
    { name: "Korean", slug: "korean" },
    { name: "Anime", slug: "anime" },
    { name: "Web Series", slug: "web-series" },
  ];
  const tils = [
    " ",
    " Please Install the AdGuard browser extension or mobile app to block intrusive ads and popups ",
    " Movies lab ",
    " We wish you Merry Christmas and Happy New Year! ",
    " Movies lab ",
    " We wish you Merry Christmas and Happy New Year! ",
    " Movies lab ",
    " We wish you Merry Christmas and Happy New Year! ",
    " Movies lab ",
  ];

  return (
    <>
      <motion.header
        initial={{ y: 0 }}
        animate={{ y: isVisible ? 0 : "-100%" }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className={`fixed top-0 left-0 w-full z-100 ${isVisible ? "b" : ""}`}
      >
        <nav className="px-4    w-full flex lg:flex-row flex-col lg:px-[2vw] lg:py-[0.3vw]  lg:items-center justify-between z-[60]">
          <div className="flex items-center justify-between w-full lg:w-full">
            <div className=" flex lg:flex-row-reverse lg:justify-start justify-between w-full items-center gap-6">
              <div className=" w-full hidden lg:flex items-center justify-center">
                <div className="flex  gap-2   bg-white/15 text-sm rounded-full backdrop-blur-xl px-2 py-2 ">
                  <Link
                    href="/"
                    onClick={() => setIsSidebarOpen(false)}
                    className="px-4 py-2 rounded-full hover:bg-primary flex items-center justify-between group transition-all"
                  >
                    <span className="text-white   transition-all font-medium">
                      Home
                    </span>
                    <span className="text-gray-700 group-hover:text-primary transition-colors">
                      {/* <ChevronRight /> */}
                    </span>
                  </Link>
                  <Link
                    href={`/discover/${hubs[3].slug}`}
                    // onClick={() => setIsSidebarOpen(false)}
                    className=" font-poppins   py-2 px-4 rounded-full text-center hover:bg-primary hover:border-primary transition-all text-sm"
                  >
                    {hubs[3].name}
                  </Link>
                  <Link
                    href={`/discover/${hubs[2].slug}`}
                    // onClick={() => setIsSidebarOpen(false)}
                    className=" font-poppins   py-2 px-4 rounded-full text-center hover:bg-primary hover:border-primary transition-all text-sm"
                  >
                    {hubs[2].name}
                  </Link>
                  <Link
                    href="/actors"
                    onClick={() => setIsSidebarOpen(false)}
                    className="px-4 py-2 rounded-full hover:bg-primary flex items-center justify-between group transition-all"
                  >
                    <span className="text-white  transition-all font-medium">
                      Actors
                    </span>
                    <span className="text-gray-700 group-hover:text-primary transition-colors">
                      {/* <ChevronRight /> */}
                    </span>
                  </Link>
                  <Link
                    href="/countries"
                    onClick={() => setIsSidebarOpen(false)}
                    className="px-4 py-2 rounded-full hover:bg-primary flex items-center justify-between group transition-all"
                  >
                    <span className="text-white  transition-all font-medium">
                      Countries
                    </span>
                    <span className="text-gray-700 group-hover:text-primary transition-colors">
                      {/* <ChevronRight /> */}
                    </span>
                  </Link>
                  <Link
                    href="/history"
                    onClick={() => setIsSidebarOpen(false)}
                    className="px-4 py-2 rounded-full hover:bg-primary flex items-center justify-between group transition-all"
                  >
                    <span className="text-white transition-all font-medium">
                      History
                    </span>
                  </Link>
                </div>
              </div>

              <Link
                href="/"
                className="text-white flex items-center w-fit gap-2 lg:gap-[0.1vw] text-xl font-comfortaa font-bold"
              >
                <PlayIcon className="text-primary lg:w-[2vw] lg:h-[1.4vw] rotate-45" />
                <div className="flex gap-1">
                  Movies<span className="text-primary font-comfortaa">lab</span>
                </div>
              </Link>
            </div>

            <div className=" md:hidden flex items-center gap-6">
              {/* <Link
                href="/watch-later"
                className="text-sm font-medium text-white  hover:scale-110 transition-transform"
              >
                <PlayIcon fill="white" />
              </Link> */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="bg-white/15 backdrop-blur-xs border border-white/5 p-3 lg:p-[0.7vw] rounded-full flex items-center justify-center text-white hover:bg-primary transition-all group"
              >
                <Menu className="text-white group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>

          <div className="flex items-center w-full lg:w-fit gap-2 pt-2 md:pt-0 lg:gap-[1vw]">
            <div className="relative w-full lg:w-[20vw]" ref={searchRef}>
              <div className="bg-white/15 backdrop-blur-xl border border-white/5 w-full lg:px-[1.2vw] lg:py-[0.6vw] px-4 py-3 rounded-full flex flex-nowrap items-center gap-2 text-white focus-within:border-primary/50 transition-all relative overflow-hidden">
                <SearchIcon className="text-primary/50 shrink-0" size={20} />

                <div className="relative flex-1 h-6">
                  <input
                    type="search"
                    className="bg-transparent border-none outline-none text-white text-sm lg:text-base w-full h-full absolute top-0 left-0 z-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearch}
                    onFocus={() =>
                      searchQuery.trim().length > 1 && setShowSuggestions(true)
                    }
                  />
                  <AnimatePresence mode="wait">
                    {!searchQuery && (
                      <motion.span
                        key={currentPhraseIndex}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 0.5 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="absolute top-0 left-0 pointer-events-none text-sm lg:text-base text-gray-300 truncate w-full h-full flex items-center"
                      >
                        {phrases[currentPhraseIndex]}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                {isSearching && (
                  <div className="p-2  border-2 border-primary border-t-transparent animate-spin rounded-full " />
                )}
              </div>

              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white/15 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black z-100"
                  >
                    {suggestions.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSuggestionClick(item)}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-primary/10 transition-colors border-b border-white/5 last:border-none group"
                      >
                        {item.isGenre ? (
                          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                            <SearchIcon size={16} className="text-primary" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-md overflow-hidden bg-zinc-800 shrink-0 relative">
                            {item.poster_path || item.profile_path ? (
                              <img
                                src={`https://image.tmdb.org/t/p/w92${
                                  item.poster_path || item.profile_path
                                }`}
                                alt={item.title || item.name || "Suggestion"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">
                                N/A
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex flex-col lg:gap-[0.2vw] items-start overflow-hidden">
                          <span className="text-white text-sm font-  font-poppins  w-full group-hover:text-primary transition-colors text-left">
                            {item.title || item.name}
                          </span>
                          <span className="text-gray-500 text-[10px] font-  font-poppins uppercase">
                            {item.isGenre
                              ? "Browse Genre"
                              : item.media_type === "person"
                                ? "Actor"
                                : `${
                                    item.media_type === "tv"
                                      ? "TV Series"
                                      : "Movie"
                                  } • ${
                                    (
                                      item.release_date ||
                                      item.first_air_date ||
                                      ""
                                    ).split("-")[0]
                                  }`}
                          </span>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className=" hidden lg:flex items-center gap-6">
              {/* <Link
                href="/watch-later"
                className="text-sm font-medium text-white  hover:scale-110 transition-transform"
              >
                <PlayIcon fill="white" />
              </Link> */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="bg-white/15 backdrop-blur-xs  p-3 lg:p-[0.7vw] rounded-full flex items-center justify-center text-white hover:bg-primary transition-all group"
              >
                <Menu className="text-white group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </nav>
      </motion.header>

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
              className="fixed inset-0 bg-black/20 backdrop-blur-2xl z-100"
            />

            {/* Sidebar: Changed left-0 to right-0 and removed lg:hidden */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3, ease: "circOut" }}
              className="fixed top-0 right-0 bottom-0 w-full lg:w-[350px] bg-white/20 backdrop-blur-xl border-l border-white/10 p-8 z-[110] lg:shadow-2xl flex flex-col overflow-hidden custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold font-comfortaa text-white">
                  Discover
                </h3>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 hover:bg-primary/20 hover:text-primary text-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div
                onWheel={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                className="overflow-y-auto flex-1 pr-2 custom-scrollbar smooth-native-scroll"
              >
                {/* Hubs Section */}
                <div className="mb-8">
                  <h4 className="text-primary text-md font-medium mb-4 uppercase font-poppins">
                    Cinema Hubs
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {hubs.map((hub) => (
                      <Link
                        key={hub.slug}
                        href={`/discover/${hub.slug}`}
                        onClick={() => setIsSidebarOpen(false)}
                        className="bg-gray-500/40 font-poppins  p-3 rounded text-center hover:bg-primary hover:border-primary transition-all text-sm"
                      >
                        {hub.name}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Explore More - New Section */}
                <div className="mb-8 lg:hidden">
                  <h4 className="text-gray-500 text-[10px] font-black mb-4 uppercase tracking-[0.2em]">
                    Explore More
                  </h4>
                  <div className="flex flex-col gap-1">
                    <Link
                      href="/actors"
                      onClick={() => setIsSidebarOpen(false)}
                      className="px-4 py-3 rounded-xl hover:bg-white/5 flex items-center justify-between group transition-all"
                    >
                      <span className="text-gray-300 group-hover:text-white  transition-all font-medium">
                        Popular Actors
                      </span>
                      <span className="text-gray-700 group-hover:text-primary transition-colors">
                        <ChevronRight />
                      </span>
                    </Link>
                    <Link
                      href="/countries"
                      onClick={() => setIsSidebarOpen(false)}
                      className="px-4 py-3 rounded-xl hover:bg-white/5 flex items-center justify-between group transition-all"
                    >
                      <span className="text-gray-300 group-hover:text-white  transition-all font-medium">
                        Browse by Country
                      </span>
                      <span className="text-gray-700 group-hover:text-primary transition-colors">
                        <ChevronRight />
                      </span>
                    </Link>
                    <Link
                      href="/history"
                      onClick={() => setIsSidebarOpen(false)}
                      className="px-4 py-3 rounded-xl hover:bg-white/5 flex items-center justify-between group transition-all"
                    >
                      <span className="text-gray-300 group-hover:text-white transition-all font-medium">
                        Watch History
                      </span>
                      <span className="text-gray-700 group-hover:text-primary transition-colors">
                        <ChevronRight />
                      </span>
                    </Link>
                  </div>
                </div>

                {/* Genres Section */}
                <div>
                  <h4 className="text-primary text-md font-medium mb-4 uppercase font-poppins">
                    Browse Genres
                  </h4>
                  <div className="flex flex-col gap-1 pb-6">
                    {genres.map((genre) => (
                      <Link
                        key={genre.id}
                        href={`/discover/${genre.name
                          .toLowerCase()
                          .replace(/ /g, "-")}-${genre.id}`}
                        onClick={() => setIsSidebarOpen(false)}
                        className="px-4 py-3 rounded-md hover:bg-white/5 flex items-center justify-between group transition-all"
                      >
                        <span className="text-white group-hover:text-primary transition-all font-medium">
                          {genre.name}
                        </span>
                        <span className="text-white group-hover:text-primary transition-colors">
                          <ChevronRight />
                        </span>
                      </Link>
                    ))}
                  </div>
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
