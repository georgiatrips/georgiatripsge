import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCachedPlaces } from "../../lib/server/cachedData";
import { asLocalizedText } from "../../lib/toursFirestore";
import { headers } from "next/headers";
import { formatRegionName } from "../../lib/placesMeta";
import { SITE_URL, getCanonicalUrl, getAlternateLanguages, LANGUAGE_LOCALES, SUPPORTED_LANGUAGES } from "../../lib/siteConfig";
import PlaceDetailClient from "../../components/places/PlaceDetailClient";
import "../places.css";

const NOT_FOUND_PLACES = {
  ka: "ადგილი ვერ მოიძებნა",
  en: "Attraction Not Found",
  ru: "Достопримечательность не найдена",
  tr: "Gezilecek Yer Bulunamadı",
  ar: "لم يتم العثور على المعلم",
};

export async function generateMetadata({ params }) {
  const [resolvedParams, reqHeaders] = await Promise.all([params, headers()]);
  const placeId = resolvedParams?.id;
  const headerLang = reqHeaders.get("x-georgiatrips-locale");
  const lang = SUPPORTED_LANGUAGES.includes(headerLang) ? headerLang : "ka";

  const places = await getCachedPlaces();
  const place = (places || []).find((p) => p.id === placeId);

  if (!place) {
    notFound();
  }

  const title = asLocalizedText(place.title, lang) || asLocalizedText(place.title, "ka") || "Attraction";
  const desc = asLocalizedText(place.desc, lang) || asLocalizedText(place.desc, "ka") || "";
  const rawRegion = asLocalizedText(place.region, lang) || asLocalizedText(place.region, "ka") || "";
  const region = rawRegion ? formatRegionName(rawRegion, lang) : "";
  const fullTitle = region ? `${title} (${region})` : title;
  const imgUrl = place.img || `${SITE_URL}/hero.webp`;
  const placeCanonical = getCanonicalUrl(`/places/${placeId}`, lang);
  const alternateLanguages = getAlternateLanguages(`/places/${placeId}`);
  const locale = LANGUAGE_LOCALES[lang] || "ka_GE";

  return {
    title: fullTitle,
    description: desc.slice(0, 160),
    alternates: {
      canonical: placeCanonical,
      languages: alternateLanguages,
    },
    openGraph: {
      title: `${fullTitle} — GeorgiaTrips`,
      description: desc.slice(0, 200),
      url: placeCanonical,
      siteName: "GeorgiaTrips",
      images: [
        {
          url: imgUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${fullTitle} — GeorgiaTrips`,
      description: desc.slice(0, 160),
      images: [imgUrl],
    },
  };
}

export default async function PlaceDetailPage({ params }) {
  const resolvedParams = await params;
  const placeId = resolvedParams?.id;

  const places = await getCachedPlaces();
  const place = (places || []).find((p) => p.id === placeId) || null;

  if (!place) {
    notFound();
  }

  const titleKa = asLocalizedText(place.title, "ka") || "ადგილი საქართველოში";
  const descKa = asLocalizedText(place.desc, "ka") || "";
  const regionKa = formatRegionName(asLocalizedText(place.region, "ka"), "ka") || "საქართველო";

  const jsonLd = {
        "@context": "https://schema.org",
        "@type": "TouristAttraction",
        "name": titleKa,
        "description": descKa,
        "image": place.img || `${SITE_URL}/hero.webp`,
        "address": {
          "@type": "PostalAddress",
          "addressRegion": regionKa,
          "addressCountry": "GE",
        },
      };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<div style={{ padding: "4rem", textAlign: "center", color: "#0d233a" }}>...</div>}>
        <PlaceDetailClient initialPlace={place} initialAllPlaces={places} />
      </Suspense>
    </>
  );
}