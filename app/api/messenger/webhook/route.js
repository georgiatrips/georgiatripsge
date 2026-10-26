import { NextResponse, after } from "next/server";
import { verifySignature } from "../../../lib/server/whatsapp";
import { alertNewMessages, processWebhook } from "../../../lib/server/messenger";
import { answerNewMessages } from "../../../lib/server/inboxAi";
import { keepManagerWindowOpen } from "../../../lib/server/tourRequests";

// Meta's Page and Instagram webhook (Meta app → Messenger → Webhooks, objects
// "page" and "instagram"). GET answers the one-time verification; POST
// receives messages people send to the Facebook Page or Instagram account
// and echoes of the business's replies.
export const dynamic = "force-dynamic";
// The inbox assistant answers after the webhook reply (inboxAi.js).
export const maxDuration = 60;

export async function GET(request) {
  const params = request.nextUrl.searchParams;
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;
  if (expected && params.get("hub.mode") === "subscribe" && params.get("hub.verify_token") === expected) {
    return new Response(params.get("hub.challenge") || "", { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(request) {
  const raw = await request.text();
  if (!verifySignature(raw, request.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Saved before answering so Meta retries on an error; the alert waits.
  try {
    const alerts = await processWebhook(body);
    if (alerts.length) {
      after(() => alertNewMessages(alerts));
      after(() => answerNewMessages(alerts));
    }
  } catch (err) {
    console.error("[messenger webhook] failed:", err?.message || err);
    return NextResponse.json({ error: "processing_failed" }, { status: 500 });
  }
  // Any webhook call is a chance to keep the manager's WhatsApp window open.
  after(() => keepManagerWindowOpen().catch((err) => console.error("[messenger webhook] manager ping:", err?.message || err)));
  return NextResponse.json({ ok: true });
}
