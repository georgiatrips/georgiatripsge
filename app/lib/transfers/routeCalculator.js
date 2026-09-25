/**
 * GeorgiaTrips Smart Transfer & Route Calculator
 *
 * Locations, known road distances and quote assembly. Per-km prices live in
 * ./pricing.js and are edited from the admin panel (distance bands per vehicle).
 */

import { TRANSFER_VEHICLE_KEYS, getRatePerKm, getTransferFare } from "./pricing";
import { VEHICLES } from "../vehicles";

export const TRANSFER_VEHICLES = VEHICLES;

export const TRANSFER_LOCATIONS = [
  // AIRPORTS
  {
    id: "batumi_airport",
    category: "airport",
    icon: "✈️",
    lat: 41.6103,
    lng: 41.5997,
    names: {
      ka: "ბათუმის აეროპორტი (BUS)",
      en: "Batumi Airport (BUS)",
      ru: "Аэропорт Батуми (BUS)",
      tr: "Batum Havalimanı (BUS)",
      ar: "مطار باتومي (BUS)",
    },
  },
  {
    id: "tbilisi_airport",
    category: "airport",
    icon: "✈️",
    lat: 41.6692,
    lng: 44.9547,
    names: {
      ka: "თბილისის აეროპორტი (TBS)",
      en: "Tbilisi Airport (TBS)",
      ru: "Аэропорт Тбилиси (TBS)",
      tr: "Tiflis Havalimanı (TBS)",
      ar: "مطار تبليسي (TBS)",
    },
  },
  {
    id: "kutaisi_airport",
    category: "airport",
    icon: "✈️",
    lat: 42.1764,
    lng: 42.4828,
    names: {
      ka: "ქუთაისის აეროპორტი (KUT)",
      en: "Kutaisi Airport (KUT)",
      ru: "Аэропорт Кутаиси (KUT)",
      tr: "Kutaisi Havalimanı (KUT)",
      ar: "مطار كوتايسي (KUT)",
    },
  },

  // MAJOR CITIES & RESORTS
  {
    id: "tbilisi_city",
    category: "city",
    icon: "🏙️",
    lat: 41.7151,
    lng: 44.8271,
    names: {
      ka: "თბილისი",
      en: "Tbilisi",
      ru: "Тбилиси",
      tr: "Tiflis",
      ar: "تبليسي",
    },
  },
  {
    id: "batumi_city",
    category: "city",
    icon: "🌊",
    lat: 41.6168,
    lng: 41.6367,
    names: {
      ka: "ბათუმი",
      en: "Batumi",
      ru: "Батуми",
      tr: "Batum",
      ar: "باتومي",
    },
  },
  {
    id: "kutaisi_city",
    category: "city",
    icon: "🏛️",
    lat: 42.2679,
    lng: 42.7180,
    names: {
      ka: "ქუთაისი",
      en: "Kutaisi",
      ru: "Кутаиси",
      tr: "Kutaisi",
      ar: "كوتايسي",
    },
  },
  {
    id: "gudauri",
    category: "resort",
    icon: "⛷️",
    lat: 42.4776,
    lng: 44.4758,
    names: {
      ka: "გუდაური",
      en: "Gudauri",
      ru: "Гудаури",
      tr: "Gudauri",
      ar: "غوداوري",
    },
  },
  {
    id: "kazbegi",
    category: "resort",
    icon: "🏔️",
    lat: 42.6567,
    lng: 44.6417,
    names: {
      ka: "ყაზბეგი (სტეფანწმინდა)",
      en: "Kazbegi (Stepantsminda)",
      ru: "Казбеги (Степанцминда)",
      tr: "Kazbegi (Stepantsminda)",
      ar: "كازبيجي (ستيبانتسميندا)",
    },
  },
  {
    id: "borjomi",
    category: "resort",
    icon: "🌲",
    lat: 41.8389,
    lng: 43.3792,
    names: {
      ka: "ბორჯომი",
      en: "Borjomi",
      ru: "Боржоми",
      tr: "Borjomi",
      ar: "بورجومي",
    },
  },
  {
    id: "bakuriani",
    category: "resort",
    icon: "❄️",
    lat: 41.7500,
    lng: 43.5333,
    names: {
      ka: "ბაკურიანი",
      en: "Bakuriani",
      ru: "Бакуриани",
      tr: "Bakuriani",
      ar: "باكورياني",
    },
  },
  {
    id: "mestia",
    category: "resort",
    icon: "🏔️",
    lat: 43.0442,
    lng: 42.7275,
    names: {
      ka: "მესტია (სვანეთი)",
      en: "Mestia (Svaneti)",
      ru: "Местия (Сванетия)",
      tr: "Mestia (Svaneti)",
      ar: "ميستيا (سفانيتي)",
    },
  },
  {
    id: "kobuleti",
    category: "coastal",
    icon: "🏖️",
    lat: 41.8214,
    lng: 41.7753,
    names: {
      ka: "ქობულეთი",
      en: "Kobuleti",
      ru: "Кобулети",
      tr: "Kobuleti",
      ar: "كوبوليتي",
    },
  },
  {
    id: "shekvetili",
    category: "coastal",
    icon: "🌊",
    lat: 41.9214,
    lng: 41.7644,
    names: {
      ka: "შეკვეთილი / ურეკი",
      en: "Shekvetili / Ureki",
      ru: "Шекветили / Уреки",
      tr: "Şekvetili / Ureki",
      ar: "شيكفيتيلي / أوريكي",
    },
  },
  {
    id: "sighnaghi",
    category: "region",
    icon: "🍷",
    lat: 41.6214,
    lng: 45.9214,
    names: {
      ka: "სიღნაღი (კახეთი)",
      en: "Sighnaghi (Kakheti)",
      ru: "Сигнахи (Кахетия)",
      tr: "Sighnaghi (Kaheti)",
      ar: "سيغناغي (كاخيتي)",
    },
  },
  {
    id: "telavi",
    category: "region",
    icon: "🍇",
    lat: 41.9198,
    lng: 45.4731,
    names: {
      ka: "თელავი",
      en: "Telavi",
      ru: "Телави",
      tr: "Telavi",
      ar: "تيلافي",
    },
  },
  {
    id: "akhaltsikhe",
    category: "region",
    icon: "🏰",
    lat: 41.6394,
    lng: 42.9839,
    names: {
      ka: "ახალციხე (რაბათი)",
      en: "Akhaltsikhe (Rabati)",
      ru: "Ахалцихе (Рабат)",
      tr: "Ahıska (Rabati)",
      ar: "أخالتسيخي",
    },
  },
  {
    id: "martvili",
    category: "nature",
    icon: "🏞️",
    lat: 42.4144,
    lng: 42.3789,
    names: {
      ka: "მარტვილის კანიონი",
      en: "Martvili Canyon",
      ru: "Каньон Мартвили",
      tr: "Martvili Kanyonu",
      ar: "مارتفيلي كانيون",
    },
  },
  {
    id: "sarpi",
    category: "coastal",
    icon: "🛂",
    lat: 41.5214,
    lng: 41.5514,
    names: {
      ka: "სარფი (საზღვარი)",
      en: "Sarpi (Border)",
      ru: "Сарпи (Граница)",
      tr: "Sarp (Sınır)",
      ar: "ساربي (الحدود)",
    },
  },
];

