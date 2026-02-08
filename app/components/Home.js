'use client'
import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import Hero from "./Hero";
import MovieRow from "./MovieRow";
import Link from "next/link";
import Footer from "./Footer";
import axios from "axios";

const Home = () => {
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
  const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;

  // State for all rows
  const [rowData, setRowData] = useState({
    trendingToday: null,
    horrorMovies: null,
    sciFiMovies: null,
    topRated: null,
    comedyMovies: null,
    popularNow: null,
    actionMovies: null,
    romanceMovies: null,
    koreanMovies: null,
    indianMovies: null,
    hiddenGems: null,
    feelGoodMovies: null,
  });

  useEffect(() => {
    const fetchAllData = async () => {
      const seenIds = new Set();
      const newData = {};

      const requests = [
        {
          key: "trendingToday",
          url: `${BASE_URL}/trending/movie/day?api_key=${API_KEY}&include_adult=false`,
        },
        {
          key: "horrorMovies",
          url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=27&sort_by=popularity.desc&include_adult=false`,
        },
        {
          key: "topRated",
          url: `${BASE_URL}/movie/top_rated?api_key=${API_KEY}&include_adult=false`,
        },
        {
          key: "comedyMovies",
          url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=35&sort_by=popularity.desc&include_adult=false`,
        },
        {
          key: "popularNow",
          url: `${BASE_URL}/movie/popular?api_key=${API_KEY}&include_adult=false`,
        },
        {
          key: "sciFiMovies",
          url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=878&sort_by=popularity.desc&include_adult=false`,
        },
        {
          key: "actionMovies",
          url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=28&sort_by=popularity.desc&include_adult=false`,
        },
        {
          key: "romanceMovies",
          url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=10749&sort_by=popularity.desc&include_adult=false`,
        },
        {
          key: "koreanMovies",
          url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_original_language=ko&sort_by=popularity.desc&include_adult=false`,
        },
        {
          key: "indianMovies",
          url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_original_language=hi&sort_by=popularity.desc&include_adult=false`,
        },
        {
          key: "hiddenGems",
          url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&vote_average.gte=7&vote_count.lte=300&sort_by=vote_average.desc&include_adult=false`,
        },
        {
          key: "feelGoodMovies",
          url: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=35,10749&sort_by=popularity.desc&include_adult=false`,
        },
      ];

      const unsafeKeywords = [
        "sexy",
        "erotic",
        "porn",
        "xxx",
        "nude",
        "breast",
        "sex",
        "18+",
      ];

      // Fetch sequentially to prioritize order
      for (const req of requests) {
        try {
          const res = await axios.get(req.url);
          const results = res.data.results || [];

          const uniqueSafeMovies = results.filter((item) => {
            if (!item.id) return false;

            // Check content safety
            const title = (item.title || item.name || "").toLowerCase();
            const overview = (item.overview || "").toLowerCase();
            const isAdult = item.adult;
            const hasUnsafeKeyword = unsafeKeywords.some(
              (keyword) =>
                title.includes(keyword) || overview.includes(keyword),
            );

            if (isAdult || hasUnsafeKeyword) return false;

            // Check deduplication
            if (seenIds.has(item.id)) return false;

            return true;
          });

          // Add new IDs to seen set
          uniqueSafeMovies.forEach((m) => seenIds.add(m.id));

          newData[req.key] = uniqueSafeMovies;
        } catch (err) {
          console.error(`Failed directly fetching ${req.key}`, err);
          newData[req.key] = [];
        }
      }

      setRowData(newData);
    };

    fetchAllData();
  }, [API_KEY, BASE_URL]);

  return (
    <main className="w-full min-h-screen bg-black text-white pb-20">
      <Navbar />
      <Hero />

      <div className="flex flex-col gap-4 lg:gap-[2vw] relative z-10">
        {/* Mobile Category Tabs */}
        <div className="flex lg:hidden overflow-x-auto gap-3 px-4 pb-2 scrollbar-hide py-3">
          {[
            { name: "New", slug: "/discover/new-releases" },
            { name: "Trending", slug: "/discover/trending" },
            { name: "Sci-Fi", slug: "/discover/sci-fi-878" },
            { name: "Horror", slug: "/discover/horror-27" },
            { name: "Top Rated", slug: "/discover/top-rated" },
            { name: "Action", slug: "/discover/action-28" },
            { name: "Comedy", slug: "/discover/comedy-35" },
            { name: "Korean", slug: "/discover/korean" },
            { name: "Bollywood", slug: "/discover/bollywood" },
          ].map((tab) => (
            <Link
              key={tab.name}
              href={tab.slug}
              className="shrink-0 px-5 py-2 font-poppins rounded-full text-sm font- text-primary transition-all bg-zinc-900 text-gry-300 border border-white/5 active:scale-95 active:bg-primary active:text-white"
            >
              {tab.name}
            </Link>
          ))}
        </div>

        <MovieRow
          title="Streamers of the day"
          movies={rowData.trendingToday}
          viewAllLink="/discover/trending"
        />
        <MovieRow
          title="Horror Movies"
          movies={rowData.horrorMovies}
          viewAllLink="/discover/horror-27"
        />
          <MovieRow
          title="Sci-Fi Movies"
          movies={rowData.sciFiMovies}
          viewAllLink="/discover/sci-fi-878"
        />
        
        <MovieRow
          title="Action Movies"
          movies={rowData.actionMovies}
          viewAllLink="/discover/action-28"
        />
        <MovieRow
          title="Top Rated Movies"
          movies={rowData.topRated}
          viewAllLink="/discover/top-rated"
        />
        <MovieRow
          title="Comedy Movies"
          movies={rowData.comedyMovies}
          viewAllLink="/discover/comedy-35"
        />
        <MovieRow
          title="Popular Now"
          movies={rowData.popularNow}
          viewAllLink="/discover/popular"
        />

      

        <MovieRow
          title="Romance Movies"
          movies={rowData.romanceMovies}
          viewAllLink="/discover/romance-10749"
        />

        {/* Removed Duplicate Sci-Fi Row */}

        <MovieRow
          title="Korean Movies"
          movies={rowData.koreanMovies}
          viewAllLink="/discover/korean"
        />

        <MovieRow
          title="Indian Movies"
          movies={rowData.indianMovies}
          viewAllLink="/discover/bollywood"
        />
        <MovieRow
          title="Hidden Gems"
          movies={rowData.hiddenGems}
          viewAllLink="/discover/hidden-gems"
        />
        <MovieRow
          title="Feel Good Movies"
          movies={rowData.feelGoodMovies}
          viewAllLink="/discover/feel-good"
        />

        <Footer />
      </div>
    </main>
  );
};

export default Home;
