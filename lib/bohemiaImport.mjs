import { createHash } from "node:crypto";
import { XMLParser } from "fast-xml-parser";
import { upsertSupplierOffer } from "./supplierImport.mjs";

const PROVIDER = "bohemia";

const transportMap = {
  AIRPLANE: "flight",
  BUS: "bus",
  BUSAIRPLANE: "mixed",
  NOTRANSPORT: "own_transport"
};

const countryCodeAliases = {
  BG: "България",
  ES: "Испания",
  GR: "Гърция",
  TR: "Турция",
  IT: "Италия",
  FR: "Франция",
  PT: "Португалия",
  DE: "Германия",
  AT: "Австрия",
  CH: "Швейцария",
  CZ: "Чехия",
  HU: "Унгария",
  RO: "Румъния",
  RS: "Сърбия",
  MK: "Северна Македония",
  AL: "Албания",
  HR: "Хърватия",
  ME: "Черна гора",
  SI: "Словения",
  BA: "Босна и Херцеговина",
  EG: "Египет",
  TN: "Тунис",
  MA: "Мароко",
  AE: "Обединени арабски емирства",
  JO: "Йордания",
  IL: "Израел",
  CY: "Кипър",
  MT: "Малта",
  US: "САЩ",
  GB: "Великобритания"
};

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
      const nested = firstValue(value["#text"], value.Text, value.Value, value.Name, value.Title);
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
  const normalized = String(value).replace(/\s+/g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function toInteger(value) {
  const parsed = Number.parseInt(String(value ?? "").replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function toDate(value) {
  const raw = firstValue(value);
  if (!raw) return null;

  const bgMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (bgMatch) {
    const [, day, month, year] = bgMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return isoMatch ? isoMatch[0] : null;
}

function toDisplayDate(value) {
  const date = toDate(value) || (typeof value === "string" ? value : "");
  const match = String(date).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : date;
}

function firstInteger(...values) {
  for (const value of values) {
    const parsed = toInteger(value);
    if (parsed !== null) return parsed;
  }
  return null;
}

function inferredDurationNights(days, nights) {
  if (Number.isFinite(nights) && nights >= 0) return nights;
  if (Number.isFinite(days) && days > 0) return Math.max(days - 1, 0);
  return null;
}

function normalizeCurrency(value) {
  const currency = firstValue(value)?.toUpperCase();
  return currency === "BGN" ? "BGN" : "EUR";
}

function normalizeTransport(value) {
  return transportMap[firstValue(value)?.toUpperCase() || ""] || "mixed";
}

function normalizeCountryName(value) {
  const raw = firstValue(value);
  if (!raw) return null;
  const code = raw.trim().toUpperCase();
  if (countryCodeAliases[code]) return countryCodeAliases[code];

  if (/^[A-Z]{2}$/.test(code)) {
    try {
      return new Intl.DisplayNames(["bg"], { type: "region" }).of(code) || raw;
    } catch {
      return raw;
    }
  }

  return raw;
}

function normalizeAvailability(value) {
  const status = firstValue(value)?.toUpperCase();
  if (status === "CONFIRMED" || status === "AVAILABLE" || status === "LAST") return "available";
  if (status === "SOLDOUT" || status === "SOLD_OUT" || status === "FULL" || status === "STOP") return "sold_out";
  return "on_request";
}

function createSlug(value, fallback = "bohemia-oferta") {
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

function decodeHtmlEntities(value) {
  const text = firstValue(value);
  if (!text) return null;

  return text
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&");
}

function textFromHtml(value) {
  const text = decodeHtmlEntities(value);
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

function cleanBohemiaLabel(value) {
  let text = textFromHtml(value) || "";
  if (!text) return "";

  text = text
    .replace(/^(?:\d{2,4}|[A-Z]{2,})(?:-[A-Z0-9]{2,}){0,5}-(?=\S)/, "")
    .replace(/\bевро\b/gi, "EUR")
    .replace(/\bлв\.?\b/gi, "BGN")
    .replace(/\s+-\s+/g, " - ")
    .replace(/\s{2,}/g, " ")
    .trim();

  return text;
}

const STRICT_DEPARTURE_CITIES = [
  "\u0421\u043e\u0444\u0438\u044f",
  "\u0412\u0430\u0440\u043d\u0430",
  "\u041f\u043b\u043e\u0432\u0434\u0438\u0432",
  "\u0411\u0443\u0440\u0433\u0430\u0441",
  "\u0420\u0443\u0441\u0435",
  "\u0412\u0435\u043b\u0438\u043a\u043e \u0422\u044a\u0440\u043d\u043e\u0432\u043e",
  "\u0421\u0442\u0430\u0440\u0430 \u0417\u0430\u0433\u043e\u0440\u0430",
  "\u0428\u0443\u043c\u0435\u043d",
  "\u0414\u043e\u0431\u0440\u0438\u0447",
  "\u041f\u043b\u0435\u0432\u0435\u043d",
  "\u0411\u043b\u0430\u0433\u043e\u0435\u0432\u0433\u0440\u0430\u0434",
  "\u0425\u0430\u0441\u043a\u043e\u0432\u043e",
  "\u042f\u043c\u0431\u043e\u043b",
  "\u0421\u043b\u0438\u0432\u0435\u043d",
  "\u0413\u0430\u0431\u0440\u043e\u0432\u043e",
  "\u041f\u0435\u0440\u043d\u0438\u043a",
  "\u041f\u0430\u0437\u0430\u0440\u0434\u0436\u0438\u043a",
  "\u041a\u044e\u0441\u0442\u0435\u043d\u0434\u0438\u043b",
  "\u0412\u0440\u0430\u0446\u0430",
  "\u041c\u043e\u043d\u0442\u0430\u043d\u0430",
  "\u0412\u0438\u0434\u0438\u043d",
  "\u0421\u0438\u043b\u0438\u0441\u0442\u0440\u0430",
  "\u0420\u0430\u0437\u0433\u0440\u0430\u0434",
  "\u0422\u044a\u0440\u0433\u043e\u0432\u0438\u0449\u0435",
  "\u0421\u043c\u043e\u043b\u044f\u043d",
  "\u041a\u044a\u0440\u0434\u0436\u0430\u043b\u0438",
  "\u0411\u0443\u043a\u0443\u0440\u0435\u0449"
];

function escapeDepartureRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractStrictDepartureCities(value) {
  const text = textFromHtml(value);
  if (!text) return null;

  const found = STRICT_DEPARTURE_CITIES.filter((city) => {
    const pattern = new RegExp(`(^|[^\u0410-\u042f\u0430-\u044fA-Za-z])${escapeDepartureRegex(city)}(?=[^\u0410-\u042f\u0430-\u044fA-Za-z]|$)`, "i");
    return pattern.test(text);
  });

  return found.length ? found.join(", ") : null;
}

function cleanDeparturePointStrict(value) {
  const text = cleanBohemiaLabel(value)
    .replace(/\b\u043b\u0435\u0442\u0438\u0449\u0435\b/gi, "")
    .replace(/\s+(?:\u0432|\u043e\u043a\u043e\u043b\u043e)\s+\d{1,2}[:.]\d{2}.*$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!text) return null;
  const knownCities = extractStrictDepartureCities(text);
  if (knownCities) return knownCities;

  return text
    .split(/\s*(?:,|\/|;|\+|\s+\u0438\s+|\s+\u0438\u043b\u0438\s+)\s*/i)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, list) => list.findIndex((other) => other.toLowerCase() === item.toLowerCase()) === index)
    .slice(0, 4)
    .join(", ") || null;
}

function extractDeparturePointsFromTextStrict(...values) {
  const text = values.map((value) => textFromHtml(value)).filter(Boolean).join("\n");
  if (!text) return null;

  const patterns = [
    /(?:\u043e\u0442\u043f\u044a\u0442\u0443\u0432\u0430\u043d\u0435|\u0442\u0440\u044a\u0433\u0432\u0430\u043d\u0435|\u0437\u0430\u043c\u0438\u043d\u0430\u0432\u0430\u043d\u0435)\s+\u043e\u0442\s+([^.\n\r;:()]{2,80})/i,
    /(?:\u043f\u043e\u043b\u0435\u0442|\u043f\u043e\u043b\u0435\u0442\u0438)\s+\u043e\u0442\s+([^.\n\r;:()]{2,80})/i,
    /(?:\u0430\u0432\u0442\u043e\u0431\u0443\u0441|\u0441\u0430\u043c\u043e\u043b\u0435\u0442)\s+\u043e\u0442\s+([^.\n\r;:()]{2,80})/i,
    /\u043e\u0442\s+(\u0421\u043e\u0444\u0438\u044f|\u0412\u0430\u0440\u043d\u0430|\u041f\u043b\u043e\u0432\u0434\u0438\u0432|\u0411\u0443\u0440\u0433\u0430\u0441|\u0420\u0443\u0441\u0435|\u0412\u0435\u043b\u0438\u043a\u043e \u0422\u044a\u0440\u043d\u043e\u0432\u043e|\u0421\u0442\u0430\u0440\u0430 \u0417\u0430\u0433\u043e\u0440\u0430|\u0428\u0443\u043c\u0435\u043d|\u0414\u043e\u0431\u0440\u0438\u0447|\u041f\u043b\u0435\u0432\u0435\u043d|\u0411\u043b\u0430\u0433\u043e\u0435\u0432\u0433\u0440\u0430\u0434|\u0425\u0430\u0441\u043a\u043e\u0432\u043e|\u042f\u043c\u0431\u043e\u043b|\u0421\u043b\u0438\u0432\u0435\u043d)(?=[,.\n\r; ]|$)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return extractStrictDepartureCities(match[1]);
  }

  return extractStrictDepartureCities(text);
}

function splitServicePrice(value) {
  const label = cleanBohemiaLabel(value);
  const match = label.match(/^(.*?)(?:\s+-\s+|\s+)(\d+(?:[.,]\d+)?)\s*(EUR|BGN)$/i);

  if (!match) {
    return { title: label, price: null, currency: null, label };
  }

  const [, title, amount, currency] = match;
  const price = toNumber(amount);
  const normalizedCurrency = normalizeCurrency(currency);
  const cleanTitle = title.trim();

  return {
    title: cleanTitle || label,
    price,
    currency: normalizedCurrency,
    label: price === null ? label : `${cleanTitle} - ${price} ${normalizedCurrency}`
  };
}

function parseJsonObject(value) {
  if (!value) return {};
  if (typeof value === "object") return asObject(value);
  if (typeof value !== "string") return {};

  try {
    return asObject(JSON.parse(value));
  } catch {
    return {};
  }
}

function addDays(date, days) {
  if (!date || !days) return null;
  const value = new Date(`${date}T00:00:00.000Z`);
  if (!Number.isFinite(value.getTime())) return null;
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function findNestedArray(root, keys) {
  let current = root;

  for (const key of keys) {
    current = asObject(current)[key];
    if (current === undefined || current === null) return [];
  }

  return asArray(current);
}

function firstNested(root, keys) {
  let current = root;

  for (const key of keys) {
    current = asObject(current)[key];
    if (current === undefined || current === null) return null;
  }

  return current;
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

function findDeepValues(root, names, depth = 0, results = []) {
  if (depth > 7 || root === undefined || root === null) return results;

  if (Array.isArray(root)) {
    for (const item of root) findDeepValues(item, names, depth + 1, results);
    return results;
  }

  if (typeof root !== "object") return results;

  for (const [key, value] of Object.entries(root)) {
    if (names.some((name) => name.toLowerCase() === key.toLowerCase())) {
      results.push(value);
    }
    findDeepValues(value, names, depth + 1, results);
  }

  return results;
}

function hasBohemiaError(payload) {
  return Boolean(asObject(payload).Error || asObject(payload?.Resultset).Error);
}

function resolveMediaUrl(value, baseUrl) {
  const raw = firstValue(value);
  if (!raw) return null;
  if (!/\.(jpe?g|png|webp|gif)(\?|$)/i.test(raw) && !/^https?:\/\//i.test(raw)) return null;

  try {
    return new URL(raw, `${baseUrl.replace(/\/+$/, "")}/`).toString();
  } catch {
    return raw;
  }
}

function mapTrip(trip, index, currency, fallbackDeparturePoints = null) {
  const row = asObject(trip);
  const departureDate = toDate(firstNamed(row, ["DepartureDate", "StartDate", "DateFrom", "FromDate", "BeginDate", "CheckIn", "Start"]));
  const returnDate = toDate(firstNamed(row, ["ReturnDate", "EndDate", "DateTo", "ToDate", "FinishDate", "CheckOut", "End"]));
  const price = toNumber(firstNamed(row, ["Price", "MinPrice", "PriceFrom", "TotalPrice", "AdultPrice", "SinglePrice"]));
  const status = firstNamed(row, ["Status", "Availability", "State", "BookingStatus"]);
  const promotion = firstNamed(row, ["Promotion", "Promo", "IsPromotion"]);
  const originalPrice = toNumber(firstNamed(row, ["OriginalPrice", "OldPrice", "RegularPrice"]));
  const promoEnd = firstNamed(row, ["PromoEndDate", "PromotionEndDate", "OptionDate", "OptionUntil"]);
  const tripId = firstValue(row.TripID, row["@_TripID"], row.id, row["@_id"], row.ID, row["@_ID"]);
  const freeSeats = toInteger(valueByNames(row, ["FreeSeats", "AvailableSeats", "SeatsAvailable", "FreePlaces", "PlacesAvailable"]));
  const totalSeats = toInteger(valueByNames(row, ["TotalSeats", "Capacity", "SeatsTotal", "Places", "TotalPlaces"]));
  const notes = [
    tripId ? `Bohemia TripID: ${tripId}` : null,
    status ? `Статус: ${status}` : null,
    promotion === "Y" ? `Промо цена${originalPrice ? `, стандартна цена ${originalPrice}` : ""}${promoEnd ? ` до ${promoEnd}` : ""}` : null
  ]
    .filter(Boolean)
    .join(" | ");

  return {
    label: firstValue(row.Label) || (departureDate ? `Заминаване ${toDisplayDate(departureDate)}` : `Период ${index + 1}`),
    startDate: departureDate,
    endDate: returnDate,
    departurePoints: cleanDeparturePointStrict(firstValue(row.DeparturePoint, row.DepartureCity)) || extractDeparturePointsFromTextStrict(row.RouteDesc) || fallbackDeparturePoints,
    availability: normalizeAvailability(status),
    priceFrom: price,
    currency,
    seatsTotal: totalSeats,
    seatsAvailable: freeSeats,
    notes: notes || null,
    raw: row
  };
}

function collectTrips(searchResult, details, currency, fallbackDeparturePoints = null) {
  const containers = [
    ...findDeepValues(details, ["AvailableTrips", "Trips", "Departures", "Dates", "DepartureDates", "Offers"]),
    ...findDeepValues(searchResult, ["AvailableTrips", "Trips", "Departures", "Dates", "DepartureDates", "Offers"])
  ];
  const trips = [];

  for (const container of containers) {
    const object = asObject(container);
    const values = [
      ...asArray(object.Trip),
      ...asArray(object.Trips),
      ...asArray(object.Departure),
      ...asArray(object.Date),
      ...asArray(object.Offer),
      ...(Array.isArray(container) ? container : [])
    ];
    for (const value of values) {
      if (value && typeof value === "object") trips.push(value);
    }
  }

  const uniqueTrips = [];
  const seen = new Set();
  for (const trip of trips) {
    const key = JSON.stringify(trip);
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueTrips.push(trip);
  }

  return uniqueTrips
    .map((trip, index) => mapTrip(trip, index, currency, fallbackDeparturePoints))
    .filter((trip) => trip.startDate || trip.priceFrom !== null || trip.seatsAvailable !== null || trip.seatsTotal !== null);
}

function ratePrice(rate) {
  const values = asArray(rate).map(toNumber).filter((value) => value !== null && value >= 0);
  return values.length ? Math.min(...values) : null;
}

function mapRates(details, currency, durationDays, fallbackDeparturePoints = null) {
  const rates = parseJsonObject(details.Rates);
  const dates = asArray(rates.DATES).map(toDate).filter(Boolean);
  const hotels = asObject(rates.HOTELS);
  const results = asArray(rates.RESULTS);
  const byDate = new Map();

  for (const date of dates) {
    byDate.set(date, {
      label: `Заминаване ${toDisplayDate(date)}`,
      startDate: date,
      endDate: addDays(date, Math.max((durationDays || 1) - 1, 0)),
      departurePoints: fallbackDeparturePoints,
      availability: "on_request",
      priceFrom: null,
      currency,
      seatsTotal: null,
      seatsAvailable: null,
      notes: null,
      raw: { source: "Rates", date, hotels: [], rooms: [], results: [] }
    });
  }

  for (const result of results) {
    const row = asArray(result);
    const hotelId = firstValue(row[0]);
    const roomId = firstValue(row[1]);
    const date = toDate(row[3]);
    const rowCurrency = normalizeCurrency(row[4] || currency);
    const price = asArray(row[5]).map(ratePrice).filter((value) => value !== null).reduce((lowest, value) => {
      return lowest === null || value < lowest ? value : lowest;
    }, null);

    if (!date) continue;

    const hotelData = asArray(hotels[`H${hotelId}`] || hotels[hotelId]);
    const hotelName = firstValue(hotelData[0]);
    const rooms = asObject(hotelData[1]);
    const roomName = firstValue(asArray(rooms[roomId])[0]);
    const availabilityData = asObject(asObject(hotelData[3])[row[3]]);
    const availability = normalizeAvailability(firstValue(availabilityData.Availability, availabilityData.Status, availabilityData.Confirmed ? "CONFIRMED" : null));

    if (!byDate.has(date)) {
      byDate.set(date, {
        label: `Заминаване ${toDisplayDate(date)}`,
        startDate: date,
        endDate: addDays(date, Math.max((durationDays || 1) - 1, 0)),
        departurePoints: fallbackDeparturePoints,
        availability,
        priceFrom: price,
        currency: rowCurrency,
        seatsTotal: null,
        seatsAvailable: null,
        notes: null,
        raw: { source: "Rates", date, hotels: [], rooms: [], results: [] }
      });
    }

    const item = byDate.get(date);
    item.currency = rowCurrency;
    if (price !== null) item.priceFrom = item.priceFrom === null || price < item.priceFrom ? price : item.priceFrom;
    if (availability === "available") item.availability = "available";
    item.raw.results.push(result);
    if (hotelName && !item.raw.hotels.includes(hotelName)) item.raw.hotels.push(hotelName);
    if (roomName && !item.raw.rooms.includes(roomName)) item.raw.rooms.push(roomName);
  }

  return [...byDate.values()].map((item, index) => ({
    ...item,
    label: dates[index] ? `Дата ${index + 1}: ${toDisplayDate(item.startDate)}` : item.label,
    notes: [
      item.raw.hotels.length ? `Хотели: ${item.raw.hotels.slice(0, 4).join(", ")}` : null,
      item.raw.rooms.length ? `Стаи: ${item.raw.rooms.slice(0, 6).join(", ")}` : null
    ].filter(Boolean).join(" | ") || null
  }));
}

function mapServices(details, keyCandidates) {
  for (const keys of keyCandidates) {
    const value = firstNested(details, keys);
    if (!value) continue;

    if (typeof value === "string") {
      return value
        .split(/\r?\n|;|•/)
        .map((item) => cleanBohemiaLabel(item))
        .filter(Boolean)
        .slice(0, 30);
    }

    const values = asArray(value.Item || value.Service || value.Text || value.Desc || value);
    const labels = values
      .map((item) => firstValue(asObject(item).Name, asObject(item).Desc, asObject(item)["#text"], item))
      .map(cleanBohemiaLabel)
      .filter(Boolean);

    if (labels.length > 0) return labels.slice(0, 30);
  }

  return [];
}

function mapAdditionalServiceItems(details) {
  const services = asArray(firstNested(details, ["AdditionalServices", "ServiceData"]));

  return services
    .map((item, index) => {
      const row = asObject(item);
      const rates = asArray(asObject(row.ServiceRates).Rate);
      const prices = rates
        .map((rate) => ({
          price: toNumber(asObject(rate)["@_Price"]),
          currency: normalizeCurrency(asObject(rate)["@_Currency"])
        }))
        .filter((rate) => rate.price !== null);
      const lowest = prices.reduce((result, rate) => result === null || rate.price < result.price ? rate : result, null);
      const parsed = splitServicePrice(row.Desc);
      const title = parsed.title || `Допълнителна услуга ${index + 1}`;
      const price = lowest?.price ?? parsed.price;
      const currency = lowest?.currency ?? parsed.currency;

      if (!title) return null;
      return {
        title,
        label: price === null ? title : `${title} - ${price} ${currency || "EUR"}`,
        price,
        currency,
        raw: {
          ...row,
          cleanTitle: title,
          cleanLabel: price === null ? title : `${title} - ${price} ${currency || "EUR"}`,
          price,
          currency
        }
      };
    })
    .filter(Boolean)
    .slice(0, 40);
}

function mapAdditionalServices(details) {
  return mapAdditionalServiceItems(details).map((item) => item.label);
}

function mapTextEntities(details, type, keyPath, titlePrefix) {
  return asArray(firstNested(details, keyPath))
    .map((item, index) => {
      const row = asObject(item);
      const text = textFromHtml(firstValue(row["#text"], row.Desc, row.Text, item));
      if (!text) return null;
      return {
        type,
        key: firstValue(row["@_Type"], row["@_id"], row.id, `${type}-${index + 1}`),
        title: text || `${titlePrefix} ${index + 1}`,
        sortOrder: index,
        raw: row
      };
    })
    .filter(Boolean);
}

function mapRecordEntities(details, type, keyPath, titlePrefix) {
  return asArray(firstNested(details, keyPath))
    .map((item, index) => {
      const row = asObject(item);
      if (Object.keys(row).length === 0) return null;
      const parts = [
        firstValue(row.Desc, row.Name, row["#text"]),
        row["@_Amount"] ? `${row["@_Amount"]}${row["@_Currency"] ? ` ${row["@_Currency"]}` : ""}` : null,
        row["@_CoverageValue"] ? `покритие ${row["@_CoverageValue"]}${row["@_CoverageCurrency"] ? ` ${row["@_CoverageCurrency"]}` : ""}` : null,
        row["@_Days"] ? `${row["@_Days"]} дни` : null,
        row["@_From"] || row["@_To"] ? `период ${row["@_From"] || "0"}-${row["@_To"] || ""}` : null
      ].map(textFromHtml).filter(Boolean);

      return {
        type,
        key: firstValue(row["@_id"], row.id, `${type}-${index + 1}`),
        title: parts.join(" · ") || `${titlePrefix} ${index + 1}`,
        sortOrder: index,
        raw: row
      };
    })
    .filter(Boolean);
}

function mapItinerary(details) {
  const candidates = [
    findNestedArray(details, ["DailyProgram", "Day"]),
    findNestedArray(details, ["Program", "Day"]),
    findNestedArray(details, ["Itinerary", "Day"]),
    findNestedArray(details, ["Days", "Day"]),
    ...findDeepValues(details, ["Day", "ProgramDay", "ItineraryDay"]).map(asArray)
  ].find((items) => items.length > 0);

  if (!candidates) return [];

  return candidates
    .map((item, index) => {
      const row = asObject(item);
      const description = textFromHtml(firstValue(row.Description, row.Desc, row.Text, row.Program));
      const title = firstValue(row.Title, row.Name) || `Ден ${index + 1}`;

      if (!description && !title) return null;

      return {
        dayNumber: toInteger(row.DayNumber ?? row.Day) || index + 1,
        title,
        description: description || "",
        accommodation: firstValue(row.Accommodation, row.HotelName) || "",
        meals: firstValue(row.Meals, row.Board) || "",
        transport: firstValue(row.Transport, row.Transfer) || ""
      };
    })
    .filter(Boolean);
}

function mapItineraryV2(details) {
  const candidates = [
    findNestedArray(details, ["DailyProgram", "Day"]),
    findNestedArray(details, ["Program", "Day"]),
    findNestedArray(details, ["Itinerary", "Day"]),
    findNestedArray(details, ["Days", "Day"]),
    ...findDeepValues(details, ["ProgramDay", "ItineraryDay"]).map(asArray)
  ].find((items) => items.length > 0);

  if (!candidates) return [];

  return candidates
    .map((item, index) => {
      const row = asObject(item);
      const descriptionRaw = firstValue(row.Description, row.Desc, row.Text, row.Program);
      const description = textFromHtml(descriptionRaw);
      const dayNumber = toInteger(row.DayNumber ?? row.Day ?? row.Num) || index + 1;
      const title = firstValue(row.Title, row.Name) || `Ден ${dayNumber}`;

      if (!description && !title) return null;

      return {
        dayNumber,
        title,
        description: description || "",
        accommodation: textFromHtml(firstValue(row.Accommodation, row.HotelName)) || "",
        meals: textFromHtml(firstValue(row.Meals, row.Board)) || "",
        transport: textFromHtml(firstValue(row.Transport, row.Transfer)) || "",
        descriptionHtml: decodeHtmlEntities(descriptionRaw) || ""
      };
    })
    .filter(Boolean);
}

function mapMedia(details, main, baseUrl) {
  const values = [
    valueByNames(main, ["MainImage", "MainPicture", "MainPhoto", "Image", "Picture", "Photo", "PhotoURL", "ImageURL"]),
    ...findDeepValues(details, ["Image", "Images", "Picture", "Pictures", "Photo", "Photos", "Gallery", "GalleryImages", "URL", "Url"])
  ];
  const urls = [];

  function collect(value) {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach(collect);
      return;
    }
    if (typeof value === "object") {
      const object = asObject(value);
      const direct = firstNamed(object, ["URL", "Url", "ImageURL", "PhotoURL", "PictureURL", "File", "Path", "Src", "#text"]);
      if (direct) collect(direct);
      for (const item of Object.values(object)) collect(item);
      return;
    }
    const resolved = resolveMediaUrl(value, baseUrl);
    if (resolved && !urls.includes(resolved)) urls.push(resolved);
  }

  values.forEach(collect);

  return urls.slice(0, 24).map((url, index) => ({
    url,
    alt: index === 0 ? "Основна снимка" : `Снимка ${index + 1}`,
    isPrimary: index === 0,
    sortOrder: index
  }));
}

function collectEntityCandidates(root, names) {
  const values = findDeepValues(root, names);
  const candidates = [];

  function collect(value) {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach(collect);
      return;
    }
    if (typeof value === "object") {
      candidates.push(value);
    }
  }

  values.forEach(collect);
  return candidates;
}

function mapHotels(details) {
  const rates = parseJsonObject(details.Rates);
  const rateHotels = Object.entries(asObject(rates.HOTELS)).map(([hotelKey, value], index) => {
    const data = asArray(value);
    const rooms = asObject(data[1]);
    const title = textFromHtml(data[0]) || `Хотел ${index + 1}`;

    return {
      type: "hotel",
      key: hotelKey,
      title,
      sortOrder: index,
      raw: {
        hotelKey,
        title,
        category: firstValue(data[2]),
        availabilityByDate: asObject(data[3]),
        rooms: Object.entries(rooms).map(([roomId, roomData]) => ({
          roomId,
          name: textFromHtml(asArray(roomData)[0]),
          note: textFromHtml(asArray(roomData)[1])
        }))
      }
    };
  });

  if (rateHotels.length) return rateHotels.slice(0, 80);

  return collectEntityCandidates(details, ["Hotel", "Hotels", "Accommodation", "Accommodations"])
    .map((item, index) => {
      const row = asObject(item);
      const title = firstNamed(row, ["Name", "HotelName", "Title", "Accommodation", "Category"]);
      if (!title && Object.keys(row).length === 0) return null;
      return {
        type: "hotel",
        key: firstNamed(row, ["HotelID", "HotelId", "ID", "id", "Code"]) || title || `hotel-${index + 1}`,
        title: title || `Хотел ${index + 1}`,
        sortOrder: index,
        raw: row
      };
    })
    .filter(Boolean)
    .slice(0, 80);
}

function mapSupplierEntities(offer, details, main) {
  const entities = [];

  offer.media.forEach((item, index) => {
    entities.push({
      type: "image",
      key: item.url,
      title: item.alt,
      url: item.url,
      sortOrder: index,
      raw: item
    });
  });

  offer.dates.forEach((item, index) => {
    entities.push({
      type: "departure",
      key: firstValue(item.raw?.TripID, item.raw?.ID, item.raw?.id, item.label) || `departure-${index + 1}`,
      title: item.label,
      startDate: item.startDate,
      endDate: item.endDate,
      price: item.priceFrom,
      currency: item.currency,
      sortOrder: index,
      raw: item.raw
    });
  });

  offer.itinerary.forEach((item, index) => {
    entities.push({
      type: "itinerary_day",
      key: String(item.dayNumber || index + 1),
      title: item.title,
      sortOrder: index,
      raw: item
    });
  });

  [
    ...offer.includedServices.map((label, index) => ({ label, serviceType: "included", sortOrder: index })),
    ...offer.excludedServices.map((label, index) => ({ label, serviceType: "excluded", sortOrder: offer.includedServices.length + index }))
  ].forEach((item) => {
    entities.push({
      type: "service",
      key: item.label,
      title: item.label,
      sortOrder: item.sortOrder,
      raw: { label: item.label, serviceType: item.serviceType }
    });
  });

  mapHotels(details).forEach((hotel) => entities.push(hotel));

  mapAdditionalServiceItems(details).forEach((service, index) => {
    entities.push({
      type: "additional_service",
      key: service.title,
      title: service.label,
      price: service.price,
      currency: service.currency,
      sortOrder: index,
      raw: service.raw
    });
  });

  mapTextEntities(details, "useful_info", ["UsefulInfo", "Desc"], "Полезна информация").forEach((entity) => entities.push(entity));
  mapRecordEntities(details, "payment_policy", ["PaymentPolicy", "Item"], "Плащане").forEach((entity) => entities.push(entity));
  mapRecordEntities(details, "cancel_policy", ["CancelPolicy", "Item"], "Анулация").forEach((entity) => entities.push(entity));
  mapRecordEntities(details, "insurance", ["Insurance", "Item"], "Застраховка").forEach((entity) => entities.push(entity));

  [
    ["main_details", main],
    ["details_root", details]
  ].forEach(([type, raw], index) => {
    if (raw && Object.keys(asObject(raw)).length > 0) {
      entities.push({
        type,
        key: type,
        title: type,
        sortOrder: index,
        raw
      });
    }
  });

  return entities;
}

function mapBohemiaOffer(kind, searchResult, detailRoot, baseUrl) {
  const details = asObject(detailRoot?.ExcursionDetails || detailRoot?.HolidayDetails || detailRoot || {});
  const main = asObject(details.MainDetails || details);
  const externalId = firstValue(main.OfferID, searchResult.OfferID);
  const title = firstValue(main.OfferTitle, searchResult.OfferTitle, main.ShortTitle);

  if (!externalId || !title) return null;

  const currency = normalizeCurrency(main.Currency ?? searchResult.Currency);
  const route = firstValue(main.RouteDesc);
  const description = textFromHtml(firstValue(main.Description, main.Desc, details.Description, details.Overview, route));
  const departurePoints = extractDeparturePointsFromTextStrict(
    main.DeparturePoint,
    main.DepartureCity,
    main.OfferTitle,
    searchResult.OfferTitle,
    route,
    main.Description,
    main.Desc,
    details.Description,
    details.Overview
  );
  const rateTrips = mapRates(details, currency, toInteger(main.Duration), departurePoints);
  const trips = rateTrips.length ? rateTrips : collectTrips(searchResult, details, currency, departurePoints);
  const priceFrom = trips.reduce((lowest, trip) => {
    if (trip.priceFrom === null) return lowest;
    return lowest === null || trip.priceFrom < lowest ? trip.priceFrom : lowest;
  }, toNumber(searchResult.Price));
  const tagline = firstValue(main.OfferTitleTagline, main.ShortTitleTagline, searchResult.OfferTitleTagline);
  const destinations = asArray(asObject(main.Destinations).CountryID).map(normalizeCountryName).filter(Boolean);
  const media = mapMedia(details, main, baseUrl);
  const durationDays = firstInteger(main.Duration, main.Days, main.DaysCount, searchResult.Duration, searchResult.Days);
  const durationNights = firstInteger(main.Nights, main.NightsCount, main.Overnights, searchResult.Nights, searchResult.Overnights);

  const offer = {
    raw: { kind, searchResult, details },
    externalId: `${kind}:${externalId}`,
    title,
    summary: tagline || route || null,
    description,
    country: normalizeCountryName(firstValue(main.PrimaryDestinationCountryID, searchResult.PrimaryDestinationCountryID, destinations[0])) || "Бохемия",
    region: route || destinations.join(", ") || null,
    city: null,
    durationDays,
    durationNights: inferredDurationNights(durationDays, durationNights),
    transport: normalizeTransport(main.TransportationType ?? searchResult.TransportationType),
    productType: kind === "holiday" ? "holiday" : "excursion",
    productTypeLabel: kind === "holiday" ? "Почивка" : "Екскурзия",
    priceFrom,
    currency,
    heroImageUrl: media[0]?.url || null,
    media,
    dates: trips,
    itinerary: mapItineraryV2(details),
    highlights: [],
    includedServices: mapServices(details, [
      ["PriceIncludes", "Item"],
      ["PriceIncludes", "Desc"],
      ["PriceIncludes"],
      ["IncludedServices", "Service"],
      ["IncludedServices", "Desc"],
      ["IncludedServices"]
    ]),
    excludedServices: mapServices(details, [
        ["PriceExcludes", "Item"],
        ["PriceExcludes"],
        ["PriceDoesNotInclude", "Desc"],
        ["PriceDoesNotInclude"],
        ["ExcludedServices", "Service"],
        ["ExcludedServices", "Desc"],
        ["ExcludedServices"]
      ])
  };

  offer.supplierEntities = mapSupplierEntities(offer, details, main);

  return offer;
}

export function mapStoredBohemiaRaw(rawPayload, baseUrl) {
  const raw = asObject(rawPayload);
  return mapBohemiaOffer(raw.kind || "holiday", asObject(raw.searchResult), raw.details, baseUrl);
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

async function replaceRelations(client, offerId, offer) {
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
    [offerId, offer.country || "Бохемия", offer.region || "", offer.city || ""]
  );

  for (const [index, media] of offer.media.entries()) {
    await client.query(
      `
        insert into offer_media (offer_id, url, alt, source, is_primary, sort_order)
        values ($1, $2, $3, 'bohemia', $4, $5)
      `,
      [offerId, media.url, media.alt || offer.title, index === 0, index]
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
        date.availability,
        date.priceFrom,
        date.currency,
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
      [offerId, day.dayNumber, day.title, day.description, day.accommodation, day.meals, day.transport, index]
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

export async function upsertBohemiaOffer(client, offer, options = {}) {
  await client.query("begin");
  try {
    const result = await upsertSupplierOffer(client, offer, {
      provider: PROVIDER,
      displayName: "Bohemia",
      source: "api",
      importRunId: options.importRunId || offer.importRunId || null,
      force: Boolean(options.force)
    });
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}

export function createBohemiaClient({ baseUrl, username, password, timeoutMs = 15000 }) {
  if (!baseUrl) throw new Error("BOHEMIA_API_BASE_URL is missing.");
  if (!username) throw new Error("BOHEMIA_API_USERNAME is missing.");
  if (!password) throw new Error("BOHEMIA_API_PASSWORD is missing.");

  const parser = new XMLParser({
    attributeNamePrefix: "@_",
    ignoreAttributes: false,
    parseAttributeValue: false,
    parseTagValue: false,
    trimValues: true
  });
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");

  async function getXml(path, params = {}) {
    const url = new URL(`${normalizedBaseUrl}${path}`);
    url.searchParams.set("username", username);
    url.searchParams.set("password", password);

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response;
    let xml;

    try {
      response = await fetch(url, {
        headers: { accept: "application/xml,text/xml,*/*" },
        signal: controller.signal
      });
      xml = await response.text();
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Bohemia API ${path} timed out after ${timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new Error(`Bohemia API ${path} failed with ${response.status}: ${xml.slice(0, 240)}`);
    }

    const payload = parser.parse(xml);
    if (hasBohemiaError(payload)) {
      const error = asObject(payload).Error || asObject(payload?.Resultset).Error;
      const code = firstValue(asObject(error).code, asObject(error)["@_code"], asObject(error).Code, asObject(error).CODE);
      const desc = firstValue(asObject(error).desc, asObject(error)["@_desc"], asObject(error).Description, asObject(error).Message);
      throw new Error(`Bohemia API ${path} returned ${code || "Error"}${desc ? `: ${desc}` : ""}`);
    }

    return payload;
  }

  async function getDetails(path, offerId, paramNames) {
    const errors = [];

    for (const paramName of paramNames) {
      try {
        return await getXml(path, { [paramName]: offerId });
      } catch (error) {
        errors.push(error instanceof Error ? `${paramName}: ${error.message}` : `${paramName}: failed`);
      }
    }

    throw new Error(errors.join(" | "));
  }

  return {
    async searchExcursions(params = {}) {
      const payload = await getXml("/xml/SearchExcursions.xml", params);
      return asArray(asObject(payload.Resultset).Result);
    },
    async getExcursionDetails(offerId) {
      return getDetails("/xml/GetExcursionDetails.xml", offerId, ["OfferID", "offerID", "offerId", "ExcursionID", "excursionID", "ID", "id"]);
    },
    async searchHolidays(params = {}) {
      const payload = await getXml("/xml/SearchHolidays.xml", params);
      return asArray(asObject(payload.Resultset).Result);
    },
    async getHolidayDetails(offerId) {
      return getDetails("/xml/GetHolidayDetails.xml", offerId, ["OfferID", "offerID", "offerId", "HolidayID", "holidayID", "ID", "id"]);
    }
  };
}

export async function fetchBohemiaOffers(options) {
  const client = createBohemiaClient(options);
  const types = options.types || ["excursion", "holiday"];
  const limit = options.limit ?? 20;
  const offset = Math.max(Number(options.offset ?? 0) || 0, 0);
  const detailsLimit = options.detailsLimit ?? limit;
  const useLimit = Number.isFinite(limit) && limit > 0;
  const useDetailsLimit = Number.isFinite(detailsLimit) && detailsLimit > 0;
  const offers = [];
  let totalAvailable = 0;
  let processedAvailable = 0;
  let hasMore = false;

  if (types.includes("excursion")) {
    const allResults = await client.searchExcursions(options.queryParams);
    totalAvailable += allResults.length;
    const results = useLimit ? allResults.slice(offset, offset + limit) : allResults.slice(offset);
    processedAvailable += useLimit ? Math.min(offset + limit, allResults.length) : allResults.length;
    hasMore = hasMore || (useLimit && offset + results.length < allResults.length);

    const mappedResults = await Promise.all(results.map(async (result, index) => {
      const offerId = firstValue(asObject(result).OfferID);
      const details = offerId && (!useDetailsLimit || index < detailsLimit)
        ? await client.getExcursionDetails(offerId).catch((error) => ({ DetailError: error instanceof Error ? error.message : "Detail request failed" }))
        : null;
      return mapBohemiaOffer("excursion", asObject(result), details, options.baseUrl);
    }));
    offers.push(...mappedResults.filter(Boolean));
  }

  if (types.includes("holiday")) {
    const allResults = await client.searchHolidays(options.queryParams);
    totalAvailable += allResults.length;
    const results = useLimit ? allResults.slice(offset, offset + limit) : allResults.slice(offset);
    processedAvailable += useLimit ? Math.min(offset + limit, allResults.length) : allResults.length;
    hasMore = hasMore || (useLimit && offset + results.length < allResults.length);

    const mappedResults = await Promise.all(results.map(async (result, index) => {
      const offerId = firstValue(asObject(result).OfferID);
      const details = offerId && (!useDetailsLimit || index < detailsLimit)
        ? await client.getHolidayDetails(offerId).catch((error) => ({ DetailError: error instanceof Error ? error.message : "Detail request failed" }))
        : null;
      return mapBohemiaOffer("holiday", asObject(result), details, options.baseUrl);
    }));
    offers.push(...mappedResults.filter(Boolean));
  }

  offers.meta = {
    hasMore,
    nextOffset: useLimit ? offset + limit : offset + offers.length,
    offset,
    limit,
    totalAvailable,
    processedAvailable
  };

  return offers;
}

export async function fetchBohemiaOfferCounts(options) {
  const client = createBohemiaClient(options);
  const types = options.types || ["excursion", "holiday"];
  const counts = {
    excursion: 0,
    holiday: 0,
    total: 0
  };

  if (types.includes("excursion")) {
    counts.excursion = (await client.searchExcursions(options.queryParams)).length;
  }

  if (types.includes("holiday")) {
    counts.holiday = (await client.searchHolidays(options.queryParams)).length;
  }

  counts.total = counts.excursion + counts.holiday;
  return counts;
}
