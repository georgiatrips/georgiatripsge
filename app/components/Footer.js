"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "../lib/i18n/LanguageContext";
import {
  BrandLogo, EMAIL, PHONE_DISPLAY, PHONE_TEL, whatsappHref,
  FACEBOOK_LINK, INSTAGRAM_LINK, INSTAGRAM_HANDLE, TIKTOK_LINK, YOUTUBE_LINK, LINKEDIN_LINK, TELEGRAM_LINK,
} from "../lib/shared";
import { getLocalizedHref, SUPPORTED_LANGUAGES } from "../lib/siteConfig";
import { LocationIcon, MailIcon, PhoneIcon, WhatsAppIcon } from "./Icons";
import { FacebookGlyph, InstagramGlyph, LinkedInGlyph, TelegramGlyph, TikTokGlyph, YouTubeGlyph, WhatsAppGlyph } from "./SocialIcons";
import MobileContactBar from "./site/MobileContactBar";

const LANGUAGE_NAMES = { ka: "ქართული", en: "English", ru: "Русский", tr: "Türkçe", ar: "العربية" };

// Static site footer: every link is a known route or contact, so it renders
// instantly with no Firestore round-trip. `contactBar` adds the fixed
// WhatsApp / call / tours bar on phones (pages with their own sticky booking
// bar leave it off).
export default function Footer({ contactBar = false, primaryHref, primaryLabel }) {
  const { t, lang } = useLanguage();
  const pathname = usePathname() || "/";
  const href = (path) => getLocalizedHref(path, lang);
  const year = new Date().getFullYear();

  const socials = [
    { label: "Instagram", url: INSTAGRAM_LINK, Icon: InstagramGlyph },
    { label: "Facebook", url: FACEBOOK_LINK, Icon: FacebookGlyph },
    { label: "WhatsApp", url: whatsappHref(t("site.generalWa")), Icon: WhatsAppGlyph },
    { label: "Telegram", url: TELEGRAM_LINK, Icon: TelegramGlyph },
    { label: "TikTok", url: TIKTOK_LINK, Icon: TikTokGlyph },
    { label: "YouTube", url: YOUTUBE_LINK, Icon: YouTubeGlyph },
    { label: "LinkedIn", url: LINKEDIN_LINK, Icon: LinkedInGlyph },
  ];

  const services = [
    { label: t("site.tours"), path: "/tours" },
    { label: t("site.svcPrivate"), path: "/tours?format=individual" },
    { label: t("site.svcGroup"), path: "/tours?format=group" },
    { label: t("site.transfers"), path: "/transfers" },
    { label: t("nav.hotels"), path: "/hotels" },
    { label: t("nav.articles"), path: "/posts" },
  ];

  const explore = [
    { label: t("site.destinations"), path: "/places" },
    { label: t("site.lpToursFromBatumi"), path: "/tours-from-batumi" },
    { label: t("site.lpPrivateBatumi"), path: "/private-tours-batumi" },
    { label: t("site.lpThingsToDo"), path: "/things-to-do-in-batumi" },
    { label: t("site.lpWaterfalls"), path: "/waterfalls-near-batumi" },
    { label: t("site.lpAirport"), path: "/batumi-airport-transfer" },
  ];

  const help = [
    { label: t("site.planTrip"), path: "/#plan" },
    { label: t("site.faq"), path: "/#faq" },
    { label: t("site.bookingStatus"), path: "/booking/status", raw: true },
    { label: t("nav.loginRegister"), path: "/login", raw: true },
    { label: t("footer.privacyPolicy"), path: "/privacy-policy" },
    { label: t("footer.terms"), path: "/terms" },
  ];

  const renderLinks = (items) => (
    <ul className="gt-footer-links">
      {items.map((item) => (
        <li key={item.path}>
          <Link href={item.raw ? item.path : href(item.path)} prefetch={false}>{item.label}</Link>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {contactBar && <MobileContactBar primaryHref={primaryHref} primaryLabel={primaryLabel} />}
      <footer className="gt-footer">
        <div className="gt-container">
          <div className="gt-footer-grid">
            <div className="gt-footer-brand">
              <Link href={href("/")} className="gt-brand gt-brand--light" aria-label={`GeorgiaTrips — ${t("nav.home")}`}>
                <BrandLogo width={44} height={44} />
                <span className="gt-brand-text" aria-hidden="true">
                  <span className="gt-brand-word">Georgia<b>Trips</b></span>
                  <span className="gt-brand-tag">{t("site.brandTagline")}</span>
                </span>
              </Link>
              <p className="gt-footer-tagline">{t("site.footerTagline")}</p>
              <ul className="gt-footer-contact">
                <li>
                  <a href={`tel:${PHONE_TEL}`}>
                    <PhoneIcon size={16} />
                    <span><span dir="ltr">{PHONE_DISPLAY}</span><small>{t("site.callUs")}</small></span>
                  </a>
                </li>
                <li>
                  <a href={whatsappHref(t("site.generalWa"))} target="_blank" rel="noopener noreferrer">
                    <WhatsAppIcon size={16} />
                    <span>WhatsApp<small>{t("site.support247")}</small></span>
                  </a>
                </li>
                <li>
                  <a href={`mailto:${EMAIL}`}>
                    <MailIcon size={16} />
                    <span dir="ltr">{EMAIL}</span>
                  </a>
                </li>
                <li>
                  <span className="gt-footer-contact-static">
                    <LocationIcon size={16} />
                    <span>{t("footer.address")}</span>
                  </span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="gt-footer-title">{t("site.footerServices")}</h3>
              {renderLinks(services)}
            </div>
            <div>
              <h3 className="gt-footer-title">{t("site.footerExplore")}</h3>
              {renderLinks(explore)}
            </div>
            <div>
              <h3 className="gt-footer-title">{t("site.footerHelp")}</h3>
              {renderLinks(help)}
            </div>
          </div>

          <div className="gt-footer-bottom">
            <ul className="gt-socials" aria-label={t("site.socialLabel")}>
              {socials.map(({ label, url, Icon }) => (
                <li key={label}>
                  <a href={url} target="_blank" rel="noopener noreferrer" aria-label={label === "Instagram" ? `Instagram — @${INSTAGRAM_HANDLE}` : label} title={label}>
                    <Icon size={17} />
                  </a>
                </li>
              ))}
            </ul>
            <ul className="gt-footer-langs" aria-label={t("site.languages")}>
              {SUPPORTED_LANGUAGES.map((code) => (
                <li key={code}>
                  <Link
                    href={getLocalizedHref(pathname, code)}
                    lang={code}
                    hrefLang={code}
                    className={code === lang ? "is-current" : ""}
                    aria-current={code === lang ? "true" : undefined}
                    prefetch={false}
                  >
                    {LANGUAGE_NAMES[code]}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="gt-footer-legal">© {year} GeorgiaTrips. {t("footer.rights")}</p>
            <p className="gt-footer-dev">
              {t("site.developedBy")}{" "}
              <a href="https://www.instagram.com/lominadzee10/" target="_blank" rel="noopener noreferrer author">@lominadzee10</a>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
