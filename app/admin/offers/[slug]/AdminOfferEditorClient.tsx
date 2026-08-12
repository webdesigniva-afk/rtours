"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import {
  Archive,
  CalendarDays,
  Camera,
  ChevronDown,
  CircleDot,
  Eye,
  ExternalLink,
  FileClock,
  Globe2,
  Heart,
  Image,
  Import,
  Info,
  Landmark,
  MapPin,
  MoreHorizontal,
  Plane,
  Plus,
  Save,
  Search,
  Share2,
  Sparkles,
  Tag,
  Users,
  WalletCards,
  X
} from "lucide-react";
import { AdminWorkspace } from "@/components/AdminWorkspace";
import { PublicOfferDetail, type PublicOfferDetailData } from "@/components/PublicOfferDetail";
import { publishOfferChanges, saveOfferDraft, updateOfferContent } from "./actions";

type OfferStatus = "draft" | "review" | "published" | "archived" | "needs_changes" | string;

export type AdminOfferEditorInitialOffer = {
  slug: string;
  productType: string;
  title: string;
  summary: string;
  description: string;
  country: string;
  region: string;
  durationDays: number;
  durationNights: number;
  priceFrom: number;
  currency: "EUR" | "BGN";
  status: OfferStatus;
  heroImageUrl: string;
  isAuthorProgram: boolean;
  itinerary: Array<{ day: number; title: string; description: string }>;
  createdAt: string;
  updatedAt: string;
};

type EditableItineraryDay = {
  id: string;
  day: number;
  title: string;
  description: string;
};

type ChoiceItem = {
  label: string;
  icon: typeof Heart;
};

type TagItem = {
  label: string;
  tone: "red" | "purple" | "green" | "orange" | "blue";
};

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

const availableCollections = ["Red Signature", "Red Escape", "Red Moments", "Red Escape Premium", "Семейни пътувания"];

const audience: ChoiceItem[] = [
  { label: "Двойки", icon: Heart },
  { label: "Семейства", icon: Users },
  { label: "Приятели", icon: Users },
  { label: "Соло пътешественици", icon: Users },
  { label: "Корпоративни клиенти", icon: Archive }
];

const experience: ChoiceItem[] = [
  { label: "Приключение", icon: Plane },
  { label: "Култура", icon: Landmark },
  { label: "Романтика", icon: Heart },
  { label: "Пълно спокойствие", icon: Sparkles },
  { label: "Нови вкусове", icon: Sparkles },
  { label: "Да открия нов свят", icon: Globe2 }
];

const interests: ChoiceItem[] = [
  { label: "История", icon: Heart },
  { label: "Природа", icon: Sparkles },
  { label: "Гастрономия", icon: Heart },
  { label: "Фотография", icon: Camera },
  { label: "Шопинг", icon: Archive },
  { label: "Вино", icon: Sparkles },
  { label: "Спорт", icon: Plane },
  { label: "Друго", icon: MoreHorizontal }
];

const travelType: ChoiceItem[] = [
  { label: "Екскурзия", icon: Landmark },
  { label: "Групово", icon: Users },
  { label: "Самолет", icon: Plane },
  { label: "Автобус", icon: Archive },
  { label: "Круиз", icon: Archive },
  { label: "Индивидуално", icon: Users },
  { label: "Комбинирано", icon: Share2 }
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
  if (tabKey === "publishing") return "Публикуване";
  return "Оферта";
}

