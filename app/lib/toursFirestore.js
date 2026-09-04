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
import { db } from "./firebase.js";

import { getTourSectionLabel } from "./tourMeta.js";

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
  ar: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "ნوفمبر", "ديسمبر"],
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

/**
 * EXACT places database dictionary mapping placeId -> multilingual titles
 * directly from Firestore 'places' collection.
 */
export const PLACES_BY_ID = {
  "vOFTdOn6pi5ixb8WB6UB": {
    ka: "ციხისძირის ზღაპრული სანაპირო",
    en: "The fabulous beach of Tsikhisdziri",
    ru: "Сказочный пляж Цихисдзири",
    tr: "Tsikhisdziri'nin muhteşem plajı",
    ar: "شاطئ تسيخيسدزيري الرائع"
  },
  "VRkDXUdauIj1PJZ6egHg": {
    ka: "მარტვილის კანიონი",
    en: "Martville Canyon",
    ru: "Мартвильский каньон",
    tr: "Martville Kanyonu",
    ar: "مارتفيل كانيون"
  },
  "gbwN9VKEpJNSHav2AxNI": {
    ka: "მირვეთის ჩანჩქერი",
    en: "Mirveti waterfall",
    ru: "Водопад Мирвети",
    tr: "Mirveti şelalesi",
    ar: "شلال ميرفيتي"
  },
  "Bk4wxAq5qCe80Dqp5p2H": {
    ka: "ბანანის კორომი",
    en: "Banana grove",
    ru: "Банановая роща",
    tr: "Muz bahçesi",
    ar: "بستان الموز"
  },
  "scXrVIBzocf6Uz2VSAF6": {
    ka: "პეტრას ციხე",
    en: "Petra Castle",
    ru: "Замок Петра",
    tr: "Petra Kalesi",
    ar: "قلعة البتراء"
  },
  "fEbTS9ffOMuSYnc85tkB": {
    ka: "მთაწმინდის წმინდა სამების ეკლესია",
    en: "Holy Trinity Church of Mtatsminda",
    ru: "Церковь Святой Троицы Мтацминды",
    tr: "Mtatsminda Kutsal Üçlü Kilisesi",
    ar: "كنيسة الثالوث المقدس في متاتسميندا"
  },
  "xZyxVy23YUkQma2HzERv": {
    ka: "პრომეთეს მღვიმე",
    en: "Cave of Prometheus",
    ru: "Пещера Прометея",
    tr: "Prometheus Mağarası",
    ar: "كهف بروميثيوس"
  },
  "ePwUKnmYhcBR8Lvk2SVa": {
    ka: "მარტვილის მხარეთმცოდნეობის მუზეუმი",
    en: "Museum of local knowledge of Martvil",
    ru: "Краеведческий музей Мартвиля",
    tr: "Martvil yerel bilgi müzesi",
    ar: "متحف المعرفة المحلية لمارتفيل"
  },
  "951HRNyT4ZnM6g941Zdj": {
    ka: "ოდა ოჯახის მარანი",
    en: "Oda family cellar",
    ru: "Семейный погреб Ода",
    tr: "Oda aile mahzeni",
    ar: "قبو عائلة اودا"
  },
  "DPlmvqINdZC4D8Pj6rcp": {
    ka: "ნოქალაქევის ცხელი წყაროები",
    en: "Nokalakevi hot springs",
    ru: "Горячие источники Нокалакеви",
    tr: "Nokalakevi kaplıcaları",
    ar: "ينابيع نوكالاكيفي الساخنة"
  },
  "w7pz2p9PzbFtF3EBk4Bx": {
    ka: "ცხმელარის თაღოვანი ხიდი",
    en: "Tshmelari arched bridge",
    ru: "Арочный мост Тшмелари",
    tr: "Tshmelari kemerli köprü",
    ar: "جسر تشميلاري المقوس"
  },
  "Q0osuZGeJXMqXrtqqLhc": {
    ka: "ზუნდაგას ჩანჩქერი",
    en: "Zundaga waterfall",
    ru: "Водопад Зундага",
    tr: "Zundaga şelalesi",
    ar: "شلال زونداغا"
  },
  "f1CU3dq8uk8FKXEWSRC2": {
    ka: "სიყვარულის ჩანჩქერი",
    en: "Waterfall of love",
    ru: "Водопад любви",
    tr: "aşk şelalesi",
    ar: "شلال الحب"
  },
  "u51fwqnDmMog4O20OBAX": {
    ka: "ყარიმანის ჩანჩქერი",
    en: "Karimani waterfall",
    ru: "Водопад Каримани",
    tr: "Karimani şelalesi",
    ar: "شلال كريماني"
  },
  "y0rMf5AoDpkwPykYCtg3": {
    ka: "მახუნცეთის თაღოვანი ხიდი",
    en: "Makhuntseti Arch Bridge",
    ru: "Арочный мост Махунцети",
    tr: "Makhuntseti Kemer Köprüsü",
    ar: "جسر قوس ماخونتسيتي"
  },
  "YIf1fcOfsd9ZqtmUCP2i": {
    ka: "მახუნცეთის ჩანჩქერი",
    en: "Makhuntseti waterfall",
    ru: "Водопад Махунцети",
    tr: "Makhuntseti şelalesi",
    ar: "شلال ماخونتسيتي"
  },
  "7KJqeUVeupxZYBoBOZ31": {
    ka: "მირვეთის თაღოვანი ხიდი",
    en: "Mirveti Arch Bridge",
    ru: "Арочный мост Мирвети",
    tr: "Mirveti Kemer Köprüsü",
    ar: "جسر قوس ميرفيتي"
  },
  "Bud6K33Q9SdLW0Pa0HCd": {
    ka: "გვარის ციხე",
    en: "Castle of the family",
    ru: "Замок семьи",
    tr: "Ailenin kalesi",
    ar: "قلعة العائلة"
  }
};

/**
 * Universal resolution function to get the exact place title as defined in Places.
 */
export function getPlaceLocalizedTitle(itemOrPlaceId, lang = "ka", customPlaces = []) {
  if (!itemOrPlaceId) return "";
  const placeId = typeof itemOrPlaceId === "string" ? itemOrPlaceId : (itemOrPlaceId.placeId || "");
  const rawTitle = typeof itemOrPlaceId === "object" ? (itemOrPlaceId.rawLocationTitle || itemOrPlaceId.locationTitle) : itemOrPlaceId;

  // 1. If custom dynamic places from Firestore places collection are passed
  if (Array.isArray(customPlaces) && customPlaces.length > 0) {
    if (placeId) {
      const found = customPlaces.find((p) => p.id === placeId);
      if (found?.title) return asLocalizedText(found.title, lang);
    }
    const clean = typeof rawTitle === "string" ? rawTitle.replace(/^📍\s*/, "").trim().toLowerCase() : "";
    if (clean) {
      const found = customPlaces.find((p) => {
        const t = p.title;
        if (!t) return false;
        if (typeof t === "string") return t.toLowerCase() === clean;
        return Object.values(t).some((v) => typeof v === "string" && v.toLowerCase() === clean);
      });
      if (found?.title) return asLocalizedText(found.title, lang);
    }
  }

  // 2. Direct lookup by placeId in PLACES_BY_ID
  if (placeId && PLACES_BY_ID[placeId]) {
    return PLACES_BY_ID[placeId][lang] || PLACES_BY_ID[placeId].ka || "";
  }

  // 3. Match rawTitle if it matches any entry in PLACES_BY_ID
  if (rawTitle) {
    if (typeof rawTitle === "object") {
      const kaName = rawTitle.ka;
      for (const place of Object.values(PLACES_BY_ID)) {
        if (place.ka === kaName) {
          return place[lang] || place.ka;
        }
      }
      return asLocalizedText(rawTitle, lang);
    }
    const clean = String(rawTitle).replace(/^📍\s*/, "").trim().toLowerCase();
    for (const place of Object.values(PLACES_BY_ID)) {
      if (Object.values(place).some((v) => typeof v === "string" && v.toLowerCase() === clean)) {
        return place[lang] || place.ka;
      }
    }
  }

  // 4. Fallback to asLocalizedText (which checks SIGHT_AND_TOUR_DICTIONARY and LOCATION_DICTIONARY)
  return asLocalizedText(rawTitle || placeId, lang);
}

