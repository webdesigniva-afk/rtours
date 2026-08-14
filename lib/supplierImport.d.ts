declare module "@/lib/supplierImport.mjs" {
  export function startSupplierImportRun(
    client: {
      query: (text: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
    },
    options: {
      provider: string;
      displayName?: string;
      source?: "api" | "xml" | "json" | "csv" | "file" | "labeling" | "erp";
      mode?: "manual" | "scheduled" | "rebuild" | "dry_run";
      totalFound?: number | null;
      defaultBaseUrl?: string | null;
      configSnapshot?: Record<string, unknown>;
    }
  ): Promise<string | null>;

  export function finishSupplierImportRun(
    client: {
      query: (text: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
    },
    runId: string | null,
    summary: Record<string, number>,
    error?: unknown
  ): Promise<void>;

  export function upsertSupplierOffer(
    client: {
      query: (text: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
    },
    offer: Record<string, unknown>,
    options?: {
      provider?: string;
      displayName?: string;
      source?: "api" | "xml" | "json" | "csv" | "file" | "labeling" | "erp";
      importRunId?: string | null;
      force?: boolean;
    }
  ): Promise<{
    offerId: string;
    importId: string;
    externalId: string;
    title: string;
    changeState: "new" | "changed" | "unchanged";
    importantChanges: Array<Record<string, unknown>>;
  }>;
}
