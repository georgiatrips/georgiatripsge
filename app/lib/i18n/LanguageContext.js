"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { isRtlLanguage, SUPPORTED_LANGUAGES } from "./locale";
import { lookup, mergeMessages } from "./translateCore";

// Only the current language's messages are sent with the page (the "messages"
// prop from the root layout). Another language is fetched when the visitor
// switches, so the five dictionaries are not part of every page bundle.
const LOCALE_LOADERS = {
  ka: () => import("./locales/ka").then((m) => m.ka),
  en: () => import("./locales/en").then((m) => m.en),
  ru: () => import("./locales/ru").then((m) => m.ru),
  tr: () => import("./locales/tr").then((m) => m.tr),
  ar: () => import("./locales/ar").then((m) => m.ar),
};

async function loadMessages(lang) {
  const [base, own] = await Promise.all([LOCALE_LOADERS.ka(), LOCALE_LOADERS[lang]()]);
  return lang === "ka" ? base : mergeMessages(base, own);
}

const LanguageContext = createContext(null);
const STORAGE_KEY = "gt_language";

function getInitialLanguage(fallback = "ka") {
  if (typeof window === "undefined") return fallback;

  // 1. Check URL query param ?lang=ru
  try {
    const params = new URLSearchParams(window.location.search);
    const qLang = params.get("lang");
    if (qLang && SUPPORTED_LANGUAGES.includes(qLang)) return qLang;
  } catch (_) {}

  // 2. Check path segment e.g. /ru/...
  try {
    const pathLang = window.location.pathname.split("/").filter(Boolean)[0];
    if (pathLang && SUPPORTED_LANGUAGES.includes(pathLang)) return pathLang;
  } catch (_) {}

  // 3. Check document.cookie
  try {
    const match = document.cookie.match(/(?:^|;\s*)gt_language=([^;]+)/);
    if (match && SUPPORTED_LANGUAGES.includes(match[1])) {
      return match[1];
    }
  } catch (_) {}

  // 4. Check localStorage
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.includes(saved)) {
      return saved;
    }
  } catch (_) {}

  return fallback;
}

export function LanguageProvider({ children, initialLang = "ka", messages }) {
  const [lang, setLangState] = useState(initialLang);
  const [hydrated, setHydrated] = useState(false);
  const [catalog, setCatalog] = useState({ lang: initialLang, messages });

  // A navigation to another locale re-renders the root layout with new props.
  if (messages !== undefined && catalog.lang === initialLang && catalog.messages !== messages) {
    setCatalog({ lang: initialLang, messages });
  }

  useEffect(() => {
    if (catalog.lang === lang && catalog.messages) return;
    let cancelled = false;
    loadMessages(lang)
      .then((loaded) => {
        if (!cancelled) setCatalog({ lang, messages: loaded });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [lang, catalog]);

  useEffect(() => {
    const detected = getInitialLanguage(initialLang);
    if (detected && detected !== lang) {
      setLangState(detected);
    }
    try {
      localStorage.setItem(STORAGE_KEY, detected || initialLang);
      document.cookie = `gt_language=${detected || initialLang};path=/;max-age=31536000;samesite=lax`;
    } catch (_) {}
    setHydrated(true);
  }, [initialLang]);

  // Sync DOM attributes (<html lang> and <html dir>) whenever lang changes
  useEffect(() => {
    if (typeof document !== "undefined") {
      const isRtl = isRtlLanguage(lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = isRtl ? "rtl" : "ltr";
      document.documentElement.setAttribute("lang", lang);
      document.documentElement.setAttribute("dir", isRtl ? "rtl" : "ltr");

      if (isRtl) {
        document.documentElement.classList.add("rtl");
        document.body?.classList.add("rtl");
      } else {
        document.documentElement.classList.remove("rtl");
        document.body?.classList.remove("rtl");
      }
    }
  }, [lang]);

  const changeLanguage = useCallback((newLang) => {
    if (!SUPPORTED_LANGUAGES.includes(newLang)) return;
    setLangState(newLang);

    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      document.cookie = `gt_language=${newLang};path=/;max-age=31536000;samesite=lax`;
    } catch (_) {}

    if (typeof document !== "undefined") {
      const isRtl = isRtlLanguage(newLang);
      document.documentElement.lang = newLang;
      document.documentElement.dir = isRtl ? "rtl" : "ltr";
      if (isRtl) {
        document.documentElement.classList.add("rtl");
        document.body?.classList.add("rtl");
      } else {
        document.documentElement.classList.remove("rtl");
        document.body?.classList.remove("rtl");
      }
    }
  }, []);

  /**
   * Translation function.
   * Usage: t("nav.home") => "Home" (if lang is "en")
   */
  const currentMessages = catalog.messages;
  const t = useCallback((key, fallback) => lookup(currentMessages, key, fallback), [currentMessages]);

  const value = {
    lang,
    setLang: changeLanguage,
    t,
    hydrated,
    isRtl: isRtlLanguage(lang),
    isRTL: isRtlLanguage(lang),
    dir: isRtlLanguage(lang) ? "rtl" : "ltr",
    // Convenience flags
    isGeorgian: lang === "ka",
    isEnglish: lang === "en",
    isRussian: lang === "ru",
    isTurkish: lang === "tr",
    isArabic: lang === "ar",
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      lang: "ka",
      setLang: () => {},
      t: (key, fallback) => fallback ?? key,
      hydrated: false,
      isRtl: false,
      isRTL: false,
      dir: "ltr",
      isGeorgian: true,
      isEnglish: false,
      isRussian: false,
      isTurkish: false,
      isArabic: false,
    };
  }
  return ctx;
}
