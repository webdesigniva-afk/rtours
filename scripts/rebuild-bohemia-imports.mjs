import { Pool } from "pg";
import { loadLocalEnv } from "./load-env.mjs";
import { mapStoredBohemiaRaw, upsertBohemiaOffer } from "../lib/bohemiaImport.mjs";

loadLocalEnv();

const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const offsetArg = process.argv.find((arg) => arg.startsWith("--offset="));
const rebuildAll = process.argv.includes("--all");
const limit = limitArg ? Number.parseInt(limitArg.split("=")[1] || "50", 10) : rebuildAll ? null : 50;
const offset = Number.parseInt(offsetArg?.split("=")[1] || "0", 10);
const baseUrl = process.env.BOHEMIA_API_BASE_URL || "https://demo.internationaltravelgroup.net";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const summary = { rebuilt: 0, skipped: 0, failed: 0 };

try {
  const limitClause = Number.isFinite(limit) && limit > 0 ? "limit $1 offset $2" : "";
  const params = limitClause ? [limit, Number.isFinite(offset) && offset > 0 ? offset : 0] : [];
  const imports = await pool.query(
    `
      select external_id, raw_payload
      from offer_imports
      where provider = 'bohemia'
        and raw_payload is not null
      order by external_id
      ${limitClause}
    `,
    params
  );

  console.log(`Bohemia rebuild selected ${imports.rows.length} imports${limitClause ? ` (limit ${limit}, offset ${offset})` : ""}.`);

  for (const item of imports.rows) {
    const client = await pool.connect();
    client.setMaxListeners(0);
    let connectionError = null;
    client.on("error", (error) => {
      connectionError = error;
      console.error(`${item.external_id || "unknown"} connection error: ${error.message}`);
    });
    try {
      const offer = mapStoredBohemiaRaw(item.raw_payload, baseUrl);
      if (!offer) {
        summary.skipped += 1;
        continue;
      }
      await upsertBohemiaOffer(client, offer, { force: true });
      summary.rebuilt += 1;
      if ((summary.rebuilt + summary.skipped + summary.failed) % 10 === 0) {
        console.log(`Progress: ${JSON.stringify(summary)}`);
      }
    } catch (error) {
      summary.failed += 1;
      console.error(`${item.external_id || "unknown"}: ${error instanceof Error ? error.message : error}`);
    } finally {
      client.release(connectionError || undefined);
    }
  }

  console.log(`Bohemia rebuild complete: ${JSON.stringify(summary)}`);
} finally {
  await pool.end();
}
