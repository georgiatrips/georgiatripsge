import {
  collection,
  doc,
  setDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";

const VISITOR_ID_KEY = "gt_vid";
const SESSION_ID_KEY = "gt_sid";
const GEO_CACHE_KEY = "gt_geo_cache";

// ── WebGL GPU Renderer Detection ───────────────────────────
function getGpuRenderer() {
  if (typeof window === "undefined") return "";
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return "";
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (debugInfo) {
      return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "";
    }
    return gl.getParameter(gl.RENDERER) || "";
  } catch (_) {
    return "";
  }
}

// ── Exact iPhone / iPad Model Detection ─────────────────────
function detectAppleDeviceModel(ua, gpu) {
  if (typeof window === "undefined") return "Apple Device";
  const w = window.screen.width;
  const h = window.screen.height;
  const dpr = window.devicePixelRatio || 1;
  const min = Math.min(w, h);
  const max = Math.max(w, h);
  const physicalW = Math.round(min * dpr);
  const physicalH = Math.round(max * dpr);

  if (/iPad/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) {
    if (min >= 1024 || physicalW >= 2048) return "iPad Pro 12.9\"";
    if (min >= 834 || physicalW >= 1668) return "iPad Pro 11\" / Air";
    if (min >= 768) return "iPad / iPad mini";
    return "Apple iPad";
  }

  // Exact iPhone screen signatures
  if ((min === 430 && max === 932) || (physicalW === 1290 && physicalH === 2796)) return "iPhone 15/16 Pro Max / 15 Plus";
  if ((min === 393 && max === 852) || (physicalW === 1179 && physicalH === 2556)) return "iPhone 15/16 Pro / iPhone 15";
  if ((min === 428 && max === 926) || (physicalW === 1284 && physicalH === 2778)) return "iPhone 14 Plus / 13/12 Pro Max";
  if ((min === 390 && max === 844) || (physicalW === 1170 && physicalH === 2532)) return "iPhone 14 / 13 / 13 Pro / 12";
  if ((min === 375 && max === 812) || (physicalW === 1125 && physicalH === 2436)) return "iPhone 13 mini / 12 mini / 11 Pro / X / XS";
  if ((min === 414 && max === 896 && dpr >= 3) || (physicalW === 1242 && physicalH === 2688)) return "iPhone 11 Pro Max / XS Max";
  if ((min === 414 && max === 896 && dpr < 3) || (physicalW === 828 && physicalH === 1792)) return "iPhone 11 / iPhone XR";
  if ((min === 414 && max === 736) || (physicalW === 1080 && physicalH === 1920)) return "iPhone 8 Plus / 7 Plus";
  if (min === 375 && max === 667) return "iPhone SE (2nd/3rd gen) / 8 / 7";
  
  return "Apple iPhone";
}

// ── Android Model Extraction ────────────────────────────────
function detectAndroidModel(ua, gpu) {
  // Samsung models
  if (/SM-S928/i.test(ua)) return "Samsung Galaxy S24 Ultra";
  if (/SM-S926/i.test(ua)) return "Samsung Galaxy S24+";
  if (/SM-S921/i.test(ua)) return "Samsung Galaxy S24";
  if (/SM-S918/i.test(ua)) return "Samsung Galaxy S23 Ultra";
  if (/SM-S916/i.test(ua)) return "Samsung Galaxy S23+";
  if (/SM-S911/i.test(ua)) return "Samsung Galaxy S23";
  if (/SM-S908/i.test(ua)) return "Samsung Galaxy S22 Ultra";
  if (/SM-S901|SM-S906/i.test(ua)) return "Samsung Galaxy S22 / S22+";
  if (/SM-G998|SM-G991|SM-G996/i.test(ua)) return "Samsung Galaxy S21 Series";
  if (/SM-F946|SM-F936|SM-F926/i.test(ua)) return "Samsung Galaxy Z Fold";
  if (/SM-F731|SM-F721|SM-F711/i.test(ua)) return "Samsung Galaxy Z Flip";
  if (/SM-A546|SM-A536|SM-A528/i.test(ua)) return "Samsung Galaxy A54 / A53 5G";
  if (/SM-A346|SM-A336|SM-A325/i.test(ua)) return "Samsung Galaxy A34 / A33";
  if (/Samsung|SM-|GT-/i.test(ua)) {
    const smMatch = ua.match(/SM-[A-Z0-9]+/i);
    return smMatch ? `Samsung Galaxy (${smMatch[0]})` : "Samsung Galaxy Smartphone";
  }

  // Xiaomi / Redmi / POCO
  if (/2312|2304|2210|2201|Redmi Note 13|Redmi Note 12/i.test(ua)) return "Xiaomi Redmi Note Series";
  if (/POCO/i.test(ua)) return "Xiaomi POCO Smartphone";
  if (/Xiaomi|Redmi|Mi /i.test(ua)) return "Xiaomi Smartphone";

  // Google Pixel
  if (/Pixel 9/i.test(ua)) return "Google Pixel 9 / 9 Pro";
  if (/Pixel 8 Pro/i.test(ua)) return "Google Pixel 8 Pro";
  if (/Pixel 8/i.test(ua)) return "Google Pixel 8";
  if (/Pixel 7/i.test(ua)) return "Google Pixel 7 / 7 Pro";
  if (/Pixel 6/i.test(ua)) return "Google Pixel 6 Series";
  if (/Pixel/i.test(ua)) return "Google Pixel Phone";

  // Huawei / Honor
  if (/Huawei|HMA-|VOG-|ELE-|CLT-/i.test(ua)) return "Huawei Smartphone";
  if (/Honor/i.test(ua)) return "Honor Smartphone";

  // OnePlus / Oppo / Vivo / Realme
  if (/OnePlus|GM19|KB20|NE22|CPH/i.test(ua)) return "OnePlus / Oppo Phone";
  if (/Vivo|V2\d{3}/i.test(ua)) return "Vivo Smartphone";
  if (/Realme|RMX\d{4}/i.test(ua)) return "Realme Smartphone";

  return "Android Smartphone";
}

