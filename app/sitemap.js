import { listFirestoreTours } from "./lib/toursFirestore";
import { ALL_TOURS } from "./lib/toursData";
import { listPlaces } from "./lib/placesFirestore";
import { listPostSummaries } from "./lib/postsFirestore";

const BASE_URL = "https://georgiatrips.ge";

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

  // 1. Static Pages
  for (const { path: route, priority, changeFrequency } of STATIC_ROUTES) {
    entries.push({
      url: `${BASE_URL}${route || ""}`,
      lastModified,
      changeFrequency,
      priority,
    });
  }

  // 2. Dynamic Tours (Firestore + Static Fallback)
  try {
    const tourIds = new Set();
    ALL_TOURS.forEach((t) => t.id && tourIds.add(t.id));

    try {
      const fsTours = await listFirestoreTours();
      fsTours?.forEach((t) => t.id && tourIds.add(t.id));
    } catch (_) {}

    for (const id of tourIds) {
      entries.push({
        url: `${BASE_URL}/tours/${encodeURIComponent(id)}`,
        lastModified,
        changeFrequency: "daily",
        priority: 0.9,
      });
    }
  } catch (err) {
    console.error("Sitemap tours error:", err);
  }

  // 3. Dynamic Places
  try {
    const places = await listPlaces().catch(() => []);
    for (const place of places) {
      if (!place?.id) continue;
      entries.push({
        url: `${BASE_URL}/places/${encodeURIComponent(place.id)}`,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.75,
      });
    }
  } catch (_) {}

  // 4. Dynamic Posts / Blog
  try {
    const posts = await listPostSummaries().catch(() => []);
    for (const post of posts) {
      if (!post?.id) continue;
      entries.push({
        url: `${BASE_URL}/posts/${encodeURIComponent(post.id)}`,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.75,
      });
    }
  } catch (_) {}

  return entries;
}

