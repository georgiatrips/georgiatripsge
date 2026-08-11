import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

import { getTourSectionLabel } from "./tourMeta";

const TOURS_COLLECTION = "tours";

const GEO_MONTH_NAMES = [
  "იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი",
  "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი",
];

export const MONTH_NAMES = {
  ka: GEO_MONTH_NAMES,
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  ru: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"],
  tr: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
  ar: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
};

export function translateMonthName(strOrIdx, lang = "ka") {
  if (strOrIdx == null) return "";
  if (typeof strOrIdx === "number") {
    const list = MONTH_NAMES[lang] || MONTH_NAMES.ka;
    return list[strOrIdx] || MONTH_NAMES.ka[strOrIdx] || "";
  }
  const str = String(strOrIdx).trim();
  const idx = MONTH_NAMES.ka.indexOf(str);
  if (idx !== -1) {
    const list = MONTH_NAMES[lang] || MONTH_NAMES.ka;
    return list[idx] || str;
  }
  return str;
}

export function translateDuration(value, lang = "ka") {
  let text = asLocalizedText(value, lang);
  if (!text) return "";
  if (lang === "ka") return text;

  if (lang === "en") {
    return text
      .replace(/დღეები/g, "Days")
      .replace(/დღე/g, "Day")
      .replace(/ღამეები/g, "Nights")
      .replace(/ღამე/g, "Night")
      .replace(/საათიანი/g, "Hours")
      .replace(/საათი/g, "Hours");
  }
  if (lang === "ru") {
    return text
      .replace(/0 ღამე/g, "0 ночей")
      .replace(/1 ღამე/g, "1 ночь")
      .replace(/ღამეები/g, "ночей")
      .replace(/ღამე/g, "ночей")
      .replace(/1 დღე/g, "1 день")
      .replace(/დღეები/g, "дней")
      .replace(/დღე/g, "дней")
      .replace(/საათიანი/g, "часов")
      .replace(/საათი/g, "часов");
  }
  if (lang === "tr") {
    return text
      .replace(/დღეები/g, "Gün")
      .replace(/დღე/g, "Gün")
      .replace(/ღამეები/g, "Gece")
      .replace(/ღამე/g, "Gece")
      .replace(/საათიანი/g, "Saatlik")
      .replace(/საათი/g, "Saat");
  }
  if (lang === "ar") {
    return text
      .replace(/0 ღამე/g, "0 ليالي")
      .replace(/1 ღამე/g, "1 ليلة")
      .replace(/ღამეები/g, "ليالي")
      .replace(/ღამე/g, "ليالي")
      .replace(/1 დღე/g, "1 يوم")
      .replace(/დღეები/g, "أيام")
      .replace(/დღე/g, "أيام")
      .replace(/საათიანი/g, "ساعات")
      .replace(/საათი/g, "ساعات");
  }

  return text;
}

