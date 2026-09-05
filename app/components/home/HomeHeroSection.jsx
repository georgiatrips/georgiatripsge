"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import DatePicker from "../DatePicker";
import HeroMosaicGrid from "../HeroMosaicGrid";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { GEORGIA_REGIONS, formatRegionName } from "../../lib/placesMeta";
import { LocationIcon, CalendarIcon, UsersIcon, SearchIcon } from "../Icons";

const HERO_SLIDES = [
  { image: "/hero.webp", label: "Kazbegi, Georgia" },
  { image: "/tbilisi.webp", label: "Tbilisi, Georgia" },
  { image: "/gudauri.webp", label: "Gudauri, Georgia" },
  { image: "/mestia.webp", label: "Svaneti, Georgia" },
  { image: "/batumi.webp", label: "Batumi, Georgia" }
];

export default function HomeHeroSection({ allAvailableDates = [] }) {
  const router = useRouter();
  const { t, lang } = useLanguage();

  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  const [previousHeroSlide, setPreviousHeroSlide] = useState(0);
  const [isHeroTransitioning, setIsHeroTransitioning] = useState(false);
  const heroTransitionTimeout = useRef(null);

  const [heroDestination, setHeroDestination] = useState("all");
  const [heroDate, setHeroDate] = useState("");
  const [heroFormat, setHeroFormat] = useState("all");

  const goToHeroSlide = useCallback((nextIdx) => {
    if (isHeroTransitioning || nextIdx === currentHeroSlide) return;
    setPreviousHeroSlide(currentHeroSlide);
    setIsHeroTransitioning(true);
    setCurrentHeroSlide(nextIdx);
    if (heroTransitionTimeout.current) clearTimeout(heroTransitionTimeout.current);
    heroTransitionTimeout.current = setTimeout(() => {
      setIsHeroTransitioning(false);
    }, 1600);
  }, [currentHeroSlide, isHeroTransitioning]);

  const handleHeroSearch = () => {
    const params = new URLSearchParams();
    if (heroDestination !== "all") params.set("destination", heroDestination);
    if (heroDate) params.set("date", heroDate);
    if (heroFormat !== "all") params.set("format", heroFormat);

    const queryStr = params.toString();
    router.push(queryStr ? `/tours?${queryStr}` : "/tours");
  };

  return (
    <section className="hero" id="home">
      <div className="hero-bg loaded active">
        <Image
          src={HERO_SLIDES[currentHeroSlide].image}
          alt={HERO_SLIDES[currentHeroSlide].label}
          fill
          priority
          sizes="100vw"
          quality={75}
          style={{ objectFit: "cover", objectPosition: "center 25%" }}
        />
      </div>

      {/* 252-Box Blur & Opacity Mosaic Matrix Transition */}
      <HeroMosaicGrid
        isTransitioning={isHeroTransitioning}
        currentSlide={currentHeroSlide}
        outgoingImage={HERO_SLIDES[previousHeroSlide].image}
      />
      <div className="hero-content">
        <div className="hero-badge">
          <span>{t("hero.badge")}</span>
        </div>

        <h1 className="hero-title">
          {t("hero.titleLine1")}<br />
          <em>{t("hero.titleLine2")}</em>
        </h1>

        <div className="hero-locations">
          <span className="hero-loc-tag">{t("hero.kazbegi")}</span>
          <span className="hero-loc-divider"></span>
          <span className="hero-loc-tag">{t("hero.tbilisi")}</span>
          <span className="hero-loc-divider"></span>
          <span className="hero-loc-tag featured">{t("hero.batumi")}</span>
          <span className="hero-loc-divider"></span>
          <span className="hero-loc-tag">{t("hero.kakheti")}</span>
          <span className="hero-loc-divider"></span>
          <span className="hero-loc-tag">{t("hero.svaneti")}</span>
        </div>

        {/* Minimalist Quick Search Widget */}
        <div className="hero-search-bar">
          <div className="hero-search-field">
            <span className="hero-search-icon">
              <LocationIcon size={16} color="var(--teal)" />
            </span>
            <div className="hero-search-input-wrap">
              <label htmlFor="hero-dest-select">{t("hero.destination")}</label>
              <select
                id="hero-dest-select"
                aria-label={t("hero.destination")}
                className="hero-search-select"
                value={heroDestination}
                onChange={(e) => setHeroDestination(e.target.value)}
              >
                <option value="all">{t("hero.allRegions")}</option>
                {GEORGIA_REGIONS.map((region) => (
                  <option key={region} value={region}>{formatRegionName(region, lang)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="hero-search-divider" />

          <div className="hero-search-field">
            <span className="hero-search-icon">
              <CalendarIcon size={16} color="var(--teal)" />
            </span>
            <div className="hero-search-input-wrap">
              <label>{t("hero.date")}</label>
              <DatePicker value={heroDate} onChange={setHeroDate} availableDates={allAvailableDates} variant="hero" />
            </div>
          </div>

          <div className="hero-search-divider" />

          <div className="hero-search-field">
            <span className="hero-search-icon">
              <UsersIcon size={16} color="var(--teal)" />
            </span>
            <div className="hero-search-input-wrap">
              <label htmlFor="hero-format-select">{t("hero.tourFormat")}</label>
              <select
                id="hero-format-select"
                aria-label={t("hero.tourFormat")}
                className="hero-search-select"
                value={heroFormat}
                onChange={(e) => setHeroFormat(e.target.value)}
              >
                <option value="all">{t("hero.allFormats")}</option>
                <option value="individual">{t("hero.individual")}</option>
                <option value="group">{t("hero.group")}</option>
              </select>
            </div>
          </div>

          <button type="button" onClick={handleHeroSearch} className="hero-search-btn">
            <SearchIcon size={16} color="currentColor" strokeWidth={2.5} />
            <span>{t("hero.search")}</span>
          </button>
        </div>
      </div>

      <div className="hero-location-badge">
        <span className="loc-pin" aria-hidden="true">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--yellow)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
        </span>
        <span className="loc-text">{HERO_SLIDES[currentHeroSlide].label}</span>
      </div>

      <div className="hero-dots" role="tablist" aria-label="slides">
        {HERO_SLIDES.map((slide, idx) => (
          <button
            key={idx}
            className={`hero-dot ${idx === currentHeroSlide ? "active" : ""}`}
            onClick={() => goToHeroSlide(idx)}
            aria-label={slide.label}
            aria-selected={idx === currentHeroSlide}
            role="tab"
          />
        ))}
      </div>
    </section>
  );
}
