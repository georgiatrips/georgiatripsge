"use client";

import { useCallback, useEffect, useRef } from "react";
import Image, { getImageProps } from "next/image";

// The lightbox image fills the viewport width on phones and most of it on
// desktop. The same `sizes` is used to preload neighbours, so the browser picks
// the identical srcset candidate and the next/previous photo is already cached
// when the visitor switches.
const SIZES = "(max-width: 768px) 100vw, 1000px";
const PRELOAD_AHEAD = 2;
const SWIPE_MIN_PX = 40;

const preloaded = new Set();

export function preloadLightboxPhoto(src) {
  if (!src || preloaded.has(src) || typeof window === "undefined") return;
  preloaded.add(src);
  const { props } = getImageProps({ src, alt: "", fill: true, sizes: SIZES });
  const img = new window.Image();
  img.decoding = "async";
  img.sizes = props.sizes || SIZES;
  if (props.srcSet) img.srcset = props.srcSet;
  img.src = props.src;
}

export default function TourLightbox({ photos, index, onIndexChange, onClose, resolveTitle, altBase, labels }) {
  const count = photos.length;
  const touchStartX = useRef(null);

  const go = useCallback(
    (step) => onIndexChange((current) => (current + step + count) % count),
    [count, onIndexChange]
  );

  // Keyboard navigation and closing.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  // Keep the page behind from scrolling while the lightbox is open.
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  // Warm the cache for the photos the visitor is most likely to open next.
  useEffect(() => {
    for (let step = 1; step <= PRELOAD_AHEAD; step += 1) {
      preloadLightboxPhoto(photos[(index + step) % count]);
      preloadLightboxPhoto(photos[(index - step + count) % count]);
    }
  }, [index, photos, count]);

  const src = photos[index];
  const place = resolveTitle(src, index);

  const stop = (e) => e.stopPropagation();
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) >= SWIPE_MIN_PX) go(dx < 0 ? 1 : -1);
  };

  return (
    <div className="tdp-lightbox-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={place || altBase}>
      <div className="tdp-lightbox-content" onClick={stop} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <button type="button" className="lb-close" onClick={onClose} aria-label={labels.close}>✕</button>
        {count > 1 && (
          <button type="button" className="lb-nav lb-prev" onClick={() => go(-1)} aria-label={labels.prev}>‹</button>
        )}
        <div className="lb-image-wrapper">
          <Image
            key={src}
            src={src}
            alt={place || `${altBase} ${index + 1}`}
            fill
            sizes={SIZES}
            loading="eager"
            style={{ objectFit: "contain" }}
          />
        </div>
        {count > 1 && (
          <button type="button" className="lb-nav lb-next" onClick={() => go(1)} aria-label={labels.next}>›</button>
        )}
        <div className="lb-counter">
          {place && <span className="lb-place">📍 {place}</span>}
          <span>{index + 1} / {count}</span>
        </div>
      </div>
    </div>
  );
}
