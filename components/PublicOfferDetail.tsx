"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  Compass,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  MapPin,
  Plane,
  ShieldCheck,
  Sparkles,
  Tag,
  X,
  XCircle
} from "lucide-react";
import { InquiryForm } from "@/components/InquiryForm";

export type PublicOfferDetailData = {
  slug: string;
  title: string;
  productType?: string;
  productTypeLabel?: string;
  summary: string;
  description: string;
  country: string;
  region: string;
  destinations?: Array<{
    country: string;
    region?: string | null;
    city?: string | null;
    isPrimary?: boolean;
  }>;
  durationDays: number;
  durationNights?: number;
  priceFrom: number;
  currency: "EUR" | "BGN";
  priceNote: string;
  source?: string;
  transport?: string;
  isAuthorProgram?: boolean;
  heroImage: string;
  gallery?: string[];
  dates: Array<{
    label: string;
    startDate: string;
    endDate?: string;
    departurePoints?: string;
    availability?: "available" | "limited" | "on_request" | "sold_out";
    seatsTotal?: number;
    seatsConfirmed?: number;
    seatsOption?: number;
    seatsAvailable?: number;
    priceFrom?: number;
    currency?: "EUR" | "BGN";
    priceStatus?: "fixed" | "option_until" | "dynamic" | "budgetary";
    optionUntil?: string;
    depositAmount?: number;
    paymentDueDays?: number;
    notes?: string;
  }>;
  itinerary: Array<{ day: number; title: string; description: string; accommodation?: string; meals?: string; transport?: string }>;
  highlights?: string[];
  included: string[];
  excluded: string[];
  supplierSections?: Array<{
    type: "hotel" | "additional_service" | "useful_info" | "payment_policy" | "cancel_policy" | "insurance";
    title: string;
    body?: string;
    meta?: string;
  }>;
};

const productTypeLabels: Record<string, string> = {
  excursion: "Екскурзия",
  holiday: "Почивка",
  package: "Пакет",
  hotel: "Хотел",
  flight: "Самолетен билет",
  service: "Услуга"
};

const transportLabels: Record<string, string> = {
  flight: "Самолет",
  bus: "Автобус",
  own_transport: "Собствен транспорт",
  mixed: "Комбинирано"
};

const availabilityLabels: Record<string, string> = {
  available: "Свободни места",
  limited: "Последни места",
  on_request: "По запитване",
  sold_out: "Спряно"
};

const priceStatusLabels: Record<string, string> = {
  fixed: "Фиксирана",
  option_until: "Опция до",
  dynamic: "За препотвърждение",
  budgetary: "Ориентировъчна"
};

const allowedRichTags = new Set(["a", "b", "blockquote", "br", "div", "em", "figcaption", "figure", "h2", "h3", "h4", "hr", "i", "img", "li", "ol", "p", "span", "strong", "u", "ul"]);

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function normalizePublicUrl(value: string) {
  const trimmed = value.trim();
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(trimmed)) return trimmed.replace(/"/g, "&quot;");
  return "";
}

