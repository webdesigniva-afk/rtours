import { getPublishedOfferBySlug, getPublishedOffers, offers } from "./data";
import { dbQuery } from "./db";
import type { Offer, OfferStatus, OfferSupplierSection, TaxonomyTermType } from "./types";

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
    seatsTotal: number | null;
    seatsConfirmed: number | null;
    seatsOption: number | null;
    seatsAvailable: number | null;
    priceFrom: string | null;
    currency: "EUR" | "BGN";
    priceStatus: "fixed" | "option_until" | "dynamic" | "budgetary";
    optionUntil: string | null;
    depositAmount: string | null;
    paymentDueDays: number | null;
    notes: string | null;
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
    accommodation: string | null;
    meals: string | null;
    transport: string | null;
  }> | null;
  highlights: string[] | null;
  included_services: string[] | null;
  excluded_services: string[] | null;
  supplier_sections: Array<{
    type: "hotel" | "additional_service" | "useful_info" | "payment_policy" | "cancel_policy" | "insurance";
    title: string | null;
    rawData: Record<string, unknown> | null;
    editorialData: Record<string, unknown> | null;
  }> | null;
  taxonomy_terms: Array<{
    type: string;
    slug: string;
    name: string;
    publicLabel: string | null;
  }> | null;
  visibility_placements: string[] | null;
  seo_meta_title: string | null;
  seo_meta_description: string | null;
  seo_keywords: string[] | null;
  seo_canonical_url: string | null;
  seo_structured_data_type: string | null;
  created_at: string;
  updated_at: string;
};

const fallbackHeroImage = "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1600&q=84";

function textFromHtml(value: unknown) {
  if (typeof value !== "string") return "";
  if (/^\s*(?:\[object Object\]\s*,?\s*)+\s*$/.test(value)) return "";

  return value
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/\s*(p|div|li|tr|h[1-6])\s*>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = textFromHtml(value);
    if (text) return text;
  }

  return "";
}

