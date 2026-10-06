import React from "react";
import Link from "next/link";
import LandingShell from "../../components/site/LandingShell";
import TourGrid from "../../components/site/TourGrid";
import { getCachedTours, getCachedPlaces } from "../../lib/server/cachedData";
import { toTourViews } from "../../lib/tourView";
import { getTranslator } from "../../lib/i18n/translate";
import { SITE_URL, getRequestLocale, buildLocalizedMetadata, getLocalizedHref } from "../../lib/siteConfig";
import { tourPath } from "../../lib/slugs";
import { whatsappHref } from "../../lib/shared";
import { landingUi } from "../../lib/landingUi";
import "../../styles/tour-card.css";

const PATH = "/tours-from-batumi";

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

// Facts only: pickup in Batumi, pay on the day, the five working languages.
// The fleet and prices are not described here; the tour cards below carry the
// real prices from Firestore.
const CONTENT = {
  en: {
    metaTitle: "Day Tours & Excursions from Batumi (2026) — Prices & Hotel Pickup | GeorgiaTrips",
    metaDescription: "Guided day trips from Batumi to Martvili canyon, Prometheus cave, Machakhela, Makhuntseti waterfall and more. Hotel pickup in Batumi, no prepayment — pay on the day.",
    badge: "Batumi Excursions & Day Trips",
    crumb: "Tours from Batumi",
    heroTitle: "Day Tours & Excursions from",
    heroHighlight: "Batumi",
    heroSubtitle: "Canyons, waterfalls, mountain villages and stone arch bridges of Adjara and West Georgia — with hotel pickup in Batumi, a local driver-guide and payment on the day of the tour.",
    ctaExplore: "Browse tours",
    ctaContact: "Ask on WhatsApp",
    waText: "Hello! I'd like to ask about tours from Batumi.",
    whyTitle: "Why book your Batumi day trips with us?",
    whyDesc: "A local team based in Batumi (27 Kutaisi St) that runs these routes every week.",
    features: [
      { icon: "🚗", title: "Pickup from your hotel", desc: "We collect you from your hotel or apartment in Batumi, Gonio, Kvariati or Kobuleti and bring you back." },
      { icon: "🗺️", title: "Routes we know by heart", desc: "Arched stone bridges, mountain waterfalls, canyons and family wine cellars — with the stops worth making." },
      { icon: "🗣️", title: "Five languages", desc: "Our team works in Georgian, English, Russian, Turkish and Arabic." },
      { icon: "🛡️", title: "No prepayment", desc: "Send a free booking request; we confirm it by WhatsApp or phone and you pay on the day." },
    ],
    toursTitle: "Day tours departing from Batumi",
    toursDesc: "Real departure dates and prices. Group tours are priced per person, private tours per vehicle.",
    practicalTitle: "Practical tips for day trips from Batumi",
    tips: [
      { q: "What is the best time to leave Batumi?", a: "Most day tours leave between 08:00 and 10:00 so you have full daylight in the mountains and avoid the afternoon heat in summer." },
      { q: "What should I bring?", a: "Comfortable walking shoes, a light jacket (it is cooler in the mountains), sun protection, cash for local tastings, and swimwear in summer if the route includes a canyon or waterfall." },
      { q: "Can the route be changed?", a: "Private tours can follow your own start time, pace and stops. Group tours follow the published itinerary." },
    ],
    faqs: [
      { q: "How do I book a tour from Batumi?", a: "Choose a tour and send the booking form on its page, or message us on WhatsApp. Booking is free; our team confirms by WhatsApp or phone and you pay on the day of the tour." },
      { q: "Where do tours from Batumi start?", a: "From your hotel or address in Batumi and nearby resorts (Gonio, Kvariati, Makhinjauri, Kobuleti). The exact pickup time is confirmed the day before." },
      { q: "What languages do your drivers and guides speak?", a: "Georgian, English, Russian, Turkish and Arabic. Tell us your language when booking." },
      { q: "How much does a day tour from Batumi cost?", a: "Each tour card shows the current price: group tours per person, private tours per vehicle for your whole group. There are no hidden fees; entrance tickets are listed on the tour page when they are not included." },
    ],
    ctaTitle: "Not sure which tour to choose?",
    ctaText: "Tell us your dates and what you like — mountains, sea, wine or history — and we'll suggest a route.",
  },
  ru: {
    metaTitle: "Экскурсии из Батуми (2026) — цены, трансфер от отеля | GeorgiaTrips",
    metaDescription: "Однодневные экскурсии из Батуми: каньон Мартвили, пещера Прометея, Мачахела, водопад Махунцети и другие. Заберём от отеля, без предоплаты — оплата в день тура.",
    badge: "Экскурсии и туры из Батуми",
    crumb: "Туры из Батуми",
    heroTitle: "Однодневные экскурсии и туры из",
    heroHighlight: "Батуми",
    heroSubtitle: "Каньоны, водопады, горные сёла и арочные мосты Аджарии и Западной Грузии — с трансфером от отеля в Батуми, местным водителем-гидом и оплатой в день тура.",
    ctaExplore: "Выбрать тур",
    ctaContact: "Спросить в WhatsApp",
    waText: "Здравствуйте! Хочу узнать об экскурсиях из Батуми.",
    whyTitle: "Почему выбирают наши экскурсии из Батуми?",
    whyDesc: "Местная команда из Батуми (ул. Кутаиси, 27), которая ездит по этим маршрутам каждую неделю.",
    features: [
      { icon: "🚗", title: "Заберём от отеля", desc: "Забираем от отеля или апартаментов в Батуми, Гонио, Квариати или Кобулети и привозим обратно." },
      { icon: "🗺️", title: "Маршруты, которые мы знаем", desc: "Арочные мосты, горные водопады, каньоны и семейные винные погреба — с остановками, которые того стоят." },
      { icon: "🗣️", title: "Пять языков", desc: "Работаем на русском, грузинском, английском, турецком и арабском." },
      { icon: "🛡️", title: "Без предоплаты", desc: "Бесплатная заявка; подтверждаем в WhatsApp или по телефону, оплата — в день тура." },
    ],
    toursTitle: "Экскурсии с выездом из Батуми",
    toursDesc: "Реальные даты выезда и цены. Групповые туры — цена за человека, индивидуальные — за автомобиль.",
    practicalTitle: "Полезные советы для поездок из Батуми",
    tips: [
      { q: "Когда лучше выезжать из Батуми?", a: "Большинство экскурсий выезжают с 08:00 до 10:00 — так хватает светового дня в горах, а летом вы избегаете дневной жары." },
      { q: "Что взять с собой?", a: "Удобную обувь, лёгкую куртку (в горах прохладнее), защиту от солнца, наличные для дегустаций и купальник летом, если в маршруте каньон или водопад." },
      { q: "Можно ли изменить маршрут?", a: "В индивидуальном туре — да: время выезда, темп и остановки по вашему желанию. Групповые туры идут по опубликованной программе." },
    ],
    faqs: [
      { q: "Как забронировать экскурсию из Батуми?", a: "Выберите тур и отправьте форму на его странице или напишите нам в WhatsApp. Бронирование бесплатное: команда подтвердит его в WhatsApp или по телефону, оплата — в день тура." },
      { q: "Откуда начинается экскурсия?", a: "От вашего отеля или адреса в Батуми и соседних курортах (Гонио, Квариати, Махинджаури, Кобулети). Точное время подачи подтверждаем накануне." },
      { q: "На каких языках говорят водители и гиды?", a: "На русском, грузинском, английском, турецком и арабском. Укажите язык при бронировании." },
      { q: "Сколько стоит экскурсия из Батуми?", a: "Актуальная цена указана на карточке каждого тура: групповые — за человека, индивидуальные — за автомобиль на всю компанию. Скрытых платежей нет; входные билеты указаны на странице тура, если они не включены." },
    ],
    ctaTitle: "Не знаете, какой тур выбрать?",
    ctaText: "Напишите даты и что вам интересно — горы, море, вино или история, — и мы предложим маршрут.",
  },
  ka: {
    metaTitle: "ტურები ბათუმიდან (2026) — ფასები და გაყვანა სასტუმროდან | GeorgiaTrips",
    metaDescription: "ერთდღიანი ტურები ბათუმიდან: მარტვილის კანიონი, პრომეთეს მღვიმე, მაჭახელა, მახუნცეთის ჩანჩქერი და სხვა. გაყვანა სასტუმროდან, წინასწარი გადახდის გარეშე — გადახდა ტურის დღეს.",
    badge: "ტურები და ექსკურსიები ბათუმიდან",
    crumb: "ტურები ბათუმიდან",
    heroTitle: "ერთდღიანი ტურები და ექსკურსიები",
    heroHighlight: "ბათუმიდან",
    heroSubtitle: "აჭარისა და დასავლეთ საქართველოს კანიონები, ჩანჩქერები, მთის სოფლები და თაღოვანი ხიდები — ბათუმში სასტუმროდან გაყვანით, ადგილობრივი მძღოლ-გიდით და გადახდით ტურის დღეს.",
    ctaExplore: "ტურების ნახვა",
    ctaContact: "WhatsApp-ზე კითხვა",
    waText: "გამარჯობა! მაინტერესებს ტურები ბათუმიდან.",
    whyTitle: "რატომ GeorgiaTrips-ის ტურები ბათუმიდან?",
    whyDesc: "ბათუმში დაფუძნებული ადგილობრივი გუნდი (ქუთაისის ქ. 27), რომელიც ამ მარშრუტებზე ყოველკვირა დადის.",
    features: [
      { icon: "🚗", title: "გაყვანა სასტუმროდან", desc: "მოგაკითხავთ სასტუმროში ან აპარტამენტში ბათუმში, გონიოში, კვარიათში ან ქობულეთში და დაგაბრუნებთ უკან." },
      { icon: "🗺️", title: "ზეპირად ნაცნობი მარშრუტები", desc: "თაღოვანი ხიდები, მთის ჩანჩქერები, კანიონები და საოჯახო მარნები — ღირსეული გაჩერებებით." },
      { icon: "🗣️", title: "ხუთი ენა", desc: "ვმუშაობთ ქართულ, ინგლისურ, რუსულ, თურქულ და არაბულ ენებზე." },
      { icon: "🛡️", title: "წინასწარი გადახდის გარეშე", desc: "ჯავშნის მოთხოვნა უფასოა; დაგიდასტურებთ WhatsApp-ით ან ტელეფონით, გადახდა — ტურის დღეს." },
    ],
    toursTitle: "ტურები ბათუმიდან გასვლით",
    toursDesc: "რეალური თარიღები და ფასები. ჯგუფური ტური — ფასი ერთ ადამიანზე, ინდივიდუალური — მთელ ავტომობილზე.",
    practicalTitle: "პრაქტიკული რჩევები ბათუმიდან მოგზაურობისთვის",
    tips: [
      { q: "როდის ჯობია ბათუმიდან გასვლა?", a: "ტურების უმეტესობა 08:00-დან 10:00-მდე გადის — მთაში დღის სინათლე სრულად გეყოფათ, ზაფხულში კი შუადღის სიცხეს აარიდებთ თავს." },
      { q: "რა წავიღოთ თან?", a: "კომფორტული ფეხსაცმელი, მსუბუქი ქურთუკი (მთაში უფრო გრილა), მზისგან დამცავი, ნაღდი ფული დეგუსტაციისთვის და ზაფხულში საცურაო კოსტიუმი, თუ მარშრუტში კანიონი ან ჩანჩქერია." },
      { q: "შეიძლება მარშრუტის შეცვლა?", a: "ინდივიდუალურ ტურზე — დიახ: გასვლის დრო, ტემპი და გაჩერებები თქვენი სურვილით. ჯგუფური ტური გამოქვეყნებული პროგრამით მიდის." },
    ],
    faqs: [
      { q: "როგორ დავჯავშნო ტური ბათუმიდან?", a: "აირჩიეთ ტური და გამოგზავნეთ ფორმა მის გვერდზე, ან მოგვწერეთ WhatsApp-ზე. ჯავშანი უფასოა: გუნდი დაგიდასტურებთ WhatsApp-ით ან ტელეფონით, გადახდა ხდება ტურის დღეს." },
      { q: "საიდან იწყება ტური?", a: "თქვენი სასტუმროდან ან მისამართიდან ბათუმსა და მიმდებარე კურორტებზე (გონიო, კვარიათი, მახინჯაური, ქობულეთი). ზუსტ დროს წინა დღეს გიდასტურებთ." },
      { q: "რომელ ენებზე საუბრობენ მძღოლები და გიდები?", a: "ქართულ, ინგლისურ, რუსულ, თურქულ და არაბულ ენებზე. ჯავშნისას მიუთითეთ სასურველი ენა." },
      { q: "რა ღირს ერთდღიანი ტური ბათუმიდან?", a: "მიმდინარე ფასი ყველა ტურის ბარათზეა: ჯგუფური — ერთ ადამიანზე, ინდივიდუალური — მთელ ავტომობილზე. ფარული გადასახადები არ არის; შესასვლელი ბილეთები ტურის გვერდზეა მითითებული, თუ ფასში არ შედის." },
    ],
    ctaTitle: "ვერ წყვეტთ, რომელი ტური აირჩიოთ?",
    ctaText: "მოგვწერეთ თარიღები და რა გაინტერესებთ — მთა, ზღვა, ღვინო თუ ისტორია — და მარშრუტს შემოგთავაზებთ.",
  },
  tr: {
    metaTitle: "Batum'dan Günübirlik Turlar (2026) — Fiyatlar ve Otelden Alış | GeorgiaTrips",
    metaDescription: "Batum'dan rehberli günübirlik turlar: Martvili kanyonu, Prometheus mağarası, Maçahela, Makhuntseti şelalesi ve daha fazlası. Otelden alış, ön ödeme yok — ödeme tur günü.",
    badge: "Batum Gezileri ve Günübirlik Turlar",
    crumb: "Batum'dan Turlar",
    heroTitle: "Batum'dan",
    heroHighlight: "günübirlik turlar ve geziler",
    heroSubtitle: "Acara ve Batı Gürcistan'ın kanyonları, şelaleleri, dağ köyleri ve taş kemer köprüleri — Batum'da otelden alış, yerel şoför-rehber ve tur günü ödeme ile.",
    ctaExplore: "Turlara göz atın",
    ctaContact: "WhatsApp'tan sorun",
    waText: "Merhaba! Batum'dan turlar hakkında bilgi almak istiyorum.",
    whyTitle: "Batum günübirlik turlarınız neden bizimle?",
    whyDesc: "Batum merkezli (Kutaisi Sk. 27) yerel ekibimiz bu rotalarda her hafta yolda.",
    features: [
      { icon: "🚗", title: "Otelden alış", desc: "Batum, Gonio, Kvariati veya Kobuleti'deki otelinizden ya da dairenizden alır, geri bırakırız." },
      { icon: "🗺️", title: "Ezbere bildiğimiz rotalar", desc: "Taş kemer köprüler, dağ şelaleleri, kanyonlar ve aile şarap mahzenleri — görülmeye değer duraklarla." },
      { icon: "🗣️", title: "Beş dil", desc: "Türkçe, Gürcüce, İngilizce, Rusça ve Arapça hizmet veriyoruz." },
      { icon: "🛡️", title: "Ön ödeme yok", desc: "Ücretsiz rezervasyon talebi gönderin; WhatsApp veya telefonla onaylarız, ödeme tur günü yapılır." },
    ],
    toursTitle: "Batum'dan kalkan günübirlik turlar",
    toursDesc: "Gerçek kalkış tarihleri ve fiyatlar. Grup turları kişi başı, özel turlar araç başı fiyatlandırılır.",
    practicalTitle: "Batum'dan günübirlik geziler için pratik bilgiler",
    tips: [
      { q: "Batum'dan ne zaman yola çıkmalı?", a: "Turların çoğu 08:00–10:00 arasında hareket eder; böylece dağlarda gün ışığından tam yararlanır, yazın öğle sıcağından kaçınırsınız." },
      { q: "Yanımda ne getirmeliyim?", a: "Rahat yürüyüş ayakkabısı, ince bir ceket (dağlar daha serindir), güneş koruması, tadımlar için nakit para ve rotada kanyon veya şelale varsa yazın mayo." },
      { q: "Rota değiştirilebilir mi?", a: "Özel turlarda evet: kalkış saati, tempo ve duraklar size göre ayarlanır. Grup turları yayınlanan programı izler." },
    ],
    faqs: [
      { q: "Batum'dan tur nasıl rezerve edilir?", a: "Bir tur seçip sayfasındaki formu gönderin ya da bize WhatsApp'tan yazın. Rezervasyon ücretsizdir; ekibimiz WhatsApp veya telefonla onaylar, ödeme tur günü yapılır." },
      { q: "Batum'dan turlar nereden başlar?", a: "Batum ve çevre tatil beldelerindeki (Gonio, Kvariati, Mahincauri, Kobuleti) otelinizden veya adresinizden. Kesin alış saati bir gün önce onaylanır." },
      { q: "Şoförler ve rehberler hangi dilleri konuşuyor?", a: "Türkçe, Gürcüce, İngilizce, Rusça ve Arapça. Rezervasyon sırasında dilinizi belirtin." },
      { q: "Batum'dan günübirlik tur ne kadar?", a: "Her tur kartında güncel fiyat yazar: grup turları kişi başı, özel turlar tüm grubunuz için araç başı. Gizli ücret yoktur; dahil olmayan giriş biletleri tur sayfasında belirtilir." },
    ],
    ctaTitle: "Hangi turu seçeceğinizden emin değil misiniz?",
    ctaText: "Tarihlerinizi ve ilgi alanlarınızı — dağ, deniz, şarap ya da tarih — yazın, size bir rota önerelim.",
  },
  ar: {
    metaTitle: "جولات يومية من باتومي (2026) — الأسعار والاستلام من الفندق | GeorgiaTrips",
    metaDescription: "رحلات يومية مع مرشد من باتومي إلى وادي مارتفيلي وكهف بروميثيوس وماتشاخيلا وشلال ماخونتسيتي وغيرها. استلام من الفندق في باتومي، بدون دفع مسبق — الدفع يوم الجولة.",
    badge: "رحلات وجولات يومية من باتومي",
    crumb: "جولات من باتومي",
    heroTitle: "جولات ورحلات يومية من",
    heroHighlight: "باتومي",
    heroSubtitle: "أودية وشلالات وقرى جبلية وجسور حجرية مقوسة في أجاريا وغرب جورجيا — مع الاستلام من فندقك في باتومي وسائق مرشد محلي والدفع يوم الجولة.",
    ctaExplore: "تصفح الجولات",
    ctaContact: "اسألنا عبر واتساب",
    waText: "مرحباً! أود الاستفسار عن الجولات من باتومي.",
    whyTitle: "لماذا تحجز جولاتك من باتومي معنا؟",
    whyDesc: "فريق محلي مقره باتومي (27 شارع كوتايسي) يسلك هذه الطرق كل أسبوع.",
    features: [
      { icon: "🚗", title: "الاستلام من الفندق", desc: "نستلمك من فندقك أو شقتك في باتومي أو غونيو أو كفارياتي أو كوبوليتي ونعيدك إليها." },
      { icon: "🗺️", title: "طرق نعرفها جيداً", desc: "جسور حجرية مقوسة وشلالات جبلية وأودية ومعاصر نبيذ عائلية — مع التوقفات التي تستحق الزيارة." },
      { icon: "🗣️", title: "خمس لغات", desc: "نعمل بالعربية والجورجية والإنجليزية والروسية والتركية." },
      { icon: "🛡️", title: "بدون دفع مسبق", desc: "أرسل طلب حجز مجاني؛ نؤكده عبر واتساب أو الهاتف، والدفع يوم الجولة." },
    ],
    toursTitle: "جولات يومية تنطلق من باتومي",
    toursDesc: "مواعيد انطلاق وأسعار حقيقية. الجولات الجماعية بسعر للشخص، والجولات الخاصة بسعر للسيارة.",
    practicalTitle: "نصائح عملية للرحلات اليومية من باتومي",
    tips: [
      { q: "ما أفضل وقت للانطلاق من باتومي؟", a: "تنطلق معظم الجولات بين الساعة 08:00 و10:00 لتستفيد من ضوء النهار كاملاً في الجبال وتتجنب حر الظهيرة صيفاً." },
      { q: "ماذا أحضر معي؟", a: "حذاء مريح للمشي، وسترة خفيفة (الجو أبرد في الجبال)، وواقي شمس، ونقود للتذوق، وملابس سباحة صيفاً إذا كان المسار يشمل وادياً أو شلالاً." },
      { q: "هل يمكن تعديل المسار؟", a: "في الجولات الخاصة نعم: وقت الانطلاق والوتيرة والتوقفات حسب رغبتك. أما الجولات الجماعية فتتبع البرنامج المنشور." },
    ],
    faqs: [
      { q: "كيف أحجز جولة من باتومي؟", a: "اختر جولة وأرسل نموذج الحجز في صفحتها أو راسلنا عبر واتساب. الحجز مجاني؛ يؤكده فريقنا عبر واتساب أو الهاتف، والدفع يوم الجولة." },
      { q: "من أين تبدأ الجولات من باتومي؟", a: "من فندقك أو عنوانك في باتومي والمنتجعات القريبة (غونيو، كفارياتي، ماخينجاوري، كوبوليتي). نؤكد وقت الاستلام الدقيق في اليوم السابق." },
      { q: "ما اللغات التي يتحدثها السائقون والمرشدون؟", a: "العربية والجورجية والإنجليزية والروسية والتركية. أخبرنا بلغتك عند الحجز." },
      { q: "كم تكلفة الجولة اليومية من باتومي؟", a: "السعر الحالي مذكور على بطاقة كل جولة: الجماعية للشخص، والخاصة للسيارة لكامل مجموعتك. لا رسوم خفية؛ وتذاكر الدخول غير المشمولة مذكورة في صفحة الجولة." },
    ],
    ctaTitle: "لست متأكداً أي جولة تختار؟",
    ctaText: "أخبرنا بتواريخك واهتماماتك — جبال أو بحر أو نبيذ أو تاريخ — وسنقترح عليك مساراً.",
  },
};

