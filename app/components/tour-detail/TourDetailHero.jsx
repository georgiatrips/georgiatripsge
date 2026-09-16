"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { interpolate } from "../../lib/i18n/translateCore";
import { asLocalizedText, translateDuration, translateLocation } from "../../lib/toursShared";
import { getLocalizedHref } from "../../lib/siteConfig";
import TourPrice from "../TourPrice";
import "../../styles/tour-hero.css";

const KICKERS = {
  ka: ["ერთდღიანი ექსკურსია", "მრავალდღიანი ექსკურსია"],
  en: ["One-day excursion", "Multi-day excursion"],
  ru: ["Однодневная экскурсия", "Многодневная экскурсия"],
  tr: ["Günübirlik tur", "Çok günlük tur"],
  ar: ["رحلة يومية", "رحلة متعددة الأيام"],
};

// Tour page header: breadcrumbs and title, then a mosaic of the tour's own
// photos, then the key facts. The uploaded photos are about 1000px wide, so
// they are shown near that size (one large, up to four small) instead of being
// stretched across the whole screen, where they looked soft. Each photo opens
// the lightbox. The header above stays solid because the page no longer starts
// with a dark full-bleed image.
export default function TourDetailHero({
  tour,
  isFirestoreTour,
  configuredPeopleMin,
  groupMaxCap,
  scrollToBooking,
  openLightbox,
}) {
  const { t, lang } = useLanguage();
  const title = asLocalizedText(tour.title, lang);
  const isMultiday = tour.type === "multiday" || (typeof tour.tourSectionLabel === "string" && tour.tourSectionLabel.includes("მრავალდღიანი"));
  const kicker = (KICKERS[lang] || KICKERS.ka)[isMultiday ? 1 : 0];
  // Only a badge the tour really has; no default "popular" label.
  const badgeText = asLocalizedText(tour.badge, lang);
  const badge = badgeText ? (t("tourBadges") || {})[badgeText] || badgeText : "";

  const gallery = Array.isArray(tour.gallery) ? tour.gallery.filter(Boolean) : [];
  const cover = tour.img || gallery[0] || "/hero.webp";
  const photos = [cover, ...gallery.filter((src) => src !== cover)];
  const shown = photos.slice(0, 5);
  const extra = photos.length - shown.length;

  const open = (src) => {
    if (!openLightbox || !gallery.length) return;
    const index = gallery.indexOf(src);
    openLightbox(index >= 0 ? index : 0);
  };

  return (
    <section className="tdp-hero3">
      <div className="container tdp-hero3-head">
        <nav className="tdp-hero3-crumbs" aria-label={t("tourDetail.crumbsTours")}>
          <Link href={getLocalizedHref("/", lang)}>{t("tourDetail.crumbsHome")}</Link>
          <span aria-hidden="true">/</span>
          <Link href={getLocalizedHref("/tours", lang)}>{t("tourDetail.crumbsTours")}</Link>
          <span aria-hidden="true">/</span>
          <span className="is-current" aria-current="page">{title}</span>
        </nav>

        <p className="tdp-hero3-kicker">
          <span>{kicker}</span>
          {badge && <span className="tdp-hero3-badge">{badge}</span>}
        </p>
        <h1 className="tdp-hero3-title">{title}</h1>
      </div>

      <div className="container">
        <div className={`tdp-hero3-gallery is-${shown.length}`}>
          {shown.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              className="tdp-hero3-photo"
              onClick={() => open(src)}
              aria-label={`${t("tourDetail.openGallery")} ${index + 1} / ${photos.length}`}
            >
              <Image
                src={src}
                alt={index === 0 ? title : ""}
                fill
                sizes={index === 0 ? "(max-width: 767px) 88vw, 50vw" : "(max-width: 767px) 88vw, 25vw"}
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : undefined}
              />
              {index === shown.length - 1 && extra > 0 && (
                <span className="tdp-hero3-more">{interpolate(t("tourDetail.morePhotos"), { count: extra })}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="container">
        <div className="tdp-hero2-panel">
          <div className="tdp-hero2-facts">
            <div className="tdp-hero2-fact">
              <span className="fact-label">{t("tourDetail.duration")}</span>
              <strong className="fact-value">{translateDuration(tour.duration, lang) || "—"}</strong>
            </div>
            <div className="tdp-hero2-fact">
              <span className="fact-label">{t("tourDetail.destination")}</span>
              <strong className="fact-value">{translateLocation(tour.destinationLabel || tour.destination || t("common.georgia"), lang).replace(/^📍\s*/, "")}</strong>
            </div>
            {isFirestoreTour && (
              <div className="tdp-hero2-fact">
                <span className="fact-label">{t("tourDetail.group")}</span>
                <strong className="fact-value">{`${configuredPeopleMin}-${groupMaxCap} ${t("tourDetail.peopleSuffix")}`}</strong>
              </div>
            )}
            {(tour.priceGroup || tour.pricePrivate) && (
              <div className="tdp-hero2-fact">
                <span className="fact-label">{t("tourDetail.price")}</span>
                <strong className="fact-value accent">
                  <TourPrice price={tour.priceGroup || tour.pricePrivate} lang={lang} variant="hero" />
                </strong>
              </div>
            )}
          </div>

          <button type="button" className="gt-btn gt-btn--cta gt-btn--lg tdp-hero2-cta" onClick={scrollToBooking}>
            {t("tourDetail.bookNow")}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="gt-flip-rtl">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
