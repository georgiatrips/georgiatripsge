// Every field GetYourGuide (supplier.getyourguide.com) and Tripster
// (experience.tripster.ru/editor) ask for when a tour is uploaded, read from
// both editors on 2026-11-06. `p` = which platform needs the field.
//
// Field kinds:
//   text / textarea   one value; `split: true` = a separate value per platform
//                     (GYG is written in English, Tripster in Russian)
//   number, select, chips (multi-select), list (one item per line),
//   check, weekdays (days + start time), date

export const PLATFORMS = {
  gyg: {
    key: "gyg",
    name: "GetYourGuide",
    short: "GYG",
    color: "#ff5533",
    lang: "EN",
    logo: "https://www.google.com/s2/favicons?domain=getyourguide.com&sz=64",
    editorUrl: "https://supplier.getyourguide.com/products/list",
  },
  tripster: {
    key: "tripster",
    name: "Tripster",
    short: "Tripster",
    color: "#2e9e4f",
    lang: "RU",
    logo: "https://www.google.com/s2/favicons?domain=tripster.ru&sz=64",
    editorUrl: "https://experience.tripster.ru/account/guide/3197905/experiences/",
  },
};

export const PLATFORM_KEYS = ["gyg", "tripster"];
const BOTH = ["gyg", "tripster"];
const GYG = ["gyg"];
const TR = ["tripster"];

export const LAUNCH_STATUSES = [
  { key: "todo", label: "არ დაწყებულა", tone: "idle" },
  { key: "draft", label: "ივსება", tone: "work" },
  { key: "ready", label: "მზადაა ასატვირთად", tone: "work" },
  { key: "review", label: "მოდერაციაზე", tone: "wait" },
  { key: "live", label: "გაშვებულია", tone: "live" },
  { key: "rejected", label: "უარყოფილი", tone: "bad" },
  { key: "postponed", label: "გადადებული", tone: "idle" },
  { key: "skip", label: "არ ვტვირთავთ", tone: "idle" },
];

