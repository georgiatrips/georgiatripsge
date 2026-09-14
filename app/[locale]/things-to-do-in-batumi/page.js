import React from "react";
import Link from "next/link";
import Image from "next/image";
import { getCachedPlaces, getCachedTours, serializeForClient } from "../../lib/server/cachedData";
import { asLocalizedText } from "../../lib/toursFirestore";
import { SITE_URL, getRequestLocale, buildLocalizedMetadata, getLocalizedHref } from "../../lib/siteConfig";
import { WA_LINK } from "../../lib/shared";
import "../../landing.css";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const lang = getRequestLocale(locale);
  const c = CONTENT[lang] || CONTENT.en;

  return buildLocalizedMetadata({
    path: "/things-to-do-in-batumi",
    lang,
    title: `${c.heroTitle} ${c.heroHighlight || ""}`.trim() + " | GeorgiaTrips",
    description: c.heroSubtitle,
    image: "/hero.webp",
  });
}

const CONTENT = {
  en: {
    badge: "Ultimate Travel Guide",
    heroTitle: "Top Things to Do & Attractions in",
    heroHighlight: "Batumi, Georgia",
    heroSubtitle: "From the world-renowned seaside boulevard and ancient Roman fortresses to lush subtropical botanical gardens and Black Sea culinary delights — here is your complete guide to Batumi.",
    ctaAttractions: "Explore Must-See Sights",
    ctaTours: "Browse Batumi Excursions",
    guideTitle: "Top 6 Must-Do Experiences in Batumi",
    guideDesc: "Essential highlights that no first-time or returning visitor should miss.",
    experiences: [
      { icon: "🌊", title: "Walk or Bike the 7km Batumi Boulevard", desc: "One of Europe's longest seaside promenades, lined with palm trees, modern sculptures, beach lounges, and the moving Ali & Nino statue." },
      { icon: "🌿", title: "Explore Batumi Botanical Garden", desc: "Perched dramatically on the Green Cape (Mtsvane Kontskhi), showcasing over 5,000 exotic plant species with panoramic sea cliffs." },
      { icon: "🏰", title: "Step Back in Time at Gonio-Apsaros Fortress", desc: "A 1st-century Roman-Byzantine stronghold rich in Argonaut mythology, located just 12km south of the city center." },
      { icon: "🚠", title: "Ride the Argo Cable Car for Sunset Views", desc: "Ascend 250 meters above sea level to Anuria Mountain for breathtaking 360-degree sunset panoramas over Batumi bay and the Black Sea." },
      { icon: "🥟", title: "Taste Authentic Boat-Shaped Adjarian Khachapuri", desc: "Savor the legendary cheese bread topped with butter and egg yolk at iconic local taverns like Retro or Laguna." },
      { icon: "🌲", title: "Hike Through the Rainforests of Mtirala National Park", desc: "Experience Georgia's wettest and greenest national park with ziplining, suspension bridges, and crystal-clear mountain streams." }
    ],
    placesTitle: "Curated Landmarks & Sightseeing Locations",
    placesDesc: "Click any destination for detailed visitor hours, historical background, and how to get there.",
    viewPlace: "Explore Sight",
    faqs: [
      { q: "How many days do you need in Batumi?", a: "2 to 3 days are ideal for exploring the city center, boulevard, botanical garden, and enjoying an excursion into Mountain Adjara or Martvili Canyon." },
      { q: "Is Batumi walkable?", a: "Yes! Old Batumi, Europe Square, Piazza, and the Seaside Boulevard are completely flat and highly pedestrian-friendly." },
      { q: "When is the best season to visit Batumi?", a: "May to October offers the best weather for beach activities and outdoor mountain excursions. July and August are the warmest beach months, while September-October offer pleasant mild temperatures and wine harvest season." }
    ]
  },
  ru: {
    badge: "Полный путеводитель",
    heroTitle: "Что посмотреть и чем заняться в",
    heroHighlight: "Батуми",
    heroSubtitle: "Знаменитый Приморский бульвар, древняя крепость Гонио, Ботанический сад на Зеленом мысу и аджарская кухня. Полный гид по главным локациям Батуми.",
    ctaAttractions: "Главные места",
    ctaTours: "Экскурсии из Батуми",
    guideTitle: "Топ-6 обязательных впечатлений в Батуми",
    guideDesc: "Самое интересное для тех, кто хочет влюбиться в черноморскую столицу Грузии.",
    experiences: [
      { icon: "🌊", title: "Прогулка по Батумскому бульвару", desc: "7 километров пальмовых аллей, арт-объектов, движущаяся статуя Али и Нино и морской бриз." },
      { icon: "🌿", title: "Ботанический сад на Зеленом Мысу", desc: "Уникальный сад на террасах над морем с растениями со всего мира и головокружительными видами." },
      { icon: "🏰", title: "Римская крепость Гонио", desc: "Древнейшая крепость I века с богатой историей и легендой об аргонавтах." },
      { icon: "🚠", title: "Канатная дорога «Арго»", desc: "Подъем на гору Анурия для лучших панорамных фото Батуми на закате." },
      { icon: "🥟", title: "Настоящий аджарский хачапури", desc: "Легендарная «лодочка» с тягучим сыром, сливочным маслом и яичным желтком." },
      { icon: "🌲", title: "Джунгли парка Мтирала", desc: "Самый влажный и зеленый уголок Грузии с подвесными мостами, водопадами и тропическими лесами." }
    ],
    placesTitle: "Главные достопримечательности Батуми",
    placesDesc: "Нажмите на карточку места, чтобы узнать подробную информацию и как добраться.",
    viewPlace: "Подробнее о месте",
    faqs: [
      { q: "Сколько дней нужно на Батуми?", a: "Оптимально 2–3 дня, чтобы не спеша увидеть город, Ботанический сад и съездить на однодневную экскурсию в горы." },
      { q: "Удобно ли передвигаться по городу пешком?", a: "Да, старый город, набережная и бульвар абсолютно плоские и идеально подходят для пеших и велосипедных прогулок." },
      { q: "В какое время года лучше ехать в Батуми?", a: "С мая по октябрь стоит отличная погода для прогулок и поездок в горы. Для пляжного отдыха лучше всего подходят июль, август и бархатный сентябрь." }
    ]
  },
  ka: {
    badge: "მოგზაურის გზამკვლევი",
    heroTitle: "რა ვნახოთ და რა გავაკეთოთ",
    heroHighlight: "ბათუმში",
    heroSubtitle: "ბათუმის ბულვარი, ბოტანიკური ბაღი, გონიოს ციხე, არგოს საბაგირო და აჭარული სამზარეულო. სრული გზამკვლევი ბათუმში მოგზაურთათვის.",
    ctaAttractions: "ღირსშესანიშნაობები",
    ctaTours: "ტურები ბათუმიდან",
    guideTitle: "ტოპ-6 აქტივობა ბათუმში",
    guideDesc: "საუკეთესო შთაბეჭდილებები, რომლებიც არ უნდა გამოტოვოთ.",
    experiences: [
      { icon: "🌊", title: "გასეირნება ბათუმის ბულვარში", desc: "7 კილომეტრიანი ზღვისპირა პარკი, ალი და ნინოს ქანდაკება და ველობილიკები." },
      { icon: "🌿", title: "ბათუმის ბოტანიკური ბაღი", desc: "მწვანე კონცხის ულამაზესი ტერასები და მსოფლიო ფლორის მრავალფეროვნება." },
      { icon: "🏰", title: "გონიო-აფსაროსის ციხესიმაგრე", desc: "I საუკუნის რომაული ციხესიმაგრე და არგონავტების ლეგენდა." },
      { icon: "🚠", title: "არგოს საბაგირო გზა", desc: "ანურიის მთიდან გადაშლილი 360-გრადუსიანი პანორამული ხედები." },
      { icon: "🥟", title: "აჭარული ხაჭაპურის დაგემოვნება", desc: "ნამდვილი აჭარული ხაჭაპური ბათუმის საუკეთესო ტრადიციულ რესტორნებში." },
      { icon: "🌲", title: "მტირალას ეროვნული პარკი", desc: "საქართველოს ყველაზე ტენიანი და მწვანე ტყეები, დაკიდული ხიდები და ჩანჩქერები." }
    ],
    placesTitle: "ბათუმის გამორჩეული ადგილები",
    placesDesc: "გაეცანით დეტალურ ინფორმაციას თითოეული ლოკაციის შესახებ.",
    viewPlace: "ადგილის ნახვა",
    faqs: [
      { q: "რამდენი დღეა საჭირო ბათუმის სანახავად?", a: "2-3 დღე საკმარისია ქალაქის, ბოტანიკური ბაღისა და მთიანი აჭარის მოსანახულებლად." },
      { q: "ადვილია ქალაქში ფეხით გადაადგილება?", a: "დიახ, ბულვარი და ძველი ბათუმი სრულად მოსახერხებელია ფეხით სასეირნოდ." },
      { q: "როდის არის საუკეთესო დრო ბათუმში ჩამოსასვლელად?", a: "მაისიდან ოქტომბრის ჩათვლით იდეალური პერიოდია როგორც ზღვის, ასევე ექსკურსიებისთვის." }
    ]
  }
};