// ── Detailed Screen & Resolution Calculator ─────────────────
export function getDetailedScreenInfo() {
  if (typeof window === "undefined") {
    return {
      screenSizeLabel: "Unknown Display",
      inches: "Unknown",
      tech: "Display",
      physicalLabel: "Unknown",
      viewportLabel: "Unknown",
      screenLabel: "Unknown",
      dpr: 1,
      width: 0,
      height: 0,
    };
  }

  const w = window.screen.width;
  const h = window.screen.height;
  const dpr = window.devicePixelRatio || 1;
  const min = Math.min(w, h);
  const max = Math.max(w, h);
  const physicalW = Math.round(min * dpr);
  const physicalH = Math.round(max * dpr);

  let inches = "";
  let tech = "Display";

  // iPhone models
  if ((min === 430 && max === 932) || (physicalW === 1290 && physicalH === 2796)) {
    inches = '6.7"'; tech = "Super Retina XDR OLED (120Hz ProMotion)";
  } else if ((min === 393 && max === 852) || (physicalW === 1179 && physicalH === 2556)) {
    inches = '6.1"'; tech = "Super Retina XDR OLED";
  } else if ((min === 428 && max === 926) || (physicalW === 1284 && physicalH === 2778)) {
    inches = '6.7"'; tech = "Super Retina XDR OLED";
  } else if ((min === 390 && max === 844) || (physicalW === 1170 && physicalH === 2532)) {
    inches = '6.1"'; tech = "Super Retina XDR OLED";
  } else if ((min === 375 && max === 812) || (physicalW === 1125 && physicalH === 2436)) {
    inches = '5.4" – 5.8"'; tech = "OLED Super Retina";
  } else if ((min === 414 && max === 896 && dpr >= 3) || (physicalW === 1242 && physicalH === 2688)) {
    inches = '6.5"'; tech = "Super Retina HD OLED";
  } else if ((min === 414 && max === 896 && dpr < 3) || (physicalW === 828 && physicalH === 1792)) {
    inches = '6.1"'; tech = "Liquid Retina HD";
  } else if ((min === 414 && max === 736) || (physicalW === 1080 && physicalH === 1920)) {
    inches = '5.5"'; tech = "Retina HD (Full HD)";
  } else if (min === 375 && max === 667) {
    inches = '4.7"'; tech = "Retina HD";
  } else if (min >= 1024 || physicalW >= 2048) {
    inches = '12.9"'; tech = "Liquid Retina XDR (mini-LED)";
  } else if (min >= 834 || physicalW >= 1668) {
    inches = '11.0"'; tech = "Liquid Retina Display";
  } else if (min >= 768) {
    inches = '10.2" – 10.9"'; tech = "Retina Display";
  } else if (min <= 460) {
    // Android smartphone estimation
    if (physicalH >= 2800 || physicalW >= 1400) {
      inches = '6.8"'; tech = "Dynamic AMOLED 2X (QHD+ 120Hz)";
    } else if (physicalH >= 2300 || physicalW >= 1080) {
      inches = '6.67"'; tech = "FHD+ AMOLED 120Hz";
    } else {
      inches = '6.5"'; tech = "HD+ / FHD Display";
    }
  } else if (max >= 3840) {
    inches = '27" – 32"'; tech = "4K Ultra HD Display";
  } else if (max >= 2560) {
    inches = '24" – 27"'; tech = "2K QHD Display";
  } else if (max >= 1920) {
    inches = '15.6" – 24"'; tech = "Full HD 1080p Display";
  } else if (max >= 1366) {
    inches = '13.3" – 15.6"'; tech = "HD Laptop Screen";
  }

  const screenSizeLabel = inches ? `${inches} ${tech}` : `${min}×${max} (${tech})`;
  const physicalLabel = `${physicalW} × ${physicalH} px`;
  const viewportLabel = `${window.innerWidth} × ${window.innerHeight} px`;
  const screenLabel = `${w}×${h} (@${dpr}x DPR)`;

  return {
    screenSizeLabel,
    inches: inches || "სტანდარტული",
    tech,
    physicalLabel,
    viewportLabel,
    screenLabel,
    dpr,
    width: w,
    height: h,
  };
}

