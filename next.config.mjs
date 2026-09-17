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
    ];
  },
  async redirects() {
    return [
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
