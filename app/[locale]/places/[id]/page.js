import React, { Suspense } from "react";
import { getCachedPlaces } from "../../../lib/server/cachedData";
import { asLocalizedText } from "../../../lib/toursFirestore";
import { formatRegionName } from "../../../lib/placesMeta";
import PlaceDetailClient from "../../../components/places/PlaceDetailClient";
import { SITE_URL, getRequestLocale, buildLocalizedMetadata } from "../../../lib/siteConfig";
import "../places.css";

const NOT_FOUND_COPY = {
  ka: { title: "ადგილი ვერ მოიძებნა", description: "მოთხოვნილი ლოკაცია ვერ მოიძებნა." },
  en: { title: "Place not found", description: "The requested location could not be found." },
  ru: { title: "Место не найдено", description: "Запрошенное место не найдено." },
  tr: { title: "Yer bulunamadı", description: "İstenen konum bulunamadı." },
  ar: { title: "لم يتم العثور على المكان", description: "لم يتم العثور على الموقع المطلوب." },
};

const BREADCRUMB_COPY = {
  ka: { home: "მთავარი", places: "ღირსშესანიშნაობები" },
  en: { home: "Home", places: "Attractions" },
  ru: { home: "Главная", places: "Достопримечательности" },
  tr: { home: "Ana Sayfa", places: "Görülecek Yerler" },
  ar: { home: "الرئيسية", places: "المعالم السياحية" },
};

export async function generateMetadata({ params }) {
  const { locale, id: placeId } = await params;
  const lang = getRequestLocale(locale);
  const places = await getCachedPlaces();
  const place = (places || []).find((p) => p.id === placeId);

  if (!place) {
    const nf = NOT_FOUND_COPY[lang] || NOT_FOUND_COPY.en;
    return { title: nf.title, description: nf.description };
  }

  const title = asLocalizedText(place.title, lang) || asLocalizedText(place.title, "ka") || "Landmark in Georgia";
  const desc = asLocalizedText(place.desc, lang) || asLocalizedText(place.desc, "ka") || "Discover Georgia's most beautiful places with GeorgiaTrips.";
  const region = formatRegionName(asLocalizedText(place.region, lang) || asLocalizedText(place.region, "ka"), lang);
  const imgUrl = place.img || `${SITE_URL}/hero.webp`;

  return buildLocalizedMetadata({
    path: `/places/${placeId}`,
    lang,
    title: `${title} (${region}) | GeorgiaTrips`,
    description: desc.slice(0, 160),
    image: imgUrl,
  });
}

export default async function PlaceDetailPage({ params }) {
  const { locale, id: placeId } = await params;
  const lang = getRequestLocale(locale);

  const places = await getCachedPlaces();
  const place = (places || []).find((p) => p.id === placeId) || null;

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
            "@id": `${SITE_URL}/${lang}/places/${placeId}#attraction`,
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
            "@id": `${SITE_URL}/${lang}/places/${placeId}#breadcrumbs`,
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": bc.home, "item": `${SITE_URL}/${lang}` },
              { "@type": "ListItem", "position": 2, "name": bc.places, "item": `${SITE_URL}/${lang}/places` },
              { "@type": "ListItem", "position": 3, "name": title, "item": `${SITE_URL}/${lang}/places/${placeId}` },
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
        <PlaceDetailClient initialPlace={place} initialAllPlaces={places} />
      </Suspense>
    </>
  );
}
