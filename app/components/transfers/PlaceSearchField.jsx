"use client";

import React, { useState, useMemo, useEffect } from "react";
import { CheckIcon, SearchIcon } from "../Icons";
import { TRANSFER_LOCATIONS, LOCATION_BY_ID } from "../../lib/transfers/routeCalculator";

const AIRPORT_IDS = TRANSFER_LOCATIONS.filter((l) => l.category === "airport").map((l) => l.id);
const DESTINATION_IDS = TRANSFER_LOCATIONS.filter((l) => l.category !== "airport").map((l) => l.id);

// Icon per place type returned by /api/transfers/places.
const PLACE_TYPE_ICONS = {
  hotel: "🏨",
  airport: "✈️",
  station: "🚉",
  church: "⛪",
  sight: "🏛️",
  nature: "⛰️",
  food: "🍽️",
  shop: "🛍️",
  city: "🏙️",
  region: "🗺️",
  village: "🏡",
  street: "🛣️",
  address: "🏠",
  place: "📍",
};

// Only the types worth naming get a small tag next to the result.
const PLACE_TYPE_LABELS = {
  ka: { hotel: "სასტუმრო", airport: "აეროპორტი", station: "სადგური", church: "ტაძარი", sight: "ღირსშესანიშნაობა", nature: "ბუნება", food: "რესტორანი", city: "ქალაქი", village: "სოფელი" },
  en: { hotel: "Hotel", airport: "Airport", station: "Station", church: "Church", sight: "Sight", nature: "Nature", food: "Restaurant", city: "City", village: "Village" },
  ru: { hotel: "Отель", airport: "Аэропорт", station: "Вокзал", church: "Храм", sight: "Достопримечательность", nature: "Природа", food: "Ресторан", city: "Город", village: "Село" },
  tr: { hotel: "Otel", airport: "Havalimanı", station: "İstasyon", church: "Kilise", sight: "Turistik yer", nature: "Doğa", food: "Restoran", city: "Şehir", village: "Köy" },
  ar: { hotel: "فندق", airport: "مطار", station: "محطة", church: "كنيسة", sight: "معلم سياحي", nature: "طبيعة", food: "مطعم", city: "مدينة", village: "قرية" },
};

export const placeTypeIcon = (type) => PLACE_TYPE_ICONS[type] || PLACE_TYPE_ICONS.place;

// "Sarpi, Khelvachauri Municipality" — the region part is dropped as noise.
export const shortDetail = (p) => (p.detail ? p.detail.split(", ")[0] : "");
export const placeLabel = (p) => (shortDetail(p) ? `${p.name}, ${shortDetail(p)}` : p.name);

function matchKnownLocations(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return TRANSFER_LOCATIONS.filter((l) => Object.values(l.names).some((n) => n.toLowerCase().includes(q)));
}

function exactKnownLocation(query) {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  return TRANSFER_LOCATIONS.find((l) => Object.values(l.names).some((n) => n.toLowerCase() === q)) || null;
}

/**
 * State for one route field: a known location, any place in Georgia from the
 * map, or null while the visitor is typing.
 * value: { kind: "known", id } | { kind: "place", name, detail, type, lat, lng } | null
 */
