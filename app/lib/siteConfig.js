/**
 * GeorgiaTrips - Canonical Site & Locale Configuration
 * Single source of truth for base URLs, supported languages, and SEO helpers.
 */

// NOTE: standardized on the non-www apex domain because that is what
// robots.js, sitemap.js, the root layout's Search Console/Yandex/Facebook
// verification tags, and the site-wide JSON-LD all already use. If DNS/Vercel
// is actually serving www.georgiatrips.ge as canonical, set
// NEXT_PUBLIC_SITE_URL and add a redirect the other direction — don't let the
// two diverge, that's a duplicate-content risk.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://georgiatrips.ge"
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
  ka: "ka",
  en: "en",
  ru: "ru",
  tr: "tr",
  ar: "ar",
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
 * Includes both broad universal language tags (en, ru, tr, ar, ka) and regional tags
 * to ensure maximum discovery for international tourists browsing inside Georgia.
 */
export function getAlternateLanguages(path = "/") {
  const cleanPath = stripLocaleFromPath(path);
  const normalizedPath = cleanPath === "/" ? "" : cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  
  return {
    ka: `${SITE_URL}/ka${normalizedPath}`,
    en: `${SITE_URL}/en${normalizedPath}`,
    ru: `${SITE_URL}/ru${normalizedPath}`,
    tr: `${SITE_URL}/tr${normalizedPath}`,
    ar: `${SITE_URL}/ar${normalizedPath}`,
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

/**
 * Resolves the current locale from the request. Prefers the `[locale]` route
 * param (pass it directly when available — it's the URL, the real SEO source
 * of truth). Falls back to the `x-georgiatrips-locale` header that
 * middleware.js sets from the URL for code that only has access to
 * `headers()` (e.g. the un-parameterized root layout).
 */
export function getRequestLocale(headersOrLocale) {
  if (typeof headersOrLocale === "string") {
    return SUPPORTED_LANGUAGES.includes(headersOrLocale) ? headersOrLocale : DEFAULT_LANGUAGE;
  }
  const fromHeader = headersOrLocale?.get?.("x-georgiatrips-locale");
  return SUPPORTED_LANGUAGES.includes(fromHeader) ? fromHeader : DEFAULT_LANGUAGE;
}

/**
 * Standard Next.js Metadata object for a localized page: locale-correct
 * title/description, reciprocal hreflang alternates (all 5 locales +
 * x-default), and matching OpenGraph/Twitter tags. Every page under
 * `app/[locale]/...` should build its metadata through this so canonical and
 * hreflang stay consistent site-wide.
 */
export function buildLocalizedMetadata({ path = "/", lang = DEFAULT_LANGUAGE, title, description, image }) {
  const currentLang = SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;
  const imageUrl = image
    ? image.startsWith("http")
      ? image
      : `${SITE_URL}${image.startsWith("/") ? "" : "/"}${image}`
    : `${SITE_URL}/hero.webp`;

  return {
    title,
    description,
    alternates: {
      canonical: getCanonicalUrl(path, currentLang),
      languages: getAlternateLanguages(path),
    },
    openGraph: {
      title,
      description,
      url: getCanonicalUrl(path, currentLang),
      siteName: "GeorgiaTrips",
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
      locale: LANGUAGE_LOCALES[currentLang],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}
