import React, { Suspense } from "react";
import { asLocalizedText } from "../lib/toursFirestore";
import { getCachedTours } from "../lib/server/cachedData";
import ToursCatalogClient from "../components/tours/ToursCatalogClient";
import "./tours.css";

export const metadata = {
  title: "ტურები საქართველოში | GeorgiaTrips.ge",
  description: "საუკეთესო 1-დღიანი და მრავალდღიანი ინდივიდუალური და ჯგუფური ტურები საქართველოში — ბათუმი, სვანეთი, ყაზბეგი, კახეთი, რაჭა. დაჯავშნეთ ონლაინ.",
  alternates: {
    canonical: "https://georgiatrips.ge/tours",
  },
  openGraph: {
    title: "ტურები საქართველოში — GeorgiaTrips",
    description: "აღმოაჩინეთ საქართველოს ულამაზესი კუთხეები გამოცდილ გიდებთან ერთად.",
    url: "https://georgiatrips.ge/tours",
    siteName: "GeorgiaTrips",
    images: [
      {
        url: "/hero.webp",
        width: 1200,
        height: 630,
        alt: "GeorgiaTrips Tours Catalog",
      },
    ],
    locale: "ka_GE",
    type: "website",
  },
};

export default async function ToursPage() {
  const tours = await getCachedTours();

  // JSON-LD ItemList Schema for Rich Search Results
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "ტურები საქართველოში - GeorgiaTrips",
    "description": "საქართველოს პოპულარული ტურების კატალოგი",
    "itemListElement": (tours || []).slice(0, 20).map((tour, index) => {
      const title = asLocalizedText(tour.title, "ka") || tour.title;
      const desc = asLocalizedText(tour.desc, "ka") || tour.desc;
      return {
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "TouristTrip",
          "name": title,
          "description": desc,
          "image": tour.img || "https://georgiatrips.ge/hero.webp",
          "url": `https://georgiatrips.ge/tours/${tour.id}`,
          "offers": {
            "@type": "Offer",
            "price": tour.priceGroup || tour.pricePrivate || 0,
            "priceCurrency": "GEL",
          },
        },
      };
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<div style={{ padding: "4rem", textAlign: "center", color: "#0d233a" }}>...</div>}>
        <ToursCatalogClient initialTours={tours} />
      </Suspense>
    </>
  );
}
