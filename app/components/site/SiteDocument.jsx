// The shared <html> document for every root layout: app/[locale]/layout.js
// (public, statically rendered pages) and the account/admin root layouts.
// It must not read cookies() or headers(): that would make every public page
// render dynamically on each request.
import { Suspense, ViewTransition } from "react";
import { Noto_Sans_Georgian, Noto_Serif_Georgian, Playfair_Display, Noto_Sans_Arabic, Noto_Naskh_Arabic } from "next/font/google";
import Script from "next/script";
import "../../globals.css";
import "../../coupon.css";
import "../../styles/site.css";
import "../../styles/chrome.css";
import "../../styles/datepicker.css";
import "../../styles/page-hero.css";
import "../../styles/motion.css";
import { AuthProvider } from "../../lib/AuthContext";
import { LanguageProvider } from "../../lib/i18n/LanguageContext";
import { CurrencyProvider } from "../../lib/currency/CurrencyContext";
import { CouponProvider } from "../../lib/CouponContext";
import { isRtlLanguage } from "../../lib/i18n/locale";
import { getMessages } from "../../lib/i18n/translate";
import CookieConsent from "../CookieConsent";
import AnalyticsTracker from "../AnalyticsTracker";
import WelcomeCouponPopup from "../WelcomeCouponPopup";
import ScrollReveal from "./ScrollReveal";

// Variable fonts: one file per family/subset instead of one per weight.
const notoGeorgian = Noto_Sans_Georgian({
  variable: "--font-noto-georgian",
  subsets: ["georgian"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

// Headings use the serif fonts, so they are preloaded too: otherwise they are
// discovered late and every reload visibly swaps from a fallback font.
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

// Not preloaded: only /ar pages use it, and unicode-range keeps it from
// downloading elsewhere. Preloading made every Georgian/English page fetch it.
const notoArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  preload: false,
  adjustFontFallback: true,
});

export default function SiteDocument({ lang, children }) {
  return (
    <html
      suppressHydrationWarning
      lang={lang}
      dir={isRtlLanguage(lang) ? "rtl" : "ltr"}
      className={`${notoGeorgian.variable} ${notoSerifGeorgian.variable} ${playfair.variable} ${playfairCyrillic.variable} ${notoArabic.variable} ${notoNaskhArabic.variable}`}
    >
      <head>
        {/* Runs before the first paint: a visitor who was signed in last time sees
            their name in the header at once instead of "Login" flashing first.
            AuthProvider clears the flag if the session has ended. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("gt_user_logged_in")==="true"){var d=document.documentElement;d.setAttribute("data-auth","in");d.style.setProperty("--gt-user-name",JSON.stringify(localStorage.getItem("gt_user_display_name")||""))}}catch(e){}`,
          }}
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://firestore.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body>
        <LanguageProvider initialLang={lang} messages={getMessages(lang)}>
          <CurrencyProvider>
            <AuthProvider>
              <CouponProvider>
                {/* Page changes crossfade; styles in styles/motion.css (.gt-page). */}
                <ViewTransition default="gt-page">{children}</ViewTransition>
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

        {/* Meta Pixel Code (Deferred afterInteractive to prevent render blocking) */}
        <Script id="fb-pixel-init" strategy="lazyOnload">
          {`
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
          `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=4302985556633819&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>

        {/* The service worker caches /_next/static files. In development those
            file names do not change when their content does, so it would keep
            serving stale CSS/JS: register it only in production, and remove
            any earlier registration (and its cache) during development. */}
        <Script id="register-sw" strategy="afterInteractive">
          {process.env.NODE_ENV === "production"
            ? `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').catch(function() {});
              });
            }
          `
            : `
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then(function(list) {
                list.forEach(function(r) { r.unregister(); });
              });
              if (window.caches) {
                caches.keys().then(function(keys) {
                  keys.forEach(function(k) { if (k.indexOf('georgiatrips') === 0) caches.delete(k); });
                });
              }
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
