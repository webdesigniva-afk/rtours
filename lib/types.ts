export type OfferStatus = "draft" | "review" | "published" | "archived" | "needs_changes";

export type OfferSource = "manual" | "xml" | "api" | "labeling" | "erp";

export type TransportType = "flight" | "bus" | "own_transport" | "mixed";

export type TravelMood =
  | "culture"
  | "calm"
  | "adventure"
  | "romance"
  | "food"
  | "family"
  | "signature"
  | "private";

export interface SeoFields {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
}

export interface Destination {
  slug: string;
  name: string;
  country: string;
  region: string;
  summary: string;
  image: string;
}

export interface Collection {
  slug: string;
  name: string;
  summary: string;
  mood: TravelMood;
  image: string;
}

export interface OfferDate {
  label: string;
  startDate: string;
  endDate: string;
  availability: "available" | "limited" | "on_request" | "sold_out";
}

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
}

export interface Offer {
  slug: string;
  title: string;
  summary: string;
  description: string;
  destinationSlug: string;
  collectionSlugs: string[];
  country: string;
  region: string;
  durationDays: number;
  transport: TransportType;
  priceFrom: number;
  currency: "EUR" | "BGN";
  priceNote: string;
  source: OfferSource;
  status: OfferStatus;
  heroImage: string;
  gallery: string[];
  dates: OfferDate[];
  moods: TravelMood[];
  tags: string[];
  included: string[];
  excluded: string[];
  itinerary: ItineraryDay[];
  seo: SeoFields;
}
