// Admin → "ტურები სხვა საიტზე" → AI: writes the GetYourGuide / Tripster
// fields of a listing from a free-text brief and/or the tour on our site,
// with Gemini (same GEMINI_API_KEY as the inbox assistant).
//   mode "empty" — fills only what is still empty,
//   mode "fix"   — also checks and rewrites what is already written.

import { ALL_FIELDS } from "../../admin/marketplaceFields";

// The better model first (long texts in two languages), then fallbacks.
const MODELS = [
  { name: process.env.GEMINI_MARKETPLACE_MODEL || "gemini-3.5-flash", thinkingLevel: "low", timeoutMs: 75000 },
  { name: "gemini-3.5-flash-lite", thinkingLevel: "low", timeoutMs: 45000 },
  { name: "gemini-3.1-flash-lite", thinkingLevel: "minimal", timeoutMs: 40000 },
];

// Never written by AI: our phone, photo links / folders, rights, map pin,
// schedule, dates — facts only the owner knows.
const SKIP = new Set([
  "gygEmergency", "photos", "photosFolder", "photosOwn", "mapLink", "weekdays",
  "seasonFrom", "seasonTo", "gygAutoAccept", "trCloseLate", "trAhead", "trScheduleType",
]);

export const AI_FIELDS = ALL_FIELDS.filter((f) => f.kind !== "info" && !SKIP.has(f.key));

function langOf(field, platform) {
  if (["text", "textarea", "list"].includes(field.kind)) {
    if (field.key === "city") return "Latin letters, e.g. Batumi";
    if (platform) return platform === "gyg" ? "English" : "Russian";
    if (field.p.length === 1) return field.p[0] === "gyg" ? "English" : "Russian";
    return "English";
  }
  return "";
}

function describe(field, platform) {
  const parts = [`${field.orig || field.label}`];
  const lang = langOf(field, platform);
  if (lang) parts.push(`write in ${lang}`);
  const max = typeof field.max === "object" ? field.max?.[platform] : field.kind !== "list" ? field.max : null;
  if (max) parts.push(`max ${max} characters`);
  if (field.minChars) parts.push(`at least ${field.minChars} characters`);
  if (field.kind === "list") parts.push(`one item per array entry${field.min ? `, ${field.min}–${field.max || "∞"} items` : field.max ? `, max ${field.max} items` : ""}`);
  if (field.itemMax) parts.push(`each item max ${field.itemMax} characters`);
  if (field.hint) parts.push(`note (Georgian): ${field.hint}`);
  return parts.join("; ");
}

function schemaFor(field, platform) {
  const description = describe(field, platform);
  if (field.kind === "check") return { type: "BOOLEAN", description };
  if (field.kind === "select") return { type: "STRING", enum: field.options, description };
  if (field.kind === "chips") return { type: "ARRAY", items: { type: "STRING", enum: field.options }, description };
  if (field.kind === "list") return { type: "ARRAY", items: { type: "STRING" }, description };
  if (field.kind === "number") return { type: "NUMBER", description };
  return { type: "STRING", description };
}

function buildSchema() {
  const properties = {
    name: { type: "STRING", description: "Short internal name of the tour in Georgian (for our admin only)" },
    notes: { type: "ARRAY", items: { type: "STRING" }, description: "In Georgian: what you changed or fixed and anything the owner must check by hand (facts you were unsure about). Short points." },
  };
  for (const f of AI_FIELDS) {
    if (f.split) {
      const sub = {};
      for (const p of f.p) sub[p] = schemaFor(f, p);
      properties[f.key] = { type: "OBJECT", properties: sub, description: f.orig || f.label };
    } else {
      properties[f.key] = schemaFor(f);
    }
  }
  return { type: "OBJECT", properties, required: ["notes"] };
}

const SYSTEM = `You prepare tour listings of GeorgiaTrips (georgiatrips.ge, a tour and transfer company in Batumi, Georgia; private tours by car with a driver, group tours by Sprinter) for two marketplaces:
- GetYourGuide (GYG): everything in natural, persuasive English that follows GYG guidelines: title like "From Batumi: …", no ALL CAPS, no emojis, no prices or phone numbers in texts, no claims you cannot back up. Full description 500–3000 characters, short description up to 200, 3–5 highlights.
- Tripster: everything in natural Russian for Russian-speaking travellers, lively but factual, no prices or contacts in texts. The "Идея" explains why the trip is worth it; "Маршрут" goes step by step with approximate times (09:00 …); "Орг. детали" covers what is included, what is paid extra, transport, pick-up.
Rules:
- Use only facts from the owner's brief, the tour on our site and the current values. Do not invent prices, phone numbers, distances or opening hours you are not given; general well-known facts about Georgian places are fine.
- Fields of kind select/chips must use exactly the given enum values.
- Durations are in hours. The pick-up is usually from hotels in Batumi.
- Where a field has a Georgian note, follow it.
- "notes" are written in Georgian for the owner.`;

