import { NextResponse } from "next/server";
import {
  detectBot,
  checkRateLimit,
  isStaticAssetRequest,
} from "./app/lib/security";
import { SITE_URL } from "./app/lib/siteConfig";

// Only the production domain may be indexed. Preview deployments and the
// *.vercel.app aliases serve the same content and must not compete with it.
const CANONICAL_HOST = new URL(SITE_URL).host;

function withIndexingPolicy(request, response) {
  if (request.headers.get("host") !== CANONICAL_HOST) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

// "/" has no language of its own: send each visitor to their browser
// language, falling back to English (the hreflang x-default). A temporary
// redirect, because the target depends on the visitor.
function pickRootLocale(request) {
  const header = (request.headers.get("accept-language") || "").toLowerCase();
  const preferred = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.split("-")[0], q: q === undefined ? 1 : Number(q) || 0 };
    })
    .filter((entry) => entry.q > 0)
    .sort((a, b) => b.q - a.q);
  return preferred.find((entry) => SUPPORTED_LANGUAGES.includes(entry.lang))?.lang || "en";
}

const SUPPORTED_LANGUAGES = ["ka", "en", "ru", "tr", "ar"];

// ── Tour / place URLs ───────────────────────────────────────────────
// Detail pages stream (they have loading.js), so a page that calls notFound()
// can only answer 200 + noindex. Checking the slug here, against the
// CDN-cached /content-index.json, gives unknown URLs a real 404 and sends old
// Firestore-ID URLs to their slug with a 308 before any HTML is rendered.
const DETAIL_PATH = /^\/(ka|en|ru|tr|ar)\/(tours|places)\/([^/]+)\/?$/;
const INDEX_TTL_MS = 60 * 1000;
// A miss refetches sooner, so a tour saved a moment ago is not a 404.
const INDEX_MISS_REFRESH_MS = 10 * 1000;

let contentIndex = null;
let contentIndexFetchedAt = 0;

async function loadContentIndex(origin, maxAgeMs) {
  if (contentIndex && Date.now() - contentIndexFetchedAt < maxAgeMs) return contentIndex;
  try {
    const res = await fetch(`${origin}/content-index.json`, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`content index ${res.status}`);
    const data = await res.json();
    const toLookup = (list) => ({
      slugs: new Set((list || []).map((item) => item.slug)),
      slugById: new Map((list || []).map((item) => [item.id, item.slug])),
    });
    contentIndex = { tours: toLookup(data.tours), places: toLookup(data.places) };
    contentIndexFetchedAt = Date.now();
  } catch (err) {
    console.warn("[proxy] content index unavailable:", err.message);
  }
  return contentIndex;
}

function lookupDetail(index, kind, param) {
  const lookup = index?.[kind];
  if (!lookup) return { known: false };
  if (lookup.slugs.has(param)) return { known: true };
  const slug = lookup.slugById.get(param);
  return slug ? { known: true, redirectTo: slug } : { known: false };
}

// Returns a response for detail URLs that must not render as-is, or null.
// Fails open: if the index cannot be loaded, the page handles the request.
async function resolveDetailPath(request, match) {
  const [, locale, kind, rawParam] = match;
  let param = rawParam;
  try {
    param = decodeURIComponent(rawParam);
  } catch (_) {}

  const origin = request.nextUrl.origin;
  let index = await loadContentIndex(origin, INDEX_TTL_MS);
  if (!index) return null;
  let result = lookupDetail(index, kind, param);
  if (!result.known) {
    index = await loadContentIndex(origin, INDEX_MISS_REFRESH_MS);
    result = lookupDetail(index, kind, param);
  }

  if (result.known && !result.redirectTo) return null;

  const url = request.nextUrl.clone();
  if (result.redirectTo) {
    url.pathname = `/${locale}/${kind}/${encodeURIComponent(result.redirectTo)}`;
    return NextResponse.redirect(url, 308);
  }
  // No route matches this path, so app/global-not-found.js answers with a 404.
  url.pathname = `/${locale}/${kind}/${encodeURIComponent(param)}/not-found`;
  return NextResponse.rewrite(url);
}

// The locale un-prefixed legacy URLs (indexed pre-migration) redirect to.
// "ka" because that is the language Googlebot has actually been crawling and
// indexing so far — redirecting there preserves ranking continuity for the
// existing index while /en, /ru, /tr, /ar are discovered as new, independent
// URLs via the sitemap and hreflang, each backed by a real app/[locale]/...
// route segment (not a rewrite-masked single-language page).
const LEGACY_REDIRECT_LOCALE = "ka";

// API routes-ის ბოტებისგან დაცვა
function isApiRequest(pathname) {
  return pathname.startsWith("/api/") || pathname === "/api";
}

const API_LIMITS = {
  "/api/upload": { max: 60, methods: ["POST"] },
  "/api/translate": { max: 120, methods: ["POST"] },
  "/api/google-reviews": { max: 30, methods: ["GET"] },
  "/api/analytics/track": { max: 60, methods: ["GET", "POST"] },
  "/api/webhook/meta": { max: 300, methods: ["GET", "POST"] },
};

