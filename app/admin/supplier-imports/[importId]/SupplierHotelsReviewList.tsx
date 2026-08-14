import type { AdminSupplierImportDetail } from "@/lib/adminImportRepository";

type SupplierEntity = AdminSupplierImportDetail["entities"][number];

function dataObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function textFromHtml(value: unknown) {
  if (typeof value !== "string") return "";
  if (/^\s*(?:\[object Object\]\s*,?\s*)+\s*$/.test(value)) return "";

  return value
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/\s*(p|div|li|tr|h[1-6])\s*>/gi, "\n")
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

function roomText(raw: Record<string, unknown>) {
  const rooms = Array.isArray(raw.rooms) ? raw.rooms : [];

  return rooms
    .map((room) => {
      const row = dataObject(room);
      return firstText(row.name, row.note);
    })
    .filter(Boolean)
    .join("\n");
}

function textList(value: unknown) {
  return Array.isArray(value)
    ? value
        .map((item) => {
          if (typeof item === "string") return textFromHtml(item);
          const row = dataObject(item);
          return firstText(row.name, row.title, row.label, row.note, row.Desc, row.Text, row["#text"]);
        })
        .filter(Boolean)
    : [];
}

function hotelTitle(entity: SupplierEntity, raw: Record<string, unknown>, index: number) {
  return firstText(
    entity.editorialTitle,
    entity.title,
    raw.title,
    raw.hotelName,
    raw.HotelName,
    raw.name,
    raw.Name,
    raw.Accommodation,
    raw.category,
    raw.Category,
    textList(raw.hotels)[0]
  ) || `Хотел ${index + 1}`;
}

function entityPreview(raw: unknown) {
  const text = JSON.stringify(raw, null, 2) || "{}";
  return text.length > 1600 ? `${text.slice(0, 1600)}...` : text;
}

export function SupplierHotelsReviewList({ entities }: { entities: SupplierEntity[] }) {
  return (
    <div className="supplier-review-hotel-list">
      {entities.map((entity, index) => {
        const raw = dataObject(entity.rawData);
        const editorial = dataObject(entity.editorialData);
        const title = hotelTitle(entity, raw, index);
        const category = firstText(editorial.category, raw.category, raw.Category);
        const rooms = firstText(editorial.rooms) || roomText(raw);

        return (
          <article className={entity.isEnabled ? "supplier-review-hotel-item is-enabled" : "supplier-review-hotel-item"} key={entity.id}>
            <input type="hidden" name="entity_ids" value={entity.id} />
            <div className="supplier-review-hotel-side">
              <label className="supplier-review-entity-toggle">
                <input name="enabled_entity_ids" type="checkbox" value={entity.id} defaultChecked={entity.isEnabled} />
                <span>Показвай</span>
              </label>
              <span>{category || "hotel"}</span>
            </div>
            <div className="supplier-review-hotel-body">
              <label>
                <span>Име в сайта</span>
                <input name={`entity_title_${entity.id}`} defaultValue={title} />
              </label>
              <label>
                <span>Категория</span>
                <input name={`entity_category_${entity.id}`} defaultValue={category} placeholder="напр. 4*" />
              </label>
              <label className="is-wide">
                <span>Стаи / настаняване</span>
                <textarea name={`entity_rooms_${entity.id}`} rows={3} defaultValue={rooms} />
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
