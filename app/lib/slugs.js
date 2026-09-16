// Readable URL slugs for tours and places, e.g.
// /en/tours/tropical-adjara-sea-castle-and-waterfalls instead of the
// Firestore ID. A document's stored `slug` wins; otherwise the slug is derived
// from its English title. The admin panel stores the slug on the first save so
// later title edits do not change the URL. Old ID URLs redirect to the slug
// (see proxy.js), so both always resolve.

import { getContentSlug, slugify } from "./toursShared";

export { getContentSlug, slugify };

/** A slug for `item` that no other item in `items` already uses. */
export function uniqueSlugFor(item, items = []) {
  const base = getContentSlug(item) || "item";
  const taken = new Set(
    items.filter((other) => other && other.id !== item?.id).map((other) => getContentSlug(other))
  );
  let slug = base;
  for (let n = 2; taken.has(slug); n += 1) slug = `${base}-${n}`;
  return slug;
}

/** Finds an item by slug first, then by Firestore ID. */
export function findBySlugOrId(items = [], param = "") {
  const key = decodeURIComponent(String(param || ""));
  const list = Array.isArray(items) ? items : [];
  const bySlug = list.find((item) => getContentSlug(item) === key);
  if (bySlug) return { item: bySlug, matchedBy: "slug" };
  const byId = list.find((item) => String(item?.id) === key);
  if (byId) return { item: byId, matchedBy: "id" };
  return { item: null, matchedBy: null };
}

export function tourPath(tour) {
  return `/tours/${encodeURIComponent(getContentSlug(tour))}`;
}

export function placePath(place) {
  return `/places/${encodeURIComponent(getContentSlug(place))}`;
}
