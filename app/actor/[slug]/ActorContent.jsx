"use client";
/**
 * ActorContent.jsx - Updated 2026-03-08
 * Fixed year filter UI (dropdown) and improved Similar Stars logic
 */
import React, { useState, useEffect, useRef } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Link from "next/link";
import {
  Cake,
  MapPin,
  Star,
  ChevronRight,
  Filter,
  ChevronDown,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import HoverOverlay from "@/app/components/HoverOverlay";
import { useAuth } from "@/context/AuthContext";

const ActorContent = ({ data, slug }) => {
  const [showFullBio, setShowFullBio] = useState(false);
  const [relatedActors, setRelatedActors] = useState([]);
  const [filter, setFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(20);
  const { toggleWatchLater, watchLater } = useAuth();
  const observerRef = useRef(null);

  const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
  const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;

  // Deduplication: Only one entry per unique ID
  const rawCast = data.combined_credits?.cast || [];
  const uniqueCastMap = new Map();
  rawCast.forEach((item) => {
    if (!uniqueCastMap.has(item.id)) {
      uniqueCastMap.set(item.id, item);
    }
  });

  const cast = Array.from(uniqueCastMap.values());
  const sortedCast = [...cast].sort((a, b) => b.popularity - a.popularity);
  const knownFor = sortedCast
    .filter((item) => {
      const role = (item.character || "").toLowerCase();
      // Filter out talk shows, host roles, self appearances, and narrators
      const isSelf =
        role.includes("self") ||
        role.includes("host") ||
        role.includes("guest") ||
        role.includes("narrator") ||
        role.includes("presenter");
      return !isSelf;
    })
    .slice(0, 8);

  // Derive unique years for the filter dropdown
  const years = Array.from(
    new Set(
      cast.map((item) => {
        const date = item.release_date || item.first_air_date;
        return date ? date.split("-")[0] : null;
      }),
    ),
  )
    .filter(Boolean)
    .sort((a, b) => b - a);

  // Filter logic
  const filteredCast = sortedCast
    .filter((item) => {
      const matchesType = filter === "all" || item.media_type === filter;
      const date = item.release_date || item.first_air_date;
      const year = date ? date.split("-")[0] : null;
      const matchesYear = yearFilter === "all" || year === yearFilter;
      return matchesType && matchesYear;
    })
    .sort((a, b) => {
      const dateA = a.release_date || a.first_air_date;
      const dateB = b.release_date || b.first_air_date;
      const timeA = dateA ? new Date(dateA).getTime() : 0;
      const timeB = dateB ? new Date(dateB).getTime() : 0;
      if (timeA !== timeB) return timeB - timeA;
      return (b.popularity || 0) - (a.popularity || 0);
    });

  const displayedCast = filteredCast.slice(0, visibleCount);

  // Helper for generating SEO friendly slugs
  const createSlug = (title, id, type = "movie") => {
    if (!title) return id;
    const prefix = type === "tv" ? "tv-" : "";
    return `${prefix}${title
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "")}-${id}`;
  };

  useEffect(() => {
    const fetchRelated = async () => {
      // Improved logic: Find a project that is likely NOT a talk show or reality TV
      // We look for projects where character is NOT "Self" or "Guest" or "Host"
      const bestProject =
        sortedCast.find((item) => {
          const role = (item.character || "").toLowerCase();
          return (
            !role.includes("self") &&
            !role.includes("host") &&
            !role.includes("guest")
          );
        }) || knownFor[0];

      if (!bestProject) return;

      try {
        const res = await fetch(
          `${BASE_URL}/${bestProject.media_type}/${bestProject.id}/credits?api_key=${API_KEY}`,
        );
        const creditData = await res.json();

        // Filter the project's cast to avoid non-actor talent
        const related =
          creditData.cast
            ?.filter((c) => {
              const isSelf = c.id === data.id;
              const isActor = c.known_for_department === "Acting";
              const role = (c.character || "").toLowerCase();
              const isNotHost =
                !role.includes("self") &&
                !role.includes("host") &&
                !role.includes("presenter");
              return !isSelf && isActor && isNotHost;
            })
            .slice(0, 10) || [];

        setRelatedActors(related);
      } catch (err) {
        console.error("Error fetching related actors:", err);
      }
    };
    fetchRelated();
  }, [data.id]);

  // Infinite Scroll Hook
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredCast.length) {
          setVisibleCount((prev) => prev + 20);
        }
      },
      { threshold: 0.1 },
    );

    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [visibleCount, filteredCast.length]);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (showFullBio) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    };
  }, [showFullBio]);

  return (
    <main className="w-full min-h-screen bg-black text-white selection:bg-primary/30 pb-20">
      <Navbar />

      {/* Hero Section */}
      <div className="relative w-full h-[110vh] lg:h-[100vh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={`https://image.tmdb.org/t/p/original${data.images?.profiles?.[0]?.file_path || data.profile_path}`}
            alt=""
            className="w-full h-full object-cover  blur-sm "
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black  to-transparent" />
        </div>

        <div className="absolute bottom-0 left-0 w-full px-4 lg:px-[3vw] pb-12">
          <div className="flex flex-col lg:flex-row items-center  lg:items-start gap-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-52 lg:w-72 aspect-[3/4] rounded-xl overflow-hidden "
            >
              <img
                src={`https://image.tmdb.org/t/p/original${data.images?.profiles?.[1]?.file_path || data.profile_path}`}
                alt={data.name}
                className="w-full h-full object-cover object-top"
              />
            </motion.div>

            <div className="flex-1 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-3">
                  <span className="px-4 py-1.5 bg-primary text-black text-[11px] font-black uppercase rounded-lg shadow-lg shadow-primary/20">
                    {data.known_for_department}
                  </span>
                  {data.birthday && (
                    <span className="flex items-center gap-2 text-sm text-gray-300 bg-white/5 backdrop-blur-md px-3 py-1 rounded-full border border-white/5">
                      <Cake size={16} className="text-primary" />
                      {new Date(data.birthday).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  )}
                  {data.place_of_birth && (
                    <span className="flex items-center gap-2 text-sm text-gray-300 bg-white/5 backdrop-blur-md px-3 py-1 rounded-full border border-white/5">
                      <MapPin size={16} className="text-primary" />
                      {data.place_of_birth.split(",").slice(-1)}
                    </span>
                  )}
                </div>
                <h1 className="text-5xl lg:text-8xl font-comfortaa font-bold mb-8 tracking-tighter">
                  {data.name}
                </h1>

                <div className="max-w-3xl">
                  <p className="text-gray-300 font-poppins leading-relaxed text-lg line-clamp-3">
                    {data.biography || "No biography available for this actor."}
                  </p>
                  {data.biography?.length > 200 && (
                    <button
                      onClick={() => setShowFullBio(true)}
                      className="text-primary  font-bold mt-4 flex items-center gap-1 group/btn"
                    >
                      Read Full Biography
                      <ChevronRight
                        size={18}
                        className="group-hover/btn:translate-x-1 transition-transform"
                      />
                    </button>
                  )}
                </div>

                {/* Filters Bar */}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-[3vw] mt-24 space-y-32">
        {/* Iconic Projects Section */}
        <section>
          <div className="flex items-center gap-4 mb-10">
            <div className="h-10 w-1.5 bg-primary rounded-full" />
            <h2 className="text-3xl font-comfortaa font-bold tracking-tight">
              Iconic Works
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 lg:gap-6">
            {knownFor.map((movie) => (
              <Link
                key={`${movie.id}-iconic`}
                href={`/movie/${createSlug(movie.title || movie.name, movie.id, movie.media_type)}`}
                className="group relative aspect-[2/3] rounded-md overflow-hidden bg-zinc-900  font-poppins transition-all shadow-xl"
              >
                {movie.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w400${movie.poster_path}`}
                    alt={movie.title || movie.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-700 text-sm text-center p-2 italic">
                    {movie.title || movie.name}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <p className="text-xs font-black text-primary uppercase tracking-[0.1em] mb-1">
                    {movie.media_type === "tv" ? "Series" : "Movie"}
                  </p>
                  <p className="text-sm  line-clamp-1 leading-tight group-hover:text-white transition-colors">
                    {movie.title || movie.name}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-yellow-500 font-bold">
                    <Star size={10} fill="currentColor" />{" "}
                    {movie.vote_average?.toFixed(1)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Full Filmography Grid */}
        <section>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 ">
            <div className="flex items-center gap-4">
              <div className="h-10 w-1.5 bg-primary rounded-full" />
              <h2 className="text-3xl font-comfortaa font-bold tracking-tight">
                Full Filmography
              </h2>
            </div>
            <div className=" ">
              <div className="px-6 py-2 bg-white  inline-block   rounded-full text-sm font-semibold font-poppins text-black">
                Total Productions{" "}
                <span className="text-primary font-bold">
                  {filteredCast.length}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end flex-wrap ">
            <div className="mt-[1vw] mb-[2vw] flex flex-wrap items-center  font-poppins justify-center lg:justify-start gap-3">
              <div className="hidden lg:flex items-center gap-2 mr-4  text-gray-500 font-bold uppercase tracking-widest text-xs">
                <Filter size={14} className="text-primary" /> Filter By
              </div>

              <div className="flex bg-white/5 border border-white/10 p-1 rounded-md">
                {["all", "movie", "tv"].map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setFilter(t);
                      setYearFilter("all");
                      setVisibleCount(20);
                    }}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold cursor-pointer uppercase  transition-all ${filter === t ? "bg-primary text-black shadow-lg" : "text-gray-400 hover:text-white"}`}
                  >
                    {t === "all" ? "All" : t === "movie" ? "Movies" : "Series"}
                  </button>
                ))}
              </div>

              {/* Year Dropdown - Replaces long line of buttons */}
              <div className="relative group/select">
                <select
                  value={yearFilter}
                  onChange={(e) => {
                    setYearFilter(e.target.value);
                    setVisibleCount(20);
                  }}
                  className="appearance-none bg-white/5 border border-white/10 text-gray-400 px-6 py-2 pr-10 rounded-md text-sm font-semibold cursor-pointer uppercase  transition-all w-44"
                >
                  <option value="all" className="bg-zinc-900">
                    All Years
                  </option>
                  {years.map((y) => (
                    <option key={y} value={y} className="bg-zinc-900">
                      {y}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none group-focus-within/select:text-primary transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8 lg:gap-[1.5vw]">
            {displayedCast.map((item) => (
              <motion.div
                key={`${item.id}-grid`}
                className="group flex flex-col"
              >
                <div className="relative aspect-[2/3] rounded-md overflow-hidden mb-4 transition-all shadow-2xl group-hover:shadow-primary/90">
                  <Link
                    href={`/movie/${createSlug(item.title || item.name, item.id, item.media_type)}`}
                  >
                    {item.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                        alt={item.title || item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-gray-700 font-bold p-6 text-center text-sm italic">
                        {item.title || item.name}
                      </div>
                    )}
                  </Link>

                  <HoverOverlay
                    movie={item}
                    isSaved={watchLater.some(
                      (w) => w.id === item.id.toString(),
                    )}
                    toggleWatchLater={toggleWatchLater}
                    createSlug={createSlug}
                    mediaType={item.media_type || "movie"}
                  />

                  <div className="absolute top-3 right-3 px-3 py-1 bg-primary rounded-xl border flex items-center justify-center border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs font-semibold uppercase text-black ">
                      {item.original_language}
                    </span>
                  </div>
                </div>

                <div className="flex group-hover:hidden items-center justify-between mt-1 pt-2 border-t border-white/5">
                  <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors tracking-tight">
                    {item.title || item.name}
                  </h3>
                  {/* <p className="text-[11px] text-gray-500 font-bold uppercase tracking-tight line-clamp-1 max-w-[70%]">
                    {item.character ? item.character : "Cast"}
                  </p> */}
                  <span className="text-[11px] text-gray-600 font-black">
                    {item.release_date || item.first_air_date
                      ? (item.release_date || item.first_air_date).split("-")[0]
                      : "N/A"}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          <div
            ref={observerRef}
            className="h-24 w-full flex items-center justify-center mt-12"
          >
            {visibleCount < filteredCast.length && (
              <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce shadow-[0_0_10px_rgba(46,175,255,0.5)]" />
                <span className="text-xs font-black uppercase tracking-[0.4em] text-primary">
                  Expanding Career
                </span>
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce shadow-[0_0_10px_rgba(46,175,255,0.5)] [animation-delay:0.2s]" />
              </div>
            )}
          </div>
        </section>

        {relatedActors.length > 0 && (
          <section className=" rounded-md p-10 lg:py-[2vw]  relative overflow-hidden">
            <div className="flex items-center gap-4 mb-12">
              <div className="h-10 w-1.5 bg-primary rounded-full" />
              <h2 className="text-3xl font-comfortaa font-bold tracking-tight">
                Similar Stars
              </h2>
            </div>
            <div className="flex gap-8 overflow-x-auto pb-6 no-scrollbar snap-x">
              {relatedActors.map((person) => (
                <Link
                  key={`${person.id}-related`}
                  href={`/actor/${person.name.toLowerCase().replace(/ /g, "-")}-${person.id}`}
                  className=" bg-black hover:shadow-white  rounded-xl h-[300px] shadow-2xl aspect-[3/4] font-poppins snap-start group"
                >
                  <div className="aspect-square overflow-hidden transition-all mb-4 shadow-xl bg-zinc-800">
                    <img
                      src={`https://image.tmdb.org/t/p/w500${person.profile_path}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      alt={person.name}
                    />
                  </div>
                  <h4 className=" px-4 font- text-sm line-clamp-1  transition-colors">
                    {person.name}
                  </h4>
                  <p className="text-xs px-4  text-gray-500 uppercase font-bold mt-1 tracking-wider line-clamp-1">
                    {person.character || "Acting"}
                  </p>
                </Link>
              ))}
            </div>
            {/* <Footer></Footer> */}
          </section>
        )}
      </div>

      {/* Biography Modal */}
      <AnimatePresence>
        {showFullBio && (
          <div className="fixed inset-0 font-poppins z-9999 flex items-center justify-center px-4 py-10 pointer-events-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFullBio(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl pointer-events-auto"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onWheel={(e) => e.stopPropagation()}
              className="relative w-full max-w-5xl h-auto max-h-[90vh] bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl pointer-events-auto"
            >
              <div className="p-6 lg:p-10 border-b border-white/5 flex shrink-0 items-center justify-between bg-zinc-900/50 backdrop-blur-md">
                <div>
                  <h2 className="text-2xl lg:text-4xl font-comfortaa font-bold text-white mb-2">
                    Biography
                  </h2>
                  <p className="text-primary font-poppins   text-lg">
                    {data.name}
                  </p>
                </div>
                <button
                  onClick={() => setShowFullBio(false)}
                  className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/5"
                >
                  <X size={24} />
                </button>
              </div>

              <div
                className="p-6 lg:p-10 overflow-y-auto min-h-0 flex-1 pointer-events-auto"
                onWheel={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col lg:flex-row gap-10">
                  {/* Left Side: Bio & Gallery */}
                  <div className="flex-1 space-y-10">
                    <div>
                      <h3 className="text-xl  text-white mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-primary rounded-full" />
                        About {data.name.split(" ")[0]}
                      </h3>
                      <p className="text-gray-300 font-poppins text-lg leading-relaxed whitespace-pre-wrap">
                        {data.biography ||
                          `No detailed biography available for ${data.name}.`}
                      </p>
                    </div>

                    {data.images?.profiles?.length > 0 && (
                      <div>
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                          <div className="w-1.5 h-6 bg-primary rounded-full" />
                          Photo Gallery
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {data.images.profiles.map((img, idx) => (
                            <motion.div
                              key={idx}
                              whileHover={{ scale: 1.05 }}
                              className="aspect-2/3 rounded-xl overflow-hidden bg-zinc-800 border border-white/5 shadow-lg group"
                            >
                              <img
                                src={`https://image.tmdb.org/t/p/w500${img.file_path}`}
                                alt={`${data.name} profile ${idx + 1}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Side: Details Sidebar */}
                  <div className="lg:w-80 shrink-0 space-y-8">
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-6">
                      <h3 className="text-sm font-medium  text-primary border-b border-white/10 pb-3">
                        Personal Info
                      </h3>

                      <div className="space-y-4">
                        {data.birthday && (
                          <div className="space-y-1">
                            <p className="text-xs font-black text-gray-500 uppercase tracking-wide">
                              Date of Birth
                            </p>
                            <p className="text-white font-medium flex items-center gap-2">
                              <Cake size={14} className="text-primary" />
                              {new Date(data.birthday).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                },
                              )}
                            </p>
                          </div>
                        )}

                        {data.deathday && (
                          <div className="space-y-1">
                            <p className="text-xs font-black text-gray-500 uppercase tracking-wide">
                              Date of Death
                            </p>
                            <p className="text-white font-medium">
                              {new Date(data.deathday).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                },
                              )}
                            </p>
                          </div>
                        )}

                        {data.place_of_birth && (
                          <div className="space-y-1">
                            <p className="text-xs font-black text-gray-500 uppercase tracking-wide">
                              Place of Birth
                            </p>
                            <p className="text-white font-medium flex items-center gap-2">
                              <MapPin size={14} className="text-primary" />
                              {data.place_of_birth}
                            </p>
                          </div>
                        )}

                        <div className="space-y-1">
                          <p className="text-xs font-black text-gray-500 uppercase tracking-widest">
                            Gender
                          </p>
                          <p className="text-white font-medium">
                            {data.gender === 1
                              ? "Female"
                              : data.gender === 2
                                ? "Male"
                                : "Not specified"}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-black text-gray-500 uppercase tracking-wide">
                            Known For
                          </p>
                          <p className="text-white font-medium">
                            {data.known_for_department}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-black text-gray-500 uppercase tracking-wide">
                            Popularity Score
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${Math.min(data.popularity, 100)}%`,
                                }}
                                className="h-full bg-primary"
                              />
                            </div>
                            <span className="text-white font-bold text-xs">
                              {data.popularity?.toFixed(0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Character/Credits Quick Stats could go here */}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/5 bg-zinc-900/50 flex shrink-0 justify-end">
                <button
                  onClick={() => setShowFullBio(false)}
                  className="px-8 py-3 bg-primary text-black font-poppins font-medium   text-lg rounded-full hover:shadow-[0_0_20px_rgba(46,175,255,0.4)] transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default ActorContent;
