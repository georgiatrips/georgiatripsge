import { GEORGIA_REGIONS } from "./placesMeta";

export const ALL_TOURS = [
  {
    id: "promethe-martvili",
    title: "პრომეთეს მღვიმე, მარტვილის კანიონი & ცხელი წყლები",
    desc: "პრომეთეს მღვიმის საოცარი სტალაქტიტები, ნავით გასეირნება მარტვილში და თერმული წყლები.",
    duration: "14 საათი",
    durationHours: 14,
    type: "oneday", // oneday | multiday
    typeLabel: "ერთდღიანი",
    location: "📍 ბათუმი, ჩაქვი, ქობულეთი",
    destination: "აჭარა",
    destinationLabel: "ბათუმი",
    priceGroup: "₾100/კაცი",
    pricePrivate: "₾500",
    dates: ["07.28", "07.31", "08.02"],
    badge: "TOP 1 პოპულარული",
    img: "https://images.unsplash.com/photo-1565008576549-57569a49371d?w=800&q=80",
    category: "popular"
  },
  {
    id: "adjara-mountains",
    title: "მთიანი აჭარის სრული ტური 1 დღეში",
    desc: "მახუნცეთის ჩანჩქერი, თამარის ისტორიული ხიდი, მირვეთის ხეობა და ქართული ტრადიციული სუფრა.",
    duration: "10 საათი",
    durationHours: 10,
    type: "oneday",
    typeLabel: "ერთდღიანი",
    location: "📍 ბათუმიდან",
    destination: "აჭარა",
    destinationLabel: "ბათუმი",
    priceGroup: "₾80/კაცი",
    pricePrivate: "₾400",
    dates: ["07.28", "07.29", "08.01"],
    badge: "TOP 2 პოპულარული",
    img: "/batumi.png",
    category: "popular"
  },
  {
    id: "kazbegi-gergeti",
    title: "ყაზბეგის მთები & გერგეთი",
    desc: "გერგეთის სამება, ულამაზესი ხედი მყინვარწვერზე და დაუვიწყარი ალპური ხეობები.",
    duration: "10 საათი",
    durationHours: 10,
    type: "oneday",
    typeLabel: "ერთდღიანი",
    location: "📍 ბათუმი, თბილისი",
    destination: "მცხეთა-მთიანეთი",
    destinationLabel: "ყაზბეგი",
    priceGroup: "₾170/კაცი",
    pricePrivate: "₾500",
    dates: ["07.27", "07.28", "07.30"],
    badge: "მთის ჰაერი",
    img: "https://images.unsplash.com/photo-1565008576549-57569a49371d?w=800&q=80",
    category: "nature"
  },
  {
    id: "mtirala",
    title: "მტირალას ეროვნული პარკი",
    desc: "ევროპის ყველაზე ნოტიო პარკი — ტყის ბილიკები, ზიპლაინი და ტბაზე გასეირნება.",
    duration: "6 საათი",
    durationHours: 6,
    type: "oneday",
    typeLabel: "ერთდღიანი",
    location: "📍 ბათუმი, ქობულეთი",
    destination: "აჭარა",
    destinationLabel: "ბათუმი",
    priceGroup: "₾80/კაცი",
    pricePrivate: "₾250",
    dates: ["07.28", "07.30", "08.01"],
    badge: "ეკო ტური",
    img: "https://images.unsplash.com/photo-1540202404-d0c7fe46a087?w=700&q=75",
    category: "nature"
  },
  {
    id: "tbilisi-mcxeta",
    title: "თბილისის ძველი ქალაქი & მცხეთა",
    desc: "ნარიყალა, სვეტიცხოველი, ჯვრის მონასტერი და ძველი ქალაქის ისტორიული აბანოები.",
    duration: "8 საათი",
    durationHours: 8,
    type: "oneday",
    typeLabel: "ერთდღიანი",
    location: "📍 თბილისიდან",
    destination: "თბილისი",
    destinationLabel: "თბილისი",
    priceGroup: "₾150/კაცი",
    pricePrivate: "₾450",
    dates: ["07.27", "07.29", "07.31"],
    badge: "ისტორია & კულტურა",
    img: "/tbilisi.png",
    category: "culture"
  },
  {
    id: "mestia-ushguli",
    title: "მესტიის & უშგულის საიდუმლო",
    desc: "სვანური კოშკები, უშგულის ავთენტური სოფელი და საუკუნოვანი კულტურა.",
    duration: "24+ საათი",
    durationHours: 36,
    type: "multiday",
    typeLabel: "მრავალდღიანი",
    location: "📍 ზუგდიდი, მესტია",
    destination: "სამეგრელო-ზემო სვანეთი",
    destinationLabel: "სვანეთი",
    priceGroup: "₾350/კაცი",
    pricePrivate: "₾950",
    dates: ["07.28", "08.01", "08.05"],
    badge: "UNESCO მემკვიდრეობა",
    img: "/mestia.png",
    category: "culture"
  },
  {
    id: "kakheti-wine",
    title: "კახეთის ღვინის მარშრუტი",
    desc: "სიღნაღი, ბოდბის მონასტერი, ქვევრის ღვინის დეგუსტაცია და ქართული სუფრა.",
    duration: "10 საათი",
    durationHours: 10,
    type: "oneday",
    typeLabel: "ერთდღიანი",
    location: "📍 თბილისიდან",
    destination: "კახეთი",
    destinationLabel: "კახეთი",
    priceGroup: "₾180/კაცი",
    pricePrivate: "₾520",
    dates: ["07.29", "07.31", "08.03"],
    badge: "ღვინის სამშობლო",
    img: "/kakheti.png",
    category: "taste"
  },
  {
    id: "machakhela",
    title: "მაჭახელას ხეობა & აჭარული სუფრა",
    desc: "ისტორიული ხიდები, ჩანჩქერები, აჭარული ხაჭაპური და ფოლკლორული შოუ.",
    duration: "7 საათი",
    durationHours: 7,
    type: "oneday",
    typeLabel: "ერთდღიანი",
    location: "📍 ბათუმიდან",
    destination: "აჭარა",
    destinationLabel: "ბათუმი",
    priceGroup: "₾90/კაცი",
    pricePrivate: "₾280",
    dates: ["07.27", "07.29", "07.31"],
    badge: "ეთნო გასტრონომია",
    img: "/villa.png",
    category: "taste"
  },
  {
    id: "khulo-goderdzi",
    title: "ხულო, მწვანე ტბა & გოდერძი",
    desc: "საბაგირო ხულოში, მწვანე ტბის ალპური სილამაზე და გოდერძის უღელტეხილი.",
    duration: "9 საათი",
    durationHours: 9,
    type: "oneday",
    typeLabel: "ერთდღიანი",
    location: "📍 ბათუმი, ხულო",
    destination: "აჭარა",
    destinationLabel: "ბათუმი",
    priceGroup: "₾120/კაცი",
    pricePrivate: "₾350",
    dates: ["07.27", "07.28", "07.30"],
    badge: "ალპური თავგადასავალი",
    img: "/batumi.png",
    category: "adventure"
  },
  {
    id: "heli-caucasus",
    title: "კავკასიონის ვერტმფრენის ტური",
    desc: "კავკასიის მწვერვალები და მიუწვდომელი ხეობები ჩიტის ფრენის სიმაღლიდან.",
    duration: "4 საათი",
    durationHours: 4,
    type: "oneday",
    typeLabel: "ერთდღიანი",
    location: "📍 სტეფანწმინდა",
    destination: "მცხეთა-მთიანეთი",
    destinationLabel: "ყაზბეგი",
    priceGroup: "₾1200/კაცი",
    pricePrivate: "₾3500",
    dates: ["07.28", "07.30", "08.04"],
    badge: "ექსტრემალური",
    img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
    category: "adventure"
  },
  {
    id: "vip-villas",
    title: "VIP ფუფუნების ვილები & რიზორტი",
    desc: "ექსკლუზიური დასვენება საუკეთესო ვილებში, პირადი მზარეულითა და ასისტენტით.",
    duration: "48+ საათი",
    durationHours: 48,
    type: "multiday",
    typeLabel: "მრავალდღიანი",
    location: "📍 ყაზბეგი, ბათუმი",
    destination: "მცხეთა-მთიანეთი",
    destinationLabel: "ყაზბეგი",
    priceGroup: "₾800/კაცი",
    pricePrivate: "₾2200",
    dates: ["07.27", "07.29", "08.02"],
    badge: "5★ VIP ექსკლუზივი",
    img: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
    category: "luxury"
  },
  {
    id: "batumi-yacht",
    title: "ბათუმის პრემიუმ სანაპირო & იახტა",
    desc: "გასეირნება კერძო იახტით შავ ზღვაზე, დელფინების ყურება და მზის ჩასვლა.",
    duration: "5 საათი",
    durationHours: 5,
    type: "oneday",
    typeLabel: "ერთდღიანი",
    location: "📍 ბათუმის პორტი",
    destination: "აჭარა",
    destinationLabel: "ბათუმი",
    priceGroup: "₾450/კაცი",
    pricePrivate: "₾1300",
    dates: ["07.28", "07.31", "08.03"],
    badge: "VIP იახტ ტური",
    img: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=700&q=75",
    category: "luxury"
  },
  {
    id: "gudauri-panoramic",
    title: "გუდაურის პანორამული ტური",
    desc: "პანორამული საბაგიროები, პარაპლანით ფრენა და ალპური პანორამა გუდაურში.",
    duration: "12 საათი",
    durationHours: 12,
    type: "oneday",
    typeLabel: "ერთდღიანი",
    location: "📍 გუდაური",
    destination: "მცხეთა-მთიანეთი",
    destinationLabel: "გუდაური",
    priceGroup: "₾200/კაცი",
    pricePrivate: "₾580",
    dates: ["07.28", "07.29", "07.31"],
    badge: "სეზონური ჰაილაითი",
    img: "/gudauri.png",
    category: "seasons"
  },
  {
    id: "family-seasonal",
    title: "საოჯახო სეზონური მოგზაურობა",
    desc: "სპეციალურად დაგეგმილი მშვიდი მარშრუტები ბავშვებთან ერთად კომფორტული მგზავრობით.",
    duration: "36+ საათი",
    durationHours: 36,
    type: "multiday",
    typeLabel: "მრავალდღიანი",
    location: "📍 ბათუმი, აჭარა",
    destination: "აჭარა",
    destinationLabel: "ბათუმი",
    priceGroup: "₾450/კაცი",
    pricePrivate: "₾1200",
    dates: ["07.27", "07.28", "07.31"],
    badge: "საოჯახო პაკეტი",
    img: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80",
    category: "seasons"
  }
];