export const LOCATION_BY_ID = Object.fromEntries(TRANSFER_LOCATIONS.map((l) => [l.id, l]));

// Transfers start only from the three airports and the three main cities.
export const PICKUP_LOCATION_IDS = [
  "batumi_airport",
  "tbilisi_airport",
  "kutaisi_airport",
  "tbilisi_city",
  "batumi_city",
  "kutaisi_city",
];

/**
 * Exact Highway / Road Driving Distances (in KM) & Standard Driving Times (in Minutes)
 * Key: "locationA_id:locationB_id" (alphabetical order)
 */
const EXACT_ROUTES = {
  // BATUMI AIRPORT
  "batumi_airport:batumi_city": { km: 8, mins: 15 },
  "batumi_airport:kobuleti": { km: 38, mins: 45 },
  "batumi_airport:shekvetili": { km: 52, mins: 55 },
  "batumi_airport:sarpi": { km: 15, mins: 25 },
  "batumi_airport:kutaisi_airport": { km: 135, mins: 120 },
  "batumi_airport:kutaisi_city": { km: 155, mins: 140 },
  "batumi_airport:tbilisi_city": { km: 380, mins: 330 },
  "batumi_airport:tbilisi_airport": { km: 395, mins: 350 },
  "batumi_airport:gudauri": { km: 495, mins: 420 },
  "batumi_airport:kazbegi": { km: 530, mins: 450 },
  "batumi_airport:borjomi": { km: 235, mins: 210 },
  "batumi_airport:bakuriani": { km: 265, mins: 240 },
  "batumi_airport:mestia": { km: 268, mins: 300 },
  "batumi_airport:martvili": { km: 150, mins: 140 },

  // TBILISI AIRPORT
  "tbilisi_airport:tbilisi_city": { km: 18, mins: 25 },
  "tbilisi_airport:gudauri": { km: 135, mins: 130 },
  "tbilisi_airport:kazbegi": { km: 170, mins: 165 },
  "tbilisi_airport:borjomi": { km: 175, mins: 150 },
  "tbilisi_airport:bakuriani": { km: 200, mins: 175 },
  "tbilisi_airport:kutaisi_city": { km: 245, mins: 200 },
  "tbilisi_airport:kutaisi_airport": { km: 260, mins: 210 },
  "tbilisi_airport:batumi_city": { km: 390, mins: 340 },
  "tbilisi_airport:sighnaghi": { km: 95, mins: 80 },
  "tbilisi_airport:telavi": { km: 85, mins: 75 },
  "tbilisi_airport:akhaltsikhe": { km: 220, mins: 190 },
  "mestia:tbilisi_airport": { km: 480, mins: 490 },

  // KUTAISI AIRPORT
  "batumi_city:kutaisi_airport": { km: 140, mins: 120 },
  "kobuleti:kutaisi_airport": { km: 105, mins: 90 },
  "kutaisi_airport:kutaisi_city": { km: 22, mins: 25 },
  "kutaisi_airport:shekvetili": { km: 92, mins: 80 },
  "kutaisi_airport:tbilisi_city": { km: 245, mins: 200 },
  "gudauri:kutaisi_airport": { km: 360, mins: 310 },
  "kazbegi:kutaisi_airport": { km: 395, mins: 345 },
  "borjomi:kutaisi_airport": { km: 155, mins: 135 },
  "bakuriani:kutaisi_airport": { km: 185, mins: 160 },
  "kutaisi_airport:mestia": { km: 220, mins: 250 },
  "kutaisi_airport:martvili": { km: 45, mins: 45 },

  // TBILISI CITY
  "batumi_city:tbilisi_city": { km: 375, mins: 320 },
  "gudauri:tbilisi_city": { km: 120, mins: 110 },
  "kazbegi:tbilisi_city": { km: 155, mins: 150 },
  "borjomi:tbilisi_city": { km: 160, mins: 130 },
  "bakuriani:tbilisi_city": { km: 185, mins: 155 },
  "kutaisi_city:tbilisi_city": { km: 230, mins: 190 },
  "sighnaghi:tbilisi_city": { km: 110, mins: 95 },
  "telavi:tbilisi_city": { km: 95, mins: 85 },
  "akhaltsikhe:tbilisi_city": { km: 205, mins: 175 },
  "mestia:tbilisi_city": { km: 465, mins: 480 },
  "kobuleti:tbilisi_city": { km: 345, mins: 295 },
  "shekvetili:tbilisi_city": { km: 330, mins: 285 },

  // BATUMI CITY
  "batumi_city:kobuleti": { km: 30, mins: 35 },
  "batumi_city:shekvetili": { km: 45, mins: 45 },
  "batumi_city:sarpi": { km: 18, mins: 25 },
  "batumi_city:kutaisi_city": { km: 150, mins: 135 },
  "batumi_city:gudauri": { km: 490, mins: 410 },
  "batumi_city:kazbegi": { km: 525, mins: 440 },
  "batumi_city:borjomi": { km: 230, mins: 200 },
  "batumi_city:bakuriani": { km: 260, mins: 230 },
  "batumi_city:mestia": { km: 260, mins: 290 },
  "batumi_city:martvili": { km: 145, mins: 130 },
  "akhaltsikhe:batumi_city": { km: 170, mins: 210 },

  // KUTAISI CITY
  "gudauri:kutaisi_city": { km: 345, mins: 295 },
  "kazbegi:kutaisi_city": { km: 380, mins: 330 },
  "borjomi:kutaisi_city": { km: 135, mins: 120 },
  "bakuriani:kutaisi_city": { km: 165, mins: 145 },
  "kutaisi_city:mestia": { km: 210, mins: 240 },
  "kutaisi_city:martvili": { km: 48, mins: 45 },
  "kobuleti:kutaisi_city": { km: 120, mins: 105 },

  // RESORT TO RESORT
  "gudauri:kazbegi": { km: 35, mins: 40 },
  "bakuriani:borjomi": { km: 30, mins: 35 },
  "sighnaghi:telavi": { km: 60, mins: 55 },
};

