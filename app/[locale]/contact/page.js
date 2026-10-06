import React from "react";
import Link from "next/link";
import LandingShell from "../../components/site/LandingShell";
import { getTranslator } from "../../lib/i18n/translate";
import { SITE_URL, getRequestLocale, buildLocalizedMetadata, getLocalizedHref } from "../../lib/siteConfig";
import {
  EMAIL, PHONE_DISPLAY, PHONE_TEL, TELEGRAM_LINK, INSTAGRAM_LINK, INSTAGRAM_HANDLE,
  FACEBOOK_LINK, TIKTOK_LINK, YOUTUBE_LINK, whatsappHref,
} from "../../lib/shared";
import { COMPANY_PROFILE } from "../../lib/companyProfile";
import { landingUi } from "../../lib/landingUi";

const PATH = "/contact";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const lang = getRequestLocale(locale);
  const c = CONTENT[lang] || CONTENT.en;
  return buildLocalizedMetadata({ path: PATH, lang, title: c.metaTitle, description: c.metaDescription, image: "/hero.webp" });
}

const CONTENT = {
  en: {
    metaTitle: "Contact GeorgiaTrips — WhatsApp, Phone & Office in Batumi",
    metaDescription: "Contact GeorgiaTrips in Batumi: WhatsApp and phone +995 504 22 00 20, email and our office at 27 Kutaisi Street. We reply in Georgian, English, Russian, Turkish and Arabic.",
    crumb: "Contact",
    badge: "Contact us",
    title: "Contact",
    highlight: "GeorgiaTrips",
    intro: "The fastest way to reach us is WhatsApp. Write in Georgian, English, Russian, Turkish or Arabic — tell us your dates, how many of you there are and where you'd like to go.",
    whatsapp: "WhatsApp",
    whatsappDesc: "Questions, bookings and changes",
    phone: "Phone",
    phoneDesc: "Call us",
    telegram: "Telegram",
    telegramDesc: "Same number",
    email: "Email",
    emailDesc: "For longer requests and groups",
    office: "Office",
    openMap: "Open in Google Maps",
    socialTitle: "Follow us",
    bookTitle: "Ready to book?",
    bookText: "Booking is free: send a request from any tour or transfer page, and we confirm by WhatsApp or phone. You pay on the day.",
    tours: "Tours",
    transfers: "Transfers",
  },
  ka: {
    metaTitle: "კონტაქტი — GeorgiaTrips: WhatsApp, ტელეფონი და ოფისი ბათუმში",
    metaDescription: "დაუკავშირდით GeorgiaTrips-ს ბათუმში: WhatsApp და ტელეფონი +995 504 22 00 20, ელფოსტა და ოფისი ქუთაისის ქ. 27-ში. გიპასუხებთ ქართულ, ინგლისურ, რუსულ, თურქულ და არაბულ ენებზე.",
    crumb: "კონტაქტი",
    badge: "დაგვიკავშირდით",
    title: "კონტაქტი",
    highlight: "GeorgiaTrips",
    intro: "ჩვენთან დაკავშირების ყველაზე სწრაფი გზა WhatsApp-ია. მოგვწერეთ ქართულად, ინგლისურად, რუსულად, თურქულად ან არაბულად — გვითხარით თარიღები, რამდენი ხართ და სად გსურთ წასვლა.",
    whatsapp: "WhatsApp",
    whatsappDesc: "კითხვები, ჯავშნები და ცვლილებები",
    phone: "ტელეფონი",
    phoneDesc: "დაგვირეკეთ",
    telegram: "Telegram",
    telegramDesc: "იგივე ნომერი",
    email: "ელფოსტა",
    emailDesc: "ვრცელი მოთხოვნებისა და ჯგუფებისთვის",
    office: "ოფისი",
    openMap: "Google Maps-ზე გახსნა",
    socialTitle: "გამოგვყევით",
    bookTitle: "მზად ხართ დასაჯავშნად?",
    bookText: "ჯავშანი უფასოა: გამოგზავნეთ მოთხოვნა ნებისმიერი ტურის ან ტრანსფერის გვერდიდან, დაგიდასტურებთ WhatsApp-ით ან ტელეფონით. გადახდა — მომსახურების დღეს.",
    tours: "ტურები",
    transfers: "ტრანსფერები",
  },
  ru: {
    metaTitle: "Контакты GeorgiaTrips — WhatsApp, телефон и офис в Батуми",
    metaDescription: "Свяжитесь с GeorgiaTrips в Батуми: WhatsApp и телефон +995 504 22 00 20, email и офис на ул. Кутаиси, 27. Отвечаем на грузинском, английском, русском, турецком и арабском.",
    crumb: "Контакты",
    badge: "Свяжитесь с нами",
    title: "Контакты",
    highlight: "GeorgiaTrips",
    intro: "Быстрее всего с нами связаться в WhatsApp. Пишите на русском, грузинском, английском, турецком или арабском — укажите даты, сколько вас и куда хотите поехать.",
    whatsapp: "WhatsApp",
    whatsappDesc: "Вопросы, бронирование и изменения",
    phone: "Телефон",
    phoneDesc: "Позвоните нам",
    telegram: "Telegram",
    telegramDesc: "Тот же номер",
    email: "Email",
    emailDesc: "Для подробных запросов и групп",
    office: "Офис",
    openMap: "Открыть в Google Maps",
    socialTitle: "Мы в соцсетях",
    bookTitle: "Готовы забронировать?",
    bookText: "Бронирование бесплатное: отправьте заявку со страницы тура или трансфера — подтвердим в WhatsApp или по телефону. Оплата в день поездки.",
    tours: "Туры",
    transfers: "Трансферы",
  },
  tr: {
    metaTitle: "İletişim — GeorgiaTrips: WhatsApp, Telefon ve Batum Ofisi",
    metaDescription: "Batum'daki GeorgiaTrips'e ulaşın: WhatsApp ve telefon +995 504 22 00 20, e-posta ve Kutaisi Sk. 27'deki ofisimiz. Gürcüce, İngilizce, Rusça, Türkçe ve Arapça yanıt veriyoruz.",
    crumb: "İletişim",
    badge: "Bize ulaşın",
    title: "İletişim:",
    highlight: "GeorgiaTrips",
    intro: "Bize en hızlı WhatsApp'tan ulaşabilirsiniz. Türkçe, Gürcüce, İngilizce, Rusça veya Arapça yazın — tarihlerinizi, kaç kişi olduğunuzu ve nereye gitmek istediğinizi belirtin.",
    whatsapp: "WhatsApp",
    whatsappDesc: "Sorular, rezervasyonlar ve değişiklikler",
    phone: "Telefon",
    phoneDesc: "Bizi arayın",
    telegram: "Telegram",
    telegramDesc: "Aynı numara",
    email: "E-posta",
    emailDesc: "Ayrıntılı talepler ve gruplar için",
    office: "Ofis",
    openMap: "Google Haritalar'da aç",
    socialTitle: "Bizi takip edin",
    bookTitle: "Rezervasyona hazır mısınız?",
    bookText: "Rezervasyon ücretsizdir: herhangi bir tur veya transfer sayfasından talep gönderin, WhatsApp veya telefonla onaylayalım. Ödeme hizmet günü yapılır.",
    tours: "Turlar",
    transfers: "Transferler",
  },
  ar: {
    metaTitle: "اتصل بـ GeorgiaTrips — واتساب والهاتف والمكتب في باتومي",
    metaDescription: "تواصل مع GeorgiaTrips في باتومي: واتساب والهاتف ‎+995 504 22 00 20، والبريد الإلكتروني ومكتبنا في 27 شارع كوتايسي. نرد بالجورجية والإنجليزية والروسية والتركية والعربية.",
    crumb: "اتصل بنا",
    badge: "تواصل معنا",
    title: "تواصل مع",
    highlight: "GeorgiaTrips",
    intro: "أسرع طريقة للتواصل معنا هي واتساب. اكتب بالعربية أو الجورجية أو الإنجليزية أو الروسية أو التركية — أخبرنا بتواريخك وعدد أفراد مجموعتك ووجهتك.",
    whatsapp: "واتساب",
    whatsappDesc: "الأسئلة والحجوزات والتعديلات",
    phone: "الهاتف",
    phoneDesc: "اتصل بنا",
    telegram: "تيليغرام",
    telegramDesc: "الرقم نفسه",
    email: "البريد الإلكتروني",
    emailDesc: "للطلبات المفصلة والمجموعات",
    office: "المكتب",
    openMap: "افتح في خرائط Google",
    socialTitle: "تابعنا",
    bookTitle: "جاهز للحجز؟",
    bookText: "الحجز مجاني: أرسل طلباً من صفحة أي جولة أو توصيل، ونؤكده عبر واتساب أو الهاتف. والدفع يوم الخدمة.",
    tours: "الجولات",
    transfers: "التوصيل",
  },
};

