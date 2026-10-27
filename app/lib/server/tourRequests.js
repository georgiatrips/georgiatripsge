// Ready tour requests: when the inbox assistant (inboxAi.js) sees that a
// customer has given everything needed to plan a trip (what, when, how many,
// where from), the request goes straight to the manager on WhatsApp, and the
// owner gets a copy in Telegram. The manager gets only the trip details in
// Georgian, never the customer's name, number or own words: the team stays
// the customer's contact.
//
// WhatsApp lets the business write freely only to a number that wrote in the
// last 24 hours; otherwise only an approved template may be sent. So the
// request goes as plain text when the manager wrote recently, else as the
// "tour_request" template (created from the admin panel, approved by Meta).
// If neither works, the Telegram copy says so and carries the whole request.

import { sendTelegram } from "./notifyBooking";
import { SITE_URL } from "../siteConfig";
import { getConfig, getConversation, markRequestForwarded, setConfig } from "./inboxStore";
import { createTemplate, digits, getTemplate, sendTemplate, sendText } from "./whatsapp";

// "tour_request" (2026-10-26) carried a client field; this one has none.
export const TEMPLATE_NAME = "tour_request_details";
const TEMPLATE_LANGUAGE = "ka";
const TEMPLATE_BODY =
  "ახალი მოთხოვნა ტურზე GeorgiaTrips-იდან:\n\n{{1}}\n\nგთხოვთ, მოამზადოთ შეთავაზება და გამოგვიგზავნოთ ფასი.";
const TEMPLATE_EXAMPLE = [
  "თარიღი: 29 ოქტომბერი; ხალხი: 1; ადგილები: დაშბაშის კანიონი, ალგეთის ტბა; აყვანა: სასტუმრო თბილისში",
];
// One forward per chat a day: later messages of the same customer are the
// manager's to answer.
const FORWARD_AGAIN_AFTER_MS = 24 * 60 * 60 * 1000;
const WINDOW_MS = 24 * 60 * 60 * 1000;
// From this long after the manager's last message, they are asked to answer
// anything, so the next 24 hours stay open for plain-text forwards.
const PING_AFTER_MS = 22 * 60 * 60 * 1000;
const PING_TEXT =
  "🤖 გამარჯობა! მე ვარ GeorgiaTrips-ის ასისტენტი გიდო, ეს სატესტო შეტყობინებაა. გთხოვთ, უპასუხეთ ნებისმიერი სიტყვით (მაგ. „ok“), რომ AI-მ მომდევნო 24 საათი შეძლოს ტურების მოთხოვნების გამოგზავნა.";
// How the assistant opens every message to the manager.
const GREETING = "📨 გამარჯობა! მე ვარ GeorgiaTrips-ის ასისტენტი გიდო.";
const CHANNEL_LABELS = { whatsapp: "WhatsApp", messenger: "Messenger", instagram: "Instagram" };

const DEFAULTS = { enabled: true, phone: "995599186927", name: "Travel Georgia" };

// From the stored "ai" config: where ready requests go.
export function forwardSettingsFrom(ai) {
  const saved = ai?.forward || {};
  return { ...DEFAULTS, ...saved, phone: digits(saved.phone ?? DEFAULTS.phone) };
}

export async function getForwardSettings() {
  return forwardSettingsFrom(await getConfig("ai"));
}

export async function saveForwardSettings({ enabled, phone, name }) {
  const forward = { enabled: Boolean(enabled), phone: digits(phone), name: String(name || "").trim().slice(0, 60) };
  if (forward.enabled && forward.phone.length < 8) throw new Error("მიუთითეთ სწორი ნომერი ქვეყნის კოდით, მაგ. 995599186927.");
  await setConfig("ai", { forward });
  return forward;
}

// The manager's own chat is never answered by the assistant.
export async function isForwardTarget(channel, id) {
  if (channel !== "whatsapp") return false;
  return (await getForwardSettings()).phone === digits(id);
}

// Template status for the admin panel (null when not created yet).
export async function templateStatus() {
  const t = await getTemplate(TEMPLATE_NAME);
  return t ? { status: t.status, reason: t.rejected_reason || "" } : null;
}

export async function submitTemplate() {
  await createTemplate({ name: TEMPLATE_NAME, language: TEMPLATE_LANGUAGE, body: TEMPLATE_BODY, example: TEMPLATE_EXAMPLE });
  return templateStatus();
}

