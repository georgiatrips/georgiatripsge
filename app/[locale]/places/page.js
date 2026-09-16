import React, { Suspense } from "react";
import { getCachedPlaces } from "../../lib/server/cachedData";
import { asLocalizedText } from "../../lib/toursFirestore";
import PlacesCatalogClient from "../../components/places/PlacesCatalogClient";
import { SITE_URL, getRequestLocale, buildLocalizedMetadata } from "../../lib/siteConfig";
import { placePath } from "../../lib/slugs";
import "./places.css";

const COPY = {
  ka: { title: "ღირსშესანიშნაობები საქართველოში | GeorgiaTrips", description: "საქართველოს ულამაზესი ადგილები, კულტურული და ბუნებრივი ძეგლები — ყაზბეგი, სვანეთი, მარტვილი, ვარძია, უფლისციხე, პრომეთეს მღვიმე და სხვა.", home: "მთავარი", crumb: "ღირსშესანიშნაობები" },
  en: { title: "Top Attractions in Georgia | GeorgiaTrips", description: "Georgia's most beautiful places, cultural and natural landmarks — Kazbegi, Svaneti, Martvili, Vardzia, Uplistsikhe, Prometheus Cave and more.", home: "Home", crumb: "Attractions" },
  ru: { title: "Достопримечательности Грузии | GeorgiaTrips", description: "Самые красивые места, культурные и природные памятники Грузии — Казбеги, Сванетия, Мартвили, Вардзия, Уплисцихе, пещера Прометея и другие.", home: "Главная", crumb: "Достопримечательности" },
  tr: { title: "Gürcistan'da Görülecek Yerler | GeorgiaTrips", description: "Gürcistan'ın en güzel yerleri, kültürel ve doğal simgeleri — Kazbegi, Svaneti, Martvili, Vardzia, Uplistsikhe, Prometheus Mağarası ve daha fazlası.", home: "Ana Sayfa", crumb: "Görülecek Yerler" },
  ar: { title: "أفضل المعالم السياحية في جورجيا | GeorgiaTrips", description: "أجمل الأماكن والمعالم الثقافية والطبيعية في جورجيا — كازبيجي، سفانيتي، مارتفيلي، فاردزيا، أوبليستسيخي، كهف بروميثيوس والمزيد.", home: "الرئيسية", crumb: "المعالم السياحية" },
};

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const lang = getRequestLocale(locale);
  const c = COPY[lang] || COPY.en;
  return buildLocalizedMetadata({ path: "/places", lang, title: c.title, description: c.description, image: "/tbilisi.webp" });
}

export default async function PlacesPage({ params }) {
  const { locale } = await params;
  const lang = getRequestLocale(locale);
  const c = COPY[lang] || COPY.en;
  const places = await getCachedPlaces();

  const placesJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/${lang}/places#breadcrumbs`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": c.home, "item": `${SITE_URL}/${lang}` },
          { "@type": "ListItem", "position": 2, "name": c.crumb, "item": `${SITE_URL}/${lang}/places` },
        ],
      },
      {
        "@type": "ItemList",
        "@id": `${SITE_URL}/${lang}/places#list`,
        "name": c.title,
        "itemListElement": (places || []).slice(0, 30).map((place, idx) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "item": {
            "@type": "TouristAttraction",
            "name": asLocalizedText(place.title, lang) || asLocalizedText(place.title, "ka") || place.title,
            "description": asLocalizedText(place.desc, lang) || asLocalizedText(place.desc, "ka") || place.desc,
            "image": place.img || `${SITE_URL}/tbilisi.webp`,
            "url": `${SITE_URL}/${lang}${placePath(place)}`,
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
      <Suspense fallback={<div className="places-state">...</div>}>
        <PlacesCatalogClient initialPlaces={places} />
      </Suspense>
    </>
  );
}
