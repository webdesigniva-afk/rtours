"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
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
  Plane,
  Underline
} from "lucide-react";
import { AdminWorkspace } from "@/components/AdminWorkspace";
import { createAdminOffer } from "./actions";

const productTypeLabels: Record<string, string> = {
  excursion: "Екскурзия",
  holiday: "Почивка",
  package: "Пакет",
  hotel: "Хотел",
  flight: "Самолетен билет"
};

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
  onFilesChange?: (files: File[]) => void;
  onUploaded?: (urls: string[]) => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [uploadError, setUploadError] = useState("");

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFiles = Array.from(event.target.files ?? []);

    setFiles(nextFiles);
    setUploadError("");
    onFilesChange?.(nextFiles);

    if (nextFiles.length === 0) {
      onUploaded?.([]);
      return;
    }

    setUploadState("uploading");

    try {
      const uploadedUrls: string[] = [];

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
          uploadedUrls.push(result.url);
        }
      }

      onUploaded?.(uploadedUrls);
      setUploadState("done");
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Файлът не беше качен. Провери размера, типа или настройките на Storage.");
      onUploaded?.([]);
      setUploadState("error");
    }
  };

  return (
    <label className="offer-new-upload">
      <ImageIcon size={30} aria-hidden="true" />
      <strong>{files.length > 0 ? `${files.length} избран${files.length === 1 ? " файл" : "и файла"}` : title}</strong>
      <span>{uploadState === "uploading" ? "Качване към системата..." : files.length > 0 ? files.map((file) => file.name).join(", ") : hint}</span>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple={multiple}
        required={required}
        onChange={handleFileChange}
      />
      <span className={`offer-new-upload-action is-${uploadState}`}>
        {uploadState === "uploading" ? "Качва се..." : uploadState === "done" ? "Качено" : uploadState === "error" ? "Грешка при качване" : action}
      </span>
      {uploadError ? <em>{uploadError}</em> : null}
    </label>
  );
}

export default function NewOfferPage() {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedSelectionRef = useRef<Range | null>(null);
  const uploadSessionIdRef = useRef(crypto.randomUUID());
  const [productType, setProductType] = useState("excursion");
  const [title, setTitle] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [durationDays, setDurationDays] = useState("6");
  const [durationNights, setDurationNights] = useState("5");
  const [transport, setTransport] = useState("flight");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [heroPreview, setHeroPreview] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [galleryImageUrls, setGalleryImageUrls] = useState<string[]>([]);
  const [hasHeroImage, setHasHeroImage] = useState(false);
  const [activeEditorActions, setActiveEditorActions] = useState<string[]>([]);
  const [editorMode, setEditorMode] = useState<"visual" | "html">("visual");
  const [editorPanel, setEditorPanel] = useState<"format" | "link" | "image" | "more" | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
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
                  <div className="offer-new-select-button">
                    <Plane size={18} aria-hidden="true" />
                    <select name="product_type" value={productType} onChange={(event) => setProductType(event.target.value)}>
                      <option value="excursion">Екскурзия</option>
                      <option value="holiday">Почивка</option>
                      <option value="package">Пакет</option>
                      <option value="hotel">Хотел</option>
                      <option value="flight">Самолетен билет</option>
                    </select>
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

                <label>
                  <span>Държава <b>*</b></span>
                  <input
                    name="country"
                    value={country}
                    onChange={(event) => setCountry(event.target.value)}
                    list="offer-country-options"
                    placeholder="Започнете да пишете държава"
                    required
                  />
                  <datalist id="offer-country-options">
                    {countryNames.map((name) => (
                      <option value={name} key={name} />
                    ))}
                  </datalist>
                </label>
                <label>
                  <span>Дестинация / регион <b>*</b></span>
                  <input name="region" value={region} onChange={(event) => setRegion(event.target.value)} placeholder="Напр. Кападокия" required />
                </label>

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
                    onFilesChange={handleHeroFilesChange}
                    onUploaded={(urls) => setHeroImageUrl(urls[0] ?? "")}
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
                  <span>{productTypeLabels[productType] ?? "ЕТИКЕТ"}</span>
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
                    {country || "Държава"}
                    <MapPin size={15} aria-hidden="true" />
                    {region || "Регион"}
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
