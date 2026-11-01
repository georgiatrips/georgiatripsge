"use client";

import React from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useLanguage } from "../../lib/i18n/LanguageContext";

const CONTENT = {
  ka: {
    title: "კონფიდენციალობის პოლიტიკა",
    updated: "ბოლო განახლება: 2026 წლის ნოემბერი",
    intro: "GeorgiaTrips პატივს სცემს თქვენს კონფიდენციალობას და იცავს თქვენს პერსონალურ მონაცემებს. წინამდებარე პოლიტიკა განმარტავს, თუ როგორ ვაგროვებთ, ვიყენებთ და ვიცავთ თქვენს ინფორმაციას.",
    s1Title: "1. ინფორმაციის შეგროვება",
    s1Desc: "ჩვენ ვაგროვებთ მხოლოდ იმ ინფორმაციას, რომელსაც გვაწვდით ტურის ან ტრანსფერის დაჯავშნისას (სახელი, ტელეფონის ნომერი, ელ-ფოსტა, ფრენის მონაცემები).",
    s2Title: "2. ინფორმაციის გამოყენება",
    s2Desc: "თქვენი მონაცემები გამოიყენება მხოლოდ შეკვეთის დასადასტურებლად, მომსახურების უზრუნველსაყოფად და თქვენთან დასაკავშირებლად (მაგ. WhatsApp-ის ან ელ-ფოსტის მეშვეობით).",
    s3Title: "3. Cookie ფაილები",
    s3Desc: "ჩვენ ვიყენებთ cookie ფაილებს თქვენი ენისა და ვალუტის პრეფერენციების შესანახად და საიტის გამართული მუშაობისთვის.",
    s4Title: "4. მესამე მხარეები",
    s4Desc: "ჩვენ არ ვყიდით თქვენს პირად მონაცემებს. მათ ვუზიარებთ მხოლოდ ტურის ორგანიზებისთვის აუცილებელ პარტნიორებს (მაგ. დაზღვევა) და მე-5 პუნქტში ჩამოთვლილ სერვისებს.",
    s5Title: "5. შეტყობინებები (WhatsApp, Messenger, Instagram)",
    s5Desc: "როცა მოგვწერთ WhatsApp-ზე, Facebook Messenger-ზე ან Instagram-ზე, ვიღებთ თქვენს სახელს ან მომხმარებლის სახელს, ანგარიშის იდენტიფიკატორს და შეტყობინების შინაარსს. მათ ვიყენებთ მხოლოდ თქვენთვის პასუხის გასაცემად და ტურის ორგანიზებისთვის. შეტყობინებები ინახება დაცულ ადმინისტრაციულ პანელში (Vercel, Neon). პასუხებს წერს ჩვენი გუნდი ან ვირტუალური ასისტენტი Google Gemini-ს გამოყენებით, გუნდი კი შეტყობინებებს იღებს Telegram-ითაც. ამ მონაცემებს რეკლამისთვის არ ვიყენებთ.",
    s6Title: "6. მონაცემების წაშლა",
    s6Desc: "მიმოწერის ან სხვა პერსონალური მონაცემების წასაშლელად მოგვწერეთ infogeorgiatrips@gmail.com-ზე და მიუთითეთ ანგარიში, რომლითაც დაგვიკავშირდით. მოთხოვნას შევასრულებთ 30 დღის განმავლობაში.",
    backHome: "← მთავარ გვერდზე დაბრუნება",
  },
  en: {
    title: "Privacy Policy",
    updated: "Last Updated: November 2026",
    intro: "GeorgiaTrips respects your privacy and is committed to protecting your personal data. This policy outlines how we collect, use, and safeguard your information.",
    s1Title: "1. Information We Collect",
    s1Desc: "We only collect information necessary to process your tour or transfer bookings (such as full name, phone number, email address, and flight details).",
    s2Title: "2. How We Use Information",
    s2Desc: "Your information is used strictly to confirm your bookings, organize transportation/guiding, and communicate with you via WhatsApp or email.",
    s3Title: "3. Cookies & Preferences",
    s3Desc: "We utilize cookies to remember your language and currency preferences, ensuring a seamless browsing experience.",
    s4Title: "4. Third Parties & Data Security",
    s4Desc: "We never sell your personal data. We share it only with partners needed to fulfill tour services (e.g., travel insurance where applicable) and with the service providers listed in section 5.",
    s5Title: "5. Messages (WhatsApp, Messenger, Instagram)",
    s5Desc: "When you message us on WhatsApp, Facebook Messenger or Instagram, we receive your name or username, your account identifier and the content of your messages. We use them only to reply to you and to arrange your trip. Messages are stored in our secured admin panel (Vercel, Neon). Replies are written by our team or by a virtual assistant using Google Gemini, and our team also receives messages through Telegram. We do not use this data for advertising.",
    s6Title: "6. Data Deletion",
    s6Desc: "To delete your conversation or other personal data, email infogeorgiatrips@gmail.com and tell us which account you contacted us from. We will complete your request within 30 days.",
    backHome: "← Back to Home",
  },
  ru: {
    title: "Политика конфиденциальности",
    updated: "Последнее обновление: Ноябрь 2026",
    intro: "GeorgiaTrips уважает вашу конфиденциальность и защищает ваши персональные данные. Настоящая политика описывает сбор и использование информации.",
    s1Title: "1. Сбор информации",
    s1Desc: "Мы собираем только те данные, которые необходимы для оформления бронирования туров и трансферов (имя, номер телефона, email, детали рейса).",
    s2Title: "2. Использование данных",
    s2Desc: "Данные используются исключительно для подтверждения заказа, связи с вами и качественного оказания туристических услуг.",
    s3Title: "3. Файлы Cookie",
    s3Desc: "Мы используем файлы cookie для сохранения настроек языка и валюты, а также для стабильной работы сайта.",
    s4Title: "4. Безопасность и третьи лица",
    s4Desc: "Мы не продаем ваши личные данные. Мы передаем их только партнерам, необходимым для организации тура (например, страхование), и сервисам, указанным в разделе 5.",
    s5Title: "5. Сообщения (WhatsApp, Messenger, Instagram)",
    s5Desc: "Когда вы пишете нам в WhatsApp, Facebook Messenger или Instagram, мы получаем ваше имя или имя пользователя, идентификатор аккаунта и содержание сообщений. Мы используем их только для ответа вам и организации поездки. Сообщения хранятся в защищенной панели администратора (Vercel, Neon). Отвечает наша команда или виртуальный ассистент на основе Google Gemini, а также команда получает сообщения через Telegram. Мы не используем эти данные для рекламы.",
    s6Title: "6. Удаление данных",
    s6Desc: "Чтобы удалить переписку или другие личные данные, напишите на infogeorgiatrips@gmail.com и укажите аккаунт, с которого вы с нами связывались. Мы выполним запрос в течение 30 дней.",
    backHome: "← На главную",
  },
  tr: {
    title: "Gizlilik Politikası",
    updated: "Son Güncelleme: Kasım 2026",
    intro: "GeorgiaTrips gizliliğinize saygı duyar ve kişisel verilerinizi korumayı taahhüt eder.",
    s1Title: "1. Bilgi Toplama",
    s1Desc: "Yalnızca tur veya transfer rezervasyonunuz için gerekli olan bilgileri topluyoruz (isim, telefon, e-posta).",
    s2Title: "2. Bilgilerin Kullanımı",
    s2Desc: "Verileriniz yalnızca rezervasyon onayları ve sizinle iletişim kurmak amacıyla kullanılır.",
    s3Title: "3. Çerezler",
    s3Desc: "Dil ve para birimi tercihlerinizi hatırlamak için çerezler kullanmaktayız.",
    s4Title: "4. Üçüncü Taraflar",
    s4Desc: "Kişisel verileriniz asla satılmaz. Yalnızca turun düzenlenmesi için gerekli iş ortaklarıyla (ör. sigorta) ve 5. bölümde belirtilen hizmetlerle paylaşılır.",
    s5Title: "5. Mesajlar (WhatsApp, Messenger, Instagram)",
    s5Desc: "Bize WhatsApp, Facebook Messenger veya Instagram üzerinden yazdığınızda adınızı veya kullanıcı adınızı, hesap kimliğinizi ve mesaj içeriğinizi alırız. Bunları yalnızca size yanıt vermek ve seyahatinizi düzenlemek için kullanırız. Mesajlar güvenli yönetim panelimizde (Vercel, Neon) saklanır. Yanıtları ekibimiz veya Google Gemini kullanan sanal asistan yazar; ekibimiz mesajları Telegram üzerinden de alır. Bu verileri reklam için kullanmayız.",
    s6Title: "6. Verilerin Silinmesi",
    s6Desc: "Yazışmanızı veya diğer kişisel verilerinizi silmek için infogeorgiatrips@gmail.com adresine yazın ve bize ulaştığınız hesabı belirtin. Talebinizi 30 gün içinde yerine getiririz.",
    backHome: "← Ana Sayfaya Dön",
  },
  ar: {
    title: "سياسة الخصوصية",
    updated: "آخر تحديث: نوفمبر 2026",
    intro: "تحترم GeorgiaTrips خصوصيتكم وتلتزم بحماية بياناتكم الشخصية بالكامل.",
    s1Title: "1. المعلومات التي نجمعها",
    s1Desc: "نقوم بجمع المعلومات اللازمة فقط لتأكيد حجوزاتكم للجولات والتوصيلات (الاسم، الهاتف، البريد الإلكتروني).",
    s2Title: "2. كيفية استخدام المعلومات",
    s2Desc: "تُستخدم معلوماتكم حصرياً لتأكيد الحجوزات والتواصل معكم عبر واتساب أو البريد الإلكتروني.",
    s3Title: "3. ملفات تعريف الارتباط (Cookies)",
    s3Desc: "نستخدم ملفات تعريف الارتباط لحفظ خيارات اللغة والعملة وتسهيل التصفح.",
    s4Title: "4. الأمان والأطراف الثالثة",
    s4Desc: "نحن لا نبيع بياناتكم الشخصية. نشاركها فقط مع الشركاء اللازمين لتنظيم الجولة (مثل التأمين) ومع الخدمات المذكورة في القسم 5.",
    s5Title: "5. الرسائل (WhatsApp وMessenger وInstagram)",
    s5Desc: "عندما تراسلوننا عبر WhatsApp أو Facebook Messenger أو Instagram، نتلقى اسمكم أو اسم المستخدم ومعرّف الحساب ومحتوى الرسائل. نستخدمها فقط للرد عليكم وتنظيم رحلتكم. تُحفظ الرسائل في لوحة الإدارة المؤمَّنة لدينا (Vercel وNeon). يكتب الردود فريقنا أو مساعد افتراضي يعمل بتقنية Google Gemini، كما يتلقى فريقنا الرسائل عبر Telegram. لا نستخدم هذه البيانات للإعلانات.",
    s6Title: "6. حذف البيانات",
    s6Desc: "لحذف محادثتكم أو بياناتكم الشخصية الأخرى، راسلونا على infogeorgiatrips@gmail.com وحددوا الحساب الذي تواصلتم معنا منه. سننفذ طلبكم خلال 30 يوماً.",
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
          <Link href="/" style={{ color: "var(--gt-primary, #2a6592)", fontWeight: 700, textDecoration: "none", display: "inline-block", marginBottom: "1.5rem" }}>
            {t.backHome}
          </Link>
          <h1 style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--gt-ink, #1f2d3d)", marginBottom: "0.5rem" }}>{t.title}</h1>
          <p style={{ color: "var(--text-muted, #64748b)", fontSize: "0.9rem", marginBottom: "2rem" }}>{t.updated}</p>
          <p style={{ fontSize: "1.05rem", lineHeight: 1.7, color: "var(--text, #334155)", marginBottom: "2rem" }}>{t.intro}</p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--gt-ink, #1f2d3d)", marginTop: "1.5rem", marginBottom: "0.5rem" }}>{t.s1Title}</h2>
          <p style={{ lineHeight: 1.7, color: "var(--text, #334155)", marginBottom: "1.5rem" }}>{t.s1Desc}</p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--gt-ink, #1f2d3d)", marginTop: "1.5rem", marginBottom: "0.5rem" }}>{t.s2Title}</h2>
          <p style={{ lineHeight: 1.7, color: "var(--text, #334155)", marginBottom: "1.5rem" }}>{t.s2Desc}</p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--gt-ink, #1f2d3d)", marginTop: "1.5rem", marginBottom: "0.5rem" }}>{t.s3Title}</h2>
          <p style={{ lineHeight: 1.7, color: "var(--text, #334155)", marginBottom: "1.5rem" }}>{t.s3Desc}</p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--gt-ink, #1f2d3d)", marginTop: "1.5rem", marginBottom: "0.5rem" }}>{t.s4Title}</h2>
          <p style={{ lineHeight: 1.7, color: "var(--text, #334155)", marginBottom: "1.5rem" }}>{t.s4Desc}</p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--gt-ink, #1f2d3d)", marginTop: "1.5rem", marginBottom: "0.5rem" }}>{t.s5Title}</h2>
          <p style={{ lineHeight: 1.7, color: "var(--text, #334155)", marginBottom: "1.5rem" }}>{t.s5Desc}</p>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--gt-ink, #1f2d3d)", marginTop: "1.5rem", marginBottom: "0.5rem" }}>{t.s6Title}</h2>
          <p style={{ lineHeight: 1.7, color: "var(--text, #334155)", marginBottom: "1.5rem" }}>{t.s6Desc}</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
