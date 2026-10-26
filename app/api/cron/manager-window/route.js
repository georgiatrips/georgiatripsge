import { NextResponse } from "next/server";
import { keepManagerWindowOpen } from "../../../lib/server/tourRequests";

// Keeps the tour-request manager's WhatsApp window open (tourRequests.js).
// Called every 20 minutes by .github/workflows/manager-window.yml and after
// every Meta webhook. Open to anyone: it only ever sends the one note that is
// due, so calling it more often changes nothing.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await keepManagerWindowOpen());
  } catch (err) {
    console.error("[manager window]", err?.message || err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
