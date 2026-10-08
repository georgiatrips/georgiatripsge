// WhatsApp Cloud API in coexistence mode: the business keeps using the
// WhatsApp Business app on the phone, and every chat is mirrored here.
//
// Meta sends four kinds of webhooks to /api/whatsapp/webhook:
//   messages             a customer wrote (plus delivery/read statuses)
//   smb_message_echoes   the team replied from the phone app
//   history              up to 180 days of old chats, once, after connecting
//   smb_app_state_sync   the phone's saved contacts (names)
// Everything lands in Firestore (whatsapp_conversations/{phone}/messages),
// which only admins can read and only this server can write.
//
// Vercel → Settings → Environment Variables:
//   WHATSAPP_APP_SECRET    Meta app → App settings → Basic → App secret
//   WHATSAPP_VERIFY_TOKEN  any random string, also typed into Meta's webhook form
//   FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY  (server Firestore)
// The access token is not an env variable: connecting from the admin panel
// stores it in whatsapp_config/main, which no browser can read.

import crypto from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "./adminAuth";
import { sendTelegram } from "./notifyBooking";
import { SITE_URL } from "../siteConfig";
import { GRAPH_API_VERSION, WHATSAPP_APP_ID, WHATSAPP_CONVERSATIONS } from "../whatsappConfig";

const GRAPH = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
const CONTACTS = "whatsapp_contacts";
const CONFIG_PATH = "whatsapp_config/main";
// Firestore allows 500 writes per batch and caps getAll; stay well below.
const CHUNK = 300;
const MEDIA_TYPES = new Set(["image", "video", "audio", "document", "sticker"]);

export const digits = (value) => String(value || "").replace(/\D/g, "");

const chunks = (list) => {
  const out = [];
  for (let i = 0; i < list.length; i += CHUNK) out.push(list.slice(i, i + CHUNK));
  return out;
};

// Firestore rejects undefined fields.
const clean = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

