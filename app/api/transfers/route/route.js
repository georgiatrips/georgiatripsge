import { NextResponse } from "next/server";

// Road distance and driving time between two points in Georgia, from the
// public OSRM router (OpenStreetMap data, no API key).
export const dynamic = "force-dynamic";

const OSRM_URL = "https://router.project-osrm.org/route/v1/driving/";
const USER_AGENT = "GeorgiaTrips/1.0 (+https://www.georgiatrips.ge)";

const CACHE_MS = 7 * 24 * 60 * 60 * 1000;
const CACHE_MAX = 1000;
const cache = new Map(); // key -> { at, body }

// "lat,lng" inside a box around Georgia, rounded so nearby clicks share a cache entry.
function parsePoint(value) {
  const [lat, lng] = String(value || "").split(",").map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < 40.8 || lat > 43.8 || lng < 39.8 || lng > 46.9) return null;
  return { lat: Math.round(lat * 1e4) / 1e4, lng: Math.round(lng * 1e4) / 1e4 };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const from = parsePoint(searchParams.get("from"));
  const to = parsePoint(searchParams.get("to"));
  if (!from || !to) {
    return NextResponse.json({ error: "invalid_points" }, { status: 400 });
  }

  const key = `${from.lat},${from.lng};${to.lat},${to.lng}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return NextResponse.json(hit.body);

  try {
    const url = `${OSRM_URL}${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const data = await res.json();
    const route = data.routes?.[0];
    if (data.code !== "Ok" || !route) throw new Error(`OSRM ${data.code || "no route"}`);

    const body = {
      distanceKm: Math.max(1, Math.round(route.distance / 1000)),
      durationMinutes: Math.max(5, Math.round(route.duration / 60)),
    };
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
    cache.set(key, { at: Date.now(), body });
    return NextResponse.json(body);
  } catch (err) {
    console.warn("[api/transfers/route]", err.message);
    return NextResponse.json({ error: "route_unavailable" }, { status: 502 });
  }
}
