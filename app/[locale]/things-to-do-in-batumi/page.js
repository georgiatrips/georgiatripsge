import React from "react";
import Link from "next/link";
import Image from "next/image";
import LandingShell from "../../components/site/LandingShell";
import { getCachedPlaces } from "../../lib/server/cachedData";
import { asLocalizedText } from "../../lib/toursFirestore";
import { SITE_URL, getRequestLocale, buildLocalizedMetadata, getLocalizedHref } from "../../lib/siteConfig";
import { placePath } from "../../lib/slugs";
import { formatRegionName } from "../../lib/placesMeta";
import { landingUi } from "../../lib/landingUi";

const PATH = "/things-to-do-in-batumi";

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

const CONTENT = {
  en: {
    metaTitle: "Things to Do in Batumi (2026): Top Sights & Local Tips | GeorgiaTrips",
    metaDescription: "What to see and do in Batumi: the Boulevard, Botanical Garden, Gonio fortress, Argo cable car, Adjarian khachapuri and Mtirala National Park — with tips from a local Batumi team.",
    badge: "Batumi travel guide",
    crumb: "Things to Do in Batumi",
    heroTitle: "Things to do in",
    heroHighlight: "Batumi",
    heroSubtitle: "The seaside Boulevard, a Roman fortress, a botanical garden on a cliff above the sea and the mountains of Adjara an hour away — a short guide from our team in Batumi.",
    ctaAttractions: "Top experiences",
    ctaTours: "Day tours from Batumi",
    guideTitle: "Six things not to miss in Batumi",
    guideDesc: "What we recommend to friends visiting for the first time.",
    experiences: [
      { icon: "🌊", title: "Walk or cycle the Boulevard", desc: "About 7 km of seaside promenade with palms, beaches, cafés and the moving Ali and Nino sculpture at its northern end." },
      { icon: "🌿", title: "Visit the Botanical Garden", desc: "Terraced gardens on the Green Cape north of the city, with plants from many climate zones and views straight down to the sea." },
      { icon: "🏰", title: "See Gonio-Apsaros fortress", desc: "Roman and Byzantine walls about 12 km south of the centre, linked by legend to the Argonauts." },
      { icon: "🚠", title: "Take the Argo cable car at sunset", desc: "The cabins climb from the city to Anuria hill for a view over Batumi bay and the Black Sea." },
      { icon: "🥟", title: "Try Adjarian khachapuri", desc: "The boat-shaped cheese bread with butter and an egg yolk on top — Batumi's signature dish." },
      { icon: "🌲", title: "Hike in Mtirala National Park", desc: "One of the rainiest corners of Georgia: green forest trails, mountain streams and a waterfall, about 40 minutes from the city." },
    ],
    placesTitle: "Places to see in Adjara",
    placesDesc: "Open any place for photos, background and the tours that stop there.",
    viewPlace: "Open",
    allPlaces: "All places",
    faqs: [
      { q: "How many days do you need in Batumi?", a: "Two to three days cover the city, the Boulevard and the Botanical Garden, plus one day trip into mountain Adjara or to Martvili Canyon." },
      { q: "Is Batumi walkable?", a: "Yes. Old Batumi, Europe Square, Piazza and the Boulevard are flat and close together." },
      { q: "When is the best time to visit Batumi?", a: "May to October. July and August are the warmest beach months; September and October are milder and bring the grape and tangerine harvests." },
      { q: "What can I do near Batumi in one day?", a: "Mountain Adjara (Makhuntseti waterfall, arched stone bridges, Machakhela), Martvili Canyon and the black-sand beaches of Ureki are all day trips from Batumi." },
    ],
    ctaTitle: "Want to see more than the city?",
    ctaText: "Our day tours leave from your hotel in Batumi to the waterfalls, canyons and villages of West Georgia.",
    ctaButton: "Day tours from Batumi",
  },
  ru: {
    metaTitle: "Что посмотреть в Батуми (2026): главные места и советы | GeorgiaTrips",
    metaDescription: "Что посмотреть и чем заняться в Батуми: Бульвар, Ботанический сад, крепость Гонио, канатная дорога Арго, аджарский хачапури и парк Мтирала — советы от местной команды.",
    badge: "Путеводитель по Батуми",
    crumb: "Что посмотреть в Батуми",
    heroTitle: "Что посмотреть в",
    heroHighlight: "Батуми",
    heroSubtitle: "Приморский Бульвар, римская крепость, ботанический сад на скале над морем и горы Аджарии в часе езды — короткий гид от нашей команды из Батуми.",
    ctaAttractions: "Главное",
    ctaTours: "Экскурсии из Батуми",
    guideTitle: "Шесть вещей, которые нельзя пропустить",
    guideDesc: "То, что мы советуем друзьям, впервые приезжающим в Батуми.",
    experiences: [
      { icon: "🌊", title: "Прогулка по Бульвару", desc: "Около 7 км приморской набережной с пальмами, пляжами, кафе и движущейся скульптурой «Али и Нино» в северной части." },
      { icon: "🌿", title: "Ботанический сад", desc: "Террасы на Зелёном мысе к северу от города, растения разных климатических зон и виды прямо на море." },
      { icon: "🏰", title: "Крепость Гонио-Апсарос", desc: "Римские и византийские стены примерно в 12 км к югу от центра, связанные с легендой об аргонавтах." },
      { icon: "🚠", title: "Канатная дорога «Арго» на закате", desc: "Кабинки поднимаются из города на холм Анурия — вид на Батумскую бухту и Чёрное море." },
      { icon: "🥟", title: "Аджарский хачапури", desc: "Хлеб-лодочка с сыром, маслом и желтком — главное блюдо Батуми." },
      { icon: "🌲", title: "Парк Мтирала", desc: "Один из самых дождливых уголков Грузии: лесные тропы, горные ручьи и водопад примерно в 40 минутах от города." },
    ],
    placesTitle: "Места Аджарии",
    placesDesc: "Откройте место, чтобы увидеть фото, историю и туры, которые туда заезжают.",
    viewPlace: "Открыть",
    allPlaces: "Все места",
    faqs: [
      { q: "Сколько дней нужно на Батуми?", a: "Два-три дня: город, Бульвар и Ботанический сад плюс одна поездка в горную Аджарию или к каньону Мартвили." },
      { q: "Удобно ли гулять по Батуми пешком?", a: "Да. Старый Батуми, площадь Европы, Пьяцца и Бульвар — ровные и рядом друг с другом." },
      { q: "Когда лучше ехать в Батуми?", a: "С мая по октябрь. Июль и август — самые тёплые пляжные месяцы; в сентябре и октябре мягче и время сбора винограда и мандаринов." },
      { q: "Куда съездить из Батуми на один день?", a: "Горная Аджария (водопад Махунцети, арочные мосты, Мачахела), каньон Мартвили и пляжи Уреки с чёрным песком — всё это однодневные поездки из Батуми." },
    ],
    ctaTitle: "Хотите увидеть больше, чем город?",
    ctaText: "Наши экскурсии выезжают от вашего отеля в Батуми к водопадам, каньонам и сёлам Западной Грузии.",
    ctaButton: "Экскурсии из Батуми",
  },
  ka: {
    metaTitle: "რა ვნახოთ ბათუმში (2026): მთავარი ადგილები და რჩევები | GeorgiaTrips",
    metaDescription: "რა ვნახოთ და რა გავაკეთოთ ბათუმში: ბულვარი, ბოტანიკური ბაღი, გონიოს ციხე, საბაგირო „არგო“, აჭარული ხაჭაპური და მტირალას პარკი — რჩევები ბათუმელი გუნდისგან.",
    badge: "ბათუმის გზამკვლევი",
    crumb: "რა ვნახოთ ბათუმში",
    heroTitle: "რა ვნახოთ",
    heroHighlight: "ბათუმში",
    heroSubtitle: "ზღვისპირა ბულვარი, რომაული ციხე, ზღვაზე გადმოკიდებული ბოტანიკური ბაღი და მთიანი აჭარა ერთ საათში — მოკლე გზამკვლევი ჩვენი ბათუმელი გუნდისგან.",
    ctaAttractions: "მთავარი",
    ctaTours: "ტურები ბათუმიდან",
    guideTitle: "ექვსი რამ, რაც ბათუმში არ უნდა გამოტოვოთ",
    guideDesc: "რასაც მეგობრებს ვურჩევთ, როცა პირველად ჩამოდიან.",
    experiences: [
      { icon: "🌊", title: "ბულვარზე სეირნობა", desc: "დაახლოებით 7 კმ ზღვისპირა სასეირნო ზოლი პალმებით, პლაჟებით, კაფეებით და მოძრავი ქანდაკებით „ალი და ნინო“." },
      { icon: "🌿", title: "ბოტანიკური ბაღი", desc: "ტერასები მწვანე კონცხზე, ქალაქის ჩრდილოეთით — სხვადასხვა კლიმატური ზონის მცენარეები და ზღვის ხედი." },
      { icon: "🏰", title: "გონიო-აფსაროსის ციხე", desc: "რომაული და ბიზანტიური კედლები ცენტრიდან დაახლოებით 12 კმ-ში სამხრეთით, არგონავტების ლეგენდასთან დაკავშირებული." },
      { icon: "🚠", title: "საბაგირო „არგო“ მზის ჩასვლისას", desc: "კაბინები ქალაქიდან ანურიას გორაზე ადის — ხედი ბათუმის ყურესა და შავ ზღვაზე." },
      { icon: "🥟", title: "აჭარული ხაჭაპური", desc: "ნავის ფორმის ყველიანი პური კარაქითა და კვერცხის გულით — ბათუმის მთავარი კერძი." },
      { icon: "🌲", title: "მტირალას ეროვნული პარკი", desc: "საქართველოს ერთ-ერთი ყველაზე წვიმიანი კუთხე: ტყის ბილიკები, მთის ნაკადულები და ჩანჩქერი ქალაქიდან დაახლოებით 40 წუთში." },
    ],
    placesTitle: "სანახავი ადგილები აჭარაში",
    placesDesc: "გახსენით ადგილი ფოტოების, ისტორიისა და იმ ტურების სანახავად, რომლებიც იქ ჩერდება.",
    viewPlace: "გახსნა",
    allPlaces: "ყველა ადგილი",
    faqs: [
      { q: "რამდენი დღე სჭირდება ბათუმს?", a: "ორი-სამი დღე: ქალაქი, ბულვარი და ბოტანიკური ბაღი, პლუს ერთი ტური მთიან აჭარაში ან მარტვილის კანიონში." },
      { q: "მოსახერხებელია ბათუმში ფეხით სიარული?", a: "დიახ. ძველი ბათუმი, ევროპის მოედანი, პიაცა და ბულვარი ერთმანეთთან ახლოსაა და ვაკეზე მდებარეობს." },
      { q: "როდის ჯობია ბათუმში ჩამოსვლა?", a: "მაისიდან ოქტომბრამდე. ივლისი და აგვისტო ყველაზე თბილი საპლაჟო თვეებია; სექტემბერი და ოქტომბერი უფრო რბილია — რთველისა და მანდარინის კრეფის დროა." },
      { q: "სად წავიდეთ ბათუმიდან ერთი დღით?", a: "მთიანი აჭარა (მახუნცეთის ჩანჩქერი, თაღოვანი ხიდები, მაჭახელა), მარტვილის კანიონი და ურეკის შავი ქვიშის პლაჟები — ყველა ერთდღიანი მოგზაურობაა ბათუმიდან." },
    ],
    ctaTitle: "გსურთ ქალაქზე მეტის ნახვა?",
    ctaText: "ჩვენი ტურები ბათუმში თქვენი სასტუმროდან გადის დასავლეთ საქართველოს ჩანჩქერებთან, კანიონებსა და სოფლებში.",
    ctaButton: "ტურები ბათუმიდან",
  },
  tr: {
    metaTitle: "Batum'da Yapılacak Şeyler (2026): Gezilecek Yerler ve İpuçları | GeorgiaTrips",
    metaDescription: "Batum'da ne görülür, ne yapılır: sahil bulvarı, Botanik Bahçesi, Gonio kalesi, Argo teleferiği, Acara haçapurisi ve Mtirala Milli Parkı — Batumlu yerel ekipten ipuçları.",
    badge: "Batum gezi rehberi",
    crumb: "Batum'da Yapılacak Şeyler",
    heroTitle: "Batum'da",
    heroHighlight: "gezilecek yerler ve yapılacaklar",
    heroSubtitle: "Sahil bulvarı, bir Roma kalesi, denize bakan bir yamaçtaki botanik bahçesi ve bir saat uzaklıktaki Acara dağları — Batum'daki ekibimizden kısa bir rehber.",
    ctaAttractions: "Öne çıkanlar",
    ctaTours: "Batum'dan günübirlik turlar",
    guideTitle: "Batum'da kaçırılmaması gereken altı şey",
    guideDesc: "İlk kez gelen arkadaşlarımıza önerdiklerimiz.",
    experiences: [
      { icon: "🌊", title: "Sahil bulvarında yürüyüş veya bisiklet", desc: "Palmiyeler, plajlar, kafeler ve kuzey ucundaki hareketli Ali ve Nino heykeliyle yaklaşık 7 km'lik sahil yolu." },
      { icon: "🌿", title: "Botanik Bahçesi", desc: "Şehrin kuzeyindeki Yeşil Burun'da teraslı bahçeler; farklı iklim bölgelerinden bitkiler ve doğrudan denize bakan manzaralar." },
      { icon: "🏰", title: "Gonio-Apsaros Kalesi", desc: "Merkezin yaklaşık 12 km güneyinde, Argonotlar efsanesiyle anılan Roma ve Bizans surları." },
      { icon: "🚠", title: "Gün batımında Argo teleferiği", desc: "Kabinler şehirden Anuria tepesine çıkar; Batum körfezi ve Karadeniz manzarası." },
      { icon: "🥟", title: "Acara haçapurisi", desc: "Üzerinde tereyağı ve yumurta sarısı olan kayık şeklindeki peynirli ekmek — Batum'un imza lezzeti." },
      { icon: "🌲", title: "Mtirala Milli Parkı'nda yürüyüş", desc: "Gürcistan'ın en yağışlı köşelerinden biri: orman patikaları, dağ dereleri ve şehirden yaklaşık 40 dakikada bir şelale." },
    ],
    placesTitle: "Acara'da görülecek yerler",
    placesDesc: "Fotoğraflar, tarihçe ve orada duran turlar için bir yeri açın.",
    viewPlace: "Aç",
    allPlaces: "Tüm yerler",
    faqs: [
      { q: "Batum için kaç gün gerekir?", a: "İki üç gün: şehir, sahil bulvarı ve Botanik Bahçesi, artı dağlık Acara'ya veya Martvili Kanyonu'na bir günübirlik gezi." },
      { q: "Batum yürüyerek gezilebilir mi?", a: "Evet. Eski Batum, Avrupa Meydanı, Piazza ve sahil bulvarı düzdür ve birbirine yakındır." },
      { q: "Batum'a ne zaman gidilmeli?", a: "Mayıs'tan Ekim'e kadar. Temmuz ve Ağustos en sıcak plaj aylarıdır; Eylül ve Ekim daha ılımandır, üzüm ve mandalina hasadı zamanıdır." },
      { q: "Batum'dan bir günde nereye gidilir?", a: "Dağlık Acara (Makhuntseti şelalesi, taş kemer köprüler, Maçahela), Martvili Kanyonu ve Ureki'nin siyah kumlu plajları Batum'dan günübirlik gezilerdir." },
    ],
    ctaTitle: "Şehirden fazlasını görmek ister misiniz?",
    ctaText: "Günübirlik turlarımız Batum'daki otelinizden Batı Gürcistan'ın şelalelerine, kanyonlarına ve köylerine gider.",
    ctaButton: "Batum'dan günübirlik turlar",
  },
  ar: {
    metaTitle: "أفضل الأنشطة في باتومي (2026): معالم ونصائح محلية | GeorgiaTrips",
    metaDescription: "ماذا ترى وتفعل في باتومي: الكورنيش والحديقة النباتية وقلعة غونيو وتلفريك أرغو والخاتشابوري الأجاري ومنتزه متيرالا — نصائح من فريق محلي في باتومي.",
    badge: "دليل باتومي السياحي",
    crumb: "ماذا تفعل في باتومي",
    heroTitle: "أفضل الأنشطة في",
    heroHighlight: "باتومي",
    heroSubtitle: "الكورنيش البحري وقلعة رومانية وحديقة نباتية على منحدر فوق البحر وجبال أجاريا على بعد ساعة — دليل قصير من فريقنا في باتومي.",
    ctaAttractions: "أبرز التجارب",
    ctaTours: "جولات يومية من باتومي",
    guideTitle: "ستة أشياء لا تفوّتها في باتومي",
    guideDesc: "ما ننصح به أصدقاءنا في زيارتهم الأولى.",
    experiences: [
      { icon: "🌊", title: "المشي أو ركوب الدراجة على الكورنيش", desc: "نحو 7 كم من الممشى البحري مع النخيل والشواطئ والمقاهي وتمثال علي ونينو المتحرك في طرفه الشمالي." },
      { icon: "🌿", title: "الحديقة النباتية", desc: "حدائق مدرجة على الرأس الأخضر شمال المدينة، بنباتات من مناطق مناخية مختلفة وإطلالات مباشرة على البحر." },
      { icon: "🏰", title: "قلعة غونيو-أبساروس", desc: "أسوار رومانية وبيزنطية على بعد نحو 12 كم جنوب المركز، ترتبط بأسطورة الأرغونوت." },
      { icon: "🚠", title: "تلفريك أرغو عند الغروب", desc: "تصعد العربات من المدينة إلى تلة أنوريا لإطلالة على خليج باتومي والبحر الأسود." },
      { icon: "🥟", title: "تذوق الخاتشابوري الأجاري", desc: "خبز الجبن على شكل قارب مع الزبدة وصفار البيض — الطبق الأشهر في باتومي." },
      { icon: "🌲", title: "المشي في منتزه متيرالا الوطني", desc: "من أكثر بقاع جورجيا مطراً: مسارات غابات وجداول جبلية وشلال على بعد نحو 40 دقيقة من المدينة." },
    ],
    placesTitle: "أماكن تستحق الزيارة في أجاريا",
    placesDesc: "افتح أي مكان لرؤية الصور والتاريخ والجولات التي تتوقف فيه.",
    viewPlace: "فتح",
    allPlaces: "كل الأماكن",
    faqs: [
      { q: "كم يوماً تحتاج في باتومي؟", a: "يومان إلى ثلاثة: المدينة والكورنيش والحديقة النباتية، مع رحلة يومية إلى أجاريا الجبلية أو وادي مارتفيلي." },
      { q: "هل يسهل التنقل في باتومي سيراً؟", a: "نعم. باتومي القديمة وساحة أوروبا وبياتسا والكورنيش أماكن مستوية وقريبة من بعضها." },
      { q: "ما أفضل وقت لزيارة باتومي؟", a: "من مايو إلى أكتوبر. يوليو وأغسطس أدفأ أشهر الشاطئ؛ وسبتمبر وأكتوبر ألطف ويشهدان قطاف العنب واليوسفي." },
      { q: "إلى أين أذهب من باتومي في يوم واحد؟", a: "أجاريا الجبلية (شلال ماخونتسيتي والجسور الحجرية المقوسة وماتشاخيلا) ووادي مارتفيلي وشواطئ الرمال السوداء في أوريكي — كلها رحلات يومية من باتومي." },
    ],
    ctaTitle: "تريد أن ترى أكثر من المدينة؟",
    ctaText: "تنطلق جولاتنا اليومية من فندقك في باتومي إلى شلالات وأودية وقرى غرب جورجيا.",
    ctaButton: "جولات يومية من باتومي",
  },
};

