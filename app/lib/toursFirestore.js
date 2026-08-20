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

export const SIGHT_AND_TOUR_DICTIONARY = {
  "გვარის ციხე": { ka: "გვარის ციხე", en: "Gvari Fortress", ru: "Крепость Гвари", tr: "Gvari Kalesi", ar: "قلعة غفاري" },
  "პეტრას ციხე": { ka: "პეტრას ციხე", en: "Petra Fortress", ru: "Крепость Петра", tr: "Petra Kalesi", ar: "قلعة بيترا" },
  "გონიოს ციხე": { ka: "გონიოს ციხე", en: "Gonio Fortress", ru: "Крепость Гонио", tr: "Gonio Kalesi", ar: "قلعة غونيو" },
  "მაჭახელას ხეობა": { ka: "მაჭახელას ხეობა", en: "Machakhela Gorge", ru: "Мачахельское ущелье", tr: "Maçahela Vadisi", ar: "وادي ماتشاخيلا" },
  "მტირალას ეროვნული პარკი": { ka: "მტირალას ეროვნული პარკი", en: "Mtirala National Park", ru: "Национальный парк Мтирала", tr: "Mtirala Milli Parkı", ar: "حديقة متيرالا الوطنية" },
  "ბათუმის ბოტანიკური ბაღი": { ka: "ბათუმის ბოტანიკური ბაღი", en: "Batumi Botanical Garden", ru: "Батумский ботанический сад", tr: "Batum Botanik Bahçesi", ar: "حديقة باتومي النباتية" },
  "მარტვილის კანიონი": { ka: "მარტვილის კანიონი", en: "Martvili Canyon", ru: "Каньон Мартвили", tr: "Martvili Kanyonu", ar: "وادي مارتفيلي" },
  "პრომეთეს მღვიმე": { ka: "პრომეთეს მღვიმე", en: "Prometheus Cave", ru: "Пещера Прометея", tr: "Prometheus Mağarası", ar: "كهف بروميثيوس" },
  "პრომეთე და მარტვილი": { ka: "პრომეთე და მარტვილი", en: "Prometheus & Martvili", ru: "Прометей и Мартвили", tr: "Prometheus ve Martvili", ar: "بروميثيوس ومارتفيلي" },
  "ოკაცეს კანიონი": { ka: "ოკაცეს კანიონი", en: "Okatse Canyon", ru: "Каньон Окаце", tr: "Okatse Kanyonu", ar: "وادي أوكاتسي" },
  "სათაფლია": { ka: "სათაფლია", en: "Sataplia Cave", ru: "Сатаплиа", tr: "Sataplia Mağarası", ar: "كهف ساطابليا" },
  "ყაზბეგი - გერგეტის სამება": { ka: "ყაზბეგი - გერგეტის სამება", en: "Kazbegi - Gergeti Trinity", ru: "Казбеги - Гергети", tr: "Kazbegi - Gergeti Kilisesi", ar: "كازبيجي - كنيسة جيرجيتي" },
  "ყაზბეგი და გუდაური": { ka: "ყაზბეგი და გუდაური", en: "Kazbegi & Gudauri", ru: "Казбеги и Гудаури", tr: "Kazbegi ve Gudauri", ar: "كازبيجي وقوداوري" },
  "ანანური - გუდაური": { ka: "ანანური - გუდაური", en: "Ananuri - Gudauri", ru: "Ананури - Гудаури", tr: "Ananuri - Gudauri", ar: "أنانوري - قوداوري" },
  "სიღნაღი - ბოდბე": { ka: "სიღნაღი - ბოდბე", en: "Sighnaghi - Bodbe", ru: "Сигнахи - Бодбе", tr: "Sighnaghi - Bodbe", ar: "سيغناغي - بودبي" },
  "კახეთის ღვინის ტური": { ka: "კახეთის ღვინის ტური", en: "Kakheti Wine Tour", ru: "Винный тур в Кахетию", tr: "Kaheti Şarap Turu", ar: "جولة نبيذ كاخيتي" },
  "უფლისციხე": { ka: "უფლისციხე", en: "Uplistsikhe Cave Town", ru: "Уплисцихе", tr: "Uplistsikhe Mağara Şehri", ar: "أوبليستسيخي" },
  "ვარძიის სამონასტრო კომპლექსი": { ka: "ვარძიის სამონასტრო კომპლექსი", en: "Vardzia Cave Monastery", ru: "Вардзия", tr: "Vardzia Mağara Manastırı", ar: "دير فاردزيا" },
  "რაბათის ციხე": { ka: "რაბათის ციხე", en: "Rabati Castle", ru: "Крепость Рабат", tr: "Rabati Kalesi", ar: "قلعة رباطي" },
  "დაშბაშის კანიონი": { ka: "დაშბაშის კანიონი", en: "Dashbashi Canyon", ru: "Каньон Дашбаши", tr: "Dashbashi Kanyonu", ar: "وادي داشباشي" },
  "დენდროლოგიური პარკი": { ka: "დენდროლოგიური პარკი", en: "Shekvetili Dendrological Park", ru: "Дендрологический парк", tr: "Dendroloji Parkı", ar: "حديقة الأشجار شيكفيتيلي" },
  "მირვეთის ჩანჩქერი": { ka: "მირვეთის ჩანჩქერი", en: "Mirveti Waterfall", ru: "Водопад Мирвети", tr: "Mirveti Şelalesi", ar: "شلال ميرفيتي" },
  "მახუნცეთის ჩანჩქერი და თამარის ხიდი": { ka: "მახუნცეთის ჩანჩქერი და თამარის ხიდი", en: "Makhuntseti Waterfall & Queen Tamar Bridge", ru: "Водопад Махунцети и мост Царицы Тамары", tr: "Mahuntseti Şelalesi ve Tamar Köprüsü", ar: "شلال ماخونتسيتي وجسر الملكة تامار" },
  "სვანეთის კოშკები (მესტია-უშგული)": { ka: "სვანეთის კოშკები (მესტია-უშგული)", en: "Svaneti Towers (Mestia-Ushguli)", ru: "Сванские башни (Местиа-Ушгули)", tr: "Svan Kuleleri (Mestia-Uşguli)", ar: "أبراج سفانيتي (ميستيا-أوشغولي)" },
  "ბორჯომის ცენტრალური პარკი": { ka: "ბორჯომის ცენტრალური პარკი", en: "Borjomi Central Park", ru: "Центральный парк Боржоми", tr: "Borjomi Merkez Parkı", ar: "حديقة بورجومي المركزية" },
};

