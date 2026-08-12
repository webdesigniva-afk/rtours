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
  product_type_label: string | null;
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
  dates: Array<{
    label: string | null;
    startDate: string | null;
    endDate: string | null;
    departurePoints: string | null;
    availability: "available" | "limited" | "on_request" | "sold_out";
  }> | null;
  destinations: Array<{
    country: string;
    region: string | null;
    city: string | null;
    isPrimary: boolean;
    sortOrder: number;
  }> | null;
  itinerary_days: Array<{
    day: number;
    title: string;
    description: string | null;
  }> | null;
  included_services: string[] | null;
  excluded_services: string[] | null;
  seo_meta_title: string | null;
  seo_meta_description: string | null;
  seo_keywords: string[] | null;
  seo_canonical_url: string | null;
  seo_structured_data_type: string | null;
  created_at: string;
  updated_at: string;
};

const fallbackHeroImage = "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1600&q=84";

function mapPublicOffer(row: PublicOfferRow): Offer {
  const title = row.title || "Оферта";
  const summary = row.summary || "Подробностите за тази оферта се подготвят.";
  const country = row.country || "Дестинация";
  const region = row.region || country;
  const destinations = row.destinations?.length
    ? row.destinations.map((destination) => ({
        country: destination.country,
        region: destination.region || undefined,
        city: destination.city || undefined,
        isPrimary: destination.isPrimary,
        sortOrder: destination.sortOrder
      }))
    : [{ country, region, isPrimary: true, sortOrder: 0 }];
  const durationDays = row.duration_days ?? 1;
  const durationNights = row.duration_nights ?? Math.max(durationDays - 1, 0);
  const priceFrom = Number(row.price_from);
  const itinerary = row.itinerary_days?.map((day) => ({
    day: day.day,
    title: day.title,
    description: day.description || ""
  })) ?? [];

  return {
    slug: row.slug,
    productType: row.product_type as Offer["productType"],
    productTypeLabel: row.product_type_label || undefined,
    title,
    summary,
    description: row.description || summary,
    destinationSlug: row.slug,
    collectionSlugs: [],
    country,
    region,
    destinations,
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
    dates: row.dates?.length
      ? row.dates.map((date) => ({
          label: date.label || date.startDate || "Дата по заявка",
          startDate: date.startDate || "",
          endDate: date.endDate || "",
          departurePoints: date.departurePoints || undefined,
          availability: date.availability
        }))
      : [{ label: "Дати по заявка", startDate: "", endDate: "", availability: "on_request" }],
    moods: [],
    tags: [],
    included: row.included_services ?? [],
    excluded: row.excluded_services ?? [],
    itinerary,
    seo: {
      metaTitle: row.seo_meta_title || title,
      metaDescription: row.seo_meta_description || summary,
      keywords: row.seo_keywords?.length ? row.seo_keywords : [country, region, title].filter(Boolean),
      canonicalUrl: row.seo_canonical_url || `/offers/${row.slug}`,
      structuredDataType: row.seo_structured_data_type || "TouristTrip"
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
        product_type_label,
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
        coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'label', date.label,
                'startDate', date.start_date::text,
                'endDate', date.end_date::text,
                'departurePoints', date.departure_points,
                'availability', date.availability::text
              )
              order by date.sort_order, date.start_date nulls last
            )
            from offer_dates date
            where date.offer_id = offers.id
          ),
          '[]'::jsonb
        ) as dates,
        coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'country', destination.country,
                'region', destination.region,
                'city', destination.city,
                'isPrimary', destination.is_primary,
                'sortOrder', destination.sort_order
              )
              order by destination.sort_order
            )
            from offer_destinations destination
            where destination.offer_id = offers.id
          ),
          '[]'::jsonb
        ) as destinations,
        coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'day', itinerary.day_number,
                'title', itinerary.title,
                'description', itinerary.description
              )
              order by itinerary.sort_order, itinerary.day_number
            )
            from offer_itinerary_days itinerary
            where itinerary.offer_id = offers.id
          ),
          '[]'::jsonb
        ) as itinerary_days,
        coalesce(
          (
            select array_agg(service.label order by service.sort_order)
            from offer_services service
            where service.offer_id = offers.id
              and service.service_type = 'included'
          ),
          '{}'::text[]
        ) as included_services,
        coalesce(
          (
            select array_agg(service.label order by service.sort_order)
            from offer_services service
            where service.offer_id = offers.id
              and service.service_type = 'excluded'
          ),
          '{}'::text[]
        ) as excluded_services,
        seo_meta_title,
        seo_meta_description,
        seo_keywords,
        seo_canonical_url,
        seo_structured_data_type,
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
        product_type_label,
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
        coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'label', date.label,
                'startDate', date.start_date::text,
                'endDate', date.end_date::text,
                'departurePoints', date.departure_points,
                'availability', date.availability::text
              )
              order by date.sort_order, date.start_date nulls last
            )
            from offer_dates date
            where date.offer_id = offers.id
          ),
          '[]'::jsonb
        ) as dates,
        coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'country', destination.country,
                'region', destination.region,
                'city', destination.city,
                'isPrimary', destination.is_primary,
                'sortOrder', destination.sort_order
              )
              order by destination.sort_order
            )
            from offer_destinations destination
            where destination.offer_id = offers.id
          ),
          '[]'::jsonb
        ) as destinations,
        coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'day', itinerary.day_number,
                'title', itinerary.title,
                'description', itinerary.description
              )
              order by itinerary.sort_order, itinerary.day_number
            )
            from offer_itinerary_days itinerary
            where itinerary.offer_id = offers.id
          ),
          '[]'::jsonb
        ) as itinerary_days,
        coalesce(
          (
            select array_agg(service.label order by service.sort_order)
            from offer_services service
            where service.offer_id = offers.id
              and service.service_type = 'included'
          ),
          '{}'::text[]
        ) as included_services,
        coalesce(
          (
            select array_agg(service.label order by service.sort_order)
            from offer_services service
            where service.offer_id = offers.id
              and service.service_type = 'excluded'
          ),
          '{}'::text[]
        ) as excluded_services,
        seo_meta_title,
        seo_meta_description,
        seo_keywords,
        seo_canonical_url,
        seo_structured_data_type,
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
