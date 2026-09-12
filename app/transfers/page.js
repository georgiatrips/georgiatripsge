import React from "react";
import { headers } from "next/headers";
import { SOCIAL_PROFILES } from "../lib/shared";
import { SITE_URL, getCanonicalUrl, getAlternateLanguages, LANGUAGE_LOCALES, SUPPORTED_LANGUAGES } from "../lib/siteConfig";
import TransfersClient from "../components/transfers/TransfersClient";
import "./transfers.css";

const TRANSFERS_META = {
  ka: {
    title: "აეროპორტის ტრანსფერები და პირადი მძღოლი საქართველოში",
    description: "კომფორტული და უსაფრთხო ტრანსფერები თბილისის, ქუთაისისა და ბათუმის აეროპორტებიდან გუდაურში, ყაზბეგში, მესტიაში და მთელ საქართველოში. სედანი, მინივენი, ჯიპი, სპრინტერი.",
  },
  en: {
    title: "Airport Transfers & Private Driver in Georgia",
    description: "Reliable and comfortable private airport transfers from Tbilisi, Kutaisi, and Batumi airports to Gudauri, Kazbegi, Mestia, and across Georgia.",
  },
  ru: {
    title: "Трансферы из аэропорта и аренда авто с водителем в Грузии",
    description: "Надежные трансферы из аэропортов Тбилиси, Кутаиси и Батуми в Гудаури, Казбеги, Местию и по всей Грузии. Седаны, минивэны, внедорожники.",
  },
  tr: {
    title: "Havalimanı Transferleri ve Özel Şoför Hizmeti — Gürcistan",
    description: "Tiflis, Kutaisi ve Batum havalimanlarından Gudauri, Kazbegi, Mestia ve tüm Gürcistan'a konforlu özel transfer hizmeti.",
  },
  ar: {
    title: "توصيل مطار وسائق خاص في جورجيا",
    description: "خدمات توصيل وتأجير سيارات مع سائق خاص من مطارات تبليسي، كوتايسي وباتومي إلى غوداوري، كازبيجي، ميسيا وجميع مدن جورجيا.",
  },
};

export async function generateMetadata() {
  const reqHeaders = await headers();
  const headerLang = reqHeaders.get("x-georgiatrips-locale");
  const lang = SUPPORTED_LANGUAGES.includes(headerLang) ? headerLang : "ka";
  const meta = TRANSFERS_META[lang] || TRANSFERS_META.ka;
  const canonicalUrl = getCanonicalUrl("/transfers", lang);
  const alternateLanguages = getAlternateLanguages("/transfers");
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

export default function TransfersPage() {
  const transferJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["TaxiService", "Service"],
        "@id": `${SITE_URL}/ka/transfers#service`,
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
        "@id": `${SITE_URL}/ka/transfers#breadcrumbs`,
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
            "name": "ტრანსფერები",
            "item": `${SITE_URL}/ka/transfers`,
          },
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
      <TransfersClient />
    </>
  );
}
