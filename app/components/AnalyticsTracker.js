"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { registerPageVisit, sendHeartbeat, trackEvent } from "../lib/analytics";
import { captureMarketingParams } from "../lib/utmTracker";

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sessionStartTime = useRef(Date.now());
  const pageStartTime = useRef(Date.now());

  const isFirstMount = useRef(true);

  // ── Track Page Changes & Session Heartbeat ───────────────
  useEffect(() => {
    // Capture any incoming marketing parameters (UTM & fbclid)
    captureMarketingParams();

    // Don't track admin panel visits to avoid polluting visitor analytics
    if (pathname && pathname.startsWith("/admin")) {
      return;
    }

    const fullPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    pageStartTime.current = Date.now();

    // Initial page visit register
    registerPageVisit({
      path: fullPath,
      title: document.title || fullPath,
    });

    // Meta Pixel: Dispatch PageView on subsequent SPA route navigations
    if (isFirstMount.current) {
      isFirstMount.current = false;
    } else {
      if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", "PageView");
      }
    }

    // Send heartbeat every 45 seconds to keep Live Status fresh without overloading Firestore
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        const totalSeconds = (Date.now() - sessionStartTime.current) / 1000;
        sendHeartbeat(fullPath, document.title, totalSeconds);
      }
    }, 45000);

    const handleVisibilityOrUnload = () => {
      const totalSeconds = (Date.now() - sessionStartTime.current) / 1000;
      sendHeartbeat(fullPath, document.title, totalSeconds);
    };

    window.addEventListener("beforeunload", handleVisibilityOrUnload);
    document.addEventListener("visibilitychange", handleVisibilityOrUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleVisibilityOrUnload);
      document.removeEventListener("visibilitychange", handleVisibilityOrUnload);
    };
  }, [pathname, searchParams]);

  // ── Global Smart Click Interceptor ─────────────────────────
  // Automatically captures WhatsApp, Call, Tour clicks without manual wiring
  useEffect(() => {
    const handleGlobalClick = (e) => {
      try {
        const target = e.target.closest("a, button, [data-track-action]");
        if (!target) return;

        const href = target.getAttribute("href") || "";
        const trackAction = target.getAttribute("data-track-action");
        const trackLabel = target.getAttribute("data-track-label") || target.innerText?.trim() || "";

        // 1. Explicit data-track-action
        if (trackAction) {
          trackEvent(trackAction, { label: trackLabel, href });
          return;
        }

        // 2. WhatsApp click
        if (
          href.includes("wa.me") ||
          href.includes("whatsapp.com") ||
          href.includes("api.whatsapp.com") ||
          target.classList.contains("whatsapp-btn")
        ) {
          trackEvent("click_whatsapp", {
            label: trackLabel || "WhatsApp Chat",
            href,
            page: window.location.pathname,
          });
          return;
        }

        // 3. Phone Call click
        if (href.startsWith("tel:")) {
          trackEvent("click_call", {
            phone: href.replace("tel:", ""),
            label: trackLabel || "Phone Call",
            page: window.location.pathname,
          });
          return;
        }

        // 4. Tour card / detail click
        if (href.startsWith("/tours/") && href !== "/tours") {
          trackEvent("view_tour_click", {
            targetTour: href.replace("/tours/", ""),
            label: trackLabel,
          });
          return;
        }

        // 5. Booking button click
        if (
          target.classList.contains("book-btn") ||
          trackLabel.toLowerCase().includes("book") ||
          trackLabel.toLowerCase().includes("დაჯავშნ") ||
          trackLabel.toLowerCase().includes("забронировать")
        ) {
          trackEvent("click_book_button", {
            label: trackLabel,
            page: window.location.pathname,
          });
          return;
        }
      } catch (err) {
        // Silently pass
      }
    };

    document.addEventListener("click", handleGlobalClick, { passive: true });
    return () => {
      document.removeEventListener("click", handleGlobalClick);
    };
  }, []);

  return null;
}
