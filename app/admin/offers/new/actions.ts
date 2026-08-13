"use server";

import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminSessionCookieName, verifyAdminSessionToken } from "@/lib/adminSession";
import { dbQuery } from "@/lib/db";
import { createSlug } from "@/lib/slug";

type OfferProductType = "excursion" | "holiday" | "hotel" | "flight" | "service" | "package";
type OfferSource = "manual" | "xml" | "api" | "labeling" | "erp";
type TransportType = "flight" | "bus" | "own_transport" | "mixed";

type OfferDestinationInput = {
  country: string;
  region: string;
  city: string;
};

type OfferItineraryInput = {
  dayNumber: number;
  title: string;
  description: string;
  accommodation: string;
  meals: string;
  transport: string;
};

type ImportedOfferInput = {
  raw: Record<string, unknown>;
  externalId: string;
  title: string;
  summary: string | null;
  description: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  durationDays: number | null;
  durationNights: number | null;
  transport: TransportType;
  productType: OfferProductType;
  productTypeLabel: string | null;
  priceFrom: number | null;
  currency: "EUR" | "BGN";
  heroImageUrl: string | null;
  galleryImageUrls: string[];
  dates: Array<{
    label: string | null;
    startDate: string | null;
    endDate: string | null;
    departurePoints: string | null;
    availability: "available" | "limited" | "on_request" | "sold_out";
    priceFrom: number | null;
    currency: "EUR" | "BGN";
    notes: string | null;
  }>;
  itinerary: OfferItineraryInput[];
  highlights: string[];
  includedServices: string[];
  excludedServices: string[];
};

const productTypeMap: Record<string, OfferProductType> = {
  excursion: "excursion",
  holiday: "holiday",
  hotel: "hotel",
  flight: "flight",
  service: "service",
  package: "package",
  cruise: "package"
};

const sourceMap: Record<string, OfferSource> = {
  manual: "manual",
  xml: "xml",
  api: "api",
  erp: "erp",
  other: "manual"
};

const transportMap: Record<string, TransportType> = {
  flight: "flight",
  bus: "bus",
  own_transport: "own_transport",
  mixed: "mixed"
};

async function requireAdminSession() {
  const cookieStore = await cookies();
  const session = await verifyAdminSessionToken(cookieStore.get(adminSessionCookieName)?.value);

  if (!session) {
    redirect("/admin/login?next=/admin/offers/new");
  }
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readInteger(formData: FormData, key: string) {
  const value = Number.parseInt(readString(formData, key), 10);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function readStringList(formData: FormData, key: string) {
  return formData.getAll(key).map((value) => (typeof value === "string" ? value.trim() : ""));
}

function readDestinations(formData: FormData): OfferDestinationInput[] {
  const countries = readStringList(formData, "destination_country");
  const regions = readStringList(formData, "destination_region");
  const cities = readStringList(formData, "destination_city");
  const rowCount = Math.max(countries.length, regions.length, cities.length);
  const destinations: OfferDestinationInput[] = [];

  for (let index = 0; index < rowCount; index += 1) {
    const country = countries[index] ?? "";
    const region = regions[index] ?? "";
    const city = cities[index] ?? "";

    if (!country && !region && !city) {
      continue;
    }

    destinations.push({
      country: country || "Дестинация",
      region,
      city
    });
  }

  return destinations;
}

function readItinerary(formData: FormData): OfferItineraryInput[] {
  const dayNumbers = readStringList(formData, "itinerary_day_number");
  const titles = readStringList(formData, "itinerary_title");
  const descriptions = readStringList(formData, "itinerary_description");
  const accommodations = readStringList(formData, "itinerary_accommodation");
  const meals = readStringList(formData, "itinerary_meals");
  const transports = readStringList(formData, "itinerary_transport");

  return titles
    .map((title, index) => ({
      dayNumber: Number.parseInt(dayNumbers[index] || `${index + 1}`, 10),
      title,
      description: descriptions[index] || "",
      accommodation: accommodations[index] || "",
      meals: meals[index] || "",
      transport: transports[index] || ""
    }))
    .filter((day) => day.title || day.description || day.accommodation || day.meals || day.transport);
}

function readServices(formData: FormData, key: string) {
  return readStringList(formData, key).filter(Boolean);
}

function redirectWithImportError(source: string, message: string): never {
  redirect(`/admin/offers/new?source=${encodeURIComponent(source)}&error=${encodeURIComponent(message)}`);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function firstRecordValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) {
      return record[key];
    }
  }

  return undefined;
}

