import { SITE_URL } from "./siteConfig";

// Metadata shared by every root layout (app/[locale]/layout.js and the
// account/admin layouts). Page-level metadata overrides title, description,
// canonical and Open Graph.
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#2a6592",
};

export const BASE_METADATA = {
  metadataBase: new URL(SITE_URL),
  // No `template` here: every page/layout below already brands its own
  // title with "| GeorgiaTrips" (see [locale]/layout.js and each page.js).
  // A parent template augments (wraps) any plain-string title a descendant
  // sets, so keeping one here would double the suffix on every page.
  title: "GeorgiaTrips — Premium Tours & Transfers in Georgia",
  description: "Discover Georgia in comfort and luxury with GeorgiaTrips.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "apple-touch-icon-precomposed",
        url: "/apple-touch-icon-precomposed.png",
      },
    ],
  },
  manifest: "/manifest.json",
  authors: [
    { name: "GeorgiaTrips", url: SITE_URL },
    { name: "Manuchar Lominadze", url: "https://www.instagram.com/lominadzee10/" },
  ],
  creator: "Manuchar Lominadze (@lominadzee10)",
  publisher: "GeorgiaTrips",
  verification: {
    google: "pqDpqUT-VHHamkaxnisNnk8LO2z-v0EdXak_z77V86U",
    yandex: "b8d0557b47549680",
    other: {
      "facebook-domain-verification": "ef9kax36lazdya98y738pn5e10ny2e",
    },
  },
  other: {
    "developer": "Manuchar Lominadze (https://www.instagram.com/lominadzee10/)",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const NOINDEX_ROBOTS = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: {
    index: false,
    follow: false,
    noimageindex: true,
  },
};
