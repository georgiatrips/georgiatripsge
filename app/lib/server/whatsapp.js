// WhatsApp Cloud API in coexistence mode: the business keeps using the
// WhatsApp Business app on the phone, and every chat is mirrored here.
//
// Meta sends four kinds of webhooks to /api/whatsapp/webhook:
//   messages             a customer wrote (plus delivery/read statuses)
//   smb_message_echoes   the team replied from the phone app
//   history              up to 180 days of old chats, once, after connecting
//   smb_app_state_sync   the phone's saved contacts (names)
// Everything lands in the Neon inbox tables (inboxStore.js), which only the
// admin API reads.
//
// Vercel → Settings → Environment Variables:
//   WHATSAPP_APP_SECRET    Meta app → App settings → Basic → App secret
//   WHATSAPP_VERIFY_TOKEN  any random string, also typed into Meta's webhook form
//   DATABASE_URL           Neon (Vercel → Storage)
// The access token is not an env variable: connecting from the admin panel
// stores it in the inbox config, which no browser can read.

import crypto from "node:crypto";
import { getAdminDb } from "./adminAuth";
import { sendTelegram } from "./notifyBooking";
import { SITE_URL } from "../siteConfig";
import { GRAPH_API_VERSION, WHATSAPP_APP_ID } from "../whatsappConfig";
import {
  getConfig,
  saveContacts as storeContacts,
  saveMessages as storeMessages,
  setConfig,
  updateMessageStatus,
} from "./inboxStore";

const GRAPH = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
const CHANNEL = "whatsapp";
const CONFIG_KEY = "whatsapp";
// Where the config lived before the inbox moved to Neon.
const FIRESTORE_CONFIG_PATH = "whatsapp_config/main";
const MEDIA_TYPES = new Set(["image", "video", "audio", "document", "sticker"]);

export const digits = (value) => String(value || "").replace(/\D/g, "");

const clean = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

