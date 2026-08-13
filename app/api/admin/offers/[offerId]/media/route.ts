import { NextResponse, type NextRequest } from "next/server";
import { adminSessionCookieName, verifyAdminSessionToken } from "@/lib/adminSession";
import { dbQuery } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: Promise<{ offerId: string }> }) {
  const session = await verifyAdminSessionToken(request.cookies.get(adminSessionCookieName)?.value);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { offerId } = await context.params;
  const result = await dbQuery<{ url: string; is_primary: boolean; sort_order: number }>(
    `
      select url, is_primary, sort_order
      from offer_media
      where offer_id = $1
      order by is_primary desc, sort_order asc
    `,
    [offerId]
  );

  return NextResponse.json({
    heroImageUrl: result.rows.find((row) => row.is_primary)?.url ?? "",
    galleryImageUrls: result.rows.filter((row) => !row.is_primary).map((row) => row.url)
  });
}
