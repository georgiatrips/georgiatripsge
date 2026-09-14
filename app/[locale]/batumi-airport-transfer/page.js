import React from "react";
import Link from "next/link";
import { SITE_URL, getRequestLocale, buildLocalizedMetadata, getLocalizedHref } from "../../lib/siteConfig";
import { WA_LINK, SOCIAL_PROFILES } from "../../lib/shared";
import "../../landing.css";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const lang = getRequestLocale(locale);
  const c = CONTENT[lang] || CONTENT.en;

  return buildLocalizedMetadata({
    path: "/batumi-airport-transfer",
    lang,
    title: `${c.heroTitle} ${c.heroHighlight}`.trim() + " | GeorgiaTrips",
    description: c.heroSubtitle,
    image: "/hero.webp",
  });
}

const CONTENT = {
  en: {
    badge: "24/7 Airport Transfer Service",
    heroTitle: "Private Batumi Airport Transfer (BUS) —",
    heroHighlight: "Fixed Rates & VIP Comfort",
    heroSubtitle: "Pre-book your smooth, private transfer from Batumi International Airport to any hotel, resort, or city in Georgia. Free flight tracking, meet & greet, and transparent fixed pricing.",
    ctaBook: "Book Airport Transfer",
    ctaRates: "View Fixed Rates",
    whyTitle: "Why Choose GeorgiaTrips Airport Transfers?",
    whyDesc: "Avoid taxi airport queues and inflated fares with our reliable private chauffeur service.",
    features: [
      { icon: "✈️", title: "Flight Tracking & Delay Guarantee", desc: "We track your flight in real time. If your flight is delayed, your driver adjusts pickup time at no extra charge." },
      { icon: "👋", title: "Meet & Greet with Name Sign", desc: "Your driver welcomes you inside the arrival terminal holding a personalized name sign and assists with all luggage." },
      { icon: "⏳", title: "60 Mins Free Waiting Time", desc: "Enjoy 60 minutes of complimentary waiting time after your flight touches down to clear customs and baggage claim." },
      { icon: "🏷️", title: "Fixed All-Inclusive Fares", desc: "What you see is what you pay: includes airport parking fees, fuel, tolls, and air-conditioned Mercedes transport." }
    ],
    ratesTitle: "Fixed Rates from Batumi Airport (BUS)",
    ratesDesc: "Transparent pricing per vehicle, not per person. Choose the vehicle class that matches your group.",
    tableHeaders: ["Destination", "Distance / Time", "Sedan (1-3 pax)", "Minivan (4-7 pax)", "VIP Sprinter (8-18)"],
    rates: [
      { dest: "Batumi City Center / Boulevard", dist: "6 km / 12 mins", sedan: "₾35", minivan: "₾60", sprinter: "₾110" },
      { dest: "Gonio & Kvariati Resorts", dist: "10 km / 15 mins", sedan: "₾45", minivan: "₾70", sprinter: "₾120" },
      { dest: "Sarpi (Turkish Border)", dist: "15 km / 20 mins", sedan: "₾55", minivan: "₾85", sprinter: "₾140" },
      { dest: "Kobuleti & Tsikhisdziri", dist: "32 km / 35 mins", sedan: "₾65", minivan: "₾100", sprinter: "₾160" },
      { dest: "Shekvetili & Ureki (Magnetic Sands)", dist: "48 km / 45 mins", sedan: "₾85", minivan: "₾130", sprinter: "₾190" },
      { dest: "Kutaisi Airport / City (KUT)", dist: "145 km / 2 hrs", sedan: "₾180", minivan: "₾260", sprinter: "₾390" },
      { dest: "Tbilisi City Center", dist: "375 km / 5.5 hrs", sedan: "₾390", minivan: "₾550", sprinter: "₾850" }
    ],
    faqs: [
      { q: "Where will I meet my driver at Batumi Airport?", a: "Your driver will be waiting in the arrival hall immediately after baggage claim, holding a greeting sign with your name clearly displayed." },
      { q: "What happens if my flight is delayed?", a: "We monitor all incoming flights via live flight tracking radar. Your pickup time will automatically update, and there are no extra fees for delayed flights." },
      { q: "How do I pay for my transfer?", a: "You can pay your driver upon arrival in cash (GEL, USD, EUR) or complete payment online securely." }
    ]
  },
  ru: {
    badge: "Круглосуточный трансфер 24/7",
    heroTitle: "Трансфер из аэропорта Батуми (BUS) —",
    heroHighlight: "Фиксированные цены и VIP комфорт",
    heroSubtitle: "Надежный индивидуальный трансфер из международного аэропорта Батуми в любой отель или город Грузии. Встреча с табличкой, отслеживание рейса и чистые авто Mercedes.",
    ctaBook: "Заказать трансфер",
    ctaRates: "Тарифы на трансфер",
    whyTitle: "Преимущества нашего трансфера",
    whyDesc: "Забудьте о спорах с местными таксистами в аэропорту — встречайте Грузию с комфортом.",
    features: [
      { icon: "✈️", title: "Отслеживание рейса", desc: "Мы следим за вашим рейсом в реальном времени. В случае задержки самолета ожидание бесплатно." },
      { icon: "👋", title: "Встреча в зале прилета с табличкой", desc: "Водитель встретит вас с персональной табличкой с вашим именем и поможет донести багаж." },
      { icon: "⏳", title: "60 минут бесплатного ожидания", desc: "В стоимость включен 1 час бесплатного ожидания после фактической посадки самолета." },
      { icon: "🏷️", title: "Фиксированная стоимость", desc: "Цена за машину окончательная: включает парковку в аэропорту, топливо и кондиционер." }
    ],
    ratesTitle: "Фиксированные тарифы из аэропорта Батуми (BUS)",
    ratesDesc: "Цена указана за весь автомобиль, а не за человека.",
    tableHeaders: ["Направление", "Расстояние / Время", "Седан (1-3 чел)", "Минивэн (4-7 чел)", "Спринтер (8-18)"],
    rates: [
      { dest: "Центр Батуми / Бульвар", dist: "6 км / 12 мин", sedan: "₾35", minivan: "₾60", sprinter: "₾110" },
      { dest: "Курорты Гонио и Квариати", dist: "10 км / 15 мин", sedan: "₾45", minivan: "₾70", sprinter: "₾120" },
      { dest: "Сарпи (Граница с Турцией)", dist: "15 км / 20 мин", sedan: "₾55", minivan: "₾85", sprinter: "₾140" },
      { dest: "Кобулети и Цихисдзири", dist: "32 км / 35 мин", sedan: "₾65", minivan: "₾100", sprinter: "₾160" },
      { dest: "Шекветили и Уреки", dist: "48 км / 45 мин", sedan: "₾85", minivan: "₾130", sprinter: "₾190" },
      { dest: "Аэропорт / город Кутаиси (KUT)", dist: "145 км / 2 ч", sedan: "₾180", minivan: "₾260", sprinter: "₾390" },
      { dest: "Центр Тбилиси", dist: "375 км / 5.5 ч", sedan: "₾390", minivan: "₾550", sprinter: "₾850" }
    ],
    faqs: [
      { q: "Где именно меня встретит водитель?", a: "Водитель будет ожидать вас прямо на выходе из зоны получения багажа с табличкой с вашим именем." },
      { q: "Что делать, если рейс задерживается?", a: "Мы отслеживаем статус рейса онлайн и подаем автомобиль точно к вашему прилету без доплат." },
      { q: "Как оплатить поездку?", a: "Оплатить можно наличными водителю (лари, доллары, евро) или картой онлайн." }
    ]
  },
  ka: {
    badge: "24/7 აეროპორტის ტრანსფერი",
    heroTitle: "ბათუმის აეროპორტის ტრანსფერი (BUS) —",
    heroHighlight: "ფიქსირებული ფასი და VIP სერვისი",
    heroSubtitle: "კომფორტული და უსაფრთხო ტრანსფერი ბათუმის საერთაშორისო აეროპორტიდან სასტუმრომდე. ფრენის თვალყურისდევნება, დახვედრა სახელით და ფიქსირებული ტარიფები.",
    ctaBook: "ტრანსფერის დაჯავშნა",
    ctaRates: "ტარიფების ნახვა",
    whyTitle: "რატომ უნდა აირჩიოთ ჩვენი ტრანსფერი?",
    whyDesc: "უმაღლესი კომფორტი და გარანტირებული მომსახურება ყოველგვარი გაუთვალისწინებელი ხარჯების გარეშე.",
    features: [
      { icon: "✈️", title: "ფრენის თვალყურისდევნება", desc: "ჩვენ ონლაინ რეჟიმში ვაკვირდებით ფრენას და რეისის დაგვიანების შემთხვევაშიც დაგხვდებით დროულად." },
      { icon: "👋", title: "დახვედრა წარწერით", desc: "მძღოლი დაგხვდებათ ჩამოფრენის დარბაზში პერსონალური სახელით და დაგეხმარებათ ბარგის დაბინავებაში." },
      { icon: "⏳", title: "60 წუთი უფასო ლოდინი", desc: "თვითმფრინავის დაჯდომიდან 1 საათი უფასო ლოდინის დრო საპასპორტო კონტროლის გასავლელად." },
      { icon: "🏷️", title: "ფიქსირებული ფასი", desc: "ფასი მოიცავს პარკინგს, საწვავსა და სრულ კომფორტს." }
    ],
    ratesTitle: "ფიქსირებული ტარიფები ბათუმის აეროპორტიდან",
    ratesDesc: "ფასი მოცემულია მთლიან ავტომობილზე.",
    tableHeaders: ["მიმართულება", "მანძილი / დრო", "სედანი (1-3 მგზ)", "მინივენი (4-7 მგზ)", "სპრინტერი (8-18)"],
    rates: [
      { dest: "ბათუმის ცენტრი / ბულვარი", dist: "6 კმ / 12 წთ", sedan: "₾35", minivan: "₾60", sprinter: "₾110" },
      { dest: "გონიო და კვარიათი", dist: "10 კმ / 15 წთ", sedan: "₾45", minivan: "₾70", sprinter: "₾120" },
      { dest: "სარფი (საზღვარი)", dist: "15 კმ / 20 წთ", sedan: "₾55", minivan: "₾85", sprinter: "₾140" },
      { dest: "ქობულეთი და ციხისძირი", dist: "32 კმ / 35 წთ", sedan: "₾65", minivan: "₾100", sprinter: "₾160" },
      { dest: "შეკვეთილი და ურეკი", dist: "48 კმ / 45 წთ", sedan: "₾85", minivan: "₾130", sprinter: "₾190" },
      { dest: "ქუთაისის აეროპორტი / ქალაქი", dist: "145 კმ / 2 სთ", sedan: "₾180", minivan: "₾260", sprinter: "₾390" },
      { dest: "თბილისის ცენტრი", dist: "375 კმ / 5.5 სთ", sedan: "₾390", minivan: "₾550", sprinter: "₾850" }
    ],
    faqs: [
      { q: "სად დამხვდება მძღოლი?", a: "მძღოლი დაგხვდებათ ჩამოფრენის დარბაზში, ბარგის მიღების შემდეგ, თქვენი სახელის წარწერით." },
      { q: "რა ხდება ფრენის გადადების შემთხვევაში?", a: "ჩვენ ვამოწმებთ ფრენის სტატუსს და მძღოლი მოვა ზუსტად განახლებულ დროს, დამატებითი გადასახადის გარეშე." },
      { q: "როგორ ხდება გადახდა?", a: "გადახდა შეგიძლიათ განახორციელოთ ჩასვლისას ნაღდი ფულით ან ონლაინ ბარათით." }
    ]
  }
};

