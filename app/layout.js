import { Suspense } from "react";
import { Noto_Sans_Georgian, Noto_Serif_Georgian, Playfair_Display, Noto_Sans_Arabic, Noto_Naskh_Arabic } from "next/font/google";
import { cookies, headers } from "next/headers";
import Script from "next/script";
import "./globals.css";
import "./coupon.css";
import "./styles/site.css";
import "./styles/chrome.css";
import "./styles/datepicker.css";
import "./styles/page-hero.css";
import { AuthProvider } from "./lib/AuthContext";
import { LanguageProvider } from "./lib/i18n/LanguageContext";
import { CurrencyProvider } from "./lib/currency/CurrencyContext";
import { CouponProvider } from "./lib/CouponContext";
import { isRtlLanguage } from "./lib/i18n/locale";
import { SITE_URL, getRequestLocale } from "./lib/siteConfig";
import CookieConsent from "./components/CookieConsent";
import AnalyticsTracker from "./components/AnalyticsTracker";
import WelcomeCouponPopup from "./components/WelcomeCouponPopup";
import ScrollReveal from "./components/site/ScrollReveal";

// Variable fonts: one file per family/subset instead of one per weight.
const notoGeorgian = Noto_Sans_Georgian({
  variable: "--font-noto-georgian",
  subsets: ["georgian"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const notoSerifGeorgian = Noto_Serif_Georgian({
  variable: "--font-noto-serif-georgian",
  subsets: ["georgian"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

// Separate instance so Russian headings get the serif without every other
// locale preloading the Cyrillic file; unicode-range keeps it lazy.
const playfairCyrillic = Playfair_Display({
  variable: "--font-playfair-cyrillic",
  subsets: ["cyrillic"],
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  variable: "--font-noto-naskh-arabic",
  subsets: ["arabic"],
  display: "swap",
  preload: false,
  adjustFontFallback: false,
});

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0d233a",
};

// Locale-specific title/description/OG/hreflang live in app/[locale]/layout.js
// (Next.js metadata merging replaces these keys entirely for any localized
// route). This root-level metadata only covers what's identical everywhere
// and what non-locale routes (/admin, /login, /booking, /coupons) still need.
export const metadata = {
  metadataBase: new URL(SITE_URL),
  // No `template` here: every page/layout below already brands its own
  // title with "| GeorgiaTrips" (see [locale]/layout.js and each page.js).
  // A parent template augments (wraps) any plain-string title a descendant
  // sets, so keeping one here would double the suffix on every page.
  title: "GeorgiaTrips — Premium Tours & Transfers in Georgia",
  description: "Discover Georgia in comfort and luxury with GeorgiaTrips.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "apple-touch-icon-precomposed",
        url: "/apple-touch-icon-precomposed.png",
      },
    ],
  },
  manifest: "/manifest.json",
  authors: [
    { name: "GeorgiaTrips", url: "https://georgiatrips.ge" },
    { name: "Manuchar Lominadze", url: "https://www.instagram.com/lominadzee10/" },
  ],
  creator: "Manuchar Lominadze (@lominadzee10)",
  publisher: "GeorgiaTrips",
  verification: {
    google: "pqDpqUT-VHHamkaxnisNnk8LO2z-v0EdXak_z77V86U",
    yandex: "b8d0557b47549680",
    other: {
      "facebook-domain-verification": "ef9kax36lazdya98y738pn5e10ny2e",
    },
  },
  other: {
    "facebook-domain-verification": "ef9kax36lazdya98y738pn5e10ny2e",
    "developer": "Manuchar Lominadze (https://www.instagram.com/lominadzee10/)",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({ children }) {
  const [cookieStore, requestHeaders] = await Promise.all([cookies(), headers()]);

  // SEO-critical <html lang>/<dir> must reflect the URL (via middleware's
  // x-georgiatrips-locale header), not client cookie state — Googlebot never
  // sends the cookie. The cookie is only the fallback for non-locale routes
  // (/admin, /login, /booking, /coupons) that have no URL locale segment.
  const urlLocale = requestHeaders.get("x-georgiatrips-locale");
  const cookieLang = cookieStore.get("gt_language")?.value;
  const htmlLang = getRequestLocale(urlLocale || cookieLang);
  const htmlDir = isRtlLanguage(htmlLang) ? "rtl" : "ltr";

  return (
    <html
      lang={htmlLang}
      dir={htmlDir}
      className={`${notoGeorgian.variable} ${notoSerifGeorgian.variable} ${playfair.variable} ${playfairCyrillic.variable} ${notoArabic.variable} ${notoNaskhArabic.variable}`}
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://georgiatripsge.firebaseapp.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://firestore.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://connect.facebook.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://georgiatripsge.firebaseapp.com" />
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />

        {/* Meta Pixel Code (Direct in Head for Meta Crawler & Verification) */}
        <script
          id="fb-pixel-base"
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && typeof Node !== 'undefined' && !Node.prototype.getBoundingClientRect) {
                Node.prototype.getBoundingClientRect = function() {
                  if (this.parentElement && typeof this.parentElement.getBoundingClientRect === 'function') {
                    return this.parentElement.getBoundingClientRect();
                  }
                  return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0 };
                };
              }
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '4302985556633819');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=4302985556633819&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
      </head>
      <body>
        <LanguageProvider initialLang={htmlLang}>
          <CurrencyProvider>
            <AuthProvider>
              <CouponProvider>
                {children}
                <Suspense fallback={null}>
                  <AnalyticsTracker />
                </Suspense>
                <CookieConsent />
                <WelcomeCouponPopup />
                <Suspense fallback={null}>
                  <ScrollReveal />
                </Suspense>
              </CouponProvider>
            </AuthProvider>
          </CurrencyProvider>
        </LanguageProvider>

        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').catch(function() {});
              });
            }
          `}
        </Script>

        {/* Google Analytics 4 */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="lazyOnload"
            />
            <Script id="google-analytics" strategy="lazyOnload">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `}
            </Script>
          </>
        )}

        {/* Microsoft Clarity (Free Screen Recordings & Heatmaps) */}
        {process.env.NEXT_PUBLIC_CLARITY_ID && (
          <Script id="ms-clarity" strategy="lazyOnload">
            {`
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_ID}");
            `}
          </Script>
        )}
      </body>
    </html>
  );
}