export const SECTIONS = [
  {
    key: "main",
    title: "ძირითადი",
    fields: [
      {
        key: "gygCategory", p: GYG, kind: "select", req: true,
        label: "პროდუქტის კატეგორია", orig: "Product category",
        options: ["Tour", "Tour (more than one day)", "Entry ticket", "City card", "Hop-on hop-off ticket", "Transport experience", "Rental experience", "Other"],
      },
      {
        key: "gygWriteLang", p: GYG, kind: "select", req: true,
        label: "რა ენაზე წერ ტექსტს", orig: "Product language",
        options: ["English", "German", "French", "Spanish", "Italian", "Portuguese", "Dutch", "Polish"],
        hint: "GYG თვითონ თარგმნის დანარჩენ ენებზე.",
      },
      {
        key: "trType", p: TR, kind: "select", req: true,
        label: "ტიპი", orig: "Тип",
        options: ["Экскурсия", "Многодневный тур", "Активный отдых", "Водная прогулка", "Квест", "Трансфер", "Мастер-класс", "Фотосессия"],
        hint: "შენახვის შემდეგ ტიპს მხოლოდ editors@tripster.ru-ზე მიწერით შეცვლი.",
      },
      {
        key: "title", p: BOTH, kind: "text", split: true, req: true,
        label: "სათაური", orig: "Title / Название",
        max: { gyg: 75, tripster: 90 },
        hint: "GYG: „From Batumi: …“ ფორმატი. Tripster: რუსულად, ინტრიგით.",
      },
      {
        key: "gygShort", p: GYG, kind: "textarea", req: true, max: 200,
        label: "მოკლე აღწერა", orig: "Short description",
      },
      {
        key: "gygFull", p: GYG, kind: "textarea", req: true, rows: 7, minChars: 500, max: 3000,
        label: "სრული აღწერა", orig: "Full description",
        hint: "GYG: მინიმუმ 500, მაქსიმუმ 3000 სიმბოლო.",
      },
      {
        key: "gygHighlights", p: GYG, kind: "list", req: true, min: 3, max: 5, itemMax: 80,
        label: "მთავარი მომენტები", orig: "Highlights",
        hint: "3–5 პუნქტი, თითო ხაზზე ერთი.",
      },
      {
        key: "trIdea", p: TR, kind: "textarea", req: true, rows: 5,
        label: "იდეა", orig: "Идея",
        hint: "რატომ ღირს ეს ტური — 2–3 აბზაცი.",
      },
      {
        key: "route", p: BOTH, kind: "textarea", split: true, req: true, rows: 6,
        label: "მარშრუტი / პროგრამა", orig: "Itinerary / Маршрут",
        hint: "GYG: გაჩერებები და ხანგრძლივობა. Tripster: მარშრუტი დროებით (09:00 …).",
      },
      {
        key: "trThemes", p: TR, kind: "textarea", req: true, rows: 4,
        label: "თემები — რას გაიგებენ", orig: "Темы",
        hint: "Tripster-ზე ველს ჰქვია „Расскажите, что узнают путешественники“ (მოუყევით, რას გაიგებენ) — 2–4 წინადადება.",
      },
      {
        key: "trOrg", p: TR, kind: "textarea", req: true, rows: 5,
        label: "ორგანიზაციული დეტალები", orig: "Орг. детали",
        hint: "რა შედის ფასში, რას იხდიან დამატებით, ტრანსპორტი.",
      },
      {
        key: "trFacts", p: TR, kind: "textarea", rows: 4,
        label: "ფაქტები და დეტალები", orig: "Факты и детали",
      },
      {
        key: "trAudience", p: TR, kind: "textarea", rows: 3,
        label: "ვისთვისაა", orig: "Целевая аудитория",
      },
    ],
  },
  {
    key: "location",
    title: "ლოკაცია და შეხვედრა",
    fields: [
      { key: "city", p: BOTH, kind: "text", req: true, label: "ქალაქი (საიდან იწყება)", orig: "City / Город", placeholder: "Batumi" },
      {
        key: "gygLocations", p: GYG, kind: "list", req: true,
        label: "ადგილები, რასაც ნახავენ", orig: "Locations",
        hint: "ინგლისურად, თითო ხაზზე: „სახელი, მუნიციპალიტეტი“ — მაგ. „Makhuntseti Waterfall, Keda“, „Batumi“. გაფართოება GYG-ის სიიდან მხოლოდ ზუსტად ამ ადგილს აირჩევს (სხვა ქალაქის ამავე სახელის ადგილს — არა); რასაც ვერ იპოვის, პანელში ჩამოგიწერს.",
      },
      { key: "gygKeywords", p: GYG, kind: "list", max: 15, label: "საკვანძო სიტყვები", orig: "Keywords", hint: "GYG-ის სიიდან, ინგლისურად: Nature, Scenic, Wine, Local culture, Family friendly, Guided Tour, Outdoor Recreation, Cooking…" },
      {
        key: "meetingMode", p: BOTH, kind: "select", req: true,
        label: "შეხვედრა", orig: "Meeting point or pickup / Где начинается",
        options: ["სასტუმროდან აყვანა", "შეხვედრის ადგილი", "ორივე"],
      },
      { key: "gygPickupArea", p: GYG, kind: "textarea", rows: 2, label: "აყვანის ზონა", orig: "Pickup area", placeholder: "Hotels and apartments in Batumi city centre" },
      { key: "trMeetApprox", p: TR, kind: "text", req: true, label: "მიახლოებითი ადგილი", orig: "Примерное место встречи", hint: "ჯავშნამდე ჩანს მოგზაურს." },
      { key: "meetExact", p: BOTH, kind: "text", split: true, label: "ზუსტი ადგილი / მისამართი", orig: "Meeting point / Точное место встречи" },
      { key: "mapLink", p: BOTH, kind: "text", label: "წერტილი რუკაზე (ბმული)", orig: "Map pin / Точка на карте", placeholder: "https://maps.google.com/…" },
      { key: "endPoint", p: GYG, kind: "text", label: "სად მთავრდება", orig: "Arrive back at" },
    ],
  },
  {
    key: "how",
    title: "როგორ მიმდინარეობს",
    fields: [
      {
        key: "languages", p: BOTH, kind: "chips", req: true,
        label: "ტურის ენები", orig: "Languages / Язык",
        options: ["Русский", "English", "ქართული", "Türkçe", "العربية", "Deutsch"],
      },
      { key: "durationHours", p: BOTH, kind: "number", req: true, label: "ხანგრძლივობა (სთ)", orig: "Duration / Длительность" },
      {
        key: "trTransport", p: TR, kind: "select", req: true,
        label: "გადაადგილება", orig: "Способ передвижения",
        options: ["На машине", "На автобусе", "Пешком", "На машине и пешком", "На воде", "Другое"],
      },
      { key: "kidsAllowed", p: BOTH, kind: "check", label: "ბავშვებთან ერთად შეიძლება", orig: "Можно с детьми" },
      { key: "kidsFrom", p: BOTH, kind: "number", label: "ბავშვები რა ასაკიდან (0 = ნებისმიერი)", orig: "Возраст / Age" },
      {
        key: "gygGuide", p: GYG, kind: "select", req: true,
        label: "ვინ ახლავს ტურს", orig: "Who leads or assists customers during the activity?",
        options: ["Live guide or other staff member", "No guide", "Audio guide included"],
        hint: "მძღოლი, რომელიც ტურს თან ახლავს = „Live guide or other staff member“.",
      },
      {
        key: "gygGuideRole", p: GYG, kind: "select",
        label: "მისი როლი", orig: "What is their role in the activity?",
        options: ["Driver", "Tour guide", "Host or Greeter", "Instructor"],
      },
      { key: "gygGuideDesc", p: GYG, kind: "textarea", rows: 2, label: "მძღოლის / გიდის აღწერა", orig: "Driver description", placeholder: "Drives you between the stops and shares local tips along the way." },
      { key: "gygGuideYears", p: GYG, kind: "number", label: "საშუალო გამოცდილება (წელი)", orig: "Average years of experience" },
      { key: "gygFirstAid", p: GYG, kind: "select", label: "პირველადი დახმარების ცოდნა", orig: "First aid certified?", options: ["No", "Yes"] },
      { key: "gygCerts", p: GYG, kind: "textarea", rows: 2, label: "სერტიფიკატები, ლიცენზიები", orig: "Certifications, licenses and expertise" },
      { key: "gygTeam", p: GYG, kind: "textarea", rows: 2, label: "რით გამოირჩევა ჩვენი გუნდი", orig: "What sets your team of guides apart" },
      { key: "gygOutsideCity", p: GYG, kind: "select", label: "სხვა ქალაქში / სოფელში მიდიან?", orig: "Do customers travel to a different city/town?", options: ["Yes", "No"], hint: "ბათუმს გარეთ ტური (მთიანი აჭარა, მახუნცეთი…) = Yes." },
      { key: "gygPrivate", p: GYG, kind: "info", label: "პრივატულია?", orig: "Is this a private activity?", text: "ავტომატურად — ზემოთ არჩეული ფორმატიდან (ინდივიდუალური = Yes)." },
      { key: "gygSkipLine", p: GYG, kind: "check", label: "რიგის გარეშე შესვლა", orig: "Skip the line" },
      { key: "gygWheelchair", p: GYG, kind: "check", label: "ეტლით ხელმისაწვდომია", orig: "Wheelchair accessible" },
    ],
  },
  {
    key: "included",
    title: "რა შედის ფასში",
    fields: [
      { key: "gygIncl", p: GYG, kind: "list", req: true, label: "შედის", orig: "What's included?" },
      { key: "gygFood", p: GYG, kind: "select", req: true, label: "საკვები შედის?", orig: "Is food included in your activity?", options: ["No", "Yes"] },
      { key: "gygTransportUsed", p: GYG, kind: "select", req: true, label: "ტრანსპორტი გამოიყენება?", orig: "Is transportation used during this activity?", options: ["Yes", "No"], hint: "„Yes“-ის შემდეგ საძიებოში ჩაწერე „Car“ / „Minibus“ და მონიშნე ხელით." },
      { key: "gygExcl", p: GYG, kind: "list", label: "არ შედის", orig: "Exclusions" },
      { key: "trExtras", p: TR, kind: "list", label: "დამატებითი ფასიანი სერვისები", orig: "Доп. услуги", hint: "„სახელი — ფასი €“, თითო ხაზზე. Tripster: სერვისებით შეკვეთა საშუალოდ 40%-ით მეტია." },
    ],
  },
  {
    key: "important",
    title: "მნიშვნელოვანი ინფორმაცია",
    fields: [
      {
        key: "gygNotSuitable", p: GYG, kind: "chips",
        label: "ვისთვის არ არის შესაფერისი", orig: "Who is this activity not suitable for?",
        options: ["Wheelchair users", "People with mobility impairments", "Pregnant women", "People with back problems", "People with heart problems", "Children under 3"],
      },
      { key: "gygNotAllowed", p: GYG, kind: "list", label: "რა არ შეიძლება", orig: "What's not allowed?", hint: "GYG-ზე სიიდან ირჩევ (საძიებო ველი) — აქ ჩაწერე შენთვის." },
      { key: "gygPets", p: GYG, kind: "select", label: "შინაური ცხოველები", orig: "Pet policy", options: ["This activity doesn't allow pets", "Pets allowed", "Service animals only"] },
      { key: "gygBring", p: GYG, kind: "list", label: "რა წამოიღონ აუცილებლად", orig: "Mandatory items", hint: "GYG-ზე სიიდან ირჩევ (საძიებო ველი) — აქ ჩაწერე შენთვის." },
      { key: "gygKnow", p: GYG, kind: "list", label: "წინასწარ საცოდნი", orig: "Know before you go" },
      { key: "gygEmergency", p: GYG, kind: "text", req: true, label: "საგანგებო ნომერი", orig: "How can customers contact you in case of an emergency?", placeholder: "+995 504220020", hint: "GYG-ზე ქვეყნის კოდს (Georgia +995) ცალკე ირჩევ; გაფართოება მხოლოდ ნომერს ჩაწერს." },
      { key: "gygVoucher", p: GYG, kind: "textarea", rows: 2, label: "რა ეწეროს ვაუჩერზე", orig: "Ticket / voucher information" },
    ],
  },
  {
    key: "photos",
    title: "ფოტოები",
    fields: [
      {
        key: "photos", p: BOTH, kind: "list", req: true, min: 6,
        label: "ფოტოები (ბმული ან ფაილის სახელი)", orig: "Photos / Фото",
        hint: "Tripster: 6–25 ფოტო, ≤20 MB, მოკლე მხარე ≥1350px, jpg/png; ტრანსპორტი შიგნით და გარეთ. GYG: ჰორიზონტალური, ლოგოს და ტექსტის გარეშე.",
      },
      { key: "photosFolder", p: BOTH, kind: "text", label: "ფოტოების საქაღალდე კომპიუტერზე", orig: "", placeholder: "WWW/gyg-photos" },
      { key: "photosOwn", p: BOTH, kind: "check", req: true, label: "ფოტოები ჩვენია (უფლება გვაქვს)", orig: "Photo rights" },
    ],
  },
  {
    key: "schedule",
    title: "განრიგი და ჯავშნები",
    fields: [
      { key: "trScheduleType", p: TR, kind: "select", req: true, label: "განრიგის ტიპი", orig: "Тип расписания", options: ["Еженедельное", "Фиксированные даты"] },
      { key: "weekdays", p: BOTH, kind: "weekdays", req: true, label: "დღეები და დაწყების დრო", orig: "Schedule / Дни и время начала" },
      { key: "seasonFrom", p: BOTH, kind: "date", label: "სეზონი — დან", orig: "Start date" },
      { key: "seasonTo", p: BOTH, kind: "date", label: "სეზონი — მდე", orig: "End date / До какой даты" },
      { key: "trAhead", p: TR, kind: "select", label: "რამდენი თვით ადრე იჯავშნება", orig: "Публиковать вперёд", options: ["3", "4", "5", "6"] },
      { key: "cutoffHours", p: BOTH, kind: "number", req: true, label: "ჯავშნის დახურვა (სთ-ით ადრე)", orig: "Cut-off time / Закрытие бронирования" },
      { key: "trCloseLate", p: TR, kind: "check", label: "1 სთ-ით ადრე დახურვა, თუ უკვე არის გადახდილი შეკვეთა", orig: "Закрывать бронирование за 1 час… (დახურვა 1 სთ-ით ადრე)" },
      { key: "gygAutoAccept", p: GYG, kind: "check", label: "ჯავშნების ავტომატური დადასტურება", orig: "Automatically accept new bookings" },
    ],
  },
  {
    key: "pricing",
    title: "ფასის წესები",
    fields: [
      {
        key: "gygCategories", p: GYG, kind: "chips",
        label: "ფასის კატეგორიები", orig: "Pricing categories",
        options: ["Adult", "Child", "Youth", "Infant", "Senior", "Student"],
      },
      { key: "gygChildAges", p: GYG, kind: "text", label: "ასაკები კატეგორიებისთვის", orig: "Age ranges", placeholder: "Adult 18–99, Child 4–17, Infant 0–3 (free)" },
      { key: "trDiscount", p: TR, kind: "number", label: "ფასდაკლება %", orig: "Скидка", hint: "Tripster გირჩევს 15–35%-ს." },
      { key: "trBestPrice", p: TR, kind: "info", label: "საუკეთესო ფასის წესი", orig: "", text: "Tripster-ის ფასი საკომისიოთი (~25%) არ უნდა აღემატებოდეს georgiatrips.ge-ზე არსებულ ფასს." },
    ],
  },
];

