import { getCachedTours, getCachedPlaces } from "./lib/server/cachedData";
import { SITE_URL, SUPPORTED_LANGUAGES, getAlternateLanguages } from "./lib/siteConfig";

const STATIC_ROUTES = [
  { path: "", priority: 1.0, changeFrequency: "daily" },
  { path: "/tours", priority: 0.95, changeFrequency: "daily" },
  { path: "/places", priority: 0.85, changeFrequency: "weekly" },
  { path: "/hotels", priority: 0.85, changeFrequency: "weekly" },
  { path: "/transfers", priority: 0.9, changeFrequency: "weekly" },
  { path: "/posts", priority: 0.8, changeFrequency: "daily" },
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

  // 2. Published Tours (Firestore + Published Static Tours) across all supported languages
  try {
    const allTours = (await getCachedTours()) || [];
    const seenTourIds = new Set();

    for (const tour of allTours) {
      if (!tour?.id || seenTourIds.has(tour.id)) continue;
      seenTourIds.add(tour.id);
      addLocalizedEntries(`/tours/${encodeURIComponent(tour.id)}`, 0.9, "daily");
    }
  } catch (err) {
    console.error("Sitemap tours error:", err);
  }

  // 3. Dynamic Places across all supported languages
  try {
    const places = (await getCachedPlaces()) || [];
    const seenPlaceIds = new Set();

    for (const place of places) {
      if (!place?.id || seenPlaceIds.has(place.id)) continue;
      seenPlaceIds.add(place.id);
      addLocalizedEntries(`/places/${encodeURIComponent(place.id)}`, 0.75, "weekly");
    }
  } catch (err) {
    console.error("Sitemap places error:", err);
  }

  return entries;
}
