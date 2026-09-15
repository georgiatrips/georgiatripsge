import { notFound } from "next/navigation";
import { SUPPORTED_LANGUAGES } from "../lib/i18n/locale";
import { SITE_URL, buildLocalizedMetadata } from "../lib/siteConfig";
import { SOCIAL_PROFILES, FAQS_BY_LANG, EMAIL } from "../lib/shared";

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
      "აღმოაჩინე საქართველო უმაღლესი კომფორტით. ერთდღიანი და მრავალდღიანი ტურები ბათუმში, თბილისში, ყაზბეგში, მარტვილში, კახეთსა და სვანეთში. VIP ტრანსპორტი, გამოცდილი გიდები და 24/7 მხარდაჭერა.",
  },
  en: {
    title: "GeorgiaTrips — Premium Tours, Excursions & Private Transfers in Georgia",
    description:
      "Discover Georgia in comfort and luxury. Best day trips and multi-day tours from Batumi, Tbilisi, Kazbegi, Martvili Canyon, Kakheti wine region, and Svaneti. VIP transport, certified guides, 24/7 WhatsApp booking.",
  },
  ru: {
    title: "GeorgiaTrips — Премиум экскурсии, туры и трансферы по Грузии",
    description:
      "Откройте для себя Грузию с максимальным комфортом. Однодневные и многодневные экскурсии из Батуми и Тбилиси: Казбеги, Кахетия, каньон Мартвили, Сванетия. VIP транспорт, русскоязычные гиды, трансферы 24/7.",
  },
  tr: {
    title: "GeorgiaTrips — Gürcistan'da Premium Turlar, Geziler ve Özel Transferler",
    description:
      "Gürcistan'ı üstün konforla keşfedin. Batum çıkışlı günübirlik turlar, Tiflis, Kazbegi, Kaheti şarap turları ve Martvili kanyonu. Türkçe rehberler, VIP transferler ve 7/24 destek.",
  },
  ar: {
    title: "GeorgiaTrips — جولات سياحية فاخرة وتوصيل خاص وسائق في جورجيا",
    description:
      "اكتشف جمال وسحر جورجيا بأعلى درجات الراحة والفخامة. جولات يومية مميزة من باتومي وتبليسي: كازبيجي، قوداوري، برجومي، كاخيتي، ومارتفيلي. سيارات خاصة VIP، سائقون محترفون، فنادق ومطاعم حلال، ودعم 24/7.",
  },
};

export function generateStaticParams() {
  return SUPPORTED_LANGUAGES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const copy = HOME_COPY[locale] || HOME_COPY.ka;

  return buildLocalizedMetadata({
    path: "/",
    lang: locale,
    title: copy.title,
    description: copy.description,
    image: "/hero.webp",
  });
}

function buildStructuredData(lang = "ka") {
  const faqs = FAQS_BY_LANG[lang] || FAQS_BY_LANG.ka || [];

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
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/${lang}/tours?search={search_term_string}`,
          "query-input": "required name=search_term_string",
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
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/${lang}#faq`,
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

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;

  if (!SUPPORTED_LANGUAGES.includes(locale)) {
    notFound();
  }

  const jsonLd = buildStructuredData(locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
