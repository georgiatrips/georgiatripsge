import React from "react";
import { SOCIAL_PROFILES } from "../../lib/shared";
import TransfersClient from "../../components/transfers/TransfersClient";
import { SITE_URL, getRequestLocale, buildLocalizedMetadata } from "../../lib/siteConfig";
import { getCachedTransferPricing } from "../../lib/server/cachedData";
import "./transfers.css";

const COPY = {
  ka: { title: "აეროპორტის ტრანსფერები და პირადი მძღოლი საქართველოში | GeorgiaTrips", description: "კომფორტული და უსაფრთხო ტრანსფერები თბილისის, ქუთაისისა და ბათუმის აეროპორტებიდან გუდაურში, ყაზბეგში, მესტიაში და მთელ საქართველოში. სედანი, მინივენი, ჯიპი, სპრინტერი.", home: "მთავარი", crumb: "ტრანსფერები" },
  en: { title: "Airport Transfers & Private Driver in Georgia | GeorgiaTrips", description: "Comfortable and safe transfers from Tbilisi, Kutaisi and Batumi airports to Gudauri, Kazbegi, Mestia and all of Georgia. Sedan, minivan, jeep, sprinter.", home: "Home", crumb: "Transfers" },
  ru: { title: "Трансферы из аэропорта и личный водитель в Грузии | GeorgiaTrips", description: "Комфортные и безопасные трансферы из аэропортов Тбилиси, Кутаиси и Батуми в Гудаури, Казбеги, Местию и по всей Грузии. Седан, минивэн, джип, спринтер.", home: "Главная", crumb: "Трансферы" },
  tr: { title: "Gürcistan'da Havalimanı Transferi ve Özel Şoför | GeorgiaTrips", description: "Tiflis, Kutaisi ve Batum havalimanlarından Gudauri, Kazbegi, Mestia ve tüm Gürcistan'a konforlu ve güvenli transferler.", home: "Ana Sayfa", crumb: "Transferler" },
  ar: { title: "توصيل من المطار وسائق خاص في جورجيا | GeorgiaTrips", description: "توصيل مريح وآمن من مطارات تبليسي وكوتايسي وباتومي إلى غوداوري وكازبيجي وميستيا وجميع مناطق جورجيا.", home: "الرئيسية", crumb: "خدمات التوصيل" },
};

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const lang = getRequestLocale(locale);
  const c = COPY[lang] || COPY.en;
  return buildLocalizedMetadata({ path: "/transfers", lang, title: c.title, description: c.description, image: "/hero.webp" });
}

export default async function TransfersPage({ params }) {
  const { locale } = await params;
  const lang = getRequestLocale(locale);
  const c = COPY[lang] || COPY.en;
  const pricing = await getCachedTransferPricing();

  const transferJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["TaxiService", "Service"],
        "@id": `${SITE_URL}/${lang}/transfers#service`,
        "name": "GeorgiaTrips — Airport Transfers & Private Drivers in Georgia",
        "description": "Private airport transfers from Tbilisi (TBS), Kutaisi (KUT), and Batumi (BUS) airports to Gudauri, Kazbegi, Mestia, and all regions of Georgia.",
        "provider": {
          "@type": "TravelAgency",
          "name": "GeorgiaTrips",
          "url": SITE_URL,
          "telephone": "+995504220020",
          "sameAs": SOCIAL_PROFILES,
        },
        "areaServed": [
          { "@type": "Country", "name": "Georgia" },
          { "@type": "City", "name": "Tbilisi" },
          { "@type": "City", "name": "Batumi" },
          { "@type": "City", "name": "Kutaisi" },
          { "@type": "City", "name": "Gudauri" },
          { "@type": "City", "name": "Kazbegi" },
        ],
        "offers": {
          "@type": "AggregateOffer",
          "lowPrice": 35,
          "highPrice": 350,
          "priceCurrency": "GEL",
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/${lang}/transfers#breadcrumbs`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": c.home, "item": `${SITE_URL}/${lang}` },
          { "@type": "ListItem", "position": 2, "name": c.crumb, "item": `${SITE_URL}/${lang}/transfers` },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(transferJsonLd) }}
      />
      <TransfersClient pricing={pricing} />
    </>
  );
}
