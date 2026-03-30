"use client";

import { useEffect } from "react";

const SMARTLINK_URL = "https://doubtfulimpatient.com/mr2ybtg778?key=9226cef44dcb9cc9cb86abcf1b81715f";

export default function RedirectPage() {
  useEffect(() => {
    // Immediate redirect to the smartlink
    window.location.href = SMARTLINK_URL;
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white font-comfortaa">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h1 className="text-xl font-bold mb-2">Redirecting you to content...</h1>
        <p className="text-gray-400 text-sm">Please wait a moment while we prepare your stream.</p>
      </div>
    </div>
  );
}
