"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Archive, Check, Code2, Copy, DatabaseZap, Eye, FileJson, Filter, Keyboard, MoreVertical, Plus, RotateCcw, Search, Trash2, UploadCloud, X } from "lucide-react";
import { AdminWorkspace } from "@/components/AdminWorkspace";
import type { AdminOfferListItem } from "@/lib/adminOfferRepository";
import { archiveAdminOffer, bulkAdminOfferAction, deleteAdminOffer, duplicateAdminOffer, restoreAdminOffer } from "./actions";
import { startBlankAdminOffer } from "./new/actions";

type StatusTab = "Всички" | "Публикувани" | "Чернови" | "Импортирани" | "За преглед" | "Архивирани";
type OfferRow = AdminOfferListItem;
type ConfirmAction = { offer: OfferRow; action: "archive" | "delete" } | null;
type BulkAction = "archive" | "delete" | "publish";
type BulkConfirmAction = { action: BulkAction; offers: OfferRow[] } | null;

const statusTabLabels: StatusTab[] = ["Всички", "Публикувани", "Чернови", "Импортирани", "За преглед", "Архивирани"];

function statusClass(status: OfferRow["status"]) {
  if (status === "Публикувана") return "is-published";
  if (status === "За преглед") return "is-review";
  if (status === "⚠ Променена") return "is-changed";
  if (status === "Изтекла") return "is-expired";
  if (status === "⚠ Грешка") return "is-error";
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
  if (activeTab === "Импортирани") return offer.source.startsWith("XML") || offer.source.startsWith("API") || offer.source.startsWith("ERP") || offer.source === "CSV/Excel";
  if (activeTab === "За преглед") return offer.status === "За преглед" || offer.status === "⚠ Променена" || offer.status === "⚠ Грешка";
  return offer.status === "Архивирана";
}

function adminOfferHref(offer: OfferRow) {
  return offer.importId ? `/admin/supplier-imports/${offer.importId}` : `/admin/offers/${offer.id}`;
}

function uniqueOptions(offers: OfferRow[], key: keyof Pick<OfferRow, "destination" | "type" | "source" | "status" | "collection">) {
  return Array.from(new Set(offers.map((offer) => offer[key]).filter(Boolean))).sort((first, second) => String(first).localeCompare(String(second), "bg"));
}

function countForTab(tab: StatusTab, offers: OfferRow[]) {
  return offers.filter((offer) => tabMatchesOffer(tab, offer)).length;
}

