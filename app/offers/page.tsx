import type { Metadata } from "next";
import { DestinationGlobe } from "@/components/DestinationGlobe";
import { LazyVideo } from "@/components/LazyVideo";
import { OfferCard } from "@/components/OfferCard";
import { OfferSortSelect } from "@/components/OfferSortSelect";
import { PublicBreadcrumbs } from "@/components/PublicBreadcrumbs";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { collections, destinations } from "@/lib/data";
import { destinationSlug } from "@/lib/destinationSlug";
import { listPublishedPublicOffers } from "@/lib/offerRepository";
import { experienceTaxonomyLabels, travelTypeTaxonomyLabels } from "@/lib/offerTaxonomy";
import type { Offer } from "@/lib/types";
import { CalendarDays, Clock3, Grid3X3, List, MapPin, Plane, Search, SlidersHorizontal, Sparkles, WalletCards } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Пътувания",
  description: "Открийте пътувания по дестинация, тема, настроение и стил."
};

type OffersPageProps = {
  searchParams?: Promise<{
    q?: string;
    tag?: string;
    destination?: string;
    collection?: string;
    featured?: string;
    type?: string;
    mood?: string;
    audience?: string;
    experience?: string;
    interest?: string;
    travelType?: string;
    budget?: string;
    pace?: string;
    period?: string;
    from?: string;
    to?: string;
    page?: string;
    sort?: string;
    view?: string;
  }>;
};

const offersPerPage = 9;

type PeriodOption = {
  value: string;
  label: string;
  from: string;
  to: string;
};

const durationOptions = [
  { value: "weekend", label: "Уикенд" },
  { value: "up-to-7", label: "До 7 дни" },
  { value: "8-plus", label: "8+ дни" }
] as const;

const budgetOptions = [
  { value: "under-1000", label: "До 1000 €" },
  { value: "1000-2500", label: "1000 - 2500 €" },
  { value: "over-2500", label: "Над 2500 €" }
] as const;

const transportFilterLabels: Record<Offer["transport"], string> = {
  flight: "Самолет",
  bus: "Автобус",
  own_transport: "Собствен транспорт",
  mixed: "Комбинирано"
};

type ScoredOffer = {
  offer: Offer;
  score: number;
};