function clip(s, n) {
  s = String(s || "");
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

function currentValues(listing) {
  const out = {};
  for (const f of AI_FIELDS) {
    const v = listing.fields?.[f.key];
    if (v == null || v === "" || (Array.isArray(v) && !v.length)) continue;
    if (typeof v === "object" && !Array.isArray(v) && !Object.values(v).some((x) => String(x || "").trim())) continue;
    out[f.key] = v;
  }
  return out;
}

function siteTourText(tour) {
  if (!tour || typeof tour !== "object") return "";
  const { gallery, images, image, cover, reviews, ...rest } = tour;
  return clip(JSON.stringify(rest), 40000);
}

async function generate(prompt, schema) {
  const errors = [];
  for (const model of MODELS) {
    let res;
    try {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model.name}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            thinkingConfig: { thinkingLevel: model.thinkingLevel },
            responseMimeType: "application/json",
            responseSchema: schema,
          },
        }),
        signal: AbortSignal.timeout(model.timeoutMs),
      });
    } catch (err) {
      errors.push(`${model.name}: ${err?.name === "TimeoutError" ? "timeout" : err?.message}`);
      continue;
    }
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      const text = data.candidates?.[0]?.content?.parts?.filter((p) => !p.thought).map((p) => p.text || "").join("") || "";
      try {
        return { out: JSON.parse(text), model: model.name };
      } catch {
        errors.push(`${model.name}: bad JSON`);
        continue;
      }
    }
    errors.push(`${model.name} ${res.status}: ${data.error?.message || ""}`);
  }
  throw new Error(`Gemini — ${errors.join(" | ")}`);
}

// AI output → the shapes the editor keeps (lists as lines, numbers as text).
function toEditor(field, v) {
  if (v == null) return undefined;
  if (field.kind === "list") return Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean).join("\n") : String(v);
  if (field.kind === "number") return Number.isFinite(Number(v)) ? String(v) : undefined;
  if (field.kind === "chips") return Array.isArray(v) ? v.filter((x) => field.options.includes(x)) : undefined;
  if (field.kind === "select") return field.options.includes(v) ? v : undefined;
  if (field.kind === "check") return v === true;
  return String(v).trim();
}

export async function generateListing({ listing, brief, tour, mode }) {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY არ არის Vercel-ში.");
  brief = clip(String(brief || "").trim(), 20000);
  const tourText = siteTourText(tour);
  const current = currentValues(listing || {});
  if (!brief && !tourText && !Object.keys(current).length) {
    throw new Error("ჩაწერე ტექსტი ზემოთ ან აირჩიე ტური საიტიდან — AI-ს შესავსები მასალა არ აქვს.");
  }
  const fix = mode === "fix";
  const vehicles = Object.entries(listing?.vehicles || {})
    .filter(([, v]) => v?.on)
    .map(([k, v]) => `${k} (up to ${v.pax} people)`)
    .join(", ");
  const prompt = [
    `Tour format: ${listing?.format === "group" ? `group tour, ${listing?.group?.min || 1}–${listing?.group?.max || 19} people` : `private tour by car${vehicles ? `: ${vehicles}` : ""}`}.`,
    brief && `Owner's brief (may be in Georgian, Russian or English — the most important source):\n${brief}`,
    tourText && `The tour on our website (JSON, texts in ka/en/ru):\n${tourText}`,
    Object.keys(current).length && `Current values in the listing:\n${clip(JSON.stringify(current), 30000)}`,
    fix
      ? "Task: return EVERY field. Keep correct current values, rewrite weak ones, fix wrong language, length limits, grammar and facts that contradict the brief, and fill the empty ones. List in notes (Georgian) what you changed."
      : `Task: fill only the fields that are empty now (not in "Current values"; for two-site fields also the empty site). Do not return fields that are already filled. In notes (Georgian), list what the owner should check.`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const { out, model } = await generate(prompt, buildSchema());

  const fields = {};
  for (const f of AI_FIELDS) {
    const raw = out[f.key];
    if (raw == null) continue;
    if (f.split) {
      const obj = {};
      for (const p of f.p) {
        const v = toEditor(f, raw?.[p]);
        if (v) obj[p] = v;
      }
      if (Object.keys(obj).length) fields[f.key] = obj;
    } else {
      const v = toEditor(f, raw);
      if (v !== undefined && v !== "" && !(Array.isArray(v) && !v.length)) fields[f.key] = v;
    }
  }
  return {
    fields,
    name: String(out.name || "").trim().slice(0, 120),
    notes: Array.isArray(out.notes) ? out.notes.map(String).slice(0, 30) : [],
    model,
  };
}