export class WhatsAppError extends Error {
  constructor(message, status = 500, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// The stored config, copied over from Firestore the first time it is needed.
export async function loadConfig(key = CONFIG_KEY, firestorePath = FIRESTORE_CONFIG_PATH) {
  const cfg = await getConfig(key);
  if (cfg) return cfg;
  const firestore = getAdminDb();
  if (!firestore) return {};
  try {
    const old = (await firestore.doc(firestorePath).get()).data();
    if (old) {
      await setConfig(key, old, { replace: true });
      return old;
    }
  } catch (err) {
    console.warn(`[inbox] could not copy ${firestorePath} from Firestore:`, err?.message);
  }
  return {};
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

// ── Storage ──────────────────────────────────────────────────────────

// Items are { phone, profileName?, record }; stored once each, returns the new
// ones. `live` marks real-time customer messages, the only ones counted unread.
const saveMessages = (items, options) =>
  storeMessages(
    CHANNEL,
    items.filter((item) => item.phone).map((item) => ({ ...item, conversationId: item.phone })),
    options
  );

// Delivery/read receipts for messages sent from the site.
async function applyStatuses(statuses = []) {
  await Promise.all(statuses.map((s) => updateMessageStatus(CHANNEL, s.id, s.status, s.errors?.[0]?.title)));
}

async function saveHistory(history = []) {
  for (const part of history) {
    if (part.errors?.length) {
      console.warn("[whatsapp] history sync refused:", part.errors[0]?.message);
      await setConfig(CONFIG_KEY, { historyError: part.errors[0]?.message || "declined" });
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
    await saveMessages(items);
    if (part.metadata) {
      await setConfig(CONFIG_KEY, {
        historyProgress: clean({ phase: part.metadata.phase, progress: part.metadata.progress, at: Date.now() }),
      });
    }
  }
}

// The phone's address book, so chats show the names saved on the phone.
async function saveContacts(stateSync = []) {
  await storeContacts(
    stateSync
      .filter((s) => s.type === "contact" && digits(s.contact?.phone_number))
      .map((s) => ({
        phone: digits(s.contact.phone_number),
        name: s.contact.full_name || s.contact.first_name || "",
        remove: s.action === "remove",
      }))
  );
}

// Handles one webhook delivery; returns new customer messages to alert about.
export async function processWebhook(body) {
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
          alerts.push(...(await saveMessages(items, { live: true })));
          await applyStatuses(value.statuses);
          break;
        }
        case "smb_message_echoes":
          await saveMessages(
            (value.message_echoes || []).map((msg) => ({ phone: digits(msg.to), record: toRecord(msg, "out", "phone") }))
          );
          break;
        case "history":
          await saveHistory(value.history);
          break;
        case "smb_app_state_sync":
          await saveContacts(value.state_sync);
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

export async function graph(path, { token, method = "GET", body } = {}) {
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

async function exchangeCode(code, redirectUri) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) throw new WhatsAppError("WHATSAPP_APP_SECRET არ არის მითითებული Vercel-ში.", 503);
  const params = new URLSearchParams({ client_id: WHATSAPP_APP_ID, client_secret: secret, code });
  // The full-page signup must repeat its redirect_uri; the popup flow has none.
  if (redirectUri) params.set("redirect_uri", redirectUri);
  const res = await fetch(`${GRAPH}/oauth/access_token?${params}`, { signal: AbortSignal.timeout(15000) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new WhatsAppError(data.error?.message || "Meta-მ კოდი არ მიიღო. სცადეთ თავიდან.", 502);
  }
  return { token: data.access_token, expiresIn: Number(data.expires_in) || 0 };
}

async function grantedWabaId(token, previousWabaId) {
  const appToken = `${WHATSAPP_APP_ID}|${process.env.WHATSAPP_APP_SECRET}`;
  const info = await graph(`/debug_token?input_token=${encodeURIComponent(token)}`, { token: appToken });
  const scope = (info.data?.granular_scopes || []).find((s) => s.scope === "whatsapp_business_management");
  const ids = scope?.target_ids || [];
  // A reconnect means a different account: prefer one we are not on yet.
  const id = ids.filter((x) => x !== previousWabaId).pop() || ids.pop();
  if (!id) throw new WhatsAppError("Meta-მ WhatsApp ანგარიში არ დააბრუნა.", 400);
  return id;
}

// Finishes Embedded Signup: swaps the one-time code for a business token,
// subscribes this app to the account's webhooks and asks Meta to send the
// phone's contacts and chat history. History can only be requested within
// 24 hours of connecting, so this runs right away.
export async function connectWhatsApp({ code, wabaId, phoneNumberId, redirectUri }) {
  if (!code) throw new WhatsAppError("Meta-მ მიერთების მონაცემები არ დააბრუნა.", 400);
  const { token, expiresIn } = await exchangeCode(code, redirectUri);
  // The full-page signup has no session message: read the account the
  // token was granted for.
  if (!wabaId) wabaId = await grantedWabaId(token, (await loadConfig()).wabaId);
  return finishConnect({ token, expiresIn, wabaId, phoneNumberId });
}

// Our own number lives in the same business portfolio as this app, and
// Embedded Signup refuses to share an account with its own owner. So after
// the QR step that number is connected with a system-user token from
// Business settings instead (it does not expire).
export async function connectWithToken({ token, wabaId, phoneNumberId }) {
  token = String(token || "").trim();
  if (!token || !digits(wabaId)) throw new WhatsAppError("ტოკენი ან WABA ID ცარიელია.", 400);
  return finishConnect({ token, expiresIn: 0, wabaId: digits(wabaId), phoneNumberId: digits(phoneNumberId) });
}

async function finishConnect({ token, expiresIn, wabaId, phoneNumberId }) {
  const numbers = await graph(`/${wabaId}/phone_numbers?fields=id,display_phone_number,verified_name`, { token });
  const number = (numbers.data || []).find((n) => !phoneNumberId || n.id === phoneNumberId) || numbers.data?.[0];
  if (!number) throw new WhatsAppError("ამ ანგარიშზე ტელეფონის ნომერი ვერ მოიძებნა.", 404);

  await graph(`/${wabaId}/subscribed_apps`, { token, method: "POST" });

  await setConfig(CONFIG_KEY, {
      token,
      wabaId,
      phoneNumberId: number.id,
      displayPhone: number.display_phone_number || "",
      verifiedName: number.verified_name || "",
      connectedAt: Date.now(),
      // The signup configuration issues 60-day tokens; the admin tab warns before expiry.
      tokenExpiresAt: expiresIn ? Date.now() + expiresIn * 1000 : null,
      // A reconnect (e.g. another number) starts a fresh history sync.
      historyProgress: null,
      historyError: "",
  });

  const sync = await requestSync(token, number.id);
  return { displayPhone: number.display_phone_number, verifiedName: number.verified_name, sync };
}

// Asks Meta for the phone's contacts and chat history (contacts first, the
// order Meta documents). Allowed only within 24 hours of onboarding.
async function requestSync(token, phoneNumberId) {
  const sync = {};
  for (const syncType of ["smb_app_state_sync", "history"]) {
    try {
      await graph(`/${phoneNumberId}/smb_app_data`, {
        token,
        method: "POST",
        body: { messaging_product: "whatsapp", sync_type: syncType },
      });
      sync[syncType] = "requested";
    } catch (err) {
      sync[syncType] = err.message;
    }
  }
  await setConfig(CONFIG_KEY, { sync, syncRequestedAt: Date.now() });
  return sync;
}

// Retry from the admin panel, e.g. when the first request came before Meta
// had finished onboarding the number.
export async function retrySync() {
  const cfg = await loadConfig();
  if (!cfg.token || !cfg.phoneNumberId) throw new WhatsAppError("WhatsApp ჯერ არ არის მიერთებული.", 409);
  return { sync: await requestSync(cfg.token, cfg.phoneNumberId) };
}

// What the admin panel may know about the connection (never the token).
export async function getConnectionStatus() {
  const env = {
    appSecret: Boolean(process.env.WHATSAPP_APP_SECRET),
    verifyToken: Boolean(process.env.WHATSAPP_VERIFY_TOKEN),
    database: Boolean(process.env.DATABASE_URL),
  };
  if (!env.database) return { connected: false, env };
  const cfg = await loadConfig();
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

  const cfg = await loadConfig();
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
  if (record.id) await saveMessages([{ phone, record }]);
  return record;
}
