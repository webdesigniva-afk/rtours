# RedTours Documents Roadmap

This note consolidates the August 13, 2026 Word documents received for the RedTours website and digital platform.

Source documents:

- `RED TOURS задание за сайт.docx`
- `RED TOURS съдържание сайт - текстове и заглавия.docx`
- `RED TOURS suppl content hub.docx`
- `RED TOURS DIGITAL PLATFORM.docx`
- `APPENDIX A Red tours digital platform.docx`

## Executive Summary

The documents describe one connected product, not separate systems:

Product management -> costing -> website publishing -> website lead -> CRM -> reservation -> payments -> suppliers -> operations -> analytics.

The public website should launch first as a premium, editorial travel experience with structured offer content. The internal platform should then grow around the same product data, so RedTours does not repeatedly copy content between Word, Excel, email, Viber, the website, and the existing back-office system.

The critical architecture rule is: enter information once, reuse it everywhere.

## Phase 1: Public Website MVP

Goal: client-facing site that already reflects the final brand direction and uses a data structure that can later support CRM, imports, reservations, and operations.

Must include:

- Homepage with video/image hero, search access, curated offers, author programs, exotic trips, tailor-made CTA, special experiences, RED Collections, trust section, vouchers, blog/newsletter.
- Offers listing page with search, destination, period, experience type, duration, travel mode, and budget filters.
- Offer detail page with destination, dates, duration, prices, itinerary, included/excluded services, optional services, gallery, availability, and inquiry CTA.
- Main navigation: Trips, Author Programs, Exotics, Special Experiences, About Red tours, Contacts, Blog.
- Footer/legal/system pages: FAQ, Terms, Privacy Policy, Cookie Policy, pre-contractual legal information, search results, no results, sent inquiry, 404, cookie consent.
- Bulgarian first, with structure ready for English.
- Strong imagery/video, black/gray/white/red palette, premium spacing, restrained motion, and no aggressive promo clutter.

Implementation note:

- Current app already has homepage, offers, offer detail, destinations, blog, contacts, admin, seeded data, offer repository, and offer-related migrations.
- The next website work should focus on filling the missing public pages and aligning taxonomy/content labels with the new documents.

## Phase 2: Website Lead To CRM

Goal: every valid inquiry from the website becomes a structured lead, not only an email.

Lead fields:

- name, phone, email;
- program/offer;
- selected date or period;
- adults, children, room type;
- budget when applicable;
- message;
- source page;
- campaign/source data when available;
- received timestamp.

Pipeline:

NEW -> CONTACTED -> OFFER SENT -> OPTION -> BOOKED or LOST.

Must support:

- responsible person assignment;
- transfer between employees;
- status history;
- internal notes;
- possible existing client detection by email/phone/reliable identifiers;
- conversion to reservation;
- conversion rate reporting.

## Phase 3: Product Management

Goal: RedTours staff create one central travel product that can feed the website, PDF/offers, client program, reservation documents, and travel information.

Product types:

- Standard Red tours Program;
- Tailor-made;
- Corporate / Incentive;
- Group Request.

Product status:

IDEA -> RESEARCH -> COSTING -> READY -> PUBLISHED -> ACTIVE -> CLOSED.

Core fields:

- name, destination, country/region, trip type;
- start/end date, days, nights;
- transport and departure point;
- product manager;
- min tourists and max capacity;
- suppliers, attachments, internal notes;
- day-by-day itinerary with title, description, accommodation, meals, transport, included services, optional services, images;
- reorderable days;
- audit history and autosave/protection against lost edits.

Publishing workflow:

EDIT -> PREVIEW -> APPROVE -> PUBLISH.

Important rule:

- Changes after publishing must not silently update the public page. Use a review step such as `Changes detected -> Review -> Update website`.
- Internal notes must never be exposed publicly.

## Phase 4: Costing And Price Management

Goal: structured cost and selling price management with versions.

Cost components:

- flights, accommodation, transfers, guides, tickets, transport, insurance, meals, commissions, miscellaneous costs.

Each cost component needs:

- supplier;
- currency;
- unit cost;
- quantity;
- total;
- price status.

Price statuses:

- FIXED;
- OPTION UNTIL, with date/time;
- DYNAMIC;
- BUDGETARY.

Selling price:

- target margin;
- contingency;
- markup;
- manual adjustment;
- final selling price.

Versioning:

- calculations must not be overwritten destructively;
- users should compare at least two versions;
- examples: V1 Initial, V2 Updated flights, V3 Contracted hotel, V4 Final.

