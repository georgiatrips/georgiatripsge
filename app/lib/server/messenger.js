// Facebook Page inbox (Messenger Platform): messages people send to the
// georgiatrips Page are mirrored here, and replies can be sent from the
// admin panel. Same Meta app as WhatsApp ("GeorgiaTrips Inbox"), so the
// webhook signature uses the same WHATSAPP_APP_SECRET.
//
// Meta sends Page webhooks to /api/messenger/webhook:
//   messages        a person wrote to the Page
//   message_echoes  the Page replied (from here, Business Suite or the app)
// Everything lands in Firestore (messenger_conversations/{psid}/messages),
// which only admins can read and only this server can write. The Page
// token lives in messenger_config/main, which no browser can read.

import { FieldValue } from "firebase-admin/firestore";
import { sendTelegram } from "./notifyBooking";
import { SITE_URL } from "../siteConfig";
import { MESSENGER_CONVERSATIONS, WHATSAPP_APP_ID } from "../whatsappConfig";
import { WhatsAppError, graph, requireDb } from "./whatsapp";

const CONFIG_PATH = "messenger_config/main";

// Firestore rejects undefined fields.
const clean = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

const ATTACHMENT_LABELS = {
  image: "📷 ფოტო",
  video: "🎬 ვიდეო",
  audio: "🎤 აუდიო",
  file: "📄 ფაილი",
  location: "📍 ლოკაცია",
  fallback: "🔗 ბმული",
};

// One line of readable text for any message (attachments are not downloaded).
function messageText(message = {}) {
  const parts = [];
  if (message.sticker_id) parts.push("🙂 სტიკერი");
  else for (const a of message.attachments || []) parts.push(ATTACHMENT_LABELS[a.type] || `[${a.type}]`);
  if (message.text) parts.push(message.text);
  return parts.join(" · ") || "[შეტყობინება]";
}

async function pageConfig(db) {
  return (await db.doc(CONFIG_PATH).get()).data() || {};
}

// Name of the person behind a page-scoped ID; Meta may refuse it, which is fine.
async function profileName(psid, pageToken) {
  try {
    const p = await graph(`/${psid}?fields=name,first_name,last_name`, { token: pageToken });
    return p.name || [p.first_name, p.last_name].filter(Boolean).join(" ") || undefined;
  } catch {
    return undefined;
  }
}

// ── Webhook ──────────────────────────────────────────────────────────

// Handles one webhook delivery; returns new customer messages to alert about.
export async function processWebhook(body) {
  if (body?.object !== "page") return [];
  const db = requireDb();
  const convs = db.collection(MESSENGER_CONVERSATIONS);
  let cfg = null;
  const alerts = [];

  for (const entry of body.entry || []) {
    for (const event of entry.messaging || []) {
      const message = event.message;
      if (!message?.mid) continue;
      const echo = Boolean(message.is_echo);
      const psid = String(echo ? event.recipient?.id : event.sender?.id || "");
      if (!psid) continue;

      // Meta retries deliveries; store each message once.
      const msgRef = convs.doc(psid).collection("messages").doc(message.mid);
      if ((await msgRef.get()).exists) continue;
      const record = clean({
        id: message.mid,
        direction: echo ? "out" : "in",
        // Echoes of replies sent by this app are "site"; Business Suite / the app are "page".
        source: echo ? (String(message.app_id) === WHATSAPP_APP_ID ? "site" : "page") : "customer",
        text: messageText(message),
        timestamp: Number(event.timestamp) || Date.now(),
        status: echo ? "sent" : undefined,
      });
      await msgRef.set({ ...record, createdAt: FieldValue.serverTimestamp() });

      const convRef = convs.doc(psid);
      const current = (await convRef.get()).data() || {};
      let name = current.profileName;
      if (!name && !echo) {
        cfg ||= await pageConfig(db);
        if (cfg.pageToken) name = await profileName(psid, cfg.pageToken);
      }
      await db.runTransaction(async (tx) => {
        const now = (await tx.get(convRef)).data() || {};
        const update = { psid, updatedAt: FieldValue.serverTimestamp() };
        if (name) update.profileName = name;
        if (!now.lastMessageAt || record.timestamp >= now.lastMessageAt) {
          update.lastMessageAt = record.timestamp;
          update.lastText = record.text;
          update.lastDirection = record.direction;
        }
        if (!echo) {
          update.lastIncomingAt = Math.max(now.lastIncomingAt || 0, record.timestamp);
          update.unread = (now.unread || 0) + 1;
        }
        tx.set(convRef, update, { merge: true });
      });
      if (!echo) alerts.push({ psid, name, record });
    }
  }
  return alerts;
}

