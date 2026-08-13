"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { adminSessionCookieName, verifyAdminSessionToken } from "@/lib/adminSession";
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

  return { ok: true, status: "published" as const };
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
          or (
            title in ('', 'Нова оферта')
            and coalesce(summary, '') = ''
            and coalesce(description, '') = ''
            and coalesce(country, '') = ''
            and coalesce(region, '') = ''
            and coalesce(hero_image_url, '') = ''
            and not exists (select 1 from offer_dates where offer_id = offers.id)
            and not exists (select 1 from offer_itinerary_days where offer_id = offers.id)
            and not exists (select 1 from offer_services where offer_id = offers.id)
          )
        )
      returning slug
    `,
    [slug, "%празна чернова%", "%[new-offer-draft]%"]
  );

  if (result.rows.length === 0) {
    return { ok: false, message: "Тази оферта вече има съдържание или не е временна чернова." };
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

const productTypeValues = new Set(["excursion", "holiday", "hotel", "flight", "service", "package"]);
const transportValues = new Set(["flight", "bus", "own_transport", "mixed"]);
const availabilityValues = new Set(["available", "limited", "on_request", "sold_out"]);

export async function updateOfferContent(_state: OfferContentActionState, formData: FormData): Promise<OfferContentActionState> {
  const slug = readString(formData, "slug");
  await requireAdminSession(slug);

  const title = readString(formData, "title");

  if (!slug || !title) {
    return { ok: false, message: "Заглавието е задължително." };
  }

  const productType = readString(formData, "product_type");
  const transport = readString(formData, "transport");
  const durationDays = readPositiveInteger(formData, "duration_days");
  const durationNights = readPositiveInteger(formData, "duration_nights");
  const itineraryDayNumbers = readStringList(formData, "itinerary_day_number");
  const itineraryTitles = readStringList(formData, "itinerary_title");
  const itineraryDescriptions = readStringList(formData, "itinerary_description");
  const heroImageUrl = readString(formData, "hero_image_url") || null;
  const galleryImageUrls = readStringList(formData, "gallery_image_urls").filter(Boolean).slice(0, 20);
  const itineraryRows = itineraryTitles
    .map((dayTitle, index) => ({
      dayNumber: Number.parseInt(itineraryDayNumbers[index] || `${index + 1}`, 10),
      title: dayTitle,
      description: itineraryDescriptions[index] || ""
    }))
    .filter((day) => day.title || day.description);
  const includedServices = readStringList(formData, "included_services").filter(Boolean);
  const excludedServices = readStringList(formData, "excluded_services").filter(Boolean);
  const description = readString(formData, "description");

  await dbQuery(
    `
      update offers
      set product_type = $2::offer_product_type,
          title = $3,
          country = nullif($4, ''),
          region = nullif($5, ''),
          duration_days = $6,
          duration_nights = $7,
          transport = $8::transport_type,
          summary = nullif($9, ''),
          description = coalesce(nullif($10, ''), description),
          is_author_program = $11,
          hero_image_url = coalesce($12, hero_image_url),
          updated_at = now()
      where slug = $1
    `,
    [
      slug,
      productTypeValues.has(productType) ? productType : "package",
      title,
      readString(formData, "country"),
      readString(formData, "region"),
      durationDays,
      durationNights,
      transportValues.has(transport) ? transport : "mixed",
      readString(formData, "summary"),
      description,
      readString(formData, "is_author_program") !== "no",
      heroImageUrl
    ]
  );

  const offerResult = await dbQuery<{ id: string }>("select id from offers where slug = $1 limit 1", [slug]);
  const offerId = offerResult.rows[0]?.id;

  if (offerId) {
    await dbQuery("delete from offer_itinerary_days where offer_id = $1", [offerId]);
    await dbQuery("delete from offer_services where offer_id = $1", [offerId]);
    if (heroImageUrl) {
      await dbQuery("delete from offer_media where offer_id = $1 and is_primary = true", [offerId]);
      await dbQuery(
        `
          insert into offer_media (offer_id, url, alt, source, is_primary, sort_order)
          values ($1, $2, $3, 'redtours', true, 0)
        `,
        [offerId, heroImageUrl, title]
      );
    }

    if (galleryImageUrls.length) {
      await dbQuery("delete from offer_media where offer_id = $1 and is_primary = false", [offerId]);

      for (const [index, url] of galleryImageUrls.entries()) {
        await dbQuery(
          `
            insert into offer_media (offer_id, url, alt, source, is_primary, sort_order)
            values ($1, $2, $3, 'redtours', false, $4)
          `,
          [offerId, url, `${title} - снимка ${index + 1}`, index + 1]
        );
      }
    }

    for (const [index, day] of itineraryRows.entries()) {
      await dbQuery(
        `
          insert into offer_itinerary_days (offer_id, day_number, title, description, sort_order)
          values ($1, $2, $3, nullif($4, ''), $5)
        `,
        [offerId, Number.isFinite(day.dayNumber) && day.dayNumber > 0 ? day.dayNumber : index + 1, day.title || `Ден ${index + 1}`, day.description, index]
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

  revalidatePath(`/admin/offers/${slug}`);
  revalidatePath("/admin/offers");
  revalidatePath("/offers");
  revalidatePath(`/offers/${slug}`);
  revalidatePath("/");

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

  const ids = readStringList(formData, "departure_id");
  const starts = readStringList(formData, "departure_start");
  const ends = readStringList(formData, "departure_end");
  const departurePoints = readStringList(formData, "departure_points");
  const seatsTotals = readStringList(formData, "departure_seats_total");
  const seatsAvailable = readStringList(formData, "departure_seats_available");
  const prices = readStringList(formData, "departure_price_from");
  const currencies = readStringList(formData, "departure_currency");
  const statuses = readStringList(formData, "departure_status");
  const deposits = readStringList(formData, "departure_deposit");
  const paymentDueDays = readStringList(formData, "departure_payment_due_days");
  const notes = readStringList(formData, "departure_notes");

  const rows = starts
    .map((startDate, index) => ({
      id: ids[index] || "",
      startDate,
      endDate: ends[index] || "",
      departurePoints: departurePoints[index] || "",
      seatsTotal: readNonNegativeIntegerValue(seatsTotals[index] || ""),
      seatsAvailable: readNonNegativeIntegerValue(seatsAvailable[index] || ""),
      priceFrom: readMoneyValue(prices[index] || ""),
      currency: currencies[index] === "BGN" ? "BGN" : "EUR",
      availability: availabilityValues.has(statuses[index] || "") ? statuses[index] : "on_request",
      depositAmount: readMoneyValue(deposits[index] || ""),
      paymentDueDays: readNonNegativeIntegerValue(paymentDueDays[index] || ""),
      notes: notes[index] || ""
    }))
    .filter((row) => row.startDate || row.endDate || row.departurePoints || row.priceFrom !== null || row.seatsTotal !== null || row.seatsAvailable !== null);

  if (rows.some((row) => row.startDate && row.endDate && row.endDate < row.startDate)) {
    return { ok: false, message: "Има отпътуване, при което крайната дата е преди началната." };
  }

  for (const [index, row] of rows.entries()) {
    const params = [
      offerId,
      row.startDate && row.endDate ? `${row.startDate} - ${row.endDate}` : row.startDate || row.endDate || null,
      row.startDate,
      row.endDate,
      row.departurePoints,
      row.availability,
      row.seatsTotal,
      row.seatsAvailable,
      row.priceFrom,
      row.currency,
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
              seats_available = $8,
              price_from = $9,
              currency = $10,
              deposit_amount = $11,
              payment_due_days = $12,
              notes = nullif($13, ''),
              sort_order = $14,
              updated_at = now()
          where id = $15
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
            seats_available,
            price_from,
            currency,
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
            nullif($13, ''),
            $14,
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

  return { ok: true, message: rows.length ? "Датите и цените са записани." : "Няма въведени нови данни за дати и цени." };
}
