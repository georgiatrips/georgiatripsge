import { NextResponse, after } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";
import { requireAdmin } from "../../../lib/server/adminAuth";
import { submitToIndexNow } from "../../../lib/server/indexNow";

const CORE_TAGS = ["tours", "places", "posts", "hotels", "reviews", "transfers"];

// Expire immediately (not stale-while-revalidate): an admin who just saved a
// tour expects the next page load to show it.
const EXPIRE_NOW = { expire: 0 };

export async function POST(request) {
  const admin = await requireAdmin(request);
  if (admin.error) {
    return NextResponse.json({ success: false, error: admin.error }, { status: admin.status });
  }

  try {
    const body = await request.json().catch(() => ({}));
    // `changed`: locale-free paths of the saved/deleted item, e.g. ["/tours/<slug>"],
    // announced to search engines via IndexNow once the response is sent.
    const { tag, path, changed } = body;

    if (path) {
      revalidatePath(path);
      return NextResponse.json({ success: true, revalidatedPath: path, now: Date.now() });
    }

    const tags = tag ? [tag] : CORE_TAGS;
    if (tags.some((t) => !CORE_TAGS.includes(t))) {
      return NextResponse.json({ success: false, error: "Unknown tag" }, { status: 400 });
    }
    tags.forEach((t) => revalidateTag(t, EXPIRE_NOW));
    // The sitemap and the proxy's slug index list tours and places, so they must
    // pick up additions and deletions.
    revalidatePath("/sitemap.xml");
    revalidatePath("/content-index.json");
    if (Array.isArray(changed) && changed.length > 0) {
      after(() =>
        submitToIndexNow(changed).catch((err) => console.warn("[indexNow]", err.message))
      );
    }
    return NextResponse.json({ success: true, revalidatedTags: tags, now: Date.now() });
  } catch (error) {
    console.error("[api/admin/revalidate] Error:", error);
    return NextResponse.json({ success: false, error: "Revalidation failed" }, { status: 500 });
  }
}
