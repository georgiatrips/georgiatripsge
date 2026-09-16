import Image from "next/image";
import Link from "next/link";
import TourCard from "./TourCard";
import { ArrowRightIcon, RouteIcon, WhatsAppIcon } from "../Icons";
import "../../styles/tour-card.css";

// Tour cards followed by the "plan a private trip" card, laid out so the last
// row never has empty cells, whatever the number of tours:
//   0 tours          -> the plan card alone, full width
//   1 cell left over -> the plan card takes it
//   2 cells left over -> the plan card spans both
//   row complete     -> the plan card becomes a band under the grid
// The column count comes from container queries in tour-card.css (1, 2 or 3
// columns by available width); data-rem2 / data-rem3 tell the CSS what is left
// in the last row for two and three columns.
export default function TourGrid({ items = [], lang, t, help = null, reveal = false }) {
  const count = items.length;

  return (
    <div className="gt-tours-wrap">
      <div
        className="gt-tour-grid"
        data-count={count}
        data-rem2={count % 2}
        data-rem3={count % 3}
        data-reveal-group={reveal ? "" : undefined}
      >
        {items.map(({ tour, eager = false, dateMatch = null }) => (
          <TourCard key={tour.id} tour={tour} lang={lang} t={t} eager={eager} dateMatch={dateMatch} />
        ))}
        {help && <HelpCard {...help} />}
      </div>
    </div>
  );
}

// Adapts to its own width (container query): a photo card when it shares a row
// with tour cards, a horizontal band when it spans the whole grid.
export function HelpCard({ id, title, text, ctaLabel, planHref, waHref, headingLevel = 3, className = "" }) {
  const Heading = `h${headingLevel}`;
  const planContent = (
    <>
      {ctaLabel}
      <ArrowRightIcon size={17} />
    </>
  );

  return (
    <aside className={`gt-help-card ${className}`.trim()} aria-labelledby={id}>
      <Image src="/kakheti.webp" alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px" quality={60} className="gt-help-card-bg" />
      <div className="gt-help-card-inner">
        <span className="gt-icon-badge"><RouteIcon size={22} /></span>
        <div className="gt-help-card-text">
          <Heading id={id}>{title}</Heading>
          <p>{text}</p>
        </div>
        <div className="gt-help-actions">
          {planHref.startsWith("#") ? (
            <a href={planHref} className="gt-btn gt-btn--gold">{planContent}</a>
          ) : (
            <Link href={planHref} className="gt-btn gt-btn--gold" prefetch={false}>{planContent}</Link>
          )}
          <a href={waHref} target="_blank" rel="noopener noreferrer" className="gt-btn gt-btn--ghost-light">
            <WhatsAppIcon size={18} />
            WhatsApp
          </a>
        </div>
      </div>
    </aside>
  );
}
