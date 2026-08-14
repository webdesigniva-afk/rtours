# Bohemia API import

Bohemia is integrated as a controlled external offer source. The sync imports XML data into the existing RedTours offer model and keeps imported offers in `review`, not `published`.

## Environment

Add these values to `.env.local`:

```env
BOHEMIA_API_BASE_URL=https://demo.internationaltravelgroup.net
BOHEMIA_API_USERNAME=
BOHEMIA_API_PASSWORD=
BOHEMIA_SYNC_LIMIT=20
BOHEMIA_SYNC_DETAILS_LIMIT=20
```

Use the production base URL only after the test sync is verified:

```env
BOHEMIA_API_BASE_URL=https://ims.internationaltravelgroup.net
```

## Commands

Normal handover workflow is through the admin panel:

1. Open `/admin/supplier-imports`.
2. Choose the supplier connector and environment.
3. Enter the API username and password.
4. Set `limit` and `details_limit`.
5. Run the sync.
6. Review each imported offer from the list, edit the public RedTours layer, then publish.

For a complete validation/import, enable `Импортирай всички налични оферти`. This ignores `limit` and `details_limit` and imports every result returned by the selected Bohemia feeds.

The API password is used for that sync request only and is not stored in the database.

The commands below are for developer/debug use only.

Preview without writing to the database:

```bash
npm run bohemia:sync -- --dry-run --limit=5 --details-limit=5
```

Import a small batch:

```bash
npm run bohemia:sync -- --limit=5 --details-limit=5
```

Import only excursions or holidays:

```bash
npm run bohemia:sync -- --types=excursion --limit=10
npm run bohemia:sync -- --types=holiday --limit=10
```

## Safety model

- Imported rows use `provider = bohemia` and `external_id = excursion:<OfferID>` or `holiday:<OfferID>`.
- Re-running sync updates existing rows through `offer_imports`, so duplicates are avoided.
- Existing published imported offers are moved back to `review` if changed.
- Raw parsed API payload is stored in `offer_imports.raw_payload` for audit/debugging.
- Reservations are intentionally not created through the API yet. Website submissions remain CRM leads until booking workflow is designed.
