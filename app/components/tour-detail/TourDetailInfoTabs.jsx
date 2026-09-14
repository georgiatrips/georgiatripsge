"use client";

import React from "react";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { translateLocation } from "../../lib/toursFirestore";

export default function TourDetailInfoTabs({ tour }) {
  const { t, lang } = useLanguage();

  return (
    <article className="tdp-card-block tdp-minimalist-details-block">
      <div className="tdp-minimalist-header">
        <h2>{t("tourDetail.detailsTitle")}</h2>
      </div>

      <div className="tdp-minimalist-grid">
        {/* 1. Departure */}
        <div className="tdp-min-card">
          <div className="tdp-min-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div className="tdp-min-info">
            <span className="tdp-min-label">{t("tourDetail.departure")}</span>
            <strong className="tdp-min-value">{translateLocation(tour.departure || tour.location || tour.destination || "Batumi", lang)}</strong>
          </div>
        </div>

        {/* 2. Departure time */}
        <div className="tdp-min-card">
          <div className="tdp-min-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="tdp-min-info">
            <span className="tdp-min-label">{t("tourDetail.departureTime")}</span>
            <strong className="tdp-min-value">{t("tourDetail.byAgreement")}</strong>
          </div>
        </div>

        {/* 3. Payment */}
        <div className="tdp-min-card">
          <div className="tdp-min-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="3" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <div className="tdp-min-info">
            <span className="tdp-min-label">{t("tourDetail.payment")}</span>
            <strong className="tdp-min-value">{t("tourDetail.paymentDesc")}</strong>
          </div>
        </div>
      </div>
    </article>
  );
}
