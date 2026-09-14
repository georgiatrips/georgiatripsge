"use client";

import React from "react";
import Image from "next/image";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { useCurrency } from "../../lib/currency/CurrencyContext";

export default function HomeFleetSection({ handleBookNow }) {
  const { t, lang } = useLanguage();
  const { format } = useCurrency();

  return (
    <section className="transport-section" id="batumi-tours">
      <div className="container transport-hero">
        <div className="transport-slider-wrapper">
          <button
            className="slider-arrow slider-arrow-left"
            id="transport-prev"
            aria-label="Previous"
            onClick={() => {
              const el = document.getElementById('transport-photos-grid');
              if (el) el.scrollBy({ left: -300, behavior: 'smooth' });
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <div className="transport-photos-row" id="transport-photos-grid">
            <a href="#booking" onClick={() => handleBookNow(t("popular.transportLabel").replace("{num}", "1"), format("₾50-დან", lang))} className="transport-photo transport-photo-1" style={{ position: "relative", minHeight: "220px", display: "block" }}>
              <Image src="/1car.webp" fill sizes="(max-width: 768px) 100vw, 25vw" style={{ objectFit: "cover" }} alt="GeorgiaTrips Transport 1" />
            </a>
            <a href="#booking" onClick={() => handleBookNow(t("popular.transportLabel").replace("{num}", "2"), format("₾90-დან", lang))} className="transport-photo transport-photo-2" style={{ position: "relative", minHeight: "220px", display: "block" }}>
              <Image src="/2car.webp" fill sizes="(max-width: 768px) 100vw, 25vw" style={{ objectFit: "cover" }} alt="GeorgiaTrips Transport 2" />
            </a>
            <a href="#booking" onClick={() => handleBookNow(t("popular.transportLabel").replace("{num}", "3"), format("₾180-დან", lang))} className="transport-photo transport-photo-3" style={{ position: "relative", minHeight: "220px", display: "block" }}>
              <Image src="/3car.webp" fill sizes="(max-width: 768px) 100vw, 25vw" style={{ objectFit: "cover" }} alt="GeorgiaTrips Transport 3" />
            </a>
            <a href="#booking" onClick={() => handleBookNow(t("popular.transportLabel").replace("{num}", "4"), format("₾220-დან", lang))} className="transport-photo transport-photo-4" style={{ position: "relative", minHeight: "220px", display: "block" }}>
              <Image src="/4car.webp" fill sizes="(max-width: 768px) 100vw, 25vw" style={{ objectFit: "cover" }} alt="GeorgiaTrips Transport 4" />
            </a>
          </div>
          <button
            className="slider-arrow slider-arrow-right"
            id="transport-next"
            aria-label="Next"
            onClick={() => {
              const el = document.getElementById('transport-photos-grid');
              if (el) el.scrollBy({ left: 300, behavior: 'smooth' });
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
