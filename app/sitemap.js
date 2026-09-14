import { listFirestoreTours } from "./lib/toursFirestore";
import { ALL_TOURS } from "./lib/toursData";
import { listPlaces } from "./lib/placesFirestore";
import { SITE_URL, SUPPORTED_LANGUAGES, getAlternateLanguages } from "./lib/siteConfig";

// Public, content-marketing routes only. Deliberately excludes /admin, /login,
// /booking, /coupons (transactional/account-bound, not localized, no SEO
// value) and /api.
const STATIC_ROUTES = [
  { path: "", priority: 1.0, changeFrequency: "daily" },
  { path: "/tours", priority: 0.95, changeFrequency: "daily" },
  { path: "/places", priority: 0.85, changeFrequency: "weekly" },
  { path: "/hotels", priority: 0.85, changeFrequency: "weekly" },
  { path: "/transfers", priority: 0.9, changeFrequency: "weekly" },
  { path: "/posts", priority: 0.8, changeFrequency: "daily" },
  { path: "/tours-from-batumi", priority: 0.8, changeFrequency: "weekly" },
  { path: "/private-tours-batumi", priority: 0.8, changeFrequency: "weekly" },
  { path: "/things-to-do-in-batumi", priority: 0.8, changeFrequency: "weekly" },
  { path: "/waterfalls-near-batumi", priority: 0.75, changeFrequency: "weekly" },
  { path: "/batumi-airport-transfer", priority: 0.75, changeFrequency: "weekly" },
  { path: "/privacy-policy", priority: 0.3, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.3, changeFrequency: "monthly" },
];

function toMillisDate(value) {
  if (!value) return new Date();
  if (typeof value?.toMillis === "function") return new Date(value.toMillis());
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function entriesForPath(path, { priority, changeFrequency, lastModified }) {
  return SUPPORTED_LANGUAGES.map((locale) => ({
    url: `${SITE_URL}/${locale}${path}`,
    lastModified,
    changeFrequency,
    priority,
    alternates: { languages: getAlternateLanguages(path) },
  }));
}

export default async function sitemap() {
  const now = new Date();
  const entries = [];

  // 1. Static Pages — every locale
  for (const { path, priority, changeFrequency } of STATIC_ROUTES) {
    entries.push(...entriesForPath(path, { priority, changeFrequency, lastModified: now }));
  }

  // 2. Dynamic Tours (real Firestore data; static ALL_TOURS is only a
  // fallback if Firestore is unreachable — deleted/unpublished tours simply
  // don't come back from listFirestoreTours, so they're naturally excluded)
  try {
    const fsTours = await listFirestoreTours().catch(() => []);
    const tours = Array.isArray(fsTours) && fsTours.length > 0 ? fsTours : ALL_TOURS;

    const seen = new Set();
    for (const tour of tours) {
      if (!tour?.id || seen.has(tour.id)) continue;
      seen.add(tour.id);
      const lastModified = toMillisDate(tour.updatedAt || tour.createdAt);
      entries.push(...entriesForPath(`/tours/${encodeURIComponent(tour.id)}`, {
        priority: 0.9,
        changeFrequency: "daily",
        lastModified,
      }));
    }
  } catch (err) {
    console.error("Sitemap tours error:", err);
  }

  // 3. Dynamic Places
  try {
    const places = await listPlaces().catch(() => []);
    for (const place of places) {
      if (!place?.id) continue;
      const lastModified = toMillisDate(place.updatedAt || place.createdAt);
      entries.push(...entriesForPath(`/places/${encodeURIComponent(place.id)}`, {
        priority: 0.75,
        changeFrequency: "weekly",
        lastModified,
      }));
    }
  } catch (_) {}

  // NOTE: blog posts are intentionally not included here — there is no
  // individually crawlable post detail route (app/[locale]/posts/[id]) in
  // this codebase; posts render inline on /posts via PostsCatalogClient.
  // Emitting /posts/<id> URLs would point search engines at pages that
  // don't exist. Adding a real per-post route is a good follow-up but is a
  // product/content decision, not a sitemap fix.

  return entries;
}
