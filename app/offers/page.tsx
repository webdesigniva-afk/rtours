import type { Metadata } from "next";
import { OfferCard } from "@/components/OfferCard";
import { PublicBreadcrumbs } from "@/components/PublicBreadcrumbs";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { collections, destinations } from "@/lib/data";
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
    from?: string;
    to?: string;
    sort?: string;
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
    addOption(offer.country);
    addOption(offer.region);
    for (const destination of offer.destinations ?? []) {
      addOption(destination.country);
      addOption(destination.region);
      addOption(destination.city);
    }
  }

  return Array.from(options.values()).sort((first, second) => first.localeCompare(second, "bg"));
}

function popularSearchHref(label: string) {
  return `/offers?q=${encodeURIComponent(label)}`;
}

export default async function OffersPage({ searchParams }: OffersPageProps) {
  const params = (await searchParams) ?? {};
  const publishedOffers = await listPublishedPublicOffers();
  const destinationOptions = destinationOptionsFromOffers(publishedOffers);
  const query = normalizeSearch(params.q);
  const tag = normalizeSearch(params.tag);
  const destination = normalizeSearch(params.destination);
  const collection = normalizeSearch(params.collection);
  const featured = normalizeSearch(params.featured);
  const type = normalizeSearch(params.type);
  const audience = params.audience || "";
  const experience = params.experience || params.mood || "";
  const interest = params.interest || "";
  const travelType = params.travelType || "";
  const budget = normalizeSearch(params.budget);
  const filteredOffers = publishedOffers
    .filter((offer) => offerMatchesTag(offer, tag))
    .filter((offer) => offerMatchesDestination(offer, destination))
    .filter((offer) => offerMatchesCollection(offer, collection))
    .filter((offer) => offerMatchesFeatured(offer, featured))
    .filter((offer) => offerMatchesTaxonomy(offer, audience, offer.audienceLabels ?? [], offer.audienceSlugs ?? []))
    .filter((offer) => offerMatchesTaxonomy(offer, experience, offer.moodLabels ?? [], offer.moodSlugs ?? []))
    .filter((offer) => offerMatchesTaxonomy(offer, interest, offer.themeLabels ?? [], offer.themeSlugs ?? []))
    .filter((offer) => offerMatchesTaxonomy(offer, travelType, offer.categoryLabels ?? [], offer.categorySlugs ?? []))
    .filter((offer) => offerMatchesType(offer, type))
    .filter((offer) => offerMatchesBudget(offer, budget))
    .filter((offer) => offerMatchesDateRange(offer, params.from || "", params.to || ""))
    .filter((offer) => offerMatchesQuery(offer, params.q))
    .map((offer) => ({ offer, score: scoreOffer(offer, params) }))
    .sort((first, second) => second.score - first.score || (second.offer.updatedAt || "").localeCompare(first.offer.updatedAt || ""))
    .map((item) => item.offer);
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
    params.budget ? `Бюджет: ${params.budget}` : "",
    params.pace ? `Ритъм: ${params.pace}` : "",
    params.from || params.to ? `Дати: ${[params.from, params.to].filter(Boolean).join(" - ")}` : ""
  ].filter(Boolean);
  const popularSearches = ["Япония", "Италия", "Малдиви", "Перу", "Уикенд пътувания"];
  const hasActiveSearch = Boolean(query || activeFilters.length);
  const visibleOffers = hasActiveSearch ? filteredOffers : filteredOffers.slice(0, 6);

  return (
    <>
      <SiteHeader />
      <main className="offers-index-page">
        <section className="offers-hero">
          <video className="offers-hero-video" autoPlay muted loop playsInline poster="/images/destinations/turkey.avif" aria-hidden="true">
            <source src="/videos/offers-hero.mp4" type="video/mp4" />
          </video>
          <div className="offers-hero-shade" aria-hidden="true" />
          <div className="container offers-hero-content">
            <PublicBreadcrumbs items={[{ label: "Пътувания" }]} />
            <h1>
              Открийте своето следващо <span>пътуване</span>
            </h1>
            <p>
              Разгледайте нашата селекция от авторски програми, екзотични дестинации и специални преживявания. Използвайте филтрите, за да намерите точното пътуване за вас.
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
                <select name="from" defaultValue={params.from || ""}>
                  <option value="">Всяко време</option>
                  <option value="2026-09-01">Есен 2026</option>
                  <option value="2026-12-01">Зима 2026</option>
                  <option value="2027-03-01">Пролет 2027</option>
                </select>
              </label>
            </div>
            <div className="offers-filter-control">
              <Sparkles size={18} aria-hidden="true" />
              <label>
                <span>Тип преживяване</span>
                <select name="experience" defaultValue={params.experience || params.mood || ""}>
                  <option value="">Всички</option>
                  {experienceTaxonomyLabels.map((label) => (
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
                  <option value="уикенд">Уикенд</option>
                  <option value="седмица">До седмица</option>
                  <option value="дълго пътуване">Над 8 дни</option>
                </select>
              </label>
            </div>
            <div className="offers-filter-control">
              <Plane size={18} aria-hidden="true" />
              <label>
                <span>Начин на пътуване</span>
                <select name="travelType" defaultValue={params.travelType || ""}>
                  <option value="">Всички</option>
                  {travelTypeTaxonomyLabels.map((label) => (
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
                  <option value="">Всякакъв</option>
                  <option value="до 1000">До 1000</option>
                  <option value="1000 - 2500">1000 - 2500</option>
                  <option value="над 2500">Над 2500</option>
                </select>
              </label>
            </div>
            <button className="offers-filter-submit" type="submit">
              <SlidersHorizontal size={19} aria-hidden="true" />
              Всички филтри
            </button>
            <div className="offers-filter-hidden">
              {params.tag ? <input type="hidden" name="tag" value={params.tag} /> : null}
              {params.featured ? <input type="hidden" name="featured" value={params.featured} /> : null}
              {params.audience ? <input type="hidden" name="audience" value={params.audience} /> : null}
              {params.interest ? <input type="hidden" name="interest" value={params.interest} /> : null}
              {params.collection ? <input type="hidden" name="collection" value={params.collection} /> : null}
              {params.type ? <input type="hidden" name="type" value={params.type} /> : null}
              {params.mood ? <input type="hidden" name="mood" value={params.mood} /> : null}
              {params.to ? <input type="hidden" name="to" value={params.to} /> : null}
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
            <h2>Открихме <span>{filteredOffers.length}</span> пътувания</h2>
            <div>
              <select name="sort" defaultValue={params.sort || "recommended"} aria-label="Сортиране">
                <option value="recommended">Препоръчани</option>
                <option value="newest">Най-нови</option>
                <option value="price">Цена</option>
              </select>
              <button className="is-active" type="button" aria-label="Изглед с карти"><Grid3X3 size={19} aria-hidden="true" /></button>
              <button type="button" aria-label="Списъчен изглед"><List size={20} aria-hidden="true" /></button>
            </div>
          </header>

          <div className="offers-grid offers-results-grid">
            {visibleOffers.map((offer) => (
              <OfferCard key={offer.slug} offer={offer} />
            ))}
          </div>
          {!filteredOffers.length ? (
            <div className="offers-empty-state">
              <strong>Няма оферти по тези критерии.</strong>
              <a href="/offers">Виж всички оферти</a>
            </div>
          ) : null}
          {!hasActiveSearch && filteredOffers.length > 6 ? (
            <div className="offers-soft-count">
              Показваме първите 6 от {filteredOffers.length}. Използвайте търсенето и филтрите, за да стесните резултатите.
            </div>
          ) : null}

          <section className="offers-tailor-banner">
            <span aria-hidden="true"><Sparkles size={34} /></span>
            <div>
              <h2>Не намирате точно това, което търсите?</h2>
              <p>Създаваме пътувания по мярка - изцяло според вашите желания.</p>
            </div>
            <a href="/contacts#inquiry">
              Изпратете запитване
              <span aria-hidden="true">→</span>
            </a>
          </section>

          <nav className="offers-pagination-preview" aria-label="Страници">
            <a aria-label="Предишна страница" href="/offers">‹</a>
            <span aria-current="page">1</span>
            <a href="/offers?page=2">2</a>
            <a href="/offers?page=3">3</a>
            <em>...</em>
            <a href="/offers?page=5">5</a>
            <a aria-label="Следваща страница" href="/offers?page=2">›</a>
          </nav>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
