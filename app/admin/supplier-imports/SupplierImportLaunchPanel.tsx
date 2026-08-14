"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, DatabaseZap, FileJson, Keyboard, Link2, Loader2, RefreshCw, ShieldCheck, UploadCloud, X } from "lucide-react";
import { startBlankAdminOffer } from "@/app/admin/offers/new/actions";
import { syncAbaxSupplierImports, syncBohemiaSupplierImports, syncGenericSupplierConnector } from "./actions";

type SupplierConnectorSummary = {
  id: string;
  provider: string;
  displayName: string;
  sourceType: string;
  status: string;
  defaultBaseUrl: string | null;
  lastRunStatus: string | null;
  lastRunAt: string | null;
};

type SupplierImportLaunchPanelProps = {
  connectors: SupplierConnectorSummary[];
  shouldOpenImport?: boolean;
  feedback: {
    syncError?: string;
    checked?: string;
    synced?: string;
    new?: string;
    changed?: string;
    unchanged?: string;
    total?: string;
    processed?: string;
    excursions?: string;
    holidays?: string;
    genericProvider?: string;
  };
};

type WizardStep = "choose" | "configured" | "login" | "paste";

const defaultMapping = {
  itemsPath: "offers",
  externalId: ["externalId", "id", "code"],
  title: ["title", "name"],
  summary: ["summary", "shortDescription"],
  description: ["description", "program"],
  productType: ["productType", "type", "category"],
  country: ["country", "destination.country"],
  region: ["region", "destination.region", "destination"],
  city: ["city", "destination.city"],
  durationDays: ["durationDays", "days"],
  durationNights: ["durationNights", "nights"],
  transport: ["transport", "transportType"],
  priceFrom: ["priceFrom", "price", "amount"],
  currency: ["currency"],
  heroImageUrl: ["heroImageUrl", "image"],
  mediaItems: ["media", "images"],
  mediaUrl: ["url", "src"],
  datesItems: ["dates", "departures"],
  itineraryItems: ["itinerary", "programDays"],
  includedServices: ["includedServices", "included"],
  excludedServices: ["excludedServices", "excluded"]
};

function hasFeedback(feedback: SupplierImportLaunchPanelProps["feedback"]) {
  return Boolean(feedback.syncError || feedback.checked || feedback.synced);
}

