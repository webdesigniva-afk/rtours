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
    types: string[];
  }): Promise<BohemiaOffer[]>;

  export function upsertBohemiaOffer(
    client: {
      query: (text: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
    },
    offer: BohemiaOffer
  ): Promise<{
    offerId: string;
    externalId: string;
    title: string;
    changeState: "new" | "changed" | "unchanged";
  }>;
}
