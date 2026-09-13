"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";

/**
 * PageHeader — unified premium dark-image hero used across all inner pages.
 *
 * Props:
 *  - kicker   : small uppercase eyebrow label (e.g. "აღმოაჩინე საქართველო")
 *  - title    : main page title
 *  - subtitle : short muted description
 *  - image    : background image path (page-relevant, high quality)
 *  - alt      : accessible alt text for the background image
 *  - children : optional extra content (e.g. search bar) rendered under the text
 *
 * The design is shared across Tours / Places / Hotels / Transport / Articles for
 * visual consistency, with a subtle dark gradient (top + bottom) for text
 * readability and a gentle parallax drift on scroll.
 */
export default function PageHeader({
  kicker = "",
  title = "",
  subtitle = "",
  image = "/hero.png",
  alt = "GeorgiaTrips",
  children = null,
}) {
  const bgRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const bg = bgRef.current;
    const content = contentRef.current;
    if (!bg || !content) return undefined;

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const top = bg.getBoundingClientRect().top;
        const height = bg.offsetHeight;
        // Parallax: drift the image slightly slower than the page scroll.
        const offset = Math.min(0, Math.max(-height * 0.18, top * 0.28));
        bg.style.transform = `translate3d(0, ${offset}px, 0) scale(1.12)`;
        content.style.transform = `translate3d(0, ${top * 0.06}px, 0)`;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header className="page-header">
      <div className="page-header-bg" ref={bgRef}>
        <Image
          src={image}
          alt={alt}
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover" }}
        />
      </div>
      {/* Subtle readable gradient — top for nav, bottom for text lift */}
      <div className="page-header-scrim" aria-hidden="true" />
      <div className="page-header-glow" aria-hidden="true" />

      <div className="page-header-inner" ref={contentRef}>
        <div className="page-header-content">
          {kicker && <span className="page-header-kicker">{kicker}</span>}
          <h1 className="page-header-title">{title}</h1>
          {subtitle && <p className="page-header-sub">{subtitle}</p>}
          <div className="page-header-line" aria-hidden="true" />
          {children}
        </div>
      </div>
    </header>
  );
}
