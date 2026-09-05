"use client";

import React, { useMemo } from "react";
import { useLanguage } from "../../lib/i18n/LanguageContext";

export default function HomeCategoriesSection() {
  const { t } = useLanguage();

  const categoriesList = useMemo(() => [
    {
      title: t("home.cat1Title"),
      desc: t("home.cat1Desc"),
      link: "#popular",
    },
    {
      title: t("home.cat2Title"),
      desc: t("home.cat2Desc"),
      link: "#hotels",
    },
    {
      title: t("home.cat3Title"),
      desc: t("home.cat3Desc"),
      link: "#booking",
    },
    {
      title: t("home.cat4Title"),
      desc: t("home.cat4Desc"),
      link: "#booking",
    },
  ], [t]);

  return (
    <section className="section" id="categories">
      <div className="section-inner">
        <div className="section-header">
          <span className="section-eyebrow">{t("categories.eyebrow")}</span>
          <h2 className="section-title">{t("categories.title")}</h2>
          <div className="gold-line"></div>
        </div>
        <div className="categories-grid">
          {categoriesList.map((cat, idx) => (
            <div
              key={idx}
              className="category-card"
              onClick={() => document.querySelector(cat.link)?.scrollIntoView({ behavior: "smooth" })}
            >
              <span className="cat-num" aria-hidden="true">0{idx + 1}</span>
              <h3 className="category-title">{cat.title}</h3>
              <p className="category-desc">{cat.desc}</p>
              <div className="cat-arrow" aria-hidden="true">→</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
