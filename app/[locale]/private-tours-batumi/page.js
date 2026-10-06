import React from "react";
import Link from "next/link";
import Image from "next/image";
import LandingShell from "../../components/site/LandingShell";
import TourGrid from "../../components/site/TourGrid";
import { getCachedTours, getCachedPlaces } from "../../lib/server/cachedData";
import { toTourViews } from "../../lib/tourView";
import { getTranslator } from "../../lib/i18n/translate";
import { SITE_URL, getRequestLocale, buildLocalizedMetadata, getLocalizedHref } from "../../lib/siteConfig";
import { tourPath } from "../../lib/slugs";
import { whatsappHref } from "../../lib/shared";
import { VEHICLES, VEHICLE_KEYS } from "../../lib/vehicles";
import { landingUi } from "../../lib/landingUi";
import "../../styles/tour-card.css";

const PATH = "/private-tours-batumi";

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

const CONTENT = {
  en: {
    metaTitle: "Private Tours from Batumi with Driver & Guide — Price per Car | GeorgiaTrips",
    metaDescription: "Private day tours from Batumi for your group only: your own car and driver-guide, your start time and stops. Price per vehicle, hotel pickup, pay on the day.",
    badge: "Private tours",
    crumb: "Private Tours from Batumi",
    heroTitle: "Private tours from Batumi with your own",
    heroHighlight: "driver & guide",
    heroSubtitle: "Only your group in the car. Start when you want, stop where you like, and spend as long as you wish at each place — anywhere in Adjara and West Georgia.",
    ctaExplore: "See private tours",
    ctaCustom: "Plan my own route",
    waText: "Hello! I'd like to plan a private tour from Batumi.",
    benefitsTitle: "Why a private tour?",
    benefitsDesc: "No crowded bus and no fixed timetable: your day runs at your pace.",
    features: [
      { icon: "✨", title: "Your own schedule", desc: "Choose the start time, stay longer where you like and skip what doesn't interest you." },
      { icon: "🚐", title: "A car for your group only", desc: "From a sedan for two to a 19-seat Sprinter for a large family or company." },
      { icon: "🗣️", title: "Your language", desc: "Driver-guides who speak Georgian, English, Russian, Turkish or Arabic." },
      { icon: "🏨", title: "Door to door", desc: "Pickup from your hotel or apartment in Batumi and the coast, and back again." },
    ],
    fleetTitle: "Choose your vehicle",
    fleetDesc: "The private price on each tour depends on the vehicle, not on the number of people.",
    fleet: {
      sedan: { name: "Sedan", desc: "For couples and small families." },
      jeep: { name: "4×4 Jeep / SUV", desc: "For mountain roads such as Goderdzi and upper Adjara." },
      minivan: { name: "Minivan", desc: "For families and friends with luggage." },
      sprinter: { name: "Sprinter minibus", desc: "For large groups and company trips." },
    },
    passengers: (n) => `up to ${n} passengers`,
    toursTitle: "Tours you can book as private",
    toursDesc: "Each card shows the private price for the whole vehicle.",
    faqs: [
      { q: "What is included in a private tour from Batumi?", a: "A car and driver-guide for your group only, fuel and pickup from your hotel. What else is included or not (entrance tickets, meals) is listed on each tour page." },
      { q: "Can we change the stops and timing?", a: "Yes. A private tour can start when you want, and stops can be added or skipped — tell us when booking." },
      { q: "How is the private tour price calculated?", a: "Per vehicle: the price depends on the car you choose, not on how many people are in it. You pay on the day of the tour." },
      { q: "Can you plan a route that is not on the site?", a: "Yes. Tell us where you'd like to go and for how long, and we'll send you a route and a price." },
    ],
    ctaTitle: "Plan your own private day",
    ctaText: "Tell us what you'd like to see and how many of you there are, and we'll suggest a route and a price.",
  },
  ru: {
    metaTitle: "Индивидуальные туры из Батуми с водителем-гидом — цена за машину | GeorgiaTrips",
    metaDescription: "Индивидуальные экскурсии из Батуми только для вашей компании: своя машина и водитель-гид, ваше время выезда и остановки. Цена за автомобиль, трансфер от отеля, оплата в день тура.",
    badge: "Индивидуальные туры",
    crumb: "Индивидуальные туры из Батуми",
    heroTitle: "Индивидуальные туры из Батуми с личным",
    heroHighlight: "водителем-гидом",
    heroSubtitle: "В машине только ваша компания. Выезжайте когда удобно, останавливайтесь где хочется и оставайтесь сколько угодно — по всей Аджарии и Западной Грузии.",
    ctaExplore: "Индивидуальные туры",
    ctaCustom: "Составить свой маршрут",
    waText: "Здравствуйте! Хочу заказать индивидуальный тур из Батуми.",
    benefitsTitle: "Почему индивидуальный тур?",
    benefitsDesc: "Без переполненного автобуса и жёсткого расписания: день идёт в вашем темпе.",
    features: [
      { icon: "✨", title: "Своё расписание", desc: "Выбирайте время выезда, задерживайтесь где нравится и пропускайте неинтересное." },
      { icon: "🚐", title: "Машина только для вас", desc: "От седана для двоих до 19-местного Sprinter для большой семьи или компании." },
      { icon: "🗣️", title: "На вашем языке", desc: "Водители-гиды говорят на русском, грузинском, английском, турецком или арабском." },
      { icon: "🏨", title: "От двери до двери", desc: "Заберём от отеля или апартаментов в Батуми и на побережье и привезём обратно." },
    ],
    fleetTitle: "Выберите автомобиль",
    fleetDesc: "Цена индивидуального тура зависит от автомобиля, а не от количества человек.",
    fleet: {
      sedan: { name: "Седан", desc: "Для пар и небольших семей." },
      jeep: { name: "Джип / SUV 4×4", desc: "Для горных дорог — Годердзи и верхняя Аджария." },
      minivan: { name: "Минивэн", desc: "Для семей и друзей с багажом." },
      sprinter: { name: "Микроавтобус Sprinter", desc: "Для больших групп и корпоративных поездок." },
    },
    passengers: (n) => `до ${n} пассажиров`,
    toursTitle: "Туры, доступные в индивидуальном формате",
    toursDesc: "На карточке — цена индивидуального тура за весь автомобиль.",
    faqs: [
      { q: "Что входит в индивидуальный тур из Батуми?", a: "Машина и водитель-гид только для вашей компании, топливо и трансфер от отеля. Что ещё включено или нет (входные билеты, питание), указано на странице каждого тура." },
      { q: "Можно изменить остановки и время?", a: "Да. Индивидуальный тур начинается когда вам удобно, остановки можно добавить или убрать — скажите при бронировании." },
      { q: "Как считается цена индивидуального тура?", a: "За автомобиль: цена зависит от выбранной машины, а не от числа пассажиров. Оплата — в день тура." },
      { q: "Можете составить маршрут, которого нет на сайте?", a: "Да. Напишите, куда и на сколько хотите поехать, — пришлём маршрут и цену." },
    ],
    ctaTitle: "Спланируйте свой день",
    ctaText: "Напишите, что хотите увидеть и сколько вас, — предложим маршрут и цену.",
  },
  ka: {
    metaTitle: "ინდივიდუალური ტურები ბათუმიდან მძღოლ-გიდით — ფასი მანქანაზე | GeorgiaTrips",
    metaDescription: "ინდივიდუალური ტურები ბათუმიდან მხოლოდ თქვენი ჯგუფისთვის: საკუთარი მანქანა და მძღოლ-გიდი, თქვენი დრო და გაჩერებები. ფასი ავტომობილზე, გაყვანა სასტუმროდან, გადახდა ტურის დღეს.",
    badge: "ინდივიდუალური ტურები",
    crumb: "ინდივიდუალური ტურები ბათუმიდან",
    heroTitle: "ინდივიდუალური ტურები ბათუმიდან პირადი",
    heroHighlight: "მძღოლ-გიდით",
    heroSubtitle: "მანქანაში მხოლოდ თქვენი ჯგუფია. გადით როცა გსურთ, გაჩერდით სადაც მოგეწონებათ და დარჩით რამდენიც გინდათ — მთელ აჭარასა და დასავლეთ საქართველოში.",
    ctaExplore: "ინდივიდუალური ტურები",
    ctaCustom: "საკუთარი მარშრუტი",
    waText: "გამარჯობა! მინდა ინდივიდუალური ტური ბათუმიდან.",
    benefitsTitle: "რატომ ინდივიდუალური ტური?",
    benefitsDesc: "გადატვირთული ავტობუსისა და მკაცრი განრიგის გარეშე: დღე თქვენს ტემპში მიდის.",
    features: [
      { icon: "✨", title: "თქვენი განრიგი", desc: "აირჩიეთ გასვლის დრო, დარჩით დიდხანს სადაც მოგწონთ და გამოტოვეთ ის, რაც არ გაინტერესებთ." },
      { icon: "🚐", title: "მანქანა მხოლოდ თქვენთვის", desc: "სედანიდან ორი ადამიანისთვის 19-ადგილიან სპრინტერამდე დიდი ოჯახისა თუ კომპანიისთვის." },
      { icon: "🗣️", title: "თქვენს ენაზე", desc: "მძღოლ-გიდები ქართულ, ინგლისურ, რუსულ, თურქულ ან არაბულ ენებზე." },
      { icon: "🏨", title: "კარიდან კარამდე", desc: "აგიყვანთ სასტუმროდან ან აპარტამენტიდან ბათუმსა და სანაპიროზე და დაგაბრუნებთ." },
    ],
    fleetTitle: "აირჩიეთ ავტომობილი",
    fleetDesc: "ინდივიდუალური ტურის ფასი ავტომობილზეა დამოკიდებული და არა ადამიანების რაოდენობაზე.",
    fleet: {
      sedan: { name: "სედანი", desc: "წყვილებისა და პატარა ოჯახებისთვის." },
      jeep: { name: "ჯიპი / SUV 4×4", desc: "მთის გზებისთვის — გოდერძი და მთიანი აჭარა." },
      minivan: { name: "მინივენი", desc: "ოჯახებისა და მეგობრებისთვის ბარგით." },
      sprinter: { name: "სპრინტერი", desc: "დიდი ჯგუფებისა და კორპორატიული მოგზაურობისთვის." },
    },
    passengers: (n) => `${n} მგზავრამდე`,
    toursTitle: "ტურები, რომლებიც ინდივიდუალურადაც იჯავშნება",
    toursDesc: "ბარათზე ინდივიდუალური ტურის ფასია მთელ ავტომობილზე.",
    faqs: [
      { q: "რა შედის ინდივიდუალურ ტურში ბათუმიდან?", a: "მანქანა და მძღოლ-გიდი მხოლოდ თქვენი ჯგუფისთვის, საწვავი და გაყვანა სასტუმროდან. რა შედის ან არ შედის კიდევ (შესასვლელი ბილეთები, კვება), თითოეული ტურის გვერდზეა მითითებული." },
      { q: "შეიძლება გაჩერებებისა და დროის შეცვლა?", a: "დიახ. ინდივიდუალური ტური იწყება თქვენთვის სასურველ დროს, გაჩერებების დამატება ან გამოტოვება შეიძლება — ჯავშნისას გვითხარით." },
      { q: "როგორ ითვლება ინდივიდუალური ტურის ფასი?", a: "ავტომობილზე: ფასი არჩეულ მანქანაზეა დამოკიდებული და არა მგზავრების რაოდენობაზე. გადახდა ტურის დღეს ხდება." },
      { q: "შეგიძლიათ შეადგინოთ მარშრუტი, რომელიც საიტზე არ არის?", a: "დიახ. მოგვწერეთ, სად და რამდენი ხნით გსურთ წასვლა, და გამოგიგზავნით მარშრუტსა და ფასს." },
    ],
    ctaTitle: "დაგეგმეთ თქვენი დღე",
    ctaText: "მოგვწერეთ, რისი ნახვა გსურთ და რამდენი ხართ — შემოგთავაზებთ მარშრუტსა და ფასს.",
  },
  tr: {
    metaTitle: "Batum'dan Şoför-Rehberli Özel Turlar — Araç Başı Fiyat | GeorgiaTrips",
    metaDescription: "Sadece grubunuza özel Batum çıkışlı günübirlik turlar: kendi aracınız ve şoför-rehberiniz, kendi saatiniz ve duraklarınız. Araç başı fiyat, otelden alış, ödeme tur günü.",
    badge: "Özel turlar",
    crumb: "Batum'dan Özel Turlar",
    heroTitle: "Batum'dan kendi",
    heroHighlight: "şoför-rehberinizle özel turlar",
    heroSubtitle: "Araçta yalnızca sizin grubunuz var. İstediğiniz saatte çıkın, dilediğiniz yerde durun ve her yerde istediğiniz kadar kalın — Acara ve Batı Gürcistan'ın her yerinde.",
    ctaExplore: "Özel turları görün",
    ctaCustom: "Kendi rotamı planla",
    waText: "Merhaba! Batum'dan özel bir tur planlamak istiyorum.",
    benefitsTitle: "Neden özel tur?",
    benefitsDesc: "Kalabalık otobüs ve sabit program yok: gününüz sizin temponuzda geçer.",
    features: [
      { icon: "✨", title: "Kendi programınız", desc: "Kalkış saatini seçin, beğendiğiniz yerde daha uzun kalın, ilginizi çekmeyeni atlayın." },
      { icon: "🚐", title: "Yalnızca grubunuza araç", desc: "İki kişilik sedandan kalabalık aile veya şirket için 19 kişilik Sprinter'a kadar." },
      { icon: "🗣️", title: "Kendi dilinizde", desc: "Türkçe, Gürcüce, İngilizce, Rusça veya Arapça konuşan şoför-rehberler." },
      { icon: "🏨", title: "Kapıdan kapıya", desc: "Batum ve sahildeki otelinizden veya dairenizden alır, geri bırakırız." },
    ],
    fleetTitle: "Aracınızı seçin",
    fleetDesc: "Özel tur fiyatı kişi sayısına değil, araca göre belirlenir.",
    fleet: {
      sedan: { name: "Sedan", desc: "Çiftler ve küçük aileler için." },
      jeep: { name: "4×4 Cip / SUV", desc: "Goderdzi ve yukarı Acara gibi dağ yolları için." },
      minivan: { name: "Minivan", desc: "Bagajlı aileler ve arkadaş grupları için." },
      sprinter: { name: "Sprinter minibüs", desc: "Büyük gruplar ve şirket gezileri için." },
    },
    passengers: (n) => `${n} yolcuya kadar`,
    toursTitle: "Özel olarak ayırtılabilen turlar",
    toursDesc: "Kartta tüm aracın özel tur fiyatı gösterilir.",
    faqs: [
      { q: "Batum'dan özel tura neler dahildir?", a: "Yalnızca grubunuz için araç ve şoför-rehber, yakıt ve otelden alış. Başka neyin dahil olup olmadığı (giriş biletleri, yemekler) her tur sayfasında yazılıdır." },
      { q: "Durakları ve saatleri değiştirebilir miyiz?", a: "Evet. Özel tur istediğiniz saatte başlar; duraklar eklenebilir veya atlanabilir — rezervasyonda belirtin." },
      { q: "Özel tur fiyatı nasıl hesaplanır?", a: "Araç başı: fiyat yolcu sayısına değil seçtiğiniz araca bağlıdır. Ödeme tur günü yapılır." },
      { q: "Sitede olmayan bir rota planlayabilir misiniz?", a: "Evet. Nereye ve ne kadar süreyle gitmek istediğinizi yazın, size rota ve fiyat gönderelim." },
    ],
    ctaTitle: "Kendi özel gününüzü planlayın",
    ctaText: "Ne görmek istediğinizi ve kaç kişi olduğunuzu yazın; size bir rota ve fiyat önerelim.",
  },
  ar: {
    metaTitle: "جولات خاصة من باتومي مع سائق مرشد — السعر للسيارة | GeorgiaTrips",
    metaDescription: "جولات يومية خاصة من باتومي لمجموعتك فقط: سيارتك وسائقك المرشد، ووقت الانطلاق والتوقفات حسب رغبتك. السعر للسيارة، الاستلام من الفندق، والدفع يوم الجولة.",
    badge: "جولات خاصة",
    crumb: "جولات خاصة من باتومي",
    heroTitle: "جولات خاصة من باتومي مع",
    heroHighlight: "سائق مرشد خاص",
    heroSubtitle: "في السيارة مجموعتك فقط. انطلق متى شئت، وتوقف حيث تحب، وابقَ في كل مكان المدة التي تريدها — في كل أنحاء أجاريا وغرب جورجيا.",
    ctaExplore: "الجولات الخاصة",
    ctaCustom: "خطط مساري الخاص",
    waText: "مرحباً! أود التخطيط لجولة خاصة من باتومي.",
    benefitsTitle: "لماذا جولة خاصة؟",
    benefitsDesc: "بلا حافلة مزدحمة ولا جدول ثابت: يومك يسير بإيقاعك.",
    features: [
      { icon: "✨", title: "جدولك الخاص", desc: "اختر وقت الانطلاق، وابقَ أطول حيث يعجبك، وتجاوز ما لا يهمك." },
      { icon: "🚐", title: "سيارة لمجموعتك فقط", desc: "من سيدان لشخصين إلى سبرينتر بـ19 مقعداً للعائلات الكبيرة والشركات." },
      { icon: "🗣️", title: "بلغتك", desc: "سائقون مرشدون يتحدثون العربية أو الجورجية أو الإنجليزية أو الروسية أو التركية." },
      { icon: "🏨", title: "من الباب إلى الباب", desc: "نستلمك من فندقك أو شقتك في باتومي والساحل ونعيدك إليها." },
    ],
    fleetTitle: "اختر سيارتك",
    fleetDesc: "سعر الجولة الخاصة يعتمد على السيارة وليس على عدد الأشخاص.",
    fleet: {
      sedan: { name: "سيدان", desc: "للأزواج والعائلات الصغيرة." },
      jeep: { name: "دفع رباعي / SUV 4×4", desc: "للطرق الجبلية مثل غوديرزي وأجاريا العليا." },
      minivan: { name: "ميني فان", desc: "للعائلات والأصدقاء مع الأمتعة." },
      sprinter: { name: "حافلة سبرينتر", desc: "للمجموعات الكبيرة ورحلات الشركات." },
    },
    passengers: (n) => `حتى ${n} ركاب`,
    toursTitle: "جولات يمكن حجزها كجولة خاصة",
    toursDesc: "تعرض البطاقة سعر الجولة الخاصة للسيارة كاملة.",
    faqs: [
      { q: "ماذا تشمل الجولة الخاصة من باتومي؟", a: "سيارة وسائق مرشد لمجموعتك فقط، والوقود، والاستلام من الفندق. ما يشمله السعر أو لا يشمله أيضاً (تذاكر الدخول، الوجبات) مذكور في صفحة كل جولة." },
      { q: "هل يمكن تغيير التوقفات والمواعيد؟", a: "نعم. تبدأ الجولة الخاصة في الوقت الذي يناسبك، ويمكن إضافة توقفات أو تجاوزها — أخبرنا عند الحجز." },
      { q: "كيف يُحسب سعر الجولة الخاصة؟", a: "للسيارة: السعر يعتمد على السيارة التي تختارها وليس على عدد الركاب. والدفع يوم الجولة." },
      { q: "هل يمكنكم تخطيط مسار غير موجود في الموقع؟", a: "نعم. أخبرنا أين تريد الذهاب وكم من الوقت، وسنرسل لك المسار والسعر." },
    ],
    ctaTitle: "خطط ليومك الخاص",
    ctaText: "أخبرنا بما تريد رؤيته وعدد أفراد مجموعتك، وسنقترح عليك مساراً وسعراً.",
  },
};

