"use server";

import { cookies } from "next/headers";
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

  return titles
    .map((title, index) => ({
      dayNumber: Number.parseInt(dayNumbers[index] || `${index + 1}`, 10),
      title,
      description: descriptions[index] || ""
    }))
    .filter((day) => day.title || day.description);
}

function readServices(formData: FormData, key: string) {
  return readStringList(formData, key).filter(Boolean);
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
        insert into offer_itinerary_days (offer_id, day_number, title, description, sort_order)
        values ($1, $2, $3, nullif($4, ''), $5)
      `,
      [offerId, Number.isFinite(day.dayNumber) && day.dayNumber > 0 ? day.dayNumber : index + 1, day.title || `Ден ${index + 1}`, day.description, index]
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
