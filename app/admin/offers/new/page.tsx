import Link from "next/link";
import { ArrowLeft, Code2, DatabaseZap, FileJson, Keyboard, UploadCloud } from "lucide-react";
import { AdminWorkspace } from "@/components/AdminWorkspace";
import { importJsonOffers, startBlankAdminOffer } from "./actions";

export const dynamic = "force-dynamic";

type NewOfferPageProps = {
  searchParams?: Promise<{
    error?: string;
    source?: string;
  }>;
};

const sourceLabels: Record<string, string> = {
  api: "API импорт",
  json: "JSON файл / payload",
  xml: "XML фийд",
  csv: "CSV / Excel"
};

export default async function NewOfferPage({ searchParams }: NewOfferPageProps) {
  const params = await searchParams;
  const selectedSource = params?.source || "";
  const selectedSourceLabel = sourceLabels[selectedSource];
  const error = params?.error || "";

  return (
    <AdminWorkspace active="offers">
      <section className="offer-new-page">
        <header className="offer-new-heading">
          <div>
            <h1>Нова оферта</h1>
            <p>Избери източник за създаване или импорт на оферта.</p>
          </div>
          <Link href="/admin/offers" prefetch={false}>
            <ArrowLeft size={17} aria-hidden="true" />
            Назад
          </Link>
        </header>

        <section className="offer-create-source-grid" aria-label="Начин на добавяне">
          <form action={startBlankAdminOffer}>
            <button className="offer-create-source-card is-primary" type="submit">
              <Keyboard size={22} aria-hidden="true" />
              <span>
                <strong>Ръчно въвеждане</strong>
                <em>Създава празна чернова и отваря редактора.</em>
              </span>
            </button>
          </form>
          <Link className="offer-create-source-card" href="/admin/offers/new?source=api" prefetch={false}>
            <DatabaseZap size={22} aria-hidden="true" />
            <span>
              <strong>API импорт</strong>
              <em>Endpoint, token и мапинг към текущата структура.</em>
            </span>
          </Link>
          <Link className="offer-create-source-card" href="/admin/offers/new?source=json" prefetch={false}>
            <FileJson size={22} aria-hidden="true" />
            <span>
              <strong>JSON файл / payload</strong>
              <em>Paste или качване на JSON от доставчик.</em>
            </span>
          </Link>
          <Link className="offer-create-source-card" href="/admin/offers/new?source=xml" prefetch={false}>
            <Code2 size={22} aria-hidden="true" />
            <span>
              <strong>XML фийд</strong>
              <em>XML URL или файл за групов импорт.</em>
            </span>
          </Link>
          <Link className="offer-create-source-card" href="/admin/offers/new?source=csv" prefetch={false}>
            <UploadCloud size={22} aria-hidden="true" />
            <span>
              <strong>CSV / Excel</strong>
              <em>Табличен импорт за списъци с оферти.</em>
            </span>
          </Link>
        </section>

        {selectedSourceLabel ? (
          <section className="offer-import-setup-panel">
            <header>
              <span>Настройка</span>
              <h2>{selectedSourceLabel}</h2>
            </header>
            {error ? <strong className="offer-import-error">{error}</strong> : null}
            <p>
              Импортът създава оферти вътре в системната база със статус „за преглед“, за да не се публикуват автоматично в сайта.
            </p>
            {selectedSource === "json" ? (
              <form action={importJsonOffers}>
                <div>
                  <label>
                    <span>Доставчик</span>
                    <input name="provider" placeholder="Напр. Tour operator JSON" />
                  </label>
                  <label>
                    <span>JSON payload</span>
                    <textarea name="payload" placeholder='[{"id":"EXT-1","title":"Кападокия","country":"Турция","price":499,"currency":"EUR"}]' required />
                  </label>
                </div>
                <footer>
                  <button type="submit">Импортирай в системата</button>
                  <span>Новите записи ще се появят в „Оферти“ като импорт за преглед.</span>
                </footer>
              </form>
            ) : (
              <>
                <div>
                  <label>
                    <span>Доставчик</span>
                    <input placeholder="Напр. Tour operator API" />
                  </label>
                  <label>
                    <span>{selectedSource === "api" || selectedSource === "xml" ? "Адрес" : "Файл / payload"}</span>
                    <textarea placeholder={selectedSource === "api" ? "Ще се използва server-side конфигурация за конкретния доставчик" : "Ще се добави мапинг към този формат"} />
                  </label>
                </div>
                <footer>
                  <button type="button" disabled>Импортирай в системата</button>
                  <span>Този тип импорт чака конкретен доставчик/формат, преди да бъде активиран.</span>
                </footer>
              </>
            )}
          </section>
        ) : null}
      </section>
    </AdminWorkspace>
  );
}
