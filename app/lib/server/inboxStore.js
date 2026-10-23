// Admin inbox storage (WhatsApp + Facebook Messenger) in Neon Postgres.
//
// Chats used to live in Firestore, whose free plan allows 50k reads a day;
// an admin panel that polls its inbox spent that in an evening and locked
// the whole site out. Postgres has no per-read quota, so the inbox lives here
// and Firestore keeps only the site's own data.
//
// Vercel → Storage → Neon adds DATABASE_URL to the project. Tables are
// created on first use (see SCHEMA), so a fresh database needs no setup.

import { neon } from "@neondatabase/serverless";

export const CHANNELS = new Set(["whatsapp", "messenger"]);

export class InboxError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

const SCHEMA = [
  `create table if not exists inbox_conversations (
    channel text not null,
    id text not null,
    profile_name text,
    last_message_at bigint,
    last_text text,
    last_direction text,
    last_incoming_at bigint,
    unread integer not null default 0,
    updated_at timestamptz not null default now(),
    primary key (channel, id)
  )`,
  `create index if not exists inbox_conversations_recent on inbox_conversations (channel, last_message_at desc)`,
  `create table if not exists inbox_messages (
    channel text not null,
    conversation_id text not null,
    id text not null,
    direction text not null,
    source text,
    type text,
    text text,
    timestamp bigint not null,
    media_id text,
    reply_to text,
    status text,
    error text,
    created_at timestamptz not null default now(),
    primary key (channel, id)
  )`,
  `create index if not exists inbox_messages_thread on inbox_messages (channel, conversation_id, timestamp)`,
  `create table if not exists inbox_contacts (
    phone text primary key,
    name text not null default '',
    updated_at timestamptz not null default now()
  )`,
  `create table if not exists inbox_config (
    key text primary key,
    value jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now()
  )`,
];

let client = null;
let schemaReady = null;

async function db() {
  if (!client) {
    if (!process.env.DATABASE_URL) {
      throw new InboxError("DATABASE_URL არ არის მითითებული Vercel-ში (Storage → Neon).", 503);
    }
    client = neon(process.env.DATABASE_URL);
  }
  schemaReady ||= (async () => {
    for (const statement of SCHEMA) await client.query(statement);
  })().catch((err) => {
    schemaReady = null;
    throw err;
  });
  await schemaReady;
  return client;
}

const query = async (text, params = []) => (await db()).query(text, params);

// ── Messages ─────────────────────────────────────────────────────────

// Stores messages once each (Meta retries deliveries, so the same message can
// arrive twice) and keeps each conversation's summary up to date. Items are
// { conversationId, profileName?, record }; returns the ones that were new.
// `live` marks real-time customer messages, the only ones that count as unread.
export async function saveMessages(channel, items, { live = false } = {}) {
  const valid = items.filter((item) => item.conversationId && item.record?.id);
  if (!valid.length) return [];

  const fresh = [];
  for (let i = 0; i < valid.length; i += 50) {
    const part = valid.slice(i, i + 50);
    const inserted = await Promise.all(
      part.map(({ conversationId, record: r }) =>
        query(
          `insert into inbox_messages
             (channel, conversation_id, id, direction, source, type, text, timestamp, media_id, reply_to, status, error)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           on conflict (channel, id) do nothing
           returning id`,
          [
            channel,
            conversationId,
            r.id,
            r.direction,
            r.source ?? null,
            r.type ?? null,
            r.text ?? "",
            r.timestamp,
            r.mediaId ?? null,
            r.replyTo ?? null,
            r.status ?? null,
            r.error ?? null,
          ]
        )
      )
    );
    part.forEach((item, j) => inserted[j].length && fresh.push(item));
  }

  const byConversation = new Map();
  for (const item of fresh) {
    const entry = byConversation.get(item.conversationId) || { latest: null, lastIncomingAt: null, incoming: 0, profileName: null };
    if (!entry.latest || item.record.timestamp >= entry.latest.timestamp) entry.latest = item.record;
    if (item.record.direction === "in") {
      entry.lastIncomingAt = Math.max(entry.lastIncomingAt || 0, item.record.timestamp);
      if (live) entry.incoming += 1;
    }
    entry.profileName = item.profileName || entry.profileName;
    byConversation.set(item.conversationId, entry);
  }

  // The summary only moves forward: old history arriving late never
  // replaces a newer last message.
  await Promise.all(
    [...byConversation].map(([id, e]) =>
      query(
        `insert into inbox_conversations
           (channel, id, profile_name, last_message_at, last_text, last_direction, last_incoming_at, unread)
         values ($1, $2, $3, $4, $5, $6, $7, $8)
         on conflict (channel, id) do update set
           profile_name = coalesce(excluded.profile_name, inbox_conversations.profile_name),
           last_text = case when inbox_conversations.last_message_at is null
             or excluded.last_message_at >= inbox_conversations.last_message_at
             then excluded.last_text else inbox_conversations.last_text end,
           last_direction = case when inbox_conversations.last_message_at is null
             or excluded.last_message_at >= inbox_conversations.last_message_at
             then excluded.last_direction else inbox_conversations.last_direction end,
           last_message_at = greatest(inbox_conversations.last_message_at, excluded.last_message_at),
           last_incoming_at = greatest(inbox_conversations.last_incoming_at, excluded.last_incoming_at),
           unread = inbox_conversations.unread + excluded.unread,
           updated_at = now()`,
        [channel, id, e.profileName, e.latest.timestamp, e.latest.text, e.latest.direction, e.lastIncomingAt, e.incoming]
      )
    )
  );
  return fresh;
}

