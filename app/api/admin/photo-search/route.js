import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/server/adminAuth";
import { searchPhotos } from "../../../lib/server/photoSearch";

// Admin "ფოტოების ძებნა": finds photos of one place on Wikimedia Commons,
// Flickr, Unsplash, Pexels and Pixabay and keeps only the ones whose title,
// description, tags or GPS prove they show that place.
// Keys (server only): FLICKR_API_KEY, UNSPLASH_ACCESS_KEY, PEXELS_API_KEY, PIXABAY_API_KEY.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin.error) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  if (q.length < 2) return NextResponse.json({ error: "query_too_short" }, { status: 400 });
  const sources = (searchParams.get("sources") || "").split(",").filter(Boolean);

  try {
    return NextResponse.json(await searchPhotos(q, { sources }));
  } catch (err) {
    console.warn("[api/admin/photo-search]", err.message);
    return NextResponse.json({ error: "search_failed" }, { status: 502 });
  }
}
