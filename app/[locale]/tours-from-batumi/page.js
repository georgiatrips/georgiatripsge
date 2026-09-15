import React from "react";
import Link from "next/link";
import Image from "next/image";
import { getCachedTours, serializeForClient } from "../../lib/server/cachedData";
import { asLocalizedText, translateDuration } from "../../lib/toursFirestore";
import { SITE_URL, getRequestLocale, buildLocalizedMetadata, getLocalizedHref } from "../../lib/siteConfig";
import { WA_LINK } from "../../lib/shared";
import "../../landing.css";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const lang = getRequestLocale(locale);
  const c = CONTENT[lang] || CONTENT.en;

  return buildLocalizedMetadata({
    path: "/tours-from-batumi",
    lang,
    title: `${c.heroTitle} ${c.heroHighlight} | GeorgiaTrips`,
    description: c.heroSubtitle,
    image: "/hero.webp",
  });
}

const CONTENT = {
  en: {
    badge: "Batumi Excursions & Day Trips",
    heroTitle: "Top Guided Day Tours & Trips from",
    heroHighlight: "Batumi",
    heroSubtitle: "Discover the lush subtropical beauty of Adjara, thunderous waterfalls, ancient fortresses, and UNESCO caves with professional local guides and private Mercedes transport.",
    ctaExplore: "Browse Batumi Tours",
    ctaContact: "Inquire on WhatsApp",
    whyTitle: "Why Book Day Tours from Batumi with Us?",
    whyDesc: "Experience Georgia beyond the seaside with door-to-door comfort, authentic hospitality, and zero stress.",
    features: [
      { icon: "🚗", title: "Hotel Pickup & Drop-off", desc: "We pick you up directly from any hotel, villa, or apartment in Batumi, Gonio, Kvariati, or Kobuleti." },
      { icon: "🗺️", title: "Authentic Hidden Spots", desc: "Visit historic arched stone bridges, hidden mountain waterfalls, and authentic family-owned Adjarian wine cellars." },
      { icon: "🗣️", title: "Multilingual Local Guides", desc: "Knowledgeable drivers and guides fluent in English, Russian, Turkish, Arabic, and Georgian." },
      { icon: "🛡️", title: "No Prepayment Required", desc: "Book with confidence online. Pay safely upon pickup with cash or online card transfer." }
    ],
    toursTitle: "Popular Day Tours Departing from Batumi",
    toursDesc: "Handcrafted itineraries designed for unforgettable day excursions and scenic photography.",
    viewTour: "View Tour Details",
    practicalTitle: "Practical Information for Batumi Travelers",
    tips: [
      { q: "What is the best time for day trips from Batumi?", a: "Morning departures between 09:00 and 10:00 AM allow you to maximize daylight and avoid afternoon heat. Mountain areas like Makhuntseti and Mtirala are pleasantly cool year-round." },
      { q: "What should I bring on a mountain day tour?", a: "Comfortable walking shoes, light jacket (temperatures drop in higher elevations), camera/phone, and swimming clothes if visiting waterfalls or canyon boat rides in summer." },
      { q: "Are custom private itineraries possible?", a: "Yes! All tours can be tailored to your preferred start time, pace, and destination preferences." }
    ],
    faqs: [
      { q: "How do I book a tour from Batumi?", a: "Select your desired tour and message us directly on WhatsApp or fill out the booking form on the tour page. Our manager responds within 15 minutes." },
      { q: "Where do tours from Batumi depart from?", a: "Tours include complimentary door-to-door pickup from your hotel or accommodation anywhere within the Batumi metropolitan area." },
      { q: "What languages do your drivers and guides speak?", a: "We provide professional guides speaking English, Russian, Georgian, Turkish, and Arabic." }
    ]
  },
  ru: {
    badge: "Экскурсии и туры из Батуми",
    heroTitle: "Лучшие однодневные туры и экскурсии из",
    heroHighlight: "Батуми",
    heroSubtitle: "Исследуйте субтропическую Аджарию, горные водопады, старинные мосты царицы Тамары и каньоны с комфортом на автомобилях Mercedes с русскоязычными гидами.",
    ctaExplore: "Выбрать тур из Батуми",
    ctaContact: "Написать в WhatsApp",
    whyTitle: "Почему выбирают наши экскурсии из Батуми?",
    whyDesc: "Полноценный отдых и яркие эмоции с заботой о каждой детали вашей поездки.",
    features: [
      { icon: "🚗", title: "Трансфер от вашего отеля", desc: "Забираем вас прямо от отеля или апартаментов в Батуми, Гонио, Квариати или Кобулети и привозим обратно." },
      { icon: "🗺️", title: "Необычные локации", desc: "Посетите аутентичные горные водопады, древние арочные мосты и семейные винные погреба Аджарии." },
      { icon: "🗣️", title: "Русскоязычные гиды", desc: "Опытные и душевные гиды, которые расскажут увлекательные истории и традиции Грузии." },
      { icon: "🛡️", title: "Без предоплаты", desc: "Бронируйте тур онлайн бесплатно. Оплата производится на месте при посадке." }
    ],
    toursTitle: "Популярные экскурсии с выездом из Батуми",
    toursDesc: "Сбалансированные маршруты с великолепными видами для всей семьи.",
    viewTour: "Подробнее о туре",
    practicalTitle: "Полезная информация для туристов в Батуми",
    tips: [
      { q: "Когда лучше выезжать на экскурсию из Батуми?", a: "Оптимальное время выезда — 09:00–10:00 утра. Это позволяет без спешки осмотреть все достопримечательности и сделать лучшие фотографии." },
      { q: "Что взять с собой в поездку в горы?", a: "Удобную обувь для прогулок, легкую кофту (в горах прохладнее) и купальные принадлежности для каньонов и водопадов." },
      { q: "Можно ли изменить маршрут под себя?", a: "Да! Для индивидуальных туров мы легко адаптируем программу под ваши пожелания и время." }
    ],
    faqs: [
      { q: "Как забронировать экскурсию из Батуми?", a: "Выберите тур на сайте и напишите нам в WhatsApp или оставьте заявку. Менеджер ответит в течение нескольких минут." },
      { q: "Откуда начинается экскурсия?", a: "Мы забираем вас от вашего адреса или отеля в Батуми и окрестностях в назначенное время." },
      { q: "На каких языках проводятся туры?", a: "Наши гиды свободно говорят на русском, английском, грузинском, турецком и арабском языках." }
    ]
  },
  ka: {
    badge: "ტურები და ექსკურსიები ბათუმიდან",
    heroTitle: "საუკეთესო 1-დღიანი ტურები და ექსკურსიები",
    heroHighlight: "ბათუმიდან",
    heroSubtitle: "აღმოაჩინეთ მთიანი აჭარის სილამაზე, ჩანჩქერები, თამარის ხიდები და კანიონები კომფორტული Mercedes-ის ტრანსპორტითა და პროფესიონალი გიდით.",
    ctaExplore: "ტურების ნახვა",
    ctaContact: "WhatsApp-ზე დაკავშირება",
    whyTitle: "რატომ უნდა აირჩიოთ GeorgiaTrips-ის ტურები?",
    whyDesc: "მაქსიმალური კომფორტი, უსაფრთხოება და დაუვიწყარი ემოციები.",
    features: [
      { icon: "🚗", title: "სასტუმროდან გაყვანა", desc: "მძღოლი მოგაკითხავთ ბათუმის ნებისმიერ სასტუმროსა თუ აპარტამენტში." },
      { icon: "🗺️", title: "ავთენტური ლოკაციები", desc: "მოინახულეთ მთის ჩანჩქერები, ისტორიული ხიდები და საოჯახო მარნები." },
      { icon: "🗣️", title: "გამოცდილი გიდები", desc: "მრავალენოვანი გიდები და მძღოლები (ქართული, ინგლისური, რუსული, თურქული, არაბული)." },
      { icon: "🛡️", title: "ჯავშანი წინასწარი გადახდის გარეშე", desc: "დაჯავშნეთ ონლაინ მარტივად და გადაიხადეთ ტურის დღეს." }
    ],
    toursTitle: "პოპულარული ტურები ბათუმიდან",
    toursDesc: "საუკეთესო მარშრუტები 1-დღიანი დასვენებისთვის.",
    viewTour: "დეტალების ნახვა",
    practicalTitle: "პრაქტიკული რჩევები მოგზაურთათვის",
    tips: [
      { q: "როდის არის საუკეთესო დრო ტურზე გასასვლელად?", a: "საუკეთესო დროა დილის 09:00 - 10:00 საათი, რათა დღის სინათლე სრულად გამოიყენოთ." },
      { q: "რა უნდა წავიღოთ მთაში?", a: "მოსახერხებელი ფეხსაცმელი, მზისგან დამცავი და მსუბუქი მოსაცმელი." },
      { q: "შესაძლებელია თუ არა ინდივიდუალური მარშრუტი?", a: "დიახ, პროგრამა შეიძლება სრულად მოერგოს თქვენს სურვილებს." }
    ],
    faqs: [
      { q: "როგორ დავჯავშნო ტური ბათუმიდან?", a: "აირჩიეთ ტური და მოგვწერეთ WhatsApp-ზე ან შეავსეთ ფორმა საიტზე." },
      { q: "სად იწყება ტური?", a: "ტურის დაწყება ხდება თქვენი სასტუმროდან ან მითითებული მისამართიდან." },
      { q: "რომელ ენებზე საუბრობენ გიდები?", a: "ჩვენი გიდები საუბრობენ ქართულ, ინგლისურ, რუსულ, თურქულ და არაბულ ენებზე." }
    ]
  }
};

