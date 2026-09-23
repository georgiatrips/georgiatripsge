import { NextResponse } from "next/server";

// Place search for the transfer calculator's "To" field, limited to Georgia.
// Photon (OpenStreetMap geocoder built for type-ahead) needs no API key.
export const dynamic = "force-dynamic";

const PHOTON_URL = "https://photon.komoot.io/api/";
// minLon,minLat,maxLon,maxLat around Georgia; results are then filtered to GE.
const GEORGIA_BBOX = "39.95,41.0,46.75,43.6";
const USER_AGENT = "GeorgiaTrips/1.0 (+https://www.georgiatrips.ge)";

const CACHE_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX = 500;
const cache = new Map(); // key -> { at, results }

function describe(p) {
  const parts = [p.city, p.county, p.state].filter(Boolean);
  const unique = parts.filter((part, i) => part !== p.name && parts.indexOf(part) === i);
  return unique.slice(0, 2).join(", ");
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim().slice(0, 100);
  // Photon's public instance serves local names ("default") or en/de/fr.
  const lang = searchParams.get("lang") === "ka" ? "default" : "en";

  if (q.length < 2) return NextResponse.json({ results: [] });

  const key = `${lang}:${q.toLowerCase()}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) {
    return NextResponse.json({ results: hit.results });
  }

  try {
    const url = `${PHOTON_URL}?q=${encodeURIComponent(q)}&limit=10&lang=${lang}&bbox=${GEORGIA_BBOX}`;
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Photon ${res.status}`);
    const data = await res.json();

    const seen = new Set();
    const results = [];
    for (const f of data.features || []) {
      const p = f.properties || {};
      const [lng, lat] = f.geometry?.coordinates || [];
      if (p.countrycode !== "GE" || !p.name || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      const detail = describe(p);
      const dedupe = `${p.name}|${detail}`;
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);
      results.push({
        id: `${p.osm_type || ""}${p.osm_id || results.length}`,
        name: p.name,
        detail,
        lat: Math.round(lat * 1e5) / 1e5,
        lng: Math.round(lng * 1e5) / 1e5,
      });
      if (results.length >= 6) break;
    }

    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
    cache.set(key, { at: Date.now(), results });
    return NextResponse.json({ results });
  } catch (err) {
    console.warn("[api/transfers/places]", err.message);
    return NextResponse.json({ results: [], error: "search_unavailable" }, { status: 502 });
  }
}