export default async function BatumiAirportTransferPage({ params }) {
  const { locale } = await params;
  const lang = getRequestLocale(locale);
  const c = CONTENT[lang] || CONTENT.en;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["TaxiService", "Service"],
        "@id": `${SITE_URL}/${lang}/batumi-airport-transfer#service`,
        "name": c.heroTitle + " " + c.heroHighlight,
        "description": c.heroSubtitle,
        "url": `${SITE_URL}/${lang}/batumi-airport-transfer`,
        "inLanguage": lang,
        "provider": {
          "@type": "TravelAgency",
          "name": "GeorgiaTrips",
          "url": SITE_URL,
          "telephone": "+995504220020",
          "sameAs": SOCIAL_PROFILES,
        },
        "areaServed": [
          { "@type": "Airport", "name": "Batumi International Airport (BUS)" },
          { "@type": "City", "name": "Batumi" },
          { "@type": "City", "name": "Gonio" },
          { "@type": "City", "name": "Kobuleti" },
          { "@type": "City", "name": "Kutaisi" },
          { "@type": "City", "name": "Tbilisi" }
        ],
        "offers": {
          "@type": "AggregateOffer",
          "lowPrice": 35,
          "highPrice": 850,
          "priceCurrency": "GEL"
        }
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/${lang}/batumi-airport-transfer#faq`,
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
        "@id": `${SITE_URL}/${lang}/batumi-airport-transfer#breadcrumbs`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": lang === "ka" ? "მთავარი" : (lang === "ru" ? "Главная" : "Home"), "item": `${SITE_URL}/${lang}` },
          { "@type": "ListItem", "position": 2, "name": lang === "ka" ? "ბათუმის აეროპორტის ტრანსფერი" : (lang === "ru" ? "Трансфер аэропорт Батуми" : "Batumi Airport Transfer"), "item": `${SITE_URL}/${lang}/batumi-airport-transfer` }
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
          <div className="landing-badge">✈️ {c.badge}</div>
          <h1 className="landing-title">
            {c.heroTitle} <span>{c.heroHighlight}</span>
          </h1>
          <p className="landing-subtitle">{c.heroSubtitle}</p>
          <div className="landing-hero-actions">
            <a href="#rates-table" className="landing-btn-primary">
              📊 {c.ctaRates}
            </a>
            <a href={`${WA_LINK}?text=${encodeURIComponent(`Hello! I would like to book a private Batumi airport transfer.`)}`} target="_blank" rel="noopener noreferrer" className="landing-btn-secondary">
              💬 {c.ctaBook} on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="landing-section">
        <div className="landing-section-header">
          <div className="landing-section-tag">Reliable Chauffeur Service</div>
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

      {/* Fixed Rates Table */}
      <section id="rates-table" className="landing-section" style={{ paddingTop: 0 }}>
        <div className="landing-section-header">
          <div className="landing-section-tag">Transparent Pricing</div>
          <h2 className="landing-section-title">{c.ratesTitle}</h2>
          <p className="landing-section-desc">{c.ratesDesc}</p>
        </div>

        <div className="landing-table-wrap">
          <table className="landing-table">
            <thead>
              <tr>
                {c.tableHeaders.map((th, i) => (
                  <th key={i}>{th}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {c.rates.map((row, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 700, color: "#ffffff" }}>📍 {row.dest}</td>
                  <td style={{ color: "#94a3b8" }}>{row.dist}</td>
                  <td className="price-val">{row.sedan}</td>
                  <td className="price-val">{row.minivan}</td>
                  <td className="price-val">{row.sprinter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="landing-section" style={{ paddingTop: 0 }}>
        <div className="landing-section-header">
          <div className="landing-section-tag">Airport Transfer FAQ</div>
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
          <h2>Book Your Batumi Airport Ride in Seconds</h2>
          <p>Send us your flight number and hotel destination for instant confirmation and dedicated driver assignment.</p>
          <a href={`${WA_LINK}?text=${encodeURIComponent(`Hello! I want to book a transfer from Batumi Airport.`)}`} target="_blank" rel="noopener noreferrer" className="landing-btn-primary">
            💬 Book on WhatsApp with Flight Details
          </a>
        </div>
      </section>
    </div>
  );
}
