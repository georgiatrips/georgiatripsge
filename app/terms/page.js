"use client";

import React from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useLanguage } from "../lib/i18n/LanguageContext";

const CONTENT = {
  ka: {
    title: "წესები და პირობები",
    updated: "ბოლო განახლება: 2026 წლის აგვისტო",
    intro: "მოგესალმებით GeorgiaTrips-ის ვებსაიტზე. საიტის გამოყენებით და მომსახურების დაჯავშნით თქვენ ეთანხმებით ქვემოთ მოცემულ წესებსა და პირობებს.",
    s1Title: "1. ჯავშანი და დადასტურება",
    s1Desc: "ტურის ან ტრანსფერის ჯავშანი ითვლება დადასტურებულად მას შემდეგ, რაც ჩვენი წარმომადგენელი დაგიკავშირდებათ WhatsApp-ით ან ტელეფონით.",
    s2Title: "2. გადახდის პირობები",
    s2Desc: "გადახდა ხორციელდება გამგზავრების დღეს ნაღდი ანგარიშსწორებით (₾ GEL ან ექვივალენტი USD/EUR/TRY/AED/SAR) ან საბანკო გადარიცხვით შეთანხმებისამებრ.",
    s3Title: "3. გაუქმება და ცვლილებები",
    s3Desc: "ჯავშნის უფასო გაუქმება ან თარიღის ცვლილება შესაძლებელია ტურის დაწყებამდე მინიმუმ 48 საათით ადრე.",
    s4Title: "4. პასუხისმგებლობა",
    s4Desc: "ჩვენი კომპანია უზრუნველყოფს მაქსიმალურ უსაფრთხოებას, კომფორტულ ტრანსპორტს და პროფესიონალ მძღოლებს/გიდებს მთელი მოგზაურობის განმავლობაში.",
    backHome: "← მთავარ გვერდზე დაბრუნება",
  },
  en: {
    title: "Terms and Conditions",
    updated: "Last Updated: August 2026",
    intro: "Welcome to GeorgiaTrips. By using our website and booking tours or transfers with us, you agree to the following terms and conditions.",
    s1Title: "1. Booking & Confirmation",
    s1Desc: "A booking is considered confirmed once our manager contacts you via WhatsApp or phone with confirmation details.",
    s2Title: "2. Payment Terms",
    s2Desc: "Payment is made on the day of departure in cash (GEL, USD, EUR, TRY, AED, SAR) or via bank transfer by prior agreement.",
    s3Title: "3. Cancellation & Rescheduling",
    s3Desc: "Free cancellation or date rescheduling is permitted up to 48 hours prior to the scheduled departure time.",
    s4Title: "4. Safety & Responsibility",
    s4Desc: "GeorgiaTrips is committed to high safety standards, well-maintained vehicles, and licensed experienced drivers/guides.",
    backHome: "← Back to Home",
  },
  ru: {
    title: "Условия и положения",
    updated: "Последнее обновление: Август 2026",
    intro: "Добро пожаловать в GeorgiaTrips. Бронируя туры или трансферы, вы соглашаетесь со следующими условиями обслуживания.",
    s1Title: "1. Бронирование и подтверждение",
    s1Desc: "Бронирование считается подтвержденным после согласования деталей с нашим менеджером в WhatsApp или по телефону.",
    s2Title: "2. Условия оплаты",
    s2Desc: "Оплата производится в день отправления наличными или переводом по предварительной договоренности.",
    s3Title: "3. Отмена и перенос",
    s3Desc: "Бесплатная отмена или перенос даты возможны не позднее чем за 48 часов до начала тура.",
    s4Title: "4. Ответственность и безопасность",
    s4Desc: "Мы гарантируем высокий уровень комфорта, исправный транспорт и профессиональных водителей и гидов.",
    backHome: "← На главную",
  },
  tr: {
    title: "Şartlar ve Koşullar",
    updated: "Son Güncelleme: Ağustos 2026",
    intro: "GeorgiaTrips'e hoş geldiniz. Web sitemizi kullanarak ve tur rezervasyonu yaparak aşağıdaki şartları kabul etmiş sayılırsınız.",
    s1Title: "1. Rezervasyon ve Onay",
    s1Desc: "Rezervasyonlar, temsilcimiz sizinle WhatsApp üzerinden iletişime geçip detayları teyit ettikten sonra kesinleşir.",
    s2Title: "2. Ödeme Koşulları",
    s2Desc: "Ödemeler tur günü nakit olarak veya önceden kararlaştırılan yöntemle yapılır.",
    s3Title: "3. İptal ve Değişiklik",
    s3Desc: "Tur saatinden 48 saat öncesine kadar yapılan iptallerde herhangi bir ücret talep edilmez.",
    s4Title: "4. Güvenlik",
    s4Desc: "Tüm yolculuklarınızda güvenli ve konforlu araçlar ile profesyonel sürücüler sağlanmaktadır.",
    backHome: "← Ana Sayfaya Dön",
  },
  ar: {
    title: "الشروط والأحكام",
    updated: "آخر تحديث: أغسطس 2026",
    intro: "مرحباً بكم في GeorgiaTrips. باستخدامكم لموقعنا وحجز الجولات السياحية أو التوصيلات، فإنكم توافقون على الشروط والأحكام التالية.",
    s1Title: "1. الحجز والتأكيد",
    s1Desc: "يُعتبر الحجز مؤكداً بمجرد تواصل ممثلنا معكم عبر واتساب لتأكيد التفاصيل.",
    s2Title: "2. شروط الدفع",
    s2Desc: "يتم الدفع يوم المغادرة نقداً أو عبر التحويل البنكي حسب الاتفاق.",
    s3Title: "3. الإلغاء والتعديل",
    s3Desc: "يمكن إلغاء الحجز أو تعديل التاريخ مجاناً قبل موعد الانطلاق بـ 48 ساعة.",
    s4Title: "4. السلامة والمسؤولية",
    s4Desc: "نلتزم بتوفير أعلى معايير الأمان وسيارات حديثة وسائقين ومرشدين ذوي خبرة.",
    backHome: "← العودة للرئيسية",
  },
};

export default function TermsPage() {
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
