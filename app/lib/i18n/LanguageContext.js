"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { isRtlLanguage, SUPPORTED_LANGUAGES } from "./locale";
import { translate } from "./translate";

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

export function LanguageProvider({ children, initialLang = "ka" }) {
  const [lang, setLangState] = useState(initialLang);
  const [hydrated, setHydrated] = useState(false);

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
  const t = useCallback((key, fallback) => translate(lang, key, fallback), [lang]);

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
      t: (key, fallback) => translate("ka", key, fallback),
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