const LOCATION_DICTIONARY = {
  "აჭარა": { ka: "აჭარა", en: "Adjara", ru: "Аджария", tr: "Acara", ar: "أدجارا" },
  "გურია": { ka: "გურია", en: "Guria", ru: "Гурия", tr: "Guria", ar: "غوريا" },
  "იმერეთი": { ka: "იმერეთი", en: "Imereti", ru: "Имеретия", tr: "İmereti", ar: "إيميريتي" },
  "კახეთი": { ka: "კახეთი", en: "Kakheti", ru: "Кахетия", tr: "Kaheti", ar: "كاخيتي" },
  "მცხეთა-მთიანეთი": { ka: "მცხეთა-მთიანეთი", en: "Mtskheta-Mtianeti", ru: "Мцхета-Мтианети", tr: "Mtsheta-Mtianeti", ar: "متسخيتا-متيانيتي" },
  "რაჭა-ლეჩხუმი და ქვემო სვანეთი": { ka: "რაჭა-ლეჩხუმი და ქვემო სვანეთი", en: "Racha-Lechkhumi & Kvemo Svaneti", ru: "Рача-Лечхуми и Нижняя Сванетия", tr: "Raça-Leçhumi ve Kvemo Svaneti", ar: "راشا-ليتشخومي وسفانيتي السفلى" },
  "სამეგრელო-ზემო სვანეთი": { ka: "სამეგრელო-ზემო სვანეთი", en: "Samegrelo-Zemo Svaneti", ru: "Самегрело-Земо Сванети", tr: "Samegrelo-Zemo Svaneti", ar: "ساميغريلو-سفانيتي العليا" },
  "სამცხე-ჯავახეთი": { ka: "სამცხე-ჯავახეთი", en: "Samtskhe-Javakheti", ru: "Самцхе-Джавахети", tr: "Samtshe-Cavaheti", ar: "سامتسخي-جافاخيتي" },
  "შიდა ქართლი": { ka: "შიდა ქართლი", en: "Shida Kartli", ru: "Шида-Картли", tr: "Şida Kartli", ar: "شيدا كارتلي" },
  "ქვემო ქართლი": { ka: "ქვემო ქართლი", en: "Kvemo Kartli", ru: "Квемо-Картли", tr: "Kvemo Kartli", ar: "كيفيمو كارتلي" },
  "თბილისი": { ka: "თბილისი", en: "Tbilisi", ru: "Тбилиси", tr: "Tiflis", ar: "تبليسي" },
  "ბათუმი": { ka: "ბათუმი", en: "Batumi", ru: "Батуми", tr: "Batum", ar: "باتومي" },
  "ყაზბეგი": { ka: "ყაზბეგი", en: "Kazbegi", ru: "Казбеги", tr: "Kazbegi", ar: "كازبيجي" },
  "სტეფანწმინდა": { ka: "სტეფანწმინდა", en: "Stepantsminda", ru: "Степанцминда", tr: "Stepantsminda", ar: "ستيبانتسميندا" },
  "სვანეთი": { ka: "სვანეთი", en: "Svaneti", ru: "Сванетия", tr: "Svaneti", ar: "سفانيتي" },
  "მესტია": { ka: "მესტია", en: "Mestia", ru: "Местиа", tr: "Mestia", ar: "ميستيا" },
  "ქუთაისი": { ka: "ქუთაისი", en: "Kutaisi", ru: "Кутаиси", tr: "Kutaisi", ar: "كوتايسي" },
  "სამეგრელო": { ka: "სამეგრელო", en: "Samegrelo", ru: "Самегрело", tr: "Samegrelo", ar: "ساميغريلو" },
  "მცხეთა": { ka: "მცხეთა", en: "Mtskheta", ru: "Мцхета", tr: "Mtskheta", ar: "متسخيتا" },
  "ბორჯომი": { ka: "ბორჯომი", en: "Borjomi", ru: "Боржоми", tr: "Borjomi", ar: "بورجومي" },
  "ვარძია": { ka: "ვარძია", en: "Vardzia", ru: "Вардзия", tr: "Vardzia", ar: "فاردزيا" },
  "რაჭა": { ka: "რაჭა", en: "Racha", ru: "Рача", tr: "Racha", ar: "راتشا" },
  "საქართველო": { ka: "საქართველო", en: "Georgia", ru: "Грузия", tr: "Gürcistan", ar: "جورجيا" },
};

export function translateLocation(value, lang = "ka") {
  let text = asLocalizedText(value, lang);
  if (!text) return "";

  const clean = text.replace(/^📍\s*/, "").trim();

  // Direct key lookup
  if (LOCATION_DICTIONARY[clean] && LOCATION_DICTIONARY[clean][lang]) {
    return LOCATION_DICTIONARY[clean][lang];
  }

  // Reverse / cross-language lookup
  for (const info of Object.values(LOCATION_DICTIONARY)) {
    if (
      Object.values(info).some(
        (val) => typeof val === "string" && val.toLowerCase() === clean.toLowerCase()
      )
    ) {
      return info[lang] || info.ka || text;
    }
  }

  return text;
}

export function matchesMultiLang(value, query) {
  if (!value || !query) return false;
  const q = String(query).trim().toLowerCase();
  if (!q) return false;

  if (typeof value === "string" || typeof value === "number") {
    const str = String(value).toLowerCase();
    if (str.includes(q)) return true;
    const clean = str.replace(/^📍\s*/, "").trim();
    if (LOCATION_DICTIONARY[clean]) {
      return Object.values(LOCATION_DICTIONARY[clean]).some(
        (v) => typeof v === "string" && v.toLowerCase().includes(q)
      );
    }
    return false;
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return Object.values(value).some((v) => matchesMultiLang(v, q));
  }

  if (Array.isArray(value)) {
    return value.some((v) => matchesMultiLang(v, q));
  }

  return false;
}

/** Plain Georgian text for display; old Firestore docs may still use { ka: "..." } */
export function asLocalizedText(value, lang = "ka") {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    if (value[lang] && typeof value[lang] === "string" && value[lang].trim() !== "") {
      return String(value[lang]);
    }
    if (value.ka && typeof value.ka === "string" && value.ka.trim() !== "") {
      return String(value.ka);
    }
    const first = Object.values(value).find((v) => typeof v === "string" && v.trim() !== "");
    return first != null ? String(first) : "";
  }
  return "";
}

export function firestoreErrorMessage(err) {
  const code = err?.code || "";
  if (code === "permission-denied" || String(err?.message || "").includes("permission")) {
    return (
      "Firestore-ის წესები არ იძლევა ჩაწერის უფლებას. Firebase Console → Firestore Database → Rules → " +
      "შეცვალეთ read, write rule true-ზე."
    );
  }
  return err?.message || "შეცდომა ბაზასთან კავშირისას";
}

