import { Noto_Sans_Georgian, Noto_Serif_Georgian, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./lib/AuthContext";
import { LanguageProvider } from "./lib/i18n/LanguageContext";
import { CurrencyProvider } from "./lib/currency/CurrencyContext";

const notoGeorgian = Noto_Sans_Georgian({
  variable: "--font-noto-georgian",
  subsets: ["georgian"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const notoSerifGeorgian = Noto_Serif_Georgian({
  variable: "--font-noto-serif-georgian",
  subsets: ["georgian"],
  weight: ["600", "700", "800"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0d233a",
};

export const metadata = {
  metadataBase: new URL("https://georgiatrips.ge"),
  title: {
    default: "GeorgiaTrips — პრემიუმ ტურები საქართველოში | Premium Tours in Georgia",
    template: "%s | GeorgiaTrips",
  },
  description:
    "აღმოაჩინე საქართველო უმაღლესი კომფორტით. პრემიუმ ტურები ბათუმში, თბილისში, ყაზბეგში, კახეთსა და სვანეთში. VIP ტრანსპორტი, გამოცდილი გიდები და 24/7 მხარდაჭერა.",
  keywords:
    "Georgia tours, ტურები საქართველოში, экскурсии по Грузии, Gürcistan turları, رحلات سياحية في جورجيا, Batumi day trips, экскурсии из Батуми, Tbilisi tours, Kazbegi tour, Kakheti wine tour, VIP tours Georgia",
  alternates: {
    canonical: "https://georgiatrips.ge",
    languages: {
      "ka-GE": "https://georgiatrips.ge",
      "en-US": "https://georgiatrips.ge?lang=en",
      "ru-RU": "https://georgiatrips.ge?lang=ru",
      "tr-TR": "https://georgiatrips.ge?lang=tr",
      "ar-SA": "https://georgiatrips.ge?lang=ar",
    },
  },
  openGraph: {
    title: "GeorgiaTrips — Premium Tours & Guided Excursions in Georgia",
    description: "Discover the beauty of the Caucasus with comfort and luxury. VIP service, private & group tours.",
    url: "https://georgiatrips.ge",
    siteName: "GeorgiaTrips",
    locale: "ka_GE",
    type: "website",
    images: [
      {
        url: "/hero.png",
        width: 1200,
        height: 630,
        alt: "GeorgiaTrips — Premium Tours in Georgia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GeorgiaTrips — Premium Tours in Georgia",
    description: "Discover the beauty of the Caucasus with comfort and luxury.",
    images: ["/hero.png"],
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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  name: "GeorgiaTrips",
  url: "https://georgiatrips.ge",
  logo: "https://georgiatrips.ge/hero.png",
  image: "https://georgiatrips.ge/hero.png",
  description: "Premium tours, private excursions, and VIP transfers in Georgia (Tbilisi, Batumi, Kazbegi, Kakheti, Svaneti).",
  areaServed: "GE",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Batumi",
    addressRegion: "Adjara",
    addressCountry: "GE",
  },
  telephone: "+995555000000",
  email: "info@georgiatrips.ge",
  priceRange: "$$",
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "00:00",
    closes: "23:59",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="ka"
      dir="ltr"
      className={`${notoGeorgian.variable} ${notoSerifGeorgian.variable} ${playfair.variable}`}
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <LanguageProvider>
          <CurrencyProvider>
            <AuthProvider>{children}</AuthProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
