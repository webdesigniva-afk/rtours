# Supplier Import Architecture

Red Tours imports external travel offers through supplier connectors. Bohemia is the first connector, but the import pipeline is provider-neutral.

## Core Concepts

- `supplier_connectors`: one row per configured supplier, such as Bohemia, Onex, or another tour operator.
- `supplier_import_runs`: one row per manual, scheduled, rebuild, or dry-run sync.
- `offer_imports`: stable link between `provider + external_id` and a Red Tours `offer`.
- `supplier_import_entities`: imported sub-records for review, such as images, departures, itinerary days, hotels, services, payment policy, cancellation policy, insurance, and useful information.

## Normalized Supplier Offer

Every connector should map its API, XML, JSON, CSV, or file payload into the same normalized offer contract before writing to Red Tours:

```ts
type NormalizedSupplierOffer = {
  provider?: string;
  externalId: string;
  source?: "api" | "xml" | "json" | "labeling" | "erp";
  title: string;
  summary?: string | null;
  description?: string | null;
  productType: "excursion" | "holiday" | "hotel" | "flight" | "service" | "package";
  productTypeLabel?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  durationDays?: number | null;
  durationNights?: number | null;
  transport?: "flight" | "bus" | "own_transport" | "mixed";
  priceFrom?: number | null;
  currency?: "EUR" | "BGN";
  heroImageUrl?: string | null;
  media: SupplierMedia[];
  dates: SupplierDeparture[];
  itinerary: SupplierItineraryDay[];
  highlights: string[];
  includedServices: string[];
  excludedServices: string[];
  supplierEntities: SupplierImportEntity[];
  raw: unknown;
};
```

The shared writer is `upsertSupplierOffer()` in `lib/supplierImport.mjs`. Supplier-specific code should focus on fetch and normalization only.

## Review Safety

Imported supplier data is not the same as editorial Red Tours content.

- New offers enter `review`, never `published`.
- Existing published offers move back to `review` when changed.
- Repeated unchanged syncs update sync metadata but do not rewrite the offer.
- After staff saves review, `reviewed_at` protects title, summary, and description from supplier overwrite.
- Entity review choices are preserved across changed syncs when entity keys stay stable.

## Admin Visibility

The supplier import admin area shows two operational layers:

- latest `supplier_import_runs`, including status, totals, new/changed/unchanged counts, and errors;
- per-offer `important_changes`, so reviewers can quickly see why an imported offer needs attention.

`important_changes` tracks review-relevant differences between the latest normalized supplier snapshot and the previous one. The shared engine compares core offer fields such as price, currency, duration, transport, and title, plus nested departures, availability, media, itinerary, and included/excluded services when a previous normalized snapshot exists. Connector-specific rules can still add richer domain changes later, for example hotels, room boards, payment policy, cancellation policy, insurance, or taxonomy changes.

## Adding A New Supplier

1. Add a connector row in `supplier_connectors` through a migration or admin settings.
2. Create a supplier-specific fetcher/normalizer that returns `NormalizedSupplierOffer[]`.
3. Call `startSupplierImportRun()` before processing.
4. Call `upsertSupplierOffer()` for each normalized offer.
5. Call `finishSupplierImportRun()` with the summary.
6. Reuse `/admin/supplier-imports` for review and publishing.

## Next Gaps

- Detect supplier items missing from a later full sync as `expired` or `unavailable`.
- Add taxonomy mapping from supplier categories into `taxonomy_terms`.
- Expand diffing to hotels, room boards, payment policy, cancellation policy, insurance, and taxonomy assignments.
