"use client";

import React from "react";
import { useLanguage } from "../../lib/i18n/LanguageContext";

export default function TourDetailFaq({
  tourFaqs = [],
  openFaqIndex = 0,
  setOpenFaqIndex,
}) {
  const { t } = useLanguage();

  if (!tourFaqs || tourFaqs.length === 0) return null;

  return (
    <section className="section" id="faq" style={{ borderTop: "1px solid #e2e8f0", background: "#ffffff" }}>
      <div className="section-inner">
        <div className="section-header">
          <span className="section-eyebrow">{t("faq.eyebrow")}</span>
          <h2 className="section-title">{t("faq.title")}</h2>
          <p className="section-desc">{t("faq.desc")}</p>
          <div className="gold-line"></div>
        </div>
        <div className="faq-list">
          {tourFaqs.map((faq, idx) => (
            <div key={idx} className={`faq-item ${openFaqIndex === idx ? "open" : ""}`}>
              <button
                type="button"
                className="faq-question"
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                aria-expanded={openFaqIndex === idx}
                aria-controls={`faq-answer-${idx}`}
              >
                <span>{faq.q}</span>
                <svg className="faq-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <div className="faq-answer" id={`faq-answer-${idx}`}>
                <div className="faq-answer-inner">
                  <p>{faq.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
