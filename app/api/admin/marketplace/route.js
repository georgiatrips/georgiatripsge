import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/server/adminAuth";
import { MarketplaceError, deleteListing, listListings, saveListing } from "../../../lib/server/marketplaceStore";
import { generateListing, gygScript } from "../../../lib/server/marketplaceAi";

// Admin panel → "ტურები სხვა საიტზე".
//   GET                                   all listings
//   POST { action: "save", listing }      create or replace one listing
//   POST { action: "delete", id }
//   POST { action: "ai", listing, brief, tour, mode, only? }   AI writes the fields (nothing is saved)
//   POST { action: "gyg-script", listing, brief, tour }       English text for GYG's AI content creator
export const dynamic = "force-dynamic";
export const maxDuration = 180;

function fail(err) {
  if (!(err instanceof MarketplaceError)) console.error("[admin marketplace]", err);
  return NextResponse.json({ error: err?.message || "error" }, { status: err?.status || 500 });
}

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin.error) return NextResponse.json({ error: admin.error }, { status: admin.status });
  try {
    return NextResponse.json({ listings: await listListings() });
  } catch (err) {
    return fail(err);
  }
}

export async function POST(request) {
  const admin = await requireAdmin(request);
  if (admin.error) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const payload = await request.json().catch(() => ({}));
  try {
    if (payload.action === "save") return NextResponse.json(await saveListing(payload.listing));
    if (payload.action === "ai" || payload.action === "gyg-script") {
      try {
        return NextResponse.json(await (payload.action === "ai" ? generateListing(payload) : gygScript(payload)));
      } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 502 });
      }
    }
    if (payload.action === "delete") return NextResponse.json(await deleteListing(payload.id));
    return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  } catch (err) {
    return fail(err);
  }
}
