import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Compass, HeartHandshake, Route, Sparkles, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AuthorTypingCaption } from "@/components/AuthorTypingCaption";
import { PublicBreadcrumbs } from "@/components/PublicBreadcrumbs";
import { ScrollRevealEffects } from "@/components/ScrollRevealEffects";
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

const processRouteStops = [
  { x: 122, y: 78 },
  { x: 350, y: 250 },
  { x: 640, y: 78 },
  { x: 806, y: 270 },
  { x: 1088, y: 118 }
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
  const visibleOffers = offers.slice(0, 5);

  return (
    <>
      <SiteHeader />
      <main className="author-page">
        <ScrollRevealEffects />
        <section className="author-hero">
          <div className="author-hero-video" aria-hidden="true">
            <video className="author-hero-video-item is-first" autoPlay muted loop playsInline preload="metadata">
              <source src="https://www.pexels.com/download/video/10745869/" type="video/mp4" />
            </video>
            <video className="author-hero-video-item is-second" autoPlay muted loop playsInline preload="metadata">
              <source src="https://www.pexels.com/download/video/4782636/" type="video/mp4" />
            </video>
          </div>
          <div className="container author-hero-grid">
            <div className="author-hero-copy">
              <PublicBreadcrumbs items={[{ label: "Пътувания", href: "/offers" }, { label: "Авторски програми" }]} />
              <h1>
                Пътувания, които започват
                <span><em>с идея.</em></span>
              </h1>
              <p>
                Авторските програми на Red Tours са създадени от нас от първата идея до последния детайл.
              </p>
              <p>
                Те съчетават познати места с неочаквани открития, внимателно темпо и организация,
                която освобождава място за истинското преживяване.
              </p>
            </div>

            <div className="author-hero-video-space" aria-hidden="true" />
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
            <svg className="author-process-route" viewBox="0 0 1220 390" preserveAspectRatio="none" aria-hidden="true">
              <path
                className="author-process-route-line"
                d="M122 78 C212 78 258 150 300 214 C330 260 402 286 470 220 C528 164 548 78 640 78 C736 78 754 158 780 228 C790 252 798 264 806 270 C832 286 892 258 982 206 C1036 174 1068 136 1088 118 C1106 102 1126 94 1158 86"
              />
              <g className="author-process-route-plane-position" transform="translate(1160 86) rotate(-10) scale(0.42) translate(-38 -38)">
                <g className="author-process-route-plane">
                  <path d="M60.1666 38H60.0776C60.0776 38 61.254 39.9002 47.2749 40.6107L43.6589 45.9167H44.2443C45.1187 45.9167 45.8276 46.6256 45.8276 47.5C45.8276 48.3745 45.1187 49.0834 44.2443 49.0834H41.4144L39.673 51.4584H39.8901C40.7645 51.4584 41.4734 52.1672 41.4734 53.0417C41.4734 53.9161 40.7645 54.625 39.8901 54.625H37.2359C35.1849 57.1943 33.2902 59.2888 31.9734 60.1667C31.9734 60.1667 29.2026 60.1667 29.2026 58.5833C29.2026 58.5833 35.6397 46.782 37.9164 40.8418C23.6609 40.9597 23.6609 39.9792 23.6609 39.9792C23.6609 39.9792 20.4943 45.9167 17.3276 45.9167L19.7026 38H19.7917L17.4167 30.0833C20.5833 30.0833 23.75 36.0208 23.75 36.0208C23.75 36.0208 23.75 35.0403 38.0055 35.1582C35.7288 29.218 29.2917 17.4167 29.2917 17.4167C29.2917 15.8333 32.0625 15.8334 32.0625 15.8334C33.3792 16.7112 35.2739 18.8058 37.325 21.375H39.9792C40.8536 21.375 41.5625 22.0839 41.5625 22.9583C41.5625 23.8328 40.8536 24.5417 39.9792 24.5417H39.7621L41.5034 26.9167H44.3333C45.2078 26.9167 45.9167 27.6255 45.9167 28.5C45.9167 29.3744 45.2078 30.0833 44.3333 30.0833H43.7479L47.3639 35.3893C61.343 36.0998 60.1666 38 60.1666 38Z" />
                </g>
              </g>
            </svg>
            <svg className="author-process-stops" viewBox="0 0 1220 390" preserveAspectRatio="none" aria-hidden="true">
              {processRouteStops.map((stop) => (
                <g className="author-process-route-stop" key={`${stop.x}-${stop.y}`}>
                  <circle className="author-process-route-halo" cx={stop.x} cy={stop.y} r="20" />
                  <circle className="author-process-route-core" cx={stop.x} cy={stop.y} r="8" />
                </g>
              ))}
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
            <p className="author-process-note">Защото доброто пътуване се помни. Отношението също.</p>
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
                <h2>Открийте следващото си авторско пътуване.</h2>
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
      </main>
      <SiteFooter />
    </>
  );
}
