import { XMLParser } from "fast-xml-parser";

const PROVIDER = "abax";
const DEFAULT_BASE_URL = "https://api.abax.bg/index.php";

function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function firstValue(...values) {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      const nested = firstValue(...value);
      if (nested) return nested;
      continue;
    }
    if (typeof value === "object") {
      const nested = firstValue(value["#text"], value.text, value.Text, value.value, value.Value, value.name, value.Name, value.title, value.Title);
      if (nested) return nested;
      continue;
    }
    const normalized = String(value).trim();
    if (normalized) return normalized;
  }

  return null;
}

function toNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number.parseFloat(String(value).replace(/\s+/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function toInteger(value) {
  const parsed = Number.parseInt(String(value ?? "").replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDate(value) {
  const raw = firstValue(value);
  if (!raw) return null;

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return isoMatch[0];

  const bgMatch = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (bgMatch) {
    const [, day, month, year] = bgMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return null;
}

function decodeHtml(value) {
  const raw = firstValue(value);
  if (!raw) return null;

  return raw
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&");
}

function textFromHtml(value) {
  const text = decodeHtml(value);
  if (!text) return null;

  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/\s*(p|div|li|tr|h[1-6])\s*>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function valueByNames(root, names) {
  const object = asObject(root);
  const entries = Object.entries(object);

  for (const name of names) {
    if (object[name] !== undefined) return object[name];
    const lowerName = name.toLowerCase();
    const match = entries.find(([key]) => key.toLowerCase() === lowerName);
    if (match) return match[1];
  }

  return undefined;
}

function firstNamed(root, names) {
  return firstValue(valueByNames(root, names));
}

function numberNamed(root, names) {
  return toNumber(valueByNames(root, names));
}

function dateNamed(root, names) {
  return toDate(valueByNames(root, names));
}

function findDeepArrays(root, results = [], depth = 0) {
  if (depth > 7 || root === undefined || root === null) return results;

  if (Array.isArray(root)) {
    if (root.some((item) => item && typeof item === "object")) results.push(root);
    for (const item of root) findDeepArrays(item, results, depth + 1);
    return results;
  }

  if (typeof root !== "object") return results;

  for (const value of Object.values(root)) {
    findDeepArrays(value, results, depth + 1);
  }

  return results;
}

function scoreProgramItem(item) {
  const object = asObject(item);
  let score = 0;
  if (valueByNames(object, ["id", "ID", "program_id", "ProgramID", "programId"])) score += 4;
  if (valueByNames(object, ["name", "Name", "title", "Title", "program", "Program"])) score += 3;
  if (valueByNames(object, ["country", "Country", "country_code", "CountryCode"])) score += 1;
  if (valueByNames(object, ["date", "Date", "dates", "Dates", "price", "Price"])) score += 1;
  return score;
}

function extractItems(payload, preferredKeys = []) {
  const root = asObject(payload);

  for (const key of preferredKeys) {
    const direct = valueByNames(root, [key]);
    if (Array.isArray(direct)) return direct.map(asObject).filter((item) => Object.keys(item).length > 0);
    const nested = asObject(direct);
    for (const value of Object.values(nested)) {
      if (Array.isArray(value)) return value.map(asObject).filter((item) => Object.keys(item).length > 0);
    }
  }

  const arrays = findDeepArrays(payload)
    .map((items) => items.map(asObject).filter((item) => Object.keys(item).length > 0))
    .filter((items) => items.length > 0)
    .sort((first, second) => {
      const secondScore = second.reduce((sum, item) => sum + scoreProgramItem(item), 0);
      const firstScore = first.reduce((sum, item) => sum + scoreProgramItem(item), 0);
      return secondScore - firstScore;
    });

  return arrays[0] || [];
}

function parsePayload(text) {
  const trimmed = text.trim();
  if (!trimmed) return {};

  try {
    return JSON.parse(trimmed);
  } catch {
    return new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" }).parse(trimmed);
  }
}

function buildUrl(baseUrl, key, code, method, params = {}) {
  const url = new URL(baseUrl || DEFAULT_BASE_URL);
  url.searchParams.set("key", key);
  url.searchParams.set("code", code);
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(name, String(value));
  }
  return `${url.toString()}&${method}`;
}

export function createAbaxClient(options) {
  const baseUrl = options.baseUrl || DEFAULT_BASE_URL;
  const key = String(options.key || "").trim();
  const code = String(options.code || "").trim();
  const timeoutMs = options.timeoutMs ?? 15000;

  if (!key || !code) {
    throw new Error("Abax API UUID и API Key са задължителни.");
  }

  async function get(method, params = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(buildUrl(baseUrl, key, code, method, params), {
        cache: "no-store",
        signal: controller.signal
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`Abax API returned HTTP ${response.status}: ${text.slice(0, 180)}`);
      return parsePayload(text);
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    getProgramsList: () => get("get-programs-list"),
    getProgramPrices: (id) => get("get-program-prices", { id }),
    getProgramsTablePrices: (id) => get("get-programs-table-prices", { id }),
    getCountries: () => get("get-country"),
    getCities: (country) => get("get-city", { country }),
    getHotels: (country) => get("get-hotels", { country })
  };
}

function collectDates(program, pricesPayload) {
  const priceItems = extractItems(pricesPayload, ["prices", "Prices", "dates", "Dates", "hotels", "Hotels", "data", "Data"]);
  const byKey = new Map();

  for (const item of priceItems) {
    const startDate = dateNamed(item, ["date", "Date", "start_date", "StartDate", "departure_date", "DepartureDate", "from", "From"]);
    const priceFrom = numberNamed(item, ["price", "Price", "price_from", "PriceFrom", "amount", "Amount", "adult_price", "AdultPrice"]);
    const hotelName = firstNamed(item, ["hotel", "Hotel", "hotel_name", "HotelName", "name", "Name"]);
    const seatsAvailable = toInteger(valueByNames(item, ["available", "Available", "seats", "Seats", "free", "Free"]));
    const key = `${startDate || "no-date"}-${priceFrom || "no-price"}`;
    const current = byKey.get(key);

    if (!startDate && !priceFrom) continue;
    if (current && current.priceFrom && (!priceFrom || current.priceFrom <= priceFrom)) continue;

    byKey.set(key, {
      key,
      label: [startDate, hotelName].filter(Boolean).join(" · "),
      startDate,
      endDate: dateNamed(item, ["end_date", "EndDate", "to", "To", "return_date", "ReturnDate"]),
      availability: seatsAvailable === 0 ? "sold_out" : "on_request",
      seatsAvailable,
      priceFrom,
      currency: firstNamed(item, ["currency", "Currency"]) === "BGN" ? "BGN" : "EUR",
      notes: hotelName || null,
      raw: item
    });
  }

  const fallbackDate = dateNamed(program, ["date", "Date", "start_date", "StartDate", "departure_date", "DepartureDate"]);
  const fallbackPrice = numberNamed(program, ["price", "Price", "price_from", "PriceFrom"]);
  if (byKey.size === 0 && (fallbackDate || fallbackPrice)) {
    byKey.set("program", {
      key: "program",
      label: fallbackDate || null,
      startDate: fallbackDate,
      endDate: null,
      availability: "on_request",
      priceFrom: fallbackPrice,
      currency: "EUR",
      raw: program
    });
  }

  return Array.from(byKey.values()).sort((first, second) => String(first.startDate || "").localeCompare(String(second.startDate || "")));
}

function collectHotels(pricesPayload) {
  const items = extractItems(pricesPayload, ["hotels", "Hotels", "prices", "Prices", "data", "Data"]);
  const hotels = new Map();

  for (const item of items) {
    const id = firstNamed(item, ["hotel", "Hotel", "hotel_id", "HotelID", "hotelId"]);
    const title = firstNamed(item, ["hotel_name", "HotelName", "name", "Name", "hotel", "Hotel"]);
    if (!id && !title) continue;
    const key = String(id || title);
    if (hotels.has(key)) continue;
    hotels.set(key, {
      type: "hotel",
      key,
      title: title || key,
      sortOrder: hotels.size,
      raw: item
    });
  }

  return Array.from(hotels.values());
}

function collectMedia(program) {
  const media = [];
  const images = [
    valueByNames(program, ["image", "Image", "picture", "Picture", "photo", "Photo", "main_image", "MainImage"]),
    ...asArray(valueByNames(program, ["images", "Images", "gallery", "Gallery", "photos", "Photos"]))
  ];

  for (const image of images) {
    const url = firstValue(image);
    if (!url || media.some((item) => item.url === url)) continue;
    media.push({ url, alt: firstNamed(program, ["name", "Name", "title", "Title"]) || "Abax" });
  }

  return media;
}

function mapAbaxProgram(program, pricesPayload) {
  const externalId = firstNamed(program, ["id", "ID", "program_id", "ProgramID", "programId", "code", "Code"]);
  if (!externalId) return null;

  const dates = collectDates(program, pricesPayload);
  const priceFrom = dates.reduce((min, date) => {
    if (!date.priceFrom) return min;
    return min === null ? date.priceFrom : Math.min(min, date.priceFrom);
  }, numberNamed(program, ["price", "Price", "price_from", "PriceFrom"]));
  const title = firstNamed(program, ["name", "Name", "title", "Title", "program", "Program"]) || `Abax програма ${externalId}`;
  const country = firstNamed(program, ["country_name", "CountryName", "country", "Country", "country_code", "CountryCode"]) || "Abax";
  const region = firstNamed(program, ["city_name", "CityName", "city", "City", "destination", "Destination", "resort", "Resort"]);
  const description = textFromHtml(valueByNames(program, ["description", "Description", "text", "Text", "program_text", "ProgramText", "info", "Info"]));

  return {
    externalId: String(externalId),
    source: "api",
    productType: "holiday",
    productTypeLabel: "Почивка",
    title,
    summary: textFromHtml(valueByNames(program, ["short_description", "ShortDescription", "summary", "Summary"])) || description?.slice(0, 260) || null,
    description,
    country,
    region,
    city: region,
    durationDays: toInteger(valueByNames(program, ["days", "Days", "duration_days", "DurationDays"])),
    durationNights: toInteger(valueByNames(program, ["nights", "Nights", "duration_nights", "DurationNights"])),
    transport: "mixed",
    priceFrom,
    currency: firstNamed(program, ["currency", "Currency"]) === "BGN" ? "BGN" : "EUR",
    media: collectMedia(program),
    dates,
    itinerary: [],
    highlights: [region, country].filter(Boolean),
    includedServices: [],
    excludedServices: [],
    supplierEntities: collectHotels(pricesPayload),
    rawPayload: {
      program,
      prices: pricesPayload
    }
  };
}

export async function fetchAbaxOfferCounts(options) {
  const client = createAbaxClient(options);
  const payload = await client.getProgramsList();
  const programs = extractItems(payload, ["programs", "Programs", "Program", "data", "Data", "result", "Result"]);

  return {
    total: programs.length,
    programs: programs.length
  };
}

export async function fetchAbaxOffers(options) {
  const client = createAbaxClient(options);
  const limit = options.limit ?? 50;
  const offset = Math.max(Number(options.offset ?? 0) || 0, 0);
  const programsPayload = await client.getProgramsList();
  const programs = extractItems(programsPayload, ["programs", "Programs", "Program", "data", "Data", "result", "Result"]);
  const selectedPrograms = Number.isFinite(limit) && limit > 0 ? programs.slice(offset, offset + limit) : programs.slice(offset);
  const offers = [];

  for (const program of selectedPrograms) {
    const id = firstNamed(program, ["id", "ID", "program_id", "ProgramID", "programId", "code", "Code"]);
    if (!id) continue;
    const prices = await client.getProgramPrices(id).catch((error) => ({
      DetailError: error instanceof Error ? error.message : "Abax prices request failed"
    }));
    const offer = mapAbaxProgram(program, prices);
    if (offer) offers.push(offer);
  }

  offers.meta = {
    totalAvailable: programs.length,
    processedAvailable: Math.min(offset + selectedPrograms.length, programs.length),
    hasMore: offset + selectedPrograms.length < programs.length,
    nextOffset: offset + selectedPrograms.length,
    offset,
    limit
  };

  return offers;
}

export const abaxProvider = PROVIDER;
export const abaxDefaultBaseUrl = DEFAULT_BASE_URL;
