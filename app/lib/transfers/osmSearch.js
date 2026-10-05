/**
 * In-memory search over our own OpenStreetMap place index
 * (./data/osm-places.json, built by scripts/build-transfer-index.py from
 * Geofabrik's daily Georgia extract). Server only: the file is ~8 MB.
 *
 * Names are compared in a loose Latin form, so "batumi", "ბათუმი" and
 * "Батуми" all meet, and "kazbegi" finds "ყაზბეგი" (q≈k, kh≈k, …).
 *
 * Row: [name, nameEn, nameRu, altNames, type, lat, lng, cityKa, cityEn, rank]
 */

import ROWS from "./data/osm-places.json";

const KA = {
  ა: "a", ბ: "b", გ: "g", დ: "d", ე: "e", ვ: "v", ზ: "z", თ: "t", ი: "i", კ: "k", ლ: "l", მ: "m", ნ: "n", ო: "o",
  პ: "p", ჟ: "zh", რ: "r", ს: "s", ტ: "t", უ: "u", ფ: "p", ქ: "k", ღ: "gh", ყ: "q", შ: "sh", ჩ: "ch", ც: "ts",
  ძ: "dz", წ: "ts", ჭ: "ch", ხ: "kh", ჯ: "j", ჰ: "h",
};
const RU = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "i", к: "k", л: "l", м: "m",
  н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "sh",
  ъ: "", ы: "i", ь: "", э: "e", ю: "iu", я: "ia",
};

/** Lower-case Latin skeleton of any name or query. */
export function looseLatin(text) {
  let s = String(text || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  s = s.replace(/[ა-ჰ]/g, (c) => KA[c] ?? "").replace(/[а-яё]/g, (c) => RU[c] ?? "");
  return s
    .replace(/[^a-z0-9]+/g, " ")
    // "City" ≈ "სითი": c sounds s before e/i/y, k elsewhere (ch stays).
    .replace(/c([eiy])/g, "s$1")
    .replace(/ck/g, "k")
    .replace(/c(?!h)/g, "k")
    .replace(/kh/g, "k")
    .replace(/gh/g, "g")
    .replace(/ph/g, "p")
    .replace(/th/g, "t")
    .replace(/q/g, "k")
    .replace(/w/g, "v")
    .replace(/y/g, "i")
    .replace(/(.)\1+/g, "$1")
    .trim();
}

let index = null;

function getIndex() {
  if (index) return index;
  index = ROWS.map((r) => {
    const names = [r[0], r[1], r[2], ...String(r[3] || "").split(";")].filter(Boolean);
    const words = new Set();
    for (const n of names) for (const w of looseLatin(n).split(" ")) if (w) words.add(w);
    const cityWords = new Set(looseLatin(`${r[7]} ${r[8]}`).split(" ").filter(Boolean));
    return { r, words: [...words], cityWords: [...cityWords], full: names.map(looseLatin) };
  });
  return index;
}

const display = (r, lang) => {
  if (lang === "ka") return r[0];
  if (lang === "ru") return r[2] || r[1] || r[0];
  return r[1] || r[0];
};
const cityOf = (r, lang) => (lang === "ka" ? r[7] : r[8] || r[7]);

const toResult = (r, lang, id) => ({
  id,
  name: display(r, lang),
  detail: cityOf(r, lang),
  type: r[4] === "street" ? "street" : r[4],
  lat: r[5],
  lng: r[6],
});

/**
 * Best matches for a query: every query word must start a word of the
 * place's names, or of its town ("hilton batumi"), the first one a name word.
 */
export function searchOsmPlaces(query, lang = "ka", limit = 12) {
  const qWords = looseLatin(query).split(" ").filter(Boolean);
  if (!qWords.length) return [];
  const qFull = qWords.join(" ");
  const hits = [];
  for (let i = 0; i < getIndex().length; i++) {
    const item = index[i];
    const { words, cityWords } = item;
    if (!words.some((w) => w.startsWith(qWords[0]))) continue;
    let ok = true;
    let inName = 1;
    for (let k = 1; k < qWords.length && ok; k++) {
      const q = qWords[k];
      if (words.some((w) => w.startsWith(q))) inName++;
      else if (!cityWords.some((w) => w.startsWith(q))) ok = false;
    }
    if (!ok) continue;
    const r = item.r;
    let score = r[9] + inName * 4;
    if (item.full.some((f) => f === qFull)) score += 60;
    else if (item.full.some((f) => f.startsWith(qFull))) score += 30;
    hits.push({ i, score });
  }
  hits.sort((a, b) => b.score - a.score);

  const out = [];
  const seen = new Set();
  for (const { i } of hits) {
    const res = toResult(index[i].r, lang, `osm${i}`);
    const key = `${res.name}|${res.detail}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(res);
    if (out.length >= limit) break;
  }
  return out;
}

// ~1 km cells for the nearest-place lookup behind a dropped map pin.
let grid = null;
const cellKey = (lat, lng) => `${Math.floor(lat * 100)},${Math.floor(lng * 100)}`;

function getGrid() {
  if (grid) return grid;
  grid = new Map();
  ROWS.forEach((r, i) => {
    const k = cellKey(r[5], r[6]);
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(i);
  });
  return grid;
}

const PIN_NAMED = new Set(["hotel", "airport", "station", "church", "sight"]);
const distM = (lat1, lng1, lat2, lng2) => Math.hypot((lat1 - lat2) * 111320, (lng1 - lng2) * 83000);

/**
 * Names around a point picked on the map: `place` is a hotel, sight,
 * station… within 40 m (that is the spot), `area` the nearest settlement.
 * Streets are not used: the index keeps one point per street, too coarse to
 * tell which street a pin is on.
 */
export function nameOsmPoint(lat, lng, lang = "ka") {
  const g = getGrid();
  const near = [];
  const cLat = Math.floor(lat * 100);
  const cLng = Math.floor(lng * 100);
  for (let dLat = -4; dLat <= 4; dLat++) {
    for (let dLng = -4; dLng <= 4; dLng++) {
      for (const i of g.get(`${cLat + dLat},${cLng + dLng}`) || []) {
        near.push({ i, d: distM(lat, lng, ROWS[i][5], ROWS[i][6]) });
      }
    }
  }
  near.sort((a, b) => a.d - b.d);
  const spot = near.find((n) => n.d <= 40 && PIN_NAMED.has(ROWS[n.i][4]));
  const town = near.find((n) => ["city", "village", "region"].includes(ROWS[n.i][4]));
  return {
    place: spot ? toResult(ROWS[spot.i], lang, `osm${spot.i}`) : null,
    area: town ? { ...toResult(ROWS[town.i], lang, `osm${town.i}`), type: "address" } : null,
  };
}