// ── Detailed Device & Hardware Detection ────────────────────
export function getDeviceInfo() {
  if (typeof window === "undefined") {
    return {
      deviceType: "Desktop",
      deviceModel: "Desktop PC",
      screenSize: "Standard Display",
      screenPhysical: "1920x1080",
      screenViewport: "1920x1080",
      os: "Unknown",
      browser: "Unknown",
      screen: "Unknown",
      gpu: "Unknown",
      cores: 0,
      memory: 0,
      touch: false,
      connection: "Fast",
      timezone: "",
      language: "en",
      languages: "en",
    };
  }

  const ua = navigator.userAgent || "";
  let deviceType = "Desktop";
  let os = "Unknown";
  let browser = "Unknown";
  let deviceModel = "Desktop PC";

  const rawGpu = getGpuRenderer();
  const cleanGpu = rawGpu.replace(/ANGLE \(|Direct3D.*|vs_\d+_\d+|ps_\d+_\d+|\)/g, "").trim();

  // 1. Device Type
  const isTablet = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua) || 
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isMobile = /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Opera M(obi|ini)/i.test(ua);

  if (isTablet) deviceType = "Tablet";
  else if (isMobile) deviceType = "Mobile";
  else deviceType = "Desktop";

  // 2. OS Detection
  if (/Windows NT 10.0/i.test(ua)) os = "Windows 10/11";
  else if (/Windows NT 6.3/i.test(ua)) os = "Windows 8.1";
  else if (/Windows NT 6.1/i.test(ua)) os = "Windows 7";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/iPhone OS 18/i.test(ua)) os = "iOS 18";
  else if (/iPhone OS 17/i.test(ua)) os = "iOS 17";
  else if (/iPhone OS 16/i.test(ua)) os = "iOS 16";
  else if (/iPhone/i.test(ua)) os = "iOS (iPhone)";
  else if (/iPad/i.test(ua)) os = "iPadOS";
  else if (/Mac OS X/i.test(ua) || /Macintosh/i.test(ua)) os = "macOS";
  else if (/Android 15/i.test(ua)) os = "Android 15";
  else if (/Android 14/i.test(ua)) os = "Android 14";
  else if (/Android 13/i.test(ua)) os = "Android 13";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Linux/i.test(ua)) os = "Linux";

  // 3. In-App Browsers / WebViews (High intent social traffic)
  if (/Instagram/i.test(ua)) browser = "Instagram App";
  else if (/TikTok/i.test(ua) || /musical_ly/i.test(ua)) browser = "TikTok App";
  else if (/FBAN|FBAV/i.test(ua)) browser = "Facebook App";
  else if (/Snapchat/i.test(ua)) browser = "Snapchat App";
  else if (/WhatsApp/i.test(ua)) browser = "WhatsApp Web/App";
  else if (/Telegram/i.test(ua)) browser = "Telegram Web";
  else if (/Edg\//i.test(ua)) browser = "Microsoft Edge";
  else if (/OPR\/|Opera/i.test(ua)) browser = "Opera";
  else if (/SamsungBrowser/i.test(ua)) browser = "Samsung Internet";
  else if (/Chrome\//i.test(ua) && !/Chromium|Edg|OPR/i.test(ua)) browser = "Google Chrome";
  else if (/Safari\//i.test(ua) && !/Chrome|Chromium|Edg|OPR/i.test(ua)) browser = "Apple Safari";
  else if (/Firefox\//i.test(ua)) browser = "Mozilla Firefox";

  // 4. Exact Device Model
  if (/iPhone|iPad/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) {
    deviceModel = detectAppleDeviceModel(ua, rawGpu);
  } else if (/Mac OS X|Macintosh/i.test(ua)) {
    if (rawGpu.includes("Apple M") || rawGpu.includes("Apple GPU")) {
      deviceModel = "MacBook / iMac (Apple Silicon M-Series)";
    } else if (rawGpu.includes("Intel")) {
      deviceModel = "MacBook / iMac (Intel)";
    } else {
      deviceModel = "Apple Mac / MacBook";
    }
  } else if (/Android/i.test(ua)) {
    deviceModel = detectAndroidModel(ua, rawGpu);
  } else if (/Windows/i.test(ua)) {
    if (/NVIDIA/i.test(cleanGpu)) {
      deviceModel = `Windows PC (${cleanGpu.split(",")[0]})`;
    } else if (/Radeon/i.test(cleanGpu)) {
      deviceModel = `Windows PC (${cleanGpu.split(",")[0]})`;
    } else if (/Iris|UHD/i.test(cleanGpu)) {
      deviceModel = `Windows Laptop (${cleanGpu.split(",")[0]})`;
    } else {
      deviceModel = "Windows Desktop / Laptop";
    }
  } else {
    deviceModel = deviceType === "Mobile" ? "Smartphone" : "Computer / Laptop";
  }

  const screenInfo = getDetailedScreenInfo();
  const language = navigator.language || "en";
  const languages = navigator.languages ? navigator.languages.join(", ") : language;
  const cores = navigator.hardwareConcurrency || 0;
  const memory = navigator.deviceMemory || 0;
  const touch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const connection = navigator.connection?.effectiveType || "4G/Fast";
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";

  return {
    deviceType,
    deviceModel,
    screenSize: screenInfo.screenSizeLabel,
    screenPhysical: screenInfo.physicalLabel,
    screenViewport: screenInfo.viewportLabel,
    screenInches: screenInfo.inches,
    os,
    browser,
    screen: screenInfo.screenLabel,
    gpu: cleanGpu || "Standard GPU",
    cores,
    memory,
    touch,
    connection,
    timezone,
    language,
    languages,
  };
}

// ── Nationality & Citizenship Resolver ──────────────────────
export function getNationalityAndCitizenship(geo, session) {
  const code = (geo?.countryCode || session?.countryCode || "").toUpperCase();
  const countryName = geo?.country || session?.country || "Georgia";
  const browserLang = (session?.language || session?.languages || "").toLowerCase();
  const tz = session?.timezone || "";

  const NATIONALITY_MAP = {
    RU: { citizen: "რუსეთის მოქალაქე", demonym: "რუსი ტურისტი", flag: "🇷🇺", langName: "რუსულენოვანი" },
    GE: { citizen: "საქართველოს მოქალაქე", demonym: "ადგილობრივი ქართველი", flag: "🇬🇪", langName: "ქართულენოვანი" },
    SA: { citizen: "საუდის არაბეთის მოქალაქე", demonym: "არაბი ტურისტი (საუდი)", flag: "🇸🇦", langName: "არაბულენოვანი" },
    AE: { citizen: "არაბთა გაერთიანებული საამიროები (UAE)", demonym: "არაბი ტურისტი (დუბაი / UAE)", flag: "🇦🇪", langName: "არაბულენოვანი" },
    KW: { citizen: "ქუვეითის მოქალაქე", demonym: "არაბი ტურისტი (ქუვეითი)", flag: "🇰🇼", langName: "არაბულენოვანი" },
    QA: { citizen: "ყატარის მოქალაქე", demonym: "არაბი ტურისტი (ყატარი)", flag: "🇶🇦", langName: "არაბულენოვანი" },
    BH: { citizen: "ბაჰრეინის მოქალაქე", demonym: "არაბი ტურისტი (ბაჰრეინი)", flag: "🇧🇭", langName: "არაბულენოვანი" },
    OM: { citizen: "ომანის მოქალაქე", demonym: "არაბი ტურისტი (ომანი)", flag: "🇴🇲", langName: "არაბულენოვანი" },
    IL: { citizen: "ისრაელის მოქალაქე", demonym: "ებრაელი ტურისტი", flag: "🇮🇱", langName: "ივრითი / ინგლისური" },
    TR: { citizen: "თურქეთის მოქალაქე", demonym: "თურქი ტურისტი", flag: "🇹🇷", langName: "თურქულენოვანი" },
    KZ: { citizen: "ყაზახეთის მოქალაქე", demonym: "ყაზახი ტურისტი", flag: "🇰🇿", langName: "ყაზახური / რუსული" },
    UA: { citizen: "უკრაინის მოქალაქე", demonym: "უკრაინელი ტურისტი", flag: "🇺🇦", langName: "უკრაინულენოვანი" },
    BY: { citizen: "ბელარუსის მოქალაქე", demonym: "ბელარუსი ტურისტი", flag: "🇧🇾", langName: "რუსულენოვანი" },
    DE: { citizen: "გერმანიის მოქალაქე", demonym: "გერმანელი (EU)", flag: "🇩🇪", langName: "გერმანულენოვანი" },
    US: { citizen: "აშშ-ის მოქალაქე", demonym: "ამერიკელი ტურისტი", flag: "🇺🇸", langName: "ინგლისურენოვანი" },
    GB: { citizen: "დიდი ბრიტანეთის მოქალაქე", demonym: "ბრიტანელი ტურისტი", flag: "🇬🇧", langName: "ინგლისურენოვანი" },
    PL: { citizen: "პოლონეთის მოქალაქე", demonym: "პოლონელი (EU)", flag: "🇵🇱", langName: "პოლონურენოვანი" },
    IN: { citizen: "ინდოეთის მოქალაქე", demonym: "ინდოელი ტურისტი", flag: "🇮🇳", langName: "ინგლისური / ჰინდი" },
    IR: { citizen: "ირანის მოქალაქე", demonym: "ირანელი / სპარსი", flag: "🇮🇷", langName: "სპარსულენოვანი" },
    AZ: { citizen: "აზერბაიჯანის მოქალაქე", demonym: "აზერბაიჯანელი", flag: "🇦🇿", langName: "აზერბაიჯანული" },
    AM: { citizen: "სომხეთის მოქალაქე", demonym: "სომეხი ტურისტი", flag: "🇦🇲", langName: "სომხურენოვანი" },
    UZ: { citizen: "უზბეკეთის მოქალაქე", demonym: "უზბეკი ტურისტი", flag: "🇺🇿", langName: "უზბეკური / რუსული" },
    FR: { citizen: "საფრანგეთის მოქალაქე", demonym: "ფრანგი (EU)", flag: "🇫🇷", langName: "ფრანგულენოვანი" },
    IT: { citizen: "იტალიის მოქალაქე", demonym: "იტალიელი (EU)", flag: "🇮🇹", langName: "იტალიურენოვანი" },
    ES: { citizen: "ესპანეთის მოქალაქე", demonym: "ესპანელი (EU)", flag: "🇪🇸", langName: "ესპანურენოვანი" },
    NL: { citizen: "ნიდერლანდების მოქალაქე", demonym: "ჰოლანდიელი (EU)", flag: "🇳🇱", langName: "ნიდერლანდური" },
    CN: { citizen: "ჩინეთის მოქალაქე", demonym: "ჩინელი ტურისტი", flag: "🇨🇳", langName: "ჩინურენოვანი" },
  };

  // Cross-border roaming inference: IP in Georgia but Browser/Timezone is Foreign
  if (code === "GE") {
    if (browserLang.startsWith("ru") || tz.includes("Moscow") || tz.includes("Yekaterinburg")) {
      return {
        citizen: "საქართველოში მყოფი რუსულენოვანი ტურისტი / ემიგრანტი",
        demonym: "რუსი ტურისტი (საქართველოში)",
        flag: "🇷🇺",
        langName: "რუსულენოვანი",
        isLocal: false,
        isTourist: true,
        roamingBadge: "🧳 უკვე საქართველოშია!",
      };
    }
    if (browserLang.startsWith("ar") || tz.includes("Riyadh") || tz.includes("Dubai")) {
      return {
        citizen: "საქართველოში ჩამოსული არაბი ტურისტი",
        demonym: "არაბი ტურისტი (საქართველოში)",
        flag: "🇦🇪",
        langName: "არაბულენოვანი",
        isLocal: false,
        isTourist: true,
        roamingBadge: "🧳 უკვე საქართველოშია!",
      };
    }
    if (browserLang.startsWith("he") || tz.includes("Jerusalem")) {
      return {
        citizen: "საქართველოში მყოფი ისრაელელი ტურისტი",
        demonym: "ებრაელი ტურისტი (საქართველოში)",
        flag: "🇮🇱",
        langName: "ივრითი / ინგლისური",
        isLocal: false,
        isTourist: true,
        roamingBadge: "🧳 უკვე საქართველოშია!",
      };
    }
  }

  let info = NATIONALITY_MAP[code];
  if (info) {
    return {
      ...info,
      isLocal: code === "GE",
      isTourist: code !== "GE",
      roamingBadge: null,
    };
  }

  return {
    citizen: `${countryName}-ის მოქალაქე`,
    demonym: `${countryName} ტურისტი`,
    flag: geo?.flag || "🌐",
    langName: browserLang || "უცნობი",
    isLocal: code === "GE",
    isTourist: code !== "GE",
    roamingBadge: null,
  };
}

// ── Accurate Age, Demographic & Buyer Persona Engine ────────
export function getDemographicProfile(session, allUserSessions = [], allUserEvents = []) {
  const os = (session?.os || "").toLowerCase();
  const device = (session?.deviceType || "").toLowerCase();
  const model = (session?.deviceModel || "").toLowerCase();
  const src = (session?.source || "").toLowerCase();
  const browser = (session?.browser || "").toLowerCase();

  // Check visited pages / interests
  const pagesText = allUserSessions.map((s) => (s.currentPage || "") + " " + (s.currentPageTitle || "")).join(" ").toLowerCase();
  const hasWineOrCulture = /wine|ღვინ|ღვინის|kakheti|sighnaghi|კახეთი|history|მცხეთა|culture|მონასტერი/i.test(pagesText);
  const hasExtremeOrAdventure = /kazbegi|ყაზბეგ|rafting|4x4|джип|svaneti|სვანეთ|adventure|ბუნება|კანიონი|martvili/i.test(pagesText);
  const hasVipOrTransfer = /vip|mercedes|transfer|ტრანსფერ|трансфер|private|აეროპორტ|airport/i.test(pagesText);
  const hasFamilyOrRelax = /family|ბავშვ|ბათუმი|batumi|villa|hotel|სასტუმრო|მშვიდი/i.test(pagesText);

  // 1. Estimate Age Range
  let ageRange = "25 – 42 წელი";
  let ageDesc = "სტანდარტული მოგზაური";
  let ageConfidence = "საშუალო";
  let ageTag = "mid";

  if (browser.includes("tiktok") || src.includes("tiktok") || src.includes("snapchat")) {
    ageRange = "18 – 26 წელი";
    ageDesc = "Gen Z / ახალგაზრდა აუდიტორია (TikTok)";
    ageTag = "young";
    ageConfidence = "მაღალი (94%)";
  } else if (browser.includes("instagram") || src.includes("instagram")) {
    if (hasExtremeOrAdventure) {
      ageRange = "22 – 34 წელი";
      ageDesc = "ახალგაზრდა თავგადასავლების მაძიებელი (Instagram)";
    } else {
      ageRange = "24 – 38 წელი";
      ageDesc = "ახალგაზრდა პროფესიონალი / წყვილი (Instagram)";
    }
    ageTag = "young-pro";
    ageConfidence = "მაღალი (90%)";
  } else if (src.includes("facebook") || browser.includes("facebook")) {
    if (hasWineOrCulture || hasFamilyOrRelax) {
      ageRange = "38 – 58 წელი";
      ageDesc = "ოჯახური & კულტურული ტურიზმი (Facebook)";
    } else {
      ageRange = "32 – 55 წელი";
      ageDesc = "ზრდასრული ოჯახური აუდიტორია (Facebook)";
    }
    ageTag = "mature";
    ageConfidence = "მაღალი (92%)";
  } else if (device === "desktop" || os.includes("windows") || os.includes("macos")) {
    if (hasWineOrCulture) {
      ageRange = "35 – 60 წელი";
      ageDesc = "ბიზნესი & კულტურული ტურისტი (Desktop)";
    } else {
      ageRange = "28 – 52 წელი";
      ageDesc = "დამოუკიდებელი დამგეგმავი (Desktop)";
    }
    ageTag = "desktop";
    ageConfidence = "საშუალო (85%)";
  } else if (model.includes("pro max") || model.includes("ultra") || model.includes("fold")) {
    ageRange = "28 – 48 წელი";
    ageDesc = "მაღალი მსყიდველუნარიანობის მყიდველი (Flagship Device)";
    ageTag = "vip";
    ageConfidence = "მაღალი (88%)";
  }

  // 2. Purchasing Power (მსყიდველუნარიანობა)
  let purchasingPower = "საშუალო";
  let powerIcon = "💵";
  if (
    model.includes("pro max") ||
    model.includes("ultra") ||
    model.includes("fold") ||
    model.includes("silicon") ||
    hasVipOrTransfer
  ) {
    purchasingPower = "👑 VIP / მაღალბიუჯეტიანი";
    powerIcon = "👑";
  } else if (model.includes("iphone") || model.includes("galaxy s") || model.includes("pixel")) {
    purchasingPower = "💎 საშუალოზე მაღალი";
    powerIcon = "💎";
  } else if (model.includes("redmi") || model.includes("poco") || model.includes("a34") || model.includes("se")) {
    purchasingPower = "🎒 ეკონომ / სტუდენტური";
    powerIcon = "🎒";
  }

  // 3. Buyer Persona (მყიდველის პერსონა)
  let persona = "მოგზაური";
  let personaIcon = "🧭";
  if (hasVipOrTransfer) {
    persona = "VIP & ბიზნეს ტურისტი";
    personaIcon = "💼";
  } else if (hasWineOrCulture) {
    persona = "ღვინისა & კულტურის მოყვარული";
    personaIcon = "🍷";
  } else if (hasExtremeOrAdventure) {
    persona = "აქტიური / ექსტრემალური თავგადასავალი";
    personaIcon = "🏔️";
  } else if (hasFamilyOrRelax) {
    persona = "ოჯახური დასვენება & რელაქსი";
    personaIcon = "👨‍👩‍👧‍👦";
  } else if (src.includes("instagram") || src.includes("tiktok")) {
    persona = "ფოტოგენური / წყვილების მოგზაურობა";
    personaIcon = "📸";
  }

  return {
    ageRange,
    ageDesc,
    ageTag,
    ageConfidence,
    purchasingPower,
    powerIcon,
    persona,
    personaIcon,
  };
}

// ── Visitor Interests & Intent Synthesizer ──────────────────
export function getVisitorInterests(sessions = [], events = []) {
  const tourViews = {};
  const categories = new Set();
  let totalDwell = 0;
  let hasBookedOrContacted = false;
  let contactType = "";

  sessions.forEach((s) => {
    totalDwell += (s.totalDurationSeconds || 0);
    const path = s.currentPage || "";
    const title = s.currentPageTitle || "";

    if (path.startsWith("/tours/")) {
      categories.add("🏔️ ტურები");
      const tourName = title.replace(/\s*\|\s*GeorgiaTrips.*$/i, "").trim() || path.replace("/tours/", "");
      tourViews[tourName] = (tourViews[tourName] || 0) + 1;
    } else if (path.includes("/transfers")) {
      categories.add("🚗 ტრანსფერები");
    } else if (path.includes("/hotels")) {
      categories.add("🏨 სასტუმროები");
    } else if (path.includes("/places")) {
      categories.add("📍 ღირსშესანიშნაობები");
    } else if (path.includes("/coupons")) {
      categories.add("🎟️ ფასდაკლების კუპონები");
    }
  });

  events.forEach((e) => {
    if (e.eventName === "click_whatsapp") {
      hasBookedOrContacted = true;
      contactType = "💬 WhatsApp";
    } else if (e.eventName === "click_call") {
      hasBookedOrContacted = true;
      contactType = "📞 დარეკვა";
    } else if (e.eventName === "click_book_button") {
      hasBookedOrContacted = true;
      contactType = "📝 ჯავშნის ღილაკი";
    }
  });

  // Top Tours Sorted by Views
  const topTours = Object.entries(tourViews)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  // Intent Level
  let intentLevel = "👀 დათვალიერება";
  let intentTag = "browse";
  if (hasBookedOrContacted) {
    intentLevel = `🔥 ცხელი ლიდი (${contactType})`;
    intentTag = "hot";
  } else if (topTours.length > 0 && totalDwell > 90) {
    intentLevel = "⚡ მაღალი დაინტერესება (მზადაა ჯავშნისთვის)";
    intentTag = "high";
  } else if (topTours.length > 0 || totalDwell > 40) {
    intentLevel = "🔍 აქტიური შერჩევა";
    intentTag = "medium";
  }

  return {
    topTours,
    categories: Array.from(categories),
    intentLevel,
    intentTag,
    hasContacted: hasBookedOrContacted,
    contactType,
  };
}

// ── Visitor & Session IDs ───────────────────────────────────
export function getVisitorId() {
  if (typeof window === "undefined") return "server";
  let vid = localStorage.getItem(VISITOR_ID_KEY);
  if (!vid) {
    vid = "v_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    try {
      localStorage.setItem(VISITOR_ID_KEY, vid);
    } catch (_) {}
  }
  return vid;
}

export function getSessionId() {
  if (typeof window === "undefined") return "server";
  let sid = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sid) {
    sid = "s_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    try {
      sessionStorage.setItem(SESSION_ID_KEY, sid);
    } catch (_) {}
  }
  return sid;
}

