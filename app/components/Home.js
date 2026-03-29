"use client";
import React, { useEffect, useState } from "react";
import Navbar from "./Navbar";
import Hero from "./Hero";
import MovieRow from "./MovieRow";
import Link from "next/link";
import Footer from "./Footer";
import axios from "axios";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Home = ({ initialData = {} }) => {
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
  const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;

  // Sync ref for deduplication across async fetches
  const seenIdsRef = React.useRef(new Set());
  // Prevent duplicate fetches
  const fetchingKeysRef = React.useRef(new Set());

  // Storage for row data - initialize with server data if available
  const [rowData, setRowData] = useState(() => {
    if (initialData.rows) {
      return initialData.rows;
    }
    return {};
  });

  // Mark server-fetched keys as "already fetching/fetched" and sync deduplication
  useEffect(() => {
    if (initialData.rows) {
      Object.keys(initialData.rows).forEach((key) => {
        const row = initialData.rows[key];
        if (row && row.results) {
          fetchingKeysRef.current.add(key);
          row.results.forEach((movie) => {
            if (movie.id) seenIdsRef.current.add(movie.id);
          });
        }
      });
      setRowData(initialData.rows);
    }
  }, [initialData.rows]);

  const unsafeKeywords = ["porn", "xxx", "erotic", "nude", "18+", "nsfw"];

  const fetchRowData = React.useCallback(
    async (key, url) => {
      if (fetchingKeysRef.current.has(key)) return;
      fetchingKeysRef.current.add(key);

      try {
        const allUniqueMovies = [];
        let page = 1;
        const MAX_PAGES = 3; // Reduced from 8 to speed up loading

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

        // Sort results by newest to oldest
        allUniqueMovies.sort((a, b) => {
          const dateA = a.release_date || a.first_air_date || "0000-00-00";
          const dateB = b.release_date || b.first_air_date || "0000-00-00";
          return dateB.localeCompare(dateA);
        });

        setRowData((prev) => ({
          ...prev,
          [key]: { results: allUniqueMovies, keywords: [] },
        }));
      } catch (err) {
        console.error(`Failed fetching ${key}`, err);
        // Allow retry if it failed (don't keep in fetchingKeysRef if error)
        fetchingKeysRef.current.delete(key);
        setRowData((prev) => ({
          ...prev,
          [key]: { results: [], keywords: [] },
        }));
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
            movies={rowData[rowKey]?.results || []}
            keywords={rowData[rowKey]?.keywords || []}
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
      <Hero initialMovies={initialData.rows?.hero?.results || []} />
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
          // { name: "Bollywood", slug: "/discover/bollywood" },
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
      <div className="flex flex-col gap-4 lg:gap-[1vw] relative z-10">
        {/* Mobile Category Tabs */}

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
        {/* <LazyMovieRow
          rowKey="movies2026"
          title="Upcoming 2026"
          url={`${BASE_URL}/discover/movie?api_key=${API_KEY}&primary_release_year=2026&sort_by=popularity.desc&include_adult=false`}
          viewAllLink="/discover/new-releases"
        /> */}

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

        {/* Simplified About Section */}
        <section className="px-4 lg:px-[2vw] py-16 font-poppins lg:py-20 ">
          <div className=" mx-auto text-center space-y-8">
            <h2 className="text-3xl lg:text-5xl font-medium font-comfortaa text-white mb-6">
              About{" "}
              <span className="font-comfortaa text-transparent bg-gradient-to-tr from-[#b622a7] to-primary bg-clip-text ">
                Movieslab
              </span>
            </h2>
            <p className="text-xl lg:text-2xl  text-gray-300 italic font-light">
              Your Ultimate Free Streaming Destination @MoviesLab
            </p>

            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                  <svg
                    className="w-8 h-8 text-primary"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-white">
                  100,000+ Movies
                </h3>
                <p className="text-gray-400">Huge library of HD content</p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                  <svg
                    className="w-8 h-8 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-white">
                  No Registration
                </h3>
                <p className="text-gray-400">Watch instantly without signup</p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                  <svg
                    className="w-8 h-8 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-white">
                  Fast Streaming
                </h3>
                <p className="text-gray-400">1080p HD with no buffering</p>
              </div>
            </div>

            <div className="bg-white/8 lg:mt-[5vw]  justify-between items-center flex-wrap backdrop-blur-sm rounded-3xl flex p-4 gap-10 lg:gap-0 py-10 border border-white/10 mt-12">
              <div className="w-full lg:w-1/3">
                <h2 className="text-2xl lg:text-3xl font-medium text-white mb-6">
                  Why Choose{" "}
                  <span className="font-comfortaa text-transparent bg-gradient-to-tr from-[#b622a7] to-primary bg-clip-text ">
                    Movieslab
                  </span>{" "}
                  for Free Streaming?
                </h2>

                <div className="flex flex-wrap gap-3 justify-center mt-8">
                  {[
                    "Free Movies Online",
                    "HD Streaming",
                    "No Registration",
                    "TV Series",
                    "1080p Quality",
                    "Latest Movies",
                  ].map((keyword, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-primary/10 rounded-full text-sm text-gray-300 border border-primary/20"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-4 grid md:grid-cols-2 text-left text-gray-300 w-full lg:w-2/3 font-light text-lg leading-relaxed">
                <div>
                  <p className="p-[3vw]">
                    Welcome to{" "}
                    <strong className="text-primary font-comfortaa">
                      Movieslab
                    </strong>
                    , the premier platform for streaming high-definition movies
                    and TV series absolutely free. We offer a vast library of
                    over <strong>100,000+ titles</strong> in stunning{" "}
                    <strong>1080p HD </strong>.
                  </p>
                  <p className="p-[3vw]">
                    At{" "}
                    <span className="text-primary font-comfortaa">
                      Movieslab
                    </span>
                    , we believe entertainment should be accessible to everyone.
                    Watch movies online without registration or subscription
                    fees. Enjoy seamless viewing with vidsrc fast, buffer-free
                    streaming servers.
                  </p>
                </div>
                <div>
                  <p className="p-[3vw]">
                    Whether you're into{" "}
                    <Link
                      href="/discover/action"
                      className="text-primary hover:underline font-medium"
                    >
                      <>Action</>
                    </Link>
                    ,{" "}
                    <Link
                      href="/discover/horror"
                      className="text-primary hover:underline font-medium"
                    >
                      <>Horror</>
                    </Link>
                    ,{" "}
                    <Link
                      href="/discover/romance"
                      className="text-primary hover:underline font-medium"
                    >
                      <>Romance</>
                    </Link>
                    , or{" "}
                    <Link
                      href="/discover/sci-fi"
                      className="text-primary hover:underline font-medium"
                    >
                      <>Sci-Fi</>
                    </Link>
                    , MoviesLab has something for every movie enthusiast. Stay
                    updated with daily additions to our collection.
                  </p>
                  <p className="p-[3vw]">
                    Explore curated collections including{" "}
                    <Link
                      href="/discover/trending"
                      className="text-primary hover:underline font-medium"
                    >
                      trending movies
                    </Link>
                    ,{" "}
                    <Link
                      href="/discover/top-rated"
                      className="text-primary hover:underline font-medium"
                    >
                      top-rated films
                    </Link>
                    , and{" "}
                    <Link
                      href="/discover/new-releases"
                      className="text-primary hover:underline font-medium"
                    >
                      latest releases
                    </Link>
                    . Join millions of users who trust Movieslab for their daily
                    entertainment needs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 lg:px-[2vw] py-12 font-poppins bg-zinc-950 border-t border-white/5">
          <div className=" mx-auto">
            <h3 className="text-3xl   text-white mb-8">
              Explore{" "}
              <span className="text-priary font-comfortaa text-transparent bg-gradient-to-tr from-[#b622a7] to-primary bg-clip-text ">
                Movieslab
              </span>
            </h3>

            <div className="space-y-8">
              {/* Dynamic Trending Keywords */}
              {initialData.trendingKeywords &&
                initialData.trendingKeywords.length > 0 && (
                  <div>
                    <h4 className="md:text-xl md:pt-[3vw] font-semibold text-primary/90 font-comfortaa   mb-4 ">
                      Trending Now
                    </h4>
                    <div className="flex flex-wrap gap-2 md:gap-[1vw]   w-full md:w-[90%]">
                      {initialData.trendingKeywords.map((keyword) => (
                        <Link
                          key={keyword.id}
                          href={`/search/kw-${keyword.id}-${encodeURIComponent(keyword.name.replace(/\s+/g, "-").toLowerCase())}`}
                          className="px-4 py-2 md:px-[1.3vw]  hover:scale-110 transition-all ease-in-out duration-100 hover:shadow-2xl shadow-white/30 font-light md:py-[0.5 vw]  bg-white/8 rounded-full text-sm md:text-lg text-white/95 border border-white/10"
                        >
                          {keyword.name}
                        </Link>
                      ))}
                      <Link
                        href="/discover/trending"
                        className="px-4 py-2 md:px-[1.2vw] md:py-[0.6vw] bg-white/8 text-primary rounded-full flex items-center text-sm lg:text-lg text-gray-300 border border-white/10"
                      >
                        Browse All Trending
                      </Link>
                    </div>
                  </div>
                )}

              {/* Genres */}
              <div>
                <h4 className="md:text-xl md:pt-[3vw] font-semibold text-primary/90 font-comfortaa   mb-4">
                  Movies by Genre
                </h4>
                <div className="flex flex-wrap gap-2 md:gap-[0.8vw]  w-full md:w-[90%]">
                  {[
                    { name: "Action", id: 28 },
                    { name: "Adventure", id: 12 },
                    { name: "Animation", id: 16 },
                    { name: "Comedy", id: 35 },
                    { name: "Crime", id: 80 },
                    { name: "Documentary", id: 99 },
                    { name: "Drama", id: 18 },
                    { name: "Family", id: 10751 },
                    { name: "Fantasy", id: 14 },
                    { name: "History", id: 36 },
                    { name: "Horror", id: 27 },
                    { name: "Music", id: 10402 },
                    { name: "Mystery", id: 9648 },
                    { name: "Romance", id: 10749 },
                    { name: "Science Fiction", id: 878 },
                    { name: "TV Movie", id: 10770 },
                    { name: "Thriller", id: 53 },
                    { name: "War", id: 10752 },
                    { name: "Western", id: 37 },
                  ].map((genre) => (
                    <Link
                      key={genre.id}
                      href={`/search/genre-${genre.id}-${genre.name.toLowerCase()}`}
                      className="px-4 py-2 md:px-[1.3vw]  hover:scale-110 transition-all ease-in-out duration-100 hover:shadow-2xl shadow-white/30 md:py-[0.5 vw]  bg-white/8 rounded-full text-sm md:text-lg text-white/95 border border-white/10"
                    >
                      {genre.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Years */}
              <div>
                <h4 className="md:text-xl md:pt-[3vw] font-semibold text-primary/90 font-comfortaa   mb-4">
                  Movies by Year :
                </h4>
                <div className="flex flex-wrap gap-2 md:gap-[0.8vw]  w-full md:w-[90%]">
                  {Array.from({ length: 35 }, (_, i) => 2026 - i).map(
                    (year) => (
                      <Link
                        key={year}
                        href={`/search/year-${year}`}
                        className="px-4 py-2 md:px-[1.3vw]  hover:scale-110 transition-all ease-in-out duration-100 hover:shadow-2xl shadow-white/30 md:py-[0.5 vw]  bg-white/8 rounded-full text-sm md:text-lg text-white/95 border border-white/10"
                      >
                        {year}
                      </Link>
                    ),
                  )}
                  <Link
                    href={`/discover/classics`}
                    className="px-4 py-2 md:px-[1.2vw] md:py-[0.6vw] bg-white/8 font-semibold rounded-full flex items-center text-sm lg:text-lg text-gray-300 border border-white/10"
                  >
                    Older
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
};

export default Home;
