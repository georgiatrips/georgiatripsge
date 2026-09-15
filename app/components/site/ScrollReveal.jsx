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

    const reveal = (el) => {
      if (el.hasAttribute("data-reveal-group")) {
        [...el.children].forEach((child, index) => child.style.setProperty("--gt-i", String(index)));
      }
      el.classList.add("is-in");
    };

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
        const rect = el.getBoundingClientRect();
        // Already on screen at load: show at once so nothing flickers.
        if (rect.top < window.innerHeight * 0.9 && rect.bottom > 0 && document.readyState !== "loading" && performance.now() < 4000) {
          reveal(el);
        } else {
          io.observe(el);
        }
      });
    };

    scan();

    let frame = 0;
    const mo = new MutationObserver(() => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        scan();
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // Safety net: never leave content hidden if an element is never intersected
    // (for example when printing or on very tall screens).
    const onBeforePrint = () => document.querySelectorAll(SELECTOR).forEach(reveal);
    window.addEventListener("beforeprint", onBeforePrint);

    return () => {
      io.disconnect();
      mo.disconnect();
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("beforeprint", onBeforePrint);
    };
  }, [pathname]);

  return null;
}
