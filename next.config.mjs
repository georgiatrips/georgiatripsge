/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,

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
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/transport',
        destination: '/transfers',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
