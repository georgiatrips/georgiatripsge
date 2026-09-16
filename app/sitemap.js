import { getCachedTours, getCachedPlaces } from "./lib/server/cachedData";
import { SITE_URL, SUPPORTED_LANGUAGES, getAlternateLanguages } from "./lib/siteConfig";
import { tourPath, placePath } from "./lib/slugs";

// Rebuilt at most hourly, and on demand when the admin panel saves content
// (see /api/admin/revalidate), instead of querying Firestore on every crawl.
export const revalidate = 3600;

// Public, content-marketing routes only. Deliberately excludes /admin, /login,
// /booking, /coupons (transactional/account-bound, not localized, no SEO
// value) and /api.
const STATIC_ROUTES = [
  "",
  "/tours",
  "/places",
  "/hotels",
  "/transfers",
  "/posts",
  "/tours-from-batumi",
  "/private-tours-batumi",
  "/things-to-do-in-batumi",
  "/waterfalls-near-batumi",
  "/batumi-airport-transfer",
  "/privacy-policy",
  "/terms",
];

// lastmod is emitted only when the real modification time is known: a date
// that changes on every request teaches Google to ignore lastmod site-wide.
// (Google ignores priority and changefreq, so they are not emitted.)
function toDate(value) {
  if (!value) return undefined;
  if (typeof value?.toMillis === "function") return new Date(value.toMillis());
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function entriesForPath(path, lastModified) {
  return SUPPORTED_LANGUAGES.map((locale) => ({
    url: `${SITE_URL}/${locale}${path}`,
    ...(lastModified ? { lastModified } : {}),
    alternates: { languages: getAlternateLanguages(path) },
  }));
}

export default async function sitemap() {
  const entries = [];

  for (const path of STATIC_ROUTES) {
    entries.push(...entriesForPath(path));
  }

  // Same cached data the tour and place pages render from, so every URL
  // listed here resolves to a real page.
  const [tours, places] = await Promise.all([
    getCachedTours().catch(() => []),
    getCachedPlaces().catch(() => []),
  ]);

  const seenTours = new Set();
  for (const tour of tours || []) {
    if (!tour?.id || seenTours.has(tour.id)) continue;
    seenTours.add(tour.id);
    entries.push(
      ...entriesForPath(tourPath(tour), toDate(tour.updatedAt || tour.createdAt))
    );
  }

  for (const place of places || []) {
    if (!place?.id) continue;
    entries.push(
      ...entriesForPath(placePath(place), toDate(place.updatedAt || place.createdAt))
    );
  }

  // Blog posts are not listed: there is no per-post route (app/[locale]/posts/[id]);
  // posts render inline on /posts.

  return entries;
}
