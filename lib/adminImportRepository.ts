import { dbQuery } from "./db";

export type AdminSupplierImportItem = {
  importId: string;
  importRunId: string | null;
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
  importantChanges: Array<{
    type?: string;
    field?: string;
    key?: string;
    label?: string;
    before?: unknown;
    after?: unknown;
  }>;
};

export type AdminSupplierImportsList = {
  items: AdminSupplierImportItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type AdminSupplierImportSummary = {
  total: number;
  waitingReview: number;
  changed: number;
  missingData: number;
};

export type AdminSupplierImportRun = {
  id: string;
  provider: string;
  displayName: string | null;
  mode: string;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  totalFound: number | null;
  totalProcessed: number;
  newCount: number;
  changedCount: number;
  unchangedCount: number;
  expiredCount: number;
  unavailableCount: number;
  errorCount: number;
  errorMessage: string | null;
};

export type AdminSupplierConnector = {
  id: string;
  provider: string;
  displayName: string;
  sourceType: "api" | "xml" | "json" | "csv" | "file" | "manual";
  authType: string;
  status: "active" | "paused" | "disabled";
  defaultBaseUrl: string | null;
  configSchema: Record<string, unknown>;
  notes: string | null;
  lastRunStatus: string | null;
  lastRunAt: string | null;
  lastProcessed: number | null;
};

export async function listAdminSupplierConnectors() {
  const result = await dbQuery<AdminSupplierConnector>(
    `
      select
        connector.id,
        connector.provider,
        connector.display_name as "displayName",
        connector.source_type as "sourceType",
        connector.auth_type as "authType",
        connector.status,
        connector.default_base_url as "defaultBaseUrl",
        connector.config_schema as "configSchema",
        connector.notes,
        latest.status as "lastRunStatus",
        latest.started_at::text as "lastRunAt",
        latest.total_processed as "lastProcessed"
      from supplier_connectors connector
      left join lateral (
        select run.status, run.started_at, run.total_processed
        from supplier_import_runs run
        where run.connector_id = connector.id
        order by run.started_at desc
        limit 1
      ) latest on true
      order by
        case connector.status when 'active' then 0 when 'paused' then 1 else 2 end,
        connector.display_name
    `
  );

  return result.rows;
}

export async function listAdminSupplierImportRuns() {
  const result = await dbQuery<AdminSupplierImportRun>(
    `
      select
        run.id,
        run.provider,
        connector.display_name as "displayName",
        run.mode,
        run.status,
        run.started_at::text as "startedAt",
        run.finished_at::text as "finishedAt",
        run.total_found as "totalFound",
        run.total_processed as "totalProcessed",
        run.new_count as "newCount",
        run.changed_count as "changedCount",
        run.unchanged_count as "unchangedCount",
        run.expired_count as "expiredCount",
        run.unavailable_count as "unavailableCount",
        run.error_count as "errorCount",
        run.error_message as "errorMessage"
      from supplier_import_runs run
      left join supplier_connectors connector on connector.id = run.connector_id
      order by run.started_at desc
      limit 8
    `
  );

  return result.rows;
}

export async function getAdminSupplierImportSummary() {
  const result = await dbQuery<AdminSupplierImportSummary>(
    `
      select
        count(*)::int as total,
        count(*) filter (
          where offer.status = 'review'
            or import.change_state in ('new', 'changed')
        )::int as "waitingReview",
        count(*) filter (
          where import.change_state = 'changed'
            or jsonb_array_length(coalesce(import.important_changes, '[]'::jsonb)) > 0
        )::int as changed,
        count(*) filter (
          where coalesce((select count(*)::int from offer_dates date where date.offer_id = offer.id), 0) = 0
            or coalesce((select count(*)::int from offer_media media where media.offer_id = offer.id), 0) = 0
            or coalesce((select count(*)::int from offer_itinerary_days day where day.offer_id = offer.id), 0) = 0
        )::int as "missingData"
      from offer_imports import
      left join offers offer on offer.id = import.offer_id
      where import.source in ('api', 'xml', 'json', 'csv', 'file')
    `
  );

  return result.rows[0] ?? { total: 0, waitingReview: 0, changed: 0, missingData: 0 };
}

export async function listAdminSupplierImports(options: { page?: number; pageSize?: number } = {}): Promise<AdminSupplierImportsList> {
  const pageSize = Math.min(Math.max(Math.trunc(options.pageSize ?? 20), 1), 100);
  const page = Math.max(Math.trunc(options.page ?? 1), 1);
  const countResult = await dbQuery<{ total: number }>(
    `
      select count(*)::int as total
      from offer_imports import
      where import.source in ('api', 'xml', 'json', 'csv', 'file')
    `
  );
  const totalCount = countResult.rows[0]?.total ?? 0;
  const pageCount = Math.max(Math.ceil(totalCount / pageSize), 1);
  const normalizedPage = Math.min(page, pageCount);
  const normalizedOffset = (normalizedPage - 1) * pageSize;
  const result = await dbQuery<AdminSupplierImportItem>(
    `
      select
        import.id as "importId",
        import.import_run_id as "importRunId",
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
        nullif(import.raw_payload #>> '{details,DetailError}', '') as "detailError",
        coalesce(import.important_changes, '[]'::jsonb) as "importantChanges"
      from offer_imports import
      left join offers offer on offer.id = import.offer_id
      where import.source in ('api', 'xml', 'json', 'csv', 'file')
      order by import.last_synced_at desc, import.created_at desc
      limit $1 offset $2
    `,
    [pageSize, normalizedOffset]
  );

  return {
    items: result.rows,
    totalCount,
    page: normalizedPage,
    pageSize,
    pageCount
  };
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
        import.import_run_id as "importRunId",
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
        coalesce(import.important_changes, '[]'::jsonb) as "importantChanges",
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
