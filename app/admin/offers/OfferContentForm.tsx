"use client";

import { type ChangeEvent, type FormEvent, type MouseEvent, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowRightIcon,
  Bold,
  CalendarDays,
  ChevronDown,
  Code2,
  Eye,
  ExternalLink,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  MapPin,
  Minus,
  MoreHorizontal,
  Plane,
  Plus,
  Quote,
  Star,
  Trash2,
  Underline,
  Unlink,
  Upload,
  X
} from "lucide-react";

export type OfferContentInitialData = {
  id?: string;
  slug?: string;
  productType: string;
  productTypeLabel: string;
  title: string;
  summary: string;
  description: string;
  country: string;
  region: string;
  destinations?: Array<{ country: string; region: string; city: string }>;
  durationDays: number | string;
  durationNights: number | string;
  transport: string;
  heroImageUrl: string;
  galleryImageUrls?: string[];
  imageAltTexts?: Record<string, string>;
  isAuthorProgram: boolean;
  itinerary: Array<{ day: number; title: string; description: string; accommodation?: string; meals?: string; transport?: string }>;
  highlights: string[];
  included: string[];
  excluded: string[];
};

export type OfferContentDraftSummary = {
  productTypeLabel: string;
  title: string;
  country: string;
  region: string;
  durationDays: string;
  durationNights: string;
  transport: string;
  summary: string;
  description: string;
  hasHeroImage: boolean;
};

type ProductTypeOption = {
  slug: string;
  label: string;
  productType: string;
  isSystem: boolean;
};

type DestinationRow = {
  id: string;
  country: string;
  region: string;
  city: string;
};

type ItineraryRow = {
  id: string;
  day: number;
  title: string;
  description: string;
  accommodation: string;
  meals: string;
  transport: string;
};

type HighlightRow = {
  id: string;
  value: string;
};

type EditorPanel = "format" | "link" | "image" | "more" | null;

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

function splitServiceText(value: string) {
  return value
    .split(/\n+/)
    .map((item) => item.replace(/^\s*[-*•\d.)]+/, "").trim())
    .filter(Boolean);
}

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

function getInitialServices(services: string[]) {
  return services;
}

