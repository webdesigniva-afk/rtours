import { dbQuery } from "./db";

export type AdminSupplierImportItem = {
  importId: string;
  offerId: string | null;
  slug: string | null;
  title: string;
  provider: string;
  externalId: string;
  productType: string | null;
  destination: string;
  status: string | null;
  changeState: string;
  lastSyncedAt: string;
  datesCount: number;
  mediaCount: number;
  itineraryCount: number;
  servicesCount: number;
  hotelsCount: number;
  priceFrom: string | null;
  currency: "EUR" | "BGN" | null;
  detailError: string | null;
};

export async function listAdminSupplierImports() {
  const result = await dbQuery<AdminSupplierImportItem>(
    `
      select
        import.id as "importId",
        import.offer_id as "offerId",
        offer.slug,
        coalesce(offer.title, import.external_id) as title,
        import.provider,
        import.external_id as "externalId",
        offer.product_type::text as "productType",
        concat_ws(', ', nullif(offer.country, ''), nullif(offer.region, '')) as destination,
        offer.status::text,
        import.change_state::text as "changeState",
        import.last_synced_at::text as "lastSyncedAt",
        coalesce((select count(*)::int from offer_dates date where date.offer_id = offer.id), 0) as "datesCount",
        coalesce((select count(*)::int from offer_media media where media.offer_id = offer.id), 0) as "mediaCount",
        coalesce((select count(*)::int from offer_itinerary_days day where day.offer_id = offer.id), 0) as "itineraryCount",
        coalesce((select count(*)::int from offer_services service where service.offer_id = offer.id), 0) as "servicesCount",
        coalesce((select count(*)::int from supplier_import_entities entity where entity.import_id = import.id and entity.entity_type = 'hotel'), 0) as "hotelsCount",
        offer.price_from::text as "priceFrom",
        offer.currency,
        nullif(import.raw_payload #>> '{details,DetailError}', '') as "detailError"
      from offer_imports import
      left join offers offer on offer.id = import.offer_id
      where import.source = 'api'
      order by import.last_synced_at desc, import.created_at desc
      limit 200
    `
  );

  return result.rows;
}

export type AdminSupplierImportDetail = AdminSupplierImportItem & {
  summary: string | null;
  description: string | null;
  durationDays: number | null;
  durationNights: number | null;
  transport: string | null;
  heroImageUrl: string | null;
  galleryImageUrls: string[];
  entities: Array<{
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
  }>;
  rawPayload: unknown;
};

export async function getAdminSupplierImportById(importId: string) {
  const result = await dbQuery<AdminSupplierImportDetail>(
    `
      select
        import.id as "importId",
        import.offer_id as "offerId",
        offer.slug,
        coalesce(offer.title, import.external_id) as title,
        offer.summary,
        offer.description,
        import.provider,
        import.external_id as "externalId",
        offer.product_type::text as "productType",
        concat_ws(', ', nullif(offer.country, ''), nullif(offer.region, '')) as destination,
        offer.status::text,
        import.change_state::text as "changeState",
        import.last_synced_at::text as "lastSyncedAt",
        coalesce((select count(*)::int from offer_dates date where date.offer_id = offer.id), 0) as "datesCount",
        coalesce((select count(*)::int from offer_media media where media.offer_id = offer.id), 0) as "mediaCount",
        coalesce((select count(*)::int from offer_itinerary_days day where day.offer_id = offer.id), 0) as "itineraryCount",
        coalesce((select count(*)::int from offer_services service where service.offer_id = offer.id), 0) as "servicesCount",
        coalesce((select count(*)::int from supplier_import_entities entity where entity.import_id = import.id and entity.entity_type = 'hotel'), 0) as "hotelsCount",
        offer.price_from::text as "priceFrom",
        offer.currency,
        offer.duration_days as "durationDays",
        offer.duration_nights as "durationNights",
        offer.transport::text,
        offer.hero_image_url as "heroImageUrl",
        coalesce(
          (
            select array_agg(media.url order by media.sort_order)
            from offer_media media
            where media.offer_id = offer.id
          ),
          '{}'::text[]
        ) as "galleryImageUrls",
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
            where entity.import_id = import.id
          ),
          '[]'::jsonb
        ) as entities,
        nullif(import.raw_payload #>> '{details,DetailError}', '') as "detailError",
        import.raw_payload as "rawPayload"
      from offer_imports import
      left join offers offer on offer.id = import.offer_id
      where import.id = $1
      limit 1
    `,
    [importId]
  );

  return result.rows[0] ?? null;
}
