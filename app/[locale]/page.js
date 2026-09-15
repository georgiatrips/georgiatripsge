import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import TourPrice from "../components/TourPrice";
import TourCard from "../components/site/TourCard";
import TripPlannerForm from "../components/homepage/TripPlannerForm";
import { getCachedPlaces, getCachedReviews, getCachedTours } from "../lib/server/cachedData";
import { formatTourDate, toTourViews } from "../lib/tourView";
import { getTranslator, interpolate } from "../lib/i18n/translate";
import { getLocalizedHref, getRequestLocale, SITE_URL } from "../lib/siteConfig";
import { asLocalizedText } from "../lib/toursFirestore";
import { INSTAGRAM_LINK, PHONE_DISPLAY, PHONE_TEL, whatsappHref } from "../lib/shared";
import {
  ArrowRightIcon, BriefcaseIcon, CalendarIcon, CarIcon, CheckIcon, CompassIcon, HeadsetIcon, HeartIcon,
  InstagramIcon, LanguagesIcon, LocationIcon, PlaneIcon, PlusIcon, RouteIcon, ShieldCheckIcon, StarIcon,
  UsersIcon, WalletIcon, WhatsAppIcon,
} from "../components/Icons";
import "../styles/home.css";

const HERO_IMAGE = "/mestia.webp";

// Editorial copy lives in the dictionaries; data (availability, images of
// region-backed cards) comes from Firestore. Regions without tours are
// offered honestly as private trips on request — never with invented prices.
const DESTINATIONS = [
  { key: "Adjara", region: "აჭარა", image: "/batumi.webp", large: true },
  { key: "Martvili", region: "სამეგრელო-ზემო სვანეთი", large: true },
  { key: "Kazbegi", image: "/gudauri.webp" },
  { key: "Tbilisi", image: "/tbilisi.webp" },
  { key: "Kakheti", image: "/kakheti.webp" },
];

const EXPERIENCES = [
  { id: "YIf1fcOfsd9ZqtmUCP2i", theme: "themeWaterfall" },
  { id: "VRkDXUdauIj1PJZ6egHg", theme: "themeCanyon" },
  { id: "xZyxVy23YUkQma2HzERv", theme: "themeCave" },
  { id: "scXrVIBzocf6Uz2VSAF6", theme: "themeFortress" },
  { id: "7KJqeUVeupxZYBoBOZ31", theme: "themeBridge" },
  { id: "vOFTdOn6pi5ixb8WB6UB", theme: "themeSea" },
];

const LOCAL_PLACES = ["951HRNyT4ZnM6g941Zdj", "iF4vA204CjLac5IeYWqD", "yuKnw68R7Ds14dRTg4x1", "DPlmvqINdZC4D8Pj6rcp"];

const FAQ_KEYS = [
  ["homepage.faqQ7", "homepage.faqA7"],
  ["faq.q1", "faq.a1"],
  ["faq.q3", "faq.a3"],
  ["faq.q6", "faq.a6"],
  ["homepage.faqQ8", "homepage.faqA8"],
  ["homepage.faqQ9", "homepage.faqA9"],
  ["faq.q5", "faq.a5"],
  ["homepage.faqQ11", "homepage.faqA11"],
  ["homepage.faqQ10", "homepage.faqA10"],
  ["faq.q2", "faq.a2"],
  ["faq.q4", "faq.a4"],
];

// Vehicle classes and capacities as published on the transfers page.
const FLEET = [
  { key: "sedan", pax: 3 },
  { key: "minivan", pax: 6 },
  { key: "jeep", pax: 4 },
  { key: "sprinter", pax: 16 },
];

const kaText = (value) => (typeof value === "string" ? value : value?.ka || "");

// Dictionary strings mark the emphasised word as *word*, so each language
// keeps its own word order.
function withEmphasis(text) {
  return String(text || "")
    .split(/\*(.+?)\*/g)
    .map((part, index) => (index % 2 ? <em key={index}>{part}</em> : <Fragment key={index}>{part}</Fragment>));
}

