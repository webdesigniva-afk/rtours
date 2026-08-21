import type { AdminSupplierImportDetail } from "@/lib/adminImportRepository";
import { normalizeDateLabel } from "@/lib/dateFormat";
import { SupplierReviewEntityControls } from "./SupplierReviewEntityControls";

type SupplierEntity = AdminSupplierImportDetail["entities"][number];

const availabilityOptions = [
  ["available", "Свободни места"],
  ["limited", "Последни места"],
  ["on_request", "При запитване"],
  ["sold_out", "Изчерпано"]
] as const;

function dataObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function textValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function numberText(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string") return value;
  return "";
}

function dateText(value: unknown) {
  const text = textValue(value);
  return /^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) : "";
}

function availabilityValue(value: unknown) {
  const text = textValue(value);
  if (text === "available" || text === "limited" || text === "on_request" || text === "sold_out") return text;
  if (text === "last_seats") return "limited";
  return "on_request";
}

function entityPreview(raw: unknown) {
  return JSON.stringify(raw, null, 2) || "{}";
}

export function SupplierDeparturesReviewList({ entities }: { entities: SupplierEntity[] }) {
  return (
    <div className="supplier-review-departure-list">
      {entities.map((entity, index) => {
        const raw = dataObject(entity.rawData);
        const editorial = dataObject(entity.editorialData);
        const availability = availabilityValue(editorial.availability || raw.availability);
        const startDate = dateText(editorial.startDate) || dateText(entity.startDate);
        const endDate = dateText(editorial.endDate) || dateText(entity.endDate);
        const title = normalizeDateLabel(textValue(entity.editorialTitle) || textValue(entity.title), startDate, endDate, `Отпътуване ${index + 1}`);

        return (
          <article className={entity.isEnabled ? "supplier-review-departure-item is-enabled" : "supplier-review-departure-item"} key={entity.id}>
            <input type="hidden" name="entity_ids" value={entity.id} />
            <div className="supplier-review-departure-side">
              <label className="supplier-review-entity-toggle">
                <input name="enabled_entity_ids" type="checkbox" value={entity.id} defaultChecked={entity.isEnabled} />
                <span>Показвай</span>
              </label>
              <span>{String(index + 1).padStart(2, "0")}</span>
            </div>
            <div className="supplier-review-departure-body">
              <label className="is-wide">
                <span>Етикет в сайта</span>
                <input name={`entity_title_${entity.id}`} defaultValue={title} />
              </label>
              <label>
                <span>От</span>
                <input name={`entity_start_date_${entity.id}`} type="date" defaultValue={startDate} />
              </label>
              <label>
                <span>До</span>
                <input name={`entity_end_date_${entity.id}`} type="date" defaultValue={endDate} />
              </label>
              <label>
                <span>Цена от</span>
                <input name={`entity_price_${entity.id}`} inputMode="decimal" defaultValue={numberText(editorial.priceFrom) || numberText(entity.price)} />
              </label>
              <label>
                <span>Валута</span>
                <select name={`entity_currency_${entity.id}`} defaultValue={textValue(editorial.currency) || entity.currency || "EUR"}>
                  <option value="EUR">EUR</option>
                  <option value="BGN">BGN</option>
                </select>
              </label>
              <label>
                <span>Места</span>
                <input name={`entity_seats_available_${entity.id}`} inputMode="numeric" defaultValue={numberText(editorial.seatsAvailable) || numberText(raw.seatsAvailable)} placeholder="свободни" />
              </label>
              <label>
                <span>Капацитет</span>
                <input name={`entity_seats_total_${entity.id}`} inputMode="numeric" defaultValue={numberText(editorial.seatsTotal) || numberText(raw.seatsTotal)} placeholder="общо" />
              </label>
              <label>
                <span>Статус</span>
                <select name={`entity_availability_${entity.id}`} defaultValue={availability}>
                  {availabilityOptions.map(([value, label]) => (
                    <option value={value} key={value}>{label}</option>
                  ))}
                </select>
              </label>
              <SupplierReviewEntityControls entity={entity} showNotes={false} />
              <label className="is-wide">
                <span>Отпътуване от</span>
                <input name={`entity_departure_points_${entity.id}`} defaultValue={textValue(editorial.departurePoints) || textValue(raw.departurePoints)} />
              </label>
              <label className="is-wide">
                <span>Бележка</span>
                <textarea name={`entity_notes_${entity.id}`} rows={2} defaultValue={textValue(editorial.notes) || textValue(raw.notes)} />
              </label>
              <details className="is-wide">
                <summary>Raw данни</summary>
                <pre>{entityPreview(entity.rawData)}</pre>
              </details>
            </div>
          </article>
        );
      })}
    </div>
  );
}
