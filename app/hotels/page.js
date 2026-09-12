import React, { Suspense } from "react";
import { getCachedHotels } from "../lib/server/cachedData";
import { asLocalizedText } from "../lib/toursFirestore";
import { SITE_URL, getCanonicalUrl, getAlternateLanguages } from "../lib/siteConfig";
import HotelsCatalogClient from "../components/hotels/HotelsCatalogClient";
import "./hotels.css";

export const metadata = {
  title: "სასტუმროები და აპარტამენტები საქართველოში | GeorgiaTrips.ge",
  description: "საუკეთესო სასტუმროები, ვილები და საოჯახო სასტუმროები თბილისში, ბათუმში, ყაზბეგში, კახეთსა და სვანეთში. პირდაპირი დაჯავშნა საუკეთესო ფასად.",
  alternates: {
    canonical: getCanonicalUrl("/hotels", "ka"),
    languages: getAlternateLanguages("/hotels"),
  },
  openGraph: {
    title: "სასტუმროები საქართველოში — GeorgiaTrips",
    description: "აღმოაჩინეთ საუკეთესო დასასვენებელი ადგილები და სასტუმროები საქართველოში.",
    url: getCanonicalUrl("/hotels", "ka"),
    siteName: "GeorgiaTrips",
    images: [
      {
        url: "/villa.webp",
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
    images: ["/villa.webp"],
  },
};

export default async function HotelsPage() {
  const hotels = await getCachedHotels();

  const hotelsJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/ka/hotels#breadcrumbs`,
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "მთავარი",
            "item": `${SITE_URL}/ka`,
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "სასტუმროები",
            "item": `${SITE_URL}/ka/hotels`,
          },
        ],
      },
      {
        "@type": "ItemList",
        "@id": `${SITE_URL}/ka/hotels#list`,
        "name": "Hotels and Accommodations in Georgia",
        "itemListElement": (hotels || []).map((hotel, idx) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "item": {
            "@type": "Hotel",
            "name": asLocalizedText(hotel.name, "ka") || hotel.name,
            "description": asLocalizedText(hotel.desc, "ka") || hotel.desc,
            "image": hotel.gallery?.[0] || `${SITE_URL}/villa.webp`,
            "url": hotel.bookingUrl || `${SITE_URL}/ka/hotels`,
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