export const ALL_FIELDS = SECTIONS.flatMap((s) => s.fields);

// Georgian names for the values the sites show in their dropdowns. The value
// itself stays in the site's language: the extension looks for that text.
export const OPTION_KA = {
  // Tripster „Тип“
  "Экскурсия": "ექსკურსია",
  "Многодневный тур": "მრავალდღიანი ტური",
  "Активный отдых": "აქტიური დასვენება",
  "На воде": "წყალზე",
  "Квест": "კვესტი",
  "Водная прогулка": "წყალზე გასეირნება",
  "Трансфер": "ტრანსფერი",
  "Трансфер с экскурсией": "ტრანსფერი ექსკურსიით",
  "Мастер-класс": "მასტერკლასი",
  "Фотосессия": "ფოტოსესია",
  // GYG product category
  Tour: "ტური",
  "Tour (more than one day)": "მრავალდღიანი ტური",
  "Entry ticket": "შესასვლელი ბილეთი",
  "City card": "ქალაქის ბარათი",
  "Hop-on hop-off ticket": "Hop-on hop-off ავტობუსის ბილეთი",
  "Transport experience": "ტრანსპორტით მომსახურება",
  "Rental experience": "გაქირავება",
  Other: "სხვა",
  // Languages
  English: "ინგლისური",
  German: "გერმანული",
  French: "ფრანგული",
  Spanish: "ესპანური",
  Italian: "იტალიური",
  Portuguese: "პორტუგალიური",
  Dutch: "ჰოლანდიური",
  Polish: "პოლონური",
  "Русский": "რუსული",
  "Türkçe": "თურქული",
  "العربية": "არაბული",
  Deutsch: "გერმანული",
  // Tripster „Способ передвижения“
  "На машине": "მანქანით",
  "На автобусе": "ავტობუსით",
  "Пешком": "ფეხით",
  "На машине и пешком": "მანქანით და ფეხით",
  "Другое": "სხვა",
  // GYG guide
  "Live guide or other staff member": "გიდი ან სხვა თანამშრომელი (მძღოლიც)",
  "No guide": "გიდის გარეშე",
  "Audio guide included": "აუდიო გიდი",
  Driver: "მძღოლი",
  "Tour guide": "გიდი",
  "Host or Greeter": "მასპინძელი / დამხვედრი",
  Instructor: "ინსტრუქტორი",
  Yes: "კი",
  No: "არა",
  // GYG not suitable for
  "Wheelchair users": "ეტლით მოსარგებლეები",
  "People with mobility impairments": "გადაადგილების პრობლემის მქონეები",
  "Pregnant women": "ორსულები",
  "People with back problems": "ზურგის პრობლემის მქონეები",
  "People with heart problems": "გულის პრობლემის მქონეები",
  "Children under 3": "3 წლამდე ბავშვები",
  // GYG pets
  "This activity doesn't allow pets": "ცხოველები არ დაიშვება",
  "Pets allowed": "ცხოველები დაიშვება",
  "Service animals only": "მხოლოდ დამხმარე ცხოველები",
  // Tripster schedule
  "Еженедельное": "ყოველკვირეული",
  "Фиксированные даты": "კონკრეტული თარიღები",
  // GYG pricing categories
  Adult: "ზრდასრული",
  Child: "ბავშვი",
  Youth: "მოზარდი",
  Infant: "ჩვილი",
  Senior: "ხანდაზმული",
  Student: "სტუდენტი",
};

