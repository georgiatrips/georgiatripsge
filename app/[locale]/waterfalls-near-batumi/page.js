import React from "react";
import Link from "next/link";
import Image from "next/image";
import { getCachedTours, serializeForClient } from "../../lib/server/cachedData";
import { asLocalizedText } from "../../lib/toursFirestore";
import { SITE_URL, getRequestLocale, buildLocalizedMetadata, getLocalizedHref } from "../../lib/siteConfig";
import { WA_LINK } from "../../lib/shared";
import "../../landing.css";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const lang = getRequestLocale(locale);
  const c = CONTENT[lang] || CONTENT.en;

  return buildLocalizedMetadata({
    path: "/waterfalls-near-batumi",
    lang,
    title: `${c.heroTitle} ${c.heroHighlight || ""}`.trim() + " | GeorgiaTrips",
    description: c.heroSubtitle,
    image: "/hero.webp",
  });
}

const CONTENT = {
  en: {
    badge: "Adjara Nature & Hiking Guide",
    heroTitle: "The Most Beautiful Waterfalls Near",
    heroHighlight: "Batumi, Georgia",
    heroSubtitle: "Surrounded by ancient temperate rainforests and the Lesser Caucasus mountains, Adjara is home to spectacular cascading waterfalls. Here is your complete visitor guide.",
    ctaTours: "Book Waterfall Tour",
    ctaInquire: "Ask via WhatsApp",
    waterfallsTitle: "Top 4 Waterfalls Near Batumi",
    waterfallsDesc: "Detailed distances, trail difficulty, and highlights for each waterfall location.",
    waterfalls: [
      {
        icon: "🌊",
        name: "Makhuntseti Waterfall",
        distance: "30 km from Batumi (~40 mins)",
        height: "50 meters tall",
        desc: "Adjara's most iconic waterfall, cascading 50 meters into a natural rock basin. Just a 2-minute walk from the historic 12th-century arched stone bridge of Queen Tamar, surrounded by local Adjarian restaurants and wine cellars."
      },
      {
        icon: "🌿",
        name: "Mirveti Waterfall",
        distance: "27 km from Batumi (~35 mins)",
        height: "20 meters tall",
        desc: "A hidden gem tucked inside an enchanting fairy-tale boxwood and moss forest. Reached via a picturesque pedestrian suspension bridge over the Chorokhi River, offering serene, crowd-free nature walks."
      },
      {
        icon: "⛪",
        name: "Andrew the Apostle Waterfall (Sarpi)",
        distance: "18 km from Batumi (~25 mins)",
        height: "30 meters tall",
        desc: "Located on the scenic coastal highway between Kvariati and the Turkish border at Sarpi. Features a dramatic statue of Saint Andrew the First-Called and sweeping views of the Black Sea."
      },
      {
        icon: "🌲",
        name: "Tsablnari Waterfall (Mtirala National Park)",
        distance: "25 km from Batumi (~50 mins)",
        height: "15 meters tall",
        desc: "Nestled deep inside the subtropical rainforests of Mtirala National Park. Enjoy an invigorating 3km hike along rushing rivers, wild mountain flora, and swimming in crystal-clear mountain pools."
      }
    ],
    toursTitle: "Guided Waterfall Excursions from Batumi",
    toursDesc: "Experience these waterfalls in complete comfort with our private day tour packages.",
    faqs: [
      { q: "Can you swim in the waterfalls near Batumi?", a: "Yes, during warm summer months (June to September), natural pools at Makhuntseti, Mirveti, and Mtirala are popular for refreshing swims. Water is cold and invigorating." },
      { q: "How do you reach the waterfalls from Batumi?", a: "The most comfortable and reliable way is by private tour or driver, which allows you to combine multiple waterfalls, Queen Tamar bridges, and wine tastings in a single seamless day trip." },
      { q: "Is hiking gear required?", a: "Standard comfortable walking shoes or sneakers are perfectly adequate for Makhuntseti and Mirveti. For Mtirala National Park, sturdy hiking shoes are recommended." }
    ]
  },
  ru: {
    badge: "Гид по природе Аджарии",
    heroTitle: "Самые красивые водопады рядом с",
    heroHighlight: "Батуми",
    heroSubtitle: "Потрясающие каскады, изумрудные субтропические леса и древние мосты царицы Тамары. Путеводитель по лучшим водопадам Аджарии.",
    ctaTours: "Экскурсия на водопады",
    ctaInquire: "Задать вопрос в WhatsApp",
    waterfallsTitle: "Топ-4 водопада в окрестностях Батуми",
    waterfallsDesc: "Расстояние, высота и особенности каждого водопада.",
    waterfalls: [
      {
        icon: "🌊",
        name: "Водопад Махунцети",
        distance: "30 км от Батуми (~40 мин)",
        height: "Высота: 50 метров",
        desc: "Самый знаменитый водопад Аджарии. Рядом находится исторический арочный мост царицы Тамары XII века, аутентичные рестораны и дегустации аджарского вина."
      },
      {
        icon: "🌿",
        name: "Лесной водопад Мирвети",
        distance: "27 км от Батуми (~35 мин)",
        height: "Высота: 20 метров",
        desc: "Спрятанный в сказочном самшитовом лесу, покрытом изумрудным мхом. Дорога ведет через подвесной мост над рекой Чорохи — тишина и чистейший воздух."
      },
      {
        icon: "⛪",
        name: "Водопад Андрея Первозванного (Сарпи)",
        distance: "18 км от Батуми (~25 мин)",
        height: "Высота: 30 метров",
        desc: "Расположен прямо у прибрежной трассы в сторону границы с Турцией. Рядом установлен памятник апостолу Андрею и открывается вид на море."
      },
      {
        icon: "🌲",
        name: "Водопад Цаблнари (парк Мтирала)",
        distance: "25 км от Батуми (~50 мин)",
        height: "Высота: 15 метров",
        desc: "Расположен в сердце национального парка Мтирала. К нему ведет живописная эко-тропа через реликтовые джунгли с подвесными переправами."
      }
    ],
    toursTitle: "Экскурсии на водопады из Батуми",
    toursDesc: "Посетите лучшие водопады за один день на комфортабельном авто с гидом.",
    faqs: [
      { q: "Можно ли купаться в водопадах?", a: "Да, летом многие купаются в освежающих горных чашах Махунцети, Мирвети и парка Мтирала. Вода горная и бодрящая." },
      { q: "Как лучше всего добраться до водопадов?", a: "Удобнее всего заказать индивидуальную экскурсию на авто с водителем — так вы успеете посмотреть 3-4 водопада, мосты и винодельни без пересадок." },
      { q: "Нужна ли специальная обувь?", a: "Для Махунцети и Мирвети достаточно удобных кроссовок. Для парка Мтирала желательна обувь с нескользящей подошвой." }
    ]
  },
  ka: {
    badge: "აჭარის ბუნების გზამკვლევი",
    heroTitle: "ულამაზესი ჩანჩქერები",
    heroHighlight: "ბათუმთან ახლოს",
    heroSubtitle: "მთიანი აჭარის კასკადური ჩანჩქერები, თამარის ხიდები და მტირალას რელიქტური ტყეები. სრული გზამკვლევი მოგზაურთათვის.",
    ctaTours: "ტურის დაჯავშნა",
    ctaInquire: "WhatsApp კონსულტაცია",
    waterfallsTitle: "ტოპ-4 ჩანჩქერი ბათუმის შემოგარენში",
    waterfallsDesc: "მანძილი, სიმაღლე და დეტალური ინფორმაცია თითოეულ ჩანჩქერზე.",
    waterfalls: [
      {
        icon: "🌊",
        name: "მახუნცეთის ჩანჩქერი",
        distance: "30 კმ ბათუმიდან (~40 წუთი)",
        height: "სიმაღლე: 50 მეტრი",
        desc: "აჭარის ყველაზე ცნობილი ჩანჩქერი და თამარ მეფის XII საუკუნის თაღოვანი ხიდი."
      },
      {
        icon: "🌿",
        name: "მირვეთის ჩანჩქერი",
        distance: "27 კმ ბათუმიდან (~35 წუთი)",
        height: "სიმაღლე: 20 მეტრი",
        desc: "ზღაპრული ბზის ტყეში დამალული ულამაზესი ჩანჩქერი და დაკიდული ხიდი ჭოროხზე."
      },
      {
        icon: "⛪",
        name: "ანდრია პირველწოდებულის ჩანჩქერი (სარფი)",
        distance: "18 კმ ბათუმიდან (~25 წუთი)",
        height: "სიმაღლე: 30 მეტრი",
        desc: "ზღვისპირა ჩანჩქერი სარფისკენ მიმავალ გზაზე, წმინდა ანდრიას ძეგლთან."
      },
      {
        icon: "🌲",
        name: "წაბლნარის ჩანჩქერი (მტირალას პარკი)",
        distance: "25 კმ ბათუმიდან (~50 წუთი)",
        height: "სიმაღლე: 15 მეტრი",
        desc: "მტირალას ეროვნული პარკის გულში მდებარე ჩანჩქერი ულამაზესი სალაშქრო ბილიკით."
      }
    ],
    toursTitle: "ტურები ჩანჩქერებზე ბათუმიდან",
    toursDesc: "მოინახულეთ აჭარის ყველა მთავარი ჩანჩქერი 1-დღიან კომფორტულ ტურში.",
    faqs: [
      { q: "შესაძლებელია ჩანჩქერში ბანაობა?", a: "დიახ, ზაფხულის თვეებში მახუნცეთის, მირვეთისა და მტირალას ბუნებრივი აუზები პოპულარულია გასაგრილებლად." },
      { q: "როგორ ჯობია ჩანჩქერებზე წასვლა?", a: "ყველაზე მოსახერხებელია ინდივიდუალური ტური მძღოლით, რაც საშუალებას მოგცემთ ყველა ლოკაცია ერთ დღეში ნახოთ." },
      { q: "რა სახის ფეხსაცმელია საჭირო?", a: "მახუნცეთსა და მირვეთში საკმარისია ჩვეულებრივი სპორტული ფეხსაცმელი." }
    ]
  }
};

