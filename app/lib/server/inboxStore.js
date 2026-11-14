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

export const CHANNELS = new Set(["whatsapp", "messenger", "instagram"]);

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
  // Messenger photos and stickers come with a public CDN link.
  `alter table inbox_messages add column if not exists media_url text`,
  // The inbox assistant (inboxAi.js): switched off for one chat, its
  // suggested reply, and the customer message it last answered.
  `alter table inbox_conversations add column if not exists ai_off boolean not null default false`,
  `alter table inbox_conversations add column if not exists ai_draft text`,
  `alter table inbox_conversations add column if not exists ai_draft_at bigint`,
  `alter table inbox_conversations add column if not exists ai_handled_at bigint`,
  // When the assistant last forwarded this chat as a ready tour request.
  `alter table inbox_conversations add column if not exists request_forwarded_at bigint`,
  `alter table inbox_conversations add column if not exists request_summary text`,
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
  // E-mails read from Gmail with the assistant's Georgian summary
  // (mailReader.js). importance: 3 high, 2 medium, 1 low.
  `create table if not exists mail_digest (
    id text primary key,
    thread_id text,
    received_at bigint not null,
    from_name text,
    from_email text,
    subject text,
    importance integer not null default 1,
    data jsonb not null default '{}'::jsonb,
    done boolean not null default false,
    created_at timestamptz not null default now()
  )`,
  `create index if not exists mail_digest_recent on mail_digest (received_at desc)`,
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
  // One round trip for the whole schema: each cold function instance pays
  // for it before its first query, and the admin inbox waits on that.
  schemaReady ||= client.transaction(SCHEMA.map((statement) => client.query(statement))).catch((err) => {
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
             (channel, conversation_id, id, direction, source, type, text, timestamp, media_id, reply_to, status, error, media_url)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
            r.mediaUrl ?? null,
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
  channel: row.channel,
  id: row.id,
  profileName: row.profile_name || "",
  lastMessageAt: Number(row.last_message_at) || 0,
  lastText: row.last_text || "",
  lastDirection: row.last_direction || "",
  lastIncomingAt: Number(row.last_incoming_at) || 0,
  unread: row.unread || 0,
  aiOff: Boolean(row.ai_off),
  aiDraft: row.ai_draft || "",
  aiDraftAt: Number(row.ai_draft_at) || 0,
  requestForwardedAt: Number(row.request_forwarded_at) || 0,
  requestSummary: row.request_summary || "",
});

