import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/server/adminAuth";
import {
  GetTransferError,
  cancelQueued,
  getSettings,
  listRequests,
  queueOffer,
  rotateKey,
  setStatus,
} from "../../../lib/server/gettransferStore";

// Admin panel → GetTransfer tab.
//   GET                                                     requests + sync status (never the key)
//   POST { action: "offer", id, vehicleId, price, priceReturn?, withNameSign? }   queue an offer
//   POST { action: "cancel", id }                           un-queue a not yet sent offer
//   POST { action: "status", id, status: "new"|"skipped" }
//   POST { action: "key" }                                  current extension key (new one if none)
//   POST { action: "rotate-key" }                           replace it; the old one stops working
export const dynamic = "force-dynamic";

function fail(err) {
  if (!(err instanceof GetTransferError)) console.error("[admin gettransfer]", err);
  return NextResponse.json({ error: err?.message || "error" }, { status: err?.status || 500 });
}

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin.error) return NextResponse.json({ error: admin.error }, { status: admin.status });
  try {
    return NextResponse.json(await listRequests());
  } catch (err) {
    return fail(err);
  }
}

export async function POST(request) {
  const admin = await requireAdmin(request);
  if (admin.error) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const payload = await request.json().catch(() => ({}));
  try {
    if (payload.action === "offer") return NextResponse.json(await queueOffer(payload));
    if (payload.action === "cancel") return NextResponse.json(await cancelQueued(payload.id));
    if (payload.action === "status") return NextResponse.json(await setStatus(payload.id, payload.status));
    if (payload.action === "key") {
      const { key } = await getSettings();
      return NextResponse.json({ key: key || (await rotateKey()) });
    }
    if (payload.action === "rotate-key") return NextResponse.json({ key: await rotateKey() });
    return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  } catch (err) {
    return fail(err);
  }
}
