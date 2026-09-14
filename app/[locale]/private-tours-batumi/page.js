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
    path: "/private-tours-batumi",
    lang,
    title: `${c.heroTitle} ${c.heroHighlight || ""}`.trim() + " | GeorgiaTrips",
    description: c.heroSubtitle,
    image: "/hero.webp",
  });
}

const CONTENT = {
  en: {
    badge: "Exclusive VIP Experience",
    heroTitle: "Private Tours in Batumi with",
    heroHighlight: "Personal Driver & Guide",
    heroSubtitle: "Enjoy total flexibility and comfort on custom private day trips across Georgia. Travel at your own pace in modern Mercedes vehicles with professional local guides.",
    ctaExplore: "View Private Tours",
    ctaCustom: "Request Custom Route",
    benefitsTitle: "The Private Tour Advantage",
    benefitsDesc: "No crowded tour buses, no rushing, and no fixed timelines. Your day, your rules.",
    features: [
      { icon: "✨", title: "100% Flexible Schedule", desc: "Start whenever you want, stop for photos anywhere, and spend as much time as you like at each viewpoint." },
      { icon: "🚐", title: "Mercedes VIP Fleet", desc: "Travel in pristine air-conditioned Mercedes V-Class, Vito, or Sprinter with panoramic windows and complimentary Wi-Fi & water." },
      { icon: "👨‍💼", title: "Dedicated Local Expert", desc: "Private driver and guide dedicated solely to your group, sharing fascinating history and local gastronomy tips." },
      { icon: "🏨", title: "Door-to-Door Service", desc: "Complimentary pickup directly from your hotel lobby, apartment, or Batumi International Airport." }
    ],
    fleetTitle: "Our Premium Vehicle Fleet",
    fleetDesc: "Maintained to the highest safety and comfort standards for smooth mountain traveling.",
    fleet: [
      { icon: "🚗", name: "Executive Sedan", cap: "1 - 3 Passengers", desc: "Ideal for couples and solo travelers looking for refined comfort and agility on mountain roads." },
      { icon: "🚐", name: "Mercedes-Benz Vito / V-Class", cap: "4 - 7 Passengers", desc: "Spacious luxury minivan with leather seating, climate control, and large luggage capacity." },
      { icon: "🚌", name: "Mercedes Sprinter VIP", cap: "8 - 18 Passengers", desc: "High-capacity luxury minibus for family reunions, corporate retreats, and group travels." }
    ],
    toursTitle: "Featured Private Itineraries from Batumi",
    toursDesc: "All tours below include private vehicle, personal driver/guide, fuel, and hotel pickup.",
    viewTour: "Reserve Private Tour",
    faqs: [
      { q: "What is included in a private tour from Batumi?", a: "Private vehicle dedicated exclusively to your group, professional driver/guide, fuel, parking fees, hotel pickup/drop-off, and bottled spring water." },
      { q: "Can we customize the stops and timing?", a: "Absolutely! We can add wine tastings, scenic restaurant stops, or adjust start/return times according to your preferences." },
      { q: "How are private tour prices calculated?", a: "We offer fixed, transparent vehicle pricing with no hidden charges or surprise fuel surcharges." }
    ]
  },
  ru: {
    badge: "Премиум VIP сервис",
    heroTitle: "Индивидуальные туры в Батуми с",
    heroHighlight: "Личным водителем и гидом",
    heroSubtitle: "Путешествуйте по Грузии в своем ритме на комфортабельных автомобилях Mercedes. Индивидуальный маршрут, остановки в лучших видовых местах и забота о вас.",
    ctaExplore: "Выбрать частный тур",
    ctaCustom: "Заказать свой маршрут",
    benefitsTitle: "Преимущества индивидуальных экскурсий",
    benefitsDesc: "Никаких больших автобусов и спешки. Только вы, ваши близкие и потрясающие виды Грузии.",
    features: [
      { icon: "✨", title: "100% Гибкий график", desc: "Начинайте в удобное время, останавливайтесь для фото в любых местах и гуляйте сколько захотите." },
      { icon: "🚐", title: "Автопарк Mercedes VIP", desc: "Ухоженные минивэны Mercedes Vito, V-Class и Sprinter с кондиционером, Wi-Fi и панорамными окнами." },
      { icon: "👨‍💼", title: "Персональный гид", desc: "Внимательный водитель-гид, который покажет лучшие нетуристические места и вкусные рестораны." },
      { icon: "🏨", title: "От двери до двери", desc: "Встреча у входа в ваш отель или апартаменты в Батуми и окрестностях." }
    ],
    fleetTitle: "Наш автопарк",
    fleetDesc: "Безупречная чистота, безопасность и максимальный комфорт в каждой поездке.",
    fleet: [
      { icon: "🚗", name: "Комфортный седан", cap: "1 - 3 Пассажира", desc: "Идеально для пар и индивидуальных путешественников." },
      { icon: "🚐", name: "Mercedes-Benz Vito / V-Class", cap: "4 - 7 Пассажиров", desc: "Просторный минивэн с кожаным салоном и раздельным климат-контролем." },
      { icon: "🚌", name: "Mercedes Sprinter VIP", cap: "8 - 18 Пассажиров", desc: "Премиальный микроавтобус для больших семей и дружеских компаний." }
    ],
    toursTitle: "Рекомендуемые индивидуальные туры",
    toursDesc: "Все программы включают индивидуальный трансфер, личного гида и все дорожные расходы.",
    viewTour: "Забронировать тур",
    faqs: [
      { q: "Что входит в стоимость частного тура?", a: "Автомобиль только для вашей компании, опытный водитель-гид, топливо, все дорожные сборы, встреча у отеля и питьевая вода." },
      { q: "Можно ли скорректировать маршрут по ходу поездки?", a: "Да! Вы можете добавить остановку на обед в колоритном ресторане или изменить время пребывания на локациях." },
      { q: "Как формируется цена?", a: "Цена фиксируется за автомобиль целиком и не меняется." }
    ]
  },
  ka: {
    badge: "VIP ინდივიდუალური სერვისი",
    heroTitle: "ინდივიდუალური ტურები ბათუმში",
    heroHighlight: "პირადი მძღოლითა და გიდით",
    heroSubtitle: "სრული თავისუფლება და კომფორტი პერსონალიზებულ ტურებში Mercedes-ის VIP ავტომობილებით მთელი საქართველოს მასშტაბით.",
    ctaExplore: "ტურების ნახვა",
    ctaCustom: "მარშრუტის შედგენა",
    benefitsTitle: "ინდივიდუალური ტურის უპირატესობები",
    benefitsDesc: "მოგზაურობა თქვენი ტემპით, შეზღუდვებისა და ზედმეტი აჩქარების გარეშე.",
    features: [
      { icon: "✨", title: "მოქნილი გრაფიკი", desc: "გადით სასურველ დროს, გაჩერდით ულამაზეს ხედებთან და ისიამოვნეთ დასვენებით." },
      { icon: "🚐", title: "Mercedes VIP ავტოპარკი", desc: "პრემიუმ კლასის მინივენები და მიკროავტობუსები მაქსიმალური კომფორტით." },
      { icon: "👨‍💼", title: "პირადი მძღოლი-გიდი", desc: "პროფესიონალი მძღოლი და გიდი მხოლოდ თქვენი ჯგუფისთვის." },
      { icon: "🏨", title: "სასტუმროდან გაყვანა", desc: "დახვედრა და გაცილება თქვენი საცხოვრებელი ადგილიდან." }
    ],
    fleetTitle: "ჩვენი ავტოპარკი",
    fleetDesc: "უსაფრთხოების უმაღლესი სტანდარტი და კომფორტი.",
    fleet: [
      { icon: "🚗", name: "პრემიუმ სედანი", cap: "1 - 3 მგზავრი", desc: "იდეალურია წყვილებისთვის და მცირე ჯგუფებისთვის." },
      { icon: "🚐", name: "Mercedes-Benz Vito / V-Class", cap: "4 - 7 მგზავრი", desc: "ფართო VIP მინივენი ტყავის სალონითა და კონდიცირებით." },
      { icon: "🚌", name: "Mercedes Sprinter VIP", cap: "8 - 18 მგზავრი", desc: "კომფორტული მიკროავტობუსი დიდი ჯგუფებისთვის." }
    ],
    toursTitle: "რჩეული ინდივიდუალური ტურები",
    toursDesc: "ყველა ტური მოიცავს ტრანსპორტს, საწვავს, მძღოლს და სასტუმროდან მომსახურებას.",
    viewTour: "ტურის დაჯავშნა",
    faqs: [
      { q: "რა შედის ინდივიდუალური ტურის ფასში?", a: "მომსახურებაში შედის კომფორტული ავტომობილი, მძღოლი, საწვავი, სასტუმროდან გაყვანა და წყალი." },
      { q: "შესაძლებელია მარშრუტის შეცვლა?", a: "რა თქმა უნდა! პროგრამა სრულად მოერგება თქვენს ინტერესებს." },
      { q: "როგორ ხდება ანგარიშსწორება?", a: "ფასი ფიქსირებულია და ანგარიშსწორება ხდება ტურის დღეს." }
    ]
  }
};