export default async function ToursFromBatumiPage({ params }) {
  const [rawTours, { locale }] = await Promise.all([getCachedTours(), params]);
  const lang = getRequestLocale(locale);
  const tours = serializeForClient(rawTours) || [];
  const c = CONTENT[lang] || CONTENT.en;

  // Filter or prioritize tours relevant to Batumi / Adjara / West Georgia
  const batumiTours = tours.filter(t => {
    const title = (asLocalizedText(t.title, "en") || "").toLowerCase();
    const desc = (asLocalizedText(t.desc, "en") || "").toLowerCase();
    return title.includes("adjara") || title.includes("batumi") || title.includes("martvili") || title.includes("machakhela") || title.includes("svaneti") || title.includes("promethe") || title.includes("canyon") || title.includes("waterfall");
  });

  const displayTours = batumiTours.length >= 3 ? batumiTours : tours.slice(0, 6);

  // Structured Data: ItemList + FAQPage + BreadcrumbList
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        "@id": `${SITE_URL}/${lang}/tours-from-batumi#itemlist`,
        "name": c.toursTitle,
        "itemListElement": displayTours.map((t, idx) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "item": {
            "@type": "TouristTrip",
            "name": asLocalizedText(t.title, lang) || asLocalizedText(t.title, "en"),
            "description": asLocalizedText(t.desc, lang) || asLocalizedText(t.desc, "en"),
            "image": t.img || `${SITE_URL}/hero.webp`,
            "url": `${SITE_URL}/${lang}/tours/${encodeURIComponent(t.id)}`,
          }
        }))
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/${lang}/tours-from-batumi#faq`,
        "mainEntity": c.faqs.map(faq => ({
          "@type": "Question",
          "name": faq.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.a
          }
        }))
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/${lang}/tours-from-batumi#breadcrumbs`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": lang === "ka" ? "მთავარი" : (lang === "ru" ? "Главная" : "Home"), "item": `${SITE_URL}/${lang}` },
          { "@type": "ListItem", "position": 2, "name": lang === "ka" ? "ტურები ბათუმიდან" : (lang === "ru" ? "Туры из Батуми" : "Tours from Batumi"), "item": `${SITE_URL}/${lang}/tours-from-batumi` }
        ]
      }
    ]
  };

  return (
    <div className="landing-container">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-breadcrumbs">
            <Link href={getLocalizedHref("/", lang)}>{lang === "ka" ? "მთავარი" : (lang === "ru" ? "Главная" : "Home")}</Link>
            <span className="sep">/</span>
            <span>{c.badge}</span>
          </div>
          <div className="landing-badge">⭐ {c.badge}</div>
          <h1 className="landing-title">
            {c.heroTitle} <span>{c.heroHighlight}</span>
          </h1>
          <p className="landing-subtitle">{c.heroSubtitle}</p>
          <div className="landing-hero-actions">
            <a href="#tours-list" className="landing-btn-primary">
              🔍 {c.ctaExplore}
            </a>
            <a href={`${WA_LINK}?text=${encodeURIComponent(`Hello! I want to inquire about tours from Batumi.`)}`} target="_blank" rel="noopener noreferrer" className="landing-btn-secondary">
              💬 {c.ctaContact}
            </a>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="landing-section">
        <div className="landing-section-header">
          <div className="landing-section-tag">GeorgiaTrips Advantages</div>
          <h2 className="landing-section-title">{c.whyTitle}</h2>
          <p className="landing-section-desc">{c.whyDesc}</p>
        </div>
        <div className="landing-features-grid">
          {c.features.map((f, i) => (
            <div key={i} className="landing-feature-card">
              <span className="landing-feature-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Real Firestore Tours */}
      <section id="tours-list" className="landing-section" style={{ paddingTop: 0 }}>
        <div className="landing-section-header">
          <div className="landing-section-tag">Featured Excursions</div>
          <h2 className="landing-section-title">{c.toursTitle}</h2>
          <p className="landing-section-desc">{c.toursDesc}</p>
        </div>
        <div className="landing-tours-grid">
          {displayTours.map((tour) => {
            const title = asLocalizedText(tour.title, lang) || asLocalizedText(tour.title, "en") || tour.title;
            const desc = asLocalizedText(tour.desc, lang) || asLocalizedText(tour.desc, "en") || tour.desc;
            const price = tour.pricePrivate || tour.priceGroup || tour.price || null;

            return (
              <Link key={tour.id} href={getLocalizedHref(`/tours/${tour.id}`, lang)} className="landing-tour-card">
                <div className="landing-tour-img-wrap">
                  <Image
                    src={tour.img || "/hero.webp"}
                    alt={title}
                    fill
                    sizes="(max-width: 768px) 100vw, 380px"
                    className="landing-tour-img"
                  />
                  {price ? <div className="landing-tour-price-badge">₾{price}</div> : null}
                </div>
                <div className="landing-tour-body">
                  <h3 className="landing-tour-title">{title}</h3>
                  <p className="landing-tour-desc">{desc}</p>
                  <div className="landing-tour-footer">
                    {tour.duration ? <span>⏱️ {translateDuration(tour.duration, lang)}</span> : <span />}
                    <span className="landing-tour-cta">{c.viewTour} →</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Practical Tourist Tips */}
      <section className="landing-section" style={{ paddingTop: 0 }}>
        <div className="landing-section-header">
          <div className="landing-section-tag">Traveler Insights</div>
          <h2 className="landing-section-title">{c.practicalTitle}</h2>
        </div>
        <div className="landing-faq-grid">
          {c.tips.map((tip, i) => (
            <div key={i} className="landing-faq-item">
              <h3 className="landing-faq-q">💡 {tip.q}</h3>
              <p className="landing-faq-a">{tip.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="landing-section" style={{ paddingTop: 0 }}>
        <div className="landing-section-header">
          <div className="landing-section-tag">FAQ</div>
          <h2 className="landing-section-title">Frequently Asked Questions</h2>
        </div>
        <div className="landing-faq-grid">
          {c.faqs.map((faq, i) => (
            <div key={i} className="landing-faq-item">
              <h3 className="landing-faq-q">❓ {faq.q}</h3>
              <p className="landing-faq-a">{faq.a}</p>
            </div>
          ))}
        </div>

        {/* CTA Banner */}
        <div className="landing-cta-banner">
          <h2>Ready to Explore Georgia from Batumi?</h2>
          <p>Contact our concierge on WhatsApp for instant booking, custom itineraries, and fast confirmation.</p>
          <a href={`${WA_LINK}?text=${encodeURIComponent(`Hello! I'd like to book a private tour from Batumi.`)}`} target="_blank" rel="noopener noreferrer" className="landing-btn-primary">
            💬 Contact Concierge on WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}