export default async function PrivateToursBatumiPage({ params }) {
  const [rawTours, places, { locale }] = await Promise.all([
    getCachedTours(),
    getCachedPlaces().catch(() => []),
    params,
  ]);
  const lang = getRequestLocale(locale);
  const c = CONTENT[lang] || CONTENT.en;
  const ui = landingUi(lang);
  const t = getTranslator(lang);

  // Only tours that can actually be booked as private.
  const privateTours = toTourViews(rawTours, lang, places, t("tourBadges"))
    .filter((tour) => tour.hasPrivate)
    .sort((a, b) => Number(b.isPopular) - Number(a.isPopular))
    .slice(0, 9);

  const pageUrl = `${SITE_URL}/${lang}${PATH}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#itemlist`,
        name: c.toursTitle,
        itemListElement: privateTours.map((tour, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          url: `${SITE_URL}/${lang}${tourPath(tour)}`,
          name: tour.title,
        })),
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

  return (
    <LandingShell active="tours" jsonLd={jsonLd}>
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <nav className="landing-breadcrumbs" aria-label="Breadcrumb">
            <Link href={getLocalizedHref("/", lang)}>{ui.home}</Link>
            <span className="sep">/</span>
            <span>{c.crumb}</span>
          </nav>
          <div className="landing-badge">👑 {c.badge}</div>
          <h1 className="landing-title">
            {c.heroTitle} <span>{c.heroHighlight}</span>
          </h1>
          <p className="landing-subtitle">{c.heroSubtitle}</p>
          <div className="landing-hero-actions">
            <a href="#private-tours-list" className="landing-btn-primary">⭐ {c.ctaExplore}</a>
            <a href={whatsappHref(c.waText)} target="_blank" rel="noopener noreferrer" className="landing-btn-secondary">
              ✏️ {c.ctaCustom}
            </a>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-header">
          <div className="landing-section-tag">{ui.advantagesTag}</div>
          <h2 className="landing-section-title">{c.benefitsTitle}</h2>
          <p className="landing-section-desc">{c.benefitsDesc}</p>
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

      <section className="landing-section" style={{ paddingTop: 0 }}>
        <div className="landing-section-header">
          <div className="landing-section-tag">{ui.fleetTag}</div>
          <h2 className="landing-section-title">{c.fleetTitle}</h2>
          <p className="landing-section-desc">{c.fleetDesc}</p>
        </div>
        <div className="landing-features-grid">
          {VEHICLE_KEYS.map((key) => (
            <div key={key} className="landing-feature-card">
              <div style={{ position: "relative", height: 120, marginBottom: "1rem" }}>
                <Image src={VEHICLES[key].img} alt={c.fleet[key].name} fill sizes="280px" style={{ objectFit: "contain" }} />
              </div>
              <div style={{ color: "var(--gt-primary)", fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                {c.passengers(VEHICLES[key].capacityPax)}
              </div>
              <h3>{c.fleet[key].name}</h3>
              <p>{c.fleet[key].desc}</p>
            </div>
          ))}
        </div>
      </section>

      {privateTours.length > 0 && (
        <section id="private-tours-list" className="landing-section" style={{ paddingTop: 0 }}>
          <div className="landing-section-header">
            <div className="landing-section-tag">{ui.featuredTag}</div>
            <h2 className="landing-section-title">{c.toursTitle}</h2>
            <p className="landing-section-desc">{c.toursDesc}</p>
          </div>
          <TourGrid items={privateTours.map((tour) => ({ tour }))} lang={lang} t={t} />
        </section>
      )}

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