function normalizeSearch(value: string | undefined) {
  return (value || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");
}

function searchTokens(value: string) {
  return normalizeSearch(value).split(" ").filter((token) => token.length > 2);
}

const queryStopWords = new Set([
  "искам",
  "търся",
  "търсим",
  "искаме",
  "къде",
  "къде",
  "град",
  "държава",
  "място",
  "места",
  "оферта",
  "оферти",
  "пътуване",
  "пътувания"
]);

function offerSearchFields(offer: Offer) {
  return [
    offer.title,
    offer.summary,
    offer.description,
    offer.country,
    offer.region,
    offer.destinations?.map((destination) => [destination.city, destination.region, destination.country].filter(Boolean).join(" ")).join(" "),
    offer.productTypeLabel,
    offer.productType,
    offer.transport,
    ...(offer.moods ?? []),
    ...offer.tags,
    ...(offer.badgeSlugs ?? []),
    ...(offer.collectionSlugs ?? []),
    ...(offer.categorySlugs ?? []),
    ...(offer.categoryLabels ?? []),
    ...(offer.themeSlugs ?? []),
    ...(offer.themeLabels ?? []),
    ...(offer.moodSlugs ?? []),
    ...(offer.moodLabels ?? []),
    ...(offer.audienceSlugs ?? []),
    ...(offer.audienceLabels ?? []),
    ...(offer.taxonomyTermSlugs ?? []),
    ...(offer.taxonomyTermLabels ?? []),
    ...(offer.highlights ?? []),
    ...(offer.included ?? []),
    ...(offer.excluded ?? []),
    ...(offer.supplierSections ?? []).flatMap((section) => [section.title, section.body, section.meta]),
    ...(offer.itinerary ?? []).flatMap((day) => [day.title, day.description, day.accommodation, day.meals, day.transport]),
    ...(offer.seo.keywords ?? [])
  ].filter(Boolean).join(" ");
}

function scoreOffer(offer: Offer, params: Awaited<NonNullable<OffersPageProps["searchParams"]>>) {
  const query = normalizeSearch(params.q);
  const mood = normalizeSearch([params.mood, params.experience, params.audience, params.interest, params.travelType, params.type].filter(Boolean).join(" "));
  const pace = normalizeSearch(params.pace);
  const profile = normalizeSearch(offerSearchFields(offer));
  const title = normalizeSearch(offer.title);
  const tags = normalizeSearch([...offer.tags, ...(offer.badgeSlugs ?? [])].join(" "));
  let score = 0;

  if (!query && !mood && !pace) score += 1;
  if (query && profile.includes(query)) score += 16;
  if (query && title.includes(query)) score += 12;
  for (const token of searchTokens(query)) {
    if (title.includes(token)) score += 6;
    if (tags.includes(token)) score += 5;
    if (profile.includes(token)) score += 2;
  }
  for (const token of [...searchTokens(mood), ...searchTokens(pace)]) {
    if (tags.includes(token)) score += 5;
    if (profile.includes(token)) score += 2;
  }

  if (offer.tags.length) score += 1;
  if ((offer.highlights ?? []).length) score += 1;
  if ((offer.supplierSections ?? []).length) score += 1;

  return score;
}

function offerMatchesQuery(offer: Offer, value: string | undefined) {
  const query = normalizeSearch(value);
  if (!query) return true;

  const profile = normalizeSearch(offerSearchFields(offer));
  if (profile.includes(query)) return true;

  const tokens = searchTokens(query).filter((token) => !queryStopWords.has(token));
  if (!tokens.length) return true;

  return tokens.some((token) => profile.includes(token));
}

function offerMatchesTag(offer: Offer, tag: string) {
  if (!tag) return true;
  const normalizedTag = normalizeSearch(tag);
  return [...(offer.badgeSlugs ?? []), ...offer.tags].some((value) => normalizeSearch(String(value)) === normalizedTag);
}

function offerMatchesDestination(offer: Offer, destination: string) {
  if (!destination) return true;
  const countryHaystack = normalizeSearch(offerDestinationCountries(offer).join(" "));
  if (countryHaystack.includes(destination)) return true;

  const haystack = normalizeSearch([offer.destinationSlug, offer.country, offer.region, offer.destinations?.map((item) => [item.city, item.region, item.country].filter(Boolean).join(" ")).join(" ")].filter(Boolean).join(" "));
  return haystack.includes(destination);
}

function offerMatchesCollection(offer: Offer, collection: string) {
  if (!collection) return true;
  return (offer.collectionSlugs ?? []).some((slug) => normalizeSearch(slug) === collection);
}

function offerMatchesFeatured(offer: Offer, featured: string) {
  if (!featured) return true;
  if (featured !== "red tours" && featured !== "redtours") return true;
  return (offer.visibilityPlacements ?? []).includes("homepage");
}

function splitFilterValues(value: string | undefined) {
  return (value || "")
    .split(",")
    .map((item) => normalizeSearch(item))
    .filter(Boolean);
}

function offerMatchesTaxonomy(offer: Offer, value: string, labels: Array<string | undefined>, slugs: Array<string | undefined> = []) {
  const selected = splitFilterValues(value);
  if (!selected.length) return true;
  const haystack = [...labels, ...slugs].map((item) => normalizeSearch(item)).filter(Boolean);
  return selected.every((term) => haystack.some((item) => item === term || item.includes(term)));
}

function offerMatchesType(offer: Offer, type: string) {
  if (!type) return true;
  const normalizedType = normalizeSearch(type);
  if (normalizedType === "vsichki" || normalizedType === "всички") return true;
  const typeAliases: Record<string, string[]> = {
    flight: ["самолет", "samolet", "flight"],
    bus: ["автобус", "avtobus", "bus"],
    mixed: ["комбинирано", "kombinirano", "mixed"],
    excursion: ["екскурзия", "ekskurzia", "excursion"],
    holiday: ["почивка", "pochivka", "holiday"],
    package: ["пакет", "paket", "package"]
  };
  const offerTypeProfile = normalizeSearch([offer.productType, offer.productTypeLabel, offer.transport, ...(offer.categorySlugs ?? []), ...(offer.categoryLabels ?? [])].filter(Boolean).join(" "));
  const expectedTokens = [...(typeAliases[offer.productType || ""] ?? []), ...(typeAliases[offer.transport || ""] ?? [])];
  return offerTypeProfile.includes(normalizedType) || expectedTokens.some((token) => normalizeSearch(token) === normalizedType);
}

function offerMatchesTravelType(offer: Offer, value: string) {
  if (!value) return true;
  const selected = splitFilterValues(value);
  if (!selected.length) return true;
  const haystack = [
    offer.productType,
    offer.productTypeLabel,
    offer.transport,
    transportFilterLabels[offer.transport],
    ...(offer.categoryLabels ?? []),
    ...(offer.categorySlugs ?? []),
    ...(offer.taxonomyTermLabels ?? []),
    ...(offer.taxonomyTermSlugs ?? [])
  ].map((item) => normalizeSearch(item)).filter(Boolean);

  return selected.every((term) => haystack.some((item) => item === term || item.includes(term)));
}

function offerMatchesBudget(offer: Offer, budget: string) {
  if (!budget || !offer.priceFrom) return true;
  const normalizedBudget = normalizeSearch(budget);
  if (normalizedBudget === "under 1000" || normalizedBudget === "до 1000") return offer.priceFrom <= 1000;
  if (normalizedBudget === "1000 2500") return offer.priceFrom >= 1000 && offer.priceFrom <= 2500;
  if (normalizedBudget === "over 2500" || normalizedBudget === "над 2500") return offer.priceFrom >= 2500;
  return true;
}

function offerMatchesDuration(offer: Offer, pace: string) {
  if (!pace) return true;
  const normalizedPace = normalizeSearch(pace);
  if (normalizedPace === "weekend" || normalizedPace.includes("уикенд")) return offer.durationDays <= 4;
  if (normalizedPace === "up to 7" || normalizedPace.includes("седмица")) return offer.durationDays <= 7;
  if (normalizedPace === "8 plus" || normalizedPace.includes("дълго") || normalizedPace.includes("над 8")) return offer.durationDays >= 8;
  return true;
}

function offerMatchesDateRange(offer: Offer, from: string, to: string) {
  if (!from && !to) return true;
  return offer.dates.some((date) => {
    if (!date.startDate) return true;
    if (date.availability === "sold_out") return false;
    const start = date.startDate;
    const end = date.endDate || date.startDate;
    if (from && end < from) return false;
    if (to && start > to) return false;
    return true;
  });
}

function lastDayOfMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function formatDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function makeIsoDate(year: number, month: number, day: number) {
  return `${year}-${formatDatePart(month)}-${formatDatePart(day)}`;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function offerDateIsCurrentOrFuture(startDate: string, endDate: string | undefined, today: string) {
  return (endDate || startDate) >= today;
}

function seasonPeriodForDate(date: string): PeriodOption | null {
  const match = date.match(/^(\d{4})-(\d{2})-\d{2}/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null;

  if (month >= 3 && month <= 5) {
    return { value: `spring-${year}`, label: `Пролет ${year}`, from: makeIsoDate(year, 3, 1), to: makeIsoDate(year, 5, 31) };
  }

  if (month >= 6 && month <= 8) {
    return { value: `summer-${year}`, label: `Лято ${year}`, from: makeIsoDate(year, 6, 1), to: makeIsoDate(year, 8, 31) };
  }

  if (month >= 9 && month <= 11) {
    return { value: `autumn-${year}`, label: `Есен ${year}`, from: makeIsoDate(year, 9, 1), to: makeIsoDate(year, 11, 30) };
  }

  const winterStartYear = month === 12 ? year : year - 1;
  const winterEndYear = winterStartYear + 1;
  return {
    value: `winter-${winterStartYear}`,
    label: `Зима ${winterStartYear}/${winterEndYear}`,
    from: makeIsoDate(winterStartYear, 12, 1),
    to: makeIsoDate(winterEndYear, 2, lastDayOfMonth(winterEndYear, 2))
  };
}

function periodOptionsFromOffers(offers: Offer[]) {
  const options = new Map<string, PeriodOption>();
  const today = todayIsoDate();

  for (const offer of offers) {
    for (const date of offer.dates) {
      if (!date.startDate || date.availability === "sold_out") continue;
      if (!offerDateIsCurrentOrFuture(date.startDate, date.endDate, today)) continue;
      const option = seasonPeriodForDate(date.startDate);
      if (option && !options.has(option.value)) {
        options.set(option.value, option);
      }
    }
  }

  return Array.from(options.values()).sort((first, second) => first.from.localeCompare(second.from));
}

function periodOptionFromValue(value: string): PeriodOption | null {
  const match = value.match(/^(spring|summer|autumn|winter)-(\d{4})$/);
  if (!match) return null;

  const season = match[1];
  const year = Number(match[2]);
  if (!Number.isFinite(year)) return null;

  if (season === "spring") {
    return { value, label: `Пролет ${year}`, from: makeIsoDate(year, 3, 1), to: makeIsoDate(year, 5, 31) };
  }

  if (season === "summer") {
    return { value, label: `Лято ${year}`, from: makeIsoDate(year, 6, 1), to: makeIsoDate(year, 8, 31) };
  }

  if (season === "autumn") {
    return { value, label: `Есен ${year}`, from: makeIsoDate(year, 9, 1), to: makeIsoDate(year, 11, 30) };
  }

  const winterEndYear = year + 1;
  return {
    value,
    label: `Зима ${year}/${winterEndYear}`,
    from: makeIsoDate(year, 12, 1),
    to: makeIsoDate(winterEndYear, 2, lastDayOfMonth(winterEndYear, 2))
  };
}

function selectedPeriodRange(period: string | undefined, options: PeriodOption[]) {
  if (!period) return null;
  return options.find((option) => option.value === period) ?? periodOptionFromValue(period);
}

function offerMatchesPeriod(offer: Offer, period: string | undefined, periodOptions: PeriodOption[], from: string, to: string) {
  const selectedPeriod = selectedPeriodRange(period, periodOptions);
  return offerMatchesDateRange(offer, selectedPeriod?.from || from, selectedPeriod?.to || to);
}

function offerNearestDate(offer: Offer, today: string) {
  return offer.dates
    .filter((date) => date.startDate && date.availability !== "sold_out" && offerDateIsCurrentOrFuture(date.startDate, date.endDate, today))
    .map((date) => date.startDate)
    .sort((first, second) => first.localeCompare(second))[0] || "9999-12-31";
}

function newestTimestamp(offer: Offer) {
  return offer.updatedAt || offer.createdAt || "";
}

function sortScoredOffers(items: ScoredOffer[], sort: string | undefined, today: string) {
  const sortKey = sort || "recommended";
  return [...items].sort((first, second) => {
    if (sortKey === "nearest-date") {
      return offerNearestDate(first.offer, today).localeCompare(offerNearestDate(second.offer, today)) || second.score - first.score;
    }

    if (sortKey === "price-asc") {
      return first.offer.priceFrom - second.offer.priceFrom || second.score - first.score;
    }

    if (sortKey === "price-desc") {
      return second.offer.priceFrom - first.offer.priceFrom || second.score - first.score;
    }

    if (sortKey === "newest") {
      return newestTimestamp(second.offer).localeCompare(newestTimestamp(first.offer)) || second.score - first.score;
    }

    return second.score - first.score || newestTimestamp(second.offer).localeCompare(newestTimestamp(first.offer));
  });
}

function collectionLabel(slug: string | undefined) {
  if (!slug) return "";
  return collections.find((collection) => normalizeSearch(collection.slug) === normalizeSearch(slug))?.name || slug;
}

function destinationLabel(slugOrName: string | undefined) {
  if (!slugOrName) return "";
  return destinations.find((destination) => normalizeSearch(destination.slug) === normalizeSearch(slugOrName) || normalizeSearch(destination.name) === normalizeSearch(slugOrName))?.name || slugOrName;
}

function offerDestinationCountries(offer: Offer) {
  const countries = new Map<string, string>();
  const addCountry = (value: string | undefined) => {
    const label = (value || "").trim();
    const key = normalizeSearch(label);
    if (label && key && !countries.has(key)) {
      countries.set(key, label);
    }
  };

  for (const destination of offer.destinations ?? []) {
    addCountry(destination.country);
  }

  addCountry(offer.country);

  return Array.from(countries.values());
}

function destinationOptionsFromOffers(offers: Offer[]) {
  const options = new Map<string, string>();
  const addOption = (value: string | undefined) => {
    const label = (value || "").trim();
    const key = normalizeSearch(label);
    if (label && key && !options.has(key)) {
      options.set(key, label);
    }
  };

  for (const offer of offers) {
    for (const country of offerDestinationCountries(offer)) {
      addOption(country);
    }
  }

  return Array.from(options.values()).sort((first, second) => first.localeCompare(second, "bg"));
}

function globeDestinationsFromOffers(offers: Offer[]) {
  return Array.from(
    offers.reduce((items, offer) => {
      for (const country of offerDestinationCountries(offer)) {
        const slug = destinationSlug(country);
        const current = items.get(slug);
        items.set(slug, {
          country: current?.country || country,
          offerCount: (current?.offerCount || 0) + 1,
          slug
        });
      }

      return items;
    }, new Map<string, { country: string; offerCount: number; slug: string }>())
  ).map(([, item]) => item);
}

function labelsFromPublishedOffers(offers: Offer[], preferredOrder: readonly string[], readLabels: (offer: Offer) => Array<string | undefined>) {
  const labels = new Map<string, string>();
  for (const offer of offers) {
    for (const label of readLabels(offer)) {
      const trimmed = (label || "").trim();
      const key = normalizeSearch(trimmed);
      if (trimmed && key && !labels.has(key)) {
        labels.set(key, trimmed);
      }
    }
  }

  const ordered = preferredOrder.filter((label) => labels.has(normalizeSearch(label)));
  const rest = Array.from(labels.values()).filter((label) => !ordered.some((orderedLabel) => normalizeSearch(orderedLabel) === normalizeSearch(label)));
  return [...ordered, ...rest.sort((first, second) => first.localeCompare(second, "bg"))];
}

function travelTypeOptionsFromOffers(offers: Offer[]) {
  const options = new Map<string, string>();
  for (const offer of offers) {
    const label = transportFilterLabels[offer.transport];
    const key = normalizeSearch(label);
    if (label && key && !options.has(key)) {
      options.set(key, label);
    }
  }

  return Array.from(options.values()).sort((first, second) => first.localeCompare(second, "bg"));
}

function optionLabel<T extends readonly { value: string; label: string }[]>(options: T, value: string | undefined) {
  if (!value) return "";
  return options.find((option) => option.value === value)?.label || value;
}

function popularSearchHref(label: string) {
  return `/offers?q=${encodeURIComponent(label)}`;
}

function pageNumber(value: string | undefined) {
  const parsed = Number.parseInt(value || "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function pageHref(params: Awaited<NonNullable<OffersPageProps["searchParams"]>>, page: number) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (!value || key === "page") continue;
    search.set(key, value);
  }

  if (page > 1) {
    search.set("page", String(page));
  }

  const queryString = search.toString();
  return `/offers${queryString ? `?${queryString}` : ""}#results`;
}

function viewHref(params: Awaited<NonNullable<OffersPageProps["searchParams"]>>, view: "grid" | "list") {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (!value || key === "page" || key === "view") continue;
    search.set(key, value);
  }

  if (view === "list") {
    search.set("view", view);
  }

  const queryString = search.toString();
  return `/offers${queryString ? `?${queryString}` : ""}#results`;
}

function paginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, "ellipsis", totalPages] as const;
  }

  if (currentPage >= totalPages - 2) {
    return [1, "ellipsis", totalPages - 2, totalPages - 1, totalPages] as const;
  }

  return [1, "ellipsis", currentPage, "ellipsis", totalPages] as const;
}

