export const ALLOWED_TARGETS = new Set(["ka", "en", "ru", "tr", "ar"]);

// Google Translate's free web endpoint (no key). Used by the admin
// translate button and for GetTransfer addresses.
export async function translateSingle(text, target) {
  if (!ALLOWED_TARGETS.has(target)) return "";
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`Google Translate API returned status ${response.status}`);
  }

  const data = await response.json();
  // Google Translate returns format: [[["Translated text", "original text", ...]]]
  if (Array.isArray(data?.[0])) {
    return data[0].map((item) => item?.[0] || "").join("");
  }
  return "";
}
