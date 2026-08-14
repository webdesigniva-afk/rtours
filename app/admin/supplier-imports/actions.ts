"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { adminSessionCookieName, verifyAdminSessionToken } from "@/lib/adminSession";
import { getDbPool } from "@/lib/db";

async function requireAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(adminSessionCookieName)?.value;
  const session = token ? await verifyAdminSessionToken(token) : null;

  if (!session) {
    redirect("/admin/login?next=/admin/supplier-imports");
  }
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readInteger(formData: FormData, key: string) {
  const value = Number.parseInt(readString(formData, key), 10);
  return Number.isFinite(value) ? value : null;
}

function redirectWithSyncError(message: string) {
  redirect(`/admin/supplier-imports?syncError=${encodeURIComponent(message)}`);
}

export async function syncBohemiaSupplierImports(formData: FormData) {
  await requireAdminSession();

  const baseUrl = readString(formData, "base_url") || "https://demo.internationaltravelgroup.net";
  const username = readString(formData, "username");
  const password = readString(formData, "password");
  const importAll = readString(formData, "import_all") === "yes";
  const limit = importAll ? 0 : Math.min(Math.max(readInteger(formData, "limit") || 100, 1), 500);
  const detailsLimit = importAll ? 0 : Math.min(Math.max(readInteger(formData, "details_limit") || limit, 1), limit);
  const selectedTypes = formData
    .getAll("types")
    .map((value) => (typeof value === "string" ? value : ""))
    .filter((value) => value === "excursion" || value === "holiday");
  const types = selectedTypes.length > 0 ? selectedTypes : ["excursion", "holiday"];

  if (!username || !password) {
    redirectWithSyncError("Въведи потребител и парола за Bohemia sync.");
  }

  try {
    const { fetchBohemiaOffers, upsertBohemiaOffer } = await import("@/lib/bohemiaImport.mjs");
    const offers = await fetchBohemiaOffers({
      baseUrl,
      username,
      password,
      limit,
      detailsLimit,
      types
    });

    if (offers.length === 0) {
      throw new Error("Bohemia API върна 0 оферти за избраните настройки.");
    }

    const pool = getDbPool() as unknown as {
      connect: () => Promise<{
        query: (text: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
        release: () => void;
      }>;
    };
    const client = await pool.connect();
    const summary: Record<string, number> = { new: 0, changed: 0, unchanged: 0 };

    try {
      for (const offer of offers) {
        const result = await upsertBohemiaOffer(client, offer);
        summary[result.changeState] = (summary[result.changeState] || 0) + 1;
      }
    } finally {
      client.release();
    }

    revalidatePath("/admin/supplier-imports");
    revalidatePath("/admin/offers");

    const params = new URLSearchParams({
      synced: String(offers.length),
      new: String(summary.new || 0),
      changed: String(summary.changed || 0),
      unchanged: String(summary.unchanged || 0)
    });

    redirect(`/admin/supplier-imports?${params.toString()}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bohemia sync не беше успешен.";
    redirectWithSyncError(message);
  }
}
