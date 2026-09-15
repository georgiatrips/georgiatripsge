"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "../Navbar";
import Footer from "../Footer";
import PageHero from "../PageHero";
import DatePicker from "../DatePicker";
import TourCard from "../site/TourCard";
import { GEORGIA_REGIONS, formatRegionName } from "../../lib/placesMeta";
import { matchesMultiLang } from "../../lib/toursFirestore";
import { toTourView, formatTourDate } from "../../lib/tourView";
import { interpolate } from "../../lib/i18n/translate";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { getLocalizedHref } from "../../lib/siteConfig";
import { whatsappHref } from "../../lib/shared";
import {
  ArrowRightIcon, ChevronDownIcon, ClockIcon, CloseIcon, FilterIcon, LocationIcon, RouteIcon, SearchIcon, UsersIcon, WhatsAppIcon,
} from "../Icons";
import "../../styles/tour-card.css";

const PAGE_SIZE = 12;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const kaText = (value) => (typeof value === "string" ? value : value?.ka || "");

function readParams(searchParams) {
  const date = searchParams.get("date") || "";
  const format = searchParams.get("format");
  const type = searchParams.get("type");
  return {
    region: searchParams.get("destination") || "all",
    date: ISO_DATE.test(date) ? date : "",
    format: format === "group" || format === "individual" ? format : "all",
    type: type === "oneday" || type === "multiday" ? type : "all",
    query: searchParams.get("search") || "",
  };
}