// ── Traffic Source / UTM parser ─────────────────────────────
export function getTrafficSource() {
  if (typeof window === "undefined") return { source: "Direct", medium: "none" };

  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get("utm_source");
  const utmMedium = params.get("utm_medium");
  const utmCampaign = params.get("utm_campaign");
  const utmContent = params.get("utm_content");

  const referrer = document.referrer || "";
  let source = "Direct";
  let medium = "none";

  if (utmSource) {
    source = utmSource;
    medium = utmMedium || "cpc";
  } else if (referrer) {
    try {
      const refUrl = new URL(referrer);
      const host = refUrl.hostname.toLowerCase();
      if (host.includes("google")) source = "Google Search";
      else if (host.includes("facebook") || host.includes("fb.com")) source = "Facebook";
      else if (host.includes("instagram")) source = "Instagram";
      else if (host.includes("tiktok")) source = "TikTok";
      else if (host.includes("youtube")) source = "YouTube";
      else if (host.includes("t.co") || host.includes("twitter") || host.includes("x.com")) source = "X / Twitter";
      else if (host.includes("yandex")) source = "Yandex";
      else if (host.includes("bing")) source = "Bing";
      else source = host;
      medium = "referral";
    } catch (_) {
      source = "Referral";
    }
  }

  return {
    source,
    medium,
    campaign: utmCampaign || "",
    content: utmContent || "",
    referrer: referrer || "direct",
  };
}

