import React from "react";
import Link from "next/link";
import LandingShell from "../../components/site/LandingShell";
import { SITE_URL, getRequestLocale, buildLocalizedMetadata, getLocalizedHref } from "../../lib/siteConfig";
import { whatsappHref } from "../../lib/shared";
import { getCachedTransferPricing } from "../../lib/server/cachedData";
import { getTransferFare } from "../../lib/transfers/pricing";
import { LOCATION_BY_ID, estimateRouteDistance, formatDuration, isSvanetiRoute } from "../../lib/transfers/routeCalculator";
import { calculatorHref, routePagePath, getRoutePage } from "../../lib/transfers/routePages";
import { VEHICLES } from "../../lib/vehicles";
import { landingUi } from "../../lib/landingUi";

const PATH = "/batumi-airport-transfer";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const lang = getRequestLocale(locale);
  const c = CONTENT[lang] || CONTENT.en;

  return buildLocalizedMetadata({
    path: PATH,
    lang,
    title: c.metaTitle,
    description: c.metaDescription,
    image: "/2car.webp",
  });
}

// Destinations from Batumi airport. Distance and time come from the same
// table as the calculator (an `id`), so the two never disagree; Gonio is not
// in that table and carries its own short-hop numbers. `page` links the row
// to its route page where one exists.
const DESTINATIONS = [
  { id: "batumi_city", page: "batumi-airport-to-batumi" },
  { custom: { km: 10, mins: 15 }, names: { en: "Gonio & Kvariati", ka: "გონიო და კვარიათი", ru: "Гонио и Квариати", tr: "Gonio ve Kvariati", ar: "غونيو وكفارياتي" } },
  { id: "sarpi" },
  { id: "kobuleti" },
  { id: "shekvetili" },
  { id: "kutaisi_airport" },
  { id: "kutaisi_city" },
  { id: "martvili" },
  { id: "borjomi" },
  { id: "bakuriani" },
  { id: "mestia" },
  { id: "tbilisi_city" },
  { id: "tbilisi_airport" },
];

