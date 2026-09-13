"use client";

import React from "react";
import Image from "next/image";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { asLocalizedText } from "../../lib/toursFirestore";

export default function TourDetailGallery({
  tour,
  resolvePhotoPlaceTitle,
  openLightbox,
}) {
  const { t, lang } = useLanguage();

  if (!tour.gallery || tour.gallery.length === 0) return null;

  return (
    <article className="tdp-card-block">
      <div className="tdp-card-header">
        <div>
          <h2>{t("tourDetail.galleryTitle")}</h2>
          <p className="subtitle">{t("tourDetail.gallerySubtitle")}</p>
        </div>
      </div>

      <div className="tdp-card-body">
        <div className="tdp-gallery-grid">
          {tour.gallery.map((gImg, idx) => {
            const locTitle = resolvePhotoPlaceTitle(gImg, idx);
            return (
              <div
                key={idx}
                className="tdp-gallery-item"
                onClick={() => openLightbox(idx)}
                style={{ position: "relative" }}
              >
                <Image
                  src={gImg}
                  alt={`${asLocalizedText(tour.title, lang)} ${idx + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  style={{ objectFit: "cover" }}
                />
                {locTitle && (
                  <div style={{ position: "absolute", top: "10px", left: "10px", zIndex: 2, pointerEvents: "none", maxWidth: "calc(100% - 20px)" }}>
                    <span style={{ 
                      background: "rgba(13, 35, 58, 0.8)", 
                      backdropFilter: "blur(6px)", 
                      color: "#ffffff", 
                      fontSize: "0.78rem", 
                      fontWeight: 700, 
                      padding: "4px 10px", 
                      borderRadius: "6px",
                      border: "1px solid rgba(255,255,255,0.2)",
                      display: "inline-block",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "100%",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
                    }}>
                      📍 {locTitle}
                    </span>
                  </div>
                )}
                <div className="gallery-zoom-badge">
                  <span>{t("tourDetail.enlarge")}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}
