import React from "react";
import { SOCIAL_PROFILES } from "../lib/shared";
import { SITE_URL, getCanonicalUrl, getAlternateLanguages } from "../lib/siteConfig";
import TransfersClient from "../components/transfers/TransfersClient";
import "./transfers.css";

export const metadata = {
  title: "აეროპორტის ტრანსფერები და პირადი მძღოლი საქართველოში | GeorgiaTrips.ge",
  description: "კომფორტული და უსაფრთხო ტრანსფერები თბილისის, ქუთაისისა და ბათუმის აეროპორტებიდან გუდაურში, ყაზბეგში, მესტიაში და მთელ საქართველოში. სედანი, მინივენი, ჯიპი, სპრინტერი.",
  alternates: {
    canonical: getCanonicalUrl("/transfers", "ka"),
    languages: getAlternateLanguages("/transfers"),
  },
  openGraph: {
    title: "აეროპორტის ტრანსფერები საქართველოში — GeorgiaTrips",
    description: "კომფორტული და უსაფრთხო ტრანსფერები პროფესიონალი მძღოლებით მთელ საქართველოში.",
    url: getCanonicalUrl("/transfers", "ka"),
    siteName: "GeorgiaTrips",
    images: [
      {
        url: "/hero.webp",
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
    images: ["/hero.webp"],
  },
};

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
