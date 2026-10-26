// Ready tour requests: when the inbox assistant (inboxAi.js) sees that a
// customer has given everything needed to plan a trip (what, when, how many,
// where from), the request goes straight to the manager on WhatsApp, and the
// owner gets a copy in Telegram.
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

export const TEMPLATE_NAME = "tour_request";
const TEMPLATE_LANGUAGE = "ka";
const TEMPLATE_BODY =
  "ახალი მოთხოვნა ტურზე GeorgiaTrips-იდან.\n\nკლიენტი: {{1}}\nდეტალები: {{2}}\n\nგთხოვთ, გაეცნოთ და მოამზადოთ შეთავაზება.";
const TEMPLATE_EXAMPLE = [
  "John · WhatsApp · +995555123456",
  "თარიღი: 29 ოქტომბერი; ხალხი: 1; ადგილები: დაშბაშის კანიონი, ალგეთის ტბა; აყვანა: სასტუმრო თბილისში",
];
// One forward per chat a day: later messages of the same customer are the
// manager's to answer.
const FORWARD_AGAIN_AFTER_MS = 24 * 60 * 60 * 1000;
const WINDOW_MS = 24 * 60 * 60 * 1000;
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

const oneLine = (text, max) => {
  const flat = String(text || "").replace(/\s*\n+\s*/g, " · ").replace(/\s{2,}/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max)}…` : flat;
};

// Sends one ready request on, at most once a day per chat. Returns how it
// went, for the owner's Telegram copy.
export async function forwardTourRequest({ channel, id, name, summary, customerText }) {
  const settings = await getForwardSettings();
  if (!settings.enabled || !settings.phone) return null;
  const conversation = await getConversation(channel, id);
  if (conversation?.requestForwardedAt && Date.now() - conversation.requestForwardedAt < FORWARD_AGAIN_AFTER_MS) return null;
  await markRequestForwarded(channel, id);

  const who = [name, CHANNEL_LABELS[channel], channel === "whatsapp" ? `+${id}` : ""].filter(Boolean).join(" · ");
  const details = String(summary || "").trim();
  const text =
    `📨 ახალი მოთხოვნა ტურზე — GeorgiaTrips\n\nკლიენტი: ${who}\n${details.split(/;\s*/).join("\n")}` +
    (customerText ? `\n\nკლიენტის შეტყობინება:\n${String(customerText).slice(0, 1500)}` : "");

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
        params: [oneLine(who, 200), oneLine(details, 900)],
        text,
      });
      how = "შაბლონით";
    }
  } catch (err) {
    how = `ვერ გაიგზავნა: ${err.message}`;
  }

  const ok = !how.startsWith("ვერ");
  await sendTelegram(
    `${ok ? "📨" : "⚠️"} მზა მოთხოვნა ${ok ? "გადაეგზავნა" : "ვერ გადაეგზავნა"} ${settings.name || "მენეჯერს"}-ს (+${settings.phone}) — ${how}\n\n` +
      `${text}\n\nადმინი: ${SITE_URL}/admin`,
    "tour-request"
  );
  return { ok, how };
}
