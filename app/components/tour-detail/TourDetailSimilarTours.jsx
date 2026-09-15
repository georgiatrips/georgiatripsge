"use client";

import Link from "next/link";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { getLocalizedHref } from "../../lib/siteConfig";
import TourCard from "../site/TourCard";
import { ArrowRightIcon } from "../Icons";
import "../../styles/tour-card.css";

// Other tours, rendered with the same card as the homepage and catalog so
// prices, dates and the WhatsApp action look identical everywhere.
export default function TourDetailSimilarTours({ tours = [] }) {
  const { t, lang } = useLanguage();
  if (!tours.length) return null;

  return (
    <section className="gt-section gt-section--paper" aria-labelledby="similar-tours-title">
      <div className="gt-container">
        <div className="gt-section-head gt-section-head--split" data-reveal>
          <div>
            <p className="gt-eyebrow">{t("tourDetail.discoverOther")}</p>
            <h2 id="similar-tours-title" className="gt-h2">{t("tourDetail.similarTours")}</h2>
          </div>
          <Link href={getLocalizedHref("/tours", lang)} className="gt-link" prefetch={false}>
            {t("homepage.toursAll")}
            <ArrowRightIcon size={16} />
          </Link>
        </div>
        <div className="gt-tour-grid" data-reveal-group>
          {tours.map((tour) => (
            <TourCard key={tour.id} tour={tour} lang={lang} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