export async function proxy(request) {
  const { pathname } = request.nextUrl;

  // ═══════════════════════════════════════════════════════════════
  // 1. ბოტების გამოვლენა და დაბლოკვა
  // ═══════════════════════════════════════════════════════════════
  const botInfo = detectBot(request);

  // დაბლოკილი ბოტები - 403 დაბრუნება (გარდა სტატიკური აქტივებისა)
  if (botInfo?.blocked && !isStaticAssetRequest(request)) {
    if (isApiRequest(pathname)) {
      return NextResponse.json({ error: "Bot access denied" }, { status: 403 });
    }
    return new NextResponse("Bot access denied", { status: 403 });
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. Rate Limiting ყველა მომხმარებლისთვის (მათ შორის ბოტებისთვის)
  // ═══════════════════════════════════════════════════════════════
  // API routes-ზე ზოგად ლიმიტს არ ვუშვებთ - მათ ცალკე ლიმიტი აქვთ.
  // Router prefetches are not user page views: a single homepage visit can
  // prefetch dozens of <Link> targets, which used to exhaust the per-IP
  // budget and answer real visitors with "Too many requests".
  const isPrefetch =
    request.headers.get("next-router-prefetch") === "1" ||
    // In-app navigations fetch RSC payloads; only full document loads count.
    request.headers.get("rsc") === "1" ||
    request.headers.get("purpose") === "prefetch" ||
    request.headers.get("sec-purpose")?.includes("prefetch");
  // Verified search/social crawlers (allow-listed in security.js) are never
  // rate limited: a 429 to Googlebot slows crawling of the whole site.
  const isAllowedCrawler = botInfo && !botInfo.blocked && !botInfo.suspicious;
  if (!isApiRequest(pathname) && !isStaticAssetRequest(request) && !isPrefetch && !isAllowedCrawler) {
    const { rateLimited, retryAfter } = checkRateLimit(request);

    if (rateLimited) {
      return new NextResponse("Too many requests", {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter || 60),
          "X-RateLimit-Limit": "120",
          "X-RateLimit-Remaining": "0",
        },
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. API routes-ის დამატებითი დაცვა
  // ═══════════════════════════════════════════════════════════════
  if (isApiRequest(pathname)) {
    const isWebhook = pathname.startsWith("/api/webhook");

    // API-ზე ბოტის მსგავსი User-Agent (-ის დაბლოკვა, გარდა Webhook-ებისა რომლებსაც საკუთარი HMAC/Token დაცვა აქვთ)
    if (botInfo?.suspicious && !isWebhook) {
      return NextResponse.json({ error: "API access denied" }, { status: 403 });
    }
    const policy = API_LIMITS[pathname] || { max: 60, methods: ["GET", "POST"] };
    if (!policy.methods.includes(request.method)) {
      return NextResponse.json(
        { error: "Method not allowed" },
        {
          status: 405,
          headers: { Allow: policy.methods.join(", ") },
        }
      );
    }
    if (pathname === "/api/upload") {
      const contentLength = Number(request.headers.get("content-length") || 0);
      if (contentLength > 5 * 1024 * 1024 + 64 * 1024) {
        return NextResponse.json({ error: "Payload too large" }, { status: 413 });
      }
    }

    const isAuth = !!request.headers.get("authorization");
    const rateLimitMax = isAuth ? policy.max * 2 : policy.max;
    const namespace = isAuth ? `${pathname}:auth` : pathname;

    const { rateLimited: apiLimited, retryAfter: apiRetryAfter } =
      checkRateLimit(request, { max: rateLimitMax, namespace });
    if (apiLimited) {
      return NextResponse.json(
        { error: "API rate limit exceeded", retryAfter: apiRetryAfter || 60 },
        {
          status: 429,
          headers: {
            "Retry-After": String(apiRetryAfter || 60),
            "X-RateLimit-Limit": String(rateLimitMax),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }
    // API routes-ზე არ ვასრულებთ ენის redirect-ს - უბრალოდ ვაგრძელებთ
    return NextResponse.next();
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. Locale routing: real app/[locale]/... segments, not a rewrite mask.
  // ═══════════════════════════════════════════════════════════════
  // Transactional/account surfaces have no [locale] segment at all — leave
  // them alone entirely (no redirect, no locale header).
  if (
    pathname === "/admin" || pathname.startsWith("/admin/") ||
    pathname === "/login" ||
    pathname === "/coupons" ||
    pathname === "/booking" || pathname.startsWith("/booking/")
  ) {
    return withIndexingPolicy(request, NextResponse.next());
  }

  const pathParts = pathname.split("/");
  const pathLang = pathParts[1];
  const hasLocalePrefix = SUPPORTED_LANGUAGES.includes(pathLang);

  if (hasLocalePrefix) {
    // Already under a real /[locale]/... route; app/[locale]/layout.js reads
    // the locale from the URL.
    const detailMatch =
      (request.method === "GET" || request.method === "HEAD") && pathname.match(DETAIL_PATH);
    if (detailMatch) {
      const response = await resolveDetailPath(request, detailMatch);
      if (response) return withIndexingPolicy(request, response);
    }
    return withIndexingPolicy(request, NextResponse.next());
  }

  if (pathname === "/") {
    const response = NextResponse.redirect(new URL(`/${pickRootLocale(request)}`, request.url), 302);
    response.headers.set("Vary", "Accept-Language");
    return response;
  }

  // Legacy / unlocalized URL: 308 permanent redirect to the
  // same path under the legacy default locale so existing indexed URLs keep
  // resolving to equivalent content at their new canonical location.
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = `/${LEGACY_REDIRECT_LOCALE}${pathname}`;
  return NextResponse.redirect(redirectUrl, 308);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
