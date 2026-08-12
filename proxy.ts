import { NextResponse, type NextRequest } from "next/server";
import { adminSessionCookieName, verifyAdminSessionToken } from "@/lib/adminSession";

export async function proxy(request: NextRequest) {
  const adminUser = process.env.REDTOURS_ADMIN_USER;
  const adminPassword = process.env.REDTOURS_ADMIN_PASSWORD;
  const path = request.nextUrl.pathname;
  const isLoginPath = path === "/admin/login";

  if (!adminUser || !adminPassword) {
    return new NextResponse("Admin access is not configured", { status: 503 });
  }

  const session = await verifyAdminSessionToken(request.cookies.get(adminSessionCookieName)?.value);

  if (isLoginPath) {
    if (session) {
      return NextResponse.redirect(new URL("/admin/offers", request.url));
    }

    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", path);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"]
};
