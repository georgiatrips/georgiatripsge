// Tours prepared for other marketplaces (GetYourGuide, Tripster): every field
// those sites ask for when a tour is uploaded, plus each site's launch status.
// Kept in Neon next to the GetTransfer data, admin only.

import { neon } from "@neondatabase/serverless";

export class MarketplaceError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

const SCHEMA = [
  `create table if not exists marketplace_listings (
    id text primary key,
    data jsonb not null,
    created_at bigint not null,
    updated_at bigint not null
  )`,
];

let client = null;
let schemaReady = null;

async function db() {
  if (!client) {
    if (!process.env.DATABASE_URL) {
      throw new MarketplaceError("DATABASE_URL არ არის მითითებული (Vercel → Storage → Neon).", 503);
    }
    client = neon(process.env.DATABASE_URL);
  }
  schemaReady ||= client.transaction(SCHEMA.map((statement) => client.query(statement))).catch((err) => {
    schemaReady = null;
    throw err;
  });
  await schemaReady;
  return client;
}

const query = async (text, params = []) => (await db()).query(text, params);

const ID_RE = /^[A-Za-z0-9_-]{6,64}$/;
const MAX_BYTES = 400_000;

export async function listListings() {
  const rows = await query(`select id, data, created_at, updated_at from marketplace_listings order by updated_at desc`);
  return rows.map((row) => ({
    ...row.data,
    id: row.id,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  }));
}

export async function saveListing(listing) {
  if (!listing || typeof listing !== "object") throw new MarketplaceError("bad_listing", 400);
  const { id, createdAt, updatedAt, ...data } = listing;
  if (!ID_RE.test(String(id || ""))) throw new MarketplaceError("bad_id", 400);
  const json = JSON.stringify(data);
  if (json.length > MAX_BYTES) throw new MarketplaceError("ჩანაწერი ძალიან დიდია.", 413);
  const now = Date.now();
  await query(
    `insert into marketplace_listings (id, data, created_at, updated_at) values ($1, $2::jsonb, $3, $3)
     on conflict (id) do update set data = excluded.data, updated_at = excluded.updated_at`,
    [id, json, now]
  );
  return { id, updatedAt: now };
}

export async function deleteListing(id) {
  if (!ID_RE.test(String(id || ""))) throw new MarketplaceError("bad_id", 400);
  await query(`delete from marketplace_listings where id = $1`, [id]);
  return { ok: true };
}
