"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const defaultText = "Така се ражда маршрут, който не просто преминава през дестинацията, а я разказва.";
const defaultRedPhrase = "разказва";

type AuthorTypingCaptionProps = {
  className?: string;
  redPhrase?: string;
  text?: string;
};

export function AuthorTypingCaption({ className = "", redPhrase = defaultRedPhrase, text = defaultText }: AuthorTypingCaptionProps) {
  const rootRef = useRef<HTMLHeadingElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);

  const redRange = useMemo(() => {
    const start = text.indexOf(redPhrase);
    return { start, end: start + redPhrase.length };
  }, [redPhrase, text]);

  useEffect(() => {
    const element = rootRef.current;
    if (!element) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisibleCount(text.length);
      setIsActive(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setIsActive(true);
        observer.disconnect();
      },
      { threshold: 0.45 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isActive || visibleCount >= text.length) return;

    const timer = window.setTimeout(() => {
      setVisibleCount((current) => Math.min(current + 1, text.length));
    }, 34);

    return () => window.clearTimeout(timer);
  }, [isActive, text.length, visibleCount]);

  return (
    <h2 ref={rootRef} className={`${className} ${isActive ? "is-active" : ""}`.trim()}>
      {text.split("").map((char, index) => {
        const isVisible = index < visibleCount;
        const isRed = index >= redRange.start && index < redRange.end;

        return (
          <span className={isRed ? "is-red" : undefined} style={{ visibility: isVisible ? "visible" : "hidden" }} key={`${char}-${index}`}>
            {char}
          </span>
        );
      })}
      <span className={visibleCount < text.length ? "author-typing-caret" : "author-typing-caret is-done"} aria-hidden="true" />
    </h2>
  );
}
