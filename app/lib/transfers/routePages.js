/**
 * Transfer route landing pages: /<locale>/transfers/<slug>.
 *
 * One page per popular route, built from the same data the calculator uses:
 * road distance and time from routeCalculator's table, fares from the admin
 * tariffs. Each page answers "how far, how long, how much" in its first
 * paragraph, which is what search engines and AI answers quote.
 *
 * Only routes with a known road distance belong here, so every number on the
 * page is the one the calculator shows. Adding a route = one line below.
 */

import { LOCATION_BY_ID, estimateRouteDistance, formatDuration, isSvanetiRoute, quoteFromRoute } from "./routeCalculator";
import { TRANSFER_VEHICLE_KEYS } from "./pricing";

export const ROUTE_PAGES = [
  // From Batumi — the team's home base
  { slug: "batumi-airport-to-batumi", from: "batumi_airport", to: "batumi_city" },
  { slug: "batumi-to-tbilisi", from: "batumi_city", to: "tbilisi_city" },
  { slug: "batumi-to-tbilisi-airport", from: "batumi_city", to: "tbilisi_airport" },
  { slug: "batumi-to-kutaisi-airport", from: "batumi_city", to: "kutaisi_airport" },
  { slug: "batumi-to-kutaisi", from: "batumi_city", to: "kutaisi_city" },
  { slug: "batumi-to-gudauri", from: "batumi_city", to: "gudauri" },
  { slug: "batumi-to-kazbegi", from: "batumi_city", to: "kazbegi" },
  { slug: "batumi-to-borjomi", from: "batumi_city", to: "borjomi" },
  { slug: "batumi-to-bakuriani", from: "batumi_city", to: "bakuriani" },
  { slug: "batumi-to-mestia", from: "batumi_city", to: "mestia" },
  { slug: "batumi-to-martvili", from: "batumi_city", to: "martvili" },
  { slug: "batumi-to-kobuleti", from: "batumi_city", to: "kobuleti" },
  { slug: "batumi-to-ureki-shekvetili", from: "batumi_city", to: "shekvetili" },
  { slug: "batumi-to-sarpi-border", from: "batumi_city", to: "sarpi" },
  // From Kutaisi airport — the low-cost flights hub
  { slug: "kutaisi-airport-to-batumi", from: "kutaisi_airport", to: "batumi_city" },
  { slug: "kutaisi-airport-to-tbilisi", from: "kutaisi_airport", to: "tbilisi_city" },
  { slug: "kutaisi-airport-to-kutaisi", from: "kutaisi_airport", to: "kutaisi_city" },
  { slug: "kutaisi-airport-to-mestia", from: "kutaisi_airport", to: "mestia" },
  { slug: "kutaisi-airport-to-bakuriani", from: "kutaisi_airport", to: "bakuriani" },
  // From Tbilisi airport and city
  { slug: "tbilisi-airport-to-tbilisi", from: "tbilisi_airport", to: "tbilisi_city" },
  { slug: "tbilisi-airport-to-batumi", from: "tbilisi_airport", to: "batumi_city" },
  { slug: "tbilisi-airport-to-gudauri", from: "tbilisi_airport", to: "gudauri" },
  { slug: "tbilisi-airport-to-kazbegi", from: "tbilisi_airport", to: "kazbegi" },
  { slug: "tbilisi-to-gudauri", from: "tbilisi_city", to: "gudauri" },
  { slug: "tbilisi-to-kazbegi", from: "tbilisi_city", to: "kazbegi" },
  { slug: "tbilisi-to-sighnaghi", from: "tbilisi_city", to: "sighnaghi" },
  { slug: "tbilisi-to-borjomi", from: "tbilisi_city", to: "borjomi" },
  { slug: "tbilisi-to-bakuriani", from: "tbilisi_city", to: "bakuriani" },
];

const BY_SLUG = Object.fromEntries(ROUTE_PAGES.map((r) => [r.slug, r]));

export function getRoutePage(slug) {
  return BY_SLUG[slug] || null;
}

export function routePagePath(route) {
  return `/transfers/${route.slug}`;
}

/** The page for the same route driven the other way, if there is one. */
export function findReverseRoutePage(route) {
  return ROUTE_PAGES.find((r) => r.from === route.to && r.to === route.from) || null;
}

/** Calculator link with both ends filled in. */
export function calculatorHref(fromId, toId) {
  return `/transfers?from=${fromId}&to=${toId}`;
}

export function locationName(id, lang) {
  const names = LOCATION_BY_ID[id]?.names || {};
  return names[lang] || names.en || id;
}

/**
 * Distance, time and the fare of every vehicle for a route page, from the
 * same functions the calculator runs. `pricing` is the admin tariff doc.
 */
export function quoteRoutePage(route, pricing, lang = "en") {
  const a = LOCATION_BY_ID[route.from];
  const b = LOCATION_BY_ID[route.to];
  const distance = estimateRouteDistance(a, b);
  if (!distance) return null;
  const isSvaneti = isSvanetiRoute(null, null, a, b);
  const quote = quoteFromRoute(distance, pricing, { isSvaneti, lang });
  const fares = {};
  for (const key of TRANSFER_VEHICLE_KEYS) fares[key] = quote.allVehiclePrices[key];
  const known = Object.values(fares).filter((f) => f != null);
  return {
    km: distance.distanceKm,
    minutes: distance.durationMinutes,
    // formatDuration marks longer trips with "~"; the copy already says "about".
    duration: formatDuration(distance.durationMinutes, lang).replace(/^~/, ""),
    isSvaneti,
    fares,
    minFare: known.length ? Math.min(...known) : null,
    maxFare: known.length ? Math.max(...known) : null,
  };
}

