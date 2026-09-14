import { NextResponse } from "next/server";
import {
  detectBot,
  checkRateLimit,
  isStaticAssetRequest,
} from "./app/lib/security";

const SUPPORTED_LANGUAGES = ["ka", "en", "ru", "tr", "ar"];

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
  "/api/weather": { max: 60, methods: ["GET"] },
  "/api/currency": { max: 60, methods: ["GET"] },
  "/api/analytics/track": { max: 60, methods: ["GET", "POST"] },
};

export function proxy(request) {
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
  // API routes-ზე ზოგად ლიმიტს არ ვუშვებთ - მათ ცალკე ლიმიტი აქვთ
  if (!isApiRequest(pathname) && !isStaticAssetRequest(request)) {
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
    // API-ზე ბოტის მსგავსი User-Agent (-ის დაბლოკვა)
    if (botInfo?.suspicious) {
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
    return NextResponse.next();
  }

  const pathParts = pathname.split("/");
  const pathLang = pathParts[1];
  const hasLocalePrefix = SUPPORTED_LANGUAGES.includes(pathLang);

  if (hasLocalePrefix) {
    // Already under a real /[locale]/... route: just forward the resolved
    // locale via a header so the un-parameterized root layout (<html lang>)
    // can read it with headers() instead of falling back to cookie state.
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-georgiatrips-locale", pathLang);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Legacy / unlocalized URL (including "/"): 308 permanent redirect to the
  // same path under the legacy default locale so existing indexed URLs keep
  // resolving to equivalent content at their new canonical location.
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = `/${LEGACY_REDIRECT_LOCALE}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(redirectUrl, 308);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
