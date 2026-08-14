import { dbQuery } from "./db";

export type AdminOfferRecord = {
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
  dates: Array<{
    id: string;
    label: string | null;
    startDate: string | null;
    endDate: string | null;
    departurePoints: string | null;
    availability: string;
    seatsTotal: number | null;
    seatsConfirmed: number | null;
    seatsOption: number | null;
    seatsAvailable: number | null;
    priceFrom: string | null;
    currency: "EUR" | "BGN";
    priceStatus: string;
    optionUntil: string | null;
    depositAmount: string | null;
    paymentDueDays: number | null;
    notes: string | null;
  }> | null;
  destinations: Array<{
    country: string;
    region: string | null;
    city: string | null;
  }> | null;
  source: string;
  import_id: string | null;
  import_provider: string | null;
  import_source: string | null;
  import_change_state: "new" | "changed" | "expired" | "unavailable" | "unchanged" | null;
  import_last_synced_at: string | null;
  import_raw_payload: unknown;
  supplier_entities: Array<{
    id: string;
    type: string;
    key: string | null;
    title: string | null;
    url: string | null;
    startDate: string | null;
    endDate: string | null;
    price: string | null;
    currency: "EUR" | "BGN" | null;
    sortOrder: number;
    isEnabled: boolean;
    editorialTitle: string | null;
    editorialUrl: string | null;
    editorialData: Record<string, unknown> | null;
    rawData: unknown;
  }> | null;
  status: string;
  hero_image_url: string | null;
  gallery_image_urls: string[] | null;
  seo_meta_title: string | null;
  seo_meta_description: string | null;
  seo_keywords: string[] | null;
  seo_canonical_url: string | null;
  seo_structured_data_type: string | null;
  is_author_program: boolean;
  itinerary_days: Array<{
    day: number;
    title: string;
    description: string;
    accommodation: string | null;
    meals: string | null;
    transport: string | null;
  }> | null;
  highlights: string[] | null;
  included_services: string[] | null;
  excluded_services: string[] | null;
  taxonomy_terms: Array<{
    type: string;
    slug: string;
    name: string;
    publicLabel: string | null;
  }> | null;
  visibility_rules: Array<{
    placement: string;
    isEnabled: boolean;
    priority: number;
  }> | null;
  review_notes: string | null;
  dates_count?: number;
  future_dates_count?: number;
  created_at: string;
  updated_at: string;
};

export async function getAdminOfferBySlug(slug: string) {
  const result = await dbQuery<AdminOfferRecord>(
    `
      select
        id,
        slug,
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
        coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'id', date.id,
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
                'city', destination.city
              )
              order by destination.sort_order
            )
            from offer_destinations destination
            where destination.offer_id = offers.id
          ),
          '[]'::jsonb
        ) as destinations,
        source::text,
        (
          select import.id::text
          from offer_imports import
          where import.offer_id = offers.id
          order by import.last_synced_at desc, import.created_at desc
          limit 1
        ) as import_id,
        (
          select import.provider
          from offer_imports import
          where import.offer_id = offers.id
          order by import.last_synced_at desc, import.created_at desc
          limit 1
        ) as import_provider,
        (
          select import.source::text
          from offer_imports import
          where import.offer_id = offers.id
          order by import.last_synced_at desc, import.created_at desc
          limit 1
        ) as import_source,
        (
          select import.change_state::text
          from offer_imports import
          where import.offer_id = offers.id
          order by import.last_synced_at desc, import.created_at desc
          limit 1
        ) as import_change_state,
        (
          select import.last_synced_at::text
          from offer_imports import
          where import.offer_id = offers.id
          order by import.last_synced_at desc, import.created_at desc
          limit 1
        ) as import_last_synced_at,
        (
          select import.raw_payload
          from offer_imports import
          where import.offer_id = offers.id
          order by import.last_synced_at desc, import.created_at desc
          limit 1
        ) as import_raw_payload,
        coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'id', entity.id,
                'type', entity.entity_type,
                'key', entity.entity_key,
                'title', entity.title,
                'url', entity.url,
                'startDate', entity.start_date::text,
                'endDate', entity.end_date::text,
                'price', entity.price::text,
                'currency', entity.currency,
                'sortOrder', entity.sort_order,
                'isEnabled', entity.is_enabled,
                'editorialTitle', entity.editorial_title,
                'editorialUrl', entity.editorial_url,
                'editorialData', entity.editorial_data,
                'rawData', entity.raw_data
              )
              order by entity.entity_type, entity.sort_order, entity.created_at
            )
            from supplier_import_entities entity
            where entity.import_id = (
              select import.id
              from offer_imports import
              where import.offer_id = offers.id
              order by import.last_synced_at desc, import.created_at desc
              limit 1
            )
          ),
          '[]'::jsonb
        ) as supplier_entities,
        status::text,
        hero_image_url,
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
        seo_keywords,
        seo_canonical_url,
        seo_structured_data_type,
        is_author_program,
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
          ),
          '[]'::jsonb
        ) as taxonomy_terms,
        coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'placement', rule.placement::text,
                'isEnabled', rule.is_enabled,
                'priority', rule.priority
              )
              order by rule.placement::text
            )
            from offer_visibility_rules rule
            where rule.offer_id = offers.id
          ),
          '[]'::jsonb
        ) as visibility_rules,
        review_notes,
        created_at::text,
        updated_at::text
      from offers
      where slug = $1
        or id::text = $1
      limit 1
    `,
    [slug]
  );

  return result.rows[0] ?? null;
}

