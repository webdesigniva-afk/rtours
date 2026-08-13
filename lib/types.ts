export type OfferStatus = "draft" | "review" | "published" | "archived" | "needs_changes";

export type OfferSource = "manual" | "xml" | "api" | "labeling" | "erp";

export type OfferProductType = "excursion" | "holiday" | "hotel" | "flight" | "service" | "package";

export type TransportType = "flight" | "bus" | "own_transport" | "mixed";

export type TaxonomyTermType =
  | "category"
  | "theme"
  | "audience"
  | "mood"
  | "badge"
  | "collection"
  | "transport"
  | "service_type"
  | "destination_style"
  | "season";

export type OfferVisibilityPlacement =
  | "homepage"
  | "offers_index"
  | "collection_page"
  | "destination_page"
  | "search"
  | "promo_section"
  | "private_link"
  | "hidden";

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
  canonicalUrl?: string;
  structuredDataType?: string;
}

export interface OfferMedia {
  url: string;
  alt: string;
  caption?: string;
  source?: OfferSource | "stock" | "redtours";
  isPrimary?: boolean;
}

export interface ExternalOfferSync {
  provider: string;
  externalId: string;
  lastSyncedAt?: string;
  checksum?: string;
  rawPayloadUrl?: string;
  changeState?: "new" | "changed" | "expired" | "unavailable" | "unchanged";
}

export interface OfferReviewState {
  assignedTo?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  publishAt?: string;
  archivedAt?: string;
  notes?: string;
}

export interface TaxonomyTerm {
  slug: string;
  type: TaxonomyTermType;
  name: string;
  publicLabel?: string;
  description?: string;
  color?: string;
  icon?: string;
  isPublic: boolean;
  isFilterable: boolean;
  isSearchable: boolean;
  sortOrder: number;
}

export interface OfferTaxonomyTerm {
  termSlug: string;
  termType: TaxonomyTermType;
  source: OfferSource;
  isPrimary?: boolean;
  confidence?: number;
}

export interface OfferVisibilityRule {
  placement: OfferVisibilityPlacement;
  isEnabled: boolean;
  priority: number;
  startsAt?: string;
  endsAt?: string;
  notes?: string;
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
  departurePoints?: string;
  availability: "available" | "limited" | "on_request" | "sold_out";
}

export interface OfferDestinationPoint {
  country: string;
  region?: string;
  city?: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  accommodation?: string;
  meals?: string;
  transport?: string;
}

export interface Offer {
  slug: string;
  productType?: OfferProductType;
  productTypeLabel?: string;
  title: string;
  summary: string;
  description: string;
  destinationSlug: string;
  collectionSlugs: string[];
  categorySlugs?: string[];
  themeSlugs?: string[];
  taxonomyTerms?: OfferTaxonomyTerm[];
  taxonomyTermSlugs?: string[];
  badgeSlugs?: string[];
  audienceSlugs?: string[];
  visibilityPlacements?: OfferVisibilityPlacement[];
  visibilityRules?: OfferVisibilityRule[];
  country: string;
  region: string;
  city?: string;
  destinations?: OfferDestinationPoint[];
  durationDays: number;
  durationNights?: number;
  transport: TransportType;
  priceFrom: number;
  currency: "EUR" | "BGN";
  priceNote: string;
  priceIncludesTaxes?: boolean;
  source: OfferSource;
  status: OfferStatus;
  isAuthorProgram?: boolean;
  heroImage: string;
  gallery: string[];
  media?: OfferMedia[];
  dates: OfferDate[];
  moods: TravelMood[];
  tags: string[];
  highlights?: string[];
  included: string[];
  excluded: string[];
  itinerary: ItineraryDay[];
  seo: SeoFields;
  externalSync?: ExternalOfferSync;
  review?: OfferReviewState;
  createdAt?: string;
  updatedAt?: string;
}
