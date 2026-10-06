import { getCachedTours, getCachedPlaces, getCachedTransferPricing } from "../lib/server/cachedData";
import { toTourViews } from "../lib/tourView";
import { tourPath } from "../lib/slugs";
import { SITE_URL } from "../lib/siteConfig";
import { EMAIL, PHONE_DISPLAY, SOCIAL_PROFILES, WA_LINK } from "../lib/shared";
import { COMPANY_PROFILE } from "../lib/companyProfile";
import { getPrivateVehiclePrices, VEHICLE_KEYS, VEHICLES } from "../lib/vehicles";
import { ROUTE_PAGES, locationName, quoteRoutePage, routePagePath } from "../lib/transfers/routePages";

// /llms.txt — a plain-text brief for AI assistants (ChatGPT, Claude,
// Perplexity…), following the llmstxt.org format. It is generated from the
// same data the site renders, so the tours, prices and routes it states are
// the current ones; an assistant quoting it quotes the site.
export const revalidate = 3600;

const en = (path) => `${SITE_URL}/en${path}`;

const VEHICLE_LABELS = { sedan: "sedan", jeep: "4x4 jeep", minivan: "minivan", sprinter: "Sprinter minibus" };
const getVehicleLabel = (key) => VEHICLE_LABELS[key] || key;

function tourLine(view, raw) {
  const parts = [];
  if (view.duration) parts.push(view.duration);
  if (view.groupPrice) parts.push(`group ₾${view.groupPrice} per person`);
  const vehiclePrices = getPrivateVehiclePrices(raw);
  const priced = VEHICLE_KEYS.filter((key) => vehiclePrices[key] != null);
  if (priced.length) {
    parts.push(`private from ₾${Math.min(...priced.map((key) => vehiclePrices[key]))} per vehicle`);
  } else if (view.privatePrice) {
    parts.push(`private ₾${view.privatePrice} per group`);
  }
  if (view.nextDeparture?.date) parts.push(`next group date ${view.nextDeparture.date}`);
  const stops = view.stops.slice(0, 6).join(", ");
  return `- [${view.title}](${en(tourPath(view))}): ${parts.join("; ")}${stops ? `. Stops: ${stops}` : ""}`;
}

export async function GET() {
  const [rawTours, places, pricing] = await Promise.all([
    getCachedTours().catch(() => []),
    getCachedPlaces().catch(() => []),
    getCachedTransferPricing(),
  ]);
  const rawById = new Map((rawTours || []).map((t) => [t.id, t]));
  const views = toTourViews(rawTours, "en", places);
  const dayTours = views.filter((v) => !v.isMultiDay);
  const multiDay = views.filter((v) => v.isMultiDay);
  const founded = COMPANY_PROFILE.foundedYear ? ` Operating since ${COMPANY_PROFILE.foundedYear}.` : "";

  const lines = [
    "# GeorgiaTrips",
    "",
    "> Batumi-based tour and transfer company in Georgia (the country): group and private day tours from Batumi across Adjara and West Georgia, multi-day trips around Georgia, and private transfers with fixed per-vehicle prices. Booking is a free request confirmed by WhatsApp or phone; guests pay on the day of the tour or transfer.",
    "",
    `GeorgiaTrips (${SITE_URL}) is run by a local team at 27 Kutaisi Street, Batumi, Adjara, Georgia.${founded} The team works in Georgian, English, Russian, Turkish and Arabic, and the website is available in all five languages (/ka, /en, /ru, /tr, /ar).`,
    "",
    "## Key facts",
    "- Base: Batumi, Georgia. Pickup from hotels and addresses in Batumi, Gonio, Kvariati, Makhinjauri and Kobuleti.",
    "- Booking: free request on the website or WhatsApp; the team confirms by WhatsApp or phone. No prepayment — payment on the day.",
    "- Prices are in Georgian lari (₾, GEL). Group tours are priced per person; private tours and transfers per vehicle.",
    `- Vehicles: ${VEHICLE_KEYS.map((key) => `${getVehicleLabel(key)} (up to ${VEHICLES[key].capacityPax} passengers)`).join(", ")}.`,
    `- Contact: WhatsApp / phone ${PHONE_DISPLAY} (${WA_LINK}), email ${EMAIL}.`,
    "",
    `## Day tours from Batumi (${dayTours.length})`,
    ...dayTours.map((view) => tourLine(view, rawById.get(view.id))),
    "",
  ];

  if (multiDay.length) {
    lines.push(`## Multi-day tours (${multiDay.length})`, ...multiDay.map((view) => tourLine(view, rawById.get(view.id))), "");
  }

  lines.push(
    "## Private transfers (fixed price per vehicle, same price in both directions)",
    ...ROUTE_PAGES.map((route) => {
      const q = quoteRoutePage(route, pricing, "en");
      if (!q) return null;
      const fares = VEHICLE_KEYS.filter((key) => q.fares[key] != null)
        .map((key) => `${getVehicleLabel(key)} ₾${q.fares[key]}`)
        .join(", ");
      return `- [${locationName(route.from, "en")} → ${locationName(route.to, "en")}](${en(routePagePath(route))}): ${q.km} km, about ${q.duration}; ${fares}`;
    }).filter(Boolean),
    `- Any other route in Georgia: price calculator at ${en("/transfers")}`,
    "",
    "## Guides",
    `- [Tours from Batumi](${en("/tours-from-batumi")}): day trips with hotel pickup`,
    `- [Private tours from Batumi](${en("/private-tours-batumi")}): own car and driver-guide, price per vehicle`,
    `- [Things to do in Batumi](${en("/things-to-do-in-batumi")}): sights, tips and places in Adjara`,
    `- [Waterfalls near Batumi](${en("/waterfalls-near-batumi")}): Makhuntseti and the waterfalls of mountain Adjara`,
    `- [Batumi Airport transfer](${en("/batumi-airport-transfer")}): prices from Batumi Airport (BUS)`,
    `- [Places](${en("/places")}): ${(places || []).length} places on our routes, with photos`,
    "",
    "## About and contact",
    `- [About GeorgiaTrips](${en("/about")})`,
    `- [Contact](${en("/contact")})`,
    `- [Google reviews](${COMPANY_PROFILE.googleMapsUrl})`,
    ...SOCIAL_PROFILES.map((url) => `- ${url}`),
    ""
  );

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
