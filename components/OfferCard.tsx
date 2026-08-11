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
  return (
    <article className="offer-card">
      <Link href={`/offers/${offer.slug}`}>
        <img src={offer.heroImage} alt={offer.title} />
      </Link>
      <div className="card-body">
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
          <span className="offer-price">
            от {offer.priceFrom.toLocaleString("bg-BG")} {offer.currency}
          </span>
          <span className="pill">
            <Plane size={15} aria-hidden="true" />
            {transportLabel[offer.transport]}
          </span>
        </div>
      </div>
    </article>
  );
}

