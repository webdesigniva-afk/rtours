"use client";

import Link from "next/link";
import { CalendarDays, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Offer } from "@/lib/types";

type ExoticRegion = "all" | "asia" | "africa" | "latin-america" | "islands";
type ExoticSort = "nearest-date" | "price-asc" | "price-desc" | "newest";
const offersPageSize = 6;

const exoticTabs: Array<{ key: ExoticRegion; label: string }> = [
  { key: "all", label: "Всички" },
  { key: "asia", label: "Азия" },
  { key: "africa", label: "Африка" },
  { key: "latin-america", label: "Латинска Америка" },
  { key: "islands", label: "Острови" }
];

const exoticSortOptions: Array<{ key: ExoticSort; label: string }> = [
  { key: "nearest-date", label: "Най-близка дата" },
  { key: "price-asc", label: "Цена: възходяща" },
  { key: "price-desc", label: "Цена: низходяща" },
  { key: "newest", label: "Най-нови" }
];

const countriesByRegion: Record<Exclude<ExoticRegion, "all" | "islands">, string[]> = {
  asia: [
    "Абхазия",
    "Афганистан",
    "Армения",
    "Азербайджан",
    "Бахрейн",
    "Бангладеш",
    "Бруней",
    "Бутан",
    "Виетнам",
    "Гоа",
    "Грузия",
    "Дубай",
    "Израел",
    "Индия",
    "Индонезия",
    "Ирак",
    "Иран",
    "Йемен",
    "Йордания",
    "Камбоджа",
    "Казахстан",
    "Катар",
    "Киргизстан",
    "Китай",
    "Кувейт",
    "Лаос",
    "Ливан",
    "Малайзия",
    "Малдиви",
    "Монголия",
    "Мианмар",
    "Непал",
    "Обединени арабски емирства",
    "ОАЕ",
    "Оман",
    "Пакистан",
    "Палестина",
    "Саудитска Арабия",
    "Сингапур",
    "Сирия",
    "Таджикистан",
    "Тайван",
    "Тайланд",
    "Тибет",
    "Тимор",
    "Турция",
    "Туркменистан",
    "Узбекистан",
    "Филипини",
    "Хонконг",
    "Шри Ланка",
    "Южна Корея",
    "Япония",
    "Asia",
    "Asian",
    "Armenia",
    "Azerbaijan",
    "Bahrain",
    "Bali",
    "Bangladesh",
    "Bhutan",
    "Brunei",
    "Cambodia",
    "China",
    "Dubai",
    "Georgia",
    "Hong Kong",
    "India",
    "Indonesia",
    "Israel",
    "Japan",
    "Jordan",
    "Kazakhstan",
    "Korea",
    "Kuwait",
    "Laos",
    "Lebanon",
    "Malaysia",
    "Maldives",
    "Mongolia",
    "Myanmar",
    "Nepal",
    "Oman",
    "Philippines",
    "Qatar",
    "Singapore",
    "Sri Lanka",
    "Taiwan",
    "Thailand",
    "Turkey",
    "UAE",
    "United Arab Emirates",
    "Uzbekistan",
    "Vietnam"
  ],
  africa: [
    "Алжир",
    "Ангола",
    "Бенин",
    "Ботсвана",
    "Буркина Фасо",
    "Бурунди",
    "Габон",
    "Гамбия",
    "Гана",
    "Гвинея",
    "Джибути",
    "Египет",
    "Екваториална Гвинея",
    "Еритрея",
    "Есватини",
    "Етиопия",
    "Занзибар",
    "Замбия",
    "Зимбабве",
    "Кабо Верде",
    "Камерун",
    "Кения",
    "Коморски острови",
    "Конго",
    "Кот д'Ивоар",
    "Лесото",
    "Либерия",
    "Либия",
    "Мавриций",
    "Мадагаскар",
    "Малави",
    "Мали",
    "Мароко",
    "Мозамбик",
    "Намибия",
    "Нигер",
    "Нигерия",
    "Реюнион",
    "Руанда",
    "Сао Томе",
    "Сенегал",
    "Сейшели",
    "Сиера Леоне",
    "Сомалия",
    "Судан",
    "Танзания",
    "Того",
    "Тунис",
    "Уганда",
    "Централноафриканска република",
    "Чад",
    "Южна Африка",
    "Africa",
    "African",
    "Algeria",
    "Angola",
    "Botswana",
    "Cape Verde",
    "Egypt",
    "Ethiopia",
    "Ghana",
    "Kenya",
    "Madagascar",
    "Mauritius",
    "Morocco",
    "Mozambique",
    "Namibia",
    "Rwanda",
    "Senegal",
    "Seychelles",
    "South Africa",
    "Tanzania",
    "Tunisia",
    "Uganda",
    "Zanzibar",
    "Zimbabwe"
  ],
  "latin-america": [
    "Аржентина",
    "Аруба",
    "Бахами",
    "Барбадос",
    "Белиз",
    "Боливия",
    "Бразилия",
    "Венецуела",
    "Галапагос",
    "Гвиана",
    "Гватемала",
    "Доминикана",
    "Доминиканска република",
    "Еквадор",
    "Ел Салвадор",
    "Кариби",
    "Колумбия",
    "Коста Рика",
    "Куба",
    "Мексико",
    "Никарагуа",
    "Панама",
    "Парагвай",
    "Перу",
    "Пуерто Рико",
    "Уругвай",
    "Хаити",
    "Хондурас",
    "Чили",
    "Ямайка",
    "Latin America",
    "Caribbean",
    "Argentina",
    "Aruba",
    "Bahamas",
    "Barbados",
    "Belize",
    "Bolivia",
    "Brazil",
    "Chile",
    "Colombia",
    "Costa Rica",
    "Cuba",
    "Dominican Republic",
    "Ecuador",
    "Galapagos",
    "Guatemala",
    "Jamaica",
    "Mexico",
    "Panama",
    "Peru",
    "Puerto Rico",
    "Uruguay",
    "Venezuela"
  ]
};

