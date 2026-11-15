import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/server/adminAuth";
import { connectUrl, disconnectMail, mailOverview, setMailDone, syncMail } from "../../../lib/server/mailReader";

// Admin panel → "მეილები" (mailReader.js).
//   GET                                stored summaries, important first
//   POST { action: "sync" }            read the inbox's new mails, then the list
//   POST { action: "done", id, done }  mark a mail as handled (or not)
//   POST { action: "connect" }         Google's consent page to connect Gmail → { url }
//   POST { action: "disconnect" }      forget and revoke the Gmail access
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin.error) return NextResponse.json({ error: admin.error }, { status: admin.status });
  try {
    return NextResponse.json(await mailOverview());
  } catch (err) {
    console.error("[admin mail]", err);
    return NextResponse.json({ error: err?.message || "error" }, { status: err?.status || 500 });
  }
}

export async function POST(request) {
  const admin = await requireAdmin(request);
  if (admin.error) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const payload = await request.json().catch(() => ({}));
  try {
    if (payload.action === "sync") {
      let run;
      try {
        run = await syncMail();
      } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 502 });
      }
      return NextResponse.json({ ...(await mailOverview()), run });
    }
    if (payload.action === "done") {
      await setMailDone(String(payload.id || ""), payload.done !== false);
      return NextResponse.json({ ok: true });
    }
    if (payload.action === "connect") {
      return NextResponse.json({ url: await connectUrl(new URL(request.url).origin) });
    }
    if (payload.action === "disconnect") {
      await disconnectMail();
      return NextResponse.json(await mailOverview());
    }
    return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  } catch (err) {
    console.error("[admin mail]", err);
    return NextResponse.json({ error: err?.message || "error" }, { status: err?.status || 500 });
  }
}
