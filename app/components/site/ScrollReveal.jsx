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

function tagAutoTargets(root) {
  const insideReveal = (el) => el.parentElement?.closest("[data-reveal], [data-reveal-group]");
  root.querySelectorAll(AUTO_SINGLE.join(",")).forEach((el) => {
    if (!el.hasAttribute("data-reveal") && !insideReveal(el)) el.setAttribute("data-reveal", "");
  });
  root.querySelectorAll(AUTO_GROUP.join(",")).forEach((el) => {
    if (!el.hasAttribute("data-reveal-group") && !insideReveal(el)) el.setAttribute("data-reveal-group", "");
  });
}

const byDocumentOrder = (a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);

// Scroll reveal for [data-reveal] blocks and for every child of a
// [data-reveal-group]. Each target is observed on its own and appears as soon
// as its top edge enters the screen, so a tall stack of cards on a phone comes
// in card by card and no blank band trails the content while scrolling.
// Targets entering together get a short stagger (--gt-i).
//
// html.gt-js is added only when IntersectionObserver exists, so the CSS never
// hides content for crawlers or when JavaScript fails. Bookkeeping lives in
// this effect run only (no markers left on the DOM), so React StrictMode's
// double effect run in development cannot leave blocks unobserved and hidden.
// Mounted once in the root layout; follows client navigations and content
// rendered later (catalog results, tour data) through a MutationObserver.
export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return undefined;
    document.documentElement.classList.add("gt-js");

    const seen = new WeakSet();
    const pending = new Set();
    let io = null;

    const revealBatch = (elements, instant = false) => {
      const list = elements.filter((el) => pending.has(el)).sort(byDocumentOrder);
      list.forEach((el, index) => {
        pending.delete(el);
        io?.unobserve(el);
        if (instant) el.classList.add("gt-instant");
        else el.style.setProperty("--gt-i", String(Math.min(index, 6)));
        el.classList.add("is-in");
      });
    };

    // On screen, or already scrolled past (anchor jump, restored position).
    const inView = (el) => el.getBoundingClientRect().top < window.innerHeight * 0.94;

    io = new IntersectionObserver(
      (entries) => revealBatch(entries.filter((entry) => entry.isIntersecting).map((entry) => entry.target)),
      // Starts a little before the block reaches the screen, so the entrance is
      // already under way when it scrolls in and no empty band shows.
      { rootMargin: "0px 0px 15% 0px", threshold: 0 }
    );

    let firstScan = true;
    const scan = () => {
      tagAutoTargets(document);
      const fresh = [];
      document.querySelectorAll("[data-reveal], [data-reveal-group]").forEach((container) => {
        const targets = container.hasAttribute("data-reveal-group") ? [...container.children] : [container];
        for (const el of targets) {
          if (seen.has(el) || el.classList.contains("is-in")) continue;
          seen.add(el);
          pending.add(el);
          io.observe(el);
          fresh.push(el);
        }
      });
      // Content already on screen when the page loads is shown as it is, with
      // no entrance, so nothing flickers after hydration. Content that arrives
      // later on screen (new catalog results) gets the entrance.
      if (fresh.length) revealBatch(fresh.filter(inView), firstScan);
      firstScan = false;
    };

    scan();

    // Timers instead of requestAnimationFrame: browsers pause frames in
    // background tabs and some embedded views.
    let scanTimer = 0;
    const mo = new MutationObserver(() => {
      if (scanTimer) return;
      scanTimer = window.setTimeout(() => {
        scanTimer = 0;
        scan();
      }, 60);
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // Safety net for missed observer callbacks (throttled rendering, hidden
    // tabs): a cheap position check on scroll, resize and tab return.
    let checkTimer = 0;
    const check = () => {
      checkTimer = 0;
      pending.forEach((el) => {
        if (el.isConnected) return;
        pending.delete(el);
        io.unobserve(el);
      });
      revealBatch([...pending].filter(inView));
    };
    const scheduleCheck = () => {
      if (!checkTimer) checkTimer = window.setTimeout(check, 120);
    };
    const onBeforePrint = () => revealBatch([...pending], true);

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
