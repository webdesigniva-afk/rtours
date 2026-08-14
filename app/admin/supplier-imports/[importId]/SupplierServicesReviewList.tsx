"use client";

import { useMemo, useState } from "react";
import type { AdminSupplierImportDetail } from "@/lib/adminImportRepository";

type SupplierEntity = AdminSupplierImportDetail["entities"][number];
type ServiceKind = "included" | "excluded";

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

function serviceKind(value: unknown): ServiceKind {
  return value === "excluded" ? "excluded" : "included";
}

function entityPreview(raw: unknown) {
  const text = JSON.stringify(raw, null, 2) || "{}";
  return text.length > 520 ? `${text.slice(0, 520)}...` : text;
}

export function SupplierServicesReviewList({ entities }: { entities: SupplierEntity[] }) {
  const initialItems = useMemo(() => entities.map((entity) => {
    const raw = dataObject(entity.rawData);
    const editorial = dataObject(entity.editorialData);

    return {
      entity,
      kind: serviceKind(editorial.serviceType || raw.serviceType),
      label: textFromHtml(entity.editorialTitle || entity.title || raw.label)
    };
  }), [entities]);

  const [items, setItems] = useState(initialItems);

  function updateLabel(id: string, label: string) {
    setItems((current) => current.map((item) => item.entity.id === id ? { ...item, label } : item));
  }

  function renderColumn(kind: ServiceKind, title: string, eyebrow: string, description: string) {
    const columnItems = items.filter((item) => item.kind === kind);

    return (
      <section className="supplier-review-service-column">
        <header>
          <span>{eyebrow}</span>
          <h4>{title}</h4>
          <p>{description}</p>
        </header>
        <div>
          {columnItems.length ? columnItems.map((item) => {
            const { entity } = item;

            return (
              <article className={entity.isEnabled ? "supplier-review-service-item is-enabled" : "supplier-review-service-item"} key={entity.id}>
                <input type="hidden" name="entity_ids" value={entity.id} />
                <input type="hidden" name={`entity_service_type_${entity.id}`} value={kind} />
                <label className="supplier-review-entity-toggle">
                  <input name="enabled_entity_ids" type="checkbox" value={entity.id} defaultChecked={entity.isEnabled} />
                  <span>Показвай</span>
                </label>
                <div className="supplier-review-service-body">
                  <label>
                    <span>Текст в сайта</span>
                    <textarea
                      name={`entity_title_${entity.id}`}
                      value={item.label}
                      rows={3}
                      onChange={(event) => updateLabel(entity.id, event.target.value)}
                    />
                  </label>
                  <details>
                    <summary>Raw данни</summary>
                    <pre>{entityPreview(entity.rawData)}</pre>
                  </details>
                </div>
              </article>
            );
          }) : (
            <p className="supplier-review-service-empty">Няма добавени услуги в тази група.</p>
          )}
        </div>
      </section>
    );
  }

  return (
    <div className="supplier-review-services-grid">
      {renderColumn("included", "Включено", "В цената", "Услуги, които клиентът вижда като част от цената.")}
      {renderColumn("excluded", "Не е включено", "Допълнително", "Разходи и услуги, които се заплащат отделно.")}
    </div>
  );
}
