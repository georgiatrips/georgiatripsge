// Copies the photos used by the blog articles from the owner's location
// folders (Desktop\კუთხეები\NN-name\N.jpg) into /public/blog/<slug>/ as
// 1920px webp files, and records each photo's author and licence (read from
// the folder's credits.txt) in app/lib/blog/photos.json, which the article
// pages print under every photo.
//
// Only photos with a known free licence (Wikimedia Commons, credits.txt) are
// listed below: folders whose photos have no recorded source are left out.
//
//   node scripts/import-blog-photos.js && node scripts/generate-image-variants.js
const sharp = require("sharp");
const fs = require("fs");
const os = require("os");
const path = require("path");

const SOURCE = process.env.KUTKHEEBI_DIR || path.join(os.homedir(), "Desktop", "კუთხეები");
const PUBLIC_BLOG = path.join(__dirname, "../public/blog");
const MANIFEST = path.join(__dirname, "../app/lib/blog/photos.json");
const MAX_WIDTH = 1600;

// slug -> [folder number, file] in article order; the first is the cover.
const ARTICLE_PHOTOS = {
  "machakhela-gorge-guide": [[67, "1.jpg"], [67, "2.jpg"], [66, "2.jpg"], [67, "4.jpg"], [67, "5.jpg"], [67, "3.jpg"], [66, "3.jpg"], [89, "1.jpg"]],
  "batumi-first-time-guide": [[76, "1.jpg"], [82, "1.jpg"], [72, "1.jpg"], [73, "1.jpg"], [75, "1.jpg"], [74, "1.jpg"], [71, "4.jpg"], [81, "2.jpg"]],
  "gonio-kvariati-sarpi-coast": [[88, "1.jpg"], [84, "1.jpg"], [84, "3.jpg"], [88, "3.jpg"], [87, "2.jpg"], [85, "3.jpg"], [86, "1.jpg"], [85, "1.jpg"]],
  "upper-adjara-goderdzi-road-trip": [[58, "1.jpg"], [64, "1.jpg"], [78, "1.jpg"], [57, "1.jpg"], [79, "2.jpg"], [58, "3.jpg"], [63, "1.jpg"], [57, "3.jpg"]],
  "vardzia-day-trip-from-batumi": [[61, "1.jpg"], [58, "2.jpg"], [59, "1.jpg"], [62, "2.jpg"], [60, "1.jpg"], [61, "4.jpg"], [61, "5.jpg"]],
  "kutaisi-tskaltubo-day-trip": [[39, "1.jpg"], [48, "1.jpg"], [40, "1.jpg"], [41, "1.jpg"], [49, "2.jpg"], [50, "1.jpg"], [50, "2.jpg"]],
  "guria-coast-gomis-mta": [[51, "1.jpg"], [83, "1.jpg"], [77, "3.jpg"], [53, "1.jpg"], [51, "3.jpg"], [51, "4.jpg"]],
};

function findFolder(number) {
  const match = fs.readdirSync(SOURCE).find((name) => name.startsWith(`${number}-`));
  if (!match) throw new Error(`No folder ${number}-… in ${SOURCE}`);
  return path.join(SOURCE, match);
}

// credits.txt comes in two shapes:
//   1.jpg — <title> — <author> — <licence> — <url>
// or a block per file with "Title:", "Author:", "License:" and "Source:" lines.
function readCredits(folder) {
  const text = fs.readFileSync(path.join(folder, "credits.txt"), "utf8");
  const credits = {};
  let current = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    const inline = line.match(/^(\d+\.\w+)\s+—\s+(.+?)\s+—\s+(.+?)\s+—\s+(.+?)\s+—\s+(https?:\S+)$/);
    if (inline) {
      credits[inline[1]] = { title: inline[2], author: inline[3], license: inline[4], source: inline[5] };
      continue;
    }
    const file = line.match(/^(\d+\.\w+)$/);
    if (file) {
      current = credits[file[1]] = {};
      continue;
    }
    const field = line.match(/^(Title|Author|License|Source):\s+(.+)$/);
    if (field && current) current[field[1].toLowerCase()] = field[2].replace(/^File:/, "");
  }
  return credits;
}

async function main() {
  const manifest = {};
  for (const [slug, photos] of Object.entries(ARTICLE_PHOTOS)) {
    const outDir = path.join(PUBLIC_BLOG, slug);
    fs.rmSync(outDir, { recursive: true, force: true });
    fs.mkdirSync(outDir, { recursive: true });
    manifest[slug] = [];

    for (const [index, [number, file]] of photos.entries()) {
      const folder = findFolder(number);
      const credit = readCredits(folder)[file];
      if (!credit?.author || !credit?.license || !/^https?:/.test(credit.source || "")) {
        throw new Error(`${folder}\\${file}: no author/licence/source in credits.txt`);
      }
      const name = `${index + 1}.webp`;
      const info = await sharp(path.join(folder, file))
        .rotate()
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: 72 })
        .toFile(path.join(outDir, name));
      manifest[slug].push({
        src: `/blog/${slug}/${name}`,
        width: info.width,
        height: info.height,
        author: credit.author,
        license: credit.license,
        source: credit.source,
      });
      console.log(`${slug}/${name} ← ${path.basename(folder)}/${file} (${info.width}×${info.height})`);
    }
  }
  fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Wrote ${path.relative(process.cwd(), MANIFEST)}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
