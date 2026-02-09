import React from "react";
import Footer from "../components/Footer";

export default function ContactPage() {
  return (
    <main className="w-full min-h-screen bg-black text-white pb-20 px-4 lg:px-[5vw]">
      <h1 className="text-3xl font-comfortaa font-bold mt-8">Contact Us</h1>
      <p className="text-zinc-400 mt-4 max-w-2xl">
        Use the form in the footer to send us a message. We read all messages and
        will respond if needed.
      </p>
      <div className="mt-8">
        {/* Optionally add more contact details here */}
      </div>

      <Footer />
    </main>
  );
}