export const SIGHT_AND_TOUR_DICTIONARY = {
  // Exact entries matching Places database
  "ნოქალაქევის ცხელი წყაროები": { ka: "ნოქალაქევის ცხელი წყაროები", en: "Nokalakevi hot springs", ru: "Горячие источники Нокалакеви", tr: "Nokalakevi kaplıcaları", ar: "ينابيع نوكالاكيفي الساخنة" },
  "ნოკალაქევის ცხელი წყაროები": { ka: "ნოქალაქევის ცხელი წყაროები", en: "Nokalakevi hot springs", ru: "Горячие источники Нокалакеви", tr: "Nokalakevi kaplıcaları", ar: "ينابيع نوكالاكيفي الساخنة" },
  "ნოქალაქევის გოგირდის ცხელი წყაროები": { ka: "ნოქალაქევის გოგირდის ცხელი წყაროები", en: "Nokalakevi hot springs", ru: "Горячие источники Нокалакеви", tr: "Nokalakevi kaplıcaları", ar: "ينابيع نوكალაكيفي الساخنة" },
  "მარტვილის კანიონი": { ka: "მარტვილის კანიონი", en: "Martville Canyon", ru: "Мартвильский каньон", tr: "Martville Kanyonu", ar: "مارتفيل كانيون" },
  "მარტვილის მხარეთმცოდნეობის მუზეუმი": { ka: "მარტვილის მხარეთმცოდნეობის მუზეუმი", en: "Museum of local knowledge of Martvil", ru: "Краеведческий музей Мартвиля", tr: "Martvil yerel bilgi müzesi", ar: "متحف المعرفة المحلية لمارتفيل" },
  "ოდა ოჯახის მარანი": { ka: "ოდა ოჯახის მარანი", en: "Oda family cellar", ru: "Семейный погреб Ода", tr: "Oda aile mahzeni", ar: "قبو عائلة اودا" },
  "ოდა მარანი": { ka: "ოდა ოჯახის მარანი", en: "Oda family cellar", ru: "Семейный погреб Ода", tr: "Oda aile mahzeni", ar: "قبو عائلة اودا" },
  "პრომეთეს მღვიმე": { ka: "პრომეთეს მღვიმე", en: "Cave of Prometheus", ru: "Пещера Прометея", tr: "Prometheus Mağarası", ar: "كهف بروميثيوس" },
  "მირვეთის ჩანჩქერი": { ka: "მირვეთის ჩანჩქერი", en: "Mirveti waterfall", ru: "Водопад Мирвети", tr: "Mirveti şelalesi", ar: "شلال ميرفيتي" },
  "მირვეთის თაღოვანი ხიდი": { ka: "მირვეთის თაღოვანი ხიდი", en: "Mirveti Arch Bridge", ru: "Арочный мост Мирвети", tr: "Mirveti Kemer Köprüsü", ar: "جسر قوس ميرفيتي" },
  "მახუნცეთის თაღოვანი ხიდი": { ka: "მახუნცეთის თაღოვანი ხიდი", en: "Makhuntseti Arch Bridge", ru: "Арочный мост Махунцети", tr: "Makhuntseti Kemer Köprüsü", ar: "جسر قوس ماخونتسيتي" },
  "მახუნცეთის ჩანჩქერი": { ka: "მახუნცეთის ჩანჩქერი", en: "Makhuntseti waterfall", ru: "Водопад Махунцети", tr: "Makhuntseti şelalesi", ar: "شلال ماخونتسيتي" },
  "მახუნცეთის თაღოვანი ხიდი": { ka: "მახუნცეთის თაღოვანი ხიდი", en: "Makhuntseti Arch Bridge", ru: "Арочный мост Махунцети", tr: "Makhuntseti Kemer Köprüsü", ar: "جسر قوس ماخونتსيتي" },
  "მახუნცეთის ჩანჩქერი": { ka: "მახუნცეთის ჩანჩქერი", en: "Makhuntseti waterfall", ru: "Водопад Махунцети", tr: "Makhuntseti şelalesi", ar: "شلال ماخونتსيتي" },
  "ყარიმანის ჩანჩქერი": { ka: "ყარიმანის ჩანჩქერი", en: "Karimani waterfall", ru: "Водопад Каримани", tr: "Karimani şelalesi", ar: "شلال كريماني" },
  "ზუნდაგას ჩანჩქერი": { ka: "ზუნდაგას ჩანჩქერი", en: "Zundaga waterfall", ru: "Водопад Зундага", tr: "Zundaga şelalesi", ar: "شلال زونداغا" },
  "სიყვარულის ჩანჩქერი": { ka: "სიყვარულის ჩანჩქერი", en: "Waterfall of love", ru: "Водопад любви", tr: "aşk şelalesi", ar: "شلال الحب" },
  "ცხმელარის თაღოვანი ხიდი": { ka: "ცხმელარის თაღოვანი ხიდი", en: "Tshmelari arched bridge", ru: "Арочный мост Тшмелари", tr: "Tshmelari kemerli köprü", ar: "جسر تشميلاري المقوس" },
  "ბანანის კორომი": { ka: "ბანანის კორომი", en: "Banana grove", ru: "Банановая роща", tr: "Muz bahçesi", ar: "بستان الموز" },
  "banana grove": { ka: "ბანანის კორომი", en: "Banana grove", ru: "Банановая роща", tr: "Muz bahçesi", ar: "بستان الموز" },
  "ციხისძირის ზღაპრული სანაპირო": { ka: "ციხისძირის ზღაპრული სანაპირო", en: "The fabulous beach of Tsikhisdziri", ru: "Сказочный пляж Цихисдзири", tr: "Tsikhisdziri'nin muhteşem plajı", ar: "شاطئ تسيخيسدزيري الرائع" },
  "ციხისძირის სანაპირო": { ka: "ციხისძირის ზღაპრული სანაპირო", en: "The fabulous beach of Tsikhisdziri", ru: "Сказочный пляж Цихисдзири", tr: "Tsikhisdziri'nin muhteşem plajı", ar: "شاطئ تسيخيسدزيري الرائع" },
  "the fabulous beach of tsikhisdziri": { ka: "ციხისძირის ზღაპრული სანაპირო", en: "The fabulous beach of Tsikhisdziri", ru: "Сказочный пляж Цихисдзири", tr: "Tsikhisdziri'nin muhteşem plajı", ar: "شاطئ تسيخيسدزيري الرائع" },
  "მთაწმინდის წმინდა სამების ეკლესია": { ka: "მთაწმინდის წმინდა სამების ეკლესია", en: "Holy Trinity Church of Mtatsminda", ru: "Церковь Святой Троицы Мтацминды", tr: "Mtatsminda Kutsal Üçlü Kilisesi", ar: "كنيسة الثالوث المقدس في متاتسميندا" },
  "holy trinity church of mtatsminda": { ka: "მთაწმინდის წმინდა სამების ეკლესია", en: "Holy Trinity Church of Mtatsminda", ru: "Церковь Святой Троицы Мтацминды", tr: "Mtatsminda Kutsal Üçlü Kilisesi", ar: "كنيسة الثالوث المقدس في متاتسميندا" },
  "პეტრას ციხე": { ka: "პეტრას ციხე", en: "Petra Castle", ru: "Замок Петра", tr: "Petra Kalesi", ar: "قلعة البتراء" },
  "petra castle": { ka: "პეტრას ციხე", en: "Petra Castle", ru: "Замок Петра", tr: "Petra Kalesi", ar: "قلعة البتراء" },
  "petra fortress": { ka: "პეტრას ციხე", en: "Petra Castle", ru: "Замок Петра", tr: "Petra Kalesi", ar: "قلعة البتراء" },
  "mirveti waterfall": { ka: "მირვეთის ჩანჩქერი", en: "Mirveti waterfall", ru: "Водопад Мирвети", tr: "Mirveti şelalesi", ar: "شلال ميرفيتي" },
  "გვარის ციხე": { ka: "გვარის ციხე", en: "Castle of the family", ru: "Замок семьи", tr: "Ailenin kalesi", ar: "قلعة العائلة" },

  // Additional Nokalakevi & Fortress entries
  "ნოქალაქევის ციხე": { ka: "ნოქალაქევის ციხე", en: "Nokalakevi Fortress", ru: "Крепость Нокалакеви", tr: "Nokalakevi Kalesi", ar: "قلعة نوكالاكيفي" },
  "ნოკალაქევის ციხე": { ka: "ნოქალაქევის ციხე", en: "Nokalakevi Fortress", ru: "Крепость Нокалакеви", tr: "Nokalakevi Kalesi", ar: "قلعة نوكالاكيفი" },
  "ნოქალაქევის ციხე & არქეოპოლისი": { ka: "ნოქალაქევის ციხე & არქეოპოლისი", en: "Nokalakevi Fortress & Archaeopolis", ru: "Крепость Нокалакеви и Археополис", tr: "Nokalakevi Kalesi ve Arkeopolis", ar: "قلعة نوكالاكيفي وأركيوبوليس" },
  "ნოკალაქევის ციხე & არქეოპოლისი": { ka: "ნოკალაქევის ციხე & არქეოპოლისი", en: "Nokalakevi Fortress & Archaeopolis", ru: "Крепость Нокалакеви и Археополис", tr: "Nokalakevi Kalesi ve Arkeopolis", ar: "قلعة نوكالاكيفي وأركيوبوليس" },
  "ნოქალაქევი": { ka: "ნოქალაქევი", en: "Nokalakevi", ru: "Нокалакеви", tr: "Nokalakevi", ar: "نوكالاكيفي" },
  "ნოკალაქევი": { ka: "ნოქალაქევი", en: "Nokalakevi", ru: "Нокалакеви", tr: "Nokalakevi", ar: "نوكالاكيفი" },
  "არქეოპოლისი": { ka: "არქეოპოლისი", en: "Archaeopolis", ru: "Археополис", tr: "Arkeopolis", ar: "أركيوبوليس" },
  "ბუნებრივი თერმული ცხელი წყაროები": { ka: "ბუნებრივი თერმული ცხელი წყაროები", en: "Natural Thermal Hot Springs", ru: "Природные горячие источники", tr: "Doğal Termal Sıcak Su Kaynakları", ar: "ينابيع مياه حارة طبيعية" },
  "ბუნებრივი თერმული გოგირდის წყაროები": { ka: "ბუნებრივი თერმული გოგირდის წყაროები", en: "Natural Thermal Sulfur Springs", ru: "Природные термальные серные источники", tr: "Doğal Termal Kükürt Kaynakları", ar: "ينابيع كبريتية حرارية طبيعية" },
  "ცხელი წყაროები": { ka: "ცხელი წყაროები", en: "Hot Springs", ru: "Горячие источники", tr: "Sıcak Su Kaynakları", ar: "ينابيع حارة" },
  "ცხელი წყლები": { ka: "ცხელი წყლები", en: "Hot Springs", ru: "Горячие источники", tr: "Sıcak Su Kaynakları", ar: "ينابيع حارة" },
  "თერმული წყაროები": { ka: "თერმული წყაროები", en: "Thermal Springs", ru: "Термальные источники", tr: "Termal Kaynaklar", ar: "ينابيع حرارية" },
  "დამატებითი ფოტო": { ka: "დამატებითი ფოტო", en: "Tour Photo", ru: "Фото тура", tr: "Tur Fotoğrafı", ar: "صورة الجولة" },

  // Martvili & Samegrelo
  "მარტვილის კანიონი & ნავით გასეირნება": { ka: "მარტვილის კანიონი & ნავით გასეირნება", en: "Martvili Canyon & Boat Ride", ru: "Каньон Мартвили и прогулка на лодке", tr: "Martvili Kanyonu ve Bot Turu", ar: "وادي مارتفيلي وركوب القارب" },
  "მარტვილის მონასტერი": { ka: "მარტვილის მონასტერი", en: "Martvili Monastery", ru: "Монастырь Мартвили", tr: "Martvili Manastırı", ar: "دير مارتفيلي" },
  "მარტვილის ტაძარი": { ka: "მარტვილის ტაძარი", en: "Martvili Cathedral", ru: "Храм Мартвили", tr: "Martvili Katedrali", ar: "كاتدرائية مارتفيلي" },
  "მარტვილი": { ka: "მარტვილი", en: "Martvili", ru: "Мартвили", tr: "Martvili", ar: "مارتفيلي" },
  "სალხინოს დადიანების სასახლე": { ka: "სალხინოს დადიანების სასახლე", en: "Salkhino Dadiani Palace", ru: "Дворец Дадиани в Салхино", tr: "Salhino Dadiani Sarayı", ar: "قصر دادياني في سالخينو" },
  "დადიანების სასახლე": { ka: "დადიანების სასახლე", en: "Dadiani Palace", ru: "Дворец Дадиани", tr: "Dadiani Sarayı", ar: "قصر دادياني" },
  "სალხინო": { ka: "სალხინო", en: "Salkhino", ru: "Салхино", tr: "Salhino", ar: "سالخينو" },
  "ბალდის კანიონი": { ka: "ბალდის კანიონი", en: "Balda Canyon", ru: "Каньон Балда", tr: "Balda Kanyonu", ar: "وادي بالدا" },
  "კაგუს ჩანჩქერი": { ka: "კაგუს ჩანჩქერი", en: "Kagu Waterfall", ru: "Водопад Кагу", tr: "Kagu Şelalesi", ar: "شلال كاجو" },
  "ონიორეს ჩანჩქერი": { ka: "ონიორეს ჩანჩქერი", en: "Oniore Waterfall", ru: "Водопад Ониоре", tr: "Oniore Şelalesi", ar: "شلال أونيوري" },
  "ტობის ჩანჩქერი": { ka: "ტობის ჩანჩქერი", en: "Tobi Waterfall", ru: "Водопад Тоби", tr: "Tobi Şelalesi", ar: "شلال توبي" },

  // Imereti & Tskaltubo & Kutaisi
  "პრომეთეს მღვიმე & მიწისქვეშა მდინარე": { ka: "პრომეთეს მღვიმე & მიწისქვეშა მდინარე", en: "Prometheus Cave & Underground River", ru: "Пещера Прометея и подземная река", tr: "Prometheus Mağarası ve Yeraltı Nehri", ar: "كهف بروميثيوس والنهر الجوفي" },
  "პრომეთე და მარტვილი": { ka: "პრომეთე და მარტვილი", en: "Prometheus & Martvili", ru: "Прометей и Мартвили", tr: "Prometheus ve Martvili", ar: "بروميثيوس ومارتفيلي" },
  "წყალტუბო": { ka: "წყალტუბო", en: "Tskaltubo", ru: "Цхалтубо", tr: "Tskaltubo", ar: "تسكالتوبو" },
  "წყალტუბოს სანატორიუმები": { ka: "წყალტუბოს სანატორიუმები", en: "Tskaltubo Sanatoriums", ru: "Санатории Цхалтубо", tr: "Tskaltubo Sanatoryumları", ar: "مصحات تسكالتوبو" },
  "წყალტუბოს მიტოვებული სანატორიუმები": { ka: "წყალტუბოს მიტოვებული სანატორიუმები", en: "Abandoned Sanatoriums of Tskaltubo", ru: "Заброшенные санатории Цхалтубо", tr: "Tskaltubo Terk Edilmiş Sanatoryumları", ar: "مصحات تسكالتوبو المهجورة" },
  "ოკაცეს კანიონი": { ka: "ოკაცეს კანიონი", en: "Okatse Canyon", ru: "Каньон Окаце", tr: "Okatse Kanyonu", ar: "وادي أوكاتسي" },
  "ოკაცეს ჩანჩქერი": { ka: "ოკაცეს ჩანჩქერი", en: "Okatse Waterfall", ru: "Водопад Окаце", tr: "Okatse Şelalesi", ar: "شلال أوكاتسي" },
  "კინჩხას ჩანჩქერი": { ka: "კინჩხას ჩანჩქერი", en: "Kinchkha Waterfall", ru: "Водопад Кინჩხა", tr: "Kinçha Şelalesi", ar: "شلال كينشكا" },
  "კინჩხა": { ka: "კინჩხა", en: "Kinchkha", ru: "Кინჩხა", tr: "Kinçha", ar: "كينشكا" },
  "სათაფლია": { ka: "სათაფლია", en: "Sataplia Cave", ru: "Сатаплиа", tr: "Sataplia Mağarası", ar: "كهف ساطابليا" },
  "სათაფლიის ნაკრძალი": { ka: "სათაფლიის ნაკრძალი", en: "Sataplia Nature Reserve", ru: "Заповедник Сатаплиа", tr: "Sataplia Doğa Koruma Alanı", ar: "محمية ساطابليا الطبيعية" },
  "გელათის მონასტერი": { ka: "გელათის მონასტერი", en: "Gelati Monastery", ru: "Монастырь Гелати", tr: "Gelati Manastırı", ar: "دير غيلاتي" },
  "გელათი": { ka: "გელათი", en: "Gelati", ru: "Гелати", tr: "Gelati", ar: "غيلاتي" },
  "მოწამეთას მონასტერი": { ka: "მოწამეთას მონასტერი", en: "Motsameta Monastery", ru: "Монастырь Моцамета", tr: "Motsameta Manastırı", ar: "دير موتساميتا" },
  "მოწამეთა": { ka: "მოწამეთა", en: "Motsameta", ru: "Моцамета", tr: "Motsameta", ar: "موتساميتا" },
  "ბაგრატის ტაძარი": { ka: "ბაგრატის ტაძარი", en: "Bagrati Cathedral", ru: "Собор Баграти", tr: "Bagrati Katedrali", ar: "كاتدرائية باغراتي" },
  "ბაგრატი": { ka: "ბაგრატი", en: "Bagrati", ru: "Баграти", tr: "Bagrati", ar: "باغراتي" },
  "კაცხის სვეტი": { ka: "კაცხის სვეტი", en: "Katskhi Pillar", ru: "Столп Кацхи", tr: "Katskhi Sütunu", ar: "عمود كاتسخي" },
  "მღვიმევის მონასტერი": { ka: "მღვიმევის მონასტერი", en: "Mgvimevi Monastery", ru: "Монастырь Мгвимеви", tr: "Mgvimevi Manastırı", ar: "دير مغفيميفي" },
  "ჭიათურა": { ka: "ჭიათურა", en: "Chiatura", ru: "Чиатура", tr: "Çiatura", ar: "تشياتورا" },
  "ჭიათურის საბაგიროები": { ka: "ჭიათურის საბაგიროები", en: "Chiatura Cable Cars", ru: "Канатные дороги Чиатуры", tr: "Çiatura Teleferikleri", ar: "تلفريك تشياتورا" },

  // Adjara & Guria & Coast
  "გვარას ციხე": { ka: "გვარას ციხე", en: "Gvara Fortress", ru: "Крепость Гвара", tr: "Gvara Kalesi", ar: "قلعة غفარა" },
  "გონიოს ციხე": { ka: "გონიოს ციხე", en: "Gonio Fortress", ru: "Крепость Гонио", tr: "Gonio Kalesi", ar: "قلعة غونيو" },
  "მაჭახელას ხეობა": { ka: "მაჭახელას ხეობა", en: "Machakhela Gorge", ru: "Мачахельское ущелье", tr: "Maçahela Vadisi", ar: "وادي ماتشاخيلا" },
  "მაჭახელა": { ka: "მაჭახელა", en: "Machakhela", ru: "Мачахела", tr: "Maçahela", ar: "ماتشاخيلا" },
  "მტირალას ეროვნული პარკი": { ka: "მტირალას ეროვნული პარკი", en: "Mtirala National Park", ru: "Национальный парк Мтирала", tr: "Mtirala Milli Parkı", ar: "حديقة متირალა الوطنية" },
  "მტირალა": { ka: "მტირალა", en: "Mtirala", ru: "Мтирала", tr: "Mtirala", ar: "متირალა" },
  "ბათუმის ბოტანიკური ბაღი": { ka: "ბათუმის ბოტანიკური ბაღი", en: "Batumi Botanical Garden", ru: "Батумский ботанический сад", tr: "Batum Botanik Bahçesi", ar: "حديقة باتومي النباتية" },
  "ბოტანიკური ბაღი": { ka: "ბოტანიკური ბაღი", en: "Botanical Garden", ru: "Ботанический сад", tr: "Botanik Bahçesi", ar: "الحديقة النباتية" },
  "მწვანე კონცხი": { ka: "მწვანე კონცხი", en: "Green Cape (Mtsvane Kontskhi)", ru: "Зеленый мыс", tr: "Mtsvane Kontshi (Yeşil Burun)", ar: "الرأس الأخضر" },
  "ბათუმის ბულვარი": { ka: "ბათუმის ბულვარი", en: "Batumi Boulevard", ru: "Батумский бульвар", tr: "Batum Bulvarı", ar: "بوليفارد باتومي" },
  "ალი და ნინო": { ka: "ალი და ნინო", en: "Ali and Nino Monument", ru: "Али и Нино", tr: "Ali ve Nino Heykeli", ar: "تمثال علي ونينو" },
  "ანბანის კოშკი": { ka: "ანბანის კოშკი", en: "Alphabet Tower", ru: "Башня алфавита", tr: "Alfabe Kulesi", ar: "برج الحروف الأبجدية" },
  "ევროპის მოედანი": { ka: "ევროპის მოედანი", en: "Europe Square", ru: "Площадь Европы", tr: "Avrupa Meydanı", ar: "ساحة أوروبا" },
  "პიაცა": { ka: "პიაცა", en: "Piazza Batumi", ru: "Пьяцца Батуми", tr: "Piazza Batum", ar: "ساحة بيازا باتومي" },
  "არგოს საბაგირო": { ka: "არგოს საბაგირო", en: "Argo Cable Car", ru: "Канатная дорога Арго", tr: "Argo Teleferiği", ar: "تلفريك أرغو" },
  "მახუნცეთი": { ka: "მახუნცეთი", en: "Makhuntseti", ru: "Махунцети", tr: "Mahuntseti", ar: "ماخونتსითი" },
  "თამარ მეფის ხიდი": { ka: "თამარ მეფის ხიდი", en: "Queen Tamar Bridge", ru: "Мост Царицы Тамары", tr: "Kraliçe Tamar Köprüsü", ar: "جسر الملكة تامار" },
  "თამარის ხიდი": { ka: "თამარის ხიდი", en: "Queen Tamar Bridge", ru: "Мост Тамары", tr: "Tamar Köprüsü", ar: "جسر تامار" },
  "თამარ მეფის ხიდი & მახუნცეთის ჩანჩქერი": { ka: "თამარ მეფის ხიდი & მახუნცეთის ჩანჩქერი", en: "Queen Tamar Bridge & Makhuntseti Waterfall", ru: "Мост Царицы Тамары и водопад Махунцети", tr: "Tamar Köprüsü ve Mahuntseti Şelalesi", ar: "جسر الملكة تامار وشلال ماخونتსითი" },
  "მახუნცეთის ჩანჩქერი და თამარის ხიდი": { ka: "მახუნცეთის ჩანჩქერი და თამარის ხიდი", en: "Makhuntseti Waterfall & Queen Tamar Bridge", ru: "Водопад Махунцети и мост Царицы Тамары", tr: "Mahuntseti Şelalesi ve Tamar Köprüsü", ar: "شلال ماخونتსითი وجسر الملكة تامار" },
  "მირვეთის ჩანჩქერი & ბამბუკის ტყე": { ka: "მირვეთის ჩანჩქერი & ბამბუკის ტყე", en: "Mirveti Waterfall & Bamboo Forest", ru: "Водопад Мирвети и бамбуковый лес", tr: "Mirveti Şelalesi ve Bambu Ormanı", ar: "شلال ميرفيتي وغابة الخيزران" },
  "მირვეთის ხეობა": { ka: "მირვეთის ხეობა", en: "Mirveti Gorge", ru: "Ущелье Мирвети", tr: "Mirveti Vadisi", ar: "وادي ميرفيتي" },
  "მირვეთი": { ka: "მირვეთი", en: "Mirveti", ru: "Мирвети", tr: "Mirveti", ar: "მირვეთი" },
  "ჭოროხისა და აჭარისწყლის შესართავი": { ka: "ჭოროხისა და აჭარისწყლის შესართავი", en: "Confluence of Chorokhi & Adjaristskali", ru: "Слияние рек Чорохи и Аджарисцкали", tr: "Çoruh ve Acaristskali Nehirlerinin Birleşimi", ar: "ملتقى نهري تشوروخي وأდჯარისწყალი" },
  "მდინარეების შესართავი": { ka: "მდინარეების შესართავი", en: "Rivers Confluence", ru: "Слияние рек", tr: "Nehirlerin Birleştiği Yer", ar: "ملتقى النهرين" },
  "დენდროლოგიური პარკი": { ka: "დენდროლოგიური პარკი", en: "Shekvetili Dendrological Park", ru: "Дендрологический парк", tr: "Dendroloji Parkı", ar: "حديقة الأشجار شيكفيتيلي" },
  "შეკვეთილის დენდროლოგიური პარკი": { ka: "შეკვეთილის დენდროლოგიური პარკი", en: "Shekvetili Dendrological Park", ru: "Шეკვეტილский дендропарк", tr: "Şekvetili Dendroloji Parkı", ar: "حديقة الأشجار شيكفيتيلي" },
  "შეკვეთილი": { ka: "შეკვეთილი", en: "Shekvetili", ru: "Шეკვეტილი", tr: "Şekvetili", ar: "شيكفيتيلي" },
  "მუსიკალური პარკი": { ka: "მუსიკალური პარკი", en: "Musicians Theme Park", ru: "Парк музыкантов", tr: "Müzisyenler Parkı", ar: "حديقة الموسيقيين" },
  "მინიატურების პარკი": { ka: "მინიატურების პარკი", en: "Georgia in Miniatures Park", ru: "Парк миниатюр", tr: "Minyatür Parkı", ar: "حديقة المصغرات" },
  "ურეკი": { ka: "ურეკი", en: "Ureki", ru: "Уреки", tr: "Ureki", ar: "أوريكي" },
  "ურეკის მაგნიტური ქვიშები": { ka: "ურეკის მაგნიტური ქვიშები", en: "Ureki Magnetic Sands", ru: "Магнитные пески Уреки", tr: "Ureki Manyetik Kumları", ar: "رمال أوريكي المغناطيسية" },
  "მაგნიტური ქვიშები": { ka: "მაგნიტური ქვიშები", en: "Magnetic Sands", ru: "Магнитные пески", tr: "Manyetik Kumlar", ar: "الرمال المغناطيسية" },
  "გოდერძი": { ka: "გოდერძი", en: "Goderdzi Pass / Resort", ru: "Курорт Годердзи", tr: "Goderdzi Geçidi", ar: "منتجع غوديردزي" },
  "მწვანე ტბა": { ka: "მწვანე ტბა", en: "Green Lake", ru: "Зеленое озеро", tr: "Yeşil Göl", ar: "البحيرة الخضراء" },
  "ბეშუმი": { ka: "ბეშუმი", en: "Beshumi Resort", ru: "Бешуми", tr: "Beşumi", ar: "بيშومي" },

  // Kazbegi & Gudauri
  "ყაზბეგი - გერგეტის სამება": { ka: "ყაზბეგი - გერგეტის სამება", en: "Kazbegi - Gergeti Trinity", ru: "Казбеги - Гергети", tr: "Kazbegi - Gergeti Kilisesi", ar: "كازبيجي - كنيسة جيرجيتي" },
  "ყაზბეგი და გუდაური": { ka: "ყაზბეგი და გუდაური", en: "Kazbegi & Gudauri", ru: "Казбеги и Гудаури", tr: "Kazbegi ve Gudauri", ar: "كازبيجي وقوداوري" },
  "ყაზბეგის მთები": { ka: "ყაზბეგის მთები", en: "Kazbegi Mountains", ru: "Горы Казбеги", tr: "Kazbegi Dağları", ar: "جبال كازبيجي" },
  "გერგეტის სამება": { ka: "გერგეტის სამება", en: "Gergeti Trinity Church", ru: "Троицкая церковь в Гергети", tr: "Gergeti Teslis Kilisesi", ar: "كنيسة الثالوث في جيرجيتي" },
  "მყინვარწვერი": { ka: "მყინვარწვერი", en: "Mount Kazbek", ru: "Гора Казбек", tr: "Kazbek Dağı", ar: "جبل كازبيك" },
  "გუდაური": { ka: "გუდაური", en: "Gudauri", ru: "Гудаури", tr: "Gudauri", ar: "غوداوري" },
  "გუდაურის პანორამა": { ka: "გუდაურის პანორამა", en: "Gudauri Panorama (Friendship Monument)", ru: "Панорама Гудаури (Монумент дружбы)", tr: "Gudauri Panoraması", ar: "بانوراما غوداوري" },
  "მეგობრობის მონუმენტი": { ka: "მეგობრობის მონუმენტი", en: "Friendship Monument", ru: "Монумент дружбы", tr: "Dostluk Anıtı", ar: "نصب الصداقة" },
  "ანანური - გუდაური": { ka: "ანანური - გუდაური", en: "Ananuri - Gudauri", ru: "Ананури - Гудаури", tr: "Ananuri - Gudauri", ar: "أنانوري - قوداوري" },
  "ანანურის ციხე": { ka: "ანანურის ციხე", en: "Ananuri Fortress", ru: "Крепость Ананури", tr: "Ananuri Kalesi", ar: "قلعة أنანორი" },
  "ანანური": { ka: "ანანური", en: "Ananuri", ru: "Ананури", tr: "Ananuri", ar: "أنانوري" },
  "ჟინვალის წყალსაცავი": { ka: "ჟინვალის წყალსაცავი", en: "Zhinvali Reservoir", ru: "Жинвальское водохранилище", tr: "Zhinvali Baraj Gölü", ar: "سد جينفالي" },
  "ჟინვალი": { ka: "ჟინვალი", en: "Zhinvali", ru: "Жინвали", tr: "Zhinvali", ar: "جينفالي" },
  "დარიალის ხეობა": { ka: "დარიალის ხეობა", en: "Dariali Gorge", ru: "Дарьяльское ущелье", tr: "Daryal Kanyonu", ar: "مضيق داريالي" },
  "გველეთის ჩანჩქერი": { ka: "გველეთის ჩანჩქერი", en: "Gveleti Waterfall", ru: "Гвелетский водопад", tr: "Gveleti Şelalesi", ar: "شلال غفيليتي" },
  "ტრუსოს ხეობა": { ka: "ტრუსოს ხეობა", en: "Truso Valley", ru: "Ущелье Трусо", tr: "Truso Vadisi", ar: "وادي تروسو" },
  "ჯუთა": { ka: "ჯუთა", en: "Juta", ru: "Джута", tr: "Cuta", ar: "جوتا" },
  "ჯუთას ხეობა": { ka: "ჯუთას ხეობა", en: "Juta Valley & Chaukhi", ru: "Ущелье Джута", tr: "Juta Vadisi", ar: "وادي جوتا" },

  // Kakheti
  "სიღნაღი - ბოდბე": { ka: "სიღნაღი - ბოდბე", en: "Sighnaghi - Bodbe", ru: "Сигнахи - Бодбе", tr: "Sighnaghi - Bodbe", ar: "سيغناغي - بودبي" },
  "სიღნაღი": { ka: "სიღნაღი", en: "Sighnaghi", ru: "Сигнахи", tr: "Sighnaghi", ar: "سيغناغي" },
  "ბოდბის მონასტერი": { ka: "ბოდბის მონასტერი", en: "Bodbe Monastery", ru: "Монастырь Бодбе", tr: "Bodbe Manastırı", ar: "دير بودبي" },
  "ბოდბე": { ka: "ბოდბე", en: "Bodbe", ru: "Бодбе", tr: "Bodbe", ar: "بودبي" },
  "კახეთის ღვინის ტური": { ka: "კახეთის ღვინის ტური", en: "Kakheti Wine Tour", ru: "Винный тур в Кахетию", tr: "Kaheti Şarap Turu", ar: "جولة نبيذ كاخيتي" },
  "წინანდალი": { ka: "წინანდალი", en: "Tsinandali Estate", ru: "Цинандали", tr: "Tsinandali", ar: "تسيناندالي" },
  "წინანდლის მამული": { ka: "წინანდლის მამული", en: "Tsinandali Estate", ru: "Усадьба Цинандали", tr: "Tsinandali Malikanesi", ar: "قصر تسيناندالي" },
  "ალავერდის მონასტერი": { ka: "ალავერდის მონასტერი", en: "Alaverdi Monastery", ru: "Монастырь Алаверди", tr: "Alaverdi Manastırı", ar: "دير ألافيردي" },
  "ალავერდი": { ka: "ალავერდი", en: "Alaverdi", ru: "Алаверди", tr: "Alaverdi", ar: "ألافيردي" },
  "გრემი": { ka: "გრემი", en: "Gremi Fortress", ru: "Греми", tr: "Gremi Kalesi", ar: "غريمي" },
  "ნეკრესი": { ka: "ნეკრესი", en: "Nekresi Monastery", ru: "Некреси", tr: "Nekresi Manastırı", ar: "نيكريسي" },
  "ყვარლის ტბა": { ka: "ყვარლის ტბა", en: "Kvareli Lake", ru: "Озеро Кварели", tr: "Kvareli Gölü", ar: "بحيرة كفاريلي" },
  "ილიას ტბა": { ka: "ილიას ტბა", en: "Ilia Lake", ru: "Озеро Ильи", tr: "İlya Gölü", ar: "بحيرة إيليا" },
  "ხარებას გვირაბი": { ka: "ხარებას გვირაბი", en: "Khareba Wine Tunnel", ru: "Винный туннель Хареба", tr: "Khareba Şarap Tüneli", ar: "نفق نبيذ خاريبا" },
  "თელავი": { ka: "თელავი", en: "Telavi", ru: "Телави", tr: "Telavi", ar: "تيلافي" },
  "შუამთა": { ka: "შუამთა", en: "Shuamta Monastery", ru: "Шуамთა", tr: "Şuamta", ar: "شوامتا" },

  // Samtskhe-Javakheti & Borjomi
  "ბორჯომის ცენტრალური პარკი": { ka: "ბორჯომის ცენტრალური პარკი", en: "Borjomi Central Park", ru: "Центральный парк Боржоми", tr: "Borjomi Merkez Parkı", ar: "حديقة بورجومي المركزية" },
  "ბორჯომის პარკი": { ka: "ბორჯომის პარკი", en: "Borjomi Park", ru: "Парк Боржоми", tr: "Borjomi Parkı", ar: "حديقة بورجومي" },
  "მწვანე მონასტერი": { ka: "მწვანე მონასტერი", en: "Green Monastery", ru: "Зеленый монастырь", tr: "Yeşil Manastır", ar: "الدير الأخضر" },
  "რაბათის ციხე": { ka: "რაბათის ციხე", en: "Rabati Castle", ru: "Крепость Рабат", tr: "Rabati Kalesi", ar: "قلعة رباطي" },
  "რაბათი": { ka: "რაბათი", en: "Rabati Castle", ru: "Рабат", tr: "Rabati", ar: "رباطي" },
  "ახალციხის ციხე": { ka: "ახალციხის ციხე", en: "Akhaltsikhe Castle", ru: "Ахалцихская крепость", tr: "Ahıska Kalesi", ar: "قلعة آخالتسيخي" },
  "ახალციხე": { ka: "ახალციხე", en: "Akhaltsikhe", ru: "Ахалцихе", tr: "Ahıska", ar: "آخالتسيخي" },
  "ვარძიის სამონასტრო კომპლექსი": { ka: "ვარძიის სამონასტრო კომპლექსი", en: "Vardzia Cave Monastery", ru: "Пещерный монастырь Вардзия", tr: "Vardzia Mağara Manastırı", ar: "دير فاردزيا الكهفي" },
  "ვარძია": { ka: "ვარძია", en: "Vardzia", ru: "Вардзия", tr: "Vardzia", ar: "فاردزيا" },
  "ხერთვისის ციხე": { ka: "ხერთვისის ციხე", en: "Khertvisi Fortress", ru: "Крепость Хертвиси", tr: "Hertvisi Kalesi", ar: "قلعة خيرتفيسي" },
  "ხერთვისი": { ka: "ხერთვისი", en: "Khertvisi", ru: "Хертвиси", tr: "Hertvisi", ar: "خيرتفيسي" },
  "საფარის მონასტერი": { ka: "საფარის მონასტერი", en: "Sapara Monastery", ru: "Монастырь Сафара", tr: "Safara Manastırı", ar: "دير سافارا" },
  "ზარზმის მონასტერი": { ka: "ზარზმის მონასტერი", en: "Zarzma Monastery", ru: "Монастырь Зарзма", tr: "Zarzma Manastırı", ar: "دير زარზმა" },
  "აბასთუმანი": { ka: "აბასთუმანი", en: "Abastumani", ru: "Абастумани", tr: "Abastumani", ar: "أباستوماني" },
  "აბასთუმნის ობსერვატორია": { ka: "აბასთუმნის ობსერვატორია", en: "Abastumani Observatory", ru: "Абастуманская обсерватория", tr: "Abastumani Gözlemevi", ar: "مرصد أباستوماني" },

  // Dashbashi / Tsalka & Shida Kartli
  "დაშბაშის კანიონი": { ka: "დაშბაშის კანიონი", en: "Dashbashi Canyon", ru: "Каньон Дашбаши", tr: "Dashbashi Kanyonu", ar: "وادي داشباشي" },
  "წალკის კანიონი": { ka: "წალკის კანიონი", en: "Tsalka Canyon", ru: "Каньон Цалка", tr: "Tsalka Kanyonu", ar: "وادي تسالكا" },
  "ალმასის ხიდი": { ka: "ალმასის ხიდი", en: "Diamond Glass Bridge", ru: "Стеклянный мост Бриллиант", tr: "Elmas Cam Köprü", ar: "جسر الماس الزجاجي" },
  "ბრილიანტის ხიდი": { ka: "ბრილიანტის ხიდი", en: "Diamond Bridge", ru: "Бриллиантовый мост", tr: "Pırlanta Köprü", ar: "جسر الألماس" },
  "უფლისციხე": { ka: "უფლისციხე", en: "Uplistsikhe Cave Town", ru: "Уплисцихе", tr: "Uplistsikhe Mağara Şehri", ar: "أوبليستسيخي" },
  "გორის ციხე": { ka: "გორის ციხე", en: "Gori Fortress", ru: "Горийская крепость", tr: "Gori Kalesi", ar: "قلعة غوري" },
  "გორი": { ka: "გორი", en: "Gori", ru: "Гори", tr: "Gori", ar: "غوري" },
  "სტალინის მუზეუმი": { ka: "სტალინის მუზეუმი", en: "Joseph Stalin Museum", ru: "Музей Сталина", tr: "Stalin Müzesi", ar: "متحف ستالين" },

  // Tbilisi & Mtskheta
  "თბილისის ძველი ქალაქი & მცხეთა": { ka: "თბილისის ძველი ქალაქი & მცხეთა", en: "Old Tbilisi & Mtskheta", ru: "Старый Тбилиси и Мцхета", tr: "Eski Tiflis ve Mtsheta", ar: "تبليسي القديمة ومتسخيتا" },
  "თბილისის ძველი ქალაქი": { ka: "თბილისის ძველი ქალაქი", en: "Old Tbilisi", ru: "Старый Тбилиси", tr: "Eski Tiflis", ar: "تبليسي القديمة" },
  "ძველი თბილისი": { ka: "ძველი თბილისი", en: "Old Tbilisi", ru: "Старый Тбилиси", tr: "Eski Tiflis", ar: "تبليسي القديمة" },
  "ნარიყალა": { ka: "ნარიყალა", en: "Narikala Fortress", ru: "Крепость Нарикала", tr: "Narikala Kalesi", ar: "قلعة ناريكალა" },
  "ნარიყალას ციხე": { ka: "ნარიყალას ციხე", en: "Narikala Fortress", ru: "Крепость Нарикала", tr: "Narikala Kalesi", ar: "قلعة ناريكალა" },
  "აბანოთუბანი": { ka: "აბანოთუბანი", en: "Abanotubani", ru: "Абанотубани", tr: "Abanotubani", ar: "أبانوتوباني" },
  "გოგირდის აბანოები": { ka: "გოგირდის აბანოები", en: "Sulfur Baths", ru: "Серные бани", tr: "Kükürt Hamamları", ar: "حمامات الكبريت" },
  "სვეტიცხოველი": { ka: "სვეტიცხოველი", en: "Svetitskhoveli Cathedral", ru: "Собор Светицховели", tr: "Svetitskhoveli Katedrali", ar: "كاتدرائية سفيتيتسخوفيلي" },
  "ჯვრის მონასტერი": { ka: "ჯვრის მონასტერი", en: "Jvari Monastery", ru: "Монастырь Джвари", tr: "Jvari Manastırı", ar: "دير جفاري" },
  "ჯვარი": { ka: "ჯვარი", en: "Jvari", ru: "Джвари", tr: "Jvari", ar: "جفاري" },
  "სამთავროს მონასტერი": { ka: "სამთავროს მონასტერი", en: "Samtavro Monastery", ru: "Монастырь Самтавро", tr: "Samtavro Manastırı", ar: "دير سامتافرو" },
  "შიომღვიმის მონასტერი": { ka: "შიომღვიმის მონასტერი", en: "Shio-Mgvime Monastery", ru: "Монастырь Шио-Мгвиме", tr: "Şiomgvime Manastırı", ar: "دير شيو مغفيمي" },
  "შიომღვიმე": { ka: "შიომღვიმე", en: "Shio-Mgvime", ru: "Шио-Мгвиме", tr: "Şiomgvime", ar: "شيو مغفيمي" },
  "მეტეხის ტაძარი": { ka: "მეტეხის ტაძარი", en: "Metekhi Church", ru: "Храм Метехи", tr: "Metekhi Kilisesi", ar: "كنيسة ميتيخي" },
  "სამების საკათედრო ტაძარი": { ka: "სამების საკათედრო ტაძარი", en: "Holy Trinity Cathedral (Sameba)", ru: "Собор Святой Троицы (Самеба)", tr: "Kutsal Teslis Katedrali (Sameba)", ar: "كاتدرائية الثالوث المقدس (ساميبا)" },
  "სამება": { ka: "სამება", en: "Holy Trinity Cathedral (Sameba)", ru: "Самеба", tr: "Sameba Katedrali", ar: "ساميبا" },
  "მთაწმინდის პარკი": { ka: "მთაწმინდის პარკი", en: "Mtatsminda Park", ru: "Парк Мтацминда", tr: "Mtatsminda Parkı", ar: "منتزه متاتسميندا" },
  "მთაწმინდა": { ka: "მთაწმინდა", en: "Mtatsminda", ru: "Мтацминда", tr: "Mtatsminda", ar: "متاتسميندا" },
  "კუს ტბა": { ka: "კუს ტბა", en: "Turtle Lake", ru: "Черепашье озеро", tr: "Kaplumbağa Gölü", ar: "بحيرة السلاحف" },
  "ლისის ტბა": { ka: "ლისის ტბა", en: "Lisi Lake", ru: "Озеро Лиси", tr: "Lisi Gölü", ar: "بحيرة ليسي" },
  "თბილისის ზღვა": { ka: "თბილისის ზღვა", en: "Tbilisi Sea", ru: "Тбилисское море", tr: "Tiflis Denizi", ar: "بحر تبليسي" },

  // Svaneti
  "სვანეთის კოშკები (მესტია-უშგული)": { ka: "სვანეთის კოშკები (მესტია-უშგული)", en: "Svaneti Towers (Mestia-Ushguli)", ru: "Сванские башни (Местиа-Ушгули)", tr: "Svan Kuleleri (Mestia-Uşguli)", ar: "أبراج سفانيتي (ميستيا-أوشغولي)" },
  "სვანური კოშკები": { ka: "სვანური კოშკები", en: "Svan Towers", ru: "Сванские башни", tr: "Svan Kuleleri", ar: "أბراج سفانيتي" },
  "მესტია": { ka: "მესტია", en: "Mestia", ru: "Местиа", tr: "Mestia", ar: "ميستيا" },
  "უშგული": { ka: "უშგული", en: "Ushguli", ru: "Ушгули", tr: "Uşguli", ar: "أوشغولي" },
  "ჰაწვალი": { ka: "ჰაწვალი", en: "Hatsvali Ski Resort", ru: "Хацвали", tr: "Hatsvali", ar: "هاتسفالي" },
  "თეთნულდი": { ka: "თეთნულდი", en: "Tetnuldi", ru: "Тетнулди", tr: "Tetnuldi", ar: "تيتნولدي" },
  "შხარა": { ka: "შხარა", en: "Shkhara Glacier & Peak", ru: "Шхара", tr: "Şhara Dağı", ar: "شخارا" },
  "ჭალაადის მყინვარი": { ka: "ჭალაადის მყინვარი", en: "Chalaadi Glacier", ru: "Ледник Чалаади", tr: "Chalaadi Buzulu", ar: "نهر تشالادي الجليدي" },
  "ქორულდის ტბები": { ka: "ქორულდის ტბები", en: "Koruldi Lakes", ru: "Озера Корулди", tr: "Koruldi Gölleri", ar: "بحيرات كورولدي" },
  "ენგურის კაშხალი": { ka: "ენგურის კაშხალი", en: "Enguri Dam", ru: "Ингурская ГЭС / Плотина", tr: "Enguri Barajı", ar: "سد إنغوري" },
  "ენგურჰესი": { ka: "ენგურჰესი", en: "Enguri Hydro Power Plant", ru: "ИнгурГЭС", tr: "Enguri HES", ar: "محطة إنغوري" },

  // Racha
  "შაორის წყალსაცავი": { ka: "შაორის წყალსაცავი", en: "Shaori Reservoir", ru: "Шаорское водохранилище", tr: "Şaori Baraj Gölü", ar: "خزان شاوري" },
  "შაორი": { ka: "შაორი", en: "Shaori", ru: "Шаორი", tr: "Şaori", ar: "شاوري" },
  "ნიკორწმინდა": { ka: "ნიკორწმინდა", en: "Nikortsminda Cathedral", ru: "Никорцминда", tr: "Nikortsminda Katedrali", ar: "كاتدرائية نيكورتسميندا" },
  "ონის სინაგოგა": { ka: "ონის სინაგოგა", en: "Oni Synagogue", ru: "Онийская синагога", tr: "Oni Sinagogu", ar: "كنيس أوني" },
  "ამბროლაური": { ka: "ამბროლაური", en: "Ambrolauri", ru: "Амбролаури", tr: "Ambrolauri", ar: "أمبرولاوري" },
  "ონი": { ka: "ონი", en: "Oni", ru: "Они", tr: "Oni", ar: "أوني" },
  "ხვანჭკარა": { ka: "ხვანჭკარა", en: "Khvanchkara", ru: "Хванчкара", tr: "Khvanchkara", ar: "خوانشكარა" },
  "უწერა": { ka: "უწერა", en: "Utsera Mineral Springs", ru: "Уцера", tr: "Utsera", ar: "أوتسيرا" },
  "შოვი": { ka: "შოვი", en: "Shovi Resort", ru: "Шови", tr: "Şovi", ar: "شوفي" },

  // Itinerary and general phrases
  "სადილი იმერულ-მეგრულ რესტორანში": { ka: "სადილი იმერულ-მეგრულ რესტორანში", en: "Lunch at Traditional Restaurant", ru: "Обед в традиционном ресторане", tr: "Geleneksel Restoranda Öğle Yemeği", ar: "الغداء في مطعم تقليدي" },
  "აჭარული ტრადიციული სუფრა": { ka: "აჭარული ტრადიციული სუფრა", en: "Traditional Adjarian Supra & Wine Tasting", ru: "Традиционное аджарское застолье и дегустация вин", tr: "Geleneksel Acara Sofrası ve Şarap Tadımı", ar: "مأدبة سوبرا التقليدية وتذوق النبيذ" },
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

export const LOCATION_DICTIONARY = {
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
  "ქობულეთი": { ka: "ქობულეთი", en: "Kobuleti", ru: "Кобулети", tr: "Kobuleti", ar: "كوبوليتي" },
  "ჩაქვი": { ka: "ჩაქვი", en: "Chakvi", ru: "Чакви", tr: "Çakvi", ar: "تشاكفي" },
  "გონიო": { ka: "გონიო", en: "Gonio", ru: "Гонио", tr: "Gonio", ar: "غونيو" },
  "სარფი": { ka: "სარფი", en: "Sarpi", ru: "Сарпи", tr: "Sarpi", ar: "ساربي" },
  "ყაზბეგი": { ka: "ყაზბეგი", en: "Kazbegi", ru: "Казбеги", tr: "Kazbegi", ar: "كازبيجي" },
  "სტეფანწმინდა": { ka: "სტეფანწმინდა", en: "Stepantsminda", ru: "Степанцминда", tr: "Stepantsminda", ar: "ستيبانتسميندا" },
  "სვანეთი": { ka: "სვანეთი", en: "Svaneti", ru: "Сванетия", tr: "Svaneti", ar: "سفانيتي" },
  "მესტია": { ka: "მესტია", en: "Mestia", ru: "Местиа", tr: "Mestia", ar: "ميستيا" },
  "უშგული": { ka: "უშგული", en: "Ushguli", ru: "Ушгули", tr: "Uşguli", ar: "أوشغولي" },
  "ქუთაისი": { ka: "ქუთაისი", en: "Kutaisi", ru: "Кутаиси", tr: "Kutaisi", ar: "كوتايسي" },
  "სამეგრელო": { ka: "სამეგრელო", en: "Samegrelo", ru: "Самегрело", tr: "Samegrelo", ar: "ساميغريلو" },
  "ზუგდიდი": { ka: "ზუგდიდი", en: "Zugdidi", ru: "Зუგდიდი", tr: "Zugdidi", ar: "زوغديدي" },
  "მცხეთა": { ka: "მცხეთა", en: "Mtskheta", ru: "Мцхета", tr: "Mtskheta", ar: "متسخيتا" },
  "ბორჯომი": { ka: "ბორჯომი", en: "Borjomi", ru: "Боржоми", tr: "Borjomi", ar: "بورجومي" },
  "ვარძია": { ka: "ვარძია", en: "Vardzia", ru: "Вარძია", tr: "Vardzia", ar: "فاردزيا" },
  "რაჭა": { ka: "რაჭა", en: "Racha", ru: "Рача", tr: "Racha", ar: "راتشا" },
  "საქართველო": { ka: "საქართველო", en: "Georgia", ru: "Грузия", tr: "Gürcistan", ar: "جورجيا" },
};

/**
 * Universal dictionary lookup: matches direct Georgian key, case-insensitive key,
 * or reverse cross-language match (en/ru/tr/ar -> target lang).
 */
export function lookupDictionary(cleanStr, lang = "ka") {
  if (!cleanStr) return null;
  const key = String(cleanStr).trim();
  if (!key) return null;
  const lowerKey = key.toLowerCase();

  // 1. Direct dictionary lookup
  for (const dict of [PLACES_BY_ID, SIGHT_AND_TOUR_DICTIONARY, LOCATION_DICTIONARY]) {
    if (dict[key] && dict[key][lang]) {
      return dict[key][lang];
    }
  }

  // 2. Case-insensitive key lookup
  for (const dict of [PLACES_BY_ID, SIGHT_AND_TOUR_DICTIONARY, LOCATION_DICTIONARY]) {
    for (const [k, info] of Object.entries(dict)) {
      if (k.toLowerCase() === lowerKey && info[lang]) {
        return info[lang];
      }
    }
  }

  // 3. Reverse / Cross-language lookup across all dictionary values
  for (const dict of [PLACES_BY_ID, SIGHT_AND_TOUR_DICTIONARY, LOCATION_DICTIONARY]) {
    for (const info of Object.values(dict)) {
      const match = Object.values(info).some(
        (val) => typeof val === "string" && val.trim().toLowerCase() === lowerKey
      );
      if (match) {
        return info[lang] || info.ka || key;
      }
    }
  }

  return null;
}

export function translateLocation(value, lang = "ka") {
  if (!value) return "";
  const rawStr = typeof value === "object" ? asLocalizedText(value, lang) : String(value);
  const hasPin = rawStr.trim().startsWith("📍");
  const clean = rawStr.replace(/^📍\s*/, "").trim();

  const found = lookupDictionary(clean, lang);
  const loc = found || asLocalizedText(value, lang) || clean;
  return hasPin ? `📍 ${loc}` : loc;
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
    for (const dict of [LOCATION_DICTIONARY, SIGHT_AND_TOUR_DICTIONARY, PLACES_BY_ID]) {
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
    const kaText = typeof value.ka === "string" ? value.ka.trim() : "";
    if (kaText) {
      if (lang === "ka") return kaText;
      const found = lookupDictionary(kaText, lang);
      if (found) return found;
      return kaText;
    }
    const first = Object.values(value).find((v) => typeof v === "string" && v.trim() !== "");
    if (first) {
      const firstStr = String(first).trim();
      if (lang === "ka") return firstStr;
      const found = lookupDictionary(firstStr, lang);
      return found || firstStr;
    }
    return "";
  }

  const str = String(value).trim();
  if (!str) return "";

  const clean = str.replace(/^📍\s*/, "").trim();

  // Look up in comprehensive dictionaries
  const found = lookupDictionary(clean, lang);
  if (found) return found;

  return clean;
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
export function normalizeFirestoreTour(tour, lang = "ka", customPlaces = []) {
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
    rawTitle: item?.title || "",
    desc: asLocalizedText(item?.desc, lang),
    img: extractImageUrl(item?.img) || extractImageUrl(item?.image) || "/hero.webp",
  }));

  const gallery = (Array.isArray(tour.gallery) ? tour.gallery : [])
    .map((g) => extractImageUrl(g))
    .filter((u) => Boolean(u && u.trim()));

  const galleryItems = (Array.isArray(tour.gallery) ? tour.gallery : [])
    .map((g) => {
      const u = extractImageUrl(g);
      if (!u) return null;
      const placeId = typeof g === "object" ? g?.placeId || "" : "";
      const rawLoc = typeof g === "object" && g ? (g.locationTitle ?? "") : "";

      let locTitle = "";

      // 1. Check tour.itinerary for exact match by placeId
      if (placeId && Array.isArray(tour.itinerary)) {
        const itinMatch = tour.itinerary.find((it) => it?.placeId === placeId);
        if (itinMatch?.title) {
          locTitle = asLocalizedText(itinMatch.title, lang);
        }
      }

      // 2. Check tour.itinerary by photo URL
      if (!locTitle && Array.isArray(tour.itinerary) && u) {
        const cleanU = u.split("?")[0];
        const uFile = cleanU.split("/").pop();
        const itinMatch = tour.itinerary.find((it) => {
          const itImg = extractImageUrl(it?.img || it?.image);
          return itImg && (itImg === u || itImg.split("?")[0] === cleanU || itImg.split("/").pop() === uFile);
        });
        if (itinMatch?.title) {
          locTitle = asLocalizedText(itinMatch.title, lang);
        }
      }

      // 3. Check tour.itinerary by raw title match
      if (!locTitle && rawLoc && Array.isArray(tour.itinerary)) {
        const cleanRaw = String(rawLoc).replace(/^📍\s*/, "").trim().toLowerCase();
        const itinMatch = tour.itinerary.find((it) => {
          if (!it?.title) return false;
          if (typeof it.title === "string") return it.title.replace(/^📍\s*/, "").trim().toLowerCase() === cleanRaw;
          return Object.values(it.title).some((v) => typeof v === "string" && v.replace(/^📍\s*/, "").trim().toLowerCase() === cleanRaw);
        });
        if (itinMatch?.title) {
          locTitle = asLocalizedText(itinMatch.title, lang);
        }
      }

      // 4. Universal resolution via getPlaceLocalizedTitle with customPlaces
      if (!locTitle) {
        locTitle = getPlaceLocalizedTitle({ placeId, rawLocationTitle: rawLoc }, lang, customPlaces);
      }

      return {
        url: u,
        rawLocationTitle: rawLoc,
        locationTitle: locTitle ? locTitle.replace(/^📍\s*/, "") : "",
        placeId,
      };
    })
    .filter(Boolean);

  const mainTourImg =
    extractImageUrl(tour.img) ||
    extractImageUrl(tour.image) ||
    extractImageUrl(tour.coverImage) ||
    gallery[0] ||
    (itinerary[0] && itinerary[0].img) ||
    "/hero.webp";

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