function formatUpdatedAt(value: string) {
  const updatedAt = new Date(value);
  const timestamp = updatedAt.getTime();

  if (!Number.isFinite(timestamp)) return "няма данни";

  const now = new Date();
  const diffMs = now.getTime() - timestamp;
  if (diffMs < 0) return "току-що";

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "току-що";
  if (minutes < 60) return `преди ${minutes} мин`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `преди ${hours} ${hours === 1 ? "час" : "часа"}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (updatedAt.toDateString() === yesterday.toDateString()) return "вчера";

  const days = Math.floor(hours / 24);
  if (days < 7) return `преди ${days} ${days === 1 ? "ден" : "дни"}`;

  return new Intl.DateTimeFormat("bg-BG", { day: "2-digit", month: "2-digit", year: "numeric" }).format(updatedAt);
}

export function AdminOffersClient({ initialOffers }: { initialOffers: AdminOfferListItem[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<StatusTab>("Всички");
  const [query, setQuery] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [collectionFilter, setCollectionFilter] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [openActions, setOpenActions] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [bulkConfirmAction, setBulkConfirmAction] = useState<BulkConfirmAction>(null);
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const offers = initialOffers;

  const filterOptions = useMemo(
    () => ({
      destination: uniqueOptions(offers, "destination"),
      type: uniqueOptions(offers, "type"),
      source: uniqueOptions(offers, "source"),
      status: uniqueOptions(offers, "status"),
      collection: uniqueOptions(offers, "collection")
    }),
    [offers]
  );

  const activeFilterCount = [query, destinationFilter, typeFilter, sourceFilter, statusFilter, collectionFilter].filter(Boolean).length;
  const statusTabs = useMemo(() => statusTabLabels.map((label) => ({ label, total: countForTab(label, offers) })), [offers]);

  const filteredOffers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("bg-BG");

    return offers.filter((offer) => {
      const searchable = [offer.title, offer.destination, offer.type, offer.source, offer.status, offer.collection, offer.price]
        .join(" ")
        .toLocaleLowerCase("bg-BG");

      return (
        tabMatchesOffer(activeTab, offer) &&
        (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (!destinationFilter || offer.destination === destinationFilter) &&
        (!typeFilter || offer.type === typeFilter) &&
        (!sourceFilter || offer.source === sourceFilter) &&
        (!statusFilter || offer.status === statusFilter) &&
        (!collectionFilter || offer.collection === collectionFilter)
      );
    });
  }, [activeTab, collectionFilter, destinationFilter, offers, query, sourceFilter, statusFilter, typeFilter]);
  const visibleSlugs = filteredOffers.map((offer) => offer.slug);
  const selectedOffers = offers.filter((offer) => selectedSlugs.includes(offer.slug));
  const selectedVisibleCount = visibleSlugs.filter((slug) => selectedSlugs.includes(slug)).length;
  const allVisibleSelected = visibleSlugs.length > 0 && selectedVisibleCount === visibleSlugs.length;
  const selectedCount = selectedOffers.length;

  function clearFilters() {
    setQuery("");
    setDestinationFilter("");
    setTypeFilter("");
    setSourceFilter("");
    setStatusFilter("");
    setCollectionFilter("");
    setActiveTab("Всички");
  }

  function runOfferAction(offer: OfferRow, action: "archive" | "duplicate" | "delete" | "restore") {
    setOpenActions(null);

    if (action === "duplicate" && offer.importId) return;

    if (action === "archive" || action === "delete") {
      setConfirmAction({ offer, action });
      return;
    }

    startTransition(async () => {
      const result = action === "duplicate" ? await duplicateAdminOffer(offer.slug) : await restoreAdminOffer(offer.slug);

      void result;
      router.refresh();
    });
  }

  function toggleOfferSelection(slug: string) {
    setSelectedSlugs((current) => current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]);
  }

  function toggleVisibleSelection() {
    setSelectedSlugs((current) => {
      if (allVisibleSelected) {
        return current.filter((slug) => !visibleSlugs.includes(slug));
      }

      return Array.from(new Set([...current, ...visibleSlugs]));
    });
  }

  function requestBulkAction(action: BulkAction) {
    setBulkConfirmAction({ action, offers: selectedOffers });
    setOpenActions(null);
  }

  function confirmBulkAction() {
    if (!bulkConfirmAction) return;

    const { action, offers: selected } = bulkConfirmAction;
    setBulkConfirmAction(null);

    startTransition(async () => {
      const result = await bulkAdminOfferAction(selected.map((offer) => offer.slug), action);

      void result;
      setSelectedSlugs([]);
      router.refresh();
    });
  }

  function confirmPendingAction() {
    if (!confirmAction) return;

    const { offer, action } = confirmAction;
    setConfirmAction(null);

    startTransition(async () => {
      const result = action === "archive" ? await archiveAdminOffer(offer.slug) : await deleteAdminOffer(offer.slug);

      void result;
      router.refresh();
    });
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
            <button type="button" onClick={() => setIsFiltersOpen((value) => !value)} aria-expanded={isFiltersOpen}>
              <Filter size={17} aria-hidden="true" />
              Филтри
              {activeFilterCount ? <span>{activeFilterCount}</span> : null}
            </button>
            <button className="primary" type="button" onClick={() => setIsCreateOpen(true)} aria-haspopup="dialog">
              <Plus size={17} aria-hidden="true" />
              Нова оферта
            </button>
          </div>
        </header>

        {isFiltersOpen ? (
          <section className="offers-filter-panel offers-filter-panel-inline">
            <header>
              <h2>Филтри</h2>
              <button type="button" onClick={clearFilters}>
                <X size={16} aria-hidden="true" />
                Изчисти
              </button>
            </header>
            <div className="offers-filter-grid">
              <label>
                <span>Търсене</span>
                <div className="offers-search-field">
                  <Search size={16} aria-hidden="true" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Заглавие, дестинация, статус..." />
                </div>
              </label>
              <label>
                <span>Дестинация</span>
                <select value={destinationFilter} onChange={(event) => setDestinationFilter(event.target.value)}>
                  <option value="">Всички дестинации</option>
                  {filterOptions.destination.map((option) => <option value={option} key={option}>{option}</option>)}
                </select>
              </label>
              <label>
                <span>Тип</span>
                <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                  <option value="">Всички типове</option>
                  {filterOptions.type.map((option) => <option value={option} key={option}>{option}</option>)}
                </select>
              </label>
              <label>
                <span>Източник</span>
                <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
                  <option value="">Всички източници</option>
                  {filterOptions.source.map((option) => <option value={option} key={option}>{option}</option>)}
                </select>
              </label>
              <label>
                <span>Статус</span>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="">Всички статуси</option>
                  {filterOptions.status.map((option) => <option value={option} key={option}>{option}</option>)}
                </select>
              </label>
              <label>
                <span>Колекция</span>
                <select value={collectionFilter} onChange={(event) => setCollectionFilter(event.target.value)}>
                  <option value="">Всички колекции</option>
                  {filterOptions.collection.map((option) => <option value={option} key={option}>{option}</option>)}
                </select>
              </label>
            </div>
          </section>
        ) : null}

        <nav className="offers-status-tabs" aria-label="Статуси на офертите">
          {statusTabs.map(({ label, total }) => (
            <button className={activeTab === label ? "is-active" : ""} type="button" key={label} onClick={() => setActiveTab(label)}>
              {label}
              <span>{total}</span>
            </button>
          ))}
        </nav>

        {selectedCount > 0 ? (
          <section className="offers-bulk-bar" aria-live="polite">
            <strong>{selectedCount} избрани</strong>
            <button type="button" onClick={() => requestBulkAction("publish")} disabled={isPending}>
              <Check size={16} aria-hidden="true" />
              Одобри и публикувай
            </button>
            <button type="button" onClick={() => requestBulkAction("archive")} disabled={isPending}>
              <Archive size={16} aria-hidden="true" />
              Архивирай
            </button>
            <button className="danger" type="button" onClick={() => requestBulkAction("delete")} disabled={isPending}>
              <Trash2 size={16} aria-hidden="true" />
              Изтрий
            </button>
            <button type="button" onClick={() => setSelectedSlugs([])} disabled={isPending}>
              <X size={16} aria-hidden="true" />
              Изчисти
            </button>
          </section>
        ) : null}

        <section className="offers-table-panel">
          <div className="offers-table" role="table" aria-label="Всички оферти">
            <div className="offers-table-row offers-table-head" role="row">
              <label className="offers-select-cell" aria-label="Маркирай всички видими оферти">
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleVisibleSelection} disabled={filteredOffers.length === 0 || isPending} />
              </label>
              <span role="columnheader">Оферта</span>
              <span role="columnheader">Тип</span>
              <span role="columnheader">Източник</span>
              <span role="columnheader">Цена от</span>
              <span role="columnheader">Статус</span>
              <span role="columnheader">Обновена</span>
              <span role="columnheader" />
            </div>
            {filteredOffers.map((offer, index) => (
              <article className={`offers-table-row ${selectedSlugs.includes(offer.slug) ? "is-selected" : ""}`} role="row" key={offer.slug}>
                <label className="offers-select-cell" aria-label={`Маркирай ${offer.title || "Нова оферта"}`}>
                  <input type="checkbox" checked={selectedSlugs.includes(offer.slug)} onChange={() => toggleOfferSelection(offer.slug)} disabled={isPending} />
                </label>
                <Link className="offers-title-cell" href={adminOfferHref(offer)} role="cell" prefetch={false}>
                  {offer.image ? <img src={offer.image} alt="" /> : <span className="offers-image-placeholder" aria-hidden="true"><img src="/brand/logo.png" alt="" /></span>}
                  <span>
                    <strong>{offer.title || "Нова оферта"}</strong>
                    <em>{offer.destination}</em>
                  </span>
                </Link>
                <span className={`offers-type-pill ${typeClass(offer.type)}`} role="cell">{offer.type}</span>
                <span className="offers-source-pill" role="cell">{offer.source}</span>
                <strong role="cell">{offer.price}</strong>
                <span className={`offers-status-pill ${statusClass(offer.status)}`} role="cell">{offer.status}</span>
                <time className="offers-updated" dateTime={offer.updatedAt} role="cell" suppressHydrationWarning>{formatUpdatedAt(offer.updatedAt)}</time>
                <div className="offers-row-actions">
                  <button
                    type="button"
                    aria-expanded={openActions === offer.slug}
                    aria-label={`Действия за ${offer.title || "Нова оферта"}`}
                    onClick={() => setOpenActions(openActions === offer.slug ? null : offer.slug)}
                    disabled={isPending}
                  >
                    <MoreVertical size={18} aria-hidden="true" />
                  </button>
                  {openActions === offer.slug ? (
                    <div className={`offers-row-menu ${filteredOffers.length > 3 && index >= filteredOffers.length - 2 ? "is-anchored-up" : ""}`} role="menu">
                      {offer.status === "Архивирана" ? (
                        <>
                        <button type="button" role="menuitem" onClick={() => runOfferAction(offer, "restore")} disabled={isPending}>
                          <RotateCcw size={16} aria-hidden="true" />
                          Разархивирай
                        </button>
                          <Link href={adminOfferHref(offer)} role="menuitem" prefetch={false}>
                            <Eye size={16} aria-hidden="true" />
                            Отвори
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link href={adminOfferHref(offer)} role="menuitem" prefetch={false}>
                            <Eye size={16} aria-hidden="true" />
                            Отвори
                          </Link>
                          {!offer.importId ? (
                            <button type="button" role="menuitem" onClick={() => runOfferAction(offer, "duplicate")} disabled={isPending}>
                              <Copy size={16} aria-hidden="true" />
                              Дублирай
                            </button>
                          ) : null}
                          <button type="button" role="menuitem" onClick={() => runOfferAction(offer, "archive")} disabled={isPending}>
                            <Archive size={16} aria-hidden="true" />
                            Архивирай
                          </button>
                        </>
                      )}
                      <button className="is-danger" type="button" role="menuitem" onClick={() => runOfferAction(offer, "delete")} disabled={isPending}>
                        <Trash2 size={16} aria-hidden="true" />
                        Изтрий
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
            {filteredOffers.length === 0 ? (
              <div className="offers-empty-state">
                <Search size={22} aria-hidden="true" />
                <strong>{offers.length ? "Няма оферти по тези критерии" : "Няма добавени оферти"}</strong>
                <span>{offers.length ? "Промени филтрите или изчисти търсенето." : "Създай нова оферта, за да се появи в списъка."}</span>
              </div>
            ) : null}
          </div>
          <footer className="offers-table-footer">
            <span>Показване на {filteredOffers.length} от {offers.length} оферти</span>
          </footer>
        </section>

        {confirmAction ? (
          <div className="offers-modal-backdrop" role="presentation" onMouseDown={() => setConfirmAction(null)}>
            <section className="offers-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="offers-confirm-title" onMouseDown={(event) => event.stopPropagation()}>
              <header>
                <div>
                  <span>{confirmAction.action === "archive" ? "Архивиране" : "Изтриване"}</span>
                  <h2 id="offers-confirm-title">
                    {confirmAction.action === "archive" ? "Архивиране на оферта" : "Изтриване на оферта"}
                  </h2>
                </div>
                <button type="button" aria-label="Затвори" onClick={() => setConfirmAction(null)}>
                  <X size={18} aria-hidden="true" />
                </button>
              </header>
              <div>
                <strong>{confirmAction.offer.title || "Нова оферта"}</strong>
                {confirmAction.action === "archive" ? (
                  <p>
                    Сигурни ли сте, че искате да архивирате тази оферта? Ако се архивира, няма да бъде видима в сайта. Може да бъде разархивирана от секцията Архивирани.
                  </p>
                ) : (
                  <p>
                    Сигурни ли сте, че искате да изтриете тази оферта? Това действие премахва офертата и свързаните с нея данни и не може да бъде отменено.
                  </p>
                )}
              </div>
              <footer>
                <button type="button" onClick={() => setConfirmAction(null)}>Отказ</button>
                <button className={confirmAction.action === "delete" ? "danger" : "primary"} type="button" onClick={confirmPendingAction} disabled={isPending}>
                  {confirmAction.action === "archive" ? "Архивирай" : "Изтрий"}
                </button>
              </footer>
            </section>
          </div>
        ) : null}

        {isCreateOpen ? (
          <div className="offers-modal-backdrop" role="presentation" onMouseDown={() => setIsCreateOpen(false)}>
            <section className="offers-create-modal offers-source-modal" role="dialog" aria-modal="true" aria-labelledby="offers-create-title" onMouseDown={(event) => event.stopPropagation()}>
              <header>
                <div>
                  <span>Нова оферта</span>
                  <h2 id="offers-create-title">Избери как ще я добавиш</h2>
                </div>
                <button type="button" aria-label="Затвори" onClick={() => setIsCreateOpen(false)}>
                  <X size={18} aria-hidden="true" />
                </button>
              </header>
              <div className="offers-source-options">
                <form action={startBlankAdminOffer}>
                  <button className="offers-source-option is-primary" type="submit" disabled={isPending}>
                    <Keyboard size={20} aria-hidden="true" />
                    <span>
                      <strong>Ръчно въвеждане</strong>
                      <em>Празна чернова, която се попълва в редактора.</em>
                    </span>
                  </button>
                </form>
                <Link className="offers-source-option" href="/admin/offers/new?source=api" prefetch={false}>
                  <DatabaseZap size={20} aria-hidden="true" />
                  <span>
                    <strong>API импорт</strong>
                    <em>Синхронизация от доставчик чрез endpoint.</em>
                  </span>
                </Link>
                <Link className="offers-source-option" href="/admin/offers/new?source=json" prefetch={false}>
                  <FileJson size={20} aria-hidden="true" />
                  <span>
                    <strong>JSON файл / payload</strong>
                    <em>Качване или paste на JSON за мапване към оферти.</em>
                  </span>
                </Link>
                <Link className="offers-source-option" href="/admin/offers/new?source=xml" prefetch={false}>
                  <Code2 size={20} aria-hidden="true" />
                  <span>
                    <strong>XML фийд</strong>
                    <em>Импорт от XML адрес или качен файл.</em>
                  </span>
                </Link>
                <Link className="offers-source-option" href="/admin/offers/new?source=csv" prefetch={false}>
                  <UploadCloud size={20} aria-hidden="true" />
                  <span>
                    <strong>CSV / Excel</strong>
                    <em>Табличен импорт от списък с оферти.</em>
                  </span>
                </Link>
              </div>
              <footer>
                <Link href="/admin/offers/new" prefetch={false}>Виж всички варианти</Link>
              </footer>
            </section>
          </div>
        ) : null}

        {bulkConfirmAction ? (
          <div className="offers-modal-backdrop" role="presentation" onMouseDown={() => setBulkConfirmAction(null)}>
            <section className="offers-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="offers-bulk-confirm-title" onMouseDown={(event) => event.stopPropagation()}>
              <header>
                <div>
                  <span>Масово действие</span>
                  <h2 id="offers-bulk-confirm-title">
                    {bulkConfirmAction.action === "publish" ? "Одобряване и публикуване" : bulkConfirmAction.action === "archive" ? "Архивиране на оферти" : "Изтриване на оферти"}
                  </h2>
                </div>
                <button type="button" aria-label="Затвори" onClick={() => setBulkConfirmAction(null)}>
                  <X size={18} aria-hidden="true" />
                </button>
              </header>
              <div>
                <strong>{bulkConfirmAction.offers.length} избрани оферти</strong>
                {bulkConfirmAction.action === "publish" ? (
                  <p>Сигурни ли сте, че искате да одобрите и публикувате избраните оферти? След публикуване те ще бъдат видими в сайта.</p>
                ) : bulkConfirmAction.action === "archive" ? (
                  <p>Сигурни ли сте, че искате да архивирате избраните оферти? След архивиране няма да бъдат видими в сайта и могат да бъдат разархивирани от секцията Архивирани.</p>
                ) : (
                  <p>Сигурни ли сте, че искате да изтриете избраните оферти? Това действие премахва офертите и свързаните с тях данни и не може да бъде отменено.</p>
                )}
              </div>
              <footer>
                <button type="button" onClick={() => setBulkConfirmAction(null)}>Отказ</button>
                <button className={bulkConfirmAction.action === "delete" ? "danger" : "primary"} type="button" onClick={confirmBulkAction} disabled={isPending}>
                  {bulkConfirmAction.action === "publish" ? "Публикувай" : bulkConfirmAction.action === "archive" ? "Архивирай" : "Изтрий"}
                </button>
              </footer>
            </section>
          </div>
        ) : null}
      </section>
    </AdminWorkspace>
  );
}
