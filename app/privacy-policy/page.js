"use client";

import React from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useLanguage } from "../lib/i18n/LanguageContext";

const CONTENT = {
  ka: {
    title: "კონფიდენციალობის პოლიტიკა",
    updated: "ბოლო განახლება: 2026 წლის აგვისტო",
    intro: "GeorgiaTrips პატივს სცემს თქვენს კონფიდენციალობას და იცავს თქვენს პერსონალურ მონაცემებს. წინამდებარე პოლიტიკა განმარტავს, თუ როგორ ვაგროვებთ, ვიყენებთ და ვიცავთ თქვენს ინფორმაციას.",
    s1Title: "1. ინფორმაციის შეგროვება",
    s1Desc: "ჩვენ ვაგროვებთ მხოლოდ იმ ინფორმაციას, რომელსაც გვაწვდით ტურის ან ტრანსფერის დაჯავშნისას (სახელი, ტელეფონის ნომერი, ელ-ფოსტა, ფრენის მონაცემები).",
    s2Title: "2. ინფორმაციის გამოყენება",
    s2Desc: "თქვენი მონაცემები გამოიყენება მხოლოდ შეკვეთის დასადასტურებლად, მომსახურების უზრუნველსაყოფად და თქვენთან დასაკავშირებლად (მაგ. WhatsApp-ის ან ელ-ფოსტის მეშვეობით).",
    s3Title: "3. Cookie ფაილები",
    s3Desc: "ჩვენ ვიყენებთ cookie ფაილებს თქვენი ენისა და ვალუტის პრეფერენციების შესანახად და საიტის გამართული მუშაობისთვის.",
    s4Title: "4. მესამე მხარეები",
    s4Desc: "ჩვენ არ გადავცემთ, არ ვყიდით და არ ვუზიარებთ თქვენს პირად მონაცემებს მესამე პირებს, გარდა იმ შემთხვევებისა, რაც აუცილებელია ტურის ორგანიზებისთვის (მაგ. დაზღვევა).",
    backHome: "← მთავარ გვერდზე დაბრუნება",
  },
  en: {
    title: "Privacy Policy",
    updated: "Last Updated: August 2026",
    intro: "GeorgiaTrips respects your privacy and is committed to protecting your personal data. This policy outlines how we collect, use, and safeguard your information.",
    s1Title: "1. Information We Collect",
    s1Desc: "We only collect information necessary to process your tour or transfer bookings (such as full name, phone number, email address, and flight details).",
    s2Title: "2. How We Use Information",
    s2Desc: "Your information is used strictly to confirm your bookings, organize transportation/guiding, and communicate with you via WhatsApp or email.",
    s3Title: "3. Cookies & Preferences",
    s3Desc: "We utilize cookies to remember your language and currency preferences, ensuring a seamless browsing experience.",
    s4Title: "4. Third Parties & Data Security",
    s4Desc: "We never sell or disclose your personal data to third parties, except as required to fulfill tour services (e.g., travel insurance where applicable).",
    backHome: "← Back to Home",
  },
  ru: {
    title: "Политика конфиденциальности",
    updated: "Последнее обновление: Август 2026",
    intro: "GeorgiaTrips уважает вашу конфиденциальность и защищает ваши персональные данные. Настоящая политика описывает сбор и использование информации.",
    s1Title: "1. Сбор информации",
    s1Desc: "Мы собираем только те данные, которые необходимы для оформления бронирования туров и трансферов (имя, номер телефона, email, детали рейса).",
    s2Title: "2. Использование данных",
    s2Desc: "Данные используются исключительно для подтверждения заказа, связи с вами и качественного оказания туристических услуг.",
    s3Title: "3. Файлы Cookie",
    s3Desc: "Мы используем файлы cookie для сохранения настроек языка и валюты, а также для стабильной работы сайта.",
    s4Title: "4. Безопасность и третьи лица",
    s4Desc: "Мы не передаем и не продаем ваши личные данные третьим лицам.",
    backHome: "← На главную",
  },
  tr: {
    title: "Gizlilik Politikası",
    updated: "Son Güncelleme: Ağustos 2026",
    intro: "GeorgiaTrips gizliliğinize saygı duyar ve kişisel verilerinizi korumayı taahhüt eder.",
    s1Title: "1. Bilgi Toplama",
    s1Desc: "Yalnızca tur veya transfer rezervasyonunuz için gerekli olan bilgileri topluyoruz (isim, telefon, e-posta).",
    s2Title: "2. Bilgilerin Kullanımı",
    s2Desc: "Verileriniz yalnızca rezervasyon onayları ve sizinle iletişim kurmak amacıyla kullanılır.",
    s3Title: "3. Çerezler",
    s3Desc: "Dil ve para birimi tercihlerinizi hatırlamak için çerezler kullanmaktayız.",
    s4Title: "4. Üçüncü Taraflar",
    s4Desc: "Kişisel verileriniz asla üçüncü taraflara satılmaz veya paylaşılmaz.",
    backHome: "← Ana Sayfaya Dön",
  },
  ar: {
    title: "سياسة الخصوصية",
    updated: "آخر تحديث: أغسطس 2026",
    intro: "تحترم GeorgiaTrips خصوصيتكم وتلتزم بحماية بياناتكم الشخصية بالكامل.",
    s1Title: "1. المعلومات التي نجمعها",
    s1Desc: "نقوم بجمع المعلومات اللازمة فقط لتأكيد حجوزاتكم للجولات والتوصيلات (الاسم، الهاتف، البريد الإلكتروني).",
    s2Title: "2. كيفية استخدام المعلومات",
    s2Desc: "تُستخدم معلوماتكم حصرياً لتأكيد الحجوزات والتواصل معكم عبر واتساب أو البريد الإلكتروني.",
    s3Title: "3. ملفات تعريف الارتباط (Cookies)",
    s3Desc: "نستخدم ملفات تعريف الارتباط لحفظ خيارات اللغة والعملة وتسهيل التصفح.",
    s4Title: "4. الأمان والأطراف الثالثة",
    s4Desc: "نحن لا نشارك ولا نبيع بياناتكم الشخصية لأي طرف ثالث نهائياً.",
    backHome: "← العودة للرئيسية",
  },
};

