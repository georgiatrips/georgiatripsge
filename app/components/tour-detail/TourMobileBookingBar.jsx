"use client";

import { useEffect, useState } from "react";
import TourPrice from "../TourPrice";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { ArrowRightIcon, WhatsAppIcon } from "../Icons";
import "../../styles/book-bar.css";

// Booking bar for phones on the tour page (CSS shows it at <=768px only).
// It slides in once most of the hero has scrolled away and slides out while
// the booking form itself is on screen. Its visibility lives here, so showing
// or hiding it re-renders only this bar, never the whole tour page, and no
// scroll listener runs while the visitor scrolls.
export default function TourMobileBookingBar({ price, label, waUrl, bookLabel, onBook }) {
  const { t } = useLanguage();
  const [heroGone, setHeroGone] = useState(false);
  const [formOnScreen, setFormOnScreen] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;
    const observers = [];

    // TourDetailHero renders .tdp-hero3 (title, photos and facts); the other
    // classes are older markups.
    const hero = document.querySelector(".tdp-hero3, .tdp-hero2, .tdp-hero");
    if (hero) {
      // Root = lower half of the screen: the hero counts as gone once its
      // bottom edge has moved above the middle.
      const io = new IntersectionObserver(([entry]) => setHeroGone(!entry.isIntersecting), { rootMargin: "-50% 0px 0px 0px" });
      io.observe(hero);
      observers.push(io);
    } else {
      setHeroGone(true);
    }

    const form = document.getElementById("tour-booking-form") || document.getElementById("mobile-booking-target");
    if (form) {
      const io = new IntersectionObserver(([entry]) => setFormOnScreen(entry.isIntersecting), { threshold: 0.1 });
      io.observe(form);
      observers.push(io);
    }

    return () => observers.forEach((io) => io.disconnect());
  }, []);

  const visible = heroGone && !formOnScreen;

  return (
    <aside className={`gt-book-bar${visible ? " is-visible" : ""}`} aria-label={bookLabel} inert={!visible}>
      <div className="gt-book-bar-price">
        <small>{label}</small>
        <TourPrice price={price} variant="bar" compact />
      </div>
      <a href={waUrl} target="_blank" rel="noopener noreferrer" className="gt-book-bar-wa" aria-label={t("site.chatWhatsapp")}>
        <WhatsAppIcon size={22} />
      </a>
      <button type="button" className="gt-btn gt-btn--gold gt-book-bar-cta" onClick={onBook}>
        {bookLabel}
        <ArrowRightIcon size={17} />
      </button>
    </aside>
  );
}
