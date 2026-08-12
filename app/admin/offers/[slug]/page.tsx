import { AdminOfferEditorClient, type AdminOfferEditorInitialOffer } from "./AdminOfferEditorClient";
import { getAdminOfferBySlug } from "@/lib/adminOfferRepository";

type AdminOfferEditorPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ tab?: string }>;
};

function toNumber(value: string | null | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default async function AdminOfferEditorPage({ params, searchParams }: AdminOfferEditorPageProps) {
  const { slug } = await params;
  const { tab } = (await searchParams) ?? {};
  const offer = await getAdminOfferBySlug(slug).catch(() => null);

  const initialOffer: AdminOfferEditorInitialOffer = {
    slug,
    productType: offer?.product_type ?? "excursion",
    title: offer?.title ?? "Нова оферта",
    summary: offer?.summary ?? "Кратко описание ще се визуализира тук.",
    description: offer?.description ?? "",
    country: offer?.country ?? "Държава",
    region: offer?.region ?? "Регион",
    durationDays: offer?.duration_days ?? 1,
    durationNights: offer?.duration_nights ?? 0,
    priceFrom: toNumber(offer?.price_from, 999),
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
    createdAt: offer?.created_at ?? "",
    updatedAt: offer?.updated_at ?? ""
  };

  return <AdminOfferEditorClient offer={initialOffer} initialTabKey={tab} />;
}
