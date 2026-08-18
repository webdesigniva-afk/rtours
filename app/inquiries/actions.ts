"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { dbQuery } from "@/lib/db";

export type InquiryActionState = {
  ok: boolean;
  message: string;
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readPositiveInt(value: string, fallback: number | null = null) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function normalizeSource(value: string, hasOffer: boolean) {
  if (value) return value.slice(0, 80);
  return hasOffer ? "website_offer" : "website_general";
}

export async function submitInquiry(_state: InquiryActionState, formData: FormData): Promise<InquiryActionState> {
  const offerSlug = readString(formData, "offer_slug");
  const offerTitle = readString(formData, "offer_title");
  const destination = readString(formData, "destination");
  const departure = readString(formData, "departure") || readString(formData, "travel_period");
  const adults = readPositiveInt(readString(formData, "adults") || readString(formData, "brief_adults"), 2);
  const children = readPositiveInt(readString(formData, "children"), 0);
  const roomType = readString(formData, "room_type");
  const budget = readString(formData, "budget") || readString(formData, "brief_budget");
  const contactName = readString(formData, "name");
  const contactEmail = readString(formData, "email");
  const contactPhone = readString(formData, "phone");
  const notes = [
    readString(formData, "message"),
    readString(formData, "children_ages") ? `Деца и възрасти: ${readString(formData, "children_ages")}` : "",
    readString(formData, "duration") ? `Продължителност: ${readString(formData, "duration")}` : "",
    readString(formData, "dates_flexible") ? `Гъвкави дати: ${readString(formData, "dates_flexible")}` : "",
    readString(formData, "experiences") ? `Преживявания: ${readString(formData, "experiences")}` : "",
    readString(formData, "accommodation_style") ? `Настаняване: ${readString(formData, "accommodation_style")}` : "",
    readString(formData, "preferred_contact") ? `Предпочитан контакт: ${readString(formData, "preferred_contact")}` : "",
    readString(formData, "additional_information") ? `Допълнителна информация: ${readString(formData, "additional_information")}` : ""
  ].filter(Boolean).join("\n");
  const leadSource = normalizeSource(readString(formData, "lead_source"), Boolean(offerSlug));
  const travelersCount = (adults || 0) + (children || 0);
  const headersList = await headers();
  const sourcePage = headersList.get("referer") || (offerSlug ? `/offers/${offerSlug}` : null);

  if (!contactName || !contactEmail) {
    return { ok: false, message: "Моля, въведете име и имейл, за да изпратим запитването." };
  }

  const offerResult = offerSlug
    ? await dbQuery<{ id: string; title: string; country: string | null; region: string | null }>(
        "select id, title, country, region from offers where slug = $1 limit 1",
        [offerSlug]
      )
    : { rows: [] };
  const offer = offerResult.rows[0];
  const resolvedDestination =
    destination ||
    [offer?.country, offer?.region].filter(Boolean).join(", ") ||
    null;

  await dbQuery(
    `
      insert into inquiries (
        offer_id,
        offer_title,
        destination,
        departure,
        travel_period,
        adults,
        children,
        room_type,
        budget,
        travelers_count,
        contact_name,
        contact_email,
        contact_phone,
        notes,
        consent_accepted,
        source_page,
        lead_source,
        status
      )
      values (
        $1, $2, nullif($3, ''), nullif($4, ''), nullif($4, ''),
        $5, $6, nullif($7, ''), nullif($8, ''), $9,
        $10, $11, nullif($12, ''), nullif($13, ''), true, $14, $15, 'new'
      )
    `,
    [
      offer?.id ?? null,
      offer?.title ?? (offerTitle || null),
      resolvedDestination,
      departure,
      adults,
      children,
      roomType,
      budget,
      travelersCount > 0 ? travelersCount : null,
      contactName,
      contactEmail,
      contactPhone,
      notes,
      sourcePage,
      leadSource
    ]
  );

  revalidatePath("/admin/inquiries");

  return { ok: true, message: "Запитването е записано като нов lead. Екипът на Red Tours ще се свърже с вас." };
}
