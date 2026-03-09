"use client";
/**
 * ActorContent.jsx - Updated 2026-03-08
 * Fixed year filter UI (dropdown) and improved Similar Stars logic
 */
import React, { useState, useEffect, useRef } from "react";
import Navbar from "../../components/Navbar";
import Link from "next/link";
import { Cake, MapPin, Star, ChevronRight, Filter, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
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
  const knownFor = sortedCast.slice(0, 8);

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
  const filteredCast = sortedCast.filter((item) => {
    const matchesType = filter === "all" || item.media_type === filter;
    const date = item.release_date || item.first_air_date;
    const year = date ? date.split("-")[0] : null;
    const matchesYear = yearFilter === "all" || year === yearFilter;
    return matchesType && matchesYear;
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
      const bestProject = sortedCast.find(item => {
        const role = (item.character || "").toLowerCase();
        return !role.includes("self") && !role.includes("host") && !role.includes("guest");
      }) || knownFor[0];

      if (!bestProject) return;

      try {
        const res = await fetch(
          `${BASE_URL}/${bestProject.media_type}/${bestProject.id}/credits?api_key=${API_KEY}`,
        );
        const creditData = await res.json();
        
        // Filter the project's cast to avoid non-actor talent
        const related = creditData.cast
          ?.filter((c) => {
            const isSelf = c.id === data.id;
            const isActor = c.known_for_department === "Acting";
            const role = (c.character || "").toLowerCase();
            const isNotHost = !role.includes("self") && !role.includes("host") && !role.includes("presenter");
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

  return (
    <main className="w-full min-h-screen bg-black text-white selection:bg-primary/30 pb-20">
      <Navbar />

      {/* Hero Section */}
      <div className="relative w-full h-[60vh] lg:h-[81vh] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={`https://image.tmdb.org/t/p/original${data.images?.profiles?.[0]?.file_path || data.profile_path}`}
            alt=""
            className="w-full h-full object-cover opacity-30 blur-sm scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
        </div>

        <div className="absolute bottom-0 left-0 w-full px-4 lg:px-[5vw] pb-12">
          <div className="flex flex-col lg:flex-row items-center lg:items-end gap-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-52 lg:w-72 aspect-[3/4] rounded-2xl overflow-hidden border-4 border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] shrink-0 bg-zinc-900"
            >
              <img
                src={`https://image.tmdb.org/t/p/w500${data.profile_path}`}
                alt={data.name}
                className="w-full h-full object-cover"
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
                  <p
                    className={`text-gray-300 transition-all font-poppins leading-relaxed text-lg ${showFullBio ? "" : "line-clamp-3"}`}
                  >
                    {data.biography || "No biography available for this actor."}
                  </p>
                  {data.biography?.length > 200 && (
                    <button
                      onClick={() => setShowFullBio(!showFullBio)}
                      className="text-primary font-bold mt-4 flex items-center gap-1 group/btn"
                    >
                      {showFullBio ? "Read Less" : "Read Full Biography"}
                      <ChevronRight
                        size={18}
                        className={`transition-transform ${showFullBio ? "rotate-90" : "group-hover/btn:translate-x-1"}`}
                      />
                    </button>
                  )}
                </div>

                {/* Filters Bar */}
                <div className="mt-12 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                  <div className="flex items-center gap-2 mr-4 text-gray-500 font-bold uppercase tracking-widest text-[10px]">
                    <Filter size={14} className="text-primary" /> Filter By
                  </div>
                  
                  <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl">
                    {["all", "movie", "tv"].map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setFilter(t);
                          setYearFilter("all");
                          setVisibleCount(20);
                        }}
                        className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === t ? "bg-primary text-black shadow-lg" : "text-gray-400 hover:text-white"}`}
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
                      className="appearance-none bg-white/5 border border-white/10 text-gray-400 px-6 py-2 pr-10 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer outline-none focus:border-primary focus:text-white transition-all w-44"
                    >
                      <option value="all" className="bg-zinc-900">All Years</option>
                      {years.map((y) => (
                        <option key={y} value={y} className="bg-zinc-900">
                          {y}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none group-focus-within/select:text-primary transition-colors" />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-[5vw] mt-24 space-y-32">
        {/* Iconic Projects Section */}
        <section>
          <div className="flex items-center gap-4 mb-10">
            <div className="h-10 w-1.5 bg-primary rounded-full" />
            <h2 className="text-3xl font-comfortaa font-bold tracking-tight">
              Iconic Projects
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 lg:gap-6">
            {knownFor.map((movie) => (
              <Link
                key={`${movie.id}-iconic`}
                href={`/${movie.media_type === "tv" ? "tv" : "movie"}/${createSlug(movie.title || movie.name, movie.id, movie.media_type)}`}
                className="group relative aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 hover:border-primary/50 transition-all shadow-xl"
              >
                {movie.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w400${movie.poster_path}`}
                    alt={movie.title || movie.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-700 text-[10px] text-center p-2 italic">
                    {movie.title || movie.name}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1">
                    {movie.media_type === "tv" ? "Series" : "Movie"}
                  </p>
                  <p className="text-sm font-bold line-clamp-2 leading-tight group-hover:text-white transition-colors">
                    {movie.title || movie.name}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-yellow-500 font-bold">
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
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-4">
              <div className="h-10 w-1.5 bg-primary rounded-full" />
              <h2 className="text-3xl font-comfortaa font-bold tracking-tight">
                Full Filmography
              </h2>
            </div>
            <div className="px-6 py-2 bg-zinc-900 border border-white/5 rounded-full text-xs font-bold uppercase tracking-widest text-gray-400">
              <span className="text-primary">{filteredCast.length}</span> Total
              Productions
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8 lg:gap-10">
            {displayedCast.map((item) => (
              <motion.div
                key={`${item.id}-grid`}
                whileHover={{ y: -10 }}
                className="group flex flex-col"
              >
                <div className="relative aspect-[2/3] rounded-[2rem] overflow-hidden mb-4 bg-zinc-900 border border-white/5 group-hover:border-primary/50 transition-all shadow-2xl group-hover:shadow-primary/10">
                  <Link
                    href={`/${item.media_type === "tv" ? "tv" : "movie"}/${createSlug(item.title || item.name, item.id, item.media_type)}`}
                  >
                    {item.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                        alt={item.title || item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
                  />

                  <div className="absolute top-3 right-3 px-3 py-1 bg-black/80 backdrop-blur-xl rounded-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] font-black uppercase text-primary tracking-widest">
                      {item.media_type === "tv" ? "Series" : "Movie"}
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors tracking-tight">
                  {item.title || item.name}
                </h3>
                <div className="flex items-center justify-between mt-1 pt-2 border-t border-white/5">
                  <p className="text-[11px] text-gray-500 font-bold uppercase tracking-tight line-clamp-1 max-w-[70%]">
                    {item.character ? item.character : "Cast"}
                  </p>
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
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">
                  Expanding Career
                </span>
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce shadow-[0_0_10px_rgba(46,175,255,0.5)] [animation-delay:0.2s]" />
              </div>
            )}
          </div>
        </section>

        {relatedActors.length > 0 && (
          <section className="bg-zinc-900/10 rounded-[3rem] p-10 lg:p-16 border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full" />
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
                  className="min-w-[150px] lg:min-w-[200px] snap-start group"
                >
                  <div className="aspect-square rounded-full overflow-hidden border-2 border-white/5 group-hover:border-primary transition-all mb-4 shadow-xl bg-zinc-800">
                    <img
                      src={`https://image.tmdb.org/t/p/w300${person.profile_path}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      alt={person.name}
                    />
                  </div>
                  <h4 className="text-center font-bold text-base line-clamp-1 group-hover:text-primary transition-colors">
                    {person.name}
                  </h4>
                  <p className="text-[10px] text-center text-gray-500 uppercase font-bold mt-1 tracking-wider line-clamp-1">
                    {person.character || "Acting"}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
};

export default ActorContent;
