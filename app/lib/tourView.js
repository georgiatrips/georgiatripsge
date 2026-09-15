import { normalizeFirestoreTour, translateDuration, translateLocation } from "./toursFirestore";
import { translate } from "./i18n/translate";

// Presentation model for tour cards and summaries. Pure functions — safe in
// server and client components. Everything shown comes from the Firestore
// document; nothing is inferred beyond what the data supports.

function positiveNumber(value) {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const INTL_LOCALE = { ka: "ka-GE", en: "en-GB", ru: "ru-RU", tr: "tr-TR", ar: "ar-u-nu-latn" };

export function formatTourDate(iso, lang = "en", options = { day: "numeric", month: "short" }) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [y, m, d] = iso.split("-").map(Number);
  try {
    return new Intl.DateTimeFormat(INTL_LOCALE[lang] || "en-GB", { ...options, timeZone: "UTC" }).format(Date.UTC(y, m - 1, d));
  } catch {
    return iso;
  }
}

/** Future group departures, soonest first. */
export function getUpcomingDepartures(raw) {
  if (!raw?.hasGroup) return [];
  const today = todayIso();
  return (Array.isArray(raw.departureDates) ? raw.departureDates : [])
    .map((entry) => {
      const date = typeof entry === "string" ? entry : entry?.date;
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
      const seats = entry && typeof entry === "object" ? Number(entry.freeSeats) : NaN;
      return { date, freeSeats: Number.isFinite(seats) ? seats : null };
    })
    .filter((d) => d && d.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Only real, low seat counts are worth surfacing; a full bus is not scarcity. */
export function isLowSeats(freeSeats, capacity) {
  if (typeof freeSeats !== "number" || freeSeats <= 0) return false;
  return freeSeats <= Math.min(6, Math.max(1, Math.floor((capacity || 18) / 3)));
}

export function toTourView(raw, lang = "en", places = []) {
  const tour = normalizeFirestoreTour(raw, lang, places);
  if (!tour) return null;

  const groupPrice = tour.hasGroup ? positiveNumber(raw.priceGroup) : null;
  const privatePrice = tour.hasPrivate ? positiveNumber(raw.pricePrivate) : null;
  const departures = getUpcomingDepartures(raw);
  const badgeKey = typeof raw.badge === "string" ? raw.badge : raw.badge?.ka || "";
  const badges = translate(lang, "tourBadges");
  const badge = badgeKey ? (badges && typeof badges === "object" && badges[badgeKey]) || (lang === "ka" ? badgeKey : "") : "";

  return {
    id: tour.id,
    title: tour.title,
    desc: tour.desc,
    img: tour.img,
    photoCount: Array.isArray(tour.gallery) ? tour.gallery.length : 0,
    region: translateLocation(tour.destinationLabel || tour.destination || "", lang).replace(/^📍\s*/, ""),
    duration: translateDuration(tour.duration, lang),
    isMultiDay: tour.type === "multiday",
    hasGroup: Boolean(groupPrice),
    hasPrivate: Boolean(privatePrice),
    groupPrice,
    privatePrice,
    groupMax: tour.hasGroup ? positiveNumber(raw.groupMax) : null,
    privateMax: tour.hasPrivate ? positiveNumber(raw.privateGroupMax) || positiveNumber(raw.groupMax) : null,
    departures,
    nextDeparture: departures[0] || null,
    stops: (tour.itinerary || []).map((stop) => stop.title).filter(Boolean),
    badge,
    isPopular: Boolean(raw.isPopular),
  };
}

export function toTourViews(list, lang = "en", places = []) {
  return (Array.isArray(list) ? list : []).map((raw) => toTourView(raw, lang, places)).filter(Boolean);
}

/** Word-boundary excerpt, so cards don't repeat the full tour description. */
export function excerpt(text, max = 150) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:—–-]+$/, "")}…`;
}
