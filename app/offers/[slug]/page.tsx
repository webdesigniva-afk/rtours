import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, MapPin, WalletCards } from "lucide-react";
import { InquiryForm } from "@/components/InquiryForm";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getOfferBySlug, offers } from "@/lib/data";

export function generateStaticParams() {
  return offers.map((offer) => ({ slug: offer.slug }));
}

type OfferPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: OfferPageProps): Promise<Metadata> {
  const { slug } = await params;
  const offer = getOfferBySlug(slug);

  if (!offer) {
    return {};
  }

  return {
    title: offer.seo.metaTitle,
    description: offer.seo.metaDescription,
    keywords: offer.seo.keywords
  };
}

export default async function OfferDetailPage({ params }: OfferPageProps) {
  const { slug } = await params;
  const offer = getOfferBySlug(slug);

  if (!offer) {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <main>
        <section className="container page-title">
          <span className="eyebrow">{offer.country}</span>
          <h1>{offer.title}</h1>
          <p>{offer.description}</p>
        </section>

        <section className="container offer-hero">
          <img src={offer.heroImage} alt={offer.title} />
          <aside className="info-panel">
            <div className="card-body">
              <span className="offer-price">
                от {offer.priceFrom.toLocaleString("bg-BG")} {offer.currency}
              </span>
              <p>{offer.priceNote}</p>
              <div className="card-meta">
                <span className="pill">
                  <Clock size={15} aria-hidden="true" />
                  {offer.durationDays} дни
                </span>
                <span className="pill">
                  <MapPin size={15} aria-hidden="true" />
                  {offer.region}
                </span>
              </div>
              <div className="card-meta">
                {offer.dates.map((date) => (
                  <span className="pill" key={date.startDate}>
                    <CalendarDays size={15} aria-hidden="true" />
                    {date.label}
                  </span>
                ))}
              </div>
              <span className="pill">
                <WalletCards size={15} aria-hidden="true" />
                Запитване преди потвърждение
              </span>
            </div>
          </aside>
        </section>

        <section className="container section detail-grid">
          <div className="content-block">
            <h2>Програма</h2>
            {offer.itinerary.map((day) => (
              <article className="day" key={`${offer.slug}-${day.day}`}>
                <h3>
                  Ден {day.day}: {day.title}
                </h3>
                <p>{day.description}</p>
              </article>
            ))}

            <h2>Включено</h2>
            <ul>
              {offer.included.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h2>Не е включено</h2>
            <ul>
              {offer.excluded.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <aside className="info-panel">
            <h2>Запитване</h2>
            <p>
              Формата е подготвена за бъдещо подаване към CRM/ERP. В първия етап може да се
              обработва от екипа по текущия процес.
            </p>
            <InquiryForm offerTitle={offer.title} />
          </aside>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
