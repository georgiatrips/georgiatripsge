import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { asLocalizedText } from "../../lib/toursFirestore";
import { getCachedTourById, getCachedTours, getCachedPlaces, serializeForClient } from "../../lib/server/cachedData";
import { headers } from "next/headers";
import { SITE_URL, getCanonicalUrl, getAlternateLanguages, LANGUAGE_LOCALES, SUPPORTED_LANGUAGES } from "../../lib/siteConfig";
import TourDetailClient from "../../components/tours/TourDetailClient";
import "./tourDetail.css";

const NOT_FOUND_TITLES = {
  ka: "ტური ვერ მოიძებნა",
  en: "Tour Not Found",
  ru: "Тур не найден",
  tr: "Tur Bulunamadı",
  ar: "لم يتم العثور على الجولة",
};

export async function generateMetadata({ params }) {
  const [resolvedParams, reqHeaders] = await Promise.all([params, headers()]);
  const tourId = resolvedParams?.id;
  const headerLang = reqHeaders.get("x-georgiatrips-locale");
  const lang = SUPPORTED_LANGUAGES.includes(headerLang) ? headerLang : "ka";

  const tour = await getCachedTourById(tourId);

  if (!tour) {
    notFound();
  }

  const tourTitle = asLocalizedText(tour.title, lang) || asLocalizedText(tour.title, "ka") || "Tour";
  const tourDesc = asLocalizedText(tour.desc, lang) || asLocalizedText(tour.desc, "ka") || "GeorgiaTrips";
  const imgUrl = tour.img || `${SITE_URL}/hero.webp`;
  const tourCanonical = getCanonicalUrl(`/tours/${tourId}`, lang);
  const alternateLanguages = getAlternateLanguages(`/tours/${tourId}`);
  const locale = LANGUAGE_LOCALES[lang] || "ka_GE";

  return {
    title: tourTitle,
    description: tourDesc,
    alternates: {
      canonical: tourCanonical,
      languages: alternateLanguages,
    },
    openGraph: {
      title: `${tourTitle} — GeorgiaTrips`,
      description: tourDesc,
      url: tourCanonical,
      siteName: "GeorgiaTrips",
      images: [
        {
          url: imgUrl,
          width: 1200,
          height: 630,
          alt: tourTitle,
        },
      ],
      locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${tourTitle} — GeorgiaTrips`,
      description: tourDesc,
      images: [imgUrl],
    },
  };
}

export default async function TourDetailPage({ params }) {
  const resolvedParams = await params;
  const tourId = resolvedParams?.id;

  const [rawTour, allTours, places] = await Promise.all([
    getCachedTourById(tourId),
    getCachedTours(),
    getCachedPlaces(),
  ]);

  if (!rawTour) {
    notFound();
  }

  const cleanTour = serializeForClient(rawTour);
  const cleanAllTours = serializeForClient(allTours);
  const cleanPlaces = serializeForClient(places);

  // Generate JSON-LD TouristTrip Schema for Google Search Snippets
  const titleKa = asLocalizedText(rawTour.title, "ka") || "ტური საქართველოში";
  const descKa = asLocalizedText(rawTour.desc, "ka") || "";

  const jsonLd = {
        "@context": "https://schema.org",
        "@type": "TouristTrip",
        "name": titleKa,
        "description": descKa,
        "image": rawTour.img || `${SITE_URL}/hero.webp`,
        "touristType": ["Adventure", "Cultural", "Sightseeing"],
        "offers": {
          "@type": "Offer",
          "price": rawTour.priceGroup || rawTour.pricePrivate || 0,
          "priceCurrency": "GEL",
          "availability": "https://schema.org/InStock",
          "validFrom": new Date().toISOString().split("T")[0],
        },
        "provider": {
          "@type": "TravelAgency",
          "name": "GeorgiaTrips",
          "url": SITE_URL,
        },
      };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<div style={{ padding: "4rem", textAlign: "center", color: "#0d233a" }}>...</div>}>
        <TourDetailClient
          initialTour={cleanTour}
          initialAllTours={cleanAllTours}
          initialPlaces={cleanPlaces}
        />
      </Suspense>
    </>
  );
}
