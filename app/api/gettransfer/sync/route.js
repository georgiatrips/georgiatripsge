import { NextResponse } from "next/server";
import {
  GetTransferError,
  checkExtensionKey,
  reportOfferResult,
  syncFromExtension,
} from "../../../lib/server/gettransferStore";

// Called by the "GT Sync" Chrome extension, authorised by the key shown in
// Admin → GetTransfer (header X-GT-Key).
//   POST { action: "sync", transfers, vehicles, drivers, currency }  → { offers: [...] to submit }
//   POST { action: "result", id, ok, error? }                        after submitting one
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    await checkExtensionKey(request);
    const payload = await request.json().catch(() => ({}));
    if (payload.action === "sync") return NextResponse.json(await syncFromExtension(payload));
    if (payload.action === "result") return NextResponse.json(await reportOfferResult(payload));
    return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  } catch (err) {
    if (!(err instanceof GetTransferError)) console.error("[gettransfer sync]", err);
    return NextResponse.json({ error: err?.message || "error" }, { status: err?.status || 500 });
  }
}
