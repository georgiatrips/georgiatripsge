"use client";

import React from "react";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { MAP_PATHS } from "../../mapPaths";

export default function HomeMapSection({ activeMapRegion, setActiveMapRegion }) {
  const { t } = useLanguage();

  return (
    <section className="section map-section" id="map">
      <div className="section-inner">
        <div className="section-header">
          <span className="section-eyebrow">{t("popular.mapEyebrow")}</span>
          <h2 className="section-title">{t("popular.mapTitle")}</h2>
          <p className="section-desc">{t("popular.mapDesc")}</p>
          <div className="gold-line"></div>
        </div>
        <div className="map-wrap">
          <div className="map-svg-wrap">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 820 430"
              className="georgia-map-svg"
            >
              {[
                { id: "GE-AB", name: "აფხაზეთი", desc: "მდინარე ენგურიდან შავ ზღვამდე", color: "#29b2b7" },
                { id: "GE-AJ", name: "აჭარა", desc: "ბათუმი, შავი ზღვა, მთები", color: "#fab418" },
                { id: "GE-GU", name: "გურია", desc: "მწვანე მიდამოები დასავლეთ საქართველოში", color: "#29b2b7" },
                { id: "GE-IM", name: "იმერეთი", desc: "ქუთაისი, ისტორიული ცენტრი", color: "#106da4" },
                { id: "GE-KA", name: "კახეთი", desc: "ქართული ღვინის სამეფო", color: "#fab418" },
                { id: "GE-KK", name: "ქვემო ქართლი", desc: "მრავალფეროვანი კულტურა", color: "#106da4" },
                { id: "GE-MM", name: "მცხეთა-მთიანეთი", desc: "ყაზბეგი, გერგეთი, ჯვარი", color: "#29b2b7" },
                { id: "GE-RL", name: "რაჭა-ლეჩხუმი", desc: "მთიანი სილამაზე", color: "#106da4" },
                { id: "GE-SJ", name: "სამცხე-ჯავახეთი", desc: "ვარძია, ბორჯომი", color: "#29b2b7" },
                { id: "GE-SK", name: "შიდა ქართლი", desc: "გორი, ქართული ვაკე", color: "#fab418" },
                { id: "GE-SZ", name: "სამეგრელო-ზემო სვანეთი", desc: "მესტია, სვანური კოშკები", color: "#106da4" },
                { id: "GE-TB", name: "თბილისი", desc: "საქართველოს დედაქალაქი", color: "#fab418" },
              ].map((region) => (
                <path
                  key={region.id}
                  id={region.id}
                  d={MAP_PATHS[region.id]}
                  className={`map-region${activeMapRegion === region.id ? " map-region-active" : ""}`}
                  style={{ "--region-color": region.color }}
                  onMouseEnter={() => setActiveMapRegion(region.id)}
                  onMouseLeave={() => setActiveMapRegion(null)}
                  onClick={() => setActiveMapRegion(activeMapRegion === region.id ? null : region.id)}
                />
              ))}
            </svg>
            {/* Region tooltip panel */}
            {activeMapRegion && (() => {
              const regObj = t(`map.regions.${activeMapRegion}`);
              const nameFromObj = typeof regObj === 'object' ? regObj?.name : null;
              const descFromObj = typeof regObj === 'object' ? regObj?.desc : null;
              const directTranslation = t(`mapRegions.${activeMapRegion}`);
              const regionName = nameFromObj || (typeof directTranslation === 'string' && directTranslation !== `mapRegions.${activeMapRegion}` ? directTranslation : activeMapRegion);
              const regionDesc = descFromObj || '';
              return regionName ? (
                <div className="map-tooltip">
                  <span className="map-tooltip-name">{regionName}</span>
                  {regionDesc && <span className="map-tooltip-desc">{regionDesc}</span>}
                </div>
              ) : null;
            })()}
          </div>
          {/* Region legend chips */}
          <div className="map-legend">
            {[
              "GE-AB", "GE-AJ", "GE-GU", "GE-IM", "GE-KA", "GE-KK",
              "GE-MM", "GE-RL", "GE-SJ", "GE-SK", "GE-SZ", "GE-TB"
            ].map((id) => {
              const regObj = t(`map.regions.${id}`);
              const nameFromObj = typeof regObj === 'object' ? regObj?.name : null;
              const directTranslation = t(`mapRegions.${id}`);
              const label = nameFromObj || (typeof directTranslation === 'string' && directTranslation !== `mapRegions.${id}` ? directTranslation : id);
              return (
                <button
                  key={id}
                  className={`map-chip${activeMapRegion === id ? " map-chip-active" : ""}`}
                  onMouseEnter={() => setActiveMapRegion(id)}
                  onMouseLeave={() => setActiveMapRegion(null)}
                  onClick={() => setActiveMapRegion(activeMapRegion === id ? null : id)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
