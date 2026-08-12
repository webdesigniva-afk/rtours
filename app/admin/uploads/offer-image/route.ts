import { NextResponse, type NextRequest } from "next/server";
import { adminSessionCookieName, verifyAdminSessionToken } from "@/lib/adminSession";
import { uploadOfferImage } from "@/lib/supabaseStorage";

export async function POST(request: NextRequest) {
  const session = await verifyAdminSessionToken(request.cookies.get(adminSessionCookieName)?.value);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const uploadSessionId = String(formData.get("uploadSessionId") || crypto.randomUUID()).replace(/[^a-zA-Z0-9-]/g, "");
  const role = formData.get("role") === "hero" ? "hero" : "gallery";
  const index = Number.parseInt(String(formData.get("index") || "0"), 10) || 0;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing image file" }, { status: 400 });
  }

  try {
    const url = await uploadOfferImage(file, `draft-${uploadSessionId}`, role, index);

    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 400 });
  }
}
