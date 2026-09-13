import { db } from "./firebase";
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, serverTimestamp } from "firebase/firestore";

const SETTINGS_DOC = "coupon_settings";
const SETTINGS_COLLECTION = "settings";
const CLAIMED_IPS_COLLECTION = "claimed_coupon_ips";

function sanitizeIp(ip) {
  if (!ip) return "unknown";
  return String(ip).replace(/[\/\.#$\[\]:]/g, "_");
}

let cachedSettings = null;
let cachedSettingsTime = 0;
const SETTINGS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get coupon settings from Firestore (defaults to limitOnePerIp: false for easy testing)
 */
export async function getCouponSettings() {
  if (cachedSettings && Date.now() - cachedSettingsTime < SETTINGS_CACHE_TTL) {
    return cachedSettings;
  }
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = {
        limitOnePerIp: snap.data().limitOnePerIp === true,
        updatedAt: snap.data().updatedAt || null,
      };
      cachedSettings = data;
      cachedSettingsTime = Date.now();
      return data;
    }
    const def = { limitOnePerIp: false };
    cachedSettings = def;
    cachedSettingsTime = Date.now();
    return def;
  } catch (err) {
    console.warn("Could not load coupon settings from Firestore:", err);
    return cachedSettings || { limitOnePerIp: false };
  }
}

/**
 * Update coupon settings in Firestore
 */
export async function updateCouponSettings(settings) {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC);
    await setDoc(docRef, {
      limitOnePerIp: !!settings.limitOnePerIp,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    cachedSettings = { limitOnePerIp: !!settings.limitOnePerIp, updatedAt: new Date() };
    cachedSettingsTime = Date.now();
    return true;
  } catch (err) {
    console.error("Failed to update coupon settings:", err);
    throw err;
  }
}

/**
 * Record an IP as having claimed the welcome coupon
 */
export async function recordClaimedIp(ip, userId = "") {
  if (!ip) return;
  try {
    const ipDocId = sanitizeIp(ip);
    const docRef = doc(db, CLAIMED_IPS_COLLECTION, ipDocId);
    await setDoc(docRef, {
      ip,
      userId,
      claimedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to record claimed IP:", err);
  }
}

/**
 * Check if an IP has already claimed the coupon
 */
export async function isIpClaimed(ip) {
  if (!ip) return false;
  try {
    const ipDocId = sanitizeIp(ip);
    const docRef = doc(db, CLAIMED_IPS_COLLECTION, ipDocId);
    const snap = await getDoc(docRef);
    return snap.exists();
  } catch (err) {
    console.warn("Failed to check claimed IP:", err);
    return false;
  }
}

/**
 * List all claimed IPs (for admin)
 */
export async function listClaimedIps() {
  try {
    const snap = await getDocs(collection(db, CLAIMED_IPS_COLLECTION));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn("Failed to list claimed IPs:", err);
    return [];
  }
}

/**
 * Clear all claimed IPs (for testing in admin)
 */
export async function clearAllClaimedIps() {
  try {
    const snap = await getDocs(collection(db, CLAIMED_IPS_COLLECTION));
    const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletePromises);
    return true;
  } catch (err) {
    console.error("Failed to clear claimed IPs:", err);
    throw err;
  }
}
