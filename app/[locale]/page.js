import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import TourPrice from "../components/TourPrice";
import TourGrid from "../components/site/TourGrid";
import TripPlannerForm from "../components/homepage/TripPlannerForm";
import HeroSearch from "../components/homepage/HeroSearch";
import GeorgiaMap from "../components/homepage/GeorgiaMap";
import HeroSlides from "../components/homepage/HeroSlides";
import { getCachedPlaces, getCachedReviews, getCachedTours } from "../lib/server/cachedData";
import { formatTourDate, isLowSeats, toTourViews } from "../lib/tourView";
import { tourPath, placePath } from "../lib/slugs";
import { getTranslator, interpolate } from "../lib/i18n/translate";
import { getLocalizedHref, getRequestLocale, SITE_URL } from "../lib/siteConfig";
import { asLocalizedText } from "../lib/toursFirestore";
import { formatRegionName } from "../lib/placesMeta";
import { INSTAGRAM_HANDLE, INSTAGRAM_LINK, PHONE_DISPLAY, PHONE_TEL, whatsappHref } from "../lib/shared";
import {
  ArrowRightIcon, BriefcaseIcon, CalendarIcon, CarIcon, CheckIcon, CompassIcon, HeadsetIcon,
  InstagramIcon, PhoneIcon, PlaneIcon, PlusIcon, RouteIcon, ShieldCheckIcon,
  StarIcon, UsersIcon, WalletIcon, WhatsAppIcon,
} from "../components/Icons";
import "../styles/home.css";
import "../styles/tour-card.css";

// Server-rendered homepage. Everything shown comes from Firestore (tours,
// departures, places, reviews) or from the dictionaries; nothing is invented.
// Funnel order: hero with search + next departures -> bookable tours ->
// regions map -> local team -> places on our routes -> private trip planner
// -> transfers and fleet -> reviews (only if real) -> FAQ -> final CTA.

// Hero photos, in order. Tbilisi first: it is the sharpest file and loads first.
const HERO_SLIDES = [
  { key: "Tbilisi", src: "/tbilisi.jpg", position: "50% 45%" },
  { key: "Svaneti", src: "/svaneti.jpg", position: "50% 40%" },
  { key: "Adjara", src: "/adjara.jpg", position: "50% 50%" },
];

// Region code (as in the map SVG) -> region name as stored in Firestore.
const MAP_REGIONS = [
  ["GE-AJ", "აჭარა"],
  ["GE-SZ", "სამეგრელო-ზემო სვანეთი"],
  ["GE-GU", "გურია"],
  ["GE-IM", "იმერეთი"],
  ["GE-RL", "რაჭა-ლეჩხუმი და ქვემო სვანეთი"],
  ["GE-MM", "მცხეთა-მთიანეთი"],
  ["GE-SJ", "სამცხე-ჯავახეთი"],
  ["GE-SK", "შიდა ქართლი"],
  ["GE-KK", "ქვემო ქართლი"],
  ["GE-TB", "თბილისი"],
  ["GE-KA", "კახეთი"],
];

const FAQ_KEYS = [
  ["homepage.faqQ7", "homepage.faqA7"],
  ["faq.q1", "faq.a1"],
  ["faq.q3", "faq.a3"],
  ["faq.q6", "faq.a6"],
  ["homepage.faqQ8", "homepage.faqA8"],
  ["homepage.faqQ9", "homepage.faqA9"],
];

// Vehicles, photos and capacities exactly as published on the transfers page.
const FLEET = [
  { key: "sedan", img: "/1car.webp", pax: 3, bags: 2 },
  { key: "minivan", img: "/2car.webp", pax: 6, bags: 5 },
  { key: "jeep", img: "/3car.webp", pax: 4, bags: 3 },
  { key: "sprinter", img: "/4car.webp", pax: 16, bags: 14 },
];

const kaText = (value) => (typeof value === "string" ? value : value?.ka || "");

// Dictionary strings mark the emphasised word as *word*, so each language
// keeps its own word order.
function withEmphasis(text) {
  return String(text || "")
    .split(/\*(.+?)\*/g)
    .map((part, index) => (index % 2 ? <em key={index}>{part}</em> : <Fragment key={index}>{part}</Fragment>));
}

