"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "../DatePicker";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { GEORGIA_REGIONS, formatRegionName } from "../../lib/placesMeta";
import { getLocalizedHref } from "../../lib/siteConfig";
import { trackEvent } from "../../lib/analytics";
import { ChevronDownIcon, LocationIcon, SearchIcon, UsersIcon } from "../Icons";

// Homepage search: region, date and format go straight to the catalog as
// query parameters. Every calendar day is selectable (private tours run on any
// day); group departures are marked so visitors see them before searching.
export default function HeroSearch({ regionCounts = {}, departures = [] }) {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [region, setRegion] = useState("all");
  const [date, setDate] = useState("");
  const [format, setFormat] = useState("all");

  const withTours = GEORGIA_REGIONS.filter((r) => regionCounts[r]);
  const extra = Object.keys(regionCounts).filter((r) => !GEORGIA_REGIONS.includes(r));
  const others = GEORGIA_REGIONS.filter((r) => !regionCounts[r]);

  const highlight = useMemo(
    () => [...new Set(departures.filter((d) => region === "all" || d.region === region).map((d) => d.date))].sort(),
    [departures, region]
  );

  const onSubmit = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (region !== "all") params.set("destination", region);
    if (date) params.set("date", date);
    if (format !== "all") params.set("format", format);
    const qs = params.toString();
    trackEvent("hero_search", { region, date, format }).catch?.(() => {});
    router.push(getLocalizedHref(`/tours${qs ? `?${qs}` : ""}`, lang));
  };

  return (
    <form className="gt-search" onSubmit={onSubmit} role="search" aria-label={t("homepage.searchTitle")}>
      <div className="gt-search-field">
        <label htmlFor="hs-region">{t("hero.destination")}</label>
        <div className="gt-search-control">
          <LocationIcon size={17} />
          <select id="hs-region" value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="all">{t("hero.allRegions")}</option>
            {[...withTours, ...extra].length > 0 && (
              <optgroup label={t("toursPage.regionsWithTours")}>
                {[...withTours, ...extra].map((r) => (
                  <option key={r} value={r}>{`${formatRegionName(r, lang)} (${regionCounts[r]})`}</option>
                ))}
              </optgroup>
            )}
            <optgroup label={t("toursPage.otherRegions")}>
              {others.map((r) => (
                <option key={r} value={r}>{formatRegionName(r, lang)}</option>
              ))}
            </optgroup>
          </select>
          <ChevronDownIcon size={14} className="gt-search-caret" />
        </div>
      </div>

      <div className="gt-search-field">
        <label htmlFor="hs-date">{t("hero.date")}</label>
        <DatePicker
          id="hs-date"
          variant="hero"
          value={date}
          onChange={setDate}
          placeholder={t("datePicker.selectDate")}
          highlightDates={highlight}
          highlightLabel={t("datePicker.groupDeparture")}
          anyDayLabel={t("datePicker.anyDay")}
        />
      </div>

      <div className="gt-search-field">
        <label htmlFor="hs-format">{t("hero.tourFormat")}</label>
        <div className="gt-search-control">
          <UsersIcon size={17} />
          <select id="hs-format" value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="all">{t("hero.allFormats")}</option>
            <option value="group">{t("hero.group")}</option>
            <option value="individual">{t("hero.individual")}</option>
          </select>
          <ChevronDownIcon size={14} className="gt-search-caret" />
        </div>
      </div>

      <button type="submit" className="gt-btn gt-btn--gold gt-btn--lg gt-search-submit">
        <SearchIcon size={18} strokeWidth={2.4} />
        <span>{t("homepage.searchTitle")}</span>
      </button>
    </form>
  );
}
