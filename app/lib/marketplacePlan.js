// Turns a marketplace listing (Admin → "ტურები სხვა საიტზე") into a fill
// plan for one platform: the values the GT Sync extension types into the
// GetYourGuide or Tripster editor. `match` = label texts the field has on
// that site (lower-case substrings; the first match on the page wins).

import { ALL_FIELDS, PLATFORMS, VEHICLE_EN, WEEKDAYS } from "../admin/marketplaceFields";
import { VEHICLES, VEHICLE_KEYS } from "./vehicles";

const MATCH = {
  gygCategory: { gyg: ["select-type"] },
  gygWriteLang: { gyg: ["what language will you use"] },
  trType: { tripster: ["тип"] },
  title: { gyg: ["title of your", "activity title", "product title", "title"], tripster: ["название"] },
  gygShort: { gyg: ["short description"] },
  gygFull: { gyg: ["full description", "detailed description"] },
  gygHighlights: { gyg: ["highlights"] },
  trIdea: { tripster: ["идея"] },
  route: { gyg: ["itinerary"], tripster: ["маршрут"] },
  trThemes: { tripster: ["темы"] },
  trOrg: { tripster: ["организационные детали", "орг. детали"] },
  trFacts: { tripster: ["факты и детали", "факты"] },
  trAudience: { tripster: ["целевая аудитория", "для кого"] },
  city: { gyg: ["city"], tripster: ["город"] },
  gygLocations: { gyg: ["locations", "which places"] },
  gygKeywords: { gyg: ["keywords", "keyword"] },
  gygPickupArea: { gyg: ["pickup area", "pick-up area", "pickup location"] },
  trMeetApprox: { tripster: ["примерное место встречи"] },
  meetExact: { gyg: ["meeting point"], tripster: ["точное место встречи"] },
  endPoint: { gyg: ["arrive back", "end point", "drop-off"] },
  // Tripster language, duration and cut-off are custom dropdowns: picked by hand.
  languages: { gyg: ["what languages"] },
  durationHours: { gyg: ["duration"] },
  trTransport: { tripster: ["способ передвижения"] },
  kidsFrom: { tripster: ["возраст", "с детьми"] },
  gygIncl: { gyg: ["what's included", "inclusions", "included"] },
  gygExcl: { gyg: ["what's not included", "exclusions", "not included"] },
  gygNotAllowed: { gyg: ["what's not allowed", "not allowed"] },
  gygBring: { gyg: ["mandatory items", "must the customer bring", "what to bring"] },
  gygKnow: { gyg: ["know before you go", "important information"] },
  gygEmergency: { gyg: ["emergency contact", "emergency phone"] },
  gygVoucher: { gyg: ["ticket/voucher", "voucher"] },
  cutoffHours: { gyg: ["cut-off", "cutoff"] },
  trDiscount: { tripster: ["скидка"] },
  trPrice: { tripster: ["цена за"] },
  seasonTo: { tripster: ["до какой даты"] },
};

function listToLines(v) {
  return String(v || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function fieldValue(field, raw, platform) {
  const v = field.split ? raw?.[platform] : raw;
  if (v == null || v === "") return null;
  if (field.kind === "list") return listToLines(v);
  if (field.kind === "chips") return Array.isArray(v) && v.length ? v : null;
  if (field.kind === "weekdays") {
    const days = Object.entries(v || {}).filter(([, t]) => t);
    return days.length ? days.map(([i, t]) => `${WEEKDAYS[i]} ${t}`) : null;
  }
  if (field.kind === "check") return v === true ? true : null;
  return String(v);
}

function vehicleOptions(listing, platform) {
  if (listing.format === "group") {
    const g = listing.group || {};
    return [
      {
        key: "group",
        name: "ჯგუფური",
        title: platform === "gyg" ? `Group Tour (up to ${g.max || 19} people)` : "",
        ref: "",
        private: false,
        minPax: g.min || "1",
        maxPax: g.max || "",
        price: g.prices?.[platform] || "",
        priceUnit: "person",
        sitePriceGel: g.price || "",
      },
    ];
  }
  return VEHICLE_KEYS.filter((k) => listing.vehicles?.[k]?.on).map((k) => {
    const v = listing.vehicles[k];
    const pax = v.pax || VEHICLES[k].capacityPax;
    return {
      key: k,
      name: VEHICLES[k].nameKa,
      title: platform === "gyg" ? v.gygTitle || `Private Tour by ${VEHICLE_EN[k]} (up to ${pax} people)` : "",
      ref: v.ref || "",
      private: true,
      minPax: "1",
      maxPax: String(pax),
      price: v.prices?.[platform] || "",
      priceUnit: "group",
      sitePriceGel: v.price || "",
    };
  });
}

export function buildPlan(listing, platform) {
  const fields = [];
  for (const f of ALL_FIELDS) {
    if (!f.p.includes(platform) || f.kind === "info") continue;
    const value = fieldValue(f, listing.fields?.[f.key], platform);
    fields.push({
      key: f.key,
      label: f.label,
      orig: f.orig || "",
      kind: f.kind,
      value,
      match: MATCH[f.key]?.[platform] || [],
    });
  }
  const options = vehicleOptions(listing, platform);
  // Tripster has one price per offer: the first (or only) vehicle / group price.
  if (platform === "tripster" && options[0]?.price) {
    fields.push({ key: "trPrice", label: "ფასი", orig: "Цена", kind: "number", value: String(options[0].price), match: MATCH.trPrice.tripster });
  }
  const photos = listToLines(listing.fields?.photos)
    .map((u) => (u.startsWith("/") ? `https://www.georgiatrips.ge${u}` : u))
    .filter((u) => /^https:\/\//.test(u));
  return {
    id: listing.id,
    name: listing.name,
    platform,
    platformName: PLATFORMS[platform].name,
    format: listing.format,
    currency: platform === "gyg" ? listing.gygCurrency || "EUR" : "EUR",
    fields,
    options,
    photos,
    launch: listing.launch?.[platform] || {},
  };
}