## Phase 5: Supplier Content Hub

Goal: receive approximately 10 external API/XML/JSON supplier feeds without automatically turning every external product into a RedTours editorial product.

Recommended workflow:

IMPORT -> VALIDATE -> REVIEW -> TRANSLATE/EDIT -> APPROVE -> PUBLISH.

Supplier-owned fields:

- supplier identity;
- external ID;
- original title/description;
- original price/dates/availability;
- source payload;
- sync timestamp;
- checksum/change state.

RedTours editorial fields:

- RedTours title and description;
- category, collection, tags;
- translation status;
- editorial status;
- visibility;
- suitability/recommendation flags.

Public presentation:

- first show curated RedTours programs;
- then show partner options as a separate area, clearly presented as partner content or agency offers.

Roles:

- Administrator;
- Content Manager;
- Approver/Product Manager;
- Sales Consultant.

## Phase 6: Departures, Inventory, Options

Goal: track capacity and temporary holds per departure.

For each date/departure:

- total capacity;
- confirmed;
- option;
- available;
- aircraft/bus seats;
- room types;
- additional services.

Accommodation inventory:

- DBL, TWIN, SGL, TRPL, Family and other room types;
- initial allotment;
- added allotment;
- release;
- sold;
- available.

Options:

- typical hold period up to 72 hours;
- option until date/time;
- warnings before expiry;
- OPTION -> CONFIRMED after deposit;
- extension by staff;
- automatic release only if explicit business rules are approved.

## Phase 7: CRM, VIP, Back-Office Integration

Goal: connect website and sales activity to a single client view while avoiding duplicated functionality already handled by the existing tourism back-office.

CRM client card:

- contacts;
- inquiries;
- reservations;
- trips as booking holder or traveler in another reservation;
- previous trips;
- last trip;
- number of bookings;
- lifetime booking value if data allows;
- preferences and notes;
- communication history.

VIP recognition:

- returning/VIP indicator on new inquiry;
- automatic and manual VIP status;
- configurable automatic criteria.

Back-office rule:

- before building contracts, documents, invoicing, payments, cash reports, VAT margin protocols, or reservation lifecycle modules, assess the API capability of the existing back-office.
- preferred architecture: RedTours Digital Platform <-> API <-> Existing Back-Office.

## Phase 8: Operations, Tasks, Analytics

Operations:

- suppliers;
- allotments;
- deadlines;
- supplier payments;
- passenger and rooming lists;
- departure documents.

Tasks:

- related project/reservation/client/supplier;
- responsible person;
- deadline;
- priority;
- status;
- views for Today, Overdue, This Month;
- automatic deadlines from options, payments, supplier releases, and departures.

Management dashboard:

- new website inquiries;
- new confirmed bookings;
- payments received;
- cash balances;
- overdue payments;
- overdue tasks;
- priority programs;
- top sellers;
- trending programs;
- sales alerts;
- low conversion alerts;
- capacity/load warnings.

## Immediate Backlog

1. Align public navigation and sitemap with the new website assignment.
2. Add missing public pages: FAQ, legal pages, sent inquiry page, no-results state, vouchers, tailor-made, RED Collections landing.
3. Update homepage labels and collections to match the final content document: `Iconic Journeys`, `Hidden Europe`, `Taste the World`, `Nature & Wildlife`, `Music & Events`, `Small Group Journeys`.
4. Extend inquiry capture so website forms persist structured leads with source and requested trip details.
5. Add lead pipeline tables and admin views.
6. Split offer/product status into internal product status and public publishing status.
7. Add product day fields that are still missing: accommodation, meals, transport, included services, optional services, images.
8. Add supplier references and attachments to products.
9. Design costing schema with currencies, price statuses, and version history.
10. Create supplier import staging schema before integrating any live API/XML feed.
11. Run back-office API assessment before building reservation, invoicing, payment, contract, or VAT margin modules.

## Current Risk Notes

- Scope is much larger than a public website. Treat the website as Phase 1 of a platform, not the whole delivery.
- Imported supplier content must remain review-first; automatic publication would conflict with RedTours' curated positioning.
- Back-office replacement should not be assumed. Existing software may already handle legally sensitive reservation, payment, invoicing, and VAT workflows.
- Public and internal product states must be separated to prevent accidental website updates.
- Legal/pre-contractual flows are mentioned as future requirements and should be handled before online booking/payment launch.
