"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { adminSessionCookieName, verifyAdminSessionToken } from "@/lib/adminSession";
import { formatDisplayDateRange } from "@/lib/dateFormat";
import { dbQuery } from "@/lib/db";

async function requireAdminSession(slug: string) {
  const cookieStore = await cookies();
  const session = await verifyAdminSessionToken(cookieStore.get(adminSessionCookieName)?.value);

  if (!session) {
    redirect(`/admin/login?next=/admin/offers/${slug}`);
  }
}

export async function saveOfferDraft(slug: string) {
  await requireAdminSession(slug);

  await dbQuery(
    `
      update offers
      set status = 'draft',
          updated_at = now()
      where slug = $1
    `,
    [slug]
  );

  revalidatePath(`/admin/offers/${slug}`);
  revalidatePath("/admin/offers");
  revalidatePath(`/offers/${slug}`);

  return { ok: true, status: "draft" as const };
}

export async function publishOfferChanges(slug: string) {
  await requireAdminSession(slug);

  const validation = await dbQuery<{
    id: string;
    title: string | null;
    summary: string | null;
    description: string | null;
    country: string | null;
    region: string | null;
    duration_days: number | null;
    transport: string | null;
    hero_image_url: string | null;
    itinerary_count: number;
    included_count: number;
    excluded_count: number;
    active_departures_count: number;
    taxonomy_count: number;
    visibility_count: number;
  }>(
    `
      select
        id,
        nullif(title, '') as title,
        nullif(summary, '') as summary,
        nullif(description, '') as description,
        country,
        region,
        duration_days,
        transport::text,
        hero_image_url,
        (
          select count(*)::int
          from offer_itinerary_days day
          where day.offer_id = offers.id
        ) as itinerary_count,
        (
          select count(*)::int
          from offer_services service
          where service.offer_id = offers.id
            and service.service_type = 'included'
        ) as included_count,
        (
          select count(*)::int
          from offer_services service
          where service.offer_id = offers.id
            and service.service_type = 'excluded'
        ) as excluded_count,
        (
          select count(*)::int
          from offer_dates date
          where date.offer_id = offers.id
            and date.availability <> 'sold_out'
        ) as active_departures_count
        ,
        (
          select count(*)::int
          from offer_taxonomy_terms assigned
          where assigned.offer_id = offers.id
        ) as taxonomy_count,
        (
          select count(*)::int
          from offer_visibility_rules rule
          where rule.offer_id = offers.id
            and rule.is_enabled = true
            and rule.placement in ('offers_index', 'search', 'homepage', 'collection_page', 'promo_section', 'destination_page')
        ) as visibility_count
      from offers
      where slug = $1
      limit 1
    `,
    [slug]
  );
  const offer = validation.rows[0];

  if (!offer) {
    return { ok: false, status: "draft" as const, message: "Офертата не беше намерена." };
  }

  const missing = [
    !offer.title ? "заглавие" : "",
    !offer.summary ? "кратко описание" : "",
    !offer.description ? "пълно описание" : "",
    !offer.country ? "държава" : "",
    !offer.region ? "регион / дестинация" : "",
    !offer.duration_days ? "продължителност" : "",
    !offer.transport ? "транспорт" : "",
    !offer.hero_image_url ? "основна снимка" : "",
    offer.itinerary_count === 0 ? "програма по дни" : "",
    offer.included_count === 0 ? "включени услуги" : "",
    offer.excluded_count === 0 ? "невключени услуги" : "",
    offer.active_departures_count === 0 ? "поне едно активно отпътуване / ценови ред" : "",
    offer.taxonomy_count === 0 ? "категоризация / taxonomy етикети" : "",
    offer.visibility_count === 0 ? "правила за показване в сайта" : ""
  ].filter(Boolean);

  if (missing.length > 0) {
    return {
      ok: false,
      status: "draft" as const,
      message: `Преди публикуване липсва: ${missing.join(", ")}.`
    };
  }

  await dbQuery(
    `
      update offers
      set status = 'published',
          publish_at = coalesce(publish_at, now()),
          updated_at = now()
      where slug = $1
    `,
    [slug]
  );

  revalidatePath(`/admin/offers/${slug}`);
  revalidatePath("/admin/offers");
  revalidatePath(`/offers/${slug}`);

  return { ok: true, status: "published" as const, message: "Промените са публикувани и публичната оферта е обновена." };
}

