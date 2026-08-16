import { createHash } from "node:crypto";

function createSlug(value, fallback = "supplier-offer") {
  const transliterationMap = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "sht",
    ъ: "a",
    ь: "y",
    ю: "yu",
    я: "ya"
  };
  const slug = String(value || "")
    .trim()
    .toLocaleLowerCase("bg-BG")
    .split("")
    .map((char) => transliterationMap[char] ?? char)
    .join("")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return slug || fallback;
}

function stablePayload(value) {
  return JSON.stringify(value || {});
}

function normalizeSource(value) {
  return value === "xml" || value === "json" || value === "csv" || value === "file" || value === "labeling" || value === "erp" ? value : "api";
}

function normalizeProvider(value) {
  return String(value || "supplier").trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-") || "supplier";
}

function normalizeDisplayName(value, provider) {
  return String(value || provider).trim() || provider;
}

function normalizeInteger(value) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeDurationNights(days, nights) {
  const parsedNights = normalizeInteger(nights);
  if (parsedNights !== null && parsedNights >= 0) return parsedNights;

  const parsedDays = normalizeInteger(days);
  if (parsedDays !== null && parsedDays > 0) return Math.max(parsedDays - 1, 0);

  return null;
}

function normalizeOfferForStorage(offer, provider) {
  const durationDays = normalizeInteger(offer.durationDays);

  return {
    ...offer,
    raw: offer.raw ?? offer.rawPayload ?? {},
    provider,
    source: normalizeSource(offer.source),
    productType: offer.productType || "package",
    productTypeLabel: offer.productTypeLabel || null,
    transport: offer.transport || "mixed",
    currency: offer.currency === "BGN" ? "BGN" : "EUR",
    durationDays,
    durationNights: normalizeDurationNights(durationDays, offer.durationNights),
    media: Array.isArray(offer.media) ? offer.media : [],
    dates: Array.isArray(offer.dates) ? offer.dates : [],
    itinerary: Array.isArray(offer.itinerary) ? offer.itinerary : [],
    highlights: Array.isArray(offer.highlights) ? offer.highlights : [],
    includedServices: Array.isArray(offer.includedServices) ? offer.includedServices : [],
    excludedServices: Array.isArray(offer.excludedServices) ? offer.excludedServices : [],
    supplierEntities: Array.isArray(offer.supplierEntities) ? offer.supplierEntities : []
  };
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function compactValue(value) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") return value.trim() || null;
  return value;
}

function sameValue(before, after) {
  return JSON.stringify(compactValue(before)) === JSON.stringify(compactValue(after));
}

function pushChange(changes, type, field, before, after, extra = {}) {
  if (sameValue(before, after)) return;
  changes.push({
    type,
    field,
    before: compactValue(before),
    after: compactValue(after),
    ...extra
  });
}

