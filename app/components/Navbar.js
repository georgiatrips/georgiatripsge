"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "../lib/shared";
import { useAuth } from "../lib/AuthContext";
import { useLanguage } from "../lib/i18n/LanguageContext";
import { useCurrency, CURRENCY_RATES } from "../lib/currency/CurrencyContext";
import { FlagGeorgia, FlagUK, FlagRussia, FlagTurkey, FlagArabic } from "./Flags";

// Shared site navigation. `active` highlights the current top-level item.
// Supported active values: "home" | "tours" | "transport" | "posts" | "hotels" | "admin" | "about" | "contact"
export default function Navbar({ active = "home" }) {
  const [mounted, setMounted] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { currency, setCurrency } = useCurrency();
  const { user, logOut } = useAuth() ?? {};
  const router = useRouter();
  const { lang, setLang, t, isGeorgian, isEnglish, isRussian } = useLanguage();

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayName =
    user?.displayName ||
    user?.email?.split("@")[0] ||
    null;

  // Hover-intent: keep a dropdown open briefly after the cursor leaves the
  // trigger so it doesn't close while moving toward the menu items.
  const closeTimers = useRef({});
  const openDropdown = (setter) => {
    Object.values(closeTimers.current).forEach(clearTimeout);
    closeTimers.current = {};
    setter(true);
  };
  const scheduleClose = (key, setter) => {
    clearTimeout(closeTimers.current[key]);
    closeTimers.current[key] = setTimeout(() => setter(false), 220);
  };

  // Pages with a dark full-width hero can afford a fully transparent navbar
  // at the very top; light pages keep the solid background for readability.
  const [hasHero, setHasHero] = useState(false);

  useEffect(() => {
    setHasHero(!!document.querySelector(".hero, .tours-page-hero, .transfers-hero, .posts-hero, .page-header, .page-hero, .tdp-hero2, .hotels-hero, .admin-hero"));

    // Throttle scroll handler with rAF to avoid excessive re-renders
    let raf = 0;
    const handleScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setNavScrolled(window.scrollY > 50);
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const isTransparent = hasHero && !navScrolled && !mobileMenuOpen;

  // Language options with SVG flags
  const languages = [
    { code: "ka", label: "ქართული", flag: <FlagGeorgia width={22} height={15} /> },
    { code: "en", label: "English", flag: <FlagUK width={22} height={15} /> },
    { code: "ru", label: "Русский", flag: <FlagRussia width={22} height={15} /> },
    { code: "tr", label: "Türkçe", flag: <FlagTurkey width={22} height={15} /> },
    { code: "ar", label: "العربية", flag: <FlagArabic width={22} height={15} /> },
  ];

  const currentLang = languages.find((l) => l.code === lang) || languages[0];

  return (
    <nav className={`nav ${navScrolled || mobileMenuOpen ? "scrolled" : ""} ${isTransparent ? "transparent" : ""}`}>
      {/* Logo */}
      <Link href="/" className="nav-logo" aria-label={`GeorgiaTrips — ${t("nav.home")}`}>
        <BrandLogo priority />
        <span className="nav-wordmark">
          <span className="nav-wordmark-georgia">Georgia</span>
          <span className="nav-wordmark-trips">Trips</span>
        </span>
      </Link>

      {/* Desktop Links */}
      <ul className="nav-links">
        <li><Link href="/">{t("nav.home")}</Link></li>
        <li><Link href="/tours" className={active === "tours" ? "active" : ""}>{t("nav.tours")}</Link></li>
        <li><Link href="/places" className={active === "places" ? "active" : ""}>{t("nav.places")}</Link></li>
        <li><Link href="/hotels" className={active === "hotels" ? "active" : ""}>{t("nav.hotels")}</Link></li>
        <li><Link href="/transfers" className={active === "transfers" || active === "transport" ? "active" : ""}>{t("nav.transport")}</Link></li>
        <li><Link href="/posts" className={active === "posts" || active === "articles" ? "active" : ""}>{t("nav.articles")}</Link></li>
        {user?.isAdmin && (
          <li><Link href="/admin" className={active === "admin" ? "active" : ""}>{t("nav.admin")}</Link></li>
        )}
      </ul>

      {/* Right Side Controls */}
      <div className="nav-right">
        {/* Language Switcher */}
        <div className="nav-control-wrap" onMouseEnter={() => openDropdown(setLangDropdownOpen)} onMouseLeave={() => scheduleClose("lang", setLangDropdownOpen)}>
          <button className="nav-control-btn nav-lang-btn" aria-label={t("nav.language")} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span className="nav-lang-flag" style={{ display: "inline-flex", alignItems: "center" }}>{currentLang.flag}</span>
            <svg className={`nav-chevron ${langDropdownOpen ? "open" : ""}`} width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {langDropdownOpen && (
            <div className="nav-dropdown nav-dropdown-sm nav-lang-dropdown">
              {languages.map((l) => (
                <button
                  key={l.code}
                  className={`nav-dropdown-item ${lang === l.code ? "active" : ""}`}
                  onClick={() => { setLang(l.code); setLangDropdownOpen(false); }}
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span className="nav-lang-flag">{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Currency Switcher */}
        <div className="nav-control-wrap" onMouseEnter={() => openDropdown(setCurrencyDropdownOpen)} onMouseLeave={() => scheduleClose("currency", setCurrencyDropdownOpen)}>
          <button className="nav-control-btn" aria-label={t("nav.currency")}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 6v12M9 8h4.5a2.5 2.5 0 0 1 0 5H9m0 0h4.5a2.5 2.5 0 0 1 0 5H9" />
            </svg>
            <span>{currency}</span>
            <svg className={`nav-chevron ${currencyDropdownOpen ? "open" : ""}`} width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {currencyDropdownOpen && (
            <div className="nav-dropdown nav-dropdown-sm">
              {Object.keys(CURRENCY_RATES).map((cur) => {
                const item = CURRENCY_RATES[cur];
                return (
                  <button
                    key={cur}
                    className={`nav-dropdown-item ${currency === cur ? "active" : ""}`}
                    onClick={() => {
                      setCurrency(cur);
                      setCurrencyDropdownOpen(false);
                    }}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}
                  >
                    <span style={{ fontWeight: 800, color: "var(--teal)", minWidth: "24px", fontSize: "0.95rem" }}>
                      {item.icon || item.symbol}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: "0.86rem" }}>{cur}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* User / Login Button */}
        {mounted && user ? (
          <div
            className="nav-control-wrap"
            onMouseEnter={() => openDropdown(setUserDropdownOpen)}
            onMouseLeave={() => scheduleClose("user", setUserDropdownOpen)}
          >
            <button className="nav-login-btn nav-user-badge">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</span>
              <svg className={`nav-chevron ${userDropdownOpen ? "open" : ""}`} width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {userDropdownOpen && (
              <div className="nav-dropdown" style={{ right: 0, left: "auto", minWidth: 160 }}>
                <button className="nav-dropdown-item" onClick={() => { router.push("/login"); setUserDropdownOpen(false); }}>
                  {t("nav.profile")}
                </button>
                <button
                  className="nav-dropdown-item"
                  onClick={async () => { await logOut?.(); setUserDropdownOpen(false); router.push("/"); }}
                  style={{ color: "#f87171" }}
                >
                  {t("nav.logout")}
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="nav-login-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            {t("nav.login")}
          </Link>
        )}
      </div>

      {/* Mobile Hamburger */}
      <button
        className="nav-hamburger"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Menu"
        aria-expanded={mobileMenuOpen}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Mobile Navigation Dropdown */}
      <div className={`nav-mobile ${mobileMenuOpen ? "open" : ""}`}>
        <Link href="/" onClick={() => setMobileMenuOpen(false)}>{t("nav.home")}</Link>
        <Link href="/tours" onClick={() => setMobileMenuOpen(false)}>{t("nav.tours")}</Link>
        <Link href="/places" onClick={() => setMobileMenuOpen(false)}>{t("nav.places")}</Link>
        <Link href="/hotels" onClick={() => setMobileMenuOpen(false)}>{t("nav.hotels")}</Link>
        <Link href="/transfers" onClick={() => setMobileMenuOpen(false)}>{t("nav.transport")}</Link>
        <Link href="/posts" onClick={() => setMobileMenuOpen(false)}>{t("nav.articles")}</Link>
        {user?.isAdmin && (
          <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>{t("nav.admin")}</Link>
        )}
        <div className="nav-mobile-controls">
          {/* Mobile Language Switcher */}
          <div className="nav-mobile-ctrl-section">
            <span className="nav-mobile-ctrl-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              {t("nav.language") || "ენა"}
            </span>
            <div className="nav-mobile-lang-grid">
              {languages.map((l) => (
                <button
                  key={l.code}
                  className={`nav-mobile-lang-card ${lang === l.code ? "active" : ""}`}
                  onClick={() => {
                    setLang(l.code);
                    setMobileMenuOpen(false);
                  }}
                >
                  <span className="nav-mobile-flag">{l.flag}</span>
                  <span className="nav-mobile-lang-name">{l.label}</span>
                  {lang === l.code && <span className="nav-mobile-active-dot">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Currency Switcher */}
          <div className="nav-mobile-ctrl-section">
            <span className="nav-mobile-ctrl-title">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M9 8h4.5a2.5 2.5 0 0 1 0 5H9m0 0h4.5a2.5 2.5 0 0 1 0 5H9"/></svg>
              {t("nav.currency") || "ვალუტა"}
            </span>
            <div className="nav-mobile-curr-grid">
              {Object.keys(CURRENCY_RATES).map((cur) => {
                const item = CURRENCY_RATES[cur];
                return (
                  <button
                    key={cur}
                    className={`nav-mobile-curr-card ${currency === cur ? "active" : ""}`}
                    onClick={() => {
                      setCurrency(cur);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <span className="nav-mobile-curr-sym">{item.icon || item.symbol}</span>
                    <span className="nav-mobile-curr-code">{cur}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {mounted && user ? (
          <div className="nav-mobile-user">
            <div className="nav-mobile-user-info">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              <span>{displayName}</span>
            </div>
            <div className="nav-mobile-user-actions">
              <Link href="/login" className="nav-mobile-user-btn" onClick={() => setMobileMenuOpen(false)}>
                {t("nav.profile")}
              </Link>
              <button
                className="nav-mobile-user-btn nav-mobile-logout"
                onClick={async () => { await logOut?.(); setMobileMenuOpen(false); router.push("/"); }}
              >
                {t("nav.logout")}
              </button>
            </div>
          </div>
        ) : (
          <Link href="/login" className="nav-mobile-login" onClick={() => setMobileMenuOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            {t("nav.loginRegister")}
          </Link>
        )}
      </div>
    </nav>
  );
}