# RedTours Platform - Product Blueprint v1

## Purpose

RedTours is building a modern travel platform that starts with a high-quality public website and grows into an integrated administrative, client, and ERP ecosystem.

The first delivery must not be a throwaway prototype. It should be a working product foundation with clear UX, structured content, SEO readiness, and data models that can later support imports, MyTrips, reservations, payments, and ERP workflows.

## Product Principles

- Brand first, catalog second: the homepage must communicate RedTours' identity before showing large lists of offers.
- Premium by design rationale: typography, palette, spacing, imagery, and interactions must be explainable and consistent.
- Curated public experience: not every offer in the database should appear automatically on main public pages.
- Multiple discovery paths: users should find travel by destination, theme, mood, collection, and direct search.
- Real content over placeholders: first prototypes should use realistic offers, imagery, and copy.
- Controlled publishing: imported or edited offers require review before publication.
- Future-ready data: offers must be structured in a way that can support the public site, admin panel, imports, client profiles, and ERP integration.
- Iterative delivery: launch the public site first, then add deeper ERP and automation capabilities in controlled phases.

## Phase 1 MVP

The first working version should include:

- Homepage with brand-led hero, trust signals, featured collections, and selected offers.
- Offers listing page with filtering by destination, category, mood, and transport.
- Offer detail page with itinerary, dates, price, included/excluded services, gallery, SEO metadata, and inquiry entry point.
- Destination and thematic collection structure.
- Corporate services page.
- Inquiry form that can later feed CRM/ERP.
- Admin-ready content model for offers, destinations, categories, collections, and SEO fields.

## Deferred Modules

These are important but should be specified in dedicated workshops before full implementation:

- MyTrips client area.
- Gift voucher purchase and PDF generation.
- Online payments and deposits.
- XML/API imports from tour operators.
- B2B hotel search behind login.
- Corporate accounts with special terms.
- Full ERP reservation lifecycle.
- Accounting documents, VAT protocols, supplier expenses, and multi-period financial logic.
- Migration from legacy systems.
- Push notifications and WebView/PWA packaging.
- AI-assisted content generation and rewriting.

## Core User Journeys

### Inspiration Journey

1. User lands on homepage.
2. User understands RedTours' positioning and style.
3. User explores a collection such as Red Signature or Red Escape.
4. User opens an offer.
5. User sends an inquiry.

### Destination Journey

1. User searches or filters by country/destination.
2. User compares matching offers.
3. User checks dates, duration, transport, price, and included services.
4. User sends an inquiry.

### Intent Journey

1. User starts from a mood or desire such as culture, calm, romance, adventure, or food.
2. The site maps that intent to relevant collections and offers.
3. User narrows choices through filters.
4. User sends an inquiry.

## Content Model Summary

### Offer

An offer should support:

- Title, slug, summary, description.
- Destination, country, region.
- Type of travel and transport.
- Price, currency, price notes.
- Dates, duration, availability status.
- Gallery and hero media.
- Itinerary by day.
- Included and excluded services.
- Categories, moods, collections, and tags.
- Source: manual, XML, API, labeling, or future ERP.
- Publication status: draft, review, published, archived, needs changes.
- SEO: meta title, meta description, canonical URL, keywords, structured data fields.

### Inquiry

An inquiry should capture:

- Offer reference.
- Selected date or travel period.
- Number and type of travelers.
- Contact details.
- Notes and preferences.
- Consent and source page.
- Status for later CRM handling.

## Quality Bar

- Responsive design must be first-class, not an afterthought.
- Navigation should be understandable within seconds.
- Page hierarchy should be visually calm and consistent.
- No overlapping text, unstable layout shifts, or decorative clutter.
- SEO metadata and semantic page structure must be present from the beginning.
- Content must be editable by structure, not hardcoded into layout decisions.
- Public pages must be fast enough to support image/video-rich travel content.

## Premium Acceptance Criteria

Each public-facing page should pass these checks before being presented as client-ready:

- The page has a clear editorial hierarchy: one dominant idea, controlled supporting text, and no competing hero-scale elements.
- Typography choices are consistent with the design rationale: serif for emotional editorial moments, sans-serif for clarity and action.
- Red appears as a brand/action color, not as decoration everywhere.
- Photography feels specific to travel, destination, service, or experience; it must not feel anonymous or filler.
- Spacing is generous enough to feel premium but not so loose that navigation becomes slow.
- Repeated components use the shared design system rather than one-off styling.
- Mobile layout preserves the same premium hierarchy and does not collapse into oversized blocks.
- Every CTA has a clear reason to exist.
- No visible text should explain that the site is a prototype, a feature demo, or a technical concept.

## Presentation Argument

When presenting the design to RedTours, the framing should be:

- The site is not trying to show everything at once; it curates and builds trust first.
- The visual language is warmer and more editorial than a standard travel catalog because RedTours sells confidence, taste, and organization.
- The structure is premium on the surface but operational underneath, so the same content model can later support admin, imports, MyTrips, and ERP.
- The design deliberately avoids short-lived decorative trends so the platform can age well.

## Open Questions

- Exact required fields for each offer type.
- Rules for prices, dates, discounts, and deposits.
- Initial collection names and taxonomy.
- Which offers and content RedTours will provide for the first prototype.
- Payment provider and commission priorities.
- Admin roles and approval workflow.
- Import providers and sample XML/API formats.
- Scope of first MyTrips version.
- Hosting, environments, backup, and access management.
