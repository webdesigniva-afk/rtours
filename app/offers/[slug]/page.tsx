import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicOfferDetail } from "@/components/PublicOfferDetail";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getPublishedPublicOfferBySlug, listPublishedPublicOffers } from "@/lib/offerRepository";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const offers = await listPublishedPublicOffers().catch(() => []);
  return offers.map((offer) => ({ slug: offer.slug }));
}

type OfferPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: OfferPageProps): Promise<Metadata> {
  const { slug } = await params;
  const offer = await getPublishedPublicOfferBySlug(slug).catch(() => null);

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
  const offer = await getPublishedPublicOfferBySlug(slug).catch(() => null);

  if (!offer) {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <PublicOfferDetail offer={offer} />
      <SiteFooter />
    </>
  );
}