function firstString(record: Record<string, unknown>, keys: string[]) {
  const value = firstRecordValue(record, keys);

  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);

  return "";
}

function toInteger(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value !== "string") return null;

  const parsed = Number.parseInt(value.replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function toMoney(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;

  const normalized = value.replace(/\s/g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function toCurrency(value: unknown): "EUR" | "BGN" {
  const currency = typeof value === "string" ? value.trim().toUpperCase() : "";
  return currency === "BGN" ? "BGN" : "EUR";
}

function toDateString(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;

  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const parsed = new Date(trimmed);
  if (!Number.isFinite(parsed.getTime())) return null;

  return parsed.toISOString().slice(0, 10);
}

function toStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => typeof item === "string" ? item.trim() : asRecord(item) ? firstString(asRecord(item)!, ["label", "name", "title", "text", "url"]) : "")
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|;|\|/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function findArrayPayload(payload: unknown) {
  if (Array.isArray(payload)) return payload;

  const record = asRecord(payload);
  if (!record) return [];

  for (const key of ["offers", "data", "items", "results", "products", "trips"]) {
    const value = record[key];
    if (Array.isArray(value)) return value;
  }

  return [record];
}

function normalizeProductType(value: string): OfferProductType {
  const normalized = value.toLocaleLowerCase("bg-BG");
  if (["excursion", "екскурзия", "tour", "trip"].includes(normalized)) return "excursion";
  if (["holiday", "почивка", "vacation"].includes(normalized)) return "holiday";
  if (["hotel", "хотел"].includes(normalized)) return "hotel";
  if (["flight", "полет", "самолет"].includes(normalized)) return "flight";
  if (["service", "услуга"].includes(normalized)) return "service";
  return "package";
}

function normalizeTransport(value: string): TransportType {
  const normalized = value.toLocaleLowerCase("bg-BG");
  if (["flight", "plane", "air", "самолет", "полет"].includes(normalized)) return "flight";
  if (["bus", "coach", "автобус"].includes(normalized)) return "bus";
  if (["own_transport", "own", "собствен", "собствен транспорт"].includes(normalized)) return "own_transport";
  return "mixed";
}

function normalizeAvailability(value: unknown): "available" | "limited" | "on_request" | "sold_out" {
  const normalized = typeof value === "string" ? value.toLocaleLowerCase("bg-BG") : "";
  if (["available", "свободни", "yes", "true"].includes(normalized)) return "available";
  if (["limited", "малко", "few"].includes(normalized)) return "limited";
  if (["sold_out", "soldout", "full", "няма места"].includes(normalized)) return "sold_out";
  return "on_request";
}

function normalizeImportedOffer(value: unknown, index: number): ImportedOfferInput | null {
  const record = asRecord(value);
  if (!record) return null;

  const checksum = createHash("sha256").update(JSON.stringify(record)).digest("hex");
  const title = firstString(record, ["title", "name", "offer_title", "program", "hotel_name"]) || `Импортирана оферта ${index + 1}`;
  const externalId = firstString(record, ["external_id", "externalId", "id", "code", "offer_id", "product_id"]) || checksum.slice(0, 16);
  const priceFrom = toMoney(firstRecordValue(record, ["price_from", "priceFrom", "price", "amount", "base_price"]));
  const productTypeText = firstString(record, ["product_type", "productType", "type", "category"]);
  const transportText = firstString(record, ["transport", "transport_type", "transportType"]);
  const imageValues = [
    ...toStringArray(firstRecordValue(record, ["images", "gallery", "gallery_image_urls"])),
    firstString(record, ["hero_image_url", "heroImage", "image", "main_image", "photo"])
  ].filter(Boolean);
  const dateValues = firstRecordValue(record, ["dates", "departures", "departure_dates"]);
  const dates = Array.isArray(dateValues)
    ? dateValues.map((dateValue, dateIndex) => {
        const dateRecord = asRecord(dateValue);
        if (!dateRecord) {
          const date = toDateString(dateValue);

          return {
            label: date || `Дата ${dateIndex + 1}`,
            startDate: date,
            endDate: null,
            departurePoints: null,
            availability: "on_request" as const,
            priceFrom: null,
            currency: "EUR" as const,
            notes: null
          };
        }

        return {
          label: firstString(dateRecord, ["label", "name"]) || null,
          startDate: toDateString(firstRecordValue(dateRecord, ["start_date", "startDate", "from", "date", "departure_date"])),
          endDate: toDateString(firstRecordValue(dateRecord, ["end_date", "endDate", "to", "return_date"])),
          departurePoints: firstString(dateRecord, ["departure_points", "departurePoints", "departure_city", "departure"]) || null,
          availability: normalizeAvailability(firstRecordValue(dateRecord, ["availability", "status"])),
          priceFrom: toMoney(firstRecordValue(dateRecord, ["price_from", "priceFrom", "price", "amount"])),
          currency: toCurrency(firstRecordValue(dateRecord, ["currency"])),
          notes: firstString(dateRecord, ["notes", "note", "comment"]) || null
        };
      })
    : [];
  const itineraryValues = firstRecordValue(record, ["itinerary", "program_days", "program", "days"]);
  const itinerary = Array.isArray(itineraryValues)
    ? itineraryValues
        .map((dayValue, dayIndex) => {
          const dayRecord = asRecord(dayValue);
          if (!dayRecord) return null;

          return {
            dayNumber: toInteger(firstRecordValue(dayRecord, ["day", "day_number", "dayNumber"])) || dayIndex + 1,
            title: firstString(dayRecord, ["title", "name"]) || `Ден ${dayIndex + 1}`,
            description: firstString(dayRecord, ["description", "text", "body", "program"]) || "",
            accommodation: firstString(dayRecord, ["accommodation", "hotel", "hotel_category", "lodging"]) || "",
            meals: firstString(dayRecord, ["meals", "meal_plan", "food", "board"]) || "",
            transport: firstString(dayRecord, ["transport", "transfer", "vehicle"]) || ""
          };
        })
        .filter((day): day is OfferItineraryInput => Boolean(day))
    : [];

  return {
    raw: record,
    externalId,
    title,
    summary: firstString(record, ["summary", "short_description", "shortDescription", "subtitle"]) || null,
    description: firstString(record, ["description", "full_description", "fullDescription", "content"]) || null,
    country: firstString(record, ["country", "destination_country"]) || null,
    region: firstString(record, ["region", "destination", "destination_name"]) || null,
    city: firstString(record, ["city", "town", "resort"]) || null,
    durationDays: toInteger(firstRecordValue(record, ["duration_days", "durationDays", "days", "duration"])),
    durationNights: toInteger(firstRecordValue(record, ["duration_nights", "durationNights", "nights"])),
    transport: normalizeTransport(transportText),
    productType: normalizeProductType(productTypeText),
    productTypeLabel: productTypeText || null,
    priceFrom,
    currency: toCurrency(firstRecordValue(record, ["currency"])),
    heroImageUrl: imageValues[0] || null,
    galleryImageUrls: imageValues.slice(1, 21),
    dates,
    itinerary,
    highlights: toStringArray(firstRecordValue(record, ["highlights", "why_like", "whyLike", "experiences"])).slice(0, 5),
    includedServices: toStringArray(firstRecordValue(record, ["included", "included_services", "includes", "price_includes"])),
    excludedServices: toStringArray(firstRecordValue(record, ["excluded", "excluded_services", "excludes", "not_included"]))
  };
}

async function replaceImportedOfferRelations(offerId: string, offer: ImportedOfferInput) {
  await dbQuery("delete from offer_dates where offer_id = $1", [offerId]);
  await dbQuery("delete from offer_media where offer_id = $1", [offerId]);
  await dbQuery("delete from offer_destinations where offer_id = $1", [offerId]);
  await dbQuery("delete from offer_itinerary_days where offer_id = $1", [offerId]);
  await dbQuery("delete from offer_highlights where offer_id = $1", [offerId]);
  await dbQuery("delete from offer_services where offer_id = $1", [offerId]);

  if (offer.country || offer.region || offer.city) {
    await dbQuery(
      `
        insert into offer_destinations (offer_id, country, region, city, is_primary, sort_order)
        values ($1, $2, nullif($3, ''), nullif($4, ''), true, 0)
      `,
      [offerId, offer.country || "Дестинация", offer.region || "", offer.city || ""]
    );
  }

  const mediaRows = [
    ...(offer.heroImageUrl ? [{ url: offer.heroImageUrl, alt: offer.title, isPrimary: true, sortOrder: 0 }] : []),
    ...offer.galleryImageUrls.map((url, index) => ({ url, alt: `${offer.title} - снимка ${index + 1}`, isPrimary: false, sortOrder: index + 1 }))
  ];

  for (const media of mediaRows) {
    await dbQuery(
      `
        insert into offer_media (offer_id, url, alt, source, is_primary, sort_order)
        values ($1, $2, $3, 'import', $4, $5)
      `,
      [offerId, media.url, media.alt, media.isPrimary, media.sortOrder]
    );
  }

  for (const [index, date] of offer.dates.entries()) {
    await dbQuery(
      `
        insert into offer_dates (
          offer_id, label, start_date, end_date, departure_points, availability,
          price_from, currency, notes, sort_order
        )
        values ($1, nullif($2, ''), $3, $4, nullif($5, ''), $6, $7, $8, nullif($9, ''), $10)
      `,
      [offerId, date.label || "", date.startDate, date.endDate, date.departurePoints || "", date.availability, date.priceFrom, date.currency, date.notes || "", index]
    );
  }

  for (const [index, day] of offer.itinerary.entries()) {
    await dbQuery(
      `
        insert into offer_itinerary_days (offer_id, day_number, title, description, accommodation, meals, transport, sort_order)
        values ($1, $2, $3, nullif($4, ''), nullif($5, ''), nullif($6, ''), nullif($7, ''), $8)
      `,
      [offerId, day.dayNumber, day.title, day.description, day.accommodation, day.meals, day.transport, index]
    );
  }

  for (const [index, highlight] of offer.highlights.entries()) {
    await dbQuery(
      `
        insert into offer_highlights (offer_id, label, sort_order)
        values ($1, $2, $3)
      `,
      [offerId, highlight, index]
    );
  }

  const serviceRows = [
    ...offer.includedServices.map((label, index) => ({ serviceType: "included", label, sortOrder: index })),
    ...offer.excludedServices.map((label, index) => ({ serviceType: "excluded", label, sortOrder: index }))
  ];

  for (const service of serviceRows) {
    await dbQuery(
      `
        insert into offer_services (offer_id, service_type, label, sort_order)
        values ($1, $2, $3, $4)
      `,
      [offerId, service.serviceType, service.label, service.sortOrder]
    );
  }
}

async function upsertImportedOffer(provider: string, source: OfferSource, offer: ImportedOfferInput) {
  const checksum = createHash("sha256").update(JSON.stringify(offer.raw)).digest("hex");
  const existingImport = await dbQuery<{ offer_id: string | null; checksum: string | null }>(
    "select offer_id, checksum from offer_imports where provider = $1 and external_id = $2 limit 1",
    [provider, offer.externalId]
  );
  const existingOfferId = existingImport.rows[0]?.offer_id || null;
  const changeState = existingImport.rows[0]?.checksum === checksum ? "unchanged" : existingOfferId ? "changed" : "new";

  let offerId = existingOfferId;
  const nextSlug = await createUniqueOfferSlug(offer.title);

  if (offerId) {
    await dbQuery(
      `
        update offers
        set
          product_type = $2,
          product_type_label = $3,
          title = $4,
          summary = $5,
          description = $6,
          country = $7,
          region = $8,
          city = $9,
          duration_days = $10,
          duration_nights = $11,
          transport = $12,
          price_from = $13,
          currency = $14,
          source = $15,
          status = case when status = 'published' then 'review'::offer_status else status end,
          hero_image_url = $16,
          seo_meta_title = $4,
          seo_meta_description = $5,
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
        source,
        offer.heroImageUrl,
        `Импортирана оферта от ${provider}. Статус на промяната: ${changeState}.`
      ]
    );
  } else {
    const insertResult = await dbQuery<{ id: string }>(
      `
        insert into offers (
          slug,
          product_type,
          product_type_label,
          title,
          summary,
          description,
          country,
          region,
          city,
          duration_days,
          duration_nights,
          transport,
          price_from,
          currency,
          source,
          status,
          hero_image_url,
          is_author_program,
          seo_meta_title,
          seo_meta_description,
          review_notes
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'review', $16, false, $4, $5, $17)
        returning id
      `,
      [
        nextSlug,
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
        source,
        offer.heroImageUrl,
        `Импортирана оферта от ${provider}. Очаква преглед преди публикуване.`
      ]
    );

    offerId = insertResult.rows[0].id;
  }

  await replaceImportedOfferRelations(offerId, offer);
  await dbQuery(
    `
      insert into offer_imports (offer_id, provider, external_id, source, change_state, checksum, raw_payload, last_synced_at)
      values ($1, $2, $3, $4, $5, $6, $7::jsonb, now())
      on conflict (provider, external_id)
      do update set
        offer_id = excluded.offer_id,
        source = excluded.source,
        change_state = excluded.change_state,
        checksum = excluded.checksum,
        raw_payload = excluded.raw_payload,
        last_synced_at = now()
    `,
    [offerId, provider, offer.externalId, source, changeState, checksum, JSON.stringify(offer.raw)]
  );
}

async function importPayloadIntoSystem(payload: unknown, provider: string, source: OfferSource) {
  const normalizedProvider = provider || "RedTours import";
  const items = findArrayPayload(payload).map(normalizeImportedOffer).filter((offer): offer is ImportedOfferInput => Boolean(offer));

  if (items.length === 0) {
    throw new Error("Не открих оферти в подадените данни.");
  }

  for (const offer of items.slice(0, 100)) {
    await upsertImportedOffer(normalizedProvider, source, offer);
  }

  revalidatePath("/admin/offers");
  return items.length;
}

async function createUniqueOfferSlug(title: string) {
  const baseSlug = createSlug(title);

  for (let index = 0; index < 50; index += 1) {
    const candidate = index === 0 ? baseSlug : `${baseSlug}-${index + 1}`;
    const existing = await dbQuery("select 1 from offers where slug = $1 limit 1", [candidate]);

    if (existing.rows.length === 0) {
      return candidate;
    }
  }

  return `${baseSlug}-${Date.now()}`;
}

export async function createBlankAdminOffer() {
  await requireAdminSession();

  const createdAt = new Date();
  const slug = await createUniqueOfferSlug(`nova-oferta-${createdAt.getTime()}`);

  const result = await dbQuery<{ id: string }>(
    `
      insert into offers (
        slug,
        product_type,
        product_type_label,
        title,
        summary,
        description,
        duration_days,
        duration_nights,
        transport,
        source,
        status,
        is_author_program,
        seo_meta_title,
        review_notes
      )
      values ($1, 'package', null, '', '', '', null, null, 'mixed', 'manual', 'draft', false, null, $2)
      returning id
    `,
    [slug, "[new-offer-draft] Създадена е празна чернова. Всички промени в редактора се записват автоматично."]
  );

  return result.rows[0].id;
}

export async function startBlankAdminOffer() {
  const offerId = await createBlankAdminOffer();

  redirect(`/admin/offers/${offerId}?tab=offer&new=1`);
}

export async function importJsonOffers(formData: FormData) {
  await requireAdminSession();

  const provider = readString(formData, "provider") || "JSON import";
  const rawPayload = readString(formData, "payload");

  if (!rawPayload) {
    redirectWithImportError("json", "Постави JSON payload, за да се създадат оферти.");
  }

  try {
    const payload = JSON.parse(rawPayload);
    const importedCount = await importPayloadIntoSystem(payload, provider, "labeling");

    redirect(`/admin/offers?imported=${importedCount}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "JSON импортът не беше успешен.";
    redirectWithImportError("json", message);
  }
}

export async function createAdminOffer(formData: FormData) {
  await requireAdminSession();

  const submittedTitle = readString(formData, "title");
  const shouldExitAfterSave = readString(formData, "after_save") === "admin_offers";
  const title = submittedTitle || `Нова чернова ${new Date().toLocaleString("bg-BG")}`;

  const shortTitle = readString(formData, "short_title");
  const summary = readString(formData, "summary");
  const description = readString(formData, "description");
  const destinations = readDestinations(formData);
  const primaryDestination = destinations[0];
  const country = primaryDestination?.country || readString(formData, "country");
  const region = primaryDestination?.region || primaryDestination?.city || readString(formData, "region");
  const durationDays = readInteger(formData, "duration_days");
  const durationNights = readInteger(formData, "duration_nights");
  const productType = productTypeMap[readString(formData, "product_type")] ?? "package";
  const productTypeLabel = readString(formData, "product_type_label") || null;
  const source = sourceMap[readString(formData, "source")] ?? "manual";
  const transport = transportMap[readString(formData, "transport")] ?? "mixed";
  const isAuthorProgram = readString(formData, "is_author_program") !== "no";
  const itineraryRows = readItinerary(formData);
  const highlights = readStringList(formData, "highlights").filter(Boolean).slice(0, 5);
  const includedServices = readServices(formData, "included_services");
  const excludedServices = readServices(formData, "excluded_services");
  const slug = await createUniqueOfferSlug(title);
  const heroImageUrl = readString(formData, "hero_image_url") || null;
  const galleryImageUrls = formData
    .getAll("gallery_image_urls")
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .slice(0, 20);

  const insertResult = await dbQuery<{ id: string }>(
    `
      insert into offers (
        slug,
        product_type,
        product_type_label,
        title,
        summary,
        description,
        country,
        region,
        duration_days,
        duration_nights,
        transport,
        source,
        status,
        hero_image_url,
        is_author_program,
        seo_meta_title,
        seo_meta_description,
        review_notes
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'draft', $13, $14, $15, $16, $17)
      returning id
    `,
    [
      slug,
      productType,
      productTypeLabel,
      title,
      summary || shortTitle || null,
      description || null,
      country || null,
      region || null,
      durationDays,
      durationNights,
      transport,
      source,
      heroImageUrl,
      isAuthorProgram,
      title,
      summary || null,
      "Създадена през ERP формата за нова оферта."
    ]
  );
  const offerId = insertResult.rows[0].id;

  const mediaRows = [
    ...(heroImageUrl ? [{ url: heroImageUrl, alt: title, isPrimary: true, sortOrder: 0 }] : []),
    ...galleryImageUrls
      .filter((url): url is string => Boolean(url))
      .map((url, index) => ({ url, alt: `${title} - снимка ${index + 1}`, isPrimary: false, sortOrder: index + 1 }))
  ];

  for (const media of mediaRows) {
    await dbQuery(
      `
        insert into offer_media (offer_id, url, alt, source, is_primary, sort_order)
        values ($1, $2, $3, 'redtours', $4, $5)
      `,
      [offerId, media.url, media.alt, media.isPrimary, media.sortOrder]
    );
  }

  const destinationRows = destinations.length > 0
    ? destinations
    : country || region
      ? [{ country: country || "Дестинация", region, city: "" }]
      : [];

  for (const [index, destination] of destinationRows.entries()) {
    await dbQuery(
      `
        insert into offer_destinations (offer_id, country, region, city, is_primary, sort_order)
        values ($1, $2, nullif($3, ''), nullif($4, ''), $5, $6)
      `,
      [offerId, destination.country, destination.region, destination.city, index === 0, index]
    );
  }

  for (const [index, day] of itineraryRows.entries()) {
    await dbQuery(
      `
        insert into offer_itinerary_days (offer_id, day_number, title, description, accommodation, meals, transport, sort_order)
        values ($1, $2, $3, nullif($4, ''), nullif($5, ''), nullif($6, ''), nullif($7, ''), $8)
      `,
      [offerId, Number.isFinite(day.dayNumber) && day.dayNumber > 0 ? day.dayNumber : index + 1, day.title || `Ден ${index + 1}`, day.description, day.accommodation, day.meals, day.transport, index]
    );
  }

  for (const [index, highlight] of highlights.entries()) {
    await dbQuery(
      `
        insert into offer_highlights (offer_id, label, sort_order)
        values ($1, $2, $3)
      `,
      [offerId, highlight, index]
    );
  }

  const serviceRows = [
    ...includedServices.map((label, index) => ({ type: "included", label, sortOrder: index })),
    ...excludedServices.map((label, index) => ({ type: "excluded", label, sortOrder: index }))
  ];

  for (const service of serviceRows) {
    await dbQuery(
      `
        insert into offer_services (offer_id, service_type, label, sort_order)
        values ($1, $2, $3, $4)
      `,
      [offerId, service.type, service.label, service.sortOrder]
    );
  }

  redirect(shouldExitAfterSave ? "/admin/offers" : `/admin/offers/${slug}?tab=dates-prices`);
}
