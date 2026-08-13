import { Client } from "pg";
import { loadLocalEnv } from "./load-env.mjs";

loadLocalEnv();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing in .env.local");
}

const expectedTables = [
  "destinations",
  "categories",
  "themes",
  "collections",
  "offers",
  "offer_dates",
  "offer_media",
  "offer_itinerary_days",
  "offer_services",
  "offer_categories",
  "offer_themes",
  "offer_collections",
  "offer_imports",
  "taxonomy_terms",
  "offer_taxonomy_terms",
  "offer_visibility_rules",
  "import_taxonomy_mappings",
  "inquiries",
  "schema_migrations"
];

const expectedViews = ["offer_search_index"];

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

await client.connect();

try {
  const tableResult = await client.query(
    `
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_type = 'BASE TABLE'
        and table_name = any($1)
      order by table_name
    `,
    [expectedTables]
  );

  const viewResult = await client.query(
    `
      select table_name
      from information_schema.views
      where table_schema = 'public'
        and table_name = any($1)
      order by table_name
    `,
    [expectedViews]
  );

  const foundTables = new Set(tableResult.rows.map((row) => row.table_name));
  const foundViews = new Set(viewResult.rows.map((row) => row.table_name));
  const missingTables = expectedTables.filter((table) => !foundTables.has(table));
  const missingViews = expectedViews.filter((view) => !foundViews.has(view));

  console.log(`Database tables found: ${foundTables.size}/${expectedTables.length}`);
  console.log(`Database views found: ${foundViews.size}/${expectedViews.length}`);

  if (missingTables.length > 0 || missingViews.length > 0) {
    if (missingTables.length > 0) {
      console.log(`Missing tables: ${missingTables.join(", ")}`);
    }
    if (missingViews.length > 0) {
      console.log(`Missing views: ${missingViews.join(", ")}`);
    }
    process.exitCode = 1;
  } else {
    console.log("Database schema verification passed.");
  }
} finally {
  await client.end();
}
