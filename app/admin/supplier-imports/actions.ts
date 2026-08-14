"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { adminSessionCookieName, verifyAdminSessionToken } from "@/lib/adminSession";
import { dbQuery, getDbPool } from "@/lib/db";

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

function readJsonObject(value: string, fallback: Record<string, unknown> = {}) {
  if (!value) return fallback;
  const parsed = JSON.parse(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Mapping configuration must be a JSON object.");
  }
  return parsed as Record<string, unknown>;
}

function normalizeProviderSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "supplier";
}

function normalizeConnectorSource(value: string) {
  if (value === "xml" || value === "json" || value === "csv" || value === "file") return value;
  return "api";
}

function normalizeOfferSource(value: string) {
  if (value === "xml" || value === "json" || value === "csv" || value === "file") return value;
  return "api";
}

function redirectWithSyncError(message: string) {
  redirect(`/admin/supplier-imports?syncError=${encodeURIComponent(message)}`);
}

export async function saveGenericSupplierConnector(formData: FormData) {
  await requireAdminSession();

  try {
    const provider = normalizeProviderSlug(readString(formData, "provider"));
    const displayName = readString(formData, "display_name") || provider;
    const sourceType = normalizeConnectorSource(readString(formData, "source_type"));
    const status = readString(formData, "status") === "paused" || readString(formData, "status") === "disabled" ? readString(formData, "status") : "active";
    const defaultBaseUrl = readString(formData, "default_base_url");
    const notes = readString(formData, "notes");
    const configSchema = readJsonObject(readString(formData, "config_schema"));

    await dbQuery(
      `
        insert into supplier_connectors (
          provider, display_name, source_type, auth_type, status, default_base_url, config_schema, notes
        )
        values ($1, $2, $3, 'request_credentials', $4, nullif($5, ''), $6::jsonb, nullif($7, ''))
        on conflict (provider) do update set
          display_name = excluded.display_name,
          source_type = excluded.source_type,
          status = excluded.status,
          default_base_url = excluded.default_base_url,
          config_schema = excluded.config_schema,
          notes = excluded.notes,
          updated_at = now()
      `,
      [provider, displayName, sourceType, status, defaultBaseUrl, JSON.stringify(configSchema), notes]
    );

    revalidatePath("/admin/supplier-imports");
    redirect(`/admin/supplier-imports?connectorSaved=${encodeURIComponent(provider)}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connector settings could not be saved.";
    redirectWithSyncError(message);
  }
}

export async function syncGenericSupplierConnector(formData: FormData) {
  await requireAdminSession();

  const provider = normalizeProviderSlug(readString(formData, "provider"));
  const payloadUrl = readString(formData, "payload_url");
  const payloadText = readString(formData, "payload");
  const sourceFormat = normalizeOfferSource(readString(formData, "source_format"));
  const limit = Math.min(Math.max(readInteger(formData, "generic_limit") || 100, 1), 500);
  const mappingOverride = readJsonObject(readString(formData, "mapping_override"));

  try {
    const connector = await dbQuery<{
      id: string;
      display_name: string;
      default_base_url: string | null;
      config_schema: Record<string, unknown>;
    }>(
      `
        select id, display_name, default_base_url, config_schema
        from supplier_connectors
        where provider = $1
        limit 1
      `,
      [provider]
    );
    const connectorRow = connector.rows[0];

    if (!connectorRow && Object.keys(mappingOverride).length === 0) {
      throw new Error("Supplier connector is not configured yet.");
    }

    const effectiveUrl = payloadUrl || connectorRow?.default_base_url || "";
    const rawPayload = payloadText || (effectiveUrl
      ? await fetch(effectiveUrl, { cache: "no-store" }).then(async (response) => {
          if (!response.ok) throw new Error(`Supplier endpoint returned HTTP ${response.status}.`);
          return response.text();
        })
      : "");

    if (!rawPayload) {
      throw new Error("Paste a JSON/XML payload or configure a feed URL.");
    }

    let parsedPayload: unknown;
    if (sourceFormat === "xml") {
      const { XMLParser } = await import("fast-xml-parser");
      parsedPayload = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" }).parse(rawPayload);
    } else {
      parsedPayload = JSON.parse(rawPayload);
    }

    const genericImport = await import("@/lib/genericSupplierImport.mjs");
    const supplierImport = await import("@/lib/supplierImport.mjs");
    const offers = genericImport
      .normalizeGenericSupplierPayload(parsedPayload, {
        provider,
        source: sourceFormat,
        mapping: connectorRow?.config_schema || mappingOverride
      })
      .slice(0, limit);

    if (offers.length === 0) {
      throw new Error("The payload did not produce any normalized offers. Check itemsPath and field mapping.");
    }

    const pool = getDbPool() as unknown as {
      connect: () => Promise<{
        query: (text: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
        release: () => void;
      }>;
    };
    const client = await pool.connect();
    const summary: Record<string, number> = { new: 0, changed: 0, unchanged: 0, processed: 0, error: 0 };
    let importRunId: string | null = null;

    try {
      importRunId = await supplierImport.startSupplierImportRun(client, {
        provider,
        displayName: connectorRow?.display_name || provider,
        source: sourceFormat,
        mode: "manual",
        totalFound: offers.length,
        defaultBaseUrl: effectiveUrl || null,
        configSnapshot: {
          sourceFormat,
          limit,
          usedPayloadUrl: Boolean(effectiveUrl),
          usedMappingOverride: !connectorRow
        }
      });

      for (const offer of offers) {
        const result = await supplierImport.upsertSupplierOffer(client, offer, {
          provider,
          displayName: connectorRow?.display_name || provider,
          source: sourceFormat,
          importRunId
        });
        summary[result.changeState] = (summary[result.changeState] || 0) + 1;
        summary.processed += 1;
      }

      await supplierImport.finishSupplierImportRun(client, importRunId, summary);
    } catch (error) {
      summary.error += 1;
      await supplierImport.finishSupplierImportRun(client, importRunId, summary, error);
      throw error;
    } finally {
      client.release();
    }

    revalidatePath("/admin/supplier-imports");
    revalidatePath("/admin/offers");
    const params = new URLSearchParams({
      synced: String(summary.processed),
      new: String(summary.new || 0),
      changed: String(summary.changed || 0),
      unchanged: String(summary.unchanged || 0),
      total: String(offers.length),
      processed: String(summary.processed),
      genericProvider: provider
    });

    redirect(`/admin/supplier-imports?${params.toString()}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generic supplier sync failed.";
    redirectWithSyncError(message);
  }
}

async function countBohemiaOffersFallback(
  bohemiaImport: {
    createBohemiaClient?: (options: {
      baseUrl: string;
      username: string;
      password: string;
      timeoutMs?: number;
    }) => {
      searchExcursions: () => Promise<unknown[]>;
      searchHolidays: () => Promise<unknown[]>;
    };
  },
  options: {
    baseUrl: string;
    username: string;
    password: string;
    timeoutMs?: number;
    types: string[];
  }
) {
  if (typeof bohemiaImport.createBohemiaClient !== "function") {
    throw new Error("Bohemia count helper is not available. Restart the dev server and try again.");
  }

  const client = bohemiaImport.createBohemiaClient(options);
  const counts = { excursion: 0, holiday: 0, total: 0 };

  if (options.types.includes("excursion")) {
    counts.excursion = (await client.searchExcursions()).length;
  }

  if (options.types.includes("holiday")) {
    counts.holiday = (await client.searchHolidays()).length;
  }

  counts.total = counts.excursion + counts.holiday;
  return counts;
}

export async function syncBohemiaSupplierImports(formData: FormData) {
  await requireAdminSession();

  const baseUrl = readString(formData, "base_url") || "https://demo.internationaltravelgroup.net";
  const username = readString(formData, "username");
  const password = readString(formData, "password");
  const mode = readString(formData, "mode");
  const importAll = readString(formData, "import_all") === "yes";
  const offset = Math.max(readInteger(formData, "offset") || 0, 0);
  const batchSize = Math.min(Math.max(readInteger(formData, "batch_size") || 10, 1), 25);
  const limit = importAll ? batchSize : Math.min(Math.max(readInteger(formData, "limit") || 100, 1), 500);
  const detailsLimit = importAll ? batchSize : Math.min(Math.max(readInteger(formData, "details_limit") || limit, 1), limit);
  const selectedTypes = formData
    .getAll("types")
    .map((value) => (typeof value === "string" ? value : ""))
    .filter((value) => value === "excursion" || value === "holiday");
  const types = selectedTypes.length > 0 ? selectedTypes : ["excursion", "holiday"];

  if (!username || !password) {
    redirectWithSyncError("Въведи потребител и парола за Bohemia sync.");
  }

  try {
    const bohemiaImport = await import("@/lib/bohemiaImport.mjs");
    const supplierImport = await import("@/lib/supplierImport.mjs");
    const { fetchBohemiaOffers, upsertBohemiaOffer } = bohemiaImport;

    if (mode === "count") {
      const counts =
        typeof bohemiaImport.fetchBohemiaOfferCounts === "function"
          ? await bohemiaImport.fetchBohemiaOfferCounts({
              baseUrl,
              username,
              password,
              timeoutMs: 10000,
              types
            })
          : await countBohemiaOffersFallback(bohemiaImport, {
              baseUrl,
              username,
              password,
              timeoutMs: 10000,
              types
            });
      const params = new URLSearchParams({
        checked: "1",
        total: String(counts.total || 0),
        excursions: String(counts.excursion || 0),
        holidays: String(counts.holiday || 0),
        baseUrl,
        types: types.join(",")
      });

      redirect(`/admin/supplier-imports?${params.toString()}`);
    }

    const offers = await fetchBohemiaOffers({
      baseUrl,
      username,
      password,
      limit,
      detailsLimit,
      offset: importAll ? offset : 0,
      timeoutMs: 10000,
      types
    });
    const meta = (offers as {
      meta?: { hasMore?: boolean; nextOffset?: number; totalAvailable?: number; processedAvailable?: number };
    }).meta;

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
    const summary: Record<string, number> = { new: 0, changed: 0, unchanged: 0, processed: 0, error: 0 };
    let importRunId: string | null = null;

    try {
      importRunId = await supplierImport.startSupplierImportRun(client, {
        provider: "bohemia",
        displayName: "Bohemia",
        source: "api",
        mode: "manual",
        totalFound: meta?.totalAvailable ?? offers.length,
        configSnapshot: {
          baseUrl,
          types,
          limit,
          detailsLimit,
          offset: importAll ? offset : 0,
          importAll
        }
      });

      for (const offer of offers) {
        const result = await upsertBohemiaOffer(client, offer, { importRunId });
        summary[result.changeState] = (summary[result.changeState] || 0) + 1;
        summary.processed += 1;
      }
      await supplierImport.finishSupplierImportRun(client, importRunId, summary);
    } catch (error) {
      summary.error += 1;
      await supplierImport.finishSupplierImportRun(client, importRunId, summary, error);
      throw error;
    } finally {
      client.release();
    }

    revalidatePath("/admin/supplier-imports");
    revalidatePath("/admin/offers");

    const params = new URLSearchParams({
      synced: String(offers.length),
      new: String(summary.new || 0),
      changed: String(summary.changed || 0),
      unchanged: String(summary.unchanged || 0),
      total: String(meta?.totalAvailable ?? offers.length),
      processed: String(meta?.processedAvailable ?? offers.length)
    });

    if (importAll && meta?.hasMore) {
      params.set("hasMore", "1");
      params.set("nextOffset", String(meta.nextOffset ?? offset + limit));
      params.set("batchSize", String(batchSize));
      params.set("baseUrl", baseUrl);
      params.set("types", types.join(","));
    }

    redirect(`/admin/supplier-imports?${params.toString()}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bohemia sync не беше успешен.";
    redirectWithSyncError(message);
  }
}

export async function syncAbaxSupplierImports(formData: FormData) {
  await requireAdminSession();

  const baseUrl = readString(formData, "base_url") || "https://api.abax.bg/index.php";
  const apiKey = readString(formData, "api_key");
  const apiCode = readString(formData, "api_code");
  const mode = readString(formData, "mode");
  const importAll = readString(formData, "import_all") === "yes";
  const offset = Math.max(readInteger(formData, "offset") || 0, 0);
  const batchSize = Math.min(Math.max(readInteger(formData, "batch_size") || 20, 1), 50);
  const limit = importAll ? batchSize : Math.min(Math.max(readInteger(formData, "limit") || 100, 1), 500);

  if (!apiKey || !apiCode) {
    redirectWithSyncError("Въведи API UUID и API Key за Abax sync.");
  }

  try {
    const abaxImport = await import("@/lib/abaxImport.mjs");
    const supplierImport = await import("@/lib/supplierImport.mjs");

    if (mode === "count") {
      const counts = await abaxImport.fetchAbaxOfferCounts({
        baseUrl,
        key: apiKey,
        code: apiCode,
        timeoutMs: 15000
      });
      const params = new URLSearchParams({
        checked: "1",
        total: String(counts.total || 0),
        genericProvider: "abax"
      });

      redirect(`/admin/supplier-imports?${params.toString()}`);
    }

    const offers = await abaxImport.fetchAbaxOffers({
      baseUrl,
      key: apiKey,
      code: apiCode,
      limit,
      offset: importAll ? offset : 0,
      timeoutMs: 15000
    });
    const meta = (offers as {
      meta?: { hasMore?: boolean; nextOffset?: number; totalAvailable?: number; processedAvailable?: number };
    }).meta;

    if (offers.length === 0) {
      throw new Error("Abax API върна 0 програми за избраните настройки.");
    }

    const pool = getDbPool() as unknown as {
      connect: () => Promise<{
        query: (text: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
        release: () => void;
      }>;
    };
    const client = await pool.connect();
    const summary: Record<string, number> = { new: 0, changed: 0, unchanged: 0, processed: 0, error: 0 };
    let importRunId: string | null = null;

    try {
      importRunId = await supplierImport.startSupplierImportRun(client, {
        provider: "abax",
        displayName: "Abax",
        source: "api",
        mode: "manual",
        totalFound: meta?.totalAvailable ?? offers.length,
        defaultBaseUrl: baseUrl,
        configSnapshot: {
          baseUrl,
          limit,
          offset: importAll ? offset : 0,
          importAll
        }
      });

      for (const offer of offers) {
        const result = await supplierImport.upsertSupplierOffer(client, offer, {
          provider: "abax",
          displayName: "Abax",
          source: "api",
          importRunId
        });
        summary[result.changeState] = (summary[result.changeState] || 0) + 1;
        summary.processed += 1;
      }

      await supplierImport.finishSupplierImportRun(client, importRunId, summary);
    } catch (error) {
      summary.error += 1;
      await supplierImport.finishSupplierImportRun(client, importRunId, summary, error);
      throw error;
    } finally {
      client.release();
    }

    revalidatePath("/admin/supplier-imports");
    revalidatePath("/admin/offers");

    const params = new URLSearchParams({
      synced: String(offers.length),
      new: String(summary.new || 0),
      changed: String(summary.changed || 0),
      unchanged: String(summary.unchanged || 0),
      total: String(meta?.totalAvailable ?? offers.length),
      processed: String(meta?.processedAvailable ?? offers.length),
      genericProvider: "abax"
    });

    if (importAll && meta?.hasMore) {
      params.set("hasMore", "1");
      params.set("nextOffset", String(meta.nextOffset ?? offset + limit));
      params.set("batchSize", String(batchSize));
      params.set("baseUrl", baseUrl);
      params.set("provider", "abax");
    }

    redirect(`/admin/supplier-imports?${params.toString()}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Abax sync не беше успешен.";
    redirectWithSyncError(message);
  }
}
