import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Check, Compass, HeartHandshake, Plane, Route, Sparkles, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AuthorTypingCaption } from "@/components/AuthorTypingCaption";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { formatDisplayDate } from "@/lib/dateFormat";
import { listPublishedPublicOffers } from "@/lib/offerRepository";
import type { Offer } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Авторски програми | Red Tours",
  description: "Авторски пътувания на Red Tours, създадени от идея до последния детайл."
};

const heroCollageImages = [
  "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1500&q=86",
  "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1000&q=84",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=84"
];

const fallbackImages = heroCollageImages;

type AuthorIconItem = {
  number: string;
  title?: string;
  text: string;
  icon: LucideIcon;
};

const processItems: AuthorIconItem[] = [
  { number: "01", title: "Екипът", text: "Създадени и подбрани от екипа на Red Tours с личен поглед към всяка програма.", icon: Compass },
  { number: "02", title: "Балансът", text: "Балансиран маршрут и темпо, за да има място и за важните спирки, и за усещането.", icon: Route },
  { number: "03", title: "Партньорите", text: "Проверени местни партньори, водачи и хотели, на които можем да разчитаме.", icon: UsersRound },
  { number: "04", title: "Детайлите", text: "Малки детайли с голямо значение, които правят пътуването по-леко и завършено.", icon: Sparkles },
  { number: "05", title: "Отношението", text: "Лично отношение и професионална организация преди, по време и след пътуването.", icon: HeartHandshake }
];

const processImages = [
  "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=720&q=84",
  "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=720&q=84",
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=720&q=84",
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=720&q=84",
  "/images/author-programs/personal-service-handshake.png"
];

function isSignatureOffer(offer: Offer) {
  return Boolean(
    offer.isAuthorProgram ||
    (offer.collectionSlugs ?? []).includes("red-signature") ||
    ((offer.visibilityPlacements ?? []).includes("collection_page") && (offer.collectionSlugs ?? []).includes("red-signature"))
  );
}

function priceLabel(offer: Offer) {
  return offer.priceFrom > 0 ? `от ${offer.priceFrom.toLocaleString("bg-BG")} ${offer.currency}` : "Цена при запитване";
}

function firstDateLabel(offer: Offer) {
  const date = offer.dates.find((item) => item.startDate);
  return date?.startDate ? formatDisplayDate(date.startDate) : "по заявка";
}

function destinationLine(offer: Offer) {
  return offer.destinations?.map((destination) => destination.city || destination.region).filter(Boolean).slice(0, 3).join(" · ") || offer.region || offer.country;
}

function AuthorProgramCard({ offer, featured = false }: { offer: Offer; featured?: boolean }) {
  return (
    <Link className={featured ? "author-offer-card is-featured" : "author-offer-card"} href={`/offers/${offer.slug}`}>
      <img src={offer.heroImage || fallbackImages[0]} alt={offer.title} />
      <span className="author-offer-gradient" aria-hidden="true" />
      <span className="author-offer-content">
        <span className="author-offer-kicker">Red Original</span>
        <strong>{offer.country}</strong>
        <em>{destinationLine(offer)}</em>
        <span className="author-offer-meta">
          <span><CalendarDays size={15} aria-hidden="true" />{offer.durationDays} дни</span>
          <span>{firstDateLabel(offer)}</span>
          <b>{priceLabel(offer)}</b>
        </span>
      </span>
      <span className="author-offer-arrow" aria-hidden="true">
        <ArrowRight size={18} />
      </span>
    </Link>
  );
}

