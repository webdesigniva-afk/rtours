import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, Clock, MapPin, Plane, ShieldCheck, Sparkles } from "lucide-react";
import { InquiryForm } from "@/components/InquiryForm";
import { normalizeDateLabel } from "@/lib/dateFormat";
import type { Offer } from "@/lib/types";
import styles from "./OfferDetailView.module.css";

const transportLabels: Record<string, string> = {
  flight: "Самолет",
  bus: "Автобус",
  own_transport: "Собствен транспорт",
  mixed: "Комбинирано"
};

function repairText(value: string | undefined | null, fallback = "") {
  const text = value || fallback;
  if (!/[ÐÑÃÂâ]/.test(text)) return text;

  let current = text;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const bytes = Uint8Array.from(current, (character) => character.charCodeAt(0));
      const next = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      if (next === current) break;
      current = next;
    } catch {
      break;
    }
  }

  return current;
}

function stripHtml(value: string) {
  return repairText(value)
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/\s*(p|div|li|h[1-6])\s*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function destinationLabel(offer: Offer) {
  const points = offer.destinations?.length
    ? offer.destinations.map((destination) => [destination.city, destination.region, destination.country].filter(Boolean).join(", "))
    : [[offer.city, offer.region, offer.country].filter(Boolean).join(", ")];

  return points.filter(Boolean).map((point) => repairText(point)).join(" -> ") || repairText(offer.country, "Дестинация");
}

function priceLabel(offer: Offer) {
  return offer.priceFrom > 0
    ? `от ${offer.priceFrom.toLocaleString("bg-BG")} ${offer.currency}`
    : "Цена при запитване";
}

function mainDateLabel(offer: Offer) {
  const date = offer.dates[0];
  if (!date) return "Дати по запитване";
  return repairText(normalizeDateLabel(date.label, date.startDate, date.endDate, "Дати по запитване"));
}

function imageList(offer: Offer) {
  return Array.from(new Set([offer.heroImage, ...(offer.gallery ?? [])].filter(Boolean))).slice(0, 3);
}

function splitParagraphs(value: string) {
  return stripHtml(value).split(/\n+/).map((paragraph) => paragraph.trim()).filter(Boolean).slice(0, 5);
}

export function OfferDetailView({ offer }: { offer: Offer }) {
  const title = repairText(offer.title, "Пътуване с RedTours");
  const summary = repairText(offer.summary || stripHtml(offer.description), "Подробностите за тази оферта се подготвят.");
  const descriptionParagraphs = splitParagraphs(offer.description || offer.summary);
  const images = imageList(offer);
  const primaryImage = images[0];
  const sideImages = images.slice(1, 3);
  const route = destinationLabel(offer);
  const transport = offer.transport ? transportLabels[offer.transport] ?? repairText(offer.transport) : "Транспорт по програма";
  const included = offer.included.map((item) => repairText(item)).filter(Boolean).slice(0, 10);
  const highlights = (offer.highlights ?? []).map((item) => repairText(item)).filter(Boolean).slice(0, 6);
  const itinerary = offer.itinerary
    .filter((day) => day.title || day.description)
    .slice(0, 8);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <nav className={styles.breadcrumb} aria-label="Път до офертата">
            <Link href="/">Начало</Link>
            <span>/</span>
            <Link href="/offers">Пътувания</Link>
            <span>/</span>
            <span>{repairText(offer.country)}</span>
          </nav>

          <span className={styles.kicker}>{repairText(offer.country)}</span>
          <h1>{title}</h1>
          <p>{summary}</p>

          <div className={styles.heroActions}>
            <a href="#program">Виж програмата</a>
            <a href="#inquiry">Изпрати запитване</a>
          </div>

          <div className={styles.proofGrid} aria-label="Основни предимства">
            <span><ShieldCheck size={18} aria-hidden="true" />Проверена програма</span>
            <span><MapPin size={18} aria-hidden="true" />{route}</span>
            <span><Sparkles size={18} aria-hidden="true" />RedTours селекция</span>
          </div>
        </div>

        <div className={styles.heroGallery}>
          {primaryImage ? <img className={styles.primaryImage} src={primaryImage} alt={title} /> : <div className={styles.imagePlaceholder}>Снимката се подготвя</div>}
          {sideImages.length ? (
            <div className={styles.sideImages}>
              {sideImages.map((image, index) => (
                <img src={image} alt={`${title} - кадър ${index + 2}`} key={image} />
              ))}
            </div>
          ) : null}
          <aside className={styles.bookingCard} aria-label="Основна информация">
            <span>Започва от</span>
            <strong>{priceLabel(offer)}</strong>
            <div>
              <small><CalendarDays size={17} aria-hidden="true" />{mainDateLabel(offer)}</small>
              <small><Clock size={17} aria-hidden="true" />{offer.durationDays} дни{offer.durationNights ? ` / ${offer.durationNights} нощувки` : ""}</small>
            </div>
            <a href="#inquiry">
              Изпрати запитване
              <ArrowRight size={18} aria-hidden="true" />
            </a>
          </aside>
        </div>
      </section>

      <section className={styles.quickFacts} aria-label="Бърза информация">
        <span><MapPin size={18} aria-hidden="true" />{route}</span>
        <span><Plane size={18} aria-hidden="true" />{transport}</span>
        <span><CalendarDays size={18} aria-hidden="true" />{mainDateLabel(offer)}</span>
      </section>

      <section className={styles.contentGrid}>
        <article className={styles.mainContent}>
          <section className={styles.section}>
            <span className={styles.kicker}>Описание</span>
            <h2>Какво да очаквате</h2>
            {descriptionParagraphs.length ? descriptionParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>) : <p>{summary}</p>}
          </section>

          {highlights.length ? (
            <section className={styles.section}>
              <span className={styles.kicker}>Акценти</span>
              <h2>Най-важното в програмата</h2>
              <div className={styles.highlightGrid}>
                {highlights.map((highlight, index) => (
                  <div key={highlight}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{highlight}</strong>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className={styles.section} id="program">
            <span className={styles.kicker}>Програма</span>
            <h2>Ден по ден</h2>
            {itinerary.length ? (
              <div className={styles.timeline}>
                {itinerary.map((day) => (
                  <article key={`${offer.slug}-${day.day}`}>
                    <span>Ден {day.day}</span>
                    <div>
                      <h3>{repairText(day.title || `Ден ${day.day}`)}</h3>
                      {day.description ? <p>{repairText(day.description)}</p> : null}
                    </div>
                  </article>
                ))}
              </div>
            ) : <p>Програмата ще бъде потвърдена при запитване.</p>}
          </section>

          <section className={styles.section}>
            <span className={styles.kicker}>В цената</span>
            <h2>Включено</h2>
            {included.length ? (
              <ul className={styles.includedList}>
                {included.map((item) => (
                  <li key={item}><CheckCircle2 size={18} aria-hidden="true" />{item}</li>
                ))}
              </ul>
            ) : <p>Включените услуги ще бъдат уточнени при запитване.</p>}
          </section>
        </article>

        <aside className={styles.sidebar} id="inquiry">
          <div className={styles.inquiryCard}>
            <span className={styles.kicker}>Запитване</span>
            <h2>Изпратете запитване</h2>
            <p>Ще върнем потвърждение за места, цена и условия.</p>
            <InquiryForm offerTitle={title} offerSlug={offer.slug} destination={route} dates={offer.dates.map((date) => ({ label: repairText(normalizeDateLabel(date.label, date.startDate, date.endDate, "Дати по запитване")), startDate: date.startDate }))} />
          </div>
        </aside>
      </section>
    </main>
  );
}
