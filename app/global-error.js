"use client";

import { useEffect, useState } from "react";
import { reloadOnce } from "./lib/errorRecovery";
import { WA_LINK } from "./lib/shared";

// Last-resort boundary: replaces the whole document when a root layout (or a
// page outside /[locale], like /admin) crashes. Almost always the cause is a
// page opened before a deploy asking for code that no longer exists, so the
// first response is a silent reload. Only if the error comes straight back is
// a message shown, in the visitor's language.
const TEXT = {
  ka: {
    loading: "იტვირთება…",
    title: "გვერდი ვერ ჩაიტვირთა",
    desc: "ბოდიშს გიხდით. განაახლეთ გვერდი — თუ პრობლემა განმეორდა, მოგვწერეთ WhatsApp-ზე.",
    reload: "გვერდის განახლება",
    home: "მთავარი გვერდი",
  },
  en: {
    loading: "Loading…",
    title: "This page couldn't load",
    desc: "Sorry about that. Please reload the page — if it happens again, message us on WhatsApp.",
    reload: "Reload page",
    home: "Home page",
  },
  ru: {
    loading: "Загрузка…",
    title: "Не удалось загрузить страницу",
    desc: "Приносим извинения. Обновите страницу — если проблема повторится, напишите нам в WhatsApp.",
    reload: "Обновить страницу",
    home: "На главную",
  },
  tr: {
    loading: "Yükleniyor…",
    title: "Sayfa yüklenemedi",
    desc: "Özür dileriz. Lütfen sayfayı yenileyin — sorun tekrar ederse bize WhatsApp'tan yazın.",
    reload: "Sayfayı yenile",
    home: "Ana sayfa",
  },
  ar: {
    loading: "جارٍ التحميل…",
    title: "تعذّر تحميل الصفحة",
    desc: "نعتذر عن ذلك. يرجى إعادة تحميل الصفحة، وإذا تكرر الأمر راسلونا عبر واتساب.",
    reload: "إعادة تحميل الصفحة",
    home: "الصفحة الرئيسية",
  },
};

function pageLang() {
  const fromPath = window.location.pathname.split("/")[1];
  if (TEXT[fromPath]) return fromPath;
  const fromHtml = document.documentElement.lang;
  return TEXT[fromHtml] ? fromHtml : "ka";
}

const page = {
  margin: 0,
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1.5rem",
  background: "#f8fafc",
  color: "#1f2d3d",
  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
};
const button = {
  padding: "0.8rem 1.5rem",
  borderRadius: "12px",
  fontWeight: 700,
  fontSize: "0.95rem",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-block",
};

export default function GlobalError({ error }) {
  // Unknown until mounted, so the first paint is a neutral loader, never an error.
  const [view, setView] = useState({ lang: "ka", failed: false });

  useEffect(() => {
    console.error("Global error:", error);
    const reloading = reloadOnce();
    setView({ lang: pageLang(), failed: !reloading });
  }, [error]);

  const t = TEXT[view.lang] || TEXT.ka;

  return (
    <html lang={view.lang} dir={view.lang === "ar" ? "rtl" : "ltr"}>
      <body style={page}>
        {!view.failed ? (
          <div role="status" aria-live="polite" style={{ textAlign: "center", color: "#64748b" }}>
            <div
              style={{
                width: 36,
                height: 36,
                margin: "0 auto 0.75rem",
                borderRadius: "50%",
                border: "3px solid #dbe4ee",
                borderTopColor: "#2a6592",
                animation: "gt-spin 0.8s linear infinite",
              }}
            />
            <style>{"@keyframes gt-spin{to{transform:rotate(360deg)}}@media (prefers-reduced-motion:reduce){[role=status]>div{animation:none!important}}"}</style>
            {t.loading}
          </div>
        ) : (
          <div
            style={{
              maxWidth: 480,
              width: "100%",
              textAlign: "center",
              background: "#ffffff",
              padding: "2.5rem 2rem",
              borderRadius: 20,
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.08)",
            }}
          >
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 0.75rem" }}>{t.title}</h1>
            <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: 1.6, margin: "0 0 1.75rem" }}>{t.desc}</p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{ ...button, background: "#2a6592", color: "#ffffff", border: "none" }}
              >
                {t.reload}
              </button>
              <a href={`/${view.lang}`} style={{ ...button, background: "#ffffff", color: "#2a6592", border: "2px solid #2a6592" }}>
                {t.home}
              </a>
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer" style={{ ...button, background: "#25d366", color: "#ffffff", border: "none" }}>
                WhatsApp
              </a>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}