export function usePlaceField({ initial, mapPointId, lang, getLocationLabel, isOpen, setOpen, inputRef }) {
  const [value, setValue] = useState(initial);
  const [text, setText] = useState("");
  const [error, setError] = useState(false);
  const [mapSearch, setMapSearch] = useState({ query: "", items: [] });

  // Keep the input text in the visitor's language for picked known places.
  useEffect(() => {
    if (value?.kind === "known") setText(getLocationLabel(LOCATION_BY_ID[value.id]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const typedQuery = value ? "" : text.trim();
  const knownMatches = useMemo(() => matchKnownLocations(typedQuery), [typedQuery]);

  useEffect(() => {
    if (typedQuery.length < 2) {
      setMapSearch({ query: "", items: [] });
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/transfers/places?q=${encodeURIComponent(typedQuery)}&lang=${lang}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((data) => setMapSearch({ query: typedQuery, items: data.results || [] }))
        .catch((err) => {
          if (err.name !== "AbortError") setMapSearch({ query: typedQuery, items: [] });
        });
    }, 350);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [typedQuery, lang]);

  const mapItems = mapSearch.query === typedQuery ? mapSearch.items : [];
  const searching = typedQuery.length >= 2 && mapSearch.query !== typedQuery;

  const selectKnown = (id) => {
    setValue({ kind: "known", id });
    setText(getLocationLabel(LOCATION_BY_ID[id]));
    setError(false);
    setOpen(false);
  };

  const selectPlace = (place) => {
    setValue({ kind: "place", name: place.name, detail: place.detail, type: place.type, lat: place.lat, lng: place.lng });
    setText(placeLabel(place));
    setError(false);
    setOpen(false);
  };

  // Used by the swap button: takes the other field's value as-is.
  const assign = (next) => {
    setValue(next);
    setText(!next ? "" : next.kind === "known" ? getLocationLabel(LOCATION_BY_ID[next.id]) : placeLabel(next));
    setError(false);
  };

  // Leaving the field with typed text picks the best match automatically.
  useEffect(() => {
    if (isOpen || value || !typedQuery) return;
    if (knownMatches.length) {
      selectKnown(knownMatches[0].id);
    } else if (mapItems.length) {
      selectPlace(mapItems[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, value, typedQuery, knownMatches, mapItems]);

  const onChange = (next) => {
    setText(next);
    setError(false);
    setOpen(true);
    const exact = exactKnownLocation(next);
    setValue(exact ? { kind: "known", id: exact.id } : null);
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (value) {
      setOpen(false);
    } else if (knownMatches.length) {
      selectKnown(knownMatches[0].id);
    } else if (mapItems.length) {
      selectPlace(mapItems[0]);
    }
  };

  const clear = () => {
    setValue(null);
    setText("");
    setOpen(true);
    inputRef.current?.focus();
  };

  // Route point for distance/price: known places carry their own id & coords;
  // map places get a per-field id so two of them never count as "same area".
  const point =
    value?.kind === "known" ? LOCATION_BY_ID[value.id] : value ? { id: mapPointId, lat: value.lat, lng: value.lng } : null;
  const label = value?.kind === "known" ? getLocationLabel(LOCATION_BY_ID[value.id]) : value ? placeLabel(value) : "";
  const name = value?.kind === "place" ? value.name : label;
  const detail = value?.kind === "place" ? shortDetail(value) : "";

  return {
    value, text, error, setError, typedQuery, knownMatches, mapItems, searching,
    selectKnown, selectPlace, assign, onChange, onKeyDown, clear,
    point, label, name, detail,
  };
}

export default function PlaceSearchField({
  field,
  id,
  label,
  placeholder,
  dot,
  fieldRef,
  inputRef,
  isOpen,
  setOpen,
  ui,
  lang,
  getLocationLabel,
}) {
  const typeLabels = PLACE_TYPE_LABELS[lang] || PLACE_TYPE_LABELS.ka;
  const { value, typedQuery, knownMatches, mapItems } = field;

  return (
    <div
      ref={fieldRef}
      className={`tf-field${isOpen ? " is-open" : ""}${field.error ? " has-error" : ""}`}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <span className={`tf-field-dot tf-field-dot--${dot}`} aria-hidden="true" />
      <div className="tf-field-main">
        <label className="tf-field-label" htmlFor={id}>
          {label}
        </label>
        <div className="tf-field-input-wrap">
          {value ? (
            <span className="tf-field-type-icon" aria-hidden="true">
              {value.kind === "known" ? LOCATION_BY_ID[value.id].icon : placeTypeIcon(value.type)}
            </span>
          ) : (
            <SearchIcon size={16} className="tf-field-search-icon" />
          )}
          <input
            id={id}
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-autocomplete="list"
            autoComplete="off"
            value={field.text}
            onFocus={(e) => {
              setOpen(true);
              e.target.select();
            }}
            onChange={(e) => field.onChange(e.target.value)}
            onKeyDown={field.onKeyDown}
            placeholder={placeholder}
            className="tf-field-input"
          />
          {field.text && (
            <button type="button" className="tf-field-clear" onClick={field.clear} aria-label={ui.clear}>
              ×
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        // preventDefault keeps focus in the input, so picking an option never blurs it first.
        <div className="tf-dd" role="listbox" aria-label={label} onMouseDown={(e) => e.preventDefault()}>
          {!typedQuery ? (
            <>
              <p className="tf-dd-hint">🗺️ {ui.anyPlaceHint}</p>
              {[
                { title: ui.airportsTab, ids: AIRPORT_IDS },
                { title: ui.popularTab, ids: DESTINATION_IDS },
              ].map((group) => (
                <div key={group.title} className="tf-dd-group">
                  <span className="tf-dd-title">{group.title}</span>
                  <div className="tf-dd-options">
                    {group.ids.map((locId) => {
                      const loc = LOCATION_BY_ID[locId];
                      const active = value?.kind === "known" && value.id === locId;
                      return (
                        <button
                          key={locId}
                          type="button"
                          role="option"
                          aria-selected={active}
                          className={`tf-dd-option${active ? " is-active" : ""}`}
                          onClick={() => field.selectKnown(locId)}
                        >
                          <span className="tf-dd-option-icon" aria-hidden="true">{loc.icon}</span>
                          <span className="tf-dd-option-name">{getLocationLabel(loc)}</span>
                          {active && <CheckIcon size={14} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              {knownMatches.length > 0 && (
                <div className="tf-dd-group">
                  <span className="tf-dd-title">{ui.popularTab}</span>
                  <div className="tf-dd-options">
                    {knownMatches.map((loc) => (
                      <button
                        key={loc.id}
                        type="button"
                        role="option"
                        aria-selected={false}
                        className="tf-dd-option"
                        onClick={() => field.selectKnown(loc.id)}
                      >
                        <span className="tf-dd-option-icon" aria-hidden="true">{loc.icon}</span>
                        <span className="tf-dd-option-name">{getLocationLabel(loc)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="tf-dd-group">
                <span className="tf-dd-title">{ui.mapResults}</span>
                {mapItems.length > 0 ? (
                  <div className="tf-dd-list">
                    {mapItems.map((place) => (
                      <button
                        key={place.id}
                        type="button"
                        role="option"
                        aria-selected={false}
                        className="tf-dd-place"
                        onClick={() => field.selectPlace(place)}
                      >
                        <span className="tf-dd-place-pin" data-type={place.type || "place"} aria-hidden="true">
                          {placeTypeIcon(place.type)}
                        </span>
                        <span className="tf-dd-place-text">
                          <span className="tf-dd-place-name">{place.name}</span>
                          {(typeLabels[place.type] || place.detail) && (
                            <span className="tf-dd-place-detail">
                              {typeLabels[place.type] && (
                                <span className="tf-dd-place-tag" data-type={place.type}>{typeLabels[place.type]}</span>
                              )}
                              {place.detail}
                            </span>
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : field.searching ? (
                  <div className="tf-dd-searching" role="status">
                    <div className="tf-dd-searching-head">
                      <span className="tf-mini-radar" aria-hidden="true"><span /></span>
                      {ui.searching}
                    </div>
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="tf-skel-row" aria-hidden="true">
                        <span className="tf-skel tf-skel--pin" />
                        <span className="tf-skel-lines">
                          <span className="tf-skel" />
                          <span className="tf-skel tf-skel--short" />
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="tf-dd-status">{typedQuery.length < 2 ? ui.anyPlaceHint : ui.noResults}</p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