export default function ToursCatalogClient({ initialTours = [] }) {
  const searchParams = useSearchParams();
  const { t, lang } = useLanguage();
  const [initial] = useState(() => readParams(searchParams));

  const [region, setRegion] = useState(initial.region);
  const [date, setDate] = useState(initial.date);
  const [format, setFormat] = useState(initial.format);
  const [type, setType] = useState(initial.type);
  const [query, setQuery] = useState(initial.query);
  const [page, setPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);

  const entries = useMemo(
    () =>
      (Array.isArray(initialTours) ? initialTours : [])
        .map((raw) => {
          const view = toTourView(raw, lang);
          if (!view) return null;
          // Only departures with seats left count as bookable group dates.
          const groupDates = view.departures.filter((d) => d.freeSeats === null || d.freeSeats > 0).map((d) => d.date);
          return {
            raw,
            view,
            region: kaText(raw.destination) || kaText(raw.destinationLabel),
            type: raw.type === "multiday" ? "multiday" : "oneday",
            groupDates: new Set(groupDates),
            groupDateList: groupDates,
          };
        })
        .filter(Boolean),
    [initialTours, lang]
  );

  const regionCounts = useMemo(() => {
    const counts = new Map();
    entries.forEach((entry) => entry.region && counts.set(entry.region, (counts.get(entry.region) || 0) + 1));
    return counts;
  }, [entries]);

  const regionsWithTours = useMemo(() => {
    const known = GEORGIA_REGIONS.filter((r) => regionCounts.has(r));
    const extra = [...regionCounts.keys()].filter((r) => !GEORGIA_REGIONS.includes(r));
    return [...known, ...extra];
  }, [regionCounts]);
  const otherRegions = GEORGIA_REGIONS.filter((r) => !regionCounts.has(r));
  const showTypeFilter = new Set(entries.map((e) => e.type)).size > 1;

  // Calendar marks group departures of the tours that match the chosen region.
  const calendarGroupDates = useMemo(() => {
    const all = new Set();
    entries.forEach((entry) => {
      if (region !== "all" && entry.region !== region) return;
      if (!entry.view.hasGroup) return;
      entry.groupDateList.forEach((d) => all.add(d));
    });
    return [...all].sort();
  }, [entries, region]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries
      .filter((entry) => {
        const { view, raw } = entry;
        if (region !== "all" && entry.region !== region) return false;
        if (type !== "all" && entry.type !== type) return false;
        if (format === "group" && !view.hasGroup) return false;
        if (format === "individual" && !view.hasPrivate) return false;
        if (date) {
          const groupOnDate = view.hasGroup && entry.groupDates.has(date);
          // Private tours run on any day; group tours only on their departures.
          if (format === "group" && !groupOnDate) return false;
          if (format === "all" && !groupOnDate && !view.hasPrivate) return false;
        }
        if (q) {
          const hit =
            matchesMultiLang(raw.title, q) ||
            matchesMultiLang(raw.desc, q) ||
            matchesMultiLang(raw.destination, q) ||
            matchesMultiLang(raw.destinationLabel, q) ||
            view.stops.some((stop) => String(stop).toLowerCase().includes(q));
          if (!hit) return false;
        }
        return true;
      })
      .map((entry) => ({
        ...entry,
        dateMatch: date
          ? format !== "individual" && entry.view.hasGroup && entry.groupDates.has(date)
            ? "group"
            : "private"
          : null,
      }))
      .sort((a, b) => {
        if (a.dateMatch !== b.dateMatch) return a.dateMatch === "group" ? -1 : 1;
        if (a.view.isPopular !== b.view.isPopular) return a.view.isPopular ? -1 : 1;
        return (a.view.nextDeparture?.date || "9999").localeCompare(b.view.nextDeparture?.date || "9999");
      });
  }, [entries, region, type, format, date, query]);

  // Keep the URL shareable (and the homepage search deep-linkable) without a
  // navigation or scroll jump.
  useEffect(() => {
    const params = new URLSearchParams();
    if (region !== "all") params.set("destination", region);
    if (date) params.set("date", date);
    if (format !== "all") params.set("format", format);
    if (type !== "all") params.set("type", type);
    if (query.trim()) params.set("search", query.trim());
    const qs = params.toString();
    const next = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(window.history.state, "", next);
    }
    setPage(1);
  }, [region, date, format, type, query]);

  const closeSheet = useCallback(() => setSheetOpen(false), []);

  useEffect(() => {
    if (!sheetOpen) return undefined;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    const onKey = (event) => {
      if (event.key === "Escape" && !document.querySelector(".dp-popover")) closeSheet();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [sheetOpen, closeSheet]);

  const resetFilters = () => {
    setRegion("all");
    setDate("");
    setFormat("all");
    setType("all");
    setQuery("");
  };

  const activeCount = [region !== "all", Boolean(date), format !== "all", type !== "all"].filter(Boolean).length;
  const hasFilters = activeCount > 0 || Boolean(query.trim());
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const visible = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const regionWithoutTours = region !== "all" && !regionCounts.has(region);
  const regionName = region !== "all" ? formatRegionName(region, lang) : "";

  const activeChips = [
    region !== "all" && { key: "region", label: regionName, clear: () => setRegion("all") },
    date && { key: "date", label: formatTourDate(date, lang, { day: "numeric", month: "long" }), clear: () => setDate("") },
    format !== "all" && { key: "format", label: t(format === "group" ? "toursPage.group" : "toursPage.individual"), clear: () => setFormat("all") },
    type !== "all" && { key: "type", label: t(type === "oneday" ? "toursPage.oneDay" : "toursPage.multiDay"), clear: () => setType("all") },
  ].filter(Boolean);

  const selectField = (id, label, value, onChange, icon, children) => (
    <div className="gt-filter">
      <label htmlFor={id} className="gt-filter-label">{label}</label>
      <div className="gt-filter-control">
        {icon}
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          {children}
        </select>
        <ChevronDownIcon size={14} className="gt-filter-caret" />
      </div>
    </div>
  );

  return (
    <>
      <Navbar active="tours" />
      <main>
        <PageHero compact kicker={t("toursPage.kicker")} title={t("toursPage.title")} subtitle={t("toursPage.subtitle")} image="/gudauri.webp" />

        <section className="gt-catalog" aria-labelledby="catalog-results">
          <div className="gt-container">
            <div className={`gt-filterbar${showTypeFilter ? " has-type" : ""}`} role="search" aria-label={t("toursPage.filterTitle")}>
              <div className="gt-filter gt-filter--search">
                <label htmlFor="tf-search" className="gt-filter-label">{t("toursPage.searchLabel")}</label>
                <div className="gt-filter-control">
                  <SearchIcon size={17} />
                  <input
                    id="tf-search"
                    type="search"
                    value={query}
                    placeholder={t("toursPage.searchPlaceholder")}
                    onChange={(e) => setQuery(e.target.value)}
                    enterKeyHint="search"
                  />
                </div>
              </div>

              <button
                type="button"
                className="gt-filter-toggle"
                aria-expanded={sheetOpen}
                aria-controls="tf-sheet"
                onClick={() => setSheetOpen(true)}
              >
                <FilterIcon size={17} />
                <span>{t("toursPage.filters")}</span>
                {activeCount > 0 && <span className="gt-filter-count">{activeCount}</span>}
              </button>

              {sheetOpen && <div className="gt-filter-backdrop" aria-hidden="true" onClick={closeSheet} />}

              <div
                id="tf-sheet"
                className={`gt-filter-sheet${sheetOpen ? " is-open" : ""}`}
                role={sheetOpen ? "dialog" : undefined}
                aria-modal={sheetOpen ? "true" : undefined}
                aria-label={sheetOpen ? t("toursPage.filterTitle") : undefined}
              >
                <div className="gt-filter-sheet-head">
                  <strong>{t("toursPage.filterTitle")}</strong>
                  <button type="button" className="gt-icon-btn" onClick={closeSheet} aria-label={t("common.close")}>
                    <CloseIcon size={22} />
                  </button>
                </div>

                {selectField("tf-region", t("toursPage.regionLabel"), region, setRegion, <LocationIcon size={17} />, (
                  <>
                    <option value="all">{t("hero.allRegions")}</option>
                    {regionsWithTours.length > 0 && (
                      <optgroup label={t("toursPage.regionsWithTours")}>
                        {regionsWithTours.map((r) => (
                          <option key={r} value={r}>{`${formatRegionName(r, lang)} (${regionCounts.get(r)})`}</option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label={t("toursPage.otherRegions")}>
                      {otherRegions.map((r) => (
                        <option key={r} value={r}>{formatRegionName(r, lang)}</option>
                      ))}
                    </optgroup>
                  </>
                ))}

                <div className="gt-filter">
                  <label htmlFor="tf-date" className="gt-filter-label">{t("toursPage.dateLabel")}</label>
                  <DatePicker
                    id="tf-date"
                    value={date}
                    onChange={setDate}
                    placeholder={t("datePicker.selectDate")}
                    highlightDates={calendarGroupDates}
                    highlightLabel={t("datePicker.groupDeparture")}
                    anyDayLabel={t("datePicker.anyDay")}
                    variant="filter"
                  />
                </div>

                {selectField("tf-format", t("toursPage.formatLabel"), format, setFormat, <UsersIcon size={17} />, (
                  <>
                    <option value="all">{t("toursPage.allFormats")}</option>
                    <option value="group">{t("toursPage.group")}</option>
                    <option value="individual">{t("toursPage.individual")}</option>
                  </>
                ))}

                {showTypeFilter && selectField("tf-type", t("toursPage.typeLabel"), type, setType, <ClockIcon size={17} />, (
                  <>
                    <option value="all">{t("toursPage.allTypes")}</option>
                    <option value="oneday">{t("toursPage.oneDay")}</option>
                    <option value="multiday">{t("toursPage.multiDay")}</option>
                  </>
                ))}

                <div className="gt-filter-sheet-foot">
                  <button type="button" className="gt-btn gt-btn--outline" onClick={resetFilters} disabled={!hasFilters}>
                    {t("toursPage.reset")}
                  </button>
                  <button type="button" className="gt-btn gt-btn--navy" onClick={closeSheet}>
                    {interpolate(t("toursPage.showResults"), { count: results.length })}
                  </button>
                </div>
              </div>
            </div>

            <div className="gt-results-head">
              <h2 id="catalog-results" className="gt-results-count" aria-live="polite">
                {interpolate(t("toursPage.resultsCount"), { count: results.length })}
              </h2>
              {(activeChips.length > 0 || query.trim()) && (
                <ul className="gt-active-chips">
                  {activeChips.map((chip) => (
                    <li key={chip.key} className="gt-active-chip">
                      <button type="button" onClick={chip.clear} aria-label={`${chip.label} — ${t("toursPage.reset")}`}>
                        {chip.label}
                        <CloseIcon size={14} />
                      </button>
                    </li>
                  ))}
                  <li>
                    <button type="button" className="gt-reset-link" onClick={resetFilters}>{t("toursPage.clearFilters")}</button>
                  </li>
                </ul>
              )}
            </div>

            {visible.length > 0 ? (
              <div className="gt-tour-grid">
                {visible.map((entry, index) => (
                  <TourCard
                    key={entry.view.id}
                    tour={entry.view}
                    lang={lang}
                    t={t}
                    eager={page === 1 && index < 3}
                    dateMatch={entry.dateMatch}
                  />
                ))}
              </div>
            ) : (
              <div className="gt-empty">
                <span className="gt-icon-badge"><RouteIcon size={22} /></span>
                <h2>{regionWithoutTours ? t("toursPage.emptyRegionTitle") : t("toursPage.noToursFoundTitle")}</h2>
                <p>{regionWithoutTours ? t("toursPage.emptyRegionText") : t("toursPage.noToursFoundDesc")}</p>
                <div className="gt-empty-actions">
                  <a
                    href={whatsappHref(regionWithoutTours ? interpolate(t("homepage.destWa"), { place: regionName }) : t("site.generalWa"))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gt-btn gt-btn--wa"
                  >
                    <WhatsAppIcon size={18} />
                    {t("site.chatWhatsapp")}
                  </a>
                  <button type="button" className="gt-btn gt-btn--outline" onClick={resetFilters}>
                    {t("toursPage.clearFilters")}
                  </button>
                </div>
              </div>
            )}

            {totalPages > 1 && (
              <nav className="gt-pagination" aria-label={t("toursPage.title")}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-current={n === page ? "page" : undefined}
                    onClick={() => {
                      setPage(n);
                      document.getElementById("catalog-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                  >
                    {n}
                  </button>
                ))}
              </nav>
            )}

            <aside className="gt-help-band" aria-labelledby="catalog-help-title">
              <span className="gt-icon-badge"><RouteIcon size={22} /></span>
              <div>
                <h2 id="catalog-help-title">{t("homepage.customTitle")}</h2>
                <p>{t("homepage.customText")}</p>
              </div>
              <div className="gt-help-actions">
                <Link href={getLocalizedHref("/#plan", lang)} className="gt-btn gt-btn--gold" prefetch={false}>
                  {t("homepage.customCta")}
                  <ArrowRightIcon size={17} />
                </Link>
                <a href={whatsappHref(t("site.generalWa"))} target="_blank" rel="noopener noreferrer" className="gt-btn gt-btn--ghost-light">
                  <WhatsAppIcon size={18} />
                  WhatsApp
                </a>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <Footer contactBar primaryHref="/#plan" primaryLabel={t("site.planShort")} />
    </>
  );
}
