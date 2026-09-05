import React, { Suspense } from "react";
import { getCachedHotels } from "../lib/server/cachedData";
import { asLocalizedText } from "../lib/toursFirestore";
import HotelsCatalogClient from "../components/hotels/HotelsCatalogClient";
import "./hotels.css";

export const metadata = {
  title: "სასტუმროები და აპარტამენტები საქართველოში | GeorgiaTrips.ge",
  description: "საუკეთესო სასტუმროები, ვილები და საოჯახო სასტუმროები თბილისში, ბათუმში, ყაზბეგში, კახეთსა და სვანეთში. პირდაპირი დაჯავშნა საუკეთესო ფასად.",
  alternates: {
    canonical: "https://georgiatrips.ge/hotels",
    languages: {
      ka: "https://georgiatrips.ge/ka/hotels",
      en: "https://georgiatrips.ge/en/hotels",
      ru: "https://georgiatrips.ge/ru/hotels",
    },
  },
  openGraph: {
    title: "სასტუმროები საქართველოში — GeorgiaTrips",
    description: "აღმოაჩინეთ საუკეთესო დასასვენებელი ადგილები და სასტუმროები საქართველოში.",
    url: "https://georgiatrips.ge/hotels",
    siteName: "GeorgiaTrips",
    images: [
      {
        url: "https://georgiatrips.ge/villa.webp",
        width: 1200,
        height: 630,
        alt: "სასტუმროები საქართველოში",
      },
    ],
    locale: "ka_GE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "სასტუმროები საქართველოში — GeorgiaTrips",
    description: "სასტუმროების და ვილების საუკეთესო არჩევანი საქართველოში.",
    images: ["https://georgiatrips.ge/villa.webp"],
  },
};

export default async function HotelsPage() {
  const hotels = await getCachedHotels();

  const hotelsJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": "https://georgiatrips.ge/hotels#breadcrumbs",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "მთავარი",
            "item": "https://georgiatrips.ge",
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "სასტუმროები",
            "item": "https://georgiatrips.ge/hotels",
          },
        ],
      },
      {
        "@type": "ItemList",
        "@id": "https://georgiatrips.ge/hotels#list",
        "name": "Hotels and Accommodations in Georgia",
        "itemListElement": (hotels || []).map((hotel, idx) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "item": {
            "@type": "Hotel",
            "name": asLocalizedText(hotel.name, "ka") || hotel.name,
            "description": asLocalizedText(hotel.desc, "ka") || hotel.desc,
            "image": hotel.gallery?.[0] || "https://georgiatrips.ge/villa.webp",
            "url": hotel.bookingUrl || "https://georgiatrips.ge/hotels",
            ...(hotel.priceFrom
              ? {
                  "priceRange": `₾${hotel.priceFrom}+`,
                }
              : {}),
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(hotelsJsonLd) }}
      />
      <Suspense fallback={<div className="hm-section"><p>იტვირთება...</p></div>}>
        <HotelsCatalogClient initialHotels={hotels} />
      </Suspense>
    </>
  );
}