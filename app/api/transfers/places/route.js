import { NextResponse } from "next/server";

// Place search for the transfer calculator's "From" and "To" fields, limited to Georgia,
// and the reverse lookup that names a point picked on the calculator's map.
// Photon (OpenStreetMap geocoder built for type-ahead) needs no API key.
export const dynamic = "force-dynamic";

const PHOTON_BASE = "https://photon.komoot.io/";
// minLon,minLat,maxLon,maxLat around Georgia; results are then filtered to GE.
const GEORGIA_BBOX = "39.95,41.0,46.75,43.6";
const USER_AGENT = "GeorgiaTrips/1.0 (+https://www.georgiatrips.ge)";

const CACHE_MS = 24 * 60 * 60 * 1000;
const CACHE_MAX = 500;
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

// Places a dropped pin may be named after; otherwise the street address
// reads better than the nearest café.
const PIN_NAMED_TYPES = new Set(["hotel", "airport", "station", "church", "sight"]);

function toResult(f, fallbackId, { forPin = false } = {}) {
  const p = f.properties || {};
  const [lng, lat] = f.geometry?.coordinates || [];
  if (p.countrycode !== "GE" || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const type = placeType(p);
  // A street address has no name of its own: "Rustaveli St 12".
  const address = [p.street, p.housenumber].filter(Boolean).join(" ");
  const name = forPin && address && !PIN_NAMED_TYPES.has(type) ? address : p.name || address || p.city;
  if (!name) return null;
  return {
    id: `${p.osm_type || ""}${p.osm_id || fallbackId}`,
    name,
    detail: describe(p),
    type,
    lat: Math.round(lat * 1e5) / 1e5,
    lng: Math.round(lng * 1e5) / 1e5,
  };
}

async function photon(path, params) {
  const res = await fetch(`${PHOTON_BASE}${path}?${new URLSearchParams(params)}`, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(6000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Photon ${res.status}`);
  const data = await res.json();
  return data.features || [];
}

function remember(key, results) {
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
  cache.set(key, { at: Date.now(), results });
}

// ?lat=&lng= : the place at a point picked on the map.
async function reverse(lat, lng, lang) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return NextResponse.json({ results: [] }, { status: 400 });
  const key = `rev:${lang}:${lat.toFixed(4)},${lng.toFixed(4)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return NextResponse.json({ results: hit.results });
  try {
    const features = await photon("reverse", { lat, lon: lng, lang, limit: 1 });
    const results = features.map((f, i) => toResult(f, i, { forPin: true })).filter(Boolean).slice(0, 1);
    remember(key, results);
    return NextResponse.json({ results });
  } catch (err) {
    console.warn("[api/transfers/places reverse]", err.message);
    return NextResponse.json({ results: [], error: "search_unavailable" }, { status: 502 });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  // Photon's public instance serves local names ("default") or en/de/fr.
  const lang = searchParams.get("lang") === "ka" ? "default" : "en";

  if (searchParams.has("lat")) {
    return reverse(Number(searchParams.get("lat")), Number(searchParams.get("lng")), lang);
  }

  const q = (searchParams.get("q") || "").trim().slice(0, 100);
  if (q.length < 2) return NextResponse.json({ results: [] });

  const key = `${lang}:${q.toLowerCase()}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) {
    return NextResponse.json({ results: hit.results });
  }

  try {
    // Local and English names are indexed separately ("ორბი" vs "Orbi
    // City"), so both are searched and merged, the visitor's language first.
    // Georgia's bbox also covers bits of its neighbours, hence the high limit.
    const other = lang === "default" ? "en" : "default";
    const [primary, secondary] = await Promise.allSettled([
      photon("api/", { q, limit: 30, lang, bbox: GEORGIA_BBOX }),
      photon("api/", { q, limit: 30, lang: other, bbox: GEORGIA_BBOX }),
    ]);
    if (primary.status === "rejected" && secondary.status === "rejected") throw primary.reason;
    const features = [
      ...(primary.status === "fulfilled" ? primary.value : []),
      ...(secondary.status === "fulfilled" ? secondary.value : []),
    ];

    const seenIds = new Set();
    const seen = new Set();
    const results = [];
    for (const [i, f] of features.entries()) {
      const r = toResult(f, i);
      if (!r || seenIds.has(r.id)) continue;
      seenIds.add(r.id);
      const dedupe = `${r.name}|${r.detail}`;
      if (seen.has(dedupe)) continue;
      seen.add(dedupe);
      results.push(r);
    }
    // Cafés, shops, streets and bare addresses are rarely the pickup/drop-off,
    // so they go below hotels, sights and settlements (the first result is
    // auto-picked when the field is left).
    results.sort((a, b) => LOW_PRIORITY_TYPES.has(a.type) - LOW_PRIORITY_TYPES.has(b.type));
    results.length = Math.min(results.length, 12);

    remember(key, results);
    return NextResponse.json({ results });
  } catch (err) {
    console.warn("[api/transfers/places]", err.message);
    return NextResponse.json({ results: [], error: "search_unavailable" }, { status: 502 });
  }
}
