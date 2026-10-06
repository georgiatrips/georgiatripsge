import React from "react";
import Link from "next/link";
import Image from "next/image";
import LandingShell from "../../components/site/LandingShell";
import ReviewsSection, { visibleReviews } from "../../components/site/ReviewsSection";
import { getCachedTours, getCachedPlaces, getCachedReviews } from "../../lib/server/cachedData";
import { getTranslator } from "../../lib/i18n/translate";
import { SITE_URL, getRequestLocale, buildLocalizedMetadata, getLocalizedHref } from "../../lib/siteConfig";
import { EMAIL, PHONE_DISPLAY, PHONE_TEL, whatsappHref } from "../../lib/shared";
import { COMPANY_PROFILE } from "../../lib/companyProfile";
import { VEHICLES, VEHICLE_KEYS } from "../../lib/vehicles";
import { landingUi } from "../../lib/landingUi";

const PATH = "/about";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const lang = getRequestLocale(locale);
  const c = CONTENT[lang] || CONTENT.en;
  return buildLocalizedMetadata({ path: PATH, lang, title: c.metaTitle, description: c.metaDescription, image: "/adjara.jpg" });
}

const LANGUAGE_NAMES = {
  en: { ka: "Georgian", en: "English", ru: "Russian", tr: "Turkish", ar: "Arabic" },
  ka: { ka: "ქართული", en: "ინგლისური", ru: "რუსული", tr: "თურქული", ar: "არაბული" },
  ru: { ka: "грузинский", en: "английский", ru: "русский", tr: "турецкий", ar: "арабский" },
  tr: { ka: "Gürcüce", en: "İngilizce", ru: "Rusça", tr: "Türkçe", ar: "Arapça" },
  ar: { ka: "الجورجية", en: "الإنجليزية", ru: "الروسية", tr: "التركية", ar: "العربية" },
};

