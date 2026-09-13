// ============================================================
// GeorgiaTrips — Internationalization Translations
// ============================================================

import { ka } from "./locales/ka";
import { en } from "./locales/en";
import { ru } from "./locales/ru";
import { tr } from "./locales/tr";
import { ar } from "./locales/ar";

export const translations = {
  ka,
  en,
  ru,
  tr,
  ar,
};

export const RTL_LANGUAGES = ["ar"];
export function isRtlLanguage(lang = "ka") {
  return RTL_LANGUAGES.includes(lang);
}
export function getLanguageDirection(lang = "ka") {
  return isRtlLanguage(lang) ? "rtl" : "ltr";
}

export function formatPriceStr(priceStr, langOrIsEnglish, isRussian) {
  if (!priceStr) return "";
  const isRu = langOrIsEnglish === "ru" || isRussian === true;
  const isEn = langOrIsEnglish === "en" || langOrIsEnglish === true;
  const isTr = langOrIsEnglish === "tr";
  const isAr = langOrIsEnglish === "ar";
  if (isRu) {
    return String(priceStr)
      .replace(/\/კაცი/g, "/чел")
      .replace(/ \/ კაცი/g, " / чел")
      .replace(/კაცი/g, "чел")
      .replace(/შესასვლელი ბილეთები/g, "входные билеты");
  }
  if (isEn) {
    return String(priceStr)
      .replace(/\/კაცი/g, "/person")
      .replace(/ \/ კაცი/g, " / person")
      .replace(/კაცი/g, "person")
      .replace(/შესასვლელი ბილეთები/g, "entrance tickets");
  }
  if (isTr) {
    return String(priceStr)
      .replace(/\/კაცი/g, "/kişi")
      .replace(/ \/ კაცი/g, " / kişi")
      .replace(/კაცი/g, "kişi")
      .replace(/შესასვლელი ბილეთები/g, "giriş biletleri");
  }
  if (isAr) {
    return String(priceStr)
      .replace(/\/კაცი/g, "/شخص")
      .replace(/ \/ კაცი/g, " / شخص")
      .replace(/კაცი/g, "شخص")
      .replace(/შესასვლელი ბილეთები/g, "تذاكر الدخول");
  }
  return String(priceStr);
}
