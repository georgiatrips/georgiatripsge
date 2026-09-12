import React from "react";
import "./home.css";
import { headers } from "next/headers";
import { getCachedTours, getCachedPlaces, getCachedPosts, serializeForClient } from "./lib/server/cachedData";
import { FAQS_BY_LANG, getFaqs } from "./lib/shared";
import { SITE_URL, SUPPORTED_LANGUAGES } from "./lib/siteConfig";
import HomePageClient from "./components/home/HomePageClient";

export default async function Home() {
  const [rawTours, rawPlaces, rawPosts, reqHeaders] = await Promise.all([
    getCachedTours(),
    getCachedPlaces(),
    getCachedPosts(6),
    headers(),
  ]);

  const headerLang = reqHeaders.get("x-georgiatrips-locale");
  const lang = SUPPORTED_LANGUAGES.includes(headerLang) ? headerLang : "ka";
  const faqs = getFaqs(lang) || [];

  const initialTours = serializeForClient(rawTours) || [];
  const initialPlaces = serializeForClient(rawPlaces) || [];
  const initialPosts = serializeForClient(rawPosts) || [];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE_URL}/${lang}#faq`,
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <HomePageClient
        initialTours={initialTours}
        initialPlaces={initialPlaces}
        initialPosts={initialPosts}
      />
    </>
  );
}

