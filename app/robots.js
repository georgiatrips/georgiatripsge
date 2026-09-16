import { SITE_URL } from "./lib/siteConfig";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // /login, /booking and /coupons are deliberately not blocked: they carry
        // a noindex tag, which Google can only see if it is allowed to crawl them.
        disallow: ["/admin", "/admin/", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
