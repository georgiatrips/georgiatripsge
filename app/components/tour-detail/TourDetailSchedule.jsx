"use client";

import React from "react";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { asLocalizedText, translateMonthName } from "../../lib/toursFirestore";

export default function TourDetailSchedule({
  tour,
  tourSchedule = [],
  selectedDate,
  pickScheduleDate,
  scheduleDateToIso,
}) {
  const { t, lang } = useLanguage();

  if (tourSchedule.length === 0) {
    return (
      <article className="tdp-card-block tdp-schedule-block">
        <div className="tdp-card-header">
          <div>
            <h2>{t("tourDetail.scheduleTitle")}</h2>
          </div>
        </div>
        <div className="tdp-card-body">
          <div className="tdp-no-schedule-box">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <line x1="9" y1="15" x2="15" y2="19" />
              <line x1="15" y1="15" x2="9" y2="19" />
            </svg>
            <div>
              <strong>{t("tourDetail.noScheduleTitle")}</strong>
              <p>{t("tourDetail.noScheduleDesc")}</p>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="tdp-card-block tdp-schedule-block">
      <div className="tdp-card-header">
        <div>
          <h2>{t("tourDetail.scheduleTitle")}</h2>
          <p className="subtitle">{t("tourDetail.scheduleSubtitle")}</p>
        </div>
      </div>

      <div className="tdp-card-body">
        <div className="tdp-schedule-months">
          {tourSchedule.map((mGroup) => (
            <div key={mGroup.monthName} className="tdp-schedule-month">
              <span className="tdp-schedule-month-pill">{translateMonthName(mGroup.monthName, lang)}</span>
              <div className="tdp-schedule-days">
                {mGroup.dates.map((d) => {
                  const iso = scheduleDateToIso(d);
                  const isActive = iso && iso === selectedDate;
                  return (
                    <button
                      key={d}
                      type="button"
                      className={`tdp-schedule-chip${isActive ? " is-active" : ""}`}
                      onClick={() => pickScheduleDate(d)}
                      title={`${d} — ${asLocalizedText(tour.title, lang)}`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="tdp-schedule-legend">
          <span className="legend-item">
            <i className="legend-dot free" /> {t("tourDetail.freeDay")}
          </span>
          <span className="legend-item">
            <i className="legend-dot picked" /> {t("tourDetail.selectedDate")}
          </span>
          <span className="legend-note">{t("tourDetail.otherDatesNote")}</span>
        </div>
      </div>
    </article>
  );
}
