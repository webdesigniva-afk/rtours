# RedTours Taxonomy And Visibility

This document defines how offers stay synchronized between the ERP, imports, search, and the public website.

## Principle

The ERP is the source of truth. The public website is a curated presentation layer over the same offer records.

An offer can be published without being featured everywhere. Public placement is controlled by visibility rules, not by duplicating content or manually rebuilding lists on the website.

## Shared Taxonomy

All labels used for categorization, search, filtering, imports, and public badges should be stored as `taxonomy_terms`.

Term types:

- `category`: product-level grouping such as excursion, holiday, cruise, hotel, flight.
- `theme`: content themes such as culture, nature, gastronomy, photography, wine.
- `audience`: who the trip suits, such as couples, families, friends, solo travelers.
- `mood`: emotional intent, such as calm, romance, adventure, Red Signature.
- `badge`: public urgency or trust markers, such as last seats, author program, our choice, guaranteed departure.
- `collection`: curated RedTours collections such as Red Signature, Red Escape, Red Moments.
- `transport`: flight, bus, own transport, mixed.
- `service_type`: reusable service labels for inclusions and exclusions.
- `destination_style`: city break, seaside, mountain, exotic.
- `season`: spring, summer, autumn, winter.

Each term controls whether it is public, filterable, and searchable. This lets the ERP keep internal structure without exposing every operational label on the website.

## Offer Assignment

Offers connect to terms through `offer_taxonomy_terms`.

The connection stores:

- source: manual, XML, API, labeling, or ERP.
- primary flag: useful when one category/theme should visually lead.
- confidence: useful for AI or import mapping suggestions.

This replaces screen-specific tags. The offer detail editor, offers list, public cards, search filters, and import review should all read from the same assigned terms.

## Visibility

Public display is controlled through `offer_visibility_rules`.

Placements:

- `homepage`: curated home page modules.
- `offers_index`: normal public offer listing.
- `collection_page`: Red Signature, Red Escape, Red Moments, and future collections.
- `destination_page`: destination detail/listing pages.
- `search`: searchable by users even if not visually promoted.
- `promo_section`: temporary promotional blocks.
- `private_link`: accessible by direct/shared link.
- `hidden`: explicitly suppressed.

Each rule can have priority and date range. This gives RedTours control over what is shown, when it is shown, and in what order.

## Imports

External XML/API/CSV values should be normalized through `import_taxonomy_mappings`.

Imported offers should not publish automatically. They enter the ERP for review, where a team member confirms:

- mapped taxonomy terms;
- public badges;
- visibility placements;
- title, description, dates, prices, images;
- whether the offer belongs on the public site.

AI can suggest rewrites and taxonomy mapping, but the final publish action remains manual.

## Search

`offer_search_index` combines offer text, destination fields, taxonomy names, taxonomy labels, and active visibility placements.

The public search should use only offers that are published and allowed in `search`, `offers_index`, a destination page, a collection page, or another relevant public placement.

The ERP search can search across all statuses and all terms.

## Practical Rule

Never create a category, badge, collection, filter, or import label only inside a React component. If users can filter by it, editors can assign it, or imports can map to it, it belongs in `taxonomy_terms`.
