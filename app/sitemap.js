import { getCachedTours, getCachedPlaces } from "./lib/server/cachedData";
import { SITE_URL, SUPPORTED_LANGUAGES, getAlternateLanguages } from "./lib/siteConfig";
import { tourPath, placePath } from "./lib/slugs";

// sitemap.js is a metadata route: Next caches it at build time unless it opts
// into dynamic rendering, and revalidatePath("/sitemap.xml") does not reach it.
// That left tours and places added after the last deploy out of the sitemap
// entirely. Rendering per request keeps it in step with Firestore; the data
// itself still comes from the 1-hour cached getters, so crawls do not turn
// into Firestore reads.
export const dynamic = "force-dynamic";

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

function entriesForPath(path, lastModified, images) {
  return SUPPORTED_LANGUAGES.map((locale) => ({
    url: `${SITE_URL}/${locale}${path}`,
    ...(lastModified ? { lastModified } : {}),
    // Google discovers images through the sitemap even when they are loaded
    // lazily; only the tour's/place's own photo is listed, never site chrome.
    ...(images && images.length > 0 ? { images } : {}),
    alternates: { languages: getAlternateLanguages(path) },
  }));
}

function mainImage(item) {
  const url = typeof item?.img === "string" ? item.img.trim() : "";
  if (!url) return [];
  return [url.startsWith("http") ? url : `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`];
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
      ...entriesForPath(tourPath(tour), toDate(tour.updatedAt || tour.createdAt), mainImage(tour))
    );
  }

  for (const place of places || []) {
    if (!place?.id) continue;
    entries.push(
      ...entriesForPath(placePath(place), toDate(place.updatedAt || place.createdAt), mainImage(place))
    );
  }

  // Blog posts are not listed: there is no per-post route (app/[locale]/posts/[id]);
  // posts render inline on /posts.

  return entries;
}
