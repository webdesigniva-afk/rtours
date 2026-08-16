import Link from "next/link";
import { AlertTriangle, CheckCircle2, DatabaseZap, KeyRound, PauseCircle, Settings, ShieldCheck, TimerReset } from "lucide-react";
import { AdminWorkspace } from "@/components/AdminWorkspace";
import { listAdminSupplierConnectors, listAdminSupplierImportRuns } from "@/lib/adminImportRepository";
import { saveSupplierConnectorCredentials } from "@/app/admin/supplier-imports/actions";
import { SupplierBatchSyncPanel } from "./SupplierBatchSyncPanel";

export const dynamic = "force-dynamic";

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

function runStatusLabel(status: string | null) {
  if (status === "success") return "Успешна";
  if (status === "partial_success") return "Частична";
  if (status === "failed") return "Неуспешна";
  if (status === "running") return "В процес";
  return "няма";
}

function connectorStatusLabel(status: string) {
  if (status === "active") return "Активен";
  if (status === "paused") return "Пауза";
  if (status === "disabled") return "Спрян";
  return status;
}

function authLabel(provider: string, config: Record<string, unknown>) {
  if (config.credentialsStored === true) return "Сигурно настроени";
  if (provider === "abax" && (process.env.ABAX_API_KEY || process.env.ABAX_API_UUID) && (process.env.ABAX_API_CODE || process.env.ABAX_API_SECRET)) {
    return "Сървърно настроени";
  }
  if (provider === "bohemia" && process.env.BOHEMIA_API_USERNAME && process.env.BOHEMIA_API_PASSWORD) {
    return "Сървърно настроени";
  }
  return "Въвеждат се при sync";
}

function runningPercent(processed: number | null, total: number | null) {
  if (!processed || !total || total <= 0) return 0;
  return Math.min(Math.round((processed / total) * 100), 100);
}

type AdminSuppliersSearchParams = {
  credentialsSaved?: string;
  credentialError?: string;
};

