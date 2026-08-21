import { getPublishedOfferBySlug, getPublishedOffers, offers } from "./data";
import { dbQuery } from "./db";
import { displayCountryName, displayCurrency } from "./countryDisplay";
import { normalizeDateLabel } from "./dateFormat";
import type { Offer, OfferHotelOption, OfferPriceMatrix, OfferStatus, OfferSupplierSection, TaxonomyTermType } from "./types";

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

export type OfferDiagnosticData = {
  offer: Record<string, unknown> | null;
  imports: unknown[];
  supplierEntities: unknown[];
  media: unknown[];
  dates: unknown[];
  destinations: unknown[];
  itinerary: unknown[];
  services: unknown[];
  highlights: unknown[];
  taxonomyTerms: unknown[];
  visibilityRules: unknown[];
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
  import_raw_payload?: unknown;
  supplier_sections: Array<{
    type: string;
    title: string | null;
    provider: string | null;
    entityKey: string | null;
    url: string | null;
    startDate: string | null;
    endDate: string | null;
    price: string | null;
    currency: "EUR" | "BGN" | null;
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

function comparableDestinationPart(value: string | null | undefined) {
  return (value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase("bg-BG");
}

function cityIfDifferentFromRegion(region: string | null | undefined, city: string | null | undefined) {
  return comparableDestinationPart(region) && comparableDestinationPart(region) === comparableDestinationPart(city) ? "" : city || "";
}

function itineraryTitleIfSpecific(title: string | null | undefined, dayNumber: number) {
  const text = (title || "").trim();
  if (!text) return "";
  const normalized = text
    .toLocaleLowerCase("bg-BG")
    .replace(/\s+/g, " ")
    .replace(/[–—]/g, "-")
    .trim();
  const escapedDayNumber = String(dayNumber).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const genericPattern = new RegExp(`^(ден|day)\\s*[-:.#№]?\\s*0*${escapedDayNumber}\\.?$`, "iu");
  return genericPattern.test(normalized) ? "" : text;
}

function objectValue(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function arrayValue(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function parseObject(value: unknown) {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return objectValue(parsed);
    } catch {
      return {};
    }
  }

  return objectValue(value);
}

function firstValue(...values: unknown[]): string {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      const nested: string = firstValue(...value);
      if (nested) return nested;
      continue;
    }
    if (typeof value === "object") {
      const object = objectValue(value);
      const nested: string = firstValue(object["#text"], object.value, object.Value, object.name, object.Name, object.label, object.Label, object.Desc, object.Text);
      if (nested) return nested;
      continue;
    }
    const text = String(value).trim();
    if (text) return text;
  }

  return "";
}

function dateFromRate(value: unknown) {
  const text = firstValue(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const compact = text.replace(/[^\d]/g, "");
  if (/^\d{8}$/.test(compact)) return `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`;
  return text;
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

const defaultRateLabels = [
  "Човек в двойна стая",
  "Двама възрастни в двойна стая",
  "Трима възрастни в двойна стая",
  "Един възрастен с дете",
  "Двама възрастни с дете 0-1.99",
  "Двама възрастни с дете 2-11.99"
];

function numberFromRate(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function rateCellText(value: unknown, currency: string) {
  const object = objectValue(value);
  const explicitStop = firstValue(object.Status, object.Availability, object["@_Status"]).toUpperCase();
  if (explicitStop === "STOP" || explicitStop === "SOLDOUT" || explicitStop === "SOLD_OUT") return "STOP!";

  const values = Array.isArray(value)
    ? value.map(numberFromRate).filter((item): item is number => item !== null)
    : [
        numberFromRate(object.Price),
        numberFromRate(object["@_Price"]),
        numberFromRate(object.Amount),
        numberFromRate(object.Value),
        numberFromRate(value)
      ].filter((item): item is number => item !== null);

  if (!values.length) return "STOP!";

  const price = Math.min(...values);
  return `${price.toLocaleString("bg-BG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function firstImageUrl(value: unknown): string {
  const seen = new Set<unknown>();
  const queue: unknown[] = [value];

  while (queue.length) {
    const current = queue.shift();
    if (!current || seen.has(current)) continue;
    seen.add(current);

    if (typeof current === "string") {
      const text = current.trim();
      if (/^https?:\/\/.+\.(?:jpg|jpeg|png|webp)(?:[?#].*)?$/i.test(text)) return text;
      continue;
    }

    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }

    if (typeof current === "object") {
      const object = objectValue(current);
      for (const [key, nested] of Object.entries(object)) {
        if (/image|photo|picture|url|src/i.test(key)) {
          const direct = firstImageUrl(nested);
          if (direct) return direct;
        }
        queue.push(nested);
      }
    }
  }

  return "";
}

function rateNumbers(value: unknown) {
  const object = objectValue(value);
  return (Array.isArray(value)
    ? value.map(numberFromRate)
    : [
        numberFromRate(object.Price),
        numberFromRate(object["@_Price"]),
        numberFromRate(object.Amount),
        numberFromRate(object.Value),
        numberFromRate(value)
      ]
  ).filter((item): item is number => item !== null);
}

function mapBohemiaHotelOptions(rawPayload: unknown, offer: Pick<PublicOfferRow, "country" | "region" | "currency">): OfferHotelOption[] {
  const payload = objectValue(rawPayload);
  const details = objectValue(payload.details);
  const rates = parseObject(details.Rates);
  const hotels = objectValue(rates.HOTELS);
  const results = arrayValue(rates.RESULTS);
  const options = new Map<string, OfferHotelOption>();
  const destination = [offer.region, displayCountryName(offer.country)].filter(Boolean).join(", ");

  for (const [key, value] of Object.entries(hotels)) {
    const data = arrayValue(value);
    const rooms = objectValue(data[1]);
    const title = firstValue(data[0]) || `Хотел ${options.size + 1}`;

    options.set(key.replace(/^H/, ""), {
      key,
      title,
      category: firstValue(data[2]) || undefined,
      destination: destination || undefined,
      imageUrl: firstImageUrl(value) || undefined,
      rooms: Object.values(rooms).map((room) => firstValue(arrayValue(room)[0])).filter(Boolean),
      dates: [],
      currency: offer.currency,
      source: "Rates.HOTELS"
    });
  }

  for (const result of results) {
    const row = arrayValue(result);
    const hotelId = firstValue(row[0]);
    const date = dateFromRate(row[3]);
    const currency = firstValue(row[4]) || offer.currency;
    const prices = arrayValue(row[5]).flatMap(rateNumbers);
    const option = options.get(hotelId) || options.get(`H${hotelId}`);

    if (!option) continue;
    if (date && !option.dates.includes(date)) option.dates.push(date);
    if (prices.length) {
      const lowest = Math.min(...prices);
      option.priceFrom = option.priceFrom === undefined ? lowest : Math.min(option.priceFrom, lowest);
      option.currency = currency;
    }
  }

  return [...options.values()].filter((option) => option.title || option.rooms.length || option.dates.length);
}

function mapBohemiaPriceMatrices(rawPayload: unknown, fallbackCurrency: "EUR" | "BGN"): OfferPriceMatrix[] {
  const payload = objectValue(rawPayload);
  const details = objectValue(payload.details);
  const rates = parseObject(details.Rates);
  const dates = arrayValue(rates.DATES).map(dateFromRate).filter(Boolean);
  const hotels = objectValue(rates.HOTELS);
  const results = arrayValue(rates.RESULTS);

  if (!dates.length || !results.length) return [];

  const matrices = new Map<string, OfferPriceMatrix>();

  for (const result of results) {
    const row = arrayValue(result);
    const hotelId = firstValue(row[0]);
    const roomId = firstValue(row[1]);
    const date = dateFromRate(row[3]);
    const currency = firstValue(row[4]) || fallbackCurrency;
    const rateValues = arrayValue(row[5]);

    if (!date || !rateValues.length) continue;

    const hotelData = arrayValue(hotels[`H${hotelId}`] || hotels[hotelId]);
    const hotelName = firstValue(hotelData[0]);
    const rooms = objectValue(hotelData[1]);
    const roomData = arrayValue(rooms[roomId]);
    const roomName = firstValue(roomData[0]) || `Стая ${roomId || matrices.size + 1}`;
    const roomNote = firstValue(roomData[1]);
    const matrixKey = `${hotelId || "hotel"}-${roomId || "room"}`;

    if (!matrices.has(matrixKey)) {
      matrices.set(matrixKey, {
        title: [roomName, roomNote].filter(Boolean).join(" - "),
        hotel: hotelName || undefined,
        room: roomName || undefined,
        note: roomNote || undefined,
        columns: rateValues.map((rate, index) => {
          const rateObject = objectValue(rate);
          return {
            key: `rate-${index}`,
            label: firstValue(rateObject.Name, rateObject.Label, rateObject.Desc, rateObject["@_Name"], rateObject["@_Label"]) || defaultRateLabels[index] || `Вариант ${index + 1}`
          };
        }),
        rows: dates.map((item) => ({
          date: item,
          cells: Object.fromEntries(rateValues.map((_, index) => [`rate-${index}`, "STOP!"]))
        }))
      });
    }

    const matrix = matrices.get(matrixKey);
    if (!matrix) continue;
    const rowItem = matrix.rows.find((item) => item.date === date);
    if (!rowItem) continue;

    rateValues.forEach((rate, index) => {
      const key = `rate-${index}`;
      if (!matrix.columns.some((column) => column.key === key)) {
        matrix.columns.push({ key, label: defaultRateLabels[index] || `Вариант ${index + 1}` });
      }
      rowItem.cells[key] = rateCellText(rate, currency);
    });
  }

  return [...matrices.values()].filter((matrix) => matrix.columns.length && matrix.rows.length);
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

function supplierSectionBody(entityTitle: unknown, raw: Record<string, unknown>, editorial: Record<string, unknown>) {
  const body = firstText(
    editorial.description,
    editorial.descriptionHtml,
    editorial.text,
    raw.description,
    raw.descriptionHtml,
    raw.text,
    raw.Text,
    raw.Desc,
    raw["#text"],
    raw.note,
    raw.label
  );
  const title = firstText(entityTitle, editorial.title, editorial.text, raw.title, raw.label);

  return body && body !== title ? body : "";
}

function defaultSupplierPublicSection(type: string) {
  if (type === "hotel") return "accommodation";
  if (type === "service") return "services";
  if (type === "additional_service") return "extras";
  if (type === "useful_info" || type === "payment_policy" || type === "cancel_policy" || type === "insurance") return "conditions";
  if (type === "itinerary_day") return "itinerary";
  if (type === "departure") return "dates";
  return "internal";
}

function supplierPriceLabel(value: number, currency?: "EUR" | "BGN") {
  return `${value.toLocaleString("bg-BG")}${currency ? ` ${currency}` : ""}`;
}

function supplierSectionMeta(entity: NonNullable<PublicOfferRow["supplier_sections"]>[number], raw: Record<string, unknown>, editorial: Record<string, unknown>) {
  const price = entity.price ? Number(entity.price) : null;
  const currency = entity.currency ? displayCurrency(entity.currency) : undefined;
  const priceText = price && Number.isFinite(price) ? supplierPriceLabel(price, currency) : "";
  const dates = [entity.startDate, entity.endDate].filter(Boolean).join(" - ");
  const provider = firstText(entity.provider);

  return [
    priceText,
    dates,
    firstText(editorial.category, raw["@_Type"], raw.Type, raw.serviceType, raw.ServiceType),
    provider
  ].filter(Boolean).join(" / ");
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
        meta: firstText(editorial.category, raw.category, raw.Category),
        url: firstText(editorial.url, entity.url),
        provider: firstText(entity.provider),
        entityKey: firstText(entity.entityKey),
        startDate: entity.startDate || undefined,
        endDate: entity.endDate || undefined,
        publicSection: firstText(editorial.publicSection) || defaultSupplierPublicSection(entity.type)
      });
      continue;
    }

    const price = entity.price ? Number(entity.price) : undefined;

    sections.push({
      type: entity.type,
      title,
      body: supplierSectionBody(title, raw, editorial),
      meta: supplierSectionMeta(entity, raw, editorial),
      url: firstText(editorial.url, entity.url),
      price: price && Number.isFinite(price) ? price : undefined,
      currency: entity.currency ? displayCurrency(entity.currency) : undefined,
      provider: firstText(entity.provider),
      entityKey: firstText(entity.entityKey),
      startDate: entity.startDate || undefined,
      endDate: entity.endDate || undefined,
      publicSection: firstText(editorial.publicSection) || defaultSupplierPublicSection(entity.type)
    });
  }

  return sections;
}

function mapPublicOffer(row: PublicOfferRow): Offer {
  const title = row.title || "Оферта";
  const summary = row.summary || "Подробностите за тази оферта се подготвят.";
  const country = displayCountryName(row.country) || "Дестинация";
  const region = row.region || country;
  const destinations = row.destinations?.length
    ? row.destinations.map((destination) => ({
        country: displayCountryName(destination.country) || country,
        region: destination.region || undefined,
        city: cityIfDifferentFromRegion(destination.region, destination.city) || undefined,
        isPrimary: destination.isPrimary,
        sortOrder: destination.sortOrder
      }))
    : [{ country, region, isPrimary: true, sortOrder: 0 }];
  const durationDays = row.duration_days ?? 1;
  const durationNights = row.duration_nights ?? Math.max(durationDays - 1, 0);
  const priceFrom = Number(row.price_from);
  const itinerary = row.itinerary_days?.map((day) => ({
    day: day.day,
    title: itineraryTitleIfSpecific(day.title, day.day),
    description: day.description || "",
    accommodation: day.accommodation || undefined,
    meals: day.meals || undefined,
    transport: day.transport || undefined
  })) ?? [];
  const taxonomyTerms = row.taxonomy_terms ?? [];
  const termsByType = (type: string) => taxonomyTerms.filter((term) => term.type === type);
  const termLabel = (term: { name: string; publicLabel: string | null }) => term.publicLabel || term.name;

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
    currency: displayCurrency(row.currency),
    priceNote: "Запитване преди потвърждение",
    source: row.source as Offer["source"],
    status: row.status,
    isAuthorProgram: row.is_author_program,
    heroImage: row.hero_image_url || fallbackHeroImage,
    gallery: row.gallery_image_urls?.length ? row.gallery_image_urls : row.hero_image_url ? [row.hero_image_url] : [],
    dates: row.dates?.length
      ? row.dates.map((date) => ({
          label: normalizeDateLabel(date.label, date.startDate, date.endDate, "Дата по заявка"),
          startDate: date.startDate || "",
          endDate: date.endDate || "",
          departurePoints: date.departurePoints || undefined,
          availability: date.availability,
          seatsTotal: date.seatsTotal ?? undefined,
          seatsConfirmed: date.seatsConfirmed ?? undefined,
          seatsOption: date.seatsOption ?? undefined,
          seatsAvailable: date.seatsAvailable ?? undefined,
          priceFrom: date.priceFrom === null ? undefined : Number(date.priceFrom),
          currency: displayCurrency(date.currency || row.currency),
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
      source: "manual",
      name: term.name,
      publicLabel: term.publicLabel || undefined
    })),
    taxonomyTermSlugs: taxonomyTerms.map((term) => term.slug),
    taxonomyTermLabels: taxonomyTerms.map(termLabel),
    badgeSlugs: termsByType("badge").map((term) => term.slug),
    audienceSlugs: termsByType("audience").map((term) => term.slug),
    audienceLabels: termsByType("audience").map(termLabel),
    categorySlugs: termsByType("category").map((term) => term.slug),
    categoryLabels: termsByType("category").map(termLabel),
    themeSlugs: termsByType("theme").map((term) => term.slug),
    themeLabels: termsByType("theme").map(termLabel),
    moodSlugs: termsByType("mood").map((term) => term.slug),
    moodLabels: termsByType("mood").map(termLabel),
    visibilityPlacements: (row.visibility_placements ?? []) as Offer["visibilityPlacements"],
    highlights: row.highlights ?? [],
    included: row.included_services ?? [],
    excluded: row.excluded_services ?? [],
    itinerary,
    supplierSections: mapSupplierSections(row),
    priceMatrices: mapBohemiaPriceMatrices(row.import_raw_payload, displayCurrency(row.currency)),
    hotelOptions: mapBohemiaHotelOptions(row.import_raw_payload, row),
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
                'provider', entity.provider,
                'entityKey', entity.entity_key,
                'url', coalesce(nullif(entity.editorial_url, ''), entity.url),
                'startDate', entity.start_date::text,
                'endDate', entity.end_date::text,
                'price', entity.price::text,
                'currency', entity.currency,
                'rawData', entity.raw_data,
                'editorialData', entity.editorial_data
              )
              order by entity.entity_type, entity.sort_order, entity.created_at
            )
            from supplier_import_entities entity
            where entity.offer_id = offers.id
              and entity.is_enabled = true
              and (
                entity.entity_type in ('hotel', 'service', 'additional_service', 'useful_info', 'payment_policy', 'cancel_policy', 'insurance')
                or entity.editorial_data ->> 'publicSection' in ('accommodation', 'services', 'extras', 'conditions', 'itinerary', 'dates')
              )
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
  const slugCandidates = Array.from(
    new Set([
      slug,
      (() => {
        try {
          return decodeURIComponent(slug);
        } catch {
          return slug;
        }
      })()
    ].filter(Boolean))
  );
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
        (
          select import.raw_payload
          from offer_imports import
          where import.offer_id = offers.id
          order by import.last_synced_at desc nulls last, import.created_at desc
          limit 1
        ) as import_raw_payload,
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
                'provider', entity.provider,
                'entityKey', entity.entity_key,
                'url', coalesce(nullif(entity.editorial_url, ''), entity.url),
                'startDate', entity.start_date::text,
                'endDate', entity.end_date::text,
                'price', entity.price::text,
                'currency', entity.currency,
                'rawData', entity.raw_data,
                'editorialData', entity.editorial_data
              )
              order by entity.entity_type, entity.sort_order, entity.created_at
            )
            from supplier_import_entities entity
            where entity.offer_id = offers.id
              and entity.is_enabled = true
              and (
                entity.entity_type in ('hotel', 'service', 'additional_service', 'useful_info', 'payment_policy', 'cancel_policy', 'insurance')
                or entity.editorial_data ->> 'publicSection' in ('accommodation', 'services', 'extras', 'conditions', 'itinerary', 'dates')
              )
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
      where slug = any($1::text[])
        and status = 'published'
      limit 1
    `,
    [slugCandidates]
  );

  if (result.rows[0]) {
    return mapPublicOffer(result.rows[0]);
  }

  return undefined;
}

export async function getOfferDiagnosticDataBySlug(slug: string): Promise<OfferDiagnosticData | null> {
  const result = await dbQuery<OfferDiagnosticData>(
    `
      select
        to_jsonb(offer) as offer,
        coalesce(
          (
            select jsonb_agg(to_jsonb(import) order by import.last_synced_at desc nulls last, import.created_at desc)
            from offer_imports import
            where import.offer_id = offer.id
          ),
          '[]'::jsonb
        ) as "imports",
        coalesce(
          (
            select jsonb_agg(to_jsonb(entity) order by entity.entity_type, entity.sort_order, entity.created_at)
            from supplier_import_entities entity
            where entity.offer_id = offer.id
          ),
          '[]'::jsonb
        ) as "supplierEntities",
        coalesce(
          (
            select jsonb_agg(to_jsonb(media) order by media.sort_order, media.created_at)
            from offer_media media
            where media.offer_id = offer.id
          ),
          '[]'::jsonb
        ) as media,
        coalesce(
          (
            select jsonb_agg(to_jsonb(date) order by date.sort_order, date.start_date nulls last)
            from offer_dates date
            where date.offer_id = offer.id
          ),
          '[]'::jsonb
        ) as dates,
        coalesce(
          (
            select jsonb_agg(to_jsonb(destination) order by destination.sort_order)
            from offer_destinations destination
            where destination.offer_id = offer.id
          ),
          '[]'::jsonb
        ) as destinations,
        coalesce(
          (
            select jsonb_agg(to_jsonb(day) order by day.sort_order, day.day_number)
            from offer_itinerary_days day
            where day.offer_id = offer.id
          ),
          '[]'::jsonb
        ) as itinerary,
        coalesce(
          (
            select jsonb_agg(to_jsonb(service) order by service.service_type, service.sort_order)
            from offer_services service
            where service.offer_id = offer.id
          ),
          '[]'::jsonb
        ) as services,
        coalesce(
          (
            select jsonb_agg(to_jsonb(highlight) order by highlight.sort_order)
            from offer_highlights highlight
            where highlight.offer_id = offer.id
          ),
          '[]'::jsonb
        ) as highlights,
        coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'assignment', to_jsonb(assigned),
                'term', to_jsonb(term)
              )
              order by term.type, term.sort_order, term.name
            )
            from offer_taxonomy_terms assigned
            join taxonomy_terms term on term.id = assigned.term_id
            where assigned.offer_id = offer.id
          ),
          '[]'::jsonb
        ) as "taxonomyTerms",
        coalesce(
          (
            select jsonb_agg(to_jsonb(rule) order by rule.priority desc, rule.placement)
            from offer_visibility_rules rule
            where rule.offer_id = offer.id
          ),
          '[]'::jsonb
        ) as "visibilityRules"
      from offers offer
      where offer.slug = $1
      limit 1
    `,
    [slug]
  );

  return result.rows[0] || null;
}
