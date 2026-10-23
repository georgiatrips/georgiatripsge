// Facebook Page and Instagram inbox (Messenger Platform): messages people
// send to the georgiatrips Page or its linked Instagram account are mirrored
// here, and replies can be sent from the admin panel. Same Meta app as
// WhatsApp ("GeorgiaTrips Inbox"), so the webhook signature uses the same
// WHATSAPP_APP_SECRET.
//
// Meta sends both to /api/messenger/webhook:
//   object "page"       Messenger chats    → channel "messenger"
//   object "instagram"  Instagram Direct   → channel "instagram"
// with fields messages (a person wrote) and message_echoes (the business
// replied, from here, Business Suite or the apps; Instagram sends echoes in
// "messages" with is_echo). Everything lands in the Neon inbox tables
// (inboxStore.js). The Page token lives in the inbox config, which no
// browser can read; Instagram uses the same Page token.

import { sendTelegram } from "./notifyBooking";
import { SITE_URL } from "../siteConfig";
import { WHATSAPP_APP_ID } from "../whatsappConfig";
import { WhatsAppError, graph, loadConfig } from "./whatsapp";
import { getConversation, saveMessages, setConfig } from "./inboxStore";

const CONFIG_KEY = "messenger";
// Where the config lived before the inbox moved to Neon.
const FIRESTORE_CONFIG_PATH = "messenger_config/main";
const CHANNEL_OF_OBJECT = { page: "messenger", instagram: "instagram" };
const CHANNEL_LABELS = { messenger: "Facebook Messenger", instagram: "Instagram" };
const MAX_TEXT = { messenger: 2000, instagram: 1000 };

const clean = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

const ATTACHMENT_LABELS = {
  image: "📷 ფოტო",
  video: "🎬 ვიდეო",
  audio: "🎤 აუდიო",
  file: "📄 ფაილი",
  location: "📍 ლოკაცია",
  fallback: "🔗 ბმული",
  share: "🔗 გაზიარება",
  story_mention: "📣 სთორიში მოგნიშნეს",
  ig_reel: "🎬 Reel",
  reel: "🎬 Reel",
};

// One line of readable text for any message (the chat list shows it too).
function messageText(message = {}) {
  const parts = [];
  if (message.sticker_id) parts.push("🙂 სტიკერი");
  else for (const a of message.attachments || []) parts.push(ATTACHMENT_LABELS[a.type] || `[${a.type}]`);
  if (message.text) parts.push(message.text);
  return parts.join(" · ") || "[შეტყობინება]";
}

// Stickers and photos arrive as image attachments with a CDN link.
function messageMedia(message = {}) {
  const image = (message.attachments || []).find((a) => a.type === "image" && a.payload?.url);
  return {
    type: message.sticker_id ? "sticker" : message.attachments?.[0]?.type || "text",
    mediaUrl: image?.payload?.url,
  };
}

const pageConfig = () => loadConfig(CONFIG_KEY, FIRESTORE_CONFIG_PATH);

// Name of the person behind a page- or Instagram-scoped ID.
async function profileName(channel, id, cfg) {
  try {
    if (channel === "instagram") {
      const p = await graph(`/${id}?fields=name,username`, { token: cfg.pageToken });
      return p.name || (p.username ? `@${p.username}` : undefined);
    }
    // Meta refuses /{psid} without the Business Asset User Profile Access
    // feature, but the Page's own conversation list names its participants.
    const res = await graph(`/${cfg.pageId}/conversations?platform=messenger&user_id=${id}&fields=participants`, {
      token: cfg.pageToken,
    });
    const people = res.data?.[0]?.participants?.data || [];
    return people.find((p) => p.id === id)?.name || undefined;
  } catch {
    return undefined;
  }
}

// ── Webhook ──────────────────────────────────────────────────────────

// Handles one webhook delivery; returns new customer messages to alert about.
export async function processWebhook(body) {
  const channel = CHANNEL_OF_OBJECT[body?.object];
  if (!channel) return [];
  let cfg = null;
  const alerts = [];

  for (const entry of body.entry || []) {
    for (const event of entry.messaging || []) {
      const message = event.message;
      if (!message?.mid || message.is_deleted) continue;
      const echo = Boolean(message.is_echo);
      const personId = String(echo ? event.recipient?.id : event.sender?.id || "");
      if (!personId) continue;

      const record = clean({
        id: message.mid,
        direction: echo ? "out" : "in",
        // Echoes of replies sent by this app are "site"; Business Suite / the apps are "page".
        source: echo ? (String(message.app_id) === WHATSAPP_APP_ID ? "site" : "page") : "customer",
        text: messageText(message),
        ...messageMedia(message),
        timestamp: Number(event.timestamp) || Date.now(),
        status: echo ? "sent" : undefined,
      });

      // The sender's name is looked up once per person.
      let name;
      if (!echo && !(await getConversation(channel, personId))?.profileName) {
        cfg ||= await pageConfig();
        if (cfg.pageToken) name = await profileName(channel, personId, cfg);
      }

      // Meta retries deliveries; saveMessages stores each message once.
      const fresh = await saveMessages(channel, [{ conversationId: personId, profileName: name, record }], { live: true });
      if (fresh.length && !echo) alerts.push({ channel, name, record });
    }
  }
  return alerts;
}