/** "ექსკურსია (Экскурсия)" — Georgian first, the site's own word after it. */
export function optionLabel(value, field) {
  if (field?.key === "trAhead") return `${value} თვით ადრე`;
  const ka = OPTION_KA[value];
  return ka && ka !== value ? `${ka} (${value})` : String(value);
}

// Fields that are not prose: links, numbers, file names, phone.
const NO_WRITE_LANG = new Set(["mapLink", "photos", "photosFolder", "gygEmergency"]);
const LANG_KA = { EN: "ინგლისურად", RU: "რუსულად" };

/**
 * In which language the person writes a field for a platform:
 * { code: "EN", text: "ინგლისურად" } or null (not prose).
 * GYG is written in the "Product language" (English by default), Tripster in Russian.
 */
export function writeLang(field, platform, listing) {
  if (!["text", "textarea", "list"].includes(field.kind) || NO_WRITE_LANG.has(field.key)) return null;
  if (field.key === "city") return { code: "EN", text: "ლათინურად (Batumi)" };
  const p = platform || (field.p.length === 1 ? field.p[0] : null);
  if (!p) return { code: "EN", text: "ინგლისურად" };
  if (p === "gyg") {
    const lang = listing?.fields?.gygWriteLang || "English";
    if (lang !== "English") return { code: lang.slice(0, 2).toUpperCase(), text: `${OPTION_KA[lang] || lang} ენაზე` };
  }
  const code = PLATFORMS[p].lang;
  return { code, text: LANG_KA[code] };
}

