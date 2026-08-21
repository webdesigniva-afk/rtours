"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import styles from "./OfferDetailView.module.css";

type OfferGalleryLightboxProps = {
  images: string[];
  title: string;
};

export function OfferGalleryLightbox({ images, title }: OfferGalleryLightboxProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const previewImages = images.slice(1, 5);
  const extraCount = Math.max(images.slice(1).length - previewImages.length, 0);
  const hasLightbox = images.length > 0;

  useEffect(() => {
    if (activeIndex === null) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveIndex(null);
      if (event.key === "ArrowLeft") setActiveIndex((current) => previousIndex(current, images.length));
      if (event.key === "ArrowRight") setActiveIndex((current) => nextIndex(current, images.length));
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, images.length]);

  if (!previewImages.length) return null;

  const activeImage = activeIndex === null ? null : images[activeIndex];

  return (
    <>
      <div className={styles.heroGallery} aria-label="Галерия">
        {previewImages.map((image, index) => {
          const imageIndex = index + 1;

          return (
            <button type="button" key={image} onClick={() => setActiveIndex(imageIndex)} aria-label={`Отвори снимка ${imageIndex + 1}`}>
              <img src={image} alt={`${title} - снимка ${imageIndex + 1}`} />
            </button>
          );
        })}
        {extraCount > 0 ? (
          <button type="button" className={styles.heroGalleryMore} onClick={() => setActiveIndex(0)} aria-label="Виж всички снимки">
            <strong>+{extraCount}</strong>
            <small>Виж всички</small>
          </button>
        ) : null}
      </div>

      {hasLightbox && activeImage ? (
        <div className={styles.lightbox} role="dialog" aria-modal="true" aria-label="Галерия" onClick={() => setActiveIndex(null)}>
          <button type="button" className={styles.lightboxClose} onClick={() => setActiveIndex(null)} aria-label="Затвори галерията">
            <X size={24} aria-hidden="true" />
          </button>
          {images.length > 1 ? (
            <button
              type="button"
              className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
              onClick={(event) => {
                event.stopPropagation();
                setActiveIndex((current) => previousIndex(current, images.length));
              }}
              aria-label="Предишна снимка"
            >
              <ChevronLeft size={28} aria-hidden="true" />
            </button>
          ) : null}
          <figure className={styles.lightboxFigure} onClick={(event) => event.stopPropagation()}>
            <img src={activeImage} alt={`${title} - снимка ${(activeIndex ?? 0) + 1}`} />
            <figcaption>
              <span>{title}</span>
              <strong>{(activeIndex ?? 0) + 1} / {images.length}</strong>
            </figcaption>
          </figure>
          {images.length > 1 ? (
            <button
              type="button"
              className={`${styles.lightboxNav} ${styles.lightboxNext}`}
              onClick={(event) => {
                event.stopPropagation();
                setActiveIndex((current) => nextIndex(current, images.length));
              }}
              aria-label="Следваща снимка"
            >
              <ChevronRight size={28} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function previousIndex(current: number | null, total: number) {
  if (!total) return null;
  if (current === null) return total - 1;
  return (current - 1 + total) % total;
}

function nextIndex(current: number | null, total: number) {
  if (!total) return null;
  if (current === null) return 0;
  return (current + 1) % total;
}
