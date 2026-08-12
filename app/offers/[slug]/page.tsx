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

  const canonicalUrl = offer.seo.canonicalUrl || `/offers/${offer.slug}`;

  return {
    title: offer.seo.metaTitle,
    description: offer.seo.metaDescription,
    keywords: offer.seo.keywords,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      type: "website",
      title: offer.seo.metaTitle,
      description: offer.seo.metaDescription,
      url: canonicalUrl,
      images: offer.heroImage ? [{ url: offer.heroImage, alt: offer.title }] : undefined
    },
    twitter: {
      card: "summary_large_image",
      title: offer.seo.metaTitle,
      description: offer.seo.metaDescription,
      images: offer.heroImage ? [offer.heroImage] : undefined
    }
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