// Some keys above are not in alphabetical order, so look up both directions.
function getExactRoute(idA, idB) {
  return EXACT_ROUTES[`${idA}:${idB}`] || EXACT_ROUTES[`${idB}:${idA}`] || null;
}

/**
 * Calculate Great-circle / Haversine distance in KM between two coordinates
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Helper to match user string input to known locations
 */
export function findLocation(queryStr) {
  if (!queryStr || typeof queryStr !== "string") return null;
  const clean = queryStr.toLowerCase().trim();
  if (!clean) return null;

  // 1. Exact ID match
  const byId = TRANSFER_LOCATIONS.find((l) => l.id === clean);
  if (byId) return byId;

  // 2. Exact Name match across languages
  for (const loc of TRANSFER_LOCATIONS) {
    for (const val of Object.values(loc.names)) {
      if (val.toLowerCase() === clean) {
        return loc;
      }
    }
  }

  // 3. Substring match for common keywords
  if (clean.includes("batumi") || clean.includes("ბათუმ")) {
    if (clean.includes("airport") || clean.includes("აეროპორტ") || clean.includes("аэропорт") || clean.includes("bus")) {
      return TRANSFER_LOCATIONS.find((l) => l.id === "batumi_airport");
    }
    return TRANSFER_LOCATIONS.find((l) => l.id === "batumi_city");
  }
  if (clean.includes("tbilisi") || clean.includes("თბილის")) {
    if (clean.includes("airport") || clean.includes("აეროპორტ") || clean.includes("аэропорт") || clean.includes("tbs")) {
      return TRANSFER_LOCATIONS.find((l) => l.id === "tbilisi_airport");
    }
    return TRANSFER_LOCATIONS.find((l) => l.id === "tbilisi_city");
  }
  if (clean.includes("kutaisi") || clean.includes("ქუთაის")) {
    if (clean.includes("airport") || clean.includes("აეროპორტ") || clean.includes("аэропорт") || clean.includes("kut")) {
      return TRANSFER_LOCATIONS.find((l) => l.id === "kutaisi_airport");
    }
    return TRANSFER_LOCATIONS.find((l) => l.id === "kutaisi_city");
  }
  if (clean.includes("gudauri") || clean.includes("გუდაურ")) return TRANSFER_LOCATIONS.find((l) => l.id === "gudauri");
  if (clean.includes("kazbegi") || clean.includes("ყაზბეგ") || clean.includes("stepantsminda") || clean.includes("სტეფანწმინდ")) return TRANSFER_LOCATIONS.find((l) => l.id === "kazbegi");
  if (clean.includes("borjomi") || clean.includes("ბორჯომ")) return TRANSFER_LOCATIONS.find((l) => l.id === "borjomi");
  if (clean.includes("bakuriani") || clean.includes("ბაკურიან")) return TRANSFER_LOCATIONS.find((l) => l.id === "bakuriani");
  if (
    clean.includes("mestia") ||
    clean.includes("მესტი") ||
    clean.includes("svaneti") ||
    clean.includes("სვანეთ") ||
    clean.includes("ushguli") ||
    clean.includes("უშგულ")
  ) {
    return TRANSFER_LOCATIONS.find((l) => l.id === "mestia");
  }
  if (clean.includes("kobuleti") || clean.includes("ქობულეთ")) return TRANSFER_LOCATIONS.find((l) => l.id === "kobuleti");
  if (clean.includes("shekvetili") || clean.includes("შეკვეთილ") || clean.includes("ureki") || clean.includes("ურეკ")) return TRANSFER_LOCATIONS.find((l) => l.id === "shekvetili");
  if (clean.includes("sighnaghi") || clean.includes("სიღნაღ")) return TRANSFER_LOCATIONS.find((l) => l.id === "sighnaghi");
  if (clean.includes("telavi") || clean.includes("თელავ")) return TRANSFER_LOCATIONS.find((l) => l.id === "telavi");
  if (clean.includes("akhaltsikhe") || clean.includes("ახალციხ")) return TRANSFER_LOCATIONS.find((l) => l.id === "akhaltsikhe");
  if (clean.includes("martvili") || clean.includes("მარტვილ")) return TRANSFER_LOCATIONS.find((l) => l.id === "martvili");

  return null;
}

