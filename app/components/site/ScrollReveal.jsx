"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Blocks on pages that were not rebuilt with data-reveal attributes still get
// the same scroll motion. Singles fade and rise; groups stagger their children.
const AUTO_SINGLE = [
  ".section-header",
  ".tdp-card-block",
  ".tdp-promo-contact-card",
  ".landing-section-header",
  ".landing-cta-banner",
  ".place-related-head",
  ".place-detail-body",
  ".hm-inner",
];

const AUTO_GROUP = [
  ".gt-tour-grid",
  ".places-grid",
  ".place-mini-grid",
  ".hotel-list",
  ".tdp-gallery-grid",
  ".tdp-route-list",
  ".landing-features-grid",
  ".landing-tours-grid",
  ".landing-faq-grid",
];

const SELECTOR = "[data-reveal]:not(.is-in), [data-reveal-group]:not(.is-in)";

function tagAutoTargets(root) {
  const insideReveal = (el) => el.parentElement?.closest("[data-reveal], [data-reveal-group]");
  root.querySelectorAll(AUTO_SINGLE.join(",")).forEach((el) => {
    if (!el.hasAttribute("data-reveal") && !insideReveal(el)) el.setAttribute("data-reveal", "");
  });
  root.querySelectorAll(AUTO_GROUP.join(",")).forEach((el) => {
    if (!el.hasAttribute("data-reveal-group") && !insideReveal(el)) el.setAttribute("data-reveal-group", "");
  });
}

// Scroll reveal for elements marked data-reveal / data-reveal-group.
// html.gt-js is added only once an IntersectionObserver exists, so the CSS
// never hides content for crawlers or when JavaScript fails. Reduced-motion
// users still get opacity fades (motion.css removes the movement).
// Mounted once in the root layout; follows client navigations and content
// rendered later (catalog results, tour data) through a MutationObserver.
export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return undefined;
    document.documentElement.classList.add("gt-js");

    const pending = new Set();

    const reveal = (el) => {
      if (el.hasAttribute("data-reveal-group")) {
        [...el.children].forEach((child, index) => child.style.setProperty("--gt-i", String(index)));
      }
      el.classList.add("is-in");
      pending.delete(el);
    };

    // On screen or already scrolled past (anchor jumps, restored scroll
    // position), so scrolling back up never meets an empty block.
    const inView = (el) => el.getBoundingClientRect().top < window.innerHeight * 0.92;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          reveal(entry.target);
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );

    const scan = () => {
      tagAutoTargets(document);
      document.querySelectorAll(SELECTOR).forEach((el) => {
        if (el.dataset.gtObserved) return;
        el.dataset.gtObserved = "1";
        // Already on screen at load: show at once so nothing flickers.
        if (inView(el) && document.readyState !== "loading" && performance.now() < 4000) {
          reveal(el);
        } else {
          pending.add(el);
          io.observe(el);
        }
      });
    };

    scan();

    // Timers instead of requestAnimationFrame: browsers pause frames in
    // background tabs and some embedded views, and a paused frame must not
    // leave new content unobserved.
    let scanTimer = 0;
    const mo = new MutationObserver(() => {
      if (scanTimer) return;
      scanTimer = window.setTimeout(() => {
        scanTimer = 0;
        scan();
      }, 60);
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // Safety net: if the observer misses an element (throttled rendering,
    // anchor jumps, restored scroll position), a cheap rect check on scroll,
    // resize and tab return reveals whatever is on screen.
    let checkTimer = 0;
    const check = () => {
      checkTimer = 0;
      pending.forEach((el) => {
        if (!el.isConnected) {
          pending.delete(el);
        } else if (inView(el)) {
          io.unobserve(el);
          reveal(el);
        }
      });
    };
    const scheduleCheck = () => {
      if (!checkTimer) checkTimer = window.setTimeout(check, 150);
    };
    const onBeforePrint = () => document.querySelectorAll(SELECTOR).forEach(reveal);

    window.addEventListener("scroll", scheduleCheck, { passive: true });
    window.addEventListener("resize", scheduleCheck);
    window.addEventListener("pageshow", scheduleCheck);
    window.addEventListener("focus", scheduleCheck);
    document.addEventListener("visibilitychange", scheduleCheck);
    window.addEventListener("beforeprint", onBeforePrint);
    const settleTimer = window.setTimeout(check, 1200);

    return () => {
      io.disconnect();
      mo.disconnect();
      window.clearTimeout(scanTimer);
      window.clearTimeout(checkTimer);
      window.clearTimeout(settleTimer);
      window.removeEventListener("scroll", scheduleCheck);
      window.removeEventListener("resize", scheduleCheck);
      window.removeEventListener("pageshow", scheduleCheck);
      window.removeEventListener("focus", scheduleCheck);
      document.removeEventListener("visibilitychange", scheduleCheck);
      window.removeEventListener("beforeprint", onBeforePrint);
    };
  }, [pathname]);

  return null;
}
