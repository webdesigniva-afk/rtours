import { AdminOfferEditorClient, type AdminOfferEditorInitialOffer } from "./AdminOfferEditorClient";
import { getAdminOfferBySlug } from "@/lib/adminOfferRepository";

type AdminOfferEditorPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ tab?: string; new?: string }>;
};

function toNumber(value: string | null | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default async function AdminOfferEditorPage({ params, searchParams }: AdminOfferEditorPageProps) {
  const { slug } = await params;
  const { tab, new: newMode } = (await searchParams) ?? {};
  const offer = await getAdminOfferBySlug(slug).catch(() => null);
  const canCancelCreation = Boolean(
    offer &&
      (newMode === "1" || offer.slug.startsWith("nova-oferta") || offer.review_notes?.includes("[new-offer-draft]") || offer.review_notes?.includes("празна чернова"))
  );
  const isNewBlankDraft = Boolean(
    offer &&
      canCancelCreation &&
      !offer.summary &&
      !offer.description &&
      !offer.country &&
      !offer.region &&
      !offer.hero_image_url &&
      !offer.dates?.length &&
      !offer.itinerary_days?.length &&
      !offer.included_services?.length &&
      !offer.excluded_services?.length
  );

  const initialOffer: AdminOfferEditorInitialOffer = {
    slug,
    productType: offer?.product_type ?? "excursion",
    title: canCancelCreation && (!offer?.title || offer.title === "Нова оферта" || offer.slug.startsWith("nova-oferta")) ? "" : offer?.title ?? "",
    summary: isNewBlankDraft ? "" : offer?.summary ?? "",
    description: offer?.description ?? "",
    country: isNewBlankDraft ? "" : offer?.country ?? "",
    region: isNewBlankDraft ? "" : offer?.region ?? "",
    durationDays: isNewBlankDraft ? "" : offer?.duration_days ?? "",
    durationNights: isNewBlankDraft ? "" : offer?.duration_nights ?? "",
    priceFrom: isNewBlankDraft ? 0 : toNumber(offer?.price_from, 0),
    currency: offer?.currency ?? "EUR",
    dates: offer?.dates ?? [],
    status: offer?.status ?? "draft",
    heroImageUrl: offer?.hero_image_url ?? "",
    seoMetaTitle: offer?.seo_meta_title ?? "",
    seoMetaDescription: offer?.seo_meta_description ?? "",
    seoKeywords: offer?.seo_keywords ?? [],
    seoCanonicalUrl: offer?.seo_canonical_url ?? "",
    seoStructuredDataType: offer?.seo_structured_data_type ?? "TouristTrip",
    isAuthorProgram: offer?.is_author_program ?? false,
    itinerary: offer?.itinerary_days ?? [],
    included: offer?.included_services ?? [],
    excluded: offer?.excluded_services ?? [],
    canCancelCreation,
    isNewBlankDraft,
    createdAt: offer?.created_at ?? "",
    updatedAt: offer?.updated_at ?? ""
  };

  return <AdminOfferEditorClient offer={initialOffer} initialTabKey={tab} />;
}
