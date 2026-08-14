declare module "@/lib/abaxImport.mjs" {
  export function fetchAbaxOfferCounts(options: {
    baseUrl?: string;
    key: string;
    code: string;
    timeoutMs?: number;
  }): Promise<{
    total: number;
    programs: number;
  }>;

  export function fetchAbaxOffers(options: {
    baseUrl?: string;
    key: string;
    code: string;
    limit?: number;
    offset?: number;
    timeoutMs?: number;
    includePrices?: boolean;
    concurrency?: number;
  }): Promise<Array<Record<string, unknown>> & {
    meta?: {
      totalAvailable?: number;
      processedAvailable?: number;
      hasMore?: boolean;
      nextOffset?: number;
      offset?: number;
      limit?: number;
    };
  }>;

  export function mapStoredAbaxRaw(rawPayload: Record<string, unknown>): Record<string, unknown> | null;
}
