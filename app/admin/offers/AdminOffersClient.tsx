"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Archive,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CloudUpload,
  Copy,
  DatabaseZap,
  Eye,
  FileSpreadsheet,
  FileUp,
  GripVertical,
  MoreVertical,
  Plus,
  Search,
  UploadCloud,
  X
} from "lucide-react";
import { AdminWorkspace } from "@/components/AdminWorkspace";
import type { AdminOfferListItem } from "@/lib/adminOfferRepository";

type StatusTab = "Всички" | "Публикувани" | "Чернови" | "Импортирани" | "За преглед" | "Архивирани";

type OfferRow = AdminOfferListItem;

const statusTabs: Array<{ label: StatusTab; total: number }> = [
  { label: "Всички", total: 356 },
  { label: "Публикувани", total: 218 },
  { label: "Чернови", total: 42 },
  { label: "Импортирани", total: 68 },
  { label: "За преглед", total: 12 },
  { label: "Архивирани", total: 16 }
];

const demoOffers: OfferRow[] = [
  {
    slug: "kapadokiya-magiyata-na-balonite",
    title: "Кападокия - магията на балоните",
    destination: "Турция",
    type: "Екскурзия",
    source: "RedTours",
    departures: 4,
    price: "999 EUR",
    status: "Публикувана",
    publication: "site",
    collection: "Red Signature",
    image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=220&q=72"
  },
  {
    slug: "maldivi-luks-i-spokoystvie",
    title: "Малдиви - лукс и спокойствие",
    destination: "Малдиви",
    type: "Почивка",
    source: "RedTours",
    departures: 7,
    price: "2 990 EUR",
    status: "Публикувана",
    publication: "site",
    collection: "Red Moments",
    image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=220&q=72"
  },
  {
    slug: "italia-amalfiysko-kraybrezhie",
    title: "Италия - Амалфийско крайбрежие",
    destination: "Италия",
    type: "Екскурзия",
    source: "RedTours",
    departures: 5,
    price: "1 690 EUR",
    status: "Публикувана",
    publication: "site",
    collection: "Red Escape",
    image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=220&q=72"
  },
  {
    slug: "maroko-imperski-gradove",
    title: "Мароко - имперски градове",
    destination: "Мароко",
    type: "Екскурзия",
    source: "Туроператор X",
    departures: 12,
    price: "1 890 EUR",
    status: "За преглед",
    publication: "draft",
    collection: "Red Signature",
    image: "https://images.unsplash.com/photo-1548018560-c7196548e84d?auto=format&fit=crop&w=220&q=72"
  },
  {
    slug: "gartsia-semeyna-pochivka",
    title: "Гърция - семейна почивка",
    destination: "Гърция",
    type: "Почивка",
    source: "RedTours",
    departures: 9,
    price: "749 EUR",
    status: "Публикувана",
    publication: "site",
    collection: "Red Moments",
    image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=220&q=72"
  },
  {
    slug: "alpiyski-varhove-i-ezera",
    title: "Алпийски върхове и езера",
    destination: "Швейцария, Италия",
    type: "Екскурзия",
    source: "Туроператор Y",
    departures: 6,
    price: "1 550 EUR",
    status: "Импортирана",
    publication: "site",
    collection: "Red Escape",
    image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=220&q=72"
  },
  {
    slug: "sredizemnomorski-kruiz",
    title: "Средиземноморски круиз",
    destination: "Испания, Франция, Италия",
    type: "Круиз",
    source: "API синхронизация",
    departures: 23,
    price: "1 299 EUR",
    status: "Импортирана",
    publication: "draft",
    collection: "Без колекция",
    image: "https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&w=220&q=72"
  },
  {
    slug: "nyu-york-gradat-nikoga-ne-spi",
    title: "Ню Йорк - градът никога не спи",
    destination: "САЩ",
    type: "Екскурзия",
    source: "RedTours",
    departures: 3,
    price: "1 850 EUR",
    status: "Чернова",
    publication: "draft",
    collection: "Без колекция",
    image: "https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?auto=format&fit=crop&w=220&q=72"
  },
  {
    slug: "london-klasika-i-modernost",
    title: "Лондон - класика и модерност",
    destination: "Великобритания",
    type: "Екскурзия",
    source: "XML импорт",
    departures: 8,
    price: "1 199 EUR",
    status: "За преглед",
    publication: "draft",
    collection: "Red Escape",
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=220&q=72"
  },
  {
    slug: "koledna-praga",
    title: "Коледна Прага",
    destination: "Чехия",
    type: "Екскурзия",
    source: "RedTours",
    departures: 2,
    price: "599 EUR",
    status: "Чернова",
    publication: "draft",
    collection: "Red Moments",
    image: "https://images.unsplash.com/photo-1519677100203-a0e668c92439?auto=format&fit=crop&w=220&q=72"
  }
];

