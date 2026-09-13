export const SUPPORTED_LANGUAGES = ["ka", "en", "ru", "tr", "ar"];

export function isRtlLanguage(lang = "ka") {
  return lang === "ar";
}

export function getTextDirection(lang = "ka") {
  return isRtlLanguage(lang) ? "rtl" : "ltr";
}
