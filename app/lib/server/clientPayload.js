// Trimmed copies of tours and places for client components. Pages used to pass
// whole documents (every language, every photo, every stop description), which
// made tour and place pages ~2 MB of HTML. Keep only what cards, filters and
// search actually read.

const TOUR_CARD_FIELDS = [
  "id", "slug", "title", "img", "badge", "duration", "type", "isPopular", "isVip", "active", "hasGroup", "hasPrivate",
  "priceGroup", "pricePrivate", "groupMin", "groupMax", "privateGroupMin", "privateGroupMax", "departureDates",
  "destination", "destinations", "destinationLabel", "tourSection", "tourSectionLabel", "category", "tourNumber",
];

// Text search only needs the page's language (Georgian kept as the fallback
// the site shows when a translation is missing).
function descFor(desc, lang) {
  if (!desc || typeof desc !== "object" || !lang) return desc;
  return { [lang]: desc[lang], ka: desc.ka };
}

function pick(source, fields) {
  const out = {};
  for (const key of fields) if (source?.[key] !== undefined) out[key] = source[key];
  return out;
}

/** A tour as a card needs it. `descLang` keeps that language's description for text search. */
export function tourCardPayload(tour, { descLang = null } = {}) {
  return {
    ...pick(tour, TOUR_CARD_FIELDS),
    ...(descLang && tour?.desc !== undefined ? { desc: descFor(tour.desc, descLang) } : {}),
    // URLs only: cards show the photo count, not the photos.
    gallery: (tour?.gallery || []).map((photo) => (typeof photo === "string" ? photo : photo?.url)).filter(Boolean),
    itinerary: (tour?.itinerary || []).map((stop) => ({ title: stop?.title, placeId: stop?.placeId || "" })),
  };
}

/** A place as a card needs it. `descLang` keeps that language's description for text search. */
export function placeCardPayload(place, { descLang = null } = {}) {
  return {
    ...pick(place, ["id", "slug", "title", "img", "region", "isPopular"]),
    ...(descLang && place?.desc !== undefined ? { desc: descFor(place.desc, descLang) } : {}),
  };
}

/** Places linked from these tours' stops and photos, with just their names. */
export function placesLinkedFrom(tours, places) {
  const ids = new Set();
  for (const tour of tours || []) {
    for (const stop of tour?.itinerary || []) if (stop?.placeId) ids.add(stop.placeId);
    for (const photo of tour?.gallery || []) if (photo?.placeId) ids.add(photo.placeId);
  }
  return (places || []).filter((place) => ids.has(place.id)).map((place) => pick(place, ["id", "slug", "title"]));
}