const imports = [
  ["Импорт от TravelCo XML", "travelco_offers_20240811.xml", "Успешен", "128 нови, 15 обновени", "11.08.2026 14:32", "Ива Петрова"],
  ["API синхронизация - TourOperator API", "Автоматична синхронизация", "Частичен", "5 грешки", "11.08.2026 12:15", "Система"],
  ["Импорт от Excel файл", "offers_bulk_import.xlsx", "Успешен", "63 нови", "10.08.2026 16:45", "Мария Николова"]
];

const stats = [
  ["356", "Всички оферти"],
  ["218", "Публикувани"],
  ["68", "Импортирани"],
  ["42", "Чернови"],
  ["12", "За преглед"],
  ["16", "Архивирани"]
];

const fieldOptions = {
  destination: ["Турция", "Малдиви", "Италия", "Мароко", "Гърция", "Чехия"],
  type: ["Екскурзия", "Почивка", "Круиз"],
  source: ["RedTours", "Туроператор X", "Туроператор Y", "API синхронизация", "XML импорт"],
  publication: ["На сайта", "Чернова"],
  collection: ["Red Signature", "Red Escape", "Red Moments", "Без колекция"]
};

function statusClass(status: OfferRow["status"]) {
  if (status === "Публикувана") return "is-published";
  if (status === "За преглед") return "is-review";
  if (status === "Импортирана") return "is-imported";
  return "is-draft";
}

function typeClass(type: OfferRow["type"]) {
  if (type === "Почивка") return "is-blue";
  if (type === "Круиз") return "is-green";
  return "is-red";
}

function tabMatchesOffer(activeTab: StatusTab, offer: OfferRow) {
  if (activeTab === "Всички") return true;
  if (activeTab === "Публикувани") return offer.status === "Публикувана";
  if (activeTab === "Чернови") return offer.status === "Чернова";
  if (activeTab === "Импортирани") return offer.status === "Импортирана";
  if (activeTab === "За преглед") return offer.status === "За преглед";
  return offer.status === "Архивирана";
}

