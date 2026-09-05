import React, { Suspense } from "react";
import { getCachedPlaces } from "../../lib/server/cachedData";
import { asLocalizedText } from "../../lib/toursFirestore";
import { formatRegionName } from "../../lib/placesMeta";
import PlaceDetailClient from "../../components/places/PlaceDetailClient";
import "../places.css";

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const placeId = resolvedParams?.id;

  const places = await getCachedPlaces();
  const place = (places || []).find((p) => p.id === placeId);

  if (!place) {
    return {
      title: "ადგილი ვერ მოიძებნა | GeorgiaTrips.ge",
      description: "მოთხოვნილი ლოკაცია ვერ მოიძებნა.",
    };
  }

  const titleKa = asLocalizedText(place.title, "ka") || "ღირსშესანიშნაობა საქართველოში";
  const descKa = asLocalizedText(place.desc, "ka") || "აღმოაჩინეთ საქართველოს ულამაზესი ადგილები GeorgiaTrips-თან ერთად.";
  const regionKa = formatRegionName(asLocalizedText(place.region, "ka"), "ka");
  const imgUrl = place.img || "https://georgiatrips.ge/hero.webp";
  const placeUrl = `https://georgiatrips.ge/places/${placeId}`;

  return {
    title: `${titleKa} (${regionKa}) | GeorgiaTrips.ge`,
    description: descKa.slice(0, 160),
    alternates: {
      canonical: placeUrl,
    },
    openGraph: {
      title: `${titleKa} — ${regionKa}`,
      description: descKa.slice(0, 200),
      url: placeUrl,
      siteName: "GeorgiaTrips",
      images: [
        {
          url: imgUrl,
          width: 1200,
          height: 630,
          alt: titleKa,
        },
      ],
      locale: "ka_GE",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${titleKa} — ${regionKa}`,
      description: descKa.slice(0, 160),
      images: [imgUrl],
    },
  };
}

export default async function PlaceDetailPage({ params }) {
  const resolvedParams = await params;
  const placeId = resolvedParams?.id;

  const places = await getCachedPlaces();
  const place = (places || []).find((p) => p.id === placeId) || null;

  const titleKa = place ? asLocalizedText(place.title, "ka") || "ადგილი საქართველოში" : "ადგილი";
  const descKa = place ? asLocalizedText(place.desc, "ka") || "" : "";
  const regionKa = place ? formatRegionName(asLocalizedText(place.region, "ka"), "ka") : "საქართველო";

  const jsonLd = place
    ? {
        "@context": "https://schema.org",
        "@type": "TouristAttraction",
        "name": titleKa,
        "description": descKa,
        "image": place.img || "https://georgiatrips.ge/hero.webp",
        "address": {
          "@type": "PostalAddress",
          "addressRegion": regionKa,
          "addressCountry": "GE",
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <Suspense fallback={<div style={{ padding: "4rem", textAlign: "center", color: "#0d233a" }}>...</div>}>
        <PlaceDetailClient initialPlace={place} initialAllPlaces={places} />
      </Suspense>
    </>
  );
}