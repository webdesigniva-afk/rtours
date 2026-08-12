"use client";

import { useEffect, useState } from "react";

export function HeroVideo() {
  const [canLoadVideo, setCanLoadVideo] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const navigatorWithConnection = navigator as Navigator & {
      connection?: { saveData?: boolean };
    };
    const connection = navigatorWithConnection.connection;

    if (prefersReducedMotion || connection?.saveData) {
      return;
    }

    const loadVideo = () => setCanLoadVideo(true);
    const windowWithIdle = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (windowWithIdle.requestIdleCallback) {
      const idleId = windowWithIdle.requestIdleCallback(loadVideo, { timeout: 1200 });
      return () => windowWithIdle.cancelIdleCallback?.(idleId);
    }

    const timer = window.setTimeout(loadVideo, 800);
    return () => window.clearTimeout(timer);
  }, []);

  if (!canLoadVideo) {
    return null;
  }

  return (
    <video autoPlay muted loop playsInline preload="none">
      <source src="/hero-redtours.mp4" type="video/mp4" />
    </video>
  );
}