export default async function ThingsToDoInBatumiPage({ params }) {
  const [rawPlaces, rawTours, { locale }] = await Promise.all([getCachedPlaces(), getCachedTours(), params]);
  const lang = getRequestLocale(locale);
  const places = serializeForClient(rawPlaces) || [];
  const tours = serializeForClient(rawTours) || [];
  const c = CONTENT[lang] || CONTENT.en;

  const displayPlaces = places.slice(0, 6);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        "@id": `${SITE_URL}/${lang}/things-to-do-in-batumi#itemlist`,
        "name": c.placesTitle,
        "itemListElement": displayPlaces.map((p, idx) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "item": {
            "@type": "TouristAttraction",
            "name": asLocalizedText(p.title, lang) || asLocalizedText(p.title, "en"),
            "description": asLocalizedText(p.desc, lang) || asLocalizedText(p.desc, "en"),
            "image": p.img || `${SITE_URL}/tbilisi.webp`,
            "url": `${SITE_URL}/${lang}/places/${encodeURIComponent(p.id)}`,
          }
        }))
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/${lang}/things-to-do-in-batumi#faq`,
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
        "@id": `${SITE_URL}/${lang}/things-to-do-in-batumi#breadcrumbs`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": lang === "ka" ? "მთავარი" : (lang === "ru" ? "Главная" : "Home"), "item": `${SITE_URL}/${lang}` },
          { "@type": "ListItem", "position": 2, "name": lang === "ka" ? "რა ვნახოთ ბათუმში" : (lang === "ru" ? "Что посмотреть в Батуми" : "Things to Do in Batumi"), "item": `${SITE_URL}/${lang}/things-to-do-in-batumi` }
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
          <div className="landing-badge">🗺️ {c.badge}</div>
          <h1 className="landing-title">
            {c.heroTitle} <span>{c.heroHighlight}</span>
          </h1>
          <p className="landing-subtitle">{c.heroSubtitle}</p>
          <div className="landing-hero-actions">
            <a href="#experiences" className="landing-btn-primary">
              🌟 {c.ctaAttractions}
            </a>
            <Link href={getLocalizedHref("/tours-from-batumi", lang)} className="landing-btn-secondary">
              🚗 {c.ctaTours}
            </Link>
          </div>
        </div>
      </section>

      {/* Top Experiences */}
      <section id="experiences" className="landing-section">
        <div className="landing-section-header">
          <div className="landing-section-tag">Must-See & Must-Do</div>
          <h2 className="landing-section-title">{c.guideTitle}</h2>
          <p className="landing-section-desc">{c.guideDesc}</p>
        </div>
        <div className="landing-features-grid">
          {c.experiences.map((exp, i) => (
            <div key={i} className="landing-feature-card">
              <span className="landing-feature-icon">{exp.icon}</span>
              <h3>{exp.title}</h3>
              <p>{exp.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Real Firestore Places Grid */}
      {displayPlaces.length > 0 && (
        <section className="landing-section" style={{ paddingTop: 0 }}>
          <div className="landing-section-header">
            <div className="landing-section-tag">Discover Sights</div>
            <h2 className="landing-section-title">{c.placesTitle}</h2>
            <p className="landing-section-desc">{c.placesDesc}</p>
          </div>
          <div className="landing-tours-grid">
            {displayPlaces.map((place) => {
              const title = asLocalizedText(place.title, lang) || asLocalizedText(place.title, "en") || place.title;
              const desc = asLocalizedText(place.desc, lang) || asLocalizedText(place.desc, "en") || place.desc;

              return (
                <Link key={place.id} href={getLocalizedHref(`/places/${place.id}`, lang)} className="landing-tour-card">
                  <div className="landing-tour-img-wrap">
                    <Image
                      src={place.img || "/tbilisi.webp"}
                      alt={title}
                      fill
                      sizes="(max-width: 768px) 100vw, 380px"
                      className="landing-tour-img"
                    />
                  </div>
                  <div className="landing-tour-body">
                    <h3 className="landing-tour-title">{title}</h3>
                    <p className="landing-tour-desc">{desc}</p>
                    <div className="landing-tour-footer">
                      <span>📍 {place.region || "Adjara, Georgia"}</span>
                      <span className="landing-tour-cta">{c.viewPlace} →</span>
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
          <div className="landing-section-tag">Batumi FAQ</div>
          <h2 className="landing-section-title">Common Travel Questions</h2>
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
          <h2>Need a Guided Tour or Local Driver in Batumi?</h2>
          <p>Explore all the hidden gems of Adjara with our experienced local team.</p>
          <Link href={getLocalizedHref("/tours-from-batumi", lang)} className="landing-btn-primary">
            🚗 View All Day Tours from Batumi
          </Link>
        </div>
      </section>
    </div>
  );
}
