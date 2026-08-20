import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { PublicBreadcrumbs } from "@/components/PublicBreadcrumbs";
import { destinations } from "@/lib/data";
import { destinationSlug } from "@/lib/destinationSlug";
import { listPublishedPublicOffers } from "@/lib/offerRepository";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Дестинации",
  description: "Открийте пътуванията на Red Tours по държава, регион и стил на преживяване."
};

export default async function DestinationsPage() {
  const offers = await listPublishedPublicOffers();
  const destinationCards = Array.from(
    offers.reduce((map, offer) => {
      const slug = destinationSlug(offer.country);
      const current = map.get(slug);
      const staticDestination = destinations.find((destination) => destination.slug === slug);

      map.set(slug, {
        slug,
        name: offer.country,
        region: offer.region || staticDestination?.region || "",
        summary: staticDestination?.summary || `Разгледайте всички публикувани предложения за ${offer.country}.`,
        image: staticDestination?.image || offer.heroImage,
        offersCount: (current?.offersCount || 0) + 1
      });

      return map;
    }, new Map<string, { slug: string; name: string; region: string; summary: string; image: string; offersCount: number }>())
  ).map(([, destination]) => destination);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="container page-title">
          <PublicBreadcrumbs items={[{ label: "Пътувания", href: "/offers" }, { label: "Дестинации" }]} />
          <span className="eyebrow">Дестинации</span>
          <h1>Дестинации, подбрани с контекст</h1>
          <p>
            Всяка държава трябва да бъде повече от филтър. Тя е вход към конкретна атмосфера,
            сезон, ритъм на пътуване и стил на преживяване.
          </p>
        </section>

        <section className="container section destination-grid">
          {destinationCards.map((destination) => (
            <article className="destination-card" key={destination.slug}>
              <img src={destination.image} alt={destination.name} />
              <div className="destination-content">
                {destination.region ? (
                  <span className="pill">
                    <MapPin size={15} aria-hidden="true" />
                    {destination.region}
                  </span>
                ) : null}
                <h2>{destination.name}</h2>
                <p>{destination.summary}</p>
                <Link className="text-link" href={`/destinations/${destination.slug}`}>
                  {destination.offersCount} програми
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
