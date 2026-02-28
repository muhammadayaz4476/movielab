import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { CloudDownloadIcon, Play } from "lucide-react";
import dynamic from "next/dynamic";

const NoticeModal = dynamic(() => import("./NoticeModal"), {
  ssr: false,
});
// Using standard img tag for direct TMDB asset loading & reliability

const Hero = ({ initialMovies = [] }) => {
  const [movies, setMovies] = useState(initialMovies || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(initialMovies.length === 0);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);

  const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
  const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;

  useEffect(() => {
    if (initialMovies && initialMovies.length > 0) {
      setMovies(initialMovies);
      console.log("Fetched Trending Movies/TV:", initialMovies);

      setLoading(false); // Ensure loading is set to false if initialMovies are provided
      return;
    }

    const fetchTrending = async () => {
      try {
        const res = await axios.get(
          `${BASE_URL}/trending/all/day?api_key=${API_KEY}&include_adult=false`,
        );
        const trendingItems = res.data.results
          .filter(
            (item) => item.media_type === "movie" || item.media_type === "tv",
          )
          .slice(0, 5);
        setMovies(trendingItems);
        setLoading(false);
      } catch (err) {
        console.error("Hero Fetch Error:", err);
        setLoading(false);
      }
    };
    fetchTrending();
  }, [API_KEY, BASE_URL, initialMovies]);

  // Auto-slide every 12 seconds, paused if modal is open
  useEffect(() => {
    if (movies.length === 0 || isNoticeModalOpen) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [movies, isNoticeModalOpen]);

  if (loading) {
    return (
      <div className=" animate-pulse">
        <div className="w-full h-[60vh] lg:h-[70vh] overflow-hidden bg-zinc-900 " />
      </div>
    );
  }

  const currentMovie = movies[currentIndex];
  const createSlug = (title, id, type = "movie") => {
    if (!title) return id;
    const prefix = type === "tv" ? "tv-" : "";
    return `${prefix}${title.toLowerCase().replace(/[^\w-]+/g, "")}-${id}`;
  };

  return (
    <div className="lg:px-[0vw] lg:py-[0] relative overflow-hidden">
      <div className="relative w-full h-[70vh] lg:h-[70vh]  overflow-hidden group shadow-2xl">
        {/* Background Images with Fade */}
        <AnimatePresence>
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            {currentMovie?.backdrop_path && (
              <img
                src={`https://image.tmdb.org/t/p/original${currentMovie.backdrop_path}`}
                alt={currentMovie?.title || currentMovie?.name || "Hero Banner"}
                className="absolute inset-0 w-full h-[100vh] object-cover object-top transition-transform duration-[10000ms] ease-linear transform group-hover:scale-110"
                loading={currentIndex === 0 ? "eager" : "lazy"}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Cinematic Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50  to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20 z-10" />

        {/* Content */}
        <div className="relative z-20  h-full flex flex-col justify-center  lg:pt-[9vw]  pt-[20vh]  px-4 lg:px-[2vw] ">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            key={`content-${currentIndex}`}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          >
            {/* Trending Badge */}
            <div className="flex items-center gap-2 mb-4">
              {/* <span className="bg-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white animate-pulse">
                Trending Now
              </span> */}
              <span className="text-white/60 text-sm font-medium">
                #{currentIndex + 1} in Movies Lab
              </span>
            </div>

            <h1 className="text-4xl lg:text-5xl  leading-tight font-black font-comfortaa text-white mb-4 drop-shadow-2xl">
              {currentMovie?.title || currentMovie?.name || "Untitled Movie/TV"}
            </h1>

            <p className="text-gray-300 text-sm lg:text-xl font-poppins line-clamp-2 lg:line-clamp-2 mb-8 drop-shadow-lg max-w-2xl leading-relaxed">
              {currentMovie?.overview ||
                "No description available for this title."}
            </p>

            <div className="flex items-center gap-4">
              <Link
                href={`/movie/${createSlug(
                  currentMovie.title || currentMovie.name,
                  currentMovie.id,
                  currentMovie.media_type ||
                    (currentMovie.first_air_date ? "tv" : "movie"),
                )}`}
                className="bg-primary   text-white/89 px-4 py-3 lg:px-6 lg:py-4 rounded-full font-poppins transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center justify-between gap-[0.3vw]"
              >
                
                Watch Now
              </Link>
              <button
                onClick={() => setIsNoticeModalOpen(true)}
                className="bg-white/4 flex items-center justify-center gap-2 hover:bg-white/10 text-white backdrop-blur-xs px-4 py-3 lg:px-10 lg:py-4 rounded-xl font-bold transition-all border border-white/10"
              >
                Download
                <CloudDownloadIcon />
              </button>
            </div>

            <NoticeModal
              isOpen={isNoticeModalOpen}
              onClose={() => setIsNoticeModalOpen(false)}
              title={currentMovie?.title || currentMovie?.name}
              downloadLink={`https://dl.vidsrc.vip/${(currentMovie?.media_type || (currentMovie?.first_air_date ? "tv" : "movie")) === "tv" ? "tv" : "movie"}/${currentMovie?.id}${(currentMovie?.media_type || (currentMovie?.first_air_date ? "tv" : "movie")) === "tv" ? "/1/1" : ""}`}
            />
          </motion.div>
        </div>

        {/* Slider Indicators */}
        {/* <div className="absolute bottom-8 right-8 z-30 flex gap-2">
          {movies.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-2 rounded-full transition-all duration-500 ${
                i === currentIndex ? "w-8 bg-primary" : "w-2 bg-white/30"
              }`}
            />
          ))}
        </div> */}
      </div>
    </div>
  );
};

export default Hero;
