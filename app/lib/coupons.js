import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
  getCountFromServer,
} from "firebase/firestore";

export const COUPONS_COLLECTION = "coupons";

// One document per (coupon, user) once that user has booked with the coupon.
// Kept in claimed_coupon_ips because its rules already let anyone create a
// document but only an admin change or delete one, so a user cannot erase
// their own record to use a single-use coupon again.
export const REDEMPTIONS_COLLECTION = "claimed_coupon_ips";
export const redemptionId = (code, uid) =>
  `use__${String(code).trim().toUpperCase()}__${String(uid).replace(/[^A-Za-z0-9_-]/g, "_")}`;

/** True when this user has already booked with this coupon. */
export async function hasUserUsedCoupon(code, uid) {
  if (!code || !uid) return false;
  try {
    const snap = await getDoc(doc(db, REDEMPTIONS_COLLECTION, redemptionId(code, uid)));
    return snap.exists();
  } catch (err) {
    console.warn("hasUserUsedCoupon error:", err);
    return false;
  }
}


/**
 * How many bookings have used this coupon, counted from the usage records
 * (the coupon's own usedCount field can only be written by an admin, so the
 * booking server cannot keep it up to date).
 */
export async function countCouponUses(code) {
  if (!code) return 0;
  try {
    const q = query(collection(db, REDEMPTIONS_COLLECTION), where("code", "==", String(code).trim().toUpperCase()));
    const snap = await getCountFromServer(q);
    return snap.data().count || 0;
  } catch (err) {
    console.warn("countCouponUses error:", err);
    return 0;
  }
}

/**
 * Default fallback coupons if Firestore is empty or bootstrap is needed
 */
export const DEFAULT_COUPONS = {
  WELCOME10: {
    code: "WELCOME10",
    title: "10% მისასალმებელი კუპონი",
    discountPercent: 10,
    maxDiscountGEL: 100,
    usageType: "multiple", // "single" | "multiple" | "unlimited"
    maxUses: 1000,
    usedCount: 0,
    active: true,
    expiresAt: null,
    limitOnePerIp: true,
  },
  GEO10: {
    code: "GEO10",
    title: "10% პრომო კოდი",
    discountPercent: 10,
    maxDiscountGEL: 100,
    usageType: "multiple",
    maxUses: 500,
    usedCount: 0,
    active: true,
    expiresAt: null,
    limitOnePerIp: true,
  },
};

/**
 * Fetch all coupons from Firestore (for Admin & Catalog)
 */
export async function listCoupons() {
  try {
    const colRef = collection(db, COUPONS_COLLECTION);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      // Auto-bootstrap default coupons into Firestore if empty
      const list = [];
      for (const [code, cData] of Object.entries(DEFAULT_COUPONS)) {
        const docRef = doc(db, COUPONS_COLLECTION, code);
        const item = {
          ...cData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(docRef, item).catch(() => {});
        list.push({ id: code, ...item });
      }
      return list;
    }
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn("listCoupons error, returning defaults:", err);
    return Object.values(DEFAULT_COUPONS);
  }
}

/**
 * Fetch a single coupon by uppercase code
 */
export async function getCouponByCode(rawCode) {
  if (!rawCode) return null;
  const cleanCode = String(rawCode).trim().toUpperCase();
  try {
    const docRef = doc(db, COUPONS_COLLECTION, cleanCode);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
    // Fallback to default if not in Firestore yet
    if (DEFAULT_COUPONS[cleanCode]) {
      return { id: cleanCode, ...DEFAULT_COUPONS[cleanCode] };
    }
    return null;
  } catch (err) {
    console.warn(`getCouponByCode(${cleanCode}) error:`, err);
    return DEFAULT_COUPONS[cleanCode] || null;
  }
}

/**
 * Create or overwrite a coupon in Firestore (Admin only)
 */
export async function createCoupon(couponData) {
  if (!couponData?.code) throw new Error("კუპონის კოდი სავალდებულოა");
  const cleanCode = String(couponData.code).trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  if (!cleanCode) throw new Error("კუპონის კოდი უნდა შეიცავდეს ლათინურ ასოებს ან ციფრებს");

  const docRef = doc(db, COUPONS_COLLECTION, cleanCode);
  const payload = {
    code: cleanCode,
    title: String(couponData.title || cleanCode).trim(),
    discountPercent: Math.min(50, Math.max(1, parseInt(couponData.discountPercent, 10) || 10)),
    maxDiscountGEL: Math.max(0, parseInt(couponData.maxDiscountGEL, 10) || 0),
    usageType: couponData.usageType || (couponData.maxUses === 1 ? "single" : "multiple"),
    maxUses: Math.max(1, parseInt(couponData.maxUses, 10) || (couponData.usageType === "single" ? 1 : 100)),
    usedCount: parseInt(couponData.usedCount, 10) || 0,
    active: couponData.active !== false,
    expiresAt: couponData.expiresAt || null,
    limitOnePerIp: couponData.limitOnePerIp !== false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(docRef, payload, { merge: true });
  return { id: cleanCode, ...payload };
}

/**
 * Update an existing coupon (e.g. toggle active status or edit limits)
 */
export async function updateCoupon(code, updates) {
  if (!code) throw new Error("კოდი სავალდებულოა");
  const cleanCode = String(code).trim().toUpperCase();
  const docRef = doc(db, COUPONS_COLLECTION, cleanCode);
  const payload = {
    ...updates,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(docRef, payload);
  return true;
}

/**
 * Delete a coupon from Firestore
 */
export async function deleteCoupon(code) {
  if (!code) return;
  const cleanCode = String(code).trim().toUpperCase();
  const docRef = doc(db, COUPONS_COLLECTION, cleanCode);
  await deleteDoc(docRef);
  return true;
}
