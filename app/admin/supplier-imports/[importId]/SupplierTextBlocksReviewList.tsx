import type { AdminSupplierImportDetail } from "@/lib/adminImportRepository";
import { SupplierReviewEntityControls } from "./SupplierReviewEntityControls";

type SupplierEntity = AdminSupplierImportDetail["entities"][number];

function dataObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
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

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = textFromHtml(value);
    if (text) return text;
  }

  return "";
}

function compact(parts: Array<string | null | undefined>) {
  return parts.map((part) => part?.trim()).filter(Boolean).join(" · ");
}

function money(amount: unknown, currency: unknown) {
  const amountText = firstText(amount);
  if (!amountText) return "";
  const currencyText = firstText(currency);
  return currencyText ? `${amountText} ${currencyText}` : amountText;
}

function policyFallback(entity: SupplierEntity, raw: Record<string, unknown>) {
  const direct = firstText(raw.Desc, raw.Text, raw["#text"], entity.title);
  if (direct && !/^Полезна информация \d+$/i.test(direct)) return direct;

  if (entity.type === "payment_policy") {
    return compact([
      money(raw["@_Amount"], raw["@_Currency"]),
      firstText(raw["@_Days"]) ? `${firstText(raw["@_Days"])} дни преди отпътуване` : null,
      firstText(raw["@_Type"], raw.Type)
    ]);
  }

  if (entity.type === "cancel_policy") {
    return compact([
      money(raw["@_Amount"], raw["@_Currency"]),
      firstText(raw["@_From"], raw.From) || firstText(raw["@_To"], raw.To)
        ? `период ${firstText(raw["@_From"], raw.From) || "0"}-${firstText(raw["@_To"], raw.To) || ""}`
        : null,
      firstText(raw["@_Type"], raw.Type)
    ]);
  }

  if (entity.type === "insurance") {
    return compact([
      firstText(raw["@_Company"], raw.Company, raw.Name),
      money(raw["@_CoverageValue"], raw["@_CoverageCurrency"]),
      firstText(raw["@_MinAge"], raw["@_MaxAge"]) ? `възраст ${firstText(raw["@_MinAge"]) || "0"}-${firstText(raw["@_MaxAge"]) || ""}` : null,
      firstText(raw["@_Type"], raw.Type)
    ]);
  }

  return direct || firstText(entity.title, entity.key) || "Текст от доставчик";
}

function entityText(entity: SupplierEntity) {
  const raw = dataObject(entity.rawData);
  const editorial = dataObject(entity.editorialData);
  const editorialTitle = firstText(entity.editorialTitle);
  const publicTitle = firstText(entity.title);

  if (editorialTitle && !/^Полезна информация \d+$/i.test(editorialTitle)) return editorialTitle;

  return firstText(editorial.text, editorial.description, policyFallback(entity, raw), publicTitle);
}

function metaText(entity: SupplierEntity) {
  const raw = dataObject(entity.rawData);

  return compact([
    firstText(raw["@_Type"], raw.Type),
    firstText(raw["@_id"], raw.id, entity.key),
    entity.price ? money(entity.price, entity.currency) : null
  ]) || "supplier feed";
}

function entityPreview(raw: unknown) {
  return JSON.stringify(raw, null, 2) || "{}";
}

export function SupplierTextBlocksReviewList({ entities }: { entities: SupplierEntity[] }) {
  return (
    <div className="supplier-review-text-list">
      {entities.map((entity, index) => (
        <article className={entity.isEnabled ? "supplier-review-text-item is-enabled" : "supplier-review-text-item"} key={entity.id}>
          <input type="hidden" name="entity_ids" value={entity.id} />
          <div className="supplier-review-text-side">
            <label className="supplier-review-entity-toggle">
              <input name="enabled_entity_ids" type="checkbox" value={entity.id} defaultChecked={entity.isEnabled} />
              <span>Показвай</span>
            </label>
            <span>{String(index + 1).padStart(2, "0")}</span>
          </div>
          <div className="supplier-review-text-body">
            <div className="supplier-review-text-meta">
              <strong>{metaText(entity)}</strong>
            </div>
            <label>
              <span>Текст в сайта</span>
              <textarea name={`entity_title_${entity.id}`} defaultValue={entityText(entity)} rows={4} />
            </label>
            <SupplierReviewEntityControls entity={entity} />
            <details>
              <summary>Raw данни</summary>
              <pre>{entityPreview(entity.rawData)}</pre>
            </details>
          </div>
        </article>
      ))}
    </div>
  );
}
