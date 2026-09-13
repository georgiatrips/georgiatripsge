"use client";

import React from "react";
import { useLanguage } from "../../lib/i18n/LanguageContext";

export default function HomeFaqSection({ faqs = [], openFaq = 0, setOpenFaq }) {
  const { t } = useLanguage();

  return (
    <section className="section" id="faq">
      <div className="section-inner">
        <div className="section-header">
          <span className="section-eyebrow">{t("popular.faqEyebrow")}</span>
          <h2 className="section-title">{t("popular.faqTitle")}</h2>
          <p className="section-desc">{t("popular.faqDesc")}</p>
          <div className="gold-line"></div>
        </div>
        <div className="faq-list">
          {faqs.map((faq, idx) => (
            <div key={idx} className={`faq-item ${openFaq === idx ? "open" : ""}`}>
              <button
                className="faq-question"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                aria-expanded={openFaq === idx}
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
