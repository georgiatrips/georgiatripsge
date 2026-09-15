"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrandLogo, PHONE_DISPLAY, PHONE_TEL, whatsappHref } from "../lib/shared";
import { useAuth } from "../lib/AuthContext";
import { useLanguage } from "../lib/i18n/LanguageContext";
import { useCurrency, CURRENCY_RATES } from "../lib/currency/CurrencyContext";
import { getLocalizedHref, SUPPORTED_LANGUAGES } from "../lib/siteConfig";
import {
  BedIcon, BriefcaseIcon, CarIcon, ChevronDownIcon, ChevronRightIcon, CloseIcon, GlobeIcon,
  MenuIcon, PhoneIcon, PlaneIcon, UserIcon, UsersIcon, WhatsAppIcon,
} from "./Icons";

const LANGUAGE_NAMES = { ka: "ქართული", en: "English", ru: "Русский", tr: "Türkçe", ar: "العربية" };

// Routes that have no [locale] segment: switching language there must only
// change the stored preference, never navigate to a non-existent /xx/... URL.
const UNLOCALIZED_PREFIXES = ["/admin", "/login", "/coupons", "/booking"];

const HERO_SELECTOR = ".gt-hero, .hero, .tours-page-hero, .transfers-hero, .posts-hero, .page-header, .page-hero, .tdp-hero, .tdp-hero2, .hotels-hero, .admin-hero";

function isUnlocalizedPath(pathname = "") {
  return UNLOCALIZED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function useDismiss(ref, open, onClose) {
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (ref.current && !ref.current.contains(event.target)) onClose();
    };
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, open, onClose]);
}

