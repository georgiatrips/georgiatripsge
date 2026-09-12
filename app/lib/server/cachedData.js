import { unstable_cache } from "next/cache";
import { listFirestoreTours, getFirestoreTourById } from "../toursFirestore";
import { listPlaces } from "../placesFirestore";
import { listPostSummaries } from "../postsFirestore";
import { listHotels } from "../hotelsFirestore";

/**
 * Recursively converts Firestore Timestamp instances, Dates, and non-plain objects
 * into plain JSON serializable primitives so they safely cross the Server -> Client Component boundary.
 */
export function serializeForClient(data) {
  if (data === null || data === undefined) return data;
  if (typeof data !== "object") return data;

  // Handle Firestore Timestamp
  if (typeof data.toMillis === "function") {
    return data.toMillis();
  }
  // Handle Date
  if (data instanceof Date) {
    return data.toISOString();
  }
  // Handle Array
  if (Array.isArray(data)) {
    return data.map(serializeForClient);
  }

  // Handle Object
  const plain = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (value && typeof value === "object" && typeof value.toMillis === "function") {
      plain[key] = value.toMillis();
    } else if (value instanceof Date) {
      plain[key] = value.toISOString();
    } else {
      plain[key] = serializeForClient(value);
    }
  }
  return plain;
}

/**
 * Cached getter for all Tours across the site.
 * Only returns real tours from Firebase Firestore.
 */
export const getCachedTours = unstable_cache(
  async () => {
    try {
      const fsTours = (await listFirestoreTours()) || [];
      return serializeForClient(fsTours);
    } catch (err) {
      console.error("[getCachedTours] Error:", err);
      return [];
    }
  },
  ["all-tours-cache"],
  {
    revalidate: 60,
    tags: ["tours"],
  }
);

/**
 * Cached getter for a single Tour by ID.
 * Only returns real tour from Firebase Firestore.
 */
export const getCachedTourById = (tourId) =>
  unstable_cache(
    async () => {
      try {
        let tour = await getFirestoreTourById(tourId);
        if (!tour) {
          const all = await listFirestoreTours();
          tour = all.find((t) => t.id === tourId || t.slug === tourId) || null;
        }
        return serializeForClient(tour);
      } catch (err) {
        console.error(`[getCachedTourById] Error for ${tourId}:`, err);
        return null;
      }
    },
    [`tour-detail-${tourId}`],
    {
      revalidate: 60,
      tags: ["tours", `tour-${tourId}`],
    }
  )();

/**
 * Cached getter for all Places.
 * Cached for 1 hour, tagged with 'places'.
 */
export const getCachedPlaces = unstable_cache(
  async () => {
    try {
      const places = await listPlaces();
      return serializeForClient(Array.isArray(places) ? places : []);
    } catch (err) {
      console.error("[getCachedPlaces] Error:", err);
      return [];
    }
  },
  ["all-places-cache"],
  {
    revalidate: 3600,
    tags: ["places"],
  }
);

/**
 * Cached getter for Blog Posts.
 * Cached for 1 hour, tagged with 'posts'.
 */
export const getCachedPosts = (limitCount = 6) =>
  unstable_cache(
    async () => {
      try {
        const posts = await listPostSummaries(limitCount);
        return serializeForClient(Array.isArray(posts) ? posts : []);
      } catch (err) {
        console.error("[getCachedPosts] Error:", err);
        return [];
      }
    },
    [`all-posts-cache-${limitCount}`],
    {
      revalidate: 3600,
      tags: ["posts"],
    }
  )();

/**
 * Cached getter for Hotels.
 * Cached for 1 hour, tagged with 'hotels'.
 */
export const getCachedHotels = unstable_cache(
  async () => {
    try {
      const hotels = await listHotels();
      return serializeForClient(Array.isArray(hotels) ? hotels : []);
    } catch (err) {
      console.error("[getCachedHotels] Error:", err);
      return [];
    }
  },
  ["all-hotels-cache"],
  {
    revalidate: 3600,
    tags: ["hotels"],
  }
);