export function AdminOffersClient({ initialOffers }: { initialOffers: AdminOfferListItem[] }) {
  const [activeTab, setActiveTab] = useState<StatusTab>("Всички");
  const [query, setQuery] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [publicationFilter, setPublicationFilter] = useState("");
  const [collectionFilter, setCollectionFilter] = useState("");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [openActions, setOpenActions] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("Готово за работа. Избери действие от списъка с оферти.");
  const [creationMode, setCreationMode] = useState<"full" | "quick" | null>(null);
  const offers = initialOffers.length > 0 ? initialOffers : demoOffers;

  const filteredOffers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("bg-BG");

    return offers.filter((offer) => {
      const searchable = [offer.title, offer.destination, offer.type, offer.source, offer.status, offer.collection]
        .join(" ")
        .toLocaleLowerCase("bg-BG");

      return (
        tabMatchesOffer(activeTab, offer) &&
        (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (!destinationFilter || offer.destination.includes(destinationFilter)) &&
        (!typeFilter || offer.type === typeFilter) &&
        (!sourceFilter || offer.source === sourceFilter) &&
        (!statusFilter || offer.status === statusFilter) &&
        (!publicationFilter || (publicationFilter === "На сайта" ? offer.publication === "site" : offer.publication === "draft")) &&
        (!collectionFilter || offer.collection === collectionFilter)
      );
    });
  }, [activeTab, collectionFilter, destinationFilter, offers, publicationFilter, query, sourceFilter, statusFilter, typeFilter]);

  function clearFilters() {
    setQuery("");
    setDestinationFilter("");
    setTypeFilter("");
    setSourceFilter("");
    setStatusFilter("");
    setPublicationFilter("");
    setCollectionFilter("");
    setActiveTab("Всички");
    setActionMessage("Филтрите са изчистени.");
  }

  function runImport(kind: string) {
    setActionMessage(`${kind} е подготвен за следващата стъпка: избор на файл/доставчик и преглед преди публикуване.`);
  }

  function runRowAction(offer: OfferRow, action: string) {
    setOpenActions(null);
    setActionMessage(`${action}: ${offer.title}`);
  }

  return (
    <AdminWorkspace active="offers">
      <section className="offers-index">
        <header className="offers-index-header">
          <div>
            <h1>Оферти</h1>
            <p>Начало / Оферти</p>
          </div>
          <div className="offers-index-actions">
            <div className="offers-import-menu">
              <button type="button" aria-haspopup="menu">
                <CloudUpload size={17} aria-hidden="true" />
                Импорт
                <ChevronDown size={16} aria-hidden="true" />
              </button>
              <div role="menu">
                <button type="button" role="menuitem" onClick={() => runImport("Импорт от XML файл")}>
                  <FileUp size={18} aria-hidden="true" />
                  <span>
                    <strong>Импорт от XML файл</strong>
                    <em>Туроператори и доставчици</em>
                  </span>
                </button>
                <button type="button" role="menuitem" onClick={() => runImport("Импорт чрез API")}>
                  <DatabaseZap size={18} aria-hidden="true" />
                  <span>
                    <strong>Импорт чрез API</strong>
                    <em>Автоматична синхронизация</em>
                  </span>
                </button>
                <button type="button" role="menuitem" onClick={() => runImport("Импорт от CSV файл")}>
                  <FileSpreadsheet size={18} aria-hidden="true" />
                  <span>
                    <strong>Импорт от CSV файл</strong>
                    <em>Масово зареждане</em>
                  </span>
                </button>
                <button type="button" role="menuitem" onClick={() => runImport("Ръчен импорт")}>
                  <UploadCloud size={18} aria-hidden="true" />
                  <span>
                    <strong>Ръчен импорт</strong>
                    <em>Създаване и свързване</em>
                  </span>
                </button>
              </div>
            </div>
            <Link href="/admin/offers/new">
              <Plus size={17} aria-hidden="true" />
              Нова оферта
            </Link>
            <button className="primary" type="button" onClick={() => setCreationMode("quick")}>
              <Plus size={17} aria-hidden="true" />
              Бърза оферта
            </button>
          </div>
        </header>

        <div className="offers-action-feedback" role="status">
          <CheckCircle2 size={17} aria-hidden="true" />
          <span>{actionMessage}</span>
        </div>

        <nav className="offers-status-tabs" aria-label="Статуси на офертите">
          {statusTabs.map(({ label, total }) => (
            <button className={activeTab === label ? "is-active" : ""} type="button" key={label} onClick={() => setActiveTab(label)}>
              {label}
              <span>{total}</span>
            </button>
          ))}
        </nav>

        <div className="offers-index-grid">
          <div className="offers-index-main">
            <section className="offers-table-panel">
              <div className="offers-table" role="table" aria-label="Всички оферти">
                <div className="offers-table-row offers-table-head" role="row">
                  <span role="columnheader">Оферта</span>
                  <span role="columnheader">Тип</span>
                  <span role="columnheader">Източник</span>
                  <span role="columnheader">Отпътувания</span>
                  <span role="columnheader">Цена от</span>
                  <span role="columnheader">Статус</span>
                  <span role="columnheader">Публикация</span>
                  <span role="columnheader" />
                </div>
                {filteredOffers.map((offer) => (
                  <article className="offers-table-row" role="row" key={offer.slug}>
                    <GripVertical size={16} aria-hidden="true" />
                    <Link className="offers-title-cell" href={`/admin/offers/${offer.slug}`} role="cell">
                      <img src={offer.image} alt="" />
                      <span>
                        <strong>{offer.title}</strong>
                        <em>{offer.destination}</em>
                      </span>
                    </Link>
                    <span className={`offers-type-pill ${typeClass(offer.type)}`} role="cell">{offer.type}</span>
                    <span className="offers-source-pill" role="cell">{offer.source}</span>
                    <strong role="cell">{offer.departures}</strong>
                    <strong role="cell">от {offer.price}</strong>
                    <span className={`offers-status-pill ${statusClass(offer.status)}`} role="cell">{offer.status}</span>
                    <span className="offers-publication" role="cell">
                      <i className={offer.publication === "site" ? "is-live" : ""} />
                      {offer.publication === "site" ? "На сайта" : "Чернова"}
                    </span>
                    <div className="offers-row-actions">
                      <button
                        type="button"
                        aria-expanded={openActions === offer.slug}
                        aria-label={`Действия за ${offer.title}`}
                        onClick={() => setOpenActions(openActions === offer.slug ? null : offer.slug)}
                      >
                        <MoreVertical size={18} aria-hidden="true" />
                      </button>
                      {openActions === offer.slug ? (
                        <div className="offers-row-menu" role="menu">
                          <Link href={`/admin/offers/${offer.slug}`} role="menuitem">
                            <Eye size={16} aria-hidden="true" />
                            Отвори
                          </Link>
                          <button type="button" role="menuitem" onClick={() => runRowAction(offer, "Дублиране като чернова")}>
                            <Copy size={16} aria-hidden="true" />
                            Дублирай
                          </button>
                          <button type="button" role="menuitem" onClick={() => runRowAction(offer, "Архивиране")}>
                            <Archive size={16} aria-hidden="true" />
                            Архивирай
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}
                {filteredOffers.length === 0 ? (
                  <div className="offers-empty-state">
                    <Search size={22} aria-hidden="true" />
                    <strong>Няма оферти по тези критерии</strong>
                    <span>Промени филтрите или изчисти търсенето.</span>
                  </div>
                ) : null}
              </div>
              <footer className="offers-table-footer">
                <span>Показване на {filteredOffers.length === 0 ? "0" : "1"} до {filteredOffers.length} от {filteredOffers.length} видими резултата</span>
                <div>
                  <button type="button" onClick={() => setActionMessage("Това е първата страница от текущия филтриран списък.")}>‹</button>
                  {[1, 2, 3, 4, 5].map((page) => (
                    <button
                      className={page === 1 ? "is-active" : ""}
                      type="button"
                      key={page}
                      onClick={() => setActionMessage(`Страница ${page} ще зареди съответния набор оферти след връзка с базата.`)}
                    >
                      {page}
                    </button>
                  ))}
                  <span>...</span>
                  <button type="button" onClick={() => setActionMessage("Преминаване към последната страница след реална пагинация.")}>36</button>
                  <button type="button" onClick={() => setActionMessage("Следваща страница ще работи с реалната пагинация.")}>›</button>
                </div>
              </footer>
            </section>

            <section className="offers-imports-panel">
              <header>
                <h2>Последни импорти</h2>
                <button type="button" onClick={() => setActionMessage("Отваряне на пълния журнал на импортите.")}>Виж всички импорти</button>
              </header>
              {imports.map(([title, file, status, result, date, user]) => (
                <article key={title}>
                  <span>{title.includes("API") ? "API" : title.includes("Excel") ? "CSV" : "XML"}</span>
                  <div>
                    <strong>{title}</strong>
                    <em>{file}</em>
                  </div>
                  <mark>{status}</mark>
                  <p>{result}</p>
                  <time>{date}</time>
                  <p>{user}</p>
                  <button type="button" onClick={() => setActionMessage(`Преглед на импорт: ${title}`)}>Преглед</button>
                </article>
              ))}
            </section>
          </div>

          <aside className="offers-index-side">
            <section className="offers-filter-panel">
              <header>
                <h2>Филтри</h2>
                <button type="button" onClick={clearFilters}>Изчисти всички</button>
              </header>
              <label>
                <span>Търсене</span>
                <div className="offers-search-field">
                  <Search size={16} aria-hidden="true" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Заглавие, дестинация, туроператор..."
                  />
                </div>
              </label>
              <label>
                <span>Дестинация</span>
                <select value={destinationFilter} onChange={(event) => setDestinationFilter(event.target.value)}>
                  <option value="">Всички дестинации</option>
                  {fieldOptions.destination.map((option) => <option value={option} key={option}>{option}</option>)}
                </select>
              </label>
              <label>
                <span>Тип пътуване</span>
                <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                  <option value="">Всички типове</option>
                  {fieldOptions.type.map((option) => <option value={option} key={option}>{option}</option>)}
                </select>
              </label>
              <label>
                <span>Източник</span>
                <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
                  <option value="">Всички източници</option>
                  {fieldOptions.source.map((option) => <option value={option} key={option}>{option}</option>)}
                </select>
              </label>
              <label>
                <span>Статус</span>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="">Всички статуси</option>
                  {["Публикувана", "За преглед", "Импортирана", "Чернова", "Архивирана"].map((option) => <option value={option} key={option}>{option}</option>)}
                </select>
              </label>
              <label>
                <span>Публикация в сайта</span>
                <select value={publicationFilter} onChange={(event) => setPublicationFilter(event.target.value)}>
                  <option value="">Всички</option>
                  {fieldOptions.publication.map((option) => <option value={option} key={option}>{option}</option>)}
                </select>
              </label>
              <label>
                <span>Колекции</span>
                <select value={collectionFilter} onChange={(event) => setCollectionFilter(event.target.value)}>
                  <option value="">Всички колекции</option>
                  {fieldOptions.collection.map((option) => <option value={option} key={option}>{option}</option>)}
                </select>
              </label>
              {showMoreFilters ? (
                <div className="offers-advanced-filters">
                  <label>
                    <span>Етикет</span>
                    <select defaultValue="">
                      <option value="">Всички етикети</option>
                      <option>Последни места</option>
                      <option>Авторска програма</option>
                      <option>Наш избор</option>
                    </select>
                  </label>
                  <label>
                    <span>Видимост</span>
                    <select defaultValue="">
                      <option value="">Всички позиции</option>
                      <option>Начална страница</option>
                      <option>Търсачка</option>
                      <option>Промо секция</option>
                    </select>
                  </label>
                </div>
              ) : null}
              <label>
                <span>Период на отпътуване</span>
                <div className="offers-date-filter">
                  <CalendarDays size={16} aria-hidden="true" />
                  <input placeholder="От дата" onFocus={() => setActionMessage("Филтърът по дати ще бъде вързан към реалните отпътувания на офертите.")} />
                  <span>+</span>
                  <input placeholder="До дата" onFocus={() => setActionMessage("Филтърът по дати ще бъде вързан към реалните отпътувания на офертите.")} />
                </div>
              </label>
              <button className="offers-more-filters" type="button" onClick={() => setShowMoreFilters(!showMoreFilters)}>
                {showMoreFilters ? "Скрий допълнителни" : "Още филтри"}
                <ChevronDown size={16} aria-hidden="true" />
              </button>
            </section>

            <section className="offers-stat-panel">
              <h2>Бърза статистика</h2>
              <div>
                {stats.map(([value, label]) => (
                  <article key={label}>
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </article>
                ))}
              </div>
            </section>

            <section className="offers-expiring-panel">
              <h2>Скоро изтичащи публикации</h2>
              <div>
                <span>Малдиви - лукс и спокойствие</span>
                <time>31.08.2026</time>
              </div>
              <div>
                <span>Алпийски върхове и езера</span>
                <time>05.09.2026</time>
              </div>
              <div>
                <span>Кападокия - магията на балоните</span>
                <time>10.09.2026</time>
              </div>
              <button type="button" onClick={() => setActionMessage("Отваряне на списък с всички публикации с крайна дата.")}>Виж всички</button>
            </section>
          </aside>
        </div>

        {creationMode ? (
          <div className="offers-modal-backdrop" role="presentation" onMouseDown={() => setCreationMode(null)}>
            <section className="offers-create-modal" role="dialog" aria-modal="true" aria-labelledby="offer-create-title" onMouseDown={(event) => event.stopPropagation()}>
              <header>
                <div>
                  <span>Бързо създаване</span>
                  <h2 id="offer-create-title">Минимална чернова</h2>
                </div>
                <button type="button" aria-label="Затвори" onClick={() => setCreationMode(null)}>
                  <X size={18} aria-hidden="true" />
                </button>
              </header>
              <div>
                <label>
                  <span>Заглавие</span>
                  <input placeholder="Напр. Кападокия - магията на балоните" />
                </label>
                <label>
                  <span>Тип</span>
                  <select defaultValue="Екскурзия">
                    <option>Екскурзия</option>
                    <option>Почивка</option>
                    <option>Круиз</option>
                    <option>Хотел</option>
                  </select>
                </label>
              </div>
              <footer>
                <button type="button" onClick={() => setCreationMode(null)}>Отказ</button>
                <Link
                  className="primary"
                  href="/admin/offers/kapadokiya-magiyata-na-balonite"
                  onClick={() => setActionMessage("Създаване на чернова и отваряне на редактора.")}
                >
                  Създай чернова
                </Link>
              </footer>
            </section>
          </div>
        ) : null}
      </section>
    </AdminWorkspace>
  );
}
