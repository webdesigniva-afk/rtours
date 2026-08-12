"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bold,
  CalendarDays,
  ChevronDown,
  Code2,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  MapPin,
  MoreHorizontal,
  Plus,
  Plane,
  Trash2,
  Underline,
  X
} from "lucide-react";
import { AdminWorkspace } from "@/components/AdminWorkspace";
import { createAdminOffer } from "./actions";

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

type DraftItineraryDay = {
  id: string;
  day: number;
  title: string;
  description: string;
};

const defaultProductTypeOptions: ProductTypeOption[] = [
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

function UploadBox({
  name,
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
  name: string;
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
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [uploadError, setUploadError] = useState("");
  const hasUploadedFiles = uploadedUrls.length > 0;

  const resetFileInput = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? []);

    setFiles(nextFiles);
    setUploadError("");
    onFilesChange?.(nextFiles);

    if (nextFiles.length === 0) {
      if (!multiple) {
        onUploaded?.([]);
      }
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
          throw new Error(result?.error || "Upload failed");
        }

        const result = (await response.json()) as { url?: string };

        if (result.url) {
          uploadedUrlsFromUpload.push(result.url);
        }
      }

      const nextUploadedUrls = multiple ? [...uploadedUrls, ...uploadedUrlsFromUpload].slice(0, 20) : uploadedUrlsFromUpload.slice(0, 1);

      onUploaded?.(nextUploadedUrls);
      setUploadState("done");
      resetFileInput();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Файлът не беше качен. Провери размера, типа или настройките на Storage.");
      if (!multiple) {
        onUploaded?.([]);
      }
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
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple={multiple}
          required={required && !hasUploadedFiles}
          onChange={handleFileChange}
        />
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

export default function NewOfferPage() {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedSelectionRef = useRef<Range | null>(null);
  const uploadSessionIdRef = useRef(crypto.randomUUID());
  const [productType, setProductType] = useState("excursion");
  const [productTypeOptions, setProductTypeOptions] = useState(defaultProductTypeOptions);
  const [isProductTypeOpen, setIsProductTypeOpen] = useState(false);
  const [isAddingProductType, setIsAddingProductType] = useState(false);
  const [newProductTypeLabel, setNewProductTypeLabel] = useState("");
  const [productTypeError, setProductTypeError] = useState("");
  const [title, setTitle] = useState("");
  const [destinations, setDestinations] = useState<DraftDestination[]>([
    { id: "primary", country: "", region: "", city: "" }
  ]);
  const [durationDays, setDurationDays] = useState("6");
  const [durationNights, setDurationNights] = useState("5");
  const [transport, setTransport] = useState("flight");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [itineraryDays, setItineraryDays] = useState<DraftItineraryDay[]>([
    { id: "day-1", day: 1, title: "", description: "" }
  ]);
  const [heroPreview, setHeroPreview] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [galleryImageUrls, setGalleryImageUrls] = useState<string[]>([]);
  const [hasHeroImage, setHasHeroImage] = useState(false);
  const [activeEditorActions, setActiveEditorActions] = useState<string[]>([]);
  const [editorMode, setEditorMode] = useState<"visual" | "html">("visual");
  const [editorPanel, setEditorPanel] = useState<"format" | "link" | "image" | "more" | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const selectedProductType = productTypeOptions.find((option) => option.slug === productType) ?? productTypeOptions[0];
  const primaryDestination = destinations[0] ?? { id: "primary", country: "", region: "", city: "" };
  const country = primaryDestination.country;
  const region = primaryDestination.region || primaryDestination.city;
  const routeLabel = destinations
    .map((destination) => [destination.city, destination.region, destination.country].filter(Boolean).join(", "))
    .filter(Boolean)
    .join(" → ");
  const syncDescription = () => {
    setDescription(editorRef.current?.innerHTML ?? "");
  };

  const saveEditorSelection = () => {
    const selection = window.getSelection();

    if (selection && selection.rangeCount > 0 && editorRef.current?.contains(selection.anchorNode)) {
      savedSelectionRef.current = selection.getRangeAt(0).cloneRange();
    }
  };

  const restoreEditorSelection = () => {
    const selection = window.getSelection();

    if (!selection || !savedSelectionRef.current) {
      return;
    }

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
    if (editorMode === "html") {
      return;
    }

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

  useEffect(() => {
    let isMounted = true;

    fetch("/admin/offer-product-types")
      .then((response) => (response.ok ? response.json() : null))
      .then((result: { productTypes?: Array<{ slug: string; label: string; product_type: string; is_system: boolean }> } | null) => {
        if (!isMounted || !result?.productTypes) {
          return;
        }

        setProductTypeOptions(
          result.productTypes.map((item) => ({
            slug: item.slug,
            label: item.label,
            productType: item.product_type,
            isSystem: item.is_system
          }))
        );
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
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

    const option = {
      slug: result.productType.slug,
      label: result.productType.label,
      productType: result.productType.product_type,
      isSystem: result.productType.is_system
    };

    setProductTypeOptions((current) => [...current.filter((item) => item.slug !== option.slug), option]);
    setProductType(option.slug);
    setNewProductTypeLabel("");
    setIsAddingProductType(false);
    setIsProductTypeOpen(false);
  };

  const updateDestination = (id: string, field: keyof Omit<DraftDestination, "id">, value: string) => {
    setDestinations((current) =>
      current.map((destination) => (destination.id === id ? { ...destination, [field]: value } : destination))
    );
  };

  const addDestination = () => {
    setDestinations((current) => [...current, { id: crypto.randomUUID(), country: "", region: "", city: "" }]);
  };

  const removeDestination = (id: string) => {
    setDestinations((current) => (current.length === 1 ? current : current.filter((destination) => destination.id !== id)));
  };

  const renumberItineraryDays = (days: DraftItineraryDay[]) => days.map((day, index) => ({ ...day, day: index + 1 }));
  const updateItineraryDay = (id: string, field: "title" | "description", value: string) => {
    setItineraryDays((current) => current.map((day) => (day.id === id ? { ...day, [field]: value } : day)));
  };
  const addItineraryDay = () => {
    setItineraryDays((current) => [...current, { id: crypto.randomUUID(), day: current.length + 1, title: "", description: "" }]);
  };
  const removeItineraryDay = (id: string) => {
    setItineraryDays((current) => renumberItineraryDays(current.length === 1 ? current : current.filter((day) => day.id !== id)));
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
      if (editorRef.current) {
        editorRef.current.innerHTML = description;
      }
    });
  };

  useEffect(() => {
    document.addEventListener("selectionchange", syncEditorState);
    return () => document.removeEventListener("selectionchange", syncEditorState);
  }, []);

  const isEditorActionActive = (command: string) => activeEditorActions.includes(command);

  const keepEditorSelection = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const handleHeroFilesChange = (files: File[]) => {
    setHasHeroImage(files.length > 0);
    setHeroPreview((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      return files[0] ? URL.createObjectURL(files[0]) : "";
    });
  };

  useEffect(() => {
    return () => {
      if (heroPreview) {
        URL.revokeObjectURL(heroPreview);
      }
    };
  }, [heroPreview]);

  return (
    <AdminWorkspace active="offers">
      <section className="offer-new-page">
        <header className="offer-new-heading">
          <div>
            <h1>Нова оферта</h1>
            <p>Начало / Оферти / Нова оферта</p>
          </div>
          <Link href="/admin/offers">Към всички оферти</Link>
        </header>

        <nav className="offer-create-steps" aria-label="Стъпки при създаване на оферта">
          <span className="is-active">1. Оферта</span>
          <span>2. Дати и цени</span>
          <span>3. Публикуване</span>
        </nav>

        <div className="offer-new-layout">
          <form className="offer-new-form" action={createAdminOffer} encType="multipart/form-data">
            <section className="offer-new-card">
              <header className="offer-new-card-header">
                <div>
                  <span>Нова чернова</span>
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
                            className={option.slug === productType ? "is-selected" : ""}
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
                          <button className="is-add-option" type="button" onClick={() => setIsAddingProductType(true)}>
                            + Добави
                          </button>
                        )}
                      </div>
                    ) : null}
                  </div>
                </label>
                <label>
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
                  <datalist id="offer-country-options">
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
                          <input
                            name="destination_country"
                            value={destination.country}
                            onChange={(event) => updateDestination(destination.id, "country", event.target.value)}
                            list="offer-country-options"
                            placeholder="Започнете да пишете"
                            required={index === 0}
                          />
                        </label>
                        <label>
                          <span>Регион / дестинация {index === 0 ? <b>*</b> : null}</span>
                          <input
                            name="destination_region"
                            value={destination.region}
                            onChange={(event) => updateDestination(destination.id, "region", event.target.value)}
                            placeholder="Напр. Кападокия"
                            required={index === 0}
                          />
                        </label>
                        <label>
                          <span>Град</span>
                          <input
                            name="destination_city"
                            value={destination.city}
                            onChange={(event) => updateDestination(destination.id, "city", event.target.value)}
                            placeholder="По желание"
                          />
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
                      <input type="radio" name="is_author_program" value="yes" defaultChecked />
                      <span>Да</span>
                    </label>
                    <label>
                      <input type="radio" name="is_author_program" value="no" />
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
                    name="hero_image"
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
                      if (urls.length === 0) {
                        setHasHeroImage(false);
                        setHeroPreview((currentUrl) => {
                          if (currentUrl) {
                            URL.revokeObjectURL(currentUrl);
                          }

                          return "";
                        });
                      }
                    }}
                  />
                  <input type="hidden" name="hero_image_url" value={heroImageUrl} />
                </div>
                <div className="offer-new-field">
                  <span>Галерия (до 20 снимки)</span>
                  <UploadBox
                    name="gallery_images"
                    title="Качи още снимки"
                    hint="или плъзнете файловете тук"
                    action="Избери файлове"
                    uploadSessionId={uploadSessionIdRef.current}
                    role="gallery"
                    multiple
                    uploadedUrls={galleryImageUrls}
                    onUploaded={setGalleryImageUrls}
                  />
                  {galleryImageUrls.map((url) => (
                    <input type="hidden" name="gallery_image_urls" value={url} key={url} />
                  ))}
                </div>
              </div>

              <label className="offer-new-full-field">
                <span className="offer-new-label-line">
                  <span>Кратко описание <b>*</b></span>
                  <em>{summary.length}/160</em>
                </span>
                <div className="offer-new-counted-input">
                  <input name="summary" value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Кратко представяне на офертата (ще се показва в картите с оферти)" required maxLength={160} />
                </div>
              </label>

              <div className="offer-new-full-field">
                <span>Пълно описание <b>*</b></span>
                <div className="offer-new-editor">
                  <div className="offer-new-editor-toolbar">
                    <button
                      className={editorPanel === "format" ? "is-active" : ""}
                      type="button"
                      onMouseDown={keepEditorSelection}
                      onClick={() => openEditorPanel("format")}
                    >
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
                      {editorPanel === "link" ? (
                        <div className="offer-new-editor-inline-form">
                          <input value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://..." />
                          <button type="button" onClick={applyLink}>Добави линк</button>
                        </div>
                      ) : null}
                      {editorPanel === "image" ? (
                        <div className="offer-new-editor-inline-form">
                          <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="URL на изображение" />
                          <button type="button" onClick={applyImage}>Добави снимка</button>
                        </div>
                      ) : null}
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
                    <div
                      ref={editorRef}
                      className="offer-new-editor-surface"
                      contentEditable
                      role="textbox"
                      aria-multiline="true"
                      data-placeholder="Подробно описание на офертата..."
                      suppressContentEditableWarning
                      onInput={() => {
                        syncDescription();
                        saveEditorSelection();
                      }}
                      onKeyUp={() => {
                        syncEditorState();
                        saveEditorSelection();
                      }}
                      onMouseUp={() => {
                        syncEditorState();
                        saveEditorSelection();
                      }}
                    />
                  ) : (
                    <textarea className="offer-new-editor-html" value={description} onChange={(event) => setDescription(event.target.value)} spellCheck={false} />
                  )}
                  <input type="hidden" name="description" value={description} />
                </div>
              </div>

              <section className="offer-itinerary-editor">
                <header>
                  <div>
                    <h3>Програма по дни</h3>
                    <p>Добавете програмата като отделни дни. Така после сайтът ще я показва като подреден маршрут.</p>
                  </div>
                  <button type="button" onClick={addItineraryDay}>
                    <Plus size={16} aria-hidden="true" />
                    Добави ден
                  </button>
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
                          placeholder="Опишете програмата за този ден..."
                          rows={4}
                        />
                      </label>
                      <button type="button" onClick={() => removeItineraryDay(day.id)} disabled={itineraryDays.length === 1} aria-label="Премахни ден">
                        <X size={16} aria-hidden="true" />
                      </button>
                    </article>
                  ))}
                </div>
              </section>

              <footer className="offer-new-footer">
                <Link href="/admin/offers">Отказ</Link>
                <div>
                  <button type="submit" formNoValidate>
                    Запази чернова
                  </button>
                  <button className="primary" type="submit">
                    Запази и продължи
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
      </section>
    </AdminWorkspace>
  );
}
