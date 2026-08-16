"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { adminSessionCookieName, verifyAdminSessionToken } from "@/lib/adminSession";
import { dbQuery, getDbPool } from "@/lib/db";
import { decryptJsonSecret, encryptJsonSecret } from "@/lib/secretBox";

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

function configString(config: Record<string, unknown> | null | undefined, keys: string[]) {
  for (const key of keys) {
    const value = config?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function encryptedConfig(config: Record<string, unknown> | null | undefined) {
  try {
    return decryptJsonSecret(config?.encryptedCredentials);
  } catch {
    return {};
  }
}

function usableBaseUrl(value: string | null | undefined, fallback: string) {
  const text = String(value || "").trim();
  return /^https?:\/\//i.test(text) ? text : fallback;
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

function redirectWithSupplierError(message: string) {
  redirect(`/admin/suppliers?credentialError=${encodeURIComponent(message)}`);
}

function redirectWithSupplierSaved(provider: string) {
  redirect(`/admin/suppliers?credentialsSaved=${encodeURIComponent(provider)}`);
}

function redirectToSupplierLogin(provider: "abax" | "bohemia", message: string) {
  const params = new URLSearchParams({
    startImport: "1",
    importProvider: provider,
    syncError: message
  });
  redirect(`/admin/supplier-imports?${params.toString()}`);
}

function isNextRedirectError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const value = error as { digest?: unknown; message?: unknown };
  return String(value.digest || value.message || "").includes("NEXT_REDIRECT");
}

function buildAbaxUrl(baseUrl: string, apiKey: string, apiCode: string, method: string) {
  const url = new URL(baseUrl || "https://api.abax.bg/index.php");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("code", apiCode);
  return `${url.toString()}&${method}`;
}

export async function saveSupplierConnectorCredentials(formData: FormData) {
  await requireAdminSession();

  const connectorId = readString(formData, "connector_id");
  const provider = readString(formData, "provider");
  const baseUrl = readString(formData, "base_url");

  try {
    if (!connectorId) throw new Error("Доставчикът не беше намерен.");

    const connectorResult = await dbQuery<{
      id: string;
      provider: string;
      display_name: string;
      default_base_url: string | null;
      config_schema: Record<string, unknown> | null;
    }>(
      `
        select id, provider, display_name, default_base_url, config_schema
        from supplier_connectors
        where id = $1
        limit 1
      `,
      [connectorId]
    );
    const connector = connectorResult.rows[0];

    if (!connector || connector.provider !== provider) {
      throw new Error("Доставчикът не беше намерен.");
    }

    let credentials: Record<string, unknown> = {};

    if (provider === "abax") {
      const apiKey = readString(formData, "api_key");
      const apiCode = readString(formData, "api_code");

      if (!apiKey || !apiCode) {
        throw new Error("Въведи API UUID и API Key за Abax.");
      }

      credentials = { apiKey, apiCode };
    } else if (provider === "bohemia") {
      const username = readString(formData, "username");
      const password = readString(formData, "password");

      if (!username || !password) {
        throw new Error("Въведи потребител и парола за Bohemia.");
      }

      credentials = { username, password };
    } else {
      throw new Error("Този тип доставчик още няма форма за сигурни credentials.");
    }

    const config = connector.config_schema || {};

    await dbQuery(
      `
        update supplier_connectors
        set default_base_url = coalesce(nullif($2, ''), default_base_url),
            auth_type = 'stored_credentials',
            config_schema = coalesce(config_schema, '{}'::jsonb) || $3::jsonb,
            updated_at = now()
        where id = $1
      `,
      [
        connectorId,
        baseUrl,
        JSON.stringify({
          ...config,
          encryptedCredentials: encryptJsonSecret(credentials),
          credentialsStored: true,
          credentialsUpdatedAt: new Date().toISOString()
        })
      ]
    );

    revalidatePath("/admin/suppliers");
    revalidatePath("/admin/supplier-imports");
    redirectWithSupplierSaved(provider);
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    const message = error instanceof Error ? error.message : "Достъпът до доставчика не беше записан.";
    redirectWithSupplierError(message);
  }
}

async function countAbaxProgramsDirect(options: { baseUrl: string; apiKey: string; apiCode: string }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(buildAbaxUrl(options.baseUrl, options.apiKey, options.apiCode, "get-programs-list"), {
      cache: "no-store",
      signal: controller.signal
    });
    const text = await response.text();

    if (!response.ok) {
      throw new Error(`Abax API returned HTTP ${response.status}.`);
    }

    const payload = JSON.parse(text) as unknown;
    if (Array.isArray(payload)) return payload.length;
    if (!payload || typeof payload !== "object") return 0;

    const programs = Object.values(payload).filter((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return false;
      const record = item as Record<string, unknown>;
      return Boolean(record.ID || record.id || record.ProgramName || record.programName || record.Name || record.name);
    });

    if (programs.length > 0) return programs.length;

    const errorMessage = (payload as Record<string, unknown>).error || (payload as Record<string, unknown>).Error;
    if (errorMessage) throw new Error(String(errorMessage));

    return Object.keys(payload).length;
  } finally {
    clearTimeout(timer);
  }
}

async function updateSupplierImportRunProgress(
  client: { query: (text: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> },
  runId: string | null,
  summary: Record<string, number>
) {
  if (!runId) return;

  await client.query(
    `
      update supplier_import_runs
      set total_processed = $2,
          new_count = $3,
          changed_count = $4,
          unchanged_count = $5,
          error_count = $6,
          summary = $7::jsonb
      where id = $1
    `,
    [
      runId,
      summary.processed || 0,
      summary.new || 0,
      summary.changed || 0,
      summary.unchanged || 0,
      summary.error || 0,
      JSON.stringify(summary)
    ]
  );
}

async function countSupplierImportsNotSeenInRun(
  client: { query: (text: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> },
  provider: string,
  runId: string | null
) {
  if (!provider || !runId) return 0;

  const result = await client.query(
    `
      select count(*)::int as count
      from offer_imports import
      where import.provider = $1
        and import.source in ('api', 'xml', 'json', 'csv', 'file')
        and import.import_run_id is distinct from $2
    `,
    [provider, runId]
  );

  return Number(result.rows[0]?.count || 0);
}

function missingSupplierMessage(provider: string, count: number) {
  if (count <= 0) return "";
  return `${provider}: ${count} вече внесени оферти не бяха открити в този пълен sync. Не са скрити автоматично, маркирай ги след проверка.`;
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
    if (isNextRedirectError(error)) throw error;
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
    if (isNextRedirectError(error)) throw error;
    const message = error instanceof Error ? error.message : "Generic supplier sync failed.";
    redirectWithSyncError(message);
  }
}

export async function syncConfiguredSupplierConnector(formData: FormData) {
  await requireAdminSession();

  const connectorId = readString(formData, "connector_id");

  try {
    const result = await dbQuery<{
      id: string;
      provider: string;
      display_name: string;
      source_type: string;
      default_base_url: string | null;
      config_schema: Record<string, unknown> | null;
    }>(
      `
        select id, provider, display_name, source_type, default_base_url, config_schema
        from supplier_connectors
        where id = $1
        limit 1
      `,
      [connectorId]
    );
    const connector = result.rows[0];

    if (!connector) {
      throw new Error("Доставчикът не беше намерен.");
    }

    const config = connector.config_schema || {};
    const storedCredentials = encryptedConfig(config);

    if (connector.provider === "abax") {
      const syncForm = new FormData();
      const baseUrl = usableBaseUrl(connector.default_base_url, "https://api.abax.bg/index.php");
      const apiKey =
        configString(config, ["apiKey", "api_key", "key", "apiUuid", "apiUUID", "uuid"]) ||
        configString(storedCredentials, ["apiKey", "api_key", "key", "apiUuid", "apiUUID", "uuid"]) ||
        process.env.ABAX_API_KEY ||
        process.env.ABAX_API_UUID ||
        "";
      const apiCode =
        configString(config, ["apiCode", "api_code", "code", "apiSecret", "api_key_code"]) ||
        configString(storedCredentials, ["apiCode", "api_code", "code", "apiSecret", "api_key_code"]) ||
        process.env.ABAX_API_CODE ||
        process.env.ABAX_API_SECRET ||
        "";

      if (!apiKey || !apiCode) {
        redirectToSupplierLogin(
          "abax",
          "Abax няма сигурно запазени API данни. Въведи API UUID и API Key тук, после синхронизирай."
        );
      }

      syncForm.set("base_url", baseUrl);
      syncForm.set("api_key", apiKey);
      syncForm.set("api_code", apiCode);
      syncForm.set("mode", "sync");
      syncForm.set("import_all", "yes");
      syncForm.set("offset", "0");
      syncForm.set("batch_size", "50");
      syncForm.set("limit", "500");
      return syncAbaxSupplierImports(syncForm);
    }

    if (connector.provider === "bohemia") {
      const syncForm = new FormData();
      const baseUrl = usableBaseUrl(connector.default_base_url, "https://demo.internationaltravelgroup.net");
      const username =
        configString(config, ["username", "user", "apiUsername"]) ||
        configString(storedCredentials, ["username", "user", "apiUsername"]) ||
        process.env.BOHEMIA_API_USERNAME ||
        "";
      const password =
        configString(config, ["password", "apiPassword"]) ||
        configString(storedCredentials, ["password", "apiPassword"]) ||
        process.env.BOHEMIA_API_PASSWORD ||
        "";
      const offerTypes = Array.isArray(config.offerTypes)
        ? config.offerTypes.filter((type): type is string => type === "excursion" || type === "holiday")
        : ["excursion", "holiday"];

      if (!username || !password) {
        redirectToSupplierLogin(
          "bohemia",
          "Bohemia няма сигурно запазени login данни. Въведи потребител и парола тук, после синхронизирай."
        );
      }

      syncForm.set("base_url", baseUrl);
      syncForm.set("username", username);
      syncForm.set("password", password);
      syncForm.set("mode", "sync");
      syncForm.set("import_all", "yes");
      syncForm.set("offset", "0");
      syncForm.set("batch_size", "25");
      syncForm.set("limit", "500");
      syncForm.set("details_limit", "500");
      for (const type of offerTypes.length ? offerTypes : ["excursion", "holiday"]) {
        syncForm.append("types", type);
      }
      return syncBohemiaSupplierImports(syncForm);
    }

    const genericForm = new FormData();
    genericForm.set("provider", connector.provider);
    genericForm.set("source_format", connector.source_type === "xml" ? "xml" : "json");
    genericForm.set("generic_limit", "500");
    genericForm.set("payload_url", connector.default_base_url || "");
    genericForm.set("mapping_override", JSON.stringify(config));
    return syncGenericSupplierConnector(genericForm);
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    const message = error instanceof Error ? error.message : "Синхронизацията не беше успешна.";
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

export async function checkSupplierConnection(formData: FormData): Promise<{
  ok: boolean;
  provider: string;
  total?: number;
  excursions?: number;
  holidays?: number;
  message: string;
}> {
  await requireAdminSession();

  const provider = readString(formData, "provider_label") === "abax" ? "abax" : "bohemia";

  try {
    if (provider === "abax") {
      const baseUrl = readString(formData, "base_url") || "https://api.abax.bg/index.php";
      const apiKey = readString(formData, "api_key");
      const apiCode = readString(formData, "api_code");

      if (!apiKey || !apiCode) {
        return { ok: false, provider, message: "Въведи API UUID и API Key за Abax." };
      }

      const total = await countAbaxProgramsDirect({
        baseUrl,
        apiKey,
        apiCode
      });

      return {
        ok: true,
        provider,
        total,
        message: `Abax: връзката е успешна. Открити са ${total} активни програми.`
      };
    }

    const baseUrl = readString(formData, "base_url") || "https://demo.internationaltravelgroup.net";
    const username = readString(formData, "username");
    const password = readString(formData, "password");
    const selectedTypes = formData
      .getAll("types")
      .map((value) => (typeof value === "string" ? value : ""))
      .filter((value) => value === "excursion" || value === "holiday");
    const types = selectedTypes.length > 0 ? selectedTypes : ["excursion", "holiday"];

    if (!username || !password) {
      return { ok: false, provider, message: "Въведи потребител и парола за Bohemia." };
    }

    const bohemiaImport = await import("@/lib/bohemiaImport.mjs");
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

    return {
      ok: true,
      provider,
      total: counts.total || 0,
      excursions: counts.excursion || 0,
      holidays: counts.holiday || 0,
      message: `Bohemia: връзката е успешна. Открити са ${counts.total || 0} оферти.`
    };
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    const message = error instanceof Error && error.name === "AbortError"
      ? "Доставчикът отговори твърде бавно. Опитай отново след малко."
      : error instanceof Error ? error.message : "Проверката не беше успешна.";
    return { ok: false, provider, message };
  }
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
    if (isNextRedirectError(error)) throw error;
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
  const limit = importAll ? 500 : Math.min(Math.max(readInteger(formData, "limit") || 100, 1), 500);

  if (!apiKey || !apiCode) {
    redirectWithSyncError("Въведи API UUID и API Key за Abax sync.");
  }

  try {
    const abaxImport = await import("@/lib/abaxImport.mjs");
    const supplierImport = await import("@/lib/supplierImport.mjs");

    if (mode === "count") {
      const total = await countAbaxProgramsDirect({
        baseUrl,
        apiKey,
        apiCode
      });
      const params = new URLSearchParams({
        checked: "1",
        total: String(total),
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
      timeoutMs: 60000,
      includePrices: !importAll
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
          importAll,
          includePrices: !importAll
        }
      });

      for (const [index, offer] of offers.entries()) {
        const result = await supplierImport.upsertSupplierOffer(client, offer, {
          provider: "abax",
          displayName: "Abax",
          source: "api",
          importRunId
        });
        summary[result.changeState] = (summary[result.changeState] || 0) + 1;
        summary.processed += 1;

        if ((index + 1) % 10 === 0) {
          await updateSupplierImportRunProgress(client, importRunId, summary);
        }
      }

      await updateSupplierImportRunProgress(client, importRunId, summary);
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
    if (isNextRedirectError(error)) throw error;
    const message = error instanceof Error && error.name === "AbortError"
      ? "Abax API отговори твърде бавно. Опитай отново или намали лимита за синхронизация."
      : error instanceof Error ? error.message : "Abax sync не беше успешен.";
    redirectWithSyncError(message);
  }
}

export async function processAbaxCatalogBatch(formData: FormData): Promise<{
  ok: boolean;
  runId?: string | null;
  totalFound?: number;
  totalProcessed?: number;
  nextOffset?: number;
  done?: boolean;
  new?: number;
  changed?: number;
  unchanged?: number;
  unavailable?: number;
  error?: number;
  message: string;
}> {
  await requireAdminSession();

  const baseUrl = readString(formData, "base_url") || "https://api.abax.bg/index.php";
  const apiKey = readString(formData, "api_key");
  const apiCode = readString(formData, "api_code");
  const runIdFromForm = readString(formData, "run_id") || null;
  const offset = Math.max(readInteger(formData, "offset") || 0, 0);
  const limit = Math.min(Math.max(readInteger(formData, "limit") || 20, 1), 50);

  if (!apiKey || !apiCode) {
    return { ok: false, message: "Въведи API UUID и API Key за Abax." };
  }

  const pool = getDbPool() as unknown as {
    connect: () => Promise<{
      query: (text: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
      release: () => void;
    }>;
  };
  const client = await pool.connect();
  let importRunId = runIdFromForm;

  try {
    const abaxImport = await import("@/lib/abaxImport.mjs");
    const supplierImport = await import("@/lib/supplierImport.mjs");
    let summary: Record<string, number> = { new: 0, changed: 0, unchanged: 0, processed: 0, error: 0 };

    if (importRunId) {
      const runResult = await client.query(
        "select summary, total_processed from supplier_import_runs where id = $1 and provider = 'abax' limit 1",
        [importRunId]
      );
      const existing = runResult.rows[0];
      if (!existing) return { ok: false, message: "Abax import run не беше намерен. Стартирай нов импорт." };
      summary = {
        ...summary,
        ...(existing.summary && typeof existing.summary === "object" ? existing.summary : {}),
        processed: Number(existing.total_processed || 0)
      };
    }

    const offers = await abaxImport.fetchAbaxOffers({
      baseUrl,
      key: apiKey,
      code: apiCode,
      limit,
      offset,
      timeoutMs: 60000,
      includePrices: false
    });
    const meta = (offers as {
      meta?: { hasMore?: boolean; nextOffset?: number; totalAvailable?: number; processedAvailable?: number };
    }).meta;
    const totalFound = meta?.totalAvailable ?? offers.length;

    if (!importRunId) {
      importRunId = await supplierImport.startSupplierImportRun(client, {
        provider: "abax",
        displayName: "Abax",
        source: "api",
        mode: "manual",
        totalFound,
        defaultBaseUrl: baseUrl,
        configSnapshot: {
          baseUrl,
          phase: "catalog",
          batchSize: limit
        }
      });
    }

    for (const offer of offers) {
      try {
        const result = await supplierImport.upsertSupplierOffer(client, offer, {
          provider: "abax",
          displayName: "Abax",
          source: "api",
          importRunId
        });
        summary[result.changeState] = (summary[result.changeState] || 0) + 1;
        summary.processed += 1;
      } catch {
        summary.error += 1;
      }
    }

    await updateSupplierImportRunProgress(client, importRunId, summary);
    const nextOffset = meta?.nextOffset ?? offset + offers.length;
    const done = !meta?.hasMore || nextOffset >= totalFound;

    if (done) {
      summary.unavailable = await countSupplierImportsNotSeenInRun(client, "abax", importRunId);
      await updateSupplierImportRunProgress(client, importRunId, summary);
      await supplierImport.finishSupplierImportRun(client, importRunId, summary, summary.error > 0 ? new Error("Some Abax programs failed during catalog import.") : null);
    }

    revalidatePath("/admin/supplier-imports");
    revalidatePath("/admin/offers");

    return {
      ok: true,
      runId: importRunId,
      totalFound,
      totalProcessed: summary.processed || 0,
      nextOffset,
      done,
      new: summary.new || 0,
      changed: summary.changed || 0,
      unchanged: summary.unchanged || 0,
      unavailable: summary.unavailable || 0,
      error: summary.error || 0,
      message: done
        ? [`Abax каталогът е готов: ${summary.processed || 0}/${totalFound} обработени.`, missingSupplierMessage("Abax", summary.unavailable || 0)].filter(Boolean).join(" ")
        : `Обработени са ${summary.processed || 0}/${totalFound}. Можеш да продължиш със следващата партида.`
    };
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    return {
      ok: false,
      runId: importRunId,
      message: error instanceof Error ? error.message : "Abax batch import не беше успешен."
    };
  } finally {
    client.release();
  }
}

export async function processConfiguredSupplierBatch(formData: FormData): Promise<{
  ok: boolean;
  provider?: string;
  runId?: string | null;
  totalFound?: number;
  totalProcessed?: number;
  nextOffset?: number;
  done?: boolean;
  new?: number;
  changed?: number;
  unchanged?: number;
  unavailable?: number;
  error?: number;
  message: string;
}> {
  await requireAdminSession();

  const connectorId = readString(formData, "connector_id");
  const runId = readString(formData, "run_id");
  const offset = Math.max(readInteger(formData, "offset") || 0, 0);
  const limit = Math.min(Math.max(readInteger(formData, "limit") || 25, 1), 50);

  try {
    const result = await dbQuery<{
      id: string;
      provider: string;
      display_name: string;
      default_base_url: string | null;
      config_schema: Record<string, unknown> | null;
    }>(
      `
        select id, provider, display_name, default_base_url, config_schema
        from supplier_connectors
        where id = $1
        limit 1
      `,
      [connectorId]
    );
    const connector = result.rows[0];

    if (!connector) {
      return { ok: false, message: "Доставчикът не беше намерен." };
    }

    const config = connector.config_schema || {};
    const storedCredentials = encryptedConfig(config);

    if (connector.provider === "abax") {
      const apiKey =
        configString(config, ["apiKey", "api_key", "key", "apiUuid", "apiUUID", "uuid"]) ||
        configString(storedCredentials, ["apiKey", "api_key", "key", "apiUuid", "apiUUID", "uuid"]) ||
        process.env.ABAX_API_KEY ||
        process.env.ABAX_API_UUID ||
        "";
      const apiCode =
        configString(config, ["apiCode", "api_code", "code", "apiSecret", "api_key_code"]) ||
        configString(storedCredentials, ["apiCode", "api_code", "code", "apiSecret", "api_key_code"]) ||
        process.env.ABAX_API_CODE ||
        process.env.ABAX_API_SECRET ||
        "";

      if (!apiKey || !apiCode) {
        return { ok: false, provider: "abax", message: "Abax няма настроен достъп. Отвори “Настрой достъп” и запази API данните." };
      }

      const batchForm = new FormData();
      batchForm.set("base_url", usableBaseUrl(connector.default_base_url, "https://api.abax.bg/index.php"));
      batchForm.set("api_key", apiKey);
      batchForm.set("api_code", apiCode);
      batchForm.set("offset", String(offset));
      batchForm.set("limit", String(limit));
      if (runId) batchForm.set("run_id", runId);
      const batch = await processAbaxCatalogBatch(batchForm);
      return { ...batch, provider: "abax" };
    }

    if (connector.provider !== "bohemia") {
      return { ok: false, provider: connector.provider, message: "Поетапният sync още не е активиран за този тип доставчик." };
    }

    const username =
      configString(config, ["username", "user", "apiUsername"]) ||
      configString(storedCredentials, ["username", "user", "apiUsername"]) ||
      process.env.BOHEMIA_API_USERNAME ||
      "";
    const password =
      configString(config, ["password", "apiPassword"]) ||
      configString(storedCredentials, ["password", "apiPassword"]) ||
      process.env.BOHEMIA_API_PASSWORD ||
      "";

    if (!username || !password) {
      return { ok: false, provider: "bohemia", message: "Bohemia няма настроен достъп. Отвори “Настрой достъп” и запази login данните." };
    }

    const selectedTypes = Array.isArray(config.offerTypes)
      ? config.offerTypes.filter((type): type is string => type === "excursion" || type === "holiday")
      : ["excursion", "holiday"];
    const types = selectedTypes.length ? selectedTypes : ["excursion", "holiday"];
    const pool = getDbPool() as unknown as {
      connect: () => Promise<{
        query: (text: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
        release: () => void;
      }>;
    };
    const client = await pool.connect();
    let importRunId = runId || null;

    try {
      const bohemiaImport = await import("@/lib/bohemiaImport.mjs");
      const supplierImport = await import("@/lib/supplierImport.mjs");
      let summary: Record<string, number> = { new: 0, changed: 0, unchanged: 0, processed: 0, error: 0 };

      if (importRunId) {
        const runResult = await client.query(
          "select summary, total_processed from supplier_import_runs where id = $1 and provider = 'bohemia' limit 1",
          [importRunId]
        );
        const existing = runResult.rows[0];
        if (!existing) return { ok: false, provider: "bohemia", message: "Bohemia import run не беше намерен. Стартирай нов sync." };
        summary = {
          ...summary,
          ...(existing.summary && typeof existing.summary === "object" ? existing.summary : {}),
          processed: Number(existing.total_processed || 0)
        };
      }

      const offers = await bohemiaImport.fetchBohemiaOffers({
        baseUrl: usableBaseUrl(connector.default_base_url, "https://demo.internationaltravelgroup.net"),
        username,
        password,
        limit,
        detailsLimit: limit,
        offset,
        timeoutMs: 10000,
        types
      });
      const meta = (offers as {
        meta?: { hasMore?: boolean; nextOffset?: number; totalAvailable?: number; processedAvailable?: number };
      }).meta;
      const totalFound = meta?.totalAvailable ?? offers.length;

      if (!importRunId) {
        importRunId = await supplierImport.startSupplierImportRun(client, {
          provider: "bohemia",
          displayName: "Bohemia",
          source: "api",
          mode: "manual",
          totalFound,
          defaultBaseUrl: usableBaseUrl(connector.default_base_url, "https://demo.internationaltravelgroup.net"),
          configSnapshot: {
            phase: "catalog",
            batchSize: limit,
            types
          }
        });
      }

      for (const offer of offers) {
        try {
          const result = await bohemiaImport.upsertBohemiaOffer(client, offer, { importRunId });
          summary[result.changeState] = (summary[result.changeState] || 0) + 1;
          summary.processed += 1;
        } catch {
          summary.error += 1;
        }
      }

      await updateSupplierImportRunProgress(client, importRunId, summary);
      const nextOffset = meta?.nextOffset ?? offset + offers.length;
      const done = !meta?.hasMore || nextOffset >= totalFound;

      if (done) {
        summary.unavailable = await countSupplierImportsNotSeenInRun(client, "bohemia", importRunId);
        await updateSupplierImportRunProgress(client, importRunId, summary);
        await supplierImport.finishSupplierImportRun(client, importRunId, summary, summary.error > 0 ? new Error("Some Bohemia offers failed during catalog import.") : null);
      }

      revalidatePath("/admin/suppliers");
      revalidatePath("/admin/supplier-imports");
      revalidatePath("/admin/offers");

      return {
        ok: true,
        provider: "bohemia",
        runId: importRunId,
        totalFound,
        totalProcessed: summary.processed || 0,
        nextOffset,
        done,
        new: summary.new || 0,
        changed: summary.changed || 0,
        unchanged: summary.unchanged || 0,
        unavailable: summary.unavailable || 0,
        error: summary.error || 0,
        message: done
          ? [`Bohemia sync е готов: ${summary.processed || 0}/${totalFound} обработени.`, missingSupplierMessage("Bohemia", summary.unavailable || 0)].filter(Boolean).join(" ")
          : `Обработени са ${summary.processed || 0}/${totalFound}. Продължаваме със следващата партида.`
      };
    } finally {
      client.release();
    }
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Синхронизацията не беше успешна."
    };
  }
}