// `active` keeps the legacy prop contract used by every page:
// "home" | "tours" | "places" | "transfers" | "transport" | "posts" | "hotels" | "admin"
export default function Navbar({ active = "home" }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { lang, setLang, t } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const { user, logOut } = useAuth() ?? {};

  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hasHero, setHasHero] = useState(false);
  const [openMenu, setOpenMenu] = useState(null); // "services" | "language" | "currency" | "account" | null
  const [drawerOpen, setDrawerOpen] = useState(false);

  const servicesRef = useRef(null);
  const languageRef = useRef(null);
  const currencyRef = useRef(null);
  const accountRef = useRef(null);
  const drawerRef = useRef(null);
  const drawerTriggerRef = useRef(null);
  const menuIds = { services: useId(), language: useId(), currency: useId(), account: useId(), drawer: useId() };

  const href = useCallback((path) => getLocalizedHref(path, lang), [lang]);
  const closeMenus = useCallback(() => setOpenMenu(null), []);

  useDismiss(servicesRef, openMenu === "services", closeMenus);
  useDismiss(languageRef, openMenu === "language", closeMenus);
  useDismiss(currencyRef, openMenu === "currency", closeMenus);
  useDismiss(accountRef, openMenu === "account", closeMenus);

  useEffect(() => {
    setMounted(true);
    setHasHero(Boolean(document.querySelector(HERO_SELECTOR)));

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setScrolled(window.scrollY > 24);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
    setOpenMenu(null);
  }, [pathname]);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    drawerTriggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";

    const panel = drawerRef.current;
    panel?.querySelector("button, a")?.focus();

    const onKey = (event) => {
      if (event.key === "Escape") {
        closeDrawer();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const focusable = panel.querySelectorAll('a[href], button:not([disabled])');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen, closeDrawer]);

  const changeLanguage = (code) => {
    setOpenMenu(null);
    if (code === lang) return;
    setLang(code);
    if (isUnlocalizedPath(pathname)) return;
    const suffix = typeof window !== "undefined" ? `${window.location.search}${window.location.hash}` : "";
    router.push(`${getLocalizedHref(pathname, code)}${suffix}`);
  };

  const toggle = (name) => setOpenMenu((current) => (current === name ? null : name));

  const isTransparent = hasHero && !scrolled && !drawerOpen;
  const displayName = user?.displayName || user?.email?.split("@")[0] || "";
  const showUser = mounted && user;

  const navItems = [
    { key: "tours", label: t("site.tours"), path: "/tours", match: ["tours"] },
    { key: "destinations", label: t("site.destinations"), path: "/places", match: ["places"] },
    { key: "transfers", label: t("site.transfers"), path: "/transfers", match: ["transfers", "transport"] },
  ];

  const services = [
    { icon: <UsersIcon size={20} />, title: t("site.svcPrivate"), desc: t("site.svcPrivateDesc"), href: href("/tours?format=individual") },
    { icon: <CarIcon size={20} />, title: t("site.svcGroup"), desc: t("site.svcGroupDesc"), href: href("/tours?format=group") },
    { icon: <PlaneIcon size={20} />, title: t("site.svcTransfer"), desc: t("site.svcTransferDesc"), href: href("/transfers") },
    { icon: <BedIcon size={20} />, title: t("site.svcHotel"), desc: t("site.svcHotelDesc"), href: whatsappHref(t("site.hotelWa")), external: true },
    { icon: <BriefcaseIcon size={20} />, title: t("site.svcVip"), desc: t("site.svcVipDesc"), href: href("/#vip") },
  ];

  const renderServiceLink = (item, onNavigate) => {
    const inner = (
      <>
        <span className="gt-icon-badge gt-icon-badge--sm">{item.icon}</span>
        <span>
          <strong>{item.title}</strong>
          <small>{item.desc}</small>
        </span>
      </>
    );
    return item.external ? (
      <a key={item.title} href={item.href} target="_blank" rel="noopener noreferrer" className="gt-menu-item" onClick={onNavigate}>{inner}</a>
    ) : (
      <Link key={item.title} href={item.href} className="gt-menu-item" onClick={onNavigate} prefetch={false}>{inner}</Link>
    );
  };

  return (
    <>
      <a className="gt-skip-link" href="#gt-content">{t("site.skip")}</a>
      <header className={`gt-header${isTransparent ? " is-transparent" : ""}${scrolled ? " is-scrolled" : ""}`}>
        <div className="gt-header-bar">
          <Link href={href("/")} className="gt-brand" aria-label={`GeorgiaTrips — ${t("nav.home")}`}>
            <BrandLogo width={40} height={40} priority />
            <span className="gt-brand-text" aria-hidden="true">
              <span className="gt-brand-word">Georgia<b>Trips</b></span>
              <span className="gt-brand-tag">{t("site.brandTagline")}</span>
            </span>
          </Link>

          <nav className="gt-nav" aria-label={t("site.mainNav")}>
            <ul className="gt-nav-list">
              {navItems.map((item) => {
                const isActive = item.match.includes(active);
                return (
                  <li key={item.key}>
                    <Link href={href(item.path)} className={`gt-nav-link${isActive ? " is-active" : ""}`} aria-current={isActive ? "page" : undefined}>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
              <li className="gt-has-menu" ref={servicesRef}>
                <button
                  type="button"
                  className="gt-nav-link"
                  aria-expanded={openMenu === "services"}
                  aria-controls={menuIds.services}
                  onClick={() => toggle("services")}
                >
                  {t("site.services")}
                  <ChevronDownIcon size={14} className={`gt-caret${openMenu === "services" ? " is-open" : ""}`} />
                </button>
                {openMenu === "services" && (
                  <div className="gt-menu gt-menu--wide" id={menuIds.services}>
                    {services.map((item) => renderServiceLink(item, closeMenus))}
                  </div>
                )}
              </li>
              <li className="gt-nav-why">
                <Link href={href("/#why")} className="gt-nav-link">{t("site.why")}</Link>
              </li>
            </ul>
          </nav>

          <div className="gt-header-actions">
            <a href={`tel:${PHONE_TEL}`} className="gt-header-phone">
              <PhoneIcon size={18} />
              <span>
                <small>{t("site.callUs")}</small>
                <strong dir="ltr">{PHONE_DISPLAY}</strong>
              </span>
            </a>

            <div className="gt-has-menu" ref={languageRef}>
              <button
                type="button"
                className="gt-pill-btn"
                aria-expanded={openMenu === "language"}
                aria-controls={menuIds.language}
                aria-label={`${t("nav.language")}: ${LANGUAGE_NAMES[lang]}`}
                onClick={() => toggle("language")}
              >
                <GlobeIcon size={17} />
                <span>{lang.toUpperCase()}</span>
              </button>
              {openMenu === "language" && (
                <ul className="gt-menu gt-menu--end" id={menuIds.language}>
                  {SUPPORTED_LANGUAGES.map((code) => (
                    <li key={code}>
                      <button
                        type="button"
                        className={`gt-menu-option${code === lang ? " is-active" : ""}`}
                        aria-current={code === lang ? "true" : undefined}
                        lang={code}
                        dir={code === "ar" ? "rtl" : "ltr"}
                        onClick={() => changeLanguage(code)}
                      >
                        {LANGUAGE_NAMES[code]}
                        <span className="gt-menu-code">{code.toUpperCase()}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="gt-has-menu gt-desktop-only" ref={currencyRef}>
              <button
                type="button"
                className="gt-pill-btn"
                aria-expanded={openMenu === "currency"}
                aria-controls={menuIds.currency}
                aria-label={`${t("nav.currency")}: ${currency}`}
                onClick={() => toggle("currency")}
              >
                <span aria-hidden="true">{CURRENCY_RATES[currency]?.symbol}</span>
                <span>{currency}</span>
              </button>
              {openMenu === "currency" && (
                <ul className="gt-menu gt-menu--end" id={menuIds.currency}>
                  {Object.keys(CURRENCY_RATES).map((code) => (
                    <li key={code}>
                      <button
                        type="button"
                        className={`gt-menu-option${code === currency ? " is-active" : ""}`}
                        aria-current={code === currency ? "true" : undefined}
                        onClick={() => { setCurrency(code); closeMenus(); }}
                      >
                        {CURRENCY_RATES[code].label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="gt-has-menu gt-desktop-only" ref={accountRef}>
              {showUser ? (
                <>
                  <button
                    type="button"
                    className="gt-icon-btn"
                    aria-expanded={openMenu === "account"}
                    aria-controls={menuIds.account}
                    aria-label={`${t("site.account")}: ${displayName}`}
                    onClick={() => toggle("account")}
                  >
                    <UserIcon size={20} />
                  </button>
                  {openMenu === "account" && (
                    <ul className="gt-menu gt-menu--end" id={menuIds.account}>
                      <li className="gt-menu-heading">{displayName}</li>
                      <li><Link href="/login" className="gt-menu-option" onClick={closeMenus}>{t("nav.profile")}</Link></li>
                      <li><Link href="/coupons" className="gt-menu-option" onClick={closeMenus}>{t("nav.coupons")}</Link></li>
                      {user?.isAdmin && <li><Link href="/admin" className="gt-menu-option" onClick={closeMenus}>{t("nav.admin")}</Link></li>}
                      <li>
                        <button
                          type="button"
                          className="gt-menu-option is-danger"
                          onClick={async () => { closeMenus(); await logOut?.(); router.push(href("/")); }}
                        >
                          {t("nav.logout")}
                        </button>
                      </li>
                    </ul>
                  )}
                </>
              ) : (
                <Link href="/login" className="gt-icon-btn" aria-label={t("nav.loginRegister")} prefetch={false}>
                  <UserIcon size={20} />
                </Link>
              )}
            </div>

            <a
              href={whatsappHref(t("site.generalWa"))}
              target="_blank"
              rel="noopener noreferrer"
              className="gt-icon-btn gt-mobile-only"
              aria-label={t("site.chatWhatsapp")}
            >
              <WhatsAppIcon size={21} />
            </a>

            <Link href={href("/#plan")} className="gt-btn gt-btn--gold gt-btn--sm gt-header-cta">
              {t("site.planTrip")}
            </Link>

            <button
              ref={drawerTriggerRef}
              type="button"
              className="gt-icon-btn gt-menu-toggle"
              aria-expanded={drawerOpen}
              aria-controls={menuIds.drawer}
              aria-label={t("site.openMenu")}
              onClick={() => { setOpenMenu(null); setDrawerOpen(true); }}
            >
              <MenuIcon size={24} />
            </button>
          </div>
        </div>
      </header>
      <div id="gt-content" tabIndex={-1} />

      {drawerOpen && (
        <>
          <div className="gt-drawer-backdrop" onClick={closeDrawer} aria-hidden="true" />
          <div
            ref={drawerRef}
            id={menuIds.drawer}
            className="gt-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={t("site.menu")}
          >
            <div className="gt-drawer-head">
              <span className="gt-brand gt-brand--static">
                <BrandLogo width={34} height={34} />
                <span className="gt-brand-text">
                  <span className="gt-brand-word">Georgia<b>Trips</b></span>
                  <span className="gt-brand-tag">{t("site.brandTagline")}</span>
                </span>
              </span>
              <button type="button" className="gt-icon-btn" aria-label={t("site.closeMenu")} onClick={closeDrawer}>
                <CloseIcon size={24} />
              </button>
            </div>

            <nav className="gt-drawer-section" aria-label={t("site.mainNav")}>
              {navItems.map((item) => (
                <Link key={item.key} href={href(item.path)} className="gt-drawer-link" onClick={() => setDrawerOpen(false)}>
                  {item.label}
                  <ChevronRightIcon size={18} />
                </Link>
              ))}
              <Link href={href("/#why")} className="gt-drawer-link" onClick={() => setDrawerOpen(false)}>
                {t("site.why")}
                <ChevronRightIcon size={18} />
              </Link>
            </nav>

            <div className="gt-drawer-section">
              <p className="gt-drawer-label">{t("site.services")}</p>
              <div className="gt-drawer-services">
                {services.map((item) => renderServiceLink(item, () => setDrawerOpen(false)))}
              </div>
            </div>

            <div className="gt-drawer-section gt-drawer-cta">
              <Link href={href("/#plan")} className="gt-btn gt-btn--gold gt-btn--block" onClick={() => setDrawerOpen(false)}>
                {t("site.planTrip")}
              </Link>
              <a href={whatsappHref(t("site.generalWa"))} target="_blank" rel="noopener noreferrer" className="gt-btn gt-btn--wa gt-btn--block">
                <WhatsAppIcon size={19} /> {t("site.chatWhatsapp")}
              </a>
              <a href={`tel:${PHONE_TEL}`} className="gt-btn gt-btn--outline gt-btn--block">
                <PhoneIcon size={18} /> {t("site.call")}
              </a>
            </div>

            <div className="gt-drawer-section">
              <p className="gt-drawer-label">{t("nav.language")}</p>
              <div className="gt-choice-grid">
                {SUPPORTED_LANGUAGES.map((code) => (
                  <button
                    key={code}
                    type="button"
                    className={`gt-choice${code === lang ? " is-active" : ""}`}
                    aria-pressed={code === lang}
                    lang={code}
                    onClick={() => changeLanguage(code)}
                  >
                    {LANGUAGE_NAMES[code]}
                  </button>
                ))}
              </div>
            </div>

            <div className="gt-drawer-section">
              <p className="gt-drawer-label">{t("nav.currency")}</p>
              <div className="gt-choice-grid">
                {Object.keys(CURRENCY_RATES).map((code) => (
                  <button
                    key={code}
                    type="button"
                    className={`gt-choice${code === currency ? " is-active" : ""}`}
                    aria-pressed={code === currency}
                    onClick={() => setCurrency(code)}
                  >
                    {CURRENCY_RATES[code].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="gt-drawer-section gt-drawer-account">
              {showUser ? (
                <>
                  <p className="gt-drawer-label">{displayName}</p>
                  <Link href="/login" className="gt-drawer-link" onClick={() => setDrawerOpen(false)}>{t("nav.profile")}<ChevronRightIcon size={18} /></Link>
                  <Link href="/coupons" className="gt-drawer-link" onClick={() => setDrawerOpen(false)}>{t("nav.coupons")}<ChevronRightIcon size={18} /></Link>
                  {user?.isAdmin && (
                    <Link href="/admin" className="gt-drawer-link" onClick={() => setDrawerOpen(false)}>{t("nav.admin")}<ChevronRightIcon size={18} /></Link>
                  )}
                  <button
                    type="button"
                    className="gt-drawer-link is-danger"
                    onClick={async () => { setDrawerOpen(false); await logOut?.(); router.push(href("/")); }}
                  >
                    {t("nav.logout")}
                  </button>
                </>
              ) : (
                <Link href="/login" className="gt-drawer-link" onClick={() => setDrawerOpen(false)}>
                  {t("nav.loginRegister")}
                  <ChevronRightIcon size={18} />
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