export default async function AdminSuppliersPage({
  searchParams
}: {
  searchParams?: Promise<AdminSuppliersSearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const [connectors, runs] = await Promise.all([
    listAdminSupplierConnectors().catch(() => []),
    listAdminSupplierImportRuns({ range: "month", limit: 12 }).catch(() => [])
  ]);
  const activeCount = connectors.filter((connector) => connector.status === "active").length;
  const runningCount = connectors.filter((connector) => connector.runningRunId).length;
  const totalImported = connectors.reduce((sum, connector) => sum + connector.importedCount, 0);
  const totalChanged = connectors.reduce((sum, connector) => sum + connector.changedCount, 0);

  return (
    <AdminWorkspace active="suppliers">
      <section className="supplier-admin-page">
        <section className="supplier-admin-hero">
          <div>
            <span>Доставчици</span>
            <h1>Интеграции с външни туроператори</h1>
            <p>
              Тук се настройват източниците, връзката към API/feed, режимът на синхронизация и контролът върху нови и
              променени оферти. Самите оферти остават за преглед в “Импорти”.
            </p>
          </div>
          <Link href="/admin/supplier-imports?startImport=1" prefetch={false}>
            <DatabaseZap size={18} aria-hidden="true" />
            Нов доставчик / тест
          </Link>
        </section>

        <section className="supplier-admin-stats" aria-label="Обобщение на доставчиците">
          <article>
            <CheckCircle2 size={18} aria-hidden="true" />
            <strong>{activeCount}</strong>
            <span>активни доставчици</span>
          </article>
          <article>
            <DatabaseZap size={18} aria-hidden="true" />
            <strong>{totalImported}</strong>
            <span>оферти от доставчици</span>
          </article>
          <article>
            <AlertTriangle size={18} aria-hidden="true" />
            <strong>{totalChanged}</strong>
            <span>с важни промени</span>
          </article>
          <article>
            <TimerReset size={18} aria-hidden="true" />
            <strong>{runningCount}</strong>
            <span>синхронизации в процес</span>
          </article>
        </section>

        {params.credentialsSaved || params.credentialError ? (
          <div className={params.credentialError ? "supplier-admin-feedback is-error" : "supplier-admin-feedback is-success"}>
            {params.credentialError ? <AlertTriangle size={18} aria-hidden="true" /> : <CheckCircle2 size={18} aria-hidden="true" />}
            <span>{params.credentialError || `Достъпът за ${params.credentialsSaved} е записан сигурно.`}</span>
          </div>
        ) : null}

        <section className="supplier-admin-grid" aria-label="Настроени доставчици">
          {connectors.map((connector) => {
            const authState = authLabel(connector.provider, connector.configSchema || {});
            const isRunning = Boolean(connector.runningRunId);
            const percent = runningPercent(connector.runningTotalProcessed, connector.runningTotalFound);

            return (
              <article className="supplier-admin-card" key={connector.id}>
                <header>
                  <div>
                    <span>{connector.sourceType.toUpperCase()}</span>
                    <h2>{connector.displayName}</h2>
                    <p>{connector.defaultBaseUrl || "Специфична API/feed настройка"}</p>
                  </div>
                  <mark className={connector.status === "active" ? "is-active" : "is-paused"}>
                    {connector.status === "active" ? <CheckCircle2 size={15} aria-hidden="true" /> : <PauseCircle size={15} aria-hidden="true" />}
                    {connectorStatusLabel(connector.status)}
                  </mark>
                </header>

                <div className="supplier-admin-health">
                  <div>
                    <KeyRound size={17} aria-hidden="true" />
                    <span>Достъп</span>
                    <strong>{authState}</strong>
                  </div>
                  <div>
                    <ShieldCheck size={17} aria-hidden="true" />
                    <span>Последен резултат</span>
                    <strong>{runStatusLabel(connector.lastRunStatus)}</strong>
                  </div>
                  <div>
                    <TimerReset size={17} aria-hidden="true" />
                    <span>Последен sync</span>
                    <strong>{connector.lastRunAt ? formatDate(connector.lastRunAt) : "няма"}</strong>
                  </div>
                </div>

                {isRunning ? (
                  <div className="supplier-admin-progress" aria-label="Текуща синхронизация">
                    <div>
                      <strong>Синхронизация в процес</strong>
                      <span>{connector.runningTotalProcessed || 0} / {connector.runningTotalFound || "?"} обработени</span>
                    </div>
                    <i><b style={{ width: `${percent}%` }} /></i>
                  </div>
                ) : null}

                <dl>
                  <div>
                    <dt>Внесени оферти</dt>
                    <dd>{connector.importedCount}</dd>
                  </div>
                  <div>
                    <dt>Чакат преглед</dt>
                    <dd>{connector.waitingReviewCount}</dd>
                  </div>
                  <div>
                    <dt>Важни промени</dt>
                    <dd>{connector.changedCount}</dd>
                  </div>
                  <div>
                    <dt>Липсващи данни</dt>
                    <dd>{connector.missingDataCount}</dd>
                  </div>
                </dl>

                {connector.provider === "abax" || connector.provider === "bohemia" ? (
                  <details className="supplier-admin-credentials">
                    <summary>
                      <KeyRound size={16} aria-hidden="true" />
                      Настрой достъп
                    </summary>
                    <form action={saveSupplierConnectorCredentials}>
                      <input type="hidden" name="connector_id" value={connector.id} />
                      <input type="hidden" name="provider" value={connector.provider} />
                      <label className="is-wide">
                        API URL
                        <input
                          name="base_url"
                          defaultValue={connector.defaultBaseUrl || (connector.provider === "abax" ? "https://api.abax.bg/index.php" : "https://demo.internationaltravelgroup.net")}
                        />
                      </label>
                      {connector.provider === "abax" ? (
                        <>
                          <label>
                            API UUID
                            <input name="api_key" autoComplete="off" placeholder="cee992f7-..." required />
                          </label>
                          <label>
                            API Key
                            <input name="api_code" autoComplete="off" placeholder="4244" required />
                          </label>
                        </>
                      ) : (
                        <>
                          <label>
                            Потребител
                            <input name="username" autoComplete="username" required />
                          </label>
                          <label>
                            Парола
                            <input name="password" type="password" autoComplete="current-password" required />
                          </label>
                        </>
                      )}
                      <button type="submit">
                        <ShieldCheck size={16} aria-hidden="true" />
                        Запази сигурно
                      </button>
                    </form>
                  </details>
                ) : null}

                <footer>
                  <SupplierBatchSyncPanel connectorId={connector.id} disabled={connector.status !== "active" || isRunning} />
                  <Link href="/admin/supplier-imports" prefetch={false}>
                    Отвори импортите
                  </Link>
                </footer>
              </article>
            );
          })}
        </section>

        <section className="supplier-admin-ops">
          <article>
            <Settings size={20} aria-hidden="true" />
            <div>
              <h2>Как работи синхронизацията</h2>
              <p>
                Sync-ът не вкарва всичко наново. Всяка оферта се разпознава по доставчик и външен ID. Новите се добавят
                за преглед, съществуващите се обновяват, а важните промени се маркират за редактор.
              </p>
            </div>
          </article>
          <article>
            <TimerReset size={20} aria-hidden="true" />
            <div>
              <h2>Следваща стъпка: автоматичен sync</h2>
              <p>
                За ежедневна синхронизация ще добавим scheduled job, който стартира същия процес в избран час и записва
                резултата като автоматична синхронизация.
              </p>
            </div>
          </article>
        </section>

        <section className="supplier-admin-runs">
          <header>
            <span>Журнал</span>
            <h2>Последни sync събития</h2>
          </header>
          <div>
            {runs.map((run) => (
              <article key={run.id}>
                <strong>{run.displayName || run.provider}</strong>
                <span>{run.mode === "scheduled" ? "Автоматична" : "Ръчна"} · {formatDate(run.startedAt)}</span>
                <em>{runStatusLabel(run.status)}</em>
                <b>{run.totalProcessed} / {run.totalFound ?? "?"}</b>
              </article>
            ))}
          </div>
        </section>
      </section>
    </AdminWorkspace>
  );
}
