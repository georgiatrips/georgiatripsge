"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { asLocalizedText, translateDuration, translateLocation } from "../../lib/toursFirestore";
import TourPrice from "../TourPrice";

export default function TourDetailHero({
  tour,
  isFirestoreTour,
  configuredPeopleMin,
  groupMaxCap,
  scrollToBooking,
}) {
  const { t, lang } = useLanguage();

  return (
    <section className="tdp-hero2">
      <div className="tdp-hero2-media">
        <Image
          src={tour.img || "/hero.webp"}
          alt={asLocalizedText(tour.title, lang)}
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover" }}
        />
        <div className="tdp-hero2-scrim" />

        <div className="container tdp-hero2-topbar">
          <nav className="tdp-hero2-crumbs" aria-label="ნავიგაცია">
            <Link href="/">{t("tourDetail.crumbsHome")}</Link>
            <span className="sep">/</span>
            <Link href="/tours">{t("tourDetail.crumbsTours")}</Link>
            <span className="sep">/</span>
            <span className="active">{asLocalizedText(tour.title, lang)}</span>
          </nav>

          <span className="tdp-hero2-badge">
            {(t("tourBadges") || {})[asLocalizedText(tour.badge, lang)] || asLocalizedText(tour.badge, lang) || t("tourDetail.popularBadge")}
          </span>
        </div>

        <div className="container tdp-hero2-caption">
          <span className="tdp-hero2-kicker">
            {(() => {
              const isMultiday = tour.type === "multiday" || (tour.tourSectionLabel && tour.tourSectionLabel.includes("მრავალდღიანი"));
              if (lang === "en") return isMultiday ? "Multi-day Excursion" : "One-day Excursion";
              if (lang === "ru") return isMultiday ? "Многодневная экскурсия" : "Однодневная экскурсия";
              if (lang === "tr") return isMultiday ? "Çok Günlük Tur" : "Günübirlik Tur";
              if (lang === "ar") return isMultiday ? "رحلة متعددة الأيام" : "رحلة يومية";
              return isMultiday ? "მრავალდღიანი ექსკურსია" : "ერთდღიანი ექსკურსია";
            })()}
          </span>
          <h1 className="tdp-hero2-title">{asLocalizedText(tour.title, lang)}</h1>
        </div>
      </div>

      <div className="container">
        <div className="tdp-hero2-panel">
          <div className="tdp-hero2-facts">
            <div className="tdp-hero2-fact">
              <span className="fact-label">{t("tourDetail.duration")}</span>
              <strong className="fact-value">
                {translateDuration(tour.duration, lang) || (lang === "en" ? "1 Day / 0 Nights" : lang === "ru" ? "1 день / 0 ночей" : lang === "tr" ? "1 Gün / 0 Gece" : lang === "ar" ? "1 يوم / 0 ليالي" : "1 დღე / 0 ღამე")}
              </strong>
            </div>
            <div className="tdp-hero2-fact">
              <span className="fact-label">{t("tourDetail.destination")}</span>
              <strong className="fact-value">{translateLocation(tour.location || tour.destination || t("common.georgia"), lang)}</strong>
            </div>
            <div className="tdp-hero2-fact">
              <span className="fact-label">{t("tourDetail.group")}</span>
              <strong className="fact-value">
                {isFirestoreTour
                  ? `${configuredPeopleMin}-${groupMaxCap} ${t("tourDetail.peopleSuffix")}`
                  : `1-18 ${t("tourDetail.peopleSuffix")}`}
              </strong>
            </div>
            <div className="tdp-hero2-fact">
              <span className="fact-label">{t("tourDetail.price")}</span>
              <strong className="fact-value accent">
                <TourPrice price={tour.priceGroup || tour.pricePrivate || "₾70"} lang={lang} variant="hero" />
              </strong>
            </div>
          </div>

          <button type="button" className="tdp-hero2-cta" onClick={scrollToBooking}>
            {t("tourDetail.bookNow")}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
