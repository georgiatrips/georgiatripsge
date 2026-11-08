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

// `only` = "gyg" / "tripster": just that site's fields.
const fieldsFor = (only) => AI_FIELDS.filter((f) => !only || f.p.includes(only));
const platsFor = (f, only) => f.p.filter((p) => !only || p === only);

function buildSchema(only) {
  const properties = {
    name: { type: "STRING", description: "Short internal name of the tour in Georgian (for our admin only)" },
    notes: { type: "ARRAY", items: { type: "STRING" }, description: "In Georgian: what you changed or fixed and anything the owner must check by hand (facts you were unsure about). Short points." },
  };
  for (const f of fieldsFor(only)) {
    if (f.split) {
      const sub = {};
      for (const p of platsFor(f, only)) sub[p] = schemaFor(f, p);
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

async function generate(prompt, schema, { system = SYSTEM, models = MODELS } = {}) {
  const errors = [];
  for (const model of models) {
    let res;
    try {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model.name}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
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

export async function generateListing({ listing, brief, tour, mode, only }) {
  if (!["gyg", "tripster"].includes(only)) only = undefined;
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

  const { out, model } = await generate(prompt, buildSchema(only));

  const fields = {};
  for (const f of fieldsFor(only)) {
    const raw = out[f.key];
    if (raw == null) continue;
    if (f.split) {
      const obj = {};
      for (const p of platsFor(f, only)) {
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

// ── GT Sync extension: fill what the rules could not ─────────────────
// The extension sends the empty fields of the GYG / Tripster page it is on
// (question, kind, choices) and our tour's values; the answer says which
// value goes into which field. Fast models first: the person is waiting.
const MAP_MODELS = [
  { name: "gemini-3.5-flash-lite", thinkingLevel: "low", timeoutMs: 30000 },
  { name: "gemini-3.5-flash", thinkingLevel: "low", timeoutMs: 40000 },
  { name: "gemini-3.1-flash-lite", thinkingLevel: "minimal", timeoutMs: 25000 },
];

const MAP_SYSTEM = `You fill a tour upload form on a travel marketplace (GetYourGuide supplier portal in English, or Tripster editor in Russian) for GeorgiaTrips, a tour company in Batumi, Georgia (private tours by car with a driver, hotel pick-up).
You get the empty fields of the current page and the tour's prepared values. For each field you can answer, return its ref and the value:
- text / textarea / number: the text to type, in the form's language (GetYourGuide: English, Tripster: Russian). Numbers as digits only.
- radio: exactly one of the given options (copy its text).
- dropdown: the visible text of the choice to pick (short, as the site would show it, e.g. "Hour(s)", "Georgia (+995)", "English").
- search: one item per line, each a short search term the site's list will know (e.g. "Batumi", "Makhuntseti Waterfall").
Rules: use only the tour's values and plain common sense about it. Never invent prices, phone numbers, IBAN, documents, dates or legal statements; leave those fields out. Leave out fields you are not sure about, search boxes of the site header, and anything about payments or accounts. "notes" is one short sentence in Georgian for the owner (what you left and why), or empty.`;

const MAP_SCHEMA = {
  type: "OBJECT",
  properties: {
    fills: {
      type: "ARRAY",
      items: { type: "OBJECT", properties: { ref: { type: "INTEGER" }, value: { type: "STRING" } }, required: ["ref", "value"] },
    },
    notes: { type: "STRING" },
  },
  required: ["fills"],
};

export async function mapPage({ platform, page, values, options, activeOption }) {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY არ არის Vercel-ში.");
  const items = Array.isArray(page?.items) ? page.items.slice(0, 60) : [];
  if (!items.length) return { fills: [], notes: "" };
  const site = platform === "gyg" ? "GetYourGuide (write in English)" : "Tripster (write in Russian)";
  const opt = Number.isInteger(activeOption) && Array.isArray(options) ? options[activeOption] : null;
  const prompt = [
    `Site: ${site}. Page: ${clip(page.url, 200)} — ${clip(page.heading, 300)}`,
    `Empty fields on this page:
${clip(JSON.stringify(items), 20000)}`,
    `Tour values:
${clip(JSON.stringify(values || []), 30000)}`,
    Array.isArray(options) && options.length && `Options / vehicles (prices in ${platform === "gyg" ? "the option currency" : "EUR"}):
${clip(JSON.stringify(options), 4000)}`,
    opt && `The option being edited now: ${clip(JSON.stringify(opt), 1500)}`,
  ]
    .filter(Boolean)
    .join("\n\n");
  const { out, model } = await generate(prompt, MAP_SCHEMA, { system: MAP_SYSTEM, models: MAP_MODELS });
  const refs = new Set(items.map((i) => i.ref));
  const fills = (Array.isArray(out.fills) ? out.fills : [])
    .filter((f) => refs.has(f.ref) && String(f.value ?? "").trim())
    .map((f) => ({ ref: f.ref, value: String(f.value).slice(0, 3000) }));
  return { fills, notes: String(out.notes || "").slice(0, 400), model };
}

// ── GT Sync extension: the supervisor before / after Continue ─────────
// Gets every message on the page, every field with its value and our tour's
// values; decides whether a message is a real problem, fixes what it can,
// and says when only the owner can decide.
const REVIEW_SYSTEM = `You supervise an assistant that fills a tour listing form for GeorgiaTrips (Batumi, Georgia; private tours by car with a driver, hotel pick-up) on GetYourGuide (supplier portal, English) or Tripster (editor, Russian).
You get: the messages visible on the current page (errors, warnings, notices, help texts), every field with its current value (empty / flagged = marked invalid by the site), and the tour's prepared values.
Decide:
- Most notices are guidance ("any obligatory fees must be included in the price…", "we customize the product creation process…", tips, character counters). They are NOT problems: if nothing on the page contradicts them, decision "continue".
- A real problem is a field the site marks invalid or empty-but-required, a value that breaks a rule shown on the page (too short/long, wrong format, forbidden content such as prices, phone numbers or extra fees in a text that must not contain them), or a required choice that is missing.
- Radio groups where the site marked every option invalid while nothing is chosen just mean "choose one": pick the option that fits the tour (e.g. duration, not validity, for a tour with fixed hours).
- Fix what you can from the tour's values and common sense: return fixes as {ref, value} (text in the form's language; radio = copy one option's text; dropdown = the text to pick; search = one term per line). Only fix empty or flagged fields, or a text that clearly breaks a rule shown on the page. Never change a choice the owner already made unless the site marks it invalid.
- decision "stop" only when the owner must decide or provide something you do not have: prices, legal/tax/bank data, documents, contract terms, real facts that are missing, accepting terms, or a conflict between the page and the tour values. Then "say" explains in one or two short Georgian sentences exactly what the owner should do.
- reason "continue_failed" means Continue was pressed and the page did not move on: find what blocks it (look at empty/flagged fields) and fix it, or stop with an explanation.
"say" is always Georgian, short, concrete (which field, what to do). Never invent prices, phone numbers, IBAN, documents or dates.`;

const REVIEW_SCHEMA = {
  type: "OBJECT",
  properties: {
    decision: { type: "STRING", enum: ["continue", "stop"] },
    fixes: {
      type: "ARRAY",
      items: { type: "OBJECT", properties: { ref: { type: "INTEGER" }, value: { type: "STRING" } }, required: ["ref", "value"] },
    },
    say: { type: "STRING", description: "Georgian, for the owner" },
  },
  required: ["decision"],
  propertyOrdering: ["decision", "fixes", "say"],
};

export async function reviewPage({ platform, reason, page, values, options, activeOption }) {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY არ არის Vercel-ში.");
  const items = Array.isArray(page?.items) ? page.items.slice(0, 80) : [];
  const messages = Array.isArray(page?.messages) ? page.messages.slice(0, 25) : [];
  const site = platform === "gyg" ? "GetYourGuide (English)" : "Tripster (Russian)";
  const opt = Number.isInteger(activeOption) && Array.isArray(options) ? options[activeOption] : null;
  const prompt = [
    `Site: ${site}. Page: ${clip(page?.url, 200)} — ${clip(page?.heading, 300)}. Reason: ${reason === "continue_failed" ? "continue_failed" : "before_continue"}.`,
    `Messages on the page:\n${clip(JSON.stringify(messages), 8000)}`,
    `Fields on the page (ref, kind, question, value, empty, flagged, options):\n${clip(JSON.stringify(items), 20000)}`,
    `Tour values:\n${clip(JSON.stringify(values || []), 25000)}`,
    Array.isArray(options) && options.length && `Options / vehicles:\n${clip(JSON.stringify(options), 3000)}`,
    opt && `Option being edited: ${clip(JSON.stringify(opt), 1500)}`,
  ]
    .filter(Boolean)
    .join("\n\n");
  const { out, model } = await generate(prompt, REVIEW_SCHEMA, { system: REVIEW_SYSTEM, models: MAP_MODELS });
  const refs = new Set(items.map((i) => i.ref));
  const fixes = (Array.isArray(out.fixes) ? out.fixes : [])
    .filter((f) => refs.has(f.ref) && String(f.value ?? "").trim())
    .map((f) => ({ ref: f.ref, value: String(f.value).slice(0, 3000) }));
  return { decision: out.decision === "stop" ? "stop" : "continue", fixes, say: String(out.say || "").slice(0, 400), model };
}


// ── Script for GetYourGuide: an answer to every question of GYG's form ─
// GYG's product form starts with an "AI content creator" box (700–5000
// characters); GYG fills its sections from that text. The script answers
// every question GYG asks, section by section, in the form's own order:
// the model must answer each one (all keys are required in the schema), and
// if it still leaves one empty, the code writes a safe default from what we
// know about the listing / GeorgiaTrips. So no question is ever unanswered.

const LANG_EN = { "Русский": "Russian", English: "English", "ქართული": "Georgian", "Türkçe": "Turkish", "العربية": "Arabic", Deutsch: "German" };
const VEHICLE_PAX = { sedan: 3, minivan: 7, jeep: 4, sprinter: 18 };
const YES_NO = ["Yes", "No"];
const DEFAULT_KEYWORDS = ["Nature", "Scenic", "Day trip", "Private tour", "Local culture", "Mountains", "Waterfalls", "Countryside", "Photography", "Family friendly", "Sightseeing", "History", "Food", "Off the beaten path", "Road trip"];
const DEFAULT_HIGHLIGHTS = [
  "Travel at your own pace in a private car with a local driver",
  "Convenient pick-up and drop-off at your hotel in Batumi",
  "Stop wherever you like for photos along the way",
];

/** Facts we already know, used as defaults and given to the model. */
function scriptFacts(listing) {
  const f = listing?.fields || {};
  const group = listing?.format === "group";
  const on = Object.entries(listing?.vehicles || {}).filter(([, v]) => v?.on);
  const maxPax = group
    ? Number(listing?.group?.max) || 18
    : Math.max(0, ...on.map(([k, v]) => Number(v.pax) || VEHICLE_PAX[k] || 0)) || 3;
  const langs = (Array.isArray(f.languages) && f.languages.length ? f.languages : ["English", "Русский"]).map((l) => LANG_EN[l] || l);
  const hours = Number(f.durationHours) || null;
  const cutoff = Number(f.cutoffHours) || 12;
  const pickup = f.meetingMode !== "შეხვედრის ადგილი";
  return {
    group,
    maxPax,
    langs,
    hours,
    cutoff,
    pickup,
    phone: String(f.gygEmergency || "+995 504220020").slice(0, 35),
    vehicles: on.map(([k]) => k),
    kidsFrom: f.kidsFrom != null && f.kidsFrom !== "" ? Number(f.kidsFrom) : null,
  };
}

// Every question of GYG's product form. `t`: text | list | enum | number.
// `d(facts)` = the default when the model leaves it empty. `to` = the field of
// our editor the answer also fills (only if that field is empty).
const GYG_QUESTIONS = [
  // ── Product basics
  { s: "PRODUCT", k: "category", t: "enum", o: ["Tour", "Tour (more than one day)", "Entry ticket", "Transport experience", "Other"], q: "Product category", d: () => "Tour", to: "gygCategory" },
  { s: "PRODUCT", k: "title", q: "Title", g: "Format \"Location: Activity Type with key inclusions and unique selling points\", e.g. \"From Batumi: Private Mountain Adjara Tour with Waterfall and Wine Tasting\". Title Case, max 75 characters.", d: () => "From Batumi: Private Day Tour by Car with Local Driver", to: "title.gyg" },
  { s: "PRODUCT", k: "short", q: "Short description", g: "2–3 sentences, max 200 characters, gives a taste of what they will do.", to: "gygShort" },
  { s: "PRODUCT", k: "full", q: "Full description", g: "All details of what customers see and experience, in the correct order, vivid but factual, 600–950 characters.", to: "gygFull" },
  { s: "PRODUCT", k: "highlights", t: "list", q: "Highlights", g: "3–5 sentences, each max 80 characters, what makes it stand out from competitors.", min: 3, max: 5, d: () => DEFAULT_HIGHLIGHTS, to: "gygHighlights" },
  { s: "PRODUCT", k: "itinerary", t: "list", q: "Itinerary", g: "Every stop in order with approximate time spent, e.g. \"Pick-up from your hotel in Batumi\", \"Makhuntseti Waterfall — 40 minutes\", \"Return to Batumi\".", d: (x, a) => ["Pick-up from your hotel in Batumi", ...(a.locations || []).filter((l) => !/^batumi$/i.test(l)), "Drop-off at your hotel in Batumi"], to: "route.gyg" },
  { s: "PRODUCT", k: "locations", t: "list", q: "Where will customers visit?", g: "Every city, site and attraction, exact well-known English name + municipality, e.g. \"Makhuntseti Waterfall, Keda\", \"Batumi\". As many relevant ones as possible.", to: "gygLocations" },
  { s: "PRODUCT", k: "keywords", t: "list", q: "Keywords", g: "Exactly 15 short theme tags customers search by, e.g. Nature, Waterfalls, Mountains, Wine, Local culture, Scenic, Day trip, Private tour, Photography, Family friendly, History, Hiking, Countryside, Food, Off the beaten path.", min: 15, max: 15, d: () => DEFAULT_KEYWORDS, to: "gygKeywords" },
  { s: "PRODUCT", k: "differentCity", t: "enum", o: YES_NO, q: "Travel to a different city/town", d: () => "Yes", to: "gygOutsideCity" },

  // ── Inclusions & exclusions
  { s: "INCLUSIONS & EXCLUSIONS", k: "included", t: "list", q: "What's included?", g: "Everything included in the price, one per line, consistent with the descriptions (e.g. hotel pick-up and drop-off, private air-conditioned vehicle, local driver, fuel and parking).", d: () => ["Hotel pick-up and drop-off in Batumi", "Private air-conditioned vehicle", "Local English/Russian-speaking driver", "Fuel and parking fees"], to: "gygIncl" },
  { s: "INCLUSIONS & EXCLUSIONS", k: "notIncluded", t: "list", q: "What's not included?", g: "Optional fees customers may meet: food and drinks, entrance fees, tips, personal expenses…", d: () => ["Food and drinks", "Entrance fees (if any)", "Tips", "Personal expenses"], to: "gygExcl" },
  { s: "INCLUSIONS & EXCLUSIONS", k: "food", t: "enum", o: YES_NO, q: "Food included", d: () => "No", to: "gygFood" },
  { s: "INCLUSIONS & EXCLUSIONS", k: "foodDetails", q: "Food & drinks details", g: "If food is included: what exactly (e.g. wine tasting, lunch). If not: where customers can buy food on the way.", d: () => "Food is not included; there are stops where you can buy lunch and drinks at your own expense." },
  { s: "INCLUSIONS & EXCLUSIONS", k: "transportUsed", t: "enum", o: YES_NO, q: "Transportation used during activity", d: () => "Yes", to: "gygTransportUsed" },
  { s: "INCLUSIONS & EXCLUSIONS", k: "transportType", q: "Main transportation type", g: "Short, e.g. \"Car\", \"Minivan\", \"Minibus\", \"4x4 vehicle\".", d: (x) => (x.group ? "Minibus" : "Car") },

  // ── Guide information
  { s: "GUIDE", k: "whoLeads", t: "enum", o: ["Live guide or other staff member", "No guide", "Audio guide included"], q: "Who leads the activity", d: () => "Live guide or other staff member", to: "gygGuide" },
  { s: "GUIDE", k: "role", t: "enum", o: ["Driver", "Tour guide", "Host or Greeter", "Instructor"], q: "Staff role", g: "Our tours are led by a local driver who shares stories → usually \"Driver\" (\"Tour guide\" only if the brief says a guide joins).", d: () => "Driver", to: "gygGuideRole" },
  { s: "GUIDE", k: "extraStaff", q: "Additional staff", g: "Other roles if any (e.g. \"Tour guide in addition to the driver\"), otherwise \"None\".", d: () => "None" },
  { s: "GUIDE", k: "guideDesc", q: "Guide / driver description", g: "Max 120 characters: what the driver/guide does during the activity.", d: () => "Drives you between the stops and shares local stories and tips along the way.", to: "gygGuideDesc" },
  { s: "GUIDE", k: "years", t: "number", q: "Average years of experience", g: "Use the brief / listing value; if unknown give a realistic number for experienced local drivers and say so in notes.", d: () => 5, to: "gygGuideYears" },
  { s: "GUIDE", k: "certs", t: "list", q: "Certifications, licenses and expertise", g: "Only credentials most of the team holds, e.g. \"Professional driving licence\". If unknown, write \"Professional driving licence\" and mention it in notes.", d: () => ["Professional driving licence"], to: "gygCerts" },
  { s: "GUIDE", k: "firstAid", t: "enum", o: YES_NO, q: "First-aid certified", d: () => "No", to: "gygFirstAid" },
  { s: "GUIDE", k: "local", t: "enum", o: YES_NO, q: "Guides are locals", d: () => "Yes" },
  { s: "GUIDE", k: "team", q: "What sets our team apart", g: "Specific: local knowledge, born in Adjara, know the mountain roads, speak Russian and English…", d: () => "Our drivers were born and raised in Adjara, know every mountain road and village, and share local stories, food tips and the best photo spots.", to: "gygTeam" },

  // ── Important information
  { s: "IMPORTANT INFORMATION", k: "notSuitable", t: "list", q: "Not suitable for", g: "E.g. Wheelchair users, People with mobility impairments, Pregnant women, People with back problems, Children under 3 — only what fits this tour.", d: () => ["Wheelchair users", "People with mobility impairments"], to: "gygNotSuitable" },
  { s: "IMPORTANT INFORMATION", k: "notAllowed", t: "list", q: "What's not allowed?", g: "Objects, clothing or actions, e.g. Smoking in the vehicle, Pets, Littering.", d: () => ["Smoking in the vehicle", "Littering"], to: "gygNotAllowed" },
  { s: "IMPORTANT INFORMATION", k: "pets", q: "Pet policy", g: "One or two sentences, max 1000 characters.", d: () => "Pets are not allowed, except service animals.", to: "gygPets" },
  { s: "IMPORTANT INFORMATION", k: "bring", t: "list", q: "Mandatory items to bring", g: "E.g. Comfortable shoes, Passport or ID card, Weather-appropriate clothing, Cash.", d: () => ["Comfortable shoes", "Weather-appropriate clothing", "Passport or ID card", "Cash for food and entrance fees"], to: "gygBring" },
  { s: "IMPORTANT INFORMATION", k: "know", t: "list", q: "Know before you go", g: "Practical points: weather, road conditions, flexible stops, exact pick-up time is confirmed the day before, etc.", d: () => ["The exact pick-up time will be confirmed the day before the tour.", "Mountain roads can be winding; tell us if you get car sick.", "The itinerary may change slightly because of weather or road conditions."], to: "gygKnow" },
  { s: "IMPORTANT INFORMATION", k: "emergency", q: "Emergency contact", g: "Our phone exactly as given, max 35 characters.", d: (x) => x.phone, to: "gygEmergency", fixed: true },
  { s: "IMPORTANT INFORMATION", k: "ticket", q: "Ticket information", g: "Logistics customers see after booking: send hotel name via WhatsApp, driver will contact you, be ready in the lobby 10 minutes early…", d: (x) => `Please send us your hotel name or address on WhatsApp (${x.phone}) after booking. Your driver will meet you in the hotel lobby; please be ready 10 minutes before the pick-up time.`, to: "gygVoucher" },
  { s: "IMPORTANT INFORMATION", k: "cancellation", q: "Cancellation policy", d: () => "Free cancellation up to 24 hours before the start of the activity." },

  // ── Booking option
  { s: "BOOKING OPTION", k: "optionTitle", q: "Option title", g: "E.g. \"Private Tour by Sedan (up to 3 people)\" or \"Small-Group Tour\".", d: (x) => (x.group ? "Small-Group Tour" : `Private Tour by Car (up to ${x.maxPax} people)`) },
  { s: "BOOKING OPTION", k: "optionRef", q: "Option reference code", g: "Max 20 characters, letters/digits/dashes, e.g. BUS-ADJARA-PRIV.", d: (x) => (x.group ? "GT-GROUP" : "GT-PRIVATE") },
  { s: "BOOKING OPTION", k: "maxGroup", t: "number", q: "Maximum group size", d: (x) => x.maxPax },
  { s: "BOOKING OPTION", k: "languages", t: "list", q: "Languages", g: "English names of the languages the driver/guide speaks.", d: (x) => x.langs },
  { s: "BOOKING OPTION", k: "private", t: "enum", o: YES_NO, q: "Private activity", d: (x) => (x.group ? "No" : "Yes") },
  { s: "BOOKING OPTION", k: "skipLine", t: "enum", o: YES_NO, q: "Skip-the-line access", d: () => "No", to: "gygSkipLine" },
  { s: "BOOKING OPTION", k: "wheelchair", t: "enum", o: YES_NO, q: "Wheelchair accessible", d: () => "No", to: "gygWheelchair" },
  { s: "BOOKING OPTION", k: "durationType", t: "enum", o: ["Duration", "Validity"], q: "Duration or validity", d: () => "Duration" },
  { s: "BOOKING OPTION", k: "duration", t: "number", q: "Duration (hours, incl. transfers)", d: (x) => x.hours || 8, to: "durationHours" },

  // ── Meeting point or pickup
  { s: "MEETING POINT OR PICKUP", k: "howArrive", t: "enum", o: ["They get picked up (by car, bus, etc.)", "They go to the starting point by themselves (meeting point)"], q: "How customers get there", d: (x) => (x.pickup ? "They get picked up (by car, bus, etc.)" : "They go to the starting point by themselves (meeting point)") },
  { s: "MEETING POINT OR PICKUP", k: "pickupWhere", t: "enum", o: ["From any address within a specific area", "From a defined list of pickup locations"], q: "Pickup from", d: () => "From any address within a specific area" },
  { s: "MEETING POINT OR PICKUP", k: "pickupArea", q: "Pickup area", d: () => "Any hotel, apartment or address in Batumi city (including Batumi Airport)", to: "gygPickupArea" },
  { s: "MEETING POINT OR PICKUP", k: "pickupWhen", t: "enum", o: ["At the activity start time", "Before the activity starts"], q: "Pickup timing", d: () => "At the activity start time" },
  { s: "MEETING POINT OR PICKUP", k: "pickupConfirm", t: "enum", o: ["The day before the activity takes place", "Directly after customer selects pickup location"], q: "Final pickup confirmation", d: () => "The day before the activity takes place" },
  { s: "MEETING POINT OR PICKUP", k: "pickupTime", q: "Usual pickup time", g: "E.g. \"Between 08:30 and 09:30\" (from the schedule if given).", d: () => "Between 08:30 and 09:30" },
  { s: "MEETING POINT OR PICKUP", k: "pickupDesc", q: "Describe your pickup", g: "What to look for and where to wait, max 1000 characters.", d: () => "Wait in your hotel lobby or at the entrance. Your driver will message you on WhatsApp when arriving and will look for you with a GeorgiaTrips sign." },
  { s: "MEETING POINT OR PICKUP", k: "dropoff", t: "enum", o: ["At the same place you picked them up", "At a different place", "No drop-off service"], q: "Drop-off", d: () => "At the same place you picked them up" },
  { s: "MEETING POINT OR PICKUP", k: "pickupTransport", q: "Pickup/drop-off transport", d: (x) => (x.group ? "Minibus" : "Private car") },

  // ── Availability & pricing
  { s: "AVAILABILITY & PRICING", k: "reservationSystem", t: "enum", o: ["No, I don't", "Yes, I use a reservation system"], q: "Online reservation system", d: () => "No, I don't" },
  { s: "AVAILABILITY & PRICING", k: "availability", t: "enum", o: ["Time slots", "Opening hours"], q: "Availability type", d: () => "Time slots" },
  { s: "AVAILABILITY & PRICING", k: "startTimes", q: "Start times / days", g: "From the schedule if given, else \"Daily at 09:00\".", d: () => "Daily at 09:00" },
  { s: "AVAILABILITY & PRICING", k: "priceType", t: "enum", o: ["Price per person", "Price per group/vehicle"], q: "Pricing type", d: (x) => (x.group ? "Price per person" : "Price per group/vehicle") },
  { s: "AVAILABILITY & PRICING", k: "ageGroups", q: "Age categories", g: "E.g. \"Adult 18–99, Child 4–17, Infant 0–3 (free)\".", d: (x) => (x.kidsFrom ? `Adult 18–99, Child ${x.kidsFrom}–17` : "Adult 18–99, Child 4–17, Infant 0–3 (free)"), to: "gygChildAges" },
  { s: "AVAILABILITY & PRICING", k: "cutoff", t: "number", q: "Cut-off time (hours before start)", d: (x) => x.cutoff, to: "cutoffHours" },
  { s: "AVAILABILITY & PRICING", k: "lastMinute", t: "enum", o: YES_NO, q: "Last-minute bookings after first booking", d: () => "Yes" },
  { s: "AVAILABILITY & PRICING", k: "slotCutoffs", t: "enum", o: YES_NO, q: "Different cut-off per time slot", d: () => "No" },
];

const SCRIPT_SYSTEM = `You fill in the full GetYourGuide product form for GeorgiaTrips (georgiatrips.ge, Batumi, Georgia): private tours by car with a local driver, small-group tours by minibus, pick-up from hotels in Batumi, WhatsApp contact.
You answer EVERY question of the schema — no empty answers, no "N/A", no "unknown". Write in clear, natural English, no emojis, no markdown, no prices, links or discount talk (only the emergency field and ticket info may contain our phone).
Use the owner's brief, the website tour and the listing values first. Where they say nothing, give the answer that a typical GeorgiaTrips private car tour from Batumi would have (well-known facts about the places are fine). Never invent numbers you are not given — distances, opening hours, prices; for years of experience and certifications follow the field notes.
Keep the whole answer set compact: total under 4500 characters.
"notes" (Georgian, short points) lists every answer you guessed or the owner must check (e.g. years of experience, start times, inclusions).`;

function scriptSchema() {
  const properties = {};
  for (const q of GYG_QUESTIONS) {
    const description = [q.q, q.g].filter(Boolean).join(" — ");
    if (q.t === "enum") properties[q.k] = { type: "STRING", enum: q.o, description };
    else if (q.t === "list") properties[q.k] = { type: "ARRAY", items: { type: "STRING" }, description };
    else if (q.t === "number") properties[q.k] = { type: "NUMBER", description };
    else properties[q.k] = { type: "STRING", description };
  }
  properties.notes = { type: "ARRAY", items: { type: "STRING" }, description: "Georgian: what was guessed / must be checked" };
  const keys = GYG_QUESTIONS.map((q) => q.k);
  return { type: "OBJECT", properties, required: keys, propertyOrdering: [...keys, "notes"] };
}

/** The model's answer, or the default — never empty; lists padded / cut to GYG's counts. */
function answerOf(q, raw, facts, answers) {
  if (q.fixed) return q.d(facts, answers);
  let v = raw;
  if (q.t === "list") v = (Array.isArray(v) ? v : String(v || "").split("\n")).map((x) => String(x).trim()).filter(Boolean);
  else if (q.t === "number") v = Number(v) > 0 ? Math.round(Number(v) * 10) / 10 : null;
  else if (q.t === "enum") v = q.o.includes(v) ? v : null;
  else v = String(v || "").trim();
  const empty = v == null || v === "" || (Array.isArray(v) && !v.length) || /^(n\/?a|unknown|none\.?)$/i.test(String(v)) && q.k !== "extraStaff";
  if (empty) return q.d ? q.d(facts, answers) : null;
  if (q.t === "list" && q.min && v.length < q.min && q.d) {
    const seen = new Set(v.map((x) => x.toLowerCase()));
    for (const x of q.d(facts, answers)) if (v.length < q.min && !seen.has(x.toLowerCase())) v.push(x);
  }
  if (q.t === "list" && q.max) v = v.slice(0, q.max);
  return v;
}

// Short lists go on one line ("Keywords: Nature, Scenic, …") to stay under 5000.
const INLINE_LISTS = new Set(["keywords", "languages", "notSuitable", "notAllowed", "bring", "certs", "locations"]);

function buildScriptText(answers) {
  const lines = [];
  let section = "";
  for (const q of GYG_QUESTIONS) {
    const v = answers[q.k];
    if (v == null || v === "") continue;
    if (q.s !== section) {
      section = q.s;
      lines.push("", section);
    }
    if (Array.isArray(v) && INLINE_LISTS.has(q.k)) lines.push(`${q.q}: ${v.join("; ")}`);
    else if (Array.isArray(v)) lines.push(`${q.q}:`, ...v.map((x) => `- ${x}`));
    else lines.push(`${q.q}: ${v}`);
  }
  return lines.join("\n").trim();
}

// Answers → the editor's own fields (applied by the panel only where empty).
function scriptToFields(answers) {
  const byKey = Object.fromEntries(ALL_FIELDS.map((f) => [f.key, f]));
  const out = {};
  for (const q of GYG_QUESTIONS) {
    if (!q.to) continue;
    const [key, sub] = q.to.split(".");
    const field = byKey[key];
    let v = answers[q.k];
    if (!field || v == null) continue;
    if (field.kind === "check") v = v === "Yes";
    else if (field.kind === "chips") v = (Array.isArray(v) ? v : [v]).filter((x) => field.options.includes(x));
    else if (field.kind === "list") v = (Array.isArray(v) ? v : [v]).join("\n");
    else if (field.kind === "textarea" || field.kind === "text") v = Array.isArray(v) ? v.join("\n") : String(v);
    else if (field.kind === "number") v = String(v);
    else if (field.kind === "select" && !field.options.includes(v)) continue;
    if (v === "" || (Array.isArray(v) && !v.length)) continue;
    if (sub) out[key] = { ...(out[key] || {}), [sub]: v };
    else out[key] = v;
  }
  return out;
}

export async function gygScript({ listing, brief, tour }) {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY არ არის Vercel-ში.");
  brief = clip(String(brief || "").trim(), 20000);
  const tourText = siteTourText(tour);
  const current = currentValues(listing || {});
  if (!brief && !tourText && !Object.keys(current).length) {
    throw new Error("ჩაწერე ტექსტი ზემოთ ან აირჩიე ტური საიტიდან — AI-ს მასალა არ აქვს.");
  }
  const facts = scriptFacts(listing);
  const prompt = [
    `Format: ${facts.group ? `group tour, ${listing?.group?.min || 1}–${facts.maxPax} people` : `private tour by car${facts.vehicles.length ? `: ${facts.vehicles.join(", ")}` : ""}, max ${facts.maxPax} people`}.`,
    `Known facts: languages ${facts.langs.join(", ")}; ${facts.hours ? `duration ${facts.hours} h; ` : ""}cut-off ${facts.cutoff} h; ${facts.pickup ? "hotel pick-up in Batumi" : "meeting point"}; emergency phone ${facts.phone}${facts.kidsFrom != null ? `; children from ${facts.kidsFrom}` : ""}.`,
    brief && `Owner's brief (any language — the most important source):\n${brief}`,
    tourText && `The tour on our website (JSON, texts in ka/en/ru):\n${tourText}`,
    Object.keys(current).length && `Values already in the listing:\n${clip(JSON.stringify(current), 25000)}`,
    "Task: answer every question of the schema for this tour.",
  ]
    .filter(Boolean)
    .join("\n\n");

  const { out, model } = await generate(prompt, scriptSchema(), { system: SCRIPT_SYSTEM });
  const answers = {};
  const defaulted = [];
  for (const q of GYG_QUESTIONS) {
    const raw = out[q.k];
    answers[q.k] = answerOf(q, raw, facts, answers);
    const rawEmpty = raw == null || raw === "" || raw === 0 || (Array.isArray(raw) && !raw.length);
    if (!q.fixed && rawEmpty && answers[q.k] != null) defaulted.push(q.q);
  }
  if (!String(answers.full || "").trim() || String(answers.full).length < 300) {
    throw new Error("AI-მ სრული აღწერა ვერ დაწერა — დაამატე მეტი დეტალი და სცადე ისევ.");
  }
  const text = buildScriptText(answers);
  const notes = Array.isArray(out.notes) ? out.notes.map(String).slice(0, 15) : [];
  if (defaulted.length) notes.push(`სტანდარტული პასუხი ჩაიწერა (შეამოწმე): ${defaulted.join("; ")}`);
  if (text.length > 5000) notes.push(`ტექსტი ${text.length} სიმბოლოა — GYG-ის ველში მაქს. 5000; შეამოკლე სრული აღწერა ან მარშრუტი.`);
  return { text, answers, fields: scriptToFields(answers), notes, model };
}
