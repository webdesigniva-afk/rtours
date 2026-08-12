"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminSessionCookieName } from "@/lib/adminSession";

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.set(adminSessionCookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/admin"
  });
  redirect("/admin/login");
}