export default async function AuthorProgramsPage() {
  const offers = (await listPublishedPublicOffers()).filter(isSignatureOffer);
  const heroImages = heroCollageImages;
  const visibleOffers = offers.slice(0, 5);

  return (
    <>
      <SiteHeader />
      <main className="author-page">
        <section className="author-hero">
          <div className="container author-hero-grid">
            <div className="author-hero-copy">
              <nav className="author-breadcrumb" aria-label="Път">
                <Link href="/">Начало</Link>
                <span>Авторски програми</span>
              </nav>
              <h1>
                Пътувания, които започват
                <span><em>с идея.</em></span>
              </h1>
              <span className="author-red-line" aria-hidden="true" />
              <p>
                Авторските програми на Red Tours са създадени от нас от първата идея до последния детайл.
              </p>
              <p>
                Те съчетават познати места с неочаквани открития, внимателно темпо и организация,
                която освобождава място за истинското преживяване.
              </p>
            </div>

            <div className="author-hero-collage" aria-label="Колаж от авторски пътувания">
              <span className="author-route-line" aria-hidden="true" />
              <span className="author-route-dot is-start" aria-hidden="true" />
              <span className="author-route-dot is-mid" aria-hidden="true" />
              <span className="author-route-dot is-end" aria-hidden="true" />
              <span className="author-coordinate-note" aria-hidden="true">route in progress</span>
              <Plane className="author-plane is-one" size={18} aria-hidden="true" />
              <Plane className="author-plane is-two" size={16} aria-hidden="true" />
              <div className="author-collage-frame is-main">
                <img src={heroImages[0]} alt="" />
                <span>01 / idea</span>
              </div>
              <div className="author-collage-frame is-route">
                <img src={heroImages[1]} alt="" />
                <span>02 / route</span>
              </div>
              <div className="author-collage-frame is-experience">
                <img src={heroImages[2]} alt="" />
                <span>03 / experience</span>
              </div>
              <p>Подхождаме с любопитство. Създаваме с отношение.</p>
            </div>
          </div>
        </section>

        <section className="author-approach">
          <div className="container author-approach-grid">
            <div>
              <span className="author-eyebrow">Нашият подход</span>
              <h2>Не избираме просто точки върху картата<span aria-hidden="true">.</span></h2>
            </div>
            <div className="author-approach-copy">
              <p>
                Проучваме различни варианти, сравняваме маршрути и търсим правилния баланс между съдържание, темпо и комфорт.
              </p>
              <p>
                Подбираме хотелите, транспорта, местните водачи и преживяванията според цялостната идея на пътуването.
              </p>
              <p>
                Премахваме ненужното и оставяме онова, което действително си заслужава.
              </p>
            </div>
          </div>
          <div className="container author-process-label">Как създаваме програмите</div>
          <div className="container author-process">
            <svg className="author-process-route" viewBox="0 0 1220 128" preserveAspectRatio="none" aria-hidden="true">
              <path
                className="author-process-route-line"
                d="M0 64 C70 64 132 60 244 64 C328 67 386 76 488 64 C578 54 648 56 732 64 C820 72 888 57 976 64 C1026 68 1048 60 1062 42 C1078 20 1064 0 1092 -7 C1128 -16 1164 -10 1220 8"
              />
              {[
                [0, 64],
                [244, 64],
                [488, 64],
                [732, 64],
                [976, 64]
              ].map(([x, y]) => (
                <g className="author-process-route-stop" transform={`translate(${x} ${y})`} key={x}>
                  <circle className="author-process-route-halo" r="8.8" />
                  <circle className="author-process-route-core" r="3.2" />
                </g>
              ))}
              <g className="author-process-route-accent" transform="translate(260 58)">
                <path d="M0 4 L4 0 L8 4 L4 8 Z" />
              </g>
              <g className="author-process-route-accent" transform="translate(504 58)">
                <path d="M0 4 L4 0 L8 4 L4 8 Z" />
              </g>
              <g className="author-process-route-accent" transform="translate(748 58)">
                <path d="M0 4 L4 0 L8 4 L4 8 Z" />
              </g>
              <g className="author-process-route-accent" transform="translate(992 58)">
                <path d="M0 4 L4 0 L8 4 L4 8 Z" />
              </g>
              <g className="author-process-route-plane" transform="translate(1190 -1) rotate(-8) scale(1.28)">
                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 20.5 3S17.5 3.5 16 5l-3.5 3.5-8.2-1.8c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3l6.4 4-2.4 2.4-3-.6c-.4-.1-.8.1-1 .5l-.2.4c-.2.4-.1.9.3 1.2L6 19l2.1 2.7c.3.4.8.5 1.2.3l.4-.2c.4-.2.6-.6.5-1l-.6-3 2.4-2.4 4 6.4c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2Z" />
              </g>
            </svg>
            {processItems.map(({ number, title, text }, index) => (
              <article className="author-process-card" key={number}>
                <span>{number}</span>
                <div>
                  <strong>{title}</strong>
                </div>
                <p>{text}</p>
                <img src={processImages[index]} alt="" />
              </article>
            ))}
          </div>
        </section>

        <section className="author-dark-band">
          <div className="container">
            <img className="author-dark-logo" src="/images/brand/redtours-travel-events-logo.png" alt="Red Tours Travel & Events" />
            <AuthorTypingCaption className="author-dark-typing" redPhrase="разказва" />
          </div>
        </section>

        <section className="author-offers-section">
          <div className="container">
            <header className="author-section-header">
              <div>
                <span className="author-eyebrow">Създадени от нас</span>
                <h2>Истории, които ви очакват.</h2>
              </div>
              <Link href="/offers?collection=red-signature">
                Вижте всички програми
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </header>

            {visibleOffers.length ? (
              <div className="author-offers-grid">
                {visibleOffers.map((offer, index) => (
                  <AuthorProgramCard key={offer.slug} offer={offer} featured={index === 0} />
                ))}
              </div>
            ) : (
              <div className="author-empty">
                <strong>Все още няма публикувани авторски програми.</strong>
                <p>Когато отбележиш оферта като авторска в администрацията, тя ще се появи тук.</p>
              </div>
            )}
          </div>
        </section>

        <section className="author-final-cta">
          <div className="container author-final-grid">
            <div>
              <span className="author-eyebrow">Следващата идея</span>
              <h2>Открийте следващото си <em>авторско</em> пътуване.</h2>
              <p>Ние измисляме маршрута. Вие събирате историите.</p>
              <Link className="button" href="/offers?collection=red-signature">
                Разгледайте програмите
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className="author-final-image">
              <img src={heroImages[1]} alt="" />
              <span><Check size={18} aria-hidden="true" /> внимателно подбран маршрут</span>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
