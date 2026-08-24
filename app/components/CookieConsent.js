"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "../lib/i18n/LanguageContext";

const COOKIE_CONSENT_KEY = "gt_cookie_consent";

const TEXTS = {
  ka: {
    title: "ჩვენ ვიყენებთ Cookie ფაილებს",
    desc: "საიტის საუკეთესო გამოცდილების, ანალიტიკისა და პერსონალიზაციის უზრუნველსაყოფად ჩვენ ვიყენებთ cookies. გაგრძელებით თქვენ ეთანხმებით ჩვენს ",
    privacy: "კონფიდენციალობის პოლიტიკას",
    accept: "ყველას მიღება",
    decline: "უარყოფა",
  },
  en: {
    title: "We use cookies",
    desc: "To provide the best user experience, analytics, and personalization, we use cookies. By continuing, you agree to our ",
    privacy: "Privacy Policy",
    accept: "Accept All",
    decline: "Decline",
  },
  ru: {
    title: "Мы используем файлы cookie",
    desc: "Для обеспечения наилучшего опыта, аналитики и персонализации мы используем cookie. Продолжая, вы соглашаетесь с нашей ",
    privacy: "Политикой конфиденциальности",
    accept: "Принять все",
    decline: "Отклонить",
  },
  tr: {
    title: "Çerezleri kullanıyoruz",
    desc: "En iyi kullanıcı deneyimini, analitiği ve kişiselleştirmeyi sağlamak için çerezler kullanıyoruz. Devam ederek ",
    privacy: "Gizlilik Politikamızı",
    accept: "Tümünü Kabul Et",
    decline: "Reddet",
  },
  ar: {
    title: "نحن نستخدم ملفات تعريف الارتباط (Cookies)",
    desc: "لضمان أفضل تجربة استخدام وتحليلات مخصصة، نستخدم ملفات تعريف الارتباط. بمتابعة التصفح فإنك توافق على ",
    privacy: "سياسة الخصوصية",
    accept: "قبول الكل",
    decline: "رفض",
  },
};

export default function CookieConsent() {
  const { lang } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!consent) {
        // Small delay for smooth entry
        const timer = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch (_) {}
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    } catch (_) {}
    setVisible(false);
  };

  const handleDecline = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    } catch (_) {}
    setVisible(false);
  };

  if (!visible) return null;

  const t = TEXTS[lang] || TEXTS.ka;

  return (
    <aside
      aria-label="Cookie Consent"
      style={{
        position: "fixed",
        bottom: "1.5rem",
        left: "1.5rem",
        right: "1.5rem",
        maxWidth: "460px",
        zIndex: 9999,
        background: "rgba(13, 35, 58, 0.96)",
        backdropFilter: "blur(12px)",
        color: "#ffffff",
        padding: "1.25rem 1.5rem",
        borderRadius: "18px",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.25)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        animation: "fadeUp 0.35s ease forwards",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "1.25rem" }}>🍪</span>
        <strong style={{ fontSize: "1rem", fontWeight: 700 }}>{t.title}</strong>
      </div>
      <p style={{ fontSize: "0.85rem", color: "rgba(255, 255, 255, 0.9)", lineHeight: 1.5, margin: "0 0 1rem 0" }}>
        {t.desc}
        <Link href="/privacy-policy" style={{ color: "#5eead4", textDecoration: "underline" }}>
          {t.privacy}
        </Link>.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
        <button
          onClick={handleDecline}
          style={{
            background: "transparent",
            color: "#ffffff",
            border: "1px solid rgba(255, 255, 255, 0.4)",
            padding: "0.5rem 1rem",
            borderRadius: "10px",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {t.decline}
        </button>
        <button
          onClick={handleAccept}
          style={{
            background: "#0d9488",
            color: "#ffffff",
            border: "none",
            padding: "0.5rem 1.25rem",
            borderRadius: "10px",
            fontSize: "0.85rem",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(13, 148, 136, 0.4)",
          }}
        >
          {t.accept}
        </button>
      </div>
    </aside>
  );
}
