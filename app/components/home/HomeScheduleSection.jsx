"use client";

import React from "react";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { asLocalizedText, translateMonthName } from "../../lib/toursFirestore";

const truncateText = (value, maxLength = 100) => {
  const text = String(value || "").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}...` : text;
};

export default function HomeScheduleSection({
  scheduleTours = [],
  handleTourClick,
  handleBookNow,
}) {
  const { t, lang } = useLanguage();

  return (
    <section className="tour-schedule-section" id="schedule">
      <div className="section-inner">
        <div className="themed-section-header schedule-header">
          <span className="schedule-eyebrow">{t("popular.scheduleEyebrow")}</span>
          <h2 className="themed-section-title">{t("popular.scheduleTitle")}</h2>
          <p className="schedule-subdesc">
            {t("popular.scheduleDesc")}
          </p>
        </div>

        <div className="schedule-list-container">
          {scheduleTours.map((item) => (
            <article key={item.id} className="schedule-card-row">
              <h3 className="schedule-tour-title" onClick={() => handleTourClick(item)}>
                {asLocalizedText(item.title, lang)}
              </h3>
              <div className="schedule-tour-price">
                <strong>{item.priceGroup}</strong>, <span>{item.priceNote}</span>
              </div>
              <p className="schedule-tour-desc">{truncateText([item.locationShort, item.desc].filter(Boolean).join(". "))}</p>

              <div className="schedule-months-flex">
                {item.months.map((mGroup, mIdx) => (
                  <div key={mIdx} className="schedule-month-block">
                    <span className="schedule-month-pill">{translateMonthName(mGroup.monthName, lang)}</span>
                    <div className="schedule-days-grid">
                      {mGroup.dates.map((d, dIdx) => (
                        <button
                          key={dIdx}
                          className="schedule-day-chip"
                          onClick={() => handleBookNow(`${asLocalizedText(item.title, lang)} (${d})`, item.priceGroup)}
                          title={t("popular.scheduleBookTooltip").replace("{title}", asLocalizedText(item.title, lang)).replace("{date}", d)}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