export async function alertNewMessages(alerts) {
  if (!alerts.length) return;
  const lines = alerts.map(({ name, record }) => `${name || "Facebook მომხმარებელი"}:\n${record.text}`);
  await sendTelegram(`💬 Facebook Messenger\n\n${lines.join("\n\n")}\n\nადმინი: ${SITE_URL}/admin`, "messenger");
}

// ── Admin actions ────────────────────────────────────────────────────

// Connects the Page with a system-user token (Business settings → System
// users, with the Page assigned): reads the Page's own token, which does not
// expire either, and subscribes this app to the Page's messages.
export async function connectPage({ token, pageId }) {
  token = String(token || "").trim();
  if (!token) throw new WhatsAppError("ტოკენი ცარიელია.", 400);
  const db = requireDb();
  const pages = (await graph(`/me/accounts?fields=id,name,access_token&limit=50`, { token })).data || [];
  const page = pages.find((p) => !pageId || p.id === String(pageId).trim()) || null;
  if (!page?.access_token) {
    throw new WhatsAppError("ამ ტოკენზე Facebook Page ვერ მოიძებნა — System user-ს Page მიანიჭეთ (Assign assets).", 404);
  }
  await graph(`/${page.id}/subscribed_apps?subscribed_fields=messages,message_echoes`, {
    token: page.access_token,
    method: "POST",
  });
  await db.doc(CONFIG_PATH).set({ pageId: page.id, pageName: page.name, pageToken: page.access_token, connectedAt: Date.now() });
  return { pageId: page.id, pageName: page.name };
}

// What the admin panel may know about the connection (never the token).
export async function getConnectionStatus() {
  const db = requireDb();
  const cfg = await pageConfig(db);
  return { connected: Boolean(cfg.pageToken && cfg.pageId), pageId: cfg.pageId || "", pageName: cfg.pageName || "", connectedAt: cfg.connectedAt || null };
}

export async function sendText({ to, text }) {
  const psid = String(to || "").replace(/\D/g, "");
  const body = String(text || "").trim();
  if (!psid || !body) throw new WhatsAppError("მიმღები ან ტექსტი ცარიელია.", 400);
  if (body.length > 2000) throw new WhatsAppError("ტექსტი ძალიან გრძელია (მაქს. 2000 სიმბოლო).", 400);

  const db = requireDb();
  const cfg = await pageConfig(db);
  if (!cfg.pageToken) throw new WhatsAppError("Facebook Page ჯერ არ არის მიერთებული.", 409);

  let data;
  try {
    data = await graph(`/${cfg.pageId}/messages`, {
      token: cfg.pageToken,
      method: "POST",
      body: { recipient: { id: psid }, messaging_type: "RESPONSE", message: { text: body } },
    });
  } catch (err) {
    // Code 10 / subcode 2018278: outside the 24-hour messaging window.
    if (err.code === 10 || /outside of allowed window/i.test(err.message)) {
      throw new WhatsAppError("კლიენტის ბოლო შეტყობინებიდან 24 საათზე მეტი გავიდა — უპასუხეთ Facebook-იდან ან Business Suite-იდან.", 409, err.code);
    }
    throw err;
  }

  const record = { id: data.message_id, direction: "out", source: "site", text: body, timestamp: Date.now(), status: "sent" };
  if (record.id) {
    const convRef = db.collection(MESSENGER_CONVERSATIONS).doc(psid);
    await convRef.collection("messages").doc(record.id).set({ ...record, createdAt: FieldValue.serverTimestamp() });
    await convRef.set({ lastMessageAt: record.timestamp, lastText: body, lastDirection: "out", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  }
  return record;
}
