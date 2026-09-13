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
    <section className="tdp-faq-section" id="faq">
      <div className="container">
        <div className="tdp-faq-header">
          <span className="tdp-faq-eyebrow">{t("faq.eyebrow") || "ხშირი კითხვები"}</span>
          <h2 className="tdp-faq-title">{t("faq.title") || "პასუხები ხშირად დასმულ კითხვებზე"}</h2>
          <p className="tdp-faq-desc">{t("faq.desc") || "ყველაფერი, რაც მოგზაურობის დაგეგმვამდე უნდა იცოდეთ"}</p>
          <div className="tdp-faq-gold-line"></div>
        </div>

        <div className="tdp-faq-list">
          {tourFaqs.map((faq, idx) => (
            <div key={idx} className={`tdp-faq-item ${openFaqIndex === idx ? "open" : ""}`}>
              <button
                type="button"
                className="tdp-faq-question"
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                aria-expanded={openFaqIndex === idx}
                aria-controls={`faq-answer-${idx}`}
              >
                <span>{faq.q}</span>
                <svg className="tdp-faq-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <div className="tdp-faq-answer" id={`faq-answer-${idx}`}>
                <div className="tdp-faq-answer-inner">
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
