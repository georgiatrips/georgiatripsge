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
        const timer = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch (_) {}
  }, []);

  // On Mobile: Auto-dismiss cookie banner strictly after 10 seconds
  useEffect(() => {
    if (!visible) return;

    const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
    if (isMobile) {
      const autoDismissTimer = setTimeout(() => {
        handleAccept();
      }, 10000); // 10 seconds auto-dismiss on mobile

      return () => clearTimeout(autoDismissTimer);
    }
  }, [visible]);

  const notifyDismissed = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("gt_cookie_dismissed"));
    }
  };

  const handleAccept = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    } catch (_) {}
    setVisible(false);
    notifyDismissed();
  };

  const handleDecline = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    } catch (_) {}
    setVisible(false);
    notifyDismissed();
  };

  if (!visible) return null;

  const t = TEXTS[lang] || TEXTS.ka;

  return (
    <aside
      aria-label="Cookie Consent"
      style={{
        position: "fixed",
        bottom: "1rem",
        left: "1rem",
        right: "1rem",
        maxWidth: "440px",
        margin: "0 auto",
        zIndex: 9999,
        background: "rgba(13, 35, 58, 0.97)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        color: "#ffffff",
        padding: "1.1rem 1.35rem",
        borderRadius: "16px",
        boxShadow: "0 20px 45px rgba(0, 0, 0, 0.35)",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        animation: "fadeUp 0.35s ease forwards",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
        <span style={{ fontSize: "1.2rem" }}>🍪</span>
        <strong style={{ fontSize: "0.95rem", fontWeight: 700 }}>{t.title}</strong>
      </div>
      <p style={{ fontSize: "0.82rem", color: "rgba(255, 255, 255, 0.88)", lineHeight: 1.45, margin: "0 0 0.85rem 0" }}>
        {t.desc}
        <Link href="/privacy-policy" style={{ color: "#5eead4", textDecoration: "underline" }}>
          {t.privacy}
        </Link>.
      </p>
      <div style={{ display: "flex", gap: "0.65rem", justifyContent: "flex-end" }}>
        <button
          onClick={handleDecline}
          style={{
            background: "transparent",
            color: "#ffffff",
            border: "1px solid rgba(255, 255, 255, 0.35)",
            padding: "0.45rem 0.9rem",
            borderRadius: "8px",
            fontSize: "0.82rem",
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
            padding: "0.45rem 1.15rem",
            borderRadius: "8px",
            fontSize: "0.82rem",
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
