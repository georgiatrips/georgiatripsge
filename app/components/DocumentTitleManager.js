"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "../lib/i18n/LanguageContext";
import { getStaticPageTitle } from "../lib/i18n/pageTitles";

export default function DocumentTitleManager() {
  const pathname = usePathname();
  const { lang } = useLanguage();

  useEffect(() => {
    if (typeof document === "undefined") return;

    const title = getStaticPageTitle(pathname, lang);
    if (title) {
      document.title = title;
    }
  }, [pathname, lang]);

  return null;
}