export async function cancelNewOfferDraft(slug: string) {
  await requireAdminSession(slug);

  const result = await dbQuery<{ slug: string }>(
    `
      delete from offers
      where slug = $1
        and status = 'draft'
        and (
          review_notes ilike $2
          or review_notes ilike $3
          or slug like 'nova-oferta%'
        )
      returning slug
    `,
    [slug, "%празна чернова%", "%[new-offer-draft]%"]
  );

  if (result.rows.length === 0) {
    return { ok: false, message: "Редакцията е затворена без изтриване." };
  }

  revalidatePath("/admin/offers");
  revalidatePath(`/admin/offers/${slug}`);
  redirect("/admin/offers");
}

export async function createOfferBadge(slug: string, label: string) {
  await requireAdminSession(slug);

  const normalizedLabel = label.trim();
  if (!normalizedLabel) {
    return { ok: false, message: "Въведи име на етикет." };
  }

  const offerResult = await dbQuery<{ id: string }>("select id from offers where slug = $1 limit 1", [slug]);
  const offerId = offerResult.rows[0]?.id;

  if (!offerId) {
    return { ok: false, message: "Офертата не беше намерена." };
  }

  const termSlug = slugifyLabel(normalizedLabel);
  const termResult = await dbQuery<{ id: string; name: string; public_label: string | null }>(
    `
      insert into taxonomy_terms (type, slug, name, public_label, color, icon, sort_order)
      values ('badge', $1, $2, $2, '#b52b26', 'tag', 100)
      on conflict (type, slug) do update
      set name = excluded.name,
          public_label = excluded.public_label,
          updated_at = now()
      returning id, name, public_label
    `,
    [termSlug, normalizedLabel]
  );
  const term = termResult.rows[0];

  if (!term) {
    return { ok: false, message: "Етикетът не беше записан." };
  }

  await dbQuery(
    `
      insert into offer_taxonomy_terms (offer_id, term_id, source, confidence)
      values ($1, $2, 'manual', 100)
      on conflict (offer_id, term_id) do nothing
    `,
    [offerId, term.id]
  );

  revalidatePath(`/admin/offers/${slug}`);
  revalidatePath("/admin/offers");
  revalidatePath("/offers");
  revalidatePath(`/offers/${slug}`);
  revalidatePath("/");

  return { ok: true, label: term.public_label || term.name, message: "Етикетът е добавен и записан." };
}

export type OfferPublishingSettingsInput = {
  terms: Array<{ type: string; label: string }>;
  visibilityRules: Array<{ placement: string; isEnabled: boolean; priority: number }>;
};

