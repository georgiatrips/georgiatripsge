"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../lib/AuthContext";
import { useCoupon } from "../lib/CouponContext";
import { getCouponSettings, isIpClaimed, recordClaimedIp } from "../lib/couponSettings";
import CouponTicket from "./CouponTicket";

// Welcome coupon for visitors who are not signed in.
//
// The previous version showed a 30-minute countdown that silently restarted
// whenever it reached zero — a fake deadline. The offer itself is real (10%
// WELCOME10), so it stays, but without invented urgency. It also no longer
// appears on tour pages, where it covered the booking form mid-decision.
export default function WelcomeCouponPopup() {
  const { user } = useAuth() ?? {};
  const { claimWelcomeCoupon } = useCoupon();
  const router = useRouter();
  const pathname = usePathname() || "";

  const [isOpen, setIsOpen] = useState(false);
  const [clientIp, setClientIp] = useState("");

  useEffect(() => {
    const suppressed =
      user ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/booking") ||
      /^\/[a-z]{2}\/tours\/[^/]+/.test(pathname);
    if (suppressed) {
      setIsOpen(false);
      return undefined;
    }

    try {
      if (sessionStorage.getItem("gt_welcome_popup_dismissed") === "true") return undefined;
      localStorage.removeItem("gt_urgency_timer_start");
    } catch (_) {}

    let cancelled = false;
    let timer = 0;

    const show = (delayMs) => {
      timer = window.setTimeout(() => {
        if (!cancelled) setIsOpen(true);
      }, delayMs);
    };

    (async () => {
      try {
        let ip = "";
        try {
          const cached = sessionStorage.getItem("gt_geo_cache");
          if (cached) ip = JSON.parse(cached).ip || "";
          if (!ip) {
            const res = await fetch("/api/analytics/track");
            if (res.ok) {
              const data = await res.json();
              ip = data.ip || "";
              sessionStorage.setItem("gt_geo_cache", JSON.stringify(data));
            }
          }
        } catch (_) {}
        if (cancelled) return;
        if (ip) setClientIp(ip);

        const settings = await getCouponSettings();
        if (settings.limitOnePerIp && ip && (await isIpClaimed(ip))) return;
        if (cancelled) return;

        const isMobile = window.innerWidth <= 768;
        const consentGiven = Boolean(localStorage.getItem("gt_cookie_consent"));
        if (!isMobile) {
          show(20000);
        } else if (consentGiven) {
          show(8000);
        } else {
          const onConsent = () => {
            window.removeEventListener("gt_cookie_dismissed", onConsent);
            show(4000);
          };
          window.addEventListener("gt_cookie_dismissed", onConsent);
        }
      } catch (err) {
        console.warn("Coupon popup error:", err);
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [user, pathname]);

  const handleClose = (event) => {
    event?.stopPropagation?.();
    setIsOpen(false);
    try {
      sessionStorage.setItem("gt_welcome_popup_dismissed", "true");
    } catch (_) {}
  };

  const handleClaim = (event) => {
    event?.stopPropagation?.();
    claimWelcomeCoupon();
    handleClose();
    if (clientIp) recordClaimedIp(clientIp, "");
    router.push("/login?tab=signup");
  };

  if (!isOpen || user) return null;

  return (
    <div className="gt-floating-coupon-widget" aria-live="polite">
      <CouponTicket
        code="WELCOME10"
        discountPercent={10}
        isUsed={false}
        compact
        showCopy
        showUseBtn
        onClose={handleClose}
        onUse={handleClaim}
      />
    </div>
  );
}
