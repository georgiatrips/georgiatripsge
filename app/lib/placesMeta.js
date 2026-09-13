export const GEORGIA_REGIONS = [
  "აჭარა", "გურია", "იმერეთი", "კახეთი", "მცხეთა-მთიანეთი", "რაჭა-ლეჩხუმი და ქვემო სვანეთი", "სამეგრელო-ზემო სვანეთი", "სამცხე-ჯავახეთი", "შიდა ქართლი", "ქვემო ქართლი", "თბილისი",
];

export const REGIONS_TRANSLATIONS = {
  "აჭარა": { ka: "აჭარა", en: "Adjara", ru: "Аджария", tr: "Acara", ar: "أدجارا" },
  "გურია": { ka: "გურია", en: "Guria", ru: "Гурия", tr: "Guria", ar: "غوريا" },
  "იმერეთი": { ka: "იმერეთი", en: "Imereti", ru: "Имерети", tr: "İmereti", ar: "إيميريتي" },
  "კახეთი": { ka: "კახეთი", en: "Kakheti", ru: "Кахети", tr: "Kaheti", ar: "كاخيتي" },
  "მცხეთა-მთიანეთი": { ka: "მცხეთა-მთიანეთი", en: "Mtskheta-Mtianeti", ru: "Мцхета-Мтианети", tr: "Mtsheta-Mtianeti", ar: "متسخيتا-متيانيتي" },
  "რაჭა-ლეჩხუმი და ქვემო სვანეთი": { ka: "რაჭა-ლეჩხუმი და ქვემო სვანეთი", en: "Racha-Lechkhumi & Kvemo Svaneti", ru: "Рача-Лечхуми и Нижняя Сванетия", tr: "Raça-Leçhumi ve Kvemo Svaneti", ar: "راشا-ليتشخومي وسفانيتي السفلى" },
  "სამეგრელო-ზემო სვანეთი": { ka: "სამეგრელო-ზემო სვანეთი", en: "Samegrelo-Zemo Svaneti", ru: "Самегрело-Земо Сванети", tr: "Samegrelo-Zemo Svaneti", ar: "ساميغريلو-سفانيتي العليا" },
  "სამცხე-ჯავახეთი": { ka: "სამცხე-ჯავახეთი", en: "Samtskhe-Javakheti", ru: "Самцхе-Джавахети", tr: "Samtshe-Cavaheti", ar: "سامتسخي-جافاخيتي" },
  "შიდა ქართლი": { ka: "შიდა ქართლი", en: "Shida Kartli", ru: "Шида-Картли", tr: "Şida Kartli", ar: "شيدا كارتلي" },
  "ქვემო ქართლი": { ka: "ქვემო ქართლი", en: "Kvemo Kartli", ru: "Квемо-Картли", tr: "Kvemo Kartli", ar: "كيفيمو كارتلي" },
  "თბილისი": { ka: "თბილისი", en: "Tbilisi", ru: "Тбилиси", tr: "Tiflis", ar: "تبليسي" },
};

export function formatRegionName(regionName, lang = "ka") {
  if (!regionName) return "";
  const regKey = String(regionName).trim();
  
  if (REGIONS_TRANSLATIONS[regKey]) {
    return REGIONS_TRANSLATIONS[regKey][lang] || REGIONS_TRANSLATIONS[regKey].ka;
  }

  // Check if passed in another language
  for (const info of Object.values(REGIONS_TRANSLATIONS)) {
    if (
      info.ka === regKey ||
      info.en.toLowerCase() === regKey.toLowerCase() ||
      info.ru.toLowerCase() === regKey.toLowerCase() ||
      (info.tr && info.tr.toLowerCase() === regKey.toLowerCase()) ||
      (info.ar && info.ar.toLowerCase() === regKey.toLowerCase())
    ) {
      return info[lang] || info.ka;
    }
  }

  return regionName;
}