export function SupplierImportLaunchPanel({ connectors, shouldOpenImport = false, feedback }: SupplierImportLaunchPanelProps) {
  const preferredConnector = connectors.find((connector) => connector.provider !== "bohemia") || connectors[0];
  const [isWizardOpen, setIsWizardOpen] = useState(shouldOpenImport);
  const [step, setStep] = useState<WizardStep>("choose");
  const [loginProvider, setLoginProvider] = useState("bohemia");
  const [selectedProvider, setSelectedProvider] = useState(feedback.genericProvider || preferredConnector?.provider || "test-supplier");
  const selectedConnector = connectors.find((connector) => connector.provider === selectedProvider);

  useEffect(() => {
    if (shouldOpenImport) setIsWizardOpen(true);
  }, [shouldOpenImport]);

  return (
    <>
      <section className="supplier-launch-panel" aria-labelledby="supplier-launch-title">
        <div>
          <span>Импорти</span>
          <h1 id="supplier-launch-title">Добавяне на оферти</h1>
          <p>Създай оферта ръчно или импортирай от доставчик. Импортите винаги влизат първо за преглед и не се публикуват автоматично.</p>
        </div>
        <div className="supplier-launch-actions">
          <form action={startBlankAdminOffer}>
            <button className="supplier-launch-button is-manual" type="submit">
              <Keyboard size={22} aria-hidden="true" />
              <span>
                <strong>Ръчно добавяне</strong>
                <em>Създава празна оферта и отваря редактора.</em>
              </span>
            </button>
          </form>
          <button className="supplier-launch-button is-import" type="button" onClick={() => setIsWizardOpen(true)}>
            <UploadCloud size={22} aria-hidden="true" />
            <span>
              <strong>Импортиране</strong>
              <em>Избираш доставчик, проверяваш връзката и синхронизираш за преглед.</em>
            </span>
          </button>
        </div>

        {hasFeedback(feedback) ? (
          <div className={feedback.syncError ? "supplier-launch-feedback is-error" : "supplier-launch-feedback is-success"}>
            {feedback.syncError ? (
              <>
                <X size={18} aria-hidden="true" />
                <span>{feedback.syncError}</span>
              </>
            ) : feedback.checked ? (
              <>
                <CheckCircle2 size={18} aria-hidden="true" />
                <span>
                  Връзката е успешна. Открити са {feedback.total || "0"} оферти
                  {feedback.excursions || feedback.holidays ? `: ${feedback.excursions || "0"} екскурзии и ${feedback.holidays || "0"} почивки.` : "."}
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 size={18} aria-hidden="true" />
                <span>
                  Синхронизацията приключи: {feedback.synced} оферти са готови за преглед. Нови {feedback.new || "0"}, променени {feedback.changed || "0"}, без промяна {feedback.unchanged || "0"}.
                </span>
              </>
            )}
          </div>
        ) : null}
      </section>

      {isWizardOpen ? (
        <div className="supplier-wizard-backdrop" role="presentation" onMouseDown={() => setIsWizardOpen(false)}>
          <section className="supplier-wizard" role="dialog" aria-modal="true" aria-labelledby="supplier-wizard-title" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <div>
                <span>Импорт</span>
                <h2 id="supplier-wizard-title">Как ще импортираме?</h2>
              </div>
              <button type="button" aria-label="Затвори" onClick={() => setIsWizardOpen(false)}>
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            <nav className="supplier-wizard-steps" aria-label="Стъпки">
              <span className={step === "choose" ? "is-active" : ""}>1. Източник</span>
              <span className={step !== "choose" ? "is-active" : ""}>2. Данни</span>
              <span>3. Проверка</span>
              <span>4. За преглед</span>
            </nav>

            {step === "choose" ? (
              <div className="supplier-wizard-choice-grid">
                <button type="button" onClick={() => setStep("configured")}>
                  <DatabaseZap size={22} aria-hidden="true" />
                  <span>
                    <strong>Настроен доставчик</strong>
                    <em>За API, JSON или XML feed с вече запазен mapping.</em>
                  </span>
                </button>
                <button type="button" onClick={() => setStep("login")}>
                  <Link2 size={22} aria-hidden="true" />
                  <span>
                    <strong>Доставчик с login</strong>
                    <em>За API, което изисква потребител и парола при всяка синхронизация.</em>
                  </span>
                </button>
                <button type="button" onClick={() => setStep("paste")}>
                  <FileJson size={22} aria-hidden="true" />
                  <span>
                    <strong>Тест с JSON/XML</strong>
                    <em>Поставяш payload и проверяваш дали mapping-ът работи правилно.</em>
                  </span>
                </button>
              </div>
            ) : null}

            {step === "login" ? (
              <form action={loginProvider === "abax" ? syncAbaxSupplierImports : syncBohemiaSupplierImports} className="supplier-wizard-form">
                <button className="supplier-wizard-back" type="button" onClick={() => setStep("choose")}>
                  <ArrowLeft size={16} aria-hidden="true" />
                  Назад
                </button>
                <div className="supplier-wizard-card">
                  <ShieldCheck size={20} aria-hidden="true" />
                  <div>
                    <strong>Проверка преди синхронизация</strong>
                    <p>Първо провери връзката и броя открити оферти. След това синхронизирай. Офертите ще влязат като “за преглед”.</p>
                  </div>
                </div>
                <input name="offset" type="hidden" value="0" />
                <input name="batch_size" type="hidden" value="10" />
                <div className="supplier-wizard-grid">
                  <label>
                    Доставчик
                    <select name="provider_label" value={loginProvider} onChange={(event) => setLoginProvider(event.target.value)}>
                      <option value="bohemia">Bohemia</option>
                      <option value="abax">Abax</option>
                    </select>
                  </label>
                  {loginProvider === "abax" ? (
                    <>
                      <label className="is-wide">
                        API URL
                        <input name="base_url" defaultValue="https://api.abax.bg/index.php" required />
                      </label>
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
                        Среда
                        <select name="base_url" defaultValue="https://demo.internationaltravelgroup.net">
                          <option value="https://demo.internationaltravelgroup.net">Тестов сървър</option>
                          <option value="https://ims.internationaltravelgroup.net">Продукционен сървър</option>
                        </select>
                      </label>
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
                  <label>
                    Лимит
                    <input name="limit" type="number" min="1" max="500" defaultValue="100" />
                  </label>
                  {loginProvider === "bohemia" ? (
                    <label>
                      Детайли
                      <input name="details_limit" type="number" min="1" max="500" defaultValue="100" />
                    </label>
                  ) : null}
                </div>
                {loginProvider === "bohemia" ? (
                  <fieldset className="supplier-wizard-checks">
                    <legend>Типове оферти</legend>
                    <label><input name="types" type="checkbox" value="excursion" defaultChecked /> Екскурзии</label>
                    <label><input name="types" type="checkbox" value="holiday" defaultChecked /> Почивки</label>
                  </fieldset>
                ) : null}
                <label className="supplier-wizard-inline">
                  <input name="import_all" type="checkbox" value="yes" />
                  <span>Импортирай всички налични оферти на безопасни партиди.</span>
                </label>
                <footer>
                  <button type="submit" name="mode" value="count" className="is-secondary">
                    <Loader2 size={17} aria-hidden="true" />
                    Провери връзката
                  </button>
                  <button type="submit" name="mode" value="sync">
                    <RefreshCw size={17} aria-hidden="true" />
                    Синхронизирай
                  </button>
                </footer>
              </form>
            ) : null}

            {step === "configured" || step === "paste" ? (
              <form action={syncGenericSupplierConnector} className="supplier-wizard-form">
                <button className="supplier-wizard-back" type="button" onClick={() => setStep("choose")}>
                  <ArrowLeft size={16} aria-hidden="true" />
                  Назад
                </button>
                <div className="supplier-wizard-card">
                  <ShieldCheck size={20} aria-hidden="true" />
                  <div>
                    <strong>{step === "configured" ? "Импорт от настроен доставчик" : "Тестов импорт"}</strong>
                    <p>Данните ще се мапнат към Red Tours модела. Съществуващите оферти се обновяват по доставчик и външен ID.</p>
                  </div>
                </div>
                <div className="supplier-wizard-grid">
                  <label>
                    Доставчик
                    {connectors.length ? (
                      <select name="provider" value={selectedProvider} onChange={(event) => setSelectedProvider(event.target.value)}>
                        {connectors.map((connector) => (
                          <option value={connector.provider} key={connector.id}>{connector.displayName}</option>
                        ))}
                      </select>
                    ) : (
                      <input name="provider" placeholder="supplier-key" defaultValue="test-supplier" required />
                    )}
                  </label>
                  <label>
                    Формат
                    <select name="source_format" defaultValue={selectedConnector?.sourceType === "xml" ? "xml" : "json"}>
                      <option value="json">JSON</option>
                      <option value="xml">XML</option>
                      <option value="api">API JSON</option>
                    </select>
                  </label>
                  <label>
                    Лимит
                    <input name="generic_limit" type="number" min="1" max="500" defaultValue="100" />
                  </label>
                  <label className="is-wide">
                    URL
                    <input name="payload_url" placeholder={selectedConnector?.defaultBaseUrl || "https://supplier.example.com/offers.json"} />
                  </label>
                </div>
                <input name="mapping_override" type="hidden" value={JSON.stringify(defaultMapping)} />
                {step === "paste" ? (
                  <label className="supplier-wizard-json">
                    Payload
                    <textarea name="payload" rows={10} placeholder='{"offers":[{"id":"A1","title":"Rome","price":399}]}' required />
                  </label>
                ) : null}
                <footer>
                  <button type="submit">
                    <RefreshCw size={17} aria-hidden="true" />
                    Синхронизирай за преглед
                  </button>
                  <Link href="#supplier-connectors-title" onClick={() => setIsWizardOpen(false)}>
                    Настройки на доставчици
                  </Link>
                </footer>
              </form>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  );
}
