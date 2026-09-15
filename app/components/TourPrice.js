"use client";

import React from "react";
import { useCoupon } from "../lib/CouponContext";
import { useLanguage } from "../lib/i18n/LanguageContext";

/**
 * Dynamic TourPrice Component
 * - If user has an active coupon:
 *   Crosses out the original price with a bright yellow/gold line,
 *   displays the new discounted price, and shows a badge with -{percent}%.
 * - If no coupon:
 *   Renders the normal formatted price cleanly.
 */
export default function TourPrice({
  price,
  lang: propLang,
  className = "",
  variant = "default",
  showBadge = true,
  showOld = true,
  // Drops a trailing unit such as "/კაცი" for tight spaces where the unit is
  // already shown as a label (the phone booking bar).
  compact = false,
}) {
  const { lang: contextLang } = useLanguage() || { lang: "ka" };
  const lang = propLang || contextLang || "ka";
  const { calculatePrice, hasActiveCoupon } = useCoupon();

  if (price === null || price === undefined || price === "") {
    return null;
  }

  const prices = calculatePrice(price, lang);
  const trim = (value) => (compact ? String(value ?? "").replace(/\s*\/\s*[^/\d\s][^/]*$/, "") : value);
  const originalFormatted = trim(prices.originalFormatted);
  const discountedFormatted = trim(prices.discountedFormatted);
  const { discountPercent, isDiscounted } = prices;

  if (isDiscounted && hasActiveCoupon) {
    return (
      <span className={`gt-price-box variant-${variant} ${className}`}>
        {showOld && (
          <del className="gt-price-old" title={`Original: ${originalFormatted}`}>
            {originalFormatted}
          </del>
        )}
        {showBadge && discountPercent > 0 && (
          <span className="gt-price-badge">
            -{discountPercent}%
          </span>
        )}
        <strong className="gt-price-current">
          {discountedFormatted}
        </strong>
      </span>
    );
  }

  return (
    <span className={`gt-price-box single variant-${variant} ${className}`}>
      <strong className="gt-price-current">
        {originalFormatted}
      </strong>
    </span>
  );
}