// Service promises below are the ones this page has always made (meeting in
// the arrivals hall, flight-delay adjustment). Prices are not written here:
// they come from the admin tariffs.
const CONTENT = {
  en: {
    metaTitle: "Batumi Airport Transfer (BUS) — Fixed Prices per Car | GeorgiaTrips",
    metaDescription: "Private transfer from Batumi Airport to the city, Gonio, Kobuleti, Kutaisi, Tbilisi and all of Georgia. Fixed price per vehicle, meeting in the arrivals hall, pay the driver on arrival.",
    badge: "Batumi Airport transfers",
    crumb: "Batumi Airport Transfer",
    heroTitle: "Batumi Airport Transfer (BUS) —",
    heroHighlight: "fixed price per car",
    heroSubtitle: "Pre-book a private car from Batumi International Airport to your hotel in Batumi or anywhere in Georgia. Your driver meets you in the arrivals hall; you pay on arrival.",
    ctaBook: "Book an airport transfer",
    ctaRates: "See prices",
    waText: "Hello! I'd like to book a transfer from Batumi Airport.",
    whyTitle: "Why book your airport transfer with us?",
    whyDesc: "No taxi queue, no haggling: a fixed price agreed before you land.",
    features: [
      { icon: "✈️", title: "Flight delays covered", desc: "Send us your flight number. If the flight is late, the pickup time moves with it at no extra charge." },
      { icon: "👋", title: "Meeting in the arrivals hall", desc: "Your driver waits in the arrivals hall with a sign showing your name and helps with the luggage." },
      { icon: "🏷️", title: "Fixed price per vehicle", desc: "The price is for the whole car, not per person, and is agreed before the trip." },
      { icon: "💵", title: "Pay on arrival", desc: "No prepayment. Booking is free; you pay the driver on the day." },
    ],
    ratesTitle: "Prices from Batumi Airport (BUS)",
    ratesDesc: "Per vehicle, door to door. Tap a destination for its route page.",
    tableHeaders: ["Destination", "Distance / time", "Sedan", "Minivan", "Sprinter"],
    capacity: (v) => `up to ${v}`,
    faqs: [
      { q: "Where will I meet my driver at Batumi Airport?", a: "In the arrivals hall, right after baggage claim. The driver holds a sign with your name." },
      { q: "What happens if my flight is delayed?", a: "Give us your flight number when booking. The pickup time follows the actual landing time, with no extra charge for a delay." },
      { q: "How do I pay for the transfer?", a: "You pay the driver on arrival. Booking is free and is confirmed by WhatsApp or phone." },
      { q: "How far is Batumi Airport from the city centre?", a: "About 8 km — around 15 minutes by car to the centre and the Boulevard." },
    ],
    ctaTitle: "Book your Batumi Airport ride",
    ctaText: "Send your flight number and hotel; we confirm the driver by WhatsApp.",
  },
  ru: {
    metaTitle: "Трансфер из аэропорта Батуми (BUS) — фиксированная цена | GeorgiaTrips",
    metaDescription: "Индивидуальный трансфер из аэропорта Батуми в город, Гонио, Кобулети, Кутаиси, Тбилиси и по всей Грузии. Фиксированная цена за машину, встреча в зале прилёта, оплата водителю по прилёте.",
    badge: "Трансферы из аэропорта Батуми",
    crumb: "Трансфер аэропорт Батуми",
    heroTitle: "Трансфер из аэропорта Батуми (BUS) —",
    heroHighlight: "фиксированная цена за машину",
    heroSubtitle: "Закажите заранее индивидуальную машину из международного аэропорта Батуми до отеля в Батуми или в любую точку Грузии. Водитель встретит в зале прилёта, оплата — по прилёте.",
    ctaBook: "Заказать трансфер",
    ctaRates: "Цены",
    waText: "Здравствуйте! Хочу заказать трансфер из аэропорта Батуми.",
    whyTitle: "Почему заказывают трансфер у нас?",
    whyDesc: "Без очереди на такси и торга: фиксированная цена, согласованная до посадки.",
    features: [
      { icon: "✈️", title: "Задержка рейса — не проблема", desc: "Пришлите номер рейса. Если рейс задерживается, время подачи сдвигается без доплаты." },
      { icon: "👋", title: "Встреча в зале прилёта", desc: "Водитель ждёт в зале прилёта с табличкой с вашим именем и помогает с багажом." },
      { icon: "🏷️", title: "Цена за машину", desc: "Цена за весь автомобиль, а не за человека, и согласуется до поездки." },
      { icon: "💵", title: "Оплата по прилёте", desc: "Без предоплаты. Бронирование бесплатное, оплата водителю в день поездки." },
    ],
    ratesTitle: "Цены из аэропорта Батуми (BUS)",
    ratesDesc: "За автомобиль, от двери до двери. Нажмите на направление, чтобы открыть его страницу.",
    tableHeaders: ["Направление", "Расстояние / время", "Седан", "Минивэн", "Sprinter"],
    capacity: (v) => `до ${v}`,
    faqs: [
      { q: "Где меня встретит водитель в аэропорту Батуми?", a: "В зале прилёта, сразу после получения багажа. У водителя табличка с вашим именем." },
      { q: "Что если рейс задержится?", a: "Укажите номер рейса при бронировании. Время подачи подстроится под фактическую посадку, доплаты за задержку нет." },
      { q: "Как оплатить трансфер?", a: "Оплата водителю по прилёте. Бронирование бесплатное, подтверждаем в WhatsApp или по телефону." },
      { q: "Далеко ли аэропорт Батуми от центра?", a: "Около 8 км — примерно 15 минут на машине до центра и Бульвара." },
    ],
    ctaTitle: "Закажите трансфер из аэропорта Батуми",
    ctaText: "Пришлите номер рейса и отель — подтвердим водителя в WhatsApp.",
  },
  ka: {
    metaTitle: "ბათუმის აეროპორტის ტრანსფერი (BUS) — ფიქსირებული ფასი | GeorgiaTrips",
    metaDescription: "ინდივიდუალური ტრანსფერი ბათუმის აეროპორტიდან ქალაქში, გონიოში, ქობულეთში, ქუთაისში, თბილისში და მთელ საქართველოში. ფიქსირებული ფასი ავტომობილზე, დახვედრა ჩამოსვლის დარბაზში, გადახდა ადგილზე.",
    badge: "ბათუმის აეროპორტის ტრანსფერები",
    crumb: "ბათუმის აეროპორტის ტრანსფერი",
    heroTitle: "ბათუმის აეროპორტის ტრანსფერი (BUS) —",
    heroHighlight: "ფიქსირებული ფასი მანქანაზე",
    heroSubtitle: "წინასწარ დაჯავშნეთ ინდივიდუალური ავტომობილი ბათუმის საერთაშორისო აეროპორტიდან სასტუმრომდე ან საქართველოს ნებისმიერ წერტილამდე. მძღოლი დაგხვდებათ ჩამოსვლის დარბაზში, გადახდა — ადგილზე.",
    ctaBook: "ტრანსფერის დაჯავშნა",
    ctaRates: "ფასები",
    waText: "გამარჯობა! მინდა დავჯავშნო ტრანსფერი ბათუმის აეროპორტიდან.",
    whyTitle: "რატომ ჩვენთან?",
    whyDesc: "ტაქსის რიგისა და ვაჭრობის გარეშე: ფიქსირებული ფასი, შეთანხმებული ჩამოფრენამდე.",
    features: [
      { icon: "✈️", title: "რეისის დაგვიანება", desc: "გამოგვიგზავნეთ რეისის ნომერი. თუ რეისი გვიანდება, დახვედრის დროც იცვლება დამატებითი საფასურის გარეშე." },
      { icon: "👋", title: "დახვედრა ჩამოსვლის დარბაზში", desc: "მძღოლი გელოდებათ დარბაზში თქვენი სახელის წარწერით და დაგეხმარებათ ბარგში." },
      { icon: "🏷️", title: "ფასი მანქანაზე", desc: "ფასი მთელ ავტომობილზეა და არა ადამიანზე; თანხმდება მგზავრობამდე." },
      { icon: "💵", title: "გადახდა ადგილზე", desc: "წინასწარი გადახდის გარეშე. ჯავშანი უფასოა, მძღოლს უხდით მგზავრობის დღეს." },
    ],
    ratesTitle: "ფასები ბათუმის აეროპორტიდან (BUS)",
    ratesDesc: "ავტომობილზე, კარიდან კარამდე. დააჭირეთ მიმართულებას მისი გვერდის სანახავად.",
    tableHeaders: ["მიმართულება", "მანძილი / დრო", "სედანი", "მინივენი", "სპრინტერი"],
    capacity: (v) => `${v}-მდე`,
    faqs: [
      { q: "სად დამხვდება მძღოლი ბათუმის აეროპორტში?", a: "ჩამოსვლის დარბაზში, ბარგის მიღებისთანავე. მძღოლს ექნება თქვენი სახელის წარწერა." },
      { q: "რა ხდება, თუ რეისი დაგვიანდა?", a: "ჯავშნისას მიუთითეთ რეისის ნომერი. დახვედრის დრო ფაქტობრივ დაფრენას მიჰყვება, დაგვიანებაზე დამატებითი საფასური არ არის." },
      { q: "როგორ გადავიხადო?", a: "მძღოლს უხდით ადგილზე. ჯავშანი უფასოა და დასტურდება WhatsApp-ით ან ტელეფონით." },
      { q: "რა მანძილია აეროპორტიდან ბათუმის ცენტრამდე?", a: "დაახლოებით 8 კმ — მანქანით დაახლოებით 15 წუთი ცენტრამდე და ბულვარამდე." },
    ],
    ctaTitle: "დაჯავშნეთ ტრანსფერი ბათუმის აეროპორტიდან",
    ctaText: "გამოგვიგზავნეთ რეისის ნომერი და სასტუმრო — მძღოლს WhatsApp-ით დაგიდასტურებთ.",
  },
  tr: {
    metaTitle: "Batum Havalimanı Transferi (BUS) — Araç Başı Sabit Fiyat | GeorgiaTrips",
    metaDescription: "Batum Havalimanı'ndan şehre, Gonio'ya, Kobuleti'ye, Kutaisi'ye, Tiflis'e ve tüm Gürcistan'a özel transfer. Araç başı sabit fiyat, gelen yolcu salonunda karşılama, ödeme varışta şoföre.",
    badge: "Batum Havalimanı transferleri",
    crumb: "Batum Havalimanı Transferi",
    heroTitle: "Batum Havalimanı Transferi (BUS) —",
    heroHighlight: "araç başı sabit fiyat",
    heroSubtitle: "Batum Uluslararası Havalimanı'ndan Batum'daki otelinize veya Gürcistan'ın herhangi bir yerine özel aracınızı önceden ayırtın. Şoförünüz sizi gelen yolcu salonunda karşılar; ödeme varışta yapılır.",
    ctaBook: "Havalimanı transferi ayırtın",
    ctaRates: "Fiyatlar",
    waText: "Merhaba! Batum Havalimanı'ndan transfer ayırtmak istiyorum.",
    whyTitle: "Havalimanı transferinizi neden bizden alın?",
    whyDesc: "Taksi kuyruğu ve pazarlık yok: inişten önce kararlaştırılmış sabit fiyat.",
    features: [
      { icon: "✈️", title: "Uçuş rötarı sorun değil", desc: "Uçuş numaranızı gönderin. Uçuş gecikirse alış saati ek ücret olmadan kaydırılır." },
      { icon: "👋", title: "Gelen yolcu salonunda karşılama", desc: "Şoförünüz gelen yolcu salonunda adınızın yazılı olduğu bir tabelayla bekler ve bagajınıza yardım eder." },
      { icon: "🏷️", title: "Araç başı sabit fiyat", desc: "Fiyat kişi başı değil, tüm araç içindir ve yolculuktan önce kararlaştırılır." },
      { icon: "💵", title: "Varışta ödeme", desc: "Ön ödeme yok. Rezervasyon ücretsizdir; ödemeyi transfer günü şoföre yaparsınız." },
    ],
    ratesTitle: "Batum Havalimanı (BUS) çıkışlı fiyatlar",
    ratesDesc: "Araç başı, kapıdan kapıya. Rota sayfası için bir varış noktasına dokunun.",
    tableHeaders: ["Varış", "Mesafe / süre", "Sedan", "Minivan", "Sprinter"],
    capacity: (v) => `${v} kişiye kadar`,
    faqs: [
      { q: "Batum Havalimanı'nda şoförle nerede buluşacağım?", a: "Gelen yolcu salonunda, bagaj alımından hemen sonra. Şoförün elinde adınızın yazılı olduğu bir tabela olur." },
      { q: "Uçuşum gecikirse ne olur?", a: "Rezervasyonda uçuş numaranızı belirtin. Alış saati gerçek iniş saatine göre ayarlanır, gecikme için ek ücret yoktur." },
      { q: "Transfer ücretini nasıl öderim?", a: "Varışta şoföre ödersiniz. Rezervasyon ücretsizdir ve WhatsApp veya telefonla onaylanır." },
      { q: "Batum Havalimanı şehir merkezine ne kadar uzak?", a: "Yaklaşık 8 km — merkeze ve sahil bulvarına arabayla yaklaşık 15 dakika." },
    ],
    ctaTitle: "Batum Havalimanı transferinizi ayırtın",
    ctaText: "Uçuş numaranızı ve otelinizi gönderin; şoförü WhatsApp'tan onaylarız.",
  },
  ar: {
    metaTitle: "التوصيل من مطار باتومي (BUS) — سعر ثابت للسيارة | GeorgiaTrips",
    metaDescription: "توصيل خاص من مطار باتومي إلى المدينة وغونيو وكوبوليتي وكوتايسي وتبليسي وجميع أنحاء جورجيا. سعر ثابت للسيارة، استقبال في صالة الوصول، والدفع للسائق عند الوصول.",
    badge: "التوصيل من مطار باتومي",
    crumb: "التوصيل من مطار باتومي",
    heroTitle: "التوصيل من مطار باتومي (BUS) —",
    heroHighlight: "سعر ثابت للسيارة",
    heroSubtitle: "احجز مسبقاً سيارة خاصة من مطار باتومي الدولي إلى فندقك في باتومي أو إلى أي مكان في جورجيا. يستقبلك السائق في صالة الوصول، والدفع عند الوصول.",
    ctaBook: "احجز التوصيل من المطار",
    ctaRates: "الأسعار",
    waText: "مرحباً! أود حجز توصيل من مطار باتومي.",
    whyTitle: "لماذا تحجز التوصيل من المطار معنا؟",
    whyDesc: "بلا طوابير سيارات أجرة ولا مساومة: سعر ثابت متفق عليه قبل هبوطك.",
    features: [
      { icon: "✈️", title: "تأخر الرحلة لا مشكلة", desc: "أرسل لنا رقم رحلتك. إذا تأخرت الرحلة يتغير وقت الاستلام دون أي رسوم إضافية." },
      { icon: "👋", title: "الاستقبال في صالة الوصول", desc: "ينتظرك السائق في صالة الوصول حاملاً لوحة باسمك ويساعدك في الأمتعة." },
      { icon: "🏷️", title: "سعر ثابت للسيارة", desc: "السعر للسيارة كاملة وليس للشخص، ويُتفق عليه قبل الرحلة." },
      { icon: "💵", title: "الدفع عند الوصول", desc: "بدون دفع مسبق. الحجز مجاني وتدفع للسائق يوم الرحلة." },
    ],
    ratesTitle: "الأسعار من مطار باتومي (BUS)",
    ratesDesc: "للسيارة، من الباب إلى الباب. اضغط على الوجهة لفتح صفحتها.",
    tableHeaders: ["الوجهة", "المسافة / المدة", "سيدان", "ميني فان", "سبرينتر"],
    capacity: (v) => `حتى ${v}`,
    faqs: [
      { q: "أين ألتقي بالسائق في مطار باتومي؟", a: "في صالة الوصول مباشرة بعد استلام الأمتعة. يحمل السائق لوحة باسمك." },
      { q: "ماذا لو تأخرت رحلتي؟", a: "اذكر رقم رحلتك عند الحجز. يتبع وقت الاستلام موعد الهبوط الفعلي، ولا رسوم إضافية على التأخير." },
      { q: "كيف أدفع ثمن التوصيل؟", a: "تدفع للسائق عند الوصول. الحجز مجاني ويُؤكد عبر واتساب أو الهاتف." },
      { q: "كم يبعد مطار باتومي عن وسط المدينة؟", a: "نحو 8 كم — حوالي 15 دقيقة بالسيارة إلى الوسط والكورنيش." },
    ],
    ctaTitle: "احجز توصيلك من مطار باتومي",
    ctaText: "أرسل رقم رحلتك واسم فندقك، ونؤكد لك السائق عبر واتساب.",
  },
};

