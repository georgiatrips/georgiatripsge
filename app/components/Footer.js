"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "../lib/i18n/LanguageContext";
import {
  BrandLogo, FACEBOOK_LINK, INSTAGRAM_LINK, LINKEDIN_LINK, PHONE_DISPLAY, PHONE_TEL,
  TELEGRAM_LINK, TIKTOK_LINK, YOUTUBE_LINK, whatsappHref,
} from "../lib/shared";
import { getLocalizedHref, SUPPORTED_LANGUAGES } from "../lib/siteConfig";
import { LocationIcon, MailIcon, PhoneIcon, WhatsAppIcon } from "./Icons";
import MobileContactBar from "./site/MobileContactBar";

const LANGUAGE_NAMES = { ka: "ქართული", en: "English", ru: "Русский", tr: "Türkçe", ar: "العربية" };
const UNLOCALIZED_PREFIXES = ["/admin", "/login", "/coupons", "/booking"];

const SOCIALS = [
  { label: "Facebook", href: FACEBOOK_LINK, path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
  { label: "Instagram", href: INSTAGRAM_LINK, path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" },
  { label: "YouTube", href: YOUTUBE_LINK, path: "M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" },
  { label: "TikTok", href: TIKTOK_LINK, path: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-1.01-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 2.89 3.5 2.77 1.81-.04 3.29-1.51 3.36-3.33.04-2.89.02-5.78.02-8.67V.02z" },
  { label: "Telegram", href: TELEGRAM_LINK, path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.25.38-.51 1.07-.78 4.18-1.82 6.97-3.02 8.37-3.61 3.99-1.66 4.82-1.95 5.36-1.96.12 0 .38.03.55.17.14.12.18.28.2.45-.02.07-.02.16-.04.29z" },
  { label: "LinkedIn", href: LINKEDIN_LINK, path: "M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" },
];

// `contactBar` lets pages with their own sticky booking bar (tour detail)
// opt out of the generic mobile contact bar.
export default function Footer({ contactBar = true }) {
  const { t, lang } = useLanguage();
  const pathname = usePathname() || "/";
  const href = (path) => getLocalizedHref(path, lang);
  const onUnlocalizedRoute = UNLOCALIZED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  const columns = [
    {
      title: t("site.footerServices"),
      links: [
        { label: t("site.tours"), href: href("/tours") },
        { label: t("site.svcPrivate"), href: href("/tours?format=individual") },
        { label: t("site.svcGroup"), href: href("/tours?format=group") },
        { label: t("site.svcTransfer"), href: href("/transfers") },
        { label: t("site.svcVip"), href: href("/#vip") },
        { label: t("nav.hotels"), href: href("/hotels") },
      ],
    },
    {
      title: t("site.footerExplore"),
      links: [
        { label: t("site.destinations"), href: href("/places") },
        { label: t("site.lpToursFromBatumi"), href: href("/tours-from-batumi") },
        { label: t("site.lpPrivateBatumi"), href: href("/private-tours-batumi") },
        { label: t("site.lpThingsToDo"), href: href("/things-to-do-in-batumi") },
        { label: t("site.lpWaterfalls"), href: href("/waterfalls-near-batumi") },
        { label: t("site.lpAirport"), href: href("/batumi-airport-transfer") },
        { label: t("site.stories"), href: href("/posts") },
      ],
    },
    {
      title: t("site.footerHelp"),
      links: [
        { label: t("site.planTrip"), href: href("/#plan") },
        { label: t("site.faq"), href: href("/#faq") },
        { label: t("site.bookingStatus"), href: "/booking/status" },
        { label: t("footer.privacyPolicy"), href: href("/privacy-policy") },
        { label: t("footer.terms"), href: href("/terms") },
      ],
    },
  ];

  return (
    <>
      <footer className="gt-footer">
        <div className="gt-container">
          <div className="gt-footer-grid">
            <div className="gt-footer-brand">
              <Link href={href("/")} className="gt-brand gt-brand--light" prefetch={false}>
                <BrandLogo width={40} height={40} />
                <span className="gt-brand-word">Georgia<b>Trips</b></span>
              </Link>
              <p className="gt-footer-tagline">{t("site.footerTagline")}</p>
              <a
                href={whatsappHref(t("site.generalWa"))}
                target="_blank"
                rel="noopener noreferrer"
                className="gt-btn gt-btn--wa"
              >
                <WhatsAppIcon size={19} /> {t("site.chatWhatsapp")}
              </a>
              <ul className="gt-footer-contact">
                <li>
                  <a href={`tel:${PHONE_TEL}`}>
                    <PhoneIcon size={16} />
                    <span dir="ltr">{PHONE_DISPLAY}</span>
                  </a>
                  <small>{t("site.support247")}</small>
                </li>
                <li>
                  <a href={`mailto:${t("footer.email")}`}>
                    <MailIcon size={16} />
                    <span>{t("footer.email")}</span>
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

            {columns.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h2 className="gt-footer-title">{column.title}</h2>
                <ul className="gt-footer-links">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} prefetch={false}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          <div className="gt-footer-bottom">
            <nav className="gt-footer-langs" aria-label={t("site.languages")}>
              {SUPPORTED_LANGUAGES.map((code) => (
                <Link
                  key={code}
                  href={onUnlocalizedRoute ? `/${code}` : getLocalizedHref(pathname, code)}
                  hrefLang={code}
                  lang={code}
                  className={code === lang ? "is-current" : undefined}
                  aria-current={code === lang ? "true" : undefined}
                  prefetch={false}
                >
                  {LANGUAGE_NAMES[code]}
                </Link>
              ))}
            </nav>

            <ul className="gt-socials" aria-label={t("site.socialLabel")}>
              {SOCIALS.map((social) => (
                <li key={social.label}>
                  <a href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true" focusable="false">
                      <path d={social.path} />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>

            <p className="gt-footer-legal">
              © {new Date().getFullYear()} GeorgiaTrips. {t("footer.rights")}{" "}
              <span className="gt-footer-dev">
                Developed &amp; Designed by{" "}
                <a href="https://www.instagram.com/lominadzee10/" target="_blank" rel="noopener noreferrer author">@lominadzee10</a>
              </span>
            </p>
          </div>
        </div>
      </footer>
      {contactBar && <MobileContactBar />}
    </>
  );
}
