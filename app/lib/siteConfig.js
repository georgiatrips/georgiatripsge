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

/**
 * Transforms an internal route / path into a localized URL with the given language prefix.
 * Preserves query params and hashes. Avoids modifying external links, mailto/tel, /api, or /_next.
 * e.g. ("/tours", "en") -> "/en/tours"
 * e.g. ("/", "en") -> "/en"
 * e.g. ("/#booking", "en") -> "/en#booking"
 * e.g. ("/ka/places/123", "ru") -> "/ru/places/123"
 */
export function getLocalizedHref(href, lang = DEFAULT_LANGUAGE) {
  if (!href || typeof href !== "string") return href || "/";

  // Ignore external or protocol-relative URLs
  if (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("whatsapp:") ||
    href.startsWith("//")
  ) {
    return href;
  }

  // Ignore API and Next.js internal paths
  if (href.startsWith("/api/") || href === "/api" || href.startsWith("/_next/")) {
    return href;
  }

  // Pure in-page hash links on the current page e.g. "#booking"
  if (href.startsWith("#")) {
    return href;
  }

  const currentLang = SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;

  // Split path, query, and hash
  const hashIndex = href.indexOf("#");
  const hash = hashIndex !== -1 ? href.slice(hashIndex) : "";
  const withoutHash = hashIndex !== -1 ? href.slice(0, hashIndex) : href;

  const queryIndex = withoutHash.indexOf("?");
  const query = queryIndex !== -1 ? withoutHash.slice(queryIndex) : "";
  const rawPath = queryIndex !== -1 ? withoutHash.slice(0, queryIndex) : withoutHash;

  const cleanPath = stripLocaleFromPath(rawPath);
  const normalizedPath = cleanPath === "/" ? "" : cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;

  return `/${currentLang}${normalizedPath}${query}${hash}`;
}