export function translateDuration(value, lang = "ka") {
  let raw = asLocalizedText(value, lang);
  if (!raw) return "";
  if (lang === "ka") return String(raw);

  let text = String(raw).trim();

  if (lang === "en") {
    return text
      .replace(/(\d+)\s*საათიანი/g, "$1 Hours")
      .replace(/(\d+)\s*საათი/g, "$1 Hours")
      .replace(/1\s*Hours/g, "1 Hour")
      .replace(/საათიანი/g, "Hours")
      .replace(/საათი/g, "Hours")
      .replace(/(\d+)\s*დღეები/g, "$1 Days")
      .replace(/(\d+)\s*დღე/g, "$1 Days")
      .replace(/1\s*Days/g, "1 Day")
      .replace(/დღეები/g, "Days")
      .replace(/დღე/g, "Day")
      .replace(/(\d+)\s*ღამეები/g, "$1 Nights")
      .replace(/(\d+)\s*ღამე/g, "$1 Nights")
      .replace(/1\s*Nights/g, "1 Night")
      .replace(/0\s*Nights/g, "0 Nights")
      .replace(/ღამეები/g, "Nights")
      .replace(/ღამე/g, "Night")
      .replace(/მრავალდღიანი/g, "Multi-day")
      .replace(/ერთდღიანი/g, "One-day");
  }
  if (lang === "ru") {
    return text
      .replace(/(\d+)\s*საათიანი/g, "$1 часов")
      .replace(/1\s*საათი/g, "1 час")
      .replace(/2\s*საათი/g, "2 часа")
      .replace(/3\s*საათი/g, "3 часа")
      .replace(/4\s*საათი/g, "4 часа")
      .replace(/(\d+)\s*საათი/g, "$1 часов")
      .replace(/საათიანი/g, "часов")
      .replace(/საათი/g, "часов")
      .replace(/0\s*ღამე/g, "0 ночей")
      .replace(/1\s*ღამე/g, "1 ночь")
      .replace(/2\s*ღამე/g, "2 ночи")
      .replace(/3\s*ღამე/g, "3 ночи")
      .replace(/4\s*ღამე/g, "4 ночи")
      .replace(/(\d+)\s*ღამე/g, "$1 ночей")
      .replace(/ღამეები/g, "ночей")
      .replace(/ღამე/g, "ночей")
      .replace(/1\s*დღე/g, "1 день")
      .replace(/2\s*დღე/g, "2 дня")
      .replace(/3\s*დღე/g, "3 дня")
      .replace(/4\s*დღე/g, "4 дня")
      .replace(/(\d+)\s*დღე/g, "$1 дней")
      .replace(/დღეები/g, "дней")
      .replace(/დღე/g, "дней")
      .replace(/მრავალდღიანი/g, "Многодневный")
      .replace(/ერთდღიანი/g, "Однодневный");
  }
  if (lang === "tr") {
    return text
      .replace(/(\d+)\s*საათიანი/g, "$1 Saatlik")
      .replace(/(\d+)\s*საათი/g, "$1 Saat")
      .replace(/საათიანი/g, "Saatlik")
      .replace(/საათი/g, "Saat")
      .replace(/(\d+)\s*დღე/g, "$1 Gün")
      .replace(/დღეები/g, "Gün")
      .replace(/დღე/g, "Gün")
      .replace(/(\d+)\s*ღამე/g, "$1 Gece")
      .replace(/ღამეები/g, "Gece")
      .replace(/ღამე/g, "Gece")
      .replace(/მრავალდღიანი/g, "Çok Günlük")
      .replace(/ერთდღიანი/g, "Günübirlik");
  }
  if (lang === "ar") {
    return text
      .replace(/(\d+)\s*საათიანი/g, "$1 ساعات")
      .replace(/1\s*საათი/g, "1 ساعة")
      .replace(/(\d+)\s*საათი/g, "$1 ساعات")
      .replace(/საათიანი/g, "ساعات")
      .replace(/საათი/g, "ساعات")
      .replace(/0\s*ღამე/g, "0 ليالي")
      .replace(/1\s*ღამე/g, "1 ليلة")
      .replace(/(\d+)\s*ღამე/g, "$1 ليالي")
      .replace(/ღამეები/g, "ليالي")
      .replace(/ღამე/g, "ليالي")
      .replace(/1\s*დღე/g, "1 يوم")
      .replace(/(\d+)\s*დღე/g, "$1 أيام")
      .replace(/დღეები/g, "أيام")
      .replace(/დღე/g, "أيام")
      .replace(/მრავალდღიანი/g, "متعدد الأيام")
      .replace(/ერთდღიანი/g, "يومي");
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

  const hasPin = text.startsWith("📍");
  const clean = text.replace(/^📍\s*/, "").trim();

  // Direct key lookup
  if (LOCATION_DICTIONARY[clean] && LOCATION_DICTIONARY[clean][lang]) {
    const loc = LOCATION_DICTIONARY[clean][lang];
    return hasPin ? `📍 ${loc}` : loc;
  }

  // Reverse / cross-language lookup
  for (const info of Object.values(LOCATION_DICTIONARY)) {
    if (
      Object.values(info).some(
        (val) => typeof val === "string" && val.toLowerCase() === clean.toLowerCase()
      )
    ) {
      const loc = info[lang] || info.ka || text;
      return hasPin ? `📍 ${loc}` : loc;
    }
  }

  return text;
}

export const formatLocationTag = translateLocation;
export const formatLocationStr = translateLocation;

export function matchesMultiLang(value, query) {
  if (!value || !query) return false;
  const q = String(query).trim().toLowerCase();
  if (!q) return false;

  if (typeof value === "string" || typeof value === "number") {
    const str = String(value).toLowerCase();
    if (str.includes(q)) return true;

    // Check if query is in any dictionary entry corresponding to this value
    for (const dict of [LOCATION_DICTIONARY, SIGHT_AND_TOUR_DICTIONARY]) {
      for (const info of Object.values(dict)) {
        const allAliases = Object.values(info).map((v) => String(v).toLowerCase());
        const valueMatchesAlias = allAliases.some((alias) => str.includes(alias));
        const queryMatchesAlias = allAliases.some((alias) => alias.includes(q) || q.includes(alias));

        if (valueMatchesAlias && queryMatchesAlias) return true;
      }
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

/** Plain Georgian or multilingual text for display */
export function asLocalizedText(value, lang = "ka") {
  if (value == null) return "";
  
  // Object with language keys
  if (typeof value === "object" && !Array.isArray(value)) {
    if (value[lang] && typeof value[lang] === "string" && value[lang].trim() !== "") {
      return String(value[lang]);
    }
    if (value.ka && typeof value.ka === "string" && value.ka.trim() !== "") {
      const kaText = String(value.ka);
      if (lang !== "ka" && SIGHT_AND_TOUR_DICTIONARY[kaText] && SIGHT_AND_TOUR_DICTIONARY[kaText][lang]) {
        return SIGHT_AND_TOUR_DICTIONARY[kaText][lang];
      }
      if (lang !== "ka" && LOCATION_DICTIONARY[kaText] && LOCATION_DICTIONARY[kaText][lang]) {
        return LOCATION_DICTIONARY[kaText][lang];
      }
      return kaText;
    }
    const first = Object.values(value).find((v) => typeof v === "string" && v.trim() !== "");
    return first != null ? String(first) : "";
  }

  const str = String(value).trim();
  if (!str) return "";

  // If not Georgian, check if the string matches any dictionary entry
  if (lang !== "ka") {
    if (SIGHT_AND_TOUR_DICTIONARY[str] && SIGHT_AND_TOUR_DICTIONARY[str][lang]) {
      return SIGHT_AND_TOUR_DICTIONARY[str][lang];
    }
    if (LOCATION_DICTIONARY[str] && LOCATION_DICTIONARY[str][lang]) {
      return LOCATION_DICTIONARY[str][lang];
    }
  }

  return str;
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
  if (!id) throw new Error("Tour ID is required for update");
  await updateDoc(doc(db, TOURS_COLLECTION, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
export async function deleteFirestoreTour(id) {
  if (!id) return;
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

export function extractImageUrl(val) {
  if (!val) return "";
  let url = "";
  if (typeof val === "string") {
    url = val.trim();
  } else if (typeof val === "object") {
    if (typeof val.url === "string" && val.url.trim()) url = val.url.trim();
    else if (typeof val.src === "string" && val.src.trim()) url = val.src.trim();
    else if (typeof val.ka === "string" && val.ka.trim()) url = val.ka.trim();
    else if (typeof val.en === "string" && val.en.trim()) url = val.en.trim();
    else if (typeof val.ru === "string" && val.ru.trim()) url = val.ru.trim();
    else {
      for (const k in val) {
        if (typeof val[k] === "string" && val[k].startsWith("http")) {
          url = val[k].trim();
          break;
        }
      }
    }
  }

  if (!url) return "";

  // Auto-optimize Cloudinary delivery with intelligent AVIF/WebP conversion & compression
  if (url.includes("res.cloudinary.com") && url.includes("/upload/") && !url.includes("/f_auto")) {
    return url.replace("/upload/", "/upload/f_auto,q_auto/");
  }

  return url;
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
    img: extractImageUrl(item?.img) || extractImageUrl(item?.image) || "/hero.png",
  }));

  const gallery = (Array.isArray(tour.gallery) ? tour.gallery : [])
    .map((g) => extractImageUrl(g))
    .filter((u) => Boolean(u && u.trim()));

  const galleryItems = (Array.isArray(tour.gallery) ? tour.gallery : [])
    .map((g) => {
      const u = extractImageUrl(g);
      if (!u) return null;
      return {
        url: u,
        locationTitle: typeof g === "object" && g?.locationTitle ? (asLocalizedText(g.locationTitle, lang) || "") : "",
        placeId: typeof g === "object" ? g?.placeId || "" : "",
      };
    })
    .filter(Boolean);

  const mainTourImg =
    extractImageUrl(tour.img) ||
    extractImageUrl(tour.image) ||
    extractImageUrl(tour.coverImage) ||
    gallery[0] ||
    (itinerary[0] && itinerary[0].img) ||
    "/hero.png";

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
    img: mainTourImg,
    gallery: gallery.length > 0 ? gallery : [mainTourImg],
    galleryItems: galleryItems.length > 0 ? galleryItems : [{ url: mainTourImg, locationTitle: "" }],
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
