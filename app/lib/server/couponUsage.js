// Server-side coupon checks for /api/bookings/create. Usage records live in
// claimed_coupon_ips, which the public cannot list, so they are read and
// written here through serverStore (Admin SDK).

import { DEFAULT_COUPONS, COUPONS_COLLECTION, REDEMPTIONS_COLLECTION, redemptionId } from "../coupons";
import { SERVER_TIME, countWhere, readDoc, writeDoc } from "./serverStore";

const invalid = (reason) => ({ valid: false, discountPercent: 0, discountAmount: 0, reason });

const sanitizeIp = (ip) => String(ip || "unknown").replace(/[\/\.#$\[\]:]/g, "_");

async function getCoupon(cleanCode) {
  try {
    const coupon = await readDoc(COUPONS_COLLECTION, cleanCode);
    if (coupon) return coupon;
  } catch (err) {
    console.warn(`[couponUsage] coupon ${cleanCode}:`, err?.message);
  }
  return DEFAULT_COUPONS[cleanCode] ? { id: cleanCode, ...DEFAULT_COUPONS[cleanCode] } : null;
}

async function hasUsed(cleanCode, userId) {
  try {
    return Boolean(await readDoc(REDEMPTIONS_COLLECTION, redemptionId(cleanCode, userId)));
  } catch (err) {
    console.warn("[couponUsage] hasUsed:", err?.message);
    return false;
  }
}

async function countUses(cleanCode) {
  try {
    return await countWhere(REDEMPTIONS_COLLECTION, "code", cleanCode);
  } catch (err) {
    console.warn("[couponUsage] countUses:", err?.message);
    return 0;
  }
}

/**
 * Validates a coupon for a booking. Never trusts numbers from the browser:
 * the discount comes from the coupon document only.
 */
export async function validateCouponServer({ code, baseTotalPrice = 0, userId = "" }) {
  if (!code || typeof code !== "string") return invalid("კუპონი არ არის მითითებული");

  const cleanCode = code.trim().toUpperCase();
  const coupon = await getCoupon(cleanCode);
  if (!coupon) return invalid("კუპონი ვერ მოიძებნა ან არასწორია");
  if (!coupon.active) return invalid("მოცემული კუპონი დეაქტივირებულია");

  if (coupon.expiresAt) {
    const expDate = new Date(coupon.expiresAt);
    if (!isNaN(expDate.getTime()) && expDate.getTime() < Date.now()) return invalid("კუპონის მოქმედების ვადა ამოიწურა");
  }

  // Single use = every signed-in user may use it, each of them once. It has
  // no overall limit (older single coupons were saved with maxUses 1).
  if (coupon.usageType === "single") {
    if (!userId) return invalid("კუპონის გამოსაყენებლად შედით ანგარიშში");
    if (await hasUsed(cleanCode, userId)) return invalid("ეს კუპონი უკვე გამოიყენეთ");
  } else if (coupon.usageType !== "unlimited") {
    // Multiple use: a shared limit for everyone together.
    const maxUses = parseInt(coupon.maxUses, 10) || 0;
    if (maxUses > 0) {
      const usedCount = Math.max(parseInt(coupon.usedCount, 10) || 0, await countUses(cleanCode));
      if (usedCount >= maxUses) return invalid("კუპონის გამოყენების ლიმიტი ამოწურულია");
    }
  }

  const discountPercent = Math.min(50, Math.max(1, Number(coupon.discountPercent) || 10));
  let discountAmount = Math.round(baseTotalPrice * (discountPercent / 100));
  if (coupon.maxDiscountGEL && coupon.maxDiscountGEL > 0) {
    discountAmount = Math.min(discountAmount, coupon.maxDiscountGEL);
  }

  return { valid: true, code: cleanCode, coupon, discountPercent, discountAmount, reason: "კუპონი ვალიდურია" };
}

async function recordUse(id, cleanCode, data) {
  if (await readDoc(REDEMPTIONS_COLLECTION, id)) return;
  await writeDoc(REDEMPTIONS_COLLECTION, id, { type: "coupon_use", code: cleanCode, usedAt: SERVER_TIME, ...data });
}

/** Records a coupon use after the booking is saved. */
export async function recordCouponUsage({ code, ip = "", userId = "", bookingId = "" }) {
  if (!code) return;
  const cleanCode = String(code).trim().toUpperCase();

  // Single-use coupons are keyed by the user, so the same person cannot use
  // them twice; the others by booking, so they count towards the shared limit.
  try {
    const coupon = await getCoupon(cleanCode);
    if (coupon?.usageType === "single") {
      if (userId) await recordUse(redemptionId(cleanCode, userId), cleanCode, { userId, bookingId });
    } else if (bookingId) {
      await recordUse(redemptionId(cleanCode, `bk_${bookingId}`), cleanCode, { userId, bookingId });
    }
  } catch (err) {
    console.error("[couponUsage] usage record failed:", err?.message);
  }

  if (ip) {
    try {
      await writeDoc(REDEMPTIONS_COLLECTION, sanitizeIp(ip), { ip, userId, claimedAt: SERVER_TIME });
    } catch (err) {
      console.error("[couponUsage] IP record failed:", err?.message);
    }
  }
}
