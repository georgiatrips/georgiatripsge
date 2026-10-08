import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/server/adminAuth";
import { WhatsAppError, connectWhatsApp, getConnectionStatus, sendText } from "../../../lib/server/whatsapp";

// Admin panel → WhatsApp tab.
//   GET                                   connection status (never the token)
//   POST { action: "connect", code, wabaId, phoneNumberId }   finish Embedded Signup
//   POST { action: "send", to, text }     reply to a customer
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
    return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  } catch (err) {
    return fail(err);
  }
}
