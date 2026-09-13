"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../lib/i18n/LanguageContext";
import CouponTicket from "./CouponTicket";

export default function CouponModal({ isOpen, onClose }) {
  const { t } = useLanguage();
  const router = useRouter();

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="gt-coupon-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="gt-coupon-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          className="gt-coupon-modal-close"
          onClick={onClose}
          aria-label={t("common.close") || "დახურვა"}
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="gt-coupon-modal-header">
          <div className="gt-coupon-modal-icon-badge">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
          </div>
          <h2 className="gt-coupon-modal-title">{t("coupon.myCouponsTitle") || "ჩემი ფასდაკლების კუპონები"}</h2>
          <p className="gt-coupon-modal-sub">
            {t("coupon.myCouponsSub") || "თქვენ გაქვთ 1 ექსკლუზიური ფასდაკლების ბარათი GeorgiaTrips-ისგან"}
          </p>
        </div>

        {/* Ticket Showcase */}
        <div className="gt-coupon-modal-ticket-wrap">
          <CouponTicket
            code="WELCOME10"
            discountPercent={10}
            isUsed={false}
            showCopy={true}
          />
        </div>

        {/* How to use steps */}
        <div className="gt-coupon-steps">
          <h4 className="gt-coupon-steps-title">{t("coupon.howToUseTitle") || "როგორ გამოვიყენოთ კუპონი:"}</h4>
          <div className="gt-coupon-steps-list">
            <div className="gt-coupon-step-item">
              <span className="gt-coupon-step-num">1</span>
              <span>{t("coupon.step1") || "აირჩიეთ სასურველი ტური ჩვენს კატალოგში"}</span>
            </div>
            <div className="gt-coupon-step-item">
              <span className="gt-coupon-step-num">2</span>
              <span>{t("coupon.step2") || "დაჯავშნის ფორმაში შეიყვანეთ კოდი WELCOME10"}</span>
            </div>
            <div className="gt-coupon-step-item">
              <span className="gt-coupon-step-num">3</span>
              <span>{t("coupon.step3") || "ჯამური ფასი ავტომატურად შემცირდება 10%-ით!"}</span>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="gt-coupon-modal-actions">
          <button
            type="button"
            className="gt-coupon-modal-btn-explore"
            onClick={() => {
              onClose();
              router.push("/tours");
            }}
          >
            <span>{t("coupon.exploreToursBtn") || "ტურების დათვალიერება და დაჯავშნა"}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