export const DESTINATIONS = [
  { value: "all", label: "ყველა რეგიონი" },
  ...GEORGIA_REGIONS.map((region) => ({ value: region, label: region })),
];

export const ALL_TOURS_SCHEDULE = [
  {
    id: "adjara-mountains",
    title: "მთიანი აჭარის სრული ტური 1 დღეში სუფრით",
    priceGroup: "120 ₾ / კაცი",
    priceNote: "ქართული სუფრა შედის, ფასდაკლება ბავშვებისთვის",
    locationShort: "ბათუმიდან. მთები, 5 ჩანჩქერი, მდინარეების შესართავი, თამარ მეფის ხიდები, გვარას ციხე, ქართული სუფრა ცეკვითა და სიმღერით",
    desc: "მახუნცეთის ჩანჩქერი, მირვეთის ხეობა და ულამაზესი ალპური ხედები.",
    months: [
      { monthName: "ივლისი", dates: ["28.07", "29.07"] },
      { monthName: "აგვისტო", dates: ["01.08", "04.08", "05.08", "08.08", "11.08", "12.08", "15.08", "18.08", "19.08", "22.08", "25.08", "26.08", "29.08"] },
      { monthName: "სექტემბერი", dates: ["02.09", "03.09", "05.09", "09.09", "10.09", "12.09", "16.09", "17.09", "19.09", "23.09", "24.09", "26.09", "30.09"] }
    ]
  },
  {
    id: "machakhela",
    title: "მთიანი აჭარა მახუნცეთითა და კაფეებით",
    priceGroup: "65 ₾ / კაცი",
    priceNote: "ფასდაკლება ბავშვებისთვის",
    locationShort: "ბათუმიდან. მთები, 3 ჩანჩქერი, მდინარეების შესართავი, თამარ მეფის ხიდი და მახუნცეთის ჩანჩქერი, გვარას ციხე",
    desc: "ეკო ტური აჭარის ულამაზეს ხეობებში.",
    months: [
      { monthName: "ივლისი", dates: ["27.07", "30.07"] },
      { monthName: "აგვისტო", dates: ["03.08", "06.08", "10.08", "13.08", "17.08", "20.08", "24.08", "27.08", "31.08"] },
      { monthName: "სექტემბერი", dates: ["07.09", "14.09", "21.09", "28.09"] }
    ]
  },
  {
    id: "promethe-martvili",
    title: "პრომეთეს მღვიმე, მარტვილის კანიონი, მარანი და ცხელი წყლები",
    priceGroup: "100 ₾ / კაცი + შესასვლელი ბილეთები",
    priceNote: "ფასდაკლება ბავშვებისთვის",
    locationShort: "ბათუმიდან, ჩაქვიდან, ქობულეთიდან. ბანაობა თერმულ წყაროებში",
    desc: "პრომეთეს მღვიმის სტალაქტიტები, ნავით გასეირნება მარტვილში და თერმული წყლები.",
    months: [
      { monthName: "ივლისი", dates: ["28.07", "31.07"] },
      { monthName: "აგვისტო", dates: ["02.08", "04.08", "06.08", "09.08", "11.08", "13.08", "16.08", "18.08", "20.08", "21.08", "23.08", "25.08", "28.08", "30.08"] },
      { monthName: "სექტემბერი", dates: ["01.09", "06.09", "08.09", "13.09", "15.09", "20.09", "22.09", "27.09", "29.09"] }
    ]
  },
  {
    id: "tskaltubo-kutaisi",
    title: "პრომეთეს მღვიმე, წყალტუბოს მიტოვებული სანატორიუმები, ქუთაისი და ურეკი",
    priceGroup: "100 ₾ / კაცი + შესასვლელი ბილეთები",
    priceNote: "ფასდაკლება ბავშვებისთვის",
    locationShort: "ბათუმიდან, ჩაქვიდან, ქობულეთიდან. ყველაზე უჩვეულო ექსკურსია დასავლეთ საქართველოში",
    desc: "ისტორიული არქიტექტურა, კანიონები და ურეკის მაგნიტური ქვიშები.",
    months: [
      { monthName: "ივლისი", dates: ["29.07"] },
      { monthName: "აგვისტო", dates: ["05.08", "12.08", "19.08", "26.08"] },
      { monthName: "სექტემბერი", dates: ["02.09", "09.09", "16.09", "23.09", "30.09"] }
    ]
  },
  {
    id: "martvili-ureki",
    title: "მარტვილის კანიონი, ტაძარი, ცხელი წყლები და მაგნიტური ქვიშები",
    priceGroup: "100 ₾ / კაცი + შესასვლელი ბილეთები",
    priceNote: "ფასდაკლება ბავშვებისთვის",
    locationShort: "ბათუმიდან, ჩაქვიდან, ქობულეთიდან. ბანაობა თერმულ წყაროებსა და მაგნიტურ ქვიშებზე",
    desc: "მარტვილის ულამაზესი ჩანჩქერები და დასვენება შავ ზღვაზე.",
    months: [
      { monthName: "ივლისი", dates: ["30.07"] },
      { monthName: "აგვისტო", dates: ["07.08", "14.08", "22.08", "27.08"] },
      { monthName: "სექტემბერი", dates: ["03.09", "10.09", "17.09", "24.09"] }
    ]
  }
];

