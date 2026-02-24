import { NextResponse } from "next/server";

const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;

// Helper to add CORS headers
function addCorsHeaders(response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}

function createSlug(title, id, type = "movie") {
  if (!title) return String(id);
  const prefix = type === "tv" ? "tv-" : "";
  return `${prefix}${title
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^\w-]+/g, "")}-${id}`;
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

function getExpandedStoryline(title, type, details, credits, overview, releaseDate) {
  // Build genre string
  const genres = (details?.genres || []).map(g => g.name).join(", ") || "film";

  // Get primary production company
  const studio = details?.production_companies?.[0]?.name;

  // Get tagline if available
  const tagline = details?.tagline;

  // Extract year from release date
  const year = releaseDate ? new Date(releaseDate).getFullYear() : "";

  // Start with base overview
  let narrative = overview || "Explore the full details of this title on MovieLab.";
  narrative += " ";

  // Add tagline if available
  if (tagline) {
    narrative += `"${tagline}" — `;
  }

  // Add production context
  narrative += `This ${year || "acclaimed"} ${genres} production ${studio ? `from ${studio}` : ""} brings a unique perspective to the screen. `;

  // Add status or cast info
  if (details?.status === "Planned" || details?.status === "Post Production") {
    narrative += `Currently in its ${details.status.toLowerCase()} phase, anticipation continues to build for its full release.`;
  } else if (credits?.cast && credits.cast.length > 0) {
    const topCast = credits.cast.slice(0, 3).map(c => c.name).join(", ");
    narrative += `Featuring a talented cast including ${topCast}, the project delivers a compelling ${type} experience.`;
  }

  return narrative;
}

export async function POST(request) {
  try {
    if (!API_KEY || !BASE_URL) {
      const res = NextResponse.json({ error: "TMDB API key or base URL not configured" }, { status: 500 });
      return addCorsHeaders(res);
    }

    const body = await request.json();
    const query = (body?.query || "").toString().trim();
    if (!query) {
      const res = NextResponse.json({ error: "Missing query" }, { status: 400 });
      return addCorsHeaders(res);
    }

    // Optional filters
    // Year(s) filter: accepts `year` (backwards compatible) or `years`.
    // `years` may be: single "2020", comma-separated "2018,2020", or a range "2010-2015".
    const rawYears = body?.years ?? body?.year ?? null;
    let yearsFilter = null; // null = no filter, otherwise { type: 'set', years:Set } or { type:'range', min, max }

    if (rawYears != null) {
      if (Array.isArray(rawYears)) {
        const s = new Set();
        rawYears.forEach(y => {
          const n = parseInt(String(y).trim(), 10);
          if (!Number.isNaN(n)) s.add(String(n));
        });
        if (s.size > 0) yearsFilter = { type: 'set', years: s };
      } else {
        const rs = String(rawYears).trim();
        if (rs.includes('-')) {
          const [a,b] = rs.split('-').map(x => parseInt(String(x).trim(),10));
          if (!Number.isNaN(a) && !Number.isNaN(b)) yearsFilter = { type: 'range', min: Math.min(a,b), max: Math.max(a,b) };
        } else if (rs.includes(',')) {
          const s = new Set();
          rs.split(',').forEach(p => {
            const n = parseInt(String(p).trim(),10);
            if (!Number.isNaN(n)) s.add(String(n));
          });
          if (s.size > 0) yearsFilter = { type: 'set', years: s };
        } else {
          const n = parseInt(rs, 10);
          if (!Number.isNaN(n)) yearsFilter = { type: 'set', years: new Set([String(n)]) };
        }
      }
    }

    const requestedType = (body?.type || "all").toString().toLowerCase(); // movie | tv | all
    let quantity = parseInt(body?.quantity ?? 10, 10);
    const offset = parseInt(body?.offset ?? 0, 10); // how many initial items to skip

    if (Number.isNaN(quantity) || quantity <= 0) quantity = 10;
    if (Number.isNaN(offset) || offset < 0) {
      const res = NextResponse.json({ error: "Invalid offset" }, { status: 400 });
      return addCorsHeaders(res);
    }
    // cap quantity to avoid abuse
    if (quantity > 50) quantity = 50;

    // Collect results from TMDB pages until we have offset + quantity items or run out
    const collected = [];
    let page = 1;
    let totalPages = 1;
    const unsafeKeywords = ["sexy", "erotic", "porn", "xxx", "nude", "breast", "sex", "18+"];

    while (collected.length < offset + quantity && page <= totalPages) {
      const searchUrl = `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&include_adult=false&page=${page}`;
      const searchRes = await fetchJson(searchUrl);
      const rawResults = (searchRes && searchRes.results) || [];
      totalPages = searchRes?.total_pages || 1;

      const mediaResults = rawResults.filter(r => (r.media_type === "movie" || r.media_type === "tv"));

      for (const r of mediaResults) {
        if (collected.length >= offset + quantity) break;

        // type filter
        if (requestedType !== "all") {
          if (requestedType === "movie" && r.media_type !== "movie") continue;
          if (requestedType === "tv" && r.media_type !== "tv") continue;
        }

        // year filter
        const releaseDate = r.release_date || r.first_air_date || "";
        if (yearsFilter) {
          if (!releaseDate) continue;
          const y = releaseDate.split('-')[0];
          if (yearsFilter.type === 'set') {
            if (!yearsFilter.years.has(y)) continue;
          } else if (yearsFilter.type === 'range') {
            const yi = parseInt(y,10);
            if (Number.isNaN(yi) || yi < yearsFilter.min || yi > yearsFilter.max) continue;
          }
        }

        // basic unsafe filter
        const titleLower = ((r.title || r.name) || "").toLowerCase();
        const overviewLower = (r.overview || "").toLowerCase();
        const hasUnsafe = unsafeKeywords.some(k => titleLower.includes(k) || overviewLower.includes(k));
        if (hasUnsafe) continue;

        collected.push(r);
      }

      page += 1;
      if (page > 50) break; // safety cap
    }

    // Deduplicate by id+media_type, then sort by popularity to match site ordering
    const dedupMap = new Map();
    for (const i of collected) {
      dedupMap.set(`${i.id}${i.media_type}`, i);
    }
    let deduped = Array.from(dedupMap.values());
    deduped.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

    const totalAvailable = deduped.length;
    const slice = deduped.slice(offset, offset + quantity);

    const enriched = await Promise.all(slice.map(async (item) => {
      const type = item.media_type === "tv" ? "tv" : "movie";
      const id = item.id;
      const title = item.title || item.name || "";
      const overview = item.overview || "";
      const date = item.release_date || item.first_air_date || "";

      // Fetch details, credits and keywords in parallel
      const detailUrl = `${BASE_URL}/${type}/${id}?api_key=${API_KEY}`;
      const creditsUrl = `${BASE_URL}/${type}/${id}/credits?api_key=${API_KEY}`;
      const keywordsUrl = `${BASE_URL}/${type}/${id}/keywords?api_key=${API_KEY}`;

      const [details, credits, keywords] = await Promise.all([
        fetchJson(detailUrl),
        fetchJson(creditsUrl),
        fetchJson(keywordsUrl),
      ]);

      // Director(s)
      let director = "";
      let writers = [];
      if (credits && credits.crew && Array.isArray(credits.crew)) {
        const directors = credits.crew.filter(c => c.job === "Director");
        director = directors.map(d => d.name).join(", ");

        const writersSet = new Set();
        credits.crew.forEach(c => {
          if (["Writer", "Screenplay", "Screenplay by", "Story"].includes(c.job)) writersSet.add(c.name);
        });
        writers = Array.from(writersSet);
      }

      // Tags/keywords
      let tags = [];
      if (keywords) {
        // TMDB returns different shapes for movie/tv keywords
        tags = (keywords.keywords || keywords.results || []).map(k => k.name).filter(Boolean);
      }

      // Cast (top 5)
      let cast = [];
      if (credits && credits.cast && Array.isArray(credits.cast)) {
        cast = credits.cast.slice(0, 5).map(c => c.name);
      }

      const slug = createSlug(title, id, type);

      // Get expanded storyline
      const finalDate = date || (details && (details.release_date || details.first_air_date)) || "";
      const expandedStoryline = getExpandedStoryline(title, type, details, credits, overview, finalDate);

      return {
        page_url: `https://movies.umairlab.com/movie/${slug}`,
        item_title: title,
        media_type: type,
        popularity: item.popularity || 0,
        storylineandcontext: expandedStoryline,
        date: finalDate,
        director: director,
        writers: writers,
        tags: tags,
        arrayofcast: cast,
      };
    }));

    const res = NextResponse.json({ results: enriched, total: totalAvailable });
    return addCorsHeaders(res);
  } catch (err) {
    const errRes = NextResponse.json({ error: String(err) }, { status: 500 });
    return addCorsHeaders(errRes);
  }
}

// Handle CORS preflight requests
export async function OPTIONS(request) {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response);
}










