import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  Compass,
  Image as ImageIcon,
  MapPin,
  Plane,
  ShieldCheck,
  Sparkles,
  Tag,
  WalletCards,
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
  transport?: string;
  isAuthorProgram?: boolean;
  heroImage: string;
  gallery?: string[];
  dates: Array<{ label: string; startDate: string }>;
  itinerary: Array<{ day: number; title: string; description: string }>;
  included: string[];
  excluded: string[];
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

export function PublicOfferDetail({ offer, showInquiry = true }: { offer: PublicOfferDetailData; showInquiry?: boolean }) {
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
  const nextDate = offer.dates[0]?.label ?? "Дати по заявка";
  const safeDescriptionHtml = sanitizeOfferHtml(offer.description || offer.summary);

  return (
    <main className="offer-detail-page">
      <section className="offer-detail-hero">
        <div className="container offer-detail-hero-inner">
          <div className="offer-detail-copy">
            <span className="eyebrow">{eyebrowLabel}</span>
            <h1>{offer.title}</h1>
            <p>{introText}</p>
            <div className="offer-detail-actions">
              <a className="button" href="#offer-inquiry">
                Запитване
                <ArrowRight size={17} aria-hidden="true" />
              </a>
              <a className="button secondary" href="#offer-program">
                Виж програмата
              </a>
            </div>
            <div className="offer-hero-proof" aria-label="Ключови предимства">
              <span><ShieldCheck size={17} aria-hidden="true" />Проверена програма</span>
              <span><Compass size={17} aria-hidden="true" />Подбран маршрут</span>
              <span><Sparkles size={17} aria-hidden="true" />RedTours селекция</span>
            </div>
          </div>

          <aside className="offer-booking-card" aria-label="Основна информация">
            <span>Започва от</span>
            <strong>{priceLabel}</strong>
            <p>{offer.priceNote || "Персонална оферта според датите и броя пътуващи."}</p>
            <div className="offer-booking-meta">
              <span><CalendarCheck size={16} aria-hidden="true" />{nextDate}</span>
              <span><Clock size={16} aria-hidden="true" />{offer.durationDays} дни{offer.durationNights ? ` / ${offer.durationNights} нощувки` : ""}</span>
              <span><MapPin size={16} aria-hidden="true" />{destinationLabel}</span>
            </div>
            <a href="#offer-inquiry">
              Изпрати запитване
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          </aside>
        </div>
      </section>

      <section className="container offer-visual-stage">
        {safeHeroImage ? <img className="offer-visual-main" src={safeHeroImage} alt={offer.title} /> : <div className="offer-public-image-placeholder">Основната снимка ще се покаже тук</div>}
        <div className="offer-quick-facts">
          {offer.productType ? <span><Tag size={16} aria-hidden="true" />{offer.productTypeLabel ?? productTypeLabels[offer.productType] ?? offer.productType}</span> : null}
          {offer.transport ? <span><Plane size={16} aria-hidden="true" />{transportLabels[offer.transport] ?? offer.transport}</span> : null}
          {offer.isAuthorProgram ? <span><Sparkles size={16} aria-hidden="true" />Авторска програма</span> : null}
          <span><WalletCards size={16} aria-hidden="true" />Запитване преди потвърждение</span>
          {offer.dates.slice(0, 2).map((date) => <span key={date.startDate || date.label}><CalendarDays size={16} aria-hidden="true" />{date.label}</span>)}
        </div>
      </section>

      <section className="container offer-detail-layout">
        <article className="offer-story">
          <section className="offer-content-section" id="offer-description">
            <div className="offer-editorial-intro">
              <span className="eyebrow">Описание</span>
              <h2>Пътуване, подредено с внимание към детайла.</h2>
            </div>
            <div className="offer-rich-content" dangerouslySetInnerHTML={{ __html: safeDescriptionHtml }} />
          </section>

          {offer.gallery && offer.gallery.length > 0 ? (
            <section className="offer-content-section">
              <div className="offer-section-title">
                <span className="eyebrow">Галерия</span>
                <h2>Кадри от маршрута</h2>
              </div>
              <div className="offer-public-gallery">
                {galleryImages.map((image, index) => (
                  <img src={image} alt={`${offer.title} - снимка ${index + 1}`} key={`${image}-${index}`} />
                ))}
              </div>
            </section>
          ) : null}

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
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p>Програмата ще бъде добавена при следващата стъпка.</p>
            )}
          </section>

          <section className="offer-service-boards">
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
        </article>

        {showInquiry ? (
          <aside className="offer-detail-sidebar" id="offer-inquiry">
            <div className="offer-side-card">
              <span className="eyebrow">Запитване</span>
              <h2>Резервирай интерес</h2>
              <p>Изпратете запитване и екипът ще върне потвърждение, свободни места и финални условия.</p>
              <InquiryForm offerTitle={offer.title} />
            </div>
            <div className="offer-trust-card">
              <span><ShieldCheck size={18} aria-hidden="true" />Проверена програма</span>
              <span><Compass size={18} aria-hidden="true" />Подбран маршрут</span>
              <span><ImageIcon size={18} aria-hidden="true" />Визуална оферта</span>
            </div>
          </aside>
        ) : null}
      </section>
    </main>
  );
}
