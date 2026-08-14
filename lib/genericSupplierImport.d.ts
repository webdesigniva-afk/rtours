declare module "@/lib/genericSupplierImport.mjs" {
  export function normalizeGenericSupplierPayload(
    payload: unknown,
    options?: {
      provider?: string;
      source?: "api" | "xml" | "json" | "csv" | "file" | "labeling" | "erp";
      mapping?: Record<string, unknown>;
    }
  ): Array<Record<string, unknown>>;
}
