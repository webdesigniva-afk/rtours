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

type OfferContentActionState = {
  ok: boolean;
  message: string;
};

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readPositiveInteger(formData: FormData, key: string) {
  const value = Number.parseInt(readString(formData, key), 10);
  return Number.isFinite(value) && value > 0 ? value : null;
}

const productTypeValues = new Set(["excursion", "holiday", "hotel", "flight", "service", "package"]);
const transportValues = new Set(["flight", "bus", "own_transport", "mixed"]);

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
          description = nullif($10, ''),
          is_author_program = $11,
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
      readString(formData, "description"),
      readString(formData, "is_author_program") !== "no"
    ]
  );

  revalidatePath(`/admin/offers/${slug}`);
  revalidatePath("/admin/offers");
  revalidatePath("/offers");
  revalidatePath(`/offers/${slug}`);
  revalidatePath("/");

  return { ok: true, message: "Офертата е записана в системата." };
}
