"use client";

import { useMemo, useState } from "react";
import type { AdminSupplierImportDetail } from "@/lib/adminImportRepository";

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

function splitPrice(label: string) {
  const match = label.match(/\s+-\s+(\d+(?:[.,]\d+)?)\s*(EUR|BGN)$/i);
  if (!match) return { text: label, price: "" };

  return {
    text: label.slice(0, match.index).trim(),
    price: `${match[1]} ${match[2].toUpperCase()}`
  };
}

function entityPreview(raw: unknown) {
  const text = JSON.stringify(raw, null, 2) || "{}";
  return text.length > 520 ? `${text.slice(0, 520)}...` : text;
}

export function SupplierAdditionalServicesReviewList({ entities }: { entities: SupplierEntity[] }) {
  const initialItems = useMemo(() => entities.map((entity) => {
    const raw = dataObject(entity.rawData);
    const label = textFromHtml(entity.editorialTitle || entity.title || raw.label);
    const parsed = splitPrice(label);

    return {
      entity,
      label: parsed.text,
      price: parsed.price
    };
  }), [entities]);

  const [items, setItems] = useState(initialItems);

  function updateItem(id: string, updates: Partial<(typeof items)[number]>) {
    setItems((current) => current.map((item) => item.entity.id === id ? { ...item, ...updates } : item));
  }

  return (
    <div className="supplier-review-additional-list">
      {items.map((item) => {
        const value = [item.label, item.price].filter(Boolean).join(" - ");

        return (
          <article className={item.entity.isEnabled ? "supplier-review-additional-item is-enabled" : "supplier-review-additional-item"} key={item.entity.id}>
            <input type="hidden" name="entity_ids" value={item.entity.id} />
            <label className="supplier-review-entity-toggle">
              <input name="enabled_entity_ids" type="checkbox" value={item.entity.id} defaultChecked={item.entity.isEnabled} />
              <span>Показвай</span>
            </label>
            <div className="supplier-review-additional-body">
              <input type="hidden" name={`entity_title_${item.entity.id}`} value={value} />
              <label>
                <span>Услуга</span>
                <textarea rows={3} value={item.label} onChange={(event) => updateItem(item.entity.id, { label: event.target.value })} />
              </label>
              <label>
                <span>Цена</span>
                <input value={item.price} placeholder="напр. 28 EUR" onChange={(event) => updateItem(item.entity.id, { price: event.target.value })} />
              </label>
              <details>
                <summary>Raw данни</summary>
                <pre>{entityPreview(item.entity.rawData)}</pre>
              </details>
            </div>
          </article>
        );
      })}
    </div>
  );
}
