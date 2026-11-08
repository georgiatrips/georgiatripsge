// Photo search for one place in Georgia across Wikimedia Commons, Flickr,
// Unsplash, Pexels and Pixabay. Used by the admin "ფოტოების ძებნა" tab
// (/api/admin/photo-search) and by `npm run photos -- <სიტყვა>`.
//
// The search is strict on purpose: "Goderdzi" is also a man's name, so a
// photo is kept only when it is proven to show the place:
//   1. the place is looked up on Wikidata (only items located in Georgia),
//      which gives its coordinates, its names in ka/en/ru and its Commons
//      category;
//   2. every source is searched with those names;
//   3. each photo's title, description, tags and alt text are read: the name
//      has to be there as a word (not "Goderdzi Shvelidze", a person), and
//      the photo has to be tied to Georgia — by its GPS position near the
//      place, by the place's Commons category, by the full place name
//      ("Goderdzi Pass") or by a Georgian context word (Adjara, Khulo, …).
//   A photo whose GPS position is far from the place is always dropped.
//
// No npm dependencies: runs in Next route handlers and in plain Node 18+.

const UA = "GeorgiaTripsPhotoSearch/1.0 (https://www.georgiatrips.ge; admin photo search)";
const TIMEOUT = 15000;

// ── Names ──────────────────────────────────────────────────────────────────

const KA_LATIN = {
  ა: "a", ბ: "b", გ: "g", დ: "d", ე: "e", ვ: "v", ზ: "z", თ: "t", ი: "i", კ: "k", ლ: "l", მ: "m",
  ნ: "n", ო: "o", პ: "p", ჟ: "zh", რ: "r", ს: "s", ტ: "t", უ: "u", ფ: "p", ქ: "k", ღ: "gh", ყ: "q",
  შ: "sh", ჩ: "ch", ც: "ts", ძ: "dz", წ: "ts", ჭ: "ch", ხ: "kh", ჯ: "j", ჰ: "h",
};
const KA_CYR = {
  ა: "а", ბ: "б", გ: "г", დ: "д", ე: "е", ვ: "в", ზ: "з", თ: "т", ი: "и", კ: "к", ლ: "л", მ: "м",
  ნ: "н", ო: "о", პ: "п", ჟ: "ж", რ: "р", ს: "с", ტ: "т", უ: "у", ფ: "п", ქ: "к", ღ: "г", ყ: "к",
  შ: "ш", ჩ: "ч", ც: "ц", ძ: "дз", წ: "ц", ჭ: "ч", ხ: "х", ჯ: "дж", ჰ: "х",
};
const isGeorgian = (s) => /[ა-ჿ]/.test(s);
const translit = (s, table) => [...s].map((c) => table[c] ?? c).join("");

// Georgian nouns change their ending ("გოდერძი" → "გოდერძის", "გოდერძზე"):
// the stem without the final vowel is what has to appear in a text.
function stem(word) {
  const w = word.toLowerCase();
  if (w.length < 5) return w;
  if (isGeorgian(w)) return w.replace(/[იაე]$/, "");
  if (/[а-яё]/.test(w)) return w.replace(/[иаыеоя]$/, "");
  return w;
}