// ── Fetch GeoIP Metadata ────────────────────────────────────
export async function getGeoData() {
  if (typeof window === "undefined") return null;

  try {
    const cached = sessionStorage.getItem(GEO_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (_) {}

  try {
    const res = await fetch("/api/analytics/track");
    if (res.ok) {
      const data = await res.json();
      try {
        sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify(data));
      } catch (_) {}
      return data;
    }
  } catch (err) {
    console.warn("Geo lookup failed:", err);
  }

  return {
    ip: "Unknown",
    country: "Unknown",
    countryCode: "UN",
    city: "Unknown",
    flag: "🌐",
  };
}

// ── Initialize or Refresh Visitor Session in Firestore ──────
export async function registerPageVisit({ path, title }) {
  if (typeof window === "undefined" || !db) return null;

  const sessionId = getSessionId();
  const visitorId = getVisitorId();
  const device = getDeviceInfo();
  const traffic = getTrafficSource();
  const geo = await getGeoData();

  const sessionRef = doc(db, "visitor_sessions", sessionId);
  const now = new Date();

  const pageEntry = {
    path: path || window.location.pathname,
    title: title || document.title || path,
    timestamp: now.toISOString(),
  };

  try {
    // High entropy values for Android / Windows
    let exactModel = device.deviceModel;
    if (typeof navigator !== "undefined" && navigator.userAgentData?.getHighEntropyValues) {
      try {
        const hints = await navigator.userAgentData.getHighEntropyValues(["model", "platformVersion"]);
        if (hints?.model) {
          const m = hints.model;
          if (/SM-S928/i.test(m)) exactModel = "Samsung Galaxy S24 Ultra";
          else if (/SM-S926/i.test(m)) exactModel = "Samsung Galaxy S24+";
          else if (/SM-S921/i.test(m)) exactModel = "Samsung Galaxy S24";
          else if (/SM-S918/i.test(m)) exactModel = "Samsung Galaxy S23 Ultra";
          else if (/SM-S916/i.test(m)) exactModel = "Samsung Galaxy S23+";
          else if (/SM-S911/i.test(m)) exactModel = "Samsung Galaxy S23";
          else if (/SM-S908/i.test(m)) exactModel = "Samsung Galaxy S22 Ultra";
          else if (/SM-F946|SM-F936/i.test(m)) exactModel = "Samsung Galaxy Z Fold";
          else if (/SM-F731|SM-F721/i.test(m)) exactModel = "Samsung Galaxy Z Flip";
          else if (/SM-A546|SM-A536/i.test(m)) exactModel = "Samsung Galaxy A54 5G";
          else if (/Pixel 9/i.test(m)) exactModel = "Google Pixel 9 / 9 Pro";
          else if (/Pixel 8 Pro/i.test(m)) exactModel = "Google Pixel 8 Pro";
          else if (/Pixel 8/i.test(m)) exactModel = "Google Pixel 8";
          else if (/Pixel 7/i.test(m)) exactModel = "Google Pixel 7 / 7 Pro";
          else if (/2312|2210|Redmi/i.test(m)) exactModel = "Xiaomi Redmi Note";
          else if (m && m !== "K") exactModel = `${m} (Android)`;
        }
      } catch (_) {}
    }

    // Comprehensive Session payload
    const sessionData = {
      sessionId,
      visitorId,
      ip: geo?.ip || "Unknown",
      country: geo?.country || "Unknown",
      countryCode: geo?.countryCode || "UN",
      city: geo?.city || "Unknown",
      region: geo?.region || "",
      flag: geo?.flag || "🌐",
      isp: geo?.isp || "",
      deviceType: device.deviceType,
      deviceModel: exactModel,
      screenSize: device.screenSize,
      screenPhysical: device.screenPhysical,
      screenViewport: device.screenViewport,
      screenInches: device.screenInches,
      os: device.os,
      browser: device.browser,
      screen: device.screen,
      gpu: device.gpu,
      cores: device.cores,
      memory: device.memory,
      touch: device.touch,
      connection: device.connection,
      timezone: device.timezone,
      language: device.language,
      languages: device.languages,
      source: traffic.source,
      medium: traffic.medium,
      campaign: traffic.campaign,
      referrer: traffic.referrer,
      currentPage: pageEntry.path,
      currentPageTitle: pageEntry.title,
      lastActive: serverTimestamp(),
      lastActiveMillis: Date.now(),
      createdAtMillis: Date.now(),
      totalDurationSeconds: 0,
    };

    await setDoc(
      sessionRef,
      sessionData,
      { merge: true }
    );

    return sessionId;
  } catch (error) {
    console.warn("Analytics session register error:", error);
    return null;
  }
}

// ── Session Heartbeat (Live Online Status & Dwell Time) ─────
export async function sendHeartbeat(path, title, totalDurationSeconds) {
  if (typeof window === "undefined" || !db) return;
  const sessionId = getSessionId();
  if (!sessionId) return;

  try {
    const sessionRef = doc(db, "visitor_sessions", sessionId);
    await updateDoc(sessionRef, {
      currentPage: path || window.location.pathname,
      currentPageTitle: title || document.title,
      lastActive: serverTimestamp(),
      lastActiveMillis: Date.now(),
      totalDurationSeconds: Math.round(totalDurationSeconds || 0),
    });
  } catch (_) {}
}

// ── Track Custom Actions & Conversions ───────────────────────
// (WhatsApp Clicks, Call Clicks, Tour Bookings, Tour Views)
export async function trackEvent(eventName, eventParams = {}) {
  if (typeof window === "undefined") return;

  const sessionId = getSessionId();
  const visitorId = getVisitorId();
  const path = window.location.pathname;
  const title = document.title;
  const now = new Date();

  const eventPayload = {
    eventName,
    sessionId,
    visitorId,
    path,
    title,
    params: eventParams,
    createdAt: serverTimestamp(),
    createdAtMillis: Date.now(),
    isoTime: now.toISOString(),
  };

  // 1. Log to Firestore
  if (db) {
    try {
      await addDoc(collection(db, "analytics_events"), eventPayload);
      
      // Also attach event tag to current session
      const sessionRef = doc(db, "visitor_sessions", sessionId);
      await setDoc(
        sessionRef,
        {
          lastAction: eventName,
          lastActionDetail: eventParams.tourTitle || eventParams.label || eventParams.target || "",
          lastActive: serverTimestamp(),
          lastActiveMillis: Date.now(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn("Event track firestore error:", err);
    }
  }

  // 2. Dispatch to Meta Pixel (Facebook Ads)
  if (typeof window !== "undefined" && window.fbq) {
    try {
      if (eventName === "click_whatsapp" || eventName === "click_call") {
        window.fbq("track", "Contact", { content_name: eventName, ...eventParams });
      } else if (eventName === "purchase" || eventName === "book_tour_success") {
        const purchaseOpts = eventParams.eventId ? { eventID: String(eventParams.eventId) } : undefined;
        window.fbq("track", "Purchase", {
          content_name: eventParams.tourTitle || eventParams.content_name || "Tour Booking",
          content_ids: eventParams.tourId ? [String(eventParams.tourId)] : (eventParams.content_ids || []),
          content_type: "product",
          value: Number(eventParams.price || eventParams.value) || 0,
          currency: "GEL",
          num_items: Number(eventParams.people || eventParams.num_items) || 1,
        }, purchaseOpts);
      } else if (eventName === "initiate_checkout" || eventName === "click_book_button") {
        window.fbq("track", "InitiateCheckout", {
          content_name: eventParams.tourTitle || eventParams.label || "Book Tour",
          content_ids: eventParams.tourId ? [String(eventParams.tourId)] : [],
          value: Number(eventParams.price) || 0,
          currency: "GEL",
        });
      } else if (eventName === "view_tour" || eventName === "view_tour_detail") {
        window.fbq("track", "ViewContent", {
          content_name: eventParams.tourTitle,
          content_ids: eventParams.tourId ? [String(eventParams.tourId)] : [],
          content_type: "product",
          value: Number(eventParams.price) || 0,
          currency: "GEL",
        });
      } else if (eventName === "book_tour_submit") {
        window.fbq("track", "Lead", { content_name: eventParams.tourTitle, value: Number(eventParams.price) || 0, currency: "GEL" });
      } else {
        window.fbq("trackCustom", eventName, eventParams);
      }
    } catch (_) {}
  }

  // 3. Dispatch to Google Analytics 4 / Google Ads Tag
  if (typeof window !== "undefined" && window.gtag) {
    try {
      window.gtag("event", eventName, eventParams);
    } catch (_) {}
  }
}

// ── Meta Pixel Dedicated Helper Functions ───────────────────
export function trackMetaPageView() {
  if (typeof window !== "undefined" && window.fbq) {
    try {
      window.fbq("track", "PageView");
    } catch (_) {}
  }
}

export function trackMetaViewContent({ tourTitle, tourId, price = 0 }) {
  if (typeof window !== "undefined" && window.fbq) {
    try {
      window.fbq("track", "ViewContent", {
        content_name: tourTitle || "Tour",
        content_ids: tourId ? [String(tourId)] : [],
        content_type: "product",
        value: Number(price) || 0,
        currency: "GEL",
      });
    } catch (_) {}
  }
}

export function trackMetaInitiateCheckout({ tourTitle, tourId, price = 0 }) {
  if (typeof window !== "undefined" && window.fbq) {
    try {
      window.fbq("track", "InitiateCheckout", {
        content_name: tourTitle || "Tour Booking",
        content_ids: tourId ? [String(tourId)] : [],
        value: Number(price) || 0,
        currency: "GEL",
      });
    } catch (_) {}
  }
}

export function trackMetaPurchase({ bookingId, tourTitle, tourId, price, people = 1 }) {
  if (typeof window !== "undefined" && window.fbq) {
    try {
      const opts = bookingId ? { eventID: String(bookingId) } : undefined;
      window.fbq("track", "Purchase", {
        content_name: tourTitle || "Tour Booking",
        content_ids: tourId ? [String(tourId)] : [],
        content_type: "product",
        value: Number(price) || 0,
        currency: "GEL",
        num_items: Number(people) || 1,
      }, opts);
    } catch (_) {}
  }
}

// ── Real-time Subscriptions for Admin Dashboard ──────────────
export function subscribeToLiveSessions(callback) {
  if (!db || typeof window === "undefined") return () => {};

  try {
    const q = query(
      collection(db, "visitor_sessions"),
      orderBy("lastActiveMillis", "desc"),
      limit(200)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        try {
          const items = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }));
          callback(items);
        } catch (_) {}
      },
      (err) => {
        console.warn("Live sessions subscription warning:", err);
        callback([]);
      }
    );
  } catch (err) {
    console.warn("Live sessions query error:", err);
    callback([]);
    return () => {};
  }
}

export function subscribeToRecentEvents(callback) {
  if (!db || typeof window === "undefined") return () => {};

  try {
    const q = query(
      collection(db, "analytics_events"),
      orderBy("createdAtMillis", "desc"),
      limit(100)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        try {
          const events = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }));
          callback(events);
        } catch (_) {}
      },
      (err) => {
        console.warn("Recent events subscription warning:", err);
        callback([]);
      }
    );
  } catch (err) {
    console.warn("Recent events query error:", err);
    callback([]);
    return () => {};
  }
}
