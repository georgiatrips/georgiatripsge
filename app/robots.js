import { SITE_URL } from "./lib/siteConfig";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/*/admin",
          "/*/admin/",
          "/login",
          "/login/",
          "/*/login",
          "/*/login/",
          "/coupons",
          "/coupons/",
          "/*/coupons",
          "/*/coupons/",
          "/booking",
          "/booking/",
          "/*/booking",
          "/*/booking/",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
