# RedTours Platform - Architecture Notes v1

## Initial Technical Direction

The platform should start as a modern web application with:

- Public website rendered with Next.js.
- Typed content models for offers, destinations, collections, and inquiries.
- Clear separation between domain data, UI components, and page composition.
- SEO metadata generated from structured content.
- Future path to a database-backed admin panel.

## Suggested Evolution

### Stage 1

Static or seeded content inside the application. This enables fast UX iteration and validates the content model before database complexity is introduced.

### Stage 2

Add database persistence, authentication, and admin CRUD for offers, destinations, categories, collections, media, and inquiry handling.

### Stage 3

Add supplier imports, review queues, MyTrips, document management, payments, vouchers, and CRM/ERP workflows.

### Stage 4

Add full ERP financial logic, accounting documents, migration tooling, advanced reporting, AI workflows, and notification automation.

## Non-Negotiables

- Do not couple public page layout to one-off offer fields.
- Do not auto-publish imported supplier content.
- Do not design ERP financial logic before current business processes are mapped in detail.
- Do not migrate historical bookings before data quality and target architecture are validated.

