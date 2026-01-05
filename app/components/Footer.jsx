import Link from "next/link";
import React from "react";

const Footer = () => {
  return (
    <footer className="px-4 lg:px-[5vw] py-10 border-t border-white/5 mt-10">
      <div className="flex flex-col md:flex-row items-center justify-around gap-6 text-zinc-500 text-sm font-poppins">
        <p>© 2025 All Rights Reserved.</p>

        <div className="flex items-center gap-2">
          <span>Made by Umair at</span>
          <Link href="https://umairlab.com" className="flex items-baseline font-comfortaa gap-1 tracking-tighter">
            <span className="text-white font-bold text-lg">.umair</span>
            <span className="text-primary font-bold">lab</span>
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
