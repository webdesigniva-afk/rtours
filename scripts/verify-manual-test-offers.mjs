import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
    if (match) process.env[match[1]] ??= match[2].replace(/^["']|["']$/g, "");
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

try {
  const result = await pool.query(
    `
      select
        offer.slug,
        offer.title,
        offer.status,
        count(distinct itinerary.id)::int as itinerary_days,
        count(distinct media.id)::int as media_items,
        count(distinct date.id)::int as dates
      from offers offer
      left join offer_itinerary_days itinerary on itinerary.offer_id = offer.id
      left join offer_media media on media.offer_id = offer.id
      left join offer_dates date on date.offer_id = offer.id
      where offer.review_notes = '[seed-test-offer] Реалистична тестова ръчна оферта.'
      group by offer.id
      order by offer.title
    `
  );

  console.table(result.rows);
} finally {
  await pool.end();
}