export function buildTourSlug(title) {
  const base = asLocalizedText(title)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u10A0-\u10FF-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${base || "tour"}-${Date.now().toString(36)}`;
}

export async function createTour(tourData) {
  const payload = {
    ...tourData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, TOURS_COLLECTION), payload);
  return { id: ref.id, ...tourData };
}

export async function getFirestoreTourById(id) {
  if (!id) return null;
  const snap = await getDoc(doc(db, TOURS_COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function listFirestoreTours() {
  const snap = await getDocs(collection(db, TOURS_COLLECTION));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() ?? 0;
      const tb = b.createdAt?.toMillis?.() ?? 0;
      return tb - ta;
    });
}

export async function updateFirestoreTour(id, data) {
  await updateDoc(doc(doc(db, TOURS_COLLECTION), id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
export async function deleteFirestoreTour(id) {
  await deleteDoc(doc(db, TOURS_COLLECTION, id));
}

/** Group ISO dates + freeSeats into month schedule for UI */
export function groupDepartureDates(departureDates = [], lang = "ka") {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const grouped = new Map();

  for (const entry of departureDates) {
    const iso = typeof entry === "string" ? entry : entry?.date;
    if (!iso) continue;
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) continue;
    const target = new Date(y, m - 1, d);
    target.setHours(0, 0, 0, 0);
    if (target < now) continue;

    const monthIndex = m - 1;
    if (!grouped.has(monthIndex)) grouped.set(monthIndex, []);
    grouped.get(monthIndex).push({
      chip: `${String(d).padStart(2, "0")}.${String(m).padStart(2, "0")}`,
      date: iso,
      freeSeats: typeof entry === "object" ? Number(entry.freeSeats) || 0 : 0,
    });
  }

  return Array.from(grouped.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([monthIndex, dates]) => ({
      monthName: translateMonthName(monthIndex, lang),
      monthIndex,
      dates: dates.sort((a, b) => a.date.localeCompare(b.date)),
    }))
    .filter((g) => g.dates.length > 0);
}

/** Normalize Firestore tour into the shape used by tour detail / cards */
export function normalizeFirestoreTour(tour, lang = "ka") {
  if (!tour) return null;
  const hasGroup = !!tour.hasGroup;
  const hasPrivate = !!tour.hasPrivate;
  const title = asLocalizedText(tour.title, lang);
  const desc = asLocalizedText(tour.desc, lang);
  const duration = asLocalizedText(tour.duration, lang);
  const destLabel =
    asLocalizedText(tour.destinationLabel, lang) || asLocalizedText(tour.destination, lang) || "";
  const badgeRaw = asLocalizedText(tour.badge, lang);
  const tourSection =
    typeof tour.tourSection === "string" ? tour.tourSection : tour.category || "";
  const tourSectionLabel =
    asLocalizedText(tour.tourSectionLabel, lang) || getTourSectionLabel(tourSection);

  const itinerary = (Array.isArray(tour.itinerary) ? tour.itinerary : []).map((item) => ({
    placeId: typeof item?.placeId === "string" ? item.placeId : "",
    title: asLocalizedText(item?.title, lang),
    desc: asLocalizedText(item?.desc, lang),
    img: typeof item?.img === "string" ? item.img : asLocalizedText(item?.img, lang),
  }));

  const gallery = (Array.isArray(tour.gallery) ? tour.gallery : [])
    .map((g) => (typeof g === "string" ? g : asLocalizedText(g, lang)))
    .filter(Boolean);

  return {
    ...tour,
    id: tour.id,
    title,
    desc,
    duration,
    type: tour.type || "oneday",
    typeLabel: tour.type === "multiday" ? "მრავალდღიანი" : "ერთდღიანი",
    location: destLabel ? `📍 ${destLabel}` : "",
    destination: asLocalizedText(tour.destination, lang) || (typeof tour.destination === "string" ? tour.destination : ""),
    destinationLabel: destLabel,
    priceGroup: hasGroup && tour.priceGroup != null ? `₾${tour.priceGroup}/კაცი` : null,
    pricePrivate: hasPrivate && tour.pricePrivate != null ? `₾${tour.pricePrivate}` : null,
    priceGroupNum: hasGroup ? Number(tour.priceGroup) || 0 : 0,
    pricePrivateNum: hasPrivate ? Number(tour.pricePrivate) || 0 : 0,
    groupMin: Number(tour.groupMin) || 1,
    groupMax: Number(tour.groupMax) || 18,
    privateGroupMin: Number(tour.privateGroupMin) || Number(tour.groupMin) || 1,
    privateGroupMax: Number(tour.privateGroupMax) || Number(tour.groupMax) || 18,
    hasGroup,
    hasPrivate,
    isVip: !!tour.isVip,
    isPopular: !!tour.isPopular,
    badge: badgeRaw || "ახალი ტური",
    tourSection,
    tourSectionLabel,
    img: (typeof tour.img === "string" && tour.img) || gallery[0] || "/hero.png",
    gallery,
    itinerary,
    departureDates: Array.isArray(tour.departureDates) ? tour.departureDates : [],
    dates: (tour.departureDates || []).map((e) => {
      const iso = typeof e === "string" ? e : e?.date;
      if (!iso) return null;
      const [, mm, dd] = iso.split("-");
      return `${mm}.${dd}`;
    }).filter(Boolean),
    category: tourSection || tour.category || "popular",
  };
}
