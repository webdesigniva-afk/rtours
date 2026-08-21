import type { AdminSupplierImportDetail } from "@/lib/adminImportRepository";

type SupplierEntity = AdminSupplierImportDetail["entities"][number];

const sectionOptions = [
  { value: "overview", label: "Представяне" },
  { value: "itinerary", label: "Програма" },
  { value: "dates", label: "Дати и цени" },
  { value: "accommodation", label: "Настаняване / хотели" },
  { value: "services", label: "Услуги" },
  { value: "extras", label: "Допълнителни услуги" },
  { value: "conditions", label: "Условия и важно" },
  { value: "media", label: "Снимки" },
  { value: "internal", label: "Само вътрешно" }
] as const;

function dataObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function defaultPublicSection(type: string) {
  if (type === "hotel") return "accommodation";
  if (type === "additional_service") return "extras";
  if (type === "payment_policy" || type === "cancel_policy" || type === "insurance" || type === "useful_info") return "conditions";
  if (type === "service") return "services";
  if (type === "itinerary_day") return "itinerary";
  if (type === "departure") return "dates";
  if (type === "image") return "media";
  return "internal";
}

export function supplierReviewPublicSection(entity: SupplierEntity) {
  const editorial = dataObject(entity.editorialData);
  return textValue(editorial.publicSection) || defaultPublicSection(entity.type);
}

export function supplierReviewNotes(entity: SupplierEntity) {
  const editorial = dataObject(entity.editorialData);
  return textValue(editorial.notes);
}

export function SupplierReviewEntityControls({ entity, showNotes = true }: { entity: SupplierEntity; showNotes?: boolean }) {
  return (
    <div className="supplier-review-placement">
      <label>
        <span>Къде да се използва</span>
        <select name={`entity_public_section_${entity.id}`} defaultValue={supplierReviewPublicSection(entity)}>
          {sectionOptions.map((option) => (
            <option value={option.value} key={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      {showNotes ? (
        <label>
          <span>Вътрешна бележка</span>
          <input name={`entity_notes_${entity.id}`} defaultValue={supplierReviewNotes(entity)} placeholder="Какво да провери редакторът" />
        </label>
      ) : null}
    </div>
  );
}
