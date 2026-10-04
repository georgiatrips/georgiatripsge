import { unstable_cache } from "next/cache";
import { listFirestoreTours, getFirestoreTourById, isTourActive } from "../toursFirestore";
import { ALL_TOURS as staticTours } from "../toursData";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { listPlaces, normalizePlace } from "../placesFirestore";
import { listPostSummaries } from "../postsFirestore";
import { listHotels } from "../hotelsFirestore";
import { findBySlugOrId, getContentSlug } from "../slugs";
import { listReviews } from "../reviewsFirestore";
import { getTransferPricing } from "../transfers/pricingFirestore";
import { DEFAULT_TRANSFER_PRICING, normalizeTransferPricing } from "../transfers/pricing";

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
 * Cached getter for all Tours across the site — switched-off tours
 * (`active: false`) are left out. Cached for 1 hour, tagged with 'tours'.
 */
export const getCachedTours = unstable_cache(
  async () => {
    try {
      const fsTours = await listFirestoreTours();
      if (Array.isArray(fsTours) && fsTours.length > 0) {
        return serializeForClient(fsTours.filter(isTourActive));
      }
      return serializeForClient(staticTours);
    } catch (err) {
      console.error("[getCachedTours] Error:", err);
      return serializeForClient(staticTours);
    }
  },
  ["all-tours-cache"],
  {
    revalidate: 3600, // 1 hour
    tags: ["tours"],
  }
);

// Thrown (never returned) for a missing tour: unstable_cache does not store
// thrown results, so a miss is not cached and a tour that appears later — or a
// lookup that failed transiently — is not stuck as "not found" for an hour.
const TOUR_NOT_FOUND = "TOUR_NOT_FOUND";

const cachedTourById = (tourId) =>
  unstable_cache(
    async () => {
      let tour = null;
      try {
        tour = await getFirestoreTourById(tourId);
        if (!tour) {
          const all = await listFirestoreTours();
          tour = all.find((t) => t.id === tourId) || null;
        }
      } catch (err) {
        console.error(`[getCachedTourById] Error for ${tourId}:`, err);
      }
      tour ??= staticTours.find((t) => t.id === tourId) || null;
      if (!isTourActive(tour)) throw new Error(TOUR_NOT_FOUND);
      return serializeForClient(tour);
    },
    [`tour-detail-${tourId}`],
    {
      revalidate: 3600,
      tags: ["tours", `tour-${tourId}`],
    }
  )();

/**
 * Cached getter for a single Tour by ID. Returns null when the tour does not
 * exist. Found tours are cached for 1 hour, tagged with 'tours' and `tour-${id}`.
 */
export async function getCachedTourById(tourId) {
  try {
    return await cachedTourById(tourId);
  } catch (err) {
    if (err?.message === TOUR_NOT_FOUND) return null;
    throw err;
  }
}

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

/**
 * Cached getter for site-wide reviews (admin-entered or synced from Google).
 * Cached for 1 hour, tagged with 'reviews'. Returns [] when none exist, so
 * pages can simply omit review UI instead of showing placeholders.
 */
export const getCachedReviews = unstable_cache(
  async () => {
    try {
      const reviews = await listReviews();
      return serializeForClient(Array.isArray(reviews) ? reviews : []);
    } catch (err) {
      console.error("[getCachedReviews] Error:", err);
      return [];
    }
  },
  ["site-reviews-cache"],
  {
    revalidate: 3600,
    tags: ["reviews"],
  }
);

/**
 * Cached getter for the transfer calculator's distance-band prices.
 * Cached for 1 minute, tagged with 'transfers' (the admin pricing tab revalidates it).
 */
export const getCachedTransferPricing = unstable_cache(
  async () => {
    try {
      return serializeForClient(await getTransferPricing());
    } catch (err) {
      console.error("[getCachedTransferPricing] Error:", err);
      return normalizeTransferPricing(DEFAULT_TRANSFER_PRICING);
    }
  },
  ["transfer-pricing-cache"],
  {
    // Short, so saved prices show up within a minute even if the admin's
    // revalidate call does not get through.
    revalidate: 60,
    tags: ["transfers"],
  }
);

/**
 * Resolves a tour URL segment, which is normally the slug but may be the
 * Firestore ID (old links). Falls back to a direct ID lookup for tours newer
 * than the cached list. Returns null when nothing matches.
 */
export async function getCachedTourBySlugOrId(param) {
  const tours = await getCachedTours();
  const { item } = findBySlugOrId(tours, param);
  if (item) return item;
  const byId = await getCachedTourById(param);
  if (byId) return byId;
  const bySlug = await findBySlugUncached("tours", param);
  return isTourActive(bySlug) ? serializeForClient(bySlug) : null;
}

/** Same as getCachedTourBySlugOrId, for places. */
export async function getCachedPlaceBySlugOrId(param) {
  const places = await getCachedPlaces();
  const { item } = findBySlugOrId(places, param);
  if (item) return item;
  const bySlug = await findBySlugUncached("places", param);
  return bySlug ? serializeForClient(normalizePlace(bySlug)) : null;
}

// An item saved within the last cache hour is missing from the cached lists.
// Look its slug up directly, so the new page renders instead of a not-found
// that ISR would then keep serving long after the item exists.
async function findBySlugUncached(collectionName, slug) {
  const key = decodeURIComponent(String(slug || ""));
  if (!key) return null;
  try {
    const snap = await getDocs(query(collection(db, collectionName), where("slug", "==", key), limit(1)));
    const found = snap.docs[0];
    return found ? { id: found.id, ...found.data() } : null;
  } catch (err) {
    console.error(`[findBySlugUncached] ${collectionName}/${key}:`, err);
    return null;
  }
}

/**
 * Slug/ID pairs for every tour and place; proxy.js uses them (via
 * /content-index.json) to redirect ID URLs and 404 unknown ones.
 */
export async function getContentIndex() {
  const [tours, places] = await Promise.all([getCachedTours(), getCachedPlaces()]);
  const pairs = (list) =>
    (Array.isArray(list) ? list : [])
      .filter((item) => item?.id)
      .map((item) => ({ id: String(item.id), slug: getContentSlug(item) }));
  return { tours: pairs(tours), places: pairs(places) };
}