// What each place is, in a sentence or two. Shown on every page that ends
// there, so each route page says something about the destination beyond the
// numbers. Facts only — no claims about the service.
export const DESTINATION_NOTES = {
  batumi_city: {
    en: "Batumi is the Black Sea capital of Adjara: the seaside Boulevard, the Old Town, Alphabet Tower and the Botanical Garden. It is also where our team is based.",
    ka: "ბათუმი აჭარის შავიზღვისპირა დედაქალაქია: ბულვარი, ძველი ქალაქი, ანბანის კოშკი და ბოტანიკური ბაღი. აქვეა ჩვენი გუნდის ოფისიც.",
    ru: "Батуми — черноморская столица Аджарии: Бульвар, Старый город, Алфавитная башня и Ботанический сад. Здесь же находится наша команда.",
    tr: "Batum, Acara'nın Karadeniz kıyısındaki başkentidir: sahil bulvarı, Eski Şehir, Alfabe Kulesi ve Botanik Bahçesi. Ekibimiz de burada.",
    ar: "باتومي عاصمة أجاريا على البحر الأسود: الكورنيش والمدينة القديمة وبرج الأبجدية والحديقة النباتية. وهنا أيضاً مقر فريقنا.",
  },
  batumi_airport: {
    en: "Batumi International Airport (BUS) lies on the southern edge of the city, about 15 minutes from the centre and close to the Sarpi border with Turkey.",
    ka: "ბათუმის საერთაშორისო აეროპორტი (BUS) ქალაქის სამხრეთ კიდეზეა, ცენტრიდან დაახლოებით 15 წუთში, თურქეთის საზღვართან (სარფი) ახლოს.",
    ru: "Международный аэропорт Батуми (BUS) находится на южной окраине города, примерно в 15 минутах от центра и недалеко от границы с Турцией в Сарпи.",
    tr: "Batum Uluslararası Havalimanı (BUS) şehrin güney ucunda, merkeze yaklaşık 15 dakika ve Sarp sınır kapısına yakındır.",
    ar: "يقع مطار باتومي الدولي (BUS) على الطرف الجنوبي للمدينة، على بعد نحو 15 دقيقة من المركز وقرب معبر سارپي الحدودي مع تركيا.",
  },
  tbilisi_city: {
    en: "Tbilisi is Georgia's capital: the Old Town, Narikala fortress, the sulphur baths of Abanotubani and Rustaveli Avenue.",
    ka: "თბილისი საქართველოს დედაქალაქია: ძველი თბილისი, ნარიყალა, აბანოთუბნის გოგირდის აბანოები და რუსთაველის გამზირი.",
    ru: "Тбилиси — столица Грузии: Старый город, крепость Нарикала, серные бани Абанотубани и проспект Руставели.",
    tr: "Tiflis, Gürcistan'ın başkentidir: Eski Şehir, Narikala kalesi, Abanotubani kükürt hamamları ve Rustaveli Caddesi.",
    ar: "تبليسي عاصمة جورجيا: المدينة القديمة وقلعة ناريكالا وحمامات الكبريت في أبانوتوباني وشارع روستافيلي.",
  },
  tbilisi_airport: {
    en: "Tbilisi International Airport (TBS) is Georgia's main international airport, about 18 km east of the city centre.",
    ka: "თბილისის საერთაშორისო აეროპორტი (TBS) საქართველოს მთავარი საერთაშორისო აეროპორტია, ქალაქის ცენტრიდან დაახლოებით 18 კმ-ში.",
    ru: "Международный аэропорт Тбилиси (TBS) — главный международный аэропорт Грузии, примерно в 18 км к востоку от центра.",
    tr: "Tiflis Uluslararası Havalimanı (TBS), şehir merkezinin yaklaşık 18 km doğusunda, Gürcistan'ın ana uluslararası havalimanıdır.",
    ar: "مطار تبليسي الدولي (TBS) هو المطار الدولي الرئيسي في جورجيا، ويبعد نحو 18 كم شرق وسط المدينة.",
  },
  kutaisi_airport: {
    en: "Kutaisi International Airport (KUT) is the hub for low-cost flights to Georgia, about 20 km from Kutaisi and roughly halfway between Batumi and Tbilisi.",
    ka: "ქუთაისის საერთაშორისო აეროპორტი (KUT) დაბალბიუჯეტიანი ავიარეისების ცენტრია — ქუთაისიდან დაახლოებით 20 კმ-ში, ბათუმსა და თბილისს შორის თითქმის შუაში.",
    ru: "Международный аэропорт Кутаиси (KUT) принимает лоукостеры; он примерно в 20 км от Кутаиси и почти посередине между Батуми и Тбилиси.",
    tr: "Kutaisi Uluslararası Havalimanı (KUT) Gürcistan'a düşük maliyetli uçuşların merkezidir; Kutaisi'ye yaklaşık 20 km, Batum ile Tiflis'in neredeyse ortasındadır.",
    ar: "مطار كوتايسي الدولي (KUT) مركز رحلات الطيران منخفض التكلفة إلى جورجيا، ويبعد نحو 20 كم عن كوتايسي وفي منتصف الطريق تقريباً بين باتومي وتبليسي.",
  },
  kutaisi_city: {
    en: "Kutaisi is the main city of Imereti, with Bagrati Cathedral and Gelati Monastery, and the gateway to Prometheus Cave and Martvili Canyon.",
    ka: "ქუთაისი იმერეთის მთავარი ქალაქია — ბაგრატის ტაძრითა და გელათის მონასტრით; აქედან ახლოსაა პრომეთეს მღვიმე და მარტვილის კანიონი.",
    ru: "Кутаиси — главный город Имеретии с храмом Баграти и монастырём Гелати; отсюда близко до пещеры Прометея и каньона Мартвили.",
    tr: "Kutaisi, Bagrati Katedrali ve Gelati Manastırı ile İmereti'nin ana şehridir; Prometheus Mağarası ve Martvili Kanyonu'na açılan kapıdır.",
    ar: "كوتايسي المدينة الرئيسية في إيميريتي، وفيها كاتدرائية باغراتي ودير جيلاتي، وهي البوابة إلى كهف بروميثيوس ووادي مارتفيلي.",
  },
  gudauri: {
    en: "Gudauri is Georgia's best-known ski resort, at about 2,200 m on the Georgian Military Road. The ski season usually runs from December to April.",
    ka: "გუდაური საქართველოს ყველაზე ცნობილი სათხილამურო კურორტია, დაახლოებით 2200 მ სიმაღლეზე, საქართველოს სამხედრო გზაზე. სეზონი ჩვეულებრივ დეკემბრიდან აპრილამდე გრძელდება.",
    ru: "Гудаури — самый известный горнолыжный курорт Грузии, на высоте около 2200 м на Военно-Грузинской дороге. Сезон обычно с декабря по апрель.",
    tr: "Gudauri, Gürcü Askeri Yolu üzerinde yaklaşık 2.200 m yükseklikte, Gürcistan'ın en bilinen kayak merkezidir. Kayak sezonu genellikle Aralık'tan Nisan'a sürer.",
    ar: "غوداوري أشهر منتجع تزلج في جورجيا، على ارتفاع نحو 2200 م على الطريق العسكري الجورجي. يمتد موسم التزلج عادة من ديسمبر إلى أبريل.",
  },
  kazbegi: {
    en: "Stepantsminda (Kazbegi) sits under Mount Kazbek, with Gergeti Trinity Church above the town. In heavy snow the road over the Jvari Pass can close for a few hours or days.",
    ka: "სტეფანწმინდა (ყაზბეგი) მყინვარწვერის ძირშია, ქალაქს ზემოთ გერგეტის სამება დგას. დიდთოვლობისას ჯვრის უღელტეხილზე გზა შეიძლება რამდენიმე საათით ან დღით დაიკეტოს.",
    ru: "Степанцминда (Казбеги) лежит у подножия Казбека, над посёлком — церковь Гергетская Троица. В сильный снегопад дорогу через Крестовый перевал могут закрыть на несколько часов или дней.",
    tr: "Stepantsminda (Kazbegi), Kazbek Dağı'nın eteğindedir; kasabanın üzerinde Gergeti Sameba Kilisesi yer alır. Yoğun karda Jvari Geçidi yolu birkaç saat veya gün kapanabilir.",
    ar: "تقع ستيبانتسميندا (كازبيغي) عند سفح جبل كازبيك، وتعلوها كنيسة غيرغيتي الثالوث. في الثلوج الكثيفة قد يُغلق الطريق عبر ممر جفاري لساعات أو أيام.",
  },
  borjomi: {
    en: "Borjomi is the spa town of the famous mineral water, with its Central Park and the Borjomi-Kharagauli National Park next door.",
    ka: "ბორჯომი ცნობილი მინერალური წყლის საკურორტო ქალაქია — ცენტრალური პარკით და ბორჯომ-ხარაგაულის ეროვნული პარკით.",
    ru: "Боржоми — курортный город знаменитой минеральной воды, с Центральным парком и Боржоми-Харагаульским национальным парком по соседству.",
    tr: "Borjomi, ünlü maden suyunun kaplıca kasabasıdır; Merkez Parkı ve hemen yanında Borjomi-Kharagauli Milli Parkı bulunur.",
    ar: "بورجومي مدينة المنتجع الشهيرة بمياهها المعدنية، وفيها الحديقة المركزية وبجوارها منتزه بورجومي-خاراغاولي الوطني.",
  },
  bakuriani: {
    en: "Bakuriani is a family-friendly ski resort at about 1,700 m, half an hour above Borjomi, busy in winter and pleasant for hiking in summer.",
    ka: "ბაკურიანი ოჯახებისთვის მოსახერხებელი სათხილამურო კურორტია, დაახლოებით 1700 მ სიმაღლეზე, ბორჯომიდან ნახევარ საათში; ზამთარში ხალხმრავალია, ზაფხულში კი ლაშქრობისთვის სასიამოვნო.",
    ru: "Бакуриани — семейный горнолыжный курорт на высоте около 1700 м, в получасе от Боржоми; зимой многолюдно, летом хорошо для прогулок.",
    tr: "Bakuriani, Borjomi'nin yarım saat yukarısında, yaklaşık 1.700 m'de aile dostu bir kayak merkezidir; kışın kalabalık, yazın yürüyüş için keyiflidir.",
    ar: "باكورياني منتجع تزلج مناسب للعائلات على ارتفاع نحو 1700 م، على بعد نصف ساعة من بورجومي؛ مزدحم شتاءً وممتع للمشي صيفاً.",
  },
  mestia: {
    en: "Mestia is the centre of Upper Svaneti, known for its medieval stone towers and as the base for trips to Ushguli. The last part of the road is a mountain road, so fares to Svaneti include a small surcharge.",
    ka: "მესტია ზემო სვანეთის ცენტრია — შუასაუკუნეების სვანური კოშკებით; აქედან მიდიან უშგულში. გზის ბოლო მონაკვეთი მთის გზაა, ამიტომ სვანეთის ტარიფს მცირე დანამატი აქვს.",
    ru: "Местиа — центр Верхней Сванетии со средневековыми сванскими башнями и отправная точка поездок в Ушгули. Последний участок — горная дорога, поэтому к тарифу в Сванетию добавляется небольшая надбавка.",
    tr: "Mestia, ortaçağ taş kuleleriyle bilinen Yukarı Svaneti'nin merkezi ve Ushguli gezilerinin başlangıç noktasıdır. Yolun son kısmı dağ yolu olduğundan Svaneti ücretlerine küçük bir ek ücret eklenir.",
    ar: "ميستيا مركز سفانيتي العليا، المعروفة بأبراجها الحجرية من العصور الوسطى، ومنها تنطلق الرحلات إلى أوشغولي. الجزء الأخير من الطريق جبلي، لذا تشمل أسعار سفانيتي رسماً إضافياً صغيراً.",
  },
  martvili: {
    en: "Martvili is home to Martvili Canyon, with boat rides between the cliffs in the warm season, and the hilltop Martvili Monastery.",
    ka: "მარტვილში არის მარტვილის კანიონი — თბილ სეზონში კლდეებს შორის ნავით სეირნობით — და გორაზე მდგარი მარტვილის მონასტერი.",
    ru: "В Мартвили — каньон Мартвили с прогулками на лодке между скал в тёплый сезон и монастырь Мартвили на холме.",
    tr: "Martvili, sıcak mevsimde kayalıklar arasında tekne turlarının yapıldığı Martvili Kanyonu'na ve tepedeki Martvili Manastırı'na ev sahipliği yapar.",
    ar: "في مارتفيلي يقع وادي مارتفيلي مع جولات القوارب بين المنحدرات في الموسم الدافئ، ودير مارتفيلي على قمة التل.",
  },
  kobuleti: {
    en: "Kobuleti is a quieter beach resort about 30 km north of Batumi, with a long pebble beach and pine-lined streets.",
    ka: "ქობულეთი უფრო მშვიდი საზღვაო კურორტია ბათუმიდან დაახლოებით 30 კმ-ში ჩრდილოეთით — გრძელი კენჭოვანი სანაპიროთი და ფიჭვნარით.",
    ru: "Кобулети — более спокойный морской курорт примерно в 30 км к северу от Батуми, с длинным галечным пляжем и сосновыми улицами.",
    tr: "Kobuleti, Batum'un yaklaşık 30 km kuzeyinde, uzun çakıllı plajı ve çam ağaçlı sokaklarıyla daha sakin bir sahil beldesidir.",
    ar: "كوبوليتي منتجع شاطئي أهدأ على بعد نحو 30 كم شمال باتومي، بشاطئ حصوي طويل وشوارع تحفها أشجار الصنوبر.",
  },
  shekvetili: {
    en: "Shekvetili and Ureki are known for the black magnetic sand beaches that families with children choose, and for the Shekvetili Dendropark.",
    ka: "შეკვეთილი და ურეკი ცნობილია შავი მაგნიტური ქვიშის პლაჟებით, რომლებსაც ბავშვიანი ოჯახები ირჩევენ, და შეკვეთილის დენდროპარკით.",
    ru: "Шекветили и Уреки известны пляжами с чёрным магнитным песком, которые любят семьи с детьми, и Шекветильским дендропарком.",
    tr: "Şekvetili ve Ureki, çocuklu ailelerin tercih ettiği siyah manyetik kumlu plajları ve Şekvetili Dendroparkı ile bilinir.",
    ar: "تشتهر شيكفيتيلي وأوريكي بشواطئ الرمال المغناطيسية السوداء التي تفضلها العائلات مع الأطفال، وبحديقة شيكفيتيلي النباتية.",
  },
  sarpi: {
    en: "Sarpi is the Georgia–Turkey border crossing on the coast, south of Batumi. Travellers cross on foot or by car towards Hopa and Trabzon.",
    ka: "სარფი საქართველო-თურქეთის სასაზღვრო გამშვები პუნქტია ზღვის სანაპიროზე, ბათუმის სამხრეთით. საზღვარს ფეხით ან მანქანით კვეთენ ხოფისა და ტრაპიზონისკენ.",
    ru: "Сарпи — пограничный переход Грузия–Турция на побережье к югу от Батуми. Границу пересекают пешком или на машине в сторону Хопы и Трабзона.",
    tr: "Sarp, Batum'un güneyinde, sahildeki Gürcistan–Türkiye sınır kapısıdır. Yolcular Hopa ve Trabzon yönüne yaya veya araçla geçer.",
    ar: "سارپي معبر حدودي بين جورجيا وتركيا على الساحل جنوب باتومي. يعبره المسافرون سيراً أو بالسيارة نحو هوبا وطرابزون.",
  },
  sighnaghi: {
    en: "Sighnaghi is a walled hilltop town in the Kakheti wine region, overlooking the Alazani Valley, with Bodbe Monastery a few minutes away.",
    ka: "სიღნაღი გალავნიანი ქალაქია კახეთის ღვინის მხარეში, ალაზნის ველზე გადმოყურებს; რამდენიმე წუთშია ბოდბის მონასტერი.",
    ru: "Сигнахи — город-крепость на холме в винном регионе Кахетия с видом на Алазанскую долину; в нескольких минутах — монастырь Бодбе.",
    tr: "Sighnaghi, Kakheti şarap bölgesinde Alazani Vadisi'ne bakan surlarla çevrili bir tepe kasabasıdır; Bodbe Manastırı birkaç dakika uzaklıktadır.",
    ar: "سيغناغي بلدة مسوّرة على تل في منطقة كاخيتي للنبيذ، تطل على وادي ألازاني، ودير بودبي على بعد دقائق.",
  },
};