export function getTourById(id) {
  const tour = ALL_TOURS.find((t) => t.id === id);
  if (!tour) return ALL_TOURS[0];
  return tour;
}

const GEO_MONTH_NAMES = [
  "იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი",
  "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"
];

/**
 * Returns the free-dates schedule for a single tour, grouped by month:
 * [{ monthName: "ივლისი", monthIndex: 6, dates: ["28.07", ...] }]
 *
 * Prefers the curated ALL_TOURS_SCHEDULE entry; otherwise builds the
 * groups from the tour's own `dates` array (stored as "MM.DD").
 */
export function getTourSchedule(tourId) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const currentYear = now.getFullYear();

  const isUpcomingDate = (dd, mm) => {
    const day = parseInt(dd, 10);
    const monthIndex = parseInt(mm, 10) - 1;
    if (isNaN(day) || isNaN(monthIndex)) return false;
    const target = new Date(currentYear, monthIndex, day);
    target.setHours(0, 0, 0, 0);
    return target > now;
  };

  const curated = ALL_TOURS_SCHEDULE.find((s) => s.id === tourId);
  if (curated) {
    return curated.months
      .map((m) => {
        const filteredDates = m.dates.filter((dStr) => {
          const [dd, mm] = dStr.split(".");
          return isUpcomingDate(dd, mm);
        });
        return {
          monthName: m.monthName,
          monthIndex: GEO_MONTH_NAMES.indexOf(m.monthName),
          dates: filteredDates
        };
      })
      .filter((mGroup) => mGroup.dates.length > 0);
  }

  const tour = ALL_TOURS.find((t) => t.id === tourId);
  if (!tour || !tour.dates || tour.dates.length === 0) return [];

  const grouped = new Map();
  for (const raw of tour.dates) {
    const [mm, dd] = raw.split(".");
    if (!isUpcomingDate(dd, mm)) continue;
    const monthIndex = parseInt(mm, 10) - 1;
    if (isNaN(monthIndex) || !dd) continue;
    if (!grouped.has(monthIndex)) grouped.set(monthIndex, []);
    grouped.get(monthIndex).push(`${dd}.${mm}`);
  }

  return Array.from(grouped.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([monthIndex, dates]) => ({
      monthName: GEO_MONTH_NAMES[monthIndex] || "",
      monthIndex,
      dates: dates.sort()
    }))
    .filter((mGroup) => mGroup.dates.length > 0);
}

