import { buildLocalizedMetadata, getRequestLocale } from "../../lib/siteConfig";

// The page is a client component, so its metadata lives here. Without it the
// page inherited the homepage title and a canonical pointing at /{locale}.
const COPY = {
  ka: {
    title: "წესები და პირობები | GeorgiaTrips",
    description: "GeorgiaTrips-ის ტურებისა და ტრანსფერების დაჯავშნის, გადახდის, გაუქმებისა და ცვლილების წესები და პირობები.",
  },
  en: {
    title: "Terms and Conditions | GeorgiaTrips",
    description: "Booking, payment, cancellation and rescheduling terms for GeorgiaTrips tours and transfers.",
  },
  ru: {
    title: "Условия и положения | GeorgiaTrips",
    description: "Условия бронирования, оплаты, отмены и переноса туров и трансферов GeorgiaTrips.",
  },
  tr: {
    title: "Şartlar ve Koşullar | GeorgiaTrips",
    description: "GeorgiaTrips tur ve transferleri için rezervasyon, ödeme, iptal ve değişiklik koşulları.",
  },
  ar: {
    title: "الشروط والأحكام | GeorgiaTrips",
    description: "شروط الحجز والدفع والإلغاء وتعديل المواعيد لجولات GeorgiaTrips وخدمات التوصيل.",
  },
};

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const lang = getRequestLocale(locale);
  const copy = COPY[lang] || COPY.ka;
  return buildLocalizedMetadata({ path: "/terms", lang, title: copy.title, description: copy.description });
}

export default function TermsLayout({ children }) {
  return children;
}
