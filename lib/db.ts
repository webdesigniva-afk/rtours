import { Pool, type QueryResultRow } from "pg";

const globalForPg = globalThis as typeof globalThis & {
  redtoursPgPool?: Pool;
};

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing. Add it to .env.local before using admin data actions.");
  }

  return databaseUrl;
}

export function getDbPool() {
  if (!globalForPg.redtoursPgPool) {
    globalForPg.redtoursPgPool = new Pool({
      connectionString: getDatabaseUrl(),
      ssl: {
        rejectUnauthorized: false
      }
    });
  }

  return globalForPg.redtoursPgPool;
}

export async function dbQuery<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) {
  return getDbPool().query<T>(text, values);
}
