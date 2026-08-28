"use client";

import { useState } from "react";
import { useLanguage } from "../lib/i18n/LanguageContext";
import "../coupon.css";

/**
 * CouponTicket - Iconic Voucher Ticket
 * Matches user's exact design:
 * - Red left stub with serrated edge and vertical "COUPON"
 * - Pure white ticket body with bold "DISCOUNT 10% OFF"
 * - Direct countdown timer on card
 * - Direct close button
 */
export default function CouponTicket({
  code = "WELCOME10",
  discountPercent = 10,
  isUsed = false,
  compact = false,
  showCopy = true,
  showUseBtn = false,
  timeLeftText = null,
  onClose = null,
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
    <div className={`gt-real-ticket ${compact ? "is-compact" : ""} ${isUsed ? "is-used" : ""}`}>
      {/* Floating Close Button directly on ticket corner */}
      {onClose && (
        <button
          type="button"
          className="gt-ticket-close-btn"
          onClick={onClose}
          aria-label="დახურვა"
          title="დახურვა"
        >
          ✕
        </button>
      )}

      {/* ── Left Red Serrated Stub ── */}
      <div className="gt-ticket-stub">
        <span className="gt-ticket-stub-text">COUPON</span>
        <div className="gt-ticket-notch notch-top" aria-hidden="true" />
        <div className="gt-ticket-notch notch-bottom" aria-hidden="true" />
      </div>

      {/* ── Right Ticket Body ── */}
      <div className="gt-ticket-body">
        {/* On-card Countdown Timer */}
        {timeLeftText && (
          <div className="gt-ticket-timer-bar">
            <span className="gt-ticket-fire">🔥</span>
            <span className="gt-ticket-timer-lbl">{t("welcomePopup.timeRemaining") || "დარჩენილია:"}</span>
            <strong className="gt-ticket-timer-val">{timeLeftText}</strong>
          </div>
        )}

        <div className="gt-ticket-discount-lbl">DISCOUNT</div>

        <div className="gt-ticket-amount-row">
          <span className="gt-ticket-percent">{discountPercent}%</span>
          <span className="gt-ticket-off">OFF</span>
        </div>

        {/* Code & copy pill */}
        {code && (
          <div className="gt-ticket-meta-row">
            <span className="gt-ticket-code-pill">{code}</span>
            {showCopy && (
              <button
                type="button"
                className={`gt-ticket-copy-btn ${copied ? "copied" : ""}`}
                onClick={handleCopy}
                title="Copy coupon code"
              >
                {copied ? "✓ კოპირებულია" : "Copy"}
              </button>
            )}
          </div>
        )}

        {/* Action Button if enabled */}
        {showUseBtn && onUse && (
          <button type="button" className="gt-ticket-claim-btn" onClick={onUse}>
            <span>{t("welcomePopup.registerClaimBtn") || "რეგისტრაცია და აღება"} →</span>
          </button>
        )}
      </div>
    </div>
  );
}
