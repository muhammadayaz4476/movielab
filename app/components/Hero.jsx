import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
// Using standard img tag for direct TMDB asset loading & reliability

const Hero = ({ initialMovies = [] }) => {
  const [movies, setMovies] = useState(initialMovies);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(initialMovies.length === 0);

  const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
  const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;

  useEffect(() => {
    if (initialMovies.length > 0) return;

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

  // Auto-slide every 8 seconds
  useEffect(() => {
    if (movies.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [movies]);

  if (loading) {
    return (
      <div className=" animate-pulse">
        <div className="w-full h-[60vh] lg:h-[70vh] overflow-hidden bg-zinc-900 " />
      </div>
    );
  }

  const currentMovie = movies[currentIndex];

  return (
    <div className="lg:px-[0vw] lg:py-[0] relative overflow-hidden">
      <div className="relative w-full h-[60vh] lg:h-[70vh]  overflow-hidden group shadow-2xl">
        {/* Background Images with Fade */}
        <AnimatePresence mode="wait">
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
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[10000ms] ease-linear transform group-hover:scale-110"
                loading={currentIndex === 0 ? "eager" : "lazy"}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Cinematic Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50  to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20 z-10" />

        {/* Content */}
        <div className="relative z-20 h-full flex flex-col justify-center px-4 lg:px-[5vw] ">
          <motion.div
          // initial={{ y: 20, opacity: 0 }}
          // animate={{ y: 0, opacity: 1 }}
          // key={`content-${currentIndex}`}
          // transition={{ delay: 0.5, duration: 0.8 }}
          >
            {/* Trending Badge */}
            {/* <div className="flex items-center gap-2 mb-4">
              <span className="bg-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white animate-pulse">
                Trending Now
              </span>
              <span className="text-white/60 text-sm font-medium">
                #{currentIndex + 1} in Movies Lab
              </span>
            </div>

            <h1 className="text-4xl lg:text-7xl leading-tight font-black font-comfortaa text-white mb-4 drop-shadow-2xl">
              {currentMovie?.title}
            </h1>

            <p className="text-gray-300 text-sm lg:text-xl font-poppins line-clamp-2 lg:line-clamp-3 mb-8 drop-shadow-lg max-w-2xl leading-relaxed">
              {currentMovie?.overview}
            </p>

            <div className="flex items-center gap-4">
              <button className="bg-primary hover:bg-primary/90 text-white px-8 py-3 lg:px-10 lg:py-4 rounded-full font-bold transition-all shadow-xl hover:scale-105 active:scale-95">
                Watch Movie
              </button>
              <button className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md px-8 py-3 lg:px-10 lg:py-4 rounded-full font-bold transition-all border border-white/10">
                View Details
              </button>
            </div> */}
            <div className="lg:w-full space-y-4 md:mt-[10vw] mt-[14vw] ">
              <h1 className="text-3xl text-white lg:text-5xl leading-normal lg:leading-[4vw] font-semibold lg:font-light font-comfortaa">
                MovieLab Watch & Download Your{" "}
                <br className="hidden lg:block" /> Favorite Movies Here.
              </h1>
              <p className="w-3/4  lg:text-lg font-poppins text-gray-300">
                Watch unlimited movies online or download for free.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Slider Indicators */}
        <div className="absolute bottom-8 right-8 z-30 flex gap-2">
          {movies.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`h-2 rounded-full transition-all duration-500 ${
                i === currentIndex ? "w-8 bg-primary" : "w-2 bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Hero;