function sanitizeOfferHtml(value: string) {
  if (!value.trim()) return "";
  if (!/<[a-z][\s\S]*>/i.test(value)) return `<p>${escapeHtml(value)}</p>`;

  return value
    .replace(/<\s*(script|style|iframe|object|embed|svg|math)[\s\S]*?>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\/?([a-z0-9-]+)([^>]*)>/gi, (match, tagName: string, rawAttributes: string) => {
      const tag = tagName.toLowerCase();
      const isClosing = /^<\s*\//.test(match);
      const isSelfClosing = /\/\s*>$/.test(match) || tag === "br" || tag === "hr" || tag === "img";

      if (!allowedRichTags.has(tag)) return "";
      if (isClosing) return `</${tag}>`;

      if (tag === "a") {
        const href = rawAttributes.match(/\shref\s*=\s*["']([^"']+)["']/i)?.[1] ?? "";
        const safeHref = normalizePublicUrl(href);
        return safeHref ? `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">` : "<a>";
      }

      if (tag === "img") {
        const src = rawAttributes.match(/\ssrc\s*=\s*["']([^"']+)["']/i)?.[1] ?? "";
        const alt = rawAttributes.match(/\salt\s*=\s*["']([^"']*)["']/i)?.[1] ?? "";
        const safeSrc = normalizePublicUrl(src);
        return safeSrc ? `<img src="${safeSrc}" alt="${escapeHtml(alt).replace(/"/g, "&quot;")}" />` : "";
      }

      return isSelfClosing ? `<${tag} />` : `<${tag}>`;
    });
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function formatDateRange(date: PublicOfferDetailData["dates"][number]) {
  if (date.label && date.label !== date.startDate) return date.label;
  if (date.startDate && date.endDate) return `${date.startDate} - ${date.endDate}`;
  if (date.startDate) return date.startDate;
  if (date.endDate) return `до ${date.endDate}`;
  return "Дати по заявка";
}

function formatDatePrice(date: PublicOfferDetailData["dates"][number], fallbackCurrency: "EUR" | "BGN") {
  if (date.priceFrom && date.priceFrom > 0) {
    return `от ${date.priceFrom.toLocaleString("bg-BG")} ${date.currency || fallbackCurrency}`;
  }

  return "Цена при запитване";
}

type PublicSupplierSection = NonNullable<PublicOfferDetailData["supplierSections"]>[number];

function supplierSectionLabel(type: PublicSupplierSection["type"]) {
  if (type === "hotel") return "Хотели";
  if (type === "additional_service") return "Допълнителни услуги";
  if (type === "useful_info") return "Полезна информация";
  if (type === "payment_policy") return "Плащане";
  if (type === "cancel_policy") return "Анулации";
  return "Застраховки";
}

function splitPriceLabel(value: string) {
  const match = value.match(/\s[-–—]\s*((?:от\s*)?\d+(?:[.,]\d+)?\s*(?:EUR|€|лв\.?|BGN).*)$/i);
  if (!match?.index) return { label: value, price: "" };

  return {
    label: value.slice(0, match.index).trim(),
    price: match[1].trim()
  };
}

export function PublicOfferDetail({ offer, showInquiry = true }: { offer: PublicOfferDetailData; showInquiry?: boolean }) {
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const destinationLabel = offer.destinations?.length
    ? offer.destinations
        .map((destination) => [destination.city, destination.region, destination.country].filter(Boolean).join(", "))
        .filter(Boolean)
        .join(" → ")
    : offer.region;
  const eyebrowLabel = offer.destinations && offer.destinations.length > 1 ? "Маршрут" : offer.country;
  const introText = offer.summary || stripHtml(offer.description);
  const priceLabel = offer.priceFrom > 0 ? `от ${offer.priceFrom.toLocaleString("bg-BG")} ${offer.currency}` : "Цена при запитване";
  const safeHeroImage = normalizePublicUrl(offer.heroImage);
  const galleryImages = [safeHeroImage, ...(offer.gallery ?? []).map(normalizePublicUrl)].filter(Boolean).slice(0, 5);
  const lightboxImages = useMemo(() => Array.from(new Set(galleryImages)), [galleryImages]);
  const activeImage = activeImageIndex === null ? null : lightboxImages[activeImageIndex];
  const nextDate = offer.dates[0]?.label ?? "Дати по заявка";
  const safeDescriptionHtml = sanitizeOfferHtml(offer.description || offer.summary);
  const pathSectionLabel = offer.isAuthorProgram ? "Авторски програми" : offer.productTypeLabel || (offer.productType ? productTypeLabels[offer.productType] : "Пътувания");
  const routeCities = offer.destinations?.length
    ? offer.destinations.map((destination) => destination.city).filter(Boolean).slice(0, 5).join(" → ")
    : offer.region;

  const normalizedRouteCities = routeCities || offer.region || offer.country;
  const isImportedOffer = offer.source && offer.source !== "manual";
  const proofLabel = isImportedOffer ? "Препотвърждение от екипа" : offer.isAuthorProgram ? "Авторска селекция" : "Подбрана програма";
  const supplierSectionGroups = useMemo(() => {
    const groups = new Map<PublicSupplierSection["type"], PublicSupplierSection[]>();
    for (const section of offer.supplierSections ?? []) {
      groups.set(section.type, [...(groups.get(section.type) ?? []), section]);
    }
    return groups;
  }, [offer.supplierSections]);

  function openImage(image: string) {
    const index = lightboxImages.indexOf(image);
    setActiveImageIndex(index >= 0 ? index : 0);
  }

  function showPreviousImage() {
    setActiveImageIndex((current) => {
      if (current === null) return current;
      return current === 0 ? lightboxImages.length - 1 : current - 1;
    });
  }

  function showNextImage() {
    setActiveImageIndex((current) => {
      if (current === null) return current;
      return current === lightboxImages.length - 1 ? 0 : current + 1;
    });
  }

  useEffect(() => {
    if (activeImageIndex === null) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActiveImageIndex(null);
      if (event.key === "ArrowLeft") showPreviousImage();
      if (event.key === "ArrowRight") showNextImage();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeImageIndex, lightboxImages.length]);

  return (
    <main className={`offer-detail-page ${isImportedOffer ? "is-imported-offer" : ""}`}>
      <section className="offer-detail-hero">
        <div className="container offer-detail-hero-inner">
          <div className="offer-detail-copy">
            <nav className="offer-breadcrumb" aria-label="Път до офертата">
              <a href="/">Начало</a>
              <span aria-hidden="true">/</span>
              <a href="/offers">{pathSectionLabel}</a>
              <span aria-hidden="true">/</span>
              <span>{offer.country}</span>
            </nav>
            <span className="eyebrow">{eyebrowLabel}</span>
            <h1>{offer.title}</h1>
            <p>{introText}</p>
            <div className="offer-detail-actions">
              <a className="button secondary" href="#offer-program">
                Виж програмата
              </a>
            </div>
            {!isImportedOffer ? (
              <div className="offer-hero-proof" aria-label="Ключови предимства">
                <span><ShieldCheck size={17} aria-hidden="true" />{proofLabel}</span>
                <span><Compass size={17} aria-hidden="true" />Подбран маршрут</span>
                <span><Sparkles size={17} aria-hidden="true" />RedTours селекция</span>
              </div>
            ) : null}
          </div>

          <div className="offer-hero-visual">
            {safeHeroImage ? (
              <button className="offer-image-open offer-hero-image-button" type="button" onClick={() => openImage(safeHeroImage)} aria-label="Отвори основната снимка">
                <img className="offer-hero-image" src={safeHeroImage} alt={offer.title} />
              </button>
            ) : <div className="offer-public-image-placeholder">Основната снимка ще се покаже тук</div>}
            {galleryImages.length > 1 ? (
              <div className="offer-hero-thumbs" aria-label="Кадри от пътуването">
                {galleryImages.slice(1, 3).map((image, index) => (
                  <button className="offer-image-open" type="button" onClick={() => openImage(image)} aria-label={`Отвори визуален акцент ${index + 1}`} key={`${image}-hero-${index}`}>
                    <img src={image} alt={`${offer.title} - визуален акцент ${index + 1}`} />
                  </button>
                ))}
              </div>
            ) : null}
            <aside className="offer-booking-card" aria-label="Основна информация">
              <div>
                <span>Започва от</span>
                <strong>{priceLabel}</strong>
              </div>
              <div className="offer-booking-meta">
                <span><CalendarCheck size={16} aria-hidden="true" />{nextDate}</span>
                <span><Clock size={16} aria-hidden="true" />{offer.durationDays} дни{offer.durationNights ? ` / ${offer.durationNights} нощувки` : ""}</span>
              </div>
              <a href="#offer-inquiry">
                Изпрати запитване
                <ArrowRight size={16} aria-hidden="true" />
              </a>
            </aside>
          </div>
        </div>
      </section>

      <section className="container offer-visual-stage">
        <div className="offer-quick-facts">
          <span><MapPin size={15} aria-hidden="true" />{normalizedRouteCities}</span>
          {offer.isAuthorProgram ? <span><Sparkles size={15} aria-hidden="true" />Авторска програма</span> : null}
          {offer.transport ? <span><Plane size={15} aria-hidden="true" />{transportLabels[offer.transport] ?? offer.transport}</span> : null}
          {offer.dates[0] ? <span><CalendarDays size={15} aria-hidden="true" />{offer.dates[0].label}</span> : null}
        </div>
      </section>

      <nav className="container offer-section-nav" aria-label="Секции в офертата">
        <a href="#offer-description">Описание</a>
        <a href="#offer-dates">Дати и цени</a>
        <a href="#offer-program">Програма</a>
        <a href="#offer-services">Включено</a>
        {offer.supplierSections?.length ? <a href="#offer-supplier-info">Детайли</a> : null}
        <a href="#offer-inquiry">Запитване</a>
      </nav>

      {!isImportedOffer && galleryImages.length > 1 ? (
        <section className="container offer-gallery-strip" aria-label="Галерия">
          {galleryImages.slice(1, 5).map((image, index) => (
            <button className="offer-image-open" type="button" onClick={() => openImage(image)} aria-label={`Отвори кадър ${index + 1}`} key={`${image}-strip-${index}`}>
              <img src={image} alt={`${offer.title} - кадър ${index + 1}`} />
            </button>
          ))}
        </section>
      ) : null}

      <section className="container offer-detail-layout">
        <article className="offer-story">
          <section className="offer-content-section" id="offer-description">
            <div className="offer-editorial-intro">
              <span className="eyebrow">Описание</span>
              <h2>Пътуване, подредено с внимание към детайла.</h2>
            </div>
            <div className="offer-rich-content" dangerouslySetInnerHTML={{ __html: safeDescriptionHtml }} />
          </section>

          {galleryImages.length > 4 ? (
            <section className="offer-content-section">
              <div className="offer-section-title">
                <span className="eyebrow">Галерия</span>
                <h2>Кадри от маршрута</h2>
              </div>
              <div className="offer-public-gallery">
                {(isImportedOffer ? galleryImages.slice(1, 7) : galleryImages.slice(4)).map((image, index) => (
                  <button className="offer-image-open" type="button" onClick={() => openImage(image)} aria-label={`Отвори снимка ${index + 1}`} key={`${image}-${index}`}>
                    <img src={image} alt={`${offer.title} - снимка ${index + 1}`} />
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {!isImportedOffer && offer.highlights?.length ? (
            <section className="offer-content-section offer-public-highlights">
              <div className="offer-section-title">
                <span className="eyebrow">Акценти</span>
                <h2>Защо ще харесате това пътуване</h2>
              </div>
              <ul>
                {offer.highlights.map((highlight, index) => (
                  <li key={highlight}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{highlight}</strong>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="offer-content-section offer-public-departures" id="offer-dates">
            <div className="offer-section-title">
              <span className="eyebrow">Дати и цени</span>
              <h2>Отпътувания</h2>
            </div>
            <div className="offer-public-departure-list">
              {offer.dates.length > 0 ? offer.dates.map((date) => (
                <article className="offer-public-departure" key={`${formatDateRange(date)}-${date.departurePoints || "departure"}`}>
                  <div className="offer-public-departure-main">
                    <span>{availabilityLabels[date.availability || "on_request"] || "По запитване"}</span>
                    <h3>{formatDateRange(date)}</h3>
                    {date.departurePoints ? <p><MapPin size={16} aria-hidden="true" />Отпътуване от {date.departurePoints}</p> : null}
                  </div>
                  <dl className="offer-public-departure-facts">
                    <div className="is-primary">
                      <dt>Цена</dt>
                      <dd>{formatDatePrice(date, offer.currency)}</dd>
                    </div>
                    {date.seatsAvailable !== undefined || date.seatsTotal !== undefined ? (
                      <div>
                        <dt>Места</dt>
                        <dd>{date.seatsAvailable !== undefined ? date.seatsAvailable : "по запитване"}{date.seatsTotal !== undefined ? ` / ${date.seatsTotal}` : ""}</dd>
                      </div>
                    ) : null}
                    {date.priceStatus ? (
                      <div>
                        <dt>Статус</dt>
                        <dd>{priceStatusLabels[date.priceStatus]}{date.optionUntil ? ` ${new Date(date.optionUntil).toLocaleDateString("bg-BG")}` : ""}</dd>
                      </div>
                    ) : null}
                    {date.depositAmount ? (
                      <div>
                        <dt>Депозит</dt>
                        <dd>{date.depositAmount.toLocaleString("bg-BG")} {date.currency || offer.currency}</dd>
                      </div>
                    ) : null}
                    {date.paymentDueDays !== undefined ? (
                      <div>
                        <dt>Доплащане</dt>
                        <dd>{date.paymentDueDays} дни преди отпътуване</dd>
                      </div>
                    ) : null}
                  </dl>
                  {date.notes ? <p className="offer-public-departure-note">{date.notes}</p> : null}
                </article>
              )) : (
                <p>Датите и цените се потвърждават при запитване.</p>
              )}
            </div>
          </section>

          <section className="offer-content-section" id="offer-program">
            <div className="offer-section-title">
              <span className="eyebrow">Програма</span>
              <h2>Ден по ден</h2>
            </div>
            {offer.itinerary.length > 0 ? (
              <div className="offer-public-itinerary">
                {offer.itinerary.map((day) => (
                  <article className="day" key={`${offer.slug}-${day.day}`}>
                    <span>Ден {day.day}</span>
                    <div>
                      <h3>{day.title}</h3>
                      <p>{day.description}</p>
                      {day.accommodation || day.meals || day.transport ? (
                        <dl className="offer-public-itinerary-meta">
                          {day.accommodation ? (
                            <>
                              <dt>Настаняване</dt>
                              <dd>{day.accommodation}</dd>
                            </>
                          ) : null}
                          {day.meals ? (
                            <>
                              <dt>Хранене</dt>
                              <dd>{day.meals}</dd>
                            </>
                          ) : null}
                          {day.transport ? (
                            <>
                              <dt>Транспорт</dt>
                              <dd>{day.transport}</dd>
                            </>
                          ) : null}
                        </dl>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p>Програмата ще бъде добавена при следващата стъпка.</p>
            )}
          </section>

          <section className="offer-service-boards" id="offer-services">
            <div className="offer-service-board is-included">
              <div className="offer-section-title">
                <span className="eyebrow">В цената</span>
                <h2>Включено</h2>
              </div>
              {offer.included.length > 0 ? (
                <ul>
                  {offer.included.map((item) => (
                    <li key={item}><CheckCircle2 size={18} aria-hidden="true" />{item}</li>
                  ))}
                </ul>
              ) : (
                <p>Включените услуги ще бъдат добавени при следващата стъпка.</p>
              )}
            </div>

            <div className="offer-service-board is-excluded">
              <div className="offer-section-title">
                <span className="eyebrow">Допълнително</span>
                <h2>Не е включено</h2>
              </div>
              {offer.excluded.length > 0 ? (
                <ul>
                  {offer.excluded.map((item) => (
                    <li key={item}><XCircle size={18} aria-hidden="true" />{item}</li>
                  ))}
                </ul>
              ) : (
                <p>Невключените услуги ще бъдат добавени при следващата стъпка.</p>
              )}
            </div>
          </section>

          {offer.supplierSections?.length ? (
            <section className="offer-content-section offer-supplier-sections" id="offer-supplier-info">
              <div className="offer-section-title">
                <span className="eyebrow">Детайли</span>
                <h2>Практична информация</h2>
              </div>
              {(["hotel", "additional_service", "useful_info", "payment_policy", "cancel_policy", "insurance"] as const).map((type) => {
                const sections = supplierSectionGroups.get(type);
                if (!sections?.length) return null;

                return (
                  <details className={`offer-supplier-group is-${type}`} open={type === "additional_service"} key={type}>
                    <summary>
                      <span>{supplierSectionLabel(type)}</span>
                      <em>{sections.length}</em>
                    </summary>
                    <div className="offer-supplier-list">
                      {sections.map((section, index) => (
                        <article className={`offer-supplier-item ${type === "additional_service" ? "is-priced" : ""}`} key={`${type}-${section.title}-${index}`}>
                          {section.meta ? <span>{section.meta}</span> : null}
                          {type === "additional_service" ? (
                            <strong>
                              <span>{splitPriceLabel(section.title).label}</span>
                              {splitPriceLabel(section.title).price ? <em>{splitPriceLabel(section.title).price}</em> : null}
                            </strong>
                          ) : (
                            <strong>{section.title}</strong>
                          )}
                          {section.body && section.body !== section.title ? <p>{section.body}</p> : null}
                        </article>
                      ))}
                    </div>
                  </details>
                );
              })}
            </section>
          ) : null}
        </article>

        {showInquiry ? (
          <aside className="offer-detail-sidebar" id="offer-inquiry">
            <div className="offer-side-card">
              <span className="eyebrow">Запитване</span>
              <h2>Изпратете запитване</h2>
              <p>Ще върнем потвърждение за места, цена и условия.</p>
              <InquiryForm offerTitle={offer.title} offerSlug={offer.slug} destination={destinationLabel} dates={offer.dates.map((date) => ({ label: date.label, startDate: date.startDate }))} />
            </div>
            <div className="offer-trust-card">
              <span><ShieldCheck size={18} aria-hidden="true" />Проверена програма</span>
              <span><Compass size={18} aria-hidden="true" />Подбран маршрут</span>
              <span><ImageIcon size={18} aria-hidden="true" />Визуална оферта</span>
            </div>
          </aside>
        ) : null}
      </section>
      {activeImage ? (
        <div className="offer-lightbox" role="dialog" aria-modal="true" aria-label="Галерия">
          <button className="offer-lightbox-backdrop" type="button" onClick={() => setActiveImageIndex(null)} aria-label="Затвори галерията" />
          <div className="offer-lightbox-panel">
            <button className="offer-lightbox-close" type="button" onClick={() => setActiveImageIndex(null)} aria-label="Затвори">
              <X size={18} aria-hidden="true" />
            </button>
            {lightboxImages.length > 1 ? (
              <button className="offer-lightbox-nav is-prev" type="button" onClick={showPreviousImage} aria-label="Предишна снимка">
                <ChevronLeft size={24} aria-hidden="true" />
              </button>
            ) : null}
            <img src={activeImage} alt={`${offer.title} - голям преглед`} />
            {lightboxImages.length > 1 ? (
              <button className="offer-lightbox-nav is-next" type="button" onClick={showNextImage} aria-label="Следваща снимка">
                <ChevronRight size={24} aria-hidden="true" />
              </button>
            ) : null}
            <span className="offer-lightbox-count">{(activeImageIndex ?? 0) + 1} / {lightboxImages.length}</span>
          </div>
        </div>
      ) : null}
    </main>
  );
}
