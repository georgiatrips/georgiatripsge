"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { isRtlLanguage, SUPPORTED_LANGUAGES } from "./locale";

import { ka } from "./locales/ka";
import { en } from "./locales/en";
import { ru } from "./locales/ru";
import { tr } from "./locales/tr";
import { ar } from "./locales/ar";

const LanguageContext = createContext(null);
const dictionaries = { ka, en, ru, tr, ar };
const STORAGE_KEY = "gt_language";

function detectBrowserLanguage() {
  if (typeof navigator === "undefined") return "ka";
  const browserLangs = navigator.languages || [navigator.language || ""];
  for (const rawLang of browserLangs) {
    if (!rawLang) continue;
    const code = rawLang.toLowerCase().split("-")[0];
    if (SUPPORTED_LANGUAGES.includes(code)) {
      return code;
    }
    if (["uk", "be", "kk", "ky", "uz"].includes(code)) return "ru";
    if (["az"].includes(code)) return "tr";
  }
  return "en";
}

function getInitialLanguage() {
  if (typeof window === "undefined") return "ka";

  // 1. Read the language prefix from the canonical URL.
  try {
    const pathLang = window.location.pathname.split("/")[1];
    if (SUPPORTED_LANGUAGES.includes(pathLang)) return pathLang;
  } catch (_) {}

  // 2. Check localStorage
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.includes(saved)) {
      return saved;
    }
  } catch (_) {}

  // 3. Check document.cookie
  try {
    const match = document.cookie.match(/(?:^|;\s*)gt_language=([^;]+)/);
    if (match && SUPPORTED_LANGUAGES.includes(match[1])) {
      return match[1];
    }
  } catch (_) {}

  // 4. Fallback to browser language
  return detectBrowserLanguage();
}

/**
 * Get a nested value from an object using a dot-notation path.
 * Example: getNestedValue(obj, "nav.home") => obj.nav.home
 */
function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;
  return path.split(".").reduce((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return acc[key];
    }
    return undefined;
  }, obj);
}

export function LanguageProvider({ children, initialLang = "ka" }) {
  const [lang, setLang] = useState(initialLang);
  const [hydrated, setHydrated] = useState(false);

  // Initialize and auto-detect on mount
  useEffect(() => {
    const initLang = getInitialLanguage() || initialLang;
    if (initLang && initLang !== lang) {
      setLang(initLang);
    }
    try {
      localStorage.setItem(STORAGE_KEY, initLang || initialLang);
      document.cookie = `gt_language=${initLang || initialLang};path=/;max-age=31536000;samesite=lax`;
    } catch (_) {}
    setHydrated(true);
  }, [initialLang]);

  // Sync DOM attributes (<html lang> and <html dir>) and RTL classes whenever lang changes
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

  // Keep back/forward navigation synchronized with the locale path.
  useEffect(() => {
    const handlePopState = () => {
      try {
        const pathLang = window.location.pathname.split("/")[1];
        if (SUPPORTED_LANGUAGES.includes(pathLang) && pathLang !== lang) {
          setLang(pathLang);
          localStorage.setItem(STORAGE_KEY, pathLang);
          document.cookie = `gt_language=${pathLang};path=/;max-age=31536000;samesite=lax`;
        }
      } catch (_) {}
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [lang]);

  // A language switch changes the canonical path so server-rendered metadata,
  // html lang/dir and client content all use the same locale.
  const changeLanguage = useCallback((newLang) => {
    if (!SUPPORTED_LANGUAGES.includes(newLang)) return;
    setLang(newLang);

    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      document.cookie = `gt_language=${newLang};path=/;max-age=31536000;samesite=lax`;
    } catch (_) {}

    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        const segments = url.pathname.split("/");
        if (SUPPORTED_LANGUAGES.includes(segments[1])) segments[1] = newLang;
        else segments.splice(1, 0, newLang);
        url.pathname = segments.join("/").replace(/\/{2,}/g, "/");
        url.searchParams.delete("lang");
        window.location.assign(url.toString());
      } catch (_) {}
    }
  }, []);

  /**
   * Translation function.
   * Usage: t("nav.home") => "Home" (if lang is "en")
   * Synchronously resolves current dictionary with fallback to Georgian dictionary.
   */
  const t = useCallback(
    (key, fallback) => {
      if (!key) return "";
      const currentDict = dictionaries[lang] || dictionaries.ka;
      let value = getNestedValue(currentDict, key);
      if (value !== undefined && value !== null) return value;

      // Fallback to Georgian if missing in current language
      if (lang !== "ka") {
        value = getNestedValue(dictionaries.ka, key);
        if (value !== undefined && value !== null) return value;
      }

      if (fallback !== undefined && fallback !== null) return fallback;
      return key;
    },
    [lang]
  );

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
      t: (key, fallback) => {
        if (!key) return "";
        let value = getNestedValue(dictionaries.ka, key);
        if (value !== undefined && value !== null) return value;
        return fallback !== undefined ? fallback : key;
      },
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
