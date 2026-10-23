import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/server/adminAuth";
import {
  CHANNELS,
  InboxError,
  getConfig,
  listContacts,
  listConversations,
  listMessages,
  markRead,
  unreadCounts,
} from "../../../lib/server/inboxStore";
import { importFromFirestore } from "../../../lib/server/inboxImport";

// Admin panel → WhatsApp / Messenger chats (Neon). The tabs poll this.
//   GET ?counts=1                          chats with unread messages, per channel
//   GET ?channel=whatsapp                  conversation list (+ phone contact names)
//   GET ?channel=whatsapp&conversation=ID  one chat's latest messages
//   POST { action: "read", channel, id }   mark a chat read
//   POST { action: "import" }              copy the old chats over from Firestore
export const dynamic = "force-dynamic";

function fail(err) {
  if (!(err instanceof InboxError)) console.error("[admin inbox]", err);
  return NextResponse.json({ error: err?.message || "error" }, { status: err?.status || 500 });
}

function channelOf(value) {
  if (!CHANNELS.has(value)) throw new InboxError("unknown_channel", 400);
  return value;
}

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin.error) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const params = request.nextUrl.searchParams;
  try {
    if (params.get("counts")) return NextResponse.json(await unreadCounts());
    const channel = channelOf(params.get("channel"));
    const conversation = params.get("conversation");
    if (conversation) return NextResponse.json({ messages: await listMessages(channel, conversation) });
    const [conversations, contacts, imported] = await Promise.all([
      listConversations(channel),
      channel === "whatsapp" ? listContacts() : {},
      getConfig("import"),
    ]);
    return NextResponse.json({ conversations, contacts, imported: Boolean(imported) });
  } catch (err) {
    return fail(err);
  }
}

export async function POST(request) {
  const admin = await requireAdmin(request);
  if (admin.error) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const payload = await request.json().catch(() => ({}));
  try {
    if (payload.action === "read") {
      await markRead(channelOf(payload.channel), String(payload.id || ""));
      return NextResponse.json({ ok: true });
    }
    if (payload.action === "import") {
      return NextResponse.json(await importFromFirestore());
    }
    return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  } catch (err) {
    return fail(err);
  }
}