export type AdminOfferListItem = {
  id: string;
  slug: string;
  title: string;
  destination: string;
  type: "Екскурзия" | "Почивка" | "Круиз";
  source: string;
  importId: string | null;
  departures: number;
  price: string;
  status: "Чернова" | "За преглед" | "Публикувана" | "⚠ Променена" | "Изтекла" | "Архивирана" | "⚠ Грешка";
  publication: "site" | "draft";
  collection: "Red Signature" | "Red Escape" | "Red Moments" | "Без колекция";
  image: string;
  updatedAt: string;
};

function mapProductType(productType: string, label?: string | null): AdminOfferListItem["type"] {
  if (!label) return "Екскурзия";
  if (productType === "holiday") return "Почивка";
  return "Екскурзия";
}

function formatProvider(provider?: string | null) {
  if (!provider) return "";

  return provider
    .replace(/[_-]+/g, " ")
    .replace(/\bxml\b/gi, "")
    .replace(/\bapi\b/gi, "")
    .replace(/\bcsv\b/gi, "")
    .replace(/\bexcel\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function relativeSyncTime(value?: string | null) {
  if (!value) return "";

  const syncedAt = new Date(value).getTime();
  const diffMs = Date.now() - syncedAt;
  if (!Number.isFinite(diffMs) || diffMs < 0) return "";

  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `синхронизирана преди ${minutes} мин.`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `синхронизирана преди ${hours} ч.`;

  const days = Math.round(hours / 24);
  return `синхронизирана преди ${days} д.`;
}

function mapSource(source: string, provider?: string | null, importSource?: string | null, lastSyncedAt?: string | null) {
  const detectedSource = importSource || source;
  const providerLabel = formatProvider(provider);
  const syncLabel = relativeSyncTime(lastSyncedAt);
  const withSync = (label: string) => syncLabel ? `${label} · ${syncLabel}` : label;

  if (detectedSource === "xml") return withSync(providerLabel ? `XML • ${providerLabel}` : "XML");
  if (detectedSource === "api") return withSync(providerLabel ? `API • ${providerLabel}` : "API");
  if (detectedSource === "erp") return withSync(providerLabel ? `ERP • ${providerLabel}` : "ERP");
  if (detectedSource === "labeling") return "Ръчен импорт";
  if (provider?.toLocaleLowerCase("bg-BG").includes("excel") || provider?.toLocaleLowerCase("bg-BG").includes("csv")) return "CSV/Excel";
  return "Ръчен импорт";
}

function mapStatus(offer: AdminOfferRecord): AdminOfferListItem["status"] {
  const hasImport = Boolean(offer.import_source || offer.import_provider);

  if (offer.status === "archived") return "Архивирана";
  if (offer.import_change_state === "unavailable") return "⚠ Грешка";
  if (offer.import_change_state === "changed") return "⚠ Променена";
  if (offer.import_change_state === "expired") return "Изтекла";
  if ((offer.dates_count ?? 0) > 0 && (offer.future_dates_count ?? 0) === 0) return "Изтекла";
  if (offer.status === "published") return "Публикувана";
  if (offer.status === "review" || offer.status === "needs_changes" || (hasImport && offer.import_change_state === "new")) return "За преглед";
  return "Чернова";
}

export async function listAdminOfferItems() {
  const result = await dbQuery<AdminOfferRecord>(
    `
      select
        id,
        slug,
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
        '[]'::jsonb as dates,
        (
          select count(*)::int
          from offer_dates date
          where date.offer_id = offers.id
        ) as dates_count,
        (
          select count(*)::int
          from offer_dates date
          where date.offer_id = offers.id
            and date.availability <> 'sold_out'
            and (date.end_date is null or date.end_date >= current_date)
        ) as future_dates_count,
        source::text,
        (
          select import.id::text
          from offer_imports import
          where import.offer_id = offers.id
          order by import.last_synced_at desc, import.created_at desc
          limit 1
        ) as import_id,
        (
          select import.provider
          from offer_imports import
          where import.offer_id = offers.id
          order by import.last_synced_at desc, import.created_at desc
          limit 1
        ) as import_provider,
        (
          select import.source::text
          from offer_imports import
          where import.offer_id = offers.id
          order by import.last_synced_at desc, import.created_at desc
          limit 1
        ) as import_source,
        (
          select import.change_state::text
          from offer_imports import
          where import.offer_id = offers.id
          order by import.last_synced_at desc, import.created_at desc
          limit 1
        ) as import_change_state,
        (
          select import.last_synced_at::text
          from offer_imports import
          where import.offer_id = offers.id
          order by import.last_synced_at desc, import.created_at desc
          limit 1
        ) as import_last_synced_at,
        status::text,
        hero_image_url,
        seo_meta_title,
        seo_meta_description,
        seo_keywords,
        seo_canonical_url,
        seo_structured_data_type,
        is_author_program,
        '[]'::jsonb as itinerary_days,
        '{}'::text[] as highlights,
        created_at::text,
        updated_at::text
      from offers
      order by updated_at desc
    `
  );

  return result.rows.map((offer): AdminOfferListItem => ({
    id: offer.id,
    slug: offer.slug,
    title: offer.title,
    destination: [offer.country, offer.region].filter(Boolean).join(", ") || "Без дестинация",
    type: mapProductType(offer.product_type, offer.product_type_label),
    source: mapSource(offer.source, offer.import_provider, offer.import_source, offer.import_last_synced_at),
    importId: offer.import_id,
    departures: offer.dates_count ?? 0,
    price: offer.price_from ? `${Number(offer.price_from).toLocaleString("bg-BG")} ${offer.currency}` : "не е въведена",
    status: mapStatus(offer),
    publication: offer.status === "published" ? "site" : "draft",
    collection: "Без колекция",
    image: offer.hero_image_url || "",
    updatedAt: offer.updated_at
  }));
}
