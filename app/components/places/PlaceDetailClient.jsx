"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "../Navbar";
import Footer from "../Footer";
import { formatRegionName } from "../../lib/placesMeta";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { asLocalizedText } from "../../lib/toursFirestore";
import "../../places/places.css";

function SmallPlaceCard({ place, lang }) {
  return (
    <Link href={`/places/${place.id}`} className="place-mini-card">
      <div className="place-mini-media">
        <Image src={place.img} alt={asLocalizedText(place.title, lang)} fill sizes="180px" style={{ objectFit: "cover" }} />
      </div>
      <div>
        <span>{formatRegionName(asLocalizedText(place.region, lang), lang)}</span>
        <h3>{asLocalizedText(place.title, lang)}</h3>
      </div>
    </Link>
  );
}

export default function PlaceDetailClient({ initialPlace = null, initialAllPlaces = [] }) {
  const { t, lang } = useLanguage();
  const [place] = useState(initialPlace);
  const [all] = useState(initialAllPlaces);

  const similar = useMemo(() => place ? all.filter((item) => item.id !== place.id && item.region === place.region).slice(0, 3) : [], [all, place]);
  const popular = useMemo(() => place ? all.filter((item) => item.id !== place.id && item.isPopular).slice(0, 3) : [], [all, place]);

  if (!place) {
    return (
      <div className="places-page">
        <Navbar active="places" />
        <main className="place-detail-state">
          <h1>{t("placeDetail.notFoundTitle")}</h1>
          <Link href="/places">{t("placeDetail.notFoundBtn")}</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="places-page">
      <Navbar active="places" />
      <main>
        <section className="place-detail-hero">
          <Image src={place.img} alt={asLocalizedText(place.title, lang)} fill priority sizes="100vw" style={{ objectFit: "cover" }} />
          <div className="place-detail-overlay" />
          <div className="container place-detail-hero-content">
            <Link href="/places" className="place-back-link">{t("placeDetail.backAll")}</Link>
            <span className="places-kicker">{formatRegionName(asLocalizedText(place.region, lang), lang)}</span>
            <h1>{asLocalizedText(place.title, lang)}</h1>
          </div>
        </section>

        <section className="place-detail-body">
          <div className="container place-detail-layout">
            <article className="place-detail-main">
              <div className="place-detail-copy">
                <span className="places-kicker">{t("placeDetail.aboutTitle")}</span>
                <h2>{t("placeDetail.aboutSubtitle")}</h2>
                <p style={{ whiteSpace: "pre-line", lineHeight: 1.75 }}>
                  {asLocalizedText(place.desc, lang)}
                </p>
              </div>
              {place.gallery?.length > 0 && (
                <div className="place-gallery">
                  {place.gallery.map((image, index) => (
                    <Image key={`${image}-${index}`} src={image} alt={`${asLocalizedText(place.title, lang)} ${index + 1}`} width={900} height={600} />
                  ))}
                </div>
              )}
            </article>
            <aside className="place-detail-aside">
              <div className="place-fact">
                <span>{t("placeDetail.regionLabel")}</span>
                <strong>{formatRegionName(asLocalizedText(place.region, lang), lang)}</strong>
              </div>
              <div className="place-fact">
                <span>{t("placeDetail.statusLabel")}</span>
                <strong>{place.isPopular ? t("placeDetail.popularPlace") : t("placeDetail.discoverPlace")}</strong>
              </div>
              <Link href="/places" className="place-aside-action">{t("placeDetail.viewMore")}</Link>
            </aside>
          </div>
        </section>

        {similar.length > 0 && (
          <section className="place-related">
            <div className="container">
              <div className="place-related-head">
                <div>
                  <span className="places-kicker">{t("placeDetail.sameRegionKicker")}</span>
                  <h2>{t("placeDetail.similarTitle")}</h2>
                </div>
                <Link href={`/places?region=${encodeURIComponent(place.region)}`}>{t("placeDetail.viewAll")}</Link>
              </div>
              <div className="place-mini-grid">
                {similar.map((item) => <SmallPlaceCard key={item.id} place={item} lang={lang} />)}
              </div>
            </div>
          </section>
        )}

        {popular.length > 0 && (
          <section className="place-related place-related-muted">
            <div className="container">
              <div className="place-related-head">
                <div>
                  <span className="places-kicker">{t("placeDetail.featuredKicker")}</span>
                  <h2>{t("placeDetail.mostPopularTitle")}</h2>
                </div>
              </div>
              <div className="place-mini-grid">
                {popular.map((item) => <SmallPlaceCard key={item.id} place={item} lang={lang} />)}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
