import { unstable_cache } from "next/cache";
import { listFirestoreTours, getFirestoreTourById } from "../toursFirestore";
import { ALL_TOURS as staticTours } from "../toursData";
import { listPlaces } from "../placesFirestore";
import { listPostSummaries } from "../postsFirestore";
import { listHotels } from "../hotelsFirestore";

/**
 * Cached getter for all Tours across the site.
 * Cached for 1 hour, tagged with 'tours'.
 */
export const getCachedTours = unstable_cache(
  async () => {
    try {
      const fsTours = await listFirestoreTours();
      if (Array.isArray(fsTours) && fsTours.length > 0) {
        const fsMap = new Map(fsTours.map((t) => [t.id, t]));
        const merged = [...fsTours];
        staticTours.forEach((st) => {
          if (!fsMap.has(st.id)) merged.push(st);
        });
        return merged;
      }
      return staticTours;
    } catch (err) {
      console.error("[getCachedTours] Error:", err);
      return staticTours;
    }
  },
  ["all-tours-cache"],
  {
    revalidate: 3600, // 1 hour
    tags: ["tours"],
  }
);

/**
 * Cached getter for a single Tour by ID.
 * Cached for 1 hour, tagged with 'tours' and `tour-${id}`.
 */
export const getCachedTourById = (tourId) =>
  unstable_cache(
    async () => {
      try {
        let tour = await getFirestoreTourById(tourId);
        if (!tour) {
          const all = await listFirestoreTours();
          tour = all.find((t) => t.id === tourId) || null;
        }
        if (!tour) {
          tour = staticTours.find((t) => t.id === tourId) || null;
        }
        return tour;
      } catch (err) {
        console.error(`[getCachedTourById] Error for ${tourId}:`, err);
        return staticTours.find((t) => t.id === tourId) || null;
      }
    },
    [`tour-detail-${tourId}`],
    {
      revalidate: 3600,
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
      return Array.isArray(places) ? places : [];
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
        return Array.isArray(posts) ? posts : [];
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
      return Array.isArray(hotels) ? hotels : [];
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
