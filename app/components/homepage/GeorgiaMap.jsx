"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MAP_VIEWBOX, REGION_CENTERS, REGION_PATHS, projectLatLng } from "../../lib/georgiaMap";
import { MAP_LOCATIONS } from "../../lib/mapLocations";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { interpolate } from "../../lib/i18n/translate";
import { getLocalizedHref } from "../../lib/siteConfig";
import { asLocalizedText } from "../../lib/toursFirestore";
import { ArrowRightIcon, LocationIcon, WhatsAppIcon } from "../Icons";

// Regions drawn but not selectable (no trips are offered there).
const MUTED = new Set(["GE-AB"]);

// Interactive map of Georgia's regions. Hover previews a region, click or
// Enter selects it, and the panel shows tours, places and the next action.
// Every region is also reachable from the button list under the map, so the
// map is usable with a keyboard, a screen reader or a thumb.
export default function GeorgiaMap({ regions = [] }) {
  const { t, lang } = useLanguage();
  const byCode = useMemo(() => Object.fromEntries(regions.map((r) => [r.code, r])), [regions]);
  const firstWithTours = regions.find((r) => r.tourCount > 0)?.code || regions[0]?.code;

  const [active, setActive] = useState(firstWithTours);
  const [hover, setHover] = useState(null);
  const [pinFocus, setPinFocus] = useState(null);

  const shown = byCode[hover || active];

  const locations = useMemo(
    () =>
      MAP_LOCATIONS.map((loc) => {
        const [x, y] = projectLatLng(loc.lat, loc.lng);
        const label = loc.labelKey ? t(loc.labelKey) : asLocalizedText(loc.name, lang);
        return { ...loc, x, y, label };
      }),
    [t, lang]
  );

  const regionLocations = locations.filter((loc) => loc.region === shown?.code);

  const select = (code) => {
    if (!byCode[code]) return;
    setActive(code);
    setHover(null);
  };

  return (
    <div className="gt-mapx">
      <figure className="gt-map-figure" data-reveal="fade">
        <svg viewBox={MAP_VIEWBOX} className="gt-map-svg" role="group" aria-label={t("homepage.mapHint")}>
          <defs>
            <pattern id="gt-map-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="#e7edf3" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="#d3dde7" strokeWidth="2" />
            </pattern>
          </defs>

          <g className="gt-map-regions">
            {Object.entries(REGION_PATHS).map(([code, d], index) => {
              const info = byCode[code];
              if (MUTED.has(code) || !info) {
                return <path key={code} d={d} className="gt-map-region is-muted" style={{ "--gt-i": index }} aria-hidden="true" />;
              }
              const classes = [
                "gt-map-region",
                info.tourCount > 0 ? "has-tours" : "",
                active === code ? "is-active" : "",
                hover === code ? "is-hover" : "",
              ].filter(Boolean).join(" ");
              return (
                <path
                  key={code}
                  d={d}
                  className={classes}
                  style={{ "--gt-i": index }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={active === code}
                  aria-label={info.tourCount > 0 ? `${info.name}, ${interpolate(t("homepage.regionTours"), { count: info.tourCount })}` : info.name}
                  onMouseEnter={() => setHover(code)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => select(code)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      select(code);
                    }
                  }}
                />
              );
            })}
          </g>

          <g className="gt-map-badges" aria-hidden="true">
            {regions
              .filter((r) => r.tourCount > 0 && REGION_CENTERS[r.code]?.[0] != null)
              .map((r) => {
                const [cx, cy] = REGION_CENTERS[r.code];
                return (
                  <g key={r.code} className="gt-map-badge" transform={`translate(${cx} ${cy})`}>
                    <circle r="13" />
                    <text>{r.tourCount}</text>
                  </g>
                );
              })}
          </g>

          <g className="gt-map-pins">
            {locations.map((loc) => {
              const isOn = pinFocus === loc.id;
              return (
                <g
                  key={loc.id}
                  className={`gt-map-pin is-${loc.type}${isOn ? " is-on" : ""}`}
                  transform={`translate(${loc.x} ${loc.y})`}
                  role="button"
                  tabIndex={0}
                  aria-label={loc.label}
                  onMouseEnter={() => setPinFocus(loc.id)}
                  onMouseLeave={() => setPinFocus(null)}
                  onFocus={() => setPinFocus(loc.id)}
                  onBlur={() => setPinFocus(null)}
                  onClick={() => select(loc.region)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      select(loc.region);
                    }
                  }}
                >
                  <circle className="gt-map-pin-pulse" r="12" />
                  <circle className="gt-map-pin-dot" r="5.5" />
                  {isOn && (
                    <g className="gt-map-pin-label" transform="translate(0 -16)">
                      <rect x={-(loc.label.length * 3.4 + 10)} y="-20" width={loc.label.length * 6.8 + 20} height="22" rx="11" />
                      <text y="-9">{loc.label}</text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        <figcaption className="gt-map-legend">
          <span><i className="gt-map-swatch is-tours" />{t("homepage.mapLegendTours")}</span>
          <span><i className="gt-map-swatch" />{t("homepage.mapLegendRequest")}</span>
          {locations.length > 0 && <span><i className="gt-map-swatch is-pin" />{t("homepage.mapLegendPlace")}</span>}
        </figcaption>
      </figure>

      {shown && (
        <aside className="gt-map-panel" aria-live="polite" data-reveal="right">
          <div key={shown.code} className="gt-map-panel-body">
          <p className="gt-map-panel-kicker">
            <LocationIcon size={15} />
            {shown.tourCount > 0 ? t("homepage.mapLegendTours") : t("homepage.mapLegendRequest")}
          </p>
          <h3 className="gt-map-panel-title">{shown.name}</h3>
          {shown.desc && <p className="gt-map-panel-desc">{shown.desc}</p>}

          {(shown.tourCount > 0 || shown.placeCount > 0) && (
            <ul className="gt-map-stats">
              {shown.tourCount > 0 && <li>{interpolate(t("homepage.regionTours"), { count: shown.tourCount })}</li>}
              {shown.placeCount > 0 && <li>{interpolate(t("homepage.regionPlaces"), { count: shown.placeCount })}</li>}
            </ul>
          )}

          {regionLocations.length > 0 && (
            <div className="gt-map-locations">
              <p>{t("homepage.mapLocations")}</p>
              <ul>
                {regionLocations.map((loc) => (
                  <li key={loc.id}>
                    {loc.href ? (
                      <Link href={getLocalizedHref(loc.href, lang)} prefetch={false}>{loc.label}</Link>
                    ) : (
                      <span>{loc.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {shown.tourCount > 0 ? (
            <Link href={shown.href} className="gt-btn gt-btn--gold gt-btn--block">
              {t("homepage.destViewTours")}
              <ArrowRightIcon size={17} />
            </Link>
          ) : (
            <a href={shown.href} target="_blank" rel="noopener noreferrer" className="gt-btn gt-btn--wa gt-btn--block">
              <WhatsAppIcon size={18} />
              {t("homepage.destAsk")}
            </a>
          )}
          </div>
        </aside>
      )}

      <div className="gt-map-list">
        <p className="gt-map-list-label">{t("homepage.mapRegionsList")}</p>
        <ul>
          {regions.map((r) => (
            <li key={r.code}>
              <button
                type="button"
                className={`gt-map-chip${active === r.code ? " is-active" : ""}${r.tourCount > 0 ? " has-tours" : ""}`}
                aria-pressed={active === r.code}
                onClick={() => select(r.code)}
                onMouseEnter={() => setHover(r.code)}
                onMouseLeave={() => setHover(null)}
              >
                {r.name}
                {r.tourCount > 0 && <span>{r.tourCount}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