export function AdminOfferEditorClient({ offer, initialTabKey }: { offer: AdminOfferEditorInitialOffer; initialTabKey?: string }) {
  const [activeTab, setActiveTab] = useState(tabFromKey(initialTabKey));
  const [status, setStatus] = useState<OfferStatus>(offer.status);
  const [selectedTags, setSelectedTags] = useState<TagItem[]>(availableTags.slice(0, 4));
  const [collections, setCollections] = useState(["Red Signature", "Red Escape", "Red Moments"]);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [showCollectionMenu, setShowCollectionMenu] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState(["Двойки"]);
  const [selectedExperience, setSelectedExperience] = useState(["Приключение", "Култура", "Нови вкусове", "Да открия нов свят"]);
  const [selectedInterests, setSelectedInterests] = useState(["История", "Гастрономия", "Фотография"]);
  const [selectedTravelType, setSelectedTravelType] = useState(["Екскурзия", "Групово", "Самолет"]);
  const [showOnHome, setShowOnHome] = useState(true);
  const [featuredByRedTours, setFeaturedByRedTours] = useState(true);
  const [showInSignature, setShowInSignature] = useState(true);
  const [showInPromo, setShowInPromo] = useState(false);
  const [priority, setPriority] = useState(10);
  const [message, setMessage] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const availableTagsToAdd = availableTags.filter((tag) => !selectedTags.some((selected) => selected.label === tag.label));
  const availableCollectionsToAdd = availableCollections.filter((collection) => !collections.includes(collection));

  const publicPreview = useMemo<PublicOfferDetailData>(
    () => ({
      slug: offer.slug,
      title: offer.title,
      summary: offer.summary,
      description: offer.description,
      country: offer.country,
      region: offer.region,
      durationDays: offer.durationDays,
      durationNights: offer.durationNights,
      priceFrom: offer.priceFrom,
      currency: offer.currency,
      priceNote: "Запитване преди потвърждение",
      productType: offer.productType,
      transport: "flight",
      isAuthorProgram: offer.isAuthorProgram,
      heroImage: offer.heroImageUrl,
      gallery: [],
      dates: [{ label: "Дати по заявка", startDate: "" }],
      itinerary: offer.itinerary,
      included: [],
      excluded: []
    }),
    [offer]
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
        status: offer.heroImageUrl ? "partial" : "missing",
        percent: offer.heroImageUrl ? 45 : 0,
        filled: offer.heroImageUrl ? ["Основна снимка"] : [],
        missing: offer.heroImageUrl ? ["Галерия", "Alt текстове"] : ["Основна снимка", "Галерия"]
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
    [collections, featuredByRedTours, offer, priority, selectedTags, selectedTravelType, showInPromo, showInSignature, showOnHome]
  );

  const workflowStatus: Record<string, { status: SectionStatus; percent: number; filled: string[]; missing: string[] }> = {
    "Оферта": {
      status: offer.title && offer.country && offer.region && offer.summary && offer.heroImageUrl ? "partial" : "missing",
      percent: Math.round(
        ([
          offer.title,
          offer.productType,
          offer.country,
          offer.region,
          offer.durationDays,
          offer.summary,
          offer.description,
          offer.heroImageUrl
        ].filter(Boolean).length /
          9) *
          100
      ),
      filled: [
        offer.title ? `Заглавие: ${offer.title}` : "",
        offer.country && offer.region ? `Дестинация: ${offer.country}, ${offer.region}` : "",
        offer.durationDays ? `Продължителност: ${offer.durationDays} дни / ${offer.durationNights} нощувки` : "",
        offer.summary ? "Кратко описание: попълнено" : "",
        offer.description ? "Пълно описание: попълнено" : "",
        offer.heroImageUrl ? "Основна снимка: качена" : "",
        offer.itinerary.length ? `Програма: ${offer.itinerary.length} дни` : ""
      ].filter(Boolean),
      missing: [
        !offer.description ? "Пълно описание" : "",
        !offer.heroImageUrl ? "Основна снимка" : "",
        !offer.itinerary.length ? "Програма по дни" : "",
        "Какво включва цената",
        "Какво не включва",
        "Допълнителни услуги",
        "Галерия / видео"
      ].filter(Boolean)
    },
    "Дати и цени": {
      status: offer.priceFrom ? "partial" : "missing",
      percent: offer.priceFrom ? 35 : 0,
      filled: offer.priceFrom ? [`Базова цена от: ${offer.priceFrom.toLocaleString("bg-BG")} ${offer.currency}`] : [],
      missing: ["Поне едно отпътуване", "Капацитет и места", "Ценови варианти", "Депозит и срок за плащане"]
    },
    "Публикуване": {
      status: selectedTags.length && (showOnHome || featuredByRedTours || showInSignature || showInPromo) ? "partial" : "missing",
      percent: Math.min(95, selectedTags.length * 10 + collections.length * 8 + selectedTravelType.length * 6 + (showOnHome ? 12 : 0) + (featuredByRedTours ? 10 : 0) + (showInSignature ? 10 : 0)),
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
    }
  };

  const activeSection = tabs.find((tab) => tab.label === activeTab) ?? tabs[0];
  const activeSectionStatus = workflowStatus[activeSection.label];
  const completionPercent = Math.round(
    Object.values(workflowStatus).reduce((sum, section) => sum + section.percent, 0) / Object.values(workflowStatus).length
  );

  function removeTag(label: string) {
    setSelectedTags((current) => current.filter((tag) => tag.label !== label));
  }

  function addTag(tag: TagItem) {
    setSelectedTags((current) => [...current, tag]);
    setShowTagMenu(false);
  }

  function saveDraft() {
    startTransition(async () => {
      const result = await saveOfferDraft(offer.slug);
      if (result.ok) {
        setStatus(result.status);
        setMessage("Черновата е запазена. Статусът е синхронизиран в системата.");
      }
    });
  }

  function publishChanges() {
    startTransition(async () => {
      const result = await publishOfferChanges(offer.slug);
      if (result.ok) {
        setStatus(result.status);
        setMessage("Промените са публикувани и публичната оферта е обновена.");
      }
    });
  }

  const activeTag = selectedTags[0];

  return (
    <AdminWorkspace active="offers">
      <section className="offer-editor">
        <div className="offer-editor-breadcrumb">
          <span>Оферти</span>
          <span>{offer.title}</span>
        </div>

        <header className="offer-editor-header">
          <div>
            <div className="offer-title-line">
              <h1>{offer.title}</h1>
              <span className={statusClass(status)}>
                <CircleDot size={12} aria-hidden="true" />
                {statusLabel(status)}
              </span>
            </div>
            <p>
              {productTypeLabel(offer.productType)} · {offer.country} · {offer.region} · {offer.durationDays} дни / {offer.durationNights} нощувки
            </p>
          </div>
          <div className="offer-editor-actions">
            <button type="button" onClick={() => setIsPreviewOpen(true)}>
              <Eye size={17} aria-hidden="true" />
              Преглед в сайта
            </button>
            <button type="button" onClick={saveDraft} disabled={isPending}>
              <Save size={17} aria-hidden="true" />
              Запази чернова
            </button>
            <button className="primary" type="button" onClick={publishChanges} disabled={isPending}>
              Публикувай промените
              <ChevronDown size={17} aria-hidden="true" />
            </button>
          </div>
        </header>

        {message ? <p className="offer-editor-feedback">{message}</p> : null}

        <section className="offer-editor-navigator" aria-label="Структура на офертата">
          <header>
            <div>
              <h2>Редакция на офертата</h2>
              <p>Секциите показват какво е попълнено и къде липсва информация.</p>
            </div>
            <strong>{completionPercent}% готова</strong>
          </header>
          <nav className="offer-editor-tabs" aria-label="Секции на офертата">
            {tabs.map((tab) => {
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

        <div className="offer-editor-grid">
          <div className="offer-editor-main">
            <section className="offer-editor-section-summary">
              <header>
                <div>
                  <span className={`offer-section-state is-${activeSectionStatus.status}`}>{sectionStatusLabel(activeSectionStatus.status, activeSectionStatus.percent)}</span>
                  <h2>{activeSection.label}</h2>
                  <p>{activeSection.description}</p>
                </div>
              </header>
              <div>
                <SummaryList title="Попълнено" items={activeSectionStatus.filled} empty="Още няма въведени данни в тази секция." />
                <SummaryList title="Остава" items={activeSectionStatus.missing} empty="Няма критични липси в тази секция." warning />
              </div>
            </section>

            {activeTab === "Публикуване" ? (
              <>
                <section className="offer-editor-card">
                  <header>
                    <h2>Етикети</h2>
                    <span>показват се върху офертата в сайта</span>
                  </header>
                  <div className="offer-chip-row">
                    {selectedTags.map((tag) => (
                      <button className={`offer-chip offer-chip-${tag.tone}`} type="button" key={tag.label} onClick={() => removeTag(tag.label)} aria-label={`Премахни ${tag.label}`}>
                        {tag.label}
                        <X size={14} aria-hidden="true" />
                      </button>
                    ))}
                    <div className="offer-add-wrap">
                      <button className="offer-chip-add" type="button" onClick={() => setShowTagMenu((value) => !value)} aria-expanded={showTagMenu}>
                        <Plus size={16} aria-hidden="true" />
                        Добави етикет
                      </button>
                      {showTagMenu ? (
                        <div className="offer-add-menu">
                          {availableTagsToAdd.length > 0 ? (
                            availableTagsToAdd.map((tag) => (
                              <button className={`offer-chip-${tag.tone}`} type="button" key={tag.label} onClick={() => addTag(tag)}>
                                {tag.label}
                              </button>
                            ))
                          ) : (
                            <span>Всички етикети са избрани</span>
                          )}
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
                    {collections.map((collection) => (
                      <button className="offer-collection-chip" type="button" key={collection} onClick={() => setCollections((current) => current.filter((item) => item !== collection))}>
                        {collection}
                        <X size={14} aria-hidden="true" />
                      </button>
                    ))}
                    <div className="offer-add-wrap offer-add-wrap-wide">
                      <button className="offer-select-wide" type="button" onClick={() => setShowCollectionMenu((value) => !value)} aria-label="Избери колекция" aria-expanded={showCollectionMenu}>
                        <ChevronDown size={18} aria-hidden="true" />
                      </button>
                      {showCollectionMenu ? (
                        <div className="offer-add-menu">
                          {availableCollectionsToAdd.length > 0 ? (
                            availableCollectionsToAdd.map((collection) => (
                              <button type="button" key={collection} onClick={() => {
                                setCollections((current) => [...current, collection]);
                                setShowCollectionMenu(false);
                              }}>
                                {collection}
                              </button>
                            ))
                          ) : (
                            <span>Всички колекции са избрани</span>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </section>

                <ChoiceSection title="Подходящо за" items={audience} selected={selectedAudience} onToggle={(label) => setSelectedAudience((current) => toggleValue(current, label))} audience />
                <ChoiceSection title="Преживяване" subtitle="Как искаш да се почувстваш?" items={experience} selected={selectedExperience} onToggle={(label) => setSelectedExperience((current) => toggleValue(current, label))} />
                <ChoiceSection title="Интереси" items={interests} selected={selectedInterests} onToggle={(label) => setSelectedInterests((current) => toggleValue(current, label))} />
                <ChoiceSection title="Тип пътуване" items={travelType} selected={selectedTravelType} onToggle={(label) => setSelectedTravelType((current) => toggleValue(current, label))} />
              </>
            ) : activeTab === "Дати и цени" ? (
              <DatesPricesWorkspace offer={offer} />
            ) : (
              <OfferContentWorkspace offer={offer} />
            )}

            <section className="offer-preview-card">
              <header>
                <h2>Предварителен преглед в сайта</h2>
              </header>
              <article>
                <div
                  className={offer.heroImageUrl ? "offer-preview-image" : "offer-preview-image offer-preview-image-empty"}
                  style={offer.heroImageUrl ? { backgroundImage: `linear-gradient(180deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.24)), url("${offer.heroImageUrl}")` } : undefined}
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
                  <span>от</span>
                  <strong>
                    {offer.priceFrom.toLocaleString("bg-BG")} {offer.currency}
                  </strong>
                  <button type="button" onClick={() => setIsPreviewOpen(true)}>Виж офертата</button>
                </div>
              </article>
            </section>
          </div>

          <aside className="offer-editor-side">
            <section className="offer-side-card">
              <h2>Статус</h2>
              <p className={`${statusClass(status)} offer-live-status`}>
                <CircleDot size={12} aria-hidden="true" />
                {statusLabel(status)}
              </p>
              <dl>
                <div>
                  <dt>Създадена на:</dt>
                  <dd>{formatDateTime(offer.createdAt)}</dd>
                </div>
                <div>
                  <dt>Последна редакция:</dt>
                  <dd>{formatDateTime(offer.updatedAt)}</dd>
                </div>
                <div>
                  <dt>Версия:</dt>
                  <dd>1.7</dd>
                </div>
              </dl>
            </section>

            <section className="offer-side-card">
              <h2>Етикети</h2>
              <div className="offer-side-tags">
                {selectedTags.map((tag) => (
                  <button className={`offer-chip-${tag.tone}`} type="button" key={tag.label} onClick={() => removeTag(tag.label)}>
                    {tag.label}
                    <X size={13} aria-hidden="true" />
                  </button>
                ))}
              </div>
              <button className="offer-chip-add" type="button" onClick={() => setShowTagMenu((value) => !value)}>
                <Plus size={16} aria-hidden="true" />
                Добави етикет
              </button>
            </section>

            <section className="offer-side-card">
              <h2>Бързо позициониране</h2>
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
            </section>
          </aside>
        </div>
      </section>

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

function SummaryList({ title, items, empty, warning = false }: { title: string; items: string[]; empty: string; warning?: boolean }) {
  const visibleItems = items.filter(Boolean);

  return (
    <section className={warning ? "offer-summary-list is-warning" : "offer-summary-list"}>
      <h3>{title}</h3>
      {visibleItems.length > 0 ? (
        <ul>
          {visibleItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>{empty}</p>
      )}
    </section>
  );
}

function OfferContentWorkspace({ offer }: { offer: AdminOfferEditorInitialOffer }) {
  const [state, action, isPending] = useActionState(updateOfferContent, { ok: false, message: "" });
  const [itineraryDays, setItineraryDays] = useState<EditableItineraryDay[]>(
    offer.itinerary.length
      ? offer.itinerary.map((day) => ({
          id: crypto.randomUUID(),
          day: day.day,
          title: day.title,
          description: day.description
        }))
      : [{ id: crypto.randomUUID(), day: 1, title: "", description: "" }]
  );

  const renumberItineraryDays = (days: EditableItineraryDay[]) => days.map((day, index) => ({ ...day, day: index + 1 }));
  const updateItineraryDay = (id: string, field: "title" | "description", value: string) => {
    setItineraryDays((current) => current.map((day) => (day.id === id ? { ...day, [field]: value } : day)));
  };
  const addItineraryDay = () => {
    setItineraryDays((current) => [...current, { id: crypto.randomUUID(), day: current.length + 1, title: "", description: "" }]);
  };
  const removeItineraryDay = (id: string) => {
    setItineraryDays((current) => renumberItineraryDays(current.length === 1 ? current : current.filter((day) => day.id !== id)));
  };

  return (
    <form className="offer-workflow-stack" action={action}>
      <input type="hidden" name="slug" value={offer.slug} />
      <section className="offer-editor-card">
        <header>
          <h2>Основно</h2>
          <span>това е скелетът на офертата</span>
        </header>
        <div className="offer-field-grid">
          <label className="offer-edit-field">
            <span>Тип</span>
            <select name="product_type" defaultValue={offer.productType}>
              <option value="excursion">Екскурзия</option>
              <option value="holiday">Почивка</option>
              <option value="package">Пакет</option>
              <option value="hotel">Хотел</option>
              <option value="flight">Самолетен билет</option>
              <option value="service">Услуга</option>
            </select>
          </label>
          <label className="offer-edit-field is-wide">
            <span>Заглавие</span>
            <input name="title" defaultValue={offer.title} required maxLength={120} />
          </label>
          <label className="offer-edit-field">
            <span>Държава</span>
            <input name="country" defaultValue={offer.country} />
          </label>
          <label className="offer-edit-field">
            <span>Дестинация / регион</span>
            <input name="region" defaultValue={offer.region} />
          </label>
          <label className="offer-edit-field">
            <span>Дни</span>
            <input name="duration_days" defaultValue={offer.durationDays} inputMode="numeric" />
          </label>
          <label className="offer-edit-field">
            <span>Нощувки</span>
            <input name="duration_nights" defaultValue={offer.durationNights} inputMode="numeric" />
          </label>
          <label className="offer-edit-field">
            <span>Транспорт</span>
            <select name="transport" defaultValue="flight">
              <option value="flight">Самолет</option>
              <option value="bus">Автобус</option>
              <option value="own_transport">Собствен транспорт</option>
              <option value="mixed">Комбинирано</option>
            </select>
          </label>
          <label className="offer-edit-field">
            <span>Авторска програма</span>
            <select name="is_author_program" defaultValue={offer.isAuthorProgram ? "yes" : "no"}>
              <option value="yes">Да</option>
              <option value="no">Не</option>
            </select>
          </label>
        </div>
      </section>

      <section className="offer-editor-card">
        <header>
          <h2>Съдържание</h2>
          <span>текстовете, които клиентът ще чете в сайта</span>
        </header>
        <div className="offer-content-blocks">
          <label className="offer-edit-field is-wide">
            <span>Кратко описание</span>
            <textarea name="summary" defaultValue={offer.summary} maxLength={240} rows={3} />
          </label>
          <label className="offer-edit-field is-wide">
            <span>Пълно описание</span>
            <textarea name="description" defaultValue={offer.description} rows={8} />
          </label>
          <section className="offer-itinerary-editor">
            <header>
              <div>
                <h3>Програма по дни</h3>
                <p>Всеки ден се записва отделно, за да може сайтът да го показва като красив маршрут.</p>
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
        </div>
      </section>

      <section className="offer-editor-card">
        <header>
          <h2>Медия</h2>
          <span>основна снимка, галерия и видео</span>
        </header>
        <div className="offer-media-grid">
          <div className={offer.heroImageUrl ? "offer-media-tile has-image" : "offer-media-tile"} style={offer.heroImageUrl ? { backgroundImage: `url("${offer.heroImageUrl}")` } : undefined}>
            <strong>Основна снимка</strong>
            <span>{offer.heroImageUrl ? "Качена" : "Липсва"}</span>
          </div>
          <div className="offer-media-tile">
            <strong>Галерия</strong>
            <span>Добави снимки</span>
          </div>
          <div className="offer-media-tile">
            <strong>Видео</strong>
            <span>Добави линк или файл</span>
          </div>
        </div>
        <div className="offer-workflow-footer">
          {state.message ? <span className={state.ok ? "offer-save-message is-ok" : "offer-save-message is-error"}>{state.message}</span> : null}
          <button type="submit" disabled={isPending}>{isPending ? "Записване..." : "Запази офертата"}</button>
        </div>
      </section>
    </form>
  );
}

function DatesPricesWorkspace({ offer }: { offer: AdminOfferEditorInitialOffer }) {
  return (
    <div className="offer-workflow-stack">
      <section className="offer-editor-card">
        <header>
          <h2>Отпътувания</h2>
          <span>една оферта може да има много дати, без да се дублира съдържанието</span>
        </header>
        <div className="offer-departure-table">
          <div>
            <strong>От</strong>
            <strong>До</strong>
            <strong>Места</strong>
            <strong>Цена от</strong>
            <strong>Статус</strong>
          </div>
          <button type="button">
            <span>12.09.2026</span>
            <span>17.09.2026</span>
            <span>48</span>
            <span>{offer.priceFrom.toLocaleString("bg-BG")} {offer.currency}</span>
            <em>Активно</em>
          </button>
          <button type="button">
            <span>26.09.2026</span>
            <span>01.10.2026</span>
            <span>48</span>
            <span>{(offer.priceFrom + 50).toLocaleString("bg-BG")} {offer.currency}</span>
            <em>Активно</em>
          </button>
        </div>
        <div className="offer-workflow-footer">
          <button type="button">
            <Plus size={16} aria-hidden="true" />
            Добави отпътуване
          </button>
        </div>
      </section>

      <section className="offer-editor-card">
        <header>
          <h2>Ценови варианти за избрана дата</h2>
          <span>оперативните цени стоят към конкретното отпътуване</span>
        </header>
        <div className="offer-price-variants">
          {["Възрастен в двойна стая", "Единична стая", "Дете", "Трети възрастен", "Депозит", "Срок за плащане", "Капацитет", "Хотел / транспорт"].map((item) => (
            <ReadOnlyField label={item} value="Предстои попълване" key={item} />
          ))}
        </div>
      </section>
    </div>
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
