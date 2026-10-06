import Link from "next/link";
import { notFound } from "next/navigation";
import LandingShell from "../../../components/site/LandingShell";
import RouteLinks from "../../../components/transfers/RouteLinks";
import { getCachedTransferPricing } from "../../../lib/server/cachedData";
import { SITE_URL, getRequestLocale, buildLocalizedMetadata, getLocalizedHref } from "../../../lib/siteConfig";
import { whatsappHref } from "../../../lib/shared";
import { landingUi } from "../../../lib/landingUi";
import { VEHICLES } from "../../../lib/vehicles";
import { TRANSFER_VEHICLE_KEYS } from "../../../lib/transfers/pricing";
import {
  DESTINATION_NOTES,
  ROUTE_PAGES,
  calculatorHref,
  findReverseRoutePage,
  getRoutePage,
  locationName,
  quoteRoutePage,
  routeCopy,
  routePagePath,
} from "../../../lib/transfers/routePages";

// Every route page is known at build time; any other slug is a real 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return ROUTE_PAGES.map((route) => ({ route: route.slug }));
}

export async function generateMetadata({ params }) {
  const { locale, route: slug } = await params;
  const lang = getRequestLocale(locale);
  const route = getRoutePage(slug);
  if (!route) return {};
  const pricing = await getCachedTransferPricing();
  const quote = quoteRoutePage(route, pricing, lang);
  const copy = routeCopy(lang);
  const a = locationName(route.from, lang);
  const b = locationName(route.to, lang);

  return buildLocalizedMetadata({
    path: routePagePath(route),
    lang,
    title: copy.metaTitle(a, b, quote),
    description: copy.metaDescription(a, b, quote),
    image: "/2car.webp",
  });
}