export async function alertNewMessages(alerts) {
  if (!alerts.length) return;
  const label = CHANNEL_LABELS[alerts[0].channel];
  const lines = alerts.map(({ name, record }) => `${name || "მომხმარებელი"}:\n${record.text}`);
  await sendTelegram(`💬 ${label}\n\n${lines.join("\n\n")}\n\nადმინი: ${SITE_URL}/admin`, alerts[0].channel);
}

// ── Admin actions ────────────────────────────────────────────────────

// The Instagram professional account linked to the Page, if any.
async function linkedInstagram(pageId, pageToken) {
  try {
    const res = await graph(`/${pageId}?fields=instagram_business_account{id,username}`, { token: pageToken });
    return res.instagram_business_account || null;
  } catch (err) {
    console.warn("[messenger] Instagram account lookup failed:", err.message);
    return null;
  }
}

// Connects the Page with a system-user token (Business settings → System
// users, with the Page assigned): reads the Page's own token, which does not
// expire either, and subscribes this app to the Page's messages. The
// Instagram account linked to the Page comes along with the same token.
export async function connectPage({ token, pageId }) {
  token = String(token || "").trim();
  if (!token) throw new WhatsAppError("ტოკენი ცარიელია.", 400);
  const pages = (await graph(`/me/accounts?fields=id,name,access_token&limit=50`, { token })).data || [];
  const page = pages.find((p) => !pageId || p.id === String(pageId).trim()) || null;
  if (!page?.access_token) {
    throw new WhatsAppError("ამ ტოკენზე Facebook Page ვერ მოიძებნა — System user-ს Page მიანიჭეთ (Assign assets).", 404);
  }
  await graph(`/${page.id}/subscribed_apps?subscribed_fields=messages,message_echoes`, {
    token: page.access_token,
    method: "POST",
  });
  const instagram = await linkedInstagram(page.id, page.access_token);
  await setConfig(
    CONFIG_KEY,
    {
      pageId: page.id,
      pageName: page.name,
      pageToken: page.access_token,
      igId: instagram?.id || "",
      igUsername: instagram?.username || "",
      connectedAt: Date.now(),
    },
    { replace: true }
  );
  return { pageId: page.id, pageName: page.name, igUsername: instagram?.username || "" };
}

// What the admin panel may know about the connection (never the token).
export async function getConnectionStatus(channel = "messenger") {
  const cfg = await pageConfig();
  if (channel === "instagram") {
    return { connected: Boolean(cfg.pageToken && cfg.igId), pageName: cfg.igUsername ? `@${cfg.igUsername}` : "", connectedAt: cfg.connectedAt || null };
  }
  return { connected: Boolean(cfg.pageToken && cfg.pageId), pageId: cfg.pageId || "", pageName: cfg.pageName || "", connectedAt: cfg.connectedAt || null };
}

export async function sendText({ to, text, channel = "messenger" }) {
  if (!MAX_TEXT[channel]) throw new WhatsAppError("unknown_channel", 400);
  const recipient = String(to || "").replace(/\D/g, "");
  const body = String(text || "").trim();
  if (!recipient || !body) throw new WhatsAppError("მიმღები ან ტექსტი ცარიელია.", 400);
  if (body.length > MAX_TEXT[channel]) {
    throw new WhatsAppError(`ტექსტი ძალიან გრძელია (მაქს. ${MAX_TEXT[channel]} სიმბოლო).`, 400);
  }

  const cfg = await pageConfig();
  if (!cfg.pageToken) throw new WhatsAppError("Facebook Page ჯერ არ არის მიერთებული.", 409);

  // Instagram Direct replies go through the linked Page as well.
  let data;
  try {
    data = await graph(`/${cfg.pageId}/messages`, {
      token: cfg.pageToken,
      method: "POST",
      body: { recipient: { id: recipient }, messaging_type: "RESPONSE", message: { text: body } },
    });
  } catch (err) {
    // Code 10 / subcode 2018278: outside the 24-hour messaging window.
    if (err.code === 10 || /outside of allowed window/i.test(err.message)) {
      throw new WhatsAppError("კლიენტის ბოლო შეტყობინებიდან 24 საათზე მეტი გავიდა — უპასუხეთ აპლიკაციიდან ან Business Suite-იდან.", 409, err.code);
    }
    throw err;
  }

  const record = { id: data.message_id, direction: "out", source: "site", text: body, timestamp: Date.now(), status: "sent" };
  if (record.id) await saveMessages(channel, [{ conversationId: recipient, record }]);
  return record;
}
