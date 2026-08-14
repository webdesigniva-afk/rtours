"use client";

import { useMemo, useState } from "react";
import { GripVertical } from "lucide-react";
import type { AdminSupplierImportDetail } from "@/lib/adminImportRepository";

type SupplierImageEntity = AdminSupplierImportDetail["entities"][number];

function entityPreview(raw: unknown) {
  const text = JSON.stringify(raw, null, 2) || "{}";
  return text.length > 520 ? `${text.slice(0, 520)}...` : text;
}

export function SupplierImageReviewGrid({ entities }: { entities: SupplierImageEntity[] }) {
  const initialItems = useMemo(() => [...entities].sort((a, b) => a.sortOrder - b.sortOrder), [entities]);
  const [items, setItems] = useState(initialItems);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const firstEnabledId = items.find((item) => item.isEnabled)?.id || null;

  function moveTo(targetId: string) {
    if (!draggingId || draggingId === targetId) return;

    setItems((current) => {
      const from = current.findIndex((item) => item.id === draggingId);
      const to = current.findIndex((item) => item.id === targetId);

      if (from < 0 || to < 0) return current;

      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function setEnabled(id: string, isEnabled: boolean) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, isEnabled } : item)));
  }

  return (
    <div className="supplier-review-image-grid">
      {items.map((entity, index) => (
        <article
          className={[
            "supplier-review-entity",
            "is-image",
            entity.isEnabled ? "is-enabled" : "",
            firstEnabledId === entity.id ? "is-primary-image" : "",
            draggingId === entity.id ? "is-dragging" : ""
          ].filter(Boolean).join(" ")}
          key={entity.id}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            moveTo(entity.id);
            setDraggingId(null);
          }}
        >
          <input type="hidden" name="entity_ids" value={entity.id} />
          <div className="supplier-review-image-frame">
            {entity.url ? (
              <img src={entity.editorialUrl || entity.url} alt={entity.editorialTitle || entity.title || "Supplier image"} />
            ) : null}
            <button
              aria-label={`Премести снимка ${index + 1}`}
              className="supplier-review-drag-handle"
              draggable
              type="button"
              onDragStart={(event) => {
                setDraggingId(entity.id);
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", entity.id);
              }}
              onDragEnd={() => setDraggingId(null)}
            >
              <GripVertical size={18} aria-hidden="true" />
            </button>
            {firstEnabledId === entity.id ? <span className="supplier-review-image-badge">Основна</span> : null}
          </div>
          <label className="supplier-review-entity-toggle">
            <input
              name="enabled_entity_ids"
              type="checkbox"
              value={entity.id}
              checked={entity.isEnabled}
              onChange={(event) => setEnabled(entity.id, event.target.checked)}
            />
            <span>В галерията</span>
          </label>
          <div className="supplier-review-entity-body">
            <strong>{entity.editorialTitle || entity.title || `Снимка ${index + 1}`}</strong>
            <div className="supplier-review-entity-fields">
              <label>
                <span>Alt / име на снимката</span>
                <input name={`entity_title_${entity.id}`} defaultValue={entity.editorialTitle || entity.title || ""} />
              </label>
              <label>
                <span>Адрес на снимката</span>
                <input name={`entity_url_${entity.id}`} defaultValue={entity.editorialUrl || entity.url || ""} />
              </label>
            </div>
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