// Only facts the site can stand behind: where the team is, what it runs, how
// booking works. Founding year and team appear once filled in companyProfile.js.
const CONTENT = {
  en: {
    metaTitle: "About GeorgiaTrips — Local Tour & Transfer Team in Batumi",
    metaDescription: "GeorgiaTrips is a tour and transfer company based in Batumi, Georgia: day tours across Adjara and West Georgia, multi-day trips and private airport transfers in five languages.",
    crumb: "About us",
    badge: "About GeorgiaTrips",
    title: "A local travel team",
    highlight: "based in Batumi",
    intro: (tours, places) =>
      `GeorgiaTrips is a tour and transfer company based in Batumi, Georgia (27 Kutaisi Street). We run group and private day tours from Batumi across Adjara and West Georgia, multi-day trips around the country and private transfers from the Batumi, Kutaisi and Tbilisi airports. Our site lists ${tours} tours and ${places} places we visit, and our team works in Georgian, English, Russian, Turkish and Arabic.`,
    founded: (year) => `We have been welcoming guests since ${year}.`,
    stats: { tours: "tours", places: "places on our routes", languages: "languages", seats: "seats in our largest vehicle" },
    howTitle: "How booking works",
    how: [
      "Choose a tour or transfer and send a free booking request on the site, or message us on WhatsApp.",
      "Our team confirms your booking by WhatsApp or phone, in your language.",
      "On the day, your driver picks you up from your hotel or address.",
      "You pay on the day of the tour or transfer — no prepayment.",
    ],
    whatTitle: "What we do",
    what: [
      { icon: "🏔️", title: "Day tours from Batumi", desc: "Canyons, waterfalls, mountain villages and wine cellars of Adjara and West Georgia.", href: "/tours-from-batumi" },
      { icon: "👑", title: "Private tours", desc: "Your own car and driver-guide, your start time and stops.", href: "/private-tours-batumi" },
      { icon: "🚐", title: "Transfers", desc: "Fixed prices per vehicle between airports, cities and resorts all over Georgia.", href: "/transfers" },
      { icon: "📍", title: "Places", desc: "A guide to the places on our routes, with photos and tips.", href: "/places" },
    ],
    fleetTitle: "Our vehicles",
    fleet: { sedan: "Sedan", jeep: "4×4 Jeep / SUV", minivan: "Minivan", sprinter: "Sprinter minibus" },
    seats: (n) => `up to ${n} passengers`,
    teamTitle: "Our team",
    speaks: "Speaks",
    reviewsCta: "Travelled with us? Leave a review on Google",
    contactTitle: "Get in touch",
    contactText: "Questions before you book? Write to us on WhatsApp or see all contacts.",
    contactLink: "All contacts",
  },
  ka: {
    metaTitle: "GeorgiaTrips-ის შესახებ — ტურებისა და ტრანსფერების გუნდი ბათუმში",
    metaDescription: "GeorgiaTrips ბათუმში დაფუძნებული ტურებისა და ტრანსფერების კომპანიაა: ერთდღიანი ტურები აჭარასა და დასავლეთ საქართველოში, მრავალდღიანი მოგზაურობები და აეროპორტის ტრანსფერები ხუთ ენაზე.",
    crumb: "ჩვენ შესახებ",
    badge: "GeorgiaTrips-ის შესახებ",
    title: "ადგილობრივი სამოგზაურო გუნდი",
    highlight: "ბათუმიდან",
    intro: (tours, places) =>
      `GeorgiaTrips ბათუმში დაფუძნებული ტურებისა და ტრანსფერების კომპანიაა (ქუთაისის ქ. 27). ვატარებთ ჯგუფურ და ინდივიდუალურ ერთდღიან ტურებს ბათუმიდან აჭარასა და დასავლეთ საქართველოში, მრავალდღიან მოგზაურობებს მთელ ქვეყანაში და ინდივიდუალურ ტრანსფერებს ბათუმის, ქუთაისისა და თბილისის აეროპორტებიდან. საიტზე ${tours} ტური და ${places} ადგილია, ჩვენი გუნდი კი ქართულ, ინგლისურ, რუსულ, თურქულ და არაბულ ენებზე მუშაობს.`,
    founded: (year) => `სტუმრებს ${year} წლიდან ვმასპინძლობთ.`,
    stats: { tours: "ტური", places: "ადგილი ჩვენს მარშრუტებზე", languages: "ენა", seats: "ადგილი ყველაზე დიდ ავტომობილში" },
    howTitle: "როგორ ხდება ჯავშანი",
    how: [
      "აირჩიეთ ტური ან ტრანსფერი და გამოგზავნეთ უფასო მოთხოვნა საიტზე, ან მოგვწერეთ WhatsApp-ზე.",
      "გუნდი დაგიდასტურებთ ჯავშანს WhatsApp-ით ან ტელეფონით, თქვენს ენაზე.",
      "დანიშნულ დღეს მძღოლი სასტუმროდან ან მისამართიდან აგიყვანთ.",
      "გადახდა ხდება ტურის ან ტრანსფერის დღეს — წინასწარი გადახდის გარეშე.",
    ],
    whatTitle: "რას ვაკეთებთ",
    what: [
      { icon: "🏔️", title: "ტურები ბათუმიდან", desc: "აჭარისა და დასავლეთ საქართველოს კანიონები, ჩანჩქერები, მთის სოფლები და მარნები.", href: "/tours-from-batumi" },
      { icon: "👑", title: "ინდივიდუალური ტურები", desc: "საკუთარი მანქანა და მძღოლ-გიდი, თქვენი დრო და გაჩერებები.", href: "/private-tours-batumi" },
      { icon: "🚐", title: "ტრანსფერები", desc: "ფიქსირებული ფასი ავტომობილზე აეროპორტებს, ქალაქებსა და კურორტებს შორის.", href: "/transfers" },
      { icon: "📍", title: "ადგილები", desc: "ჩვენი მარშრუტების ადგილების გზამკვლევი ფოტოებითა და რჩევებით.", href: "/places" },
    ],
    fleetTitle: "ჩვენი ავტომობილები",
    fleet: { sedan: "სედანი", jeep: "ჯიპი / SUV 4×4", minivan: "მინივენი", sprinter: "სპრინტერი" },
    seats: (n) => `${n} მგზავრამდე`,
    teamTitle: "ჩვენი გუნდი",
    speaks: "ენები",
    reviewsCta: "გვიმოგზაურეთ? დაგვიტოვეთ შეფასება Google-ზე",
    contactTitle: "დაგვიკავშირდით",
    contactText: "გაქვთ კითხვა ჯავშნამდე? მოგვწერეთ WhatsApp-ზე ან ნახეთ ყველა კონტაქტი.",
    contactLink: "ყველა კონტაქტი",
  },
  ru: {
    metaTitle: "О GeorgiaTrips — местная команда туров и трансферов в Батуми",
    metaDescription: "GeorgiaTrips — компания по турам и трансферам из Батуми: однодневные экскурсии по Аджарии и Западной Грузии, многодневные туры и трансферы из аэропортов на пяти языках.",
    crumb: "О нас",
    badge: "О GeorgiaTrips",
    title: "Местная команда путешествий",
    highlight: "из Батуми",
    intro: (tours, places) =>
      `GeorgiaTrips — компания по турам и трансферам из Батуми, Грузия (ул. Кутаиси, 27). Мы проводим групповые и индивидуальные однодневные экскурсии из Батуми по Аджарии и Западной Грузии, многодневные туры по стране и индивидуальные трансферы из аэропортов Батуми, Кутаиси и Тбилиси. На сайте ${tours} туров и ${places} мест, а наша команда работает на грузинском, английском, русском, турецком и арабском.`,
    founded: (year) => `Мы принимаем гостей с ${year} года.`,
    stats: { tours: "туров", places: "мест на наших маршрутах", languages: "языков", seats: "мест в самом большом автомобиле" },
    howTitle: "Как проходит бронирование",
    how: [
      "Выберите тур или трансфер и отправьте бесплатную заявку на сайте или напишите в WhatsApp.",
      "Команда подтвердит бронь в WhatsApp или по телефону на вашем языке.",
      "В назначенный день водитель заберёт вас от отеля или по адресу.",
      "Оплата — в день тура или трансфера, без предоплаты.",
    ],
    whatTitle: "Чем мы занимаемся",
    what: [
      { icon: "🏔️", title: "Экскурсии из Батуми", desc: "Каньоны, водопады, горные сёла и винные погреба Аджарии и Западной Грузии.", href: "/tours-from-batumi" },
      { icon: "👑", title: "Индивидуальные туры", desc: "Своя машина и водитель-гид, ваше время и остановки.", href: "/private-tours-batumi" },
      { icon: "🚐", title: "Трансферы", desc: "Фиксированные цены за машину между аэропортами, городами и курортами Грузии.", href: "/transfers" },
      { icon: "📍", title: "Места", desc: "Путеводитель по местам наших маршрутов с фото и советами.", href: "/places" },
    ],
    fleetTitle: "Наши автомобили",
    fleet: { sedan: "Седан", jeep: "Джип / SUV 4×4", minivan: "Минивэн", sprinter: "Микроавтобус Sprinter" },
    seats: (n) => `до ${n} пассажиров`,
    teamTitle: "Наша команда",
    speaks: "Языки",
    reviewsCta: "Путешествовали с нами? Оставьте отзыв в Google",
    contactTitle: "Свяжитесь с нами",
    contactText: "Есть вопросы до бронирования? Напишите в WhatsApp или посмотрите все контакты.",
    contactLink: "Все контакты",
  },
  tr: {
    metaTitle: "GeorgiaTrips Hakkında — Batum'da Yerel Tur ve Transfer Ekibi",
    metaDescription: "GeorgiaTrips, Batum merkezli bir tur ve transfer şirketidir: Acara ve Batı Gürcistan'da günübirlik turlar, çok günlük geziler ve beş dilde özel havalimanı transferleri.",
    crumb: "Hakkımızda",
    badge: "GeorgiaTrips hakkında",
    title: "Batum merkezli",
    highlight: "yerel bir seyahat ekibi",
    intro: (tours, places) =>
      `GeorgiaTrips, Gürcistan'ın Batum şehrinde (Kutaisi Sk. 27) bulunan bir tur ve transfer şirketidir. Batum'dan Acara ve Batı Gürcistan'a grup ve özel günübirlik turlar, ülke genelinde çok günlük geziler ve Batum, Kutaisi ve Tiflis havalimanlarından özel transferler düzenliyoruz. Sitemizde ${tours} tur ve ${places} yer bulunur; ekibimiz Gürcüce, İngilizce, Rusça, Türkçe ve Arapça hizmet verir.`,
    founded: (year) => `${year} yılından beri misafir ağırlıyoruz.`,
    stats: { tours: "tur", places: "rotalarımızdaki yer", languages: "dil", seats: "en büyük aracımızdaki koltuk" },
    howTitle: "Rezervasyon nasıl yapılır",
    how: [
      "Bir tur veya transfer seçip sitede ücretsiz rezervasyon talebi gönderin ya da WhatsApp'tan yazın.",
      "Ekibimiz rezervasyonunuzu WhatsApp veya telefonla, kendi dilinizde onaylar.",
      "O gün şoförünüz sizi otelinizden veya adresinizden alır.",
      "Ödeme tur veya transfer günü yapılır — ön ödeme yok.",
    ],
    whatTitle: "Neler yapıyoruz",
    what: [
      { icon: "🏔️", title: "Batum'dan günübirlik turlar", desc: "Acara ve Batı Gürcistan'ın kanyonları, şelaleleri, dağ köyleri ve şarap mahzenleri.", href: "/tours-from-batumi" },
      { icon: "👑", title: "Özel turlar", desc: "Kendi aracınız ve şoför-rehberiniz, kendi saatiniz ve duraklarınız.", href: "/private-tours-batumi" },
      { icon: "🚐", title: "Transferler", desc: "Gürcistan genelinde havalimanları, şehirler ve tatil yerleri arasında araç başı sabit fiyat.", href: "/transfers" },
      { icon: "📍", title: "Yerler", desc: "Rotalarımızdaki yerler için fotoğraflı ve ipuçlu rehber.", href: "/places" },
    ],
    fleetTitle: "Araçlarımız",
    fleet: { sedan: "Sedan", jeep: "4×4 Cip / SUV", minivan: "Minivan", sprinter: "Sprinter minibüs" },
    seats: (n) => `${n} yolcuya kadar`,
    teamTitle: "Ekibimiz",
    speaks: "Diller",
    reviewsCta: "Bizimle seyahat ettiniz mi? Google'da yorum bırakın",
    contactTitle: "Bize ulaşın",
    contactText: "Rezervasyondan önce sorunuz mu var? WhatsApp'tan yazın veya tüm iletişim bilgilerine bakın.",
    contactLink: "Tüm iletişim bilgileri",
  },
  ar: {
    metaTitle: "عن GeorgiaTrips — فريق محلي للجولات والتوصيل في باتومي",
    metaDescription: "GeorgiaTrips شركة جولات وتوصيل مقرها باتومي في جورجيا: جولات يومية في أجاريا وغرب جورجيا، ورحلات متعددة الأيام، وتوصيل خاص من المطارات بخمس لغات.",
    crumb: "من نحن",
    badge: "عن GeorgiaTrips",
    title: "فريق سفر محلي",
    highlight: "مقره باتومي",
    intro: (tours, places) =>
      `GeorgiaTrips شركة جولات وتوصيل مقرها باتومي في جورجيا (27 شارع كوتايسي). ننظم جولات يومية جماعية وخاصة من باتومي في أجاريا وغرب جورجيا، ورحلات متعددة الأيام في أنحاء البلاد، وتوصيلاً خاصاً من مطارات باتومي وكوتايسي وتبليسي. يضم موقعنا ${tours} جولة و${places} مكاناً نزوره، ويعمل فريقنا بالجورجية والإنجليزية والروسية والتركية والعربية.`,
    founded: (year) => `نستقبل الضيوف منذ عام ${year}.`,
    stats: { tours: "جولة", places: "مكان على مساراتنا", languages: "لغات", seats: "مقعداً في أكبر سياراتنا" },
    howTitle: "كيف يتم الحجز",
    how: [
      "اختر جولة أو توصيلاً وأرسل طلب حجز مجاني من الموقع، أو راسلنا عبر واتساب.",
      "يؤكد فريقنا حجزك عبر واتساب أو الهاتف بلغتك.",
      "في اليوم المحدد يستلمك السائق من فندقك أو عنوانك.",
      "تدفع يوم الجولة أو التوصيل — بدون دفع مسبق.",
    ],
    whatTitle: "ماذا نقدم",
    what: [
      { icon: "🏔️", title: "جولات يومية من باتومي", desc: "أودية وشلالات وقرى جبلية ومعاصر نبيذ في أجاريا وغرب جورجيا.", href: "/tours-from-batumi" },
      { icon: "👑", title: "جولات خاصة", desc: "سيارتك وسائقك المرشد، ووقتك وتوقفاتك.", href: "/private-tours-batumi" },
      { icon: "🚐", title: "خدمات التوصيل", desc: "أسعار ثابتة للسيارة بين المطارات والمدن والمنتجعات في كل جورجيا.", href: "/transfers" },
      { icon: "📍", title: "الأماكن", desc: "دليل للأماكن على مساراتنا مع الصور والنصائح.", href: "/places" },
    ],
    fleetTitle: "سياراتنا",
    fleet: { sedan: "سيدان", jeep: "دفع رباعي / SUV 4×4", minivan: "ميني فان", sprinter: "حافلة سبرينتر" },
    seats: (n) => `حتى ${n} ركاب`,
    teamTitle: "فريقنا",
    speaks: "اللغات",
    reviewsCta: "سافرت معنا؟ اترك تقييماً على Google",
    contactTitle: "تواصل معنا",
    contactText: "لديك أسئلة قبل الحجز؟ راسلنا عبر واتساب أو اطلع على كل وسائل التواصل.",
    contactLink: "كل وسائل التواصل",
  },
};

