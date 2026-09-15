"use client";

import { useId, useState } from "react";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { whatsappHref } from "../../lib/shared";
import { trackEvent } from "../../lib/analytics";
import { WhatsAppIcon } from "../Icons";

const STYLES = ["styleTour", "styleMulti", "styleTransfer", "styleVip"];
const STARTS = ["startBatumi", "startKutaisi", "startTbilisi", "startOther"];
const INTERESTS = ["intMountains", "intNature", "intWine", "intCulture", "intSea", "intSnow"];

// Composes a structured WhatsApp message; no data is stored or sent anywhere
// else, so this adds no new backend surface.
export default function TripPlannerForm() {
  const { t } = useLanguage();
  const id = useId();
  const [style, setStyle] = useState("styleTour");
  const [start, setStart] = useState("startBatumi");
  const [travelers, setTravelers] = useState("2");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [interests, setInterests] = useState([]);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  const toggleInterest = (key) =>
    setInterests((current) => (current.includes(key) ? current.filter((k) => k !== key) : [...current, key]));

  const onSubmit = (event) => {
    event.preventDefault();
    const lines = [
      t("planner.msgIntro"),
      "",
      `${t("planner.msgStyle")}: ${t(`planner.${style}`)}`,
      `${t("planner.msgStart")}: ${t(`planner.${start}`)}`,
    ];
    if (dateFrom || dateTo) lines.push(`${t("planner.msgDates")}: ${dateFrom || "…"} — ${dateTo || "…"}`);
    lines.push(`${t("planner.msgTravelers")}: ${travelers || "…"}`);
    if (interests.length) lines.push(`${t("planner.msgInterests")}: ${interests.map((k) => t(`planner.${k}`)).join(", ")}`);
    if (name.trim()) lines.push(`${t("planner.msgName")}: ${name.trim()}`);
    if (notes.trim()) lines.push(`${t("planner.msgNotes")}: ${notes.trim()}`);

    trackEvent("plan_trip_request", { style, start, travelers, interests: interests.join(",") });
    window.open(whatsappHref(lines.join("\n")), "_blank", "noopener,noreferrer");
  };

  return (
    <form className="gt-planner" onSubmit={onSubmit} aria-labelledby={`${id}-title`}>
      <h3 id={`${id}-title`} className="gt-planner-title">{t("planner.title")}</h3>

      <fieldset className="gt-field">
        <legend>{t("planner.style")}</legend>
        <div className="gt-segment">
          {STYLES.map((key) => (
            <label key={key} className={`gt-segment-opt${style === key ? " is-active" : ""}`}>
              <input type="radio" name={`${id}-style`} value={key} checked={style === key} onChange={() => setStyle(key)} />
              <span>{t(`planner.${key}`)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="gt-field-row">
        <div className="gt-field">
          <label htmlFor={`${id}-start`}>{t("planner.start")}</label>
          <select id={`${id}-start`} value={start} onChange={(e) => setStart(e.target.value)}>
            {STARTS.map((key) => (
              <option key={key} value={key}>{t(`planner.${key}`)}</option>
            ))}
          </select>
        </div>
        <div className="gt-field">
          <label htmlFor={`${id}-travelers`}>{t("planner.travelers")}</label>
          <input
            id={`${id}-travelers`}
            type="number"
            inputMode="numeric"
            min={1}
            max={60}
            value={travelers}
            onChange={(e) => setTravelers(e.target.value)}
          />
        </div>
      </div>

      <fieldset className="gt-field">
        <legend>{t("planner.dates")}</legend>
        <div className="gt-field-row">
          <label className="gt-field-inline">
            <span>{t("planner.dateFrom")}</span>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </label>
          <label className="gt-field-inline">
            <span>{t("planner.dateTo")}</span>
            <input type="date" value={dateTo} min={dateFrom || undefined} onChange={(e) => setDateTo(e.target.value)} />
          </label>
        </div>
      </fieldset>

      <fieldset className="gt-field">
        <legend>{t("planner.interests")}</legend>
        <div className="gt-check-chips">
          {INTERESTS.map((key) => {
            const on = interests.includes(key);
            return (
              <label key={key} className={`gt-check-chip${on ? " is-active" : ""}`}>
                <input type="checkbox" checked={on} onChange={() => toggleInterest(key)} />
                <span>{t(`planner.${key}`)}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="gt-field">
        <label htmlFor={`${id}-name`}>
          {t("planner.name")} <small>({t("planner.optional")})</small>
        </label>
        <input id={`${id}-name`} type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div className="gt-field">
        <label htmlFor={`${id}-notes`}>{t("planner.notes")}</label>
        <textarea
          id={`${id}-notes`}
          rows={3}
          placeholder={t("planner.notesPlaceholder")}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <button type="submit" className="gt-btn gt-btn--wa gt-btn--lg gt-btn--block">
        <WhatsAppIcon size={20} />
        {t("planner.submit")}
      </button>
      <p className="gt-planner-note">{t("planner.note")}</p>
    </form>
  );
}
