import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/server/adminAuth";
import { WhatsAppError } from "../../../lib/server/whatsapp";
import { connectPage, getConnectionStatus, sendText } from "../../../lib/server/messenger";

// Admin panel → Messenger and Instagram tabs (both go through the Page).
//   GET ?channel=messenger|instagram        connection status (never the token)
//   POST { action: "connect", token, pageId? }   system-user token → Page token
//   POST { action: "send", channel, to, text }   reply to a person (page- or Instagram-scoped ID)
export const dynamic = "force-dynamic";

function fail(err) {
  if (!(err instanceof WhatsAppError)) console.error("[admin messenger]", err);
  return NextResponse.json({ error: err?.message || "error" }, { status: err?.status || 500 });
}

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin.error) return NextResponse.json({ error: admin.error }, { status: admin.status });
  try {
    const channel = request.nextUrl.searchParams.get("channel") === "instagram" ? "instagram" : "messenger";
    return NextResponse.json(await getConnectionStatus(channel));
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
      return NextResponse.json(await connectPage(payload));
    }
    if (payload.action === "send") {
      return NextResponse.json(await sendText(payload));
    }
    return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  } catch (err) {
    return fail(err);
  }
}
