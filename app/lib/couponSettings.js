import { db } from "./firebase";
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, serverTimestamp } from "firebase/firestore";

const SETTINGS_DOC = "coupon_settings";
const SETTINGS_COLLECTION = "settings";
const CLAIMED_IPS_COLLECTION = "claimed_coupon_ips";

function sanitizeIp(ip) {
  if (!ip) return "unknown";
  return String(ip).replace(/[\/\.#$\[\]:]/g, "_");
}

/**
 * Get coupon settings from Firestore (defaults to limitOnePerIp: false for easy testing)
 */
export async function getCouponSettings() {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return {
        limitOnePerIp: snap.data().limitOnePerIp === true,
        updatedAt: snap.data().updatedAt || null,
      };
    }
    return { limitOnePerIp: false };
  } catch (err) {
    console.warn("Could not load coupon settings from Firestore:", err);
    return { limitOnePerIp: false };
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