export default async function ToursFromBatumiPage({ params }) {
  const [rawTours, places, { locale }] = await Promise.all([
    getCachedTours(),
    getCachedPlaces().catch(() => []),
    params,
  ]);
  const lang = getRequestLocale(locale);
  const c = CONTENT[lang] || CONTENT.en;
  const ui = landingUi(lang);
  const t = getTranslator(lang);

  // The team is based in Batumi, so every day tour departs from there.
  const dayTours = toTourViews(rawTours, lang, places, t("tourBadges"))
    .filter((tour) => !tour.isMultiDay)
    .sort((a, b) => Number(b.isPopular) - Number(a.isPopular));
  const displayTours = dayTours.slice(0, 9);

  const pageUrl = `${SITE_URL}/${lang}${PATH}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#itemlist`,
        name: c.toursTitle,
        itemListElement: displayTours.map((tour, idx) => ({
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
          <div className="landing-badge">⭐ {c.badge}</div>
          <h1 className="landing-title">
            {c.heroTitle} <span>{c.heroHighlight}</span>
          </h1>
          <p className="landing-subtitle">{c.heroSubtitle}</p>
          <div className="landing-hero-actions">
            <a href="#tours-list" className="landing-btn-primary">🔍 {c.ctaExplore}</a>
            <a href={whatsappHref(c.waText)} target="_blank" rel="noopener noreferrer" className="landing-btn-secondary">
              💬 {c.ctaContact}
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

      {displayTours.length > 0 && (
        <section id="tours-list" className="landing-section" style={{ paddingTop: 0 }}>
          <div className="landing-section-header">
            <div className="landing-section-tag">{ui.featuredTag}</div>
            <h2 className="landing-section-title">{c.toursTitle}</h2>
            <p className="landing-section-desc">{c.toursDesc}</p>
          </div>
          <TourGrid items={displayTours.map((tour) => ({ tour }))} lang={lang} t={t} />
        </section>
      )}

      <section className="landing-section" style={{ paddingTop: 0 }}>
        <div className="landing-section-header">
          <div className="landing-section-tag">{ui.tipsTag}</div>
          <h2 className="landing-section-title">{c.practicalTitle}</h2>
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
