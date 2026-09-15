"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Progressive reveal for elements marked data-reveal / data-reveal-group.
// Adds html.gt-js only once an IntersectionObserver exists, so the CSS never
// hides content for crawlers, reduced-motion users or when JS fails. Mounted
// once in the root layout; re-scans after every client navigation.
export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return undefined;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = document.documentElement;
    if (reduce) {
      root.classList.remove("gt-js");
      return undefined;
    }
    root.classList.add("gt-js");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    const targets = document.querySelectorAll("[data-reveal]:not(.is-in), [data-reveal-group]:not(.is-in)");
    targets.forEach((el) => {
      const rect = el.getBoundingClientRect();
      // Anything already on screen at load shows immediately — no fade on
      // the first viewport, so the hero never flickers.
      if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
        el.classList.add("is-in");
      } else {
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
