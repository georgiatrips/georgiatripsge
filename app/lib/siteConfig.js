/**
 * GeorgiaTrips - Canonical Site & Locale Configuration
 * Single source of truth for base URLs, supported languages, and SEO helpers.
 */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.georgiatrips.ge"
).replace(/\/+$/, "");

export const SUPPORTED_LANGUAGES = ["ka", "en", "ru", "tr", "ar"];

export const DEFAULT_LANGUAGE = "ka";

export const LANGUAGE_LOCALES = {
  ka: "ka_GE",
  en: "en_US",
  ru: "ru_RU",
  tr: "tr_TR",
  ar: "ar_SA",
};

export const HREFLANG_MAP = {
  ka: "ka-GE",
  en: "en-US",
  ru: "ru-RU",
  tr: "tr-TR",
  ar: "ar-SA",
};

/**
 * Returns the clean path without any leading language prefix
 * e.g. "/ka/tours/batumi" -> "/tours/batumi", "/ka" -> "/"
 */
export function stripLocaleFromPath(pathname = "/") {
  if (!pathname || pathname === "/") return "/";
  const cleaned = pathname.replace(/^\/(?:ka|en|ru|tr|ar)(?=\/|$)/, "");
  return cleaned || "/";
}

/**
 * Returns the full canonical URL for a given path and language
 * e.g. ("/tours", "ka") -> "https://www.georgiatrips.ge/ka/tours"
 * e.g. ("/", "en") -> "https://www.georgiatrips.ge/en"
 */
export function getCanonicalUrl(path = "/", lang = DEFAULT_LANGUAGE) {
  const cleanPath = stripLocaleFromPath(path);
  const normalizedPath = cleanPath === "/" ? "" : cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  return `${SITE_URL}/${lang}${normalizedPath}`;
}

/**
 * Returns hreflang alternates dictionary suitable for Next.js metadata.alternates.languages
 */
export function getAlternateLanguages(path = "/") {
  const cleanPath = stripLocaleFromPath(path);
  const normalizedPath = cleanPath === "/" ? "" : cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  
  return {
    "ka-GE": `${SITE_URL}/ka${normalizedPath}`,
    "en-US": `${SITE_URL}/en${normalizedPath}`,
    "ru-RU": `${SITE_URL}/ru${normalizedPath}`,
    "tr-TR": `${SITE_URL}/tr${normalizedPath}`,
    "ar-SA": `${SITE_URL}/ar${normalizedPath}`,
    "x-default": `${SITE_URL}/en${normalizedPath}`,
  };
}
