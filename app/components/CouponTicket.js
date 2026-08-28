"use client";

import { useState } from "react";
import { useLanguage } from "../lib/i18n/LanguageContext";
import "../coupon.css";


/**
 * CouponTicket - Branded ticket voucher component
 * Matches GeorgiaTrips theme (Teal/Blue gradient stub, gold badges, clean white card body, scalloped edges).
 */
export default function CouponTicket({
  code = "WELCOME10",
  discountPercent = 10,
  isUsed = false,
  compact = false,
  showCopy = true,
  showUseBtn = false,
  onUse = null,
}) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <div className={`gt-coupon-ticket ${compact ? "gt-coupon-compact" : ""} ${isUsed ? "is-used" : ""}`}>
      {/* Left Perforated Stub */}
      <div className="gt-coupon-stub">
        <div className="gt-coupon-perforations-top" aria-hidden="true" />
        <div className="gt-coupon-stub-content">
          <span className="gt-coupon-stub-vertical">COUPON</span>
          <span className="gt-coupon-stub-icon">✦</span>
        </div>
        <div className="gt-coupon-perforations-bottom" aria-hidden="true" />
        {/* Notch cutout between stub and body */}
        <div className="gt-coupon-notch top" aria-hidden="true" />
        <div className="gt-coupon-notch bottom" aria-hidden="true" />
      </div>

      {/* Right Ticket Body */}
      <div className="gt-coupon-body">
        <div className="gt-coupon-header-row">
          <span className="gt-coupon-badge">
            {isUsed ? (t("coupon.statusUsed") || "გამოყენებულია") : (t("coupon.statusActive") || "აქტიური • 1 გამოყენება")}
          </span>
          <span className="gt-coupon-verified">✓ {t("coupon.verified") || "ვალიდურია"}</span>
        </div>

        <div className="gt-coupon-discount-row">
          <span className="gt-coupon-discount-label">{t("coupon.discountLabel") || "DISCOUNT"}</span>
          <div className="gt-coupon-amount-wrap">
            <span className="gt-coupon-amount">{discountPercent}%</span>
            <span className="gt-coupon-off">{t("coupon.offLabel") || "OFF"}</span>
          </div>
        </div>

        <p className="gt-coupon-desc">
          {t("coupon.desc") || "10%-იანი ფასდაკლება ნებისმიერ ტურზე GeorgiaTrips-ში"}
        </p>

        {showUseBtn && onUse && (
          <button type="button" className="gt-coupon-use-btn" onClick={onUse}>
            <span>{t("coupon.useInBooking") || "კუპონის გამოყენება"} →</span>
          </button>
        )}
      </div>
    </div>
  );
}
