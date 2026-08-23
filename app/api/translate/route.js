import { NextResponse } from "next/server";
import { requireAdmin } from "../../lib/server/adminAuth";

const ALLOWED_TARGETS = new Set(["ka", "en", "ru", "tr", "ar"]);
const MAX_TEXT_LENGTH = 5_000;

export async function POST(req) {
  try {
    const admin = await requireAdmin(req);
    if (admin.error) return NextResponse.json({ error: admin.error }, { status: admin.status });

    const { text, target } = await req.json();
    if (!text || typeof text !== "string" || text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }
    if (!ALLOWED_TARGETS.has(target)) {
      return NextResponse.json({ error: "Target language is required" }, { status: 400 });
    }

    // Google Translate GTX Free API
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error("Translation API failed");
    }

    const data = await response.json();
    // Google Translate returns format: [[["Translated text", "original text", ...]]]
    const translatedText = data?.[0]?.map((item) => item?.[0]).join("") || "";

    return NextResponse.json({ translatedText });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
