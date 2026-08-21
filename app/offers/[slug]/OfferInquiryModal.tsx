"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, LockKeyhole, X } from "lucide-react";
import { InquiryForm } from "@/components/InquiryForm";
import styles from "./OfferDetailView.module.css";

type OfferInquiryModalProps = {
  title: string;
  offerSlug: string;
  destination: string;
  departure: string;
  duration: string;
  transport: string;
  image?: string;
  dates: Array<{ label: string; startDate?: string }>;
};

export function OfferInquiryModal({
  title,
  offerSlug,
  destination,
  image,
  dates
}: OfferInquiryModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const modal = isOpen ? (
    <div className={styles.inquiryModal} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button className={styles.inquiryModalBackdrop} type="button" onClick={() => setIsOpen(false)} aria-label="Затвори запитването" />
      <div className={styles.inquiryModalPanel}>
        <button className={styles.inquiryModalClose} type="button" onClick={() => setIsOpen(false)} aria-label="Затвори">
          <X size={28} aria-hidden="true" />
        </button>

        <aside className={styles.inquiryModalSummary} aria-label="Информация за офертата">
          <div className={styles.inquiryModalSummaryCopy}>
            <span className={styles.inquiryModalScript}>Запитване</span>
            <span className={styles.inquiryModalOverline}>За оферта</span>
            <h2>{title}</h2>
          </div>
          {image ? <img src={image} alt="" aria-hidden="true" /> : null}
        </aside>

        <section className={styles.inquiryModalForm}>
          <div className={styles.inquiryModalHeading}>
            <h2 id={titleId}>Изпратете ни запитване</h2>
            <p>Попълнете формата и ние ще се свържем с вас възможно най-скоро.</p>
          </div>
          <InquiryForm
            offerTitle={title}
            offerSlug={offerSlug}
            destination={destination}
            dates={dates}
          />
          <p className={styles.inquiryModalPrivacy}>
            <LockKeyhole size={14} aria-hidden="true" />
            Данните ви са защитени и няма да бъдат споделяни с трети лица.
          </p>
        </section>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button className={styles.heroInquiry} type="button" onClick={() => setIsOpen(true)}>
        Изпратете запитване
        <ArrowRight size={18} aria-hidden="true" />
      </button>

      {modal ? createPortal(modal, document.body) : null}
    </>
  );
}
