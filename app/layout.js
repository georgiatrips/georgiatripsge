import { Suspense } from "react";
import { Noto_Sans_Georgian, Noto_Serif_Georgian, Playfair_Display, Noto_Sans_Arabic } from "next/font/google";
import { cookies, headers } from "next/headers";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "./lib/AuthContext";
import { LanguageProvider } from "./lib/i18n/LanguageContext";
import { CurrencyProvider } from "./lib/currency/CurrencyContext";
import { isRtlLanguage } from "./lib/i18n/locale";
import CookieConsent from "./components/CookieConsent";
import AnalyticsTracker from "./components/AnalyticsTracker";
import WelcomeCouponPopup from "./components/WelcomeCouponPopup";

const notoGeorgian = Noto_Sans_Georgian({
  variable: "--font-noto-georgian",
  subsets: ["georgian"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const notoSerifGeorgian = Noto_Serif_Georgian({
  variable: "--font-noto-serif-georgian",
  subsets: ["georgian"],
  weight: ["600", "700", "800"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

import { SOCIAL_PROFILES, FAQS_BY_LANG } from "./lib/shared";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0d233a",
};

export async function generateMetadata() {
  const [cookieStore, requestHeaders] = await Promise.all([cookies(), headers()]);
  const storedLang = cookieStore.get("gt_language")?.value || "ka";
  const lang = ["ka", "en", "ru", "tr", "ar"].includes(storedLang) ? storedLang : "ka";
  const currentPath = requestHeaders.get("x-georgiatrips-path") || `/${lang}`;
  const pathWithoutLocale = currentPath.replace(/^\/(?:ka|en|ru|tr|ar)(?=\/|$)/, "") || "/";
  const localizedUrl = (locale) => `https://georgiatrips.ge/${locale}${pathWithoutLocale === "/" ? "" : pathWithoutLocale}`;

  const metaByLang = {
    ka: {
      title: {
        default: "GeorgiaTrips — პრემიუმ ტურები და ტრანსფერები საქართველოში",
        template: "%s | GeorgiaTrips",
      },
      description:
        "აღმოაჩინე საქართველო უმაღლესი კომფორტით. ერთდღიანი და მრავალდღიანი ტურები ბათუმში, თბილისში, ყაზბეგში, მარტვილში, კახეთსა და სვანეთში. VIP ტრანსპორტი, გამოცდილი გიდები და 24/7 მხარდაჭერა.",
      keywords:
        "ტურები საქართველოში, ტურები ბათუმში, ტურები თბილისიდან, ყაზბეგის ტური, კახეთის ღვინის ტური, მარტვილის კანიონი, პრომეთეს მღვიმე, სვანეთის ტური, ტრანსფერი საქართველოში, მძღოლი საქართველოში, VIP ტურები, GeorgiaTrips",
      locale: "ka_GE",
      ogTitle: "GeorgiaTrips — პრემიუმ ტურები და ექსკურსიები საქართველოში",
      ogDesc: "აღმოაჩინე კავკასიის სილამაზე კომფორტით. VIP მომსახურება, ინდივიდუალური და ჯგუფური ტურები.",
    },
    en: {
      title: {
        default: "GeorgiaTrips — Premium Tours, Excursions & Private Transfers in Georgia",
        template: "%s | GeorgiaTrips",
      },
      description:
        "Discover Georgia in comfort and luxury. Best day trips and multi-day tours from Batumi, Tbilisi, Kazbegi, Martvili Canyon, Kakheti wine region, and Svaneti. VIP transport, certified guides, 24/7 WhatsApp booking.",
      keywords:
        "Georgia tours, tours in Georgia, Batumi day trips, Tbilisi private tours, Kazbegi day tour, Kakheti wine tour, Martvili canyon tour, Prometheus cave, Svaneti 4x4 tour, Kutaisi airport transfers to Gudauri, private driver Georgia, Georgia travel agency, GeorgiaTrips, Halal tours Georgia",
      locale: "en_US",
      ogTitle: "GeorgiaTrips — Premium Tours & Guided Excursions in Georgia",
      ogDesc: "Discover the beauty of the Caucasus with comfort and luxury. VIP service, private & group tours, airport transfers.",
    },
    ru: {
      title: {
        default: "GeorgiaTrips — Премиум экскурсии, туры и трансферы по Грузии",
        template: "%s | GeorgiaTrips",
      },
      description:
        "Откройте для себя Грузию с максимальным комфортом. Однодневные и многодневные экскурсии из Батуми и Тбилиси: Казбеги, Кахетия, каньон Мартвили, Сванетия. VIP транспорт, русскоязычные гиды, трансферы 24/7.",
      keywords:
        "туры по Грузии, экскурсии из Батуми, экскурсии в Тбилиси, тур в Казбеги, винный тур в Кахетию, каньон Мартвили, пещера Прометея, трансфер из аэропорта Кутаиси в Гудаури, индивидуальный гид Грузия, аренда авто с водителем Грузия, GeorgiaTrips",
      locale: "ru_RU",
      ogTitle: "GeorgiaTrips — Премиум туры и экскурсии по Грузии",
      ogDesc: "Откройте для себя красоту Кавказа с комфортом. VIP сервис, индивидуальные и групповые туры, трансферы.",
    },
    tr: {
      title: {
        default: "GeorgiaTrips — Gürcistan'da Premium Turlar, Geziler ve Özel Transferler",
        template: "%s | GeorgiaTrips",
      },
      description:
        "Gürcistan'ı üstün konforla keşfedin. Batum çıkışlı günübirlik turlar, Tiflis, Kazbegi, Kaheti şarap turları ve Martvili kanyonu. Türkçe rehberler, VIP transferler ve 7/24 destek.",
      keywords:
        "Gürcistan turları, Batum günübirlik turlar, Batum çıkışlı geziler, Tiflis turu, Kazbegi turu, Kaheti şarap turu, Martvili kanyonu, Kutaisi havalimanı transferi, Gürcistan Türkçe rehber, Gürcistan özel şoför, Batum transfer, GeorgiaTrips",
      locale: "tr_TR",
      ogTitle: "GeorgiaTrips — Gürcistan'da Premium Turlar ve Geziler",
      ogDesc: "Kafkasya'nın güzelliklerini konfor ve lüksle keşfedin. VIP hizmet, özel ve grup turları, havaalanı transferleri.",
    },
    ar: {
      title: {
        default: "GeorgiaTrips — جولات سياحية فاخرة وتوصيل خاص وسائق في جورجيا",
        template: "%s | GeorgiaTrips",
      },
      description:
        "اكتشف جمال وسحر جورجيا بأعلى درجات الراحة والفخامة. جولات يومية مميزة من باتومي وتبليسي: كازبيجي، قوداوري، برجومي، كاخيتي، ومارتفيلي. سيارات خاصة VIP، سائقون محترفون، فنادق ومطاعم حلال، ودعم 24/7.",
      keywords:
        "رحلات جورجيا, جولات سياحية في جورجيا, سائق خاص في جورجيا, جولات باتومي اليومية, جولات تبليسي, كازبيجي وقوداوري, برجومي وباكورياني, رحلات عائلية جورجيا, فنادق حلال جورجيا, توصيل مطار كوتايسي, مرشد سياحي جورجيا, GeorgiaTrips",
      locale: "ar_SA",
      ogTitle: "GeorgiaTrips — جولات سياحية فاخرة في جورجيا",
      ogDesc: "اكتشف سحر القوقاز مع خدمات VIP وجولات سياحية خاصة وجماعية مصممة خصيصاً للعائلات مع سيارة وسائق خاص.",
    },
  };

  const curr = metaByLang[lang] || metaByLang.ka;

  return {
    metadataBase: new URL("https://georgiatrips.ge"),
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
    title: curr.title,
    description: curr.description,
    keywords: curr.keywords,
    alternates: {
      canonical: localizedUrl(lang),
      languages: {
        "ka-GE": localizedUrl("ka"),
        "en-US": localizedUrl("en"),
        "ru-RU": localizedUrl("ru"),
        "tr-TR": localizedUrl("tr"),
        "ar-SA": localizedUrl("ar"),
      },
    },
    openGraph: {
      title: curr.ogTitle,
      description: curr.ogDesc,
      url: localizedUrl(lang),
      siteName: "GeorgiaTrips",
      locale: curr.locale,
      type: "website",
      images: [
        {
          url: "/hero.webp",
          width: 1200,
          height: 630,
          alt: curr.ogTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: curr.ogTitle,
      description: curr.ogDesc,
      images: ["/hero.webp"],
    },
    verification: {
      google: "pqDpqUT-VHHamkaxnisNnk8LO2z-v0EdXak_z77V86U",
      yandex: "b8d0557b47549680",
      other: {
        "facebook-domain-verification": "ef9kax36lazdya98y738pn5e10ny2e",
      },
    },
    other: {
      "facebook-domain-verification": "ef9kax36lazdya98y738pn5e10ny2e",
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
}

function buildStructuredData(lang = "ka") {
  const faqs = FAQS_BY_LANG[lang] || FAQS_BY_LANG.ka || [];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["TravelAgency", "Organization"],
        "@id": "https://georgiatrips.ge/#organization",
        name: "GeorgiaTrips",
        legalName: "GeorgiaTrips",
        url: "https://georgiatrips.ge",
        logo: "https://georgiatrips.ge/logo.png",
        image: "https://georgiatrips.ge/hero.webp",
        description: "Premium tours, private excursions, and VIP transfers in Georgia (Tbilisi, Batumi, Kazbegi, Kakheti, Svaneti).",
        telephone: "+995504220020",
        email: "info@georgiatrips.ge",
        priceRange: "$$",
        currenciesAccepted: "GEL, USD, EUR, TRY, SAR, AED",
        paymentAccepted: "Cash, Credit Card, Bank Transfer, Online Payment",
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.9",
          reviewCount: "128",
          bestRating: "5",
          worstRating: "1",
        },
        areaServed: [
          { "@type": "Country", name: "Georgia" },
          { "@type": "AdministrativeArea", name: "Adjara" },
          { "@type": "City", name: "Batumi" },
          { "@type": "City", name: "Tbilisi" },
          { "@type": "City", name: "Kutaisi" },
        ],
        address: {
          "@type": "PostalAddress",
          addressLocality: "Batumi",
          addressRegion: "Adjara",
          addressCountry: "GE",
        },
        sameAs: SOCIAL_PROFILES,
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          opens: "00:00",
          closes: "23:59",
        },
      },
      {
        "@type": "WebSite",
        "@id": "https://georgiatrips.ge/#website",
        url: "https://georgiatrips.ge",
        name: "GeorgiaTrips",
        publisher: {
          "@id": "https://georgiatrips.ge/#organization",
        },
        potentialAction: {
          "@type": "SearchAction",
          target: "https://georgiatrips.ge/tours?search={search_term_string}",
          "query-input": "required name=search_term_string",
        },
        inLanguage: ["ka", "en", "ru", "tr", "ar"],
      },
      {
        "@type": "FAQPage",
        "@id": "https://georgiatrips.ge/#faq",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.a,
          },
        })),
      },
    ],
  };
}

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const storedLang = cookieStore.get("gt_language")?.value || "ka";
  const htmlLang = ["ka", "en", "ru", "tr", "ar"].includes(storedLang) ? storedLang : "ka";
  const htmlDir = isRtlLanguage(htmlLang) ? "rtl" : "ltr";
  const jsonLd = buildStructuredData(htmlLang);

  return (
    <html
      lang={htmlLang}
      dir={htmlDir}
      className={`${notoGeorgian.variable} ${notoSerifGeorgian.variable} ${playfair.variable} ${notoArabic.variable}`}
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
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <LanguageProvider initialLang={htmlLang}>
          <CurrencyProvider>
            <AuthProvider>
              {children}
              <Suspense fallback={null}>
                <AnalyticsTracker />
              </Suspense>
              <CookieConsent />
              <WelcomeCouponPopup />
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

        {/* Meta Pixel (Facebook & Instagram Ads) */}
        <Script id="meta-pixel" strategy="lazyOnload">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID || "3699690433512409"}');
            fbq('track', 'PageView');
          `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_META_PIXEL_ID || "3699690433512409"}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>

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
