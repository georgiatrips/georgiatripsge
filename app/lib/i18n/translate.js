import { ka } from "./locales/ka";
import { en } from "./locales/en";
import { ru } from "./locales/ru";
import { tr } from "./locales/tr";
import { ar } from "./locales/ar";
import { getNestedValue, mergeMessages } from "./translateCore";

export { getNestedValue, interpolate } from "./translateCore";

// Single source of truth for UI strings, with one fallback order: requested
// language → Georgian → caller fallback → the key itself.
// Server-side only: client components get their language's merged messages
// from LanguageProvider (see getMessages), so the five dictionaries never
// ship in the page bundle.
export const dictionaries = { ka, en, ru, tr, ar };

const mergedCache = new Map();

/** The full message tree for `lang`, with Georgian filling any gaps. */
export function getMessages(lang) {
  const key = dictionaries[lang] ? lang : "ka";
  if (!mergedCache.has(key)) {
    mergedCache.set(key, key === "ka" ? ka : mergeMessages(ka, dictionaries[key]));
  }
  return mergedCache.get(key);
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
