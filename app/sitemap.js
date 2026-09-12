import { listFirestoreTours } from "./lib/toursFirestore";
import { ALL_TOURS } from "./lib/toursData";
import { listPlaces } from "./lib/placesFirestore";
import { listPostSummaries } from "./lib/postsFirestore";
import { SITE_URL, SUPPORTED_LANGUAGES, getAlternateLanguages } from "./lib/siteConfig";

const STATIC_ROUTES = [
  { path: "", priority: 1.0, changeFrequency: "daily" },
  { path: "/tours", priority: 0.95, changeFrequency: "daily" },
  { path: "/places", priority: 0.85, changeFrequency: "weekly" },
  { path: "/hotels", priority: 0.85, changeFrequency: "weekly" },
  { path: "/transfers", priority: 0.9, changeFrequency: "weekly" },
  { path: "/posts", priority: 0.8, changeFrequency: "daily" },
  { path: "/coupons", priority: 0.8, changeFrequency: "daily" },
  { path: "/privacy-policy", priority: 0.3, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.3, changeFrequency: "monthly" },
];

export default async function sitemap() {
  const lastModified = new Date();
  const entries = [];

  // Helper to push all multilingual versions of a route
  const addLocalizedEntries = (routePath, priority, changeFrequency) => {
    const alternates = { languages: getAlternateLanguages(routePath) };
    for (const lang of SUPPORTED_LANGUAGES) {
      const cleanRoute = routePath.startsWith("/") ? routePath : `/${routePath}`;
      const url = `${SITE_URL}/${lang}${routePath === "" ? "" : cleanRoute}`;
      entries.push({
        url,
        lastModified,
        changeFrequency,
        priority,
        alternates,
      });
    }
  };

  // 1. Static Pages across all supported languages
  for (const { path: route, priority, changeFrequency } of STATIC_ROUTES) {
    addLocalizedEntries(route, priority, changeFrequency);
  }

  // 2. Dynamic Tours (Firestore + Static Fallback) across all supported languages
  try {
    const tourIds = new Set();
    const fsTours = await listFirestoreTours().catch(() => []);
    if (Array.isArray(fsTours) && fsTours.length > 0) {
      fsTours.forEach((t) => t.id && tourIds.add(t.id));
    } else {
      ALL_TOURS.forEach((t) => t.id && tourIds.add(t.id));
    }

    for (const id of tourIds) {
      addLocalizedEntries(`/tours/${encodeURIComponent(id)}`, 0.9, "daily");
    }
  } catch (err) {
    console.error("Sitemap tours error:", err);
  }

  // 3. Dynamic Places across all supported languages
  try {
    const places = await listPlaces().catch(() => []);
    for (const place of places) {
      if (!place?.id) continue;
      addLocalizedEntries(`/places/${encodeURIComponent(place.id)}`, 0.75, "weekly");
    }
  } catch (_) {}

  // 4. Dynamic Posts / Blog across all supported languages
  try {
    const posts = await listPostSummaries().catch(() => []);
    for (const post of posts) {
      if (!post?.id) continue;
      addLocalizedEntries(`/posts/${encodeURIComponent(post.id)}`, 0.75, "weekly");
    }
  } catch (_) {}

  return entries;
}
