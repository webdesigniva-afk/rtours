import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { destinations, offers } from "@/lib/data";

export const metadata: Metadata = {
  title: "Дестинации",
  description: "Открийте пътуванията на RedTours по държава, регион и стил на преживяване."
};

export default function DestinationsPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="container page-title">
          <span className="eyebrow">Дестинации</span>
          <h1>Дестинации, подбрани с контекст</h1>
          <p>
            Всяка държава трябва да бъде повече от филтър. Тя е вход към конкретна атмосфера,
            сезон, ритъм на пътуване и стил на преживяване.
          </p>
        </section>

        <section className="container section destination-grid">
          {destinations.map((destination) => {
            const destinationOffers = offers.filter((offer) => offer.destinationSlug === destination.slug);

            return (
              <article className="destination-card" key={destination.slug}>
                <img src={destination.image} alt={destination.name} />
                <div className="destination-content">
                  <span className="pill">
                    <MapPin size={15} aria-hidden="true" />
                    {destination.region}
                  </span>
                  <h2>{destination.name}</h2>
                  <p>{destination.summary}</p>
                  <Link className="text-link" href="/offers">
                    {destinationOffers.length} програми
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
