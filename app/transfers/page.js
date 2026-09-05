import React from "react";
import { SOCIAL_PROFILES } from "../lib/shared";
import TransfersClient from "../components/transfers/TransfersClient";
import "./transfers.css";

export const metadata = {
  title: "აეროპორტის ტრანსფერები და პირადი მძღოლი საქართველოში | GeorgiaTrips.ge",
  description: "კომფორტული და უსაფრთხო ტრანსფერები თბილისის, ქუთაისისა და ბათუმის აეროპორტებიდან გუდაურში, ყაზბეგში, მესტიაში და მთელ საქართველოში. სედანი, მინივენი, ჯიპი, სპრინტერი.",
  alternates: {
    canonical: "https://georgiatrips.ge/transfers",
    languages: {
      ka: "https://georgiatrips.ge/ka/transfers",
      en: "https://georgiatrips.ge/en/transfers",
      ru: "https://georgiatrips.ge/ru/transfers",
    },
  },
  openGraph: {
    title: "აეროპორტის ტრანსფერები საქართველოში — GeorgiaTrips",
    description: "კომფორტული და უსაფრთხო ტრანსფერები პროფესიონალი მძღოლებით მთელ საქართველოში.",
    url: "https://georgiatrips.ge/transfers",
    siteName: "GeorgiaTrips",
    images: [
      {
        url: "https://georgiatrips.ge/hero.webp",
        width: 1200,
        height: 630,
        alt: "აეროპორტის ტრანსფერები საქართველოში",
      },
    ],
    locale: "ka_GE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "აეროპორტის ტრანსფერები საქართველოში — GeorgiaTrips",
    description: "სწრაფი და საიმედო მგზავრობა საქართველოში.",
    images: ["https://georgiatrips.ge/hero.webp"],
  },
};

export default function TransfersPage() {
  const transferJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["TaxiService", "Service"],
        "@id": "https://georgiatrips.ge/transfers#service",
        "name": "GeorgiaTrips — Airport Transfers & Private Drivers in Georgia",
        "description": "Private airport transfers from Tbilisi (TBS), Kutaisi (KUT), and Batumi (BUS) airports to Gudauri, Kazbegi, Mestia, and all regions of Georgia.",
        "provider": {
          "@type": "TravelAgency",
          "name": "GeorgiaTrips",
          "url": "https://georgiatrips.ge",
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
        "@id": "https://georgiatrips.ge/transfers#breadcrumbs",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "მთავარი",
            "item": "https://georgiatrips.ge",
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "ტრანსფერები",
            "item": "https://georgiatrips.ge/transfers",
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
