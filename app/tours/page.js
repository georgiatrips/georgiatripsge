import React, { Suspense } from "react";
import ToursCatalogClient from "../components/tours/ToursCatalogClient";
import { asLocalizedText } from "../lib/toursFirestore";
import { getCachedTours, serializeForClient } from "../lib/server/cachedData";
import { headers } from "next/headers";
import { SITE_URL, getCanonicalUrl, getAlternateLanguages, LANGUAGE_LOCALES, SUPPORTED_LANGUAGES } from "../lib/siteConfig";

const TOURS_META = {
  ka: {
    title: "ტურები და ექსკურსიები საქართველოში — ბათუმი, ქუთაისი, თბილისი",
    description: "საუკეთესო 1-დღიანი და მრავალდღიანი ინდივიდუალური და ჯგუფური ტურები საქართველოში — ბათუმი, სვანეთი, ყაზბეგი, კახეთი, რაჭა. დაჯავშნეთ ონლაინ.",
  },
  en: {
    title: "Tours & Day Trips in Georgia — from Batumi, Kutaisi & Tbilisi",
    description: "Discover the best private and group day trips and multi-day tours in Georgia. Explore Kazbegi, Svaneti, Kakheti wine region, Martvili Canyon, and Batumi.",
  },
  ru: {
    title: "Экскурсии и однодневные туры по Грузии — из Батуми, Кутаиси и Тбилиси",
    description: "Индивидуальные и групповые экскурсии и туры по Грузии: Казбеги, Сванетия, Кахетия, каньон Мартвили, Батуми и Тбилиси. Бронируйте онлайн.",
  },
  tr: {
    title: "Gürcistan Turları ve Günübirlik Geziler — Batum, Kutaisi ve Tiflis Çıkışlı",
    description: "Gürcistan'da en iyi günübirlik ve çok günlük turlar. Batum, Tiflis, Kazbegi, Kaheti ve Svaneti turları. Türkçe rehber ve VIP transfer imkanı.",
  },
  ar: {
    title: "جولات ورحلات يومية في جورجيا — من باتومي، كوتايسي وتبليسي",
    description: "أفضل الجولات السياحية والرحلات اليومية في جورجيا مع سائق خاص ومرشد سياحي: كازبيجي، سوانيتي، كاخيتي، ومارتفيلي.",
  },
};

export async function generateMetadata() {
  const reqHeaders = await headers();
  const headerLang = reqHeaders.get("x-georgiatrips-locale");
  const lang = SUPPORTED_LANGUAGES.includes(headerLang) ? headerLang : "ka";
  const meta = TOURS_META[lang] || TOURS_META.ka;
  const canonicalUrl = getCanonicalUrl("/tours", lang);
  const alternateLanguages = getAlternateLanguages("/tours");
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
          url: "/hero.webp",
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
      images: ["/hero.webp"],
    },
  };
}

export default async function ToursPage() {
  const rawTours = await getCachedTours();
  const tours = serializeForClient(rawTours) || [];

  // JSON-LD ItemList Schema for Rich Search Results
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "ტურები საქართველოში - GeorgiaTrips",
    "description": "საქართველოს პოპულარული ტურების კატალოგი",
    "itemListElement": (tours || []).slice(0, 20).map((tour, index) => {
      const title = asLocalizedText(tour.title, "ka") || tour.title;
      const desc = asLocalizedText(tour.desc, "ka") || tour.desc;
      return {
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "TouristTrip",
          "name": title,
          "description": desc,
          "image": tour.img || `${SITE_URL}/hero.webp`,
          "url": `${SITE_URL}/ka/tours/${tour.id}`,
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
