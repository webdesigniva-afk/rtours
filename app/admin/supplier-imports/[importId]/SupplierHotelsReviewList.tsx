import type { AdminSupplierImportDetail } from "@/lib/adminImportRepository";
import { SupplierReviewEntityControls } from "./SupplierReviewEntityControls";

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
  const value = raw.rooms ?? raw.Rooms ?? raw.roomTypes ?? raw.RoomTypes ?? raw.accommodations ?? raw.Accommodations;
  const rooms = Array.isArray(value)
    ? value
    : Object.entries(dataObject(value)).map(([key, item]) => {
        const row = dataObject(item);
        return Object.keys(row).length ? { key, ...row } : key;
      });

  return rooms
    .map((room, index) => {
      if (typeof room === "string" || typeof room === "number") return textFromHtml(String(room));
      const row = dataObject(room);
      return firstText(row.name, row.Name, row.title, row.Title, row.roomName, row.RoomName, row.label, row.note, row.Desc, row.Text, row.key) || `Стая ${index + 1}`;
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
  return JSON.stringify(raw, null, 2) || "{}";
}

function hotelFactRows(entity: SupplierEntity, raw: Record<string, unknown>, category: string, rooms: string) {
  return [
    { label: "ID", value: entity.key },
    { label: "Категория", value: category },
    { label: "Пансион", value: firstText(raw.board, raw.Board, raw.meal, raw.Meal, raw.boardName, raw.BoardName) },
    { label: "Дестинация", value: firstText(raw.destination, raw.Destination, raw.city, raw.City, raw.Dest, raw.resort, raw.Resort) },
    { label: "Стаи", value: rooms ? String(rooms.split("\n").filter(Boolean).length) : "" },
    { label: "Източник", value: firstText(raw.source, raw.Source) }
  ].filter((item) => item.value);
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
        const facts = hotelFactRows(entity, raw, category, rooms);

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
              <SupplierReviewEntityControls entity={entity} />
              {facts.length ? (
                <div className="supplier-review-hotel-facts">
                  {facts.map((item) => (
                    <span key={item.label}>
                      <strong>{item.label}</strong>
                      {item.value}
                    </span>
                  ))}
                </div>
              ) : null}
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
