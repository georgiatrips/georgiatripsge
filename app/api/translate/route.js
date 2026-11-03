import { NextResponse } from "next/server";
import { requireAdmin } from "../../lib/server/adminAuth";
import { ALLOWED_TARGETS, translateSingle } from "../../lib/server/translate";

const MAX_TEXT_LENGTH = 5_000;

export async function POST(req) {
  try {
    const admin = await requireAdmin(req);
    if (admin.error) return NextResponse.json({ error: admin.error }, { status: admin.status });

    const body = await req.json().catch(() => ({}));
    const { text, target, targets } = body;
    if (!text || typeof text !== "string" || text.trim().length === 0 || text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Support batch translation for multiple target languages in 1 request
    if (Array.isArray(targets) && targets.length > 0) {
      const validTargets = targets.filter((t) => ALLOWED_TARGETS.has(t));
      const results = await Promise.allSettled(
        validTargets.map(async (t) => {
          const translated = await translateSingle(text, t);
          return [t, translated];
        })
      );

      const translations = {};
      results.forEach((res, i) => {
        const lang = validTargets[i];
        if (res.status === "fulfilled" && res.value) {
          translations[lang] = res.value[1];
        }
      });

      return NextResponse.json({ translations });
    }

    if (!ALLOWED_TARGETS.has(target)) {
      return NextResponse.json({ error: "Target language is required" }, { status: 400 });
    }

    const translatedText = await translateSingle(text, target);
    return NextResponse.json({ translatedText });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json({ error: error.message || "Translation failed" }, { status: 500 });
  }
}
