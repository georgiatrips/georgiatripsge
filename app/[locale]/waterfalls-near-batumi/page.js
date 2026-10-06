import React from "react";
import Link from "next/link";
import Image from "next/image";
import LandingShell from "../../components/site/LandingShell";
import TourGrid from "../../components/site/TourGrid";
import { getCachedTours, getCachedPlaces } from "../../lib/server/cachedData";
import { asLocalizedText } from "../../lib/toursFirestore";
import { toTourViews } from "../../lib/tourView";
import { getTranslator } from "../../lib/i18n/translate";
import { SITE_URL, getRequestLocale, buildLocalizedMetadata, getLocalizedHref } from "../../lib/siteConfig";
import { placePath, tourPath } from "../../lib/slugs";
import { formatRegionName } from "../../lib/placesMeta";
import { whatsappHref } from "../../lib/shared";
import { landingUi } from "../../lib/landingUi";
import "../../styles/tour-card.css";

const PATH = "/waterfalls-near-batumi";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const lang = getRequestLocale(locale);
  const c = CONTENT[lang] || CONTENT.en;

  return buildLocalizedMetadata({
    path: PATH,
    lang,
    title: c.metaTitle,
    description: c.metaDescription,
    image: "/adjara.jpg",
  });
}

// The waterfall list itself comes from the site's places (the ones the team
// actually visits), so names and photos match the place pages they link to.
const CONTENT = {
  en: {
    metaTitle: "Waterfalls near Batumi: Makhuntseti & Mountain Adjara Guide | GeorgiaTrips",
    metaDescription: "The waterfalls of mountain Adjara near Batumi — Makhuntseti and the Machakhela gorge — with photos, practical tips and day tours with hotel pickup in Batumi.",
    badge: "Adjara nature guide",
    crumb: "Waterfalls near Batumi",
    heroTitle: "Waterfalls near",
    heroHighlight: "Batumi",
    heroSubtitle: "Less than an hour from the beach, the gorges of mountain Adjara hide waterfalls, arched stone bridges and green forest. These are the ones on our routes.",
    ctaTours: "Waterfall tours",
    ctaInquire: "Ask on WhatsApp",
    waText: "Hello! I'd like a tour to the waterfalls near Batumi.",
    listTitle: "Waterfalls on our routes",
    listDesc: "Open a waterfall for photos, how to get there and the tours that stop there.",
    open: "Open",
    toursTitle: "Day tours to the waterfalls",
    toursDesc: "Hotel pickup in Batumi; pay on the day.",
    tipsTitle: "Before you go",
    tips: [
      { q: "When is the best season?", a: "Spring and early summer, after snowmelt and rain, when the falls carry the most water. In summer the shade and cool water are the reason to go." },
      { q: "What should I wear?", a: "Shoes with grip — the rocks near the water are wet and slippery — and a light jacket for the mountains." },
    ],
    faqs: [
      { q: "Which waterfall is closest to Batumi?", a: "Makhuntseti waterfall, in the Adjaristskali valley on the road to mountain Adjara, is the best known and the easiest to reach from Batumi — a short walk from the road, next to the medieval arched bridge." },
      { q: "How do I get to the waterfalls from Batumi?", a: "By car or on a tour. Our day tours pick you up at your hotel and combine the waterfalls with the arched stone bridges and villages of the same gorges." },
      { q: "Can you swim at the waterfalls?", a: "Some visitors wade in summer, but the water is cold and the rocks are slippery. Stay out of the water after heavy rain." },
    ],
    ctaTitle: "See the waterfalls without driving",
    ctaText: "Tell us your dates and how many of you there are, and we'll suggest the best route.",
  },
  ru: {
    metaTitle: "Водопады возле Батуми: Махунцети и горная Аджария | GeorgiaTrips",
    metaDescription: "Водопады горной Аджарии рядом с Батуми — Махунцети и ущелье Мачахела — с фото, практическими советами и экскурсиями с трансфером от отеля.",
    badge: "Природа Аджарии",
    crumb: "Водопады возле Батуми",
    heroTitle: "Водопады возле",
    heroHighlight: "Батуми",
    heroSubtitle: "Меньше чем в часе от пляжа ущелья горной Аджарии скрывают водопады, арочные каменные мосты и зелёный лес. Вот те, что есть в наших маршрутах.",
    ctaTours: "Туры к водопадам",
    ctaInquire: "Спросить в WhatsApp",
    waText: "Здравствуйте! Хочу экскурсию к водопадам возле Батуми.",
    listTitle: "Водопады в наших маршрутах",
    listDesc: "Откройте водопад, чтобы увидеть фото, как добраться и туры, которые туда заезжают.",
    open: "Открыть",
    toursTitle: "Экскурсии к водопадам",
    toursDesc: "Заберём от отеля в Батуми; оплата в день тура.",
    tipsTitle: "Перед поездкой",
    tips: [
      { q: "Когда лучше ехать?", a: "Весной и в начале лета, после таяния снега и дождей, воды больше всего. Летом сюда едут за тенью и прохладой." },
      { q: "Что надеть?", a: "Обувь с хорошей подошвой — камни у воды мокрые и скользкие — и лёгкую куртку для гор." },
    ],
    faqs: [
      { q: "Какой водопад ближе всего к Батуми?", a: "Водопад Махунцети в долине Аджарисцкали по дороге в горную Аджарию — самый известный и доступный из Батуми: пара минут пешком от дороги, рядом со средневековым арочным мостом." },
      { q: "Как добраться до водопадов из Батуми?", a: "На машине или с экскурсией. Наши туры забирают от отеля и совмещают водопады с арочными мостами и сёлами тех же ущелий." },
      { q: "Можно ли купаться у водопадов?", a: "Летом некоторые заходят в воду, но она холодная, а камни скользкие. После сильных дождей в воду лучше не заходить." },
    ],
    ctaTitle: "Водопады без руля",
    ctaText: "Напишите даты и сколько вас — предложим лучший маршрут.",
  },
  ka: {
    metaTitle: "ჩანჩქერები ბათუმთან: მახუნცეთი და მთიანი აჭარა | GeorgiaTrips",
    metaDescription: "მთიანი აჭარის ჩანჩქერები ბათუმთან — მახუნცეთი და მაჭახელას ხეობა — ფოტოებით, პრაქტიკული რჩევებით და ტურებით ბათუმში სასტუმროდან გაყვანით.",
    badge: "აჭარის ბუნება",
    crumb: "ჩანჩქერები ბათუმთან",
    heroTitle: "ჩანჩქერები",
    heroHighlight: "ბათუმთან",
    heroSubtitle: "პლაჟიდან საათზე ნაკლებ მანძილზე მთიანი აჭარის ხეობებში ჩანჩქერები, თაღოვანი ქვის ხიდები და მწვანე ტყეა. აქ ის ჩანჩქერებია, რომლებიც ჩვენს მარშრუტებშია.",
    ctaTours: "ტურები ჩანჩქერებთან",
    ctaInquire: "WhatsApp-ზე კითხვა",
    waText: "გამარჯობა! მინდა ტური ბათუმთან ახლოს ჩანჩქერებზე.",
    listTitle: "ჩანჩქერები ჩვენს მარშრუტებზე",
    listDesc: "გახსენით ჩანჩქერი ფოტოების, მისასვლელი გზისა და იმ ტურების სანახავად, რომლებიც იქ ჩერდება.",
    open: "გახსნა",
    toursTitle: "ტურები ჩანჩქერებთან",
    toursDesc: "გაყვანა სასტუმროდან ბათუმში; გადახდა ტურის დღეს.",
    tipsTitle: "გამგზავრებამდე",
    tips: [
      { q: "როდის ჯობია წასვლა?", a: "გაზაფხულზე და ზაფხულის დასაწყისში, თოვლის დნობისა და წვიმების შემდეგ, ჩანჩქერები ყველაზე უხვწყლიანია. ზაფხულში ჩრდილისა და სიგრილისთვის მიდიან." },
      { q: "რა ჩავიცვა?", a: "კარგი ძირის ფეხსაცმელი — წყალთან ქვები სველი და მოლიპულია — და მსუბუქი ქურთუკი მთისთვის." },
    ],
    faqs: [
      { q: "რომელი ჩანჩქერია ბათუმთან ყველაზე ახლოს?", a: "მახუნცეთის ჩანჩქერი აჭარისწყლის ხეობაში, მთიანი აჭარისკენ მიმავალ გზაზე, ყველაზე ცნობილი და ბათუმიდან ყველაზე ხელმისაწვდომია — გზიდან რამდენიმე წუთის სავალზე, შუასაუკუნეების თაღოვან ხიდთან ახლოს." },
      { q: "როგორ მივიდე ჩანჩქერებთან ბათუმიდან?", a: "მანქანით ან ტურით. ჩვენი ტურები სასტუმროდან გაგიყვანთ და ჩანჩქერებს იმავე ხეობების თაღოვან ხიდებსა და სოფლებთან აერთიანებს." },
      { q: "შეიძლება ჩანჩქერთან ბანაობა?", a: "ზაფხულში ზოგი წყალში შედის, მაგრამ წყალი ცივია და ქვები მოლიპული. ძლიერი წვიმის შემდეგ წყალში შესვლა არ ღირს." },
    ],
    ctaTitle: "ნახეთ ჩანჩქერები საჭის გარეშე",
    ctaText: "მოგვწერეთ თარიღები და რამდენი ხართ — საუკეთესო მარშრუტს შემოგთავაზებთ.",
  },
  tr: {
    metaTitle: "Batum Yakınındaki Şelaleler: Makhuntseti ve Dağlık Acara | GeorgiaTrips",
    metaDescription: "Batum yakınındaki dağlık Acara şelaleleri — Makhuntseti ve Maçahela vadisi — fotoğraflar, pratik ipuçları ve Batum'da otelden alışlı günübirlik turlar.",
    badge: "Acara doğa rehberi",
    crumb: "Batum Yakınındaki Şelaleler",
    heroTitle: "Batum yakınındaki",
    heroHighlight: "şelaleler",
    heroSubtitle: "Plajdan bir saatten az uzaklıkta, dağlık Acara'nın vadilerinde şelaleler, taş kemer köprüler ve yeşil ormanlar saklı. Rotalarımızdakiler burada.",
    ctaTours: "Şelale turları",
    ctaInquire: "WhatsApp'tan sorun",
    waText: "Merhaba! Batum yakınındaki şelalelere bir tur istiyorum.",
    listTitle: "Rotalarımızdaki şelaleler",
    listDesc: "Fotoğraflar, ulaşım ve orada duran turlar için bir şelaleyi açın.",
    open: "Aç",
    toursTitle: "Şelalelere günübirlik turlar",
    toursDesc: "Batum'da otelden alış; ödeme tur günü.",
    tipsTitle: "Gitmeden önce",
    tips: [
      { q: "En iyi mevsim hangisi?", a: "İlkbahar ve yaz başı; kar erimesi ve yağmurlardan sonra şelalelerde en çok su olur. Yazın gölge ve serinlik için gidilir." },
      { q: "Ne giymeliyim?", a: "Tabanı kaymayan ayakkabı — su kenarındaki kayalar ıslak ve kaygandır — ve dağlar için ince bir ceket." },
    ],
    faqs: [
      { q: "Batum'a en yakın şelale hangisi?", a: "Dağlık Acara yolundaki Acaristskali vadisinde bulunan Makhuntseti şelalesi en bilinen ve Batum'dan en kolay ulaşılanıdır — yoldan birkaç dakika yürüme mesafesinde, ortaçağdan kalma kemer köprünün yanında." },
      { q: "Batum'dan şelalelere nasıl gidilir?", a: "Araçla veya turla. Günübirlik turlarımız sizi otelden alır ve şelaleleri aynı vadilerdeki kemer köprüler ve köylerle birleştirir." },
      { q: "Şelalelerde yüzülebilir mi?", a: "Yazın bazı ziyaretçiler suya girer, ancak su soğuk ve kayalar kaygandır. Şiddetli yağmurdan sonra suya girmeyin." },
    ],
    ctaTitle: "Şelaleleri direksiyon başına geçmeden görün",
    ctaText: "Tarihlerinizi ve kaç kişi olduğunuzu yazın; size en iyi rotayı önerelim.",
  },
  ar: {
    metaTitle: "شلالات قرب باتومي: ماخونتسيتي وأجاريا الجبلية | GeorgiaTrips",
    metaDescription: "شلالات أجاريا الجبلية قرب باتومي — ماخونتسيتي ووادي ماتشاخيلا — مع الصور والنصائح العملية وجولات يومية مع الاستلام من الفندق في باتومي.",
    badge: "دليل طبيعة أجاريا",
    crumb: "شلالات قرب باتومي",
    heroTitle: "شلالات قرب",
    heroHighlight: "باتومي",
    heroSubtitle: "على بعد أقل من ساعة من الشاطئ، تخفي أودية أجاريا الجبلية شلالات وجسوراً حجرية مقوسة وغابات خضراء. هذه هي الشلالات الموجودة في مساراتنا.",
    ctaTours: "جولات الشلالات",
    ctaInquire: "اسألنا عبر واتساب",
    waText: "مرحباً! أود جولة إلى الشلالات القريبة من باتومي.",
    listTitle: "الشلالات في مساراتنا",
    listDesc: "افتح أي شلال لرؤية الصور وطريق الوصول والجولات التي تتوقف عنده.",
    open: "فتح",
    toursTitle: "جولات يومية إلى الشلالات",
    toursDesc: "الاستلام من الفندق في باتومي؛ والدفع يوم الجولة.",
    tipsTitle: "قبل أن تذهب",
    tips: [
      { q: "ما أفضل موسم؟", a: "الربيع وبداية الصيف بعد ذوبان الثلوج والأمطار، حين تكون الشلالات في أغزر حالاتها. وفي الصيف يقصدها الناس للظل والبرودة." },
      { q: "ماذا أرتدي؟", a: "حذاء غير زلق — فالصخور قرب الماء مبللة وزلقة — وسترة خفيفة للجبال." },
    ],
    faqs: [
      { q: "ما أقرب شلال إلى باتومي؟", a: "شلال ماخونتسيتي في وادي أجاريستسكالي على طريق أجاريا الجبلية هو الأشهر والأسهل وصولاً من باتومي — على بعد دقائق سيراً من الطريق، بجوار الجسر المقوس من العصور الوسطى." },
      { q: "كيف أصل إلى الشلالات من باتومي؟", a: "بالسيارة أو مع جولة. تستلمك جولاتنا اليومية من الفندق وتجمع بين الشلالات والجسور الحجرية المقوسة وقرى الأودية نفسها." },
      { q: "هل يمكن السباحة عند الشلالات؟", a: "يدخل بعض الزوار الماء صيفاً، لكن الماء بارد والصخور زلقة. تجنّب دخول الماء بعد الأمطار الغزيرة." },
    ],
    ctaTitle: "شاهد الشلالات دون قيادة",
    ctaText: "أخبرنا بتواريخك وعدد أفراد مجموعتك، وسنقترح أفضل مسار.",
  },
};

