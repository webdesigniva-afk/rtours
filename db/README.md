# RedTours Database

This folder contains the production database foundation for the RedTours platform.

The initial migration targets PostgreSQL and is compatible with Supabase-style projects. It defines the content model before the application is connected to a live database.

## Current State

- `migrations/0001_redtours_content.sql` defines the core schema.
- `migrations/0002_taxonomy_visibility.sql` defines the shared taxonomy, import mapping, offer visibility rules, and searchable offer index.
- The Next.js app still reads seeded content from `lib/data.ts`.
- Public pages are already constrained to `published` offers.
- Admin screens can use the repository layer now and can later switch to a database-backed adapter.
- Taxonomy terms are the shared source for ERP labels, public filters, search facets, badges, collections, moods, and import normalization.

## Next Implementation Steps

1. Choose the runtime database provider.
2. Add environment variables for the database connection.
3. Add an authenticated admin area.
4. Implement database-backed repositories for offers, destinations, categories, themes, collections, media, and inquiries.
5. Add seed/import scripts that map current `lib/data.ts` content into the database and connect offers to `taxonomy_terms`.
6. Use `offer_visibility_rules` to control where each offer appears on the public site instead of showing every published offer everywhere.
