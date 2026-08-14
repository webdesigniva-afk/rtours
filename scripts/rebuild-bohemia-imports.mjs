import { Pool } from "pg";
import { loadLocalEnv } from "./load-env.mjs";
import { mapStoredBohemiaRaw, upsertBohemiaOffer } from "../lib/bohemiaImport.mjs";

loadLocalEnv();

const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = Number.parseInt(limitArg?.split("=")[1] || "50", 10);
const baseUrl = process.env.BOHEMIA_API_BASE_URL || "https://demo.internationaltravelgroup.net";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const summary = { rebuilt: 0, skipped: 0, failed: 0 };

try {
  const imports = await pool.query(
    `
      select raw_payload
      from offer_imports
      where provider = 'bohemia'
        and raw_payload is not null
      order by last_synced_at desc, created_at desc
      limit $1
    `,
    [Number.isFinite(limit) && limit > 0 ? limit : 50]
  );

  for (const item of imports.rows) {
    const client = await pool.connect();
    try {
      const offer = mapStoredBohemiaRaw(item.raw_payload, baseUrl);
      if (!offer) {
        summary.skipped += 1;
        continue;
      }
      await upsertBohemiaOffer(client, offer);
      summary.rebuilt += 1;
    } catch (error) {
      summary.failed += 1;
      console.error(error instanceof Error ? error.message : error);
    } finally {
      client.release();
    }
  }

  console.log(`Bohemia rebuild complete: ${JSON.stringify(summary)}`);
} finally {
  await pool.end();
}
