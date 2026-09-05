"use client";

import React from "react";
import Image from "next/image";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { asLocalizedText, translateLocation } from "../../lib/toursFirestore";

export default function HomeDestinationsSection({ popularPlaces = [], latestPlaces = [] }) {
  const { t, lang } = useLanguage();

  return (
    <section className="popular-destinations-section" id="popular">
      <div className="popular-destinations-inner">
        <div className="popular-destinations-header">
          <span className="pop-eyebrow">{t("popular.eyebrow")}</span>
          <h2 className="pop-main-title"><span className="teal-accent">{t("popular.titleHighlight")}</span> {t("popular.titleRest")}</h2>
        </div>

        <div className="pop-content-layout pop-layout-swapped">
          {/* Left Column: Asymmetrical/Staggered Cards */}
          <div className="pop-cards-col">
            <div className="pop-cards-wrapper">
              {popularPlaces.map((place, index) => (
                <a key={place.id} href={"/places/" + place.id} className={"pop-card" + (index === 1 ? " pop-card-staggered" : "")}>
                  <div className="pop-card-img-wrap">
                    <Image src={place.img} alt={asLocalizedText(place.title, lang)} fill sizes="(max-width: 768px) 100vw, 30vw" style={{ objectFit: "cover" }} loading="lazy" />
                    <div className="pop-card-badge">{t("popular.topPopularBadge").replace("{index}", index + 1)}</div>
                    <div className="pop-card-gradient"></div>
                    <div className="pop-card-footer-info">
                      <h4 className="pop-card-title">{asLocalizedText(place.title, lang)}</h4>
                      <span className="pop-card-sub">{translateLocation(place.region, lang) || t("common.georgia")}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            <div className="pop-dots">
              <span className="pop-dot active"></span>
            </div>
          </div>

          {/* Right Column: Information & Attractions Grid */}
          <div className="pop-info-col">
            <p className="pop-description">
              {t("popular.description")}
            </p>

            <div className="pop-attractions-grid">
              {latestPlaces.map((place) => (
                <a key={place.id} href={"/places/" + place.id} className="pop-attraction-item">
                  <span className="pop-name">{asLocalizedText(place.title, lang)}</span>
                  <span className="pop-pin" aria-hidden="true">📍</span>
                </a>
              ))}
            </div>

            <a href="/places" className="pop-all-btn">
              {t("popular.allLocations")} <span>→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
