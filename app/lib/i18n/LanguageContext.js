"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import { isRtlLanguage, SUPPORTED_LANGUAGES } from "./locale";

import { ka } from "./locales/ka";
import { en } from "./locales/en";
import { ru } from "./locales/ru";
import { tr } from "./locales/tr";
import { ar } from "./locales/ar";

const LanguageContext = createContext(null);
const dictionaries = { ka, en, ru, tr, ar };
const STORAGE_KEY = "gt_language";

function getLocaleFromPathname(pathname) {
  if (!pathname || typeof pathname !== "string") return null;
  const segment = pathname.split("/").filter(Boolean)[0];
  if (segment && SUPPORTED_LANGUAGES.includes(segment.toLowerCase())) {
    return segment.toLowerCase();
  }
  return null;
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
  const pathname = usePathname();
  const urlLocale = getLocaleFromPathname(pathname);

  // Authoritative language rule:
  // 1. Explicit valid locale in URL pathname ALWAYS wins
  // 2. Initial server language (from proxy request headers)
  // 3. Fallback "ka"
  const activeLang = urlLocale || (SUPPORTED_LANGUAGES.includes(initialLang) ? initialLang : "ka");

  const [lang, setLangState] = useState(activeLang);
  const [hydrated, setHydrated] = useState(false);

  // Keep state synchronized with the URL whenever pathname changes
  useEffect(() => {
    if (urlLocale && urlLocale !== lang) {
      setLangState(urlLocale);
    }
  }, [urlLocale, lang]);

  // Sync preference cookie & localStorage whenever the effective language changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.cookie = `gt_language=${lang};path=/;max-age=31536000;samesite=lax`;
    } catch (_) {}
    setHydrated(true);
  }, [lang]);

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

  const value = useMemo(
    () => ({
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
    }),
    [lang, changeLanguage, t, hydrated]
  );

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
