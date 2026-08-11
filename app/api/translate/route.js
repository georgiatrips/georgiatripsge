import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { text, target } = await req.json();
    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }
    if (!target) {
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
