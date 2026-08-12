import { getPublishedOfferBySlug, getPublishedOffers, offers } from "./data";
import { dbQuery } from "./db";
import type { Offer, OfferStatus } from "./types";

export type OfferStatusSummary = {
  status: OfferStatus;
  count: number;
};

export type OfferRepository = {
  listAll(): Offer[];
  listPublished(): Offer[];
  getPublishedBySlug(slug: string): Offer | undefined;
  getStatusSummary(): OfferStatusSummary[];
};

const offerStatuses: OfferStatus[] = ["draft", "review", "published", "archived", "needs_changes"];

export const seededOfferRepository: OfferRepository = {
  listAll() {
    return offers;
  },

  listPublished() {
    return getPublishedOffers();
  },

  getPublishedBySlug(slug: string) {
    return getPublishedOfferBySlug(slug);
  },

  getStatusSummary() {
    return offerStatuses.map((status) => ({
      status,
      count: offers.filter((offer) => offer.status === status).length
    }));
  }
};

export const offerRepository = seededOfferRepository;

type PublicOfferRow = {
  id: string;
  slug: string;
  product_type: string;
  title: string;
  summary: string | null;
  description: string | null;
  country: string | null;
  region: string | null;
  duration_days: number | null;
  duration_nights: number | null;
  transport: string;
  price_from: string | null;
  currency: "EUR" | "BGN";
  source: string;
  status: OfferStatus;
  hero_image_url: string | null;
  is_author_program: boolean;
  gallery_image_urls: string[] | null;
  seo_meta_title: string | null;
  seo_meta_description: string | null;
  created_at: string;
  updated_at: string;
};

const fallbackHeroImage = "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1600&q=84";

function mapPublicOffer(row: PublicOfferRow): Offer {
  const title = row.title || "Оферта";
  const summary = row.summary || "Подробностите за тази оферта се подготвят.";
  const country = row.country || "Дестинация";
  const region = row.region || country;
  const durationDays = row.duration_days ?? 1;
  const durationNights = row.duration_nights ?? Math.max(durationDays - 1, 0);
  const priceFrom = Number(row.price_from);

  return {
    slug: row.slug,
    productType: row.product_type as Offer["productType"],
    title,
    summary,
    description: row.description || summary,
    destinationSlug: row.slug,
    collectionSlugs: [],
    country,
    region,
    durationDays,
    durationNights,
    transport: row.transport as Offer["transport"],
    priceFrom: Number.isFinite(priceFrom) ? priceFrom : 999,
    currency: row.currency,
    priceNote: "Запитване преди потвърждение",
    source: row.source as Offer["source"],
    status: row.status,
    isAuthorProgram: row.is_author_program,
    heroImage: row.hero_image_url || fallbackHeroImage,
    gallery: row.gallery_image_urls?.length ? row.gallery_image_urls : row.hero_image_url ? [row.hero_image_url] : [],
    dates: [{ label: "Дати по заявка", startDate: "", endDate: "", availability: "on_request" }],
    moods: [],
    tags: [],
    included: [],
    excluded: [],
    itinerary: [],
    seo: {
      metaTitle: row.seo_meta_title || title,
      metaDescription: row.seo_meta_description || summary,
      keywords: [country, region, title].filter(Boolean)
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function listPublishedPublicOffers() {
  const result = await dbQuery<PublicOfferRow>(
    `
      select
        slug,
        id,
        product_type::text,
        title,
        summary,
        description,
        country,
        region,
        duration_days,
        duration_nights,
        transport::text,
        price_from::text,
        currency,
        source::text,
        status::text as status,
        hero_image_url,
        is_author_program,
        coalesce(
          (
            select array_agg(media.url order by media.sort_order)
            from offer_media media
            where media.offer_id = offers.id
              and media.is_primary = false
          ),
          '{}'::text[]
        ) as gallery_image_urls,
        seo_meta_title,
        seo_meta_description,
        created_at::text,
        updated_at::text
      from offers
      where status = 'published'
      order by updated_at desc
    `
  );

  const databaseOffers = result.rows.map(mapPublicOffer);
  const databaseSlugs = new Set(databaseOffers.map((offer) => offer.slug));
  const seededFallbacks = getPublishedOffers().filter((offer) => !databaseSlugs.has(offer.slug));

  return [...databaseOffers, ...seededFallbacks];
}

export async function getPublishedPublicOfferBySlug(slug: string) {
  const result = await dbQuery<PublicOfferRow>(
    `
      select
        slug,
        id,
        product_type::text,
        title,
        summary,
        description,
        country,
        region,
        duration_days,
        duration_nights,
        transport::text,
        price_from::text,
        currency,
        source::text,
        status::text as status,
        hero_image_url,
        is_author_program,
        coalesce(
          (
            select array_agg(media.url order by media.sort_order)
            from offer_media media
            where media.offer_id = offers.id
              and media.is_primary = false
          ),
          '{}'::text[]
        ) as gallery_image_urls,
        seo_meta_title,
        seo_meta_description,
        created_at::text,
        updated_at::text
      from offers
      where slug = $1
        and status = 'published'
      limit 1
    `,
    [slug]
  );

  if (result.rows[0]) {
    return mapPublicOffer(result.rows[0]);
  }

  return getPublishedOfferBySlug(slug);
}
