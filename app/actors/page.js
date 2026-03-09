"use client";
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Link from "next/link";
import {
  User,
  Search,
  TrendingUp,
  Calendar,
  Star,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;

const ActorCard = ({ actor, showMovies = false }) => {
  const knownFor = actor.known_for
    ?.slice(0, 3)
    .map((m) => m.title || m.name)
    .join(", ");

  return (
    <motion.div
      className={`group bg-white/6 ${knownFor?'lg:h-[500px]':''}  rounded-md overflow-hidden hover:shadow-2xl shadow-white/60  transition-all flex flex-col`}
    >
      <Link
        // href={`/actor/${actor.name.toLowerCase().replace(/ /g, "-")}-${actor.id}`}
        href={`/search/${actor.name.toLowerCase()}`}
        className="relative aspect-[3/4] overflow-hidden bg-zinc-800"
      >
        {actor.profile_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w500${actor.profile_path}`}
            alt={actor.name}
            className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-700 bg-zinc-900">
            <User size={60} strokeWidth={1} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <Link
          href={`/actor/${actor.name.toLowerCase().replace(/ /g, "-")}-${actor.id}`}
          className="font-medium font-poppins text-lg line-clamp-1 group-hover:text-primary transition-colors inline-block"
        >
          {actor.name}
        </Link>
        <p className="text-xs text-gray-400 uppercase font-poppins font-medium  mt-[0.1vw] mb-[0.2vw]">
          {actor.known_for_department}
        </p>

        {showMovies && actor.known_for && (
          <div className="mt-auto pt-3 border-t border-white/5">
            <p className="text-sm text-white font-semibold mb-1 font-poppins uppercase ">
              Known For
            </p>
            <p className="text-sm font-medium text-white/80 font-poppins line-clamp-2 ">
              {knownFor || "Various Projects"}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const SectionHeader = ({ title, icon: Icon, subtitle }) => (
  <div className="mb-8 border-l-4 border-primary pl-4">
    <div className="flex items-center gap-3 mb-1">
      {/* {Icon && <Icon className="text-primary" size={24} />} */}
      <h2 className="text-2xl lg:text-3xl font-comfortaa font-bold tracking-tight text-white">
        {title}
      </h2>
    </div>
    {subtitle && (
      <p className="text-gray-400 text-sm font-poppins">{subtitle}</p>
    )}
  </div>
);

const SkeletonActor = () => (
  <div className="bg-zinc-900/40 rounded-2xl border border-white/5 overflow-hidden animate-pulse">
    <div className="aspect-[3/4] bg-zinc-800" />
    <div className="p-4">
      <div className="h-5 bg-zinc-800 rounded w-3/4 mb-2" />
      <div className="h-3 bg-zinc-800 rounded w-1/2" />
    </div>
  </div>
);

const ActorsPage = () => {
  const [trending, setTrending] = useState([]);
  const [spotlight, setSpotlight] = useState([]);
  const [popular, setPopular] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("acting");
  const [genderFilter, setGenderFilter] = useState("all");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const observerRef = useRef();

  const today = new Date();
  const monthDay = `${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

  const tabs = [
    { id: "acting", label: "Famous Stars" },
    { id: "directing", label: "Directors" },
    { id: "production", label: "Producers" },
    { id: "writing", label: "Writers" },
  ];

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      // Deep fetch to find high-quality content across 10+ pages for a rich pool
      const [t1, t2, t3, p1, p2, p3, p4, p5, p6, p7, td1] = await Promise.all([
        axios.get(`${BASE_URL}/trending/person/week?api_key=${API_KEY}&page=1`),
        axios.get(`${BASE_URL}/trending/person/week?api_key=${API_KEY}&page=2`),
        axios.get(`${BASE_URL}/trending/person/week?api_key=${API_KEY}&page=3`),
        axios.get(`${BASE_URL}/person/popular?api_key=${API_KEY}&page=1`),
        axios.get(`${BASE_URL}/person/popular?api_key=${API_KEY}&page=2`),
        axios.get(`${BASE_URL}/person/popular?api_key=${API_KEY}&page=3`),
        axios.get(`${BASE_URL}/person/popular?api_key=${API_KEY}&page=4`),
        axios.get(`${BASE_URL}/person/popular?api_key=${API_KEY}&page=5`),
        axios.get(`${BASE_URL}/person/popular?api_key=${API_KEY}&page=6`),
        axios.get(`${BASE_URL}/person/popular?api_key=${API_KEY}&page=7`),
        axios.get(`${BASE_URL}/trending/person/day?api_key=${API_KEY}&page=1`),
      ]);

      const allTrending = [...t1.data.results, ...t2.data.results, ...t3.data.results, ...td1.data.results];
      const allPopular = [...p1.data.results, ...p2.data.results, ...p3.data.results, ...p4.data.results, ...p5.data.results, ...p6.data.results, ...p7.data.results];

      // 1. Trending Actors
      const filteredTrending = allTrending
        .filter(item => 
          item.profile_path && 
          item.known_for_department === "Acting" && 
          // item.adult !== true &&
          (item.popularity > 9)
        );
      
      const uniqueTrending = Array.from(new Map(filteredTrending.map(item => [item.id, item])).values()).slice(0, 25);
      setTrending(uniqueTrending);

      // 2. Main Popular Grid
      const initialPopular = p1.data.results?.filter(a => a.known_for_department === "Acting" && a.adult !== true) || [];
      // Deduplicate to be safe
      const uniqueInitial = Array.from(new Map(initialPopular.map(item => [item.id, item])).values());
      setPopular(uniqueInitial);

      // 3. Born Today Section - Search Maximum Depth (Top 120 people total)
      const detailPool = Array.from(new Map([...allPopular, ...allTrending].map(item => [item.id, item])).values()).slice(0, 120); 
      
      const detailsPromises = detailPool.map(actor => 
        axios.get(`${BASE_URL}/person/${actor.id}?api_key=${API_KEY}`)
      );
      
      const detailsResults = await Promise.allSettled(detailsPromises);
      const candidates = detailsResults
        .filter(res => res.status === "fulfilled")
        .map(res => res.value.data)
        .filter(person => 
          person.profile_path && 
          person.known_for_department === "Acting" && 
          person.adult !== true
        );

      // Robust check for March 9
      const realTodayBirthdays = candidates
        .filter(p => {
          if (!p.birthday) return false;
          const parts = p.birthday.split("-");
          return parts[1] === monthDay.split("-")[0] && parts[2] === monthDay.split("-")[1];
        });

      if (realTodayBirthdays.length > 0) {
        setSpotlight(realTodayBirthdays.sort((a,b) => b.popularity - a.popularity).slice(0, 10));
      } else {
        // Fallback: Global Industry Icons spotlight from candidates
        setSpotlight(candidates.slice(0, 12));
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching actor data:", error);
      setLoading(false);
    }
  };

  const fetchMorePopular = async () => {
    if (!hasMore || searchQuery) return;
    try {
      const nextPage = page + 1;
      const res = await axios.get(
        `${BASE_URL}/person/popular?api_key=${API_KEY}&page=${nextPage}`,
      );
      const newItems = (res.data.results || [])
        .filter(a => a.adult !== true && (activeTab === "acting" ? a.known_for_department === "Acting" : true));
      
      if (newItems.length === 0 && (res.data.results || []).length > 0) {
        setPage(nextPage);
        return; 
      }

      if (newItems.length === 0) {
        setHasMore(false);
      } else {
        setPopular((prev) => {
          const combined = [...prev, ...newItems];
          // Robust deduplication
          return Array.from(new Map(combined.map(item => [item.id, item])).values());
        });
        setPage(nextPage);
      }
    } catch (error) {
      console.error("Error fetching more actors:", error);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (loading) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) fetchMorePopular();
    });
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [loading, hasMore, page, searchQuery]);

  useEffect(() => {
    const fetchSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      try {
        setIsSearching(true);
        const res = await axios.get(
          `${BASE_URL}/search/person?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}`
        );
        
        // Apply strict filters to search results
        const filtered = (res.data.results || []).filter(item => 
          item.profile_path && 
          item.known_for_department === "Acting" && 
          item.adult !== true
          // No popularity threshold for search - if user searched for them, they likely want to see them
        );
        
        setSearchResults(filtered);
        setIsSearching(false);
      } catch (error) {
        console.error("Error searching actors:", error);
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(fetchSearch, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const filteredPopular = popular.filter((actor) => {
    const matchesTab = actor.known_for_department.toLowerCase() === activeTab;
    const matchesGender = genderFilter === "all" || 
      (genderFilter === "female" && actor.gender === 1) || 
      (genderFilter === "male" && actor.gender === 2);
    const matchesSearch = actor.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesTab && matchesGender && matchesSearch;
  });

  const displayList = searchQuery ? searchResults : filteredPopular;

  return (
    <main className="w-full min-h-screen bg-black text-white selection:bg-primary/30">
      <Navbar />

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 px-4  lg:px-[3vw]   overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/20 via-transparent to-black" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl lg:text-6xl font-comfortaa font-bold mb-4"
          >
            Discover <span className="text-primary">Actors</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-lg mb-10 font-poppins"
          >
            Explore actors from your favorite movies and series
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative max-w-2xl mx-auto group"
          >
            <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full group-focus-within:bg-primary/20 transition-all" />
            <div className="relative flex items-center bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 pl-6 focus-within:border-primary/50 transition-all shadow-2xl">
              <Search
                className="text-gray-500 group-focus-within:text-primary transition-colors"
                size={20}
              />
              <input
                type="text"
                placeholder="Search actors by name..."
                className="w-full bg-transparent border-none outline-none px-4 py-3 text-white placeholder:text-gray-600 font-poppins"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {!searchQuery && (
        <div className="px-4  lg:px-[3vw]   space-y-24 pb-20">
          {/* Trending Section */}
          <section>
            <SectionHeader
              title="Trending Actors"
              icon={TrendingUp}
              subtitle="The most popular stars this week"
            />
            <div className="flex gap-4 overflow-x-auto pb-8 snap-x no-scrollbar">
              {loading
                ? Array.from({ length: 9 }).map((_, i) => (
                    <div
                      key={i}
                      className="min-w-[200px] aspect-[3/4] rounded-2xl bg-zinc-900 animate-pulse"
                    />
                  ))
                : trending.map((actor) => (
                    <div
                      key={`${actor.id}-trending`}
                      className="min-w-[180px] lg:min-w-[220px] snap-start"
                    >
                      <ActorCard actor={actor} />
                    </div>
                  ))}
              {!loading && trending.length === 0 && (
                <div className="w-full text-center py-20 text-gray-500 italic font-medium">
                  Searching for trending Hollywood icons...
                </div>
              )}
            </div>
          </section>

          {/* Born Today Section */}
          {/* Born Today Section */}
          {/* {spotlight.length > 0 && (
            <section className="bg-zinc-900/20 rounded-[2.5rem] p-8 lg:p-12 border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full" />
              <SectionHeader
                title="Born Today"
                icon={Calendar}
                subtitle="Celebrating birthdays of industry icons"
              />
              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="min-w-[150px] h-[80px] rounded-xl bg-zinc-800 animate-pulse"
                      />
                    ))
                  : spotlight.map((actor) => (
                      <Link
                        key={`${actor.id}-born`}
                        href={`/actor/${actor.name.toLowerCase().replace(/ /g, "-")}-${actor.id}`}
                        className="flex items-center gap-4 bg-black/40 backdrop-blur-md border border-white/5 p-3 rounded-2xl min-w-[260px] hover:bg-primary/10 hover:border-primary/30 transition-all group shrink-0 shadow-lg"
                      >
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                          <img
                            src={`https://image.tmdb.org/t/p/w200${actor.profile_path}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            alt={actor.name}
                          />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors text-white">
                            {actor.name}
                          </h3>
                          <p className="text-[10px] text-gray-500 uppercase tracking-tight">
                            {actor.birthday && actor.birthday.includes(`-${monthDay}`) 
                              ? `Celebrating Today` 
                              : actor.birthday 
                                ? `Born ${new Date(actor.birthday.split("-")[0], actor.birthday.split("-")[1] - 1, actor.birthday.split("-")[2]).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`
                                : "Trending Icon"}
                          </p>
                        </div>
                      </Link>
                    ))}
              </div>
            </section>
          )} */}
        </div>
      )}

      <div className="px-4 lg:px-[3vw] space-y-24 pb-20">
        {/* Popular Grid */}
        <section className="">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <SectionHeader
              title={searchQuery ? "Search Results" : "All Stars"}
              icon={searchQuery ? Search : Star}
              subtitle={searchQuery ? `Searching for "${searchQuery}"...` : "Browse the world's most recognizable performers"}
            />

            {!searchQuery && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setPage(1);
                      }}
                      className={`px-5 py-2 rounded-full text-sm font-semibold uppercase font-poppins  transition-all border whitespace-nowrap ${
                        activeTab === tab.id
                          ? "bg-primary border-primary text-black shadow-lg shadow-primary/20"
                          : "bg-transparent border-white/10 text-gray-300 hover:border-white/30 hover:text-white"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm uppercase  text-white font-poppins font-semibold ml-1">Gender:</span>
                  <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-white/5">
                    {["all", "male", "female"].map((g) => (
                      <button
                        key={g}
                        onClick={() => setGenderFilter(g)}
                        className={`px-4 py-1.5 rounded-full text-sm font-comfortaa font-semibold  uppercase  transition-all ${
                          genderFilter === g
                            ? "bg-primary/20 text-primary border border-primary/20"
                            : "text-gray-300 hover:text-gray-300"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 lg:gap-8">
            <AnimatePresence mode="popLayout">
              {loading || isSearching
                ? Array.from({ length: 10 }).map((_, i) => (
                    <SkeletonActor key={i} />
                  ))
                : displayList.map((actor) => (
                    <motion.div
                      key={actor.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ActorCard actor={actor} showMovies={true} />
                    </motion.div>
                  ))}
            </AnimatePresence>
          </div>

          {!loading && !isSearching && displayList.length === 0 && (
            <div className="py-20 text-center w-full">
              <User className="mx-auto text-gray-800 mb-4" size={64} />
              <h3 className="text-xl font-bold text-gray-500 text-white">No actors found</h3>
              <p className="text-gray-600">Try adjusting your filters or search query</p>
            </div>
          )}

          {/* Sentinel for Infinite Scroll */}
          {hasMore && !loading && !searchQuery && (
            <div
              ref={observerRef}
              className="h-40 w-full flex items-center justify-center font-black uppercase tracking-[0.4em] text-[10px] text-primary"
            >
              <div className="flex gap-2 items-center">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                Exploring more icons
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default ActorsPage;
