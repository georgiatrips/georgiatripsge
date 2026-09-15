"use client";

import Link from "next/link";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { getLocalizedHref } from "../../lib/siteConfig";
import { whatsappHref } from "../../lib/shared";
import TourGrid from "../site/TourGrid";
import { ArrowRightIcon } from "../Icons";
import "../../styles/tour-card.css";

// Other tours, rendered with the same card and grid as the homepage and
// catalog so prices, dates and the WhatsApp action look identical everywhere.
// With one or two other tours the plan-a-trip card fills the rest of the row.
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
        <TourGrid
          items={tours.map((tour) => ({ tour }))}
          lang={lang}
          t={t}
          reveal
          help={{
            id: "similar-help-title",
            title: t("homepage.customTitle"),
            text: t("homepage.customText"),
            ctaLabel: t("homepage.customCta"),
            planHref: getLocalizedHref("/#plan", lang),
            waHref: whatsappHref(t("site.generalWa")),
          }}
        />
      </div>
    </section>
  );
}
