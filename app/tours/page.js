"use client";

import React, { useState, useMemo, useEffect, Suspense, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import DatePicker from "../components/DatePicker";
import { DESTINATIONS } from "../lib/toursData";
import { formatRegionName } from "../lib/placesMeta";
import { useAllTours } from "../lib/useAllTours";
import { asLocalizedText, translateDuration, translateLocation, formatLocationStr, matchesMultiLang } from "../lib/toursFirestore";
import { WA_LINK } from "../lib/shared";
import { useLanguage } from "../lib/i18n/LanguageContext";
import { useCurrency } from "../lib/currency/CurrencyContext";
import { formatPriceStr } from "../lib/i18n/formatPriceStr";
import TourPrice from "../components/TourPrice";
import { SearchIcon, LocationIcon, ClockIcon, UsersIcon, CalendarIcon } from "../components/Icons";

function ToursPageContent() {
  const searchParams = useSearchParams();
  const { t, lang, isEnglish, isRussian } = useLanguage();
  const { format } = useCurrency();

  const [selectedDestination, setSelectedDestination] = useState("all");
  const [selectedType, setSelectedType] = useState("all"); // "all" | "oneday" | "multiday"
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("all"); // "all" | "individual" | "group"
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [showMobileFilterTrigger, setShowMobileFilterTrigger] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [mounted, setMounted] = useState(false);
  const filterPanelRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!filterPanelRef.current) return;
      const rect = filterPanelRef.current.getBoundingClientRect();
      setShowMobileFilterTrigger(rect.top <= 20);
    };

    window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, []);

  // Static tours + Firestore tours added from Admin panel
  const { allTours } = useAllTours();

  const allAvailableDates = useMemo(() => {
    const datesSet = new Set();
    allTours.forEach((t) => {
      if (t.dates) t.dates.forEach((d) => datesSet.add(d));
      if (t.departureDates) t.departureDates.forEach((entry) => {
        const iso = typeof entry === "string" ? entry : entry?.date;
        if (iso) datesSet.add(iso);
      });
    });
    return Array.from(datesSet);
  }, [allTours]);

  // Sync state with URL Search Params on mount or when URL changes
  useEffect(() => {
    const dest = searchParams.get("destination");
    const fmt = searchParams.get("format");
    const dt = searchParams.get("date");

    if (dest) setSelectedDestination(dest);
    if (fmt) setSelectedFormat(fmt);
    if (dt) setSelectedDate(dt);
  }, [searchParams]);

  // Filtering Logic
  const filteredTours = useMemo(() => {
    return allTours.filter((tour) => {
      // 1. Destination filter
      if (selectedDestination !== "all" && tour.destination !== selectedDestination) {
        return false;
      }

      // 2. Type filter (oneday / multiday)
      if (selectedType !== "all" && tour.type !== selectedType) {
        return false;
      }

      // 3. Tour Format filter (individual / group)
      if (selectedFormat === "individual" && !(tour.hasPrivate ?? Boolean(tour.pricePrivate))) {
        return false;
      }
      if (selectedFormat === "group" && !(tour.hasGroup ?? Boolean(tour.priceGroup))) {
        return false;
      }

      // 4. Date filter
      if (selectedDate) {
        const parts = selectedDate.split("-");
        if (parts.length === 3) {
          const mmdd = `${parts[1]}.${parts[2]}`;
          const hasExactDepartureDate = tour.departureDates?.some((entry) => {
            const iso = typeof entry === "string" ? entry : entry?.date;
            return iso === selectedDate;
          });
          const hasMatchingLegacyDate = tour.dates?.includes(mmdd);
          if (!hasExactDepartureDate && !hasMatchingLegacyDate) {
            return false;
          }
        }
      }

      // 5. Multi-language Search query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchTitle = matchesMultiLang(tour.title, q);
        const matchDesc = matchesMultiLang(tour.desc, q);
        const matchLoc = matchesMultiLang(tour.location, q) || matchesMultiLang(tour.destination, q) || matchesMultiLang(tour.destinationLabel, q);
        if (!matchTitle && !matchDesc && !matchLoc) return false;
      }

      return true;
    });
  }, [selectedDestination, selectedType, selectedFormat, selectedDate, searchQuery, allTours]);

  useEffect(() => { setCurrentPage(1); }, [selectedDestination, selectedType, selectedFormat, selectedDate, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredTours.length / 12));
  const visibleTours = filteredTours.slice((currentPage - 1) * 12, currentPage * 12);

  const resetFilters = () => {
    setSelectedDestination("all");
    setSelectedType("all");
    setSelectedDate("");
    setSelectedFormat("all");
    setSearchQuery("");
  };

  const hasActiveFilters = selectedDestination !== "all" || selectedType !== "all" || selectedFormat !== "all" || selectedDate || searchQuery;

  return (
    <>
      <Navbar active="tours" />

      {/* Hero Banner Section */}
      <PageHero
        kicker={t("toursPage.kicker")}
        title={t("toursPage.title")}
        subtitle={t("toursPage.subtitle")}
        image="/hero.webp"
        alt={t("toursPage.title")}
      />

      {/* Main Content with Filter Bar and Tour Cards Grid */}
      <section className="tours-catalog-section">
        <div className="tours-catalog-inner">

          {/* Floating Mobile Filter Trigger Button via Portal */}
          {mounted && showMobileFilterTrigger && typeof document !== "undefined" && createPortal(
            <div className="mobile-filter-bar-wrap">
              <button
                type="button"
                className="mobile-filter-trigger-btn"
                onClick={() => setMobileFilterOpen(true)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                <span>{t("toursPage.openFilters")}</span>
                {hasActiveFilters && <span className="mobile-filter-dot" />}
              </button>
            </div>,
            document.body
          )}

          {/* Backdrop Overlay for Mobile Drawer */}
          {mobileFilterOpen && (
            <div className="mobile-filter-backdrop" onClick={() => setMobileFilterOpen(false)} />
          )}

          {/* Filter Bar Panel */}
          <aside ref={filterPanelRef} className={"tours-filter-panel " + (mobileFilterOpen ? "mobile-open " : "")}>
            <div className="filter-panel-header">
              <h3>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                {t("toursPage.filterTitle")}
              </h3>
              <div className="filter-header-actions">
                {hasActiveFilters && (
                  <button className="btn-reset-filters" onClick={resetFilters}>
                    {t("toursPage.reset")}
                  </button>
                )}
                <button className="btn-close-mobile-filter" onClick={() => setMobileFilterOpen(false)} aria-label="დახურვა">
                  ✕
                </button>
              </div>
            </div>

            <div className="filter-form-grid">
              {/* Search input */}
              <div className="filter-group filter-group-full">
                <label htmlFor="filter-search">{t("toursPage.searchLabel") || (lang === "en" ? "Search Keyword" : lang === "ru" ? "Ключевое слово" : lang === "tr" ? "Arama Kelimesi" : lang === "ar" ? "كلمة البحث" : "საძიებო სიტყვა")}</label>
                <div className="filter-input-wrap">
                  <SearchIcon size={16} />
                  <input
                    id="filter-search"
                    type="text"
                    placeholder={t("toursPage.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* 1. Destination Filter */}
              <div className="filter-group">
                <label htmlFor="filter-destination">{t("toursPage.regionLabel")}</label>
                <div className="filter-select-wrap">
                  <LocationIcon size={16} />
                  <select
                    id="filter-destination"
                    value={selectedDestination}
                    onChange={(e) => setSelectedDestination(e.target.value)}
                  >
                    {DESTINATIONS.map((dest) => (
                      <option key={dest.value} value={dest.value}>
                        {dest.value === "all" ? t("hero.allRegions") : formatRegionName(dest.value, lang)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2. Tour Type Filter (One-day / Multi-day) */}
              <div className="filter-group">
                <label htmlFor="filter-type">{t("toursPage.typeLabel")}</label>
                <div className="filter-select-wrap">
                  <ClockIcon size={16} />
                  <select
                    id="filter-type"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                  >
                    <option value="all">{t("toursPage.allTypes")}</option>
                    <option value="oneday">{t("toursPage.oneDay")}</option>
                    <option value="multiday">{t("toursPage.multiDay")}</option>
                  </select>
                </div>
              </div>

              {/* 3. Custom DatePicker Filter */}
              <div className="filter-group">
                <label>{t("toursPage.dateLabel")}</label>
                <DatePicker
                  value={selectedDate}
                  onChange={(dateStr) => setSelectedDate(dateStr)}
                  placeholder={t("datePicker.selectDate")}
                  direction="up"
                  availableDates={allAvailableDates}
                  variant="filter"
                />
              </div>

              {/* 4. Tour Format Filter (Individual / Group) */}
              <div className="filter-group">
                <label htmlFor="filter-format">{t("toursPage.formatLabel")}</label>
                <div className="filter-select-wrap">
                  <UsersIcon size={16} />
                  <select
                    id="filter-format"
                    value={selectedFormat}
                    onChange={(e) => setSelectedFormat(e.target.value)}
                  >
                    <option value="all">{t("toursPage.allFormats")}</option>
                    <option value="individual">{t("toursPage.individual")}</option>
                    <option value="group">{t("toursPage.group")}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Mobile apply button */}
            <button className="btn-apply-mobile-filter" onClick={() => setMobileFilterOpen(false)}>
              {t("toursPage.showResults").replace("{count}", filteredTours.length)}
            </button>
          </aside>

          {/* Results Summary & Cards Grid */}
          <div className="tours-results-wrap">
            <div className="tours-results-header">
              <h2>
                {(() => {
                  const raw = t("toursPage.toursFound");
                  const count = filteredTours.length;
                  if (raw.includes("{count}")) {
                    const parts = raw.split("{count}");
                    return (
                      <>
                        {parts[0]}
                        <strong>{count}</strong>
                        {parts[1]}
                      </>
                    );
                  }
                  return (
                    <>
                      {raw} <strong>{count}</strong>
                    </>
                  );
                })()}
              </h2>
              {hasActiveFilters ? (
                <div className="active-filter-tags">
                  {selectedDestination !== "all" && (
                    <span className="filter-tag">
                      {formatRegionName(selectedDestination, lang)}
                      <button onClick={() => setSelectedDestination("all")}>✕</button>
                    </span>
                  )}
                  {selectedType !== "all" && (
                    <span className="filter-tag">
                      {selectedType === "oneday" ? t("toursPage.oneDay") : t("toursPage.multiDay")}
                      <button onClick={() => setSelectedType("all")}>✕</button>
                    </span>
                  )}
                  {selectedFormat !== "all" && (
                    <span className="filter-tag">
                      {selectedFormat === "individual" ? t("toursPage.individual") : t("toursPage.group")}
                      <button onClick={() => setSelectedFormat("all")}>✕</button>
                    </span>
                  )}
                </div>
              ) : null}
            </div>

            {filteredTours.length > 0 ? (
              <>
              <div className="tours-grid-catalog">
                {visibleTours.map((tour, index) => {
                  const badgeText = asLocalizedText(tour.badge, lang);
                  const destText = asLocalizedText(tour.destinationLabel, lang) || asLocalizedText(tour.destination, lang);
                  const badgeLabel = (t("tourBadges") || {})[badgeText] || badgeText || destText || t("common.georgia");
                  const titleText = asLocalizedText(tour.title, lang);
                  const descText = asLocalizedText(tour.desc, lang);
                  const durationText = translateDuration(tour.duration, lang);
                  const locText = translateLocation(tour.destinationLabel || tour.destination || tour.location || tour.region, lang);

                  return (
                    <Link key={tour.id} href={`/tours/${tour.id}`} className="tb-card" style={{ textDecoration: "none" }}>
                      <div className="tb-card-img-wrap">
                        <Image
                          src={tour.img || "/hero.webp"}
                          alt={titleText}
                          className="tb-card-img"
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          style={{ objectFit: "cover" }}
                          loading={index === 0 ? "eager" : "lazy"}
                        />
                        <span className="tb-badge">{badgeLabel}</span>
                        <div className="tb-overlay-right">
                          {tour.pricePrivate && <div className="tb-price-tag tb-price-priv"><small>{t("popular.privateLabel")}</small><TourPrice price={tour.pricePrivate} lang={lang} variant="card" /></div>}
                          {tour.priceGroup && <div className="tb-price-tag tb-price-group"><small>{t("popular.groupPrice")}</small><TourPrice price={tour.priceGroup} lang={lang} variant="card" /></div>}
                          {tour.dates?.length > 0 && <div className="tb-dates-row">{tour.dates.slice(0, 4).map((date, index) => <span key={index} className="tb-date-chip">{date}</span>)}</div>}
                        </div>
                      </div>
                      <div className="tb-card-body">
                        <h3 className="tb-card-title">{titleText}</h3>
                        <p className="tb-card-annotation">{descText}</p>
                        <div className="tb-card-line" />
                        <div className="tb-card-facilities">
                          <span className="tb-facility-item" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            <ClockIcon size={14} color="var(--teal)" />
                            <span>{durationText}</span>
                          </span>
                          <span className="tb-facility-item" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            <LocationIcon size={14} color="var(--teal)" />
                            <span>{locText ? locText.replace(/^📍\s*/, "") : t("popular.fromBatumiShort").replace(/^📍\s*/, "")}</span>
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <div className="catalog-pagination" aria-label="ტურების გვერდები">{Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => <button key={number} type="button" className={currentPage === number ? "is-active" : ""} onClick={() => setCurrentPage(number)}>{number}</button>)}</div>
              </>
            ) : (
              <div className="tours-empty-state">
                <div className="empty-icon">🏔️</div>
                <h3>{t("toursPage.noToursFoundTitle")}</h3>
                <p>{t("toursPage.noToursFoundDesc")}</p>
                <button className="btn-empty-reset" onClick={resetFilters}>
                  {t("toursPage.clearFilters")}
                </button>
              </div>
            )}
          </div>

        </div>
      </section>

      <Footer />
    </>
  );
}

export default function ToursPage() {
  return (
    <Suspense fallback={<div style={{ padding: "4rem", textAlign: "center", color: "#0d233a" }}>...</div>}>
      <ToursPageContent />
    </Suspense>
  );
}
