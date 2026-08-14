import { Pool } from "pg";
import { loadLocalEnv } from "./load-env.mjs";

loadLocalEnv();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function walkKeys(value, prefix = "", out = {}) {
  if (!value || typeof value !== "object") return out;

  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (Array.isArray(child)) {
      out[path] = `array(${child.length})`;
      if (child[0] && typeof child[0] === "object") walkKeys(child[0], `${path}[]`, out);
      continue;
    }

    if (child && typeof child === "object") {
      out[path] = "object";
      walkKeys(child, path, out);
      continue;
    }

    out[path] = `${typeof child}: ${String(child).slice(0, 120)}`;
  }

  return out;
}

function countBy(rows, key) {
  return rows.reduce((counts, row) => {
    const value = row[key] || "unknown";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

try {
  const imports = await pool.query(`
    select id, offer_id, external_id, raw_payload
    from offer_imports
    where provider = 'bohemia'
    order by last_synced_at desc, created_at desc
    limit 5
  `);

  for (const item of imports.rows) {
    const relations = await pool.query(
      `
        select
          (select count(*)::int from offer_dates where offer_id = $1) as dates,
          (select count(*)::int from offer_media where offer_id = $1) as media,
          (select count(*)::int from offer_itinerary_days where offer_id = $1) as itinerary,
          (select count(*)::int from offer_services where offer_id = $1) as services,
          (select count(*)::int from supplier_import_entities where import_id = $2) as entities
      `,
      [item.offer_id, item.id]
    );
    const entities = await pool.query(
      `
        select entity_type, is_enabled
        from supplier_import_entities
        where import_id = $1
      `,
      [item.id]
    );

    console.log(JSON.stringify({
      importId: item.id,
      externalId: item.external_id,
      normalized: relations.rows[0],
      supplierEntityTypes: countBy(entities.rows, "entity_type"),
      rawKeys: walkKeys(item.raw_payload)
    }, null, 2));
  }
} finally {
  await pool.end();
}
