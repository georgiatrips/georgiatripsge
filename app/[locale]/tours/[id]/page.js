import React, { Suspense } from "react";
import { asLocalizedText } from "../../../lib/toursFirestore";
import { getCachedTourById, getCachedTours, getCachedPlaces, serializeForClient } from "../../../lib/server/cachedData";
import TourDetailClient from "../../../components/tours/TourDetailClient";
import { SITE_URL, getRequestLocale, buildLocalizedMetadata } from "../../../lib/siteConfig";
import "./tourDetail.css";

const NOT_FOUND_COPY = {
  ka: { title: "ტური ვერ მოიძებნა", description: "მოთხოვნილი ტური ვერ მოიძებნა." },
  en: { title: "Tour not found", description: "The requested tour could not be found." },
  ru: { title: "Тур не найден", description: "Запрошенный тур не найден." },
  tr: { title: "Tur bulunamadı", description: "İstenen tur bulunamadı." },
  ar: { title: "لم يتم العثور على الجولة", description: "لم يتم العثور على الجولة المطلوبة." },
};

const BREADCRUMB_COPY = {
  ka: { home: "მთავარი", tours: "ტურები" },
  en: { home: "Home", tours: "Tours" },
  ru: { home: "Главная", tours: "Туры" },
  tr: { home: "Ana Sayfa", tours: "Turlar" },
  ar: { home: "الرئيسية", tours: "الجولات" },
};

function durationToIso8601(hours) {
  const n = Number(hours);
  if (!n || n <= 0) return undefined;
  return `PT${n}H`;
}

export async function generateMetadata({ params }) {
  const { locale, id: tourId } = await params;
  const lang = getRequestLocale(locale);
  const tour = await getCachedTourById(tourId);

  if (!tour) {
    const nf = NOT_FOUND_COPY[lang] || NOT_FOUND_COPY.en;
    return { title: nf.title, description: nf.description };
  }

  const title = asLocalizedText(tour.title, lang) || asLocalizedText(tour.title, "ka") || "Tour in Georgia";
  const desc = asLocalizedText(tour.desc, lang) || asLocalizedText(tour.desc, "ka") || "Discover the best tours in Georgia with GeorgiaTrips.";
  const imgUrl = tour.img || `${SITE_URL}/hero.webp`;

  return buildLocalizedMetadata({
    path: `/tours/${tourId}`,
    lang,
    title: `${title} | GeorgiaTrips`,
    description: desc,
    image: imgUrl,
  });
}

export default async function TourDetailPage({ params }) {
  const { locale, id: tourId } = await params;
  const lang = getRequestLocale(locale);

  const [rawTour, allTours, places] = await Promise.all([
    getCachedTourById(tourId),
    getCachedTours(),
    getCachedPlaces(),
  ]);

  const cleanTour = serializeForClient(rawTour);
  const cleanAllTours = serializeForClient(allTours);
  const cleanPlaces = serializeForClient(places);

  const title = rawTour ? asLocalizedText(rawTour.title, lang) || asLocalizedText(rawTour.title, "ka") || "Tour in Georgia" : "Tour";
  const desc = rawTour ? asLocalizedText(rawTour.desc, lang) || asLocalizedText(rawTour.desc, "ka") || "" : "";
  const bc = BREADCRUMB_COPY[lang] || BREADCRUMB_COPY.en;

  const itinerary = Array.isArray(rawTour?.itinerary) && rawTour.itinerary.length > 0
    ? rawTour.itinerary.map((step, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "item": {
          "@type": "TouristAttraction",
          "name": asLocalizedText(step.title, lang) || asLocalizedText(step.title, "ka") || "",
          "description": asLocalizedText(step.desc, lang) || asLocalizedText(step.desc, "ka") || "",
        },
      }))
    : undefined;

  const jsonLd = rawTour
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "TouristTrip",
            "@id": `${SITE_URL}/${lang}/tours/${tourId}#trip`,
            "name": title,
            "description": desc,
            "image": rawTour.img || `${SITE_URL}/hero.webp`,
            "touristType": ["Adventure", "Cultural", "Sightseeing"],
            ...(durationToIso8601(rawTour.durationHours) ? { "duration": durationToIso8601(rawTour.durationHours) } : {}),
            ...(itinerary ? { "itinerary": { "@type": "ItemList", "itemListElement": itinerary } } : {}),
            "offers": {
              "@type": "Offer",
              "price": rawTour.priceGroup || rawTour.pricePrivate || 0,
              "priceCurrency": "GEL",
              "availability": "https://schema.org/InStock",
              "validFrom": new Date().toISOString().split("T")[0],
              "url": `${SITE_URL}/${lang}/tours/${tourId}`,
            },
            "provider": {
              "@type": "TravelAgency",
              "name": "GeorgiaTrips",
              "url": SITE_URL,
            },
          },
          {
            "@type": "BreadcrumbList",
            "@id": `${SITE_URL}/${lang}/tours/${tourId}#breadcrumbs`,
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": bc.home, "item": `${SITE_URL}/${lang}` },
              { "@type": "ListItem", "position": 2, "name": bc.tours, "item": `${SITE_URL}/${lang}/tours` },
              { "@type": "ListItem", "position": 3, "name": title, "item": `${SITE_URL}/${lang}/tours/${tourId}` },
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