const RATE_VEHICLES = ["sedan", "minivan", "sprinter"];

export default async function BatumiAirportTransferPage({ params }) {
  const { locale } = await params;
  const lang = getRequestLocale(locale);
  const c = CONTENT[lang] || CONTENT.en;
  const ui = landingUi(lang);

  // Prices follow the tariffs managed in the admin panel.
  const pricing = await getCachedTransferPricing();
  const airport = LOCATION_BY_ID.batumi_airport;
  const rateRows = DESTINATIONS.map((row) => {
    const loc = row.id ? LOCATION_BY_ID[row.id] : null;
    const distance = loc ? estimateRouteDistance(airport, loc) : { distanceKm: row.custom.km, durationMinutes: row.custom.mins };
    const isSvaneti = loc ? isSvanetiRoute(null, null, airport, loc) : false;
    const fares = Object.fromEntries(
      RATE_VEHICLES.map((key) => [key, getTransferFare(pricing, key, distance.distanceKm, { isSvaneti })])
    );
    const name = loc ? loc.names[lang] || loc.names.en : row.names[lang] || row.names.en;
    const page = row.page ? getRoutePage(row.page) : null;
    const href = page
      ? getLocalizedHref(routePagePath(page), lang)
      : row.id
        ? getLocalizedHref(calculatorHref("batumi_airport", row.id), lang)
        : null;
    return { key: row.id || "gonio", name, href, km: distance.distanceKm, time: formatDuration(distance.durationMinutes, lang), fares };
  });
  const allFares = rateRows.flatMap((r) => Object.values(r.fares)).filter((f) => f != null);
  const formatFare = (fare) => (fare != null ? `₾${fare}` : "—");

  const pageUrl = `${SITE_URL}/${lang}${PATH}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["TaxiService", "Service"],
        "@id": `${pageUrl}#service`,
        name: `${c.heroTitle} ${c.heroHighlight}`,
        description: c.heroSubtitle,
        url: pageUrl,
        inLanguage: lang,
        provider: { "@id": `${SITE_URL}/#organization` },
        areaServed: [
          { "@type": "Airport", name: "Batumi International Airport", iataCode: "BUS" },
          { "@type": "City", name: "Batumi" },
          { "@type": "City", name: "Kobuleti" },
          { "@type": "City", name: "Kutaisi" },
          { "@type": "City", name: "Tbilisi" },
        ],
        ...(allFares.length
          ? {
              offers: {
                "@type": "AggregateOffer",
                lowPrice: Math.min(...allFares),
                highPrice: Math.max(...allFares),
                priceCurrency: "GEL",
              },
            }
          : {}),
      },
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

  const bookHref = getLocalizedHref(calculatorHref("batumi_airport", "batumi_city"), lang);

  return (
    <LandingShell active="transfers" jsonLd={jsonLd}>
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <nav className="landing-breadcrumbs" aria-label="Breadcrumb">
            <Link href={getLocalizedHref("/", lang)}>{ui.home}</Link>
            <span className="sep">/</span>
            <span>{c.crumb}</span>
          </nav>
          <div className="landing-badge">✈️ {c.badge}</div>
          <h1 className="landing-title">
            {c.heroTitle} <span>{c.heroHighlight}</span>
          </h1>
          <p className="landing-subtitle">{c.heroSubtitle}</p>
          <div className="landing-hero-actions">
            <Link href={bookHref} className="landing-btn-primary" prefetch={false}>
              🗓️ {c.ctaBook}
            </Link>
            <a href="#rates-table" className="landing-btn-secondary">
              📊 {c.ctaRates}
            </a>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-header">
          <div className="landing-section-tag">{ui.advantagesTag}</div>
          <h2 className="landing-section-title">{c.whyTitle}</h2>
          <p className="landing-section-desc">{c.whyDesc}</p>
        </div>
        <div className="landing-features-grid">
          {c.features.map((f) => (
            <div key={f.title} className="landing-feature-card">
              <span className="landing-feature-icon" aria-hidden="true">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="rates-table" className="landing-section" style={{ paddingTop: 0 }}>
        <div className="landing-section-header">
          <div className="landing-section-tag">{ui.pricingTag}</div>
          <h2 className="landing-section-title">{c.ratesTitle}</h2>
          <p className="landing-section-desc">{c.ratesDesc}</p>
        </div>

        <div className="landing-table-wrap">
          <table className="landing-table">
            <thead>
              <tr>
                <th>{c.tableHeaders[0]}</th>
                {RATE_VEHICLES.map((key, i) => (
                  <th key={key}>
                    {c.tableHeaders[i + 2]} <small>({c.capacity(VEHICLES[key].capacityPax)})</small>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rateRows.map((row) => (
                <tr key={row.key}>
                  <td style={{ fontWeight: 700, color: "var(--gt-ink)" }}>
                    📍 {row.href ? <Link href={row.href} prefetch={false}>{row.name}</Link> : row.name}
                    <small style={{ display: "block", fontWeight: 500, color: "var(--gt-muted)", marginTop: "0.2rem" }}>
                      <span dir="ltr">{row.km} km</span> · {row.time}
                    </small>
                  </td>
                  {RATE_VEHICLES.map((key) => (
                    <td key={key} className="price-val" dir="ltr">{formatFare(row.fares[key])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
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
          <div className="landing-hero-actions">
            <Link href={bookHref} className="landing-btn-primary" prefetch={false}>
              🗓️ {c.ctaBook}
            </Link>
            <a href={whatsappHref(c.waText)} target="_blank" rel="noopener noreferrer" className="landing-btn-secondary">
              💬 {ui.whatsapp}
            </a>
          </div>
        </div>
      </section>
    </LandingShell>
  );
}
