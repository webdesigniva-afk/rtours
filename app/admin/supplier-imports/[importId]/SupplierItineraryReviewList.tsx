"use client";

import { useState } from "react";
import type { AdminSupplierImportDetail } from "@/lib/adminImportRepository";

type SupplierEntity = AdminSupplierImportDetail["entities"][number];
type DescriptionMode = "text" | "html";

function dataObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function textValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
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

function entityPreview(raw: unknown) {
  const text = JSON.stringify(raw, null, 2) || "{}";
  return text.length > 520 ? `${text.slice(0, 520)}...` : text;
}

function initialMode(value: unknown): DescriptionMode {
  return value === "html" ? "html" : "text";
}

export function SupplierItineraryReviewList({ entities }: { entities: SupplierEntity[] }) {
  const [days, setDays] = useState(() => entities.map((entity, index) => {
    const raw = dataObject(entity.rawData);
    const editorial = dataObject(entity.editorialData);
    const html = textValue(editorial.descriptionHtml) || textValue(raw.descriptionHtml) || textValue(raw.description);
    const text = textFromHtml(editorial.description) || textFromHtml(raw.description);
    const dayNumber = numberValue(editorial.dayNumber) || numberValue(raw.dayNumber) || index + 1;

    return {
      entity,
      mode: initialMode(editorial.descriptionMode),
      text,
      html,
      dayNumber,
      title: textFromHtml(entity.editorialTitle || entity.title || textValue(raw.title)) || `Ден ${dayNumber}`,
      accommodation: textFromHtml(editorial.accommodation) || textFromHtml(raw.accommodation),
      meals: textFromHtml(editorial.meals) || textFromHtml(raw.meals),
      transport: textFromHtml(editorial.transport) || textFromHtml(raw.transport)
    };
  }));

  function updateDay(id: string, updates: Partial<(typeof days)[number]>) {
    setDays((current) => current.map((day) => day.entity.id === id ? { ...day, ...updates } : day));
  }

  return (
    <div className="supplier-review-itinerary-list">
      {days.map((day) => {
        const { entity } = day;
        const description = day.mode === "html" ? day.html : day.text;

        return (
          <article className={entity.isEnabled ? "supplier-review-itinerary-day is-enabled" : "supplier-review-itinerary-day"} key={entity.id}>
            <input type="hidden" name="entity_ids" value={entity.id} />
            <input type="hidden" name={`entity_description_mode_${entity.id}`} value={day.mode} />
            <label className="supplier-review-entity-toggle">
              <input name="enabled_entity_ids" type="checkbox" value={entity.id} defaultChecked={entity.isEnabled} />
              <span>Показвай</span>
            </label>
            <div className="supplier-review-day-number">
              <span>Ден</span>
              <input name={`entity_day_number_${entity.id}`} defaultValue={day.dayNumber} inputMode="numeric" />
            </div>
            <div className="supplier-review-day-content">
              <label>
                <span>Заглавие за деня</span>
                <input name={`entity_title_${entity.id}`} defaultValue={day.title} />
              </label>
              <label className="is-wide">
                <span>Описание</span>
                <div className="supplier-review-mode-switch" role="group" aria-label="Режим на редакция">
                  <button className={day.mode === "text" ? "is-active" : ""} type="button" onClick={() => updateDay(entity.id, { mode: "text" })}>
                    Текст
                  </button>
                  <button className={day.mode === "html" ? "is-active" : ""} type="button" onClick={() => updateDay(entity.id, { mode: "html" })}>
                    HTML
                  </button>
                </div>
                <textarea
                  className={day.mode === "html" ? "is-html-mode" : ""}
                  name={`entity_description_${entity.id}`}
                  value={description}
                  rows={day.mode === "html" ? 7 : 4}
                  placeholder="Какво се случва през този ден, кои места се посещават, каква е логистиката."
                  onChange={(event) => {
                    if (day.mode === "html") {
                      updateDay(entity.id, { html: event.target.value });
                    } else {
                      updateDay(entity.id, { text: event.target.value });
                    }
                  }}
                />
              </label>
              <div className="supplier-review-day-logistics">
                <label>
                  <span>Настаняване</span>
                  <input name={`entity_accommodation_${entity.id}`} defaultValue={day.accommodation} placeholder="хотел / категория" />
                </label>
                <label>
                  <span>Хранене</span>
                  <input name={`entity_meals_${entity.id}`} defaultValue={day.meals} placeholder="включено хранене" />
                </label>
                <label>
                  <span>Транспорт</span>
                  <input name={`entity_transport_${entity.id}`} defaultValue={day.transport} placeholder="вид транспорт" />
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
  );
}
