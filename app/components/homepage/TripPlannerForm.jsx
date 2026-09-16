"use client";

import { useId, useRef, useState } from "react";
import DatePicker from "../DatePicker";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { interpolate } from "../../lib/i18n/translateCore";
import { whatsappHref } from "../../lib/shared";
import { trackEvent } from "../../lib/analytics";
import { ArrowRightIcon, BriefcaseIcon, CalendarIcon, CarIcon, CheckIcon, PlaneIcon, RouteIcon, WhatsAppIcon } from "../Icons";

const STYLES = [
  { key: "styleTour", icon: RouteIcon },
  { key: "styleMulti", icon: CalendarIcon },
  { key: "styleTransfer", icon: PlaneIcon },
  { key: "styleVip", icon: BriefcaseIcon },
];
const STARTS = ["startBatumi", "startKutaisi", "startTbilisi", "startOther"];
const INTERESTS = ["intMountains", "intNature", "intWine", "intCulture", "intSea", "intSnow"];
const TOTAL_STEPS = 3;

// Three short steps instead of one long form: what kind of trip, when and how
// many, then interests and a name. The result is a structured WhatsApp
// message — nothing is stored or sent anywhere else.
export default function TripPlannerForm() {
  const { t } = useLanguage();
  const id = useId();
  const cardRef = useRef(null);
  const [step, setStep] = useState(1);
  const [style, setStyle] = useState("styleTour");
  const [start, setStart] = useState("startBatumi");
  const [travelers, setTravelers] = useState(2);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [interests, setInterests] = useState([]);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");

  const goTo = (next) => {
    setStep(next);
    requestAnimationFrame(() => cardRef.current?.querySelector("[data-step-focus]")?.focus({ preventScroll: true }));
  };

  const toggleInterest = (key) =>
    setInterests((current) => (current.includes(key) ? current.filter((k) => k !== key) : [...current, key]));

  const onSubmit = (event) => {
    event.preventDefault();
    if (step < TOTAL_STEPS) {
      goTo(step + 1);
      return;
    }
    const lines = [
      t("planner.msgIntro"),
      "",
      `${t("planner.msgStyle")}: ${t(`planner.${style}`)}`,
      `${t("planner.msgStart")}: ${t(`planner.${start}`)}`,
    ];
    if (dateFrom || dateTo) lines.push(`${t("planner.msgDates")}: ${dateFrom || "…"} — ${dateTo || "…"}`);
    lines.push(`${t("planner.msgTravelers")}: ${travelers}`);
    if (interests.length) lines.push(`${t("planner.msgInterests")}: ${interests.map((k) => t(`planner.${k}`)).join(", ")}`);
    if (name.trim()) lines.push(`${t("planner.msgName")}: ${name.trim()}`);
    if (notes.trim()) lines.push(`${t("planner.msgNotes")}: ${notes.trim()}`);

    trackEvent("plan_trip_request", { style, start, travelers, interests: interests.join(",") }).catch?.(() => {});
    window.open(whatsappHref(lines.join("\n")), "_blank", "noopener,noreferrer");
  };

  const stepTitles = [t("planner.step1Title"), t("planner.step2Title"), t("planner.step3Title")];

  return (
    <form ref={cardRef} className="gt-wizard" onSubmit={onSubmit} aria-labelledby={`${id}-title`}>
      <div className="gt-wizard-head">
        <p className="gt-wizard-count" aria-live="polite">{interpolate(t("planner.stepOf"), { n: step, total: TOTAL_STEPS })}</p>
        <div className="gt-wizard-progress" aria-hidden="true">
          {[1, 2, 3].map((n) => (
            <span key={n} className={n <= step ? "is-done" : ""} />
          ))}
        </div>
        <h3 id={`${id}-title`} className="gt-wizard-title" tabIndex={-1} data-step-focus>
          {stepTitles[step - 1]}
        </h3>
      </div>

      <div className="gt-wizard-body" key={step}>
        {step === 1 && (
          <>
            <fieldset className="gt-field">
              <legend className="gt-sr-only">{t("planner.style")}</legend>
              <div className="gt-choice-cards">
                {STYLES.map(({ key, icon: Icon }) => (
                  <label key={key} className={`gt-choice-card${style === key ? " is-active" : ""}`}>
                    <input type="radio" name={`${id}-style`} value={key} checked={style === key} onChange={() => setStyle(key)} />
                    <span className="gt-choice-card-icon"><Icon size={20} /></span>
                    <span className="gt-choice-card-text">
                      <strong>{t(`planner.${key}`)}</strong>
                      <small>{t(`planner.${key}Desc`)}</small>
                    </span>
                    <span className="gt-choice-card-check" aria-hidden="true"><CheckIcon size={14} /></span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="gt-field">
              <label htmlFor={`${id}-start`}>{t("planner.start")}</label>
              <select id={`${id}-start`} value={start} onChange={(e) => setStart(e.target.value)}>
                {STARTS.map((key) => (
                  <option key={key} value={key}>{t(`planner.${key}`)}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="gt-field-row">
              <div className="gt-field">
                <label htmlFor={`${id}-from`}>{t("planner.dateFrom")}</label>
                <DatePicker id={`${id}-from`} value={dateFrom} onChange={setDateFrom} placeholder={t("datePicker.selectDate")} />
              </div>
              <div className="gt-field">
                <label htmlFor={`${id}-to`}>{t("planner.dateTo")}</label>
                <DatePicker id={`${id}-to`} value={dateTo} onChange={setDateTo} placeholder={t("datePicker.selectDate")} />
              </div>
            </div>
            <div className="gt-field">
              <span className="gt-field-label" id={`${id}-travelers-label`}>{t("planner.travelers")}</span>
              <div className="gt-stepper" role="group" aria-labelledby={`${id}-travelers-label`}>
                <button type="button" onClick={() => setTravelers((n) => Math.max(1, n - 1))} disabled={travelers <= 1} aria-label={t("planner.fewer")}>−</button>
                <output aria-live="polite">{travelers}</output>
                <button type="button" onClick={() => setTravelers((n) => Math.min(60, n + 1))} aria-label={t("planner.more")}>+</button>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
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
                {t("planner.name")} <small>{t("planner.optional")}</small>
              </label>
              <input id={`${id}-name`} type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="gt-field">
              <label htmlFor={`${id}-notes`}>{t("planner.notes")}</label>
              <textarea id={`${id}-notes`} rows={3} placeholder={t("planner.notesPlaceholder")} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </>
        )}
      </div>

      <div className="gt-wizard-actions">
        {step > 1 && (
          <button type="button" className="gt-btn gt-btn--outline" onClick={() => goTo(step - 1)}>
            {t("planner.back")}
          </button>
        )}
        {step < TOTAL_STEPS ? (
          <button type="submit" className="gt-btn gt-btn--navy gt-wizard-next">
            {t("planner.next")}
            <ArrowRightIcon size={17} />
          </button>
        ) : (
          <button type="submit" className="gt-btn gt-btn--wa gt-wizard-next">
            <WhatsAppIcon size={19} />
            {t("planner.submit")}
          </button>
        )}
      </div>
      <p className="gt-planner-note">
        <CarIcon size={15} />
        {t("planner.note")}
      </p>
    </form>
  );
}
