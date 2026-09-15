"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { asLocalizedText, extractImageUrl } from "../../lib/toursFirestore";
import { getLocalizedHref } from "../../lib/siteConfig";
import { interpolate } from "../../lib/i18n/translate";
import { ArrowRightIcon, CameraIcon } from "../Icons";
import "../../styles/tour-route.css";

// normalizeFirestoreTour substitutes a generic site photo when a stop has no
// image; that photo is not of the stop, so it is treated as "no photo".
const PLACEHOLDER_IMAGES = new Set(["/hero.webp", "/hero.png"]);

// Visual itinerary: a vertical route where every stop shows its own photo,
// name and description. The number stays as a small marker on the line so
// the order is still clear, but the photo carries the story. Works the same
// on touch (no hover-only content) and opens the gallery at that photo.
export default function TourDetailRouteMap({ tour, openLightbox }) {
  const { t, lang } = useLanguage();
  const [expanded, setExpanded] = useState(() => new Set());

  const stops = Array.isArray(tour.itinerary) ? tour.itinerary : [];
  if (stops.length === 0) return null;

  const gallery = (tour.gallery || []).map((g) => extractImageUrl(g));

  const toggle = (index) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  return (
    <article className="tdp-card-block tdp-route" id="route" aria-labelledby="tdp-route-title">
      <div className="tdp-card-header">
        <div>
          <h2 id="tdp-route-title">{t("tourDetail.routeTitle")}</h2>
          <p className="subtitle">{interpolate(t("tourDetail.routeLead"), { count: stops.length })}</p>
        </div>
      </div>

      <ol className="tdp-route-list">
        {stops.map((item, index) => {
          const title = asLocalizedText(item.title, lang);
          const desc = asLocalizedText(item.desc, lang).trim();
          const rawImg = extractImageUrl(item.img);
          const img = rawImg && !PLACEHOLDER_IMAGES.has(rawImg) ? rawImg : "";
          const galleryIndex = img ? gallery.findIndex((url) => url === img || url.split("?")[0] === img.split("?")[0]) : -1;
          const isLong = desc.length > 240;
          const isOpen = expanded.has(index);
          const descId = `tdp-stop-desc-${index}`;
          const stopLabel = interpolate(t("tourDetail.stopLabel"), { n: index + 1 });

          const photo = img ? (
            <>
              <Image src={img} alt={title} fill sizes="(max-width: 640px) 100vw, 240px" />
              {galleryIndex >= 0 && (
                <span className="tdp-stop-zoom" aria-hidden="true"><CameraIcon size={15} /></span>
              )}
            </>
          ) : null;

          return (
            <li key={`${index}-${title}`} className={`tdp-stop${img ? "" : " tdp-stop--text"}`}>
              <span className="tdp-stop-marker" aria-hidden="true">{index + 1}</span>
              <div className="tdp-stop-card">
                {img && (galleryIndex >= 0 ? (
                  <button
                    type="button"
                    className="tdp-stop-media"
                    onClick={() => openLightbox(galleryIndex)}
                    aria-label={`${title} — ${t("tourDetail.galleryTitle")}`}
                  >
                    {photo}
                  </button>
                ) : (
                  <div className="tdp-stop-media">{photo}</div>
                ))}

                <div className="tdp-stop-body">
                  <p className="tdp-stop-label">{stopLabel}</p>
                  <h3>{title}</h3>
                  {desc && (
                    <p id={descId} className={`tdp-stop-desc${isLong && !isOpen ? " is-clamped" : ""}`}>
                      {desc}
                    </p>
                  )}
                  {(isLong || item.placeId) && (
                    <div className="tdp-stop-actions">
                      {isLong && (
                        <button type="button" className="tdp-stop-more" aria-expanded={isOpen} aria-controls={descId} onClick={() => toggle(index)}>
                          {isOpen ? t("tourDetail.showLess") : t("tourDetail.readMore")}
                        </button>
                      )}
                      {item.placeId && (
                        <Link href={getLocalizedHref(`/places/${item.placeId}`, lang)} className="tdp-stop-link" prefetch={false}>
                          {t("tourDetail.placeDetails")}
                          <ArrowRightIcon size={14} />
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </article>
  );
}
