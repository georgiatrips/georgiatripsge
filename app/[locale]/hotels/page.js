import React, { Suspense } from "react";
import { getCachedHotels } from "../../lib/server/cachedData";
import { asLocalizedText } from "../../lib/toursFirestore";
import HotelsCatalogClient from "../../components/hotels/HotelsCatalogClient";
import { SITE_URL, getRequestLocale, buildLocalizedMetadata } from "../../lib/siteConfig";
import "./hotels.css";

const COPY = {
  ka: { title: "სასტუმროები და აპარტამენტები საქართველოში | GeorgiaTrips", description: "საუკეთესო სასტუმროები, ვილები და საოჯახო სასტუმროები თბილისში, ბათუმში, ყაზბეგში, კახეთსა და სვანეთში. პირდაპირი დაჯავშნა საუკეთესო ფასად.", home: "მთავარი", crumb: "სასტუმროები" },
  en: { title: "Hotels & Apartments in Georgia | GeorgiaTrips", description: "Best hotels, villas and guesthouses in Tbilisi, Batumi, Kazbegi, Kakheti and Svaneti. Book direct at the best rates.", home: "Home", crumb: "Hotels" },
  ru: { title: "Отели и апартаменты в Грузии | GeorgiaTrips", description: "Лучшие отели, виллы и гостевые дома в Тбилиси, Батуми, Казбеги, Кахетии и Сванетии. Прямое бронирование по лучшим ценам.", home: "Главная", crumb: "Отели" },
  tr: { title: "Gürcistan'da Oteller ve Daireler | GeorgiaTrips", description: "Tiflis, Batum, Kazbegi, Kaheti ve Svaneti'de en iyi oteller, villalar ve pansiyonlar. En iyi fiyatlarla doğrudan rezervasyon.", home: "Ana Sayfa", crumb: "Oteller" },
  ar: { title: "فنادق وشقق في جورجيا | GeorgiaTrips", description: "أفضل الفنادق والفيلات والبيوت الضيافة في تبليسي وباتومي وكازبيجي وكاخيتي وسفانيتي. احجز مباشرة بأفضل الأسعار.", home: "الرئيسية", crumb: "الفنادق" },
};

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const lang = getRequestLocale(locale);
  const c = COPY[lang] || COPY.en;
  return buildLocalizedMetadata({ path: "/hotels", lang, title: c.title, description: c.description, image: "/villa.webp" });
}

export default async function HotelsPage({ params }) {
  const { locale } = await params;
  const lang = getRequestLocale(locale);
  const c = COPY[lang] || COPY.en;
  const hotels = await getCachedHotels();

  const hotelsJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/${lang}/hotels#breadcrumbs`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": c.home, "item": `${SITE_URL}/${lang}` },
          { "@type": "ListItem", "position": 2, "name": c.crumb, "item": `${SITE_URL}/${lang}/hotels` },
        ],
      },
      {
        "@type": "ItemList",
        "@id": `${SITE_URL}/${lang}/hotels#list`,
        "name": c.title,
        "itemListElement": (hotels || []).map((hotel, idx) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "item": {
            "@type": "Hotel",
            "name": asLocalizedText(hotel.name, lang) || asLocalizedText(hotel.name, "ka") || hotel.name,
            "description": asLocalizedText(hotel.desc, lang) || asLocalizedText(hotel.desc, "ka") || hotel.desc,
            "image": hotel.gallery?.[0] || `${SITE_URL}/villa.webp`,
            "url": hotel.bookingUrl || `${SITE_URL}/${lang}/hotels`,
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
      <Suspense fallback={<div className="hm-section"><p>...</p></div>}>
        <HotelsCatalogClient initialHotels={hotels} />
      </Suspense>
    </>
  );
}
