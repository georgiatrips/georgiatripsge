import { buildLocalizedMetadata, getRequestLocale } from "../../lib/siteConfig";

// The page is a client component, so its metadata lives here. Without it the
// page inherited the homepage title and a canonical pointing at /{locale}.
const COPY = {
  ka: {
    title: "კონფიდენციალობის პოლიტიკა | GeorgiaTrips",
    description: "GeorgiaTrips პატივს სცემს თქვენს კონფიდენციალობას და იცავს თქვენს პერსონალურ მონაცემებს. როგორ ვაგროვებთ, ვიყენებთ და ვიცავთ თქვენს ინფორმაციას.",
  },
  en: {
    title: "Privacy Policy | GeorgiaTrips",
    description: "GeorgiaTrips respects your privacy and is committed to protecting your personal data. How we collect, use and safeguard your information.",
  },
  ru: {
    title: "Политика конфиденциальности | GeorgiaTrips",
    description: "GeorgiaTrips уважает вашу конфиденциальность и защищает ваши персональные данные. Как мы собираем и используем информацию.",
  },
  tr: {
    title: "Gizlilik Politikası | GeorgiaTrips",
    description: "GeorgiaTrips gizliliğinize saygı duyar ve kişisel verilerinizi korumayı taahhüt eder.",
  },
  ar: {
    title: "سياسة الخصوصية | GeorgiaTrips",
    description: "تحترم GeorgiaTrips خصوصيتكم وتلتزم بحماية بياناتكم الشخصية بالكامل.",
  },
};

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const lang = getRequestLocale(locale);
  const copy = COPY[lang] || COPY.ka;
  return buildLocalizedMetadata({ path: "/privacy-policy", lang, title: copy.title, description: copy.description });
}

export default function PrivacyPolicyLayout({ children }) {
  return children;
}
