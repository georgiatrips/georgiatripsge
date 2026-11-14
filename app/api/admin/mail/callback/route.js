import { NextResponse } from "next/server";
import { finishConnect } from "../../../../lib/server/mailReader";

// Google sends the admin back here after the Gmail consent page. A browser
// redirect carries no admin token, so the one-time `state` issued to an
// admin by POST /api/admin/mail { action: "connect" } is what is checked
// (mailReader.js finishConnect). Ends on the admin panel's "მეილები" tab.
export const dynamic = "force-dynamic";

export async function GET(request) {
  const url = new URL(request.url);
  const back = new URL("/admin", url.origin);
  try {
    if (url.searchParams.get("error")) throw new Error("Google-ის გვერდზე წვდომა არ დაუშვით.");
    await finishConnect({ code: url.searchParams.get("code"), state: url.searchParams.get("state") });
    back.searchParams.set("mail", "connected");
  } catch (err) {
    console.error("[admin mail callback]", err?.message || err);
    back.searchParams.set("mail", "error");
    back.searchParams.set("reason", String(err?.message || "error").slice(0, 300));
  }
  return NextResponse.redirect(back);
}