/**
 * Check if the transfer route involves Svaneti (Mestia, Ushguli, etc.)
 */
// Upper & Lower Svaneti (Mestia, Ushguli, Lentekhi, Khaishi…), roughly.
function isInSvaneti(point) {
  return !!point && point.lat >= 42.78 && point.lng >= 41.95 && point.lng <= 43.3;
}

export function isSvanetiRoute(pickup, dropoff, locA = null, locB = null) {
  if (locA && (locA.id === "mestia" || locA.id === "svaneti")) return true;
  if (locB && (locB.id === "mestia" || locB.id === "svaneti")) return true;
  if (isInSvaneti(locA) || isInSvaneti(locB)) return true;

  const textA = (typeof pickup === "string" ? pickup : (locA?.names?.ka || "")).toLowerCase();
  const textB = (typeof dropoff === "string" ? dropoff : (locB?.names?.ka || "")).toLowerCase();
  const combined = `${textA} ${textB}`;

  const svanetiKeywords = [
    "mestia",
    "მესტია",
    "местия",
    "svaneti",
    "სვანეთ",
    "сванети",
    "сванетия",
    "سفانيتي",
    "ushguli",
    "უშგულ",
    "ушгули",
    "hatsvali",
    "ჰაწვალ",
    "хацвали",
    "hetskili",
    "ჰეშკილ",
    "tetnuldi",
    "თეთნულდ",
    "тетнульди",
  ];

  return svanetiKeywords.some((kw) => combined.includes(kw));
}

