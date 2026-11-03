// GetTransfer ride requests mirrored into Neon by the "GT Sync" Chrome
// extension (gettransfer-extension/ next to this repo).
//
// GetTransfer has no carrier API, so the extension runs inside the carrier's
// own signed-in gettransfer.com tab: every few minutes it posts the open
// requests here and picks up the offers the admin approved, which it then
// submits on gettransfer.com itself. This server never talks to GetTransfer.

import { randomBytes, timingSafeEqual } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { getConfig, setConfig } from "./inboxStore";

export class GetTransferError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

const SCHEMA = [
  `create table if not exists gt_requests (
    id bigint primary key,
    data jsonb not null,
    date_to text,
    status text not null default 'new',
    first_seen_at bigint not null,
    last_seen_at bigint not null,
    offer jsonb,
    offer_status text,
    offer_error text,
    offer_at bigint
  )`,
  `create index if not exists gt_requests_seen on gt_requests (last_seen_at desc)`,
];

// status:       new → (skipped) | gone (no longer listed on GetTransfer)
// offer_status: queued (admin pressed Send) → sending (extension took it) → sent | failed

let client = null;
let schemaReady = null;

async function db() {
  if (!client) {
    if (!process.env.DATABASE_URL) {
      throw new GetTransferError("DATABASE_URL არ არის მითითებული Vercel-ში (Storage → Neon).", 503);
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

// ── Extension key ────────────────────────────────────────────────────

const CONFIG_KEY = "gettransfer";

export async function getSettings() {
  return (await getConfig(CONFIG_KEY)) || {};
}

export async function rotateKey() {
  const settings = await getSettings();
  const key = randomBytes(24).toString("base64url");
  await setConfig(CONFIG_KEY, { ...settings, key });
  return key;
}

export async function checkExtensionKey(request) {
  const given = request.headers.get("x-gt-key") || "";
  const { key } = await getSettings();
  const ok = key && given.length === key.length && timingSafeEqual(Buffer.from(given), Buffer.from(key));
  if (!ok) throw new GetTransferError("invalid_key", 401);
}

// ── Sync from the extension ──────────────────────────────────────────

// Keeps only what the admin page shows, so a GetTransfer field rename
// cannot bloat the table.
function slimTransfer(t) {
  return {
    id: t.id,
    date_to_local: t.date_to_local,
    date_return_local: t.date_return_local,
    duration: t.duration,
    distance: t.distance,
    time: t.time,
    pax: t.pax,
    type: t.type,
    from: t.from?.name || "",
    to: t.to?.name || "",
    transport_type_ids: t.transport_type_ids || [],
    child_seats_infant: t.child_seats_infant || 0,
    child_seats_convertible: t.child_seats_convertible || 0,
    child_seats_booster: t.child_seats_booster || 0,
    name_sign_present: !!t.name_sign_present,
    comment: t.comment || "",
    passenger_offered_price: t.passenger_offered_price ?? null,
    urgent: !!(t.urgent || t.asap),
    commission: t.commission ?? null,
    suggested_prices: t.suggested_prices || {},
    restricted_prices: t.restricted_prices || {},
    carrier_offer: t.carrier_offer ? { price: t.carrier_offer.price?.default || t.carrier_offer.price?.base?.default || null } : null,
    created_at: t.created_at,
  };
}

export async function syncFromExtension({ transfers = [], vehicles = [], drivers = [], currency } = {}) {
  const now = Date.now();
  const list = transfers.filter((t) => Number.isFinite(Number(t?.id))).slice(0, 500);

  for (let i = 0; i < list.length; i += 50) {
    const part = list.slice(i, i + 50);
    await Promise.all(
      part.map((t) => {
        const data = slimTransfer(t);
        return query(
          `insert into gt_requests (id, data, date_to, first_seen_at, last_seen_at)
           values ($1, $2, $3, $4, $4)
           on conflict (id) do update set
             data = excluded.data, date_to = excluded.date_to, last_seen_at = excluded.last_seen_at,
             status = case when gt_requests.status = 'gone' then 'new' else gt_requests.status end`,
          [Number(t.id), JSON.stringify(data), data.date_to_local || null, now]
        );
      })
    );
  }

  // Requests that left GetTransfer's open list were taken or cancelled.
  if (list.length) {
    await query(
      `update gt_requests set status = 'gone'
       where status = 'new' and last_seen_at < $1 and coalesce(offer_status, '') not in ('queued', 'sending')`,
      [now]
    );
  }

  const settings = await getSettings();
  await setConfig(CONFIG_KEY, {
    ...settings,
    lastSyncAt: now,
    lastSyncCount: list.length,
    currency: currency || settings.currency || "GEL",
    vehicles: vehicles.map((v) => ({
      id: v.id,
      name: v.name,
      type: v.transport_type_id,
      pax: v.pax_max,
      luggage: v.luggage_max,
      plate: v.registration_number,
      driverId: v.default_driver?.id ?? null,
    })),
    drivers: drivers.map((d) => ({ id: d.id, name: d.name || d.full_name || "" })),
  });

  // Hand out the approved offers; "sending" keeps a second tab from
  // submitting the same one.
  const rows = await query(
    `update gt_requests set offer_status = 'sending', offer_at = $1
     where offer_status = 'queued' or (offer_status = 'sending' and offer_at < $2)
     returning id, offer`,
    [now, now - 10 * 60 * 1000]
  );
  return { ok: true, offers: rows.map((r) => ({ id: Number(r.id), ...r.offer })) };
}

export async function reportOfferResult({ id, ok, error }) {
  await query(
    `update gt_requests set offer_status = $2, offer_error = $3, offer_at = $4 where id = $1`,
    [Number(id), ok ? "sent" : "failed", ok ? null : String(error || "error").slice(0, 500), Date.now()]
  );
  return { ok: true };
}

// ── Admin ────────────────────────────────────────────────────────────

function toItem(r) {
  return {
    id: Number(r.id),
    ...r.data,
    status: r.status,
    firstSeenAt: Number(r.first_seen_at),
    lastSeenAt: Number(r.last_seen_at),
    offer: r.offer,
    offerStatus: r.offer_status,
    offerError: r.offer_error,
    offerAt: r.offer_at ? Number(r.offer_at) : null,
  };
}

export async function listRequests() {
  const rows = await query(
    `select * from gt_requests
     where status <> 'gone' or last_seen_at > $1
     order by date_to asc nulls last
     limit 400`,
    [Date.now() - 3 * 24 * 60 * 60 * 1000]
  );
  const { key, ...settings } = await getSettings();
  return { requests: rows.map(toItem), settings: { ...settings, hasKey: !!key } };
}

export async function queueOffer({ id, vehicleId, price, priceReturn, withNameSign }) {
  const amount = Number(price);
  if (!Number.isFinite(amount) || amount <= 0) throw new GetTransferError("ფასი არასწორია", 400);
  const { vehicles = [], drivers = [], currency = "GEL" } = await getSettings();
  const vehicle = vehicles.find((v) => String(v.id) === String(vehicleId));
  if (!vehicle) throw new GetTransferError("მანქანა ვერ მოიძებნა — ჯერ გაფართოებამ უნდა გააკეთოს სინქრონიზაცია", 400);

  const back = priceReturn === "" || priceReturn == null ? null : Number(priceReturn);
  const offer = {
    vehicle_id: vehicle.id,
    vehicle_name: vehicle.name,
    driver_id: vehicle.driverId ?? drivers[0]?.id ?? null,
    currency,
    price_to: amount,
    price_return: Number.isFinite(back) && back > 0 ? back : null,
    with_name_sign: !!withNameSign,
  };
  const rows = await query(
    `update gt_requests set offer = $2, offer_status = 'queued', offer_error = null, offer_at = $3
     where id = $1 and coalesce(offer_status, '') <> 'sending'
     returning id`,
    [Number(id), JSON.stringify(offer), Date.now()]
  );
  if (!rows.length) throw new GetTransferError("ეს შეკვეთა ახლა იგზავნება ან არ არსებობს", 409);
  return { ok: true };
}

export async function cancelQueued(id) {
  await query(
    `update gt_requests set offer_status = null, offer = null where id = $1 and offer_status in ('queued', 'failed')`,
    [Number(id)]
  );
  return { ok: true };
}

export async function setStatus(id, status) {
  if (!["new", "skipped"].includes(status)) throw new GetTransferError("bad_status", 400);
  await query(`update gt_requests set status = $2 where id = $1`, [Number(id), status]);
  return { ok: true };
}
