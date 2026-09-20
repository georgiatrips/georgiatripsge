import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { asLocalizedText, extractImageUrl } from "../../../lib/toursShared";
import { getCachedTourBySlugOrId, getCachedTours, getCachedPlaces, serializeForClient } from "../../../lib/server/cachedData";
import { getContentSlug, placePath, tourPath } from "../../../lib/slugs";
import TourDetailClient from "../../../components/tours/TourDetailClient";
import { SITE_URL, getRequestLocale, buildLocalizedMetadata } from "../../../lib/siteConfig";
import "./tourDetail.css";

// "<tour title> – Day Tour from Batumi": the searched-for words that a bare
// tour name lacks. A per-language `seoTitle` on the tour overrides it.
const TITLE_SUFFIX = {
  ka: { oneday: "ერთდღიანი ტური ბათუმიდან", multiday: "ტური ბათუმიდან" },
  en: { oneday: "Day Tour from Batumi", multiday: "Tour from Batumi" },
  ru: { oneday: "Однодневный тур из Батуми", multiday: "Тур из Батуми" },
  tr: { oneday: "Batum'dan Günübirlik Tur", multiday: "Batum'dan Tur" },
  ar: { oneday: "جولة ليوم واحد من باتومي", multiday: "جولة من باتومي" },
};

// Meta descriptions are cut at a word boundary near Google's snippet length.
function toMetaDescription(text, max = 155) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20)).replace(/[\s,.;:–—-]+$/, "")}…`;
}

const BREADCRUMB_COPY = {
  ka: { home: "მთავარი", tours: "ტურები" },
  en: { home: "Home", tours: "Tours" },
  ru: { home: "Главная", tours: "Туры" },
  tr: { home: "Ana Sayfa", tours: "Turlar" },
  ar: { home: "الرئيسية", tours: "الجولات" },
};

// Pre-render the current tours at build time; tours added later are rendered
// on first request and then cached like the rest (see [locale]/layout.js).
export async function generateStaticParams() {
  const tours = await getCachedTours().catch(() => []);
  return (tours || []).filter((t) => t?.id).map((t) => ({ id: getContentSlug(t) }));
}

function durationToIso8601(hours) {
  const n = Number(hours);
  if (!n || n <= 0) return undefined;
  return `PT${n}H`;
}

export async function generateMetadata({ params }) {
  const { locale, id: tourId } = await params;
  const lang = getRequestLocale(locale);
  const tour = await getCachedTourBySlugOrId(tourId);

  if (!tour) notFound();

  const title = asLocalizedText(tour.title, lang) || asLocalizedText(tour.title, "ka") || "Tour in Georgia";
  const desc = asLocalizedText(tour.desc, lang) || asLocalizedText(tour.desc, "ka") || "Discover the best tours in Georgia with GeorgiaTrips.";
  const imgUrl = tour.img || `${SITE_URL}/hero.webp`;

  const suffix = (TITLE_SUFFIX[lang] || TITLE_SUFFIX.en)[tour.type === "multiday" ? "multiday" : "oneday"];
  const seoTitle = asLocalizedText(tour.seoTitle, lang) || `${title} – ${suffix}`;

  return buildLocalizedMetadata({
    path: tourPath(tour),
    lang,
    title: `${seoTitle} | GeorgiaTrips`,
    description: toMetaDescription(desc),
    image: imgUrl,
  });
}

export default async function TourDetailPage({ params }) {
  const { locale, id: tourId } = await params;
  const lang = getRequestLocale(locale);

  const [rawTour, allTours, places] = await Promise.all([
    getCachedTourBySlugOrId(tourId),
    getCachedTours(),
    getCachedPlaces(),
  ]);

  if (!rawTour) notFound();

  const cleanTour = serializeForClient(rawTour);
  const cleanAllTours = serializeForClient(allTours);
  const cleanPlaces = serializeForClient(places);

  const title = rawTour ? asLocalizedText(rawTour.title, lang) || asLocalizedText(rawTour.title, "ka") || "Tour in Georgia" : "Tour";
  const desc = rawTour ? asLocalizedText(rawTour.desc, lang) || asLocalizedText(rawTour.desc, "ka") || "" : "";
  const bc = BREADCRUMB_COPY[lang] || BREADCRUMB_COPY.en;
  const pageUrl = `${SITE_URL}/${lang}${tourPath(rawTour)}`;

  // Itinerary stops link to their own place pages when the tour references a
  // place document, which also gives search engines a crawl path into them.
  const placeById = new Map((places || []).map((place) => [place.id, place]));
  const itinerary = Array.isArray(rawTour?.itinerary) && rawTour.itinerary.length > 0
    ? rawTour.itinerary.map((step, idx) => {
        const place = step?.placeId ? placeById.get(step.placeId) : null;
        return {
          "@type": "ListItem",
          "position": idx + 1,
          "item": {
            "@type": "TouristAttraction",
            "name": asLocalizedText(step.title, lang) || asLocalizedText(step.title, "ka") || "",
            "description": asLocalizedText(step.desc, lang) || asLocalizedText(step.desc, "ka") || "",
            ...(place ? { "url": `${SITE_URL}/${lang}${placePath(place)}` } : {}),
          },
        };
      })
    : undefined;

  // "7 საათი" / "7 hours" -> PT7H. Only emitted when the tour really states one.
  const durationHours = Number(
    String(asLocalizedText(rawTour.duration, "ka") || "").match(/\d+(?:\.\d+)?/)?.[0]
  );

  // Real photos of this tour, so Google can associate the images with it.
  const galleryImages = (Array.isArray(rawTour.gallery) ? rawTour.gallery : [])
    .map((item) => extractImageUrl(item))
    .filter(Boolean)
    .slice(0, 6);

  // Prices are numbers in Firestore but strings like "₾100/კაცი" in the static fallback.
  const offerPrice = Number(String(rawTour.priceGroup ?? rawTour.pricePrivate ?? "").match(/\d+(?:\.\d+)?/)?.[0]) || 0;

  const jsonLd = rawTour
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "TouristTrip",
            "@id": `${pageUrl}#trip`,
            "name": title,
            "description": desc,
            "image": galleryImages.length > 0 ? galleryImages : [rawTour.img || `${SITE_URL}/hero.webp`],
            "inLanguage": lang,
            ...(durationToIso8601(durationHours) ? { "duration": durationToIso8601(durationHours) } : {}),
            ...(itinerary ? { "itinerary": { "@type": "ItemList", "itemListElement": itinerary } } : {}),
            // No Offer without a real price: "price": 0 would advertise a free tour.
            ...(offerPrice > 0 ? {
              "offers": {
                "@type": "Offer",
                "price": offerPrice,
                "priceCurrency": "GEL",
                "availability": "https://schema.org/InStock",
                "url": pageUrl,
              },
            } : {}),
            "provider": { "@id": `${SITE_URL}/#organization` },
          },
          {
            "@type": "BreadcrumbList",
            "@id": `${pageUrl}#breadcrumbs`,
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": bc.home, "item": `${SITE_URL}/${lang}` },
              { "@type": "ListItem", "position": 2, "name": bc.tours, "item": `${SITE_URL}/${lang}/tours` },
              { "@type": "ListItem", "position": 3, "name": title, "item": pageUrl },
            ],
          },
        ],
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <Suspense fallback={<div style={{ padding: "4rem", textAlign: "center", color: "#1f2d3d" }}>...</div>}>
        <TourDetailClient
          initialTour={cleanTour}
          initialAllTours={cleanAllTours}
          initialPlaces={cleanPlaces}
        />
      </Suspense>
    </>
  );
}
