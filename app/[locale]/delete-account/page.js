"use client";

import React from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useLanguage } from "../../lib/i18n/LanguageContext";

// Account deletion instructions for the GeorgiaTrips Android app. Google Play
// requires a web page like this for any app that lets users create accounts.
// What is deleted mirrors deleteAccount() in the app (mobile/src/state/AuthContext.tsx).

const EMAIL = "infogeorgiatrips@gmail.com";

const CONTENT = {
  ka: {
    title: "ანგარიშის წაშლა",
    intro: "ამ გვერდზე აღწერილია, როგორ წაშალოთ თქვენი GeorgiaTrips ანგარიში (Android აპლიკაცია GeorgiaTrips, დეველოპერი: manuchar lominadze) და რა მონაცემები იშლება.",
    s1Title: "1. წაშლა აპლიკაციიდან",
    s1Steps: ["გახსენით GeorgiaTrips აპლიკაცია და შედით თქვენს ანგარიშში.", "გადადით „პროფილი“ ჩანართზე.", "დააჭირეთ „ანგარიშის წაშლა“ და დაადასტურეთ."],
    s2Title: "2. წაშლა ელ-ფოსტით",
    s2Desc: "თუ აპლიკაციაზე წვდომა არ გაქვთ, მოგვწერეთ იმ ელ-ფოსტიდან, რომლითაც დარეგისტრირდით, თემით „ანგარიშის წაშლა“. ანგარიშს წავშლით 7 დღის განმავლობაში.",
    s3Title: "3. რა იშლება",
    s3Items: ["თქვენი ანგარიში (შესვლის მონაცემები)", "სახელი და ელ-ფოსტა პროფილში", "სასურველი ტურების სია, შენახული კუპონები და აპში დამახსოვრებული ჯავშნების სია"],
    s4Title: "4. რა ინახება",
    s4Desc: "უკვე გაკეთებული ჯავშნების ჩანაწერები (ტური/ტრანსფერი, თარიღი, ფასი, საკონტაქტო ტელეფონი) ინახება მომსახურების შესრულებისა და ბუღალტრული აღრიცხვისთვის, კანონით განსაზღვრული ვადით. თქვენ მიერ გამოქვეყნებული შეფასებების წაშლაც შეგიძლიათ მოითხოვოთ ელ-ფოსტით.",
    backHome: "← მთავარ გვერდზე დაბრუნება",
  },
  en: {
    title: "Delete your account",
    intro: "This page explains how to delete your GeorgiaTrips account (Android app GeorgiaTrips, developer: manuchar lominadze) and which data is deleted.",
    s1Title: "1. Delete in the app",
    s1Steps: ["Open the GeorgiaTrips app and sign in.", "Go to the Profile tab.", "Tap \"Delete account\" and confirm."],
    s2Title: "2. Delete by email",
    s2Desc: "If you can't access the app, email us from the address you registered with, subject \"Delete account\". We delete the account within 7 days.",
    s3Title: "3. What is deleted",
    s3Items: ["Your account (sign-in credentials)", "Your name and email in your profile", "Your wishlist, saved coupons and the list of bookings remembered in the app"],
    s4Title: "4. What is kept",
    s4Desc: "Records of bookings you already made (tour/transfer, date, price, contact phone) are kept to deliver the service and for accounting, for the period required by law. You can also ask us by email to delete reviews you posted.",
    backHome: "← Back to Home",
  },
  ru: {
    title: "Удаление аккаунта",
    intro: "На этой странице описано, как удалить аккаунт GeorgiaTrips (Android-приложение GeorgiaTrips, разработчик: manuchar lominadze) и какие данные удаляются.",
    s1Title: "1. Удаление в приложении",
    s1Steps: ["Откройте приложение GeorgiaTrips и войдите в аккаунт.", "Перейдите на вкладку «Профиль».", "Нажмите «Удалить аккаунт» и подтвердите."],
    s2Title: "2. Удаление по email",
    s2Desc: "Если у вас нет доступа к приложению, напишите нам с адреса, указанного при регистрации, с темой «Удаление аккаунта». Мы удалим аккаунт в течение 7 дней.",
    s3Title: "3. Что удаляется",
    s3Items: ["Ваш аккаунт (данные для входа)", "Имя и email в профиле", "Избранные туры, сохранённые купоны и список бронирований в приложении"],
    s4Title: "4. Что сохраняется",
    s4Desc: "Записи уже сделанных бронирований (тур/трансфер, дата, цена, контактный телефон) хранятся для оказания услуги и бухгалтерского учёта в течение срока, установленного законом. Удаление ваших отзывов можно запросить по email.",
    backHome: "← На главную",
  },
  tr: {
    title: "Hesabı silme",
    intro: "Bu sayfa GeorgiaTrips hesabınızı (Android uygulaması GeorgiaTrips, geliştirici: manuchar lominadze) nasıl sileceğinizi ve hangi verilerin silindiğini açıklar.",
    s1Title: "1. Uygulamadan silme",
    s1Steps: ["GeorgiaTrips uygulamasını açın ve giriş yapın.", "Profil sekmesine gidin.", "\"Hesabı sil\"e dokunun ve onaylayın."],
    s2Title: "2. E-posta ile silme",
    s2Desc: "Uygulamaya erişemiyorsanız, kayıtlı e-posta adresinizden \"Hesabı sil\" konulu bir e-posta gönderin. Hesabı 7 gün içinde sileriz.",
    s3Title: "3. Silinenler",
    s3Items: ["Hesabınız (giriş bilgileri)", "Profildeki adınız ve e-postanız", "Favori turlar, kayıtlı kuponlar ve uygulamadaki rezervasyon listesi"],
    s4Title: "4. Saklananlar",
    s4Desc: "Yapılmış rezervasyonların kayıtları (tur/transfer, tarih, fiyat, iletişim telefonu) hizmetin sunulması ve muhasebe için yasal süre boyunca saklanır. Yorumlarınızın silinmesini e-posta ile talep edebilirsiniz.",
    backHome: "← Ana Sayfaya Dön",
  },
  ar: {
    title: "حذف الحساب",
    intro: "توضح هذه الصفحة كيفية حذف حسابك في GeorgiaTrips (تطبيق Android ‏GeorgiaTrips، المطوّر: manuchar lominadze) والبيانات التي يتم حذفها.",
    s1Title: "1. الحذف من التطبيق",
    s1Steps: ["افتح تطبيق GeorgiaTrips وسجّل الدخول.", "انتقل إلى تبويب الملف الشخصي.", "اضغط على \"حذف الحساب\" ثم أكّد."],
    s2Title: "2. الحذف عبر البريد الإلكتروني",
    s2Desc: "إذا لم تتمكن من الوصول إلى التطبيق، راسلنا من البريد الذي سجّلت به بعنوان \"حذف الحساب\". نحذف الحساب خلال 7 أيام.",
    s3Title: "3. ما الذي يُحذف",
    s3Items: ["حسابك (بيانات تسجيل الدخول)", "اسمك وبريدك الإلكتروني في الملف الشخصي", "قائمة الجولات المفضلة والقسائم المحفوظة وقائمة الحجوزات في التطبيق"],
    s4Title: "4. ما الذي يُحتفظ به",
    s4Desc: "يُحتفظ بسجلات الحجوزات التي تمت (الجولة/التوصيل، التاريخ، السعر، هاتف التواصل) لتقديم الخدمة ولأغراض المحاسبة طوال المدة التي يحددها القانون. يمكنك أيضاً طلب حذف تقييماتك عبر البريد الإلكتروني.",
    backHome: "← العودة للرئيسية",
  },
};

