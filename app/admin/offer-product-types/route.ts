import { NextResponse, type NextRequest } from "next/server";
import { adminSessionCookieName, verifyAdminSessionToken } from "@/lib/adminSession";
import { dbQuery } from "@/lib/db";
import { createSlug } from "@/lib/slug";

type OfferProductTypeRow = {
  slug: string;
  label: string;
  product_type: string;
  is_system: boolean;
};

async function requireSession(request: NextRequest) {
  return verifyAdminSessionToken(request.cookies.get(adminSessionCookieName)?.value);
}

export async function GET(request: NextRequest) {
  const session = await requireSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await dbQuery<OfferProductTypeRow>(
    `
      select slug, label, product_type::text, is_system
      from offer_product_types
      order by sort_order, label
    `
  );

  return NextResponse.json({ productTypes: result.rows });
}

export async function POST(request: NextRequest) {
  const session = await requireSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { label?: string } | null;
  const label = body?.label?.trim();

  if (!label) {
    return NextResponse.json({ error: "Missing label" }, { status: 400 });
  }

  const slug = createSlug(label);
  const result = await dbQuery<OfferProductTypeRow>(
    `
      insert into offer_product_types (slug, label, product_type, is_system, sort_order)
      values ($1, $2, 'package', false, 100)
      on conflict (slug) do update
      set label = excluded.label,
          updated_at = now()
      returning slug, label, product_type::text, is_system
    `,
    [slug, label]
  );

  return NextResponse.json({ productType: result.rows[0] });
}
