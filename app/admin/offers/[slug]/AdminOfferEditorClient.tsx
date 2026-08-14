"use client";

import { type ChangeEvent, type MouseEvent, useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Camera,
  ChevronDown,
  CheckCircle2,
  Code2,
  CircleDot,
  Eye,
  Bold,
  ExternalLink,
  FileClock,
  Globe2,
  Heart,
  Image as ImageIcon,
  Import,
  Info,
  Italic,
  Landmark,
  Link2,
  List,
  MapPin,
  MoreHorizontal,
  Plane,
  Plus,
  Save,
  Search,
  Share2,
  Sparkles,
  Tag,
  Trash2,
  Underline,
  Users,
  WalletCards,
  X,
  XCircle
} from "lucide-react";
import { AdminWorkspace } from "@/components/AdminWorkspace";
import { PublicOfferDetail, type PublicOfferDetailData } from "@/components/PublicOfferDetail";
import { OfferContentForm, type OfferContentDraftSummary } from "../OfferContentForm";
import { cancelNewOfferDraft, createOfferBadge, publishOfferChanges, updateOfferContent, updateOfferDatesPrices, updateOfferPublishing, updateOfferSeo, updateOfferSupplierApiReview } from "./actions";

type OfferStatus = "draft" | "review" | "published" | "archived" | "needs_changes" | string;

export type AdminOfferEditorInitialOffer = {
  id: string;
  slug: string;
  productType: string;
  productTypeLabel: string;
  title: string;
  summary: string;
  description: string;
  country: string;
  region: string;
  destinations: Array<{ country: string; region: string; city: string }>;
  durationDays: number | string;
  durationNights: number | string;
  priceFrom: number;
  currency: "EUR" | "BGN";
  transport: string;
  dates: Array<{
    id: string;
    label: string | null;
    startDate: string | null;
    endDate: string | null;
    departurePoints: string | null;
    availability: string;
    seatsTotal: number | null;
    seatsConfirmed: number | null;
    seatsOption: number | null;
    seatsAvailable: number | null;
    priceFrom: string | null;
    currency: "EUR" | "BGN" | "";
    priceStatus: string;
    optionUntil: string | null;
    depositAmount: string | null;
    paymentDueDays: number | null;
    notes: string | null;
  }>;
  status: OfferStatus;
  importId: string | null;
  importProvider: string | null;
  importSource: string | null;
  importChangeState: "new" | "changed" | "expired" | "unavailable" | "unchanged" | null;
  importLastSyncedAt: string | null;
  importRawPayload: unknown;
  supplierEntities: Array<{
    id: string;
    type: string;
    key: string | null;
    title: string | null;
    url: string | null;
    startDate: string | null;
    endDate: string | null;
    price: string | null;
    currency: "EUR" | "BGN" | null;
    sortOrder: number;
    isEnabled: boolean;
    editorialTitle: string | null;
    editorialUrl: string | null;
    editorialData: Record<string, unknown> | null;
    rawData: unknown;
  }>;
  heroImageUrl: string;
  galleryImageUrls: string[];
  seoMetaTitle: string;
  seoMetaDescription: string;
  seoKeywords: string[];
  seoCanonicalUrl: string;
  seoStructuredDataType: string;
  isAuthorProgram: boolean;
  itinerary: Array<{ day: number; title: string; description: string; accommodation?: string; meals?: string; transport?: string }>;
  highlights: string[];
  included: string[];
  excluded: string[];
  taxonomyTerms: Array<{ type: string; slug: string; name: string; publicLabel: string | null }>;
  visibilityRules: Array<{ placement: string; isEnabled: boolean; priority: number }>;
  canCancelCreation: boolean;
  isNewBlankDraft: boolean;
  createdAt: string;
  updatedAt: string;
};

type DatesPricesDraftSummary = {
  priceFrom: number;
  currency: "EUR" | "BGN";
  dates: PublicOfferDetailData["dates"];
};

type EditableItineraryDay = {
  id: string;
  day: number;
  title: string;
  description: string;
  accommodation: string;
  meals: string;
  transport: string;
};

type EditableHighlight = {
  id: string;
  value: string;
};

type EditableServiceItem = {
  id: string;
  label: string;
};

const defaultIncludedServices = [
  "транспорт",
  "летищни такси",
  "брой нощувки и тип настаняване",
  "изхранване",
  "трансфери",
  "екскурзии и посещения",
  "входни такси",
  "водач/местни гидове",
  "застраховка",
  "други услуги"
];

const defaultExcludedServices = [
  "допълнителни услуги",
  "лични разходи",
  "бакшиши",
  "визи",
  "туристически такси",
  "невключено хранене",
  "други разходи"
];

const presentationPlaceholder = [
  "Какво прави това пътуване различно?",
  "Какво ще преживее клиентът?",
  "Какъв е ритъмът на маршрута?",
  "За кого е подходящо?",
  "Защо Red tours го препоръчва?"
].join("\n");

