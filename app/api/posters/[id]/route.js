import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(request, { params }) {
  const { id } = await params;
  const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
  const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;

  if (!id) {
    return NextResponse.json(
      { error: "Movie ID is required" },
      { status: 400 },
    );
  }

  try {
    // Fetch images from TMDB
    const response = await axios.get(
      `${BASE_URL}/movie/${id}/images?api_key=${API_KEY}`,
    );

    let posters = response.data.posters || [];

    // Logic for "Maximum Visual Diversity":
    // 1. Separate Textless (clean) and English posters.
    // 2. These are the most likely to be distinct designs.
    const cleanPosters = posters.filter((p) => !p.iso_639_1);
    const enPosters = posters.filter((p) => p.iso_639_1 === "en");

    // 3. Selection Strategy:
    // - Pick the top 2 'clean' posters (usually the primary art and the best alternative).
    // - Pick 3 'en' posters but skip every other one to avoid slight variations.

    const selectedClean = cleanPosters.slice(0, 2);
    const selectedEn = enPosters
      .filter((_, index) => index % 3 === 0) // Stride of 3 to skip variations
      .slice(0, 3);

    const diverseSet = [...selectedClean, ...selectedEn].map(
      (p) => `https://image.tmdb.org/t/p/original${p.file_path}`,
    );

    return NextResponse.json({
      id: id,
      total_found: posters.length,
      returned_diverse: diverseSet.length,
      posters: diverseSet,
      note: "Only the most distinct 'clean' and 'English' posters are returned. A stride selection is used to avoid similar variations (e.g., posters with/without credit blocks).",
    });
  } catch (error) {
    console.error("Error fetching posters:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch posters from TMDB", details: error.message },
      { status: 500 },
    );
  }
}