// What the AI wrote, minus anything that looks like contact details.
const withoutContacts = (text) =>
  String(text || "")
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "")
    .replace(/\+?\d[\d\s()-]{6,}\d/g, (m) => (m.replace(/\D/g, "").length >= 9 ? "" : m))
    .replace(/(?:https?:\/\/|www\.)\S+/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

const oneLine = (text, max) => {
  const flat = String(text || "").replace(/\s*\n+\s*/g, " · ").replace(/\s{2,}/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max)}…` : flat;
};

// Sends one ready request on, once a day per chat; within that day only an
// update whose details changed (the customer added or corrected something)
// goes again, as the whole updated request. Returns how it went.
export async function forwardTourRequest({ channel, id, name, summary, customerText }) {
  const settings = await getForwardSettings();
  if (!settings.enabled || !settings.phone) return null;
  const details = withoutContacts(summary);
  if (!details) return null;
  const conversation = await getConversation(channel, id);
  const update = Boolean(conversation?.requestForwardedAt && Date.now() - conversation.requestForwardedAt < FORWARD_AGAIN_AFTER_MS);
  if (update && oneLine(details, 2000) === oneLine(conversation.requestSummary, 2000)) return null;
  await markRequestForwarded(channel, id, details);

  const who = [name, CHANNEL_LABELS[channel], channel === "whatsapp" ? `+${id}` : ""].filter(Boolean).join(" · ");
  const lines = details.split(/;\s*/).filter(Boolean).join("\n");
  const text = update
    ? `${GREETING} გიგზავნით განახლებას წინა მოთხოვნაზე (იგივე კლიენტი), სრული მოთხოვნა:\n\n${lines}\n\nგთხოვთ, შეთავაზება ამის მიხედვით მოამზადოთ.`
    : `${GREETING} გიგზავნით კლიენტის მოთხოვნას ტურზე:\n\n${lines}\n\nგთხოვთ, მოამზადოთ შეთავაზება და გამოგვიგზავნოთ ფასი.`;

  let how;
  try {
    const manager = await getConversation("whatsapp", settings.phone);
    if (manager?.lastIncomingAt && Date.now() - manager.lastIncomingAt < WINDOW_MS) {
      await sendText({ to: settings.phone, text, source: "ai" });
      how = "ტექსტით";
    } else {
      await sendTemplate({
        to: settings.phone,
        name: TEMPLATE_NAME,
        language: TEMPLATE_LANGUAGE,
        // The approved template text is fixed, so the introduction rides in the parameter.
        params: [
          oneLine(`${GREETING} გიგზავნით ${update ? "განახლებას წინა მოთხოვნაზე" : "კლიენტის მოთხოვნას"} — ${details}`, 1000),
        ],
        text,
      });
      how = "შაბლონით";
    }
  } catch (err) {
    how = `ვერ გაიგზავნა: ${err.message}`;
  }

  const ok = !how.startsWith("ვერ");
  await sendTelegram(
    `${ok ? "📨" : "⚠️"} ${update ? "მოთხოვნის განახლება" : "მზა მოთხოვნა"} ${ok ? "გადაეგზავნა" : "ვერ გადაეგზავნა"} ${settings.name || "მენეჯერს"}-ს (+${settings.phone}) — ${how}\n\n` +
      `${text}\n\nკლიენტი (მხოლოდ თქვენთვის): ${who}` +
        (customerText ? `\n\nკლიენტის შეტყობინება:\n${String(customerText).slice(0, 1500)}` : "") +
        `\n\nადმინი: ${SITE_URL}/admin`,
    "tour-request"
  );
  return { ok, how };
}

// Keeps the manager's 24-hour window open: some 22 hours after their last
// message they get one short note asking for any answer. Runs after every
// webhook call and from /api/cron/manager-window; at most one note per
// message of theirs.
let pingCheckedAt = 0;
export async function keepManagerWindowOpen() {
  if (Date.now() - pingCheckedAt < 5 * 60 * 1000) return { checked: false };
  pingCheckedAt = Date.now();
  const settings = await getForwardSettings();
  if (!settings.enabled || !settings.phone) return { checked: true };
  const manager = await getConversation("whatsapp", settings.phone);
  const last = manager?.lastIncomingAt || 0;
  const since = Date.now() - last;
  if (!last || since < PING_AFTER_MS || since > WINDOW_MS - 60 * 1000) return { checked: true };
  const ping = (await getConfig("forward_ping")) || {};
  if (ping.forIncomingAt === last) return { checked: true };
  await setConfig("forward_ping", { forIncomingAt: last, sentAt: Date.now() });
  await sendText({ to: settings.phone, text: PING_TEXT, source: "ai" });
  return { checked: true, sent: true };
}