function tripsCountLabel(count: number) {
  return count === 1 ? "пътуване" : "пътувания";
}

export default async function OffersPage({ searchParams }: OffersPageProps) {
  const params = (await searchParams) ?? {};
  const publishedOffers = await listPublishedPublicOffers();
  const destinationOptions = destinationOptionsFromOffers(publishedOffers);
  const globeDestinations = globeDestinationsFromOffers(publishedOffers);
  const periodOptions = periodOptionsFromOffers(publishedOffers);
  const experienceOptions = labelsFromPublishedOffers(publishedOffers, experienceTaxonomyLabels, (offer) => offer.moodLabels ?? []);
  const travelTypeOptions = travelTypeOptionsFromOffers(publishedOffers);
  const query = normalizeSearch(params.q);
  const tag = normalizeSearch(params.tag);
  const destination = normalizeSearch(params.destination);
  const collection = normalizeSearch(params.collection);
  const featured = normalizeSearch(params.featured);
  const type = normalizeSearch(params.type);
  const audience = params.audience || "";
  const experience = params.experience || params.mood || "";
  const interest = params.interest || "";
  const travelType = params.travelType || params.type || "";
  const budget = normalizeSearch(params.budget);
  const pace = params.pace || "";
  const today = todayIsoDate();
  const scoredOffers = publishedOffers
    .filter((offer) => offerMatchesTag(offer, tag))
    .filter((offer) => offerMatchesDestination(offer, destination))
    .filter((offer) => offerMatchesCollection(offer, collection))
    .filter((offer) => offerMatchesFeatured(offer, featured))
    .filter((offer) => offerMatchesTaxonomy(offer, audience, offer.audienceLabels ?? [], offer.audienceSlugs ?? []))
    .filter((offer) => offerMatchesTaxonomy(offer, experience, offer.moodLabels ?? [], offer.moodSlugs ?? []))
    .filter((offer) => offerMatchesTaxonomy(offer, interest, offer.themeLabels ?? [], offer.themeSlugs ?? []))
    .filter((offer) => offerMatchesTravelType(offer, travelType))
    .filter((offer) => params.travelType ? true : offerMatchesType(offer, type))
    .filter((offer) => offerMatchesBudget(offer, budget))
    .filter((offer) => offerMatchesDuration(offer, pace))
    .filter((offer) => offerMatchesPeriod(offer, params.period, periodOptions, params.from || "", params.to || ""))
    .filter((offer) => offerMatchesQuery(offer, params.q))
    .map((offer) => ({ offer, score: scoreOffer(offer, params) }));
  const filteredOffers = sortScoredOffers(scoredOffers, params.sort, today).map((item) => item.offer);
  const activeFilters = [
    params.q ? `Търсене: ${params.q}` : "",
    params.tag ? `Етикет: ${params.tag}` : "",
    params.featured ? "Подбрано от Red Tours" : "",
    params.destination ? `Дестинация: ${destinationLabel(params.destination)}` : "",
    params.collection ? `Колекция: ${collectionLabel(params.collection)}` : "",
    params.type ? `Тип: ${params.type}` : "",
    params.audience ? `Подходящо за: ${params.audience}` : "",
    params.experience ? `Преживяване: ${params.experience}` : "",
    params.interest ? `Интерес: ${params.interest}` : "",
    params.travelType ? `Тип пътуване: ${params.travelType}` : "",
    params.mood ? `Усещане: ${params.mood}` : "",
    params.budget ? `Бюджет: ${optionLabel(budgetOptions, params.budget)}` : "",
    params.pace ? `Продължителност: ${optionLabel(durationOptions, params.pace)}` : "",
    params.period ? `Период: ${selectedPeriodRange(params.period, periodOptions)?.label || params.period}` : "",
    !params.period && (params.from || params.to) ? `Дати: ${[params.from, params.to].filter(Boolean).join(" - ")}` : ""
  ].filter(Boolean);
  const popularSearches = ["Япония", "Италия", "Малдиви", "Перу", "Уикенд пътувания"];
  const selectedDestinationLabel = params.destination ? destinationLabel(params.destination) : "";
  const totalPages = Math.max(1, Math.ceil(filteredOffers.length / offersPerPage));
  const currentPage = Math.min(pageNumber(params.page), totalPages);
  const pageStartIndex = (currentPage - 1) * offersPerPage;
  const visibleOffers = filteredOffers.slice(pageStartIndex, pageStartIndex + offersPerPage);
  const visibleFrom = filteredOffers.length ? pageStartIndex + 1 : 0;
  const visibleTo = Math.min(pageStartIndex + visibleOffers.length, filteredOffers.length);
  const pages = paginationItems(currentPage, totalPages);
  const view = params.view === "list" ? "list" : "grid";

  return (
    <>
      <SiteHeader />
      <main className="offers-index-page">
        <section className="offers-hero">
          <LazyVideo
            className="offers-hero-video"
            sources={[{ src: "/videos/offers-hero.mp4", type: "video/mp4" }]}
          />
          <div className="offers-hero-shade" aria-hidden="true" />
          <div className="container offers-hero-content">
            <PublicBreadcrumbs items={[{ label: "Пътувания" }]} />
            <h1>
              Открийте своето следващо <span>пътуване</span>
            </h1>
            <p>
              Разгледайте нашата селекция от авторски програми, екзотични дестинации и специални преживявания.
              Използвайте филтрите, за да намерите подходящото предложение, или ни изпратете запитване, ако търсите маршрут, създаден специално за вас.
            </p>
            <form className="offers-hero-search" action="/offers#results" method="get">
              <Search size={24} aria-hidden="true" />
              <input name="q" defaultValue={params.q || ""} placeholder="Къде искате да пътувате?" aria-label="Търсене на пътуване" />
              <button type="submit">Търси</button>
            </form>
            <div className="offers-popular-searches" aria-label="Популярни търсения">
              <span>Популярни търсения:</span>
              {popularSearches.map((label) => (
                <a href={popularSearchHref(label)} key={label}>{label}</a>
              ))}
            </div>
          </div>
        </section>

        <section className="container offers-search-shell" id="inquiry">
          <form className="offers-filter-bar" aria-label="Филтри" action="/offers#results" method="get">
            <input type="hidden" name="q" value={params.q || ""} />
            <div className="offers-filter-control">
              <MapPin size={18} aria-hidden="true" />
              <label>
                <span>Дестинация</span>
                <select name="destination" defaultValue={params.destination || ""}>
                  <option value="">Всички</option>
                  {destinationOptions.map((destination) => (
                    <option key={destination} value={destination}>{destination}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="offers-filter-control">
              <CalendarDays size={18} aria-hidden="true" />
              <label>
                <span>Период</span>
                <select name="period" defaultValue={params.period || ""}>
                  <option value="">Всички</option>
                  {periodOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="offers-filter-control">
              <Sparkles size={18} aria-hidden="true" />
              <label>
                <span>Тип преживяване</span>
                <select name="experience" defaultValue={params.experience || params.mood || ""}>
                  <option value="">Всички</option>
                  {experienceOptions.map((label) => (
                    <option key={label} value={label}>{label}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="offers-filter-control">
              <Clock3 size={18} aria-hidden="true" />
              <label>
                <span>Продължителност</span>
                <select name="pace" defaultValue={params.pace || ""}>
                  <option value="">Всяка</option>
                  {durationOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="offers-filter-control">
              <Plane size={18} aria-hidden="true" />
              <label>
                <span>Начин на пътуване</span>
                <select name="travelType" defaultValue={params.travelType || ""}>
                  <option value="">Всички</option>
                  {travelTypeOptions.map((label) => (
                    <option key={label} value={label}>{label}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="offers-filter-control">
              <WalletCards size={18} aria-hidden="true" />
              <label>
                <span>Бюджет</span>
                <select name="budget" defaultValue={params.budget || ""}>
                  <option value="">Без значение</option>
                  {budgetOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <button className="offers-filter-submit" type="submit">
              <Search size={19} aria-hidden="true" />
              Търси
            </button>
            <div className="offers-filter-hidden">
              {params.tag ? <input type="hidden" name="tag" value={params.tag} /> : null}
              {params.featured ? <input type="hidden" name="featured" value={params.featured} /> : null}
              {params.audience ? <input type="hidden" name="audience" value={params.audience} /> : null}
              {params.interest ? <input type="hidden" name="interest" value={params.interest} /> : null}
              {params.collection ? <input type="hidden" name="collection" value={params.collection} /> : null}
              {params.type ? <input type="hidden" name="type" value={params.type} /> : null}
              {params.mood ? <input type="hidden" name="mood" value={params.mood} /> : null}
              {!params.period && params.from ? <input type="hidden" name="from" value={params.from} /> : null}
              {!params.period && params.to ? <input type="hidden" name="to" value={params.to} /> : null}
            </div>
          </form>
          {activeFilters.length ? (
            <p className="offers-active-filter">
              <span>Активни критерии:</span>
              {activeFilters.map((filter) => (
                <strong key={filter}>{filter}</strong>
              ))}
              <a href="/offers">Изчисти</a>
            </p>
          ) : null}

          <header className="offers-results-header" id="results">
            <h2>Открихме <span>{filteredOffers.length}</span> {tripsCountLabel(filteredOffers.length)}</h2>
            <div>
              <OfferSortSelect currentSort={params.sort || "recommended"} />
              <a className={view === "grid" ? "is-active" : ""} href={viewHref(params, "grid")} aria-label="Изглед с карти" aria-current={view === "grid" ? "true" : undefined}><Grid3X3 size={19} aria-hidden="true" /></a>
              <a className={view === "list" ? "is-active" : ""} href={viewHref(params, "list")} aria-label="Списъчен изглед" aria-current={view === "list" ? "true" : undefined}><List size={20} aria-hidden="true" /></a>
            </div>
          </header>

          <div className={`offers-grid offers-results-grid ${view === "list" ? "is-list-view" : ""}`}>
            {visibleOffers.map((offer) => (
              <OfferCard key={offer.slug} offer={offer} />
            ))}
          </div>
          {!filteredOffers.length ? (
            <div className="offers-empty-state">
              <div>
                <strong>Не открихме точно това пътуване</strong>
                <p>Променете част от избраните критерии или ни разкажете какво търсите. Възможно е да създадем индивидуален маршрут за вас.</p>
              </div>
              <div className="offers-empty-actions">
                <a className="offers-empty-primary" href="/tailor-made">Изпратете индивидуално запитване</a>
                <a className="offers-empty-secondary" href="/offers">Виж всички оферти</a>
              </div>
            </div>
          ) : null}
          {filteredOffers.length ? (
            <div className="offers-soft-count">
              Показваме {visibleFrom} - {visibleTo} от {filteredOffers.length}. Страница {currentPage} от {totalPages}.
            </div>
          ) : null}

          {totalPages > 1 ? (
            <nav className="offers-pagination-preview" aria-label="Страници">
              {currentPage > 1 ? (
                <a aria-label="Предишна страница" href={pageHref(params, currentPage - 1)}>‹</a>
              ) : (
                <span aria-hidden="true">‹</span>
              )}
              {pages.map((page, index) => page === "ellipsis" ? (
                <em key={`ellipsis-${index}`}>...</em>
              ) : page === currentPage ? (
                <span aria-current="page" key={page}>{page}</span>
              ) : (
                <a href={pageHref(params, page)} key={page}>{page}</a>
              ))}
              {currentPage < totalPages ? (
                <a aria-label="Следваща страница" href={pageHref(params, currentPage + 1)}>›</a>
              ) : (
                <span aria-hidden="true">›</span>
              )}
            </nav>
          ) : null}

          {filteredOffers.length ? (
            <section className="offers-map-strip" aria-label="Карта на пътуванията">
              <div className="offers-map-strip-copy">
                <span className="eyebrow">Карта на пътуванията</span>
                <h2>Изберете посока от глобуса.</h2>
              </div>
              <div className="offers-map-strip-globe">
                <DestinationGlobe
                  country={selectedDestinationLabel}
                  destinations={globeDestinations}
                  highlightSelectedCountry={Boolean(params.destination)}
                  initialZoom={1.52}
                  maxZoom={10}
                />
              </div>
            </section>
          ) : null}

          {filteredOffers.length ? (
            <section className="offers-tailor-banner">
              <div>
                <h2>Не намирате точното пътуване?</h2>
                <p>Разкажете ни какво търсите и ще подготвим предложение по вашите дати, бюджет и стил.</p>
              </div>
              <a href="/contacts#inquiry">
                Запитване
                <span aria-hidden="true">→</span>
              </a>
            </section>
          ) : null}

        </section>
      </main>
      <SiteFooter />
    </>
  );
}
