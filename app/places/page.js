import React, { Suspense } from "react";
import PlacesCatalogClient from "../components/places/PlacesCatalogClient";
import { getCachedPlaces } from "../lib/server/cachedData";
import { asLocalizedText } from "../lib/toursFirestore";
import { headers } from "next/headers";
import { SITE_URL, getCanonicalUrl, getAlternateLanguages, LANGUAGE_LOCALES, SUPPORTED_LANGUAGES } from "../lib/siteConfig";

const PLACES_META = {
  ka: {
    title: "ღირსშესანიშნაობები საქართველოში",
    description: "საქართველოს ულამაზესი ადგილები, კულტურული და ბუნებრივი ძეგლები — ყაზბეგი, სვანეთი, მარტვილი, ვარძია, უფლისციხე, პრომეთეს მღვიმე და სხვა.",
  },
  en: {
    title: "Top Attractions & Places to Visit in Georgia",
    description: "Explore the most beautiful landmarks, national parks, and historic places in Georgia — Kazbegi, Martvili Canyon, Prometheus Cave, Vardzia, and Svaneti.",
  },
  ru: {
    title: "Главные достопримечательности и красивые места Грузии",
    description: "Узнайте о лучших достопримечательностях Грузии: Казбеги, каньон Мартвили, пещера Прометея, Вардзия, Сванетия и старый Тбилиси.",
  },
  tr: {
    title: "Gürcistan'da Gezilecek En İyi Yerler ve Tarihi Mekanlar",
    description: "Gürcistan'ın en güzel turistik yerleri, kanyonları, tarihi kaleleri ve doğal güzellikleri.",
  },
  ar: {
    title: "أفضل المعالم والأماكن السياحية في جورجيا",
    description: "اكتشف أجمل الأماكن السياحية والمعالم التاريخية والطبيعية في جورجيا.",
  },
};

export async function generateMetadata() {
  const reqHeaders = await headers();
  const headerLang = reqHeaders.get("x-georgiatrips-locale");
  const lang = SUPPORTED_LANGUAGES.includes(headerLang) ? headerLang : "ka";
  const meta = PLACES_META[lang] || PLACES_META.ka;
  const canonicalUrl = getCanonicalUrl("/places", lang);
  const alternateLanguages = getAlternateLanguages("/places");
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
          url: "/tbilisi.webp",
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
      images: ["/tbilisi.webp"],
    },
  };
}

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