const islandKeywords = [
  "Азорски острови",
  "Антигуа",
  "Аруба",
  "Багами",
  "Бали",
  "Барбадос",
  "Бора Бора",
  "Борнео",
  "Вануату",
  "Галапагос",
  "Гваделупа",
  "Гили",
  "Гренландия",
  "Доминикана",
  "Доминиканска република",
  "Занзибар",
  "Индонезия",
  "Исландия",
  "Кабо Верде",
    "Канарски острови",
  "Кариби",
  "Кипър",
  "Коморски острови",
  "Корсика",
  "Крит",
  "Куба",
  "Ла Диг",
  "Ломбок",
  "Мавриций",
  "Мадагаскар",
  "Малдиви",
  "Мартиника",
  "Миконос",
  "Муреа",
  "Палау",
  "Пукет",
  "Реюнион",
  "Самоа",
  "Санторини",
  "Сардиния",
  "Сейшели",
  "Сицилия",
  "Таити",
  "Тенерифе",
  "Фиджи",
  "Филипини",
  "Хаваи",
  "Шри Ланка",
  "Ямайка",
  "island",
  "islands",
  "archipelago",
  "Azores",
  "Bahamas",
  "Bali",
  "Barbados",
  "Bora Bora",
  "Borneo",
  "Canary Islands",
  "Caribbean",
  "Corsica",
  "Crete",
  "Cuba",
  "Dominican Republic",
  "Fiji",
  "Galapagos",
  "Hawaii",
  "Iceland",
  "Indonesia",
  "Jamaica",
  "La Digue",
  "Lombok",
  "Madagascar",
  "Maldives",
  "Mauritius",
  "Mykonos",
  "Palau",
  "Phuket",
  "Reunion",
  "Samoa",
  "Santorini",
  "Sardinia",
  "Seychelles",
  "Sicily",
  "Sri Lanka",
  "Tahiti",
  "Tenerife",
  "Zanzibar"
];

function normalizedText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("bg-BG");
}

function offerDestinationText(offer: Offer) {
  return [
    offer.title,
    offer.summary,
    offer.country,
    offer.region,
    offer.city,
    offer.destinations?.map((destination) => [destination.country, destination.region, destination.city].filter(Boolean).join(" ")),
    offer.taxonomyTermLabels,
    offer.taxonomyTermSlugs,
    offer.categoryLabels,
    offer.themeLabels,
    offer.moodLabels,
    offer.audienceLabels,
    offer.collectionSlugs
  ]
    .flat()
    .filter(Boolean)
    .join(" ");
}

function offerMatchesRegion(offer: Offer, region: ExoticRegion) {
  if (region === "all") return true;

  const destinationText = normalizedText(offerDestinationText(offer));
  const candidates = region === "islands" ? islandKeywords : countriesByRegion[region];

  return candidates.some((candidate) => destinationText.includes(normalizedText(candidate)));
}

function offerNearestDateTime(offer: Offer) {
  const now = Date.now();
  const futureDates = (offer.dates ?? [])
    .map((date) => new Date(date.startDate).getTime())
    .filter((time) => Number.isFinite(time) && time >= now)
    .sort((first, second) => first - second);

  return futureDates[0] ?? Number.POSITIVE_INFINITY;
}

function offerUpdatedTime(offer: Offer) {
  const updatedTime = new Date(offer.updatedAt || offer.createdAt || "").getTime();
  return Number.isFinite(updatedTime) ? updatedTime : 0;
}

