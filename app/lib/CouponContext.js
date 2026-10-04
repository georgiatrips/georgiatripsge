"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { useCurrency } from "./currency/CurrencyContext";

const CouponContext = createContext(null);

const STORAGE_KEY = "gt_user_coupons";
const CLAIMED_KEY = "gt_claimed_welcome_coupon";

/**
 * Extract raw numeric value from any price string (e.g. "₾100/კაცი" -> 100, "$75" -> 75, "50 GEL" -> 50)
 */
export function extractPriceNumber(priceVal) {
  if (priceVal === null || priceVal === undefined || priceVal === "") return null;
  if (typeof priceVal === "number") return priceVal;
  const str = String(priceVal).trim();
  const match = str.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const num = parseFloat(match[0]);
  return isNaN(num) ? null : num;
}

export function CouponProvider({ children }) {
  const { user } = useAuth() ?? {};
  const { format } = useCurrency();
  const [coupons, setCoupons] = useState([]);

  // Initialize and load coupons from localStorage and user profile
  useEffect(() => {
    try {
      // Older versions gave a signed-out visitor 10% off for good once they
      // had clicked the welcome popup; that flag no longer means anything.
      localStorage.removeItem(CLAIMED_KEY);

      const savedCoupons = localStorage.getItem(STORAGE_KEY);
      if (savedCoupons) {
        const parsed = JSON.parse(savedCoupons);
        if (Array.isArray(parsed)) {
          setCoupons(parsed);
        }
      }
    } catch (_) {}
  }, []);

  // Sync user coupons from Firestore when user is logged in, or reset on logout
  useEffect(() => {
    if (!user) {
      // User logged out: clear user-specific coupons so prices revert to original
      setCoupons([]);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (_) {}
      return;
    }

    let isMounted = true;
    async function fetchUserCoupons() {
      const list = [
        // Every registered user receives the 10% Welcome Coupon by default
        {
          code: "WELCOME10",
          discountPercent: 10,
          isUsed: false,
          title: "Welcome Bonus",
        },
      ];

      try {
        if (user.uid) {
          const [{ doc, getDoc }, { db }] = await Promise.all([
            import("firebase/firestore"),
            import("./firebase"),
          ]);
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (Array.isArray(data.coupons)) {
              data.coupons.forEach((c) => {
                if (c && c.code && !list.some((item) => item.code === c.code)) {
                  list.push({
                    code: c.code,
                    discountPercent: Number(c.discountPercent || c.percent || 10),
                    isUsed: !!c.isUsed,
                    title: c.title || c.code,
                  });
                }
              });
            }
          }
        }
      } catch (err) {
        console.warn("Error fetching user coupons from Firestore:", err);
      }

      // Mark coupons this user has already booked with, so a used single-use
      // coupon is no longer applied or offered.
      try {
        const { getCouponByCode, hasUserUsedCoupon } = await import("./coupons");
        await Promise.all(
          list.map(async (c) => {
            if (c.isUsed || !user.uid) return;
            const coupon = await getCouponByCode(c.code);
            if (coupon?.usageType === "single" && (await hasUserUsedCoupon(c.code, user.uid))) c.isUsed = true;
          })
        );
      } catch (_) {}

      if (isMounted) {
        setCoupons(list);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        } catch (_) {}
      }
    }

    fetchUserCoupons();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Coupons are for signed-in users only: a signed-out visitor sees and pays
  // the full price (the welcome popup sends them to sign up for WELCOME10).
  const activeCoupons = useMemo(() => {
    if (!user) return [];
    return coupons.filter((c) => !c.isUsed);
  }, [user, coupons]);

  // Find the MAXIMUM discount percentage among all available coupons
  // e.g., if user has 10% and 12% coupons -> maxDiscountPercent = 12
  const { maxDiscountPercent, bestCoupon } = useMemo(() => {
    if (!activeCoupons || activeCoupons.length === 0) {
      return { maxDiscountPercent: 0, bestCoupon: null };
    }
    let max = 0;
    let best = null;
    for (const c of activeCoupons) {
      const pct = Number(c.discountPercent || c.percent || 0);
      if (pct > max) {
        max = pct;
        best = c;
      }
    }
    return { maxDiscountPercent: max, bestCoupon: best };
  }, [activeCoupons]);

  const hasActiveCoupon = maxDiscountPercent > 0;

  // Add a new coupon code
  const addCoupon = useCallback((newCoupon) => {
    if (!newCoupon || !newCoupon.code) return;
    setCoupons((prev) => {
      const exists = prev.some((c) => c.code.toUpperCase() === newCoupon.code.toUpperCase());
      if (exists) return prev;
      const updated = [
        ...prev,
        {
          code: newCoupon.code.toUpperCase(),
          discountPercent: Number(newCoupon.discountPercent || newCoupon.percent || 10),
          isUsed: false,
          title: newCoupon.title || newCoupon.code,
        },
      ];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  }, []);

  // Kept for the popup and login page, which call it. Every signed-in user
  // already gets WELCOME10 (see above), so there is nothing to store.
  const claimWelcomeCoupon = useCallback(() => {}, []);

  /**
   * Calculate discounted price with currency formatting
   */
  const calculatePrice = useCallback(
    (rawPriceVal, lang = "ka") => {
      const rawNum = extractPriceNumber(rawPriceVal);
      const originalFormatted = format(rawPriceVal, lang);

      if (rawNum === null || !hasActiveCoupon || maxDiscountPercent <= 0) {
        return {
          originalFormatted,
          discountedFormatted: originalFormatted,
          originalNum: rawNum,
          discountedNum: rawNum,
          discountPercent: 0,
          isDiscounted: false,
        };
      }

      const discountedNum = Math.round(rawNum * (1 - maxDiscountPercent / 100));
      const discountedFormatted = format(discountedNum, lang);

      return {
        originalFormatted,
        discountedFormatted,
        originalNum: rawNum,
        discountedNum,
        discountPercent: maxDiscountPercent,
        isDiscounted: true,
      };
    },
    [hasActiveCoupon, maxDiscountPercent, format]
  );

  const value = {
    coupons,
    activeCoupons,
    bestCoupon,
    maxDiscountPercent,
    hasActiveCoupon,
    addCoupon,
    claimWelcomeCoupon,
    calculatePrice,
  };

  return <CouponContext.Provider value={value}>{children}</CouponContext.Provider>;
}

export function useCoupon() {
  const ctx = useContext(CouponContext);
  if (!ctx) {
    return {
      coupons: [],
      activeCoupons: [],
      bestCoupon: null,
      maxDiscountPercent: 0,
      hasActiveCoupon: false,
      addCoupon: () => {},
      claimWelcomeCoupon: () => {},
      calculatePrice: (val) => ({
        originalFormatted: String(val || ""),
        discountedFormatted: String(val || ""),
        originalNum: null,
        discountedNum: null,
        discountPercent: 0,
        isDiscounted: false,
      }),
    };
  }
  return ctx;
}
