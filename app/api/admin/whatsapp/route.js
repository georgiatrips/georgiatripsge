import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/server/adminAuth";
import {
  WhatsAppError,
  connectWhatsApp,
  getConnectionStatus,
  listDemoTemplates,
  sendDemoMessage,
  sendText,
} from "../../../lib/server/whatsapp";

// Admin panel → WhatsApp tab.
//   GET                                   connection status (never the token)
//   POST { action: "connect", code, wabaId, phoneNumberId }   finish Embedded Signup
//   POST { action: "send", to, text }     reply to a customer
//   POST { action: "demo-send" | "demo-templates", token, ... }   Meta App Review recording
export const dynamic = "force-dynamic";

function fail(err) {
  if (!(err instanceof WhatsAppError)) console.error("[admin whatsapp]", err);
  return NextResponse.json({ error: err?.message || "error" }, { status: err?.status || 500 });
}

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin.error) return NextResponse.json({ error: admin.error }, { status: admin.status });
  try {
    return NextResponse.json(await getConnectionStatus());
  } catch (err) {
    return fail(err);
  }
}

export async function POST(request) {
  const admin = await requireAdmin(request);
  if (admin.error) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const payload = await request.json().catch(() => ({}));
  try {
    if (payload.action === "connect") {
      return NextResponse.json(await connectWhatsApp(payload));
    }
    if (payload.action === "send") {
      return NextResponse.json(await sendText(payload));
    }
    if (payload.action === "demo-send") {
      return NextResponse.json(await sendDemoMessage(payload));
    }
    if (payload.action === "demo-templates") {
      return NextResponse.json(await listDemoTemplates(payload));
    }
    return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  } catch (err) {
    return fail(err);
  }
}
