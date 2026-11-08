import { NextResponse, after } from "next/server";
import {
  GetTransferError,
  checkExtensionKey,
  offersForExtension,
  reportOfferResult,
  syncFromExtension,
} from "../../../lib/server/gettransferStore";

// Called by the "GT Sync" Chrome extension, authorised by the key shown in
// Admin → GetTransfer (header X-GT-Key).
//   POST { action: "sync", transfers, vehicles, drivers, currency }  → { offers: [...] to submit }
//   POST { action: "offers" }                                        → { offers } only (quick check, ~30 s)
//   POST { action: "result", id, ok, error? }                        after submitting one
export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    await checkExtensionKey(request);
    const payload = await request.json().catch(() => ({}));
    if (payload.action === "sync") {
      const { translate, ...result } = await syncFromExtension(payload);
      // New addresses get their Georgian names once the extension has its answer.
      after(() => translate().catch((err) => console.error("[gettransfer translate]", err)));
      return NextResponse.json(result);
    }
    if (payload.action === "offers") return NextResponse.json(await offersForExtension());
    if (payload.action === "result") return NextResponse.json(await reportOfferResult(payload));
    return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  } catch (err) {
    if (!(err instanceof GetTransferError)) console.error("[gettransfer sync]", err);
    return NextResponse.json({ error: err?.message || "error" }, { status: err?.status || 500 });
  }
}