// Delivery/read receipt for a message sent from the site. A receipt for a
// message this site never stored (sent from the phone) changes nothing.
export async function updateMessageStatus(channel, id, status, error) {
  await query(`update inbox_messages set status = $3, error = $4 where channel = $1 and id = $2`, [
    channel,
    id,
    status ?? null,
    error ?? null,
  ]);
}

const toConversation = (row) => ({
  id: row.id,
  profileName: row.profile_name || "",
  lastMessageAt: Number(row.last_message_at) || 0,
  lastText: row.last_text || "",
  lastDirection: row.last_direction || "",
  lastIncomingAt: Number(row.last_incoming_at) || 0,
  unread: row.unread || 0,
});

export async function listConversations(channel, limit = 300) {
  const rows = await query(
    `select * from inbox_conversations where channel = $1 order by last_message_at desc nulls last limit $2`,
    [channel, limit]
  );
  return rows.map(toConversation);
}

export async function getConversation(channel, id) {
  const rows = await query(`select * from inbox_conversations where channel = $1 and id = $2`, [channel, id]);
  return rows[0] ? toConversation(rows[0]) : null;
}

// The latest `limit` messages of one chat, oldest first.
export async function listMessages(channel, conversationId, limit = 300) {
  const rows = await query(
    `select * from (
       select * from inbox_messages where channel = $1 and conversation_id = $2
       order by timestamp desc limit $3
     ) latest order by timestamp asc`,
    [channel, conversationId, limit]
  );
  return rows.map((r) => ({
    id: r.id,
    direction: r.direction,
    source: r.source || "",
    type: r.type || "",
    text: r.text || "",
    timestamp: Number(r.timestamp) || 0,
    status: r.status || "",
    error: r.error || "",
  }));
}

// Writes a conversation summary as is (the one-time import from Firestore).
export async function putConversation(channel, c) {
  await query(
    `insert into inbox_conversations
       (channel, id, profile_name, last_message_at, last_text, last_direction, last_incoming_at, unread)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     on conflict (channel, id) do update set
       profile_name = coalesce(excluded.profile_name, inbox_conversations.profile_name),
       last_message_at = greatest(inbox_conversations.last_message_at, excluded.last_message_at),
       last_incoming_at = greatest(inbox_conversations.last_incoming_at, excluded.last_incoming_at),
       unread = greatest(inbox_conversations.unread, excluded.unread),
       updated_at = now()`,
    [
      channel,
      c.id,
      c.profileName || null,
      c.lastMessageAt || null,
      c.lastText || "",
      c.lastDirection || null,
      c.lastIncomingAt || null,
      c.unread || 0,
    ]
  );
}

export async function markRead(channel, id) {
  await query(`update inbox_conversations set unread = 0 where channel = $1 and id = $2 and unread > 0`, [channel, id]);
}

// Number of chats with unread messages, per channel (admin menu badges).
export async function unreadCounts() {
  const rows = await query(`select channel, count(*)::int as n from inbox_conversations where unread > 0 group by channel`);
  const counts = { whatsapp: 0, messenger: 0 };
  for (const r of rows) counts[r.channel] = r.n;
  return counts;
}

// ── WhatsApp contacts (names saved on the business phone) ────────────

export async function saveContacts(changes) {
  for (const { phone, name, remove } of changes) {
    if (remove) await query(`delete from inbox_contacts where phone = $1`, [phone]);
    else
      await query(
        `insert into inbox_contacts (phone, name) values ($1, $2)
         on conflict (phone) do update set name = excluded.name, updated_at = now()`,
        [phone, name || ""]
      );
  }
}

export async function listContacts() {
  const rows = await query(`select phone, name from inbox_contacts`);
  return Object.fromEntries(rows.map((r) => [r.phone, r.name]));
}

// ── Config (access tokens; never sent to the browser) ────────────────

export async function getConfig(key) {
  const rows = await query(`select value from inbox_config where key = $1`, [key]);
  return rows[0]?.value || null;
}

// Merges `patch` into the stored value (`replace` overwrites it instead).
export async function setConfig(key, patch, { replace = false } = {}) {
  await query(
    `insert into inbox_config (key, value) values ($1, $2::jsonb)
     on conflict (key) do update set
       value = case when $3 then excluded.value else inbox_config.value || excluded.value end,
       updated_at = now()`,
    [key, JSON.stringify(patch), replace]
  );
}