// A line break in the hero title starts a new line, so the title breaks where
// the copy intends instead of wherever the column happens to end.
function heroTitle(text) {
  return String(text || "")
    .split("\n")
    .map((line, index) => (
      <span key={index} className="gt-hero-title-line">{withEmphasis(line.trim())}</span>
    ));
}

export default async function HomePage({ params }) {
  const { locale } = await params;
  const lang = getRequestLocale(locale);
  const t = getTranslator(lang);
  const href = (path) => getLocalizedHref(path, lang);

  const [rawTours, rawPlaces, rawReviews] = await Promise.all([getCachedTours(), getCachedPlaces(), getCachedReviews()]);
  const rawList = Array.isArray(rawTours) ? rawTours : [];
  const places = Array.isArray(rawPlaces) ? rawPlaces : [];

  const tours = toTourViews(rawList, lang, places, t("tourBadges")).sort((a, b) => {
    if (a.isPopular !== b.isPopular) return a.isPopular ? -1 : 1;
    return (a.nextDeparture?.date || "9999").localeCompare(b.nextDeparture?.date || "9999");
  });

  const regionOfTour = new Map(rawList.map((raw) => [raw.id, kaText(raw.destination) || kaText(raw.destinationLabel)]));
  const regionCounts = {};
  regionOfTour.forEach((region) => {
    if (region) regionCounts[region] = (regionCounts[region] || 0) + 1;
  });

  const openDepartures = (tour) => tour.departures.filter((d) => d.freeSeats === null || d.freeSeats > 0);
  const searchDepartures = tours.flatMap((tour) =>
    tour.hasGroup ? openDepartures(tour).map((d) => ({ date: d.date, region: regionOfTour.get(tour.id) || "" })) : []
  );

  const nextDepartures = tours
    .flatMap((tour) => (tour.groupPrice ? openDepartures(tour).slice(0, 1).map((departure) => ({ tour, departure })) : []))
    .sort((a, b) => a.departure.date.localeCompare(b.departure.date))
    .slice(0, 3);

  // ---- Regions map: counts plus a few real tours and places for each region
  const toursByRegion = {};
  for (const tour of tours) {
    const region = regionOfTour.get(tour.id);
    if (!region) continue;
    const next = tour.nextDeparture
      ? interpolate(t("tourCard.nextGroup"), { date: formatTourDate(tour.nextDeparture.date, lang, { day: "numeric", month: "short" }) })
      : "";
    (toursByRegion[region] ||= []).push({
      id: tour.id,
      title: tour.title,
      img: tour.img || "",
      href: href(tourPath(tour)),
      meta: [tour.duration, next].filter(Boolean).join(" · "),
    });
  }

  const placeCounts = {};
  const placesByRegion = {};
  for (const place of places) {
    const region = kaText(place.region);
    if (!region) continue;
    placeCounts[region] = (placeCounts[region] || 0) + 1;
    if (place.img) {
      (placesByRegion[region] ||= []).push({
        id: place.id,
        title: asLocalizedText(place.title, lang),
        img: place.img,
        href: href(placePath(place)),
        popular: Boolean(place.isPopular),
      });
    }
  }

  const mapRegions = MAP_REGIONS.map(([code, region]) => {
    const name = formatRegionName(region, lang);
    const desc = t(`map.regions.${code}.desc`, "");
    const tourCount = regionCounts[region] || 0;
    return {
      code,
      name,
      desc: typeof desc === "string" ? desc : "",
      tourCount,
      placeCount: placeCounts[region] || 0,
      tours: (toursByRegion[region] || []).slice(0, 3),
      places: (placesByRegion[region] || []).sort((a, b) => Number(b.popular) - Number(a.popular)).slice(0, 4),
      href: tourCount
        ? href(`/tours?destination=${encodeURIComponent(region)}`)
        : whatsappHref(interpolate(t("homepage.destWa"), { place: name })),
    };
  }).sort((a, b) => Number(b.tourCount > 0) - Number(a.tourCount > 0));

  // ---- Places on our current routes (real itinerary stops with photos)
  const routePlaceIds = new Set(rawList.flatMap((raw) => (Array.isArray(raw.itinerary) ? raw.itinerary : []).map((s) => s?.placeId).filter(Boolean)));
  const routePlaces = places
    .filter((p) => p.img && routePlaceIds.has(p.id))
    .sort((a, b) => Number(Boolean(b.isPopular)) - Number(Boolean(a.isPopular)))
    .slice(0, 5);

  const reviews = (Array.isArray(rawReviews) ? rawReviews : [])
    .filter((r) => r && typeof r.text === "string" && r.text.trim() && Number(r.rating) >= 1 && r.hidden !== true && r.approved !== false)
    .slice(0, 6);

  const faqs = FAQ_KEYS.map(([q, a]) => ({ q: t(q), a: t(a) }));
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE_URL}/${lang}#faq`,
    mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.q, acceptedAnswer: { "@type": "Answer", text: faq.a } })),
  };

  const generalWa = whatsappHref(t("site.generalWa"));
  const finalImage = tours.find((tour) => tour.isPopular)?.img || "/gudauri.webp";

  const whyItems = [
    { n: 1, icon: <CompassIcon size={21} /> },
    { n: 2, icon: <WalletIcon size={21} /> },
    { n: 3, icon: <CarIcon size={21} /> },
    { n: 4, icon: <HeadsetIcon size={21} /> },
  ];

  const transferPerks = [
    { title: "transfersPage.p1Title", text: "transfersPage.p1Desc", icon: <PlaneIcon size={18} /> },
    { title: "transfersPage.p2Title", text: "transfersPage.p2Desc", icon: <ShieldCheckIcon size={18} /> },
    { title: "transfersPage.p4Title", text: "transfersPage.p4Desc", icon: <UsersIcon size={18} /> },
  ];

  return (
    <>
      <Navbar active="home" overlay />

      <main>
        {/* 1. Hero — what we do, proof it's bookable, and the search */}
        <section className="gt-hero" aria-labelledby="hero-title">
          <HeroSlides
            slides={HERO_SLIDES.map((slide) => {
              const name = t(`homepage.heroSlide${slide.key}`);
              return { src: slide.src, position: slide.position, name, alt: interpolate(t("homepage.heroSlideAlt"), { place: name }) };
            })}
            goLabel={t("homepage.heroSlideGo")}
          />

          <div className={`gt-container gt-hero-inner${nextDepartures.length ? "" : " gt-hero-inner--solo"}`}>
            <div className="gt-hero-copy">
              <p className="gt-hero-eyebrow">{t("homepage.heroEyebrow")}</p>
              <h1 id="hero-title" className="gt-display gt-hero-title">{heroTitle(t("homepage.heroTitle"))}</h1>
              <p className="gt-hero-lead">{t("homepage.heroLead")}</p>

              <HeroSearch regionCounts={regionCounts} departures={searchDepartures} />

              <ul className="gt-hero-assurances">
                {[4, 3, 6].map((n) => (
                  <li key={n}><CheckIcon size={16} />{t(`trust.t${n}Title`)}</li>
                ))}
                <li>
                  <a href={generalWa} target="_blank" rel="noopener noreferrer" className="gt-hero-wa">
                    <WhatsAppIcon size={17} />
                    {t("homepage.ctaWhatsapp")}
                  </a>
                </li>
              </ul>
            </div>

            {nextDepartures.length > 0 && (
              <aside className="gt-hero-card" aria-labelledby="hero-departures-title">
                <h2 id="hero-departures-title" className="gt-hero-card-title">
                  <CalendarIcon size={18} />
                  {t("homepage.departuresTitle")}
                </h2>
                <ul className="gt-departure-list">
                  {nextDepartures.map(({ tour, departure }) => (
                    <li key={tour.id}>
                      <Link href={href(tourPath(tour))} className="gt-departure">
                        <span className="gt-departure-media" aria-hidden="true">
                          {tour.img && <Image src={tour.img} alt="" fill sizes="64px" />}
                          <span className="gt-departure-date">
                            <b>{formatTourDate(departure.date, lang, { day: "numeric" })}</b>
                            <small>{formatTourDate(departure.date, lang, { month: "short" })}</small>
                          </span>
                        </span>
                        <span className="gt-departure-title">
                          {tour.title}
                          <small>
                            <span className="gt-sr-only">{formatTourDate(departure.date, lang, { day: "numeric", month: "long" })} · </span>
                            {[tour.duration, tour.region].filter(Boolean).join(" · ")}
                          </small>
                          {isLowSeats(departure.freeSeats, tour.groupMax) && (
                            <small className="gt-departure-seats">{interpolate(t("tourDetail.groupSeatsHint"), { seats: departure.freeSeats, max: tour.groupMax })}</small>
                          )}
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

        {/* 2. Bookable tours */}
        <section className="gt-section gt-section--paper" id="tours" aria-labelledby="tours-title">
          <div className="gt-container">
            <div className="gt-section-head gt-section-head--duo" data-reveal>
              <div>
                <p className="gt-eyebrow">{t(tours.length ? "homepage.toursEyebrow" : "homepage.planEyebrow")}</p>
                <h2 id="tours-title" className="gt-h2">{t(tours.length ? "homepage.toursTitle" : "homepage.toursEmptyTitle")}</h2>
              </div>
              <div className="gt-section-head-aside">
                <p className="gt-lead">{t(tours.length ? "homepage.toursLead" : "homepage.toursEmptyLead")}</p>
                {tours.length > 0 && (
                  <Link href={href("/tours")} className="gt-link">
                    {t("homepage.toursAll")}
                    <ArrowRightIcon size={16} />
                  </Link>
                )}
              </div>
            </div>

            {/* The plan-a-trip card fills whatever the last row leaves (0–6 tours).
                The hero photo is the LCP image; these cards sit below the fold and load lazily. */}
            <TourGrid
              items={tours.slice(0, 6).map((tour) => ({ tour }))}
              lang={lang}
              t={t}
              reveal
              help={{
                id: "custom-title",
                title: t(tours.length ? "homepage.customTitle" : "homepage.toursEmptyHelpTitle"),
                text: t("homepage.customText"),
                ctaLabel: t("homepage.customCta"),
                planHref: "#plan",
                waHref: generalWa,
              }}
            />
          </div>
        </section>

        {/* 3. Regions map */}
        <section className="gt-section gt-section--white" id="destinations" aria-labelledby="regions-title">
          <div className="gt-container">
            <div className="gt-section-head gt-section-head--duo" data-reveal>
              <div>
                <p className="gt-eyebrow">{t("homepage.destEyebrow")}</p>
                <h2 id="regions-title" className="gt-h2">{t("homepage.destTitle")}</h2>
              </div>
              <div className="gt-section-head-aside">
                <p className="gt-lead">{t("homepage.destLead")}</p>
              </div>
            </div>
            <GeorgiaMap regions={mapRegions} />
          </div>
        </section>

        {/* 4. Local team */}
        <section className="gt-section gt-section--paper gt-why-section" id="why" aria-labelledby="why-title">
          <div className="gt-container">
            <div className="gt-section-head gt-section-head--duo" data-reveal>
              <div>
                <p className="gt-eyebrow">{t("homepage.whyEyebrow")}</p>
                <h2 id="why-title" className="gt-h2">{t("homepage.whyTitle")}</h2>
              </div>
              <div className="gt-section-head-aside">
                <p className="gt-lead">{t("homepage.whyLead")}</p>
              </div>
            </div>

            {/* Portrait beside the four points; the photo stretches to the height of the list. */}
            <div className="gt-why">
              <div className="gt-why-media" data-reveal="image">
                <div className="gt-why-photo">
                  <Image src="/profile.png" alt={t("about.altText")} fill sizes="(max-width: 900px) 100vw, 50vw" />
                </div>
              </div>

              <ul className="gt-why-points" data-reveal-group>
                {whyItems.map((item) => (
                  <li key={item.n} className="gt-why-point">
                    <span className="gt-icon-badge gt-icon-badge--sm">{item.icon}</span>
                    <div>
                      <h3>{t(`homepage.why${item.n}Title`)}</h3>
                      <p>{t(`homepage.why${item.n}Text`)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 5. Places on our routes */}
        {routePlaces.length >= 3 && (
          <section className="gt-section gt-section--white gt-places-section" aria-labelledby="places-title">
            <div className="gt-container">
              <div className="gt-section-head gt-section-head--duo" data-reveal>
                <div>
                  <p className="gt-eyebrow">{t("homepage.expEyebrow")}</p>
                  <h2 id="places-title" className="gt-h2">{t("homepage.expTitle")}</h2>
                </div>
                <div className="gt-section-head-aside">
                  <p className="gt-lead">{t("homepage.expLead")}</p>
                  <Link href={href("/places")} className="gt-link" prefetch={false}>
                    {t("homepage.expAll")}
                    <ArrowRightIcon size={16} />
                  </Link>
                </div>
              </div>

              <ul className={`gt-places gt-places--${routePlaces.length}`} data-reveal-group>
                {routePlaces.map((place, index) => (
                  <li key={place.id} className="gt-place">
                    <Link href={href(placePath(place))} prefetch={false}>
                      <Image src={place.img} alt="" fill sizes={index === 0 ? "(max-width: 900px) 100vw, 50vw" : "(max-width: 900px) 50vw, 25vw"} />
                      <span className="gt-place-caption">
                        <small>{formatRegionName(kaText(place.region), lang)}</small>
                        {asLocalizedText(place.title, lang)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="gt-places-foot" data-reveal>
                <p>{t("homepage.localLead")}</p>
                <a href={INSTAGRAM_LINK} target="_blank" rel="noopener noreferrer" className="gt-btn gt-btn--outline">
                  <InstagramIcon size={18} />
                  <span>@{INSTAGRAM_HANDLE}</span>
                </a>
              </div>
            </div>
          </section>
        )}

        {/* 6. Private / custom trips: how it works + three-step planner */}
        <section className="gt-section gt-plan-section" id="plan" aria-labelledby="plan-title">
          <div className="gt-container gt-plan">
            <div className="gt-plan-copy" data-reveal="left">
              <p className="gt-eyebrow">{t("homepage.planEyebrow")}</p>
              <h2 id="plan-title" className="gt-h2">{t("homepage.planTitle")}</h2>
              <p className="gt-lead">{t("homepage.planLead")}</p>

              <ol className="gt-plan-steps">
                {[1, 2, 3].map((n) => (
                  <li key={n}>
                    <span className="gt-plan-step-num" aria-hidden="true">{n}</span>
                    <div>
                      <strong>{t(`homepage.planStep${n}Title`)}</strong>
                      <p>{t(`homepage.planStep${n}Text`)}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <ul className="gt-plan-tags">
                {[1, 2, 3, 4, 5].map((n) => (
                  <li key={n}>
                    <CheckIcon size={14} />
                    {t(`homepage.planInc${n}`)}
                  </li>
                ))}
              </ul>

              <p className="gt-plan-call">
                <PhoneIcon size={17} />
                {t("homepage.planCall")}{" "}
                <a href={`tel:${PHONE_TEL}`} dir="ltr">{PHONE_DISPLAY}</a>
              </p>
            </div>
            <div className="gt-plan-form" data-reveal="right">
              <TripPlannerForm />
            </div>
          </div>
        </section>

        {/* 7. Transfers & fleet */}
        <section className="gt-section gt-section--paper" id="transfers" aria-labelledby="transfers-title">
          <div className="gt-container">
            <div className="gt-section-head gt-section-head--duo" data-reveal>
              <div>
                <p className="gt-eyebrow">{t("homepage.transfersEyebrow")}</p>
                <h2 id="transfers-title" className="gt-h2">{t("homepage.transfersTitle")}</h2>
              </div>
              <div className="gt-section-head-aside">
                <p className="gt-lead">{t("homepage.transfersLead")}</p>
              </div>
            </div>

            <div className="gt-fleet-block">
              <p className="gt-sublabel">{t("homepage.fleetLabel")}</p>
              <ul className="gt-fleet" data-reveal-group>
                {FLEET.map((vehicle) => (
                  <li key={vehicle.key}>
                    <Link href={href("/transfers")} className="gt-fleet-item" prefetch={false}>
                      <span className="gt-fleet-media">
                        <Image src={vehicle.img} alt={t(`transfersPage.vehicles.${vehicle.key}.name`)} fill sizes="(max-width: 560px) 50vw, (max-width: 980px) 50vw, 25vw" />
                      </span>
                      <span className="gt-fleet-info">
                        <strong>{t(`transfersPage.vehicles.${vehicle.key}.name`)}</strong>
                        <small>
                          <UsersIcon size={14} />
                          {interpolate(t("transfersPage.capacityPax"), { count: vehicle.pax })}
                        </small>
                        <small>{interpolate(t("transfersPage.capacityBags"), { count: vehicle.bags })}</small>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="gt-transfer">
              <div data-reveal="left">
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

              <div data-reveal="right">
                <p className="gt-sublabel">{t("homepage.routesLabel")}</p>
                <ul className="gt-routes">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <li key={n} className="gt-route">
                      <RouteIcon size={16} />
                      <span>{t(`homepage.route${n}`)}</span>
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
                <a href={whatsappHref(t("homepage.vipWa"))} target="_blank" rel="noopener noreferrer" className="gt-vip-link" id="vip">
                  <BriefcaseIcon size={18} />
                  <span>
                    <strong>{t("homepage.vipTitle")}</strong>
                    <small>{t("homepage.vipLead")}</small>
                  </span>
                  <ArrowRightIcon size={16} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 8. Reviews — only when real reviews exist */}
        {reviews.length > 0 && (
          <section className="gt-section gt-section--white gt-reviews-section" aria-labelledby="reviews-title">
            <div className="gt-container">
              <div className="gt-section-head" data-reveal>
                <p className="gt-eyebrow">{t("homepage.reviewsEyebrow")}</p>
                <h2 id="reviews-title" className="gt-h2">{t("homepage.reviewsTitle")}</h2>
              </div>
              <ul className="gt-review-grid" data-count={reviews.length} data-reveal-group>
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

        {/* 9. FAQ */}
        <section className="gt-section gt-section--stone" id="faq" aria-labelledby="faq-title">
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
          <div className="gt-container">
            <div className="gt-section-head" data-reveal>
              <p className="gt-eyebrow">{t("homepage.faqEyebrow")}</p>
              <h2 id="faq-title" className="gt-h2">{t("homepage.faqTitle")}</h2>
            </div>

            {/* Photo and questions side by side; the photo takes the height of the list. */}
            <div className="gt-faq">
              <div className="gt-faq-visual" data-reveal="image">
                <div className="gt-faq-photo">
                  <Image src="/profile1.jpg" alt="" fill sizes="(max-width: 900px) 100vw, 40vw" />
                </div>
                <div className="gt-faq-help">
                  <strong>{t("homepage.faqHelpTitle")}</strong>
                  <p>{t("homepage.faqHelpText")}</p>
                  <a href={generalWa} target="_blank" rel="noopener noreferrer" className="gt-btn gt-btn--wa gt-btn--sm">
                    <WhatsAppIcon size={17} />
                    {t("site.chatWhatsapp")}
                  </a>
                </div>
              </div>
              <div className="gt-faq-list" data-reveal-group>
                {faqs.map((faq, index) => (
                  <details key={faq.q} className="gt-faq-item" open={index === 0}>
                    <summary>
                      <span>{faq.q}</span>
                      <PlusIcon size={18} />
                    </summary>
                    <p>{faq.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 10. Final CTA */}
        <section className="gt-final" aria-labelledby="final-title">
          <Image src={finalImage} alt="" fill sizes="100vw" quality={60} className="gt-final-img" />
          <div className="gt-container" data-reveal="scale">
            <h2 id="final-title" className="gt-h2">{t("homepage.finalTitle")}</h2>
            <p>{t("homepage.finalText")}</p>
            <div className="gt-final-actions">
              {tours.length > 0 && (
                <Link href={href("/tours")} className="gt-btn gt-btn--gold gt-btn--lg">
                  {t("homepage.finalTours")}
                  <ArrowRightIcon size={18} />
                </Link>
              )}
              <a href={generalWa} target="_blank" rel="noopener noreferrer" className="gt-btn gt-btn--wa gt-btn--lg">
                <WhatsAppIcon size={18} />
                {t("homepage.finalWa")}
              </a>
              <a href="#plan" className="gt-btn gt-btn--ghost-light gt-btn--lg">{t("homepage.finalPlan")}</a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