export default async function PrivateToursBatumiPage({ params }) {
  const [rawTours, { locale }] = await Promise.all([getCachedTours(), params]);
  const lang = getRequestLocale(locale);
  const tours = serializeForClient(rawTours) || [];
  const c = CONTENT[lang] || CONTENT.en;

  const displayTours = tours.slice(0, 6);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        "@id": `${SITE_URL}/${lang}/private-tours-batumi#itemlist`,
        "name": c.toursTitle,
        "itemListElement": displayTours.map((t, idx) => ({
          "@type": "ListItem",
          "position": idx + 1,
          "item": {
            "@type": "TouristTrip",
            "name": `[Private VIP] ${asLocalizedText(t.title, lang) || asLocalizedText(t.title, "en")}`,
            "description": asLocalizedText(t.desc, lang) || asLocalizedText(t.desc, "en"),
            "image": t.img || `${SITE_URL}/hero.webp`,
            "url": `${SITE_URL}/${lang}/tours/${encodeURIComponent(t.id)}`,
          }
        }))
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/${lang}/private-tours-batumi#faq`,
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
        "@id": `${SITE_URL}/${lang}/private-tours-batumi#breadcrumbs`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": lang === "ka" ? "მთავარი" : (lang === "ru" ? "Главная" : "Home"), "item": `${SITE_URL}/${lang}` },
          { "@type": "ListItem", "position": 2, "name": lang === "ka" ? "ინდივიდუალური ტურები" : (lang === "ru" ? "Индивидуальные туры" : "Private Tours Batumi"), "item": `${SITE_URL}/${lang}/private-tours-batumi` }
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
          <div className="landing-badge">👑 {c.badge}</div>
          <h1 className="landing-title">
            {c.heroTitle} <span>{c.heroHighlight}</span>
          </h1>
          <p className="landing-subtitle">{c.heroSubtitle}</p>
          <div className="landing-hero-actions">
            <a href="#private-tours-list" className="landing-btn-primary">
              ⭐ {c.ctaExplore}
            </a>
            <a href={`${WA_LINK}?text=${encodeURIComponent(`Hello! I want to plan a custom private tour from Batumi.`)}`} target="_blank" rel="noopener noreferrer" className="landing-btn-secondary">
              ✏️ {c.ctaCustom}
            </a>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="landing-section">
        <div className="landing-section-header">
          <div className="landing-section-tag">VIP Benefits</div>
          <h2 className="landing-section-title">{c.benefitsTitle}</h2>
          <p className="landing-section-desc">{c.benefitsDesc}</p>
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

      {/* Fleet Showcase */}
      <section className="landing-section" style={{ paddingTop: 0 }}>
        <div className="landing-section-header">
          <div className="landing-section-tag">Comfort & Safety</div>
          <h2 className="landing-section-title">{c.fleetTitle}</h2>
          <p className="landing-section-desc">{c.fleetDesc}</p>
        </div>
        <div className="landing-features-grid">
          {c.fleet.map((v, i) => (
            <div key={i} className="landing-feature-card" style={{ background: "rgba(13, 35, 58, 0.8)", borderColor: "rgba(245, 158, 11, 0.25)" }}>
              <span className="landing-feature-icon">{v.icon}</span>
              <div style={{ color: "#f59e0b", fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.25rem" }}>{v.cap}</div>
              <h3>{v.name}</h3>
              <p>{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Private Tours Grid */}
      <section id="private-tours-list" className="landing-section" style={{ paddingTop: 0 }}>
        <div className="landing-section-header">
          <div className="landing-section-tag">Handcrafted Packages</div>
          <h2 className="landing-section-title">{c.toursTitle}</h2>
          <p className="landing-section-desc">{c.toursDesc}</p>
        </div>
        <div className="landing-tours-grid">
          {displayTours.map((tour) => {
            const title = asLocalizedText(tour.title, lang) || asLocalizedText(tour.title, "en") || tour.title;
            const desc = asLocalizedText(tour.desc, lang) || asLocalizedText(tour.desc, "en") || tour.desc;
            const price = tour.pricePrivate || tour.price || 180;

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
                  <div className="landing-tour-price-badge">₾{price} / group</div>
                </div>
                <div className="landing-tour-body">
                  <h3 className="landing-tour-title">{title}</h3>
                  <p className="landing-tour-desc">{desc}</p>
                  <div className="landing-tour-footer">
                    <span>👑 Private VIP</span>
                    <span className="landing-tour-cta">{c.viewTour} →</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="landing-section" style={{ paddingTop: 0 }}>
        <div className="landing-section-header">
          <div className="landing-section-tag">Q&A</div>
          <h2 className="landing-section-title">Private Tour Questions</h2>
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
          <h2>Design Your Custom Batumi Adventure</h2>
          <p>Tell us what you want to see, and our team will craft a personalized private itinerary in minutes.</p>
          <a href={`${WA_LINK}?text=${encodeURIComponent(`Hello! I would like to arrange a private Mercedes tour from Batumi.`)}`} target="_blank" rel="noopener noreferrer" className="landing-btn-primary">
            💬 Plan with Our Travel Expert
          </a>
        </div>
      </section>
    </div>
  );
}