export default async function HomePage({ params }) {
  const { locale } = await params;
  const lang = getRequestLocale(locale);
  const t = getTranslator(lang);
  const href = (path) => getLocalizedHref(path, lang);

  const [rawTours, rawPlaces, rawReviews] = await Promise.all([getCachedTours(), getCachedPlaces(), getCachedReviews()]);
  const places = Array.isArray(rawPlaces) ? rawPlaces : [];
  const placeById = new Map(places.map((place) => [place.id, place]));
  const placeTitle = (place) => asLocalizedText(place?.title, lang);

  const tours = toTourViews(rawTours, lang, places).sort((a, b) => {
    if (a.isPopular !== b.isPopular) return a.isPopular ? -1 : 1;
    return (a.nextDeparture?.date || "9999").localeCompare(b.nextDeparture?.date || "9999");
  });

  const departures = tours
    .filter((tour) => tour.nextDeparture && tour.groupPrice)
    .sort((a, b) => a.nextDeparture.date.localeCompare(b.nextDeparture.date))
    .slice(0, 3);

  const destinations = DESTINATIONS.map((destination) => {
    const regionTours = destination.region
      ? (Array.isArray(rawTours) ? rawTours : []).filter(
          (raw) => kaText(raw.destinationLabel) === destination.region || kaText(raw.destination) === destination.region
        )
      : [];
    const tourImage = regionTours.length ? tours.find((tour) => tour.id === regionTours[0].id)?.img : null;
    const placeImage = destination.region
      ? places.find((place) => kaText(place.region) === destination.region && place.img)?.img
      : null;
    const name = t(`homepage.dest${destination.key}Name`);
    return {
      ...destination,
      name,
      tagline: t(`homepage.dest${destination.key}Tag`),
      hasTours: regionTours.length > 0,
      image: tourImage || placeImage || destination.image || null,
      link: regionTours.length > 0
        ? href(`/tours?destination=${encodeURIComponent(destination.region)}`)
        : whatsappHref(interpolate(t("homepage.destWa"), { place: name })),
    };
  });

  const experiences = EXPERIENCES.map((item) => ({ ...item, place: placeById.get(item.id) })).filter((item) => item.place?.img);
  const localPhotos = LOCAL_PLACES.map((id) => placeById.get(id)).filter((place) => place?.img);

  const reviews = (Array.isArray(rawReviews) ? rawReviews : [])
    .filter((review) => review && typeof review.text === "string" && review.text.trim() && Number(review.rating) >= 1 && review.hidden !== true && review.approved !== false)
    .slice(0, 6);

  const faqs = FAQ_KEYS.map(([q, a]) => ({ q: t(q), a: t(a) }));
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE_URL}/${lang}#faq`,
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  const generalWa = whatsappHref(t("site.generalWa"));
  const heroRoute = t("homepage.heroRoute");
  const route = Array.isArray(heroRoute) ? heroRoute : [];

  const trustItems = [
    { n: 1, icon: <CompassIcon size={20} /> },
    { n: 2, icon: <UsersIcon size={20} /> },
    { n: 3, icon: <LocationIcon size={20} /> },
    { n: 4, icon: <WalletIcon size={20} /> },
    { n: 5, icon: <LanguagesIcon size={20} /> },
    { n: 6, icon: <HeadsetIcon size={20} /> },
  ];

  const whyItems = [
    { n: 1, icon: <CompassIcon size={22} /> },
    { n: 2, icon: <CalendarIcon size={22} /> },
    { n: 3, icon: <CarIcon size={22} /> },
    { n: 4, icon: <LanguagesIcon size={22} /> },
    { n: 5, icon: <HeadsetIcon size={22} /> },
    { n: 6, icon: <HeartIcon size={22} /> },
  ];

  const transferPerks = [
    { title: "transfersPage.p1Title", text: "transfersPage.p1Desc", icon: <PlaneIcon size={18} /> },
    { title: "transfersPage.p2Title", text: "transfersPage.p2Desc", icon: <ShieldCheckIcon size={18} /> },
    { title: "transfersPage.p4Title", text: "transfersPage.p4Desc", icon: <UsersIcon size={18} /> },
  ];

  return (
    <>
      <Navbar active="home" />

      <main>
        {/* 1. Hero */}
        <section className="gt-hero" aria-labelledby="hero-title">
          <Image
            src={HERO_IMAGE}
            alt={t("homepage.heroAlt")}
            fill
            sizes="100vw"
            loading="eager"
            fetchPriority="high"
            className="gt-hero-img"
          />
          <div className="gt-hero-scrim" aria-hidden="true" />

          <div className="gt-container gt-hero-inner">
            <div className="gt-hero-copy">
              <p className="gt-hero-eyebrow">{t("homepage.heroEyebrow")}</p>
              <h1 id="hero-title" className="gt-display gt-hero-title">{withEmphasis(t("homepage.heroTitle"))}</h1>
              <p className="gt-hero-lead">{t("homepage.heroLead")}</p>
              <div className="gt-hero-actions">
                <Link href={href("/tours")} className="gt-btn gt-btn--gold gt-btn--lg">
                  {t("homepage.ctaTours")}
                  <ArrowRightIcon size={18} />
                </Link>
                <a href="#plan" className="gt-btn gt-btn--ghost-light gt-btn--lg">{t("homepage.ctaPlan")}</a>
              </div>
              <a href={generalWa} target="_blank" rel="noopener noreferrer" className="gt-hero-wa">
                <WhatsAppIcon size={18} />
                {t("homepage.ctaWhatsapp")}
              </a>
            </div>

            {route.length > 0 && (
              <div className="gt-hero-route">
                <p className="gt-hero-route-label" id="hero-route-label">{t("homepage.heroRouteLabel")}</p>
                <ul className="gt-hero-route-list" aria-labelledby="hero-route-label">
                  {route.map((name) => <li key={name}>{name}</li>)}
                </ul>
                <Link href={href("/places")} className="gt-hero-route-link" prefetch={false}>
                  {t("homepage.heroRouteLink")}
                  <ArrowRightIcon size={16} />
                </Link>
                <p className="gt-hero-place">
                  <LocationIcon size={14} />
                  {t("homepage.heroPlace")}
                </p>
              </div>
            )}

            {departures.length > 0 && (
              <aside className="gt-hero-card" aria-labelledby="hero-departures-title">
                <h2 id="hero-departures-title" className="gt-hero-card-title">
                  <CalendarIcon size={18} />
                  {t("homepage.departuresTitle")}
                </h2>
                <ul className="gt-departure-list">
                  {departures.map((tour) => (
                    <li key={tour.id}>
                      <Link href={href(`/tours/${tour.id}`)} className="gt-departure">
                        <span className="gt-departure-date" aria-hidden="true">
                          <b>{formatTourDate(tour.nextDeparture.date, lang, { day: "numeric" })}</b>
                          <small>{formatTourDate(tour.nextDeparture.date, lang, { month: "short" })}</small>
                        </span>
                        <span className="gt-departure-title">
                          {tour.title}
                          <small>
                            <span className="gt-sr-only">
                              {formatTourDate(tour.nextDeparture.date, lang, { day: "numeric", month: "long" })} ·{" "}
                            </span>
                            {[tour.duration, tour.region].filter(Boolean).join(" · ")}
                          </small>
                        </span>
                        <span className="gt-departure-price">
                          <TourPrice price={tour.groupPrice} lang={lang} variant="card" showBadge={false} />
                          <small>{t("tourCard.perPerson")}</small>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="gt-hero-card-note">{t("homepage.departuresNote")}</p>
                <Link href={href("/tours")} className="gt-link">
                  {t("homepage.departuresAll")}
                  <ArrowRightIcon size={16} />
                </Link>
              </aside>
            )}
          </div>
        </section>

        {/* 2. Trust */}
        <section className="gt-trust" aria-labelledby="trust-title">
          <div className="gt-container">
            <h2 id="trust-title" className="gt-sr-only">{t("homepage.trustTitle")}</h2>
            <ul className="gt-trust-list">
              {trustItems.map((item) => (
                <li key={item.n} className="gt-trust-item">
                  <span className="gt-icon-badge">{item.icon}</span>
                  <span>
                    <strong>{t(`trust.t${item.n}Title`)}</strong>
                    <span>{t(`trust.t${item.n}Text`)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 3. Tours */}
        <section className="gt-section gt-section--paper" id="tours" aria-labelledby="tours-title">
          <div className="gt-container">
            <div className="gt-section-head gt-section-head--split">
              <div>
                <p className="gt-eyebrow">{t("homepage.toursEyebrow")}</p>
                <h2 id="tours-title" className="gt-h2">{t("homepage.toursTitle")}</h2>
                <p className="gt-lead">{t("homepage.toursLead")}</p>
              </div>
              <Link href={href("/tours")} className="gt-link">
                {t("homepage.toursAll")}
                <ArrowRightIcon size={16} />
              </Link>
            </div>

            <div className="gt-tour-grid">
              {tours.map((tour) => (
                <TourCard key={tour.id} tour={tour} lang={lang} t={t} />
              ))}
              <article className="gt-custom-card">
                <div>
                  <span className="gt-icon-badge"><RouteIcon size={22} /></span>
                  <h3 className="gt-h3">{t("homepage.customTitle")}</h3>
                  <p>{t("homepage.customText")}</p>
                </div>
                <a href="#plan" className="gt-btn gt-btn--gold gt-btn--block">
                  {t("homepage.customCta")}
                  <ArrowRightIcon size={18} />
                </a>
              </article>
            </div>
          </div>
        </section>

        {/* 4. Destinations */}
        <section className="gt-section gt-section--white" id="destinations" aria-labelledby="dest-title">
          <div className="gt-container">
            <div className="gt-section-head">
              <p className="gt-eyebrow">{t("homepage.destEyebrow")}</p>
              <h2 id="dest-title" className="gt-h2">{t("homepage.destTitle")}</h2>
              <p className="gt-lead">{t("homepage.destLead")}</p>
            </div>

            <ul className="gt-dest-grid">
              {destinations.map((destination) => (
                <li key={destination.key} className={`gt-dest-card${destination.large ? " gt-dest-card--lg" : ""}`}>
                  {destination.image && (
                    <Image
                      src={destination.image}
                      alt=""
                      fill
                      sizes={destination.large ? "(max-width: 980px) 100vw, 50vw" : "(max-width: 600px) 100vw, (max-width: 980px) 50vw, 33vw"}
                      className="gt-dest-img"
                    />
                  )}
                  <div className="gt-dest-body">
                    <span className={`gt-chip ${destination.hasTours ? "gt-chip--gold" : "gt-chip--light"}`}>
                      {destination.hasTours ? t("homepage.destToursAvailable") : t("homepage.destOnRequest")}
                    </span>
                    <h3 className="gt-dest-name">{destination.name}</h3>
                    <p>{destination.tagline}</p>
                    {destination.hasTours ? (
                      <Link href={destination.link} className="gt-dest-link gt-stretched">
                        {t("homepage.destViewTours")}
                        <ArrowRightIcon size={16} />
                      </Link>
                    ) : (
                      <a href={destination.link} target="_blank" rel="noopener noreferrer" className="gt-dest-link gt-stretched">
                        {t("homepage.destAsk")}
                        <WhatsAppIcon size={16} />
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <p className="gt-dest-also">
              <strong>{t("homepage.destAlsoLabel")}</strong> {t("homepage.destAlsoList")}
            </p>
          </div>
        </section>

        {/* 5. Experiences — real stops from current routes */}
        {experiences.length >= 3 && (
          <section className="gt-section gt-section--stone" aria-labelledby="exp-title">
            <div className="gt-container">
              <div className="gt-section-head gt-section-head--split">
                <div>
                  <p className="gt-eyebrow">{t("homepage.expEyebrow")}</p>
                  <h2 id="exp-title" className="gt-h2">{t("homepage.expTitle")}</h2>
                  <p className="gt-lead">{t("homepage.expLead")}</p>
                </div>
                <Link href={href("/places")} className="gt-link">
                  {t("homepage.expAll")}
                  <ArrowRightIcon size={16} />
                </Link>
              </div>

              <ul className="gt-exp-grid">
                {experiences.map(({ place, theme }) => (
                  <li key={place.id}>
                    <Link href={href(`/places/${place.id}`)} className="gt-exp-tile" prefetch={false}>
                      <Image src={place.img} alt="" fill sizes="(max-width: 560px) 78vw, (max-width: 900px) 50vw, 33vw" />
                      <span className="gt-chip gt-chip--light">{t(`homepage.${theme}`)}</span>
                      <strong>{placeTitle(place)}</strong>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* 6. Why GeorgiaTrips */}
        <section className="gt-section gt-section--paper" id="why" aria-labelledby="why-title">
          <div className="gt-container gt-why">
            <div className="gt-why-intro">
              <p className="gt-eyebrow">{t("homepage.whyEyebrow")}</p>
              <h2 id="why-title" className="gt-h2">{t("homepage.whyTitle")}</h2>
              <p className="gt-lead">{t("homepage.whyLead")}</p>
              <div className="gt-address-card">
                <span className="gt-icon-badge"><LocationIcon size={20} /></span>
                <div>
                  <strong>{t("homepage.officeLabel")}</strong>
                  <p>{t("footer.address")}</p>
                  <a href={`tel:${PHONE_TEL}`} dir="ltr">{PHONE_DISPLAY}</a>
                </div>
              </div>
            </div>
            <ul className="gt-why-points">
              {whyItems.map((item) => (
                <li key={item.n} className="gt-why-point">
                  <span className="gt-icon-badge">{item.icon}</span>
                  <h3>{t(`homepage.why${item.n}Title`)}</h3>
                  <p>{t(`homepage.why${item.n}Text`)}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 7. Private / custom trips */}
        <section className="gt-section gt-section--stone" id="plan" aria-labelledby="plan-title">
          <div className="gt-container gt-plan">
            <div className="gt-plan-copy">
              <p className="gt-eyebrow">{t("homepage.planEyebrow")}</p>
              <h2 id="plan-title" className="gt-h2">{t("homepage.planTitle")}</h2>
              <p className="gt-lead">{t("homepage.planLead")}</p>
              <ul className="gt-plan-includes">
                {[1, 2, 3, 4, 5].map((n) => (
                  <li key={n}>
                    <CheckIcon size={18} />
                    <span>{t(`homepage.planInc${n}`)}</span>
                  </li>
                ))}
              </ul>
              <p className="gt-plan-call">
                {t("homepage.planCall")}{" "}
                <a href={`tel:${PHONE_TEL}`} dir="ltr">{PHONE_DISPLAY}</a>
              </p>
            </div>
            <TripPlannerForm />
          </div>
        </section>

        {/* 8. Transfers */}
        <section className="gt-section gt-section--paper" id="transfers" aria-labelledby="transfers-title">
          <div className="gt-container">
            <div className="gt-section-head gt-section-head--split">
              <div>
                <p className="gt-eyebrow">{t("homepage.transfersEyebrow")}</p>
                <h2 id="transfers-title" className="gt-h2">{t("homepage.transfersTitle")}</h2>
                <p className="gt-lead">{t("homepage.transfersLead")}</p>
              </div>
            </div>

            <div className="gt-transfer">
              <div>
                <p className="gt-sublabel">{t("homepage.airportsLabel")}</p>
                <ul className="gt-airports">
                  {[["BUS", "airportBatumi"], ["KUT", "airportKutaisi"], ["TBS", "airportTbilisi"]].map(([code, key]) => (
                    <li key={code} className="gt-airport">
                      <span className="gt-airport-code">{code}</span>
                      <span>{t(`homepage.${key}`)}</span>
                    </li>
                  ))}
                </ul>
                <ul className="gt-transfer-perks">
                  {transferPerks.map((perk) => (
                    <li key={perk.title}>
                      <span className="gt-icon-badge gt-icon-badge--sm">{perk.icon}</span>
                      <div>
                        <strong>{t(perk.title)}</strong>
                        <p>{t(perk.text)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="gt-sublabel">{t("homepage.routesLabel")}</p>
                <ul className="gt-routes">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <li key={n} className="gt-route">
                      <RouteIcon size={16} />
                      <span>{t(`homepage.route${n}`)}</span>
                    </li>
                  ))}
                </ul>
                <p className="gt-sublabel gt-sublabel--spaced">{t("homepage.fleetLabel")}</p>
                <ul className="gt-fleet">
                  {FLEET.map((vehicle) => (
                    <li key={vehicle.key} className="gt-fleet-item">
                      <CarIcon size={20} />
                      <strong>{t(`transfersPage.vehicles.${vehicle.key}.name`)}</strong>
                      <small>{interpolate(t("transfersPage.capacityPax"), { count: vehicle.pax })}</small>
                    </li>
                  ))}
                </ul>
                <div className="gt-transfer-actions">
                  <Link href={href("/transfers")} className="gt-btn gt-btn--navy">
                    <PlaneIcon size={18} />
                    {t("homepage.transfersCta")}
                  </Link>
                  <a href={whatsappHref(t("homepage.transfersWa"))} target="_blank" rel="noopener noreferrer" className="gt-btn gt-btn--outline">
                    <WhatsAppIcon size={18} />
                    {t("homepage.transfersQuote")}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 9. VIP & corporate */}
        <section className="gt-section gt-section--navy" id="vip" aria-labelledby="vip-title">
          <div className="gt-container gt-vip">
            <div>
              <p className="gt-eyebrow">{t("homepage.vipEyebrow")}</p>
              <h2 id="vip-title" className="gt-h2">{t("homepage.vipTitle")}</h2>
              <p className="gt-lead">{t("homepage.vipLead")}</p>
              <ul className="gt-vip-list">
                {[1, 2, 3, 4].map((n) => (
                  <li key={n}>
                    <CheckIcon size={18} />
                    <span>{t(`homepage.vip${n}`)}</span>
                  </li>
                ))}
              </ul>
              <div className="gt-vip-actions">
                <a href={whatsappHref(t("homepage.vipWa"))} target="_blank" rel="noopener noreferrer" className="gt-btn gt-btn--gold gt-btn--lg">
                  <BriefcaseIcon size={18} />
                  {t("homepage.vipCta")}
                </a>
                <Link href={href("/transfers")} className="gt-btn gt-btn--ghost-light gt-btn--lg">{t("homepage.vipSecondary")}</Link>
              </div>
            </div>
            <div className="gt-vip-media">
              <Image src="/2car.webp" alt={t("homepage.vipAlt")} width={1536} height={1024} sizes="(max-width: 900px) 100vw, 50vw" />
            </div>
          </div>
        </section>

        {/* 10. Reviews — only when real reviews exist */}
        {reviews.length > 0 && (
          <section className="gt-section gt-section--white" aria-labelledby="reviews-title">
            <div className="gt-container">
              <div className="gt-section-head">
                <p className="gt-eyebrow">{t("homepage.reviewsEyebrow")}</p>
                <h2 id="reviews-title" className="gt-h2">{t("homepage.reviewsTitle")}</h2>
              </div>
              <ul className="gt-review-grid">
                {reviews.map((review) => (
                  <li key={review.id} className="gt-review">
                    <span className="gt-stars" role="img" aria-label={`${Math.round(Number(review.rating))}/5`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <StarIcon key={n} size={16} fill={n <= Math.round(Number(review.rating)) ? "currentColor" : "none"} color="currentColor" />
                      ))}
                    </span>
                    <blockquote>{review.text}</blockquote>
                    <div className="gt-review-author">
                      <strong>{review.name}</strong>
                      {review.source === "google" && <small>{t("homepage.reviewGoogle")}</small>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* 11. Local Georgia */}
        {localPhotos.length >= 3 && (
          <section className="gt-section gt-section--white" aria-labelledby="local-title">
            <div className="gt-container gt-local">
              <div>
                <p className="gt-eyebrow">{t("homepage.localEyebrow")}</p>
                <h2 id="local-title" className="gt-h2">{t("homepage.localTitle")}</h2>
                <p className="gt-lead">{t("homepage.localLead")}</p>
                <a href={INSTAGRAM_LINK} target="_blank" rel="noopener noreferrer" className="gt-btn gt-btn--outline">
                  <InstagramIcon size={18} />
                  {t("homepage.localCta")}
                </a>
              </div>
              <ul className="gt-local-mosaic">
                {localPhotos.map((place) => (
                  <li key={place.id} className="gt-local-photo">
                    <Link href={href(`/places/${place.id}`)} prefetch={false}>
                      <Image src={place.img} alt="" fill sizes="(max-width: 900px) 50vw, 30vw" />
                      <span className="gt-local-caption">{placeTitle(place)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* 12. FAQ */}
        <section className="gt-section gt-section--paper" id="faq" aria-labelledby="faq-title">
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
          <div className="gt-container gt-faq">
            <div>
              <p className="gt-eyebrow">{t("homepage.faqEyebrow")}</p>
              <h2 id="faq-title" className="gt-h2">{t("homepage.faqTitle")}</h2>
              <div className="gt-faq-help">
                <strong>{t("homepage.faqHelpTitle")}</strong>
                <p>{t("homepage.faqHelpText")}</p>
                <a href={generalWa} target="_blank" rel="noopener noreferrer" className="gt-btn gt-btn--wa">
                  <WhatsAppIcon size={18} />
                  {t("site.chatWhatsapp")}
                </a>
              </div>
            </div>
            <div className="gt-faq-list">
              {faqs.map((faq, index) => (
                <details key={faq.q} className="gt-faq-item" open={index === 0}>
                  <summary>
                    <span>{faq.q}</span>
                    <PlusIcon size={20} />
                  </summary>
                  <p>{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 13. Final CTA */}
        <section className="gt-final" aria-labelledby="final-title">
          <Image src="/hero.webp" alt="" fill sizes="100vw" className="gt-final-img" />
          <div className="gt-container">
            <h2 id="final-title" className="gt-h2">{t("homepage.finalTitle")}</h2>
            <p>{t("homepage.finalText")}</p>
            <div className="gt-final-actions">
              <Link href={href("/tours")} className="gt-btn gt-btn--gold gt-btn--lg">{t("homepage.finalTours")}</Link>
              <a href="#plan" className="gt-btn gt-btn--ghost-light gt-btn--lg">{t("homepage.finalPlan")}</a>
              <a href={generalWa} target="_blank" rel="noopener noreferrer" className="gt-btn gt-btn--wa gt-btn--lg">
                <WhatsAppIcon size={18} />
                {t("homepage.finalWa")}
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