export default async function ContactPage({ params }) {
  const { locale } = await params;
  const lang = getRequestLocale(locale);
  const c = CONTENT[lang] || CONTENT.en;
  const ui = landingUi(lang);
  const t = getTranslator(lang);

  const channels = [
    { icon: "💬", title: c.whatsapp, desc: c.whatsappDesc, value: PHONE_DISPLAY, href: whatsappHref(t("site.generalWa")), external: true },
    { icon: "📞", title: c.phone, desc: c.phoneDesc, value: PHONE_DISPLAY, href: `tel:${PHONE_TEL}` },
    { icon: "✈️", title: c.telegram, desc: c.telegramDesc, value: PHONE_DISPLAY, href: TELEGRAM_LINK, external: true },
    { icon: "✉️", title: c.email, desc: c.emailDesc, value: EMAIL, href: `mailto:${EMAIL}` },
    { icon: "📍", title: c.office, desc: t("footer.address"), value: c.openMap, href: COMPANY_PROFILE.googleMapsUrl, external: true },
  ];
  const socials = [
    { label: `Instagram @${INSTAGRAM_HANDLE}`, href: INSTAGRAM_LINK },
    { label: "Facebook", href: FACEBOOK_LINK },
    { label: "TikTok", href: TIKTOK_LINK },
    { label: "YouTube", href: YOUTUBE_LINK },
  ];

  const pageUrl = `${SITE_URL}/${lang}${PATH}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ContactPage",
        "@id": `${pageUrl}#page`,
        url: pageUrl,
        name: c.metaTitle,
        description: c.metaDescription,
        inLanguage: lang,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#organization` },
        mainEntity: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumbs`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: ui.home, item: `${SITE_URL}/${lang}` },
          { "@type": "ListItem", position: 2, name: c.crumb, item: pageUrl },
        ],
      },
    ],
  };

  return (
    <LandingShell active="home" jsonLd={jsonLd}>
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <nav className="landing-breadcrumbs" aria-label="Breadcrumb">
            <Link href={getLocalizedHref("/", lang)}>{ui.home}</Link>
            <span className="sep">/</span>
            <span>{c.crumb}</span>
          </nav>
          <div className="landing-badge">📇 {c.badge}</div>
          <h1 className="landing-title">
            {c.title} <span>{c.highlight}</span>
          </h1>
          <p className="landing-subtitle">{c.intro}</p>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-features-grid">
          {channels.map((ch) => (
            <a
              key={ch.title}
              href={ch.href}
              className="landing-feature-card"
              style={{ textDecoration: "none", color: "inherit" }}
              {...(ch.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              <span className="landing-feature-icon" aria-hidden="true">{ch.icon}</span>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.5rem" }}>{ch.title}</h2>
              <p>{ch.desc}</p>
              <p style={{ marginTop: "0.75rem", fontWeight: 700, color: "var(--gt-primary, #2a6592)" }} dir="ltr">{ch.value}</p>
            </a>
          ))}
        </div>

        <div className="landing-section-header" style={{ marginBottom: "1.5rem" }}>
          <h2 className="landing-section-title">{c.socialTitle}</h2>
        </div>
        <ul className="landing-route-links" style={{ maxWidth: 760 }}>
          {socials.map((s) => (
            <li key={s.href}>
              <a href={s.href} target="_blank" rel="noopener noreferrer">{s.label}</a>
            </li>
          ))}
        </ul>

        <div className="landing-cta-banner">
          <h2>{c.bookTitle}</h2>
          <p>{c.bookText}</p>
          <div className="landing-hero-actions">
            <Link href={getLocalizedHref("/tours", lang)} className="landing-btn-primary" prefetch={false}>🏔️ {c.tours}</Link>
            <Link href={getLocalizedHref("/transfers", lang)} className="landing-btn-secondary" prefetch={false}>🚐 {c.transfers}</Link>
          </div>
        </div>
      </section>
    </LandingShell>
  );
}
