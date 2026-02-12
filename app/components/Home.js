"use client";
import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import Hero from "./Hero";
import MovieRow from "./MovieRow";
import Link from "next/link";
import Footer from "./Footer";
import axios from "axios";

const Home = ({ initialData = {} }) => {
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
  const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;

  // Sync ref for deduplication across async fetches
  const seenIdsRef = React.useRef(new Set());
  // Prevent duplicate fetches
  const fetchingKeysRef = React.useRef(new Set());

  // Storage for row data - initialize with server data
  const [rowData, setRowData] = useState(initialData);

  // Mark server-fetched keys as "already fetching/fetched"
  useEffect(() => {
    Object.keys(initialData).forEach((key) => {
      fetchingKeysRef.current.add(key);
      // Populate seen IDs for deduplication
      initialData[key].forEach((movie) => {
        if (movie.id) seenIdsRef.current.add(movie.id);
      });
    });
  }, [initialData]);

  const unsafeKeywords = ["porn", "xxx", "erotic", "nude", "18+", "nsfw"];

  const fetchRowData = React.useCallback(
    async (key, url) => {
      if (fetchingKeysRef.current.has(key)) return;
      fetchingKeysRef.current.add(key);

      try {
        const allUniqueMovies = [];
        let page = 1;
        const MAX_PAGES = 8; // Scan more pages to find unique content

        while (allUniqueMovies.length < 15 && page <= MAX_PAGES) {
          const separator = url.includes("?") ? "&" : "?";
          const res = await axios.get(`${url}${separator}page=${page}`);
          const results = res.data.results || [];

          if (results.length === 0) break;

          for (const item of results) {
            if (!item.id || item.adult) continue;

            const title = (item.title || item.name || "").toLowerCase();
            const overview = (item.overview || "").toLowerCase();
            const hasUnsafeKeyword = unsafeKeywords.some(
              (keyword) =>
                title.includes(keyword) || overview.includes(keyword),
            );

            if (hasUnsafeKeyword) continue;

            // Sync deduplication check using Ref
            if (seenIdsRef.current.has(item.id)) continue;

            // Mark as seen immediately so no other row (or item in this row) uses it
            seenIdsRef.current.add(item.id);
            allUniqueMovies.push(item);

            if (allUniqueMovies.length >= 20) break;
          }

          page++;
          // If the URL already specifies a page, or we have plenty of movies, stop
          if (url.includes("page=") || allUniqueMovies.length >= 20) break;
        }

        setRowData((prev) => ({ ...prev, [key]: allUniqueMovies }));
      } catch (err) {
        console.error(`Failed fetching ${key}`, err);
        // Allow retry if it failed (don't keep in fetchingKeysRef if error)
        fetchingKeysRef.current.delete(key);
        setRowData((prev) => ({ ...prev, [key]: [] }));
      }
    },
    [API_KEY, BASE_URL],
  );

  // Lazy loading wrapper for MovieRow
  const LazyMovieRow = React.memo(
    ({
      title,
      url,
      viewAllLink,
      rowKey,
      priority = false,
      isPriority = false,
    }) => {
      const [isVisible, setIsVisible] = useState(priority);
      const rowRef = React.useRef(null);

      useEffect(() => {
        if (priority) return;

        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
              observer.disconnect();
            }
          },
          { rootMargin: "0px" },
        );

        if (rowRef.current) observer.observe(rowRef.current);
        return () => observer.disconnect();
      }, [priority]);

      useEffect(() => {
        if (isVisible && !rowData[rowKey]) {
          fetchRowData(rowKey, url);
        }
      }, [isVisible, rowKey, url, fetchRowData]);

      return (
        <div ref={rowRef} className="min-h-[380px]">
          <MovieRow
            title={title}
            movies={rowData[rowKey]}
            viewAllLink={viewAllLink}
            isPriority={isPriority}
          />
        </div>
      );
    },
  );

  return (
    <main className="w-full min-h-screen bg-black text-white pb-20">
      <Navbar />
      <Hero initialMovies={initialData.hero} />

      <div className="flex flex-col gap-4 lg:gap-[4vw] relative z-10">
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

        <LazyMovieRow
          priority={true}
          isPriority={true}
          rowKey="trendingToday"
          title="Streamers of the day"
          url={`${BASE_URL}/trending/movie/day?api_key=${API_KEY}&include_adult=false`}
          viewAllLink="/discover/trending"
        />
        <LazyMovieRow
          priority={true}
          isPriority={true}
          rowKey="horrorMovies"
          title="Horror Movies"
          url={`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=27&sort_by=popularity.desc&include_adult=false`}
          viewAllLink="/discover/horror-27"
        />
        <LazyMovieRow
          priority={true}
          isPriority={true}
          rowKey="sciFiMovies"
          title="Sci-Fi Movies"
          url={`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=878&sort_by=popularity.desc&include_adult=false`}
          viewAllLink="/discover/sci-fi-878"
        />

        <LazyMovieRow
          rowKey="movies2024"
          title="Best of 2024"
          url={`${BASE_URL}/discover/movie?api_key=${API_KEY}&primary_release_year=2024&sort_by=popularity.desc&include_adult=false`}
          viewAllLink="/discover/new-releases"
        />
        <LazyMovieRow
          rowKey="movies2025"
          title="Top of 2025"
          url={`${BASE_URL}/discover/movie?api_key=${API_KEY}&primary_release_year=2025&sort_by=popularity.desc&include_adult=false`}
          viewAllLink="/discover/new-releases"
        />
        <LazyMovieRow
          rowKey="movies2026"
          title="Upcoming 2026"
          url={`${BASE_URL}/discover/movie?api_key=${API_KEY}&primary_release_year=2026&sort_by=popularity.desc&include_adult=false`}
          viewAllLink="/discover/new-releases"
        />

        <LazyMovieRow
          rowKey="actionMovies"
          title="Action Movies"
          url={`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=28&sort_by=popularity.desc&include_adult=false`}
          viewAllLink="/discover/action-28"
        />
        <LazyMovieRow
          rowKey="topRated"
          title="Top Rated Movies"
          url={`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&include_adult=false`}
          viewAllLink="/discover/top-rated"
        />
        <LazyMovieRow
          rowKey="comedyMovies"
          title="Comedy Movies"
          url={`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=35&sort_by=popularity.desc&include_adult=false`}
          viewAllLink="/discover/comedy-35"
        />
        <LazyMovieRow
          rowKey="popularNow"
          title="Popular Now"
          url={`${BASE_URL}/movie/popular?api_key=${API_KEY}&include_adult=false`}
          viewAllLink="/discover/popular"
        />
        <LazyMovieRow
          rowKey="romanceMovies"
          title="Romance Movies"
          url={`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=10749&sort_by=popularity.desc&include_adult=false`}
          viewAllLink="/discover/romance-10749"
        />
        <LazyMovieRow
          rowKey="koreanMovies"
          title="Korean Movies"
          url={`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_original_language=ko&sort_by=popularity.desc&include_adult=false`}
          viewAllLink="/discover/korean"
        />
        <LazyMovieRow
          rowKey="indianMovies"
          title="Indian Movies"
          url={`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_original_language=hi&sort_by=popularity.desc&include_adult=false`}
          viewAllLink="/discover/bollywood"
        />
        <LazyMovieRow
          rowKey="hiddenGems"
          title="Hidden Gems"
          url={`${BASE_URL}/discover/movie?api_key=${API_KEY}&vote_average.gte=7&vote_count.lte=300&sort_by=vote_average.desc&include_adult=false`}
          viewAllLink="/discover/hidden-gems"
        />
        <LazyMovieRow
          rowKey="feelGoodMovies"
          title="Feel Good Movies"
          url={`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=35,10749&sort_by=popularity.desc&include_adult=false`}
          viewAllLink="/discover/feel-good"
        />

        <Footer />
      </div>
    </main>
  );
};

export default Home;
