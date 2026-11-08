// Finds photos of one place in Georgia on Wikimedia Commons, Flickr,
// Unsplash, Pexels and Pixabay, keeping only photos whose title, description,
// tags or GPS position prove they show that place (see app/lib/server/photoSearch.js).
//
//   npm run photos -- გოდერძი
//   npm run photos -- "Goderdzi Pass" --download          → photo-search/<query>/1.jpg … + credits.txt
//   npm run photos -- გოდერძი --json > goderdzi.json
//   npm run photos -- გოდერძი --only wikimedia,flickr
//   --mentions  also photos that only mention the place in their description
//   --rejected  print what was dropped and why
//
// API keys are read from .env.local: FLICKR_API_KEY, UNSPLASH_ACCESS_KEY,
// PEXELS_API_KEY, PIXABAY_API_KEY. Wikimedia Commons needs none; Flickr
// without a key is searched through Openverse.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { searchPhotos, creditLine } from "../app/lib/server/photoSearch.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    const file = path.join(root, name);
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const query = args.filter((a, i) => !a.startsWith("--") && !["--only", "--out"].includes(args[i - 1])).join(" ");

if (!query) {
  console.log('გამოყენება: npm run photos -- <ადგილი> [--download] [--out <საქაღალდე>] [--only wikimedia,flickr,...] [--json] [--rejected]');
  process.exit(1);
}

loadEnv();
const only = option("--only")?.split(",").map((s) => s.trim());
const result = await searchPhotos(query, { sources: only });

if (flag("--json")) {
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

const { place, sources, photos, mentions, rejected } = result;
console.log(`\n🔎 „${result.query}“ — ძებნის სიტყვები: ${place.searchTerms.join(", ")}`);
if (place.items.length) {
  for (const p of place.items) {
    const pt = p.point ? ` (${p.point.lat.toFixed(4)}, ${p.point.lng.toFixed(4)})` : "";
    console.log(`   📍 ${p.label}${p.labelEn && p.labelEn !== p.label ? ` / ${p.labelEn}` : ""}${pt}${p.commonsCategory ? ` · Commons: ${p.commonsCategory}` : ""}`);
  }
} else {
  console.log("   ⚠️  Wikidata-ზე ადგილი ვერ მოიძებნა — მხოლოდ ტექსტით + საქართველოს კონტექსტით ვამოწმებ.");
}
console.log("");
for (const s of Object.values(sources)) {
  if (s.state === "no_key") console.log(`   ⛔ ${s.label}: API key არ არის (${s.env} → ${s.keyUrl})`);
  else if (s.state === "error") console.log(`   ❌ ${s.label}: ${s.error}`);
  else console.log(`   ✅ ${s.label}: ნაპოვნი ${s.found}, დამოწმებული ${s.kept}  [${s.via}]`);
}
console.log(`\n${photos.length} ფოტო (უარყოფილი ${rejected.length})\n`);

const list = flag("--mentions") ? [...photos, ...mentions] : photos;
list.forEach((p, i) => {
  console.log(`${String(i + 1).padStart(3)}. [${p.source}] ${p.title}`);
  console.log(`     ✔ ${p.match.why}${p.width ? ` · ${p.width}×${p.height}` : ""}`);
  console.log(`     ⬇ ${p.imageUrl}`);
  console.log(`     🔗 ${p.pageUrl}`);
  console.log(`     © ${creditLine(p)}`);
});

if (flag("--rejected")) {
  console.log("\nუარყოფილი:");
  for (const r of rejected) console.log(`   ✖ [${r.source}] ${r.title} — ${r.why}`);
}

if (flag("--download") && list.length) {
  const safe = result.query.replace(/[<>:"/\\|?*]+/g, "_");
  const dir = path.resolve(option("--out") || path.join(root, "photo-search", safe));
  fs.mkdirSync(dir, { recursive: true });
  const credits = [];
  let n = 0;
  for (const p of list) {
    try {
      if (p.downloadTrack && process.env.UNSPLASH_ACCESS_KEY) {
        // Unsplash API terms: report every download.
        await fetch(p.downloadTrack, { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } }).catch(() => {});
      }
      const res = await fetch(p.imageUrl, { headers: { "User-Agent": "GeorgiaTripsPhotoSearch/1.0 (https://www.georgiatrips.ge)" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const type = res.headers.get("content-type") || "";
      const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
      const file = `${++n}.${ext}`;
      fs.writeFileSync(path.join(dir, file), Buffer.from(await res.arrayBuffer()));
      // Same line format scripts/import-blog-photos.js reads.
      credits.push(`${file} — ${p.title || "-"} — ${p.author || "-"} — ${p.license} — ${p.pageUrl}`);
      process.stdout.write(`\r⬇ ${n}/${list.length}`);
    } catch (err) {
      console.log(`\n   ✖ ${p.imageUrl}: ${err.message}`);
    }
  }
  fs.writeFileSync(path.join(dir, "credits.txt"), credits.join("\n") + "\n");
  console.log(`\n\n📁 ${dir}`);
}
