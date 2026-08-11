import type { Metadata } from "next";
import { OfferCard } from "@/components/OfferCard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { collections, destinations, offers } from "@/lib/data";

export const metadata: Metadata = {
  title: "Пътувания",
  description: "Открийте пътувания по дестинация, тема, настроение и стил."
};

export default function OffersPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="container page-title">
          <span className="eyebrow">Пътувания</span>
          <h1>Откриване по дестинация, тема и настроение</h1>
          <p>
            Първа версия на структурата за търсене и филтриране. В следващ етап тези контроли ще
            се свържат с база данни, админ статуси и персонализирани препоръки.
          </p>
        </section>

        <section className="container" id="inquiry">
          <div className="filters" aria-label="Филтри">
            <div className="filter-row">
              <input placeholder="Търсене по ключова дума" />
              <select defaultValue="">
                <option value="" disabled>
                  Дестинация
                </option>
                {destinations.map((destination) => (
                  <option key={destination.slug}>{destination.name}</option>
                ))}
              </select>
              <select defaultValue="">
                <option value="" disabled>
                  Колекция
                </option>
                {collections.map((collection) => (
                  <option key={collection.slug}>{collection.name}</option>
                ))}
              </select>
              <select defaultValue="">
                <option value="" disabled>
                  Транспорт
                </option>
                <option>Самолет</option>
                <option>Автобус</option>
                <option>Комбинирано</option>
              </select>
            </div>
          </div>
          <div className="offers-grid">
            {offers.map((offer) => (
              <OfferCard key={offer.slug} offer={offer} />
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
