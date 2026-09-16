"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { LocationIcon } from "../Icons";

const INTERVAL_MS = 7000;

// Homepage hero background: a slow crossfade between regional photos, with the
// current place name in the corner. The first photo is the LCP image; the
// others start loading once the page has loaded, and a slide is only shown
// after its photo has arrived, so the crossfade never reveals a blank frame.
// On portrait screens the photo is cropped to the screen height, so `sizes`
// asks for a file wide enough to stay sharp there (a 100vw file would be
// stretched roughly four times on a phone).
export default function HeroSlides({ slides = [], goLabel = "{place}" }) {
  const [active, setActive] = useState(0);
  const [loadRest, setLoadRest] = useState(false);
  const [loaded, setLoaded] = useState(() => new Set([0]));

  useEffect(() => {
    if (document.readyState === "complete") {
      setLoadRest(true);
      return undefined;
    }
    const onLoad = () => setLoadRest(true);
    window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }, []);

  useEffect(() => {
    if (slides.length < 2) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setActive((index) => {
        const next = (index + 1) % slides.length;
        return loaded.has(next) ? next : index;
      });
    }, INTERVAL_MS);
    // Restarts after a manual pick, so the chosen photo gets its full time.
    return () => window.clearInterval(timer);
  }, [slides.length, active, loaded]);

  if (!slides.length) return null;
  const current = slides[active];

  const markLoaded = (index) =>
    setLoaded((prev) => (prev.has(index) ? prev : new Set(prev).add(index)));

  return (
    <>
      {slides.map((slide, index) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt={index === active ? slide.alt : ""}
          aria-hidden={index === active ? undefined : true}
          fill
          quality={75}
          sizes="(max-aspect-ratio: 1/1) 260vh, 100vw"
          loading={index === 0 || loadRest ? "eager" : "lazy"}
          fetchPriority={index === 0 ? "high" : "low"}
          onLoad={() => markLoaded(index)}
          className={`gt-hero-img${index === active ? " is-active" : ""}`}
          style={slide.position ? { objectPosition: slide.position } : undefined}
        />
      ))}
      <div className="gt-hero-scrim" aria-hidden="true" />

      <div className="gt-hero-place">
        <LocationIcon size={14} />
        <span key={current.src} className="gt-hero-place-name">{current.name}</span>
        {slides.length > 1 && (
          <span className="gt-hero-dots">
            {slides.map((slide, index) => (
              <button
                key={slide.src}
                type="button"
                className={index === active ? "is-active" : undefined}
                aria-label={goLabel.replace("{place}", slide.name)}
                aria-pressed={index === active}
                disabled={!loaded.has(index)}
                onClick={() => setActive(index)}
              />
            ))}
          </span>
        )}
      </div>
    </>
  );
}
