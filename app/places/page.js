import React, { Suspense } from "react";
import { getCachedPlaces } from "../lib/server/cachedData";
import { asLocalizedText } from "../lib/toursFirestore";
import { SITE_URL, getCanonicalUrl, getAlternateLanguages } from "../lib/siteConfig";
import PlacesCatalogClient from "../components/places/PlacesCatalogClient";
import "./places.css";

export const metadata = {
  title: "ღირსშესანიშნაობები საქართველოში | GeorgiaTrips.ge",
  description: "საქართველოს ულამაზესი ადგილები, კულტურული და ბუნებრივი ძეგლები — ყაზბეგი, სვანეთი, მარტვილი, ვარძია, უფლისციხე, პრომეთეს მღვიმე და სხვა.",
  alternates: {
    canonical: getCanonicalUrl("/places", "ka"),
    languages: getAlternateLanguages("/places"),
  },
  openGraph: {
    title: "ღირსშესანიშნაობები საქართველოში — GeorgiaTrips",
    description: "აღმოაჩინეთ საქართველოს უნიკალური ბუნება და ისტორიული ძეგლები.",
    url: getCanonicalUrl("/places", "ka"),
    siteName: "GeorgiaTrips",
    images: [
      {
        url: "/tbilisi.webp",
        width: 1200,
        height: 630,
        alt: "ღირსშესანიშნაობები საქართველოში",
      },
    ],
    locale: "ka_GE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ღირსშესანიშნაობები საქართველოში — GeorgiaTrips",
    description: "საქართველოს ულამაზესი ადგილები და ტურისტული ატრაქციები.",
    images: ["/tbilisi.webp"],
  },
};

export default async function PlacesPage() {
  const places = await getCachedPlaces();

  // Schema.org JSON-LD BreadcrumbList & ItemList
  const placesJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/ka/places#breadcrumbs`,
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
            "name": "ღირსშესანიშნაობები",
            "item": `${SITE_URL}/ka/places`,
          },
        ],
      },
      {
        "@type": "ItemList",
        "@id": `${SITE_URL}/ka/places#list`,
        "name": "Top Attractions and Places to Visit in Georgia",
        "itemListElement": (places || []).slice(0, 30).map((place, idx) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "item": {
            "@type": "TouristAttraction",
            "name": asLocalizedText(place.title, "ka") || place.title,
            "description": asLocalizedText(place.desc, "ka") || place.desc,
            "image": place.img || `${SITE_URL}/tbilisi.webp`,
            "url": `${SITE_URL}/ka/places/${place.id}`,
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(placesJsonLd) }}
      />
      <Suspense fallback={<div className="places-state">იტვირთება...</div>}>
        <PlacesCatalogClient initialPlaces={places} />
      </Suspense>
    </>
  );
}