const isWaterfall = (place) => {
  const ka = asLocalizedText(place.title, "ka") || "";
  const en = (asLocalizedText(place.title, "en") || "").toLowerCase();
  return ka.includes("ჩანჩქერ") || en.includes("waterfall");
};

export default async function WaterfallsNearBatumiPage({ params }) {
  const [rawTours, rawPlaces, { locale }] = await Promise.all([
    getCachedTours(),
    getCachedPlaces().catch(() => []),
    params,
  ]);
  const lang = getRequestLocale(locale);
  const c = CONTENT[lang] || CONTENT.en;
  const ui = landingUi(lang);
  const t = getTranslator(lang);

  const waterfalls = (rawPlaces || [])
    .filter((p) => p?.id && isWaterfall(p))
    .sort((a, b) => Number(Boolean(b.isPopular)) - Number(Boolean(a.isPopular)))
    .map((p) => ({
      ...p,
      titleText: asLocalizedText(p.title, lang) || asLocalizedText(p.title, "en"),
      descText: asLocalizedText(p.desc, lang) || asLocalizedText(p.desc, "en"),
    }));

  // Tours whose route includes one of those waterfalls (by place ID or name).
  const waterfallIds = waterfalls.map((p) => p.id);
  const rawWaterfallTours = (rawTours || []).filter((tour) => {
    const json = JSON.stringify(tour);
    return waterfallIds.some((id) => json.includes(id)) || json.includes("ჩანჩქერ");
  });
  const tours = toTourViews(rawWaterfallTours, lang, rawPlaces, t("tourBadges"))
    .filter((tour) => !tour.isMultiDay)
    .slice(0, 6);

  const pageUrl = `${SITE_URL}/${lang}${PATH}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#waterfalls`,
        name: c.listTitle,
        itemListElement: waterfalls.map((p, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          url: `${SITE_URL}/${lang}${placePath(p)}`,
          name: p.titleText,
        })),
      },
      ...(tours.length
        ? [
            {
              "@type": "ItemList",
              "@id": `${pageUrl}#tours`,
              name: c.toursTitle,
              itemListElement: tours.map((tour, idx) => ({
                "@type": "ListItem",
                position: idx + 1,
                url: `${SITE_URL}/${lang}${tourPath(tour)}`,
                name: tour.title,
              })),
            },
          ]
        : []),
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: c.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
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
    <LandingShell active="places" jsonLd={jsonLd}>
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <nav className="landing-breadcrumbs" aria-label="Breadcrumb">
            <Link href={getLocalizedHref("/", lang)}>{ui.home}</Link>
            <span className="sep">/</span>
            <span>{c.crumb}</span>
          </nav>
          <div className="landing-badge">🌊 {c.badge}</div>
          <h1 className="landing-title">
            {c.heroTitle} <span>{c.heroHighlight}</span>
          </h1>
          <p className="landing-subtitle">{c.heroSubtitle}</p>
          <div className="landing-hero-actions">
            <a href={tours.length ? "#waterfall-tours" : "#waterfalls"} className="landing-btn-primary">🚗 {c.ctaTours}</a>
            <a href={whatsappHref(c.waText)} target="_blank" rel="noopener noreferrer" className="landing-btn-secondary">
              💬 {c.ctaInquire}
            </a>
          </div>
        </div>
      </section>

      {waterfalls.length > 0 && (
        <section id="waterfalls" className="landing-section">
          <div className="landing-section-header">
            <h2 className="landing-section-title">{c.listTitle}</h2>
            <p className="landing-section-desc">{c.listDesc}</p>
          </div>
          <div className="landing-tours-grid">
            {waterfalls.map((place) => (
              <Link key={place.id} href={getLocalizedHref(placePath(place), lang)} className="landing-tour-card" prefetch={false}>
                <div className="landing-tour-img-wrap">
                  <Image src={place.img || "/adjara.jpg"} alt={place.titleText} fill sizes="(max-width: 768px) 100vw, 380px" className="landing-tour-img" />
                </div>
                <div className="landing-tour-body">
                  <h3 className="landing-tour-title">{place.titleText}</h3>
                  <p className="landing-tour-desc">{place.descText}</p>
                  <div className="landing-tour-footer">
                    <span>📍 {formatRegionName(place.region, lang)}</span>
                    <span className="landing-tour-cta">{c.open} →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {tours.length > 0 && (
        <section id="waterfall-tours" className="landing-section" style={{ paddingTop: 0 }}>
          <div className="landing-section-header">
            <div className="landing-section-tag">{ui.featuredTag}</div>
            <h2 className="landing-section-title">{c.toursTitle}</h2>
            <p className="landing-section-desc">{c.toursDesc}</p>
          </div>
          <TourGrid items={tours.map((tour) => ({ tour }))} lang={lang} t={t} />
        </section>
      )}

      <section className="landing-section" style={{ paddingTop: 0 }}>
        <div className="landing-section-header">
          <div className="landing-section-tag">{ui.tipsTag}</div>
          <h2 className="landing-section-title">{c.tipsTitle}</h2>
        </div>
        <div className="landing-faq-grid">
          {c.tips.map((tip) => (
            <div key={tip.q} className="landing-faq-item">
              <h3 className="landing-faq-q">💡 {tip.q}</h3>
              <p className="landing-faq-a">{tip.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section" style={{ paddingTop: 0 }}>
        <div className="landing-section-header">
          <div className="landing-section-tag">{ui.faqTag}</div>
          <h2 className="landing-section-title">{ui.faqTitle}</h2>
        </div>
        <div className="landing-faq-grid">
          {c.faqs.map((faq) => (
            <div key={faq.q} className="landing-faq-item">
              <h3 className="landing-faq-q">❓ {faq.q}</h3>
              <p className="landing-faq-a">{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="landing-cta-banner">
          <h2>{c.ctaTitle}</h2>
          <p>{c.ctaText}</p>
          <a href={whatsappHref(c.waText)} target="_blank" rel="noopener noreferrer" className="landing-btn-primary">
            💬 {ui.whatsapp}
          </a>
        </div>
      </section>
    </LandingShell>
  );
}