export default async function TransferRoutePage({ params }) {
  const { locale, route: slug } = await params;
  const lang = getRequestLocale(locale);
  const route = getRoutePage(slug);
  if (!route) notFound();

  const pricing = await getCachedTransferPricing();
  const quote = quoteRoutePage(route, pricing, lang);
  if (!quote) notFound();

  const copy = routeCopy(lang);
  const ui = landingUi(lang);
  const a = locationName(route.from, lang);
  const b = locationName(route.to, lang);
  const faqs = copy.faqs(a, b, quote);
  const note = DESTINATION_NOTES[route.to]?.[lang] || DESTINATION_NOTES[route.to]?.en;
  const reverse = findReverseRoutePage(route);
  const related = ROUTE_PAGES.filter((r) => r.from === route.from && r.slug !== route.slug);
  const bookHref = getLocalizedHref(calculatorHref(route.from, route.to), lang);
  const waHref = whatsappHref(copy.waText(a, b));

  const pageUrl = `${SITE_URL}/${lang}${routePagePath(route)}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["TaxiService", "Service"],
        "@id": `${pageUrl}#service`,
        name: copy.title(a, b),
        description: copy.summary(a, b, quote),
        url: pageUrl,
        inLanguage: lang,
        serviceType: "Private transfer",
        provider: { "@id": `${SITE_URL}/#organization` },
        areaServed: [
          { "@type": "Place", name: locationName(route.from, "en") },
          { "@type": "Place", name: locationName(route.to, "en") },
        ],
        offers: TRANSFER_VEHICLE_KEYS.filter((key) => quote.fares[key] != null).map((key) => ({
          "@type": "Offer",
          name: copy.vehicles[key],
          price: quote.fares[key],
          priceCurrency: "GEL",
          eligibleQuantity: { "@type": "QuantitativeValue", maxValue: VEHICLES[key].capacityPax, unitText: "passengers" },
          availability: "https://schema.org/InStock",
          url: pageUrl,
        })),
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumbs`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: ui.home, item: `${SITE_URL}/${lang}` },
          { "@type": "ListItem", position: 2, name: copy.crumbTransfers, item: `${SITE_URL}/${lang}/transfers` },
          { "@type": "ListItem", position: 3, name: `${a} → ${b}`, item: pageUrl },
        ],
      },
    ],
  };

  return (
    <LandingShell active="transfers" jsonLd={jsonLd}>
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <nav className="landing-breadcrumbs" aria-label="Breadcrumb">
            <Link href={getLocalizedHref("/", lang)}>{ui.home}</Link>
            <span className="sep">/</span>
            <Link href={getLocalizedHref("/transfers", lang)}>{copy.crumbTransfers}</Link>
            <span className="sep">/</span>
            <span>
              {a} → {b}
            </span>
          </nav>
          <div className="landing-badge">🚐 {copy.badge}</div>
          <h1 className="landing-title">{copy.title(a, b)}</h1>

          <div className="landing-facts">
            <div className="landing-fact">
              <span className="landing-fact-label">{copy.distance}</span>
              <span className="landing-fact-value" dir="ltr">{quote.km} km</span>
            </div>
            <div className="landing-fact">
              <span className="landing-fact-label">{copy.time}</span>
              <span className="landing-fact-value">{quote.duration}</span>
            </div>
            <div className="landing-fact">
              <span className="landing-fact-label">{copy.from}</span>
              <span className="landing-fact-value" dir="ltr">₾{quote.minFare}</span>
            </div>
          </div>

          <p className="landing-answer">{copy.summary(a, b, quote)}</p>

          <div className="landing-hero-actions">
            <Link href={bookHref} className="landing-btn-primary" prefetch={false}>
              🗓️ {copy.book}
            </Link>
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="landing-btn-secondary">
              💬 {copy.whatsapp}
            </a>
          </div>
        </div>
      </section>

      <section className="landing-section" id="prices">
        <div className="landing-section-header">
          <div className="landing-section-tag">{ui.pricingTag}</div>
          <h2 className="landing-section-title">{copy.pricesTitle}</h2>
          <p className="landing-section-desc">{copy.pricesNote}</p>
        </div>
        <div className="landing-table-wrap">
          <table className="landing-table">
            <thead>
              <tr>
                {copy.headers.map((th) => (
                  <th key={th}>{th}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TRANSFER_VEHICLE_KEYS.map((key) => (
                <tr key={key}>
                  <td style={{ fontWeight: 700 }}>{copy.vehicles[key]}</td>
                  <td className="price-val" dir="ltr">{quote.fares[key] != null ? `₾${quote.fares[key]}` : "—"}</td>
                  <td dir="ltr">1–{VEHICLES[key].capacityPax}</td>
                  <td dir="ltr">{VEHICLES[key].capacityBags}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {quote.isSvaneti ? <p className="landing-note">{copy.svanetiNote}</p> : null}
      </section>

      <section className="landing-section" style={{ paddingTop: 0 }}>
        <div className="landing-section-header">
          <h2 className="landing-section-title">{copy.includedTitle}</h2>
        </div>
        <ul className="landing-steps">
          {copy.included.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      {note ? (
        <section className="landing-section" style={{ paddingTop: 0 }}>
          <div className="landing-section-header">
            <h2 className="landing-section-title">{copy.aboutTitle(b)}</h2>
          </div>
          <div className="landing-prose">
            <p>{note}</p>
          </div>
        </section>
      ) : null}

      <section className="landing-section" style={{ paddingTop: 0 }}>
        <div className="landing-section-header">
          <div className="landing-section-tag">{ui.faqTag}</div>
          <h2 className="landing-section-title">{copy.faqTitle}</h2>
        </div>
        <div className="landing-faq-grid">
          {faqs.map((faq) => (
            <div key={faq.q} className="landing-faq-item">
              <h3 className="landing-faq-q">❓ {faq.q}</h3>
              <p className="landing-faq-a">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section" style={{ paddingTop: 0 }}>
        <div className="landing-section-header">
          <h2 className="landing-section-title">{copy.relatedTitle(a)}</h2>
        </div>
        <RouteLinks routes={[...(reverse ? [reverse] : []), ...related]} lang={lang} pricing={pricing} />
        <p className="landing-note">
          <Link href={getLocalizedHref("/transfers", lang)} prefetch={false}>
            {copy.allRoutes} →
          </Link>
        </p>

        <div className="landing-cta-banner">
          <h2>{copy.title(a, b)}</h2>
          <p>{ui.bookingNote}</p>
          <Link href={bookHref} className="landing-btn-primary" prefetch={false}>
            🗓️ {copy.book}
          </Link>
        </div>
      </section>
    </LandingShell>
  );
}
