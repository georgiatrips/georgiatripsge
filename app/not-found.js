"use client";

import Link from "next/link";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { useLanguage } from "./lib/i18n/LanguageContext";

const NOT_FOUND_TEXTS = {
  ka: {
    badge: "404 შეცდომა",
    title: "გვერდი ვერ მოიძებნა",
    desc: "სამწუხაროდ, თქვენ მიერ მოთხოვნილი გვერდი არ არსებობს ან გადატანილია სხვა მისამართზე.",
    homeBtn: "მთავარ გვერდზე დაბრუნება",
    toursBtn: "ტურების დათვალიერება",
    transfersBtn: "ტრანსფერები",
  },
  en: {
    badge: "404 Error",
    title: "Page Not Found",
    desc: "Sorry, the page you are looking for does not exist or has been moved.",
    homeBtn: "Return to Home",
    toursBtn: "Explore Tours",
    transfersBtn: "Book Transfer",
  },
  ru: {
    badge: "Ошибка 404",
    title: "Страница не найдена",
    desc: "К сожалению, запрашиваемая страница не существует или была перемещена.",
    homeBtn: "На главную",
    toursBtn: "Смотреть туры",
    transfersBtn: "Трансферы",
  },
  tr: {
    badge: "404 Hatası",
    title: "Sayfa Bulunamadı",
    desc: "Maalesef aradığınız sayfa mevcut değil veya başka bir adrese taşınmış.",
    homeBtn: "Ana Sayfaya Dön",
    toursBtn: "Turları Keşfet",
    transfersBtn: "Transfer Rezervasyonu",
  },
  ar: {
    badge: "خطأ 404",
    title: "الصفحة غير موجودة",
    desc: "عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها إلى عنوان آخر.",
    homeBtn: "العودة للرئيسية",
    toursBtn: "استكشاف الجولات",
    transfersBtn: "حجز توصيلة",
  },
};

export default function NotFound() {
  const { lang } = useLanguage();
  const t = NOT_FOUND_TEXTS[lang] || NOT_FOUND_TEXTS.ka;

  return (
    <>
      <Navbar />
      <main
        style={{
          minHeight: "75vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "4rem 1.5rem",
          background: "linear-gradient(180deg, rgba(13, 35, 58, 0.03) 0%, rgba(41, 178, 183, 0.05) 100%)",
        }}
      >
        <div
          style={{
            maxWidth: "600px",
            width: "100%",
            textAlign: "center",
            background: "#ffffff",
            padding: "3.5rem 2rem",
            borderRadius: "24px",
            boxShadow: "0 20px 40px rgba(13, 35, 58, 0.08)",
            border: "1px solid rgba(13, 35, 58, 0.06)",
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "0.4rem 1rem",
              background: "rgba(41, 178, 183, 0.12)",
              color: "var(--teal, #29b2b7)",
              borderRadius: "50px",
              fontWeight: 700,
              fontSize: "0.9rem",
              marginBottom: "1.25rem",
            }}
          >
            {t.badge}
          </div>

          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 2.75rem)",
              fontWeight: 800,
              color: "var(--navy, #0d233a)",
              marginBottom: "1rem",
              lineHeight: 1.2,
            }}
          >
            {t.title}
          </h1>

          <p
            style={{
              fontSize: "1.05rem",
              color: "var(--text-muted, #64748b)",
              lineHeight: 1.6,
              marginBottom: "2.25rem",
            }}
          >
            {t.desc}
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.85rem",
              justifyContent: "center",
            }}
          >
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.85rem 1.75rem",
                borderRadius: "12px",
                background: "var(--teal, #29b2b7)",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.95rem",
                textDecoration: "none",
                transition: "all 0.2s ease",
              }}
            >
              {t.homeBtn}
            </Link>

            <Link
              href="/tours"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.85rem 1.75rem",
                borderRadius: "12px",
                background: "rgba(13, 35, 58, 0.06)",
                color: "var(--navy, #0d233a)",
                fontWeight: 700,
                fontSize: "0.95rem",
                textDecoration: "none",
                transition: "all 0.2s ease",
              }}
            >
              {t.toursBtn}
            </Link>

            <Link
              href="/transfers"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.85rem 1.75rem",
                borderRadius: "12px",
                background: "transparent",
                color: "var(--navy, #0d233a)",
                border: "1px solid rgba(13, 35, 58, 0.15)",
                fontWeight: 600,
                fontSize: "0.95rem",
                textDecoration: "none",
                transition: "all 0.2s ease",
              }}
            >
              {t.transfersBtn}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
