/**
 * Transfer places added by hand in the admin panel (Firestore
 * settings/transfer_places), for hotels and spots OpenStreetMap does not
 * have yet. The calculator's search lists them first. Pure helpers: no
 * Firebase here.
 *
 * place: { id, name, nameEn, aliases, type, lat, lng }
 *   name    — Georgian (or the only) name
 *   nameEn  — Latin name shown in the other languages (optional)
 *   aliases — extra spellings to match, comma separated ("Pullman, პულმანი")
 *   type    — icon type, as in /api/transfers/places (hotel, sight, …)
 */

export const CUSTOM_PLACE_TYPES = ["hotel", "sight", "church", "nature", "airport", "station", "city", "village", "food", "shop", "place"];

// Georgia plus a margin: a point outside is a typo or a different place.
const BOUNDS = { minLat: 40.8, maxLat: 43.8, minLng: 39.8, maxLng: 46.9 };

export const inGeorgia = (lat, lng) =>
  Number.isFinite(lat) && Number.isFinite(lng) &&
  lat >= BOUNDS.minLat && lat <= BOUNDS.maxLat && lng >= BOUNDS.minLng && lng <= BOUNDS.maxLng;

const round5 = (n) => Math.round(n * 1e5) / 1e5;

/**
 * Coordinates from a Google Maps link or a pasted "41.65, 41.63".
 * Prefers the place's own pin (!3d…!4d…) over the map's centre (@…).
 * Returns { lat, lng } or null.
 */
export function parseMapCoordinates(text) {
  if (!text) return null;
  let s = String(text).trim();
  try {
    s = decodeURIComponent(s);
  } catch {
    // keep the raw text
  }
  const patterns = [
    /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/,
    /[?&](?:q|query|ll|center|destination|daddr)=(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/,
    /@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/,
    /^\(?\s*(-?\d{1,2}\.\d+)\s*[,;\s]\s*(-?\d{1,3}\.\d+)\s*\)?$/,
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (!m) continue;
    const lat = Number(m[1]);
    const lng = Number(m[2]);
    if (inGeorgia(lat, lng)) return { lat: round5(lat), lng: round5(lng) };
  }
  return null;
}

/** "Pullman Batumi" from .../maps/place/Pullman+Batumi/@..., else "". */
export function nameFromMapLink(text) {
  const m = String(text || "").match(/\/maps\/place\/([^/@?]+)/);
  if (!m) return "";
  try {
    return decodeURIComponent(m[1].replace(/\+/g, " ")).trim();
  } catch {
    return m[1].replace(/\+/g, " ").trim();
  }
}

const clean = (v, max = 120) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Drops incomplete entries and coerces the rest. */
export function normalizeCustomPlaces(raw) {
  const list = Array.isArray(raw) ? raw : [];
  const out = [];
  const ids = new Set();
  for (const p of list) {
    const name = clean(p?.name);
    const lat = Number(p?.lat);
    const lng = Number(p?.lng);
    if (!name || !inGeorgia(lat, lng)) continue;
    let id = clean(p.id, 40) || `p${out.length}`;
    while (ids.has(id)) id += "_";
    ids.add(id);
    out.push({
      id,
      name,
      nameEn: clean(p.nameEn),
      aliases: clean(p.aliases, 300),
      type: CUSTOM_PLACE_TYPES.includes(p.type) ? p.type : "place",
      lat: round5(lat),
      lng: round5(lng),
    });
  }
  return out;
}

const fold = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

/**
 * Places whose name, English name or an alias contains every word of the
 * query ("pullman bat" matches "Pullman Batumi"), best (prefix) matches first.
 */
export function matchCustomPlaces(places, query, limit = 6) {
  const words = fold(query).split(" ").filter(Boolean);
  if (!words.length) return [];
  const scored = [];
  for (const p of places) {
    const names = [p.name, p.nameEn, ...String(p.aliases || "").split(",")].map(fold).filter(Boolean);
    let best = -1;
    for (const n of names) {
      if (!words.every((w) => n.includes(w))) continue;
      best = Math.max(best, n.startsWith(words[0]) ? 2 : n.split(" ").some((part) => part.startsWith(words[0])) ? 1 : 0);
    }
    if (best >= 0) scored.push({ p, best });
  }
  return scored.sort((a, b) => b.best - a.best).slice(0, limit).map((s) => s.p);
}
