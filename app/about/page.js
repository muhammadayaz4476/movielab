import React from "react";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

export default function AboutPage() {
  return (
    <main className="w-full pt-[10vw] min-h-screen bg-black text-white pb-20 px-4 lg:px-[10vw] xl:px-[15vw]">
      <Navbar />

      <div className="mx-auto font-poppins">
        <h1 className="text-4xl  font-comfortaa font-semibold mt-12 mb-8 text-center">
          About MovieLab
        </h1>

        <p className="text-zinc-400 text-sm mb-10 text-center">
          Last updated: February 09, 2026
        </p>

        <div className="prose prose-invert prose-zinc max-w-none space-y-8 text-zinc-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-medium text-white mb-4">Welcome to MovieLab</h2>
            <p>
              MovieLab is your go-to destination for discovering trending movies, TV series, and timeless classics — all in one beautiful, easy-to-use platform.
            </p>
            <p className="mt-3">
              We help movie lovers explore what's hot right now, dive into their favorite genres, find hidden gems, and plan their next watch — completely free and without any login required.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-white mb-4">Our Mission</h2>
            <p>
              At MovieLab, we believe everyone should have easy access to information about the world of cinema. Whether you're looking for the latest blockbuster, a feel-good romance, gripping horror, thought-provoking indie, or nostalgic classics, we're here to make discovery simple, fast, and enjoyable.
            </p>
            <p className="mt-3">
              We curate and present high-quality movie and series data so you can spend less time searching and more time watching.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-white mb-4">What We Offer</h2>
            <ul className="list-disc pl-6 mt-2 space-y-2 text-zinc-300">
              <li>Real-time trending movies and series</li>
              <li>Popular and top-rated collections</li>
              <li>Genre-based browsing (Action, Comedy, Horror, Sci-Fi, Romance, Drama, Korean, Indian, Anime, and more)</li>
              <li>Upcoming releases and latest additions</li>
              <li>Curated lists like hidden gems, feel-good movies, and classics</li>
              <li>High-definition quality indicators and detailed movie info</li>
              <li>Fast, responsive design that works beautifully on mobile, tablet, and desktop</li>
            </ul>
            <p className="mt-4">
              No subscriptions. No ads interrupting your browsing (though we recommend using an ad-blocker like AdGuard for the best experience across the web).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-white mb-4">Who We Are</h2>
            <p>
              MovieLab is proudly built and maintained by <strong>Umair</strong> from <strong>Umair Lab</strong> — a passionate full-stack developer and digital creator based in Lahore, Pakistan.
            </p>
            <p className="mt-3">
              This project was created as a modern showcase of clean UI/UX, efficient data handling, and love for cinema. It's built with cutting-edge tools like React, Next.js, Tailwind CSS, and aggregates publicly available movie metadata to bring you the best possible experience.
            </p>
            <p className="mt-3">
              Umair Lab specializes in creating beautiful, high-performance web applications — and MovieLab is one of our personal favorites.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-white mb-4">Important Disclaimer</h2>
            <p>
              MovieLab is a <strong>discovery and information platform</strong>. We do not host, upload, stream, or distribute any video content ourselves.
            </p>
            <p className="mt-3">
              All links, embeds, or streaming options (if present) are provided from third-party sources and are intended for users in regions where such access is legal. We do not control or endorse the content of external sites.
            </p>
            <p className="mt-3">
              This website is created for <strong>educational, demonstration, and entertainment purposes</strong>. Always respect copyright laws and support creators by using official streaming services whenever possible.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-white mb-4">Get in Touch</h2>
            <p>
              Have feedback, suggestions, or just want to say hi? We'd love to hear from you!
            </p>
            <p className="mt-3">
              Use the contact form on the site or reach out directly:<br />
              Email: [your-email@example.com]<br />
              Website: https://www.umairlab.com/ (main portfolio)
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-white mb-4">Thank You</h2>
            <p>
              Thanks for visiting MovieLab. Grab some popcorn, explore the collections, and enjoy the magic of movies!
            </p>
            <p className="mt-3 italic text-zinc-400">
              Happy watching! 🍿✨
            </p>
          </section>

          <p className="text-sm text-zinc-500 mt-12 pt-8 border-t border-zinc-800 text-center">
            MovieLab is a non-commercial, passion project by Umair Lab. This page is for informational purposes only.
          </p>
        </div>
      </div>

      <Footer />
    </main>
  );
}