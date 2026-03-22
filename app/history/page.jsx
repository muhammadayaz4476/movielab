"use client";
import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Link from "next/link";
import { Play, Trash2, ArrowLeft, Clock } from "lucide-react";

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedHistory = localStorage.getItem("movielab_history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Error parsing history", e);
      }
    }
  }, []);

  const clearHistory = () => {
    if (confirm("Are you sure you want to clear your entire watch history?")) {
      localStorage.removeItem("movielab_history");
      setHistory([]);
    }
  };

  const removeItem = (id) => {
    const updatedHistory = history.filter((item) => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem("movielab_history", JSON.stringify(updatedHistory));
  };

  const createSlug = (title, id, type = "movie") => {
    if (!title) return id;
    const prefix = type === "tv" ? "tv-" : "";
    return `${prefix}${title
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "")}-${id}`;
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-black text-white font-poppins selection:bg-primary selection:text-black">
      <Navbar />
      
      <div className="px-4 lg:px-[2vw] py-36 lg:py-36  mx-auto relative z-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-4">
            {/* <Link href="/" className="p-2  hover:bg-white/10 rounded-full transition-colors mr-2">
                <ArrowLeft size={24} />
            </Link> */}
            <div>
              <h1 className="text-4xl md:text-5xl font-black font-comfortaa tracking-tight">
                Watch <span className="text-primary">History</span>
              </h1>
              <p className="text-zinc-500 font-poppins text-sm mt-1">
                Your recently watched movies and series
              </p>
            </div>
          </div>
          
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-full transition-all duration-300 font-medium text-sm border border-red-500/20 group"
            >
              <Trash2 size={16} className="group-hover:animate-bounce" />
              Clear All History
            </button>
          )}
        </header>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white/2 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 shadow-2xl animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 text-zinc-600">
                <Clock size={40} />
            </div>
            <h2 className="text-2xl font-bold mb-2">No history yet</h2>
            <p className="text-zinc-500 mb-8 max-w-xs text-center">
              Items you watch will appear here so you can easily jump back in.
            </p>
            <Link
              href="/"
              className="px-8 py-3 bg-primary text-black rounded-full font-bold hover:scale-105 transition-transform shadow-lg shadow-primary/20"
            >
              Start Watching
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 lg:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {history.map((item, idx) => (
              <div 
                key={item.id} 
                className="group relative flex flex-col gap-3"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="relative aspect-2/3 rounded-xl overflow-hidden bg-zinc-900 shadow-xl transition-all duration-500 group-hover:scale-[1.03] group-hover:shadow-primary/20 bg-linear-to-br from-zinc-800 to-black">
                  {item.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700 font-medium">
                      NO POSTER
                    </div>
                  )}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                    <Link
                      href={`/watch/${createSlug(item.title, item.id, item.media_type)}`}
                      className="w-full py-3 bg-primary text-black rounded-xl  flex items-center justify-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 "
                    >
                      <Play fill="black" size={18} />
                      {item.media_type === "tv" ? "Resume" : "Play"}
                    </Link>
                  </div>

                  {/* Close button */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-md rounded-full text-white/70 hover:text-white hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 scale-90 group-hover:scale-100"
                    title="Remove from history"
                  >
                    <Trash2 size={14} />
                  </button>

                  {/* Media Type Badge */}
                  <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-[10px] font-bold text-white/80 border border-white/5 opacity-100 group-hover:opacity-0 transition-opacity">
                     {item.media_type === "tv" ? "TV" : "MOVIE"}
                  </div>
                </div>

                <div className="px-1">
                  <h3 className=" text-sm md:text-base line-clamp-1 group-hover:text-primary transition-colors duration-300">
                    {item.title}
                  </h3>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider font-medium">
                      {item.media_type === "tv" ? `S${item.season} E${item.episode}` : "Watched"}
                    </p>
                    <p className="text-[10px] text-gray-400 font-poppins">
                        {new Date(item.watchedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Background Glow */}
      <div className="fixed top-0 right-0 z-0 opacity-20 pointer-events-none">
        <div className="w-[50vw] h-[50vw] bg-primary/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      </div>
      <div className="fixed bottom-0 left-0 z-0 opacity-10 pointer-events-none">
        <div className="w-[40vw] h-[40vw] bg-primary/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
      </div>
    </main>
  );
}
