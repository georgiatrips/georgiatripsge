"use client";

import React from "react";
import { useLanguage } from "../../lib/i18n/LanguageContext";

const ICONS = {
  sun: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fab418" strokeWidth="2" strokeLinecap="round" className="weather-svg-sun" aria-hidden="true"><circle cx="12" cy="12" r="5" fill="#fab418" fillOpacity="0.1" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>,
  "cloud-sun": <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5" stroke="#fab418" /><path d="M5.5 8.5 4 7M12.5 8.5 14 7M9 3v2" stroke="#fab418" /><path d="M20 17.5A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" fill="var(--blue)" fillOpacity="0.1" stroke="var(--blue)" /></svg>,
  rain: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" fill="var(--blue)" fillOpacity="0.1" /><path d="m8 18-1 3m6-3-1 3m6-3-1 3" /></svg>,
  storm: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" fill="var(--text-mute)" fillOpacity="0.1" stroke="var(--text-mute)" /><path d="m13 12-4 5h3l-2 5 5-7h-3z" fill="#fab418" stroke="#fab418" /></svg>,
};

export default function HomeWeatherSection({
  weatherData = {},
  isLiveWeather = false,
  weatherLoading = false,
  activeWeatherTab = "tbilisi",
  setActiveWeatherTab,
}) {
  const { t } = useLanguage();

  return (
    <section className="section weather-section" id="weather">
      <div className="section-inner">
        <div className="section-header">
          <span className="section-eyebrow">{t("popular.weatherEyebrow")}</span>
          <h2 className="section-title">{t("popular.weatherTitle")}</h2>
          <p className="section-desc">{t("popular.weatherDesc")}</p>
          <div className="gold-line"></div>
          <div className={`weather-live-badge ${isLiveWeather ? "on" : ""}`}>
            <span className="weather-live-dot" aria-hidden="true"></span>
            {weatherLoading
              ? t("popular.weatherLoading")
              : isLiveWeather
                ? t("popular.weatherLive")
                : t("popular.weatherApprox")}
          </div>
        </div>

        <div className="weather-wrap">
          {/* Location selector tabs */}
          <div className="weather-tabs">
            {Object.keys(weatherData).map((key) => {
              const cityTranslation = t(`weather.cities.${key}`);
              const cityName = typeof cityTranslation === 'string' && cityTranslation !== `weather.cities.${key}`
                ? cityTranslation
                : weatherData[key].name;
              return (
                <button
                  key={key}
                  className={`weather-tab-btn ${activeWeatherTab === key ? "active" : ""}`}
                  onClick={() => setActiveWeatherTab(key)}
                >
                  {cityName}
                </button>
              );
            })}
          </div>

          {/* Weather Dashboard Card */}
          {(() => {
            const current = weatherData[activeWeatherTab];
            if (!current) return null;

            const cityTranslation = t(`weather.cities.${activeWeatherTab}`);
            const cityName = typeof cityTranslation === 'string' && cityTranslation !== `weather.cities.${activeWeatherTab}`
              ? cityTranslation
              : current.name;

            const condTranslation = t(`weather.conditions.${current.icon}`);
            const conditionLabel = typeof condTranslation === 'string' && condTranslation !== `weather.conditions.${current.icon}`
              ? condTranslation
              : current.condition;

            const descTranslation = t(`weather.descs.${activeWeatherTab}`);
            const descLabel = typeof descTranslation === 'string' && descTranslation !== `weather.descs.${activeWeatherTab}`
              ? descTranslation
              : current.desc;

            const uvNum = parseInt(current.uv, 10);
            let uvKey = 'medium';
            if (uvNum <= 2) uvKey = 'low';
            else if (uvNum <= 5) uvKey = 'medium';
            else if (uvNum <= 7) uvKey = 'high';
            else if (uvNum <= 10) uvKey = 'veryHigh';
            else uvKey = 'extreme';
            const uvTranslation = t(`weather.uv.${uvKey}`);
            const uvLabel = typeof uvTranslation === 'string' && uvTranslation !== `weather.uv.${uvKey}`
              ? `${uvNum} (${uvTranslation})`
              : current.uv;

            return (
              <div className="weather-dashboard">
                <div className="weather-main-card">
                  <div className="weather-main-header">
                    <div className="weather-main-icon">
                      {ICONS[current.icon]}
                    </div>
                    <div className="weather-main-temp-row">
                      <span className="weather-main-temp">{current.temp}</span>
                      <span className="weather-main-cond">{conditionLabel}</span>
                    </div>
                  </div>
                  <p className="weather-main-desc">{descLabel}</p>

                  <div className="weather-metrics">
                    <div className="weather-metric">
                      <span className="metric-label">{t("popular.humidity")}</span>
                      <span className="metric-val">{current.humidity}</span>
                    </div>
                    <div className="weather-metric">
                      <span className="metric-label">{t("popular.wind")}</span>
                      <span className="metric-val">
                        {typeof current.wind === 'string'
                          ? current.wind.replace("კმ/სთ", t("weather.units.kmh"))
                          : current.wind}
                      </span>
                    </div>
                    <div className="weather-metric">
                      <span className="metric-label">{t("popular.uvIndex")}</span>
                      <span className="metric-val">{uvLabel}</span>
                    </div>
                  </div>
                </div>

                <div className="weather-forecast-side">
                   <h4 className="forecast-title">{t("popular.forecastTitle")}</h4>
                  <div className="forecast-list">
                    {current.forecast.map((f, fIdx) => {
                      const dayKey = fIdx === 0 ? "d1" : fIdx === 1 ? "d2" : "d3";
                      const dayTranslation = t(`weather.days.${dayKey}`);
                      const dayLabel = typeof dayTranslation === 'string' && dayTranslation !== `weather.days.${dayKey}`
                        ? dayTranslation
                        : f.day;
                      return (
                        <div key={fIdx} className="forecast-row">
                          <span className="forecast-day">{dayLabel}</span>
                          <span className="forecast-icon">{ICONS[f.condition]}</span>
                          <span className="forecast-temp">{f.temp}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </section>
  );
}
