import { NextResponse, after } from "next/server";
import { alertNewMessages, processWebhook, verifySignature } from "../../../lib/server/whatsapp";

// Meta's WhatsApp webhook (Meta app → WhatsApp → Configuration).
// GET answers the one-time verification; POST receives messages, echoes of
// replies sent from the phone, chat history and contacts.
export const dynamic = "force-dynamic";

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

  // Saved before answering: on an error Meta gets a 500 and retries, so no
  // message is lost. Only the Telegram alert waits until after the reply.
  try {
    const alerts = await processWebhook(body);
    if (alerts.length) after(() => alertNewMessages(alerts));
  } catch (err) {
    console.error("[whatsapp webhook] failed:", err?.message || err);
    return NextResponse.json({ error: "processing_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
