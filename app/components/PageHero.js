"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";

export default function PageHero({
  kicker = "",
  title = "",
  subtitle = "",
  image = "/hero.png",
  alt = "GeorgiaTrips",
  children = null,
  align = "left",
}) {
  const bgRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const bg = bgRef.current;
    const content = contentRef.current;
    if (!bg || !content) return undefined;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.innerWidth < 768;

    if (prefersReducedMotion || isMobile) {
      return undefined;
    }

    let raf = 0;
    let isVisible = false;

    const onScroll = () => {
      if (raf || !isVisible) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const top = bg.getBoundingClientRect().top;
        const height = bg.offsetHeight;
        const offset = Math.min(0, Math.max(-height * 0.15, top * 0.22));
        bg.style.transform = `translate3d(0, ${offset}px, 0) scale(1.08)`;
        content.style.transform = `translate3d(0, ${top * 0.04}px, 0)`;
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? false;
        if (isVisible) onScroll();
      },
      { threshold: 0.05 }
    );
    observer.observe(bg);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header className={`page-hero page-hero--${align}`}>
      <div className="page-hero-bg" ref={bgRef}>
        <Image
          src={image}
          alt={alt}
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover" }}
        />
      </div>
      <div className="page-hero-overlay" aria-hidden="true" />
      <div className="page-hero-grain" aria-hidden="true" />

      <div className="page-hero-inner" ref={contentRef}>
        <div className="page-hero-content">
          {kicker && (
            <span className="page-hero-kicker">
              <span className="page-hero-kicker-dot" />
              {kicker}
            </span>
          )}
          <h1 className="page-hero-title">{title}</h1>
          {subtitle && <p className="page-hero-sub">{subtitle}</p>}
          <div className="page-hero-accent" aria-hidden="true" />
          {children}
        </div>
      </div>
    </header>
  );
}
