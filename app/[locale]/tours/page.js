import React, { Suspense } from "react";
import { asLocalizedText } from "../../lib/toursFirestore";
import { getCachedTours, serializeForClient } from "../../lib/server/cachedData";
import ToursCatalogClient from "../../components/tours/ToursCatalogClient";
import { SITE_URL, getRequestLocale, buildLocalizedMetadata } from "../../lib/siteConfig";
import "./tours.css";

const COPY = {
  ka: { title: "ტურები საქართველოში | GeorgiaTrips", description: "საუკეთესო 1-დღიანი და მრავალდღიანი ინდივიდუალური და ჯგუფური ტურები საქართველოში — ბათუმი, სვანეთი, ყაზბეგი, კახეთი, რაჭა. დაჯავშნეთ ონლაინ." },
  en: { title: "Tours in Georgia | GeorgiaTrips", description: "Best day trips and multi-day private & group tours in Georgia — Batumi, Svaneti, Kazbegi, Kakheti, Racha. Book online." },
  ru: { title: "Туры по Грузии | GeorgiaTrips", description: "Лучшие однодневные и многодневные индивидуальные и групповые туры по Грузии — Батуми, Сванетия, Казбеги, Кахетия, Рача. Бронируйте онлайн." },
  tr: { title: "Gürcistan'da Turlar | GeorgiaTrips", description: "Gürcistan'da en iyi günübirlik ve çok günlük özel ve grup turları — Batum, Svaneti, Kazbegi, Kaheti, Raça. Online rezervasyon." },
  ar: { title: "جولات في جورجيا | GeorgiaTrips", description: "أفضل الجولات اليومية والمتعددة الأيام الخاصة والجماعية في جورجيا — باتومي، سفانيتي، كازبيجي، كاخيتي، راتشا. احجز عبر الإنترنت." },
};

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

  // JSON-LD ItemList Schema for Rich Search Results
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": c.title,
    "description": c.description,
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
          "url": `${SITE_URL}/${lang}/tours/${tour.id}`,
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
