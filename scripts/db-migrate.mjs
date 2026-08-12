import fs from "node:fs/promises";
import { Client } from "pg";
import { loadLocalEnv } from "./load-env.mjs";

loadLocalEnv();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing in .env.local");
}

const migrationPath = process.argv[2] || "db/migrations/0001_redtours_content.sql";
const sql = await fs.readFile(migrationPath, "utf8");
const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

await client.connect();

try {
  await client.query(sql);
  console.log(`Migration applied: ${migrationPath}`);
} finally {
  await client.end();
}