function createSummaryFromDescription(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

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

function UploadBox({
  title,
  hint,
  action,
  uploadSessionId,
  role,
  multiple = false,
  required = false,
  uploadedUrls = [],
  altTexts = {},
  onFilesChange,
  onUploadStateChange,
  onUploaded,
  onMakePrimary,
  onAltTextChange
}: {
  title: string;
  hint: string;
  action: string;
  uploadSessionId: string;
  role: "hero" | "gallery";
  multiple?: boolean;
  required?: boolean;
  uploadedUrls?: string[];
  altTexts?: Record<string, string>;
  onFilesChange?: (files: File[]) => void;
  onUploadStateChange?: (isUploading: boolean) => void;
  onUploaded?: (urls: string[]) => void;
  onMakePrimary?: (url: string) => void;
  onAltTextChange?: (url: string, value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "done" | "error">(uploadedUrls.length ? "done" : "idle");
  const [uploadError, setUploadError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const hasUploadedFiles = uploadedUrls.length > 0;
  const fileSummary = files.length > 0
    ? multiple
      ? `${files.length} снимки избрани`
      : files[0]?.name
    : hint;

  const resetFileInput = () => {
    if (inputRef.current) inputRef.current.value = "";
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
    onUploadStateChange?.(true);

    try {
      const uploadedUrlsFromUpload: string[] = [];
      for (const [index, file] of nextFiles.slice(0, 20).entries()) {
        const uploadFormData = new FormData();
        uploadFormData.set("file", file);
        uploadFormData.set("uploadSessionId", uploadSessionId);
        uploadFormData.set("role", role);
        uploadFormData.set("index", String(index));

        const response = await fetch("/admin/uploads/offer-image", { method: "POST", body: uploadFormData });
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
      onUploadStateChange?.(false);
      resetFileInput();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Файлът не беше качен. Провери размера, типа или Storage настройките.");
      if (!multiple) onUploaded?.([]);
      setUploadState("error");
      onUploadStateChange?.(false);
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
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= uploadedUrls.length) return;

    const nextUrls = [...uploadedUrls];
    const [item] = nextUrls.splice(currentIndex, 1);
    nextUrls.splice(nextIndex, 0, item);
    onUploaded?.(nextUrls);
  };

  const makePrimary = (urlToPromote: string) => {
    if (onMakePrimary) {
      onMakePrimary(urlToPromote);
    } else {
      onUploaded?.([urlToPromote, ...uploadedUrls.filter((url) => url !== urlToPromote)]);
    }
    setPreviewUrl(null);
  };

  return (
    <div className={hasUploadedFiles ? "offer-new-upload-manager has-files" : "offer-new-upload-manager"}>
      <label className="offer-new-upload">
        <ImageIcon size={30} aria-hidden="true" />
        <strong>{uploadState === "uploading" ? "Качване..." : hasUploadedFiles ? (multiple ? "Добави още снимки" : "Смени снимката") : title}</strong>
        <span>{uploadState === "uploading" ? "Качване към системата..." : hasUploadedFiles && multiple ? `${uploadedUrls.length} снимки в галерията` : fileSummary}</span>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple={multiple} required={required && !hasUploadedFiles} onChange={handleFileChange} />
        <span className={`offer-new-upload-action is-${uploadState}`}>
          {uploadState === "uploading"
            ? "Качва се..."
            : uploadState === "error"
              ? "Опитай пак"
              : hasUploadedFiles
                ? multiple
                  ? "Добави още"
                  : "Смени"
                : action}
        </span>
      </label>

      {hasUploadedFiles ? (
        <div className={multiple ? "offer-new-upload-thumbs" : "offer-new-upload-thumbs is-single"}>
          {uploadedUrls.map((url, index) => (
            <figure className="offer-new-upload-thumb" key={`${url}-${index}`}>
              <img src={url} alt={multiple ? `Снимка ${index + 1}` : "Основна снимка"} />
              {index === 0 ? <span className="offer-new-upload-primary-badge">Основна</span> : null}
              <figcaption>
                <strong>{multiple ? (index === 0 ? "Основна снимка" : `Снимка ${index + 1}`) : "Основна снимка"}</strong>
                <span>{index === 0 && multiple ? "първа в галерията" : "качена"}</span>
              </figcaption>
              <div>
                <button type="button" onClick={() => setPreviewUrl(url)} aria-label="Отвори снимката">
                  <Eye size={15} aria-hidden="true" />
                </button>
                {multiple ? (
                  <button type="button" onClick={() => makePrimary(url)} disabled={index === 0} aria-label="Направи снимката основна">
                    <Star size={15} aria-hidden="true" />
                  </button>
                ) : null}
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
              <label className="offer-new-upload-alt">
                <input name="image_alt_texts" value={altTexts[url] ?? ""} onChange={(event) => onAltTextChange?.(url, event.target.value)} placeholder="Alt текст" aria-label={`Alt текст за ${index === 0 ? "основната снимка" : `снимка ${index + 1}`}`} />
              </label>
            </figure>
          ))}
        </div>
      ) : null}
      {uploadError ? <em>{uploadError}</em> : null}
      {previewUrl ? (
        <div className="offer-image-lightbox" role="dialog" aria-modal="true" aria-label="Преглед на снимка" onClick={() => setPreviewUrl(null)}>
          <div className="offer-image-lightbox-panel" onClick={(event) => event.stopPropagation()}>
            <header>
              <strong>{multiple ? "Снимка от галерията" : "Основна снимка"}</strong>
              <div>
                {multiple ? (
                  <button type="button" onClick={() => makePrimary(previewUrl)}>
                    <Star size={16} aria-hidden="true" />
                    Направи основна
                  </button>
                ) : null}
                <button type="button" onClick={() => setPreviewUrl(null)} aria-label="Затвори прегледа">
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
            </header>
            <img src={previewUrl} alt="" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function OfferContentForm({
  initial,
  action,
  statusMessage,
  statusOk,
  isPending = false,
  headerBadge,
  primarySubmitLabel = "Запази и продължи",
  secondarySubmitLabel = "Запази чернова",
  formId,
  onHeroImageChange,
  onDraftChange,
  onMediaUploadChange,
  forceEmptyNewOffer = false
}: {
  initial: OfferContentInitialData;
  action: (formData: FormData) => void;
  statusMessage?: string;
  statusOk?: boolean;
  isPending?: boolean;
  headerBadge: string;
  primarySubmitLabel?: string;
  secondarySubmitLabel?: string;
  formId?: string;
  onHeroImageChange?: (url: string) => void;
  onDraftChange?: (draft: OfferContentDraftSummary) => void;
  onMediaUploadChange?: (isUploading: boolean) => void;
  forceEmptyNewOffer?: boolean;
}) {
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const editorImageInputRef = useRef<HTMLInputElement>(null);
  const savedSelectionRef = useRef<Range | null>(null);
  const uploadSessionIdRef = useRef(crypto.randomUUID());
  const shouldForceEmptyNewOffer = forceEmptyNewOffer || searchParams.get("new") === "1";
  const hasExplicitProductType = Boolean(initial.productTypeLabel || (initial.productType && initial.productType !== "package"));
  const normalizedInitialProductType = shouldForceEmptyNewOffer || !hasExplicitProductType ? "" : initial.productType;
  const normalizedInitialTransport = shouldForceEmptyNewOffer || (initial.transport === "mixed" && !hasExplicitProductType) ? "" : initial.transport;
  const [productType, setProductType] = useState(normalizedInitialProductType);
  const [productTypeOptions, setProductTypeOptions] = useState(defaultProductTypeOptions);
  const [isProductTypeOpen, setIsProductTypeOpen] = useState(false);
  const [isAddingProductType, setIsAddingProductType] = useState(false);
  const [newProductTypeLabel, setNewProductTypeLabel] = useState("");
  const [productTypeError, setProductTypeError] = useState("");
  const [title, setTitle] = useState(initial.title);
  const initialDestinations = initial.destinations?.length
    ? initial.destinations
    : [{ country: initial.country, region: initial.region, city: "" }];
  const [destinations, setDestinations] = useState<DestinationRow[]>(
    initialDestinations.map((destination, index) => ({
      id: index === 0 ? "primary" : crypto.randomUUID(),
      country: destination.country,
      region: destination.region,
      city: destination.city
    }))
  );
  const [durationDays, setDurationDays] = useState(String(initial.durationDays ?? ""));
  const [durationNights, setDurationNights] = useState(String(initial.durationNights ?? ""));
  const [transport, setTransport] = useState(normalizedInitialTransport);
  const [summary, setSummary] = useState(initial.summary);
  const [description, setDescription] = useState(initial.description);
  const [itineraryDays, setItineraryDays] = useState<ItineraryRow[]>(
    initial.itinerary.length
      ? initial.itinerary.map((day) => ({
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
  const [includedServicesText, setIncludedServicesText] = useState(getInitialServices(initial.included).join("\n"));
  const [excludedServicesText, setExcludedServicesText] = useState(getInitialServices(initial.excluded).join("\n"));
  const heroImageInputRef = useRef<HTMLInputElement>(null);
  const galleryInputsRef = useRef<HTMLDivElement>(null);
  const latestHeroImageUrlRef = useRef(initial.heroImageUrl);
  const latestGalleryImageUrlsRef = useRef<string[]>(initial.galleryImageUrls ?? []);
  const [heroPreview, setHeroPreview] = useState(initial.heroImageUrl);
  const [heroImageUrl, setHeroImageUrl] = useState(initial.heroImageUrl);
  const [galleryImageUrls, setGalleryImageUrls] = useState<string[]>(initial.galleryImageUrls ?? []);
  const [imageAltTexts, setImageAltTexts] = useState<Record<string, string>>(initial.imageAltTexts ?? {});
  const [isHeroUploading, setIsHeroUploading] = useState(false);
  const [isGalleryUploading, setIsGalleryUploading] = useState(false);
  const [uploadSaveWarning, setUploadSaveWarning] = useState("");
  const [activeEditorActions, setActiveEditorActions] = useState<string[]>([]);
  const [editorMode, setEditorMode] = useState<"visual" | "html">("visual");
  const [editorPanel, setEditorPanel] = useState<EditorPanel>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [editorImageUploadState, setEditorImageUploadState] = useState<"idle" | "uploading" | "error">("idle");
  const [editorImageUploadError, setEditorImageUploadError] = useState("");
  const selectedProductType = productTypeOptions.find((option) => option.slug === productType || option.productType === productType);
  const primaryDestination = destinations[0] ?? { id: "primary", country: "", region: "", city: "" };
  const country = primaryDestination.country;
  const region = primaryDestination.region || primaryDestination.city;
  const routeLabel = destinations.map((destination) => [destination.city, destination.region, destination.country].filter(Boolean).join(", ")).filter(Boolean).join(" -> ");
  const derivedSummary = createSummaryFromDescription(description) || summary;
  const includedServices = splitServiceText(includedServicesText);
  const excludedServices = splitServiceText(excludedServicesText);
  const allImageUrls = [heroImageUrl, ...galleryImageUrls].filter(Boolean).filter((url, index, list) => list.indexOf(url) === index);
  const [highlights, setHighlights] = useState<HighlightRow[]>(() =>
    initial.highlights.length
      ? initial.highlights.map((value) => ({ id: crypto.randomUUID(), value }))
      : [{ id: crypto.randomUUID(), value: "" }]
  );
  const getCurrentDescription = useCallback(() => (editorMode === "visual" ? editorRef.current?.innerHTML ?? description : description), [description, editorMode]);

  useEffect(() => {
    setProductType(normalizedInitialProductType);
    setTransport(normalizedInitialTransport);
    setTitle(initial.title);
    setSummary(initial.summary);
    setDescription(initial.description);
    setDurationDays(String(initial.durationDays ?? ""));
    setDurationNights(String(initial.durationNights ?? ""));
    setHighlights(
      initial.highlights.length
        ? initial.highlights.map((value) => ({ id: crypto.randomUUID(), value }))
        : [{ id: crypto.randomUUID(), value: "" }]
    );
    const nextDestinations = initial.destinations?.length
      ? initial.destinations
      : [{ country: initial.country, region: initial.region, city: "" }];
    setDestinations(
      nextDestinations.map((destination, index) => ({
        id: index === 0 ? "primary" : crypto.randomUUID(),
        country: destination.country,
        region: destination.region,
        city: destination.city
      }))
    );
    setIncludedServicesText(getInitialServices(initial.included).join("\n"));
    setExcludedServicesText(getInitialServices(initial.excluded).join("\n"));
    setHeroImageUrl(initial.heroImageUrl);
    setHeroPreview(initial.heroImageUrl);
    setGalleryImageUrls(initial.galleryImageUrls ?? []);
    setImageAltTexts(initial.imageAltTexts ?? {});
    latestHeroImageUrlRef.current = initial.heroImageUrl;
    latestGalleryImageUrlsRef.current = initial.galleryImageUrls ?? [];
  }, [initial.slug, normalizedInitialProductType, normalizedInitialTransport]);

  useEffect(() => {
    onDraftChange?.({
      productTypeLabel: selectedProductType?.label ?? "",
      title,
      country,
      region,
      durationDays,
      durationNights,
      transport,
      summary: derivedSummary,
      description: getCurrentDescription(),
      hasHeroImage: Boolean(heroImageUrl)
    });
  }, [country, derivedSummary, description, durationDays, durationNights, getCurrentDescription, heroImageUrl, onDraftChange, region, selectedProductType?.label, title, transport]);

  const syncDescription = () => setDescription(editorRef.current?.innerHTML ?? "");
  const normalizeEditorUrl = (value: string) => {
    const nextValue = value.trim();
    if (!nextValue) return "";
    if (/^(https?:|mailto:|tel:|\/|#)/i.test(nextValue)) return nextValue;
    return `https://${nextValue}`;
  };
  const escapeEditorHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const getSelectedEditorText = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current?.contains(selection.anchorNode)) return "";
    return selection.toString().trim();
  };
  const syncGalleryInputs = useCallback((urls: string[]) => {
    if (!galleryInputsRef.current) return;

    galleryInputsRef.current.replaceChildren(
      ...urls.map((url) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = "gallery_image_urls";
        input.value = url;
        return input;
      })
    );
  }, []);
  const syncFormBeforeSave = useCallback((formData?: FormData) => {
    const nextDescription = getCurrentDescription();
    const nextHeroImageUrl = latestHeroImageUrlRef.current || heroImageUrl;
    const nextGalleryImageUrls = latestGalleryImageUrlsRef.current;

    if (heroImageInputRef.current) {
      heroImageInputRef.current.value = nextHeroImageUrl;
    }
    syncGalleryInputs(nextGalleryImageUrls);

    formData?.set("description", nextDescription);
    formData?.set("hero_image_url", nextHeroImageUrl);
    formData?.delete("gallery_image_urls");
    nextGalleryImageUrls.forEach((url) => formData?.append("gallery_image_urls", url));
    formData?.delete("image_alt_texts");
    [nextHeroImageUrl, ...nextGalleryImageUrls].filter(Boolean).forEach((url) => formData?.append("image_alt_texts", imageAltTexts[url] || ""));
  }, [getCurrentDescription, heroImageUrl, imageAltTexts, syncGalleryInputs]);

  useEffect(() => {
    syncGalleryInputs(galleryImageUrls);
  }, [galleryImageUrls, syncGalleryInputs]);

  useEffect(() => {
    if (!initial.id || galleryImageUrls.length > 0) return;

    let isMounted = true;
    fetch(`/api/admin/offers/${initial.id}/media`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((result: { galleryImageUrls?: string[]; heroImageUrl?: string; imageAltTexts?: Record<string, string> } | null) => {
        if (!isMounted || !result) return;

        const nextGalleryUrls = result.galleryImageUrls ?? [];
        if (nextGalleryUrls.length) {
          latestGalleryImageUrlsRef.current = nextGalleryUrls;
          setGalleryImageUrls(nextGalleryUrls);
          syncGalleryInputs(nextGalleryUrls);
        }

        if (result.imageAltTexts) {
          setImageAltTexts((current) => ({ ...result.imageAltTexts, ...current }));
        }

        if (!heroImageUrl && result.heroImageUrl) {
          latestHeroImageUrlRef.current = result.heroImageUrl;
          setHeroImageUrl(result.heroImageUrl);
          setHeroPreview(result.heroImageUrl);
          onHeroImageChange?.(result.heroImageUrl);
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [galleryImageUrls.length, heroImageUrl, initial.id, onHeroImageChange, syncGalleryInputs]);
  const keepEditorSelection = (event: MouseEvent<HTMLButtonElement>) => event.preventDefault();
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
    const nextActions = ["bold", "italic", "underline", "insertUnorderedList", "insertOrderedList"].filter((command) => {
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
  const insertEditorHtml = (html: string) => {
    if (editorMode === "html") return;
    editorRef.current?.focus();
    restoreEditorSelection();
    document.execCommand("insertHTML", false, html);
    syncDescription();
    syncEditorState();
    saveEditorSelection();
  };
  const openEditorPanel = (panel: Exclude<EditorPanel, null>) => {
    saveEditorSelection();
    setEditorPanel((currentPanel) => {
      if (currentPanel === panel) return null;
      if (panel === "link") setLinkText(getSelectedEditorText());
      return panel;
    });
  };
  const applyLink = () => {
    const href = normalizeEditorUrl(linkUrl);
    if (!href) return;
    const selectedText = getSelectedEditorText();
    const title = linkText.trim() || selectedText || href;
    insertEditorHtml(`<a href="${escapeEditorHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeEditorHtml(title)}</a>`);
    setLinkUrl("");
    setLinkText("");
    setEditorPanel(null);
  };
  const applyImage = (url = imageUrl) => {
    const src = normalizeEditorUrl(url);
    if (!src) return;
    const alt = imageAlt.trim();
    insertEditorHtml(`<figure><img src="${escapeEditorHtml(src)}" alt="${escapeEditorHtml(alt)}" />${alt ? `<figcaption>${escapeEditorHtml(alt)}</figcaption>` : ""}</figure>`);
    setImageUrl("");
    setImageAlt("");
    setEditorPanel(null);
  };
  const uploadEditorImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setEditorImageUploadState("uploading");
    setEditorImageUploadError("");

    try {
      const uploadFormData = new FormData();
      uploadFormData.set("file", file);
      uploadFormData.set("uploadSessionId", uploadSessionIdRef.current);
      uploadFormData.set("role", "gallery");
      uploadFormData.set("index", String(Date.now()));

      const response = await fetch("/admin/uploads/offer-image", { method: "POST", body: uploadFormData });
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(result?.error || "Снимката не беше качена.");
      }

      const result = (await response.json()) as { url?: string };
      if (!result.url) throw new Error("Сървърът не върна адрес на снимката.");
      applyImage(result.url);
      setEditorImageUploadState("idle");
    } catch (error) {
      setEditorImageUploadError(error instanceof Error ? error.message : "Снимката не беше качена.");
      setEditorImageUploadState("error");
    } finally {
      if (editorImageInputRef.current) editorImageInputRef.current.value = "";
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

  const updateDestination = (id: string, field: keyof Omit<DestinationRow, "id">, value: string) => {
    setDestinations((current) => current.map((destination) => (destination.id === id ? { ...destination, [field]: value } : destination)));
  };
  const addDestination = () => setDestinations((current) => [...current, { id: crypto.randomUUID(), country: "", region: "", city: "" }]);
  const removeDestination = (id: string) => setDestinations((current) => (current.length === 1 ? current : current.filter((destination) => destination.id !== id)));
  const renumberItineraryDays = (days: ItineraryRow[]) => days.map((day, index) => ({ ...day, day: index + 1 }));
  const updateItineraryDay = (id: string, field: "title" | "description" | "accommodation" | "meals" | "transport", value: string) => setItineraryDays((current) => current.map((day) => (day.id === id ? { ...day, [field]: value } : day)));
  const addItineraryDay = () => setItineraryDays((current) => [...current, { id: crypto.randomUUID(), day: current.length + 1, title: "", description: "", accommodation: "", meals: "", transport: "" }]);
  const removeItineraryDay = (id: string) => setItineraryDays((current) => renumberItineraryDays(current.length === 1 ? current : current.filter((day) => day.id !== id)));
  const updateHighlight = (id: string, value: string) => setHighlights((current) => current.map((highlight) => (highlight.id === id ? { ...highlight, value } : highlight)));
  const addHighlight = () => setHighlights((current) => [...current, { id: crypto.randomUUID(), value: "" }]);
  const removeHighlight = (id: string) => setHighlights((current) => (current.length === 1 ? current : current.filter((highlight) => highlight.id !== id)));
  const handleHeroFilesChange = (files: File[]) => {
    setHeroPreview((currentUrl) => {
      if (currentUrl && currentUrl.startsWith("blob:")) URL.revokeObjectURL(currentUrl);
      return files[0] ? URL.createObjectURL(files[0]) : heroImageUrl;
    });
  };
  const applyGalleryUploadedUrls = (urls: string[]) => {
    latestGalleryImageUrlsRef.current = urls;
    setGalleryImageUrls(urls);
    syncGalleryInputs(urls);
    setUploadSaveWarning("");
  };
  const applyHeroUploadedUrls = (urls: string[]) => {
    const nextUrl = urls[0] ?? "";
    latestHeroImageUrlRef.current = nextUrl;
    setHeroImageUrl(nextUrl);
    setHeroPreview(nextUrl);
    onHeroImageChange?.(nextUrl);

    if (heroImageInputRef.current) {
      heroImageInputRef.current.value = nextUrl;
    }
    setUploadSaveWarning("");
  };
  const applyImageUrls = (urls: string[]) => {
    const uniqueUrls = urls.filter(Boolean).filter((url, index, list) => list.indexOf(url) === index).slice(0, 21);
    const nextHeroImageUrl = uniqueUrls[0] ?? "";
    const nextGalleryImageUrls = uniqueUrls.slice(1, 21);

    latestHeroImageUrlRef.current = nextHeroImageUrl;
    latestGalleryImageUrlsRef.current = nextGalleryImageUrls;
    setHeroImageUrl(nextHeroImageUrl);
    setHeroPreview(nextHeroImageUrl);
    setGalleryImageUrls(nextGalleryImageUrls);
    syncGalleryInputs(nextGalleryImageUrls);
    onHeroImageChange?.(nextHeroImageUrl);

    if (heroImageInputRef.current) {
      heroImageInputRef.current.value = nextHeroImageUrl;
    }
    setUploadSaveWarning("");
  };
  const makeImagePrimary = (url: string) => {
    applyImageUrls([url, ...allImageUrls.filter((currentUrl) => currentUrl !== url)]);
  };
  const isUploadingMedia = isHeroUploading || isGalleryUploading || editorImageUploadState === "uploading";
  useEffect(() => {
    onMediaUploadChange?.(isUploadingMedia);
  }, [isUploadingMedia, onMediaUploadChange]);

  const syncHeroInputBeforeSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (isUploadingMedia) {
      event.preventDefault();
      setUploadSaveWarning("Изчакай снимките да се качат докрай, после запази черновата.");
      return;
    }

    syncFormBeforeSave();
  };

  return (
    <div className="offer-new-layout">
      <form id={formId} className="offer-new-form" action={action} ref={formRef} onSubmit={syncHeroInputBeforeSubmit}>
        {initial.id ? <input type="hidden" name="offer_id" value={initial.id} /> : null}
        {initial.slug ? <input type="hidden" name="slug" value={initial.slug} /> : null}
        <section className="offer-new-card">
          <header className="offer-new-card-header">
            <div>
              <span>{headerBadge}</span>
              <h2>Данни за офертата</h2>
            </div>
          </header>

          <div className="offer-new-form-grid">
            <label>
              <span>Тип оферта <b>*</b></span>
              <input type="hidden" name="product_type" value={selectedProductType?.productType ?? ""} />
              <input type="hidden" name="product_type_label" value={selectedProductType?.label ?? ""} />
              <div className="offer-new-custom-select">
                <button type="button" onClick={() => setIsProductTypeOpen((value) => !value)} aria-expanded={isProductTypeOpen}>
                  <Plane size={18} aria-hidden="true" />
                  <span>{selectedProductType?.label ?? "Избери"}</span>
                  <ChevronDown size={16} aria-hidden="true" />
                </button>
                {isProductTypeOpen ? (
                  <div className="offer-new-custom-select-menu">
                    {productTypeOptions.map((option) => (
                      <button className={option.slug === productType || option.productType === productType ? "is-selected" : ""} type="button" key={option.slug} onClick={() => { setProductType(option.slug); setIsProductTypeOpen(false); setIsAddingProductType(false); }}>
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
              <span className="offer-new-label-line"><span>Заглавие <b>*</b></span><em>{title.length}/100</em></span>
              <div className="offer-new-counted-input">
                <input name="title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Напр. Кападокия - магията на балоните" required maxLength={100} />
              </div>
            </label>

            <input type="hidden" name="source" value="manual" />
            <input type="hidden" name="country" value={country} />
            <input type="hidden" name="region" value={region} />

            <div className="offer-new-destinations offer-new-full-field">
              <header>
                <div><span>Дестинации <b>*</b></span><p>Добавете една или повече държави и региони в реда на маршрута.</p></div>
                <button type="button" onClick={addDestination}><Plus size={16} aria-hidden="true" />Добави</button>
              </header>
              <datalist id="offer-country-options">
                {countryNames.map((name) => <option value={name} key={name} />)}
              </datalist>
              <div className="offer-new-destination-list">
                {destinations.map((destination, index) => (
                  <div className="offer-new-destination-row" key={destination.id}>
                    <strong>{index === 0 ? "Основна" : `Стоп ${index + 1}`}</strong>
                    <label><span>Държава {index === 0 ? <b>*</b> : null}</span><input name="destination_country" value={destination.country} onChange={(event) => updateDestination(destination.id, "country", event.target.value)} list="offer-country-options" placeholder="Започнете да пишете" required={index === 0} /></label>
                    <label><span>Регион / дестинация {index === 0 ? <b>*</b> : null}</span><input name="destination_region" value={destination.region} onChange={(event) => updateDestination(destination.id, "region", event.target.value)} placeholder="Напр. Кападокия" required={index === 0} /></label>
                    <label><span>Град</span><input name="destination_city" value={destination.city} onChange={(event) => updateDestination(destination.id, "city", event.target.value)} placeholder="По желание" /></label>
                    <button type="button" onClick={() => removeDestination(destination.id)} disabled={destinations.length === 1} aria-label="Премахни дестинация"><X size={16} aria-hidden="true" /></button>
                  </div>
                ))}
              </div>
            </div>

            <label className="offer-new-field"><span>Авторска програма</span><div className="offer-new-radio-panel"><label><input type="radio" name="is_author_program" value="yes" defaultChecked={initial.isAuthorProgram} /><span>Да</span></label><label><input type="radio" name="is_author_program" value="no" defaultChecked={!initial.isAuthorProgram} /><span>Не</span></label></div></label>
            <label><span>Продължителност <b>*</b></span><div className="offer-new-duration"><input name="duration_days" value={durationDays} onChange={(event) => setDurationDays(event.target.value)} inputMode="numeric" required /><span>дни</span><input name="duration_nights" value={durationNights} onChange={(event) => setDurationNights(event.target.value)} inputMode="numeric" /><span>нощувки</span></div></label>
            <label><span>Транспорт <b>*</b></span><select name="transport" value={transport} onChange={(event) => setTransport(event.target.value)} required><option value="" disabled>Избери</option><option value="flight">Самолет</option><option value="bus">Автобус</option><option value="own_transport">Собствен транспорт</option><option value="mixed">Комбинирано</option></select></label>

            <div className="offer-new-field offer-new-gallery-media offer-new-full-field">
              <span>Снимки <b>*</b></span>
              <UploadBox title="Качи снимки" hint="Първата снимка ще бъде основна. Може да добавиш до 20 снимки." action="Избери файлове" uploadSessionId={uploadSessionIdRef.current} role="gallery" multiple required={!heroImageUrl} uploadedUrls={allImageUrls} altTexts={imageAltTexts} onUploadStateChange={setIsGalleryUploading} onUploaded={applyImageUrls} onMakePrimary={makeImagePrimary} onAltTextChange={(url, value) => setImageAltTexts((current) => ({ ...current, [url]: value }))} />
              <input ref={heroImageInputRef} type="hidden" name="hero_image_url" defaultValue={initial.heroImageUrl} />
              <div ref={galleryInputsRef} hidden />
            </div>
          </div>

          <input type="hidden" name="summary" value={derivedSummary} />

          <div className="offer-new-full-field">
            <span>Представяне <b>*</b></span>
            <div className="offer-new-editor">
              <div className="offer-new-editor-toolbar">
                <button className={editorPanel === "format" ? "is-active is-format" : "is-format"} type="button" onMouseDown={keepEditorSelection} onClick={() => openEditorPanel("format")}><span>Paragraph</span><ChevronDown size={15} aria-hidden="true" /></button>
                <button className={isEditorActionActive("bold") ? "is-active" : ""} type="button" aria-label="Bold" onMouseDown={keepEditorSelection} onClick={() => runEditorCommand("bold")}><Bold size={18} aria-hidden="true" /></button>
                <button className={isEditorActionActive("italic") ? "is-active" : ""} type="button" aria-label="Italic" onMouseDown={keepEditorSelection} onClick={() => runEditorCommand("italic")}><Italic size={18} aria-hidden="true" /></button>
                <button className={isEditorActionActive("underline") ? "is-active" : ""} type="button" aria-label="Underline" onMouseDown={keepEditorSelection} onClick={() => runEditorCommand("underline")}><Underline size={18} aria-hidden="true" /></button>
                <button className={isEditorActionActive("insertUnorderedList") ? "is-active" : ""} type="button" aria-label="Bulleted list" onMouseDown={keepEditorSelection} onClick={() => runEditorCommand("insertUnorderedList")}><List size={18} aria-hidden="true" /></button>
                <button className={isEditorActionActive("insertOrderedList") ? "is-active" : ""} type="button" aria-label="Numbered list" onMouseDown={keepEditorSelection} onClick={() => runEditorCommand("insertOrderedList")}><ListOrdered size={18} aria-hidden="true" /></button>
                <button className={editorPanel === "link" ? "is-active" : ""} type="button" aria-label="Link" onMouseDown={keepEditorSelection} onClick={() => openEditorPanel("link")}><Link2 size={18} aria-hidden="true" /></button>
                <button className={editorPanel === "image" ? "is-active" : ""} type="button" aria-label="Image" onMouseDown={keepEditorSelection} onClick={() => openEditorPanel("image")}><ImageIcon size={18} aria-hidden="true" /></button>
                <button className={editorPanel === "more" ? "is-active" : ""} type="button" aria-label="More" onMouseDown={keepEditorSelection} onClick={() => openEditorPanel("more")}><MoreHorizontal size={18} aria-hidden="true" /></button>
                <button className={editorMode === "html" ? "is-active" : ""} type="button" aria-label="HTML" onMouseDown={keepEditorSelection} onClick={toggleEditorMode}><Code2 size={18} aria-hidden="true" /></button>
              </div>
              {editorPanel ? (
                <div className="offer-new-editor-panel">
                  {editorPanel === "format" ? (
                    <div className="offer-new-editor-panel-grid">
                      <button type="button" onMouseDown={keepEditorSelection} onClick={() => { runEditorCommand("formatBlock", "p"); setEditorPanel(null); }}><span>P</span>Paragraph</button>
                      <button type="button" onMouseDown={keepEditorSelection} onClick={() => { runEditorCommand("formatBlock", "h2"); setEditorPanel(null); }}><Heading2 size={17} aria-hidden="true" />Heading 2</button>
                      <button type="button" onMouseDown={keepEditorSelection} onClick={() => { runEditorCommand("formatBlock", "h3"); setEditorPanel(null); }}><Heading3 size={17} aria-hidden="true" />Heading 3</button>
                      <button type="button" onMouseDown={keepEditorSelection} onClick={() => { runEditorCommand("formatBlock", "blockquote"); setEditorPanel(null); }}><Quote size={17} aria-hidden="true" />Quote</button>
                    </div>
                  ) : null}

                  {editorPanel === "link" ? (
                    <div className="offer-new-editor-inline-form is-link">
                      <label><span>Текст на линка</span><input value={linkText} onChange={(event) => setLinkText(event.target.value)} placeholder="Напр. Вижте програмата" /></label>
                      <label><span>Адрес</span><input value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://..." /></label>
                      <button type="button" onClick={applyLink}><ExternalLink size={16} aria-hidden="true" />Добави</button>
                    </div>
                  ) : null}

                  {editorPanel === "image" ? (
                    <div className="offer-new-editor-image-panel">
                      <label className="offer-new-editor-file-button">
                        <Upload size={17} aria-hidden="true" />
                        <span>{editorImageUploadState === "uploading" ? "Качване..." : "Снимка от компютър"}</span>
                        <input ref={editorImageInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadEditorImage} disabled={editorImageUploadState === "uploading"} />
                      </label>
                      <div className="offer-new-editor-inline-form is-image-url">
                        <label><span>URL на изображение</span><input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://..." /></label>
                        <label><span>Alt / надпис</span><input value={imageAlt} onChange={(event) => setImageAlt(event.target.value)} placeholder="Напр. Хотелът отвън" /></label>
                        <button type="button" onClick={() => applyImage()}><ImageIcon size={16} aria-hidden="true" />Добави</button>
                      </div>
                      {editorImageUploadError ? <em>{editorImageUploadError}</em> : null}
                    </div>
                  ) : null}

                  {editorPanel === "more" ? (
                    <div className="offer-new-editor-panel-grid">
                      <button type="button" onMouseDown={keepEditorSelection} onClick={() => runEditorCommand("removeFormat")}><Unlink size={17} aria-hidden="true" />Изчисти форматирането</button>
                      <button type="button" onMouseDown={keepEditorSelection} onClick={() => runEditorCommand("insertHorizontalRule")}><Minus size={17} aria-hidden="true" />Разделител</button>
                      <button type="button" onMouseDown={keepEditorSelection} onClick={() => runEditorCommand("formatBlock", "blockquote")}><Quote size={17} aria-hidden="true" />Цитат</button>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {editorMode === "visual" ? <div ref={editorRef} className="offer-new-editor-surface" contentEditable role="textbox" aria-multiline="true" data-placeholder={presentationPlaceholder} suppressContentEditableWarning onInput={() => { syncDescription(); saveEditorSelection(); }} onKeyUp={() => { syncEditorState(); saveEditorSelection(); }} onMouseUp={() => { syncEditorState(); saveEditorSelection(); }} /> : <textarea className="offer-new-editor-html" value={description} onChange={(event) => setDescription(event.target.value)} placeholder={presentationPlaceholder} spellCheck={false} />}
              <input type="hidden" name="description" value={description} />
            </div>
          </div>

          <section className="offer-itinerary-editor"><header><div><h3>Програма по дни</h3><p>Добавете програмата като отделни дни. Така после сайтът ще я показва като подреден маршрут.</p></div></header><div className="offer-itinerary-list">{itineraryDays.map((day) => <article className="offer-itinerary-row" key={day.id}><div className="offer-itinerary-day-number"><span>Ден</span><strong>{day.day}</strong><input type="hidden" name="itinerary_day_number" value={day.day} /></div><label className="offer-edit-field"><span>Заглавие за деня</span><input name="itinerary_title" value={day.title} onChange={(event) => updateItineraryDay(day.id, "title", event.target.value)} placeholder="Напр. София - Истанбул" /></label><label className="offer-edit-field is-wide"><span>Описание</span><textarea name="itinerary_description" value={day.description} onChange={(event) => updateItineraryDay(day.id, "description", event.target.value)} placeholder="Описание на деня, основните места, преживяванията и логистиката." rows={4} /></label><div className="offer-itinerary-logistics"><label className="offer-edit-field"><span>Настаняване</span><input name="itinerary_accommodation" value={day.accommodation} onChange={(event) => updateItineraryDay(day.id, "accommodation", event.target.value)} placeholder="хотел/категория" /></label><label className="offer-edit-field"><span>Хранене</span><input name="itinerary_meals" value={day.meals} onChange={(event) => updateItineraryDay(day.id, "meals", event.target.value)} placeholder="включено хранене" /></label><label className="offer-edit-field"><span>Транспорт</span><input name="itinerary_transport" value={day.transport} onChange={(event) => updateItineraryDay(day.id, "transport", event.target.value)} placeholder="вид транспорт" /></label></div><button type="button" onClick={() => removeItineraryDay(day.id)} disabled={itineraryDays.length === 1} aria-label="Премахни ден"><X size={16} aria-hidden="true" /></button></article>)}</div><div className="offer-itinerary-add-row"><button type="button" onClick={addItineraryDay}><Plus size={16} aria-hidden="true" />Добави ден</button></div></section>
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
                <p>Всяка услуга е на отделен ред. Запетаите вътре в изречението се запазват и не правят нова точка.</p>
              </div>
            </header>
            <div className="offer-services-columns">
              <label className="offer-service-list">
                <header>
                  <strong>Цената включва</strong>
                  <span>{includedServices.length} точки</span>
                </header>
                <textarea
                  className="offer-service-textarea"
                  value={includedServicesText}
                  onChange={(event) => setIncludedServicesText(event.target.value)}
                  placeholder={`Примерни точки:\n${defaultIncludedServices.join("\n")}`}
                  rows={10}
                />
                {includedServices.map((item, index) => <input type="hidden" name="included_services" value={item} key={`included-${index}-${item}`} />)}
              </label>
              <label className="offer-service-list">
                <header>
                  <strong>Цената не включва</strong>
                  <span>{excludedServices.length} точки</span>
                </header>
                <textarea
                  className="offer-service-textarea"
                  value={excludedServicesText}
                  onChange={(event) => setExcludedServicesText(event.target.value)}
                  placeholder={`Примерни точки:\n${defaultExcludedServices.join("\n")}`}
                  rows={7}
                />
                {excludedServices.map((item, index) => <input type="hidden" name="excluded_services" value={item} key={`excluded-${index}-${item}`} />)}
              </label>
            </div>
          </section>

          <footer className="offer-new-footer">
            {uploadSaveWarning ? (
              <span className="offer-save-message is-error">{uploadSaveWarning}</span>
            ) : statusMessage ? (
              <span className={statusOk ? "offer-save-message is-ok" : "offer-save-message is-error"}>{statusMessage}</span>
            ) : (
              <span />
            )}
            <div><button type="submit" formNoValidate disabled={isPending || isUploadingMedia}>{isPending ? "Записване..." : isUploadingMedia ? "Качване..." : secondarySubmitLabel}</button><button className="primary" type="submit" disabled={isPending || isUploadingMedia}>{isPending ? "Записване..." : isUploadingMedia ? "Качване..." : primarySubmitLabel}<ArrowRightIcon size={17} aria-hidden="true" /></button></div>
          </footer>
        </section>
      </form>

      <aside className="offer-new-side"><section className="offer-new-preview"><header><h2>Преглед на картата</h2></header><article><div className={heroPreview ? "offer-new-preview-image" : "offer-new-preview-image is-empty"} style={heroPreview ? { backgroundImage: `linear-gradient(180deg, rgba(0, 0, 0, 0.02), rgba(0, 0, 0, 0.16)), url("${heroPreview}")` } : undefined}><span>{selectedProductType?.label ?? "Тип оферта"}</span>{!heroPreview ? <div><ImageIcon size={34} aria-hidden="true" /><strong>Основната снимка ще се покаже тук</strong></div> : null}</div><div className="offer-new-preview-copy"><h3>{title || "Заглавие на офертата"}</h3><p><CalendarDays size={15} aria-hidden="true" />{durationDays || "0"} дни / {durationNights || "0"} нощувки <MapPin size={15} aria-hidden="true" />{routeLabel || "Маршрут"}</p><span>{derivedSummary || "Представянето ще се визуализира тук..."}</span></div></article></section></aside>
    </div>
  );
}
