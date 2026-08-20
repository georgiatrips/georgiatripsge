import { listFirestoreTours } from "./lib/toursFirestore";
import { ALL_TOURS } from "./lib/toursData";
import { listPlaces } from "./lib/placesFirestore";
import { listPostSummaries } from "./lib/postsFirestore";

const BASE_URL = "https://georgiatrips.ge";
const LANGUAGES = ["ka", "en", "ru", "tr", "ar"];
const localizedUrl = (lang, route = "") => `${BASE_URL}/${lang}${route || ""}`;

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

  // 1. Static Pages
  for (const { path: route, priority, changeFrequency } of STATIC_ROUTES) {
    const languageAlternates = {};
    for (const lang of LANGUAGES) {
      languageAlternates[lang] = localizedUrl(lang, route);
    }

    entries.push({
      url: localizedUrl("ka", route),
      lastModified,
      changeFrequency,
      priority,
      alternates: {
        languages: languageAlternates,
      },
    });

  }

  // 2. Dynamic Tours (Firestore + Fallback)
  try {
    const tourIds = new Set();
    ALL_TOURS.forEach((t) => t.id && tourIds.add(t.id));

    try {
      const fsTours = await listFirestoreTours();
      fsTours?.forEach((t) => t.id && tourIds.add(t.id));
    } catch (_) {}

    for (const id of tourIds) {
      const tourRoute = `/tours/${id}`;
      const languageAlternates = {};
      for (const lang of LANGUAGES) {
        languageAlternates[lang] = localizedUrl(lang, tourRoute);
      }

      entries.push({
        url: localizedUrl("ka", tourRoute),
        lastModified,
        changeFrequency: "daily",
        priority: 0.9,
        alternates: {
          languages: languageAlternates,
        },
      });

    }
  } catch (err) {
    console.error("Sitemap tours error:", err);
  }

  // 3. Dynamic Places & Posts
  try {
    const places = await listPlaces().catch(() => []);
    for (const place of places) {
      if (!place?.id) continue;
      const placeUrl = localizedUrl("ka", `/places/${place.id}`);
      entries.push({
        url: placeUrl,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.75,
      });
    }
  } catch (_) {}

  try {
    const posts = await listPostSummaries().catch(() => []);
    for (const post of posts) {
      if (!post?.id) continue;
      const postUrl = localizedUrl("ka", `/posts/${post.id}`);
      entries.push({
        url: postUrl,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.75,
      });
    }
  } catch (_) {}

  return entries;
}
