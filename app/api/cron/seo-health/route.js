import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/server/adminAuth";
import { runSeoHealthCheck, formatSeoReport } from "../../../lib/server/seoHealth";

// Runs the daily SEO health check (see vercel.json "crons").
//
// Vercel calls it once a day with "Authorization: Bearer <CRON_SECRET>" when
// CRON_SECRET is set in Vercel → Settings → Environment Variables. An admin
// can also run it by hand with their Firebase token. Anyone else gets 401.
//
// Telegram (same TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID as booking alerts):
// a message only when something needs fixing, plus a short all-clear on
// Mondays — a daily "everything is fine" would soon be ignored.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function isAuthorized(request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") === `Bearer ${secret}`) return "cron";
  const admin = await requireAdmin(request);
  return admin.error ? null : "admin";
}

async function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch (err) {
    console.error("[seo-health] Telegram failed:", err?.message || err);
    return false;
  }
}

export async function GET(request) {
  const caller = await isAuthorized(request);
  if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const report = await runSeoHealthCheck();

  const isMonday = new Date().getUTCDay() === 1;
  const shouldNotify = caller === "cron" && (report.issues.length > 0 || isMonday);
  const notified = shouldNotify ? await sendTelegram(formatSeoReport(report)) : false;

  return NextResponse.json({ ...report, notified });
}