const h2Style = { fontSize: "1.25rem", fontWeight: 700, color: "var(--gt-ink, #1f2d3d)", marginTop: "1.5rem", marginBottom: "0.5rem" };
const textStyle = { lineHeight: 1.7, color: "var(--text, #334155)", marginBottom: "1.5rem" };

export default function DeleteAccountPage() {
  const { lang } = useLanguage();
  const t = CONTENT[lang] || CONTENT.ka;

  return (
    <>
      <Navbar />
      <main style={{ padding: "7rem 1.5rem 5rem 1.5rem", minHeight: "80vh", background: "var(--bg, #f8fafc)" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto", background: "#ffffff", padding: "3rem 2.5rem", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
          <Link href="/" style={{ color: "var(--gt-primary, #2a6592)", fontWeight: 700, textDecoration: "none", display: "inline-block", marginBottom: "1.5rem" }}>
            {t.backHome}
          </Link>
          <h1 style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--gt-ink, #1f2d3d)", marginBottom: "1.5rem" }}>{t.title}</h1>
          <p style={{ fontSize: "1.05rem", lineHeight: 1.7, color: "var(--text, #334155)", marginBottom: "2rem" }}>{t.intro}</p>

          <h2 style={h2Style}>{t.s1Title}</h2>
          <ol style={{ ...textStyle, paddingInlineStart: "1.4rem" }}>
            {t.s1Steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>

          <h2 style={h2Style}>{t.s2Title}</h2>
          <p style={textStyle}>
            {t.s2Desc}{" "}
            <a href={`mailto:${EMAIL}?subject=Delete%20account`} style={{ color: "var(--gt-primary, #2a6592)", fontWeight: 700 }}>
              {EMAIL}
            </a>
          </p>

          <h2 style={h2Style}>{t.s3Title}</h2>
          <ul style={{ ...textStyle, paddingInlineStart: "1.4rem" }}>
            {t.s3Items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <h2 style={h2Style}>{t.s4Title}</h2>
          <p style={textStyle}>{t.s4Desc}</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
