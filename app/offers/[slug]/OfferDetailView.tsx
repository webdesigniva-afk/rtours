import { InquiryForm } from "@/components/InquiryForm";
import { CalendarDays, CheckCircle2, Clock3, MapPin, Plane, XCircle } from "lucide-react";
import type { Offer, OfferSupplierSection } from "@/lib/types";
import styles from "./OfferDetailView.module.css";

function repairText(value: string | undefined | null, fallback = "") {
  const text = value || fallback;
  if (!/[ÃÐÑÂâ]/.test(text)) return text;

  let current = text;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const bytes = Uint8Array.from(current, (character) => character.charCodeAt(0));
      const next = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      if (next === current) break;
      current = next;
    } catch {
      break;
    }
  }

  return current;
}

function cleanText(value: string | undefined | null) {
  return repairText(value)
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

function paragraphs(value: string | undefined | null) {
  return cleanText(value).split(/\n+/).map((item) => item.trim()).filter(Boolean);
}

function comparableDestinationPart(value: string | undefined | null) {
  return (value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase("bg-BG");
}

function uniqueDestinationParts(...parts: Array<string | undefined | null>) {
  const seen = new Set<string>();
  return parts.filter((part) => {
    const normalized = comparableDestinationPart(part);
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function destinationLabel(offer: Offer) {
  const destinations = offer.destinations?.length
    ? offer.destinations.map((destination) => uniqueDestinationParts(destination.city, destination.region, destination.country).join(", "))
    : [uniqueDestinationParts(offer.city, offer.region, offer.country).join(", ")];

  return destinations.map((item) => cleanText(item)).filter(Boolean).join(" -> ") || "Дестинация по програма";
}

function destinationPointName(destination: NonNullable<Offer["destinations"]>[number]) {
  return cleanText(destination.city || destination.region || destination.country);
}

function compactDestinationLabel(offer: Offer) {
  const destinations = offer.destinations || [];
  if (destinations.length <= 2) return destinationLabel(offer);

  const countries = Array.from(new Set(destinations.map((destination) => cleanText(destination.country)).filter(Boolean)));
  const destinationCountLabel = destinations.length === 1 ? "дестинация" : "дестинации";

  return `${countries.length === 1 ? countries[0] : "Маршрут"} · ${destinations.length} ${destinationCountLabel}`;
}

function priceLabel(value?: number, currency?: string) {
  return value && value > 0 ? `${value.toLocaleString("bg-BG")} ${currency || ""}`.trim() : "при запитване";
}

function transportLabel(value?: Offer["transport"] | string) {
  if (value === "flight") return "Самолет";
  if (value === "bus") return "Автобус";
  if (value === "own_transport") return "Собствен транспорт";
  if (value === "mixed") return "Комбиниран транспорт";
  return value ? repairText(value) : "По програма";
}

function dateRange(date: Offer["dates"][number]) {
  return [date.startDate, date.endDate].filter(Boolean).join(" - ") || cleanText(date.label) || "Дата по запитване";
}

function primaryDateLabel(offer: Offer) {
  const date = offer.dates.find((item) => item.startDate || item.endDate || item.label);
  return date ? dateRange(date) : "По запитване";
}

function durationLabel(offer: Offer) {
  const days = offer.durationDays || 0;
  const nights = offer.durationNights || 0;
  if (days && nights) return `${days} дни / ${nights} нощувки`;
  if (days) return `${days} дни`;
  if (nights) return `${nights} нощувки`;
  return "По програма";
}

function collectionBadgeLabel(slugs: string[]) {
  const redCollection = slugs.find((slug) => /^red[-_]/i.test(slug));
  if (!redCollection) return "";

  return redCollection
    .replace(/[-_]+/g, " ")
    .replace(/\bred\b/i, "RED")
    .toLocaleUpperCase("bg-BG");
}

function itineraryTitleIfSpecific(title: string | undefined | null, dayNumber: number) {
  const text = repairText(title).trim();
  if (!text) return "";
  const normalized = text
    .toLocaleLowerCase("bg-BG")
    .replace(/\s+/g, " ")
    .replace(/[–—]/g, "-")
    .trim();
  const genericPattern = new RegExp(`^(ден|day)\\s*[-:.#№]?\\s*0*${dayNumber}\\.?$`, "iu");
  return genericPattern.test(normalized) ? "" : text;
}

function supplierPublicSection(section: OfferSupplierSection) {
  if (section.publicSection) return section.publicSection;
  if (section.type === "hotel") return "accommodation";
  if (section.type === "service") return "services";
  if (section.type === "additional_service") return "extras";
  if (["useful_info", "payment_policy", "cancel_policy", "insurance"].includes(section.type)) return "conditions";
  return "internal";
}

function supplierGroupTitle(type: string) {
  if (type === "service") return "Услуги от доставчика";
  if (type === "additional_service") return "Допълнителни услуги";
  if (type === "useful_info") return "Полезна информация";
  if (type === "payment_policy") return "Условия за плащане";
  if (type === "cancel_policy") return "Анулационни условия";
  if (type === "insurance") return "Застраховки";
  return "Важна информация";
}

function supplierSectionRows(sections: OfferSupplierSection[]) {
  return sections.filter((section) => cleanText(section.title) || cleanText(section.body) || cleanText(section.meta));
}

function SupplierSectionCards({ sections }: { sections: OfferSupplierSection[] }) {
  const rows = supplierSectionRows(sections);
  if (!rows.length) return null;

  return (
    <div className={styles.supplierCards}>
      {rows.map((section, index) => {
        const body = paragraphs(section.body);
        const title = repairText(section.title || section.body || section.meta || `Елемент ${index + 1}`);

        return (
          <article key={`${section.type}-${section.title}-${index}`}>
            <header>
              <h3>{title}</h3>
              {section.meta ? <span>{repairText(section.meta)}</span> : null}
            </header>
            {body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.url ? <a href={section.url} target="_blank" rel="noreferrer">Вижте повече</a> : null}
          </article>
        );
      })}
    </div>
  );
}

export function OfferDetailView({ offer }: { offer: Offer }) {
  const title = repairText(offer.title, "Оферта");
  const route = destinationLabel(offer);
  const heroRoute = compactDestinationLabel(offer);
  const images = Array.from(new Set([offer.heroImage, ...(offer.gallery || [])].filter(Boolean)));
  const heroImage = images[0];
  const galleryImages = images.slice(1).length ? images.slice(1) : images;
  const galleryPreviewImages = galleryImages.slice(0, 6);
  const galleryExtraImages = galleryImages.slice(6);
  const description = paragraphs(offer.description || offer.summary);
  const highlights = (offer.highlights || []).map((highlight) => repairText(highlight).trim()).filter(Boolean);
  const includedItems = (offer.included || []).map((item) => cleanText(item)).filter(Boolean);
  const excludedItems = (offer.excluded || []).map((item) => cleanText(item)).filter(Boolean);
  const redCollectionBadge = collectionBadgeLabel(offer.collectionSlugs || []);
  const hasPrice = Boolean(offer.priceFrom && offer.priceFrom > 0);
  const supplierSections = offer.supplierSections || [];
  const publicSupplierSections = supplierSections.filter((section) => !["internal", "media"].includes(supplierPublicSection(section)));
  const accommodationSections = publicSupplierSections.filter((section) => supplierPublicSection(section) === "accommodation");
  const supplierServiceSections = publicSupplierSections.filter((section) => supplierPublicSection(section) === "services");
  const additionalServiceSections = publicSupplierSections.filter((section) => supplierPublicSection(section) === "extras");
  const usefulInfoSections = publicSupplierSections.filter((section) => supplierPublicSection(section) === "conditions");
  const knownPublicSections = ["accommodation", "services", "extras", "conditions"];
  const otherSupplierSections = publicSupplierSections.filter((section) => !knownPublicSections.includes(supplierPublicSection(section)));
  const conditionTypes = Array.from(new Set([
    "useful_info",
    "payment_policy",
    "cancel_policy",
    "insurance",
    ...usefulInfoSections.map((section) => section.type)
  ]));

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroBackdrop} aria-hidden="true">
          {heroImage ? <img src={heroImage} alt="" /> : null}
        </div>
        <div className={styles.heroCopy}>
          <nav className={styles.breadcrumbs} aria-label="Навигация">
            <a href="/">Начало</a>
            <span>/</span>
            <a href="/offers">Пътувания</a>
            <span>/</span>
            <span title={route}>{heroRoute}</span>
          </nav>
          {redCollectionBadge ? <span className={styles.heroBadge}>{redCollectionBadge}</span> : null}
          <h1>{title}</h1>

          <div className={styles.heroFacts} aria-label="Основна информация">
            <div>
              <CalendarDays size={23} aria-hidden="true" />
              <span>
                <strong>{primaryDateLabel(offer)}</strong>
                <small>Дати на пътуване</small>
              </span>
            </div>
            <div>
              <Plane size={23} aria-hidden="true" />
              <span>
                <strong>{transportLabel(offer.transport)}</strong>
                <small>Вид транспорт</small>
              </span>
            </div>
            <div>
              <Clock3 size={23} aria-hidden="true" />
              <span>
                <strong>{durationLabel(offer)}</strong>
                <small>Продължителност</small>
              </span>
            </div>
            <div>
              <MapPin size={23} aria-hidden="true" />
              <span>
                <strong title={route}>{heroRoute}</strong>
                <small>Дестинация</small>
              </span>
            </div>
          </div>

          <div className={styles.heroActions}>
            {hasPrice ? (
              <div className={styles.heroPrice}>
                <span>от</span>
                <strong>{priceLabel(offer.priceFrom, offer.currency)}</strong>
                <small>на човек</small>
              </div>
            ) : null}
            <a className={styles.heroInquiry} href="#inquiry-form">
              Изпратете запитване
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </section>

      {(description.length || galleryPreviewImages.length) ? (
        <section className={styles.intro}>
          {galleryPreviewImages.length ? (
            <details className={styles.introGallery}>
              <summary aria-label={galleryExtraImages.length ? `Покажи още ${galleryExtraImages.length} снимки` : "Галерия"}>
                {galleryPreviewImages.map((image, index) => {
                  const isLastPreview = index === galleryPreviewImages.length - 1 && galleryExtraImages.length > 0;

                  return (
                    <span className={isLastPreview ? styles.hasMorePhotos : undefined} key={image}>
                      <img src={image} alt={`${title} - снимка ${index + 1}`} />
                      {isLastPreview ? <strong>+{galleryExtraImages.length}</strong> : null}
                    </span>
                  );
                })}
              </summary>
              {galleryExtraImages.length ? (
                <div className={styles.introGalleryExtra}>
                  {galleryExtraImages.map((image, index) => (
                    <img src={image} alt={`${title} - допълнителна снимка ${index + 1}`} key={image} />
                  ))}
                </div>
              ) : null}
            </details>
          ) : null}

          {description.length ? (
            <div className={styles.introCopy}>
              <h2>За пътуването</h2>
              {description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          ) : null}
        </section>
      ) : null}

      {highlights.length ? (
        <section className={styles.highlightsSection}>
          <div className={styles.highlightsPrompt}>
            <h2>Защо ще харесате това пътуване</h2>
            <svg className={styles.highlightsArrow} viewBox="0 0 96 68" aria-hidden="true" focusable="false">
              <path d="M35 8 C35 34 50 46 76 46" />
              <path d="M66 35 L78 46 L66 57" />
            </svg>
          </div>
          <ol className={styles.highlights}>
            {highlights.map((highlight, index) => (
              <li key={`${highlight}-${index}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{highlight}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {offer.itinerary.length ? (
        <section className={styles.programSection}>
          <div className={styles.programIntro}>
            <span>Програма</span>
            <h2>Маршрутът ден по ден</h2>
            <p>{durationLabel(offer)} · {heroRoute}</p>
          </div>
          <div className={styles.programTimeline}>
            {offer.itinerary.map((day) => {
              const dayTitle = itineraryTitleIfSpecific(day.title, day.day);
              const dayParagraphs = paragraphs(day.description);
              const logistics = [day.accommodation, day.meals, day.transport].map((item) => cleanText(item)).filter(Boolean);

              return (
                <article className={styles.programDay} key={`${day.day}-${day.title}`}>
                  <div className={styles.programMarker}>
                    <span>Ден</span>
                    <strong>{day.day}</strong>
                  </div>
                  <div className={styles.programCard}>
                    {dayTitle ? <h3>{dayTitle}</h3> : null}
                    {dayParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    {logistics.length ? (
                      <div className={styles.programLogistics}>
                        {logistics.map((item) => <span key={item}>{item}</span>)}
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {(includedItems.length || excludedItems.length) ? (
        <section className={styles.priceScopeSection}>
          <article className={styles.priceScopeColumn}>
            <h2>В цената е включено</h2>
            {includedItems.length ? (
              <ul>
                {includedItems.map((item) => (
                  <li key={item}>
                    <CheckCircle2 aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>

          <article className={styles.priceScopeColumn}>
            <h2>В цената не е включено</h2>
            {excludedItems.length ? (
              <ul>
                {excludedItems.map((item) => (
                  <li key={item}>
                    <XCircle aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        </section>
      ) : null}

      <div className={styles.layout}>
        <div className={styles.main}>
          {offer.hotelOptions?.length ? (
            <section className={styles.section}>
              <h2>Изберете хотел към програмата</h2>
              <div className={styles.hotelGrid}>
                {offer.hotelOptions.map((hotel) => (
                  <article className={styles.hotelCard} key={hotel.key}>
                    {hotel.imageUrl ? <img src={hotel.imageUrl} alt={repairText(hotel.title)} /> : <div className={styles.hotelNoImage}>Снимка предстои</div>}
                    <div>
                      <h3>
                        {repairText(hotel.title)}
                        {hotel.category ? <span>{repairText(hotel.category)}</span> : null}
                      </h3>
                      <p>{hotel.destination || route}</p>
                      <strong>{hotel.priceFrom ? `от ${priceLabel(hotel.priceFrom, hotel.currency)}` : "цена при запитване"}</strong>
                      {hotel.rooms.length ? <small>{hotel.rooms.map((room) => repairText(room)).join(", ")}</small> : null}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {supplierSectionRows(accommodationSections).length ? (
            <section className={styles.section}>
              <h2>Настаняване</h2>
              <SupplierSectionCards sections={accommodationSections} />
            </section>
          ) : null}

          {offer.dates.length ? (
            <section className={styles.section}>
              <h2>Дати и цени</h2>
              <div className={styles.dateGrid}>
                {offer.dates.map((date, index) => (
                  <article key={`${date.startDate}-${date.label}-${index}`}>
                    <h3>{dateRange(date)}</h3>
                    <p>{date.departurePoints ? `Отпътуване от: ${cleanText(date.departurePoints)}` : "Отпътуване по програма"}</p>
                    <strong>{priceLabel(date.priceFrom || offer.priceFrom, date.currency || offer.currency)}</strong>
                    {date.seatsAvailable !== undefined ? <span>{date.seatsAvailable} свободни места</span> : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {offer.priceMatrices?.length ? (
            <section className={styles.section}>
              <h2>Цени по тип настаняване</h2>
              <div className={styles.matrixStack}>
                {offer.priceMatrices.map((matrix, index) => (
                  <article key={`${matrix.title}-${index}`}>
                    <h3>{repairText(matrix.title) || `Варианти ${index + 1}`}</h3>
                    {matrix.hotel || matrix.note ? <p>{[matrix.hotel, matrix.note].map((item) => cleanText(item)).filter(Boolean).join(" - ")}</p> : null}
                    <div className={styles.tableWrap}>
                      <table className={styles.priceMatrix}>
                        <thead>
                          <tr>
                            <th>Дата</th>
                            {matrix.columns.map((column) => <th key={column.key}>{repairText(column.label)}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {matrix.rows.map((row) => (
                            <tr key={row.date}>
                              <td>{row.date}</td>
                              {matrix.columns.map((column) => <td key={column.key}>{row.cells[column.key] || "STOP!"}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {supplierSectionRows(supplierServiceSections).length ? (
            <section className={styles.section}>
              <h2>Услуги от доставчика</h2>
              <SupplierSectionCards sections={supplierServiceSections} />
            </section>
          ) : null}

          {supplierSectionRows(additionalServiceSections).length ? (
            <section className={styles.section}>
              <h2>Допълнителни услуги</h2>
              <SupplierSectionCards sections={additionalServiceSections} />
            </section>
          ) : null}

          {supplierSectionRows(usefulInfoSections).length ? (
            <section className={styles.section}>
              <h2>Важна информация</h2>
              <div className={styles.conditions}>
                {conditionTypes.map((type) => {
                  const sections = usefulInfoSections.filter((section) => section.type === type);
                  if (!supplierSectionRows(sections).length) return null;

                  return (
                    <article key={type}>
                      <h3>{supplierGroupTitle(type)}</h3>
                      <SupplierSectionCards sections={sections} />
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

          {supplierSectionRows(otherSupplierSections).length ? (
            <section className={styles.section}>
              <h2>Още информация</h2>
              <SupplierSectionCards sections={otherSupplierSections} />
            </section>
          ) : null}

          <section className={styles.inquiryCard} id="inquiry-form">
            <h2>Запитване</h2>
            <InquiryForm
              offerTitle={title}
              offerSlug={offer.slug}
              destination={route}
              dates={offer.dates.map((date) => ({ label: dateRange(date), startDate: date.startDate }))}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
