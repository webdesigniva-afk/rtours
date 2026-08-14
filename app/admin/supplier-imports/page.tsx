import Link from "next/link";
import { AlertTriangle, Building2, CalendarDays, CheckCircle2, Clock3, DatabaseZap, Eye, FileText, History, ImageIcon, Pencil, RefreshCw, Settings } from "lucide-react";
import { AdminWorkspace } from "@/components/AdminWorkspace";
import {
  getAdminSupplierImportSummary,
  listAdminSupplierConnectors,
  listAdminSupplierImportRuns,
  listAdminSupplierImports
} from "@/lib/adminImportRepository";
import { SupplierImportLaunchPanel } from "./SupplierImportLaunchPanel";

export const dynamic = "force-dynamic";

type SupplierImportsSearchParams = {
  synced?: string;
  checked?: string;
  new?: string;
  changed?: string;
  unchanged?: string;
  total?: string;
  excursions?: string;
  holidays?: string;
  processed?: string;
  syncError?: string;
  genericProvider?: string;
  startImport?: string;
  page?: string;
};

function formatDate(value: string | null) {
  if (!value) return "няма данни";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "няма данни";

  return new Intl.DateTimeFormat("bg-BG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function formatPrice(price: string | null, currency: string | null) {
  if (!price) return "няма цена";
  return `${Number(price).toLocaleString("bg-BG")} ${currency || "EUR"}`;
}

function statusLabel(status: string | null) {
  if (status === "published") return "Публикувана";
  if (status === "review") return "За преглед";
  if (status === "draft") return "Чернова";
  if (status === "archived") return "Архивирана";
  return "Няма оферта";
}

function runStatusLabel(status: string) {
  if (status === "success") return "Успешна";
  if (status === "partial_success") return "Частична";
  if (status === "failed") return "Неуспешна";
  if (status === "running") return "В процес";
  return status;
}

function runStatusClass(status: string) {
  if (status === "success") return "is-success";
  if (status === "partial_success") return "is-warning";
  if (status === "failed") return "is-error";
  return "is-running";
}

function connectorStatusLabel(status: string) {
  if (status === "active") return "Активен";
  if (status === "paused") return "Пауза";
  if (status === "disabled") return "Спрян";
  return status;
}

function readinessClass(value: number) {
  return value > 0 ? "is-ok" : "is-missing";
}

function parsePage(value: string | undefined) {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function supplierImportsPageHref(page: number) {
  const query = new URLSearchParams();
  query.set("page", String(page));
  return `/admin/supplier-imports?${query.toString()}`;
}

export default async function AdminSupplierImportsPage({
  searchParams
}: {
  searchParams?: Promise<SupplierImportsSearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const requestedPage = parsePage(params.page);
  const [importsPage, summary, runs, connectors] = await Promise.all([
    listAdminSupplierImports({ page: requestedPage, pageSize: 20 }).catch(() => ({
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 20,
      pageCount: 1
    })),
    getAdminSupplierImportSummary().catch(() => ({ total: 0, waitingReview: 0, changed: 0, missingData: 0 })),
    listAdminSupplierImportRuns().catch(() => []),
    listAdminSupplierConnectors().catch(() => [])
  ]);
  const imports = importsPage.items;
  const total = summary.total;
  const waitingReview = summary.waitingReview;
  const changed = summary.changed;
  const withMissingData = summary.missingData;
  const activeConnectors = connectors.filter((connector) => connector.status === "active").length;
  const firstImportNumber = importsPage.totalCount === 0 ? 0 : (importsPage.page - 1) * importsPage.pageSize + 1;
  const lastImportNumber = Math.min(importsPage.page * importsPage.pageSize, importsPage.totalCount);

  return (
    <AdminWorkspace active="imports">
      <section className="supplier-imports-page">
        <SupplierImportLaunchPanel
          connectors={connectors}
          shouldOpenImport={params.startImport === "1"}
          feedback={{
            syncError: params.syncError,
            checked: params.checked,
            synced: params.synced,
            new: params.new,
            changed: params.changed,
            unchanged: params.unchanged,
            total: params.total,
            processed: params.processed,
            excursions: params.excursions,
            holidays: params.holidays,
            genericProvider: params.genericProvider
          }}
        />

        <section className="supplier-dashboard-stats" aria-label="Обобщение на импортите">
          <article>
            <DatabaseZap size={18} aria-hidden="true" />
            <strong>{total}</strong>
            <span>импортирани оферти</span>
          </article>
          <article>
            <CheckCircle2 size={18} aria-hidden="true" />
            <strong>{waitingReview}</strong>
            <span>чакат преглед</span>
          </article>
          <article>
            <AlertTriangle size={18} aria-hidden="true" />
            <strong>{changed}</strong>
            <span>с важни промени</span>
          </article>
          <article>
            <FileText size={18} aria-hidden="true" />
            <strong>{withMissingData}</strong>
            <span>с липсващи данни</span>
          </article>
          <article>
            <Settings size={18} aria-hidden="true" />
            <strong>{activeConnectors}</strong>
            <span>активни доставчици</span>
          </article>
        </section>

        <section className="supplier-section-panel" aria-labelledby="supplier-connectors-title">
          <header>
            <div>
              <span>Доставчици</span>
              <h2 id="supplier-connectors-title">Настроени източници</h2>
              <p>Всеки доставчик има собствен формат, но всички се мапват към единния модел на Red Tours.</p>
            </div>
            <Link href="/admin/supplier-imports?startImport=1" prefetch={false}>
              <RefreshCw size={17} aria-hidden="true" />
              Стартирай импорт
            </Link>
          </header>

          <div className="supplier-provider-grid">
            {connectors.map((connector) => (
              <article className="supplier-provider-tile" key={connector.id}>
                <div>
                  <span>{connector.sourceType.toUpperCase()}</span>
                  <strong>{connector.displayName}</strong>
                  <p>{connector.defaultBaseUrl || "Ръчен payload или специфична API настройка"}</p>
                </div>
                <dl>
                  <div>
                    <dt>Статус</dt>
                    <dd>{connectorStatusLabel(connector.status)}</dd>
                  </div>
                  <div>
                    <dt>Последен импорт</dt>
                    <dd>{connector.lastRunAt ? formatDate(connector.lastRunAt) : "няма"}</dd>
                  </div>
                  <div>
                    <dt>Последен резултат</dt>
                    <dd>{connector.lastRunStatus ? runStatusLabel(connector.lastRunStatus) : "няма"}</dd>
                  </div>
                </dl>
              </article>
            ))}

            {connectors.length === 0 ? (
              <div className="supplier-empty-panel">
                <Settings size={22} aria-hidden="true" />
                <strong>Още няма настроени доставчици</strong>
                <span>Започни с импорт от JSON/XML payload или добави API доставчик с mapping.</span>
              </div>
            ) : null}
          </div>
        </section>

        <section className="supplier-section-panel" aria-labelledby="supplier-runs-title">
          <header>
            <div>
              <span>История</span>
              <h2 id="supplier-runs-title">Последни синхронизации</h2>
              <p>Тук се вижда дали връзката е била успешна, колко оферти са обработени и дали има грешки.</p>
            </div>
            <History size={20} aria-hidden="true" />
          </header>

          <div className="supplier-run-list">
            {runs.map((run) => (
              <article className="supplier-run-row" key={run.id}>
                <div>
                  <strong>{run.displayName || run.provider}</strong>
                  <span>{run.mode} · {formatDate(run.startedAt)}</span>
                  {run.errorMessage ? <small>{run.errorMessage}</small> : null}
                </div>
                <mark className={runStatusClass(run.status)}>{runStatusLabel(run.status)}</mark>
                <dl>
                  <div>
                    <dt>Намерени</dt>
                    <dd>{run.totalFound ?? "-"}</dd>
                  </div>
                  <div>
                    <dt>Обработени</dt>
                    <dd>{run.totalProcessed}</dd>
                  </div>
                  <div>
                    <dt>Нови</dt>
                    <dd>{run.newCount}</dd>
                  </div>
                  <div>
                    <dt>Променени</dt>
                    <dd>{run.changedCount}</dd>
                  </div>
                  <div>
                    <dt>Грешки</dt>
                    <dd>{run.errorCount}</dd>
                  </div>
                </dl>
              </article>
            ))}

            {runs.length === 0 ? (
              <div className="supplier-empty-panel">
                <Clock3 size={22} aria-hidden="true" />
                <strong>Още няма импорт сесии</strong>
                <span>След първата проверка или синхронизация историята ще се появи тук.</span>
              </div>
            ) : null}
          </div>
        </section>

        <section className="supplier-section-panel" aria-labelledby="supplier-review-title">
          <header>
            <div>
              <span>Преглед</span>
              <h2 id="supplier-review-title">Оферти от доставчици</h2>
              <p>Новите и променените оферти първо се проверяват тук. Публикуването става само след човешко одобрение.</p>
            </div>
            <div className="supplier-import-page-count">
              <strong>{firstImportNumber}-{lastImportNumber}</strong>
              <span>от {importsPage.totalCount} импортирани оферти</span>
            </div>
          </header>

          <div className="supplier-import-list">
            {imports.map((item) => (
              <article className="supplier-import-row" key={`${item.provider}-${item.externalId}`}>
                <div className="supplier-import-main">
                  <span>{item.provider}</span>
                  <h3>{item.title}</h3>
                  <p>{item.destination || "Без разпозната дестинация"} · външен ID {item.externalId}</p>
                  {item.importantChanges.length > 0 ? (
                    <mark className="supplier-import-change-badge">
                      <AlertTriangle size={15} aria-hidden="true" />
                      {item.importantChanges.length} важни промени
                    </mark>
                  ) : null}
                  {item.detailError ? (
                    <mark>
                      <AlertTriangle size={15} aria-hidden="true" />
                      Грешка в detail данните
                    </mark>
                  ) : null}
                </div>

                <div className="supplier-import-readiness" aria-label="Мапнати данни">
                  <span className={readinessClass(item.datesCount)}>
                    <CalendarDays size={15} aria-hidden="true" />
                    {item.datesCount} дати
                  </span>
                  <span className={readinessClass(item.mediaCount)}>
                    <ImageIcon size={15} aria-hidden="true" />
                    {item.mediaCount} снимки
                  </span>
                  <span className={readinessClass(item.itineraryCount)}>
                    <FileText size={15} aria-hidden="true" />
                    {item.itineraryCount} дни
                  </span>
                  <span className={readinessClass(item.hotelsCount)}>
                    <Building2 size={15} aria-hidden="true" />
                    {item.hotelsCount} хотели
                  </span>
                  <span className={readinessClass(item.servicesCount)}>
                    <DatabaseZap size={15} aria-hidden="true" />
                    {item.servicesCount} услуги
                  </span>
                </div>

                <div className="supplier-import-meta">
                  <strong>{formatPrice(item.priceFrom, item.currency)}</strong>
                  <span>{statusLabel(item.status)}</span>
                  <time dateTime={item.lastSyncedAt}>{formatDate(item.lastSyncedAt)}</time>
                </div>

                <div className="supplier-import-actions">
                  {item.offerId ? (
                    <>
                      <Link href={`/admin/supplier-imports/${item.importId}`} prefetch={false}>
                        <Pencil size={16} aria-hidden="true" />
                        Преглед
                      </Link>
                      {item.slug ? (
                        <Link href={`/offers/${item.slug}`} prefetch={false}>
                          <Eye size={16} aria-hidden="true" />
                          Сайт
                        </Link>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </article>
            ))}

            {imports.length === 0 ? (
              <div className="supplier-empty-panel">
                <DatabaseZap size={24} aria-hidden="true" />
                <strong>Още няма импортирани оферти</strong>
                <span>Стартирай импорт и офертите ще се появят тук като готови за преглед.</span>
                <Link href="/admin/supplier-imports?startImport=1" prefetch={false}>Стартирай импорт</Link>
              </div>
            ) : null}
          </div>

          {importsPage.pageCount > 1 ? (
            <nav className="supplier-import-pagination" aria-label="Страници с импортирани оферти">
              <em>Показани {firstImportNumber}-{lastImportNumber} от {importsPage.totalCount} импортирани оферти</em>
              {importsPage.page > 1 ? (
                <Link href={supplierImportsPageHref(importsPage.page - 1)} prefetch={false}>Назад</Link>
              ) : (
                <span aria-disabled="true">Назад</span>
              )}
              <strong>Страница {importsPage.page} от {importsPage.pageCount}</strong>
              {importsPage.page < importsPage.pageCount ? (
                <Link href={supplierImportsPageHref(importsPage.page + 1)} prefetch={false}>Напред</Link>
              ) : (
                <span aria-disabled="true">Напред</span>
              )}
            </nav>
          ) : null}
        </section>
      </section>
    </AdminWorkspace>
  );
}
