import { buildLocalizedMetadata, getRequestLocale } from "../../lib/siteConfig";

// The page is a client component, so its metadata lives here.
const COPY = {
  ka: {
    title: "ანგარიშის წაშლა | GeorgiaTrips",
    description: "როგორ წაშალოთ GeorgiaTrips-ის ანგარიში აპლიკაციიდან ან ელ-ფოსტით და რა მონაცემები იშლება.",
  },
  en: {
    title: "Delete your account | GeorgiaTrips",
    description: "How to delete your GeorgiaTrips account in the app or by email, and which data is deleted.",
  },
  ru: {
    title: "Удаление аккаунта | GeorgiaTrips",
    description: "Как удалить аккаунт GeorgiaTrips в приложении или по email и какие данные удаляются.",
  },
  tr: {
    title: "Hesabı silme | GeorgiaTrips",
    description: "GeorgiaTrips hesabınızı uygulamadan veya e-posta ile nasıl silersiniz ve hangi veriler silinir.",
  },
  ar: {
    title: "حذف الحساب | GeorgiaTrips",
    description: "كيفية حذف حسابك في GeorgiaTrips من التطبيق أو عبر البريد الإلكتروني والبيانات التي يتم حذفها.",
  },
};

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const lang = getRequestLocale(locale);
  const copy = COPY[lang] || COPY.ka;
  return buildLocalizedMetadata({ path: "/delete-account", lang, title: copy.title, description: copy.description });
}

export default function DeleteAccountLayout({ children }) {
  return children;
}