export default async function AboutPage({ params }) {
  const [rawTours, rawPlaces, rawReviews, { locale }] = await Promise.all([
    getCachedTours().catch(() => []),
    getCachedPlaces().catch(() => []),
    getCachedReviews().catch(() => []),
    params,
  ]);
  const lang = getRequestLocale(locale);
  const c = CONTENT[lang] || CONTENT.en;
  const ui = landingUi(lang);
  const t = getTranslator(lang);
  const reviews = visibleReviews(rawReviews);
  const tourCount = (rawTours || []).length;
  const placeCount = (rawPlaces || []).length;
  const maxSeats = Math.max(...VEHICLE_KEYS.map((key) => VEHICLES[key].capacityPax));
  const { foundedYear, team } = COMPANY_PROFILE;
  const languageNames = LANGUAGE_NAMES[lang] || LANGUAGE_NAMES.en;

  const pageUrl = `${SITE_URL}/${lang}${PATH}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
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

  const stats = [
    { value: tourCount, label: c.stats.tours },
    { value: placeCount, label: c.stats.places },
    { value: 5, label: c.stats.languages },
    { value: maxSeats, label: c.stats.seats },
  ].filter((s) => s.value > 0);

  return (
    <LandingShell active="home" jsonLd={jsonLd}>
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <nav className="landing-breadcrumbs" aria-label="Breadcrumb">
            <Link href={getLocalizedHref("/", lang)}>{ui.home}</Link>
            <span className="sep">/</span>
            <span>{c.crumb}</span>
          </nav>
          <div className="landing-badge">🤝 {c.badge}</div>
          <h1 className="landing-title">
            {c.title} <span>{c.highlight}</span>
          </h1>
          <p className="landing-answer">
            {c.intro(tourCount, placeCount)}
            {foundedYear ? ` ${c.founded(foundedYear)}` : ""}
          </p>
          <div className="landing-facts landing-facts--wide">
            {stats.map((s) => (
              <div key={s.label} className="landing-fact">
                <span className="landing-fact-value" dir="ltr">{s.value}</span>
                <span className="landing-fact-label" style={{ marginTop: "0.35rem", marginBottom: 0 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-header">
          <h2 className="landing-section-title">{c.whatTitle}</h2>
        </div>
        <div className="landing-features-grid">
          {c.what.map((item) => (
            <Link key={item.href} href={getLocalizedHref(item.href, lang)} className="landing-feature-card" style={{ textDecoration: "none", color: "inherit" }} prefetch={false}>
              <span className="landing-feature-icon" aria-hidden="true">{item.icon}</span>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="landing-section" style={{ paddingTop: 0 }}>
        <div className="landing-section-header">
          <h2 className="landing-section-title">{c.howTitle}</h2>
        </div>
        <ol className="landing-steps">
          {c.how.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      </section>

      <section className="landing-section" style={{ paddingTop: 0 }}>
        <div className="landing-section-header">
          <div className="landing-section-tag">{ui.fleetTag}</div>
          <h2 className="landing-section-title">{c.fleetTitle}</h2>
        </div>
        <div className="landing-features-grid">
          {VEHICLE_KEYS.map((key) => (
            <div key={key} className="landing-feature-card">
              <div style={{ position: "relative", height: 110, marginBottom: "1rem" }}>
                <Image src={VEHICLES[key].img} alt={c.fleet[key]} fill sizes="260px" style={{ objectFit: "contain" }} />
              </div>
              <h3>{c.fleet[key]}</h3>
              <p>{c.seats(VEHICLES[key].capacityPax)}</p>
            </div>
          ))}
        </div>
      </section>

      {team.length > 0 && (
        <section className="landing-section" style={{ paddingTop: 0 }}>
          <div className="landing-section-header">
            <h2 className="landing-section-title">{c.teamTitle}</h2>
          </div>
          <div className="landing-features-grid">
            {team.map((member) => (
              <div key={member.name} className="landing-feature-card" style={{ textAlign: "center" }}>
                {member.photo ? (
                  <div style={{ position: "relative", width: 120, height: 120, margin: "0 auto 1rem", borderRadius: "50%", overflow: "hidden" }}>
                    <Image src={member.photo} alt={member.name} fill sizes="120px" style={{ objectFit: "cover" }} />
                  </div>
                ) : null}
                <h3>{member.name}</h3>
                <p>{member.role?.[lang] || member.role?.en || ""}</p>
                {member.languages?.length ? (
                  <p style={{ marginTop: "0.5rem" }}>
                    {c.speaks}: {member.languages.map((code) => languageNames[code] || code).join(", ")}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      )}

      <ReviewsSection reviews={reviews} t={t} tone="paper" headingId="about-reviews-title" />
      {reviews.length > 0 && COMPANY_PROFILE.googleReviewUrl ? (
        <p className="landing-note" style={{ paddingBottom: "1rem" }}>
          <a href={COMPANY_PROFILE.googleReviewUrl} target="_blank" rel="noopener noreferrer">⭐ {c.reviewsCta}</a>
        </p>
      ) : null}

      <section className="landing-section">
        <div className="landing-cta-banner" style={{ marginTop: 0 }}>
          <h2>{c.contactTitle}</h2>
          <p>{c.contactText}</p>
          <p dir="ltr" style={{ marginBottom: "1.25rem" }}>
            <a href={`tel:${PHONE_TEL}`}>{PHONE_DISPLAY}</a> · <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </p>
          <div className="landing-hero-actions">
            <a href={whatsappHref(t("site.generalWa"))} target="_blank" rel="noopener noreferrer" className="landing-btn-primary">
              💬 {ui.whatsapp}
            </a>
            <Link href={getLocalizedHref("/contact", lang)} className="landing-btn-secondary" prefetch={false}>
              📇 {c.contactLink}
            </Link>
          </div>
          <p style={{ marginTop: "1rem", fontSize: "0.85rem", opacity: 0.85 }}>{t("footer.address")}</p>
        </div>
      </section>
    </LandingShell>
  );
}
