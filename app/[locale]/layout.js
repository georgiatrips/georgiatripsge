import { notFound } from "next/navigation";
import { SUPPORTED_LANGUAGES } from "../lib/i18n/locale";
import { SITE_URL, buildLocalizedMetadata } from "../lib/siteConfig";
import { BASE_METADATA } from "../lib/baseMetadata";
import SiteDocument from "../components/site/SiteDocument";

export { viewport } from "../lib/baseMetadata";

// This is the root layout for all public pages (there is no app/layout.js), so
// the <html lang> comes straight from the URL without reading request headers
// or cookies. That keeps these pages statically rendered and CDN-cacheable;
// cached data is refreshed hourly or on demand via /api/admin/revalidate.
export const revalidate = 3600;
import { SOCIAL_PROFILES, EMAIL } from "../lib/shared";

// Plain-string titles (not { default, template }): title is a top-level
// metadata key, so a { default, template } object here would fully replace
// the root layout's title object per Next's shallow-merge rules, and
// buildLocalizedMetadata reuses the same string for openGraph.title/
// twitter.title, which only accept strings — not the {default,template}
// shape.
const HOME_COPY = {
  ka: {
    title: "GeorgiaTrips — პრემიუმ ტურები და ტრანსფერები საქართველოში",
    description:
      "ერთდღიანი ტურები, ინდივიდუალური მოგზაურობა და აეროპორტის ტრანსფერები მთელ საქართველოში — ბათუმში დაფუძნებული ადგილობრივი გუნდისგან. რეალური თარიღები, მკაფიო ფასები, გადახდა ტურის დღეს და WhatsApp მხარდაჭერა 24/7.",
  },
  en: {
    title: "GeorgiaTrips — Premium Tours, Excursions & Private Transfers in Georgia",
    description:
      "Day tours, private trips and airport transfers across Georgia with a local team based in Batumi. Real dates, clear prices, pay on the day and WhatsApp support 24/7.",
  },
  ru: {
    title: "GeorgiaTrips — Премиум экскурсии, туры и трансферы по Грузии",
    description:
      "Однодневные туры, индивидуальные поездки и трансферы из аэропорта по всей Грузии от местной команды из Батуми. Реальные даты, понятные цены, оплата в день тура и поддержка в WhatsApp 24/7.",
  },
  tr: {
    title: "GeorgiaTrips — Gürcistan'da Premium Turlar, Geziler ve Özel Transferler",
    description:
      "Batum merkezli yerel ekibimizle Gürcistan genelinde günübirlik turlar, özel seyahatler ve havalimanı transferleri. Gerçek tarihler, net fiyatlar, tur günü ödeme ve 7/24 WhatsApp desteği.",
  },
  ar: {
    title: "GeorgiaTrips — جولات سياحية فاخرة وتوصيل خاص وسائق في جورجيا",
    description:
      "جولات يومية ورحلات خاصة وتوصيل من المطار في جميع أنحاء جورجيا مع فريق محلي مقره باتومي. مواعيد حقيقية وأسعار واضحة والدفع يوم الجولة ودعم عبر واتساب على مدار الساعة.",
  },
};

export function generateStaticParams() {
  return SUPPORTED_LANGUAGES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const copy = HOME_COPY[locale] || HOME_COPY.ka;

  return {
    ...BASE_METADATA,
    ...buildLocalizedMetadata({
      path: "/",
      lang: locale,
      title: copy.title,
      description: copy.description,
      image: "/hero.webp",
    }),
  };
}

// Site-wide entities only. FAQPage markup lives on the homepage, next to the
// visible FAQ it describes (Google requires FAQ markup to match on-page Q&A).
function buildStructuredData(lang = "ka") {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["TravelAgency", "Organization"],
        "@id": `${SITE_URL}/#organization`,
        name: "GeorgiaTrips",
        legalName: "GeorgiaTrips",
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
        image: `${SITE_URL}/hero.webp`,
        description: "Premium tours, private excursions, and VIP transfers in Georgia (Tbilisi, Batumi, Kazbegi, Kakheti, Svaneti).",
        telephone: "+995504220020",
        email: EMAIL,
        priceRange: "$$",
        currenciesAccepted: "GEL, USD, EUR",
        paymentAccepted: "Cash, Credit Card, Bank Transfer, Online Payment",
        // NOTE: a fabricated aggregateRating (4.9 / 128 reviews) previously lived
        // here with no real Review data behind it — a structured-data spam risk
        // per Google's guidelines. Removed. Re-add only once wired to genuine,
        // on-page-visible review data (e.g. via /api/google-reviews).
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
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "GeorgiaTrips",
        publisher: {
          "@id": `${SITE_URL}/#organization`,
        },
        creator: {
          "@type": "Person",
          "@id": "https://www.instagram.com/lominadzee10/#person",
          name: "Manuchar Lominadze",
          url: "https://www.instagram.com/lominadzee10/",
          sameAs: ["https://www.instagram.com/lominadzee10/"],
          jobTitle: "Lead Full-Stack Web Developer & UI/UX Designer",
        },
        inLanguage: SUPPORTED_LANGUAGES,
      },
      {
        "@type": "Person",
        "@id": "https://www.instagram.com/lominadzee10/#person",
        name: "Manuchar Lominadze",
        url: "https://www.instagram.com/lominadzee10/",
        sameAs: ["https://www.instagram.com/lominadzee10/"],
        jobTitle: "Lead Full-Stack Web Developer & UI/UX Designer",
        knowsAbout: ["Full-Stack Web Development", "Next.js", "React", "UI/UX Engineering", "Search Engine Optimization (SEO)"],
      },
    ],
  };
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;

  if (!SUPPORTED_LANGUAGES.includes(locale)) {
    notFound();
  }

  const jsonLd = buildStructuredData(locale);

  return (
    <SiteDocument lang={locale}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </SiteDocument>
  );
}