export default async function ThingsToDoInBatumiPage({ params }) {
  const [rawPlaces, { locale }] = await Promise.all([getCachedPlaces().catch(() => []), params]);
  const lang = getRequestLocale(locale);
  const c = CONTENT[lang] || CONTENT.en;
  const ui = landingUi(lang);

  // Places in Adjara, popular ones first.
  const displayPlaces = (rawPlaces || [])
    .filter((p) => p?.id && String(p.region || "").trim() === "აჭარა")
    .sort((a, b) => Number(Boolean(b.isPopular)) - Number(Boolean(a.isPopular)))
    .slice(0, 9)
    .map((p) => ({
      ...p,
      titleText: asLocalizedText(p.title, lang) || asLocalizedText(p.title, "en"),
      descText: asLocalizedText(p.desc, lang) || asLocalizedText(p.desc, "en"),
    }));

  const pageUrl = `${SITE_URL}/${lang}${PATH}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#itemlist`,
        name: c.placesTitle,
        itemListElement: displayPlaces.map((p, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          url: `${SITE_URL}/${lang}${placePath(p)}`,
          name: p.titleText,
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
    <LandingShell active="places" jsonLd={jsonLd}>
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <nav className="landing-breadcrumbs" aria-label="Breadcrumb">
            <Link href={getLocalizedHref("/", lang)}>{ui.home}</Link>
            <span className="sep">/</span>
            <span>{c.crumb}</span>
          </nav>
          <div className="landing-badge">🗺️ {c.badge}</div>
          <h1 className="landing-title">
            {c.heroTitle} <span>{c.heroHighlight}</span>
          </h1>
          <p className="landing-subtitle">{c.heroSubtitle}</p>
          <div className="landing-hero-actions">
            <a href="#experiences" className="landing-btn-primary">🌟 {c.ctaAttractions}</a>
            <Link href={getLocalizedHref("/tours-from-batumi", lang)} className="landing-btn-secondary">
              🚗 {c.ctaTours}
            </Link>
          </div>
        </div>
      </section>

      <section id="experiences" className="landing-section">
        <div className="landing-section-header">
          <div className="landing-section-tag">{ui.tipsTag}</div>
          <h2 className="landing-section-title">{c.guideTitle}</h2>
          <p className="landing-section-desc">{c.guideDesc}</p>
        </div>
        <div className="landing-features-grid">
          {c.experiences.map((exp) => (
            <div key={exp.title} className="landing-feature-card">
              <span className="landing-feature-icon" aria-hidden="true">{exp.icon}</span>
              <h3>{exp.title}</h3>
              <p>{exp.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {displayPlaces.length > 0 && (
        <section className="landing-section" style={{ paddingTop: 0 }}>
          <div className="landing-section-header">
            <h2 className="landing-section-title">{c.placesTitle}</h2>
            <p className="landing-section-desc">{c.placesDesc}</p>
          </div>
          <div className="landing-tours-grid">
            {displayPlaces.map((place) => (
              <Link key={place.id} href={getLocalizedHref(placePath(place), lang)} className="landing-tour-card" prefetch={false}>
                <div className="landing-tour-img-wrap">
                  <Image src={place.img || "/adjara.jpg"} alt={place.titleText} fill sizes="(max-width: 768px) 100vw, 380px" className="landing-tour-img" />
                </div>
                <div className="landing-tour-body">
                  <h3 className="landing-tour-title">{place.titleText}</h3>
                  <p className="landing-tour-desc">{place.descText}</p>
                  <div className="landing-tour-footer">
                    <span>📍 {formatRegionName(place.region, lang)}</span>
                    <span className="landing-tour-cta">{c.viewPlace} →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <p className="landing-note">
            <Link href={getLocalizedHref("/places", lang)} prefetch={false}>{c.allPlaces} →</Link>
          </p>
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
          <Link href={getLocalizedHref("/tours-from-batumi", lang)} className="landing-btn-primary">
            🚗 {c.ctaButton}
          </Link>
        </div>
      </section>
    </LandingShell>
  );
}
