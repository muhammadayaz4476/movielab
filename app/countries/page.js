"use client";
import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Link from "next/link";
import axios from "axios";

const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;

// List of major countries to display first
const MAJOR_COUNTRIES = [
  "United States of America",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Japan",
  "Italy",
  "Spain",
  "South Korea",
  "India",
  "China",
  "Braizl",
  "Mexico",
  "Russia",
  "Netherlands",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
];

export default function CountriesPage() {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCountriesData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${BASE_URL}/configuration/countries?api_key=${API_KEY}`,
      );
      let apiCountries = res.data.map((c) => ({
        code: c.iso_3166_1,
        name: c.english_name,
      }));

      const sortCountries = (countries) => {
        const major = countries.filter((c) => MAJOR_COUNTRIES.includes(c.name));
        const other = countries.filter((c) => !MAJOR_COUNTRIES.includes(c.name));

        const sortedMajor = major.sort((a, b) => {
          const aIndex = MAJOR_COUNTRIES.indexOf(a.name);
          const bIndex = MAJOR_COUNTRIES.indexOf(b.name);
          return aIndex - bIndex;
        });

        const sortedOther = other.sort((a, b) => a.name.localeCompare(b.name));

        return [...sortedMajor, ...sortedOther];
      };

      const annotatePopularity = async (countries) => {
        const parallel = countries.map(async (c) => {
          try {
            const r = await fetch(
              `${BASE_URL}/discover/movie?api_key=${API_KEY}&region=${c.code}&language=en-US&sort_by=popularity.desc&page=1`,
            );
            if (!r.ok) return { ...c, count: 0 };
            const data = await r.json();
            return { ...c, count: data.total_results || 0 };
          } catch {
            return { ...c, count: 0 };
          }
        });
        const withCount = await Promise.all(parallel);
        return withCount.sort((a, b) => b.count - a.count);
      };

      if (process.env.NEXT_PUBLIC_SORT_BY_POPULARITY === "1") {
        apiCountries = await annotatePopularity(apiCountries);
      } else {
        apiCountries = sortCountries(apiCountries);
      }

      setCountries(apiCountries);
      setLoading(false);
    } catch (error) {
      console.error("Error loading countries:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCountriesData();
  }, []);

  return (
    <main className="w-full min-h-screen bg-black text-white">
      <Navbar />
      <div className="px-4 lg:px-[5vw] md:py-[10vw] py-[40vw]">
        <h1 className="text-2xl lg:text-3xl font-comfortaa font-bold mb-8">
          Browse by Country
        </h1>
        {loading ? (
          <div className="flex flex-wrap items-center justify-start gap-4 lg:gap-[2vw] animate-pulse">
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className="w-48 h-20 bg-zinc-900/40 rounded-2xl flex items-center gap-4 p-4"
              >
                <div className="w-12 h-12 rounded-full bg-zinc-800" />
                <div className="h-4 bg-zinc-800 rounded w-24" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex flex-wrap items-center justify-start gap-4 lg:gap-[2vw]">
            {countries.map((country) => {
              const flagUrl = `https://flagcdn.com/w40/${country.code.toLowerCase()}.png`;
              return (
                <Link
                  key={country.code}
                  href={`/discover/country-${country.name.toLowerCase().replace(/ /g, "-")}-${country.code}`}
                  className="group bg-zinc-900/40 rounded-2xl p-4 transition-all flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold group-hover:bg-primary group-hover:text-black transition-all overflow-hidden">
                    <img
                      src={flagUrl}
                      alt={`${country.name} flag`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-medium group-hover:text-primary transition-colors">
                    {country.name}
                  </h3>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
