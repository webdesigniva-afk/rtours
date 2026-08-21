"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";

export function BackToTopButton() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setIsVisible(window.scrollY > 520);

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });

    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <button
      className={`back-to-top${isVisible ? " is-visible" : ""}`}
      type="button"
      aria-label="Към началото"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <ArrowUp size={20} strokeWidth={2.1} aria-hidden="true" />
    </button>
  );
}
