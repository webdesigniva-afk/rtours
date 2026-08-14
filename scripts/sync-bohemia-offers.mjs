import { Client } from "pg";
import { fetchBohemiaOffers, upsertBohemiaOffer } from "../lib/bohemiaImport.mjs";
import { loadLocalEnv } from "./load-env.mjs";

loadLocalEnv();

function readFlag(name, fallback = null) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function toPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readTypes() {
  const raw = readFlag("types", "excursion,holiday");
  const values = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const allowed = new Set(["excursion", "holiday"]);
  return values.filter((value) => allowed.has(value));
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString && !hasFlag("dry-run")) {
  throw new Error("DATABASE_URL is missing in .env.local");
}

const dryRun = hasFlag("dry-run");
const limit = toPositiveInteger(readFlag("limit", process.env.BOHEMIA_SYNC_LIMIT), 20);
const detailsLimit = toPositiveInteger(readFlag("details-limit", process.env.BOHEMIA_SYNC_DETAILS_LIMIT), limit);
const types = readTypes();

const offers = await fetchBohemiaOffers({
  baseUrl: process.env.BOHEMIA_API_BASE_URL || "https://demo.internationaltravelgroup.net",
  username: process.env.BOHEMIA_API_USERNAME,
  password: process.env.BOHEMIA_API_PASSWORD,
  limit,
  detailsLimit,
  types
});

console.log(`Bohemia offers fetched: ${offers.length}`);

if (dryRun) {
  for (const offer of offers.slice(0, 10)) {
    console.log(
      JSON.stringify(
        {
          externalId: offer.externalId,
          title: offer.title,
          type: offer.productType,
          transport: offer.transport,
          dates: offer.dates.length,
          priceFrom: offer.priceFrom,
          currency: offer.currency
        },
        null,
        2
      )
    );
  }

  process.exit(0);
}

const client = new Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

await client.connect();

try {
  const summary = {
    new: 0,
    changed: 0,
    unchanged: 0
  };

  for (const offer of offers) {
    const result = await upsertBohemiaOffer(client, offer);
    summary[result.changeState] = (summary[result.changeState] || 0) + 1;
    console.log(`${result.changeState.padEnd(9)} ${result.externalId} ${result.title}`);
  }

  console.log(`Bohemia sync complete: ${JSON.stringify(summary)}`);
} finally {
  await client.end();
}
