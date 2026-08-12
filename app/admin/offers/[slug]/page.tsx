import { AdminOfferEditorClient, type AdminOfferEditorInitialOffer } from "./AdminOfferEditorClient";
import { getAdminOfferBySlug } from "@/lib/adminOfferRepository";

type AdminOfferEditorPageProps = {
  params: Promise<{ slug: string }>;
};

function toNumber(value: string | null | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default async function AdminOfferEditorPage({ params }: AdminOfferEditorPageProps) {
  const { slug } = await params;
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
    status: offer?.status ?? "draft",
    heroImageUrl: offer?.hero_image_url ?? "",
    isAuthorProgram: offer?.is_author_program ?? false,
    createdAt: offer?.created_at ?? "",
    updatedAt: offer?.updated_at ?? ""
  };

  return <AdminOfferEditorClient offer={initialOffer} />;
}