const norm = (s) =>
  String(s || "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const stripHtml = (s) =>
  String(s || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const LETTER = "a-z0-9\\u00c0-\\u024f\\u0400-\\u04ff\\u10d0-\\u10ff";

// Words after the name that still describe the place, not a surname.
const PLACE_WORDS = new Set([
  "pass", "resort", "ski", "skiing", "lake", "mountain", "mountains", "mount", "mt", "road", "village",
  "valley", "gorge", "peak", "forest", "petrified", "river", "station", "cable", "car", "hotel",
  "slope", "slopes", "top", "area", "region", "summit", "ridge", "museum", "park", "winter",
  "summer", "view", "panorama", "georgia", "adjara", "ajara", "hut", "airport", "church", "fortress",
  "monastery", "waterfall", "canyon", "bridge", "cave", "beach", "street", "square", "city", "town",
  "national", "nature", "reserve", "sunset", "sunrise", "snow", "in", "at", "near", "from", "to",
  "and", "the", "of", "on",
]);
// Georgian surnames: -ძე, -შვილი, -ია, -ავა, -ანი, -ური … and their Latin/Cyrillic spellings.
const SURNAME = /(dze|shvili|ia|ava|ua|ani|uri|eli|дзе|швили|ия|ава|ани|ури|ძე|შვილი|ია|ავა|უა|ანი|ური|ელი)$/i;
// These endings are surnames even written in lower case ("Goderdzi bolkvadze").
const STRONG_SURNAME = /.{3,}(dze|shvili|dze's|дзе|швили|ძე|შვილი)$/i;

const CONTEXT_WORDS = [
  "georgia", "georgian", "sakartvelo", "adjara", "ajara", "adjaria", "caucasus", "kavkaz", "tbilisi",
  "batumi", "kutaisi", "samtskhe", "javakheti", "imereti", "svaneti", "kakheti", "guria", "racha",
  "kartli", "mtskheta", "khulo", "shuakhevi", "keda", "kobuleti", "adigeni", "akhaltsikhe", "borjomi",
  "საქართველო", "აჭარა", "კავკასია", "грузия", "грузии", "аджария", "аджарии", "кавказ", "батуми",
];

function wordRegex(word) {
  return new RegExp(`(^|[^${LETTER}])(${escapeRe(word)})([${LETTER}]{0,5})`, "giu");
}

// ── Small helpers ──────────────────────────────────────────────────────────

async function getJson(url, headers = {}) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json", ...headers },
    signal: AbortSignal.timeout(TIMEOUT),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err = new Error(`HTTP ${res.status} ${body.slice(0, 160)}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

function distanceKm(a, b) {
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const IN_GEORGIA = (p) => p.lat > 41.0 && p.lat < 43.65 && p.lng > 39.9 && p.lng < 46.8;

// ── 1. The place ───────────────────────────────────────────────────────────

const LANGS = "ka|en|ru|de|fr|tr|uk|pl";

async function resolvePlace(query) {
  const ids = new Set();
  const terms = [query];
  if (isGeorgian(query)) terms.push(translit(query, KA_LATIN));
  for (const term of terms) {
    for (const lang of ["ka", "en"]) {
      const url =
        "https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&type=item&limit=20" +
        `&language=${lang}&uselang=${lang}&search=${encodeURIComponent(term)}`;
      const data = await getJson(url).catch(() => ({ search: [] }));
      for (const hit of data.search || []) ids.add(hit.id);
    }
  }
  if (!ids.size) return [];

  const entities = {};
  const list = [...ids];
  for (let i = 0; i < list.length; i += 50) {
    const url =
      "https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=labels|aliases|claims" +
      `&languages=${LANGS}&ids=${list.slice(i, i + 50).join("|")}`;
    const data = await getJson(url).catch(() => ({ entities: {} }));
    Object.assign(entities, data.entities);
  }

  const claim = (e, p) => (e.claims?.[p] || []).map((c) => c.mainsnak?.datavalue?.value).filter(Boolean);
  const places = [];
  const parents = new Set();
  for (const e of Object.values(entities)) {
    const country = claim(e, "P17").map((v) => v.id);
    if (!country.includes("Q230")) continue; // only things located in Georgia
    const coord = claim(e, "P625")[0];
    const names = new Set();
    for (const l of Object.values(e.labels || {})) names.add(l.value);
    for (const arr of Object.values(e.aliases || {})) for (const a of arr) names.add(a.value);
    const parent = claim(e, "P131").map((v) => v.id);
    parent.forEach((p) => parents.add(p));
    places.push({
      id: e.id,
      label: e.labels?.ka?.value || e.labels?.en?.value || e.id,
      labelEn: e.labels?.en?.value || "",
      names: [...names],
      point: coord ? { lat: coord.latitude, lng: coord.longitude } : null,
      commonsCategory: claim(e, "P373")[0] || null,
      parents: parent,
    });
  }

  // Region names (Khulo Municipality, Adjara …) become context words.
  const regionNames = [];
  if (parents.size) {
    const url =
      "https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=labels" +
      `&languages=${LANGS}&ids=${[...parents].slice(0, 50).join("|")}`;
    const data = await getJson(url).catch(() => ({ entities: {} }));
    for (const e of Object.values(data.entities || {})) {
      for (const l of Object.values(e.labels || {})) regionNames.push(l.value);
    }
  }
  return { places, regionNames };
}

// The place items whose names really contain the searched word.
function buildPlaceModel(query, resolved) {
  const q = query.trim();
  const core = new Set([q.toLowerCase()]);
  if (isGeorgian(q)) {
    core.add(translit(q, KA_LATIN).toLowerCase());
    core.add(translit(q, KA_CYR).toLowerCase());
  }
  const coreStems = [...core].map(stem);
  const containsCore = (name) => {
    const n = norm(name);
    return coreStems.some((s) => wordRegex(norm(s)).test(n));
  };

  const places = (resolved.places || []).filter((p) => p.names.some(containsCore));
  // Latin/Cyrillic spellings from Wikidata ("Годерджи", "Goderdzi") join the core.
  for (const p of places) {
    for (const name of p.names) {
      for (const word of name.split(/[\s,()–-]+/)) {
        if (!word || word.length < 4) continue;
        const w = word.toLowerCase();
        if (coreStems.some((s) => norm(stem(w)).startsWith(norm(s).slice(0, Math.max(4, norm(s).length - 2))))) {
          core.add(w);
        }
      }
    }
  }
  const fullNames = new Set();
  for (const p of places) for (const n of p.names) if (n.split(/\s+/).length > 1) fullNames.add(n);

  const context = new Set(CONTEXT_WORDS);
  for (const r of resolved.regionNames || []) {
    for (const w of r.split(/[\s,()–-]+/)) if (w.length >= 5 && !containsCore(w)) context.add(norm(w));
  }

  return {
    query: q,
    core: [...core],
    stems: [...new Set([...core].map((c) => norm(stem(c))))],
    fullNames: [...fullNames],
    context: [...context],
    places,
    points: places.map((p) => p.point).filter(Boolean),
    categories: [...new Set(places.map((p) => p.commonsCategory).filter(Boolean))],
    // What is typed into each site's search box.
    searchTerms: [...new Set([
      ...[...core].filter((c) => /^[a-z' -]+$/i.test(c)).map((c) => c[0].toUpperCase() + c.slice(1)),
      ...places.map((p) => p.labelEn).filter((n) => n && /^[a-z0-9' -]+$/i.test(n)),
    ])].slice(0, 4),
  };
}

// ── 2. Is this photo really the place? ─────────────────────────────────────

// Radius around the place's coordinates: passes and resorts are big.
const NEAR_KM = 15;
const FAR_KM = 40;

function verify(photo, model) {
  const text = norm([photo.title, photo.description, (photo.tags || []).join(" "), photo.location].join(" \n "));
  const original = [photo.title, photo.description, (photo.tags || []).join(" , "), photo.location].join(" \n ");

  // GPS first: a photo taken far away is not this place, whatever its title says.
  let km = null;
  if (photo.lat != null && photo.lng != null && (photo.lat || photo.lng)) {
    const pt = { lat: photo.lat, lng: photo.lng };
    if (model.points.length) {
      km = Math.min(...model.points.map((p) => distanceKm(p, pt)));
      if (km > FAR_KM) return { ok: false, why: `GPS ${Math.round(km)} კმ-ში` };
    } else if (!IN_GEORGIA(pt)) {
      return { ok: false, why: "GPS საქართველოს გარეთ" };
    }
  }

  if (photo.inCategory) {
    return { ok: true, level: "category", why: `Commons-ის კატეგორია „${photo.inCategory}“`, km };
  }

  // The name has to be in the text as a word, and not as someone's first name.
  // Matching runs on the text with its capitals kept (accents removed), so a
  // capitalised surname right after the name can be told apart.
  const cased = original.normalize("NFKD").replace(/[̀-ͯ]/g, "");
  let nameHits = 0;
  let personHits = 0;
  for (const s of model.stems) {
    const re = wordRegex(s);
    let m;
    while ((m = re.exec(cased))) {
      nameHits++;
      const after = cased.slice(m.index + m[0].length).match(/^[\s'’]+\(?([^\s,.;:()!?"]+)/u);
      const next = after ? after[1] : "";
      if (!next || PLACE_WORDS.has(next.toLowerCase())) continue;
      const capital = /^[A-ZА-ЯЁ]/u.test(next) || /[ა-ჿ]/.test(next);
      if (STRONG_SURNAME.test(next) || (capital && SURNAME.test(next))) personHits++;
    }
  }
  if (!nameHits) return { ok: false, why: "სახელი აღწერაში არ არის" };
  if (personHits >= nameHits) return { ok: false, why: "ადამიანის სახელია, არა ადგილი" };

  if (km != null && km <= NEAR_KM) return { ok: true, level: "gps", why: `GPS ადგილიდან ${km.toFixed(1)} კმ`, km };

  // Where the name is: in the title/tags the photo is *of* the place; only in
  // a long description it may just mention it (a plant found there, a museum
  // exhibit brought from there) — those go to a separate, weaker list.
  const head = norm([photo.title, (photo.tags || []).join(" "), photo.location].join(" \n "));
  const inHead = model.stems.some((s) => wordRegex(s).test(head));

  const full = model.fullNames.find((n) => text.includes(norm(n)));
  const ctx = model.context.find((c) => wordRegex(c).test(text));
  const georgianScript = model.stems.some((s) => /[ა-ჿ]/.test(s) && text.includes(s));
  if (!full && !ctx && !georgianScript) return { ok: false, why: "საქართველოსთან კავშირი არ ჩანს" };

  const why = full ? `სრული სახელი „${full}“` : ctx ? `სახელი + „${ctx}“` : "ქართული სახელი";
  if (inHead && (full || ctx)) return { ok: true, level: full ? "name" : "context", why, km };
  return { ok: true, level: "mention", why: `${why} — მხოლოდ აღწერაში ახსენებს`, km };
}

// ── 3. Sources ─────────────────────────────────────────────────────────────

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";

function commonsPhoto(page, inCategory) {
  const info = page.imageinfo?.[0];
  if (!info || !/^image\/(jpeg|png|webp|tiff)/.test(info.mime || "image/jpeg")) return null;
  const meta = info.extmetadata || {};
  const v = (k) => stripHtml(meta[k]?.value);
  const coord = page.coordinates?.[0];
  const cats = (page.categories || []).map((c) => c.title.replace(/^Category:/, ""));
  return {
    id: `commons:${page.pageid}`,
    source: "wikimedia",
    title: page.title.replace(/^File:/, "").replace(/\.\w+$/, "").replace(/_/g, " "),
    description: [v("ImageDescription"), v("ObjectName")].filter(Boolean).join(" — "),
    tags: cats,
    author: v("Artist") || v("Credit"),
    license: v("LicenseShortName") || "Wikimedia Commons",
    licenseUrl: meta.LicenseUrl?.value || "",
    pageUrl: info.descriptionurl,
    imageUrl: info.url,
    previewUrl: info.thumburl || info.url,
    width: info.width,
    height: info.height,
    lat: coord?.lat ?? (meta.GPSLatitude ? Number(meta.GPSLatitude.value) : null),
    lng: coord?.lon ?? (meta.GPSLongitude ? Number(meta.GPSLongitude.value) : null),
    inCategory,
  };
}

async function commonsQuery(params, inCategory) {
  const out = [];
  let cont = {};
  for (let round = 0; round < 4; round++) {
    const qs = new URLSearchParams({
      action: "query",
      format: "json",
      prop: "imageinfo|coordinates|categories",
      iiprop: "url|extmetadata|size|mime",
      iiurlwidth: "480",
      iiextmetadatafilter: "ImageDescription|ObjectName|Artist|Credit|LicenseShortName|LicenseUrl|GPSLatitude|GPSLongitude",
      clshow: "!hidden",
      cllimit: "max",
      colimit: "max",
      ...params,
      ...cont,
    });
    const data = await getJson(`${COMMONS_API}?${qs}`);
    for (const page of Object.values(data.query?.pages || {})) {
      const existing = out.find((p) => p.pageid === page.pageid);
      if (existing) {
        existing.categories = [...(existing.categories || []), ...(page.categories || [])];
        existing.coordinates = existing.coordinates || page.coordinates;
        existing.imageinfo = existing.imageinfo || page.imageinfo;
      } else out.push(page);
    }
    if (!data.continue) break;
    // Property continuation (categories) keeps the same generator page;
    // stop once the generator itself moves on to keep the request count low.
    if (data.continue.gsroffset || data.continue.gcmcontinue) {
      if (round >= 1) break;
    }
    cont = data.continue;
  }
  return out.map((p) => commonsPhoto(p, inCategory)).filter(Boolean);
}

async function searchCommons(model) {
  const photos = [];
  // Everything filed under the place's own Commons category (and one level of subcategories).
  for (const cat of model.categories.slice(0, 3)) {
    photos.push(...(await commonsQuery({ generator: "categorymembers", gcmtitle: `Category:${cat}`, gcmtype: "file", gcmlimit: "100" }, cat)));
    const subs = await getJson(
      `${COMMONS_API}?action=query&format=json&list=categorymembers&cmtype=subcat&cmlimit=20&cmtitle=${encodeURIComponent(`Category:${cat}`)}`,
    ).catch(() => ({}));
    for (const sub of (subs.query?.categorymembers || []).slice(0, 8)) {
      const name = sub.title.replace(/^Category:/, "");
      photos.push(...(await commonsQuery({ generator: "categorymembers", gcmtitle: sub.title, gcmtype: "file", gcmlimit: "60" }, name)));
    }
  }
  // Full-text search for the name (title + description).
  const terms = [...model.searchTerms];
  if (isGeorgian(model.query)) terms.push(model.query);
  for (const term of terms.slice(0, 3)) {
    photos.push(...(await commonsQuery({ generator: "search", gsrnamespace: "6", gsrsearch: `"${term}" filetype:bitmap`, gsrlimit: "50" }, null)));
  }
  // A file found by search that also sits in the place category counts as category.
  for (const p of photos) {
    if (!p.inCategory) {
      const c = p.tags.find((t) => model.categories.some((cat) => t === cat || t.startsWith(`${cat} `)));
      if (c) p.inCategory = c;
    }
  }
  return photos;
}

const FLICKR_LICENSES = {
  1: "CC BY-NC-SA 2.0", 2: "CC BY-NC 2.0", 3: "CC BY-NC-ND 2.0", 4: "CC BY 2.0", 5: "CC BY-SA 2.0",
  6: "CC BY-ND 2.0", 7: "No known copyright restrictions", 8: "United States Government Work",
  9: "CC0 1.0", 10: "Public Domain Mark 1.0",
};

async function searchFlickr(model, key) {
  const photos = [];
  if (key) {
    for (const term of model.searchTerms.slice(0, 2)) {
      const qs = new URLSearchParams({
        method: "flickr.photos.search",
        api_key: key,
        text: term,
        license: "1,2,3,4,5,6,7,9,10",
        media: "photos",
        content_type: "1",
        sort: "relevance",
        per_page: "100",
        extras: "description,tags,geo,owner_name,license,url_m,url_l,url_o,url_k,o_dims",
        format: "json",
        nojsoncallback: "1",
      });
      const data = await getJson(`https://api.flickr.com/services/rest/?${qs}`);
      if (data.stat !== "ok") throw new Error(data.message || "Flickr error");
      for (const p of data.photos?.photo || []) {
        const big = p.url_o || p.url_k || p.url_l || p.url_m;
        photos.push({
          id: `flickr:${p.id}`,
          source: "flickr",
          title: p.title,
          description: stripHtml(p.description?._content),
          tags: String(p.tags || "").split(" ").filter(Boolean),
          author: p.ownername,
          license: FLICKR_LICENSES[p.license] || `license ${p.license}`,
          licenseUrl: "https://www.flickr.com/creativecommons/",
          pageUrl: `https://www.flickr.com/photos/${p.owner}/${p.id}/`,
          imageUrl: big,
          previewUrl: p.url_m || big,
          width: Number(p.width_o || p.width_k || p.width_l || 0) || null,
          height: Number(p.height_o || p.height_k || p.height_l || 0) || null,
          lat: Number(p.latitude) || null,
          lng: Number(p.longitude) || null,
        });
      }
    }
    return { photos, via: "Flickr API" };
  }
  // No key: Openverse indexes Flickr's Creative Commons photos (titles + tags).
  for (const term of model.searchTerms.slice(0, 2)) {
    const qs = new URLSearchParams({ q: term, source: "flickr", page_size: "20" });
    const data = await getJson(`https://api.openverse.org/v1/images/?${qs}`);
    for (const r of data.results || []) {
      photos.push({
        id: `flickr:${r.id}`,
        source: "flickr",
        title: r.title,
        description: "",
        tags: (r.tags || []).map((t) => t.name),
        author: r.creator,
        license: `CC ${String(r.license).toUpperCase()} ${r.license_version || ""}`.trim(),
        licenseUrl: r.license_url,
        pageUrl: r.foreign_landing_url,
        imageUrl: r.url,
        previewUrl: r.thumbnail || r.url,
        width: r.width,
        height: r.height,
        lat: null,
        lng: null,
      });
    }
  }
  return { photos, via: "Openverse (Flickr API key არ არის)" };
}

async function searchUnsplash(model, key) {
  const photos = [];
  for (const term of model.searchTerms.slice(0, 2)) {
    for (const page of [1, 2]) {
      const data = await getJson(
        `https://api.unsplash.com/search/photos?per_page=30&page=${page}&query=${encodeURIComponent(term)}`,
        { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" },
      );
      for (const p of data.results || []) {
        photos.push({
          id: `unsplash:${p.id}`,
          source: "unsplash",
          title: p.description || p.alt_description || "",
          description: [p.alt_description, p.slug?.replace(/-[A-Za-z0-9_]{11}$/, "").replace(/-/g, " ")].filter(Boolean).join(" — "),
          tags: (p.tags || []).map((t) => t.title),
          location: [p.location?.name, p.location?.city, p.location?.country].filter(Boolean).join(", "),
          author: p.user?.name,
          license: "Unsplash License",
          licenseUrl: "https://unsplash.com/license",
          pageUrl: p.links?.html,
          imageUrl: p.urls?.full || p.urls?.raw,
          previewUrl: p.urls?.small,
          downloadTrack: p.links?.download_location,
          width: p.width,
          height: p.height,
          lat: p.location?.position?.latitude ?? null,
          lng: p.location?.position?.longitude ?? null,
        });
      }
      if ((data.total_pages || 1) <= page) break;
    }
  }
  return { photos, via: "Unsplash API" };
}

async function searchPexels(model, key) {
  const photos = [];
  for (const term of model.searchTerms.slice(0, 2)) {
    const data = await getJson(`https://api.pexels.com/v1/search?per_page=80&query=${encodeURIComponent(term)}`, {
      Authorization: key,
    });
    for (const p of data.photos || []) {
      // The page URL carries the photo's own title: /photo/goderdzi-pass-in-autumn-123/
      const slug = (p.url || "").match(/\/photo\/(.+?)-\d+\/?$/)?.[1]?.replace(/-/g, " ") || "";
      photos.push({
        id: `pexels:${p.id}`,
        source: "pexels",
        title: p.alt || slug,
        description: slug,
        tags: [],
        author: p.photographer,
        license: "Pexels License",
        licenseUrl: "https://www.pexels.com/license/",
        pageUrl: p.url,
        imageUrl: p.src?.original,
        previewUrl: p.src?.medium,
        width: p.width,
        height: p.height,
        lat: null,
        lng: null,
      });
    }
  }
  return { photos, via: "Pexels API" };
}

async function searchPixabay(model, key) {
  const photos = [];
  for (const term of model.searchTerms.slice(0, 2)) {
    const qs = new URLSearchParams({ key, q: term, image_type: "photo", per_page: "100", safesearch: "true" });
    const data = await getJson(`https://pixabay.com/api/?${qs}`);
    for (const p of data.hits || []) {
      const slug = (p.pageURL || "").match(/\/photos\/(.+?)-\d+\/?$/)?.[1]?.replace(/-/g, " ") || "";
      photos.push({
        id: `pixabay:${p.id}`,
        source: "pixabay",
        title: slug || p.tags,
        description: slug,
        tags: String(p.tags || "").split(",").map((t) => t.trim()).filter(Boolean),
        author: p.user,
        license: "Pixabay Content License",
        licenseUrl: "https://pixabay.com/service/license-summary/",
        pageUrl: p.pageURL,
        imageUrl: p.largeImageURL,
        previewUrl: p.webformatURL,
        width: p.imageWidth,
        height: p.imageHeight,
        lat: null,
        lng: null,
      });
    }
  }
  return { photos, via: "Pixabay API" };
}

export const SOURCES = [
  { key: "wikimedia", label: "Wikimedia Commons", env: null },
  { key: "flickr", label: "Flickr", env: "FLICKR_API_KEY", keyUrl: "https://www.flickr.com/services/apps/create/" },
  { key: "unsplash", label: "Unsplash", env: "UNSPLASH_ACCESS_KEY", keyUrl: "https://unsplash.com/oauth/applications" },
  { key: "pexels", label: "Pexels", env: "PEXELS_API_KEY", keyUrl: "https://www.pexels.com/api/" },
  { key: "pixabay", label: "Pixabay", env: "PIXABAY_API_KEY", keyUrl: "https://pixabay.com/api/docs/" },
];

// ── Entry point ────────────────────────────────────────────────────────────

export async function searchPhotos(query, { env = process.env, sources } = {}) {
  const q = String(query || "").trim().slice(0, 80);
  if (q.length < 2) throw new Error("query_too_short");

  const resolved = await resolvePlace(q).catch(() => ({ places: [], regionNames: [] }));
  const model = buildPlaceModel(q, resolved);
  if (!model.searchTerms.length) model.searchTerms.push(q);

  const wanted = sources?.length ? SOURCES.filter((s) => sources.includes(s.key)) : SOURCES;
  const status = {};
  const runners = {
    wikimedia: () => searchCommons(model).then((photos) => ({ photos, via: "Commons API" })),
    flickr: () => searchFlickr(model, env.FLICKR_API_KEY),
    unsplash: () => searchUnsplash(model, env.UNSPLASH_ACCESS_KEY),
    pexels: () => searchPexels(model, env.PEXELS_API_KEY),
    pixabay: () => searchPixabay(model, env.PIXABAY_API_KEY),
  };

  const results = await Promise.all(
    wanted.map(async (s) => {
      if (s.env && !env[s.env] && s.key !== "flickr") {
        status[s.key] = { label: s.label, state: "no_key", env: s.env, keyUrl: s.keyUrl, found: 0, kept: 0 };
        return [];
      }
      try {
        const { photos, via } = await runners[s.key]();
        status[s.key] = { label: s.label, state: "ok", via, found: photos.length, kept: 0, env: s.env, keyUrl: s.keyUrl };
        return photos;
      } catch (err) {
        status[s.key] = { label: s.label, state: "error", error: err.message.slice(0, 200), found: 0, kept: 0, env: s.env, keyUrl: s.keyUrl };
        return [];
      }
    }),
  );

  const seen = new Set();
  const kept = [];
  const rejected = [];
  for (const photo of results.flat()) {
    if (!photo.imageUrl || seen.has(photo.id) || seen.has(photo.imageUrl)) continue;
    seen.add(photo.id);
    seen.add(photo.imageUrl);
    const check = verify(photo, model);
    if (check.ok) {
      kept.push({ ...photo, match: { level: check.level, why: check.why, km: check.km } });
      status[photo.source].kept++;
    } else {
      rejected.push({ source: photo.source, title: photo.title, pageUrl: photo.pageUrl, why: check.why });
    }
  }

  const rank = { gps: 0, category: 1, name: 2, context: 3, mention: 4 };
  kept.sort((a, b) => rank[a.match.level] - rank[b.match.level] || (b.width || 0) * (b.height || 0) - (a.width || 0) * (a.height || 0));

  return {
    query: q,
    place: {
      names: model.core,
      fullNames: model.fullNames.slice(0, 12),
      searchTerms: model.searchTerms,
      items: model.places.map((p) => ({ id: p.id, label: p.label, labelEn: p.labelEn, point: p.point, commonsCategory: p.commonsCategory })),
    },
    sources: status,
    // Photos of the place, and photos that only mention it in a long description.
    photos: kept.filter((p) => p.match.level !== "mention"),
    mentions: kept.filter((p) => p.match.level === "mention"),
    rejected,
  };
}

// Credit line to print under a photo on the site.
export function creditLine(photo) {
  const by = photo.author ? `© ${photo.author}` : "";
  return [by, photo.license, photo.source === "wikimedia" ? "Wikimedia Commons" : SOURCES.find((s) => s.key === photo.source)?.label]
    .filter(Boolean)
    .join(" · ");
}
