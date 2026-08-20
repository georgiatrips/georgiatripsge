import { NextResponse } from "next/server";

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

export function proxy(request) {
  const { pathname, searchParams } = request.nextUrl;
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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
