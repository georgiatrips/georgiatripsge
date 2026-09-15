"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BrandLogo, PHONE_DISPLAY, PHONE_TEL, whatsappHref } from "../lib/shared";
import { useAuth } from "../lib/AuthContext";
import { useLanguage } from "../lib/i18n/LanguageContext";
import { useCurrency, CURRENCY_RATES } from "../lib/currency/CurrencyContext";
import { getLocalizedHref, SUPPORTED_LANGUAGES } from "../lib/siteConfig";
import { ChevronRightIcon, CloseIcon, GlobeIcon, MenuIcon, PhoneIcon, UserIcon, WhatsAppIcon } from "./Icons";

const LANGUAGE_NAMES = { ka: "ქართული", en: "English", ru: "Русский", tr: "Türkçe", ar: "العربية" };

// Routes without a [locale] segment: switching language there only changes
// the stored preference, never navigates to a non-existent /xx/... URL.
const UNLOCALIZED_PREFIXES = ["/admin", "/login", "/coupons", "/booking"];

// Pages that open with a full-bleed dark hero can afford a see-through bar at
// the very top. Detected from the DOM when the page doesn't say explicitly.
const HERO_SELECTOR = ".gt-hero, .hero, .tours-page-hero, .transfers-hero, .posts-hero, .page-header, .page-hero, .tdp-hero, .tdp-hero2, .hotels-hero, .place-detail-hero";

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

// `active` highlights the current top-level item:
// "home" | "tours" | "places" | "transfers" | "transport" | "posts" | "articles" | "hotels" | "admin"
// `overlay` forces the transparent-over-hero state on first paint (pages with
// a hero pass true so the bar never flashes white before hydration).
export default function Navbar({ active = "home", overlay }) {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { lang, setLang, t } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const { user, logOut } = useAuth() ?? {};

  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hasHero, setHasHero] = useState(Boolean(overlay));
  const [openMenu, setOpenMenu] = useState(null); // "language" | "currency" | "account" | null
  const [drawerOpen, setDrawerOpen] = useState(false);

  const languageRef = useRef(null);
  const currencyRef = useRef(null);
  const accountRef = useRef(null);
  const drawerRef = useRef(null);
  const drawerTriggerRef = useRef(null);
  const menuIds = { language: useId(), currency: useId(), account: useId(), drawer: useId() };

  const href = useCallback((path) => getLocalizedHref(path, lang), [lang]);
  const closeMenus = useCallback(() => setOpenMenu(null), []);

  useDismiss(languageRef, openMenu === "language", closeMenus);
  useDismiss(currencyRef, openMenu === "currency", closeMenus);
  useDismiss(accountRef, openMenu === "account", closeMenus);

  useEffect(() => {
    setMounted(true);
    if (overlay === undefined) setHasHero(Boolean(document.querySelector(HERO_SELECTOR)));

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
  }, [overlay]);

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
    setDrawerOpen(false);
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
  const generalWa = whatsappHref(t("site.generalWa"));

  const navItems = [
    { key: "tours", label: t("site.tours"), path: "/tours", match: ["tours"] },
    { key: "places", label: t("site.destinations"), path: "/places", match: ["places"] },
    { key: "transfers", label: t("site.transfers"), path: "/transfers", match: ["transfers", "transport"] },
    { key: "hotels", label: t("nav.hotels"), path: "/hotels", match: ["hotels"] },
    { key: "posts", label: t("nav.articles"), path: "/posts", match: ["posts", "articles"] },
  ];

  const brand = (light) => (
    <span className={`gt-brand-text${light ? "" : ""}`}>
      <span className="gt-brand-word">Georgia<b>Trips</b></span>
      <span className="gt-brand-tag">{t("site.brandTagline")}</span>
    </span>
  );

  return (
    <>
      <a className="gt-skip-link" href="#gt-content">{t("site.skip")}</a>
      <header className={`gt-header${isTransparent ? " is-transparent" : ""}${scrolled ? " is-scrolled" : ""}`}>
        <div className="gt-header-bar">
          <Link href={href("/")} className="gt-brand" aria-label={`GeorgiaTrips — ${t("nav.home")}`}>
            <BrandLogo width={42} height={42} priority />
            <span aria-hidden="true">{brand()}</span>
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

            <div className="gt-has-menu gt-lang-menu" ref={languageRef}>
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

            {/* Login with its label, or the signed-in visitor's name (all screen sizes). */}
            <div className="gt-has-menu" ref={accountRef}>
              {showUser ? (
                <>
                  <button
                    type="button"
                    className="gt-account-btn"
                    aria-expanded={openMenu === "account"}
                    aria-controls={menuIds.account}
                    aria-label={`${t("site.account")}: ${displayName}`}
                    onClick={() => toggle("account")}
                  >
                    <UserIcon size={18} />
                    <span className="gt-account-label">{displayName}</span>
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
                <Link href="/login" className="gt-account-btn" prefetch={false}>
                  <UserIcon size={18} />
                  <span className="gt-account-label">{t("nav.login")}</span>
                </Link>
              )}
            </div>

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
          <div ref={drawerRef} id={menuIds.drawer} className="gt-drawer" role="dialog" aria-modal="true" aria-label={t("site.menu")}>
            <div className="gt-drawer-head">
              <span className="gt-brand">
                <BrandLogo width={34} height={34} />
                {brand()}
              </span>
              <button type="button" className="gt-icon-btn" aria-label={t("site.closeMenu")} onClick={closeDrawer}>
                <CloseIcon size={24} />
              </button>
            </div>

            <nav className="gt-drawer-section" aria-label={t("site.mainNav")}>
              <Link href={href("/")} className={`gt-drawer-link${active === "home" ? " is-active" : ""}`} onClick={() => setDrawerOpen(false)}>
                {t("nav.home")}
                <ChevronRightIcon size={18} />
              </Link>
              {navItems.map((item) => (
                <Link
                  key={item.key}
                  href={href(item.path)}
                  className={`gt-drawer-link${item.match.includes(active) ? " is-active" : ""}`}
                  onClick={() => setDrawerOpen(false)}
                >
                  {item.label}
                  <ChevronRightIcon size={18} />
                </Link>
              ))}
            </nav>

            <div className="gt-drawer-section gt-drawer-cta">
              <a href={generalWa} target="_blank" rel="noopener noreferrer" className="gt-btn gt-btn--wa gt-btn--block">
                <WhatsAppIcon size={19} /> {t("site.chatWhatsapp")}
              </a>
              <a href={`tel:${PHONE_TEL}`} className="gt-btn gt-btn--outline gt-btn--block">
                <PhoneIcon size={18} /> <span dir="ltr">{PHONE_DISPLAY}</span>
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

            <div className="gt-drawer-section">
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
                  <span><UserIcon size={18} style={{ verticalAlign: "-3px", marginInlineEnd: "0.5rem" }} />{t("nav.loginRegister")}</span>
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
