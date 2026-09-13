import { NextResponse } from "next/server";
import { revalidateTag, revalidatePath } from "next/cache";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { tag, path, secret } = body;

    // Optional secret check if REVALIDATE_SECRET is configured
    const expectedSecret = process.env.REVALIDATE_SECRET;
    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (tag) {
      revalidateTag(tag);
      return NextResponse.json({ success: true, revalidatedTag: tag, now: Date.now() });
    }

    if (path) {
      revalidatePath(path);
      return NextResponse.json({ success: true, revalidatedPath: path, now: Date.now() });
    }

    // Default revalidate all core tags
    ["tours", "places", "posts", "hotels"].forEach((t) => revalidateTag(t));
    return NextResponse.json({ success: true, revalidatedTags: ["tours", "places", "posts", "hotels"], now: Date.now() });
  } catch (error) {
    console.error("[api/admin/revalidate] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
