export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
    ],
    sitemap: "https://georgiatrips.ge/sitemap.xml",
    host: "https://georgiatrips.ge",
  };
}
