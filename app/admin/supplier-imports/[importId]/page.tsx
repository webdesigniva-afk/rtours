import Link from "next/link";
import { AlertTriangle, ArrowLeft, Building2, CalendarDays, DatabaseZap, Eye, FileText, ImageIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminWorkspace } from "@/components/AdminWorkspace";
import { getAdminSupplierImportById } from "@/lib/adminImportRepository";
import { formatDisplayDate } from "@/lib/dateFormat";
import { publishSupplierImport, saveSupplierImportReview } from "./actions";
import { SupplierAdditionalServicesReviewList } from "./SupplierAdditionalServicesReviewList";
import { SupplierDeparturesReviewList } from "./SupplierDeparturesReviewList";
import { SupplierHotelsReviewList } from "./SupplierHotelsReviewList";
import { SupplierItineraryReviewList } from "./SupplierItineraryReviewList";
import { SupplierImageReviewGrid } from "./SupplierImageReviewGrid";
import { SupplierServicesReviewList } from "./SupplierServicesReviewList";
import { SupplierTextBlocksReviewList } from "./SupplierTextBlocksReviewList";

export const dynamic = "force-dynamic";

type AdminSupplierImportDetailPageProps = {
  params: Promise<{ importId: string }>;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "няма данни";
  return new Intl.DateTimeFormat("bg-BG", { dateStyle: "medium", timeStyle: "short" }).format(date);
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

function changeTypeLabel(type: string | undefined) {
  if (type === "price") return "Цена";
  if (type === "duration") return "Продължителност";
  if (type === "transport") return "Транспорт";
  if (type === "content") return "Съдържание";
  if (type === "availability") return "Наличност";
  if (type === "date") return "Дата";
  if (type === "media") return "Снимки";
  if (type === "itinerary") return "Програма";
  if (type === "service") return "Услуги";
  return "Промяна";
}

function changeFieldLabel(field: string | undefined) {
  if (field === "priceFrom") return "Цена от";
  if (field === "currency") return "Валута";
  if (field === "durationDays") return "Дни";
  if (field === "durationNights") return "Нощувки";
  if (field === "transport") return "Транспорт";
  if (field === "title") return "Заглавие";
  if (field === "departureAdded") return "Добавена дата";
  if (field === "departureRemoved") return "Премахната дата";
  if (field === "startDate") return "Начална дата";
  if (field === "endDate") return "Крайна дата";
  if (field === "departurePrice") return "Цена за дата";
  if (field === "availability") return "Статус";
  if (field === "seatsAvailable") return "Свободни места";
  if (field === "imageAdded") return "Добавена снимка";
  if (field === "imageRemoved") return "Премахната снимка";
  if (field === "itineraryDayAdded") return "Добавен ден";
  if (field === "itineraryDayRemoved") return "Премахнат ден";
  if (field === "itineraryTitle") return "Заглавие на ден";
  if (field === "itineraryDescription") return "Описание на ден";
  if (field === "includedServices") return "Включени услуги";
  if (field === "excludedServices") return "Невключени услуги";
  return field || "Поле";
}

function changeValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "липсва";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function rawPreview(payload: unknown) {
  return JSON.stringify(payload, null, 2) || "{}";
}

function entityLabel(type: string) {
  if (type === "image") return "Снимки";
  if (type === "hotel") return "Хотели";
  if (type === "departure") return "Дати и цени";
  if (type === "itinerary_day") return "Програма";
  if (type === "service") return "Услуги";
  if (type === "additional_service") return "Допълнителни услуги";
  if (type === "useful_info") return "Полезна информация";
  if (type === "payment_policy") return "Плащане";
  if (type === "cancel_policy") return "Анулации";
  if (type === "insurance") return "Застраховки";
  if (type === "main_details") return "Технически основни данни";
  if (type === "details_root") return "Технически detail payload";
  return type;
}

function entityGroupIntro(type: string) {
  if (type === "image") return "Избери снимките, които да останат в галерията. Първата включена снимка става основна.";
  if (type === "departure") return "Това са разпознатите отпътувания, наличности и цени.";
  if (type === "itinerary_day") return "Това е програмата, която ще се показва като маршрут по дни.";
  if (type === "hotel") return "Хотели и настаняване, извлечени от доставчика.";
  if (type === "service") return "Условия, включени и невключени услуги.";
  if (type === "additional_service") return "Допълнителни услуги и екскурзии, които доставчикът подава отделно.";
  if (type === "useful_info") return "Важни бележки от доставчика, които може да се покажат или преработят.";
  if (type === "payment_policy") return "Условия за плащане от supplier feed-а.";
  if (type === "cancel_policy") return "Анулационни условия от supplier feed-а.";
  if (type === "insurance") return "Застрахователни условия и лимити.";
  return "Допълнителни данни от доставчика.";
}

function isTechnicalEntity(type: string) {
  return type === "main_details" || type === "details_root";
}

function entityPreview(raw: unknown) {
  const text = JSON.stringify(raw, null, 2) || "{}";
  return text.length > 520 ? `${text.slice(0, 520)}...` : text;
}

function dataObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function textValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function textFromHtml(value: unknown) {
  if (typeof value !== "string") return "";

  return value
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/\s*(p|div|li|tr|h[1-6])\s*>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function rawPayloadSize(payload: unknown) {
  return rawPreview(payload).length;
}

function coverageState(value: number) {
  return value > 0 ? "mapped" : "missing";
}

function coverageLabel(state: string) {
  return state === "mapped" ? "Запазено" : "Липсва";
}

export default async function AdminSupplierImportDetailPage({ params }: AdminSupplierImportDetailPageProps) {
  const { importId } = await params;
  const item = await getAdminSupplierImportById(importId);

  if (!item) {
    notFound();
  }
  const saveAction = saveSupplierImportReview.bind(null, importId);
  const publishAction = publishSupplierImport.bind(null, importId);
  const entityGroups = item.entities.reduce<Record<string, typeof item.entities>>((groups, entity) => {
    groups[entity.type] = groups[entity.type] || [];
    groups[entity.type].push(entity);
    return groups;
  }, {});
  const visibleGroupOrder = ["image", "departure", "itinerary_day", "hotel", "service", "additional_service", "useful_info", "payment_policy", "cancel_policy", "insurance"].filter((type) => entityGroups[type]?.length);
  const technicalEntities = item.entities.filter((entity) => isTechnicalEntity(entity.type));
  const supplierSectionCount = ["hotel", "additional_service", "useful_info", "payment_policy", "cancel_policy", "insurance"].reduce((count, type) => count + (entityGroups[type]?.length || 0), 0);
  const technicalEntityCount = technicalEntities.length;
  const coverageItems = [
    { label: "Основни полета", count: item.title ? 1 : 0, detail: "заглавие, дестинация, цена, период" },
    { label: "Дати и наличности", count: item.datesCount, detail: "заминавания, места, цена по дата" },
    { label: "Снимки", count: item.mediaCount, detail: "галерия и основна снимка" },
    { label: "Програма", count: item.itineraryCount, detail: "маршрут по дни" },
    { label: "Услуги", count: item.servicesCount, detail: "включено и невключено" },
    { label: "Supplier блокове", count: supplierSectionCount, detail: "хотели, плащане, анулации, застраховки" },
    { label: "Raw payload", count: rawPayloadSize(item.rawPayload), detail: "пълният оригинален отговор е запазен" }
  ];

  return (
    <AdminWorkspace active="imports">
      <section className="supplier-import-detail">
        <header className="supplier-import-detail-hero">
          <Link href="/admin/supplier-imports" prefetch={false}>
            <ArrowLeft size={16} aria-hidden="true" />
            Назад към импортите
          </Link>
          <div>
            <span>{item.provider} · {item.externalId}</span>
            <h1>{item.title}</h1>
            <p>{item.destination || "Без разпозната дестинация"} · {statusLabel(item.status)} · {formatDate(item.lastSyncedAt)}</p>
          </div>
          <div className="supplier-import-detail-actions">
            {item.slug ? (
              <Link href={`/admin/offers/${item.slug}`} prefetch={false}>
                <FileText size={16} aria-hidden="true" />
                Edit public offer
              </Link>
            ) : null}
            {item.slug ? (
              <Link href={`/offers/${item.slug}`} prefetch={false}>
                <Eye size={16} aria-hidden="true" />
                Публична страница
              </Link>
            ) : null}
          </div>
        </header>

        {item.detailError ? (
          <section className="supplier-import-detail-warning">
            <AlertTriangle size={18} aria-hidden="true" />
            <div>
              <strong>Detail данните не са дошли от Bohemia</strong>
              <p>{item.detailError}</p>
            </div>
          </section>
        ) : null}

        {item.importantChanges.length > 0 ? (
          <section className="supplier-import-changes" aria-label="Важни промени от последния импорт">
            <header>
              <AlertTriangle size={18} aria-hidden="true" />
              <div>
                <h2>Важни промени за преглед</h2>
                <p>Тези полета са различни спрямо предишния import snapshot. Провери ги преди публикация.</p>
              </div>
            </header>
            <div>
              {item.importantChanges.map((change, index) => (
                <article key={`${change.field || "field"}-${index}`}>
                  <span>{changeTypeLabel(change.type)}</span>
                  <strong>
                    {changeFieldLabel(change.field)}
                    {change.label ? <small>{change.label}</small> : null}
                  </strong>
                  <p>
                    <del>{changeValue(change.before)}</del>
                    <ins>{changeValue(change.after)}</ins>
                  </p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="supplier-import-readiness-rail" aria-label="Готовност за публикация">
          <span className={readinessClass(item.datesCount)}>
            <CalendarDays size={18} aria-hidden="true" />
            Дати <strong>{item.datesCount}</strong>
          </span>
          <span className={readinessClass(item.mediaCount)}>
            <ImageIcon size={18} aria-hidden="true" />
            Снимки <strong>{item.mediaCount}</strong>
          </span>
          <span className={readinessClass(item.itineraryCount)}>
            <FileText size={18} aria-hidden="true" />
            Програма <strong>{item.itineraryCount}</strong>
          </span>
          <span className={readinessClass(item.servicesCount)}>
            <DatabaseZap size={18} aria-hidden="true" />
            Услуги <strong>{item.servicesCount}</strong>
          </span>
          <span className={readinessClass(item.hotelsCount)}>
            <Building2 size={18} aria-hidden="true" />
            Хотели <strong>{item.hotelsCount}</strong>
          </span>
        </section>

        <section className="supplier-import-coverage" aria-labelledby="supplier-import-coverage-title">
          <header>
            <div>
              <span>Mapping audit</span>
              <h2 id="supplier-import-coverage-title">Покритие на импорта</h2>
              <p>Този панел показва какво е мапнато към общия Red Tours модел и какво е запазено като допълнителна информация от доставчика.</p>
            </div>
          </header>
          <div>
            {coverageItems.map((entry) => {
              const state = coverageState(entry.count);

              return (
                <article className={`supplier-import-coverage-item is-${state}`} key={entry.label}>
                  <span>{coverageLabel(state)}</span>
                  <strong>{entry.label}</strong>
                  <em>{entry.count} · {entry.detail}</em>
                </article>
              );
            })}
          </div>
          {technicalEntityCount > 0 ? (
            <p className="supplier-import-coverage-note">
              Има {technicalEntityCount} технически supplier блока, които не се показват публично, но остават запазени за диагностика и mapping проверка.
            </p>
          ) : null}
        </section>

        <form className="supplier-review-form" action={saveAction}>
          <section className="supplier-review-editor">
            <header>
              <div>
                <h2>Публично съдържание</h2>
                <p>Кратка редакция преди публикация. Оригиналът от доставчика остава запазен.</p>
              </div>
              <dl>
                <div>
                  <dt>Цена</dt>
                  <dd>{formatPrice(item.priceFrom, item.currency)}</dd>
                </div>
                <div>
                  <dt>Период</dt>
                  <dd>{item.durationDays ? `${item.durationDays} дни / ${item.durationNights || "-"} нощувки` : "липсва"}</dd>
                </div>
              </dl>
            </header>
            <div className="supplier-review-editor-grid">
              <label className="is-wide">
                <span>Заглавие</span>
                <input name="title" defaultValue={item.title || ""} />
              </label>
              <label>
                <span>Кратко представяне</span>
                <textarea name="summary" defaultValue={item.summary || ""} rows={2} />
              </label>
              <label>
                <span>Пълно представяне</span>
                <textarea name="description" defaultValue={item.description || ""} rows={2} />
              </label>
            </div>
            <details className="supplier-review-seo">
              <summary>SEO настройки</summary>
              <div>
                <label>
                  <span>SEO заглавие</span>
                  <input name="seo_title" defaultValue={item.title || ""} />
                </label>
                <label>
                  <span>SEO описание</span>
                  <input name="seo_description" defaultValue={item.summary || ""} />
                </label>
              </div>
            </details>
          </section>

          <section className="supplier-import-detail-card supplier-review-entities">
            <header>
              <h2>Какво ще участва в сайта</h2>
              <p>Изключи снимки или блокове, които не искаш да се виждат. Оригиналът от доставчика остава запазен отделно.</p>
            </header>
            {visibleGroupOrder.map((type) => {
              const entities = entityGroups[type] || [];

              return (
              <section className="supplier-review-entity-group" key={type}>
                <header>
                  <h3>{entityLabel(type)}</h3>
                  <p>{entityGroupIntro(type)}</p>
                </header>
                {type === "image" ? (
                  <SupplierImageReviewGrid entities={entities} />
                ) : type === "departure" ? (
                  <SupplierDeparturesReviewList entities={entities} />
                ) : type === "hotel" ? (
                  <SupplierHotelsReviewList entities={entities} />
                ) : type === "itinerary_day" ? (
                  <SupplierItineraryReviewList entities={entities} />
                ) : type === "__legacy_itinerary_day" ? (
                  <div className="supplier-review-itinerary-list">
                    {entities.map((entity, index) => {
                      const raw = dataObject(entity.rawData);
                      const editorial = dataObject(entity.editorialData);
                      const dayNumber = numberValue(editorial.dayNumber) || numberValue(raw.dayNumber) || index + 1;
                      const title = textFromHtml(entity.editorialTitle || entity.title || textValue(raw.title)) || `Ден ${dayNumber}`;
                      const description = textFromHtml(editorial.description) || textFromHtml(raw.description);
                      const accommodation = textFromHtml(editorial.accommodation) || textFromHtml(raw.accommodation);
                      const meals = textFromHtml(editorial.meals) || textFromHtml(raw.meals);
                      const transport = textFromHtml(editorial.transport) || textFromHtml(raw.transport);

                      return (
                        <article className={entity.isEnabled ? "supplier-review-itinerary-day is-enabled" : "supplier-review-itinerary-day"} key={entity.id}>
                          <input type="hidden" name="entity_ids" value={entity.id} />
                          <label className="supplier-review-entity-toggle">
                            <input name="enabled_entity_ids" type="checkbox" value={entity.id} defaultChecked={entity.isEnabled} />
                            <span>Показвай</span>
                          </label>
                          <div className="supplier-review-day-number">
                            <span>Ден</span>
                            <input name={`entity_day_number_${entity.id}`} defaultValue={dayNumber} inputMode="numeric" />
                          </div>
                          <div className="supplier-review-day-content">
                            <label>
                              <span>Заглавие за деня</span>
                              <input name={`entity_title_${entity.id}`} defaultValue={title} />
                            </label>
                            <label className="is-wide">
                              <span>Описание</span>
                              <textarea name={`entity_description_${entity.id}`} defaultValue={description} rows={4} placeholder="Какво се случва през този ден, кои места се посещават, каква е логистиката." />
                            </label>
                            <div className="supplier-review-day-logistics">
                              <label>
                                <span>Настаняване</span>
                                <input name={`entity_accommodation_${entity.id}`} defaultValue={accommodation} placeholder="хотел / категория" />
                              </label>
                              <label>
                                <span>Хранене</span>
                                <input name={`entity_meals_${entity.id}`} defaultValue={meals} placeholder="включено хранене" />
                              </label>
                              <label>
                                <span>Транспорт</span>
                                <input name={`entity_transport_${entity.id}`} defaultValue={transport} placeholder="вид транспорт" />
                              </label>
                            </div>
                            <details>
                              <summary>Raw данни</summary>
                              <pre>{entityPreview(entity.rawData)}</pre>
                            </details>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : type === "service" ? (
                  <SupplierServicesReviewList entities={entities} />
                ) : type === "additional_service" ? (
                  <SupplierAdditionalServicesReviewList entities={entities} />
                ) : ["useful_info", "payment_policy", "cancel_policy", "insurance"].includes(type) ? (
                  <SupplierTextBlocksReviewList entities={entities} />
                ) : (
                <div>
                  {entities.map((entity) => (
                    <article className={entity.isEnabled ? `supplier-review-entity is-enabled is-${type}` : `supplier-review-entity is-${type}`} key={entity.id}>
                      <input type="hidden" name="entity_ids" value={entity.id} />
                      {type === "image" && entity.url ? (
                        <img src={entity.editorialUrl || entity.url} alt={entity.editorialTitle || entity.title || "Снимка от доставчик"} />
                      ) : null}
                      <label className="supplier-review-entity-toggle">
                        <input name="enabled_entity_ids" type="checkbox" value={entity.id} defaultChecked={entity.isEnabled} />
                        <span>{type === "image" ? "В галерията" : "Показвай"}</span>
                      </label>
                      <div className="supplier-review-entity-body">
                        <strong>{entity.editorialTitle || entity.title || entity.key || entityLabel(type)}</strong>
                        <small>
                          {[
                            formatDisplayDate(entity.startDate),
                            formatDisplayDate(entity.endDate),
                            entity.price ? formatPrice(entity.price, entity.currency) : ""
                          ].filter(Boolean).join(" · ") || entity.key || "supplier block"}
                        </small>
                        {entity.url && type !== "image" ? <a href={entity.url} target="_blank" rel="noreferrer">{entity.url}</a> : null}
                        <div className="supplier-review-entity-fields">
                          <label>
                            <span>{type === "image" ? "Alt / име на снимката" : "Име в сайта"}</span>
                            <input name={`entity_title_${entity.id}`} defaultValue={entity.editorialTitle || entity.title || ""} />
                          </label>
                          {type === "image" ? (
                            <label>
                              <span>Адрес на снимката</span>
                              <input name={`entity_url_${entity.id}`} defaultValue={entity.editorialUrl || entity.url || ""} />
                            </label>
                          ) : null}
                        </div>
                        <details>
                          <summary>Raw данни</summary>
                          <pre>{entityPreview(entity.rawData)}</pre>
                        </details>
                      </div>
                    </article>
                  ))}
                </div>
                )}
              </section>
              );
            })}
            {technicalEntities.map((entity) => (
              <input key={entity.id} type="hidden" name="entity_ids" value={entity.id} />
            ))}
          </section>

          <footer className="supplier-review-actions">
            <button type="submit">Запази прегледа</button>
            <button formAction={publishAction} className="is-primary" type="submit">Публикувай в сайта</button>
          </footer>
        </form>

        {technicalEntities.length > 0 ? (
          <details className="supplier-import-technical-card">
            <summary>Технически supplier блокове</summary>
            <header>
              <h2>Запазени данни извън публичния шаблон</h2>
              <p>Тези блокове не се публикуват директно, но остават видими за проверка на mapping-а и диагностика при следващ импорт.</p>
            </header>
            <div>
              {technicalEntities.map((entity) => (
                <article key={entity.id}>
                  <strong>{entityLabel(entity.type)}</strong>
                  <span>{entity.key || entity.title || "supplier technical block"}</span>
                  <pre>{rawPreview(entity.rawData)}</pre>
                </article>
              ))}
            </div>
          </details>
        ) : null}

        <details className="supplier-import-raw-card">
          <summary>Технически данни от Bohemia</summary>
          <header>
            <h2>Raw payload</h2>
            <p>Това е за диагностика и мапинг. Нормално е да не се пипа при ежедневна работа.</p>
          </header>
          <pre>{rawPreview(item.rawPayload)}</pre>
        </details>
      </section>
    </AdminWorkspace>
  );
}
