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
  setAiDraft,
  setAiOff,
  setConfig,
  unreadCounts,
} from "../../../lib/server/inboxStore";
import { importFromFirestore } from "../../../lib/server/inboxImport";
import { AI_MODES, getAiSettings, testAi } from "../../../lib/server/inboxAi";

// Admin panel → WhatsApp / Messenger chats (Neon). The tabs poll this.
//   GET ?counts=1                          chats with unread messages, per channel
//   GET [?channel=whatsapp]                conversation list, all channels by default (+ phone contact names)
//   GET ?channel=whatsapp&conversation=ID  one chat's latest messages
//   POST { action: "read", channel, id }   mark a chat read
//   POST { action: "import" }              copy the old chats over from Firestore
//   POST { action: "ai-settings", mode, channels }   inbox assistant mode (off / suggest / auto)
//   POST { action: "ai-chat", channel, id, off }     assistant on/off for one chat
//   POST { action: "ai-draft-clear", channel, id }  drop a suggested reply
//   POST { action: "ai-test" }                       one test request to Gemini
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
    const conversation = params.get("conversation");
    if (conversation) {
      return NextResponse.json({ messages: await listMessages(channelOf(params.get("channel")), conversation) });
    }
    // Without a channel: every channel's chats, newest first (the shared inbox).
    const channel = params.get("channel") ? channelOf(params.get("channel")) : "";
    const [conversations, contacts, imported, ai] = await Promise.all([
      listConversations(channel),
      !channel || channel === "whatsapp" ? listContacts() : {},
      getConfig("import"),
      getAiSettings(),
    ]);
    return NextResponse.json({ conversations, contacts, imported: Boolean(imported), ai });
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
    if (payload.action === "ai-settings") {
      if (!AI_MODES.includes(payload.mode)) throw new InboxError("unknown_mode", 400);
      const channels = Object.fromEntries([...CHANNELS].map((c) => [c, payload.channels?.[c] !== false]));
      await setConfig("ai", { mode: payload.mode, channels });
      return NextResponse.json(await getAiSettings());
    }
    if (payload.action === "ai-test") {
      try {
        return NextResponse.json(await testAi());
      } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 502 });
      }
    }
    if (payload.action === "ai-chat") {
      await setAiOff(channelOf(payload.channel), String(payload.id || ""), payload.off);
      return NextResponse.json({ ok: true });
    }
    if (payload.action === "ai-draft-clear") {
      await setAiDraft(channelOf(payload.channel), String(payload.id || ""), "");
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