// Search API — Short Docs

// Endpoint: POST /api/search

// Implementation: route.js:1-400

// Description: Search the site (TMDB-backed) and return enriched results. Supports filtering, pagination (offset), and limiting quantity.

// Request body (JSON):

// query (string) — required. Search text.
// type (string) — optional. movie, tv, or all (default all).
// year (string or number) — optional legacy single year (e.g. 2020).
// years (string or array) — optional; single year ("2020"), comma list ("2018,2020"), or range ("2010-2015").
// offset (integer) — optional; number of matching items to skip (default 0).
// quantity (integer) — optional; how many items to return (default 10, max 50).
// Example — PowerShell:
// Invoke-RestMethod -Uri "https://movies.umairlab.com/api/search" -Method POST -ContentType "application/json" -Body '{"query":"inception","type":"movie","years":"2010-2015","offset":10,"quantity":10}'

// Example — curl (WSL/Git Bash):
// curl -X POST "https://movies.umairlab.com/api/search" -H "Content-Type: application/json" -d '{"query":"inception","type":"movie","years":"2010-2015","offset":10,"quantity":10}'
// Response (JSON):

// results: array of item objects (length ≤ quantity)
// total: total number of matching items available after dedupe/sort
// Each item:

// page_url (string) — site URL for the item (e.g. https://movies.umairlab.com/movie/titleslug-12345)
// item_title (string)
// media_type (string) — movie or tv
// popularity (number)
// storylineandcontext (string)
// date (string) — release or first air date (YYYY-MM-DD)
// director (string)
// writers (array[string])
// tags (array[string])
// arrayofcast (array[string]) — top cast (up to 5)
// Sample response:
// {
//   "results": [
//     {
//       "page_url": "https://movies.umairlab.com/movie/inception-27205",
//       "item_title": "Inception",
//       "media_type": "movie",
//       "popularity": 82.3,
//       "storylineandcontext": "A thief who steals corporate secrets...",
//       "date": "2010-07-15",
//       "director": "Christopher Nolan",
//       "writers": ["Christopher Nolan"],
//       "tags": ["dream", "heist"],
//       "arrayofcast": ["Leonardo DiCaprio","Joseph Gordon-Levitt"]
//     }
//   ],
//   "total": 123
// }

// Notes & behavior:

// Results are deduplicated (by id+media_type) and sorted by popularity to match site ordering.
// offset+quantity allow retrieving the "next" set of results (e.g., set offset:10 to get results after the first 10).
// years accepts single, list, or range; year remains supported for compatibility.
// The endpoint fetches details, credits and keywords from TMDB to enrich items; this makes the response slower than a plain search.
// If you want extra filters (e.g., min_popularity, has_image) or field-selection, tell me which and I’ll add them.
// Would you like this added to a README file in the repo?
