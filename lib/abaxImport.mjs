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
    .replace(/&ndash;/gi, "–")
    .replace(/&mdash;/gi, "—")
    .replace(/&bdquo;/gi, "„")
    .replace(/&ldquo;/gi, "“")
    .replace(/&rdquo;/gi, "”")
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

function compactText(value) {
  return String(value || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function textListFromHtml(value) {
  const text = textFromHtml(value);
  if (!text) return [];

  return text
    .split(/\n+/)
    .map((item) => item.replace(/^[-–—•]\s*/, "").trim())
    .filter((item) => item.length > 2);
}

function uniqueStrings(values, limit = 100) {
  const seen = new Set();
  const result = [];
  for (const value of values) {
    const normalized = String(value || "").trim().replace(/^[-–—•]\s*/, "").trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
    if (result.length >= limit) break;
  }
  return result;
}

function normalizeCountry(value) {
  const raw = firstValue(value);
  if (!raw) return null;
  const upper = raw.toUpperCase();
  const map = {
    EG: "Египет",
    TR: "Турция",
    GR: "Гърция",
    IT: "Италия",
    ES: "Испания",
    PT: "Португалия",
    FR: "Франция",
    BG: "България",
    AE: "Обединени арабски емирства",
    TN: "Тунис",
    MA: "Мароко",
    MV: "Малдиви",
    LK: "Шри Ланка",
    TH: "Тайланд"
  };
  return map[upper] || raw;
}

function normalizeTransport(value) {
  const raw = String(firstValue(value) || "").toLocaleLowerCase("bg-BG");
  if (raw.includes("самолет") || raw.includes("flight") || raw.includes("air")) return "flight";
  if (raw.includes("автобус") || raw.includes("bus")) return "bus";
  if (raw.includes("кораб") || raw.includes("cruise")) return "mixed";
  return "mixed";
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
    const directValues = Object.values(asObject(direct)).map(asObject).filter((item) => Object.keys(item).length > 0);
    if (directValues.length > 0 && directValues.some((item) => scoreProgramItem(item) > 0)) return directValues;
    const nested = asObject(direct);
    for (const value of Object.values(nested)) {
      if (Array.isArray(value)) return value.map(asObject).filter((item) => Object.keys(item).length > 0);
    }
  }

  const rootValues = Object.values(root).map(asObject).filter((item) => Object.keys(item).length > 0);
  if (rootValues.length > 0 && rootValues.some((item) => scoreProgramItem(item) > 0)) return rootValues;

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

function extractProgramList(payload) {
  if (Array.isArray(payload)) {
    return payload.map(asObject).filter((item) => Object.keys(item).length > 0);
  }

  const root = asObject(payload);
  const rootValues = Object.values(root)
    .map(asObject)
    .filter((item) => {
      if (Object.keys(item).length === 0) return false;
      return Boolean(
        valueByNames(item, ["ID", "id", "ProgramID", "program_id", "programId"]) ||
        valueByNames(item, ["ProgramName", "programName", "Name", "name", "Title", "title"])
      );
    });

  if (rootValues.length > 0) return rootValues;

  return extractItems(payload, ["programs", "Programs", "Program", "data", "Data", "result", "Result"]);
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

  const programDates = Object.values(asObject(valueByNames(program, ["dates", "Dates"])))
    .map(asObject)
    .filter((item) => Object.keys(item).length > 0);
  for (const item of programDates) {
    const startDate = dateNamed(item, ["OnDate", "date", "Date", "start_date", "StartDate"]);
    if (!startDate) continue;
    const key = `program-${startDate}`;
    if (byKey.has(key)) continue;
    const status = firstNamed(item, ["Status", "status"]);
    byKey.set(key, {
      key,
      label: startDate,
      startDate,
      endDate: null,
      availability: status === "STOP" ? "sold_out" : "on_request",
      seatsAvailable: null,
      priceFrom: null,
      currency: firstNamed(program, ["IdCurr", "currency", "Currency"]) === "BGN" ? "BGN" : "EUR",
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
  const directHotels = valueByNames(pricesPayload, ["hotels", "Hotels"]);
  const directHotelItems = Object.values(asObject(directHotels)).map(asObject).filter((item) => Object.keys(item).length > 0);
  const items = directHotelItems.length > 0
    ? directHotelItems
    : extractItems(pricesPayload, ["hotels", "Hotels", "prices", "Prices", "data", "Data"]);
  const hotels = new Map();

  for (const item of items) {
    const id = firstNamed(item, ["ID", "id", "hotel", "Hotel", "hotel_id", "HotelID", "hotelId"]);
    const title = firstNamed(item, ["HotelName", "hotel_name", "name", "Name", "hotel", "Hotel"]);
    if (!id && !title) continue;
    const key = String(id || title);
    if (hotels.has(key)) continue;
    hotels.set(key, {
      type: "hotel",
      key,
      title: title || key,
      url: asArray(valueByNames(item, ["images", "Images"]))[0] || "",
      sortOrder: hotels.size,
      raw: {
        id: key,
        title: title || key,
        destination: firstNamed(item, ["Dest", "Destination"]),
        country: normalizeCountry(firstNamed(item, ["Country", "IdCountry"])),
        stars: firstNamed(item, ["IdStar", "stars", "Stars"]),
        stay: firstNamed(item, ["Stay"]),
        rooms: Object.keys(asObject(valueByNames(item, ["Rooms", "rooms"]))),
        images: asArray(valueByNames(item, ["images", "Images"])).slice(0, 12),
        description: textFromHtml(valueByNames(item, ["description", "Description"]))?.slice(0, 1200) || null
      }
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
    media.push({ url, alt: firstNamed(program, ["ProgramName", "name", "Name", "title", "Title"]) || "Abax" });
  }

  return media;
}

function splitItinerary(program) {
  const description = textFromHtml(valueByNames(program, ["description", "DescriptionHtml", "program_text", "ProgramText"]));
  if (!description) return [];

  const matches = [...description.matchAll(/(?:^|\n)\s*(?:ДЕН|Ден)\s*[-–]?\s*(\d+)(?:[^\n]*)/g)];
  if (matches.length === 0) return [];

  return matches.map((match, index) => {
    const start = match.index || 0;
    const next = matches[index + 1]?.index || description.length;
    const block = compactText(description.slice(start, next));
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const dayNumber = Number.parseInt(match[1], 10) || index + 1;
    return {
      key: `day-${dayNumber}`,
      dayNumber,
      title: lines[0] || `Ден ${dayNumber}`,
      description: compactText(lines.slice(1).join("\n")) || block,
      raw: { text: block }
    };
  });
}

function collectServices(program) {
  const included = uniqueStrings([
    ...textListFromHtml(valueByNames(program, ["priceinclude", "include", "included", "Included"])),
    ...asArray(valueByNames(program, ["includedServices", "IncludedServices"])).map(firstValue)
  ], 80);
  const excluded = uniqueStrings([
    ...textListFromHtml(valueByNames(program, ["pricenotinclude", "notinclude", "excluded", "Excluded"])),
    ...asArray(valueByNames(program, ["excludedServices", "ExcludedServices"])).map(firstValue)
  ], 80);
  const additional = uniqueStrings(asArray(valueByNames(program, ["services", "Services"]))
    .map((service) => firstNamed(service, ["ServiceName", "name", "Name"]))
    .filter(Boolean), 80);

  return { included, excluded, additional };
}

function collectDestination(program, pricesPayload) {
  const destinations = asArray(valueByNames(program, ["destination", "Destination"])).map(asObject);
  const hotels = Object.values(asObject(valueByNames(pricesPayload, ["hotels", "Hotels"]))).map(asObject);
  const countries = uniqueStrings([
    ...destinations.map((item) => normalizeCountry(valueByNames(item, ["Country", "IdCountry", "country", "country_code"]))),
    ...hotels.map((item) => normalizeCountry(valueByNames(item, ["Country", "IdCountry", "country", "country_code"])))
  ].filter(Boolean), 5);
  const regions = uniqueStrings([
    firstNamed(program, ["DestName", "DestinationName", "city_name", "CityName", "destinationName"]),
    ...hotels.map((item) => firstNamed(item, ["Dest", "Destination"]))
  ].filter(Boolean), 6);

  return {
    country: countries[0] || firstNamed(program, ["country_name", "CountryName", "country", "Country", "country_code", "CountryCode"]) || null,
    region: regions.join(", ") || null,
    city: regions[0] || null,
    highlights: uniqueStrings([
      ...regions,
      ...countries,
      ...String(firstNamed(program, ["GroupName"]) || "").split(",")
    ], 8)
  };
}

function collectSupplierEntities(program, pricesPayload, media, dates, itinerary, services) {
  const entities = [];

  media.forEach((item, index) => entities.push({
    type: "image",
    key: item.url,
    title: item.alt,
    url: item.url,
    sortOrder: index,
    raw: item
  }));
  dates.forEach((item, index) => entities.push({
    type: "departure",
    key: item.key,
    title: item.label,
    startDate: item.startDate,
    endDate: item.endDate,
    price: item.priceFrom,
    currency: item.currency,
    sortOrder: index,
    raw: item.raw
  }));
  itinerary.forEach((item, index) => entities.push({
    type: "itinerary_day",
    key: item.key || `day-${item.dayNumber || index + 1}`,
    title: item.title,
    sortOrder: index,
    raw: item.raw || item
  }));
  services.included.forEach((label, index) => entities.push({
    type: "service",
    key: `included-${index}-${label.slice(0, 40)}`,
    title: label,
    sortOrder: index,
    raw: { label, serviceType: "included" }
  }));
  services.excluded.forEach((label, index) => entities.push({
    type: "service",
    key: `excluded-${index}-${label.slice(0, 40)}`,
    title: label,
    sortOrder: services.included.length + index,
    raw: { label, serviceType: "excluded" }
  }));
  services.additional.forEach((label, index) => entities.push({
    type: "additional_service",
    key: `additional-${index}-${label.slice(0, 40)}`,
    title: label,
    sortOrder: index,
    raw: { label }
  }));
  collectHotels({ hotels: valueByNames(pricesPayload, ["hotels", "Hotels"]) || valueByNames(program, ["hotels", "Hotels"]) }).forEach((hotel) => {
    entities.push(hotel);
  });

  const terms = textFromHtml(valueByNames(program, ["terms", "Terms"]));
  if (terms) entities.push({ type: "useful_info", key: "terms", title: "Условия и важна информация", sortOrder: 0, raw: { text: terms.slice(0, 6000) } });

  return entities;
}

function mapAbaxProgram(program, pricesPayload) {
  const externalId = firstNamed(program, ["id", "ID", "program_id", "ProgramID", "programId", "code", "Code"]);
  if (!externalId) return null;

  const dates = collectDates(program, pricesPayload);
  const priceFrom = dates.reduce((min, date) => {
    if (!date.priceFrom) return min;
    return min === null ? date.priceFrom : Math.min(min, date.priceFrom);
  }, numberNamed(program, ["price", "Price", "price_from", "PriceFrom"]));
  const title = firstNamed(program, ["ProgramName", "programName", "name", "Name", "title", "Title", "program", "Program"]) || `Abax програма ${externalId}`;
  const country = firstNamed(program, ["country_name", "CountryName", "country", "Country", "country_code", "CountryCode"]) || "Abax";
  const region = firstNamed(program, ["city_name", "CityName", "city", "City", "destination", "Destination", "resort", "Resort"]);
  const description = textFromHtml(valueByNames(program, ["description", "Description", "text", "Text", "program_text", "ProgramText", "info", "Info"]));

  return {
    externalId: String(externalId),
    source: "api",
    productType: firstNamed(program, ["Type", "type"])?.toLocaleLowerCase("bg-BG").includes("екскурз") ? "excursion" : "holiday",
    productTypeLabel: firstNamed(program, ["Type", "type"]) || "Почивка",
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
    currency: firstNamed(program, ["IdCurr", "currency", "Currency"]) === "BGN" ? "BGN" : "EUR",
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

function mapAbaxProgramV2(program, pricesPayload) {
  const externalId = firstNamed(program, ["id", "ID", "program_id", "ProgramID", "programId", "code", "Code"]);
  if (!externalId) return null;

  const dates = collectDates(program, pricesPayload);
  const priceFrom = dates.reduce((min, date) => {
    if (!date.priceFrom) return min;
    return min === null ? date.priceFrom : Math.min(min, date.priceFrom);
  }, numberNamed(program, ["price", "Price", "price_from", "PriceFrom"]));
  const title = firstNamed(program, ["ProgramName", "programName", "name", "Name", "title", "Title", "program", "Program"]) || `Abax program ${externalId}`;
  const intro = textFromHtml(valueByNames(program, ["Description", "short_description", "ShortDescription", "summary", "Summary"]));
  const publicDescription =
    intro ||
    textFromHtml(valueByNames(program, ["generalinfo", "GeneralInfo", "usefully", "Usefully", "info", "Info"])) ||
    null;
  const media = collectMedia(program);
  const itinerary = splitItinerary(program);
  const services = collectServices(program);
  const destination = collectDestination(program, pricesPayload);
  const raw = { program, prices: pricesPayload };

  return {
    externalId: String(externalId),
    source: "api",
    productType: firstNamed(program, ["Type", "type"])?.toLocaleLowerCase("bg-BG").includes("екскурз") ? "excursion" : "holiday",
    productTypeLabel: firstNamed(program, ["Type", "type"]) || "Package",
    title,
    summary: intro?.slice(0, 320) || publicDescription?.slice(0, 320) || null,
    description: publicDescription,
    country: destination.country || "Destination pending review",
    region: destination.region,
    city: destination.city,
    durationDays: toInteger(valueByNames(program, ["days", "Days", "duration_days", "DurationDays"])),
    durationNights: toInteger(valueByNames(program, ["nights", "Nights", "duration_nights", "DurationNights"])),
    transport: normalizeTransport(valueByNames(program, ["Transport", "transport"])),
    priceFrom,
    currency: firstNamed(program, ["IdCurr", "currency", "Currency"]) === "BGN" ? "BGN" : "EUR",
    heroImageUrl: media[0]?.url || null,
    media,
    dates,
    itinerary,
    highlights: [],
    includedServices: services.included,
    excludedServices: services.excluded,
    supplierEntities: collectSupplierEntities(program, pricesPayload, media, dates, itinerary, services),
    raw,
    rawPayload: raw
  };
}

export function mapStoredAbaxRaw(rawPayload) {
  const raw = asObject(rawPayload);
  const program = asObject(raw.program);
  if (Object.keys(program).length === 0) return null;
  return mapAbaxProgramV2(program, asObject(raw.prices));
}

export async function fetchAbaxOfferCounts(options) {
  const client = createAbaxClient(options);
  const payload = await client.getProgramsList();
  const programs = extractProgramList(payload);

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
  const programs = extractProgramList(programsPayload);
  const selectedPrograms = Number.isFinite(limit) && limit > 0 ? programs.slice(offset, offset + limit) : programs.slice(offset);
  const offers = [];
  const concurrency = Math.min(Math.max(Number(options.concurrency ?? 8) || 8, 1), 12);

  for (let index = 0; index < selectedPrograms.length; index += concurrency) {
    const chunk = selectedPrograms.slice(index, index + concurrency);
    const mapped = await Promise.all(chunk.map(async (program) => {
      const id = firstNamed(program, ["id", "ID", "program_id", "ProgramID", "programId", "code", "Code"]);
      if (!id) return null;
      const prices = options.includePrices === false
        ? { SkippedPrices: true, hotels: valueByNames(program, ["hotels", "Hotels"]) }
        : await client.getProgramPrices(id).catch((error) => ({
            DetailError: error instanceof Error ? error.message : "Abax prices request failed"
          }));
      return mapAbaxProgramV2(program, prices);
    }));
    offers.push(...mapped.filter(Boolean));
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
