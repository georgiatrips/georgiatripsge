import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCachedPlaces, getCachedPlaceBySlugOrId, getCachedTours } from "../../../lib/server/cachedData";
import { getContentSlug, placePath } from "../../../lib/slugs";
import { asLocalizedText } from "../../../lib/toursFirestore";
import { formatRegionName } from "../../../lib/placesMeta";
import PlaceDetailClient from "../../../components/places/PlaceDetailClient";
import { SITE_URL, getRequestLocale, buildLocalizedMetadata } from "../../../lib/siteConfig";
import "../places.css";

const BREADCRUMB_COPY = {
  ka: { home: "მთავარი", places: "ღირსშესანიშნაობები" },
  en: { home: "Home", places: "Attractions" },
  ru: { home: "Главная", places: "Достопримечательности" },
  tr: { home: "Ana Sayfa", places: "Görülecek Yerler" },
  ar: { home: "الرئيسية", places: "المعالم السياحية" },
};

// Pre-render the current places at build time; new ones render on first request.
export async function generateStaticParams() {
  const places = await getCachedPlaces().catch(() => []);
  return (places || []).filter((p) => p?.id).map((p) => ({ id: getContentSlug(p) }));
}

export async function generateMetadata({ params }) {
  const { locale, id: placeId } = await params;
  const lang = getRequestLocale(locale);
  const place = await getCachedPlaceBySlugOrId(placeId);

  if (!place) notFound();

  const title = asLocalizedText(place.title, lang) || asLocalizedText(place.title, "ka") || "Landmark in Georgia";
  const desc = asLocalizedText(place.desc, lang) || asLocalizedText(place.desc, "ka") || "Discover Georgia's most beautiful places with GeorgiaTrips.";
  const region = formatRegionName(asLocalizedText(place.region, lang) || asLocalizedText(place.region, "ka"), lang);
  const imgUrl = place.img || `${SITE_URL}/hero.webp`;

  return buildLocalizedMetadata({
    path: placePath(place),
    lang,
    title: `${title} (${region}) | GeorgiaTrips`,
    description: desc.slice(0, 160),
    image: imgUrl,
  });
}

export default async function PlaceDetailPage({ params }) {
  const { locale, id: placeId } = await params;
  const lang = getRequestLocale(locale);

  const [places, tours] = await Promise.all([getCachedPlaces(), getCachedTours()]);
  const place = await getCachedPlaceBySlugOrId(placeId);
  if (!place) notFound();
  const pageUrl = `${SITE_URL}/${lang}${placePath(place)}`;

  const title = place ? asLocalizedText(place.title, lang) || asLocalizedText(place.title, "ka") || "Place in Georgia" : "Place";
  const desc = place ? asLocalizedText(place.desc, lang) || asLocalizedText(place.desc, "ka") || "" : "";
  const region = place ? formatRegionName(asLocalizedText(place.region, lang) || asLocalizedText(place.region, "ka"), lang) : "Georgia";
  const bc = BREADCRUMB_COPY[lang] || BREADCRUMB_COPY.en;

  const jsonLd = place
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "TouristAttraction",
            "@id": `${pageUrl}#attraction`,
            "name": title,
            "description": desc,
            "image": place.img || `${SITE_URL}/hero.webp`,
            "address": {
              "@type": "PostalAddress",
              "addressRegion": region,
              "addressCountry": "GE",
            },
          },
          {
            "@type": "BreadcrumbList",
            "@id": `${pageUrl}#breadcrumbs`,
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": bc.home, "item": `${SITE_URL}/${lang}` },
              { "@type": "ListItem", "position": 2, "name": bc.places, "item": `${SITE_URL}/${lang}/places` },
              { "@type": "ListItem", "position": 3, "name": title, "item": pageUrl },
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
        <PlaceDetailClient initialPlace={place} initialAllPlaces={places} initialTours={tours} />
      </Suspense>
    </>
  );
}
