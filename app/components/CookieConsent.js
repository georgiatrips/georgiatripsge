"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "../lib/i18n/LanguageContext";
import { getLocalizedHref } from "../lib/siteConfig";

const COOKIE_CONSENT_KEY = "gt_cookie_consent";

const TEXTS = {
  ka: {
    title: "ჩვენ ვიყენებთ Cookie ფაილებს",
    desc: "საიტის საუკეთესო გამოცდილების, ანალიტიკისა და პერსონალიზაციის უზრუნველსაყოფად ჩვენ ვიყენებთ cookies. დეტალები: ",
    privacy: "კონფიდენციალობის პოლიტიკა",
    accept: "ყველას მიღება",
    decline: "უარყოფა",
  },
  en: {
    title: "We use cookies",
    desc: "We use cookies for analytics and to improve your experience. Details: ",
    privacy: "Privacy Policy",
    accept: "Accept All",
    decline: "Decline",
  },
  ru: {
    title: "Мы используем файлы cookie",
    desc: "Мы используем cookie для аналитики и улучшения работы сайта. Подробнее: ",
    privacy: "Политика конфиденциальности",
    accept: "Принять все",
    decline: "Отклонить",
  },
  tr: {
    title: "Çerezleri kullanıyoruz",
    desc: "Analiz ve deneyiminizi iyileştirmek için çerezler kullanıyoruz. Ayrıntılar: ",
    privacy: "Gizlilik Politikası",
    accept: "Tümünü Kabul Et",
    decline: "Reddet",
  },
  ar: {
    title: "نحن نستخدم ملفات تعريف الارتباط (Cookies)",
    desc: "نستخدم ملفات تعريف الارتباط للتحليلات ولتحسين تجربتك. التفاصيل: ",
    privacy: "سياسة الخصوصية",
    accept: "قبول الكل",
    decline: "رفض",
  },
};

// Consent is only ever recorded from an explicit click. The previous mobile
// behaviour auto-accepted after 10 seconds, which is not consent.
export default function CookieConsent() {
  const { lang } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(COOKIE_CONSENT_KEY)) {
        const timer = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch (_) {}
    return undefined;
  }, []);

  const decide = (value) => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, value);
    } catch (_) {}
    setVisible(false);
    window.dispatchEvent(new CustomEvent("gt_cookie_dismissed"));
  };

  if (!visible) return null;

  const t = TEXTS[lang] || TEXTS.ka;

  return (
    <aside
      aria-label={t.title}
      style={{
        position: "fixed",
        bottom: "calc(1rem + var(--gt-mobile-bar-offset, 0px))",
        left: "1rem",
        right: "1rem",
        maxWidth: "440px",
        margin: "0 auto",
        zIndex: 9999,
        background: "#ffffff",
        color: "#1f2d3d",
        padding: "1rem 1.2rem",
        borderRadius: "14px",
        boxShadow: "0 18px 40px -18px rgba(31, 45, 61, 0.35)",
        border: "1px solid #e3e8ee",
        animation: "gt-fade-up 0.35s ease both",
      }}
    >
      <strong style={{ display: "block", fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.35rem" }}>{t.title}</strong>
      <p style={{ fontSize: "0.84rem", color: "#5f6c7b", lineHeight: 1.5, margin: "0 0 0.85rem 0" }}>
        {t.desc}
        <Link href={getLocalizedHref("/privacy-policy", lang)} style={{ color: "#2a6592", textDecoration: "underline" }}>
          {t.privacy}
        </Link>
      </p>
      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={() => decide("declined")}
          style={{
            background: "transparent",
            color: "#3e4c5b",
            border: "1px solid #cfd7e0",
            minHeight: "44px",
            padding: "0 1rem",
            borderRadius: "9px",
            fontSize: "0.86rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {t.decline}
        </button>
        <button
          type="button"
          onClick={() => decide("accepted")}
          style={{
            background: "#2a6592",
            color: "#ffffff",
            border: "none",
            minHeight: "44px",
            padding: "0 1.2rem",
            borderRadius: "9px",
            fontSize: "0.86rem",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {t.accept}
        </button>
      </div>
    </aside>
  );
}
