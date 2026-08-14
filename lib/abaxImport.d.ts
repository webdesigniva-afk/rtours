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
}
