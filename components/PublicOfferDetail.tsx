import { CalendarDays, Clock, MapPin, Plane, Sparkles, Tag, WalletCards } from "lucide-react";
import { InquiryForm } from "@/components/InquiryForm";

export type PublicOfferDetailData = {
  slug: string;
  title: string;
  productType?: string;
  summary: string;
  description: string;
  country: string;
  region: string;
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

export function PublicOfferDetail({ offer, showInquiry = true }: { offer: PublicOfferDetailData; showInquiry?: boolean }) {
  return (
    <main>
      <section className="container page-title">
        <span className="eyebrow">{offer.country}</span>
        <h1>{offer.title}</h1>
        <p>{offer.summary || offer.description}</p>
      </section>

      <section className="container offer-hero">
        {offer.heroImage ? <img src={offer.heroImage} alt={offer.title} /> : <div className="offer-public-image-placeholder">Основната снимка ще се покаже тук</div>}
        <aside className="info-panel">
          <div className="card-body">
            <span className="offer-price">
              от {offer.priceFrom.toLocaleString("bg-BG")} {offer.currency}
            </span>
            <p>{offer.priceNote}</p>
            <div className="card-meta">
              {offer.productType ? (
                <span className="pill">
                  <Tag size={15} aria-hidden="true" />
                  {productTypeLabels[offer.productType] ?? offer.productType}
                </span>
              ) : null}
              <span className="pill">
                <Clock size={15} aria-hidden="true" />
                {offer.durationDays} дни{offer.durationNights ? ` / ${offer.durationNights} нощувки` : ""}
              </span>
              <span className="pill">
                <MapPin size={15} aria-hidden="true" />
                {offer.region}
              </span>
            </div>
            <div className="card-meta">
              {offer.transport ? (
                <span className="pill">
                  <Plane size={15} aria-hidden="true" />
                  {transportLabels[offer.transport] ?? offer.transport}
                </span>
              ) : null}
              {offer.isAuthorProgram ? (
                <span className="pill">
                  <Sparkles size={15} aria-hidden="true" />
                  Авторска програма
                </span>
              ) : null}
            </div>
            <div className="card-meta">
              {offer.dates.map((date) => (
                <span className="pill" key={date.startDate || date.label}>
                  <CalendarDays size={15} aria-hidden="true" />
                  {date.label}
                </span>
              ))}
            </div>
            <span className="pill">
              <WalletCards size={15} aria-hidden="true" />
              Запитване преди потвърждение
            </span>
          </div>
        </aside>
      </section>

      <section className="container section detail-grid">
        <div className="content-block">
          <h2>Описание</h2>
          <p>{offer.description || offer.summary}</p>

          {offer.gallery && offer.gallery.length > 0 ? (
            <>
              <h2>Галерия</h2>
              <div className="offer-public-gallery">
                {offer.gallery.map((image) => (
                  <img src={image} alt={offer.title} key={image} />
                ))}
              </div>
            </>
          ) : null}

          <h2>Програма</h2>
          {offer.itinerary.length > 0 ? (
            offer.itinerary.map((day) => (
              <article className="day" key={`${offer.slug}-${day.day}`}>
                <h3>
                  Ден {day.day}: {day.title}
                </h3>
                <p>{day.description}</p>
              </article>
            ))
          ) : (
            <p>Програмата ще бъде добавена при следващата стъпка.</p>
          )}

          <h2>Включено</h2>
          {offer.included.length > 0 ? (
            <ul>
              {offer.included.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>Включените услуги ще бъдат добавени при следващата стъпка.</p>
          )}

          <h2>Не е включено</h2>
          {offer.excluded.length > 0 ? (
            <ul>
              {offer.excluded.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>Невключените услуги ще бъдат добавени при следващата стъпка.</p>
          )}
        </div>

        {showInquiry ? (
          <aside className="info-panel">
            <h2>Запитване</h2>
            <p>
              Формата е подготвена за бъдещо подаване към CRM/ERP. В първия етап може да се
              обработва от екипа по текущия процес.
            </p>
            <InquiryForm offerTitle={offer.title} />
          </aside>
        ) : null}
      </section>
    </main>
  );
}
