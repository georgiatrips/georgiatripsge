import { NextResponse } from "next/server";
import { getCachedCustomTransferPlaces } from "../../../lib/server/cachedData";
import { inGeorgia, matchCustomPlaces } from "../../../lib/transfers/customPlaces";
import { nameOsmPoint, searchOsmPlaces } from "../../../lib/transfers/osmSearch";

// Place search for the transfer calculator's "From" and "To" fields, limited to Georgia,
// and the reverse lookup that names a point picked on the calculator's map.
// Order: places added in the admin panel, then our own OpenStreetMap index
// (osmSearch.js, rebuilt from the daily Georgia extract), then — only when
// those find little — Photon, the public OSM geocoder, which also knows
// house numbers but is often slow.
export const dynamic = "force-dynamic";

const PHOTON_BASE = "https://photon.komoot.io/";
// minLon,minLat,maxLon,maxLat around Georgia; results are then filtered to GE.
const GEORGIA_BBOX = "39.95,41.0,46.75,43.6";
const USER_AGENT = "GeorgiaTrips/1.0 (+https://www.georgiatrips.ge)";

const CACHE_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX = 500;
// Photon only tops up a short list, so it gets little time: when it is slow
// (often 8–10 s lately) the visitor gets our own results instead of waiting.
const PHOTON_TIMEOUT_MS = 3500;
const cache = new Map(); // key -> { at, results }

const HOTEL_VALUES = new Set(["hotel", "hostel", "guest_house", "motel", "apartment", "chalet", "alpine_hut", "camp_site"]);
const SIGHT_VALUES = new Set(["attraction", "museum", "viewpoint", "artwork", "gallery", "zoo", "theme_park", "aquarium"]);
const FOOD_VALUES = new Set(["restaurant", "cafe", "bar", "pub", "fast_food", "food_court"]);
const REGION_VALUES = new Set(["state", "region", "province", "county", "district", "municipality"]);
const LOW_PRIORITY_TYPES = new Set(["food", "shop", "street", "address"]);

// Coarse place type from the OSM tag, so the list can show a matching icon.
function placeType({ osm_key: k, osm_value: v, type }) {
  if (k === "tourism" && HOTEL_VALUES.has(v)) return "hotel";
  if (k === "aeroway") return "airport";
  if ((k === "railway" && (v === "station" || v === "halt")) || (k === "amenity" && v === "bus_station")) return "station";
  if (k === "amenity" && v === "place_of_worship") return "church";
  if (k === "historic" || (k === "tourism" && SIGHT_VALUES.has(v))) return "sight";
  if (k === "natural" || k === "waterway" || (k === "leisure" && (v === "park" || v === "nature_reserve")) || (k === "boundary" && v === "national_park")) return "nature";
  if (k === "amenity" && FOOD_VALUES.has(v)) return "food";
  if (k === "shop" || (k === "amenity" && v === "marketplace")) return "shop";
  if (k === "place") return v === "city" || v === "town" ? "city" : REGION_VALUES.has(v) ? "region" : "village";
  if (k === "highway") return "street";
  if (k === "building" || type === "house") return "address";
  return "place";
}

function describe(p) {
  const parts = [p.city, p.county, p.state].filter(Boolean);
  const unique = parts.filter((part, i) => part !== p.name && parts.indexOf(part) === i);
  return unique.slice(0, 2).join(", ");
}

