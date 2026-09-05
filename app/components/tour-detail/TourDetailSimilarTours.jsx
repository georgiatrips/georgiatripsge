"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { asLocalizedText, translateDuration, translateLocation } from "../../lib/toursFirestore";
import { ClockIcon, LocationIcon } from "../Icons";
import TourPrice from "../TourPrice";

export default function TourDetailSimilarTours({ similarTours = [], popularTours = [] }) {
  const { t, lang } = useLanguage();

  return (
    <>
      {/* ==================== SIMILAR TOURS SECTION ==================== */}
      {similarTours && similarTours.length > 0 && (
        <section className="similar-tours-section">
          <div className="similar-tours-container">
            <div className="similar-tours-header">
              <span className="similar-eyebrow">{t("tourDetail.discoverOther")}</span>
              <h2 className="similar-main-title">{t("tourDetail.similarTours")}</h2>
            </div>
            <div className="similar-tours-grid">
              {similarTours.map((item) => (
                <Link
                  key={item.id}
                  href={`/tours/${item.id}`}
                  className="tb-card"
                  style={{ textDecoration: "none" }}
                >
                  <div className="tb-card-img-wrap">
                    <Image
                      src={item.img || "/hero.png"}
                      alt={asLocalizedText(item.title, lang)}
                      className="tb-card-img"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      style={{ objectFit: "cover" }}
                      loading="lazy"
                    />
                    {item.badge && <span className="tb-badge">{(t("tourBadges") || {})[asLocalizedText(item.badge, lang)] || asLocalizedText(item.badge, lang)}</span>}
                    <div className="tb-overlay-right">
                      {item.pricePrivate && (
                        <div className="tb-price-tag tb-price-priv">
                          <small>{t("popular.privateLabel")}</small>
                          <TourPrice price={item.pricePrivate} lang={lang} variant="card" />
                        </div>
                      )}
                      {item.priceGroup && (
                        <div className="tb-price-tag tb-price-group">
                          <small>{t("popular.groupPrice")}</small>
                          <TourPrice price={item.priceGroup} lang={lang} variant="card" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="tb-card-body">
                    <h3 className="tb-card-title">{asLocalizedText(item.title, lang)}</h3>
                    <p className="tb-card-annotation">{asLocalizedText(item.desc, lang)}</p>
                    <div className="tb-card-line"></div>
                    <div className="tb-card-facilities">
                      {item.duration && (
                        <span className="tb-facility-item" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                          <ClockIcon size={14} color="var(--teal)" />
                          <span>{translateDuration(item.duration, lang)}</span>
                        </span>
                      )}
                      {item.location && (
                        <span className="tb-facility-item" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                          <LocationIcon size={14} color="var(--teal)" />
                          <span>{(translateLocation(item.location, lang) || "").replace(/^📍\s*/, "")}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ==================== POPULAR TOURS SECTION ==================== */}
      {popularTours && popularTours.length > 0 && (
        <section className="similar-tours-section" style={{ borderTop: "1px solid #e2e8f0", background: "#f8fafc" }}>
          <div className="similar-tours-container">
            <div className="similar-tours-header">
              <span className="similar-eyebrow">{t("tourDetail.mostRequested")}</span>
              <h2 className="similar-main-title">{t("tourDetail.popularTours")}</h2>
            </div>
            <div className="similar-tours-grid">
              {popularTours.map((item) => (
                <Link
                  key={item.id}
                  href={`/tours/${item.id}`}
                  className="tb-card"
                  style={{ textDecoration: "none" }}
                >
                  <div className="tb-card-img-wrap">
                    <Image
                      src={item.img || "/hero.png"}
                      alt={asLocalizedText(item.title, lang)}
                      className="tb-card-img"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      style={{ objectFit: "cover" }}
                      loading="lazy"
                    />
                    {item.badge && <span className="tb-badge">{(t("tourBadges") || {})[asLocalizedText(item.badge, lang)] || asLocalizedText(item.badge, lang)}</span>}
                    <div className="tb-overlay-right">
                      {item.pricePrivate && (
                        <div className="tb-price-tag tb-price-priv">
                          <small>{t("popular.privateLabel")}</small>
                          <TourPrice price={item.pricePrivate} lang={lang} variant="card" />
                        </div>
                      )}
                      {item.priceGroup && (
                        <div className="tb-price-tag tb-price-group">
                          <small>{t("popular.groupPrice")}</small>
                          <TourPrice price={item.priceGroup} lang={lang} variant="card" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="tb-card-body">
                    <h3 className="tb-card-title">{asLocalizedText(item.title, lang)}</h3>
                    <p className="tb-card-annotation">{asLocalizedText(item.desc, lang)}</p>
                    <div className="tb-card-line"></div>
                    <div className="tb-card-facilities">
                      {item.duration && (
                        <span className="tb-facility-item" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                          <ClockIcon size={14} color="var(--teal)" />
                          <span>{translateDuration(item.duration, lang)}</span>
                        </span>
                      )}
                      {item.location && (
                        <span className="tb-facility-item" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                          <LocationIcon size={14} color="var(--teal)" />
                          <span>{(translateLocation(item.location, lang) || "").replace(/^📍\s*/, "")}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
