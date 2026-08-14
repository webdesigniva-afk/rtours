import { AdminOfferEditorClient, type AdminOfferEditorInitialOffer } from "./AdminOfferEditorClient";
import { getAdminOfferBySlug } from "@/lib/adminOfferRepository";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  const offer = await getAdminOfferBySlug(slug);
  if (!offer) {
    notFound();
  }

  const canCancelCreation = Boolean(offer && offer.status === "draft" && newMode === "1");
  const hasSavedContent = Boolean(
    offer.title ||
      offer.summary ||
      offer.description ||
      offer.country ||
      offer.region ||
      offer.hero_image_url ||
      offer.gallery_image_urls?.length ||
      offer.destinations?.length ||
      offer.itinerary_days?.length ||
      offer.included_services?.length ||
      offer.excluded_services?.length
  );
  const isNewBlankDraft = canCancelCreation && !hasSavedContent;
  const shouldHideDefaultProductType = Boolean(isNewBlankDraft || (offer.status === "draft" && offer.product_type === "package" && !offer.product_type_label));
  const shouldHideDefaultTransport = Boolean(isNewBlankDraft || (offer.status === "draft" && offer.transport === "mixed" && !offer.product_type_label));

  const initialOffer: AdminOfferEditorInitialOffer = {
    id: offer.id,
    slug: offer.slug,
    productType: shouldHideDefaultProductType ? "" : offer.product_type,
    productTypeLabel: shouldHideDefaultProductType ? "" : offer.product_type_label ?? "",
    title: offer.title ?? "",
    summary: offer.summary ?? "",
    description: offer.description ?? "",
    country: offer.country ?? "",
    region: offer.region ?? "",
    destinations: offer.destinations?.length
      ? offer.destinations.map((destination) => ({
          country: destination.country ?? "",
          region: destination.region ?? "",
          city: destination.city ?? ""
        }))
      : [],
    durationDays: offer.duration_days ?? "",
    durationNights: offer.duration_nights ?? "",
    priceFrom: toNumber(offer.price_from, 0),
    currency: offer.currency ?? "EUR",
    transport: shouldHideDefaultTransport ? "" : offer.transport,
    dates: offer.dates ?? [],
    status: offer.status ?? "draft",
    importId: offer.import_id,
    importProvider: offer.import_provider,
    importSource: offer.import_source,
    importChangeState: offer.import_change_state,
    importLastSyncedAt: offer.import_last_synced_at,
    importRawPayload: offer.import_raw_payload,
    supplierEntities: offer.supplier_entities ?? [],
    heroImageUrl: offer.hero_image_url ?? "",
    galleryImageUrls: offer.gallery_image_urls ?? [],
    seoMetaTitle: offer.seo_meta_title ?? "",
    seoMetaDescription: offer.seo_meta_description ?? "",
    seoKeywords: offer.seo_keywords ?? [],
    seoCanonicalUrl: offer.seo_canonical_url ?? "",
    seoStructuredDataType: offer.seo_structured_data_type ?? "TouristTrip",
    isAuthorProgram: offer.is_author_program ?? false,
    itinerary: offer.itinerary_days?.map((day) => ({
      day: day.day,
      title: day.title,
      description: day.description,
      accommodation: day.accommodation ?? "",
      meals: day.meals ?? "",
      transport: day.transport ?? ""
    })) ?? [],
    highlights: offer.highlights ?? [],
    included: offer.included_services ?? [],
    excluded: offer.excluded_services ?? [],
    taxonomyTerms: offer.taxonomy_terms ?? [],
    visibilityRules: offer.visibility_rules ?? [],
    canCancelCreation,
    isNewBlankDraft,
    createdAt: offer.created_at ?? "",
    updatedAt: offer.updated_at ?? ""
  };

  return <AdminOfferEditorClient key={`${offer.id}-${offer.updated_at ?? "missing"}`} offer={initialOffer} initialTabKey={tab} />;
}
