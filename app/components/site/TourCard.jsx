import Image from "next/image";
import Link from "next/link";
import TourPrice from "../TourPrice";
import { excerpt, formatTourDate } from "../../lib/tourView";
import { interpolate } from "../../lib/i18n/translate";
import { getLocalizedHref } from "../../lib/siteConfig";
import { whatsappHref } from "../../lib/shared";
import { CalendarIcon, ClockIcon, LocationIcon, RouteIcon, UsersIcon, WhatsAppIcon } from "../Icons";
import "../../styles/tour-card.css";

// Renders on the server (homepage, landing pages) or inside client components
// (catalog). Takes a view model from toTourView() and a translate function.
// `dateMatch` ("group" | "private") is set by the catalog when a date filter is
// active, so the card explains why it matches that day.
export default function TourCard({ tour, lang, t, headingLevel = 3, eager = false, sizes, dateMatch = null }) {
  const Heading = `h${headingLevel}`;
  const tourHref = getLocalizedHref(`/tours/${tour.id}`, lang);
  const waHref = whatsappHref(interpolate(t("tourCard.waMessage"), { title: tour.title }));
  const nextDate = tour.nextDeparture
    ? formatTourDate(tour.nextDeparture.date, lang, { day: "numeric", month: "short" })
    : "";

  return (
    <article className="gt-card gt-card--interactive gt-tour-card">
      <div className="gt-card-media gt-tour-card-media">
        {tour.img && (
          <Image
            src={tour.img}
            alt={tour.title}
            fill
            sizes={sizes || "(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"}
            loading={eager ? "eager" : "lazy"}
          />
        )}
        {tour.badge && <span className="gt-chip gt-chip--light gt-tour-card-badge">{tour.badge}</span>}
        {tour.region && (
          <span className="gt-tour-card-region">
            <LocationIcon size={14} />
            {tour.region}
          </span>
        )}
      </div>

      <div className="gt-tour-card-body">
        <Heading className="gt-h3 gt-tour-card-title">
          <Link href={tourHref} className="gt-stretched">{tour.title}</Link>
        </Heading>

        <ul className="gt-tour-facts">
          {tour.duration && <li><ClockIcon size={15} />{tour.duration}</li>}
          {tour.groupMax && <li><UsersIcon size={15} />{interpolate(t("tourCard.upTo"), { count: tour.groupMax })}</li>}
          {tour.stops.length > 1 && <li><RouteIcon size={15} />{interpolate(t("tourCard.stops"), { count: tour.stops.length })}</li>}
        </ul>

        {tour.desc && <p className="gt-tour-card-desc">{excerpt(tour.desc, 150)}</p>}

        {dateMatch ? (
          <div className="gt-tour-card-dates">
            <span className={`gt-chip ${dateMatch === "group" ? "gt-chip--gold" : "gt-chip--teal"}`}>
              <CalendarIcon size={13} />
              {t(dateMatch === "group" ? "toursPage.groupOnDate" : "toursPage.privateOnDate")}
            </span>
          </div>
        ) : (nextDate || tour.hasPrivate) && (
          <div className="gt-tour-card-dates">
            {nextDate && (
              <span className="gt-chip gt-chip--gold">
                <CalendarIcon size={13} />
                {interpolate(t("tourCard.nextGroup"), { date: nextDate })}
              </span>
            )}
            {tour.hasPrivate && <span className="gt-chip">{t("tourCard.privateAnyDay")}</span>}
          </div>
        )}

        <div className="gt-tour-card-foot">
          <div className="gt-tour-price">
            {tour.groupPrice ? (
              <>
                <span className="gt-tour-price-main">
                  <strong><TourPrice price={tour.groupPrice} lang={lang} variant="card" /></strong>
                  <small>{t("tourCard.perPersonGroup")}</small>
                </span>
                {tour.privatePrice && (
                  <span className="gt-tour-price-alt">
                    {t("tourCard.privateLabel")}:{" "}
                    <strong><TourPrice price={tour.privatePrice} lang={lang} variant="card" showBadge={false} /></strong>
                    {tour.privateMax ? ` · ${interpolate(t("tourCard.privateUpTo"), { count: tour.privateMax })}` : ""}
                  </span>
                )}
              </>
            ) : tour.privatePrice ? (
              <span className="gt-tour-price-main">
                <strong><TourPrice price={tour.privatePrice} lang={lang} variant="card" /></strong>
                <small>{t("tourCard.privateLabel")}</small>
              </span>
            ) : null}
          </div>

          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="gt-btn gt-btn--wa gt-btn--sm gt-tour-card-wa"
            aria-label={interpolate(t("tourCard.askAria"), { title: tour.title })}
          >
            <WhatsAppIcon size={17} />
            <span>{t("tourCard.ask")}</span>
          </a>
        </div>
      </div>
    </article>
  );
}
