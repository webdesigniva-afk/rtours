import Link from "next/link";
import { AlertTriangle, Building2, CalendarDays, DatabaseZap, Eye, FileText, ImageIcon, Pencil, Plus, RefreshCw } from "lucide-react";
import { AdminWorkspace } from "@/components/AdminWorkspace";
import { listAdminSupplierImports } from "@/lib/adminImportRepository";
import { syncBohemiaSupplierImports } from "./actions";

export const dynamic = "force-dynamic";

type SupplierImportsSearchParams = {
  synced?: string;
  new?: string;
  changed?: string;
  unchanged?: string;
  syncError?: string;
};

function formatDate(value: string) {
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

function readinessClass(value: number) {
  return value > 0 ? "is-ok" : "is-missing";
}

export default async function AdminSupplierImportsPage({
  searchParams
}: {
  searchParams?: Promise<SupplierImportsSearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const imports = await listAdminSupplierImports().catch(() => []);
  const total = imports.length;
  const withDates = imports.filter((item) => item.datesCount > 0).length;
  const withMedia = imports.filter((item) => item.mediaCount > 0).length;
  const withProgram = imports.filter((item) => item.itineraryCount > 0).length;
  const withHotels = imports.filter((item) => item.hotelsCount > 0).length;
  const withErrors = imports.filter((item) => item.detailError).length;

  return (
    <AdminWorkspace active="imports">
      <section className="supplier-imports-page">
        <header className="supplier-imports-hero">
          <div>
            <span>Supplier feed</span>
            <h1>Интегрирани оферти</h1>
            <p>
              Всички външни API оферти влизат тук като отделен доставчик feed. После човек ги преглежда,
              чисти, подрежда и публикува със същия публичен RedTours шаблон.
            </p>
          </div>
          <a href="#supplier-sync">
            <RefreshCw size={17} aria-hidden="true" />
            Синхронизирай доставчик
          </a>
        </header>

        <section className="supplier-import-sync-panel" id="supplier-sync" aria-labelledby="supplier-sync-title">
          <div className="supplier-import-sync-copy">
            <span>API доставчици</span>
            <h2 id="supplier-sync-title">Синхронизация на оферти</h2>
            <p>
              Пуска се от админ панела. Съществуващите оферти се обновяват по доставчик и външен ID, а новите
              влизат със статус „за преглед“, без автоматично публикуване.
            </p>
          </div>

          {params.syncError ? (
            <div className="supplier-import-sync-alert is-error" role="alert">
              {params.syncError}
            </div>
          ) : null}

          {params.synced ? (
            <div className="supplier-import-sync-alert is-success" role="status">
              Синхронизирани {params.synced} оферти: {params.new ?? "0"} нови, {params.changed ?? "0"} обновени,
              {params.unchanged ?? "0"} без промяна.
            </div>
          ) : null}

          <form action={syncBohemiaSupplierImports} className="supplier-import-sync-form">
            <div className="supplier-import-provider-card is-active">
              <div>
                <span>Активен конектор</span>
                <strong>Bohemia</strong>
                <p>Екскурзии и почивки. Оферти, снимки, програма, услуги и допълнителни блокове.</p>
              </div>
              <mark>готов за sync</mark>
            </div>

            <div className="supplier-import-sync-grid">
              <label>
                Доставчик
                <input name="provider_label" value="Bohemia" readOnly />
              </label>
              <label>
                Среда
                <select name="base_url" defaultValue="https://demo.internationaltravelgroup.net">
                  <option value="https://demo.internationaltravelgroup.net">Тестов сървър</option>
                  <option value="https://ims.internationaltravelgroup.net">Продукционен сървър</option>
                </select>
              </label>
              <label>
                Потребител
                <input name="username" autoComplete="username" placeholder="bohemia_user" required />
              </label>
              <label>
                Парола
                <input name="password" type="password" autoComplete="current-password" placeholder="••••••••" required />
              </label>
              <label>
                Лимит
                <input name="limit" type="number" min="1" max="500" defaultValue="100" />
              </label>
              <label>
                Детайли
                <input name="details_limit" type="number" min="1" max="500" defaultValue="100" />
              </label>
            </div>

            <fieldset className="supplier-import-sync-types">
              <legend>Типове оферти</legend>
              <label>
                <input name="types" type="checkbox" value="excursion" defaultChecked />
                Екскурзии
              </label>
              <label>
                <input name="types" type="checkbox" value="holiday" defaultChecked />
                Почивки
              </label>
            </fieldset>

            <label className="supplier-import-sync-all">
              <input name="import_all" type="checkbox" value="yes" />
              <span>
                <strong>Импортирай всички налични оферти</strong>
                <small>Игнорира лимита и тегли всички резултати, които Bohemia връща за избраните типове.</small>
              </span>
            </label>

            <div className="supplier-import-sync-footer">
              <button type="submit">
                <RefreshCw size={17} aria-hidden="true" />
                Синхронизирай Bohemia
              </button>
              <p>Паролата се използва само за тази заявка и не се записва в базата. Пълният sync може да отнеме повече време.</p>
            </div>
          </form>

          <div className="supplier-import-provider-card is-muted">
            <div>
              <span>Следващи конектори</span>
              <strong>Onex и други доставчици</strong>
              <p>Ще се добавят като отделни карти със същия процес: sync, преглед, редакция, публикация.</p>
            </div>
            <mark>подготовка</mark>
          </div>
        </section>

        <section className="supplier-imports-stats" aria-label="Статус на интегрираните оферти">
          <article>
            <strong>{total}</strong>
            <span>външни оферти</span>
          </article>
          <article>
            <strong>{withDates}</strong>
            <span>с дати</span>
          </article>
          <article>
            <strong>{withMedia}</strong>
            <span>със снимки</span>
          </article>
          <article>
            <strong>{withProgram}</strong>
            <span>с програма</span>
          </article>
          <article>
            <strong>{withHotels}</strong>
            <span>с хотели</span>
          </article>
          <article className={withErrors ? "is-warning" : ""}>
            <strong>{withErrors}</strong>
            <span>detail грешки</span>
          </article>
        </section>

        <section className="supplier-imports-board">
          <header>
            <div>
              <h2>Bohemia feed</h2>
              <p>Тук следим какво е дошло от доставчика и какво липсва за красива публична страница.</p>
            </div>
          </header>

          <div className="supplier-import-list">
            {imports.map((item) => (
              <article className="supplier-import-row" key={`${item.provider}-${item.externalId}`}>
                <div className="supplier-import-main">
                  <span>{item.provider}</span>
                  <h3>{item.title}</h3>
                  <p>{item.destination || "Без разпозната дестинация"} · {item.externalId}</p>
                  {item.detailError ? (
                    <mark>
                      <AlertTriangle size={15} aria-hidden="true" />
                      Detail endpoint: {item.detailError}
                    </mark>
                  ) : null}
                </div>

                <div className="supplier-import-readiness" aria-label="Разпределени данни">
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
                  ) : (
                    <button type="button" disabled>
                      <Plus size={16} aria-hidden="true" />
                      Създай оферта
                    </button>
                  )}
                </div>
              </article>
            ))}

            {imports.length === 0 ? (
              <div className="supplier-import-empty">
                <DatabaseZap size={24} aria-hidden="true" />
                <strong>Още няма интегрирани оферти</strong>
                <span>Пусни първи Bohemia импорт, за да се появят тук.</span>
                <a href="#supplier-sync">Отвори синхронизация</a>
              </div>
            ) : null}
          </div>
        </section>
      </section>
    </AdminWorkspace>
  );
}