export async function updateOfferPublishing(slug: string, input: OfferPublishingSettingsInput) {
  await requireAdminSession(slug);

  const offerResult = await dbQuery<{ id: string }>("select id from offers where slug = $1 limit 1", [slug]);
  const offerId = offerResult.rows[0]?.id;

  if (!offerId) {
    return { ok: false, message: "Офертата не беше намерена." };
  }

  const controlledTypes = ["badge", "collection", "audience", "mood", "theme", "category"];
  const termInputs = input.terms
    .map((term) => ({
      type: taxonomyTermTypeValues.has(term.type) ? term.type : "",
      label: term.label.trim()
    }))
    .filter((term, index, terms) => term.type && term.label && terms.findIndex((item) => item.type === term.type && item.label.toLowerCase() === term.label.toLowerCase()) === index);

  await dbQuery(
    `
      delete from offer_taxonomy_terms assigned
      using taxonomy_terms term
      where assigned.term_id = term.id
        and assigned.offer_id = $1
        and term.type = any($2::taxonomy_term_type[])
    `,
    [offerId, controlledTypes]
  );

  for (const termInput of termInputs) {
    const termSlug = slugifyLabel(termInput.label);
    const termResult = await dbQuery<{ id: string }>(
      `
        insert into taxonomy_terms (type, slug, name, public_label, color, icon, sort_order)
        values ($1::taxonomy_term_type, $2, $3, $3, '#b52b26', 'tag', 100)
        on conflict (type, slug) do update
        set name = excluded.name,
            public_label = excluded.public_label,
            updated_at = now()
        returning id
      `,
      [termInput.type, termSlug, termInput.label]
    );
    const termId = termResult.rows[0]?.id;

    if (termId) {
      await dbQuery(
        `
          insert into offer_taxonomy_terms (offer_id, term_id, source, confidence)
          values ($1, $2, 'manual', 100)
          on conflict (offer_id, term_id) do update
          set source = excluded.source,
              confidence = excluded.confidence
        `,
        [offerId, termId]
      );
    }
  }

  const controlledPlacements = ["homepage", "offers_index", "collection_page", "destination_page", "search", "promo_section", "private_link", "hidden"];
  const visibilityRules = input.visibilityRules
    .map((rule) => ({
      placement: visibilityPlacementValues.has(rule.placement) ? rule.placement : "",
      isEnabled: Boolean(rule.isEnabled),
      priority: Number.isFinite(Number(rule.priority)) ? Number(rule.priority) : 0
    }))
    .filter((rule, index, rules) => rule.placement && rules.findIndex((item) => item.placement === rule.placement) === index);

  await dbQuery(
    `
      delete from offer_visibility_rules
      where offer_id = $1
        and placement = any($2::offer_visibility_placement[])
    `,
    [offerId, controlledPlacements]
  );

  for (const rule of visibilityRules) {
    await dbQuery(
      `
        insert into offer_visibility_rules (offer_id, placement, is_enabled, priority)
        values ($1, $2::offer_visibility_placement, $3, $4)
        on conflict (offer_id, placement) do update
        set is_enabled = excluded.is_enabled,
            priority = excluded.priority,
            updated_at = now()
      `,
      [offerId, rule.placement, rule.isEnabled, rule.priority]
    );
  }

  await dbQuery("update offers set updated_at = now() where id = $1", [offerId]);

  revalidatePath(`/admin/offers/${slug}`);
  revalidatePath("/admin/offers");
  revalidatePath("/offers");
  revalidatePath(`/offers/${slug}`);
  revalidatePath("/");

  return { ok: true, message: "Публикуването, taxonomy етикетите и показването в сайта са записани." };
}

type OfferContentActionState = {
  ok: boolean;
  message: string;
};

export type OfferDatesPricesActionState = {
  ok: boolean;
  message: string;
};

export type OfferSeoActionState = {
  ok: boolean;
  message: string;
  newSlug?: string;
};

type OfferDestinationInput = {
  country: string;
  region: string;
  city: string;
};

function slugifyLabel(label: string) {
  return label
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9а-я]+/giu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `tag-${Date.now()}`;
}

