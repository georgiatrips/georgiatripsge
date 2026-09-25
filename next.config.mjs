/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,

  // Smooth page-to-page crossfades through React <ViewTransition> (see app/layout.js).
  experimental: {
    viewTransition: true,
    // app/global-not-found.js: there are several root layouts ([locale],
    // admin, login, booking, coupons), so no single one can host the 404.
    globalNotFound: true,
  },

  // Serve responsive AVIF/WebP variants for next/image. Cloudinary originals
  // are already compressed on upload; Next additionally prevents phones from
  // downloading desktop-sized files for cards and galleries.
  images: {
    formats: ["image/avif", "image/webp"],
    // Capped at 2560px: full-bleed heroes sit under a dark scrim, so 3840px
    // variants (8MB+ of source detail) only cost LCP on high-DPR screens.
    deviceSizes: [640, 750, 828, 1080, 1200, 1600, 1920, 2560],
    // Next 16 requires an explicit allowlist; 60 is used for scrimmed heroes.
    qualities: [60, 75],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // Only hosts the site really serves images from. A wildcard let anyone
    // use /_next/image as a free image proxy billed to this project.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "www.georgiatrips.ge" },
    ],
  },
  async headers() {
    return [
      {
        // Files in /public keep their names when replaced, so they get a
        // month of browser caching (rename a file when its content changes).
        source: "/:file*.:ext(webp|avif|jpg|jpeg|png|svg|ico|woff2)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" },
        ],
      },
      {
        // The service worker must always be revalidated to pick up updates.
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache" }],
      },
      {
        // Baseline hygiene headers. Referrer-Policy keeps the full URL on
        // same-origin navigations (analytics) while sending only the origin
        // to third parties, which is also what Google recommends.
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // The pre-migration static site lived on .html URLs. Google still lists
      // some of them (e.g. /about.html) and any old inbound link points there,
      // but they now 404 — the proxy skips paths containing a dot. These send
      // that traffic and link equity to the closest current page. English,
      // because the old static pages were English.
      { source: '/index.html', destination: '/en', permanent: true },
      { source: '/about.html', destination: '/en', permanent: true },
      { source: '/contact.html', destination: '/en', permanent: true },
      { source: '/tours.html', destination: '/en/tours', permanent: true },
      { source: '/tour.html', destination: '/en/tours', permanent: true },
      { source: '/services.html', destination: '/en/tours', permanent: true },
      { source: '/gallery.html', destination: '/en/places', permanent: true },
      { source: '/blog.html', destination: '/en/posts', permanent: true },
      { source: '/transfer.html', destination: '/en/transfers', permanent: true },
      { source: '/transfers.html', destination: '/en/transfers', permanent: true },
      { source: '/hotels.html', destination: '/en/hotels', permanent: true },
      // Anything else ending in .html: the homepage beats a 404.
      { source: '/:legacy*.html', destination: '/en', permanent: true },
      {
        source: '/transport',
        // Straight to the final URL: /transfers would redirect again to /ka/transfers.
        destination: '/ka/transfers',
        permanent: true,
      },
      {
        source: '/profile',
        destination: '/login',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
