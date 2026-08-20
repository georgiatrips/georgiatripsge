"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "./lib/i18n/LanguageContext";

const ERROR_TEXTS = {
  ka: {
    title: "დაფიქსირდა შეცდომა",
    desc: "სამწუხაროდ, გვერდის ჩატვირთვისას მოხდა გაუთვალისწინებელი შეცდომა.",
    retryBtn: "ხელახლა ცდა",
    homeBtn: "მთავარ გვერდზე დაბრუნება",
  },
  en: {
    title: "Something went wrong",
    desc: "An unexpected error occurred while loading this page.",
    retryBtn: "Try Again",
    homeBtn: "Return to Home",
  },
  ru: {
    title: "Произошла ошибка",
    desc: "К сожалению, при загрузке страницы возникла непредвиденная ошибка.",
    retryBtn: "Попробовать снова",
    homeBtn: "На главную",
  },
  tr: {
    title: "Bir hata oluştu",
    desc: "Sayfa yüklenirken beklenmeyen bir hata meydana geldi.",
    retryBtn: "Tekrar Dene",
    homeBtn: "Ana Sayfaya Dön",
  },
  ar: {
    title: "حدث خطأ غير متوقع",
    desc: "نعتذر، حدث خطأ أثناء تحميل هذه الصفحة.",
    retryBtn: "إعادة المحاولة",
    homeBtn: "العودة للرئيسية",
  },
};

export default function Error({ error, reset }) {
  const { lang } = useLanguage();
  const t = ERROR_TEXTS[lang] || ERROR_TEXTS.ka;

  useEffect(() => {
    console.error("App Error Boundary caught:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4rem 1.5rem",
        textAlign: "center",
      }}
    >
      <div
        style={{
          maxWidth: "500px",
          width: "100%",
          background: "#ffffff",
          padding: "3rem 2rem",
          borderRadius: "20px",
          boxShadow: "0 15px 35px rgba(0,0,0,0.08)",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <span style={{ fontSize: "3rem", display: "block", marginBottom: "1rem" }}>⚠️</span>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--navy, #0d233a)", marginBottom: "0.75rem" }}>
          {t.title}
        </h1>
        <p style={{ color: "var(--text-muted, #64748b)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "2rem" }}>
          {t.desc}
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => reset()}
            style={{
              padding: "0.75rem 1.5rem",
              background: "var(--teal, #29b2b7)",
              color: "#ffffff",
              border: "none",
              borderRadius: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {t.retryBtn}
          </button>
          <Link
            href="/"
            style={{
              padding: "0.75rem 1.5rem",
              background: "rgba(13, 35, 58, 0.08)",
              color: "var(--navy, #0d233a)",
              borderRadius: "12px",
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            {t.homeBtn}
          </Link>
        </div>
      </div>
    </div>
  );
}
