import Link from "next/link";
import { CalendarDays, MapPin, Plane } from "lucide-react";
import type { Offer } from "@/lib/types";

const transportLabel = {
  flight: "Самолет",
  bus: "Автобус",
  own_transport: "Собствен транспорт",
  mixed: "Комбинирано"
};

export function OfferCard({ offer }: { offer: Offer }) {
  const priceLabel = offer.priceFrom > 0
    ? `от ${offer.priceFrom.toLocaleString("bg-BG")} ${offer.currency}`
    : "Цена при запитване";
  const visibleBadges = offer.tags.slice(0, 3);

  return (
    <article className="offer-card">
      <Link href={`/offers/${offer.slug}`}>
        <img src={offer.heroImage} alt={offer.title} />
      </Link>
      <div className="card-body">
        {visibleBadges.length ? (
          <div className="offer-card-badges" aria-label="Етикети">
            {visibleBadges.map((badge, index) => (
              <Link className="offer-card-badge" href={`/offers?tag=${encodeURIComponent(offer.badgeSlugs?.[index] || badge)}`} key={badge}>
                {badge}
              </Link>
            ))}
          </div>
        ) : null}
        <div className="card-meta">
          <span className="pill">
            <MapPin size={15} aria-hidden="true" />
            {offer.country}
          </span>
          <span className="pill">
            <CalendarDays size={15} aria-hidden="true" />
            {offer.durationDays} дни
          </span>
        </div>
        <h3>
          <Link href={`/offers/${offer.slug}`}>{offer.title}</Link>
        </h3>
        <p>{offer.summary}</p>
        <div className="offer-actions">
          <span className="offer-price">{priceLabel}</span>
          <span className="pill">
            <Plane size={15} aria-hidden="true" />
            {transportLabel[offer.transport]}
          </span>
        </div>
      </div>
    </article>
  );
}