export const WEEKDAYS = ["ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ", "კვი"];

// Default option titles, the way GYG wants them ("Private Tour by Sedan (up to 3 people)").
export const VEHICLE_EN = { sedan: "Sedan", minivan: "Minivan", jeep: "4x4 Jeep", sprinter: "Sprinter" };

/** Is a field's value filled in for this platform? */
export function fieldFilled(field, value, platform) {
  if (field.kind === "info") return true;
  const v = field.split ? value?.[platform] : value;
  if (field.kind === "check") return v === true;
  if (field.kind === "weekdays") return Boolean(v && Object.values(v).some(Boolean));
  if (field.kind === "list") {
    const n = String(v || "").split("\n").filter((l) => l.trim()).length;
    return n >= (field.min || 1);
  }
  if (field.kind === "chips") return Array.isArray(v) && v.length > 0;
  if (field.minChars) return String(v || "").trim().length >= field.minChars;
  return v != null && String(v).trim() !== "";
}

/** Required fields of a platform done / total, including prices. */
export function platformProgress(listing, platform) {
  const fields = ALL_FIELDS.filter((f) => f.req && f.p.includes(platform));
  let done = fields.filter((f) => fieldFilled(f, listing.fields?.[f.key], platform)).length;
  let total = fields.length;
  total += 1;
  if (hasPrices(listing, platform)) done += 1;
  return { done, total, pct: Math.round((done / total) * 100) };
}

export function hasPrices(listing, platform) {
  if (listing.format === "group") return Number(listing.group?.prices?.[platform]) > 0;
  return Object.values(listing.vehicles || {}).some((v) => v?.on && Number(v.prices?.[platform]) > 0);
}

/** Whole days from today (local) to an ISO date; negative = in the past. */
export function daysUntil(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y) return null;
  const target = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / 86400000);
}