function createSummaryFromDescription(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

function createServiceItems(labels: string[], fallback: string[] = [""]) {
  const serviceLabels = labels.length ? labels : fallback;
  return serviceLabels.map((label) => ({ id: crypto.randomUUID(), label }));
}

type ProductTypeOption = {
  slug: string;
  label: string;
  productType: string;
  isSystem: boolean;
};

type DraftDestination = {
  id: string;
  country: string;
  region: string;
  city: string;
};

type ChoiceItem = {
  label: string;
  icon: typeof Heart;
};

type TagItem = {
  label: string;
  tone: "red" | "purple" | "green" | "orange" | "blue";
};

const defaultProductTypeOptions: ProductTypeOption[] = [
  { slug: "standard-red-tours-program", label: "Standard Red tours Program", productType: "package", isSystem: true },
  { slug: "tailor-made", label: "Tailor-made", productType: "package", isSystem: true },
  { slug: "corporate-incentive", label: "Corporate / Incentive", productType: "package", isSystem: true },
  { slug: "group-request", label: "Group Request", productType: "package", isSystem: true },
  { slug: "excursion", label: "Екскурзия", productType: "excursion", isSystem: true },
  { slug: "holiday", label: "Почивка", productType: "holiday", isSystem: true },
  { slug: "package", label: "Пакет", productType: "package", isSystem: true },
  { slug: "hotel", label: "Хотел", productType: "hotel", isSystem: true },
  { slug: "flight", label: "Самолетен билет", productType: "flight", isSystem: true }
];

const countryCodes = [
  "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AR", "AS", "AT", "AU", "AW", "AX", "AZ",
  "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR",
  "BS", "BT", "BW", "BY", "BZ", "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM",
  "CN", "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO", "DZ",
  "EC", "EE", "EG", "ER", "ES", "ET", "FI", "FJ", "FK", "FM", "FO", "FR", "GA", "GB", "GD",
  "GE", "GF", "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GT", "GU", "GW", "GY",
  "HK", "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT",
  "JE", "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ",
  "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME",
  "MF", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV",
  "MW", "MX", "MY", "MZ", "NA", "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU",
  "NZ", "OM", "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW",
  "PY", "QA", "RE", "RO", "RS", "RU", "RW", "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI",
  "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV", "SX", "SY", "SZ", "TC", "TD",
  "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ", "UA",
  "UG", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI", "VN", "VU", "WF", "WS", "YE", "YT",
  "ZA", "ZM", "ZW"
];

const countryNames = (() => {
  const displayNames = new Intl.DisplayNames(["bg"], { type: "region" });

  return countryCodes
    .map((code) => displayNames.of(code))
    .filter((name): name is string => Boolean(name))
    .sort((first, second) => first.localeCompare(second, "bg"));
})();

type SectionStatus = "complete" | "partial" | "missing" | "readonly";

type EditorSection = {
  label: string;
  icon: typeof Heart;
  description: string;
};

const tabs = [
  { label: "Оферта", icon: Info, description: "основна информация, съдържание, програма, услуги и медия" },
  { label: "Дати и цени", icon: CalendarDays, description: "отпътувания, места, базови цени и ценови варианти" },
  { label: "Публикуване", icon: Eye, description: "категоризация, етикети, видимост, SEO и финални действия" }
] satisfies EditorSection[];

const availableTags: TagItem[] = [
  { label: "ПОСЛЕДНИ МЕСТА", tone: "red" },
  { label: "АВТОРСКА ПРОГРАМА", tone: "purple" },
  { label: "НАШ ИЗБОР", tone: "green" },
  { label: "ГАРАНТИРАНО ОТПЪТУВАНЕ", tone: "orange" },
  { label: "ПРОМО ОФЕРТА", tone: "blue" }
];

const availableCollections = ["Red Signature", "Red Moments", "Red Escape", "Red Family", "Red Private"];

const audience: ChoiceItem[] = [
  { label: "Двойки", icon: Heart },
  { label: "Семейства", icon: Users },
  { label: "Семейства с малки деца", icon: Users },
  { label: "Семейства с тийнейджъри", icon: Users },
  { label: "Приятели", icon: Users },
  { label: "Соло пътешественици", icon: Users },
  { label: "Корпоративни клиенти", icon: Archive },
  { label: "Малки групи", icon: Users },
  { label: "Големи групи", icon: Users },
  { label: "Премиум клиенти", icon: Sparkles },
  { label: "Възрастни пътешественици", icon: Users },
  { label: "Ученици / студенти", icon: Users }
];

const experience: ChoiceItem[] = [
  { label: "Пълно спокойствие", icon: Sparkles },
  { label: "Романтика", icon: Heart },
  { label: "Приключение", icon: Plane },
  { label: "Култура", icon: Landmark },
  { label: "Нови вкусове", icon: Sparkles },
  { label: "Да открия нов свят", icon: Globe2 },
  { label: "Лукс и комфорт", icon: Sparkles },
  { label: "Активна почивка", icon: Plane },
  { label: "Бавно пътуване", icon: Sparkles },
  { label: "Градски ритъм", icon: Landmark },
  { label: "Море и релакс", icon: Sparkles },
  { label: "Планина и природа", icon: Globe2 },
  { label: "Екзотика", icon: Globe2 },
  { label: "Уикенд бягство", icon: Plane },
  { label: "Празнично пътуване", icon: Sparkles }
];

const interests: ChoiceItem[] = [
  { label: "История", icon: Heart },
  { label: "Природа", icon: Sparkles },
  { label: "Гастрономия", icon: Heart },
  { label: "Фотография", icon: Camera },
  { label: "Шопинг", icon: Archive },
  { label: "Вино", icon: Sparkles },
  { label: "Спорт", icon: Plane },
  { label: "Архитектура", icon: Landmark },
  { label: "Музеи", icon: Landmark },
  { label: "Изкуство", icon: Sparkles },
  { label: "Фестивали", icon: Sparkles },
  { label: "Спа и уелнес", icon: Heart },
  { label: "Плаж", icon: Globe2 },
  { label: "Пешеходни маршрути", icon: Plane },
  { label: "Сафари", icon: Globe2 },
  { label: "Круизни преживявания", icon: Archive },
  { label: "Местен живот", icon: Users },
  { label: "Нощен живот", icon: Sparkles },
  { label: "Забележителности", icon: Landmark },
  { label: "Друго", icon: MoreHorizontal }
];

const travelType: ChoiceItem[] = [
  { label: "Екскурзия", icon: Landmark },
  { label: "Почивка", icon: Sparkles },
  { label: "Групово", icon: Users },
  { label: "Индивидуално", icon: Users },
  { label: "Самолет", icon: Plane },
  { label: "Автобус", icon: Archive },
  { label: "Круиз", icon: Archive },
  { label: "Хотел", icon: Archive },
  { label: "Самолетен билет", icon: Plane },
  { label: "Уикенд", icon: CalendarDays },
  { label: "Пакет", icon: Archive },
  { label: "Комбинирано", icon: Share2 },
  { label: "Собствен транспорт", icon: Archive },
  { label: "Чартър", icon: Plane },
  { label: "Ранни записвания", icon: CalendarDays }
];

function statusLabel(status?: string) {
  if (status === "draft") return "Чернова";
  if (status === "review") return "За преглед";
  if (status === "published") return "Публикувана";
  if (status === "archived") return "Архивирана";
  if (status === "needs_changes") return "Нуждае се от корекция";
  return "Чернова";
}

function statusClass(status?: string) {
  if (status === "published") return "offer-status-published";
  if (status === "review" || status === "needs_changes") return "offer-status-review";
  return "offer-status-draft";
}

function productTypeLabel(productType?: string) {
  if (productType === "excursion") return "Екскурзия";
  if (productType === "holiday") return "Почивка";
  if (productType === "hotel") return "Хотел";
  if (productType === "flight") return "Самолетен билет";
  if (productType === "service") return "Услуга";
  return "Пакет";
}

function formatDateTime(value?: string) {
  if (!value) return "няма данни";

  return new Date(value).toLocaleString("bg-BG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function importProviderLabel(value: string | null) {
  if (!value) return "External supplier";
  if (value.toLowerCase() === "abax") return "Abax";
  if (value.toLowerCase() === "bohemia") return "Bohemia";
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function importChangeLabel(value: AdminOfferEditorInitialOffer["importChangeState"]) {
  if (value === "new") return "new";
  if (value === "changed") return "changed";
  if (value === "expired") return "expired";
  if (value === "unavailable") return "unavailable";
  if (value === "unchanged") return "unchanged";
  return "review";
}

function supplierEntityTypeLabel(type: string) {
  if (type === "image") return "Снимки";
  if (type === "hotel") return "Хотели";
  if (type === "departure") return "Дати и цени";
  if (type === "itinerary_day") return "Програма";
  if (type === "service") return "Услуги";
  if (type === "additional_service") return "Допълнителни услуги";
  if (type === "useful_info") return "Полезна информация";
  if (type === "payment_policy") return "Плащане";
  if (type === "cancel_policy") return "Анулации";
  if (type === "insurance") return "Застраховки";
  if (type === "main_details") return "Основни API данни";
  if (type === "details_root") return "Пълен detail payload";
  return type.replace(/[_-]+/g, " ");
}

function supplierEntityIcon(type: string) {
  if (type === "image") return ImageIcon;
  if (type === "hotel") return Landmark;
  if (type === "departure") return CalendarDays;
  if (type === "itinerary_day") return List;
  if (type === "service" || type === "additional_service") return WalletCards;
  if (type === "payment_policy" || type === "cancel_policy" || type === "insurance") return FileClock;
  return Code2;
}

function supplierEntityPreview(value: unknown, limit = 900) {
  const text = JSON.stringify(value, null, 2) || "{}";
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
}

function supplierEntityText(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function supplierEntityObject(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function supplierEntityMainText(entity: AdminOfferEditorInitialOffer["supplierEntities"][number]) {
  const raw = supplierEntityObject(entity.rawData);
  const editorial = supplierEntityObject(entity.editorialData);
  return [
    entity.editorialTitle,
    supplierEntityText(editorial.title),
    entity.title,
    supplierEntityText(raw.label),
    supplierEntityText(raw.title),
    supplierEntityText(raw.name),
    supplierEntityText(raw.Name),
    supplierEntityText(raw.description),
    supplierEntityText(raw.text)
  ].find(Boolean) || entity.key || entity.id;
}

function supplierEntityEditableText(entity: AdminOfferEditorInitialOffer["supplierEntities"][number]) {
  const raw = supplierEntityObject(entity.rawData);
  const editorial = supplierEntityObject(entity.editorialData);
  return [
    supplierEntityText(editorial.text),
    supplierEntityText(editorial.description),
    supplierEntityText(raw.description),
    supplierEntityText(raw.descriptionHtml),
    supplierEntityText(raw.text),
    supplierEntityText(raw.Text),
    supplierEntityText(raw.Desc),
    supplierEntityText(raw.label),
    entity.title
  ].find(Boolean) || "";
}

function supplierEntityEditableUrl(entity: AdminOfferEditorInitialOffer["supplierEntities"][number]) {
  const editorial = supplierEntityObject(entity.editorialData);
  return supplierEntityText(editorial.url) || entity.editorialUrl || entity.url || "";
}

function supplierEntityPublicSection(entity: AdminOfferEditorInitialOffer["supplierEntities"][number]) {
  const editorial = supplierEntityObject(entity.editorialData);
  const saved = supplierEntityText(editorial.publicSection);
  if (saved) return saved;
  if (entity.type === "hotel") return "accommodation";
  if (entity.type === "additional_service") return "extras";
  if (entity.type === "payment_policy" || entity.type === "cancel_policy" || entity.type === "insurance" || entity.type === "useful_info") return "conditions";
  if (entity.type === "service") return "services";
  if (entity.type === "itinerary_day") return "itinerary";
  if (entity.type === "departure") return "dates";
  if (entity.type === "image") return "media";
  return "internal";
}

function supplierEntityNotes(entity: AdminOfferEditorInitialOffer["supplierEntities"][number]) {
  const editorial = supplierEntityObject(entity.editorialData);
  return supplierEntityText(editorial.notes);
}

function supplierRawPayloadSize(payload: unknown) {
  return supplierEntityPreview(payload, 100000).length;
}

function labelsForTaxonomyType(offer: AdminOfferEditorInitialOffer, type: string) {
  return offer.taxonomyTerms
    .filter((term) => term.type === type)
    .map((term) => term.publicLabel || term.name)
    .filter(Boolean);
}

function isVisibilityEnabled(offer: AdminOfferEditorInitialOffer, placement: string, fallback = false) {
  const rule = offer.visibilityRules.find((item) => item.placement === placement);
  return rule ? rule.isEnabled : fallback;
}

function visibilityPriority(offer: AdminOfferEditorInitialOffer, fallback = 10) {
  const priorities = offer.visibilityRules.map((rule) => rule.priority).filter((value) => Number.isFinite(value));
  return priorities.length ? Math.max(...priorities) : fallback;
}

function SelectionButton({
  item,
  selected,
  onToggle
}: {
  item: ChoiceItem;
  selected: boolean;
  onToggle: (label: string) => void;
}) {
  const Icon = item.icon;

  return (
    <button className={selected ? "is-selected" : ""} type="button" onClick={() => onToggle(item.label)} aria-pressed={selected}>
      <Icon size={18} aria-hidden="true" />
      {item.label}
    </button>
  );
}

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function sectionStatusLabel(status: SectionStatus, percent: number) {
  if (status === "complete") return "Готово";
  if (status === "readonly") return "Автоматично";
  if (status === "missing") return "Липсва";
  return `${percent}%`;
}

function tabFromKey(tabKey?: string) {
  if (tabKey === "dates-prices") return "Дати и цени";
  if (tabKey === "api-data") return "Получени данни";
  if (tabKey === "publishing") return "Публикуване";
  return "Оферта";
}

function formatDepartureLabel(date: AdminOfferEditorInitialOffer["dates"][number]) {
  if (date.label?.trim()) return date.label;
  if (date.startDate && date.endDate) return `${date.startDate} - ${date.endDate}`;
  if (date.startDate) return date.startDate;
  if (date.endDate) return `до ${date.endDate}`;
  return "Дати по заявка";
}

function mapAdminDatesToPublicPreview(offer: AdminOfferEditorInitialOffer): DatesPricesDraftSummary {
  const activeDates = offer.dates.filter((date) => date.availability !== "sold_out");
  const prices = activeDates.map((date) => Number(date.priceFrom)).filter((price) => Number.isFinite(price) && price > 0);

  return {
    priceFrom: prices.length ? Math.min(...prices) : offer.priceFrom,
    currency: offer.currency,
    dates: activeDates.length
      ? activeDates.map((date) => ({
          label: formatDepartureLabel(date),
          startDate: date.startDate || "",
          endDate: date.endDate || undefined,
          departurePoints: date.departurePoints || undefined,
          availability: date.availability as "available" | "limited" | "on_request" | "sold_out",
          seatsTotal: date.seatsTotal ?? undefined,
          seatsConfirmed: date.seatsConfirmed ?? undefined,
          seatsOption: date.seatsOption ?? undefined,
          seatsAvailable: date.seatsAvailable ?? undefined,
          priceFrom: date.priceFrom ? Number(date.priceFrom) : undefined,
          currency: date.currency || offer.currency,
          priceStatus: (date.priceStatus || "budgetary") as "fixed" | "option_until" | "dynamic" | "budgetary",
          optionUntil: date.optionUntil || undefined,
          depositAmount: date.depositAmount ? Number(date.depositAmount) : undefined,
          paymentDueDays: date.paymentDueDays ?? undefined,
          notes: date.notes || undefined
        }))
      : [{ label: "Дати по заявка", startDate: "" }]
  };
}

export function AdminOfferEditorClient({ offer, initialTabKey }: { offer: AdminOfferEditorInitialOffer; initialTabKey?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNewUrlMode = searchParams.get("new") === "1";
  const isNewCreationFlow = offer.canCancelCreation || isNewUrlMode;
  const shouldShowEmptyEditor = offer.isNewBlankDraft;
  const contentFormId = `offer-content-form-${offer.slug}`;
  const contentFormVersion = `${offer.slug}-${offer.updatedAt}-${shouldShowEmptyEditor ? "empty" : "saved"}`;
  const [activeTab, setActiveTab] = useState(tabFromKey(initialTabKey));
  const visibleTabs = useMemo(
    () => offer.importId ? [...tabs, { label: "Получени данни", icon: Import, description: "информацията от доставчика преди да влезе в шаблона" }] : tabs,
    [offer.importId]
  );
  const [status, setStatus] = useState<OfferStatus>(offer.status);
  const initialBadgeLabels = labelsForTaxonomyType(offer, "badge");
  const initialCollectionLabels = labelsForTaxonomyType(offer, "collection");
  const initialTagOptions = [
    ...availableTags,
    ...initialBadgeLabels
      .filter((label) => !availableTags.some((tag) => tag.label === label))
      .map((label) => ({ label, tone: "red" as const }))
  ];
  const [tagOptions, setTagOptions] = useState<TagItem[]>(initialTagOptions);
  const [activeTagLabels, setActiveTagLabels] = useState<string[]>(initialBadgeLabels);
  const [collections, setCollections] = useState<string[]>(initialCollectionLabels);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [newTagLabel, setNewTagLabel] = useState("");
  const [selectedAudience, setSelectedAudience] = useState<string[]>(labelsForTaxonomyType(offer, "audience"));
  const [selectedExperience, setSelectedExperience] = useState<string[]>(labelsForTaxonomyType(offer, "mood"));
  const [selectedInterests, setSelectedInterests] = useState<string[]>(labelsForTaxonomyType(offer, "theme"));
  const [selectedTravelType, setSelectedTravelType] = useState<string[]>(labelsForTaxonomyType(offer, "category"));
  const [showOnHome, setShowOnHome] = useState(isVisibilityEnabled(offer, "homepage", false));
  const [featuredByRedTours, setFeaturedByRedTours] = useState(initialBadgeLabels.includes("Наш избор"));
  const [showInSignature, setShowInSignature] = useState(isVisibilityEnabled(offer, "collection_page", initialCollectionLabels.includes("Red Signature")));
  const [showInPromo, setShowInPromo] = useState(isVisibilityEnabled(offer, "promo_section", false));
  const [priority, setPriority] = useState(visibilityPriority(offer, 10));
  const [seoTitle, setSeoTitle] = useState(offer.seoMetaTitle || offer.title);
  const [seoDescription, setSeoDescription] = useState(offer.seoMetaDescription || offer.summary);
  const [seoSlug, setSeoSlug] = useState(offer.slug);
  const [seoCanonicalUrl, setSeoCanonicalUrl] = useState(offer.seoCanonicalUrl || `/offers/${offer.slug}`);
  const [seoKeywords, setSeoKeywords] = useState((offer.seoKeywords.length ? offer.seoKeywords : [offer.country, offer.region, offer.title].filter(Boolean)).join(", "));
  const [seoStructuredDataType, setSeoStructuredDataType] = useState(offer.seoStructuredDataType || "TouristTrip");
  const [currentHeroImageUrl, setCurrentHeroImageUrl] = useState(offer.heroImageUrl);
  const [contentDraft, setContentDraft] = useState<OfferContentDraftSummary>({
    productTypeLabel: shouldShowEmptyEditor || !offer.productType ? "" : offer.productTypeLabel || productTypeLabel(offer.productType),
    title: offer.title,
    country: offer.country,
    region: offer.region,
    durationDays: String(offer.durationDays ?? ""),
    durationNights: String(offer.durationNights ?? ""),
    transport: offer.transport,
    summary: offer.summary,
    description: offer.description,
    hasHeroImage: Boolean(offer.heroImageUrl)
  });
  const [datesDraft, setDatesDraft] = useState<DatesPricesDraftSummary>(() => mapAdminDatesToPublicPreview(offer));
  const [message, setMessage] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showCancelDraftModal, setShowCancelDraftModal] = useState(false);
  const [isContentMediaUploading, setIsContentMediaUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isTagPending, startTagTransition] = useTransition();
  const [seoState, seoAction, isSeoPending] = useActionState(updateOfferSeo, { ok: false, message: "" });

  const selectedTags = useMemo(() => tagOptions.filter((tag) => activeTagLabels.includes(tag.label)), [activeTagLabels, tagOptions]);
  const seoPreviewImageUrl = currentHeroImageUrl.trim();
  const seoUrlPath = `/offers/${seoSlug || offer.slug}`;
  const seoDescriptionPreview = seoDescription || "Кратко описание на офертата за резултатите в Google.";
  const activeDeparturesCount = offer.dates.filter((date) => date.availability !== "sold_out").length;
  const hasIncludedServices = offer.included.some((item) => item.trim());
  const hasExcludedServices = offer.excluded.some((item) => item.trim());
  const hasActiveDepartureWithPrice = offer.dates.some((date) => date.availability !== "sold_out" && Number(date.priceFrom) > 0);
  const hasSeoBasics = Boolean((seoTitle || offer.seoMetaTitle || offer.title).trim() && (seoDescription || offer.seoMetaDescription || offer.summary).trim());
  const hasSavedTaxonomy = offer.taxonomyTerms.length > 0;
  const hasSavedVisibility = offer.visibilityRules.some((rule) => rule.isEnabled);
  const publishRequirements = [
    { label: "Основни данни", ok: Boolean(offer.title && offer.country && offer.region && offer.durationDays && offer.transport), detail: "заглавие, дестинация, продължителност и транспорт" },
    { label: "Описание", ok: Boolean(offer.summary && offer.description), detail: "кратко и пълно представяне" },
    { label: "Основна снимка", ok: Boolean(currentHeroImageUrl), detail: "публична hero визия" },
    { label: "Програма по дни", ok: offer.itinerary.length > 0, detail: "поне един ден с маршрут" },
    { label: "Услуги", ok: hasIncludedServices && hasExcludedServices, detail: "какво включва и какво не включва цената" },
    { label: "Дати и цени", ok: activeDeparturesCount > 0, detail: hasActiveDepartureWithPrice ? "има активна дата с цена" : "активна дата, цената е при запитване" },
    { label: "Категоризация", ok: hasSavedTaxonomy, detail: "taxonomy етикети, колекции, аудитория и тип пътуване" },
    { label: "Показване", ok: hasSavedVisibility, detail: "листинг, търсене, начална страница или колекция" },
    { label: "SEO основа", ok: hasSeoBasics, detail: "заглавие и meta описание" }
  ];
  const publishMissing = publishRequirements.filter((item) => !item.ok);
  const canPublish = publishMissing.length === 0;
  const previewPriceLabel = datesDraft.priceFrom > 0
    ? `${datesDraft.priceFrom.toLocaleString("bg-BG")} ${datesDraft.currency}`
    : "Цена при запитване";
  const seoKeywordSuggestions = useMemo(
    () => Array.from(new Set([offer.country, offer.region, productTypeLabel(offer.productType), ...selectedTags.map((tag) => tag.label), ...collections, ...selectedTravelType].filter(Boolean))).slice(0, 10),
    [collections, offer.country, offer.productType, offer.region, selectedTags, selectedTravelType]
  );

  useEffect(() => {
    if (seoState.ok && seoState.newSlug && seoState.newSlug !== offer.slug) {
      router.replace(`/admin/offers/${seoState.newSlug}?tab=publishing`);
    }
  }, [offer.slug, router, seoState]);

  const publicPreview = useMemo<PublicOfferDetailData>(
    () => ({
      slug: offer.slug,
      title: offer.title,
      summary: offer.summary,
      description: offer.description,
      country: offer.country,
      region: offer.region,
      durationDays: Number(offer.durationDays) || 0,
      durationNights: Number(offer.durationNights) || 0,
      priceFrom: datesDraft.priceFrom,
      currency: datesDraft.currency,
      priceNote: "Запитване преди потвърждение",
      productType: offer.productType,
      productTypeLabel: offer.productTypeLabel,
      transport: offer.transport,
      isAuthorProgram: offer.isAuthorProgram,
      heroImage: currentHeroImageUrl,
      gallery: offer.galleryImageUrls,
      dates: datesDraft.dates,
      itinerary: offer.itinerary,
      highlights: offer.highlights,
      included: offer.included,
      excluded: offer.excluded
    }),
    [currentHeroImageUrl, datesDraft, offer]
  );

  const sectionStatus = useMemo<Record<string, { status: SectionStatus; percent: number; filled: string[]; missing: string[] }>>(
    () => ({
      "Основна информация": {
        status: offer.title && offer.country && offer.region && offer.durationDays ? "complete" : "partial",
        percent: offer.title && offer.country && offer.region && offer.durationDays ? 100 : 65,
        filled: [
          `Заглавие: ${offer.title}`,
          `Дестинация: ${offer.country}, ${offer.region}`,
          `Продължителност: ${offer.durationDays} дни / ${offer.durationNights} нощувки`,
          `Тип: ${productTypeLabel(offer.productType)}`
        ],
        missing: offer.description ? [] : ["Пълно описание"]
      },
      "Програма": {
        status: "missing",
        percent: 0,
        filled: [],
        missing: ["Дни по програма", "Описание за всеки ден", "Ред на маршрута"]
      },
      "Дати и отпътувания": {
        status: "missing",
        percent: 0,
        filled: [],
        missing: ["Поне една дата или период", "Наличности", "Статус на отпътуването"]
      },
      "Цени": {
        status: offer.priceFrom ? "partial" : "missing",
        percent: offer.priceFrom ? 40 : 0,
        filled: offer.priceFrom ? [`Цена от: ${offer.priceFrom.toLocaleString("bg-BG")} ${offer.currency}`] : [],
        missing: ["Условия за плащане", "Какво включва цената", "Доплащания"]
      },
      "Услуги": {
        status: "missing",
        percent: 0,
        filled: [],
        missing: ["Включени услуги", "Невключени услуги", "Допълнителни услуги"]
      },
      "Снимки": {
        status: currentHeroImageUrl ? "partial" : "missing",
        percent: currentHeroImageUrl ? 45 : 0,
        filled: currentHeroImageUrl ? ["Основна снимка"] : [],
        missing: currentHeroImageUrl ? ["Галерия", "Alt текстове"] : ["Основна снимка", "Галерия"]
      },
      "Категории и тагове": {
        status: selectedTags.length && selectedTravelType.length ? "partial" : "missing",
        percent: Math.min(90, selectedTags.length * 10 + collections.length * 8 + selectedTravelType.length * 8),
        filled: [
          selectedTags.length ? `Етикети: ${selectedTags.map((tag) => tag.label).join(", ")}` : "",
          collections.length ? `Колекции: ${collections.join(", ")}` : "",
          selectedTravelType.length ? `Тип пътуване: ${selectedTravelType.join(", ")}` : ""
        ].filter(Boolean),
        missing: ["Запис към taxonomy таблиците", "Публични филтри за търсачката"]
      },
      "SEO": {
        status: offer.title && offer.summary ? "partial" : "missing",
        percent: offer.title && offer.summary ? 55 : 0,
        filled: [`Meta title: ${offer.title}`, offer.summary ? "Meta description: налично" : ""].filter(Boolean),
        missing: ["Ключови думи", "Canonical URL", "Preview за Google"]
      },
      "Показване в сайта": {
        status: showOnHome || featuredByRedTours || showInSignature || showInPromo ? "partial" : "missing",
        percent: 60,
        filled: [
          showOnHome ? "Показване на начална страница" : "",
          featuredByRedTours ? "Подбрано от RedTours" : "",
          showInSignature ? "Red Signature" : "",
          `Приоритет: ${priority}`
        ].filter(Boolean),
        missing: ["Период на показване", "Финални правила за колекции"]
      },
      "Импорт / източник": {
        status: "complete",
        percent: 100,
        filled: ["Източникът е записан към офертата", "Промените се управляват през ERP"],
        missing: []
      },
      "Продажби": {
        status: "readonly",
        percent: 0,
        filled: ["Тази секция ще се пълни автоматично от запитвания, резервации и плащания."],
        missing: []
      },
      "История": {
        status: "readonly",
        percent: 100,
        filled: [`Създадена: ${formatDateTime(offer.createdAt)}`, `Последна редакция: ${formatDateTime(offer.updatedAt)}`],
        missing: []
      }
    }),
    [collections, currentHeroImageUrl, featuredByRedTours, offer, priority, selectedTags, selectedTravelType, showInPromo, showInSignature, showOnHome]
  );

  const workflowStatus: Record<string, { status: SectionStatus; percent: number; filled: string[]; missing: string[] }> = {
    "Оферта": {
      status: contentDraft.title && contentDraft.productTypeLabel && contentDraft.country && contentDraft.region && contentDraft.summary && currentHeroImageUrl ? "partial" : "missing",
      percent: Math.round(([contentDraft.productTypeLabel, contentDraft.title, contentDraft.country, contentDraft.region, contentDraft.durationDays, contentDraft.transport, contentDraft.summary, contentDraft.description, currentHeroImageUrl].filter(Boolean).length / 9) * 100),
      filled: [
        contentDraft.productTypeLabel ? `Тип: ${contentDraft.productTypeLabel}` : "",
        contentDraft.title ? `Заглавие: ${contentDraft.title}` : "",
        contentDraft.country && contentDraft.region ? `Дестинация: ${contentDraft.country}, ${contentDraft.region}` : "",
        contentDraft.durationDays ? `Продължителност: ${contentDraft.durationDays} дни / ${contentDraft.durationNights || 0} нощувки` : "",
        contentDraft.transport ? "Транспорт: избран" : "",
        contentDraft.summary ? "Кратко описание: попълнено" : "",
        contentDraft.description ? "Пълно описание: попълнено" : "",
        currentHeroImageUrl ? "Основна снимка: качена" : "",
        offer.itinerary.length ? `Програма: ${offer.itinerary.length} дни` : ""
      ].filter(Boolean),
      missing: [
        !contentDraft.productTypeLabel ? "Тип оферта" : "",
        !contentDraft.title ? "Заглавие" : "",
        !contentDraft.country ? "Държава" : "",
        !contentDraft.region ? "Регион / дестинация" : "",
        !contentDraft.durationDays ? "Продължителност" : "",
        !contentDraft.transport ? "Транспорт" : "",
        !contentDraft.summary ? "Кратко описание" : "",
        !contentDraft.description ? "Пълно описание" : "",
        !currentHeroImageUrl ? "Основна снимка" : "",
        !offer.itinerary.length ? "Програма по дни" : "",
        "Какво включва цената",
        "Какво не включва",
        "Допълнителни услуги",
        "Галерия / видео"
      ].filter(Boolean)
    },
    "Дати и цени": {
      status: activeDeparturesCount ? "partial" : "missing",
      percent: activeDeparturesCount ? (offer.priceFrom ? 55 : 35) : 0,
      filled: [
        activeDeparturesCount ? `Активни отпътувания: ${activeDeparturesCount}` : "",
        offer.priceFrom ? `Базова цена от: ${offer.priceFrom.toLocaleString("bg-BG")} ${offer.currency}` : "Цена: при запитване"
      ].filter(Boolean),
      missing: [
        !activeDeparturesCount ? "Поне едно отпътуване" : "",
        "Капацитет и места",
        "Ценови варианти",
        "Депозит и срок за плащане"
      ].filter(Boolean)
    },
    "Публикуване": {
      status: selectedTags.length && (showOnHome || featuredByRedTours || showInSignature || showInPromo) ? "partial" : "missing",
      percent: Math.min(95, selectedTags.length * 10 + collections.length * 8 + selectedTravelType.length * 6),
      filled: [
        selectedTags.length ? `Етикети: ${selectedTags.map((tag) => tag.label).join(", ")}` : "",
        collections.length ? `Колекции: ${collections.join(", ")}` : "",
        selectedTravelType.length ? `Типове: ${selectedTravelType.join(", ")}` : "",
        showOnHome ? "Показване на начална страница" : "",
        featuredByRedTours ? "Подбрано от RedTours" : "",
        showInSignature ? "Red Signature" : "",
        `Приоритет: ${priority}`
      ].filter(Boolean),
      missing: ["Период на акцентиране", "SEO описание", "URL slug проверка", "Social image"]
    },
    "Получени данни": {
      status: offer.importId ? "readonly" : "missing",
      percent: offer.importId ? 100 : 0,
      filled: [
        offer.supplierEntities.length ? `Разпознати елементи: ${offer.supplierEntities.length}` : "",
        offer.importRawPayload ? `Raw payload: ${supplierRawPayloadSize(offer.importRawPayload).toLocaleString("bg-BG")} символа` : ""
      ].filter(Boolean),
      missing: offer.importId && !offer.supplierEntities.length ? ["Няма записани supplier entities към този импорт"] : []
    }
  };

  const completionPercent = Math.round(
    visibleTabs.reduce((sum, tab) => sum + (workflowStatus[tab.label]?.percent || 0), 0) / visibleTabs.length
  );

  function removeTag(label: string) {
    setActiveTagLabels((current) => current.filter((tagLabel) => tagLabel !== label));
  }

  function addTag(tag: TagItem) {
    setActiveTagLabels((current) => current.includes(tag.label) ? current : [...current, tag.label]);
    setShowTagMenu(false);
  }

  function toggleTag(tag: TagItem) {
    setActiveTagLabels((current) => current.includes(tag.label) ? current.filter((tagLabel) => tagLabel !== tag.label) : [...current, tag.label]);
  }

  function saveNewTag() {
    const label = newTagLabel.trim();
    if (!label) return;

    startTagTransition(async () => {
      const result = await createOfferBadge(offer.slug, label);
      if (result.ok && result.label) {
        setTagOptions((current) => current.some((tag) => tag.label === result.label) ? current : [...current, { label: result.label, tone: "red" }]);
        setActiveTagLabels((current) => current.includes(result.label) ? current : [...current, result.label]);
        setNewTagLabel("");
        setShowTagMenu(false);
        setMessage(result.message);
      } else {
        setMessage(result.message);
      }
    });
  }

  function publishChanges() {
    startTransition(async () => {
      const result = await publishOfferChanges(offer.slug);
      if (result.ok) {
        setStatus(result.status);
        setMessage(result.message);
      } else {
        setMessage(result.message);
      }
    });
  }

  function savePublishingSettings() {
    startTransition(async () => {
      const badgeLabels = Array.from(new Set([
        ...activeTagLabels,
        featuredByRedTours ? "Наш избор" : "",
        showInPromo ? "Промо оферта" : ""
      ].filter(Boolean)));
      const collectionLabels = Array.from(new Set([
        ...collections,
        showInSignature ? "Red Signature" : ""
      ].filter(Boolean)));
      const travelTypeLabels = selectedTravelType.length ? selectedTravelType : [productTypeLabel(offer.productType)].filter(Boolean);

      const result = await updateOfferPublishing(offer.slug, {
        terms: [
          ...badgeLabels.map((label) => ({ type: "badge", label })),
          ...collectionLabels.map((label) => ({ type: "collection", label })),
          ...selectedAudience.map((label) => ({ type: "audience", label })),
          ...selectedExperience.map((label) => ({ type: "mood", label })),
          ...selectedInterests.map((label) => ({ type: "theme", label })),
          ...travelTypeLabels.map((label) => ({ type: "category", label }))
        ],
        visibilityRules: [
          { placement: "offers_index", isEnabled: true, priority },
          { placement: "search", isEnabled: true, priority },
          { placement: "homepage", isEnabled: showOnHome, priority },
          { placement: "collection_page", isEnabled: showInSignature || collectionLabels.length > 0, priority },
          { placement: "promo_section", isEnabled: showInPromo, priority }
        ]
      });

      setMessage(result.message);
      if (result.ok) {
        router.refresh();
      }
    });
  }

  function cancelEditing() {
    const shouldAskAboutNewDraft = Boolean(offer.canCancelCreation || isNewUrlMode);

    if (!shouldAskAboutNewDraft) {
      router.push("/admin/offers");
      return;
    }

    setShowCancelDraftModal(true);
  }

  function discardNewDraft() {
    startTransition(async () => {
      const result = await cancelNewOfferDraft(offer.slug);
      if (result?.ok === false) {
        router.push("/admin/offers");
      }
    });
  }

  const activeTag = selectedTags[0];
  const isNewOfferFlow = offer.canCancelCreation || isNewUrlMode;
  const breadcrumbTitle = isNewOfferFlow ? "Нова оферта" : contentDraft.title.trim() || "Нова оферта";
  const durationLabel = Number(contentDraft.durationDays) || Number(contentDraft.durationNights)
    ? `${contentDraft.durationDays || 0} дни / ${contentDraft.durationNights || 0} нощувки`
    : "";
  const hasHeaderDetails = Boolean(contentDraft.title.trim() || contentDraft.country || contentDraft.region || durationLabel);
  const headerDetails = [
    hasHeaderDetails ? contentDraft.productTypeLabel : "",
    contentDraft.title.trim(),
    contentDraft.country,
    contentDraft.region,
    durationLabel
  ].filter(Boolean);

  return (
    <AdminWorkspace active="offers">
      <section className="offer-editor">
        <div className="offer-editor-breadcrumb">
          <span>Оферти</span>
          <span>{breadcrumbTitle}</span>
        </div>

        <header className="offer-editor-header">
          <div>
            <div className="offer-title-line">
              <span className={statusClass(status)}>
                <CircleDot size={12} aria-hidden="true" />
                {statusLabel(status)}
              </span>
            </div>
            {headerDetails.length ? <p>{headerDetails.join(" / ")}</p> : null}
          </div>
          <div className="offer-editor-actions">
            <button type="button" onClick={() => setIsPreviewOpen(true)}>
              <Eye size={17} aria-hidden="true" />
              Преглед в сайта
            </button>
            <button type="submit" form={contentFormId} formNoValidate disabled={isPending || isContentMediaUploading}>
              <Save size={17} aria-hidden="true" />
              {isContentMediaUploading ? "Качване..." : "Запази чернова"}
            </button>
            <button className="primary" type="button" onClick={publishChanges} disabled={isPending || !canPublish} title={canPublish ? "Публикувай офертата" : "Има липсващи данни преди публикуване"}>
              <CheckCircle2 size={17} aria-hidden="true" />
              Публикувай промените
            </button>
            <button className="danger" type="button" onClick={cancelEditing} disabled={isPending}>
              <X size={17} aria-hidden="true" />
              Отказ
            </button>
          </div>
        </header>

        {offer.importId ? (
          <section className="offer-import-context" aria-label="Import source">
            <div>
              <span>Imported offer</span>
              <strong>{importProviderLabel(offer.importProvider)} · {importChangeLabel(offer.importChangeState)}</strong>
              <p>
                Edit the public Red Tours offer here. Supplier-specific hotels, packages, extras and raw data stay in the import audit.
                {offer.importLastSyncedAt ? ` Last sync: ${formatDateTime(offer.importLastSyncedAt)}.` : ""}
              </p>
            </div>
            <a href={`/admin/supplier-imports/${offer.importId}`}>
              <Import size={16} aria-hidden="true" />
              Supplier audit
            </a>
          </section>
        ) : null}

        {message ? <p className="offer-editor-feedback">{message}</p> : null}

        <section className="offer-editor-navigator" aria-label="Структура на офертата">
          <header>
            <div>
              <h2>Редакция на офертата</h2>
            </div>
            <strong>{completionPercent}% готова</strong>
          </header>
          <nav className="offer-editor-tabs" aria-label="Секции на офертата">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const state = workflowStatus[tab.label];

              return (
                <button className={tab.label === activeTab ? `is-active is-${state.status}` : `is-${state.status}`} type="button" key={tab.label} onClick={() => setActiveTab(tab.label)}>
                  <Icon size={16} aria-hidden="true" />
                  <span>{tab.label}</span>
                  <em>{sectionStatusLabel(state.status, state.percent)}</em>
                </button>
              );
            })}
          </nav>
        </section>

        <div className={activeTab === "Оферта" ? "offer-editor-grid is-offer-tab" : activeTab === "Дати и цени" || activeTab === "Публикуване" || activeTab === "Получени данни" ? "offer-editor-grid is-dates-tab" : "offer-editor-grid"}>
          <div className="offer-editor-main">
            <div hidden={activeTab !== "Оферта"}>
              <OfferContentWorkspace key={contentFormVersion} offer={offer} currentHeroImageUrl={currentHeroImageUrl} onHeroImageChange={setCurrentHeroImageUrl} onDraftChange={setContentDraft} onMediaUploadChange={setIsContentMediaUploading} forceEmptyNewOffer={shouldShowEmptyEditor} formId={contentFormId} />
              {offer.importId ? <SupplierQuickReviewPanel offer={offer} /> : null}
            </div>
            <div hidden={activeTab !== "Дати и цени"}>
              <DatesPricesWorkspace offer={offer} onDraftChange={setDatesDraft} />
            </div>
            {offer.importId ? (
              <div hidden={activeTab !== "Получени данни"}>
                <SupplierApiDataWorkspace offer={offer} />
              </div>
            ) : null}

            <div hidden={activeTab !== "Публикуване"}>
                <section className={canPublish ? "offer-editor-card offer-readiness-card is-ready" : "offer-editor-card offer-readiness-card"}>
                  <header>
                    <div>
                      <h2>Готовност за публикуване</h2>
                      <span>проверява само данни, които са записани и се използват от публичната страница</span>
                    </div>
                    <strong>{canPublish ? "Готова" : `${publishMissing.length} липсващи`}</strong>
                  </header>
                  <div className="offer-readiness-grid">
                    {publishRequirements.map((requirement) => {
                      const Icon = requirement.ok ? CheckCircle2 : XCircle;

                      return (
                        <article className={requirement.ok ? "is-ok" : "is-missing"} key={requirement.label}>
                          <Icon size={18} aria-hidden="true" />
                          <div>
                            <strong>{requirement.label}</strong>
                            <span>{requirement.detail}</span>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                  <footer className="offer-readiness-footer">
                    <p>{canPublish ? "Офертата покрива минималния стандарт за публична страница." : "Попълнете липсващите секции, запазете промените и опитайте отново."}</p>
                    <button className="primary" type="button" onClick={publishChanges} disabled={isPending || !canPublish}>
                      {isPending ? "Публикуване..." : "Публикувай офертата"}
                    </button>
                  </footer>
                </section>

                <section className="offer-editor-card">
                  <header>
                    <h2>Етикети</h2>
                    <span>изберете кой етикет да се показва върху офертата</span>
                  </header>
                  <div className="offer-chip-row">
                    {tagOptions.map((tag) => {
                      const isActive = activeTagLabels.includes(tag.label);

                      return (
                      <button className={isActive ? `offer-chip offer-chip-${tag.tone} is-active` : `offer-chip offer-chip-${tag.tone} is-inactive`} type="button" key={tag.label} onClick={() => toggleTag(tag)} aria-pressed={isActive}>
                        {tag.label}
                        {isActive ? <CircleDot size={12} aria-hidden="true" /> : null}
                      </button>
                      );
                    })}
                    <div className="offer-add-wrap">
                      <button className="offer-chip-add" type="button" onClick={() => setShowTagMenu((value) => !value)} aria-expanded={showTagMenu}>
                        <Plus size={16} aria-hidden="true" />
                        Добави етикет
                      </button>
                      {showTagMenu ? (
                        <div className="offer-add-menu">
                          <label className="offer-add-new">
                            <span>Нов етикет</span>
                            <input value={newTagLabel} onChange={(event) => setNewTagLabel(event.target.value)} onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                saveNewTag();
                              }
                            }} placeholder="Напр. Ранни записвания" />
                            <button type="button" onClick={saveNewTag} disabled={isTagPending || !newTagLabel.trim()}>
                              {isTagPending ? "Записване..." : "Запази етикет"}
                            </button>
                          </label>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </section>

                <section className="offer-editor-card">
                  <header>
                    <h2>Колекции</h2>
                  </header>
                  <div className="offer-chip-row">
                    {availableCollections.map((collection) => {
                      const isActive = collections.includes(collection);

                      return (
                      <button className={isActive ? "offer-collection-chip is-active" : "offer-collection-chip is-inactive"} type="button" key={collection} onClick={() => setCollections((current) => current.includes(collection) ? current.filter((item) => item !== collection) : [...current, collection])} aria-pressed={isActive}>
                        {collection}
                        {isActive ? <CircleDot size={12} aria-hidden="true" /> : null}
                      </button>
                      );
                    })}
                  </div>
                </section>

                <ChoiceSection title="Подходящо за" items={audience} selected={selectedAudience} onToggle={(label) => setSelectedAudience((current) => toggleValue(current, label))} audience />
                <ChoiceSection title="Преживяване" subtitle="Как искаш да се почувстваш?" items={experience} selected={selectedExperience} onToggle={(label) => setSelectedExperience((current) => toggleValue(current, label))} />
                <ChoiceSection title="Интереси" items={interests} selected={selectedInterests} onToggle={(label) => setSelectedInterests((current) => toggleValue(current, label))} />
                <ChoiceSection title="Тип пътуване" items={travelType} selected={selectedTravelType} onToggle={(label) => setSelectedTravelType((current) => toggleValue(current, label))} />

                <section className="offer-editor-card offer-publishing-grid-card">
                  <header>
                    <h2>Показване в сайта</h2>
                    <span>къде и с какъв приоритет участва офертата</span>
                  </header>
                  <div className="offer-publishing-grid">
                    <label>
                      <input type="checkbox" checked={showOnHome} onChange={(event) => setShowOnHome(event.target.checked)} />
                      <span>Покажи на началната страница</span>
                    </label>
                    <label>
                      <input type="checkbox" checked={featuredByRedTours} onChange={(event) => setFeaturedByRedTours(event.target.checked)} />
                      <span>Подбрано от RedTours</span>
                    </label>
                    <label>
                      <input type="checkbox" checked={showInSignature} onChange={(event) => setShowInSignature(event.target.checked)} />
                      <span>Покажи в Red Signature</span>
                    </label>
                    <label>
                      <input type="checkbox" checked={showInPromo} onChange={(event) => setShowInPromo(event.target.checked)} />
                      <span>Покажи в промо секцията</span>
                    </label>
                    <div className="offer-priority">
                      <span>Приоритет</span>
                      <input type="number" value={priority} min={0} max={100} onChange={(event) => setPriority(Number(event.target.value))} />
                    </div>
                  </div>
                  <div className="offer-editor-actions">
                    <button className="secondary" type="button" onClick={savePublishingSettings} disabled={isPending}>
                      <Save size={16} aria-hidden="true" />
                      {isPending ? "Записване..." : "Запази публикуване"}
                    </button>
                  </div>
                </section>

                <form className="offer-editor-card offer-seo-card" action={seoAction}>
                  <input type="hidden" name="slug" value={offer.slug} />
                  <header>
                    <h2>SEO и публичен адрес</h2>
                    <span>тези данни се записват в системата и се използват от публичната страница, Google и social preview</span>
                  </header>
                  <div className="offer-seo-layout">
                    <div className="offer-seo-grid">
                      <label>
                        <span>
                          SEO заглавие
                          <em>{seoTitle.length}/60</em>
                        </span>
                        <input name="seo_meta_title" value={seoTitle} maxLength={70} onChange={(event) => setSeoTitle(event.target.value)} />
                      </label>
                      <label>
                        <span>Публичен URL</span>
                        <div className="offer-slug-field">
                          <strong>/offers/</strong>
                          <input name="seo_slug" value={seoSlug} onChange={(event) => setSeoSlug(event.target.value)} />
                        </div>
                      </label>
                      <label className="is-wide">
                        <span>
                          Meta description
                          <em>{seoDescription.length}/160</em>
                        </span>
                        <textarea name="seo_meta_description" value={seoDescription} maxLength={180} onChange={(event) => setSeoDescription(event.target.value)} />
                      </label>
                      <label>
                        <span>Canonical URL</span>
                        <input name="seo_canonical_url" value={seoCanonicalUrl} placeholder={seoUrlPath} onChange={(event) => setSeoCanonicalUrl(event.target.value)} />
                      </label>
                      <label>
                        <span>Structured data</span>
                        <select name="seo_structured_data_type" value={seoStructuredDataType} onChange={(event) => setSeoStructuredDataType(event.target.value)}>
                          <option value="TouristTrip">TouristTrip + Offer</option>
                          <option value="Product">Product / Offer</option>
                          <option value="Event">Event</option>
                        </select>
                      </label>
                      <label className="is-wide">
                        <span>Ключови думи</span>
                        <input name="seo_keywords" value={seoKeywords} onChange={(event) => setSeoKeywords(event.target.value)} />
                        <small>Предложения: {seoKeywordSuggestions.join(", ")}</small>
                      </label>
                    </div>
                    <aside className="offer-google-preview" aria-label="Google preview">
                      <span>Google preview</span>
                      <h3>{seoTitle || offer.title}</h3>
                      <p className="offer-google-url">redtours.bg{seoUrlPath}</p>
                      <p>{seoDescriptionPreview}</p>
                      <div className="offer-social-preview">
                        {seoPreviewImageUrl ? <img src={seoPreviewImageUrl} alt="" /> : <div className="offer-social-empty"><ImageIcon size={22} aria-hidden="true" /><span>Основната снимка ще се появи след запис</span></div>}
                        <div>
                          <strong>{seoTitle || offer.title}</strong>
                          <small>{seoDescriptionPreview}</small>
                        </div>
                      </div>
                    </aside>
                  </div>
                  <div className="offer-editor-actions">
                    {seoState.message ? <span className={seoState.ok ? "offer-save-message is-ok" : "offer-save-message is-error"}>{seoState.message}</span> : null}
                    <button className="primary" type="submit" disabled={isSeoPending}>
                      <Save size={16} aria-hidden="true" />
                      {isSeoPending ? "Записване..." : "Запази SEO"}
                    </button>
                  </div>
                </form>
            </div>

            {activeTab !== "Оферта" ? (
              <section className="offer-preview-card">
              <header>
                <h2>Предварителен преглед в сайта</h2>
              </header>
              <article>
                <div
                  className={currentHeroImageUrl ? "offer-preview-image" : "offer-preview-image offer-preview-image-empty"}
                  style={currentHeroImageUrl ? { backgroundImage: `linear-gradient(180deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.24)), url("${currentHeroImageUrl}")` } : undefined}
                >
                  {activeTag ? <span>{activeTag.label}</span> : null}
                </div>
                <div className="offer-preview-copy">
                  <h3>{offer.title}</h3>
                  <p>
                    <CalendarDays size={16} aria-hidden="true" />
                    {offer.durationDays} дни / {offer.durationNights} нощувки
                    <MapPin size={16} aria-hidden="true" />
                    {offer.country}, {offer.region}
                  </p>
                  <p>{offer.summary}</p>
                  <div className="offer-preview-tags">
                    {selectedTags.slice(1, 4).map((tag) => (
                      <span key={tag.label}>{tag.label}</span>
                    ))}
                    {selectedExperience.slice(0, 2).map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                </div>
                <div className="offer-preview-price">
                  {offer.priceFrom > 0 ? <span>от</span> : <span />}
                  <strong>{previewPriceLabel}</strong>
                  <button type="button" onClick={() => setIsPreviewOpen(true)}>Виж офертата</button>
                </div>
              </article>
              </section>
            ) : null}
          </div>

        </div>
      </section>

      {showCancelDraftModal ? (
        <div className="offers-modal-backdrop" role="presentation">
          <section className="offers-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="cancel-new-offer-title">
            <header>
              <span>Нова оферта</span>
              <h2 id="cancel-new-offer-title">Да се запази ли като чернова?</h2>
            </header>
            <div>
              <p>
                Ако я запазиш, офертата ще остане в списъка като чернова и можеш да я довършиш по-късно.
                Ако натиснеш „Отказ“, новата оферта ще бъде изтрита.
              </p>
            </div>
            <footer>
              <button type="submit" form={contentFormId} name="after_save" value="admin_offers" formNoValidate className="primary" disabled={isPending}>
                Запази
              </button>
              <button type="button" className="danger" onClick={discardNewDraft} disabled={isPending}>
                Отказ
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {isPreviewOpen ? (
        <div className="offer-editor-full-preview" role="dialog" aria-modal="true" aria-label="Преглед на офертата">
          <div className="offer-editor-full-preview-window">
            <header>
              <strong>Преглед както ще изглежда в сайта</strong>
              <div>
                <a href={`/offers/${offer.slug}`} target="_blank" rel="noreferrer">
                  Отвори публична страница
                  <ExternalLink size={15} aria-hidden="true" />
                </a>
                <button type="button" onClick={() => setIsPreviewOpen(false)}>
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
            </header>
            <div className="offer-editor-full-preview-body">
              <PublicOfferDetail offer={publicPreview} showInquiry={false} />
            </div>
          </div>
        </div>
      ) : null}
    </AdminWorkspace>
  );
}

function UploadBox({
  title,
  hint,
  action,
  uploadSessionId,
  role,
  multiple = false,
  required = false,
  uploadedUrls = [],
  onFilesChange,
  onUploaded
}: {
  title: string;
  hint: string;
  action: string;
  uploadSessionId: string;
  role: "hero" | "gallery";
  multiple?: boolean;
  required?: boolean;
  uploadedUrls?: string[];
  onFilesChange?: (files: File[]) => void;
  onUploaded?: (urls: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "done" | "error">(uploadedUrls.length ? "done" : "idle");
  const [uploadError, setUploadError] = useState("");
  const hasUploadedFiles = uploadedUrls.length > 0;

  const resetFileInput = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? []);
    setFiles(nextFiles);
    setUploadError("");
    onFilesChange?.(nextFiles);

    if (nextFiles.length === 0) {
      if (!multiple) onUploaded?.([]);
      return;
    }

    setUploadState("uploading");

    try {
      const uploadedUrlsFromUpload: string[] = [];

      for (const [index, file] of nextFiles.slice(0, 20).entries()) {
        const uploadFormData = new FormData();
        uploadFormData.set("file", file);
        uploadFormData.set("uploadSessionId", uploadSessionId);
        uploadFormData.set("role", role);
        uploadFormData.set("index", String(index));

        const response = await fetch("/admin/uploads/offer-image", {
          method: "POST",
          body: uploadFormData
        });

        if (!response.ok) {
          const result = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(result?.error || "Файлът не беше качен.");
        }

        const result = (await response.json()) as { url?: string };
        if (result.url) uploadedUrlsFromUpload.push(result.url);
      }

      const nextUploadedUrls = multiple ? [...uploadedUrls, ...uploadedUrlsFromUpload].slice(0, 20) : uploadedUrlsFromUpload.slice(0, 1);
      onUploaded?.(nextUploadedUrls);
      setUploadState("done");
      resetFileInput();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Файлът не беше качен. Провери размера, типа или Storage настройките.");
      if (!multiple) onUploaded?.([]);
      setUploadState("error");
    }
  };

  const removeUploadedUrl = (urlToRemove: string) => {
    const nextUrls = uploadedUrls.filter((url) => url !== urlToRemove);
    setFiles([]);
    setUploadError("");
    setUploadState(nextUrls.length ? "done" : "idle");
    onFilesChange?.([]);
    onUploaded?.(nextUrls);
    resetFileInput();
  };

  const moveUploadedUrl = (urlToMove: string, direction: -1 | 1) => {
    const currentIndex = uploadedUrls.indexOf(urlToMove);
    const nextIndex = currentIndex + direction;

    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= uploadedUrls.length) {
      return;
    }

    const nextUrls = [...uploadedUrls];
    const [item] = nextUrls.splice(currentIndex, 1);
    nextUrls.splice(nextIndex, 0, item);
    onUploaded?.(nextUrls);
  };

  return (
    <div className={hasUploadedFiles ? "offer-new-upload-manager has-files" : "offer-new-upload-manager"}>
      <label className="offer-new-upload">
        <ImageIcon size={30} aria-hidden="true" />
        <strong>{uploadState === "uploading" ? "Качване..." : hasUploadedFiles ? (multiple ? "Добави още снимки" : "Смени снимката") : title}</strong>
        <span>{uploadState === "uploading" ? "Качване към системата..." : files.length > 0 ? files.map((file) => file.name).join(", ") : hint}</span>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple={multiple} required={required && !hasUploadedFiles} onChange={handleFileChange} />
        <span className={`offer-new-upload-action is-${uploadState}`}>
          {uploadState === "uploading" ? "Качва се..." : uploadState === "done" ? "Качено" : uploadState === "error" ? "Грешка при качване" : action}
        </span>
      </label>
      {hasUploadedFiles ? (
        <div className={multiple ? "offer-new-upload-thumbs" : "offer-new-upload-thumbs is-single"}>
          {uploadedUrls.map((url, index) => (
            <figure className="offer-new-upload-thumb" key={`${url}-${index}`}>
              <img src={url} alt={multiple ? `Снимка ${index + 1}` : "Основна снимка"} />
              <figcaption>
                <strong>{multiple ? `Снимка ${index + 1}` : "Основна снимка"}</strong>
                <span>{index === 0 && multiple ? "първа в галерията" : "качена"}</span>
              </figcaption>
              <div>
                {multiple ? (
                  <>
                    <button type="button" onClick={() => moveUploadedUrl(url, -1)} disabled={index === 0} aria-label="Премести снимката наляво">
                      <ArrowLeft size={15} aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => moveUploadedUrl(url, 1)} disabled={index === uploadedUrls.length - 1} aria-label="Премести снимката надясно">
                      <ArrowRight size={15} aria-hidden="true" />
                    </button>
                  </>
                ) : null}
                <button type="button" onClick={() => removeUploadedUrl(url)} aria-label="Изтрий снимката">
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </div>
            </figure>
          ))}
        </div>
      ) : null}
      {uploadError ? <em>{uploadError}</em> : null}
    </div>
  );
}

function OfferContentWorkspace({
  offer,
  currentHeroImageUrl,
  onHeroImageChange,
  onDraftChange,
  onMediaUploadChange,
  forceEmptyNewOffer,
  formId
}: {
  offer: AdminOfferEditorInitialOffer;
  currentHeroImageUrl: string;
  onHeroImageChange: (url: string) => void;
  onDraftChange: (draft: OfferContentDraftSummary) => void;
  onMediaUploadChange: (isUploading: boolean) => void;
  forceEmptyNewOffer: boolean;
  formId: string;
}) {
  const [state, action, isPending] = useActionState(updateOfferContent, { ok: false, message: "" });

  return (
    <OfferContentForm
      action={action}
      headerBadge="Редакция"
      statusMessage={state.message}
      statusOk={state.ok}
      isPending={isPending}
      formId={formId}
      onHeroImageChange={onHeroImageChange}
      onDraftChange={onDraftChange}
      onMediaUploadChange={onMediaUploadChange}
      forceEmptyNewOffer={forceEmptyNewOffer}
      initial={{
        id: offer.id,
        slug: offer.slug,
        productType: forceEmptyNewOffer ? "" : offer.productType,
        productTypeLabel: forceEmptyNewOffer ? "" : offer.productTypeLabel,
        title: offer.title,
        summary: offer.summary,
        description: offer.description,
        country: offer.country,
        region: offer.region,
        destinations: forceEmptyNewOffer ? [] : offer.destinations,
        durationDays: offer.durationDays,
        durationNights: offer.durationNights,
        transport: forceEmptyNewOffer ? "" : offer.transport,
        heroImageUrl: currentHeroImageUrl || offer.heroImageUrl,
        galleryImageUrls: forceEmptyNewOffer ? [] : offer.galleryImageUrls,
        isAuthorProgram: offer.isAuthorProgram,
        itinerary: offer.itinerary,
        highlights: forceEmptyNewOffer ? [] : offer.highlights,
        included: offer.included,
        excluded: offer.excluded
      }}
    />
  );

  const editorRef = useRef<HTMLDivElement>(null);
  const savedSelectionRef = useRef<Range | null>(null);
  const uploadSessionIdRef = useRef(crypto.randomUUID());
  const [productType, setProductType] = useState(offer.productType || "excursion");
  const [productTypeOptions, setProductTypeOptions] = useState(defaultProductTypeOptions);
  const [isProductTypeOpen, setIsProductTypeOpen] = useState(false);
  const [isAddingProductType, setIsAddingProductType] = useState(false);
  const [newProductTypeLabel, setNewProductTypeLabel] = useState("");
  const [productTypeError, setProductTypeError] = useState("");
  const [title, setTitle] = useState(offer.title);
  const [destinations, setDestinations] = useState<DraftDestination[]>([
    { id: "primary", country: offer.country, region: offer.region, city: "" }
  ]);
  const [durationDays, setDurationDays] = useState(String(offer.durationDays || 6));
  const [durationNights, setDurationNights] = useState(String(offer.durationNights || 5));
  const [transport, setTransport] = useState("flight");
  const [summary, setSummary] = useState(offer.summary);
  const [description, setDescription] = useState(offer.description);
  const [heroPreview, setHeroPreview] = useState(offer.heroImageUrl);
  const [heroImageUrl, setHeroImageUrl] = useState(offer.heroImageUrl);
  const [galleryImageUrls, setGalleryImageUrls] = useState<string[]>([]);
  const [activeEditorActions, setActiveEditorActions] = useState<string[]>([]);
  const [editorMode, setEditorMode] = useState<"visual" | "html">("visual");
  const [editorPanel, setEditorPanel] = useState<"format" | "link" | "image" | "more" | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [itineraryDays, setItineraryDays] = useState<EditableItineraryDay[]>(
    offer.itinerary.length
      ? offer.itinerary.map((day) => ({
          id: crypto.randomUUID(),
          day: day.day,
          title: day.title,
          description: day.description,
          accommodation: day.accommodation || "",
          meals: day.meals || "",
          transport: day.transport || ""
        }))
      : [{ id: crypto.randomUUID(), day: 1, title: "", description: "", accommodation: "", meals: "", transport: "" }]
  );
  const [highlights, setHighlights] = useState<EditableHighlight[]>(() =>
    offer.highlights.length
      ? offer.highlights.map((value) => ({ id: crypto.randomUUID(), value }))
      : [{ id: crypto.randomUUID(), value: "" }]
  );

  const renumberItineraryDays = (days: EditableItineraryDay[]) => days.map((day, index) => ({ ...day, day: index + 1 }));
  const updateItineraryDay = (id: string, field: "title" | "description" | "accommodation" | "meals" | "transport", value: string) => {
    setItineraryDays((current) => current.map((day) => (day.id === id ? { ...day, [field]: value } : day)));
  };
  const updateHighlight = (id: string, value: string) => {
    setHighlights((current) => current.map((highlight) => (highlight.id === id ? { ...highlight, value } : highlight)));
  };
  const addHighlight = () => {
    setHighlights((current) => [...current, { id: crypto.randomUUID(), value: "" }]);
  };
  const removeHighlight = (id: string) => {
    setHighlights((current) => (current.length === 1 ? current : current.filter((highlight) => highlight.id !== id)));
  };
  const addItineraryDay = () => {
    setItineraryDays((current) => [...current, { id: crypto.randomUUID(), day: current.length + 1, title: "", description: "", accommodation: "", meals: "", transport: "" }]);
  };
  const removeItineraryDay = (id: string) => {
    setItineraryDays((current) => renumberItineraryDays(current.length === 1 ? current : current.filter((day) => day.id !== id)));
  };
  const [includedServices, setIncludedServices] = useState<EditableServiceItem[]>(
    createServiceItems(offer.included)
  );
  const [excludedServices, setExcludedServices] = useState<EditableServiceItem[]>(
    createServiceItems(offer.excluded)
  );
  const selectedProductType = productTypeOptions.find((option) => option.slug === productType || option.productType === productType) ?? productTypeOptions[0];
  const primaryDestination = destinations[0] ?? { id: "primary", country: "", region: "", city: "" };
  const country = primaryDestination.country;
  const region = primaryDestination.region || primaryDestination.city;
  const derivedSummary = createSummaryFromDescription(description) || summary;
  const routeLabel = destinations
    .map((destination) => [destination.city, destination.region, destination.country].filter(Boolean).join(", "))
    .filter(Boolean)
    .join(" -> ");

  const syncDescription = () => setDescription(editorRef.current?.innerHTML ?? "");
  const saveEditorSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && editorRef.current?.contains(selection.anchorNode)) {
      savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
    }
  };
  const restoreEditorSelection = () => {
    const selection = window.getSelection();
    if (!selection || !savedSelectionRef.current) return;
    selection.removeAllRanges();
    selection.addRange(savedSelectionRef.current);
  };
  const syncEditorState = () => {
    const nextActions = ["bold", "italic", "underline", "insertUnorderedList"].filter((command) => {
      try {
        return document.queryCommandState(command);
      } catch {
        return false;
      }
    });
    setActiveEditorActions(nextActions);
  };
  const runEditorCommand = (command: string, value?: string) => {
    if (editorMode === "html") return;
    editorRef.current?.focus();
    restoreEditorSelection();
    document.execCommand(command, false, value);
    syncDescription();
    syncEditorState();
    saveEditorSelection();
  };
  const openEditorPanel = (panel: "format" | "link" | "image" | "more") => {
    saveEditorSelection();
    setEditorPanel((currentPanel) => (currentPanel === panel ? null : panel));
  };
  const applyLink = () => {
    if (linkUrl.trim()) {
      runEditorCommand("createLink", linkUrl.trim());
      setLinkUrl("");
      setEditorPanel(null);
    }
  };
  const applyImage = () => {
    if (imageUrl.trim()) {
      runEditorCommand("insertImage", imageUrl.trim());
      setImageUrl("");
      setEditorPanel(null);
    }
  };
  const toggleEditorMode = () => {
    if (editorMode === "visual") {
      syncDescription();
      setEditorMode("html");
      setEditorPanel(null);
      return;
    }
    setEditorMode("visual");
    window.requestAnimationFrame(() => {
      if (editorRef.current) editorRef.current.innerHTML = description;
    });
  };
  const isEditorActionActive = (command: string) => activeEditorActions.includes(command);
  const keepEditorSelection = (event: MouseEvent<HTMLButtonElement>) => event.preventDefault();

  useEffect(() => {
    if (editorRef.current && editorMode === "visual") editorRef.current.innerHTML = description;
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetch("/admin/offer-product-types")
      .then((response) => (response.ok ? response.json() : null))
      .then((result: { productTypes?: Array<{ slug: string; label: string; product_type: string; is_system: boolean }> } | null) => {
        if (!isMounted || !result?.productTypes) return;
        setProductTypeOptions(result.productTypes.map((item) => ({ slug: item.slug, label: item.label, productType: item.product_type, isSystem: item.is_system })));
      })
      .catch(() => undefined);
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", syncEditorState);
    return () => document.removeEventListener("selectionchange", syncEditorState);
  }, []);

  const addProductType = async () => {
    const label = newProductTypeLabel.trim();
    if (!label) {
      setProductTypeError("Въведи име на типа.");
      return;
    }
    setProductTypeError("");
    const response = await fetch("/admin/offer-product-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label })
    });
    const result = (await response.json().catch(() => null)) as { productType?: { slug: string; label: string; product_type: string; is_system: boolean }; error?: string } | null;
    if (!response.ok || !result?.productType) {
      setProductTypeError(result?.error || "Типът не беше добавен.");
      return;
    }
    const option = { slug: result.productType.slug, label: result.productType.label, productType: result.productType.product_type, isSystem: result.productType.is_system };
    setProductTypeOptions((current) => [...current.filter((item) => item.slug !== option.slug), option]);
    setProductType(option.slug);
    setNewProductTypeLabel("");
    setIsAddingProductType(false);
    setIsProductTypeOpen(false);
  };

  const updateDestination = (id: string, field: keyof Omit<DraftDestination, "id">, value: string) => {
    setDestinations((current) => current.map((destination) => (destination.id === id ? { ...destination, [field]: value } : destination)));
  };
  const addDestination = () => setDestinations((current) => [...current, { id: crypto.randomUUID(), country: "", region: "", city: "" }]);
  const removeDestination = (id: string) => setDestinations((current) => (current.length === 1 ? current : current.filter((destination) => destination.id !== id)));

  const handleHeroFilesChange = (files: File[]) => {
    setHeroPreview((currentUrl) => {
      if (currentUrl && currentUrl.startsWith("blob:")) URL.revokeObjectURL(currentUrl);
      return files[0] ? URL.createObjectURL(files[0]) : heroImageUrl;
    });
  };

  const updateServiceItem = (type: "included" | "excluded", id: string, label: string) => {
    const setter = type === "included" ? setIncludedServices : setExcludedServices;
    setter((current) => current.map((item) => (item.id === id ? { ...item, label } : item)));
  };
  const addServiceItem = (type: "included" | "excluded") => {
    const setter = type === "included" ? setIncludedServices : setExcludedServices;
    setter((current) => [...current, { id: crypto.randomUUID(), label: "" }]);
  };
  const removeServiceItem = (type: "included" | "excluded", id: string) => {
    const setter = type === "included" ? setIncludedServices : setExcludedServices;
    setter((current) => (current.length === 1 ? current : current.filter((item) => item.id !== id)));
  };

  return (
    <div className="offer-new-layout">
      <form className="offer-new-form" action={action} encType="multipart/form-data">
      <input type="hidden" name="slug" value={offer.slug} />
      <section className="offer-new-card">
        <header className="offer-new-card-header">
          <div>
            <span>Редакция</span>
            <h2>Данни за офертата</h2>
          </div>
        </header>

        <div className="offer-new-form-grid">
          <label>
            <span>Тип оферта <b>*</b></span>
            <input type="hidden" name="product_type" value={selectedProductType.productType} />
            <input type="hidden" name="product_type_label" value={selectedProductType.label} />
            <div className="offer-new-custom-select">
              <button type="button" onClick={() => setIsProductTypeOpen((value) => !value)} aria-expanded={isProductTypeOpen}>
                <Plane size={18} aria-hidden="true" />
                <span>{selectedProductType.label}</span>
                <ChevronDown size={16} aria-hidden="true" />
              </button>
              {isProductTypeOpen ? (
                <div className="offer-new-custom-select-menu">
                  {productTypeOptions.map((option) => (
                    <button
                      className={option.slug === productType || option.productType === productType ? "is-selected" : ""}
                      type="button"
                      key={option.slug}
                      onClick={() => {
                        setProductType(option.slug);
                        setIsProductTypeOpen(false);
                        setIsAddingProductType(false);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                  {isAddingProductType ? (
                    <div className="offer-new-custom-type-form">
                      <input value={newProductTypeLabel} onChange={(event) => setNewProductTypeLabel(event.target.value)} placeholder="Нов тип оферта" autoFocus />
                      <button type="button" onClick={addProductType}>Добави</button>
                      {productTypeError ? <span>{productTypeError}</span> : null}
                    </div>
                  ) : (
                    <button className="is-add-option" type="button" onClick={() => setIsAddingProductType(true)}>+ Добави</button>
                  )}
                </div>
              ) : null}
            </div>
          </label>
          <label className="offer-new-title-field">
            <span className="offer-new-label-line">
              <span>Заглавие <b>*</b></span>
              <em>{title.length}/100</em>
            </span>
            <div className="offer-new-counted-input">
              <input name="title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Напр. Кападокия - магията на балоните" required maxLength={100} />
            </div>
          </label>
          <input type="hidden" name="source" value="manual" />
          <input type="hidden" name="country" value={country} />
          <input type="hidden" name="region" value={region} />

          <div className="offer-new-destinations offer-new-full-field">
            <header>
              <div>
                <span>Дестинации <b>*</b></span>
                <p>Добавете една или повече държави и региони в реда на маршрута.</p>
              </div>
              <button type="button" onClick={addDestination}>
                <Plus size={16} aria-hidden="true" />
                Добави
              </button>
            </header>
            <datalist id="offer-editor-country-options">
              {countryNames.map((name) => (
                <option value={name} key={name} />
              ))}
            </datalist>
            <div className="offer-new-destination-list">
              {destinations.map((destination, index) => (
                <div className="offer-new-destination-row" key={destination.id}>
                  <strong>{index === 0 ? "Основна" : `Стоп ${index + 1}`}</strong>
                  <label>
                    <span>Държава {index === 0 ? <b>*</b> : null}</span>
                    <input name="destination_country" value={destination.country} onChange={(event) => updateDestination(destination.id, "country", event.target.value)} list="offer-editor-country-options" placeholder="Започнете да пишете" required={index === 0} />
                  </label>
                  <label>
                    <span>Регион / дестинация {index === 0 ? <b>*</b> : null}</span>
                    <input name="destination_region" value={destination.region} onChange={(event) => updateDestination(destination.id, "region", event.target.value)} placeholder="Напр. Кападокия" required={index === 0} />
                  </label>
                  <label>
                    <span>Град</span>
                    <input name="destination_city" value={destination.city} onChange={(event) => updateDestination(destination.id, "city", event.target.value)} placeholder="По желание" />
                  </label>
                  <button type="button" onClick={() => removeDestination(destination.id)} disabled={destinations.length === 1} aria-label="Премахни дестинация">
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <label className="offer-new-field">
            <span>Авторска програма</span>
            <div className="offer-new-radio-panel">
              <label>
                <input type="radio" name="is_author_program" value="yes" defaultChecked={offer.isAuthorProgram} />
                <span>Да</span>
              </label>
              <label>
                <input type="radio" name="is_author_program" value="no" defaultChecked={!offer.isAuthorProgram} />
                <span>Не</span>
              </label>
            </div>
          </label>

          <label>
            <span>Продължителност <b>*</b></span>
            <div className="offer-new-duration">
              <input name="duration_days" value={durationDays} onChange={(event) => setDurationDays(event.target.value)} inputMode="numeric" required />
              <span>дни</span>
              <input name="duration_nights" value={durationNights} onChange={(event) => setDurationNights(event.target.value)} inputMode="numeric" />
              <span>нощувки</span>
            </div>
          </label>
          <label>
            <span>Транспорт <b>*</b></span>
            <select name="transport" value={transport} onChange={(event) => setTransport(event.target.value)}>
              <option value="flight">Самолет</option>
              <option value="bus">Автобус</option>
              <option value="own_transport">Собствен транспорт</option>
              <option value="mixed">Комбинирано</option>
            </select>
          </label>

          <div className="offer-new-field">
            <span>Основна снимка <b>*</b></span>
            <UploadBox
              title="Качи основна снимка"
              hint="PNG, JPG или WEBP, макс. 5MB"
              action="Избери файл"
              uploadSessionId={uploadSessionIdRef.current}
              role="hero"
              required={!heroImageUrl}
              uploadedUrls={heroImageUrl ? [heroImageUrl] : []}
              onFilesChange={handleHeroFilesChange}
              onUploaded={(urls) => {
                setHeroImageUrl(urls[0] ?? "");
                setHeroPreview(urls[0] ?? "");
              }}
            />
            <input type="hidden" name="hero_image_url" value={heroImageUrl} />
          </div>
          <div className="offer-new-field">
            <span>Галерия (до 20 снимки)</span>
            <UploadBox title="Качи още снимки" hint="или плъзнете файловете тук" action="Избери файлове" uploadSessionId={uploadSessionIdRef.current} role="gallery" multiple uploadedUrls={galleryImageUrls} onUploaded={setGalleryImageUrls} />
            {galleryImageUrls.map((url) => (
              <input type="hidden" name="gallery_image_urls" value={url} key={url} />
            ))}
          </div>
        </div>

        <input type="hidden" name="summary" value={derivedSummary} />
        <div className="offer-new-full-field">
          <span>Представяне <b>*</b></span>
          <div className="offer-new-editor">
            <div className="offer-new-editor-toolbar">
              <button className={editorPanel === "format" ? "is-active" : ""} type="button" onMouseDown={keepEditorSelection} onClick={() => openEditorPanel("format")}>
                Paragraph <ChevronDown size={15} aria-hidden="true" />
              </button>
              <button className={isEditorActionActive("bold") ? "is-active" : ""} type="button" aria-label="Bold" onMouseDown={keepEditorSelection} onClick={() => runEditorCommand("bold")}><Bold size={18} aria-hidden="true" /></button>
              <button className={isEditorActionActive("italic") ? "is-active" : ""} type="button" aria-label="Italic" onMouseDown={keepEditorSelection} onClick={() => runEditorCommand("italic")}><Italic size={18} aria-hidden="true" /></button>
              <button className={isEditorActionActive("underline") ? "is-active" : ""} type="button" aria-label="Underline" onMouseDown={keepEditorSelection} onClick={() => runEditorCommand("underline")}><Underline size={18} aria-hidden="true" /></button>
              <button className={isEditorActionActive("insertUnorderedList") ? "is-active" : ""} type="button" aria-label="Bulleted list" onMouseDown={keepEditorSelection} onClick={() => runEditorCommand("insertUnorderedList")}><List size={18} aria-hidden="true" /></button>
              <button className={editorPanel === "link" ? "is-active" : ""} type="button" aria-label="Link" onMouseDown={keepEditorSelection} onClick={() => openEditorPanel("link")}><Link2 size={18} aria-hidden="true" /></button>
              <button className={editorPanel === "image" ? "is-active" : ""} type="button" aria-label="Image" onMouseDown={keepEditorSelection} onClick={() => openEditorPanel("image")}><ImageIcon size={18} aria-hidden="true" /></button>
              <button className={editorPanel === "more" ? "is-active" : ""} type="button" aria-label="More" onMouseDown={keepEditorSelection} onClick={() => openEditorPanel("more")}><MoreHorizontal size={18} aria-hidden="true" /></button>
              <button className={editorMode === "html" ? "is-active" : ""} type="button" aria-label="HTML" onMouseDown={keepEditorSelection} onClick={toggleEditorMode}><Code2 size={18} aria-hidden="true" /></button>
            </div>
            {editorPanel ? (
              <div className="offer-new-editor-panel">
                {editorPanel === "format" ? (
                  <>
                    <button type="button" onMouseDown={keepEditorSelection} onClick={() => { runEditorCommand("formatBlock", "p"); setEditorPanel(null); }}>Paragraph</button>
                    <button type="button" onMouseDown={keepEditorSelection} onClick={() => { runEditorCommand("formatBlock", "h2"); setEditorPanel(null); }}>Heading 2</button>
                    <button type="button" onMouseDown={keepEditorSelection} onClick={() => { runEditorCommand("formatBlock", "h3"); setEditorPanel(null); }}>Heading 3</button>
                    <button type="button" onMouseDown={keepEditorSelection} onClick={() => { runEditorCommand("formatBlock", "blockquote"); setEditorPanel(null); }}>Quote</button>
                  </>
                ) : null}
                {editorPanel === "link" ? <div className="offer-new-editor-inline-form"><input value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://..." /><button type="button" onClick={applyLink}>Добави линк</button></div> : null}
                {editorPanel === "image" ? <div className="offer-new-editor-inline-form"><input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="URL на изображение" /><button type="button" onClick={applyImage}>Добави снимка</button></div> : null}
                {editorPanel === "more" ? (
                  <>
                    <button type="button" onMouseDown={keepEditorSelection} onClick={() => runEditorCommand("removeFormat")}>Изчисти форматирането</button>
                    <button type="button" onMouseDown={keepEditorSelection} onClick={() => runEditorCommand("insertHorizontalRule")}>Разделител</button>
                    <button type="button" onMouseDown={keepEditorSelection} onClick={() => runEditorCommand("formatBlock", "blockquote")}>Цитат</button>
                  </>
                ) : null}
              </div>
            ) : null}
            {editorMode === "visual" ? (
              <div ref={editorRef} className="offer-new-editor-surface" contentEditable role="textbox" aria-multiline="true" data-placeholder={presentationPlaceholder} suppressContentEditableWarning onInput={() => { syncDescription(); saveEditorSelection(); }} onKeyUp={() => { syncEditorState(); saveEditorSelection(); }} onMouseUp={() => { syncEditorState(); saveEditorSelection(); }} />
            ) : (
              <textarea className="offer-new-editor-html" value={description} onChange={(event) => setDescription(event.target.value)} placeholder={presentationPlaceholder} spellCheck={false} />
            )}
            <input type="hidden" name="description" value={description} />
          </div>
        </div>
          <section className="offer-itinerary-editor">
            <header>
              <div>
                <h3>Програма по дни</h3>
                <p>Всеки ден се записва отделно, за да може сайтът да го показва като красив маршрут.</p>
              </div>
            </header>
            <div className="offer-itinerary-list">
              {itineraryDays.map((day) => (
                <article className="offer-itinerary-row" key={day.id}>
                  <div className="offer-itinerary-day-number">
                    <span>Ден</span>
                    <strong>{day.day}</strong>
                    <input type="hidden" name="itinerary_day_number" value={day.day} />
                  </div>
                  <label className="offer-edit-field">
                    <span>Заглавие за деня</span>
                    <input
                      name="itinerary_title"
                      value={day.title}
                      onChange={(event) => updateItineraryDay(day.id, "title", event.target.value)}
                      placeholder="Напр. София - Истанбул"
                    />
                  </label>
                  <label className="offer-edit-field is-wide">
                    <span>Описание</span>
                    <textarea
                      name="itinerary_description"
                      value={day.description}
                      onChange={(event) => updateItineraryDay(day.id, "description", event.target.value)}
                      placeholder="Описание на деня, основните места, преживяванията и логистиката."
                      rows={4}
                    />
                  </label>
                  <div className="offer-itinerary-logistics">
                    <label className="offer-edit-field">
                      <span>Настаняване</span>
                      <input
                        name="itinerary_accommodation"
                        value={day.accommodation}
                        onChange={(event) => updateItineraryDay(day.id, "accommodation", event.target.value)}
                        placeholder="хотел/категория"
                      />
                    </label>
                    <label className="offer-edit-field">
                      <span>Хранене</span>
                      <input
                        name="itinerary_meals"
                        value={day.meals}
                        onChange={(event) => updateItineraryDay(day.id, "meals", event.target.value)}
                        placeholder="включено хранене"
                      />
                    </label>
                    <label className="offer-edit-field">
                      <span>Транспорт</span>
                      <input
                        name="itinerary_transport"
                        value={day.transport}
                        onChange={(event) => updateItineraryDay(day.id, "transport", event.target.value)}
                        placeholder="вид транспорт"
                      />
                    </label>
                  </div>
                  <button type="button" onClick={() => removeItineraryDay(day.id)} disabled={itineraryDays.length === 1} aria-label="Премахни ден">
                    <X size={16} aria-hidden="true" />
                  </button>
                </article>
              ))}
            </div>
            <div className="offer-itinerary-add-row">
              <button type="button" onClick={addItineraryDay}>
                <Plus size={16} aria-hidden="true" />
                Добави ден
              </button>
            </div>
          </section>

          <section className="offer-highlights-editor">
            <header>
              <div>
                <h3>Защо ще харесате това пътуване</h3>
                <p>Акцентите трябва да описват реални преживявания, а не общи твърдения. Вместо „Незабравимо преживяване“: „Посрещане на изгрева над храмовете на Баган“.</p>
              </div>
            </header>
            <div className="offer-highlights-list">
              {highlights.map((highlight, index) => (
                <div className="offer-highlight-field" key={highlight.id}>
                  <span>{index + 1}</span>
                  <label>
                    <input name="highlights" value={highlight.value} onChange={(event) => updateHighlight(highlight.id, event.target.value)} placeholder={`Конкретен акцент ${index + 1}`} />
                  </label>
                  <button type="button" onClick={() => removeHighlight(highlight.id)} disabled={highlights.length === 1} aria-label="Премахни акцент"><X size={16} aria-hidden="true" /></button>
                </div>
              ))}
            </div>
            <div className="offer-highlights-add-row">
              <button type="button" onClick={addHighlight}><Plus size={16} aria-hidden="true" />Добави акцент</button>
            </div>
          </section>

          <section className="offer-services-editor">
            <header>
              <div>
                <h3>Услуги и условия в цената</h3>
                <p>Разделете включеното и невключеното, за да се визуализира чисто в сайта.</p>
              </div>
            </header>
            <div className="offer-services-columns">
              <div className="offer-service-list">
                <header>
                  <strong>Цената включва</strong>
                  <button type="button" onClick={() => addServiceItem("included")}>
                    <Plus size={15} aria-hidden="true" />
                    Добави
                  </button>
                </header>
                {includedServices.map((item, index) => (
                  <label className="offer-service-row" key={item.id}>
                    <span>{index + 1}</span>
                    <input
                      name="included_services"
                      value={item.label}
                      onChange={(event) => updateServiceItem("included", item.id, event.target.value)}
                      placeholder={`Напр. ${defaultIncludedServices[index] || "конкретна включена услуга"}`}
                    />
                    <button type="button" onClick={() => removeServiceItem("included", item.id)} disabled={includedServices.length === 1} aria-label="Премахни включена услуга">
                      <X size={15} aria-hidden="true" />
                    </button>
                  </label>
                ))}
              </div>

              <div className="offer-service-list">
                <header>
                  <strong>Цената не включва</strong>
                  <button type="button" onClick={() => addServiceItem("excluded")}>
                    <Plus size={15} aria-hidden="true" />
                    Добави
                  </button>
                </header>
                {excludedServices.map((item, index) => (
                  <label className="offer-service-row" key={item.id}>
                    <span>{index + 1}</span>
                    <input
                      name="excluded_services"
                      value={item.label}
                      onChange={(event) => updateServiceItem("excluded", item.id, event.target.value)}
                      placeholder={`Напр. ${defaultExcludedServices[index] || "конкретна невключена услуга"}`}
                    />
                    <button type="button" onClick={() => removeServiceItem("excluded", item.id)} disabled={excludedServices.length === 1} aria-label="Премахни невключена услуга">
                      <X size={15} aria-hidden="true" />
                    </button>
                  </label>
                ))}
              </div>
            </div>
          </section>

        <footer className="offer-new-footer">
          {state.message ? <span className={state.ok ? "offer-save-message is-ok" : "offer-save-message is-error"}>{state.message}</span> : <span />}
          <div>
            <button type="submit" formNoValidate>Запази чернова</button>
            <button className="primary" type="submit" name="after_save" value="dates_prices" disabled={isPending}>
              {isPending ? "Записване..." : "Запази и продължи"}
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          </div>
        </footer>
      </section>
      </form>

      <aside className="offer-new-side">
        <section className="offer-new-preview">
          <header>
            <h2>Преглед на картата</h2>
          </header>
          <article>
            <div
              className={heroPreview ? "offer-new-preview-image" : "offer-new-preview-image is-empty"}
              style={heroPreview ? { backgroundImage: `linear-gradient(180deg, rgba(0, 0, 0, 0.02), rgba(0, 0, 0, 0.16)), url("${heroPreview}")` } : undefined}
            >
              <span>{selectedProductType.label}</span>
              {!heroPreview ? (
                <div>
                  <ImageIcon size={34} aria-hidden="true" />
                  <strong>Основната снимка ще се покаже тук</strong>
                </div>
              ) : null}
            </div>
            <div className="offer-new-preview-copy">
              <h3>{title || "Заглавие на офертата"}</h3>
              <p>
                <CalendarDays size={15} aria-hidden="true" />
                {durationDays || "0"} дни / {durationNights || "0"} нощувки
                <MapPin size={15} aria-hidden="true" />
                {routeLabel || "Маршрут"}
              </p>
              <span>{summary || "Кратко описание ще се визуализира тук..."}</span>
            </div>
          </article>
        </section>
      </aside>
    </div>
  );
}

function SupplierQuickReviewPanel({ offer }: { offer: AdminOfferEditorInitialOffer }) {
  const [state, formAction, isPending] = useActionState(updateOfferSupplierApiReview, { ok: true, message: "" });
  const reviewTypes = ["hotel", "additional_service", "useful_info", "payment_policy", "cancel_policy", "insurance", "service"];
  const groups = reviewTypes
    .map((type) => ({
      type,
      items: offer.supplierEntities.filter((entity) => entity.type === type)
    }))
    .filter((group) => group.items.length > 0);
  const visibleItems = groups.flatMap((group) => group.items.slice(0, 8));
  const totalCount = groups.reduce((sum, group) => sum + group.items.length, 0);

  if (!groups.length) return null;

  return (
    <form className="offer-editor-card offer-supplier-quick" action={formAction}>
      <input type="hidden" name="slug" value={offer.slug} />
      <input type="hidden" name="import_id" value={offer.importId || ""} />
      <header>
        <div>
          <h2>Още от доставчика</h2>
          <span>Хотели, допълнителни услуги, условия и пояснения, които са част от офертата и трябва да се прегледат.</span>
        </div>
        <a href={`/admin/offers/${offer.slug}?tab=api-data`}>Пълен списък</a>
      </header>

      <div className="offer-supplier-quick-summary">
        {groups.map((group) => (
          <span key={group.type}>
            <strong>{group.items.length}</strong>
            {supplierEntityTypeLabel(group.type)}
          </span>
        ))}
      </div>

      <div className="offer-supplier-quick-list">
        {groups.map((group) => (
          <section key={group.type}>
            <h3>{supplierEntityTypeLabel(group.type)}</h3>
            <div>
              {group.items.slice(0, 8).map((entity) => (
                <article className={entity.isEnabled ? "is-enabled" : ""} key={entity.id}>
                  <input type="hidden" name="entity_ids" value={entity.id} />
                  <input type="hidden" name={`entity_public_section_${entity.id}`} value={supplierEntityPublicSection(entity)} />
                  <input type="hidden" name={`entity_url_${entity.id}`} value={supplierEntityEditableUrl(entity)} />
                  <input type="hidden" name={`entity_notes_${entity.id}`} value={supplierEntityNotes(entity)} />
                  <div className="offer-supplier-quick-row">
                    <label className="offer-api-entity-toggle">
                      <input name="enabled_entity_ids" type="checkbox" value={entity.id} defaultChecked={entity.isEnabled} />
                      <span>Използвай</span>
                    </label>
                    <div>
                      <strong>{supplierEntityMainText(entity)}</strong>
                      <span>{supplierEntityEditableText(entity) || "Няма допълнителен текст."}</span>
                    </div>
                  </div>
                  <details>
                    <summary>Редактирай</summary>
                    <div className="offer-supplier-quick-edit">
                      <input name={`entity_title_${entity.id}`} defaultValue={supplierEntityMainText(entity)} aria-label="Заглавие" />
                      <textarea name={`entity_text_${entity.id}`} defaultValue={supplierEntityEditableText(entity)} rows={3} aria-label="Текст" />
                    </div>
                  </details>
                </article>
              ))}
              {group.items.length > 8 ? (
                <p>Има още {group.items.length - 8} елемента в тази група. Отвори пълния списък за преглед на всички.</p>
              ) : null}
            </div>
          </section>
        ))}
      </div>

      {state.message ? <p className={state.ok ? "offer-editor-feedback" : "offer-editor-feedback is-error"}>{state.message}</p> : null}
      <footer>
        <span>{visibleItems.length} от {totalCount} показани тук</span>
        <button type="submit" disabled={isPending}>
          <Save size={16} aria-hidden="true" />
          {isPending ? "Запазване..." : "Запази прегледа"}
        </button>
      </footer>
    </form>
  );
}

function SupplierApiDataWorkspace({ offer }: { offer: AdminOfferEditorInitialOffer }) {
  const [state, formAction, isPending] = useActionState(updateOfferSupplierApiReview, { ok: true, message: "" });
  const groupedEntities = offer.supplierEntities.reduce<Record<string, AdminOfferEditorInitialOffer["supplierEntities"]>>((groups, entity) => {
    groups[entity.type] = groups[entity.type] || [];
    groups[entity.type].push(entity);
    return groups;
  }, {});
  const preferredOrder = ["image", "departure", "itinerary_day", "hotel", "service", "additional_service", "useful_info", "payment_policy", "cancel_policy", "insurance", "main_details", "details_root"];
  const groupOrder = [
    ...preferredOrder.filter((type) => groupedEntities[type]?.length),
    ...Object.keys(groupedEntities).filter((type) => !preferredOrder.includes(type)).sort()
  ];
  const enabledCount = offer.supplierEntities.filter((entity) => entity.isEnabled).length;
  const rawPayloadPreview = supplierEntityPreview(offer.importRawPayload, 1800);

  return (
    <form className="offer-workflow-stack" action={formAction}>
      <input type="hidden" name="slug" value={offer.slug} />
      <input type="hidden" name="import_id" value={offer.importId || ""} />
      <section className="offer-editor-card offer-api-source-card">
        <header>
          <div>
            <h2>Получени данни</h2>
            <span>Преглед на всичко, което е дошло от доставчика. Избираш кое да се използва и после го прилагаме към красивия шаблон.</span>
          </div>
          <a href={`/admin/supplier-imports/${offer.importId}`}>
            <ExternalLink size={16} aria-hidden="true" />
            Отвори импорт прегледа
          </a>
        </header>

        <div className="offer-api-source-summary">
          <span><strong>{offer.supplierEntities.length}</strong> разпознати елемента</span>
          <span><strong>{enabledCount}</strong> включени в review</span>
          <span><strong>{groupOrder.length}</strong> групи</span>
          <span><strong>{supplierRawPayloadSize(offer.importRawPayload).toLocaleString("bg-BG")}</strong> raw символа</span>
        </div>
        {state.message ? <p className={state.ok ? "offer-editor-feedback" : "offer-editor-feedback is-error"}>{state.message}</p> : null}
      </section>

      {groupOrder.length ? (
        <section className="offer-editor-card offer-api-entity-groups">
          {groupOrder.map((type) => {
            const entities = groupedEntities[type] || [];
            const Icon = supplierEntityIcon(type);

            return (
              <article className="offer-api-entity-group" key={type}>
                <header>
                  <div>
                    <Icon size={18} aria-hidden="true" />
                    <h3>{supplierEntityTypeLabel(type)}</h3>
                  </div>
                  <strong>{entities.length}</strong>
                </header>

                <div>
                  {entities.map((entity) => (
                    <article className={entity.isEnabled ? "offer-api-entity is-enabled" : "offer-api-entity"} key={entity.id}>
                      <input type="hidden" name="entity_ids" value={entity.id} />
                      <div className="offer-api-entity-top">
                        <label className="offer-api-entity-toggle">
                          <input name="enabled_entity_ids" type="checkbox" value={entity.id} defaultChecked={entity.isEnabled} />
                          <span>Използвай</span>
                        </label>
                        <div>
                          <strong>{supplierEntityMainText(entity)}</strong>
                          <span>
                            {[entity.key, entity.startDate, entity.price ? `${Number(entity.price).toLocaleString("bg-BG")} ${entity.currency || offer.currency}` : ""].filter(Boolean).join(" · ") || "без допълнителен етикет"}
                          </span>
                        </div>
                      </div>

                      <details className="offer-api-edit-details">
                        <summary>Редакция и използване</summary>
                        <div className="offer-api-edit-grid">
                          <label>
                            <span>Къде да се използва</span>
                            <select name={`entity_public_section_${entity.id}`} defaultValue={supplierEntityPublicSection(entity)}>
                              <option value="overview">Представяне</option>
                              <option value="itinerary">Програма</option>
                              <option value="dates">Дати и цени</option>
                              <option value="accommodation">Настаняване / хотели</option>
                              <option value="services">Услуги</option>
                              <option value="extras">Допълнителни услуги</option>
                              <option value="conditions">Условия и важно</option>
                              <option value="media">Снимки</option>
                              <option value="internal">Само вътрешно</option>
                            </select>
                          </label>
                          <label className="is-wide">
                            <span>Редактирано заглавие</span>
                            <input name={`entity_title_${entity.id}`} defaultValue={supplierEntityMainText(entity)} />
                          </label>
                          <label className="is-wide">
                            <span>Текст за използване</span>
                            <textarea name={`entity_text_${entity.id}`} defaultValue={supplierEntityEditableText(entity)} rows={4} />
                          </label>
                          <label>
                            <span>URL / снимка</span>
                            <input name={`entity_url_${entity.id}`} defaultValue={supplierEntityEditableUrl(entity)} />
                          </label>
                          <label>
                            <span>Вътрешна бележка</span>
                            <input name={`entity_notes_${entity.id}`} defaultValue={supplierEntityNotes(entity)} placeholder="Как да се използва този блок" />
                          </label>
                        </div>

                        {entity.url ? (
                          <a className="offer-api-entity-link" href={entity.url} target="_blank" rel="noreferrer">
                            <ExternalLink size={14} aria-hidden="true" />
                            {entity.url}
                          </a>
                        ) : null}

                        {entity.editorialTitle || entity.editorialUrl || Object.keys(entity.editorialData || {}).length ? (
                          <div className="offer-api-editorial-data">
                            {entity.editorialTitle ? <span>Редактирано заглавие: <strong>{entity.editorialTitle}</strong></span> : null}
                            {entity.editorialUrl ? <span>Редактиран URL: <strong>{entity.editorialUrl}</strong></span> : null}
                            {Object.keys(entity.editorialData || {}).length ? <span>Има editorial данни</span> : null}
                          </div>
                        ) : null}
                      </details>

                      <details className="offer-api-raw-details">
                        <summary>Технически данни</summary>
                        <pre>{supplierEntityPreview(entity.rawData)}</pre>
                      </details>
                    </article>
                  ))}
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="offer-editor-card offer-api-empty">
          <Code2 size={24} aria-hidden="true" />
          <strong>Няма разпознати supplier entities</strong>
          <span>Raw payload-ът пак е запазен по-долу, но импортът още не е разбил данните на отделни блокове.</span>
        </section>
      )}

      <section className="offer-editor-card offer-api-raw-payload">
        <header>
          <div>
            <h2>Пълен raw payload</h2>
            <span>Оригиналният отговор от API-то е референцията, към която сравняваме мапинга.</span>
          </div>
        </header>
        <details>
          <summary>Покажи суровия JSON</summary>
          <pre>{rawPayloadPreview}</pre>
        </details>
      </section>
      <div className="offer-workflow-footer">
        <div>
          <button type="submit" disabled={isPending}>
            <Save size={16} aria-hidden="true" />
            {isPending ? "Запазване..." : "Запази API прегледа"}
          </button>
        </div>
      </div>
    </form>
  );
}

function DatesPricesWorkspace({
  offer,
  onDraftChange
}: {
  offer: AdminOfferEditorInitialOffer;
  onDraftChange: (draft: DatesPricesDraftSummary) => void;
}) {
  type DepartureDraft = {
    key: string;
    id: string;
    label: string;
    startDate: string;
    endDate: string;
    departurePoints: string;
    seatsTotal: string;
    seatsConfirmed: string;
    seatsOption: string;
    seatsAvailable: string;
    priceFrom: string;
    currency: "EUR" | "BGN" | "";
    priceStatus: string;
    optionUntil: string;
    availability: string;
    depositAmount: string;
    paymentDueDays: string;
    notes: string;
  };

  const createEmptyDeparture = (): DepartureDraft => ({
    key: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    id: "",
    label: "",
    startDate: "",
    endDate: "",
    departurePoints: "",
    seatsTotal: "",
    seatsConfirmed: "",
    seatsOption: "",
    seatsAvailable: "",
    priceFrom: "",
    currency: "EUR",
    priceStatus: "budgetary",
    optionUntil: "",
    availability: "on_request",
    depositAmount: "",
    paymentDueDays: "",
    notes: ""
  });

  const [state, formAction, isPending] = useActionState(updateOfferDatesPrices, { ok: true, message: "" });
  const [departures, setDepartures] = useState<DepartureDraft[]>(
    offer.dates.length
      ? offer.dates.map((date) => ({
          key: date.id,
          id: date.id,
          label: date.label || "",
          startDate: date.startDate || "",
          endDate: date.endDate || "",
          departurePoints: date.departurePoints || "",
          seatsTotal: date.seatsTotal === null ? "" : String(date.seatsTotal),
          seatsConfirmed: date.seatsConfirmed === null ? "" : String(date.seatsConfirmed),
          seatsOption: date.seatsOption === null ? "" : String(date.seatsOption),
          seatsAvailable: date.seatsAvailable === null ? "" : String(date.seatsAvailable),
          priceFrom: date.priceFrom || "",
          currency: date.currency || "EUR",
          priceStatus: date.priceStatus || "budgetary",
          optionUntil: date.optionUntil ? date.optionUntil.slice(0, 16) : "",
          availability: date.availability || "on_request",
          depositAmount: date.depositAmount || "",
          paymentDueDays: date.paymentDueDays === null ? "" : String(date.paymentDueDays),
          notes: date.notes || ""
        }))
      : []
  );

  const updateDeparture = (key: string, field: keyof DepartureDraft, value: string) => {
    setDepartures((current) => current.map((departure) => (departure.key === key ? { ...departure, [field]: value } : departure)));
  };

  const removeDeparture = (key: string) => {
    setDepartures((current) => {
      const target = current.find((departure) => departure.key === key);
      if (target?.id) {
        return current.map((departure) => (departure.key === key ? { ...departure, availability: "sold_out" } : departure));
      }

      const next = current.filter((departure) => departure.key !== key);
      return next;
    });
  };

  const activeDepartures = useMemo(() => departures.filter((departure) => departure.availability !== "sold_out"), [departures]);
  const prices = useMemo(() => activeDepartures.map((departure) => Number(departure.priceFrom)).filter((price) => Number.isFinite(price) && price > 0), [activeDepartures]);
  const lowestPrice = prices.length ? Math.min(...prices) : offer.priceFrom;
  const totalSeats = activeDepartures.reduce((sum, departure) => sum + (Number.parseInt(departure.seatsTotal, 10) || 0), 0);
  const confirmedSeats = activeDepartures.reduce((sum, departure) => sum + (Number.parseInt(departure.seatsConfirmed, 10) || 0), 0);
  const optionSeats = activeDepartures.reduce((sum, departure) => sum + (Number.parseInt(departure.seatsOption, 10) || 0), 0);
  const requestOnlyCount = activeDepartures.filter((departure) => !Number(departure.priceFrom)).length;
  const isImportedOffer = Boolean(offer.importId);
  const availabilityLabels: Record<string, string> = {
    available: "Активно",
    limited: "Последни места",
    on_request: "По заявка",
    sold_out: "Спряно"
  };
  const priceStatusLabels: Record<string, string> = {
    fixed: "Фиксирана цена",
    option_until: "Опция до дата",
    dynamic: "Динамична цена",
    budgetary: "Ориентировъчна цена"
  };
  const formatImportedDate = (value: string) => {
    if (!value) return "Без дата";
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString("bg-BG", { day: "2-digit", month: "2-digit", year: "numeric" });
  };
  const getDepartureLabel = (departure: DepartureDraft) => {
    if (departure.label.trim()) return departure.label.trim();
    if (departure.startDate && departure.endDate) return `${departure.startDate} - ${departure.endDate}`;
    if (departure.startDate) return departure.startDate;
    if (departure.endDate) return `до ${departure.endDate}`;
    return "Дати по заявка";
  };

  useEffect(() => {
    onDraftChange({
      priceFrom: lowestPrice,
      currency: prices.length ? (activeDepartures.find((departure) => Number(departure.priceFrom) === lowestPrice)?.currency || offer.currency || "EUR") as "EUR" | "BGN" : offer.currency,
      dates: activeDepartures.length
        ? activeDepartures.map((departure) => ({
            label: getDepartureLabel(departure),
            startDate: departure.startDate,
            endDate: departure.endDate || undefined,
            departurePoints: departure.departurePoints || undefined,
            availability: (departure.availability || "on_request") as "available" | "limited" | "on_request" | "sold_out",
            seatsTotal: departure.seatsTotal ? Number(departure.seatsTotal) : undefined,
            seatsConfirmed: departure.seatsConfirmed ? Number(departure.seatsConfirmed) : undefined,
            seatsOption: departure.seatsOption ? Number(departure.seatsOption) : undefined,
            seatsAvailable: departure.seatsAvailable ? Number(departure.seatsAvailable) : undefined,
            priceFrom: departure.priceFrom ? Number(departure.priceFrom) : undefined,
            currency: departure.currency || offer.currency,
            priceStatus: (departure.priceStatus || "budgetary") as "fixed" | "option_until" | "dynamic" | "budgetary",
            optionUntil: departure.optionUntil || undefined,
            depositAmount: departure.depositAmount ? Number(departure.depositAmount) : undefined,
            paymentDueDays: departure.paymentDueDays ? Number(departure.paymentDueDays) : undefined,
            notes: departure.notes || undefined
          }))
        : [{ label: "Дати по заявка", startDate: "" }]
    });
  }, [activeDepartures, lowestPrice, offer.currency, onDraftChange, prices.length]);

  return (
    <form className="offer-workflow-stack offer-dates-form" action={formAction}>
      <input type="hidden" name="slug" value={offer.slug} />
      <section className="offer-editor-card">
        <header>
          <div>
            <h2>Дати и цени</h2>
            <span>Една оферта може да има много отпътувания с различни места, цени и статуси.</span>
          </div>
          <button className="offer-inline-add" type="button" onClick={() => setDepartures((current) => [...current, createEmptyDeparture()])}>
            <Plus size={16} aria-hidden="true" />
            Добави отпътуване
          </button>
        </header>

        <div className="offer-dates-summary">
          <span><strong>{departures.length}</strong> отпътувания</span>
          <span><strong>{totalSeats || "—"}</strong> места общо</span>
          <span><strong>{confirmedSeats || "—"} / {optionSeats || "—"}</strong> confirmed / option</span>
          <span><strong>{lowestPrice ? `${lowestPrice.toLocaleString("bg-BG")} ${offer.currency}` : "при запитване"}</strong> най-ниска цена</span>
          <span><strong>{requestOnlyCount || "—"}</strong> периода без фиксирана цена</span>
        </div>
      </section>

      <section className="offer-editor-card">
        {isImportedOffer ? (
          <div className="offer-import-departures-editor" aria-label="Дати и цени от доставчик">
            <div className="offer-import-departures-note">
              <CalendarDays size={18} aria-hidden="true" />
              <div>
                <strong>Дати от доставчика</strong>
                <span>Показваме само полетата, които е нормално да се прегледат преди публикуване. Останалите стойности остават запазени към офертата.</span>
              </div>
            </div>

            {departures.map((departure, index) => (
              <article className={departure.availability === "sold_out" ? "offer-import-departure-card is-muted" : "offer-import-departure-card"} key={departure.key}>
                <input type="hidden" name="departure_id" value={departure.id} />
                <input type="hidden" name="departure_start" value={departure.startDate} />
                <input type="hidden" name="departure_end" value={departure.endDate} />
                <input type="hidden" name="departure_seats_total" value={departure.seatsTotal} />
                <input type="hidden" name="departure_seats_confirmed" value={departure.seatsConfirmed} />
                <input type="hidden" name="departure_seats_option" value={departure.seatsOption} />
                <input type="hidden" name="departure_seats_available" value={departure.seatsAvailable} />
                <input type="hidden" name="departure_price_status" value={departure.priceStatus || "budgetary"} />
                <input type="hidden" name="departure_option_until" value={departure.optionUntil} />
                <input type="hidden" name="departure_deposit" value={departure.depositAmount} />
                <input type="hidden" name="departure_payment_due_days" value={departure.paymentDueDays} />

                <header>
                  <div>
                    <span className="offer-import-date-chip">{formatImportedDate(departure.startDate)}</span>
                    {departure.endDate ? <span className="offer-import-date-muted">до {formatImportedDate(departure.endDate)}</span> : null}
                  </div>
                  <button className="offer-date-remove" type="button" onClick={() => removeDeparture(departure.key)} aria-label={departure.id ? "Маркирай датата като спряна" : "Премахни датата"}>
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </header>

                <div className="offer-import-departure-grid">
                  <label className="is-wide">
                    <span>Публичен етикет</span>
                    <input name="departure_label" value={departure.label} onChange={(event) => updateDeparture(departure.key, "label", event.target.value)} placeholder={`Дата ${index + 1}`} />
                  </label>
                  <label>
                    <span>Отпътуване от</span>
                    <input name="departure_points" value={departure.departurePoints} onChange={(event) => updateDeparture(departure.key, "departurePoints", event.target.value)} placeholder="По данни от доставчика" />
                  </label>
                  <label>
                    <span>Цена от</span>
                    <input type="number" min="0" step="0.01" name="departure_price_from" value={departure.priceFrom} onChange={(event) => updateDeparture(departure.key, "priceFrom", event.target.value)} placeholder="При запитване" />
                  </label>
                  <label>
                    <span>Валута</span>
                    <select name="departure_currency" value={departure.currency} onChange={(event) => updateDeparture(departure.key, "currency", event.target.value)}>
                      <option value="" disabled>Избери</option>
                      <option value="EUR">EUR</option>
                      <option value="BGN">BGN</option>
                    </select>
                  </label>
                  <label>
                    <span>Статус</span>
                    <select name="departure_status" value={departure.availability} onChange={(event) => updateDeparture(departure.key, "availability", event.target.value)}>
                      <option value="" disabled>Избери</option>
                      <option value="available">Активно</option>
                      <option value="limited">Последни места</option>
                      <option value="on_request">По заявка</option>
                      <option value="sold_out">Спряно</option>
                    </select>
                  </label>
                  <label className="is-wide">
                    <span>Бележка към тази дата</span>
                    <input name="departure_notes" value={departure.notes} onChange={(event) => updateDeparture(departure.key, "notes", event.target.value)} placeholder="Вътрешна бележка или уточнение за клиента" />
                  </label>
                </div>

                <details className="offer-import-advanced">
                  <summary>Данни от доставчика</summary>
                  <div>
                    <span>Капацитет: <strong>{departure.seatsTotal || "-"}</strong></span>
                    <span>Потвърдени: <strong>{departure.seatsConfirmed || "-"}</strong></span>
                    <span>Опция: <strong>{departure.seatsOption || "-"}</strong></span>
                    <span>Свободни: <strong>{departure.seatsAvailable || "-"}</strong></span>
                    <span>Цена: <strong>{priceStatusLabels[departure.priceStatus] || departure.priceStatus || "-"}</strong></span>
                    <span>Депозит: <strong>{departure.depositAmount || "-"}</strong></span>
                    <span>Плащане: <strong>{departure.paymentDueDays ? `${departure.paymentDueDays} дни` : "-"}</strong></span>
                    <span>Статус: <strong>{availabilityLabels[departure.availability] || departure.availability || "-"}</strong></span>
                  </div>
                </details>
              </article>
            ))}

            {departures.length === 0 ? (
              <div className="offer-departures-empty">
                <CalendarDays size={24} aria-hidden="true" />
                <strong>Няма импортнати дати към тази оферта</strong>
                <span>Може да добавите дата ръчно, ако доставчикът не е подал периоди или ценови варианти.</span>
                <button type="button" onClick={() => setDepartures((current) => [...current, createEmptyDeparture()])}>
                  <Plus size={16} aria-hidden="true" />
                  Добави дата
                </button>
              </div>
            ) : null}
          </div>
        ) : (
        <div className="offer-departures-editor" role="table" aria-label="Отпътувания и цени">
          <div className="offer-departures-head" role="row">
            <span>Период / публичен етикет</span>
            <span>Отпътуване</span>
            <span>Места</span>
            <span>Цена</span>
            <span>Условия</span>
            <span>Статус</span>
            <span />
          </div>

          {departures.map((departure, index) => (
            <article className={departure.availability === "sold_out" ? "offer-departure-row is-muted" : "offer-departure-row"} key={departure.key} role="row">
              <input type="hidden" name="departure_id" value={departure.id} />
              <div className="offer-date-period-cell">
                <label>
                  <span>Публичен етикет</span>
                  <input name="departure_label" value={departure.label} onChange={(event) => updateDeparture(departure.key, "label", event.target.value)} placeholder="Напр. Целогодишно, Май 2027, По запитване" />
                </label>
                <div className="offer-date-cell">
                  <label>
                    <span>От</span>
                    <input type="date" name="departure_start" value={departure.startDate} onChange={(event) => updateDeparture(departure.key, "startDate", event.target.value)} />
                  </label>
                  <label>
                    <span>До</span>
                    <input type="date" name="departure_end" value={departure.endDate} onChange={(event) => updateDeparture(departure.key, "endDate", event.target.value)} />
                  </label>
                </div>
              </div>

              <label className="offer-date-status">
                <span>Отпътуване от</span>
                <input name="departure_points" value={departure.departurePoints} onChange={(event) => updateDeparture(departure.key, "departurePoints", event.target.value)} placeholder="София, Пловдив, Варна" />
              </label>

              <div className="offer-date-cell is-compact">
                <label>
                  <span>Капацитет</span>
                  <input type="number" min="0" name="departure_seats_total" value={departure.seatsTotal} onChange={(event) => updateDeparture(departure.key, "seatsTotal", event.target.value)} placeholder="48" />
                </label>
                <label>
                  <span>Потвърдени</span>
                  <input type="number" min="0" name="departure_seats_confirmed" value={departure.seatsConfirmed} onChange={(event) => updateDeparture(departure.key, "seatsConfirmed", event.target.value)} placeholder="31" />
                </label>
                <label>
                  <span>Опция</span>
                  <input type="number" min="0" name="departure_seats_option" value={departure.seatsOption} onChange={(event) => updateDeparture(departure.key, "seatsOption", event.target.value)} placeholder="4" />
                </label>
                <label>
                  <span>Свободни</span>
                  <input type="number" min="0" name="departure_seats_available" value={departure.seatsAvailable} onChange={(event) => updateDeparture(departure.key, "seatsAvailable", event.target.value)} placeholder="12" />
                </label>
              </div>

              <div className="offer-date-cell is-price">
                <label>
                  <span>Цена от</span>
                  <input type="number" min="0" step="0.01" name="departure_price_from" value={departure.priceFrom} onChange={(event) => updateDeparture(departure.key, "priceFrom", event.target.value)} placeholder="999" />
                </label>
                <label>
                  <span>Валута</span>
                  <select name="departure_currency" value={departure.currency} onChange={(event) => updateDeparture(departure.key, "currency", event.target.value)}>
                    <option value="" disabled>Избери</option>
                    <option value="EUR">EUR</option>
                    <option value="BGN">BGN</option>
                  </select>
                </label>
              </div>

              <div className="offer-date-cell is-compact">
                <label>
                  <span>Статус цена</span>
                  <select name="departure_price_status" value={departure.priceStatus} onChange={(event) => updateDeparture(departure.key, "priceStatus", event.target.value)}>
                    <option value="fixed">FIXED</option>
                    <option value="option_until">OPTION UNTIL</option>
                    <option value="dynamic">DYNAMIC</option>
                    <option value="budgetary">BUDGETARY</option>
                  </select>
                </label>
                <label>
                  <span>Опция до</span>
                  <input type="datetime-local" name="departure_option_until" value={departure.optionUntil} onChange={(event) => updateDeparture(departure.key, "optionUntil", event.target.value)} disabled={departure.priceStatus !== "option_until"} />
                </label>
                <label>
                  <span>Депозит</span>
                  <input type="number" min="0" step="0.01" name="departure_deposit" value={departure.depositAmount} onChange={(event) => updateDeparture(departure.key, "depositAmount", event.target.value)} placeholder="300" />
                </label>
                <label>
                  <span>Плащане до</span>
                  <input type="number" min="0" name="departure_payment_due_days" value={departure.paymentDueDays} onChange={(event) => updateDeparture(departure.key, "paymentDueDays", event.target.value)} placeholder="30 дни" />
                </label>
              </div>

              <label className="offer-date-status">
                <span>Статус</span>
                <select name="departure_status" value={departure.availability} onChange={(event) => updateDeparture(departure.key, "availability", event.target.value)}>
                  <option value="" disabled>Избери</option>
                  <option value="available">Активно</option>
                  <option value="limited">Последни места</option>
                  <option value="on_request">По заявка</option>
                  <option value="sold_out">Спряно</option>
                </select>
              </label>

              <button className="offer-date-remove" type="button" onClick={() => removeDeparture(departure.key)} aria-label={departure.id ? "Маркирай отпътуването като спряно" : "Премахни реда"}>
                <Trash2 size={16} aria-hidden="true" />
              </button>

              <label className="offer-date-notes">
                <span>Бележка за този период</span>
                <input name="departure_notes" value={departure.notes} onChange={(event) => updateDeparture(departure.key, "notes", event.target.value)} placeholder="Напр. гарантирано отпътуване, конкретен хотел, особеност в полета..." />
              </label>
            </article>
          ))}
          {departures.length === 0 ? (
            <div className="offer-departures-empty">
              <CalendarDays size={24} aria-hidden="true" />
              <strong>Добавете първо отпътуване или период по запитване</strong>
              <span>Може да въведете точни дати, публичен етикет като „Целогодишно“, цена, депозит и наличности.</span>
              <button type="button" onClick={() => setDepartures((current) => [...current, createEmptyDeparture()])}>
                <Plus size={16} aria-hidden="true" />
                Добави отпътуване
              </button>
            </div>
          ) : null}
        </div>
        )}

        <div className="offer-workflow-footer">
          {state.message ? <p className={state.ok ? "offer-editor-feedback" : "offer-editor-feedback is-error"}>{state.message}</p> : null}
          <div>
            <button type="submit" disabled={isPending}>
              <Save size={16} aria-hidden="true" />
              {isPending ? "Записване..." : "Запази дати и цени"}
            </button>
            <button className="primary" type="submit" name="after_save" value="publishing" disabled={isPending}>
              {isPending ? "Записване..." : "Запази и продължи"}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>
    </form>
  );
}

function ReadOnlyField({ label, value, wide = false, multiline = false }: { label: string; value: string; wide?: boolean; multiline?: boolean }) {
  return (
    <label className={wide ? "offer-readonly-field is-wide" : "offer-readonly-field"}>
      <span>{label}</span>
      <output className={multiline ? "is-multiline" : ""}>{value}</output>
    </label>
  );
}

function SectionWorkspace({ section, state }: { section: EditorSection; state: { status: SectionStatus; percent: number; filled: string[]; missing: string[] } }) {
  return (
    <section className="offer-editor-card offer-editor-placeholder">
      <header>
        <h2>{section.label}</h2>
        <span>{section.description}</span>
      </header>
      <div className="offer-section-workspace">
        <div>
          <strong>Какво трябва да се редактира тук</strong>
          <p>
            Тази секция ще съдържа реалните полета за {section.label.toLowerCase()}. Целта е да не се отваря отделна страница, а служителят да вижда текущите данни, липсите и редакционните действия на едно място.
          </p>
        </div>
        <div>
          <strong>{sectionStatusLabel(state.status, state.percent)}</strong>
          <p>{state.missing.length > 0 ? "Има оставащи данни за попълване преди офертата да е напълно готова." : "Секцията няма критични липси според текущата структура."}</p>
        </div>
      </div>
    </section>
  );
}

function ChoiceSection({
  title,
  subtitle,
  items,
  selected,
  onToggle,
  audience = false
}: {
  title: string;
  subtitle?: string;
  items: ChoiceItem[];
  selected: string[];
  onToggle: (label: string) => void;
  audience?: boolean;
}) {
  return (
    <section className="offer-editor-card">
      <header>
        <h2>{title}</h2>
        {subtitle ? <span>{subtitle}</span> : null}
      </header>
      <div className={audience ? "offer-choice-grid offer-choice-audience" : "offer-choice-grid"}>
        {items.map((item) => (
          <SelectionButton item={item} selected={selected.includes(item.label)} onToggle={onToggle} key={item.label} />
        ))}
      </div>
    </section>
  );
}