function slugifyUrl(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ъ/g, "a")
    .replace(/ь/g, "y")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);

  return normalized || `offer-${Date.now()}`;
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readPositiveInteger(formData: FormData, key: string) {
  const value = Number.parseInt(readString(formData, key), 10);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function inferDurationNights(days: number | null, nights: number | null) {
  if (nights !== null) return nights;
  if (days !== null) return Math.max(days - 1, 0);
  return null;
}

function readNonNegativeIntegerValue(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function readMoneyValue(value: string) {
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function readStringList(formData: FormData, key: string) {
  return formData.getAll(key).map((value) => (typeof value === "string" ? value.trim() : ""));
}

function readDestinations(formData: FormData): OfferDestinationInput[] {
  const countries = readStringList(formData, "destination_country");
  const regions = readStringList(formData, "destination_region");
  const cities = readStringList(formData, "destination_city");
  const rowCount = Math.max(countries.length, regions.length, cities.length);
  const destinations: OfferDestinationInput[] = [];

  for (let index = 0; index < rowCount; index += 1) {
    const country = countries[index] ?? "";
    const region = regions[index] ?? "";
    const city = cities[index] ?? "";

    if (!country && !region && !city) {
      continue;
    }

    destinations.push({
      country: country || "Дестинация",
      region,
      city
    });
  }

  return destinations;
}

const productTypeValues = new Set(["excursion", "holiday", "hotel", "flight", "service", "package"]);
const transportValues = new Set(["flight", "bus", "own_transport", "mixed"]);
const availabilityValues = new Set(["available", "limited", "on_request", "sold_out"]);
const priceStatusValues = new Set(["fixed", "option_until", "dynamic", "budgetary"]);
const taxonomyTermTypeValues = new Set(["category", "theme", "audience", "mood", "badge", "collection", "transport", "service_type", "destination_style", "season"]);
const visibilityPlacementValues = new Set(["homepage", "offers_index", "collection_page", "destination_page", "search", "promo_section", "private_link", "hidden"]);

export async function updateOfferContent(_state: OfferContentActionState, formData: FormData): Promise<OfferContentActionState> {
  const offerIdInput = readString(formData, "offer_id");
  const slug = readString(formData, "slug");
  await requireAdminSession(slug);

  const title = readString(formData, "title");
  const afterSave = readString(formData, "after_save");
  const shouldExitAfterSave = afterSave === "admin_offers";
  const shouldContinueToDates = afterSave === "dates_prices";

  if (!slug) {
    return { ok: false, message: "Липсва оферта за запис." };
  }

  const productType = readString(formData, "product_type");
  const productTypeLabel = readString(formData, "product_type_label");
  const transport = readString(formData, "transport");
  const destinations = readDestinations(formData);
  const primaryDestination = destinations[0];
  const durationDays = readPositiveInteger(formData, "duration_days");
  const durationNights = inferDurationNights(durationDays, readNonNegativeIntegerValue(readString(formData, "duration_nights")));
  const itineraryDayNumbers = readStringList(formData, "itinerary_day_number");
  const itineraryTitles = readStringList(formData, "itinerary_title");
  const itineraryDescriptions = readStringList(formData, "itinerary_description");
  const itineraryAccommodations = readStringList(formData, "itinerary_accommodation");
  const itineraryMeals = readStringList(formData, "itinerary_meals");
  const itineraryTransports = readStringList(formData, "itinerary_transport");
  const heroImageUrl = readString(formData, "hero_image_url") || null;
  const galleryImageUrls = readStringList(formData, "gallery_image_urls").filter(Boolean).slice(0, 20);
  const imageAltTexts = readStringList(formData, "image_alt_texts");
  const itineraryRows = itineraryTitles
    .map((dayTitle, index) => ({
      dayNumber: Number.parseInt(itineraryDayNumbers[index] || `${index + 1}`, 10),
      title: dayTitle,
      description: itineraryDescriptions[index] || "",
      accommodation: itineraryAccommodations[index] || "",
      meals: itineraryMeals[index] || "",
      transport: itineraryTransports[index] || ""
    }))
    .filter((day) => day.title || day.description || day.accommodation || day.meals || day.transport);
  const highlights = readStringList(formData, "highlights").filter(Boolean).slice(0, 5);
  const includedServices = readStringList(formData, "included_services").filter(Boolean);
  const excludedServices = readStringList(formData, "excluded_services").filter(Boolean);
  const description = readString(formData, "description");
  const submittedCountry = primaryDestination?.country || readString(formData, "country");
  const submittedRegion = primaryDestination?.region || primaryDestination?.city || readString(formData, "region");
  const submittedSummary = readString(formData, "summary");
  const hasSubmittedContent = Boolean(
    title ||
      productTypeValues.has(productType) ||
      productTypeLabel ||
      transportValues.has(transport) ||
      durationDays ||
      durationNights ||
      submittedCountry ||
      submittedRegion ||
      destinations.length ||
      submittedSummary ||
      description ||
      heroImageUrl ||
      galleryImageUrls.length ||
      itineraryRows.length ||
      includedServices.length ||
      excludedServices.length
  );

  await dbQuery(
    `
      update offers
      set product_type = case when $2 <> '' then $2::offer_product_type else product_type end,
          product_type_label = nullif($13, ''),
          title = $3,
          country = nullif($4, ''),
          region = nullif($5, ''),
          duration_days = $6,
          duration_nights = $7,
          transport = case when $8 <> '' then $8::transport_type else transport end,
          summary = nullif($9, ''),
          description = coalesce(nullif($10, ''), description),
          is_author_program = $11,
          hero_image_url = coalesce($12, hero_image_url),
          updated_at = now()
      where id = nullif($14, '')::uuid
         or ($14 = '' and slug = $1)
    `,
    [
      slug,
      productTypeValues.has(productType) ? productType : "",
      title,
      submittedCountry,
      submittedRegion,
      durationDays,
      durationNights,
      transportValues.has(transport) ? transport : "",
      submittedSummary,
      description,
      readString(formData, "is_author_program") !== "no",
      heroImageUrl,
      productTypeValues.has(productType) ? productTypeLabel : "",
      offerIdInput
    ]
  );

  const offerResult = await dbQuery<{ id: string }>(
    "select id from offers where id = nullif($1, '')::uuid or ($1 = '' and slug = $2) limit 1",
    [offerIdInput, slug]
  );
  const offerId = offerResult.rows[0]?.id;

  if (offerId) {
    await dbQuery("delete from offer_itinerary_days where offer_id = $1", [offerId]);
    await dbQuery("delete from offer_highlights where offer_id = $1", [offerId]);
    await dbQuery("delete from offer_services where offer_id = $1", [offerId]);
    await dbQuery("delete from offer_destinations where offer_id = $1", [offerId]);

    const destinationRows = destinations.length > 0
      ? destinations
      : submittedCountry || submittedRegion
        ? [{ country: submittedCountry || "Дестинация", region: submittedRegion, city: "" }]
        : [];

    for (const [index, destination] of destinationRows.entries()) {
      await dbQuery(
        `
          insert into offer_destinations (offer_id, country, region, city, is_primary, sort_order)
          values ($1, $2, nullif($3, ''), nullif($4, ''), $5, $6)
        `,
        [offerId, destination.country, destination.region, destination.city, index === 0, index]
      );
    }

    if (heroImageUrl) {
      await dbQuery("delete from offer_media where offer_id = $1 and is_primary = true", [offerId]);
      await dbQuery(
        `
          insert into offer_media (offer_id, url, alt, source, is_primary, sort_order)
          values ($1, $2, $3, 'redtours', true, 0)
        `,
        [offerId, heroImageUrl, imageAltTexts[0] || title]
      );
    }

    await dbQuery("delete from offer_media where offer_id = $1 and is_primary = false", [offerId]);

    for (const [index, url] of galleryImageUrls.entries()) {
      await dbQuery(
        `
          insert into offer_media (offer_id, url, alt, source, is_primary, sort_order)
          values ($1, $2, $3, 'redtours', false, $4)
        `,
        [offerId, url, imageAltTexts[index + 1] || `${title} - снимка ${index + 1}`, index + 1]
      );
    }

    for (const [index, day] of itineraryRows.entries()) {
      await dbQuery(
        `
          insert into offer_itinerary_days (offer_id, day_number, title, description, accommodation, meals, transport, sort_order)
          values ($1, $2, $3, nullif($4, ''), nullif($5, ''), nullif($6, ''), nullif($7, ''), $8)
        `,
        [offerId, Number.isFinite(day.dayNumber) && day.dayNumber > 0 ? day.dayNumber : index + 1, day.title || `Ден ${index + 1}`, day.description, day.accommodation, day.meals, day.transport, index]
      );
    }

    for (const [index, highlight] of highlights.entries()) {
      await dbQuery(
        `
          insert into offer_highlights (offer_id, label, sort_order)
          values ($1, $2, $3)
        `,
        [offerId, highlight, index]
      );
    }

    const serviceRows = [
      ...includedServices.map((label, index) => ({ type: "included", label, sortOrder: index })),
      ...excludedServices.map((label, index) => ({ type: "excluded", label, sortOrder: index }))
    ];

    for (const service of serviceRows) {
      await dbQuery(
        `
          insert into offer_services (offer_id, service_type, label, sort_order)
          values ($1, $2, $3, $4)
        `,
        [offerId, service.type, service.label, service.sortOrder]
      );
    }
  }

  if (hasSubmittedContent || shouldExitAfterSave) {
    await dbQuery(
      `
        update offers
        set status = 'draft',
            review_notes = nullif(trim(replace(coalesce(review_notes, ''), '[new-offer-draft] Създадена е празна чернова. Всички промени в редактора се записват автоматично.', '')), ''),
            updated_at = now()
        where id = nullif($2, '')::uuid
           or ($2 = '' and slug = $1)
      `,
      [slug, offerIdInput]
    );
  }

  revalidatePath(`/admin/offers/${slug}`);
  revalidatePath("/admin/offers");
  revalidatePath("/offers");
  revalidatePath(`/offers/${slug}`);
  revalidatePath("/");

  if (shouldExitAfterSave) {
    redirect("/admin/offers");
  }

  if (shouldContinueToDates) {
    redirect(`/admin/offers/${slug}?tab=dates-prices`);
  }

  return { ok: true, message: heroImageUrl ? "Офертата е записана. Основната снимка е записана към офертата." : "Офертата е записана. Няма получена основна снимка в заявката." };
}

export async function updateOfferSeo(_state: OfferSeoActionState, formData: FormData): Promise<OfferSeoActionState> {
  const currentSlug = readString(formData, "slug");
  await requireAdminSession(currentSlug);

  if (!currentSlug) {
    return { ok: false, message: "Липсва оферта за запис." };
  }

  const offerResult = await dbQuery<{ id: string; title: string; summary: string | null }>(
    "select id, title, summary from offers where slug = $1 limit 1",
    [currentSlug]
  );
  const offer = offerResult.rows[0];

  if (!offer) {
    return { ok: false, message: "Офертата не беше намерена." };
  }

  const nextSlug = slugifyUrl(readString(formData, "seo_slug") || currentSlug);
  const metaTitle = readString(formData, "seo_meta_title") || offer.title;
  const metaDescription = readString(formData, "seo_meta_description") || offer.summary || "";
  const canonicalUrl = readString(formData, "seo_canonical_url");
  const keywords = readString(formData, "seo_keywords")
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean)
    .slice(0, 20);
  const structuredDataType = readString(formData, "seo_structured_data_type") || "TouristTrip";

  if (nextSlug !== currentSlug) {
    const duplicateResult = await dbQuery<{ id: string }>("select id from offers where slug = $1 and id <> $2 limit 1", [nextSlug, offer.id]);

    if (duplicateResult.rows.length) {
      return { ok: false, message: "Този URL адрес вече се използва от друга оферта." };
    }
  }

  await dbQuery(
    `
      update offers
      set slug = $2,
          seo_meta_title = nullif($3, ''),
          seo_meta_description = nullif($4, ''),
          seo_keywords = $5::text[],
          seo_canonical_url = nullif($6, ''),
          seo_structured_data_type = nullif($7, ''),
          updated_at = now()
      where id = $1
    `,
    [offer.id, nextSlug, metaTitle, metaDescription, keywords, canonicalUrl, structuredDataType]
  );

  revalidatePath(`/admin/offers/${currentSlug}`);
  revalidatePath(`/admin/offers/${nextSlug}`);
  revalidatePath("/admin/offers");
  revalidatePath("/offers");
  revalidatePath(`/offers/${currentSlug}`);
  revalidatePath(`/offers/${nextSlug}`);
  revalidatePath("/");

  return {
    ok: true,
    message: "SEO данните са записани и публичната страница ще ги използва.",
    newSlug: nextSlug
  };
}

export async function updateOfferDatesPrices(_state: OfferDatesPricesActionState, formData: FormData): Promise<OfferDatesPricesActionState> {
  const slug = readString(formData, "slug");
  await requireAdminSession(slug);

  if (!slug) {
    return { ok: false, message: "Липсва оферта за запис." };
  }

  const offerResult = await dbQuery<{ id: string }>("select id from offers where slug = $1 limit 1", [slug]);
  const offerId = offerResult.rows[0]?.id;

  if (!offerId) {
    return { ok: false, message: "Офертата не беше намерена." };
  }

  const shouldContinueToPublishing = readString(formData, "after_save") === "publishing";
  const ids = readStringList(formData, "departure_id");
  const labels = readStringList(formData, "departure_label");
  const starts = readStringList(formData, "departure_start");
  const ends = readStringList(formData, "departure_end");
  const departurePoints = readStringList(formData, "departure_points");
  const seatsTotals = readStringList(formData, "departure_seats_total");
  const seatsConfirmed = readStringList(formData, "departure_seats_confirmed");
  const seatsOption = readStringList(formData, "departure_seats_option");
  const seatsAvailable = readStringList(formData, "departure_seats_available");
  const prices = readStringList(formData, "departure_price_from");
  const currencies = readStringList(formData, "departure_currency");
  const priceStatuses = readStringList(formData, "departure_price_status");
  const optionUntilValues = readStringList(formData, "departure_option_until");
  const statuses = readStringList(formData, "departure_status");
  const deposits = readStringList(formData, "departure_deposit");
  const paymentDueDays = readStringList(formData, "departure_payment_due_days");
  const notes = readStringList(formData, "departure_notes");

  const rows = starts
    .map((startDate, index) => ({
      id: ids[index] || "",
      label: labels[index] || "",
      startDate,
      endDate: ends[index] || "",
      departurePoints: departurePoints[index] || "",
      seatsTotal: readNonNegativeIntegerValue(seatsTotals[index] || ""),
      seatsConfirmed: readNonNegativeIntegerValue(seatsConfirmed[index] || ""),
      seatsOption: readNonNegativeIntegerValue(seatsOption[index] || ""),
      seatsAvailable: readNonNegativeIntegerValue(seatsAvailable[index] || ""),
      priceFrom: readMoneyValue(prices[index] || ""),
      currency: currencies[index] === "BGN" ? "BGN" : "EUR",
      priceStatus: priceStatusValues.has(priceStatuses[index] || "") ? priceStatuses[index] : "budgetary",
      optionUntil: optionUntilValues[index] || "",
      availability: availabilityValues.has(statuses[index] || "") ? statuses[index] : "on_request",
      depositAmount: readMoneyValue(deposits[index] || ""),
      paymentDueDays: readNonNegativeIntegerValue(paymentDueDays[index] || ""),
      notes: notes[index] || ""
    }))
    .filter((row) => row.label || row.startDate || row.endDate || row.departurePoints || row.priceFrom !== null || row.seatsTotal !== null || row.seatsConfirmed !== null || row.seatsOption !== null || row.seatsAvailable !== null || row.depositAmount !== null || row.paymentDueDays !== null || row.notes);

  if (rows.some((row) => row.startDate && row.endDate && row.endDate < row.startDate)) {
    return { ok: false, message: "Има отпътуване, при което крайната дата е преди началната." };
  }

  if (rows.some((row) => row.priceStatus === "option_until" && !row.optionUntil)) {
    return { ok: false, message: "При price status OPTION UNTIL трябва да има дата и час за валидност." };
  }

  if (rows.some((row) => row.seatsTotal !== null && row.seatsAvailable !== null && row.seatsAvailable > row.seatsTotal)) {
    return { ok: false, message: "Свободните места не могат да са повече от общия капацитет." };
  }

  if (rows.some((row) => {
    if (row.seatsTotal === null) {
      return false;
    }

    const committedSeats = (row.seatsConfirmed ?? 0) + (row.seatsOption ?? 0) + (row.seatsAvailable ?? 0);
    return committedSeats > row.seatsTotal;
  })) {
    return { ok: false, message: "Потвърдените, опциите и свободните места не могат общо да надвишават капацитета." };
  }

  for (const [index, row] of rows.entries()) {
    const params = [
      offerId,
      row.label || formatDisplayDateRange(row.startDate, row.endDate) || null,
      row.startDate,
      row.endDate,
      row.departurePoints,
      row.availability,
      row.seatsTotal,
      row.seatsConfirmed,
      row.seatsOption,
      row.seatsAvailable,
      row.priceFrom,
      row.currency,
      row.priceStatus,
      row.optionUntil,
      row.depositAmount,
      row.paymentDueDays,
      row.notes,
      index
    ];

    if (row.id) {
      await dbQuery(
        `
          update offer_dates
          set label = $2,
              start_date = nullif($3, '')::date,
              end_date = nullif($4, '')::date,
              departure_points = nullif($5, ''),
              availability = $6::availability_status,
              seats_total = $7,
              seats_confirmed = $8,
              seats_option = $9,
              seats_available = $10,
              price_from = $11,
              currency = $12,
              price_status = $13::price_status,
              option_until = nullif($14, '')::timestamptz,
              deposit_amount = $15,
              payment_due_days = $16,
              notes = nullif($17, ''),
              sort_order = $18,
              updated_at = now()
          where id = $19
            and offer_id = $1
        `,
        [...params, row.id]
      );
    } else {
      await dbQuery(
        `
          insert into offer_dates (
            offer_id,
            label,
            start_date,
            end_date,
            departure_points,
            availability,
            seats_total,
            seats_confirmed,
            seats_option,
            seats_available,
            price_from,
            currency,
            price_status,
            option_until,
            deposit_amount,
            payment_due_days,
            notes,
            sort_order,
            updated_at
          )
          values (
            $1,
            $2,
            nullif($3, '')::date,
            nullif($4, '')::date,
            nullif($5, ''),
            $6::availability_status,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12,
            $13::price_status,
            nullif($14, '')::timestamptz,
            $15,
            $16,
            nullif($17, ''),
            $18,
            now()
          )
        `,
        params
      );
    }
  }

  await dbQuery(
    `
      update offers
      set price_from = coalesce(
            (
              select min(date.price_from)
              from offer_dates date
              where date.offer_id = offers.id
                and date.price_from is not null
                and date.availability <> 'sold_out'
            ),
            price_from
          ),
          currency = coalesce(
            (
              select date.currency
              from offer_dates date
              where date.offer_id = offers.id
                and date.price_from is not null
                and date.availability <> 'sold_out'
              order by date.price_from asc, date.sort_order asc
              limit 1
            ),
            currency
          ),
          updated_at = now()
      where id = $1
    `,
    [offerId]
  );

  revalidatePath(`/admin/offers/${slug}`);
  revalidatePath("/admin/offers");
  revalidatePath("/offers");
  revalidatePath(`/offers/${slug}`);
  revalidatePath("/");

  if (shouldContinueToPublishing) {
    redirect(`/admin/offers/${slug}?tab=publishing`);
  }

  return { ok: true, message: rows.length ? "Датите и цените са записани." : "Няма въведени нови данни за дати и цени." };
}

export async function updateOfferSupplierApiReview(_state: { ok: boolean; message: string }, formData: FormData): Promise<{ ok: boolean; message: string }> {
  const slug = readString(formData, "slug");
  const importId = readString(formData, "import_id");
  await requireAdminSession(slug);

  if (!importId) {
    return { ok: false, message: "Няма свързан импорт към тази оферта." };
  }

  const offerResult = await dbQuery<{ id: string }>(
    `
      select offer.id
      from offers offer
      join offer_imports import on import.offer_id = offer.id
      where offer.slug = $1
        and import.id = $2
      limit 1
    `,
    [slug, importId]
  );
  const offerId = offerResult.rows[0]?.id;

  if (!offerId) {
    return { ok: false, message: "Офертата или импортът не бяха намерени." };
  }

  const enabledEntityIds = new Set(readStringList(formData, "enabled_entity_ids"));
  const entityIds = readStringList(formData, "entity_ids");

  for (const [index, entityId] of entityIds.entries()) {
    const title = readString(formData, `entity_title_${entityId}`);
    const text = readString(formData, `entity_text_${entityId}`);
    const url = readString(formData, `entity_url_${entityId}`);
    const publicSection = readString(formData, `entity_public_section_${entityId}`);
    const notes = readString(formData, `entity_notes_${entityId}`);
    const editorialData = {
      title,
      text,
      description: text,
      url,
      publicSection,
      notes
    };

    await dbQuery(
      `
        update supplier_import_entities
        set is_enabled = $4,
            editorial_title = nullif($5, ''),
            editorial_url = nullif($6, ''),
            sort_order = $7,
            editorial_data = $8::jsonb,
            updated_at = now()
        where id = $1
          and import_id = $2
          and offer_id = $3
      `,
      [
        entityId,
        importId,
        offerId,
        enabledEntityIds.has(entityId),
        title,
        url,
        index,
        JSON.stringify(editorialData)
      ]
    );
  }

  await dbQuery(
    `
      update offers
      set review_notes = 'Supplier API review layer saved. Public offer remains under manual control.',
          updated_at = now()
      where id = $1
    `,
    [offerId]
  );

  revalidatePath(`/admin/offers/${slug}`);
  revalidatePath("/admin/offers");
  revalidatePath(`/admin/supplier-imports/${importId}`);

  return { ok: true, message: "Данните от API са запазени за редакционен преглед. Публикуване не е направено автоматично." };
}