const fmt = (n) => (n == null ? "—" : `₾${n}`);

// Page copy. Functions take the route's names and numbers so every page reads
// as its own answer, not a template with blanks.
export const ROUTE_COPY = {
  en: {
    crumbTransfers: "Transfers",
    metaTitle: (a, b, q) => `${a} to ${b} Transfer — from ${fmt(q.minFare)} per car | GeorgiaTrips`,
    metaDescription: (a, b, q) =>
      `Private transfer ${a} → ${b}: ${q.km} km, about ${q.duration}. Fixed price per vehicle from ${fmt(q.minFare)}, door-to-door, pay the driver on the day.`,
    badge: "Private transfer",
    title: (a, b) => `${a} → ${b} private transfer`,
    summary: (a, b, q) =>
      `A private transfer from ${a} to ${b} covers about ${q.km} km and takes around ${q.duration} in normal traffic. ` +
      `The price is per vehicle, not per person: ${fmt(q.fares.sedan)} for a sedan (up to 3 passengers), ${fmt(q.fares.jeep)} for a 4×4 jeep (up to 4), ` +
      `${fmt(q.fares.minivan)} for a minivan (up to 6) and ${fmt(q.fares.sprinter)} for a Sprinter minibus (up to 19). Booking is free and you pay on the day.`,
    distance: "Distance",
    time: "Driving time",
    from: "Price from",
    pricesTitle: "Prices by vehicle",
    pricesNote: "Fixed price for the whole vehicle, door to door. The same price applies in the opposite direction.",
    svanetiNote: "Includes the Svaneti mountain-road surcharge.",
    headers: ["Vehicle", "Price", "Passengers", "Luggage"],
    vehicles: { sedan: "Sedan", jeep: "4×4 Jeep / SUV", minivan: "Minivan", sprinter: "Sprinter minibus" },
    includedTitle: "How it works",
    included: [
      "Pickup at any address: hotel, apartment, airport or train station.",
      "Fixed price for the car, agreed before the trip — no meter, no per-person fees.",
      "Send a free booking request; we confirm it by WhatsApp or phone.",
      "Pay the driver on the day of the transfer.",
      "Want to stop on the way for coffee or photos? Tell us when booking.",
    ],
    aboutTitle: (b) => `About ${b}`,
    book: "Book this transfer",
    whatsapp: "Ask on WhatsApp",
    waText: (a, b) => `Hello! I'd like to book a transfer from ${a} to ${b}.`,
    faqTitle: "Questions about this transfer",
    faqs: (a, b, q) => [
      { q: `How long is the drive from ${a} to ${b}?`, a: `About ${q.duration} for ${q.km} km in normal traffic. Mountain roads, weather and the season can add time.` },
      { q: `How much is a transfer from ${a} to ${b}?`, a: `${fmt(q.fares.sedan)} for a sedan, ${fmt(q.fares.jeep)} for a 4×4, ${fmt(q.fares.minivan)} for a minivan and ${fmt(q.fares.sprinter)} for a Sprinter. The price is for the whole vehicle.` },
      { q: "How do I book and pay?", a: "Send the booking form or message us on WhatsApp. Booking is free; our team confirms by WhatsApp or phone, and you pay on the day of the transfer." },
      { q: `Does ${b} → ${a} cost the same?`, a: "Yes. The fare depends on the distance and the vehicle, so the return trip costs the same." },
    ],
    relatedTitle: (a) => `Other transfers from ${a}`,
    reverse: "Return trip",
    allRoutes: "All transfer routes",
    popularTitle: "Popular transfer routes",
    popularDesc: "Distance, driving time and fixed prices for each route.",
  },
  ka: {
    crumbTransfers: "ტრანსფერები",
    metaTitle: (a, b, q) => `ტრანსფერი ${a} — ${b}: ფასი ${fmt(q.minFare)}-დან | GeorgiaTrips`,
    metaDescription: (a, b, q) =>
      `ინდივიდუალური ტრანსფერი ${a} → ${b}: ${q.km} კმ, დაახლოებით ${q.duration}. ფიქსირებული ფასი ავტომობილზე ${fmt(q.minFare)}-დან, კარიდან კარამდე, გადახდა მგზავრობის დღეს.`,
    badge: "ინდივიდუალური ტრანსფერი",
    title: (a, b) => `ტრანსფერი ${a} → ${b}`,
    summary: (a, b, q) =>
      `ინდივიდუალური ტრანსფერი მარშრუტზე ${a} — ${b} დაახლოებით ${q.km} კმ-ია და ჩვეულებრივ მოძრაობაში დაახლოებით ${q.duration} სჭირდება. ` +
      `ფასი ავტომობილზეა და არა ადამიანზე: სედანი (3 მგზავრამდე) — ${fmt(q.fares.sedan)}, ჯიპი 4×4 (4 მგზავრამდე) — ${fmt(q.fares.jeep)}, ` +
      `მინივენი (6 მგზავრამდე) — ${fmt(q.fares.minivan)}, სპრინტერი (19 მგზავრამდე) — ${fmt(q.fares.sprinter)}. ჯავშანი უფასოა, გადახდა — მგზავრობის დღეს.`,
    distance: "მანძილი",
    time: "გზაში დრო",
    from: "ფასი",
    pricesTitle: "ფასები ავტომობილის მიხედვით",
    pricesNote: "ფიქსირებული ფასი მთელ ავტომობილზე, კარიდან კარამდე. საპირისპირო მიმართულებითაც იგივე ფასია.",
    svanetiNote: "მოიცავს სვანეთის მთის გზის დანამატს.",
    headers: ["ავტომობილი", "ფასი", "მგზავრები", "ბარგი"],
    vehicles: { sedan: "სედანი", jeep: "ჯიპი / SUV 4×4", minivan: "მინივენი", sprinter: "სპრინტერი" },
    includedTitle: "როგორ მუშაობს",
    included: [
      "აგიყვანთ ნებისმიერი მისამართიდან: სასტუმრო, აპარტამენტი, აეროპორტი თუ რკინიგზის სადგური.",
      "ფიქსირებული ფასი მანქანაზე, მგზავრობამდე შეთანხმებული — მრიცხველისა და თითო ადამიანის საფასურის გარეშე.",
      "გამოგზავნეთ უფასო მოთხოვნა; დაგიდასტურებთ WhatsApp-ით ან ტელეფონით.",
      "გადაუხდით მძღოლს მგზავრობის დღეს.",
      "გზაში ყავისთვის ან ფოტოსთვის გაჩერება გსურთ? ჯავშნისას გვითხარით.",
    ],
    aboutTitle: (b) => `${b} — მოკლედ`,
    book: "ტრანსფერის დაჯავშნა",
    whatsapp: "WhatsApp-ზე კითხვა",
    waText: (a, b) => `გამარჯობა! მინდა დავჯავშნო ტრანსფერი: ${a} → ${b}.`,
    faqTitle: "კითხვები ამ ტრანსფერზე",
    faqs: (a, b, q) => [
      { q: `რამდენი ხნის გზაა ${a} — ${b}?`, a: `დაახლოებით ${q.duration}, ${q.km} კმ ჩვეულებრივ მოძრაობაში. მთის გზამ, ამინდმა და სეზონმა შეიძლება დრო გაზარდოს.` },
      { q: `რა ღირს ტრანსფერი ${a} — ${b}?`, a: `სედანი — ${fmt(q.fares.sedan)}, ჯიპი 4×4 — ${fmt(q.fares.jeep)}, მინივენი — ${fmt(q.fares.minivan)}, სპრინტერი — ${fmt(q.fares.sprinter)}. ფასი მთელ ავტომობილზეა.` },
      { q: "როგორ დავჯავშნო და გადავიხადო?", a: "გამოგზავნეთ ჯავშნის ფორმა ან მოგვწერეთ WhatsApp-ზე. ჯავშანი უფასოა; გუნდი დაგიდასტურებთ WhatsApp-ით ან ტელეფონით, გადახდა ხდება მგზავრობის დღეს." },
      { q: `${b} — ${a} იგივე ღირს?`, a: "დიახ. ფასი მანძილსა და ავტომობილზეა დამოკიდებული, ამიტომ უკან გზაც იგივე ღირს." },
    ],
    relatedTitle: (a) => `სხვა ტრანსფერები: ${a}`,
    reverse: "უკან გზა",
    allRoutes: "ყველა მარშრუტი",
    popularTitle: "პოპულარული მარშრუტები",
    popularDesc: "მანძილი, გზაში დრო და ფიქსირებული ფასი თითოეული მარშრუტისთვის.",
  },
  ru: {
    crumbTransfers: "Трансферы",
    metaTitle: (a, b, q) => `Трансфер ${a} — ${b}: цена от ${fmt(q.minFare)} за машину | GeorgiaTrips`,
    metaDescription: (a, b, q) =>
      `Индивидуальный трансфер ${a} → ${b}: ${q.km} км, около ${q.duration}. Фиксированная цена за автомобиль от ${fmt(q.minFare)}, от двери до двери, оплата водителю в день поездки.`,
    badge: "Индивидуальный трансфер",
    title: (a, b) => `Трансфер ${a} → ${b}`,
    summary: (a, b, q) =>
      `Индивидуальный трансфер по маршруту ${a} — ${b}: около ${q.km} км и примерно ${q.duration} в пути при обычном движении. ` +
      `Цена за автомобиль, а не за человека: седан (до 3 пассажиров) — ${fmt(q.fares.sedan)}, джип 4×4 (до 4) — ${fmt(q.fares.jeep)}, ` +
      `минивэн (до 6) — ${fmt(q.fares.minivan)}, микроавтобус Sprinter (до 19) — ${fmt(q.fares.sprinter)}. Бронирование бесплатное, оплата — в день поездки.`,
    distance: "Расстояние",
    time: "Время в пути",
    from: "Цена от",
    pricesTitle: "Цены по типу автомобиля",
    pricesNote: "Фиксированная цена за весь автомобиль, от двери до двери. В обратную сторону — та же цена.",
    svanetiNote: "Включает надбавку за горную дорогу в Сванетию.",
    headers: ["Автомобиль", "Цена", "Пассажиры", "Багаж"],
    vehicles: { sedan: "Седан", jeep: "Джип / SUV 4×4", minivan: "Минивэн", sprinter: "Микроавтобус Sprinter" },
    includedTitle: "Как это работает",
    included: [
      "Заберём с любого адреса: отель, апартаменты, аэропорт или вокзал.",
      "Фиксированная цена за машину, согласованная до поездки, — без счётчика и доплат за человека.",
      "Отправьте бесплатную заявку; мы подтвердим её в WhatsApp или по телефону.",
      "Оплата водителю в день трансфера.",
      "Хотите остановиться по дороге на кофе или фото? Скажите при бронировании.",
    ],
    aboutTitle: (b) => `Коротко: ${b}`,
    book: "Забронировать трансфер",
    whatsapp: "Спросить в WhatsApp",
    waText: (a, b) => `Здравствуйте! Хочу заказать трансфер ${a} → ${b}.`,
    faqTitle: "Вопросы об этом трансфере",
    faqs: (a, b, q) => [
      { q: `Сколько ехать по маршруту ${a} — ${b}?`, a: `Около ${q.duration} на ${q.km} км при обычном движении. Горные дороги, погода и сезон могут добавить время.` },
      { q: `Сколько стоит трансфер ${a} — ${b}?`, a: `Седан — ${fmt(q.fares.sedan)}, джип 4×4 — ${fmt(q.fares.jeep)}, минивэн — ${fmt(q.fares.minivan)}, Sprinter — ${fmt(q.fares.sprinter)}. Цена за весь автомобиль.` },
      { q: "Как забронировать и оплатить?", a: "Отправьте форму бронирования или напишите нам в WhatsApp. Бронирование бесплатное; команда подтвердит его в WhatsApp или по телефону, оплата — в день поездки." },
      { q: `${b} — ${a} стоит столько же?`, a: "Да. Цена зависит от расстояния и автомобиля, поэтому обратная поездка стоит столько же." },
    ],
    relatedTitle: (a) => `Другие трансферы: ${a}`,
    reverse: "Обратно",
    allRoutes: "Все маршруты",
    popularTitle: "Популярные маршруты трансферов",
    popularDesc: "Расстояние, время в пути и фиксированная цена для каждого маршрута.",
  },
  tr: {
    crumbTransfers: "Transferler",
    metaTitle: (a, b, q) => `${a} – ${b} Transfer: araç başı en düşük ${fmt(q.minFare)} | GeorgiaTrips`,
    metaDescription: (a, b, q) =>
      `${a} → ${b} özel transfer: ${q.km} km, yaklaşık ${q.duration}. Araç başı sabit fiyat, en düşük ${fmt(q.minFare)}; kapıdan kapıya, ödeme transfer günü şoföre.`,
    badge: "Özel transfer",
    title: (a, b) => `${a} → ${b} özel transfer`,
    summary: (a, b, q) =>
      `${a} – ${b} özel transferi yaklaşık ${q.km} km'dir ve normal trafikte ${q.duration} sürer. ` +
      `Fiyat kişi başı değil araç başıdır: sedan (3 yolcuya kadar) ${fmt(q.fares.sedan)}, 4×4 cip (4 yolcuya kadar) ${fmt(q.fares.jeep)}, ` +
      `minivan (6 yolcuya kadar) ${fmt(q.fares.minivan)}, Sprinter minibüs (19 yolcuya kadar) ${fmt(q.fares.sprinter)}. Rezervasyon ücretsizdir, ödeme transfer günü yapılır.`,
    distance: "Mesafe",
    time: "Yolculuk süresi",
    from: "Fiyat",
    pricesTitle: "Araç tipine göre fiyatlar",
    pricesNote: "Tüm araç için sabit fiyat, kapıdan kapıya. Ters yönde de aynı fiyat geçerlidir.",
    svanetiNote: "Svaneti dağ yolu ek ücreti dahildir.",
    headers: ["Araç", "Fiyat", "Yolcu", "Bagaj"],
    vehicles: { sedan: "Sedan", jeep: "4×4 Cip / SUV", minivan: "Minivan", sprinter: "Sprinter minibüs" },
    includedTitle: "Nasıl çalışır",
    included: [
      "Her adresten alış: otel, daire, havalimanı veya tren istasyonu.",
      "Yolculuktan önce kararlaştırılan araç başı sabit fiyat — taksimetre ve kişi başı ücret yok.",
      "Ücretsiz rezervasyon talebi gönderin; WhatsApp veya telefonla onaylarız.",
      "Ödeme transfer günü şoföre yapılır.",
      "Yolda kahve veya fotoğraf molası mı istiyorsunuz? Rezervasyonda belirtin.",
    ],
    aboutTitle: (b) => `${b} hakkında`,
    book: "Bu transferi ayırtın",
    whatsapp: "WhatsApp'tan sorun",
    waText: (a, b) => `Merhaba! ${a} → ${b} transferi ayırtmak istiyorum.`,
    faqTitle: "Bu transferle ilgili sorular",
    faqs: (a, b, q) => [
      { q: `${a} – ${b} arası ne kadar sürer?`, a: `Normal trafikte ${q.km} km için yaklaşık ${q.duration}. Dağ yolları, hava ve mevsim süreyi uzatabilir.` },
      { q: `${a} – ${b} transferi ne kadar?`, a: `Sedan ${fmt(q.fares.sedan)}, 4×4 ${fmt(q.fares.jeep)}, minivan ${fmt(q.fares.minivan)}, Sprinter ${fmt(q.fares.sprinter)}. Fiyat tüm araç içindir.` },
      { q: "Nasıl rezervasyon yapar ve öderim?", a: "Rezervasyon formunu gönderin veya WhatsApp'tan yazın. Rezervasyon ücretsizdir; ekibimiz WhatsApp veya telefonla onaylar, ödeme transfer günü yapılır." },
      { q: `${b} – ${a} aynı fiyat mı?`, a: "Evet. Fiyat mesafeye ve araca bağlıdır, bu yüzden dönüş de aynı fiyattır." },
    ],
    relatedTitle: (a) => `${a} çıkışlı diğer transferler`,
    reverse: "Dönüş",
    allRoutes: "Tüm transfer rotaları",
    popularTitle: "Popüler transfer rotaları",
    popularDesc: "Her rota için mesafe, yolculuk süresi ve sabit fiyat.",
  },
  ar: {
    crumbTransfers: "خدمات التوصيل",
    metaTitle: (a, b, q) => `توصيل من ${a} إلى ${b} — من ${fmt(q.minFare)} للسيارة | GeorgiaTrips`,
    metaDescription: (a, b, q) =>
      `توصيل خاص من ${a} إلى ${b}: ${q.km} كم، نحو ${q.duration}. سعر ثابت للسيارة من ${fmt(q.minFare)}، من الباب إلى الباب، والدفع للسائق يوم الرحلة.`,
    badge: "توصيل خاص",
    title: (a, b) => `توصيل خاص من ${a} إلى ${b}`,
    summary: (a, b, q) =>
      `التوصيل الخاص من ${a} إلى ${b} مسافته نحو ${q.km} كم ويستغرق قرابة ${q.duration} في حركة المرور العادية. ` +
      `السعر للسيارة وليس للشخص: سيدان (حتى 3 ركاب) ${fmt(q.fares.sedan)}، دفع رباعي 4×4 (حتى 4) ${fmt(q.fares.jeep)}، ` +
      `ميني فان (حتى 6) ${fmt(q.fares.minivan)}، وحافلة سبرينتر (حتى 19) ${fmt(q.fares.sprinter)}. الحجز مجاني والدفع يوم الرحلة.`,
    distance: "المسافة",
    time: "مدة القيادة",
    from: "السعر من",
    pricesTitle: "الأسعار حسب نوع السيارة",
    pricesNote: "سعر ثابت للسيارة كاملة، من الباب إلى الباب. السعر نفسه في الاتجاه المعاكس.",
    svanetiNote: "يشمل الرسم الإضافي لطريق سفانيتي الجبلي.",
    headers: ["السيارة", "السعر", "الركاب", "الأمتعة"],
    vehicles: { sedan: "سيدان", jeep: "دفع رباعي / SUV 4×4", minivan: "ميني فان", sprinter: "حافلة سبرينتر" },
    includedTitle: "كيف تعمل الخدمة",
    included: [
      "الاستلام من أي عنوان: فندق أو شقة أو مطار أو محطة قطار.",
      "سعر ثابت للسيارة يُتفق عليه قبل الرحلة — بلا عداد ولا رسوم لكل شخص.",
      "أرسل طلب حجز مجاني؛ نؤكده عبر واتساب أو الهاتف.",
      "ادفع للسائق يوم الرحلة.",
      "تريد التوقف في الطريق لقهوة أو صور؟ أخبرنا عند الحجز.",
    ],
    aboutTitle: (b) => `نبذة عن ${b}`,
    book: "احجز هذا التوصيل",
    whatsapp: "اسألنا عبر واتساب",
    waText: (a, b) => `مرحباً! أود حجز توصيل من ${a} إلى ${b}.`,
    faqTitle: "أسئلة حول هذا التوصيل",
    faqs: (a, b, q) => [
      { q: `كم تستغرق الرحلة من ${a} إلى ${b}؟`, a: `نحو ${q.duration} لمسافة ${q.km} كم في حركة المرور العادية. قد تزيد الطرق الجبلية والطقس والموسم من المدة.` },
      { q: `كم سعر التوصيل من ${a} إلى ${b}؟`, a: `سيدان ${fmt(q.fares.sedan)}، دفع رباعي ${fmt(q.fares.jeep)}، ميني فان ${fmt(q.fares.minivan)}، سبرينتر ${fmt(q.fares.sprinter)}. السعر للسيارة كاملة.` },
      { q: "كيف أحجز وأدفع؟", a: "أرسل نموذج الحجز أو راسلنا عبر واتساب. الحجز مجاني؛ يؤكده فريقنا عبر واتساب أو الهاتف، والدفع يوم الرحلة." },
      { q: `هل الرحلة من ${b} إلى ${a} بالسعر نفسه؟`, a: "نعم. السعر يعتمد على المسافة ونوع السيارة، لذا تكلفة العودة هي نفسها." },
    ],
    relatedTitle: (a) => `خدمات توصيل أخرى من ${a}`,
    reverse: "رحلة العودة",
    allRoutes: "كل مسارات التوصيل",
    popularTitle: "مسارات التوصيل الأكثر طلباً",
    popularDesc: "المسافة ومدة القيادة والسعر الثابت لكل مسار.",
  },
};

export function routeCopy(lang) {
  return ROUTE_COPY[lang] || ROUTE_COPY.en;
}