export class WhatsAppError extends Error {
  constructor(message, status = 500, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function requireDb() {
  const db = getAdminDb();
  if (!db) {
    throw new WhatsAppError(
      "სერვერის Firestore არ არის მორგებული (FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY).",
      503
    );
  }
  return db;
}

// ── Webhook authenticity ─────────────────────────────────────────────

// Meta signs every POST with the app secret; anything unsigned is rejected,
// so nobody can inject fake chats into the admin panel.
export function verifySignature(rawBody, header) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret || !header?.startsWith("sha256=")) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest();
  const given = Buffer.from(header.slice(7), "hex");
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

// ── Message shape ────────────────────────────────────────────────────

// One line of readable text for any message type (media is not downloaded).
export function messageText(msg) {
  const type = msg?.type;
  const body = msg?.[type] || {};
  switch (type) {
    case "text":
      return body.body || "";
    case "image":
      return ["📷 ფოტო", body.caption].filter(Boolean).join(" · ");
    case "video":
      return ["🎬 ვიდეო", body.caption].filter(Boolean).join(" · ");
    case "document":
      return ["📄", body.filename || "ფაილი", body.caption].filter(Boolean).join(" ");
    case "audio":
      return body.voice ? "🎤 ხმოვანი შეტყობინება" : "🎵 აუდიო";
    case "sticker":
      return "🙂 სტიკერი";
    case "location":
      return `📍 ${[body.name, body.address].filter(Boolean).join(", ") || `${body.latitude}, ${body.longitude}`}`;
    case "contacts":
      return `👤 ${(Array.isArray(msg.contacts) ? msg.contacts : []).map((c) => c?.name?.formatted_name).filter(Boolean).join(", ") || "კონტაქტი"}`;
    case "reaction":
      return `${body.emoji || "👍"} რეაქცია`;
    case "button":
      return body.text || "";
    case "interactive":
      return body.button_reply?.title || body.list_reply?.title || "";
    default:
      return `[${type || "უცნობი"}]`;
  }
}

function toRecord(msg, direction, source) {
  return clean({
    id: msg.id,
    direction,
    source,
    type: msg.type,
    text: messageText(msg),
    timestamp: Number(msg.timestamp) * 1000 || Date.now(),
    mediaId: MEDIA_TYPES.has(msg.type) ? msg[msg.type]?.id : undefined,
    replyTo: msg.context?.id,
  });
}

// ── Firestore writes ─────────────────────────────────────────────────

// Stores messages once each (Meta retries deliveries, so the same message can
// arrive twice) and keeps each conversation's summary up to date. Returns the
// messages that were new. `live` marks real-time customer messages, the only
// ones that count as unread.
async function saveMessages(db, items, { live = false } = {}) {
  const valid = items.filter((item) => item.phone && item.record?.id);
  if (!valid.length) return [];
  const convs = db.collection(WHATSAPP_CONVERSATIONS);
  const ref = ({ phone, record }) => convs.doc(phone).collection("messages").doc(record.id);

  const fresh = [];
  for (const part of chunks(valid)) {
    const snaps = await db.getAll(...part.map(ref));
    const batch = db.batch();
    part.forEach((item, i) => {
      if (snaps[i].exists) return;
      batch.set(ref(item), { ...item.record, createdAt: FieldValue.serverTimestamp() });
      fresh.push(item);
    });
    await batch.commit();
  }

  const byPhone = new Map();
  for (const item of fresh) {
    const entry = byPhone.get(item.phone) || { latest: null, lastIncomingAt: 0, incoming: 0, profileName: undefined };
    if (!entry.latest || item.record.timestamp >= entry.latest.timestamp) entry.latest = item.record;
    if (item.record.direction === "in") {
      entry.lastIncomingAt = Math.max(entry.lastIncomingAt, item.record.timestamp);
      if (live) entry.incoming += 1;
    }
    entry.profileName = item.profileName || entry.profileName;
    byPhone.set(item.phone, entry);
  }

  await Promise.all(
    [...byPhone].map(([phone, entry]) =>
      db.runTransaction(async (tx) => {
        const convRef = convs.doc(phone);
        const current = (await tx.get(convRef)).data() || {};
        const update = { phone, updatedAt: FieldValue.serverTimestamp() };
        if (entry.profileName) update.profileName = entry.profileName;
        if (!current.lastMessageAt || entry.latest.timestamp >= current.lastMessageAt) {
          update.lastMessageAt = entry.latest.timestamp;
          update.lastText = entry.latest.text;
          update.lastDirection = entry.latest.direction;
        }
        if (entry.lastIncomingAt > (current.lastIncomingAt || 0)) update.lastIncomingAt = entry.lastIncomingAt;
        if (entry.incoming) update.unread = (current.unread || 0) + entry.incoming;
        tx.set(convRef, update, { merge: true });
      })
    )
  );
  return fresh;
}

// Delivery/read receipts for messages sent from the site.
async function applyStatuses(db, statuses = []) {
  await Promise.all(
    statuses.map((s) =>
      db
        .collection(WHATSAPP_CONVERSATIONS)
        .doc(digits(s.recipient_id))
        .collection("messages")
        .doc(s.id)
        .update(clean({ status: s.status, error: s.errors?.[0]?.title }))
        // A receipt for a message this site never stored (sent from the phone).
        .catch(() => {})
    )
  );
}

async function saveHistory(db, history = []) {
  const config = db.doc(CONFIG_PATH);
  for (const part of history) {
    if (part.errors?.length) {
      console.warn("[whatsapp] history sync refused:", part.errors[0]?.message);
      await config.set({ historyError: part.errors[0]?.message || "declined" }, { merge: true });
      continue;
    }
    const items = [];
    for (const thread of part.threads || []) {
      const phone = digits(thread.id);
      for (const msg of thread.messages || []) {
        const direction = digits(msg.from) === phone ? "in" : "out";
        items.push({ phone, record: clean({ ...toRecord(msg, direction, "history"), status: msg.history_context?.status }) });
      }
    }
    await saveMessages(db, items);
    if (part.metadata) {
      await config.set(
        { historyProgress: clean({ phase: part.metadata.phase, progress: part.metadata.progress, at: Date.now() }) },
        { merge: true }
      );
    }
  }
}

// The phone's address book, so chats show the names saved on the phone.
async function saveContacts(db, stateSync = []) {
  const contacts = stateSync.filter((s) => s.type === "contact" && digits(s.contact?.phone_number));
  for (const part of chunks(contacts)) {
    const batch = db.batch();
    for (const s of part) {
      const ref = db.collection(CONTACTS).doc(digits(s.contact.phone_number));
      if (s.action === "remove") batch.delete(ref);
      else batch.set(ref, { name: s.contact.full_name || s.contact.first_name || "", updatedAt: FieldValue.serverTimestamp() });
    }
    await batch.commit();
  }
}

// Handles one webhook delivery; returns new customer messages to alert about.
export async function processWebhook(body) {
  const db = requireDb();
  const alerts = [];
  for (const entry of body?.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      switch (change.field) {
        case "messages": {
          const names = new Map((value.contacts || []).map((c) => [digits(c.wa_id), c.profile?.name]));
          const items = (value.messages || []).map((msg) => ({
            phone: digits(msg.from),
            profileName: names.get(digits(msg.from)),
            record: toRecord(msg, "in", "customer"),
          }));
          alerts.push(...(await saveMessages(db, items, { live: true })));
          await applyStatuses(db, value.statuses);
          break;
        }
        case "smb_message_echoes":
          await saveMessages(
            db,
            (value.message_echoes || []).map((msg) => ({ phone: digits(msg.to), record: toRecord(msg, "out", "phone") }))
          );
          break;
        case "history":
          await saveHistory(db, value.history);
          break;
        case "smb_app_state_sync":
          await saveContacts(db, value.state_sync);
          break;
        default:
          console.log("[whatsapp] unhandled webhook field:", change.field);
      }
    }
  }
  return alerts;
}