function objectValue(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function arrayValue(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function textList(value: unknown) {
  return arrayValue(value)
    .map((item) => {
      if (typeof item === "string") return textFromHtml(item);
      const row = objectValue(item);
      return firstText(row.name, row.title, row.label, row.note, row.Desc, row.Text, row["#text"]);
    })
    .filter(Boolean);
}

function hotelRoomsText(raw: Record<string, unknown>, editorial: Record<string, unknown>) {
  const edited = firstText(editorial.rooms);
  if (edited) return edited;

  return textList(raw.rooms).join("\n");
}

function hotelTitle(entityTitle: unknown, raw: Record<string, unknown>, fallback: string) {
  return firstText(
    entityTitle,
    raw.title,
    raw.hotelName,
    raw.HotelName,
    raw.name,
    raw.Name,
    raw.Accommodation,
    raw.category,
    raw.Category,
    textList(raw.hotels)[0]
  ) || fallback;
}

function mapSupplierSections(row: PublicOfferRow): Offer["supplierSections"] {
  const sections: OfferSupplierSection[] = [];

  for (const [index, entity] of (row.supplier_sections ?? []).entries()) {
    const raw = objectValue(entity.rawData);
    const editorial = objectValue(entity.editorialData);
    const title = entity.type === "hotel"
      ? hotelTitle(entity.title, raw, `Хотел ${index + 1}`)
      : firstText(editorial.title, editorial.text, entity.title, raw.title, raw.label, raw.Desc, raw.Text, raw["#text"]);

    if (!title) continue;

    if (entity.type === "hotel") {
      sections.push({
        type: entity.type,
        title,
        body: hotelRoomsText(raw, editorial),
        meta: firstText(editorial.category, raw.category, raw.Category)
      });
      continue;
    }

    sections.push({
      type: entity.type,
      title,
      body: firstText(editorial.description, editorial.text, raw.Desc, raw.Text, raw["#text"]),
      meta: firstText(editorial.category, raw["@_Type"], raw.Type)
    });
  }

  return sections;
}

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
    description: day.description || "",
    accommodation: day.accommodation || undefined,
    meals: day.meals || undefined,
    transport: day.transport || undefined
  })) ?? [];
  const taxonomyTerms = row.taxonomy_terms ?? [];
  const termsByType = (type: string) => taxonomyTerms.filter((term) => term.type === type);

  return {
    slug: row.slug,
    productType: row.product_type as Offer["productType"],
    productTypeLabel: row.product_type_label || undefined,
    title,
    summary,
    description: row.description || summary,
    destinationSlug: row.slug,
    collectionSlugs: termsByType("collection").map((term) => term.slug),
    country,
    region,
    destinations,
    durationDays,
    durationNights,
    transport: row.transport as Offer["transport"],
    priceFrom: Number.isFinite(priceFrom) ? priceFrom : 0,
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
          availability: date.availability,
          seatsTotal: date.seatsTotal ?? undefined,
          seatsConfirmed: date.seatsConfirmed ?? undefined,
          seatsOption: date.seatsOption ?? undefined,
          seatsAvailable: date.seatsAvailable ?? undefined,
          priceFrom: date.priceFrom === null ? undefined : Number(date.priceFrom),
          currency: date.currency,
          priceStatus: date.priceStatus,
          optionUntil: date.optionUntil || undefined,
          depositAmount: date.depositAmount === null ? undefined : Number(date.depositAmount),
          paymentDueDays: date.paymentDueDays ?? undefined,
          notes: date.notes || undefined
        }))
      : [{ label: "Дати по заявка", startDate: "", endDate: "", availability: "on_request" }],
    moods: termsByType("mood").map((term) => term.slug) as Offer["moods"],
    tags: termsByType("badge").map((term) => term.publicLabel || term.name),
    taxonomyTerms: taxonomyTerms.map((term) => ({
      termSlug: term.slug,
      termType: term.type as TaxonomyTermType,
      source: "manual"
    })),
    taxonomyTermSlugs: taxonomyTerms.map((term) => term.slug),
    badgeSlugs: termsByType("badge").map((term) => term.slug),
    audienceSlugs: termsByType("audience").map((term) => term.slug),
    categorySlugs: termsByType("category").map((term) => term.slug),
    themeSlugs: termsByType("theme").map((term) => term.slug),
    visibilityPlacements: (row.visibility_placements ?? []) as Offer["visibilityPlacements"],
    highlights: row.highlights ?? [],
    included: row.included_services ?? [],
    excluded: row.excluded_services ?? [],
    itinerary,
    supplierSections: mapSupplierSections(row),
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
                'availability', date.availability::text,
                'seatsTotal', date.seats_total,
                'seatsConfirmed', date.seats_confirmed,
                'seatsOption', date.seats_option,
                'seatsAvailable', date.seats_available,
                'priceFrom', date.price_from::text,
                'currency', date.currency,
                'priceStatus', date.price_status::text,
                'optionUntil', date.option_until::text,
                'depositAmount', date.deposit_amount::text,
                'paymentDueDays', date.payment_due_days,
                'notes', date.notes
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
                'description', itinerary.description,
                'accommodation', itinerary.accommodation,
                'meals', itinerary.meals,
                'transport', itinerary.transport
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
            select array_agg(highlight.label order by highlight.sort_order)
            from offer_highlights highlight
            where highlight.offer_id = offers.id
          ),
          '{}'::text[]
        ) as highlights,
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
        coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'type', entity.entity_type,
                'title', coalesce(nullif(entity.editorial_title, ''), entity.title),
                'rawData', entity.raw_data,
                'editorialData', entity.editorial_data
              )
              order by entity.entity_type, entity.sort_order, entity.created_at
            )
            from supplier_import_entities entity
            where entity.offer_id = offers.id
              and entity.is_enabled = true
              and entity.entity_type in ('hotel', 'additional_service', 'useful_info', 'payment_policy', 'cancel_policy', 'insurance')
          ),
          '[]'::jsonb
        ) as supplier_sections,
        coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'type', term.type::text,
                'slug', term.slug,
                'name', term.name,
                'publicLabel', term.public_label
              )
              order by term.type, term.sort_order, term.name
            )
            from offer_taxonomy_terms assigned
            join taxonomy_terms term on term.id = assigned.term_id
            where assigned.offer_id = offers.id
              and term.is_public = true
          ),
          '[]'::jsonb
        ) as taxonomy_terms,
        coalesce(
          (
            select array_agg(rule.placement::text order by rule.priority desc, rule.placement::text)
            from offer_visibility_rules rule
            where rule.offer_id = offers.id
              and rule.is_enabled = true
              and (rule.starts_at is null or rule.starts_at <= now())
              and (rule.ends_at is null or rule.ends_at >= now())
          ),
          '{}'::text[]
        ) as visibility_placements,
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

  return result.rows.map(mapPublicOffer);
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
                'availability', date.availability::text,
                'seatsTotal', date.seats_total,
                'seatsConfirmed', date.seats_confirmed,
                'seatsOption', date.seats_option,
                'seatsAvailable', date.seats_available,
                'priceFrom', date.price_from::text,
                'currency', date.currency,
                'priceStatus', date.price_status::text,
                'optionUntil', date.option_until::text,
                'depositAmount', date.deposit_amount::text,
                'paymentDueDays', date.payment_due_days,
                'notes', date.notes
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
                'description', itinerary.description,
                'accommodation', itinerary.accommodation,
                'meals', itinerary.meals,
                'transport', itinerary.transport
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
            select array_agg(highlight.label order by highlight.sort_order)
            from offer_highlights highlight
            where highlight.offer_id = offers.id
          ),
          '{}'::text[]
        ) as highlights,
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
        coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'type', entity.entity_type,
                'title', coalesce(nullif(entity.editorial_title, ''), entity.title),
                'rawData', entity.raw_data,
                'editorialData', entity.editorial_data
              )
              order by entity.entity_type, entity.sort_order, entity.created_at
            )
            from supplier_import_entities entity
            where entity.offer_id = offers.id
              and entity.is_enabled = true
              and entity.entity_type in ('hotel', 'additional_service', 'useful_info', 'payment_policy', 'cancel_policy', 'insurance')
          ),
          '[]'::jsonb
        ) as supplier_sections,
        coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'type', term.type::text,
                'slug', term.slug,
                'name', term.name,
                'publicLabel', term.public_label
              )
              order by term.type, term.sort_order, term.name
            )
            from offer_taxonomy_terms assigned
            join taxonomy_terms term on term.id = assigned.term_id
            where assigned.offer_id = offers.id
              and term.is_public = true
          ),
          '[]'::jsonb
        ) as taxonomy_terms,
        coalesce(
          (
            select array_agg(rule.placement::text order by rule.priority desc, rule.placement::text)
            from offer_visibility_rules rule
            where rule.offer_id = offers.id
              and rule.is_enabled = true
              and (rule.starts_at is null or rule.starts_at <= now())
              and (rule.ends_at is null or rule.ends_at >= now())
          ),
          '{}'::text[]
        ) as visibility_placements,
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

  return undefined;
}
