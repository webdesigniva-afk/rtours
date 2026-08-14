function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  return [value];
}

function cleanString(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function cleanNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const parsed = Number.parseFloat(value.replace(",", ".").replace(/[^\d.-]+/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function cleanInteger(value) {
  const parsed = cleanNumber(value);
  return parsed === null ? null : Math.round(parsed);
}

function cleanDate(value) {
  const text = cleanString(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const match = text.match(/^(\d{2})[./-](\d{2})[./-](\d{4})/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return null;
}

function normalizeProductType(value) {
  const text = cleanString(value).toLowerCase();
  if (["excursion", "holiday", "hotel", "flight", "service", "package"].includes(text)) return text;
  if (text.includes("hotel")) return "hotel";
  if (text.includes("flight")) return "flight";
  if (text.includes("excursion") || text.includes("екскур")) return "excursion";
  if (text.includes("holiday") || text.includes("почив")) return "holiday";
  return "package";
}

function normalizeTransport(value) {
  const text = cleanString(value).toLowerCase();
  if (["flight", "bus", "own_transport", "mixed"].includes(text)) return text;
  if (text.includes("flight") || text.includes("plane") || text.includes("самолет")) return "flight";
  if (text.includes("bus") || text.includes("автоб")) return "bus";
  if (text.includes("own") || text.includes("собствен")) return "own_transport";
  return "mixed";
}

function normalizeAvailability(value) {
  const text = cleanString(value).toLowerCase();
  if (["available", "limited", "on_request", "sold_out"].includes(text)) return text;
  if (text.includes("sold") || text.includes("stop") || text.includes("няма")) return "sold_out";
  if (text.includes("limited") || text.includes("few") || text.includes("малко")) return "limited";
  if (text.includes("available") || text.includes("yes") || text.includes("има")) return "available";
  return "on_request";
}

function getPath(value, path) {
  const keys = cleanString(path).split(".").filter(Boolean);
  let current = value;

  for (const key of keys) {
    if (current === undefined || current === null) return undefined;
    if (Array.isArray(current)) {
      const index = Number.parseInt(key, 10);
      current = Number.isFinite(index) ? current[index] : undefined;
      continue;
    }
    current = current[key];
  }

  return current;
}

function getFirstPath(value, paths) {
  for (const path of asArray(paths)) {
    const resolved = getPath(value, path);
    if (resolved !== undefined && resolved !== null && resolved !== "") return resolved;
  }
  return undefined;
}

function cleanTextList(value) {
  return asArray(value)
    .flatMap((item) => typeof item === "string" ? item.split(/\r?\n|;/) : [item])
    .map(cleanString)
    .filter(Boolean);
}

function mapMedia(root, item, mapping, title) {
  const media = [];
  const urls = cleanTextList(getFirstPath(item, mapping.mediaUrls));
  const mediaItems = asArray(getFirstPath(item, mapping.mediaItems));

  for (const [index, url] of urls.entries()) {
    media.push({ url, alt: title, key: `image-${index}` });
  }

  for (const [index, mediaItem] of mediaItems.entries()) {
    const raw = asObject(mediaItem);
    const url = cleanString(getFirstPath(raw, mapping.mediaUrl || ["url", "image", "src"]));
    if (!url) continue;
    media.push({
      url,
      alt: cleanString(getFirstPath(raw, mapping.mediaAlt || ["alt", "title", "caption"])) || title,
      key: cleanString(getFirstPath(raw, mapping.mediaKey || ["id", "key"])) || url || `media-${index}`
    });
  }

  const hero = cleanString(getFirstPath(item, mapping.heroImageUrl)) || media[0]?.url || null;
  return { hero, media };
}

function mapDepartures(item, mapping, currency) {
  return asArray(getFirstPath(item, mapping.datesItems)).map((date, index) => {
    const raw = asObject(date);
    const startDate = cleanDate(getFirstPath(raw, mapping.dateStart || ["startDate", "start", "date_from", "from"]));
    const endDate = cleanDate(getFirstPath(raw, mapping.dateEnd || ["endDate", "end", "date_to", "to"])) || startDate;
    const label = cleanString(getFirstPath(raw, mapping.dateLabel || ["label", "title", "name"])) || startDate || `Departure ${index + 1}`;

    return {
      key: cleanString(getFirstPath(raw, mapping.dateKey || ["id", "key", "externalId"])) || label,
      label,
      startDate,
      endDate,
      departurePoints: cleanString(getFirstPath(raw, mapping.dateDeparturePoints || ["departurePoints", "departure", "from"])),
      availability: normalizeAvailability(getFirstPath(raw, mapping.dateAvailability || ["availability", "status"])),
      priceFrom: cleanNumber(getFirstPath(raw, mapping.datePrice || ["priceFrom", "price", "amount"])),
      currency: cleanString(getFirstPath(raw, mapping.dateCurrency || ["currency"])) === "BGN" ? "BGN" : currency,
      seatsTotal: cleanInteger(getFirstPath(raw, mapping.dateSeatsTotal || ["seatsTotal", "capacity"])),
      seatsAvailable: cleanInteger(getFirstPath(raw, mapping.dateSeatsAvailable || ["seatsAvailable", "availableSeats"])),
      raw
    };
  }).filter((date) => date.startDate || date.label);
}

function mapItinerary(item, mapping) {
  return asArray(getFirstPath(item, mapping.itineraryItems)).map((day, index) => {
    const raw = asObject(day);
    const dayNumber = cleanInteger(getFirstPath(raw, mapping.itineraryDay || ["day", "dayNumber", "number"])) || index + 1;
    return {
      key: String(dayNumber),
      dayNumber,
      title: cleanString(getFirstPath(raw, mapping.itineraryTitle || ["title", "name"])) || `Day ${dayNumber}`,
      description: cleanString(getFirstPath(raw, mapping.itineraryDescription || ["description", "text", "body"])),
      accommodation: cleanString(getFirstPath(raw, mapping.itineraryAccommodation || ["accommodation", "hotel"])),
      meals: cleanString(getFirstPath(raw, mapping.itineraryMeals || ["meals", "food"])),
      transport: cleanString(getFirstPath(raw, mapping.itineraryTransport || ["transport"])),
      raw
    };
  }).filter((day) => day.title || day.description);
}

function mapSupplierEntities(offer, media, dates, itinerary, includedServices, excludedServices) {
  return [
    ...media.map((item, index) => ({
      type: "image",
      key: item.key || item.url || `image-${index}`,
      title: item.alt || offer.title,
      url: item.url,
      sortOrder: index,
      raw: item
    })),
    ...dates.map((item, index) => ({
      type: "departure",
      key: item.key || item.label || `departure-${index}`,
      title: item.label,
      startDate: item.startDate,
      endDate: item.endDate,
      price: item.priceFrom,
      currency: item.currency,
      sortOrder: index,
      raw: item.raw || item
    })),
    ...itinerary.map((item, index) => ({
      type: "itinerary_day",
      key: item.key || `day-${index + 1}`,
      title: item.title,
      sortOrder: index,
      raw: item
    })),
    ...includedServices.map((label, index) => ({
      type: "service",
      key: `included-${index}`,
      title: label,
      sortOrder: index,
      raw: { serviceType: "included", label }
    })),
    ...excludedServices.map((label, index) => ({
      type: "service",
      key: `excluded-${index}`,
      title: label,
      sortOrder: includedServices.length + index,
      raw: { serviceType: "excluded", label }
    }))
  ];
}

export function normalizeGenericSupplierPayload(payload, options = {}) {
  const provider = cleanString(options.provider) || "supplier";
  const mapping = asObject(options.mapping);
  const source = cleanString(options.source) || "json";
  const root = asObject(payload);
  const itemsValue = getFirstPath(root, mapping.itemsPath || ["offers", "items", "data", "results"]);
  const items = Array.isArray(itemsValue) ? itemsValue : Array.isArray(payload) ? payload : [payload];

  return items.map((rawItem, index) => {
    const item = asObject(rawItem);
    const title = cleanString(getFirstPath(item, mapping.title || ["title", "name", "offerTitle"])) || `Supplier offer ${index + 1}`;
    const externalId = cleanString(getFirstPath(item, mapping.externalId || ["externalId", "id", "code", "slug"])) || `${provider}-${index + 1}`;
    const currency = cleanString(getFirstPath(item, mapping.currency || ["currency"])) === "BGN" ? "BGN" : "EUR";
    const { hero, media } = mapMedia(root, item, mapping, title);
    const dates = mapDepartures(item, mapping, currency);
    const itinerary = mapItinerary(item, mapping);
    const includedServices = cleanTextList(getFirstPath(item, mapping.includedServices || ["includedServices", "included", "includes"]));
    const excludedServices = cleanTextList(getFirstPath(item, mapping.excludedServices || ["excludedServices", "excluded", "excludes"]));
    const offer = {
      provider,
      externalId,
      source,
      title,
      summary: cleanString(getFirstPath(item, mapping.summary || ["summary", "shortDescription", "subtitle"])) || null,
      description: cleanString(getFirstPath(item, mapping.description || ["description", "body", "program"])) || null,
      productType: normalizeProductType(getFirstPath(item, mapping.productType || ["productType", "type", "category"])),
      productTypeLabel: cleanString(getFirstPath(item, mapping.productTypeLabel || ["productTypeLabel", "categoryLabel"])) || null,
      country: cleanString(getFirstPath(item, mapping.country || ["country", "destination.country"])) || null,
      region: cleanString(getFirstPath(item, mapping.region || ["region", "destination.region", "destination"])) || null,
      city: cleanString(getFirstPath(item, mapping.city || ["city", "destination.city"])) || null,
      durationDays: cleanInteger(getFirstPath(item, mapping.durationDays || ["durationDays", "days"])),
      durationNights: cleanInteger(getFirstPath(item, mapping.durationNights || ["durationNights", "nights"])),
      transport: normalizeTransport(getFirstPath(item, mapping.transport || ["transport", "transportType"])),
      priceFrom: cleanNumber(getFirstPath(item, mapping.priceFrom || ["priceFrom", "price", "amount"])),
      currency,
      heroImageUrl: hero,
      media,
      dates,
      itinerary,
      highlights: cleanTextList(getFirstPath(item, mapping.highlights || ["highlights", "tags"])),
      includedServices,
      excludedServices,
      raw: rawItem
    };

    return {
      ...offer,
      supplierEntities: mapSupplierEntities(offer, media, dates, itinerary, includedServices, excludedServices)
    };
  });
}
