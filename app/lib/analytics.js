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
  where,
} from "firebase/firestore";
import { db } from "./firebase";

const VISITOR_ID_KEY = "gt_vid";
const SESSION_ID_KEY = "gt_sid";
const GEO_CACHE_KEY = "gt_geo_cache";

// ── Device & Browser Details Detection ──────────────────────
export function getDeviceInfo() {
  if (typeof window === "undefined") {
    return {
      deviceType: "Desktop",
      os: "Unknown",
      browser: "Unknown",
      screen: "Unknown",
      language: "en",
    };
  }

  const ua = navigator.userAgent || "";
  let deviceType = "Desktop";
  let os = "Unknown";
  let browser = "Unknown";

  // Device Type
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    deviceType = "Tablet";
  } else if (
    /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(
      ua
    )
  ) {
    deviceType = "Mobile";
  }

  // OS Detection
  if (/Windows NT 10.0/i.test(ua)) os = "Windows 10/11";
  else if (/Windows NT 6.3/i.test(ua)) os = "Windows 8.1";
  else if (/Windows NT 6.1/i.test(ua)) os = "Windows 7";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/iPhone OS 18/i.test(ua)) os = "iOS 18";
  else if (/iPhone OS 17/i.test(ua)) os = "iOS 17";
  else if (/iPhone OS 16/i.test(ua)) os = "iOS 16";
  else if (/iPhone/i.test(ua)) os = "iOS (iPhone)";
  else if (/iPad/i.test(ua)) os = "iPadOS";
  else if (/Mac OS X 10[._]\d+/i.test(ua) || /Macintosh/i.test(ua)) os = "macOS";
  else if (/Android 15/i.test(ua)) os = "Android 15";
  else if (/Android 14/i.test(ua)) os = "Android 14";
  else if (/Android 13/i.test(ua)) os = "Android 13";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Linux/i.test(ua)) os = "Linux";

  // Browser Detection
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera/i.test(ua)) browser = "Opera";
  else if (/Chrome\//i.test(ua) && !/Chromium|Edg|OPR/i.test(ua)) browser = "Chrome";
  else if (/Safari\//i.test(ua) && !/Chrome|Chromium|Edg|OPR/i.test(ua)) browser = "Safari";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/SamsungBrowser/i.test(ua)) browser = "Samsung Internet";

  const screen = `${window.screen.width}x${window.screen.height}`;
  const language = navigator.language || "en";

  return { deviceType, os, browser, screen, language };
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
    // Session payload
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
      os: device.os,
      browser: device.browser,
      screen: device.screen,
      language: device.language,
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
      {
        ...sessionData,
        // Using merge so we preserve previous pages & events if already exists
      },
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
      } else if (eventName === "book_tour_submit") {
        window.fbq("track", "Lead", { content_name: eventParams.tourTitle, value: eventParams.price, currency: "GEL" });
      } else if (eventName === "view_tour") {
        window.fbq("track", "ViewContent", { content_name: eventParams.tourTitle, id: eventParams.tourId });
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
        // Fallback: callback empty list so UI doesn't hang
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

export async function clearAllAnalyticsData() {
  if (!db) return false;
  try {
    const sSnap = await getDocs(collection(db, "visitor_sessions"));
    const delSessions = sSnap.docs.map((d) => deleteDoc(d.ref));
    const eSnap = await getDocs(collection(db, "analytics_events"));
    const delEvents = eSnap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all([...delSessions, ...delEvents]);
    return true;
  } catch (err) {
    console.error("Failed to clear analytics:", err);
    return false;
  }
}
