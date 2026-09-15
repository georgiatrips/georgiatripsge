"use client";

import Link from "next/link";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { PHONE_TEL, whatsappHref } from "../../lib/shared";
import { getLocalizedHref } from "../../lib/siteConfig";
import { PhoneIcon, WhatsAppIcon } from "../Icons";

// Persistent contact bar for phones (CSS shows it at <=768px only). The
// spacer reserves the same height at the end of the page so the bar never
// covers the last piece of content.
export default function MobileContactBar() {
  const { t, lang } = useLanguage();

  return (
    <>
      <div className="gt-mobile-bar-spacer" aria-hidden="true" />
      <nav className="gt-mobile-bar" aria-label={t("site.mobileBar")}>
        <a
          href={whatsappHref(t("site.generalWa"))}
          target="_blank"
          rel="noopener noreferrer"
          className="gt-mobile-bar-item is-wa"
        >
          <WhatsAppIcon size={19} />
          <span>WhatsApp</span>
        </a>
        <a href={`tel:${PHONE_TEL}`} className="gt-mobile-bar-item">
          <PhoneIcon size={18} />
          <span>{t("site.call")}</span>
        </a>
        <Link href={getLocalizedHref("/#plan", lang)} className="gt-mobile-bar-item is-primary" prefetch={false}>
          {t("site.planShort")}
        </Link>
      </nav>
    </>
  );
}
