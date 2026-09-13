"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../lib/AuthContext";
import { useLanguage } from "../lib/i18n/LanguageContext";
import { useCoupon } from "../lib/CouponContext";
import { getCouponSettings, isIpClaimed, recordClaimedIp } from "../lib/couponSettings";
import CouponTicket from "./CouponTicket";

const COUNTDOWN_DURATION_MS = 30 * 60 * 1000; // 30 minutes in ms

export default function WelcomeCouponPopup() {
  const { user } = useAuth() ?? {};
  const { t } = useLanguage();
  const { claimWelcomeCoupon } = useCoupon();
  const router = useRouter();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(COUNTDOWN_DURATION_MS);
  const [mounted, setMounted] = useState(false);
  const [clientIp, setClientIp] = useState("");

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

    async function setupWelcomePopup() {
      try {
        // 1. Fetch current IP (check session cache first to avoid extra network requests)
        let ip = "";
        try {
          const cachedGeo = sessionStorage.getItem("gt_geo_cache");
          if (cachedGeo) {
            const parsed = JSON.parse(cachedGeo);
            ip = parsed.ip || "";
          }
          if (!ip) {
            const res = await fetch("/api/analytics/track");
            if (res.ok) {
              const data = await res.json();
              ip = data.ip || "";
              try {
                sessionStorage.setItem("gt_geo_cache", JSON.stringify(data));
              } catch (_) {}
            }
          }
          if (ip && !isCancelled) {
            setClientIp(ip);
          }
        } catch (_) {}

        if (isCancelled) return;

        // 2. Fetch admin coupon settings
        const settings = await getCouponSettings();

        // 3. If 1-IP limit is enabled in admin panel, verify if this IP already claimed
        if (settings.limitOnePerIp && ip) {
          const alreadyClaimed = await isIpClaimed(ip);
          if (alreadyClaimed) {
            return;
          }
        }

        // 4. Initialize 30-min timer
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

        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, COUNTDOWN_DURATION_MS - (elapsed % COUNTDOWN_DURATION_MS));
        if (!isCancelled) setTimeLeft(remaining);

        // 5. Trigger logic based on Cookie Consent
        const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
        const hasCookieConsent = typeof localStorage !== "undefined" && localStorage.getItem("gt_cookie_consent");

        const triggerCoupon = (delayMs = 1200) => {
          setTimeout(() => {
            if (!isCancelled && !user) {
              setIsOpen(true);
            }
          }, delayMs);
        };

        if (isMobile) {
          if (hasCookieConsent) {
            // Cookie already dismissed previously -> Show coupon after 2s
            triggerCoupon(2000);
          } else {
            // Listen for cookie banner dismissal event (either user clicked or 10s auto-dismiss occurred)
            const handleCookieDismissed = () => {
              triggerCoupon(1200);
              window.removeEventListener("gt_cookie_dismissed", handleCookieDismissed);
            };
            window.addEventListener("gt_cookie_dismissed", handleCookieDismissed);
          }
        } else {
          // Desktop: standard 10s trigger
          triggerCoupon(10000);
        }
      } catch (err) {
        console.warn("Coupon popup error:", err);
      }
    }

    setupWelcomePopup();

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

  const handleClose = (e) => {
    e?.stopPropagation?.();
    setIsOpen(false);
    try {
      sessionStorage.setItem("gt_welcome_popup_dismissed", "true");
    } catch (_) {}
  };

  const handleClaim = (e) => {
    e?.stopPropagation?.();
    claimWelcomeCoupon();
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
    <div className="gt-floating-coupon-widget" aria-live="polite">
      <CouponTicket
        code="WELCOME10"
        discountPercent={10}
        isUsed={false}
        compact={true}
        showCopy={true}
        showUseBtn={true}
        timeLeftText={`${formattedMinutes}:${formattedSeconds}`}
        onClose={handleClose}
        onUse={handleClaim}
      />
    </div>
  );
}