function arrayValue(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeTextList(value) {
  return arrayValue(value)
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

function dateKey(date, index) {
  return String(date?.raw?.TripID || date?.raw?.["@_TripID"] || date?.key || date?.startDate || date?.label || `date-${index}`);
}

function mediaKey(media, index) {
  return String(media?.url || media?.key || `media-${index}`);
}

function itineraryKey(day, index) {
  return String(day?.dayNumber || day?.key || `day-${index + 1}`);
}

function indexBy(items, keyFn) {
  const map = new Map();
  arrayValue(items).forEach((item, index) => {
    map.set(keyFn(item, index), item);
  });
  return map;
}

function compareDepartures(changes, previousDates, nextDates) {
  const previousByKey = indexBy(previousDates, dateKey);
  const nextByKey = indexBy(nextDates, dateKey);

  for (const [key, nextDate] of nextByKey.entries()) {
    const previousDate = previousByKey.get(key);
    const label = nextDate?.label || nextDate?.startDate || key;

    if (!previousDate) {
      changes.push({ type: "date", field: "departureAdded", key, label, before: null, after: label });
      continue;
    }

    pushChange(changes, "date", "startDate", previousDate.startDate, nextDate.startDate, { key, label });
    pushChange(changes, "date", "endDate", previousDate.endDate, nextDate.endDate, { key, label });
    pushChange(changes, "price", "departurePrice", previousDate.priceFrom, nextDate.priceFrom, { key, label });
    pushChange(changes, "availability", "availability", previousDate.availability, nextDate.availability, { key, label });
    pushChange(changes, "availability", "seatsAvailable", previousDate.seatsAvailable, nextDate.seatsAvailable, { key, label });
  }

  for (const [key, previousDate] of previousByKey.entries()) {
    if (nextByKey.has(key)) continue;
    const label = previousDate?.label || previousDate?.startDate || key;
    changes.push({ type: "date", field: "departureRemoved", key, label, before: label, after: null });
  }
}

function compareMedia(changes, previousMedia, nextMedia) {
  const previousByKey = indexBy(previousMedia, mediaKey);
  const nextByKey = indexBy(nextMedia, mediaKey);

  for (const [key, nextItem] of nextByKey.entries()) {
    if (!previousByKey.has(key)) {
      changes.push({ type: "media", field: "imageAdded", key, label: nextItem?.alt || key, before: null, after: nextItem?.url || key });
    }
  }

  for (const [key, previousItem] of previousByKey.entries()) {
    if (!nextByKey.has(key)) {
      changes.push({ type: "media", field: "imageRemoved", key, label: previousItem?.alt || key, before: previousItem?.url || key, after: null });
    }
  }
}

function compareItinerary(changes, previousItinerary, nextItinerary) {
  const previousByKey = indexBy(previousItinerary, itineraryKey);
  const nextByKey = indexBy(nextItinerary, itineraryKey);

  for (const [key, nextDay] of nextByKey.entries()) {
    const previousDay = previousByKey.get(key);
    const label = nextDay?.title || `Day ${key}`;

    if (!previousDay) {
      changes.push({ type: "itinerary", field: "itineraryDayAdded", key, label, before: null, after: label });
      continue;
    }

    pushChange(changes, "itinerary", "itineraryTitle", previousDay.title, nextDay.title, { key, label });
    pushChange(changes, "itinerary", "itineraryDescription", previousDay.description, nextDay.description, { key, label });
  }

  for (const [key, previousDay] of previousByKey.entries()) {
    if (nextByKey.has(key)) continue;
    const label = previousDay?.title || `Day ${key}`;
    changes.push({ type: "itinerary", field: "itineraryDayRemoved", key, label, before: label, after: null });
  }
}

function compareServices(changes, previousOffer, nextOffer) {
  pushChange(
    changes,
    "service",
    "includedServices",
    normalizeTextList(previousOffer.includedServices),
    normalizeTextList(nextOffer.includedServices)
  );
  pushChange(
    changes,
    "service",
    "excludedServices",
    normalizeTextList(previousOffer.excludedServices),
    normalizeTextList(nextOffer.excludedServices)
  );
}

function buildImportantChanges(previous, next) {
  if (!previous) return [];

  const changes = [];
  const previousOffer = asObject(previous.normalized_payload);
  const hasPreviousSnapshot = Object.keys(previousOffer).length > 0;
  const fields = [
    ["price", "priceFrom", previousOffer.priceFrom ?? previous.price_from, next.priceFrom],
    ["currency", "currency", previousOffer.currency ?? previous.currency, next.currency],
    ["duration", "durationDays", previousOffer.durationDays ?? previous.duration_days, next.durationDays],
    ["duration", "durationNights", previousOffer.durationNights ?? previous.duration_nights, next.durationNights],
    ["transport", "transport", previousOffer.transport ?? previous.transport, next.transport],
    ["content", "title", previousOffer.title ?? previous.title, next.title]
  ];

  for (const [type, field, before, after] of fields) {
    pushChange(changes, type, field, before, after);
  }

  if (hasPreviousSnapshot) {
    compareDepartures(changes, previousOffer.dates, next.dates);
    compareMedia(changes, previousOffer.media, next.media);
    compareItinerary(changes, previousOffer.itinerary, next.itinerary);
    compareServices(changes, previousOffer, next);
  }

  return changes.slice(0, 80);
}

async function createUniqueOfferSlug(client, title) {
  const baseSlug = createSlug(title);

  for (let index = 0; index < 80; index += 1) {
    const candidate = index === 0 ? baseSlug : `${baseSlug}-${index + 1}`;
    const result = await client.query("select 1 from offers where slug = $1 limit 1", [candidate]);

    if (result.rows.length === 0) return candidate;
  }

  return `${baseSlug}-${Date.now()}`;
}

async function ensureSupplierConnector(client, { provider, displayName, source = "api", defaultBaseUrl = null }) {
  const result = await client.query(
    `
      insert into supplier_connectors (provider, display_name, source_type, auth_type, status, default_base_url)
      values ($1, $2, $3, 'request_credentials', 'active', $4)
      on conflict (provider) do update set
        display_name = excluded.display_name,
        source_type = excluded.source_type,
        default_base_url = coalesce(excluded.default_base_url, supplier_connectors.default_base_url),
        updated_at = now()
      returning id
    `,
    [provider, displayName, ["xml", "json", "csv", "file"].includes(source) ? source : "api", defaultBaseUrl]
  );

  return result.rows[0]?.id || null;
}

export async function startSupplierImportRun(client, options) {
  const provider = normalizeProvider(options.provider);
  const displayName = normalizeDisplayName(options.displayName, provider);
  const source = normalizeSource(options.source);
  const connectorId = await ensureSupplierConnector(client, {
    provider,
    displayName,
    source,
    defaultBaseUrl: options.defaultBaseUrl || options.configSnapshot?.baseUrl || null
  });
  const result = await client.query(
    `
      insert into supplier_import_runs (connector_id, provider, source, mode, status, total_found, config_snapshot)
      values ($1, $2, $3, $4, 'running', $5, $6::jsonb)
      returning id
    `,
    [
      connectorId,
      provider,
      source,
      options.mode === "scheduled" || options.mode === "rebuild" || options.mode === "dry_run" ? options.mode : "manual",
      Number.isFinite(options.totalFound) ? options.totalFound : null,
      stablePayload(options.configSnapshot)
    ]
  );

  return result.rows[0]?.id || null;
}

export async function finishSupplierImportRun(client, runId, summary, error = null) {
  if (!runId) return;

  const status = error ? "failed" : summary?.error > 0 ? "partial_success" : "success";
  await client.query(
    `
      update supplier_import_runs
      set status = $2,
          finished_at = now(),
          total_processed = $3,
          new_count = $4,
          changed_count = $5,
          unchanged_count = $6,
          expired_count = $7,
          unavailable_count = $8,
          error_count = $9,
          error_message = $10,
          summary = $11::jsonb
      where id = $1
    `,
    [
      runId,
      status,
      summary?.processed || 0,
      summary?.new || 0,
      summary?.changed || 0,
      summary?.unchanged || 0,
      summary?.expired || 0,
      summary?.unavailable || 0,
      summary?.error || 0,
      error ? String(error.message || error) : null,
      stablePayload(summary)
    ]
  );
}

async function replaceRelationsBulk(client, offerId, offer, provider) {
  await client.query("delete from offer_dates where offer_id = $1", [offerId]);
  await client.query("delete from offer_destinations where offer_id = $1", [offerId]);
  await client.query("delete from offer_media where offer_id = $1", [offerId]);
  await client.query("delete from offer_itinerary_days where offer_id = $1", [offerId]);
  await client.query("delete from offer_highlights where offer_id = $1", [offerId]);
  await client.query("delete from offer_services where offer_id = $1", [offerId]);

  await client.query(
    `
      insert into offer_destinations (offer_id, country, region, city, is_primary, sort_order)
      values ($1, $2, nullif($3, ''), nullif($4, ''), true, 0)
    `,
    [offerId, offer.country || provider, offer.region || "", offer.city || ""]
  );

  for (const [index, media] of offer.media.entries()) {
    await client.query(
      `
        insert into offer_media (offer_id, url, alt, source, is_primary, sort_order)
        values ($1, $2, $3, $4, $5, $6)
      `,
      [offerId, media.url, media.alt || offer.title, provider, index === 0, index]
    );
  }

  for (const [index, date] of offer.dates.entries()) {
    await client.query(
      `
        insert into offer_dates (
          offer_id, label, start_date, end_date, departure_points, availability,
          price_from, currency, seats_total, seats_available, notes, sort_order
        )
        values ($1, nullif($2, ''), $3, $4, nullif($5, ''), $6, $7, $8, $9, $10, nullif($11, ''), $12)
      `,
      [
        offerId,
        date.label || "",
        date.startDate,
        date.endDate,
        date.departurePoints || "",
        date.availability || "on_request",
        date.priceFrom,
        date.currency || offer.currency,
        date.seatsTotal,
        date.seatsAvailable,
        date.notes || "",
        index
      ]
    );
  }

  for (const [index, day] of offer.itinerary.entries()) {
    await client.query(
      `
        insert into offer_itinerary_days (offer_id, day_number, title, description, accommodation, meals, transport, sort_order)
        values ($1, $2, $3, nullif($4, ''), nullif($5, ''), nullif($6, ''), nullif($7, ''), $8)
      `,
      [offerId, day.dayNumber || index + 1, day.title || `Ден ${index + 1}`, day.description || "", day.accommodation || "", day.meals || "", day.transport || "", index]
    );
  }

  for (const [index, highlight] of offer.highlights.entries()) {
    await client.query("insert into offer_highlights (offer_id, label, sort_order) values ($1, $2, $3)", [offerId, highlight, index]);
  }

  for (const [index, label] of offer.includedServices.entries()) {
    await client.query("insert into offer_services (offer_id, service_type, label, sort_order) values ($1, 'included', $2, $3)", [offerId, label, index]);
  }

  for (const [index, label] of offer.excludedServices.entries()) {
    await client.query("insert into offer_services (offer_id, service_type, label, sort_order) values ($1, 'excluded', $2, $3)", [offerId, label, index]);
  }
}

function buildBulkInsert(rows, rowValues) {
  const values = [];
  const placeholders = rows.map((row, rowIndex) => {
    const current = rowValues(row, rowIndex);
    const offset = values.length;
    values.push(...current);
    return `(${current.map((_, valueIndex) => `$${offset + valueIndex + 1}`).join(", ")})`;
  });

  return { placeholders: placeholders.join(", "), values };
}

async function bulkQuery(client, prefix, rows, rowValues) {
  if (!rows.length) return;
  const { placeholders, values } = buildBulkInsert(rows, rowValues);
  await client.query(`${prefix} ${placeholders}`, values);
}

async function replaceRelations(client, offerId, offer, provider) {
  await client.query("delete from offer_dates where offer_id = $1", [offerId]);
  await client.query("delete from offer_destinations where offer_id = $1", [offerId]);
  await client.query("delete from offer_media where offer_id = $1", [offerId]);
  await client.query("delete from offer_itinerary_days where offer_id = $1", [offerId]);
  await client.query("delete from offer_highlights where offer_id = $1", [offerId]);
  await client.query("delete from offer_services where offer_id = $1", [offerId]);

  await client.query(
    `
      insert into offer_destinations (offer_id, country, region, city, is_primary, sort_order)
      values ($1, $2, nullif($3, ''), nullif($4, ''), true, 0)
    `,
    [offerId, offer.country || provider, offer.region || "", offer.city || ""]
  );

  await bulkQuery(
    client,
    "insert into offer_media (offer_id, url, alt, source, is_primary, sort_order) values",
    offer.media,
    (media, index) => [offerId, media.url, media.alt || offer.title, provider, index === 0, index]
  );

  await bulkQuery(
    client,
    `insert into offer_dates (
      offer_id, label, start_date, end_date, departure_points, availability,
      price_from, currency, seats_total, seats_available, notes, sort_order
    ) values`,
    offer.dates,
    (date, index) => [
      offerId,
      date.label || null,
      date.startDate,
      date.endDate,
      date.departurePoints || null,
      date.availability || "on_request",
      date.priceFrom,
      date.currency || offer.currency,
      date.seatsTotal,
      date.seatsAvailable,
      date.notes || null,
      index
    ]
  );

  await bulkQuery(
    client,
    "insert into offer_itinerary_days (offer_id, day_number, title, description, accommodation, meals, transport, sort_order) values",
    offer.itinerary,
    (day, index) => [offerId, day.dayNumber || index + 1, day.title || `Day ${index + 1}`, day.description || null, day.accommodation || null, day.meals || null, day.transport || null, index]
  );

  await bulkQuery(
    client,
    "insert into offer_highlights (offer_id, label, sort_order) values",
    offer.highlights,
    (highlight, index) => [offerId, highlight, index]
  );

  const services = [
    ...offer.includedServices.map((label, index) => ({ type: "included", label, sortOrder: index })),
    ...offer.excludedServices.map((label, index) => ({ type: "excluded", label, sortOrder: offer.includedServices.length + index }))
  ];
  await bulkQuery(
    client,
    "insert into offer_services (offer_id, service_type, label, sort_order) values",
    services,
    (service) => [offerId, service.type, service.label, service.sortOrder]
  );
}

export async function upsertSupplierOffer(client, inputOffer, options = {}) {
  const provider = normalizeProvider(options.provider || inputOffer.provider);
  const displayName = normalizeDisplayName(options.displayName, provider);
  const source = normalizeSource(options.source || inputOffer.source);
  const offer = normalizeOfferForStorage(inputOffer, provider);
  const checksum = createHash("sha256").update(stablePayload(offer.raw)).digest("hex");
  const existing = await client.query(
    `
      select import.offer_id, import.checksum, import.normalized_payload, offer.title, offer.price_from, offer.currency,
        offer.duration_days, offer.duration_nights, offer.transport, offer.reviewed_at
      from offer_imports import
      left join offers offer on offer.id = import.offer_id
      where import.provider = $1 and import.external_id = $2
      limit 1
    `,
    [provider, offer.externalId]
  );
  const existingRow = existing.rows[0] || null;
  const existingOfferId = existingRow?.offer_id || null;
  const isReviewed = Boolean(existingRow?.reviewed_at);
  const shouldForceRewrite = Boolean(options.force && existingOfferId);
  const changeState = shouldForceRewrite ? "changed" : existingRow?.checksum === checksum ? "unchanged" : existingOfferId ? "changed" : "new";
  const importantChanges = buildImportantChanges(existingRow, offer);
  let offerId = existingOfferId;

  if (offerId && changeState !== "unchanged") {
    await client.query(
      `
        update offers
        set product_type = case when reviewed_at is null then $2 else product_type end,
            product_type_label = case when reviewed_at is null then $3 else product_type_label end,
            title = case when reviewed_at is null then $4 else title end,
            summary = case when reviewed_at is null then $5 else summary end,
            description = case when reviewed_at is null then $6 else description end,
            country = case when reviewed_at is null then $7 else country end,
            region = case when reviewed_at is null then $8 else region end,
            city = case when reviewed_at is null then $9 else city end,
            duration_days = case when reviewed_at is null then $10 else duration_days end,
            duration_nights = case when reviewed_at is null then $11 else duration_nights end,
            transport = case when reviewed_at is null then $12 else transport end,
            price_from = case when reviewed_at is null then $13 else price_from end,
            currency = case when reviewed_at is null then $14 else currency end,
            hero_image_url = coalesce(hero_image_url, $15),
            source = $16,
            status = case when status = 'published' then 'review'::offer_status else status end,
            seo_meta_title = coalesce(seo_meta_title, $4),
            seo_meta_description = coalesce(seo_meta_description, $5),
            review_notes = $17,
            updated_at = now()
        where id = $1
      `,
      [
        offerId,
        offer.productType,
        offer.productTypeLabel,
        offer.title,
        offer.summary,
        offer.description,
        offer.country,
        offer.region,
        offer.city,
        offer.durationDays,
        offer.durationNights,
        offer.transport,
        offer.priceFrom,
        offer.currency,
        offer.heroImageUrl,
        source,
        `${displayName} sync: ${changeState}. Провери важните промени преди публикуване.`
      ]
    );
  } else if (!offerId) {
    const slug = await createUniqueOfferSlug(client, offer.title);
    const result = await client.query(
      `
        insert into offers (
          slug, product_type, product_type_label, title, summary, description,
          country, region, city, duration_days, duration_nights, transport,
          price_from, currency, hero_image_url, source, status, is_author_program,
          seo_meta_title, seo_meta_description, review_notes
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'review', false, $4, $5, $17)
        returning id
      `,
      [
        slug,
        offer.productType,
        offer.productTypeLabel,
        offer.title,
        offer.summary,
        offer.description,
        offer.country,
        offer.region,
        offer.city,
        offer.durationDays,
        offer.durationNights,
        offer.transport,
        offer.priceFrom,
        offer.currency,
        offer.heroImageUrl,
        source,
        `${displayName} import. Провери текстовете и визията преди публикуване.`
      ]
    );
    offerId = result.rows[0].id;
  }

  const importResult = await client.query(
    `
      insert into offer_imports (
        offer_id, provider, external_id, source, change_state, checksum,
        raw_payload, normalized_payload, important_changes, import_run_id, last_synced_at
      )
      values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb, $10, now())
      on conflict (provider, external_id)
      do update set
        offer_id = excluded.offer_id,
        source = excluded.source,
        change_state = excluded.change_state,
        checksum = excluded.checksum,
        raw_payload = excluded.raw_payload,
        normalized_payload = excluded.normalized_payload,
        important_changes = excluded.important_changes,
        import_run_id = excluded.import_run_id,
        last_synced_at = now()
      returning id
    `,
    [
      offerId,
      provider,
      offer.externalId,
      source,
      changeState,
      checksum,
      stablePayload(offer.raw),
      stablePayload(offer),
      stablePayload(importantChanges),
      options.importRunId || null
    ]
  );
  const importId = importResult.rows[0].id;

  if (changeState === "unchanged" && existingOfferId) {
    return { offerId, importId, externalId: offer.externalId, title: offer.title, changeState, importantChanges };
  }

  const previousEntities = await client.query(
    `
      select entity_type, coalesce(entity_key, '') as entity_key, is_enabled, editorial_title, editorial_url, editorial_data
      from supplier_import_entities
      where import_id = $1
    `,
    [importId]
  );
  const previousEntityReviewByKey = new Map(
    previousEntities.rows.map((row) => [`${row.entity_type}:${row.entity_key}`, row])
  );

  if (!isReviewed) {
    await replaceRelationsBulk(client, offerId, offer, provider);
  }
  await client.query("delete from supplier_import_entities where import_id = $1", [importId]);

  const entityRows = offer.supplierEntities.map((entity, index) => {
    const entityKey = entity.key || "";
    const previousReview = previousEntityReviewByKey.get(`${entity.type}:${entityKey}`);
    return {
      entity,
      entityKey,
      previousReview,
      sortOrder: entity.sortOrder ?? index
    };
  });
  await bulkQuery(
    client,
    `insert into supplier_import_entities (
      import_id, offer_id, import_run_id, provider, external_id, entity_type, entity_key, title, url,
      start_date, end_date, price, currency, sort_order, raw_data,
      is_enabled, editorial_title, editorial_url, editorial_data
    ) values`,
    entityRows,
    ({ entity, entityKey, previousReview, sortOrder }) => [
      importId,
      offerId,
      options.importRunId || null,
      provider,
      offer.externalId,
      entity.type,
      entityKey || null,
      entity.title || null,
      entity.url || null,
      entity.startDate || null,
      entity.endDate || null,
      entity.price ?? null,
      entity.currency || null,
      sortOrder,
      stablePayload(entity.raw),
      previousReview?.is_enabled ?? true,
      previousReview?.editorial_title || null,
      previousReview?.editorial_url || null,
      stablePayload(previousReview?.editorial_data)
    ]
  );

  return { offerId, importId, externalId: offer.externalId, title: offer.title, changeState, importantChanges };
}
