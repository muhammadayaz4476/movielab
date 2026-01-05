import React from "react";
import Navbar from "./Navbar";
import Hero from "./Hero";
import MovieRow from "./MovieRow";
import Link from "next/link";
import Footer from "./Footer";

const Home = () => {
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
  const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;

  const requests = {
    // 🔥 HERO / TRENDING
    trendingToday: `${BASE_URL}/trending/movie/day?api_key=${API_KEY}&include_adult=false`,
    trendingThisWeek: `${BASE_URL}/trending/movie/week?api_key=${API_KEY}&include_adult=false`,

    // ⭐ QUALITY
    topRated: `${BASE_URL}/movie/top_rated?api_key=${API_KEY}&include_adult=false`,
    criticallyAcclaimed: `${BASE_URL}/discover/movie?api_key=${API_KEY}&vote_average.gte=7.5&vote_count.gte=500&sort_by=vote_average.desc&include_adult=false`,

    // 🔥 POPULARITY
    popularNow: `${BASE_URL}/movie/popular?api_key=${API_KEY}&include_adult=false`,

    // 🆕 FRESH CONTENT
    upcoming: `${BASE_URL}/movie/upcoming?api_key=${API_KEY}&include_adult=false`,
    newReleases: `${BASE_URL}/discover/movie?api_key=${API_KEY}&primary_release_date.gte=2024-01-01&sort_by=release_date.desc&include_adult=false`,

    // 🎭 GENRE-BASED (VERY IMPORTANT)
    actionMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=28&sort_by=popularity.desc&include_adult=false`,
    comedyMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=35&sort_by=popularity.desc&include_adult=false`,
    horrorMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=27&sort_by=popularity.desc&include_adult=false`,
    romanceMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=10749&sort_by=popularity.desc&include_adult=false`,
    sciFiMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=878&sort_by=popularity.desc&include_adult=false`,

    // 🌍 INTERNATIONAL / LANGUAGE ROWS (VERY PREMIUM FEEL)
    koreanMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_original_language=ko&sort_by=popularity.desc&include_adult=false`,
    japaneseMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_original_language=ja&sort_by=popularity.desc&include_adult=false`,
    indianMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_original_language=hi&sort_by=popularity.desc&include_adult=false`,

    // 🎬 NICHE / NETFLIX-STYLE CURATED
    hiddenGems: `${BASE_URL}/discover/movie?api_key=${API_KEY}&vote_average.gte=7&vote_count.lte=300&sort_by=vote_average.desc&include_adult=false`,
    feelGoodMovies: `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=35,10749&sort_by=popularity.desc&include_adult=false`,
  };

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
            { name: "Top Rated", slug: "/discover/top-rated" },
            { name: "Action", slug: "/discover/action-28" },
            { name: "Comedy", slug: "/discover/comedy-35" },
            { name: "Horror", slug: "/discover/horror-27" },
            { name: "Sci-Fi", slug: "/discover/sci-fi-878" },
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
          fetchURL={requests.trendingToday}
          viewAllLink="/discover/trending"
        />
        <MovieRow
          title="Top Rated Movies"
          fetchURL={requests.topRated}
          viewAllLink="/discover/top-rated"
        />
        <MovieRow
          title="Popular Now"
          fetchURL={requests.popularNow}
          viewAllLink="/discover/popular"
        />
        <MovieRow
          title="Upcoming Movies"
          fetchURL={requests.newReleases}
          viewAllLink="/discover/new-releases"
        />
        <MovieRow
          title="Action Movies"
          fetchURL={requests.actionMovies}
          viewAllLink="/discover/action-28"
        />
        <MovieRow
          title="Comedy Movies"
          fetchURL={requests.comedyMovies}
          viewAllLink="/discover/comedy-35"
        />
        <MovieRow
          title="Horror Movies"
          fetchURL={requests.horrorMovies}
          viewAllLink="/discover/horror-27"
        />
        <MovieRow
          title="Romance Movies"
          fetchURL={requests.romanceMovies}
          viewAllLink="/discover/romance-10749"
        />
        <MovieRow
          title="Sci-Fi Movies"
          fetchURL={requests.sciFiMovies}
          viewAllLink="/discover/sci-fi-878"
        />
        <MovieRow
          title="Korean Movies"
          fetchURL={requests.koreanMovies}
          viewAllLink="/discover/korean"
        />
        {/* <MovieRow
          title="Japanese Movies"
          fetchURL={requests.japaneseMovies}
          viewAllLink="/discover/japanese"
        /> */}
        <MovieRow
          title="Indian Movies"
          fetchURL={requests.indianMovies}
          viewAllLink="/discover/bollywood"
        />
        <MovieRow
          title="Hidden Gems"
          fetchURL={requests.hiddenGems}
          viewAllLink="/discover/hidden-gems"
        />
        <MovieRow
          title="Feel Good Movies"
          fetchURL={requests.feelGoodMovies}
          viewAllLink="/discover/feel-good"
        />

        <Footer />
      </div>
    </main>
  );
};

export default Home;
