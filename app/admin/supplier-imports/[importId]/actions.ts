"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { adminSessionCookieName, verifyAdminSessionToken } from "@/lib/adminSession";
import { dbQuery, getDbPool } from "@/lib/db";

async function requireAdminSession(importId: string) {
  const cookieStore = await cookies();
  const session = await verifyAdminSessionToken(cookieStore.get(adminSessionCookieName)?.value);

  if (!session) {
    redirect(`/admin/login?next=/admin/supplier-imports/${importId}`);
  }
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readStringList(formData: FormData, key: string) {
  return formData.getAll(key).filter((value): value is string => typeof value === "string").map((value) => value.trim()).filter(Boolean);
}

function readInteger(formData: FormData, key: string, fallback: number) {
  const value = Number.parseInt(readString(formData, key), 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function readOptionalInteger(formData: FormData, key: string) {
  const raw = readString(formData, key);
  if (!raw) return null;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function readOptionalNumber(formData: FormData, key: string) {
  const raw = readString(formData, key).replace(",", ".");
  if (!raw) return null;
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

type DbClient = {
  query: (text: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
};

function objectValue(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function textFromHtml(value: unknown) {
  if (typeof value !== "string") return "";

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

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function dateValue(value: unknown) {
  const text = stringValue(value);
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : null;
}

function currencyValue(value: unknown) {
  return stringValue(value) === "BGN" ? "BGN" : "EUR";
}

function availabilityValue(value: unknown) {
  const status = stringValue(value);
  if (status === "available" || status === "limited" || status === "sold_out") return status;
  return "on_request";
}

async function applyEnabledImagesToOffer(client: DbClient, importId: string, offerId: string, title: string) {
  const images = await client.query(
    `
      select
        coalesce(nullif(editorial_url, ''), url) as url,
        title,
        editorial_title,
        sort_order
      from supplier_import_entities
      where import_id = $1
        and offer_id = $2
        and entity_type = 'image'
        and is_enabled = true
        and coalesce(nullif(editorial_url, ''), url) is not null
      order by sort_order, created_at
      limit 24
    `,
    [importId, offerId]
  );

  await client.query("delete from offer_media where offer_id = $1 and source = 'bohemia'", [offerId]);

  for (const [index, image] of images.rows.entries()) {
    await client.query(
      `
        insert into offer_media (offer_id, url, alt, source, is_primary, sort_order)
        values ($1, $2, $3, 'bohemia', $4, $5)
      `,
      [offerId, String(image.url), String(image.editorial_title || image.title || title), index === 0, index]
    );
  }

  await client.query(
    `
      update offers
      set hero_image_url = coalesce($2, hero_image_url),
          updated_at = now()
      where id = $1
    `,
    [offerId, images.rows[0]?.url || null]
  );
}

async function applyEnabledItineraryToOffer(client: DbClient, importId: string, offerId: string) {
  const days = await client.query(
    `
      select
        title,
        editorial_title,
        editorial_data,
        raw_data,
        sort_order
      from supplier_import_entities
      where import_id = $1
        and offer_id = $2
        and entity_type = 'itinerary_day'
        and is_enabled = true
      order by sort_order, created_at
      limit 80
    `,
    [importId, offerId]
  );

  await client.query("delete from offer_itinerary_days where offer_id = $1", [offerId]);

  for (const [index, row] of days.rows.entries()) {
    const raw = objectValue(row.raw_data);
    const editorial = objectValue(row.editorial_data);
    const dayNumber = numberValue(editorial.dayNumber) || numberValue(raw.dayNumber) || index + 1;
    const title = textFromHtml(row.editorial_title) || textFromHtml(editorial.title) || textFromHtml(raw.title) || `Ден ${dayNumber}`;
    const description = textFromHtml(editorial.description) || textFromHtml(editorial.descriptionHtml) || textFromHtml(raw.description);

    await client.query(
      `
        insert into offer_itinerary_days (offer_id, day_number, title, description, accommodation, meals, transport, sort_order)
        values ($1, $2, $3, nullif($4, ''), nullif($5, ''), nullif($6, ''), nullif($7, ''), $8)
      `,
      [
        offerId,
        dayNumber,
        title,
        description,
        textFromHtml(editorial.accommodation) || textFromHtml(raw.accommodation),
        textFromHtml(editorial.meals) || textFromHtml(raw.meals),
        textFromHtml(editorial.transport) || textFromHtml(raw.transport),
        index
      ]
    );
  }
}

async function applyEnabledServicesToOffer(client: DbClient, importId: string, offerId: string) {
  const services = await client.query(
    `
      select
        title,
        editorial_title,
        editorial_data,
        raw_data,
        sort_order
      from supplier_import_entities
      where import_id = $1
        and offer_id = $2
        and entity_type = 'service'
        and is_enabled = true
      order by sort_order, created_at
      limit 120
    `,
    [importId, offerId]
  );

  await client.query("delete from offer_services where offer_id = $1", [offerId]);

  const counters = { included: 0, excluded: 0 };
  for (const row of services.rows) {
    const raw = objectValue(row.raw_data);
    const editorial = objectValue(row.editorial_data);
    const serviceType = stringValue(editorial.serviceType) === "excluded" || stringValue(raw.serviceType) === "excluded" ? "excluded" : "included";
    const label = textFromHtml(row.editorial_title) || textFromHtml(row.title) || textFromHtml(raw.label);

    if (!label) continue;

    await client.query(
      `
        insert into offer_services (offer_id, service_type, label, sort_order)
        values ($1, $2, $3, $4)
      `,
      [offerId, serviceType, label, counters[serviceType]]
    );
    counters[serviceType] += 1;
  }
}

async function applyEnabledDeparturesToOffer(client: DbClient, importId: string, offerId: string) {
  const departures = await client.query(
    `
      select
        title,
        editorial_title,
        editorial_data,
        raw_data,
        start_date,
        end_date,
        price,
        currency,
        sort_order
      from supplier_import_entities
      where import_id = $1
        and offer_id = $2
        and entity_type = 'departure'
        and is_enabled = true
      order by sort_order, created_at
      limit 120
    `,
    [importId, offerId]
  );

  if (!departures.rows.length) return;

  await client.query("delete from offer_dates where offer_id = $1", [offerId]);

  for (const [index, row] of departures.rows.entries()) {
    const raw = objectValue(row.raw_data);
    const editorial = objectValue(row.editorial_data);
    const label = textFromHtml(row.editorial_title) || textFromHtml(row.title) || textFromHtml(raw.label) || `Отпътуване ${index + 1}`;
    const startDate = dateValue(editorial.startDate) || dateValue(row.start_date) || dateValue(raw.startDate);
    const endDate = dateValue(editorial.endDate) || dateValue(row.end_date) || dateValue(raw.endDate);
    const price = numberValue(editorial.priceFrom) ?? numberValue(row.price) ?? numberValue(raw.priceFrom);
    const seatsTotal = numberValue(editorial.seatsTotal) ?? numberValue(raw.seatsTotal);
    const seatsAvailable = numberValue(editorial.seatsAvailable) ?? numberValue(raw.seatsAvailable);

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
        label,
        startDate,
        endDate,
        textFromHtml(editorial.departurePoints) || textFromHtml(raw.departurePoints),
        availabilityValue(editorial.availability || raw.availability),
        price,
        currencyValue(editorial.currency || row.currency),
        seatsTotal,
        seatsAvailable,
        textFromHtml(editorial.notes) || textFromHtml(raw.notes),
        index
      ]
    );
  }
}

export async function saveSupplierImportReview(importId: string, formData: FormData) {
  await requireAdminSession(importId);

  const title = readString(formData, "title");
  const summary = readString(formData, "summary");
  const description = readString(formData, "description");
  const seoTitle = readString(formData, "seo_title");
  const seoDescription = readString(formData, "seo_description");
  const enabledEntityIds = new Set(readStringList(formData, "enabled_entity_ids"));
  const entityIds = readStringList(formData, "entity_ids");

  const pool = getDbPool() as unknown as {
    connect: () => Promise<{
      query: (text: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
      release: () => void;
    }>;
  };
  const client = await pool.connect();

  try {
    await client.query("begin");

    const importResult = await client.query("select offer_id from offer_imports where id = $1 limit 1", [importId]);
    const offerId = typeof importResult.rows[0]?.offer_id === "string" ? importResult.rows[0].offer_id : "";

    if (!offerId) {
      throw new Error("Интегрираната оферта няма свързана публична оферта.");
    }

    await client.query(
      `
        update offers
        set title = nullif($2, ''),
            summary = nullif($3, ''),
            description = nullif($4, ''),
            seo_meta_title = nullif($5, ''),
            seo_meta_description = nullif($6, ''),
            review_notes = 'Supplier review layer saved. Публикувай само след човешки преглед.',
            reviewed_at = coalesce(reviewed_at, now()),
            updated_at = now()
        where id = $1
      `,
      [offerId, title, summary, description, seoTitle || title, seoDescription || summary]
    );

    for (const [index, entityId] of entityIds.entries()) {
      const descriptionMode = readString(formData, `entity_description_mode_${entityId}`) === "html" ? "html" : "text";
      const descriptionInput = readString(formData, `entity_description_${entityId}`);
      const serviceType = readString(formData, `entity_service_type_${entityId}`) === "excluded" ? "excluded" : "included";
      const entityTitle = textFromHtml(readString(formData, `entity_title_${entityId}`));
      const editorialData = {
        title: entityTitle,
        text: entityTitle,
        url: readString(formData, `entity_url_${entityId}`),
        dayNumber: readInteger(formData, `entity_day_number_${entityId}`, index + 1),
        description: textFromHtml(descriptionInput),
        descriptionHtml: descriptionMode === "html" ? descriptionInput : "",
        descriptionMode,
        serviceType,
        accommodation: textFromHtml(readString(formData, `entity_accommodation_${entityId}`)),
        meals: textFromHtml(readString(formData, `entity_meals_${entityId}`)),
        transport: textFromHtml(readString(formData, `entity_transport_${entityId}`)),
        startDate: readString(formData, `entity_start_date_${entityId}`),
        endDate: readString(formData, `entity_end_date_${entityId}`),
        priceFrom: readOptionalNumber(formData, `entity_price_${entityId}`),
        currency: currencyValue(readString(formData, `entity_currency_${entityId}`)),
        seatsTotal: readOptionalInteger(formData, `entity_seats_total_${entityId}`),
        seatsAvailable: readOptionalInteger(formData, `entity_seats_available_${entityId}`),
        availability: availabilityValue(readString(formData, `entity_availability_${entityId}`)),
        departurePoints: textFromHtml(readString(formData, `entity_departure_points_${entityId}`)),
        notes: textFromHtml(readString(formData, `entity_notes_${entityId}`)),
        category: textFromHtml(readString(formData, `entity_category_${entityId}`)),
        rooms: textFromHtml(readString(formData, `entity_rooms_${entityId}`))
      };

      await client.query(
        `
          update supplier_import_entities
          set is_enabled = $3,
              editorial_title = nullif($4, ''),
              editorial_url = nullif($5, ''),
              sort_order = $6,
              editorial_data = case
                when entity_type in (
                  'itinerary_day', 'service', 'departure', 'hotel',
                  'additional_service', 'useful_info', 'payment_policy', 'cancel_policy', 'insurance'
                ) then $7::jsonb
                else editorial_data
              end,
              updated_at = now()
          where id = $1
            and import_id = $2
        `,
        [
          entityId,
          importId,
          enabledEntityIds.has(entityId),
          entityTitle,
          readString(formData, `entity_url_${entityId}`),
          index,
          JSON.stringify(editorialData)
        ]
      );
    }

    await applyEnabledImagesToOffer(client, importId, offerId, title);
    await applyEnabledDeparturesToOffer(client, importId, offerId);
    await applyEnabledItineraryToOffer(client, importId, offerId);
    await applyEnabledServicesToOffer(client, importId, offerId);

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }

  revalidatePath(`/admin/supplier-imports/${importId}`);
  revalidatePath("/admin/supplier-imports");
  revalidatePath("/admin/offers");
}

export async function publishSupplierImport(importId: string, formData: FormData) {
  await saveSupplierImportReview(importId, formData);

  const result = await dbQuery<{ offer_id: string | null; slug: string | null }>(
    `
      select import.offer_id, offer.slug
      from offer_imports import
      left join offers offer on offer.id = import.offer_id
      where import.id = $1
      limit 1
    `,
    [importId]
  );
  const row = result.rows[0];

  if (row?.offer_id) {
    await dbQuery(
      `
        update offers
        set status = 'published',
            reviewed_at = now(),
            updated_at = now()
        where id = $1
      `,
      [row.offer_id]
    );
  }

  revalidatePath(`/admin/supplier-imports/${importId}`);
  revalidatePath("/admin/supplier-imports");
  revalidatePath("/admin/offers");
  if (row?.slug) revalidatePath(`/offers/${row.slug}`);
  redirect(`/admin/supplier-imports/${importId}?published=1`);
}