export async function alertNewMessages(alerts) {
  if (!alerts.length) return;
  const lines = alerts.map(({ phone, profileName, record }) => `${profileName || `+${phone}`} (+${phone}):\n${record.text}`);
  const phones = [...new Set(alerts.map((a) => a.phone))];
  await sendTelegram(
    `💬 WhatsApp\n\n${lines.join("\n\n")}\n\n` +
      phones.map((p) => `https://wa.me/${p}`).join("\n") +
      `\nადმინი: ${SITE_URL}/admin`,
    "whatsapp"
  );
}

// ── Graph API ────────────────────────────────────────────────────────

async function graph(path, { token, method = "GET", body } = {}) {
  const res = await fetch(`${GRAPH}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new WhatsAppError(data.error?.error_user_msg || data.error?.message || `Meta API ${res.status}`, 502, data.error?.code);
  }
  return data;
}

async function exchangeCode(code) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) throw new WhatsAppError("WHATSAPP_APP_SECRET არ არის მითითებული Vercel-ში.", 503);
  const params = new URLSearchParams({ client_id: WHATSAPP_APP_ID, client_secret: secret, code });
  const res = await fetch(`${GRAPH}/oauth/access_token?${params}`, { signal: AbortSignal.timeout(15000) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new WhatsAppError(data.error?.message || "Meta-მ კოდი არ მიიღო. სცადეთ თავიდან.", 502);
  }
  return { token: data.access_token, expiresIn: Number(data.expires_in) || 0 };
}

// Finishes Embedded Signup: swaps the one-time code for a business token,
// subscribes this app to the account's webhooks and asks Meta to send the
// phone's contacts and chat history. History can only be requested within
// 24 hours of connecting, so this runs right away.
export async function connectWhatsApp({ code, wabaId, phoneNumberId }) {
  if (!code || !wabaId) throw new WhatsAppError("Meta-მ მიერთების მონაცემები არ დააბრუნა.", 400);
  const db = requireDb();
  const { token, expiresIn } = await exchangeCode(code);

  const numbers = await graph(`/${wabaId}/phone_numbers?fields=id,display_phone_number,verified_name`, { token });
  const number = (numbers.data || []).find((n) => !phoneNumberId || n.id === phoneNumberId) || numbers.data?.[0];
  if (!number) throw new WhatsAppError("ამ ანგარიშზე ტელეფონის ნომერი ვერ მოიძებნა.", 404);

  await graph(`/${wabaId}/subscribed_apps`, { token, method: "POST" });

  const config = db.doc(CONFIG_PATH);
  await config.set(
    {
      token,
      wabaId,
      phoneNumberId: number.id,
      displayPhone: number.display_phone_number || "",
      verifiedName: number.verified_name || "",
      connectedAt: Date.now(),
      // The signup configuration issues 60-day tokens; the admin tab warns before expiry.
      tokenExpiresAt: expiresIn ? Date.now() + expiresIn * 1000 : null,
    },
    { merge: true }
  );

  // Contacts first, then history: the order Meta documents.
  const sync = {};
  for (const syncType of ["smb_app_state_sync", "history"]) {
    try {
      await graph(`/${number.id}/smb_app_data`, {
        token,
        method: "POST",
        body: { messaging_product: "whatsapp", sync_type: syncType },
      });
      sync[syncType] = "requested";
    } catch (err) {
      sync[syncType] = err.message;
    }
  }
  await config.set({ sync, syncRequestedAt: Date.now() }, { merge: true });

  return { displayPhone: number.display_phone_number, verifiedName: number.verified_name, sync };
}

// What the admin panel may know about the connection (never the token).
export async function getConnectionStatus() {
  const db = getAdminDb();
  const env = {
    appSecret: Boolean(process.env.WHATSAPP_APP_SECRET),
    verifyToken: Boolean(process.env.WHATSAPP_VERIFY_TOKEN),
    serverFirestore: Boolean(db),
  };
  if (!db) return { connected: false, env };
  const cfg = (await db.doc(CONFIG_PATH).get()).data() || {};
  return {
    connected: Boolean(cfg.token && cfg.phoneNumberId),
    env,
    displayPhone: cfg.displayPhone || "",
    verifiedName: cfg.verifiedName || "",
    connectedAt: cfg.connectedAt || null,
    tokenExpiresAt: cfg.tokenExpiresAt || null,
    sync: cfg.sync || null,
    historyProgress: cfg.historyProgress || null,
    historyError: cfg.historyError || "",
  };
}

const OUTSIDE_WINDOW_CODES = new Set([131047, 131026]);

export async function sendText({ to, text }) {
  const phone = digits(to);
  const body = String(text || "").trim();
  if (!phone || !body) throw new WhatsAppError("ნომერი ან ტექსტი ცარიელია.", 400);
  if (body.length > 4096) throw new WhatsAppError("ტექსტი ძალიან გრძელია (მაქს. 4096 სიმბოლო).", 400);

  const db = requireDb();
  const cfg = (await db.doc(CONFIG_PATH).get()).data() || {};
  if (!cfg.token || !cfg.phoneNumberId) throw new WhatsAppError("WhatsApp ჯერ არ არის მიერთებული.", 409);

  let data;
  try {
    data = await graph(`/${cfg.phoneNumberId}/messages`, {
      token: cfg.token,
      method: "POST",
      body: { messaging_product: "whatsapp", recipient_type: "individual", to: phone, type: "text", text: { preview_url: false, body } },
    });
  } catch (err) {
    if (OUTSIDE_WINDOW_CODES.has(err.code)) {
      throw new WhatsAppError("კლიენტის ბოლო შეტყობინებიდან 24 საათზე მეტი გავიდა — უპასუხეთ ტელეფონის WhatsApp-იდან.", 409, err.code);
    }
    throw err;
  }

  const record = { id: data.messages?.[0]?.id, direction: "out", source: "site", type: "text", text: body, timestamp: Date.now(), status: "sent" };
  if (record.id) await saveMessages(db, [{ phone, record }]);
  return record;
}
