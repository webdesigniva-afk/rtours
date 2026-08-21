import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ChevronDown, Heart, SlidersHorizontal } from "lucide-react";
import { PublicBreadcrumbs } from "@/components/PublicBreadcrumbs";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { listPublishedPublicOffers } from "@/lib/offerRepository";
import type { Offer } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Екзотики | Red Tours",
  description: "Екзотични пътувания на Red Tours към далечни посоки, ярки култури и внимателно подбрани преживявания."
};

const exoticTabs = ["Всички", "Азия", "Африка", "Латинска Америка", "Острови"];

function isExoticOffer(offer: Offer) {
  return (offer.collectionSlugs ?? []).some((slug) => slug.toLowerCase() === "red-escape");
}

function priceLabel(offer: Offer) {
  return offer.priceFrom > 0 ? `от ${offer.priceFrom.toLocaleString("bg-BG")} ${offer.currency === "EUR" ? "EUR" : "лв."}` : "Цена при запитване";
}

function durationLabel(offer: Offer) {
  return offer.durationNights ? `${offer.durationDays} дни / ${offer.durationNights} нощувки` : `${offer.durationDays} дни`;
}

function ExoticOfferCard({ offer, featured = false }: { offer: Offer; featured?: boolean }) {
  return (
    <Link className={featured ? "exotic-offer-card is-featured" : "exotic-offer-card"} href={`/offers/${offer.slug}`}>
      <img src={offer.heroImage} alt={offer.title} />
      <span className="exotic-offer-shade" aria-hidden="true" />
      {featured ? <span className="exotic-offer-badge">Препоръчано</span> : null}
      <span className="exotic-offer-heart" aria-hidden="true">
        <Heart size={24} />
      </span>
      <span className="exotic-offer-content">
        <strong>{offer.title}</strong>
        <span className="exotic-offer-bottom">
          <span>
            <CalendarDays size={16} aria-hidden="true" />
            {durationLabel(offer)}
          </span>
          <b>{priceLabel(offer)}</b>
        </span>
      </span>
    </Link>
  );
}

export default async function ExoticsPage() {
  const exoticOffers = (await listPublishedPublicOffers()).filter(isExoticOffer).slice(0, 5);

  return (
    <>
      <SiteHeader />
      <main className="author-page exotic-page">
        <section className="author-hero">
          <div className="author-hero-video" aria-hidden="true">
            <video className="author-hero-video-item is-first" autoPlay muted loop playsInline preload="metadata">
              <source src="/videos/exotics/exotics-hero-01.mp4" type="video/mp4" />
            </video>
            <video className="author-hero-video-item is-second" autoPlay muted loop playsInline preload="metadata">
              <source src="/videos/exotics/exotics-hero-02.mp4" type="video/mp4" />
            </video>
          </div>
          <div className="container author-hero-grid">
            <div className="author-hero-copy">
              <PublicBreadcrumbs items={[{ label: "Пътувания", href: "/offers" }, { label: "Екзотики" }]} />
              <h1>
                По-далеч от
                <span><em>познатото.</em></span>
              </h1>
              <p>
                Екзотичното пътуване започва много преди пристигането.
              </p>
              <p>
                То изисква правилен сезон, внимателно планиран маршрут, познаване на местните особености и партньори, на които може да се разчита.
              </p>
              <p>
                Ние съчетаваме всичко това в пътуване, което ви позволява да откривате с увереност.
              </p>
            </div>

            <div className="author-hero-video-space" aria-hidden="true" />
          </div>
        </section>

        <section className="exotic-intro">
          <div className="container exotic-intro-grid">
            <h2>
              Далечни
              <span>дестинации.</span>
              <em>Близко внимание.</em>
            </h2>
            <div className="exotic-intro-copy">
              <p>
                Независимо дали мечтаете за Азия, Африка, Латинска Америка или остров далеч от обичайните маршрути, ще ви помогнем да изберете подходящото време, начин на пътуване и преживявания.
              </p>
              <p>
                Нашата роля не е просто да направим резервациите. Тя е да видим цялата картина и да се погрижим отделните елементи да работят заедно.
              </p>
            </div>
          </div>
        </section>

        <section className="exotic-offers-section">
          <div className="container">
            <nav className="exotic-offer-tabs" aria-label="Екзотични региони">
              {exoticTabs.map((tab, index) => (
                <button className={index === 0 ? "is-active" : ""} key={tab} type="button">
                  {tab}
                </button>
              ))}
            </nav>

            <header className="exotic-offers-header">
              <h2>Екзотични пътувания</h2>
              <div className="exotic-offer-tools" aria-label="Инструменти за оферти">
                <button type="button">
                  Филтри
                  <SlidersHorizontal size={18} aria-hidden="true" />
                </button>
                <button type="button">
                  Препоръчани
                  <ChevronDown size={18} aria-hidden="true" />
                </button>
              </div>
            </header>

            {exoticOffers.length ? (
              <div className="exotic-offers-grid">
                {exoticOffers.map((offer, index) => (
                  <ExoticOfferCard featured={index === 0} key={offer.slug} offer={offer} />
                ))}
              </div>
            ) : (
              <div className="exotic-offers-empty">
                <strong>Скоро тук ще се появят екзотичните пътувания.</strong>
                <p>Когато оферта бъде отбелязана като „Екзотични пътувания“ в админ панела, тя ще се покаже автоматично в тази секция.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
