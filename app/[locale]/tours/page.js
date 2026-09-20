import React, { Suspense } from "react";
import { asLocalizedText } from "../../lib/toursFirestore";
import { getCachedTours, serializeForClient } from "../../lib/server/cachedData";
import ToursCatalogClient from "../../components/tours/ToursCatalogClient";
import { SITE_URL, getRequestLocale, buildLocalizedMetadata } from "../../lib/siteConfig";
import { tourPath } from "../../lib/slugs";
import "./tours.css";

const COPY = {
  ka: { title: "ტურები საქართველოში | GeorgiaTrips", description: "საუკეთესო 1-დღიანი და მრავალდღიანი ინდივიდუალური და ჯგუფური ტურები საქართველოში — ბათუმი, სვანეთი, ყაზბეგი, კახეთი, რაჭა. დაჯავშნეთ ონლაინ.", home: "მთავარი", crumb: "ტურები" },
  en: { title: "Tours in Georgia | GeorgiaTrips", description: "Best day trips and multi-day private & group tours in Georgia — Batumi, Svaneti, Kazbegi, Kakheti, Racha. Book online.", home: "Home", crumb: "Tours" },
  ru: { title: "Туры по Грузии | GeorgiaTrips", description: "Лучшие однодневные и многодневные индивидуальные и групповые туры по Грузии — Батуми, Сванетия, Казбеги, Кахетия, Рача. Бронируйте онлайн.", home: "Главная", crumb: "Туры" },
  tr: { title: "Gürcistan'da Turlar | GeorgiaTrips", description: "Gürcistan'da en iyi günübirlik ve çok günlük özel ve grup turları — Batum, Svaneti, Kazbegi, Kaheti, Raça. Online rezervasyon.", home: "Ana Sayfa", crumb: "Turlar" },
  ar: { title: "جولات في جورجيا | GeorgiaTrips", description: "أفضل الجولات اليومية والمتعددة الأيام الخاصة والجماعية في جورجيا — باتومي، سفانيتي، كازبيجي، كاخيتي، راتشا. احجز عبر الإنترنت.", home: "الرئيسية", crumb: "الجولات" },
};

// Prices are numbers in Firestore but can be strings like "₾100/კაცი" in older
// records; only a real, positive price is published as an Offer.
function offerPrice(tour) {
  const raw = tour?.priceGroup ?? tour?.pricePrivate ?? "";
  return Number(String(raw).match(/\d+(?:\.\d+)?/)?.[0]) || 0;
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const lang = getRequestLocale(locale);
  const c = COPY[lang] || COPY.en;
  return buildLocalizedMetadata({ path: "/tours", lang, title: c.title, description: c.description, image: "/hero.webp" });
}

export default async function ToursPage({ params }) {
  const { locale } = await params;
  const lang = getRequestLocale(locale);
  const rawTours = await getCachedTours();
  const tours = serializeForClient(rawTours) || [];
  const c = COPY[lang] || COPY.en;

  // JSON-LD: the catalog as an ItemList, plus the breadcrumb trail the other
  // listing pages already publish.
  const itemList = {
    "@type": "ItemList",
    "@id": `${SITE_URL}/${lang}/tours#catalog`,
    "name": c.title,
    "description": c.description,
    "numberOfItems": (tours || []).length,
    "itemListElement": (tours || []).slice(0, 20).map((tour, index) => {
      const title = asLocalizedText(tour.title, lang) || asLocalizedText(tour.title, "ka") || tour.title;
      const desc = asLocalizedText(tour.desc, lang) || asLocalizedText(tour.desc, "ka") || tour.desc;
      return {
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "TouristTrip",
          "name": title,
          "description": desc,
          "image": tour.img || `${SITE_URL}/hero.webp`,
          "url": `${SITE_URL}/${lang}${tourPath(tour)}`,
          // Only a real price is published; "0" would advertise a free tour.
          ...(offerPrice(tour) > 0
            ? { "offers": { "@type": "Offer", "price": offerPrice(tour), "priceCurrency": "GEL" } }
            : {}),
        },
      };
    }),
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      itemList,
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/${lang}/tours#breadcrumbs`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": c.home, "item": `${SITE_URL}/${lang}` },
          { "@type": "ListItem", "position": 2, "name": c.crumb, "item": `${SITE_URL}/${lang}/tours` },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<div style={{ padding: "4rem", textAlign: "center", color: "#1f2d3d" }}>...</div>}>
        <ToursCatalogClient initialTours={tours} />
      </Suspense>
    </>
  );
}
