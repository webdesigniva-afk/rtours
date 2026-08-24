"use client";

import { useEffect, useState } from "react";

type LazyVideoSource = {
  src: string;
  type: string;
};

type LazyVideoProps = {
  sources: LazyVideoSource[];
  poster: string;
  className?: string;
  loadOnMobile?: boolean;
};

export function LazyVideo({ sources, poster, className, loadOnMobile = false }: LazyVideoProps) {
  const [canLoadVideo, setCanLoadVideo] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobileViewport = window.matchMedia("(max-width: 760px)").matches;
    const navigatorWithConnection = navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    };
    const connection = navigatorWithConnection.connection;
    const isSlowConnection = connection?.effectiveType ? /(^|-)2g$/.test(connection.effectiveType) : false;

    if (prefersReducedMotion || connection?.saveData || isSlowConnection || (!loadOnMobile && isMobileViewport)) {
      return;
    }

    const loadVideo = () => setCanLoadVideo(true);
    const windowWithIdle = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (windowWithIdle.requestIdleCallback) {
      const idleId = windowWithIdle.requestIdleCallback(loadVideo, { timeout: 1800 });
      return () => windowWithIdle.cancelIdleCallback?.(idleId);
    }

    const timer = window.setTimeout(loadVideo, 1200);
    return () => window.clearTimeout(timer);
  }, [loadOnMobile]);

  if (!canLoadVideo) {
    return <img className={className} src={poster} alt="" decoding="async" />;
  }

  return (
    <video className={className} autoPlay muted loop playsInline preload="none" poster={poster} aria-hidden="true">
      {sources.map((source) => (
        <source key={source.src} src={source.src} type={source.type} />
      ))}
    </video>
  );
}
