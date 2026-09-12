import { NextResponse } from "next/server";
import {
  detectBot,
  checkRateLimit,
  isStaticAssetRequest,
} from "./app/lib/security";
import {
  checkTourExists,
  checkPlaceExists,
} from "./app/lib/server/entityValidator";

const SUPPORTED_LANGUAGES = ["ka", "en", "ru", "tr", "ar"];

function detectLanguage(acceptLanguageHeader) {
  if (!acceptLanguageHeader) return "en";
  const languages = acceptLanguageHeader
    .split(",")
    .map((item) => {
      const [lang, q] = item.trim().split(";q=");
      return {
        code: lang.trim().toLowerCase(),
        quality: q ? parseFloat(q) : 1.0,
      };
    })
    .sort((a, b) => b.quality - a.quality);

  for (const { code } of languages) {
    const baseCode = code.split("-")[0];
    if (SUPPORTED_LANGUAGES.includes(baseCode)) return baseCode;
    if (["uk", "be", "kk", "ky", "uz"].includes(baseCode)) return "ru";
    if (["az"].includes(baseCode)) return "tr";
  }
  return "en";
}

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

export async function proxy(request) {
  const { pathname, searchParams } = request.nextUrl;

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
  // 2. Rate Limiting მომხმარებლებისთვის (საძიებო სისტემის ბოტები გათავისუფლებულია გვერდის ლიმიტისგან)
  // ═══════════════════════════════════════════════════════════════
  // API routes-ზე ზოგად ლიმიტს არ ვუშვებთ - მათ ცალკე ლიმიტი აქვთ
  if (!isApiRequest(pathname) && !isStaticAssetRequest(request)) {
    // Only apply human page rate limiting if not a verified search engine crawler
    if (!botInfo?.isSearchCrawler) {
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
  // 4. ენის გადამისამართება / rewrite (არსებული ლოგიკა)
  // ═══════════════════════════════════════════════════════════════
  const urlLang = searchParams.get("lang");
  const cookieLang = request.cookies.get("gt_language")?.value;
  const pathParts = pathname.split("/");
  const pathLang = pathParts[1];
  const lowerPathLang = pathLang ? pathLang.toLowerCase() : "";
  const isCaseMismatch = pathLang && pathLang !== lowerPathLang && SUPPORTED_LANGUAGES.includes(lowerPathLang);

  // Normalize uppercase supported locale prefix with a 308 Permanent Redirect (e.g. /EN/tours -> /en/tours)
  if (isCaseMismatch) {
    const redirectUrl = request.nextUrl.clone();
    const newParts = [...pathParts];
    newParts[1] = lowerPathLang;
    redirectUrl.pathname = newParts.join("/");
    return NextResponse.redirect(redirectUrl, { status: 308 });
  }

  const hasLocalePrefix = SUPPORTED_LANGUAGES.includes(pathLang);
  const detectedLang = detectLanguage(request.headers.get("accept-language"));
  const locale = hasLocalePrefix
    ? pathLang
    : urlLang && SUPPORTED_LANGUAGES.includes(urlLang)
      ? urlLang
      : cookieLang && SUPPORTED_LANGUAGES.includes(cookieLang)
        ? cookieLang
        : detectedLang;

  // Keep legacy links working while making every public page addressable and
  // indexable under a stable language prefix.
  if (!hasLocalePrefix) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    redirectUrl.searchParams.delete("lang");
    const isRootPermanent = pathname === "/" && !cookieLang && !urlLang;
    const response = NextResponse.redirect(redirectUrl, { status: isRootPermanent ? 308 : 307 });
    response.cookies.set("gt_language", locale, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
    return response;
  }

  // Handle legacy /transport under locale prefix (e.g. /ka/transport -> /ka/transfers)
  if (pathParts[2] === "transport") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/${pathParts[1]}/transfers`;
    return NextResponse.redirect(redirectUrl, { status: 308 });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-georgiatrips-locale", locale);
  requestHeaders.set("x-georgiatrips-path", pathname);

  let routePath = `/${pathParts.slice(2).join("/")}`.replace(/\/$/, "") || "/";

  // Check validity for dynamic entities so nonexistent tours/places return true HTTP 404
  if (pathParts[2] === "tours" && pathParts[3]) {
    const tourExists = await checkTourExists(pathParts[3]);
    if (!tourExists) {
      routePath = "/_not-found";
    }
  } else if (pathParts[2] === "places" && pathParts[3]) {
    const placeExists = await checkPlaceExists(pathParts[3]);
    if (!placeExists) {
      routePath = "/_not-found";
    }
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = routePath;
  const response = NextResponse.rewrite(rewriteUrl, {
    request: { headers: requestHeaders },
  });

  if (cookieLang !== locale) {
    response.cookies.set("gt_language", locale, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
