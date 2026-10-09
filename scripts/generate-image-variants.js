// Pre-resizes the photos in /public into /public/img-opt/<name>-<width>.webp
// and records which widths exist in app/lib/localImageVariants.json.
//
// next/image uses a custom loader (app/lib/imageLoader.js) instead of Vercel's
// /_next/image optimizer, whose Hobby quota runs out and then answers 402 for
// every uncached image. Remote images are resized by their own CDN; local
// files have no CDN, so their sizes are made here.
//
// Run after adding or replacing a photo in /public:
//   node scripts/generate-image-variants.js
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const PUBLIC = path.join(__dirname, "../public");
const OUT = path.join(PUBLIC, "img-opt");
const MANIFEST = path.join(__dirname, "../app/lib/localImageVariants.json");
// Must match LOCAL_WIDTHS in app/lib/imageLoader.js.
const WIDTHS = [256, 640, 1080, 1920];
const SKIP = /^(favicon|apple-touch-icon|icon-|logo\.png)/;

async function generate() {
  fs.mkdirSync(OUT, { recursive: true });
  const manifest = {};
  const files = fs.readdirSync(PUBLIC).filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f) && !SKIP.test(f));

  for (const file of files) {
    const src = path.join(PUBLIC, file);
    const { width } = await sharp(src).metadata();
    const base = file.replace(/\.[^.]+$/, "");
    const made = [];
    // Only widths smaller than the original; anything larger is served as-is.
    for (const w of WIDTHS.filter((w) => w < width)) {
      await sharp(src).resize({ width: w }).webp({ quality: 72 }).toFile(path.join(OUT, `${base}-${w}.webp`));
      made.push(w);
    }
    if (made.length) manifest[`/${file}`] = made;
    console.log(`${file} (${width}px) → ${made.join(", ") || "original only"}`);
  }

  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Wrote ${path.relative(process.cwd(), MANIFEST)}`);
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
