"use client";

import { useEffect, useRef, useState } from "react";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function ScrollPlaneTrail() {
  const bandRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReducedMotion(motionQuery.matches);
    setReducedMotion(motionQuery.matches);

    const update = () => {
      const band = bandRef.current;

      if (!band) {
        return;
      }

      const rect = band.getBoundingClientRect();
      const start = window.innerHeight * 0.86;
      const finish = window.innerHeight * 0.18;
      setProgress(clamp((start - rect.top) / (start - finish), 0, 1));
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    motionQuery.addEventListener("change", updateMotionPreference);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      motionQuery.removeEventListener("change", updateMotionPreference);
    };
  }, []);

  if (reducedMotion) {
    return null;
  }

  const x = progress * 72;
  const y = 0;

  return (
    <div ref={bandRef} className="flight-path-band" aria-hidden="true">
      <div className="flight-path-line">
        <span style={{ transform: `scaleX(${0.1 + progress * 0.9})` }} />
      </div>
      <div
        className="flight-plane"
        style={{
          opacity: 0.18 + progress * 0.82,
          transform: `translate3d(${x}vw, ${y}px, 0)`
        }}
      >
        <svg viewBox="0 0 76 76" role="presentation">
          <path d="M60.1666 38H60.0776C60.0776 38 61.254 39.9002 47.2749 40.6107L43.6589 45.9167H44.2443C45.1187 45.9167 45.8276 46.6256 45.8276 47.5C45.8276 48.3745 45.1187 49.0834 44.2443 49.0834H41.4144L39.673 51.4584H39.8901C40.7645 51.4584 41.4734 52.1672 41.4734 53.0417C41.4734 53.9161 40.7645 54.625 39.8901 54.625H37.2359C35.1849 57.1943 33.2902 59.2888 31.9734 60.1667C31.9734 60.1667 29.2026 60.1667 29.2026 58.5833C29.2026 58.5833 35.6397 46.782 37.9164 40.8418C23.6609 40.9597 23.6609 39.9792 23.6609 39.9792C23.6609 39.9792 20.4943 45.9167 17.3276 45.9167L19.7026 38H19.7917L17.4167 30.0833C20.5833 30.0833 23.75 36.0208 23.75 36.0208C23.75 36.0208 23.75 35.0403 38.0055 35.1582C35.7288 29.218 29.2917 17.4167 29.2917 17.4167C29.2917 15.8333 32.0625 15.8334 32.0625 15.8334C33.3792 16.7112 35.2739 18.8058 37.325 21.375H39.9792C40.8536 21.375 41.5625 22.0839 41.5625 22.9583C41.5625 23.8328 40.8536 24.5417 39.9792 24.5417H39.7621L41.5034 26.9167H44.3333C45.2078 26.9167 45.9167 27.6255 45.9167 28.5C45.9167 29.3744 45.2078 30.0833 44.3333 30.0833H43.7479L47.3639 35.3893C61.343 36.0998 60.1666 38 60.1666 38Z" />
        </svg>
      </div>
    </div>
  );
}
