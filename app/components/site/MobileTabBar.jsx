"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { getLocalizedHref, SUPPORTED_LANGUAGES } from "../../lib/siteConfig";
import { CarIcon, CompassIcon, LocationIcon, UserIcon } from "../Icons";

// App-style navigation for phones (CSS shows it at <=768px only): tours,
// destinations, transfers and the account. Contact stays one tap away in the
// header's WhatsApp button, so this bar is only for moving around the site.
// The spacer keeps the end of the page clear of the fixed bar.
export default function MobileTabBar() {
  const pathname = usePathname() || "/";
  const { t, lang } = useLanguage();
  const { user } = useAuth() ?? {};
  // The signed-in state is only known in the browser; render "login" first so
  // the server and client markup match.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (pathname.startsWith("/admin")) return null;

  const parts = pathname.split("/").filter(Boolean);
  const section = (SUPPORTED_LANGUAGES.includes(parts[0]) ? parts[1] : parts[0]) || "";
  const signedIn = mounted && Boolean(user);

  const items = [
    { key: "tours", href: getLocalizedHref("/tours", lang), label: t("site.tours"), icon: <CompassIcon size={22} />, active: section === "tours" },
    { key: "places", href: getLocalizedHref("/places", lang), label: t("site.destinations"), icon: <LocationIcon size={22} />, active: section === "places" },
    {
      key: "transfers",
      href: getLocalizedHref("/transfers", lang),
      label: t("site.transfers"),
      icon: <CarIcon size={22} />,
      active: section === "transfers" || section === "batumi-airport-transfer",
    },
    { key: "account", href: "/login", label: t(signedIn ? "nav.profile" : "nav.login"), icon: <UserIcon size={22} />, active: section === "login" || section === "coupons" },
  ];

  return (
    <>
      <div className="gt-tabbar-spacer" aria-hidden="true" />
      <nav className="gt-tabbar" aria-label={t("site.mainNav")}>
        <ul>
          {items.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                className={`gt-tabbar-item${item.active ? " is-active" : ""}`}
                aria-current={item.active ? "page" : undefined}
                prefetch={false}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
