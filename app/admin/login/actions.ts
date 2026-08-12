"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminSessionCookieName, createAdminSessionToken } from "@/lib/adminSession";

export async function loginAdmin(formData: FormData) {
  const user = String(formData.get("user") || "");
  const password = String(formData.get("password") || "");
  const nextPath = String(formData.get("next") || "/admin/offers");
  const adminUser = process.env.REDTOURS_ADMIN_USER;
  const adminPassword = process.env.REDTOURS_ADMIN_PASSWORD;

  if (!adminUser || !adminPassword || user !== adminUser || password !== adminPassword) {
    redirect("/admin/login?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set(adminSessionCookieName, await createAdminSessionToken(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/admin"
  });

  redirect(nextPath.startsWith("/admin") ? nextPath : "/admin/offers");
}
