import React, { Suspense } from "react";
import "./hotels.css";
import HotelsCatalogClient from "../components/hotels/HotelsCatalogClient";
import { getCachedHotels } from "../lib/server/cachedData";
import { asLocalizedText } from "../lib/toursFirestore";
import { headers } from "next/headers";
import { SITE_URL, getCanonicalUrl, getAlternateLanguages, LANGUAGE_LOCALES, SUPPORTED_LANGUAGES } from "../lib/siteConfig";

const HOTELS_META = {
  ka: {
    title: "სასტუმროები და აპარტამენტები საქართველოში",
    description: "საუკეთესო სასტუმროები, ვილები და საოჯახო სასტუმროები თბილისში, ბათუმში, ყაზბეგში, კახეთსა და სვანეთში. პირდაპირი დაჯავშნა საუკეთესო ფასად.",
  },
  en: {
    title: "Hotels, Villas & Accommodations in Georgia",
    description: "Find the best hotels, luxury villas, and boutique accommodations in Tbilisi, Batumi, Kazbegi, Kakheti, and Svaneti.",
  },
  ru: {
    title: "Отели, виллы и апартаменты в Грузии",
    description: "Лучшие отели, виллы и гостевые дома в Тбилиси, Батуми, Казбеги, Кахетии и Сванетии. Прямое бронирование по лучшим ценам.",
  },
  tr: {
    title: "Gürcistan Otelleri, Villaları ve Konaklama Yerleri",
    description: "Tiflis, Batum, Kazbegi, Kaheti ve Svaneti'de en iyi otel ve villa seçenekleri.",
  },
  ar: {
    title: "فنادق وفلل وأماكن إقامة فاخرة في جورجيا",
    description: "أفضل الفنادق والمنتجعات والفلل في تبليسي، باتومي، كازبيجي، كاخيتي وسوانيتي.",
  },
};

export async function generateMetadata() {
  const reqHeaders = await headers();
  const headerLang = reqHeaders.get("x-georgiatrips-locale");
  const lang = SUPPORTED_LANGUAGES.includes(headerLang) ? headerLang : "ka";
  const meta = HOTELS_META[lang] || HOTELS_META.ka;
  const canonicalUrl = getCanonicalUrl("/hotels", lang);
  const alternateLanguages = getAlternateLanguages("/hotels");
  const locale = LANGUAGE_LOCALES[lang] || "ka_GE";

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: canonicalUrl,
      languages: alternateLanguages,
    },
    openGraph: {
      title: `${meta.title} — GeorgiaTrips`,
      description: meta.description,
      url: canonicalUrl,
      siteName: "GeorgiaTrips",
      images: [
        {
          url: "/villa.webp",
          width: 1200,
          height: 630,
          alt: meta.title,
        },
      ],
      locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${meta.title} — GeorgiaTrips`,
      description: meta.description,
      images: ["/villa.webp"],
    },
  };
}

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