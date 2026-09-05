"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { asLocalizedText, translateDuration, translateLocation } from "../../lib/toursFirestore";
import { ClockIcon, LocationIcon } from "../Icons";
import TourPrice from "../TourPrice";

export default function HomePopularToursSection({
  popularTourPairs = [],
  dynamicSections = [],
  popTourSlide = 0,
  setPopTourSlide,
  handleTourClick,
}) {
  const { t, lang } = useLanguage();

  return (
    <>
      {/* ==================== 1. POPULAR TOURS SECTION ==================== */}
      <section className="popular-tours-standalone-section" id="popular-tours">
        <div className="popular-destinations-inner">
          <div className="pop-tours-grid-wrapper">
            <div className="pop-grid-header-row">
              <div className="pop-grid-header">
                <span className="pop-eyebrow" style={{ marginBottom: "0.4rem" }}>{t("popular.eyebrow")}</span>
                <h2 className="pop-grid-title" style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)" }}>
                  {t("popular.popularToursTitle")} <span className="teal-accent">{t("popular.popularToursHighlight")}</span>
                </h2>
                <p className="pop-grid-subtitle">{t("popular.popularToursSubtitle")}</p>
              </div>

              <div className="pop-tour-slider-dots">
                {popularTourPairs.map((_, idx) => (
                  <button
                    key={idx}
                    className={`pop-tour-dot ${idx === popTourSlide ? "active" : ""}`}
                    onClick={() => setPopTourSlide(idx)}
                    aria-label={t("popular.slideLabel").replace("{idx}", idx + 1)}
                  />
                ))}
              </div>
            </div>

            <div className="mini-cards-slider-container">
              <div
                className="mini-cards-slider-track"
                style={{ transform: `translateX(-${popTourSlide * 100}%)` }}
              >
                {popularTourPairs.map((pair, pIdx) => (
                  <div key={pIdx} className="mini-cards-pair-slide">
                    {pair.map((tour, index) => (
                      <article
                        key={tour.id}
                        className="pop-fc"
                        onClick={() => handleTourClick(tour)}
                      >
                        {/* Full-bleed Image */}
                        <Image
                          src={tour.img || "/hero.webp"}
                          alt={asLocalizedText(tour.title, lang)}
                          fill
                          style={{ objectFit: "cover" }}
                          sizes="(max-width: 768px) 100vw, 50vw"
                          loading={pIdx === 0 && index === 0 ? "eager" : "lazy"}
                          className="pop-fc-img"
                        />

                        {/* Dark gradient overlay */}
                        <div className="pop-fc-gradient" />

                        {/* Top row: badge + dates */}
                        <div className="pop-fc-top">
                          <span className="pop-fc-badge">
                            {(t("tourBadges") || {})[asLocalizedText(tour.badge, lang)] ||
                              (t("tourBadges") || {})[asLocalizedText(tour.badge, "ka")] ||
                              asLocalizedText(tour.badge, lang)}
                          </span>
                          <div className="pop-fc-dates">
                            {tour.dates?.slice(0, 3).map((d, i) => (
                              <span key={i} className="pop-fc-date">{d}</span>
                            ))}
                          </div>
                        </div>

                        {/* Bottom overlay body */}
                        <div className="pop-fc-body">
                          <div className="pop-fc-meta">
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                              <ClockIcon size={13} color="var(--yellow)" />
                              {translateDuration(tour.duration, lang)}
                            </span>
                            {((translateLocation(tour.destinationLabel || tour.destination || tour.location || tour.region, lang) || "").replace(/^📍\s*/, "")) && (
                              <>
                                <span className="pop-fc-dot">•</span>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                  <LocationIcon size={13} color="var(--yellow)" />
                                  {(translateLocation(tour.destinationLabel || tour.destination || tour.location || tour.region, lang) || "").replace(/^📍\s*/, "")}
                                </span>
                              </>
                            )}
                          </div>
                          <h3 className="pop-fc-title">{asLocalizedText(tour.title, lang)}</h3>
                          <p className="pop-fc-desc">{asLocalizedText(tour.desc, lang)}</p>
                          <div className="pop-fc-footer">
                            <div className="pop-fc-prices">
                              {tour.priceGroup && (
                                <div className="pop-fc-price-item">
                                  <small>{t("popular.groupPrice")}</small>
                                  <TourPrice price={tour.priceGroup} lang={lang} variant="card" />
                                </div>
                              )}
                              {tour.pricePrivate && (
                                <div className="pop-fc-price-item">
                                  <small>{t("popular.privatePrice")}</small>
                                  <TourPrice price={tour.pricePrivate} lang={lang} variant="card" />
                                </div>
                              )}
                            </div>
                            <button className="pop-fc-btn">{t("popular.book")} →</button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 2. THEMED & REGIONAL TOUR SECTIONS ==================== */}
      <div className="themed-sections-container">
        {dynamicSections
          .filter((sec) => sec.id !== "popular")
          .map((sec) => (
            <section key={sec.id} className="themed-tours-section" id={sec.id}>
              <div className="themed-section-header">
                <h2 className="themed-section-title">{asLocalizedText(sec.title, lang)}</h2>
              </div>

              <div className="themed-tours-grid">
                {sec.tours.map((tour) => (
                  <Link
                    key={tour.id}
                    href={`/tours/${encodeURIComponent(tour.id)}`}
                    className="tb-card"
                    style={{ textDecoration: "none" }}
                  >
                    <div className="tb-card-img-wrap">
                      <Image
                        src={tour.img || "/hero.webp"}
                        alt={asLocalizedText(tour.title, lang)}
                        className="tb-card-img"
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        style={{ objectFit: "cover" }}
                        loading="lazy"
                      />
                      <span className="tb-badge">{(t("tourBadges") || {})[asLocalizedText(tour.badge, lang)] || asLocalizedText(tour.badge, lang)}</span>
                      <div className="tb-overlay-right">
                        {tour.pricePrivate && (
                          <div className="tb-price-tag tb-price-priv">
                            <small>{t("popular.privateLabel")}</small>
                            <TourPrice price={tour.pricePrivate} lang={lang} variant="card" />
                          </div>
                        )}
                        {tour.priceGroup && (
                          <div className="tb-price-tag tb-price-group">
                            <small>{t("popular.groupPrice")}</small>
                            <TourPrice price={tour.priceGroup} lang={lang} variant="card" />
                          </div>
                        )}
                        {tour.dates && tour.dates.length > 0 && (
                          <div className="tb-dates-row">
                            {tour.dates.slice(0, 4).map((d, i) => (
                              <span key={i} className="tb-date-chip">{d}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="tb-card-body">
                      <h3 className="tb-card-title">{asLocalizedText(tour.title, lang)}</h3>
                      <p className="tb-card-annotation">{asLocalizedText(tour.desc, lang)}</p>
                      <div className="tb-card-line"></div>
                      <div className="tb-card-facilities">
                        <span className="tb-facility-item" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                          <ClockIcon size={14} color="var(--teal)" />
                          <span>{translateDuration(tour.duration, lang)}</span>
                        </span>
                        <span className="tb-facility-item" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                          <LocationIcon size={14} color="var(--teal)" />
                          <span>{(translateLocation(tour.destinationLabel || tour.destination || tour.location || tour.region, lang) || t("popular.fromBatumiShort")).replace(/^📍\s*/, "")}</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
      </div>
    </>
  );
}
