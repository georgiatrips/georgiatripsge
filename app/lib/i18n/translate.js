import { ka } from "./locales/ka";
import { en } from "./locales/en";
import { ru } from "./locales/ru";
import { tr } from "./locales/tr";
import { ar } from "./locales/ar";

// Single source of truth for UI strings. LanguageContext (client) and server
// components both resolve keys through translate(), so there is exactly one
// dictionary set and one fallback order: requested language → Georgian →
// caller fallback → the key itself.
export const dictionaries = { ka, en, ru, tr, ar };

export function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;
  return path.split(".").reduce((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) return acc[key];
    return undefined;
  }, obj);
}

export function translate(lang, key, fallback) {
  if (!key) return "";
  let value = getNestedValue(dictionaries[lang] || dictionaries.ka, key);
  if (value !== undefined && value !== null) return value;

  if (lang !== "ka") {
    value = getNestedValue(dictionaries.ka, key);
    if (value !== undefined && value !== null) return value;
  }

  if (fallback !== undefined && fallback !== null) return fallback;
  return key;
}

export function getTranslator(lang) {
  return (key, fallback) => translate(lang, key, fallback);
}

/** Replaces {name} placeholders; unknown placeholders are left untouched. */
export function interpolate(template, values = {}) {
  return String(template ?? "").replace(/\{(\w+)\}/g, (match, name) =>
    values[name] === undefined || values[name] === null ? match : String(values[name])
  );
}
