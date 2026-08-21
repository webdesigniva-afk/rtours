import Link from "next/link";
import { BusFront, CalendarDays, Car, MapPin, Plane } from "lucide-react";
import { destinationSlug } from "@/lib/destinationSlug";
import { MAX_OFFER_CARD_BADGES } from "@/lib/offerPresentation";
import type { Offer } from "@/lib/types";

const transportLabel = {
  flight: "Самолет",
  bus: "Автобус",
  own_transport: "Собствен транспорт",
  mixed: "Комбинирано"
};

function TransportIcon({ transport }: { transport: Offer["transport"] }) {
  if (transport === "bus") return <BusFront size={15} aria-hidden="true" />;
  if (transport === "own_transport") return <Car size={15} aria-hidden="true" />;
  if (transport === "mixed") {
    return (
      <span className="transport-icon-pair" aria-hidden="true">
        <Plane size={14} />
        <BusFront size={14} />
      </span>
    );
  }
  return <Plane size={15} aria-hidden="true" />;
}

export function OfferCard({ offer }: { offer: Offer }) {
  const priceLabel = offer.priceFrom > 0
    ? `от ${offer.priceFrom.toLocaleString("bg-BG")} ${offer.currency}`
    : "Цена при запитване";
  const visibleBadges = offer.tags.slice(0, MAX_OFFER_CARD_BADGES);
  const countryHref = `/destinations/${destinationSlug(offer.country)}`;

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
          <Link className="pill" href={countryHref}>
            <MapPin size={15} aria-hidden="true" />
            {offer.country}
          </Link>
          <span className="pill">
            <CalendarDays size={15} aria-hidden="true" />
            {offer.durationDays} дни
          </span>
          <span className="pill">
            <TransportIcon transport={offer.transport} />
            {transportLabel[offer.transport]}
          </span>
        </div>
        <h3>
          <Link href={`/offers/${offer.slug}`}>{offer.title}</Link>
        </h3>
        <p>{offer.summary}</p>
        <div className="offer-actions">
          <span className="offer-price">{priceLabel}</span>
        </div>
      </div>
    </article>
  );
}
