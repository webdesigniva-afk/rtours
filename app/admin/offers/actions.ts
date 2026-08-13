"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminSessionCookieName, verifyAdminSessionToken } from "@/lib/adminSession";
import { dbQuery } from "@/lib/db";
import { createSlug } from "@/lib/slug";

async function requireAdminSession() {
  const cookieStore = await cookies();
  const session = await verifyAdminSessionToken(cookieStore.get(adminSessionCookieName)?.value);

  if (!session) {
    redirect("/admin/login?next=/admin/offers");
  }
}

async function createUniqueOfferSlug(title: string) {
  const baseSlug = createSlug(title);

  for (let index = 0; index < 50; index += 1) {
    const candidate = index === 0 ? baseSlug : `${baseSlug}-${index + 1}`;
    const existing = await dbQuery("select 1 from offers where slug = $1 limit 1", [candidate]);

    if (existing.rows.length === 0) {
      return candidate;
    }
  }

  return `${baseSlug}-${Date.now()}`;
}

function revalidateOfferVisibility(slug?: string) {
  revalidatePath("/");
  revalidatePath("/offers");
  if (slug) revalidatePath(`/offers/${slug}`);
}

function revalidateChangedOffers(slugs: string[]) {
  revalidatePath("/admin/offers");
  slugs.forEach((slug) => {
    revalidatePath(`/admin/offers/${slug}`);
    revalidateOfferVisibility(slug);
  });
}

export async function archiveAdminOffer(slug: string) {
  await requireAdminSession();

  const result = await dbQuery<{ slug: string }>(
    `
      update offers
      set status = 'archived',
          archived_at = now(),
          updated_at = now()
      where slug = $1
      returning slug
    `,
    [slug]
  );

  revalidatePath("/admin/offers");
  if (result.rows[0]?.slug) {
    revalidatePath(`/admin/offers/${result.rows[0].slug}`);
    revalidateOfferVisibility(result.rows[0].slug);
  }

  return result.rows[0] ? { ok: true, message: "Офертата е архивирана." } : { ok: false, message: "Офертата не беше намерена." };
}

export async function restoreAdminOffer(slug: string) {
  await requireAdminSession();

  const result = await dbQuery<{ slug: string }>(
    `
      update offers
      set status = 'draft',
          archived_at = null,
          updated_at = now()
      where slug = $1
        and status = 'archived'
      returning slug
    `,
    [slug]
  );

  revalidatePath("/admin/offers");
  if (result.rows[0]?.slug) {
    revalidatePath(`/admin/offers/${result.rows[0].slug}`);
    revalidateOfferVisibility(result.rows[0].slug);
  }

  return result.rows[0] ? { ok: true, message: "Офертата е разархивирана и върната като чернова." } : { ok: false, message: "Офертата не беше намерена в архива." };
}

export async function deleteAdminOffer(slug: string) {
  await requireAdminSession();

  const result = await dbQuery<{ slug: string }>("delete from offers where slug = $1 returning slug", [slug]);

  revalidatePath("/admin/offers");
  if (result.rows[0]?.slug) {
    revalidatePath(`/admin/offers/${result.rows[0].slug}`);
    revalidateOfferVisibility(result.rows[0].slug);
  }

  return result.rows[0] ? { ok: true, message: "Офертата е изтрита." } : { ok: false, message: "Офертата не беше намерена." };
}

export async function bulkAdminOfferAction(slugs: string[], action: "archive" | "delete" | "publish") {
  await requireAdminSession();

  const uniqueSlugs = Array.from(new Set(slugs.map((slug) => slug.trim()).filter(Boolean)));

  if (uniqueSlugs.length === 0) {
    return { ok: false, message: "Няма избрани оферти." };
  }

  const result = await dbQuery<{ slug: string }>(
    action === "delete"
      ? "delete from offers where slug = any($1::text[]) returning slug"
      : `
          update offers
          set status = $2::offer_status,
              archived_at = case when $2::offer_status = 'archived' then now() else null end,
              updated_at = now()
          where slug = any($1::text[])
          returning slug
        `,
    action === "delete" ? [uniqueSlugs] : [uniqueSlugs, action === "archive" ? "archived" : "published"]
  );

  const changedSlugs = result.rows.map((row) => row.slug);
  revalidateChangedOffers(changedSlugs);

  if (changedSlugs.length === 0) {
    return { ok: false, message: "Нито една оферта не беше променена." };
  }

  if (action === "archive") return { ok: true, message: `Архивирани са ${changedSlugs.length} оферти.` };
  if (action === "publish") return { ok: true, message: `Публикувани са ${changedSlugs.length} оферти.` };
  return { ok: true, message: `Изтрити са ${changedSlugs.length} оферти.` };
}

