"use client";

import { useState } from "react";
import Image from "next/image";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { interpolate } from "../../lib/i18n/translate";
import { asLocalizedText } from "../../lib/toursFirestore";

// Long galleries (some tours have 20+ photos) start with six photos, which fill
// whole rows at two and three columns, and open fully on request.
const INITIAL_PHOTOS = 6;

export default function TourDetailGallery({ tour, resolvePhotoPlaceTitle, openLightbox }) {
  const { t, lang } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  const photos = Array.isArray(tour.gallery) ? tour.gallery : [];
  if (!photos.length) return null;

  const title = asLocalizedText(tour.title, lang);
  const visible = expanded ? photos : photos.slice(0, INITIAL_PHOTOS);

  return (
    <article className="tdp-card-block" id="tour-gallery">
      <div className="tdp-card-header">
        <div>
          <h2>{t("tourDetail.galleryTitle")}</h2>
          <p className="subtitle">{t("tourDetail.gallerySubtitle")}</p>
        </div>
      </div>

      <div className="tdp-card-body">
        <div className="tdp-gallery-grid">
          {visible.map((src, idx) => {
            const place = resolvePhotoPlaceTitle(src, idx);
            return (
              <button
                key={`${src}-${idx}`}
                type="button"
                className="tdp-gallery-item"
                style={{ position: "relative" }}
                onClick={() => openLightbox(idx)}
                aria-label={`${place || `${title} ${idx + 1}`} — ${t("tourDetail.enlarge")}`}
              >
                <Image src={src} alt={place || `${title} ${idx + 1}`} fill sizes="(max-width: 768px) 50vw, 300px" style={{ objectFit: "cover" }} />
                {place && <span className="tdp-gallery-place">{place}</span>}
              </button>
            );
          })}
        </div>

        {photos.length > INITIAL_PHOTOS && (
          <button
            type="button"
            className="gt-btn gt-btn--outline tdp-gallery-toggle"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? t("tourDetail.showFewerPhotos") : interpolate(t("tourDetail.showAllPhotos"), { count: photos.length })}
          </button>
        )}
      </div>
    </article>
  );
}
