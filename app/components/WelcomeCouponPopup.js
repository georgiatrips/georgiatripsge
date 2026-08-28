"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../lib/AuthContext";
import { useLanguage } from "../lib/i18n/LanguageContext";
import { getCouponSettings, isIpClaimed, recordClaimedIp } from "../lib/couponSettings";
import CouponTicket from "./CouponTicket";

const COUNTDOWN_DURATION_MS = 30 * 60 * 1000; // 30 minutes in ms

export default function WelcomeCouponPopup() {
  const { user } = useAuth() ?? {};
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(COUNTDOWN_DURATION_MS);
  const [mounted, setMounted] = useState(false);
  const [clientIp, setClientIp] = useState("");

  // Initialize and handle 10-second trigger with IP limit check
  useEffect(() => {
    setMounted(true);

    // If user is already logged in or on login/admin page, do not show
    if (user || pathname?.startsWith("/admin") || pathname?.startsWith("/login")) {
      return;
    }

    // Check if dismissed in this browser session
    try {
      const dismissed = sessionStorage.getItem("gt_welcome_popup_dismissed");
      if (dismissed === "true") return;
    } catch (_) {}

    let isCancelled = false;

    // Check IP eligibility and trigger timer
    async function checkEligibilityAndTrigger() {
      try {
        // 1. Fetch current IP from analytics route
        let ip = "";
        try {
          const res = await fetch("/api/analytics/track");
          if (res.ok) {
            const data = await res.json();
            ip = data.ip || "";
            setClientIp(ip);
          }
        } catch (_) {}

        // 2. Fetch admin coupon settings
        const settings = await getCouponSettings();

        // 3. If 1-IP limit is enabled in admin panel, verify if this IP already claimed
        if (settings.limitOnePerIp && ip) {
          const alreadyClaimed = await isIpClaimed(ip);
          if (alreadyClaimed) {
            console.log("Welcome coupon popup blocked: IP already claimed (Admin 1-IP limit active)");
            return;
          }
        }

        // Initialize 30-min timer start in localStorage
        let startTime = null;
        try {
          const savedStart = localStorage.getItem("gt_urgency_timer_start");
          if (savedStart) {
            startTime = parseInt(savedStart, 10);
          } else {
            startTime = Date.now();
            localStorage.setItem("gt_urgency_timer_start", String(startTime));
          }
        } catch (_) {
          startTime = Date.now();
        }

        // Calculate remaining time
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, COUNTDOWN_DURATION_MS - (elapsed % COUNTDOWN_DURATION_MS));
        if (!isCancelled) setTimeLeft(remaining);

        // Trigger popup strictly after 10 seconds (10,000ms)
        const triggerTimer = setTimeout(() => {
          if (!isCancelled && !user) {
            setIsOpen(true);
          }
        }, 10000);

        return () => clearTimeout(triggerTimer);
      } catch (err) {
        console.warn("Coupon popup eligibility check error:", err);
      }
    }

    checkEligibilityAndTrigger();

    return () => {
      isCancelled = true;
    };
  }, [user, pathname]);

  // Countdown interval while popup is open
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1000) {
          try {
            localStorage.setItem("gt_urgency_timer_start", String(Date.now()));
          } catch (_) {}
          return COUNTDOWN_DURATION_MS;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // ONLY closes when X button is clicked
  const handleClose = (e) => {
    e?.stopPropagation?.();
    setIsOpen(false);
    try {
      sessionStorage.setItem("gt_welcome_popup_dismissed", "true");
    } catch (_) {}
  };

  const handleClaim = (e) => {
    e?.stopPropagation?.();
    handleClose();
    if (clientIp) {
      recordClaimedIp(clientIp, "");
    }
    router.push("/login?tab=signup");
  };

  if (!mounted || !isOpen || user) return null;

  const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
  const seconds = Math.floor((timeLeft / 1000) % 60);
  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(seconds).padStart(2, "0");

  return (
    /* Floating Bottom-Right Widget - Non-blocking, page fully scrollable */
    <div className="gt-floating-coupon-widget" aria-live="polite">

      {/* Dark Urgency Bar with timer + close button */}
      <div className="gt-floating-urgency-bar">
        <div className="gt-floating-timer-badge">
          <span className="gt-floating-fire">🔥</span>
          <span>{t("welcomePopup.timeRemaining") || "დარჩენილია:"}</span>
          <strong className="gt-floating-clock-val">{formattedMinutes}:{formattedSeconds}</strong>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button type="button" className="gt-floating-claim-link" onClick={handleClaim}>
            {t("welcomePopup.registerClaimBtn") || "რეგისტრაცია და აღება"} →
          </button>
          <button
            type="button"
            className="gt-floating-coupon-close"
            onClick={handleClose}
            aria-label="დახურვა"
            title="დახურვა"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Ticket card directly below bar, no extra wrapper */}
      <div className="gt-floating-ticket-wrapper">
        <CouponTicket
          code="WELCOME10"
          discountPercent={10}
          isUsed={false}
          compact={true}
          showCopy={true}
          showUseBtn={true}
          onUse={handleClaim}
        />
      </div>
    </div>
  );
}
