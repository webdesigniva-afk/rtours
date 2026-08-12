# Offer Structure and Admin Workflow v1

## Purpose

All RedTours travel products should use one shared offer structure. The structure must work for excursions, holidays, hotel offers, packages, flights, and other travel services.

This shared model supports:

- manual content entry;
- XML and API imports from external tour operators;
- filtering and search;
- categories, themes, and curated public collections;
- controlled publishing;
- future CRM and ERP integration.

## Offer Content

Each offer should be able to store:

- basic information: title, slug, summary, full description, product type, status, source;
- destination data: destination, country, region, city when needed;
- timing: fixed departure dates, travel period, duration in days and nights;
- transport: flight, bus, own transport, or mixed transport;
- price: price from, currency, price notes, tax/deposit rules when specified;
- media: hero image, gallery, captions, alt text, and image source;
- program: itinerary by day or flexible program blocks;
- services: included and excluded services;
- discovery data: categories, themes, moods, tags, and collections;
- SEO: meta title, meta description, keywords, canonical URL, and structured data hints;
- administration: draft/review/published/archived/needs changes status, review notes, timestamps, and assigned staff;
- import data: provider, external ID, sync timestamp, checksum, original payload reference, and change state.

The exact required fields can differ by product type, but the underlying structure should stay consistent.

## Categories and Themes

An offer must be able to belong to more than one category or theme. This allows the same program to appear in different discovery paths, such as:

- destination search;
- family travel;
- cultural programs;
- luxury or private travel;
- weekend escapes;
- Red Signature or other curated collections.

Collections should be curated public groupings, not only database categories.

## Publishing Rules

The public website must not automatically show every offer in the database.

Public pages should use only offers with `published` status. Homepage and premium sections should show selected offers that fit the RedTours positioning and visual concept. Other offers can still be reachable through search, filtering, specific requests, or personalized recommendations when the product supports that.

Suggested statuses:

- `draft`: created but incomplete;
- `review`: ready for staff review, including imported offers;
- `published`: visible on the public website;
- `archived`: no longer actively sold or displayed;
- `needs_changes`: returned for correction.

Publishing should be controlled by authorized staff. User roles and permissions should be specified in a later admin phase.

## Import Workflow

External offers may arrive from XML files or API integrations. Imported offers must not be published automatically.

Recommended workflow:

1. Sync receives external offer data.
2. The system detects whether the offer is new, changed, expired, unavailable, or unchanged.
3. New and changed offers enter the admin panel with `review` status.
4. RedTours staff review title, description, dates, prices, categories, images, and suitability.
5. Staff may rewrite imported content, including with AI assistance, to match the RedTours tone.
6. Final approval and publication are always done by a person.

The exact sync rules for prices, dates, availability, and supplier content should be defined after reviewing real XML and API samples.

## Current Implementation Note

The first code-level structure is defined in `lib/types.ts`. The public website reads seeded offers from `lib/data.ts`.

At this stage, public offer listing and offer detail pages should use only published offers. Admin screens, database persistence, role-based access, and import jobs are future implementation steps.