export default async function WaterfallsNearBatumiPage({ params }) {
  const [rawTours, { locale }] = await Promise.all([getCachedTours(), params]);
  const lang = getRequestLocale(locale);
  const tours = serializeForClient(rawTours) || [];
  const c = CONTENT[lang] || CONTENT.en;

  const waterfallTours = tours.filter(t => {
    const title = (asLocalizedText(t.title, "en") || "").toLowerCase();
    return title.includes("adjara") || title.includes("waterfall") || title.includes("machakhela") || title.includes("martvili");
  });

  const displayTours = waterfallTours.length > 0 ? waterfallTours.slice(0, 3) : tours.slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        "@id": `${SITE_URL}/${lang}/waterfalls-near-batumi#itemlist`,
        "name": c.waterfallsTitle,
        "itemListElement": c.waterfalls.map((wf, idx) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "item": {
            "@type": "TouristAttraction",
            "name": wf.name,
            "description": `${wf.desc} (${wf.distance}, ${wf.height})`,
            "url": `${SITE_URL}/${lang}/waterfalls-near-batumi`,
          }
        }))
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/${lang}/waterfalls-near-batumi#faq`,
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
        "@id": `${SITE_URL}/${lang}/waterfalls-near-batumi#breadcrumbs`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": lang === "ka" ? "მთავარი" : (lang === "ru" ? "Главная" : "Home"), "item": `${SITE_URL}/${lang}` },
          { "@type": "ListItem", "position": 2, "name": lang === "ka" ? "ჩანჩქერები ბათუმთან" : (lang === "ru" ? "Водопады рядом с Батуми" : "Waterfalls Near Batumi"), "item": `${SITE_URL}/${lang}/waterfalls-near-batumi` }
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
          <div className="landing-badge">💧 {c.badge}</div>
          <h1 className="landing-title">
            {c.heroTitle} <span>{c.heroHighlight}</span>
          </h1>
          <p className="landing-subtitle">{c.heroSubtitle}</p>
          <div className="landing-hero-actions">
            <a href="#waterfalls" className="landing-btn-primary">
              🌊 Explore Waterfalls Guide
            </a>
            <a href={`${WA_LINK}?text=${encodeURIComponent(`Hello! I want to book a private tour to the Adjara waterfalls from Batumi.`)}`} target="_blank" rel="noopener noreferrer" className="landing-btn-secondary">
              💬 {c.ctaInquire}
            </a>
          </div>
        </div>
      </section>

      {/* Waterfall Details */}
      <section id="waterfalls" className="landing-section">
        <div className="landing-section-header">
          <div className="landing-section-tag">Cascades & Rainforests</div>
          <h2 className="landing-section-title">{c.waterfallsTitle}</h2>
          <p className="landing-section-desc">{c.waterfallsDesc}</p>
        </div>
        <div className="landing-features-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
          {c.waterfalls.map((wf, i) => (
            <div key={i} className="landing-feature-card">
              <span className="landing-feature-icon">{wf.icon}</span>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#29b2b7", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                <span>{wf.distance}</span>
                <span>{wf.height}</span>
              </div>
              <h3>{wf.name}</h3>
              <p>{wf.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Matching Tours */}
      {displayTours.length > 0 && (
        <section className="landing-section" style={{ paddingTop: 0 }}>
          <div className="landing-section-header">
            <div className="landing-section-tag">Recommended Trips</div>
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
                      <span>⏱️ 1 Day Tour</span>
                      <span className="landing-tour-cta">View Tour →</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="landing-section" style={{ paddingTop: 0 }}>
        <div className="landing-section-header">
          <div className="landing-section-tag">Visitor Info</div>
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
          <h2>Book a Private Waterfall Tour from Batumi</h2>
          <p>Relax in air-conditioned Mercedes transport while our local guide takes you to all the best waterfalls in Adjara.</p>
          <a href={`${WA_LINK}?text=${encodeURIComponent(`Hello! I want to book a private tour to the waterfalls around Batumi.`)}`} target="_blank" rel="noopener noreferrer" className="landing-btn-primary">
            💬 Book Tour on WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}
