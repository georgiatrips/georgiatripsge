"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { translations } from "./translations";

const LanguageContext = createContext(null);

const STORAGE_KEY = "gt_language";

/**
 * Get a nested value from an object using a dot-notation path.
 * Example: getNestedValue(obj, "nav.home") => obj.nav.home
 */
function getNestedValue(obj, path) {
  return path.split(".").reduce((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return acc[key];
    }
    return undefined;
  }, obj);
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("ka"); // Default to Georgian
  const [hydrated, setHydrated] = useState(false);

  // Load saved language from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "ka" || saved === "en" || saved === "ru" || saved === "tr" || saved === "ar") {
        setLang(saved);
      }
    } catch (_) {
      // localStorage might not be available
    }
    setHydrated(true);
  }, []);

  // Save language to localStorage whenever it changes
  const changeLanguage = useCallback((newLang) => {
    if (newLang !== "ka" && newLang !== "en" && newLang !== "ru" && newLang !== "tr" && newLang !== "ar") return;
    setLang(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch (_) {}
  }, []);

  /**
   * Translation function.
   * Usage: t("nav.home") => "Home" (if lang is "en")
   * Falls back to Georgian if the key doesn't exist in the current language.
   */
  const t = useCallback(
    (key) => {
      const value = getNestedValue(translations[lang], key);
      if (value !== undefined) return value;

      // Fallback to Georgian
      const fallback = getNestedValue(translations.ka, key);
      if (fallback !== undefined) return fallback;

      // Return the key itself if nothing found
      return key;
    },
    [lang]
  );

  const value = {
    lang,
    setLang: changeLanguage,
    t,
    hydrated,
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
    // Return a default context if used outside provider (shouldn't happen)
    return {
      lang: "ka",
      setLang: () => {},
      t: (key) => key,
      hydrated: false,
      isGeorgian: true,
      isEnglish: false,
      isRussian: false,
    };
  }
  return ctx;
}