function toResult(f, fallbackId) {
  const p = f.properties || {};
  const [lng, lat] = f.geometry?.coordinates || [];
  if (p.countrycode !== "GE" || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  // A street address has no name of its own: "Rustaveli St 12".
  const address = [p.street, p.housenumber].filter(Boolean).join(" ");
  const name = p.name || address;
  if (!name) return null;
  return {
    id: `${p.osm_type || ""}${p.osm_id || fallbackId}`,
    name,
    detail: describe(p),
    type: placeType(p),
    lat: Math.round(lat * 1e5) / 1e5,
    lng: Math.round(lng * 1e5) / 1e5,
  };
}

async function photonSearch(q, lang) {
  const params = new URLSearchParams({ q, limit: "30", lang, bbox: GEORGIA_BBOX });
  const res = await fetch(`${PHOTON_BASE}api/?${params}`, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(PHOTON_TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Photon ${res.status}`);
  const data = await res.json();
  return (data.features || []).map((f, i) => toResult(f, i)).filter(Boolean);
}

// Street and number at a point, e.g. "Gorgiladze St 97" (Photon reverse).
async function photonAddress(lat, lng, lang) {
  const params = new URLSearchParams({ lat, lon: lng, lang, limit: "1" });
  const res = await fetch(`${PHOTON_BASE}reverse?${params}`, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(2500),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Photon ${res.status}`);
  const p = (await res.json()).features?.[0]?.properties;
  if (!p || p.countrycode !== "GE") return null;
  const street = [p.street, p.housenumber].filter(Boolean).join(" ");
  const name = street || p.name;
  return name ? { id: `rev${p.osm_id || ""}`, name, detail: describe(p), type: "address", lat, lng } : null;
}

// Adds b's entries that a doesn't already have (same name and town).
function merge(a, b, limit = 12) {
  const seen = new Set(a.map((r) => `${r.name.toLowerCase()}|${r.detail}`));
  const names = new Set(a.map((r) => r.name.toLowerCase()));
  const out = [...a];
  for (const r of b) {
    if (out.length >= limit) break;
    if (seen.has(`${r.name.toLowerCase()}|${r.detail}`) || names.has(r.name.toLowerCase())) continue;
    seen.add(`${r.name.toLowerCase()}|${r.detail}`);
    out.push(r);
  }
  return out;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawLang = searchParams.get("lang") || "ka";
  const lang = ["ka", "en", "ru", "tr", "ar"].includes(rawLang) ? rawLang : "en";

  // ?lat=&lng= : a name for a point picked on the map.
  if (searchParams.has("lat")) {
    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));
    if (!inGeorgia(lat, lng)) return NextResponse.json({ results: [] }, { status: 400 });
    const { place, area } = nameOsmPoint(lat, lng, lang);
    if (place) return NextResponse.json({ results: [place] });
    const address = await photonAddress(lat, lng, lang === "ka" ? "default" : "en").catch(() => null);
    return NextResponse.json({ results: [address || area].filter(Boolean) });
  }

  const q = (searchParams.get("q") || "").trim().slice(0, 100);
  if (q.length < 2) return NextResponse.json({ results: [] });

  // Own places are matched on every request (cheap, and an added place
  // shows up at once).
  const custom = matchCustomPlaces(await getCachedCustomTransferPlaces(), q).map((p) => ({
    id: `gt-${p.id}`,
    name: lang === "ka" ? p.name : p.nameEn || p.name,
    detail: "",
    type: p.type,
    lat: p.lat,
    lng: p.lng,
  }));
  // Cafés, shops, streets and bare addresses are rarely the pickup/drop-off,
  // so they go below hotels, sights and settlements (the first result is
  // auto-picked when the field is left).
  const local = searchOsmPlaces(q, lang, 24);
  local.sort((a, b) => LOW_PRIORITY_TYPES.has(a.type) - LOW_PRIORITY_TYPES.has(b.type));
  let results = merge(custom, local);
  if (results.length >= 3) return NextResponse.json({ results });

  // Little found: ask Photon too (house numbers, odd spellings), cached.
  const photonLang = lang === "ka" ? "default" : "en";
  const key = `${photonLang}:${q.toLowerCase()}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return NextResponse.json({ results: merge(results, hit.results) });
  try {
    const photon = await photonSearch(q, photonLang);
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
    cache.set(key, { at: Date.now(), results: photon });
    results = merge(results, photon);
  } catch (err) {
    console.warn("[api/transfers/places] Photon:", err.message);
  }
  return NextResponse.json({ results });
}
