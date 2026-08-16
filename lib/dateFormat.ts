type DateLike = Date | string | null | undefined;

function pad(value: number | string) {
  return String(value).padStart(2, "0");
}

export function formatDisplayDate(value: DateLike) {
  if (!value) return "";

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    return `${pad(value.getDate())}.${pad(value.getMonth() + 1)}.${value.getFullYear()}`;
  }

  const raw = String(value).trim();
  if (!raw) return "";

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
  if (isoMatch) return `${isoMatch[3]}.${isoMatch[2]}.${isoMatch[1]}`;

  const bgMatch = raw.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})(?:\s*г\.?)?$/i);
  if (bgMatch) return `${pad(bgMatch[1])}.${pad(bgMatch[2])}.${bgMatch[3]}`;

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return `${pad(parsed.getDate())}.${pad(parsed.getMonth() + 1)}.${parsed.getFullYear()}`;
  }

  return raw;
}

export function formatDisplayDateRange(start: DateLike, end: DateLike) {
  const startLabel = formatDisplayDate(start);
  const endLabel = formatDisplayDate(end);

  if (startLabel && endLabel && startLabel !== endLabel) return `${startLabel} - ${endLabel}`;
  if (startLabel) return startLabel;
  if (endLabel) return `до ${endLabel}`;
  return "";
}

export function normalizeDateLabel(label: DateLike, start?: DateLike, end?: DateLike, fallback = "Дати по заявка") {
  const rawLabel = String(label || "").trim();
  const rangeLabel = formatDisplayDateRange(start, end);

  if (!rawLabel) return rangeLabel || fallback;

  const formattedLabel = rawLabel
    .replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (_match, year, month, day) => `${day}.${month}.${year}`)
    .replace(/\b(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})\s*г\.?\b/gi, (_match, day, month, year) => `${pad(day)}.${pad(month)}.${year}`);

  if (rangeLabel && (formattedLabel === String(start || "").trim() || formattedLabel === String(end || "").trim())) {
    return rangeLabel;
  }

  return formattedLabel || rangeLabel || fallback;
}
