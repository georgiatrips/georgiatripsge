"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { asLocalizedText } from "../../lib/toursFirestore";

export default function TourDetailRouteMap({ tour, openLightbox }) {
  const { t, lang } = useLanguage();
  const [hoveredStop, setHoveredStop] = useState(null);

  if (!tour.itinerary || tour.itinerary.length === 0) return null;

  return (
    <article className="tdp-card-block">
      <div className="tdp-card-header">
        <div>
          <h2>{t("tourDetail.routeTitle")}</h2>
          <p className="subtitle">{t("tourDetail.routeSubtitle")}</p>
        </div>
      </div>

      <div className="tdp-card-body">
        <div className="tdp-zigzag-wrapper">
          
          {/* Dynamic Zigzag SVG Line Connecting Points */}
          <svg className="tdp-zigzag-svg-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path
              d="M 22 8 L 78 24 L 22 40 L 78 56 L 22 72 L 78 88"
              fill="none"
              stroke="url(#zigzagTrailGrad)"
              strokeWidth="2.5"
              strokeDasharray="4 3"
            />
            <defs>
              <linearGradient id="zigzagTrailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#106da4" />
                <stop offset="50%" stopColor="#29b2b7" />
                <stop offset="100%" stopColor="#fab418" />
              </linearGradient>
            </defs>
          </svg>

          {/* Connected Zigzag Nodes List */}
          <div className="tdp-zigzag-nodes-list">
            {tour.itinerary.map((item, idx) => {
              const stopImg = item.img || tour.gallery?.[idx % (tour.gallery?.length || 1)] || tour.img;
              const isHovered = hoveredStop === idx;
              const isRight = idx % 2 !== 0;

              return (
                <div
                  key={idx}
                  className={`tdp-zigzag-node-item ${isRight ? "pos-right" : "pos-left"} ${isHovered ? "is-active" : ""}`}
                  onMouseEnter={() => setHoveredStop(idx)}
                  onMouseLeave={() => setHoveredStop(null)}
                  onClick={() => {
                    if (item.placeId) {
                      window.location.href = "/places/" + item.placeId;
                      return;
                    }
                    const galIdx = tour.gallery?.indexOf(stopImg);
                    openLightbox(galIdx >= 0 ? galIdx : 0);
                  }}
                  role={item.placeId ? "link" : undefined}
                  tabIndex={item.placeId ? 0 : undefined}
                >
                  {/* Circular Point Dot Button */}
                  <div className="tdp-zigzag-dot-btn">
                    <span className="zigzag-dot-ring" />
                    <span className="zigzag-dot-num">{idx + 1}</span>
                  </div>

                  {/* Short Label Beside Dot */}
                  <div className="tdp-zigzag-label">
                    <small>{t("tourDetail.locationPrefix")}{idx + 1}</small>
                    <strong>{asLocalizedText(item.title, lang)}</strong>
                  </div>

                  {/* Hover Popover Tooltip Card */}
                  {isHovered && (
                    <div className="tdp-dot-hover-popover" onClick={(e) => e.stopPropagation()}>
                      <div className="popover-triangle" />
                      <div className="popover-content">
                        <span className="popover-tag">📍 {t("tourDetail.locationPrefix")}{idx + 1}</span>
                        <h4>{asLocalizedText(item.title, lang)}</h4>
                        <p>{asLocalizedText(item.desc, lang)}</p>
                        {item.placeId && (
                          <Link href={"/places/" + item.placeId} className="tdp-place-detail-link" onClick={(e) => e.stopPropagation()}>
                            {t("tourDetail.placeDetails")} <span>→</span>
                          </Link>
                        )}

                        <div className="popover-photo-box">
                          <Image
                            src={stopImg}
                            alt={asLocalizedText(item.title, lang)}
                            fill
                            style={{ objectFit: "cover" }}
                            sizes="300px"
                          />
                          <div className="popover-photo-overlay">
                            <button
                              type="button"
                              className="btn-popover-zoom"
                              onClick={() => {
                                const galIdx = tour.gallery?.indexOf(stopImg);
                                openLightbox(galIdx >= 0 ? galIdx : 0);
                              }}
                            >
                              {t("tourDetail.viewPhoto")}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </article>
  );
}
