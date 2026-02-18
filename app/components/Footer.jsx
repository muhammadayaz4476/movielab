"use client";
import Link from "next/link";
import React, { useState } from "react";
import Explore from "./Explore";

const Footer = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [showExplore, setShowExplore] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !message)
      return setStatus({ error: "Please fill both fields" });
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ success: "Message Sended — thank you!" });
        setName("");
        setEmail("");
        setMessage("");
      } else {
        setStatus({ error: data?.error || "Failed to Sended Try Again Later" });
      }
    } catch (err) {
      setStatus({ error: "Server error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="px-4 lg:px-[5vw] py-10  ">
      <div className="   flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-zinc-500 text-sm font-poppins">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span>Made by Umair at</span>
            <Link
              href="https://umairlab.com"
              className="flex items-baseline font-comfortaa gap-1 tracking-tighter"
            >
              <span className="text-white font-bold text-lg">.umair</span>
              <span className="font-comfortaa text-transparent bg-gradient-to-tr from-[#b622a7] to-primary bg-clip-text">lab</span>
            </Link>
          </div>
          <p>© {new Date().getFullYear()} All Rights Reserved.</p>
          <div className="flex gap-4 mt-2">
            {/* <div className="relative">
              <button
                onClick={() => setShowExplore(!showExplore)}
                className="text-gray-300 hover:text-white flex items-center gap-1"
              >
                Explore
                <svg 
                  className={`w-4 h-4 transition-transform ${showExplore ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7 7" />
                </svg>
              </button>
              {showExplore && (
                <div className="absolute bottom-full left-0 mb-2 bg-zinc-900 border border-white/10 rounded-lg p-4 shadow-xl">
                  <Explore />
                </div>
              )}
            </div> */}
            <Link href="/about" className="text-gray-300 hover:text-white">
              About
            </Link>
            <Link href="/privacy" className="text-gray-300 hover:text-white">
              Privacy Policy
            </Link>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="w-full md:w-1/2 lg:w-1/3  bg-zinc-900 border border-white/5 p-4 rounded-lg"
        >
          <h5 className="text-white font-poppins text-lg  mb-2">Send us a message</h5>
          <div className="flex  gap-2">

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mb-2 p-3 rounded bg-zinc-800 text-white outline-none border border-transparent focus:border-primary"
            placeholder="Your name"
            aria-label="Name"
            required
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="w-full mb-2 p-3 rounded bg-zinc-800 text-white outline-none border border-transparent focus:border-primary"
            placeholder="Your email (optional)"
            aria-label="Email"
          />
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full mb-2 p-2 rounded bg-zinc-800 text-white outline-none border border-transparent focus:border-primary"
            rows={3}
            placeholder="Your message"
            aria-label="Message"
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-primary w-full text-black px-4 py-3 text-lg rounded font-medium disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send"}
            </button>
            {status?.success && (
              <span className="text-green-400">{status.success}</span>
            )}
            {status?.error && (
              <span className="text-red-400">{status.error}</span>
            )}
          </div>
        </form>
      </div>
    </footer>
  );
};

export default Footer;