/**
 * Estimate road driving distance & duration in minutes between two locations
 */
export function estimateRouteDistance(pickupInput, dropoffInput) {
  if (!pickupInput || !dropoffInput) return null;

  const locA = typeof pickupInput === "object" ? pickupInput : findLocation(pickupInput);
  const locB = typeof dropoffInput === "object" ? dropoffInput : findLocation(dropoffInput);

  // If both locations are identified in our database
  if (locA && locB) {
    if (locA.id === locB.id) {
      return {
        distanceKm: 10,
        durationMinutes: 20,
        isEstimated: true,
        source: "same_area",
      };
    }

    const match = getExactRoute(locA.id, locB.id);
    if (match) {
      return {
        distanceKm: match.km,
        durationMinutes: match.mins,
        isEstimated: false,
        source: "exact_database",
      };
    }

    // Heuristic based on GPS coordinates with realistic driving factor
    const directKm = haversineDistance(locA.lat, locA.lng, locB.lat, locB.lng);
    // Georgia's terrain & mountain roads average ~1.38x direct distance
    const roadKm = Math.round(Math.max(10, directKm * 1.38));
    // Average highway/mountain speed ~65 km/h
    const mins = Math.round((roadKm / 65) * 60) + 10;

    return {
      distanceKm: roadKm,
      durationMinutes: mins,
      isEstimated: true,
      source: "coordinates_heuristic",
    };
  }

  // Fallback default estimated distance if custom text cannot be geo-located
  return {
    distanceKm: 120,
    durationMinutes: 110,
    isEstimated: true,
    source: "default_fallback",
  };
}

/**
 * Format duration in minutes into friendly localized text
 */
export function formatDuration(minutes, lang = "ka") {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  if (lang === "ka") {
    if (h === 0) return `${m} წუთი`;
    if (m === 0) return `~${h} საათი`;
    return `~${h} სთ ${m} წთ`;
  }
  if (lang === "ru") {
    if (h === 0) return `${m} мин`;
    if (m === 0) return `~${h} ч`;
    return `~${h} ч ${m} мин`;
  }
  if (lang === "tr") {
    if (h === 0) return `${m} dk`;
    if (m === 0) return `~${h} sa`;
    return `~${h} sa ${m} dk`;
  }
  if (lang === "ar") {
    if (h === 0) return `${m} دقيقة`;
    if (m === 0) return `~${h} ساعة`;
    return `~${h} س ${m} د`;
  }
  // English default
  if (h === 0) return `${m} mins`;
  if (m === 0) return `~${h} hrs`;
  return `~${h}h ${m}m`;
}

/**
 * Prices every vehicle for a known route ({ distanceKm, durationMinutes }).
 */
export function quoteFromRoute(route, pricing, { vehicleKey = "sedan", isSvaneti = false, lang = "ka" } = {}) {
  if (!route) return null;
  const { distanceKm, durationMinutes } = route;

  const allVehiclePrices = {};
  for (const key of TRANSFER_VEHICLE_KEYS) {
    allVehiclePrices[key] = getTransferFare(pricing, key, distanceKm, { isSvaneti });
  }

  return {
    distanceKm,
    durationMinutes,
    formattedDuration: formatDuration(durationMinutes, lang),
    priceGEL: allVehiclePrices[vehicleKey] ?? null,
    ratePerKm: getRatePerKm(pricing, vehicleKey, distanceKm),
    isSvaneti,
    vehicleKey,
    allVehiclePrices,
  };
}
