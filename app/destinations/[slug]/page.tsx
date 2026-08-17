import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { DestinationGlobe } from "@/components/DestinationGlobe";
import { OfferCard } from "@/components/OfferCard";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { destinations } from "@/lib/data";
import { destinationSlug } from "@/lib/destinationSlug";
import { listPublishedPublicOffers } from "@/lib/offerRepository";

type DestinationPageProps = {
  params: Promise<{ slug: string }>;
};

type GlobeDestination = {
  country: string;
  offerCount: number;
  slug: string;
};

function buildGlobeDestinations(offers: Awaited<ReturnType<typeof listPublishedPublicOffers>>): GlobeDestination[] {
  return Array.from(
    offers.reduce((items, offer) => {
      const offerSlug = offer.destinationSlug || destinationSlug(offer.country);
      const current = items.get(offerSlug);
      items.set(offerSlug, {
        country: current?.country || offer.country,
        offerCount: (current?.offerCount || 0) + 1,
        slug: offerSlug
      });

      return items;
    }, new Map<string, GlobeDestination>())
  ).map(([, item]) => item);
}

function offerCountLabel(count: number) {
  return count === 1 ? "1 оферта" : `${count} оферти`;
}

export async function generateMetadata({ params }: DestinationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const offers = await listPublishedPublicOffers();
  const destinationOffers = offers.filter((offer) => destinationSlug(offer.country) === slug || offer.destinationSlug === slug);
  const title = destinationOffers[0]?.country || destinations.find((destination) => destination.slug === slug)?.name || "Дестинация";

  return {
    title: `${title} - пътувания`,
    description: `Разгледайте всички актуални оферти на Red Tours за ${title}.`
  };
}

export default async function DestinationDetailPage({ params }: DestinationPageProps) {
  const { slug } = await params;
  const offers = await listPublishedPublicOffers();
  const destinationMeta = destinations.find((destination) => destination.slug === slug);
  const destinationOffers = offers.filter((offer) => destinationSlug(offer.country) === slug || offer.destinationSlug === slug);
  const country = destinationOffers[0]?.country || destinationMeta?.name || "Дестинация";
  const globeDestinations = buildGlobeDestinations(offers);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="destination-landing">
          <div className="destination-map-stage">
            <DestinationGlobe country={country} destinations={globeDestinations} />
          </div>
          <div className="container destination-landing-content">
            <Link className="destination-back-link" href="/destinations">
              <ArrowLeft size={17} aria-hidden="true" />
              Всички дестинации
            </Link>
            <span className="eyebrow">Дестинация</span>
            <h1>{country}</h1>
            <p>
              {destinationMeta?.summary ||
                `Всички публикувани предложения на Red Tours за ${country}, събрани на едно място за по-лесен избор и сравнение.`}
            </p>
            <div className="destination-landing-stats">
              <span>{offerCountLabel(destinationOffers.length)}</span>
            </div>
          </div>
        </section>

        <section className="container section">
          <div className="section-header">
            <span className="eyebrow">Оферти за {country}</span>
            <h2>Всички актуални предложения</h2>
            <p>Публикуваните оферти за тази държава се събират автоматично тук, независимо дали са въведени ръчно или са дошли от доставчик.</p>
          </div>
          {destinationOffers.length ? (
            <div className="offers-grid">
              {destinationOffers.map((offer) => (
                <OfferCard key={offer.slug} offer={offer} />
              ))}
            </div>
          ) : (
            <div className="offers-empty-state">
              <strong>Няма публикувани оферти за тази дестинация.</strong>
              <Link href="/offers">Виж всички оферти</Link>
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
