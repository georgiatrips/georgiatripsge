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
