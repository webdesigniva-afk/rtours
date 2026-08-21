"use client";

import { useEffect } from "react";

const revealSelectors = [
  ".travel-finder",
  ".signature-grid",
  ".collection-header",
  ".collection-card",
  ".about-approach-label",
  ".about-approach-step",
  ".about-philosophy",
  ".about-team-intro",
  ".about-team-card",
  ".author-process",
  ".brand-proof-copy",
  ".proof-card",
  ".review-editorial-header",
  ".review-featured",
  ".review-mini",
  ".section-header",
  ".offer-card"
].join(",");

export function ScrollRevealEffects() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const elements = Array.from(document.querySelectorAll<HTMLElement>(revealSelectors));
    const groupedIndex = new Map<Element, number>();

    elements.forEach((element) => {
      const parent = element.parentElement;
      const index = parent ? groupedIndex.get(parent) ?? 0 : 0;

      element.classList.add("scroll-reveal");
      element.style.setProperty("--reveal-delay", `${Math.min(index * 70, 420)}ms`);

      if (parent) groupedIndex.set(parent, index + 1);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.12
      }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return null;
}