export default function PrivacyPolicyPage() {
  const { lang } = useLanguage();
  const t = CONTENT[lang] || CONTENT.ka;

  return (
    <>
      <Navbar />
      <main style={{ padding: "7rem 1.5rem 5rem 1.5rem", minHeight: "80vh", background: "var(--bg, #f8fafc)" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", background: "#ffffff", padding: "3rem 2.5rem", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
          <Link href="/" style={{ color: "var(--teal, #29b2b7)", fontWeight: 700, textDecoration: "none", display: "inline-block", marginBottom: "1.5rem" }}>
            {t.backHome}
          </Link>
          <h1 style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--navy, #0d233a)", marginBottom: "0.5rem" }}>{t.title}</h1>
          <p style={{ color: "var(--text-muted, #64748b)", fontSize: "0.9rem", marginBottom: "2rem" }}>{t.updated}</p>
          <p style={{ fontSize: "1.05rem", lineHeight: 1.7, color: "var(--text, #334155)", marginBottom: "2rem" }}>{t.intro}</p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--navy, #0d233a)", marginTop: "1.5rem", marginBottom: "0.5rem" }}>{t.s1Title}</h2>
          <p style={{ lineHeight: 1.7, color: "var(--text, #334155)", marginBottom: "1.5rem" }}>{t.s1Desc}</p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--navy, #0d233a)", marginTop: "1.5rem", marginBottom: "0.5rem" }}>{t.s2Title}</h2>
          <p style={{ lineHeight: 1.7, color: "var(--text, #334155)", marginBottom: "1.5rem" }}>{t.s2Desc}</p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--navy, #0d233a)", marginTop: "1.5rem", marginBottom: "0.5rem" }}>{t.s3Title}</h2>
          <p style={{ lineHeight: 1.7, color: "var(--text, #334155)", marginBottom: "1.5rem" }}>{t.s3Desc}</p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--navy, #0d233a)", marginTop: "1.5rem", marginBottom: "0.5rem" }}>{t.s4Title}</h2>
          <p style={{ lineHeight: 1.7, color: "var(--text, #334155)", marginBottom: "1.5rem" }}>{t.s4Desc}</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
