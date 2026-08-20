import type { Metadata } from "next";
import { OfferCard } from "@/components/OfferCard";
import { PublicBreadcrumbs } from "@/components/PublicBreadcrumbs";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { collections, destinations } from "@/lib/data";
import { listPublishedPublicOffers } from "@/lib/offerRepository";
import type { Offer } from "@/lib/types";

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
    budget?: string;
    pace?: string;
    from?: string;
    to?: string;
  }>;
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
    ...(offer.themeSlugs ?? []),
    ...(offer.audienceSlugs ?? []),
    ...(offer.taxonomyTermSlugs ?? []),
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
  const mood = normalizeSearch(params.mood);
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

function offerMatchesTag(offer: Offer, tag: string) {
  if (!tag) return true;
  const normalizedTag = normalizeSearch(tag);
  return [...(offer.badgeSlugs ?? []), ...offer.tags].some((value) => normalizeSearch(String(value)) === normalizedTag);
}

function offerMatchesDestination(offer: Offer, destination: string) {
  if (!destination) return true;
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
  const tags = normalizeSearch([...(offer.tags ?? []), ...(offer.badgeSlugs ?? [])].join(" "));
  return (offer.visibilityPlacements ?? []).includes("homepage") || tags.includes("наш избор") || tags.includes("nash izbor");
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
  const offerTypeProfile = normalizeSearch([offer.productType, offer.productTypeLabel, offer.transport, ...(offer.categorySlugs ?? [])].filter(Boolean).join(" "));
  const expectedTokens = [...(typeAliases[offer.productType || ""] ?? []), ...(typeAliases[offer.transport || ""] ?? [])];
  return offerTypeProfile.includes(normalizedType) || expectedTokens.some((token) => normalizeSearch(token) === normalizedType);
}

function offerMatchesBudget(offer: Offer, budget: string) {
  if (!budget || !offer.priceFrom) return true;
  if (budget.includes("1000") && budget.includes("до")) return offer.priceFrom <= 1000;
  if (budget.includes("1000") && budget.includes("2500")) return offer.priceFrom >= 1000 && offer.priceFrom <= 2500;
  if (budget.includes("2500") && budget.includes("над")) return offer.priceFrom >= 2500;
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

function collectionLabel(slug: string | undefined) {
  if (!slug) return "";
  return collections.find((collection) => normalizeSearch(collection.slug) === normalizeSearch(slug))?.name || slug;
}

function destinationLabel(slugOrName: string | undefined) {
  if (!slugOrName) return "";
  return destinations.find((destination) => normalizeSearch(destination.slug) === normalizeSearch(slugOrName) || normalizeSearch(destination.name) === normalizeSearch(slugOrName))?.name || slugOrName;
}

export default async function OffersPage({ searchParams }: OffersPageProps) {
  const params = (await searchParams) ?? {};
  const publishedOffers = await listPublishedPublicOffers();
  const query = normalizeSearch(params.q);
  const tag = normalizeSearch(params.tag);
  const destination = normalizeSearch(params.destination);
  const collection = normalizeSearch(params.collection);
  const featured = normalizeSearch(params.featured);
  const type = normalizeSearch(params.type);
  const budget = normalizeSearch(params.budget);
  const filteredOffers = publishedOffers
    .filter((offer) => offerMatchesTag(offer, tag))
    .filter((offer) => offerMatchesDestination(offer, destination))
    .filter((offer) => offerMatchesCollection(offer, collection))
    .filter((offer) => offerMatchesFeatured(offer, featured))
    .filter((offer) => offerMatchesType(offer, type))
    .filter((offer) => offerMatchesBudget(offer, budget))
    .filter((offer) => offerMatchesDateRange(offer, params.from || "", params.to || ""))
    .map((offer) => ({ offer, score: scoreOffer(offer, params) }))
    .filter((item) => !query || item.score > 0)
    .sort((first, second) => second.score - first.score || (second.offer.updatedAt || "").localeCompare(first.offer.updatedAt || ""))
    .map((item) => item.offer);
  const activeFilters = [
    params.q ? `Търсене: ${params.q}` : "",
    params.tag ? `Етикет: ${params.tag}` : "",
    params.featured ? "Подбрано от Red Tours" : "",
    params.destination ? `Дестинация: ${destinationLabel(params.destination)}` : "",
    params.collection ? `Колекция: ${collectionLabel(params.collection)}` : "",
    params.type ? `Тип: ${params.type}` : "",
    params.mood ? `Усещане: ${params.mood}` : "",
    params.budget ? `Бюджет: ${params.budget}` : "",
    params.pace ? `Ритъм: ${params.pace}` : "",
    params.from || params.to ? `Дати: ${[params.from, params.to].filter(Boolean).join(" - ")}` : ""
  ].filter(Boolean);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="container page-title">
          <PublicBreadcrumbs items={[{ label: "Пътувания" }]} />
          <span className="eyebrow">Пътувания</span>
          <h1>Откриване по дестинация, тема и настроение</h1>
          <p>
            Първа версия на структурата за търсене и филтриране. В следващ етап тези контроли ще
            се свържат с база данни, админ статуси и персонализирани препоръки.
          </p>
        </section>

        <section className="container" id="inquiry">
          <form className="filters" aria-label="Филтри" action="/offers">
            <div className="filter-row">
              <input name="q" defaultValue={params.q || ""} placeholder="Търсене по ключова дума" />
              {params.tag ? <input type="hidden" name="tag" value={params.tag} /> : null}
              {params.featured ? <input type="hidden" name="featured" value={params.featured} /> : null}
              <select name="destination" defaultValue={params.destination || ""}>
                <option value="">
                  Дестинация
                </option>
                {destinations.map((destination) => (
                  <option key={destination.slug} value={destination.slug}>{destination.name}</option>
                ))}
              </select>
              <select name="collection" defaultValue={params.collection || ""}>
                <option value="">
                  Колекция
                </option>
                {collections.map((collection) => (
                  <option key={collection.slug} value={collection.slug}>{collection.name}</option>
                ))}
              </select>
              <select name="type" defaultValue={params.type || ""}>
                <option value="">
                  Транспорт
                </option>
                <option>Самолет</option>
                <option>Автобус</option>
                <option>Комбинирано</option>
              </select>
              {params.mood ? <input type="hidden" name="mood" value={params.mood} /> : null}
              {params.budget ? <input type="hidden" name="budget" value={params.budget} /> : null}
              {params.pace ? <input type="hidden" name="pace" value={params.pace} /> : null}
              {params.from ? <input type="hidden" name="from" value={params.from} /> : null}
              {params.to ? <input type="hidden" name="to" value={params.to} /> : null}
              <button type="submit">Търси</button>
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
          <div className="offers-grid">
            {filteredOffers.map((offer) => (
              <OfferCard key={offer.slug} offer={offer} />
            ))}
          </div>
          {!filteredOffers.length ? (
            <div className="offers-empty-state">
              <strong>Няма оферти по тези критерии.</strong>
              <a href="/offers">Виж всички оферти</a>
            </div>
          ) : null}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