export async function duplicateAdminOffer(slug: string) {
  await requireAdminSession();

  const offerResult = await dbQuery<{ id: string; title: string }>("select id, title from offers where slug = $1 limit 1", [slug]);
  const original = offerResult.rows[0];

  if (!original) {
    return { ok: false, message: "Офертата не беше намерена." };
  }

  const nextTitle = `${original.title || "Нова оферта"} - copy`;
  const nextSlug = await createUniqueOfferSlug(nextTitle);
  const insertResult = await dbQuery<{ id: string; slug: string }>(
    `
      insert into offers (
        slug,
        product_type,
        product_type_label,
        title,
        summary,
        description,
        destination_id,
        country,
        region,
        city,
        duration_days,
        duration_nights,
        transport,
        price_from,
        currency,
        price_note,
        price_includes_taxes,
        source,
        status,
        hero_image_url,
        seo_meta_title,
        seo_meta_description,
        seo_keywords,
        seo_canonical_url,
        seo_structured_data_type,
        is_author_program,
        assigned_to,
        review_notes
      )
      select
        $2,
        product_type,
        product_type_label,
        $3,
        summary,
        description,
        destination_id,
        country,
        region,
        city,
        duration_days,
        duration_nights,
        transport,
        price_from,
        currency,
        price_note,
        price_includes_taxes,
        source,
        'draft',
        hero_image_url,
        $3,
        seo_meta_description,
        seo_keywords,
        null,
        seo_structured_data_type,
        is_author_program,
        assigned_to,
        review_notes
      from offers
      where id = $1
      returning id, slug
    `,
    [original.id, nextSlug, nextTitle]
  );
  const duplicate = insertResult.rows[0];

  if (!duplicate) {
    return { ok: false, message: "Копието не беше създадено." };
  }

  await dbQuery(
    `
      insert into offer_destinations (offer_id, country, region, city, is_primary, sort_order)
      select $2, country, region, city, is_primary, sort_order
      from offer_destinations
      where offer_id = $1
    `,
    [original.id, duplicate.id]
  );

  await dbQuery(
    `
      insert into offer_dates (
        offer_id, label, start_date, end_date, availability, sort_order, departure_points,
        seats_total, seats_available, price_from, currency, deposit_amount, payment_due_days, notes
      )
      select $2, label, start_date, end_date, availability, sort_order, departure_points,
        seats_total, seats_available, price_from, currency, deposit_amount, payment_due_days, notes
      from offer_dates
      where offer_id = $1
    `,
    [original.id, duplicate.id]
  );

  await dbQuery(
    `
      insert into offer_media (offer_id, url, alt, caption, source, is_primary, sort_order)
      select $2, url, alt, caption, source, is_primary, sort_order
      from offer_media
      where offer_id = $1
    `,
    [original.id, duplicate.id]
  );

  await dbQuery(
    `
      insert into offer_itinerary_days (offer_id, day_number, title, description, accommodation, meals, transport, sort_order)
      select $2, day_number, title, description, accommodation, meals, transport, sort_order
      from offer_itinerary_days
      where offer_id = $1
    `,
    [original.id, duplicate.id]
  );

  await dbQuery(
    `
      insert into offer_highlights (offer_id, label, sort_order)
      select $2, label, sort_order
      from offer_highlights
      where offer_id = $1
    `,
    [original.id, duplicate.id]
  );

  await dbQuery(
    `
      insert into offer_services (offer_id, service_type, label, sort_order)
      select $2, service_type, label, sort_order
      from offer_services
      where offer_id = $1
    `,
    [original.id, duplicate.id]
  );

  await dbQuery(
    `
      insert into offer_categories (offer_id, category_id)
      select $2, category_id
      from offer_categories
      where offer_id = $1
    `,
    [original.id, duplicate.id]
  );

  await dbQuery(
    `
      insert into offer_themes (offer_id, theme_id)
      select $2, theme_id
      from offer_themes
      where offer_id = $1
    `,
    [original.id, duplicate.id]
  );

  await dbQuery(
    `
      insert into offer_collections (offer_id, collection_id)
      select $2, collection_id
      from offer_collections
      where offer_id = $1
    `,
    [original.id, duplicate.id]
  );

  await dbQuery(
    `
      insert into offer_taxonomy_terms (offer_id, term_id, source, is_primary, confidence)
      select $2, term_id, source, is_primary, confidence
      from offer_taxonomy_terms
      where offer_id = $1
    `,
    [original.id, duplicate.id]
  );

  await dbQuery(
    `
      insert into offer_visibility_rules (
        offer_id, placement, is_enabled, priority, starts_at, ends_at, curated_by, notes
      )
      select $2, placement, is_enabled, priority, starts_at, ends_at, curated_by, notes
      from offer_visibility_rules
      where offer_id = $1
    `,
    [original.id, duplicate.id]
  );

  revalidatePath("/admin/offers");
  revalidatePath(`/admin/offers/${duplicate.slug}`);

  return { ok: true, slug: duplicate.slug, message: "Създадено е копие като чернова." };
}