export function getTourDetails(tour) {
  const detailsMap = {
    "promethe-martvili": {
      departure: "ბათუმი, ქობულეთი, ჩაქვი",
      meetingPoint: "სასტუმროდან / საცხოვრებელი მისამართიდან გაყვანა",
      dressCode: "კომფორტული ფეხსაცმელი, საცურაო კოსტიუმი და პირსახოცი",
      includes: [
        "კომფორტული ტრანსპორტი კონდიციონერით",
        "პროფესიონალი გიდისა და მძღოლის მომსახურება",
        "ნავით გასეირნება მარტვილის კანიონში",
        "თერმულ წყაროებზე გაჩერება"
      ],
      excludes: [
        "პრომეთეს მღვიმის შესასვლელი ბილეთი (₾23)",
        "მარტვილის კანიონის შესასვლელი ბილეთი (₾20)",
        "სადილი (სურვილისამებრ რესტორანში)"
      ],
      payment: "გადახდა გამგზავრების დღეს (ნაღდი ანგარიშსწორებით ან გადარიცხვით)",
      highlights: [
        "პრომეთეს მღვიმის საოცარი სტალაქტიტები და სტალაგმიტები",
        "ზურმუხტისფერი მარტვილის კანიონი და ნავით გასეირნება",
        "ბუნებრივი თერმული გოგირდის წყაროები",
        "წყალტუბოს ისტორიული ხედები"
      ],
      gallery: [
        "https://images.unsplash.com/photo-1565008576549-57569a49371d?w=800&q=80",
        "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80",
        "https://images.unsplash.com/photo-1583484963886-cfe2bff2945f?w=800&q=80"
      ],
      itinerary: [
        { title: "პრომეთეს მღვიმე & მიწისქვეშა მდინარე", desc: "1.4 კმ საფეხმავლო ბილიკი 6 დარბაზში საოცარი განათებით, სტალაქტიტებითა და სტალაგმიტებით.", img: "https://images.unsplash.com/photo-1565008576549-57569a49371d?w=800&q=80" },
        { title: "მარტვილის კანიონი & ნავით გასეირნება", desc: "ზურმუხტისფერი მდინარე აბაშა, ჩანჩქერების ხეობა და 20-წუთიანი ნავით გასეირნება.", img: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80" },
        { title: "სადილი იმერულ-მეგრულ რესტორანში", desc: "ადგილობრივი კერძების დაგემოვნება: იმერული ხაჭაპური, ელარჯი, ჭვიშტარი და ქართული ღვინო.", img: "https://images.unsplash.com/photo-1540202404-d0c7fe46a087?w=800&q=80" },
        { title: "ბუნებრივი თერმული ცხელი წყაროები", desc: "ნოკალაქევის გოგირდის თერმული წყაროები, სადაც შეგიძლიათ იბანაოთ ბუნებრივ აუზებში.", img: "https://images.unsplash.com/photo-1583484963886-cfe2bff2945f?w=800&q=80" },
        { title: "ნოკალაქევის ციხე & არქეოპოლისი", desc: "ადგილობრივი გიდის თანხლებით ლეგენდარული ნოკალაქევის ციხე-ქალაქის მონახულება.", img: "https://images.unsplash.com/photo-1565008576549-57569a49371d?w=800&q=80" },
        { title: "სალხინოს დადიანების სასახლე", desc: "სამეგრელოს მთავრების ისტორიული რეზიდენცია და ულამაზესი ფრანგული პარკი.", img: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80" }
      ],
      reviews: [
        { name: "გიორგი მ.", date: "2026 წლის ივლისი", rating: 5, comment: "საოცარი ტური იყო! გიდი ძალიან ყურადღებიანი, მარტვილის კანიონი და პრომეთეს მღვიმე უბრალოდ ჯადოსნურია." },
        { name: "ანა კ.", date: "2026 წლის ივნისი", rating: 5, comment: "თერმული წყაროები იყო საუკეთესო დასასრული დამღლელი დღის შემდეგ. ტრანსპორტი ძალიან კომფორტული." },
        { name: "Dmitry S.", date: "2026 წლის ივნისი", rating: 5, comment: "Отличный тур! Организация на высшем уровне, водитель профессионал. Рекомендую всем!" }
      ]
    },
    "adjara-mountains": {
      departure: "ბათუმი",
      meetingPoint: "ბათუმის ცენტრიდან ან სასტუმროდან",
      dressCode: "მოსახერხებელი ტანსაცმელი და ფოტოაპარატი",
      includes: [
        "ტრანსპორტირება მთიან აჭარაში",
        "ქართული ტრადიციული სუფრა (ღვინო, ჭაჭა, აჭარული კერძები)",
        "გიდის თანხლება",
        "ფოლკლორული მუსიკალური გაფორმება"
      ],
      excludes: [
        "პირადი ხარჯები"
      ],
      payment: "გადახდა გამგზავრებისას",
      highlights: [
        "მახუნცეთის 50-მეტრიანი ჩანჩქერი",
        "XII საუკუნის თამარ მეფის ისტორიული ქვის ხიდი",
        "მირვეთის მწვანე ხეობა და ბამბუკის ტყე",
        "ტრადიციული აჭარული ოჯახური სუფრა"
      ],
      gallery: [
        "/batumi.png",
        "https://images.unsplash.com/photo-1540202404-d0c7fe46a087?w=800&q=80",
        "/villa.png"
      ],
      itinerary: [
        { title: "ჭოროხისა და აჭარისწყლის შესართავი", desc: "ორი მდინარის შეერთების ულამაზესი ხედი.", img: "/batumi.png" },
        { title: "მირვეთის ჩანჩქერი & ბამბუკის ტყე", desc: "სასეირნო ბილიკი საიდუმლო ჩანჩქერამდე.", img: "https://images.unsplash.com/photo-1540202404-d0c7fe46a087?w=800&q=80" },
        { title: "თამარ მეფის ხიდი & მახუნცეთის ჩანჩქერი", desc: "XII საუკუნის თაღოვანი ხიდი და 50მ ჩანჩქერი.", img: "/villa.png" },
        { title: "აჭარული ტრადიციული სუფრა", desc: "საოჯახო მარანი, ფოლკლორი, აჭარული ხინკალი და ღვინის დეგუსტაცია.", img: "/batumi.png" }
      ],
      reviews: [
        { name: "ნინო ბ.", date: "2026 წლის ივლისი", rating: 5, comment: "სუფრა და ფოლკლორი იყო უმაღლეს დონეზე! ნამდვილი ქართული სტუმართმოყვარეობა." },
        { name: "Levan K.", date: "2026 წლის ივნისი", rating: 5, comment: "მახუნცეთი და მირვეთი უპირობოდ სანახავია აჭარაში ჩამოსვლისას." }
      ]
    },
    "kazbegi-gergeti": {
      departure: "თბილისი / ბათუმი",
      meetingPoint: "სასტუმროდან გაყვანა",
      dressCode: "თბილი მოსაცმელი და სპორტული ფეხსაცმელი",
      includes: [
        "მაღალი გამავლობის 4x4 ტრანსპორტი",
        "გიდის მომსახურება",
        "ანანურის ციხისა და ჟინვალის წყალსაცავის დათვალიერება"
      ],
      excludes: [
        "სადილი (ყაზბეგური ხინკალი)"
      ],
      payment: "გადახდა გამგზავრებისას",
      highlights: [
        "გერგეთის XIV საუკუნის სამების ტაძარი 2170მ სიმაღლეზე",
        "მყინვარწვერის (5054მ) პანორამული ხედები",
        "დარიალის ხეობა და გუდაურის ხალხთა მეგობრობის მონუმენტი"
      ],
      gallery: [
        "https://images.unsplash.com/photo-1565008576549-57569a49371d?w=800&q=80",
        "/gudauri.png",
        "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80"
      ],
      itinerary: [
        { title: "ჟინვალის წყალსაცავი & ანანურის ციხე", desc: "ფოტო-პაუზა ჟინვალზე და XVII საუკუნის ციხესიმაგრე.", img: "https://images.unsplash.com/photo-1565008576549-57569a49371d?w=800&q=80" },
        { title: "გუდაურის პანორამული მონუმენტი", desc: "ხალხთა მეგობრობის მონუმენტი 2200მ სიმაღლეზე.", img: "/gudauri.png" },
        { title: "გერგეთის სამების ტაძარი", desc: "4x4 დელიკებით ასვლა 2170მ-ზე მყინვარწვერის ხედით.", img: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80" },
        { title: "სადილი ფასანაურში", desc: "ნამდვილი მთის ხინკლის დაგემოვნება.", img: "https://images.unsplash.com/photo-1540202404-d0c7fe46a087?w=800&q=80" }
      ],
      reviews: [
        { name: "Alex R.", date: "2026 წლის ივლისი", rating: 5, comment: "Unbelievable view of Mount Kazbek! The 4x4 ride up to Gergeti was super exciting." }
      ]
    }
  };

  const specific = detailsMap[tour.id];
  const base = specific ? { ...tour, ...specific } : {
    ...tour,
    departure: tour.location ? tour.location.replace("📍 ", "") : "ბათუმი",
    meetingPoint: "სასტუმროდან ან მითითებული მისამართიდან გაყვანა",
    dressCode: "კომფორტული ტანსაცმელი და მოსახერხებელი ფეხსაცმელი",
    includes: [
      "კომფორტული ტრანსპორტირება",
      "გამოცდილი მძღოლისა და გიდის მომსახურება",
      "ინდივიდუალური / ჯგუფური მარშრუტი"
    ],
    excludes: [
      "ლოკაციების შესასვლელი ბილეთები",
      "პირადი ხარჯები და კვება"
    ],
    payment: "გადახდა გამგზავრების დღეს (ნაღდი ანგარიშსწორებით)",
    highlights: [
      tour.desc,
      "ულამაზესი პანორამული ხედები და ფოტო-ზონები",
      "ადგილობრივი კულტურისა და ბუნების გაცნობა"
    ],
    gallery: [
      tour.img,
      "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80",
      "https://images.unsplash.com/photo-1583484963886-cfe2bff2945f?w=800&q=80"
    ]
  };

  if (!base.itinerary) {
    base.itinerary = [
      { title: "პირველი ლოკაცია & ექსკურსია", desc: "ღირსშესანიშნაობის დათვალიერება გიდთან ერთად.", img: tour.img },
      { title: "სადილი & დასვენება", desc: "ადგილობრივ რესტორანში სადილი და თავისუფალი დრო.", img: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80" },
      { title: "მეორე ლოკაცია & ფოტო-ზონები", desc: "ულამაზესი პანორამული ხედები და ფოტოების გადაღება.", img: "https://images.unsplash.com/photo-1583484963886-cfe2bff2945f?w=800&q=80" }
    ];
  }

  if (!base.reviews) {
    base.reviews = [
      { name: "მარიამ ც.", date: "2026 წლის ივლისი", rating: 5, comment: "ძალიან კარგად ორგანიზებული ტური. დიდი მადლობა გიდსა და მძღოლს!" },
      { name: "Irakli T.", date: "2026 წლის ივნისი", rating: 5, comment: "საუკეთესო შთაბეჭდილებები! აუცილებლად კიდევ წავალთ თქვენთან ერთად." }
    ];
  }

  return base;
}