// Latest chats of one channel, or of all channels when `channel` is empty.
export async function listConversations(channel, limit = 300) {
  const rows = channel
    ? await query(
        `select * from inbox_conversations where channel = $1 order by last_message_at desc nulls last limit $2`,
        [channel, limit]
      )
    : await query(`select * from inbox_conversations order by last_message_at desc nulls last limit $1`, [limit]);
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
    mediaId: r.media_id || "",
    mediaUrl: r.media_url || "",
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

export async function setProfileName(channel, id, name) {
  await query(`update inbox_conversations set profile_name = $3 where channel = $1 and id = $2`, [channel, id, name]);
}

export async function markRead(channel, id) {
  await query(`update inbox_conversations set unread = 0 where channel = $1 and id = $2 and unread > 0`, [channel, id]);
}

// ── Inbox assistant ──────────────────────────────────────────────────

// Claims the reply to the customer message sent at `at`: true for exactly
// one caller, so two webhook deliveries never answer the same message twice.
export async function claimAiTurn(channel, id, at) {
  const rows = await query(
    `update inbox_conversations set ai_handled_at = $3
     where channel = $1 and id = $2 and (ai_handled_at is null or ai_handled_at < $3)
     returning id`,
    [channel, id, at]
  );
  return rows.length > 0;
}

export async function setAiDraft(channel, id, text) {
  await query(`update inbox_conversations set ai_draft = $3, ai_draft_at = $4 where channel = $1 and id = $2`, [
    channel,
    id,
    text || null,
    text ? Date.now() : null,
  ]);
}

// When a ready tour request went to the manager, and what it said.
export async function markRequestForwarded(channel, id, summary = "") {
  await query(
    `update inbox_conversations set request_forwarded_at = $3, request_summary = $4 where channel = $1 and id = $2`,
    [channel, id, Date.now(), summary]
  );
}

export async function setAiOff(channel, id, off) {
  await query(`update inbox_conversations set ai_off = $3 where channel = $1 and id = $2`, [channel, id, Boolean(off)]);
}

// The team's own replies (not the assistant's) with the customer messages
// they answered: up to 3 customer messages from the day before each reply.
// The assistant learns the team's answers from these (inboxAi.js).
export async function listTeamReplies(limit = 400) {
  const rows = await query(
    `select o.channel, o.conversation_id, o.text as reply, o.timestamp,
       (select string_agg(q.text, E'\\n' order by q.timestamp)
          from (select i.text, i.timestamp from inbox_messages i
                where i.channel = o.channel and i.conversation_id = o.conversation_id
                  and i.direction = 'in' and i.timestamp < o.timestamp and i.timestamp > o.timestamp - 86400000
                order by i.timestamp desc limit 3) q) as question
     from inbox_messages o
     where o.direction = 'out' and coalesce(o.source, '') <> 'ai' and coalesce(o.text, '') <> ''
     order by o.timestamp desc
     limit $1`,
    [limit]
  );
  return rows
    .filter((r) => r.question)
    .map((r) => ({
      channel: r.channel,
      conversationId: r.conversation_id,
      question: r.question,
      reply: r.reply,
      timestamp: Number(r.timestamp) || 0,
    }));
}

// ── The assistant's reading queue (inboxAi.js learnPending) ──────────
// Every reply the team wrote itself is read once, oldest first; "ai".learnedUpTo
// is the timestamp of the last one read.

const TEAM_TEXT = `direction = 'out' and coalesce(source, '') <> 'ai' and coalesce(text, '') <> ''`;

export async function listTeamMessagesAfter(after, limit = 15) {
  const rows = await query(
    `select channel, conversation_id, timestamp from inbox_messages
     where ${TEAM_TEXT} and timestamp > $1 order by timestamp asc limit $2`,
    [after, limit]
  );
  return rows.map((r) => ({ channel: r.channel, conversationId: r.conversation_id, timestamp: Number(r.timestamp) || 0 }));
}

export async function countTeamMessagesAfter(after) {
  const rows = await query(`select count(*)::int as n from inbox_messages where ${TEAM_TEXT} and timestamp > $1`, [after]);
  return rows[0]?.n || 0;
}

// Timestamp of the team's n-th newest reply (0 when there are fewer).
export async function teamMessageTimeFromEnd(n) {
  const rows = await query(
    `select timestamp from inbox_messages where ${TEAM_TEXT} order by timestamp desc offset $1 limit 1`,
    [Math.max(0, n - 1)]
  );
  return Number(rows[0]?.timestamp) || 0;
}

// The latest `limit` messages of one chat sent between two moments, oldest first.
export async function listMessagesBetween(channel, conversationId, from, to, limit = 12) {
  const rows = await query(
    `select direction, source, text, timestamp from (
       select * from inbox_messages
       where channel = $1 and conversation_id = $2 and timestamp >= $3 and timestamp <= $4
       order by timestamp desc limit $5
     ) latest order by timestamp asc`,
    [channel, conversationId, from, to, limit]
  );
  return rows.map((r) => ({ direction: r.direction, source: r.source || "", text: r.text || "", timestamp: Number(r.timestamp) || 0 }));
}

// True for one caller at a time: a lock that frees itself after `ms`.
export async function claimLock(key, ms) {
  const now = Date.now();
  const rows = await query(
    `insert into inbox_config (key, value) values ($1, $2::jsonb)
     on conflict (key) do update set value = excluded.value, updated_at = now()
     where coalesce((inbox_config.value->>'at')::bigint, 0) < $3
     returning key`,
    [key, JSON.stringify({ at: now }), now - ms]
  );
  return rows.length > 0;
}

export async function releaseLock(key) {
  await query(`update inbox_config set value = '{"at":0}'::jsonb where key = $1`, [key]);
}

// Number of chats with unread messages, per channel (admin menu badges).
export async function unreadCounts() {
  const rows = await query(`select channel, count(*)::int as n from inbox_conversations where unread > 0 group by channel`);
  const counts = { whatsapp: 0, messenger: 0, instagram: 0 };
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

// ── E-mail digest (mailReader.js) ────────────────────────────────────

// Which of these Gmail message ids are already summarized.
export async function knownMailIds(ids) {
  if (!ids.length) return new Set();
  const rows = await query(`select id from mail_digest where id = any($1::text[])`, [ids]);
  return new Set(rows.map((r) => r.id));
}

export async function saveMailDigest(m) {
  await query(
    `insert into mail_digest (id, thread_id, received_at, from_name, from_email, subject, importance, data)
     values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
     on conflict (id) do nothing`,
    [m.id, m.threadId || "", m.receivedAt, m.fromName || "", m.fromEmail || "", m.subject || "", m.importance, JSON.stringify(m.data || {})]
  );
}

// Unhandled first, then the most important, then the newest.
export async function listMailDigests({ sinceMs = 0, limit = 150 } = {}) {
  const rows = await query(
    `select * from mail_digest where received_at >= $1
     order by done asc, importance desc, received_at desc limit $2`,
    [sinceMs, limit]
  );
  return rows.map((r) => ({
    id: r.id,
    threadId: r.thread_id || "",
    receivedAt: Number(r.received_at) || 0,
    fromName: r.from_name || "",
    fromEmail: r.from_email || "",
    subject: r.subject || "",
    importance: r.importance,
    done: r.done,
    ...r.data,
  }));
}

export async function setMailDone(id, done) {
  await query(`update mail_digest set done = $2 where id = $1`, [id, Boolean(done)]);
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