function sortOffers(offers: Offer[], sort: ExoticSort) {
  return [...offers].sort((first, second) => {
    if (sort === "nearest-date") {
      return offerNearestDateTime(first) - offerNearestDateTime(second);
    }

    if (sort === "price-asc") {
      return (first.priceFrom || Number.POSITIVE_INFINITY) - (second.priceFrom || Number.POSITIVE_INFINITY);
    }

    if (sort === "price-desc") {
      return (second.priceFrom || 0) - (first.priceFrom || 0);
    }

    return offerUpdatedTime(second) - offerUpdatedTime(first);
  });
}

function priceLabel(offer: Offer) {
  return offer.priceFrom > 0 ? `от ${offer.priceFrom.toLocaleString("bg-BG")} ${offer.currency === "EUR" ? "EUR" : "лв."}` : "Цена при запитване";
}

function durationLabel(offer: Offer) {
  return offer.durationNights ? `${offer.durationDays} дни / ${offer.durationNights} нощувки` : `${offer.durationDays} дни`;
}

function ExoticOfferCard({ offer, featured = false }: { offer: Offer; featured?: boolean }) {
  return (
    <Link className={featured ? "exotic-offer-card is-featured" : "exotic-offer-card"} href={`/offers/${offer.slug}`}>
      <img src={offer.heroImage} alt={offer.title} />
      <span className="exotic-offer-shade" aria-hidden="true" />
      {featured ? <span className="exotic-offer-badge">Препоръчано</span> : null}
      <span className="exotic-offer-content">
        <strong>{offer.title}</strong>
        <span className="exotic-offer-bottom">
          <span>
            <CalendarDays size={16} aria-hidden="true" />
            {durationLabel(offer)}
          </span>
          <b>{priceLabel(offer)}</b>
        </span>
      </span>
    </Link>
  );
}

export function ExoticOffersBrowser({ offers }: { offers: Offer[] }) {
  const [activeRegion, setActiveRegion] = useState<ExoticRegion>("all");
  const [activeSort, setActiveSort] = useState<ExoticSort>("nearest-date");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(offersPageSize);
  const filteredOffers = useMemo(() => sortOffers(offers.filter((offer) => offerMatchesRegion(offer, activeRegion)), activeSort), [activeRegion, activeSort, offers]);
  const visibleOffers = filteredOffers.slice(0, visibleCount);
  const activeTabLabel = exoticTabs.find((tab) => tab.key === activeRegion)?.label ?? "Всички";
  const activeSortLabel = exoticSortOptions.find((option) => option.key === activeSort)?.label ?? "Най-близка дата";
  const hasMoreOffers = visibleCount < filteredOffers.length;

  useEffect(() => {
    setVisibleCount(offersPageSize);
  }, [activeRegion, activeSort, offers]);

  return (
    <>
      <nav className="exotic-offer-tabs" aria-label="Екзотични региони">
        {exoticTabs.map((tab) => (
          <button
            aria-pressed={activeRegion === tab.key}
            className={activeRegion === tab.key ? "is-active" : ""}
            key={tab.key}
            onClick={() => setActiveRegion(tab.key)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <header className="exotic-offers-header">
        <h2>{activeRegion === "all" ? "Екзотични пътувания" : activeTabLabel}</h2>
        <div className="exotic-offer-tools" aria-label="Инструменти за оферти">
          <div className="exotic-sort-menu">
            <button
              aria-expanded={isSortOpen}
              aria-haspopup="menu"
              onClick={() => setIsSortOpen((current) => !current)}
              type="button"
            >
              {activeSortLabel}
              <ChevronDown size={18} aria-hidden="true" />
            </button>
            {isSortOpen ? (
              <div className="exotic-sort-options" role="menu">
                {exoticSortOptions.map((option) => (
                  <button
                    className={activeSort === option.key ? "is-selected" : ""}
                    key={option.key}
                    onClick={() => {
                      setActiveSort(option.key);
                      setIsSortOpen(false);
                    }}
                    role="menuitemradio"
                    aria-checked={activeSort === option.key}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {filteredOffers.length ? (
        <>
          <div className="exotic-offers-grid">
            {visibleOffers.map((offer, index) => (
              <ExoticOfferCard featured={index === 0} key={offer.slug} offer={offer} />
            ))}
          </div>
          {hasMoreOffers ? (
            <div className="exotic-offers-load-more">
              <button type="button" onClick={() => setVisibleCount((current) => current + offersPageSize)}>
                Зареди още
                <span>{Math.min(offersPageSize, filteredOffers.length - visibleCount)}</span>
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="exotic-offers-empty">
          <strong>Няма оферти в тази група.</strong>
          <p>Когато публикувана оферта с отметка „Екзотики“ съвпадне с този регион, тя ще се появи тук автоматично.</p>
        </div>
      )}
    </>
  );
}
