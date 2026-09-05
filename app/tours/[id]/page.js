import React, { Suspense } from "react";
import { asLocalizedText } from "../../lib/toursFirestore";
import { getCachedTourById, getCachedTours, getCachedPlaces } from "../../lib/server/cachedData";
import TourDetailClient from "../../components/tours/TourDetailClient";
import "./tourDetail.css";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const tourId = resolvedParams?.id;

  const tour = await getCachedTourById(tourId);

  if (!tour) {
    return {
      title: "ტური ვერ მოიძებნა | GeorgiaTrips.ge",
      description: "მოთხოვნილი ტური ვერ მოიძებნა.",
    };
  }

  const titleKa = asLocalizedText(tour.title, "ka") || "ტური საქართველოში";
  const descKa = asLocalizedText(tour.desc, "ka") || "საუკეთესო ტური საქართველოში GeorgiaTrips-თან ერთად.";
  const imgUrl = tour.img || "https://georgiatrips.ge/hero.webp";
  const tourUrl = `https://georgiatrips.ge/tours/${tourId}`;

  return {
    title: `${titleKa} | GeorgiaTrips.ge`,
    description: descKa,
    alternates: {
      canonical: tourUrl,
    },
    openGraph: {
      title: `${titleKa} — GeorgiaTrips`,
      description: descKa,
      url: tourUrl,
      siteName: "GeorgiaTrips",
      images: [
        {
          url: imgUrl,
          width: 1200,
          height: 630,
          alt: titleKa,
        },
      ],
      locale: "ka_GE",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${titleKa} — GeorgiaTrips`,
      description: descKa,
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

  // Generate JSON-LD TouristTrip Schema for Google Search Snippets
  const titleKa = rawTour ? asLocalizedText(rawTour.title, "ka") || "ტური საქართველოში" : "ტური";
  const descKa = rawTour ? asLocalizedText(rawTour.desc, "ka") || "" : "";

  const jsonLd = rawTour
    ? {
        "@context": "https://schema.org",
        "@type": "TouristTrip",
        "name": titleKa,
        "description": descKa,
        "image": rawTour.img || "https://georgiatrips.ge/hero.webp",
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
          "url": "https://georgiatrips.ge",
        },
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
      <Suspense fallback={<div style={{ padding: "4rem", textAlign: "center", color: "#0d233a" }}>...</div>}>
        <TourDetailClient
          initialTour={rawTour}
          initialAllTours={allTours}
          initialPlaces={places}
        />
      </Suspense>
    </>
  );
}
