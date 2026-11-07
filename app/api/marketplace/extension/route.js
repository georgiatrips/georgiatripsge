import { NextResponse } from "next/server";
import { GetTransferError, checkExtensionKey } from "../../../lib/server/gettransferStore";
import { MarketplaceError, listListings, reportFromExtension } from "../../../lib/server/marketplaceStore";
import { buildPlan } from "../../../lib/marketplacePlan";
import { mapPage } from "../../../lib/server/marketplaceAi";

// Called by the GT Sync extension on supplier.getyourguide.com and
// experience.tripster.ru, with the same key as GetTransfer (header X-GT-Key).
//   POST { action: "list", platform }                         fill plans of every listing for that site
//   POST { action: "report", id, platform, productId?, url?, status? }
//   POST { action: "map", platform, page, values, options }   AI: which value goes into which empty field
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request) {
  try {
    await checkExtensionKey(request);
    const payload = await request.json().catch(() => ({}));
    const platform = payload.platform;
    if (!["gyg", "tripster"].includes(platform)) return NextResponse.json({ error: "bad_platform" }, { status: 400 });

    if (payload.action === "list") {
      const listings = (await listListings()).filter((l) => l.launch?.[platform]?.status !== "skip");
      return NextResponse.json({ plans: listings.map((l) => buildPlan(l, platform)) });
    }
    if (payload.action === "report") return NextResponse.json(await reportFromExtension(payload));
    if (payload.action === "map") {
      try {
        return NextResponse.json(await mapPage(payload));
      } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 502 });
      }
    }
    return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  } catch (err) {
    if (!(err instanceof GetTransferError) && !(err instanceof MarketplaceError)) console.error("[marketplace extension]", err);
    return NextResponse.json({ error: err?.message || "error" }, { status: err?.status || 500 });
  }
}
