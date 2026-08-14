declare module "@/lib/bohemiaImport.mjs" {
  export type BohemiaOffer = {
    externalId: string;
    title: string;
    productType: "excursion" | "holiday" | "hotel" | "flight" | "service" | "package";
    transport: "flight" | "bus" | "own_transport" | "mixed";
    dates: unknown[];
    priceFrom: number | null;
    currency: "EUR" | "BGN";
  };

  export function fetchBohemiaOffers(options: {
    baseUrl: string;
    username: string;
    password: string;
    limit: number;
    detailsLimit: number;
    offset?: number;
    timeoutMs?: number;
    types: string[];
  }): Promise<
    BohemiaOffer[] & {
      meta?: {
        hasMore?: boolean;
        nextOffset?: number;
        offset?: number;
        limit?: number;
        totalAvailable?: number;
        processedAvailable?: number;
      };
    }
  >;

  export function fetchBohemiaOfferCounts(options: {
    baseUrl: string;
    username: string;
    password: string;
    timeoutMs?: number;
    types: string[];
  }): Promise<{
    excursion: number;
    holiday: number;
    total: number;
  }>;

  export function createBohemiaClient(options: {
    baseUrl: string;
    username: string;
    password: string;
    timeoutMs?: number;
  }): {
    searchExcursions: () => Promise<unknown[]>;
    searchHolidays: () => Promise<unknown[]>;
  };

  export function upsertBohemiaOffer(
    client: {
      query: (text: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
    },
    offer: BohemiaOffer,
    options?: {
      importRunId?: string | null;
      force?: boolean;
    }
  ): Promise<{
    offerId: string;
    importId?: string;
    externalId: string;
    title: string;
    changeState: "new" | "changed" | "unchanged";
    importantChanges?: Array<Record<string, unknown>>;
  }>;
}
