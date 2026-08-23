import { NextResponse } from "next/server";
import {
  detectBot,
  checkRateLimit,
  isStaticAssetRequest,
} from "./app/lib/security";

const SUPPORTED_LANGUAGES = ["ka", "en", "ru", "tr", "ar"];

function detectLanguage(acceptLanguageHeader) {
  if (!acceptLanguageHeader) return "ka";
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
  "/api/upload": { max: 5, methods: ["POST"] },
  "/api/translate": { max: 10, methods: ["POST"] },
  "/api/google-reviews": { max: 10, methods: ["GET"] },
  "/api/weather": { max: 30, methods: ["GET"] },
  "/api/currency": { max: 30, methods: ["GET"] },
  "/api/analytics/track": { max: 20, methods: ["GET"] },
};

export function proxy(request) {
  const { pathname, searchParams } = request.nextUrl;

  // ═══════════════════════════════════════════════════════════════
  // 1. ბოტების გამოვლენა და დაბლოკვა
  // ═══════════════════════════════════════════════════════════════
  const botInfo = detectBot(request);

  // დაბლოკილი ბოტები - 403 დაბრუნება (გარდა სტატიკური აქტივებისა)
  if (botInfo?.blocked && !isStaticAssetRequest(request)) {
    return new NextResponse("Bot access denied", { status: 403 });
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. Rate Limiting ყველა მომხმარებლისთვის (მათ შორის ბოტებისთვის)
  // ═══════════════════════════════════════════════════════════════
  // API routes-ზე ზოგად ლიმიტს არ ვუშვებთ - მათ ცალკე ლიმიტი აქვთ (30/წთ)
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
      return new NextResponse("API access denied", { status: 403 });
    }
    const policy = API_LIMITS[pathname] || { max: 20, methods: ["GET", "POST"] };
    if (!policy.methods.includes(request.method)) {
      return new NextResponse("Method not allowed", {
        status: 405,
        headers: { Allow: policy.methods.join(", ") },
      });
    }
    if (pathname === "/api/upload") {
      const contentLength = Number(request.headers.get("content-length") || 0);
      if (contentLength > 5 * 1024 * 1024 + 64 * 1024) {
        return new NextResponse("Payload too large", { status: 413 });
      }
    }
    // API-ზე მკაცრი ლიმიტი (30/წუთი)
    const { rateLimited: apiLimited, retryAfter: apiRetryAfter } =
      checkRateLimit(request, { max: policy.max, namespace: pathname });
    if (apiLimited) {
      return new NextResponse("API rate limit exceeded", {
        status: 429,
        headers: {
          "Retry-After": String(apiRetryAfter || 60),
          "X-RateLimit-Limit": String(policy.max),
          "X-RateLimit-Remaining": "0",
        },
      });
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
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set("gt_language", locale, {
      path: "/",
      maxAge: 31536000,
      sameSite: "lax",
    });
    return response;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-georgiatrips-locale", locale);
  requestHeaders.set("x-georgiatrips-path", pathname);
  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = `/${pathParts.slice(2).join("/")}`.replace(/\/$/, "") || "/";
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
