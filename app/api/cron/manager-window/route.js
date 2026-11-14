import { NextResponse } from "next/server";
import { keepManagerWindowOpen } from "../../../lib/server/tourRequests";
import { learnPending } from "../../../lib/server/inboxAi";
import { mailReady, syncMail } from "../../../lib/server/mailReader";

// Keeps the tour-request manager's WhatsApp window open (tourRequests.js).
// Called every 20 minutes by .github/workflows/manager-window.yml and after
// every Meta webhook. Open to anyone: it only ever sends the one note that is
// due, so calling it more often changes nothing.
// The same call lets the inbox assistant read the replies the team wrote
// since last time (inboxAi.js learnPending); each reply is read only once.
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET() {
  const started = Date.now();
  try {
    const result = await keepManagerWindowOpen();
    const learned = process.env.GEMINI_API_KEY
      ? await learnPending()
          .then((ai) => ai.run)
          .catch((err) => {
            console.error("[manager window] learning:", err?.message || err);
            return { error: true };
          })
      : null;
    // New e-mails are read and summarized on the same schedule (mailReader.js).
    const ready = await mailReady().catch(() => ({}));
    const mail =
      ready.gmail && ready.gemini && Date.now() - started < 40000
        ? await syncMail({ budgetMs: 30000 })
            .then(({ added, remaining }) => ({ added, remaining }))
            .catch((err) => {
              console.error("[manager window] mail:", err?.message || err);
              return { error: true };
            })
        : null;
    return NextResponse.json({ ...result, learned, mail });
  } catch (err) {
    console.error("[manager window]", err?.message || err);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
