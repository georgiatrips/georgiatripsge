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
  increment,
  query,
  orderBy,
} from "firebase/firestore";
import { isIpClaimed, recordClaimedIp } from "./couponSettings";

export const COUPONS_COLLECTION = "coupons";

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

/**
 * 🔒 SECURE SERVER-SIDE COUPON VALIDATOR
 * Called in API route before applying discounts.
 * NEVER trusts numbers inside the code. Strictly checks Firestore / Whitelist rules.
 */
export async function validateCouponServer({
  code,
  baseTotalPrice = 0,
  ip = "",
  userId = "",
}) {
  if (!code || typeof code !== "string") {
    return { valid: false, discountPercent: 0, discountAmount: 0, reason: "კუპონი არ არის მითითებული" };
  }

  const cleanCode = code.trim().toUpperCase();
  const coupon = await getCouponByCode(cleanCode);

  if (!coupon) {
    return {
      valid: false,
      discountPercent: 0,
      discountAmount: 0,
      reason: "კუპონი ვერ მოიძებნა ან არასწორია",
    };
  }

  if (!coupon.active) {
    return {
      valid: false,
      discountPercent: 0,
      discountAmount: 0,
      reason: "მოცემული კუპონი დეაქტივირებულია",
    };
  }

  // Check expiration date
  if (coupon.expiresAt) {
    const expDate = new Date(coupon.expiresAt);
    if (!isNaN(expDate.getTime()) && expDate.getTime() < Date.now()) {
      return {
        valid: false,
        discountPercent: 0,
        discountAmount: 0,
        reason: "კუპონის მოქმედების ვადა ამოიწურა",
      };
    }
  }

  // Check usage limits
  const maxUses = parseInt(coupon.maxUses, 10) || 0;
  const usedCount = parseInt(coupon.usedCount, 10) || 0;
  if (maxUses > 0 && usedCount >= maxUses) {
    return {
      valid: false,
      discountPercent: 0,
      discountAmount: 0,
      reason: "კუპონის გამოყენების ლიმიტი ამოწურულია",
    };
  }

  // Check IP restriction if enabled
  if (coupon.limitOnePerIp && ip) {
    const alreadyClaimed = await isIpClaimed(ip);
    if (alreadyClaimed && coupon.usageType === "single") {
      return {
        valid: false,
        discountPercent: 0,
        discountAmount: 0,
        reason: "ამ IP მისამართიდან კუპონი უკვე გამოყენებულია",
      };
    }
  }

  // Calculate discount
  const discountPercent = Math.min(50, Math.max(1, Number(coupon.discountPercent) || 10));
  let discountAmount = Math.round(baseTotalPrice * (discountPercent / 100));

  // Apply maximum GEL cap if configured
  if (coupon.maxDiscountGEL && coupon.maxDiscountGEL > 0) {
    discountAmount = Math.min(discountAmount, coupon.maxDiscountGEL);
  }

  return {
    valid: true,
    code: cleanCode,
    coupon,
    discountPercent,
    discountAmount,
    reason: "კუპონი ვალიდურია",
  };
}

/**
 * Increment coupon usage upon confirmed booking
 */
export async function recordCouponUsage({ code, ip = "", userId = "" }) {
  if (!code) return;
  const cleanCode = String(code).trim().toUpperCase();
  try {
    const docRef = doc(db, COUPONS_COLLECTION, cleanCode);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      await updateDoc(docRef, {
        usedCount: increment(1),
        lastUsedAt: serverTimestamp(),
      });
    }

    // Record IP in claimed IPs list
    if (ip) {
      await recordClaimedIp(ip, userId);
    }
  } catch (err) {
    console.error("recordCouponUsage error:", err);
  }
}
