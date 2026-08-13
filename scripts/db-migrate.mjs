import fs from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";
import { loadLocalEnv } from "./load-env.mjs";

loadLocalEnv();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing in .env.local");
}

const explicitMigrationPath = process.argv[2];
const migrationsDir = "db/migrations";
const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

await client.connect();

try {
  await client.query(`
    create table if not exists schema_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  const migrationPaths = explicitMigrationPath
    ? [explicitMigrationPath]
    : (await fs.readdir(migrationsDir))
        .filter((filename) => filename.endsWith(".sql"))
        .sort()
        .map((filename) => path.join(migrationsDir, filename));

  if (!explicitMigrationPath) {
    const migrationHistory = await client.query("select count(*)::int as count from schema_migrations");
    const existingSchema = await client.query("select to_regclass('public.offers') as offers_table");

    if (migrationHistory.rows[0]?.count === 0 && existingSchema.rows[0]?.offers_table) {
      for (const migrationPath of migrationPaths) {
        await client.query("insert into schema_migrations (filename) values ($1) on conflict do nothing", [path.basename(migrationPath)]);
      }
      console.log("Migration history initialized from existing schema.");
      migrationPaths.length = 0;
    }
  }

  for (const migrationPath of migrationPaths) {
    const filename = path.basename(migrationPath);
    const applied = await client.query("select 1 from schema_migrations where filename = $1 limit 1", [filename]);

    if (applied.rows.length > 0) {
      console.log(`Migration skipped: ${filename}`);
      continue;
    }

    const sql = await fs.readFile(migrationPath, "utf8");

    await client.query("begin");
    try {
      await client.query(sql);
      await client.query("insert into schema_migrations (filename) values ($1)", [filename]);
      await client.query("commit");
      console.log(`Migration applied: ${filename}`);
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }
} finally {
  await client.end();
}
