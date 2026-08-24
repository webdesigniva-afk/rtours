import type { Metadata } from "next";
import { ExoticOffersBrowser } from "./ExoticOffersBrowser";
import { LazyVideo } from "@/components/LazyVideo";
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

function isExoticOffer(offer: Offer) {
  return (offer.visibilityPlacements ?? []).includes("exotics");
}

export default async function ExoticsPage() {
  const exoticOffers = (await listPublishedPublicOffers()).filter(isExoticOffer);

  return (
    <>
      <SiteHeader />
      <main className="author-page exotic-page">
        <section className="author-hero">
          <div className="author-hero-video" aria-hidden="true">
            <LazyVideo
              className="author-hero-video-item is-first"
              sources={[{ src: "/videos/exotics/exotics-hero-01.mp4", type: "video/mp4" }]}
            />
            <LazyVideo
              className="author-hero-video-item is-second"
              sources={[{ src: "/videos/exotics/exotics-hero-02.mp4", type: "video/mp4" }]}
            />
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
            <ExoticOffersBrowser offers={exoticOffers} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
