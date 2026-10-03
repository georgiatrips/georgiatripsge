import { listFirestoreTours } from "../toursFirestore";
import { listPlaces } from "../placesFirestore";
import { listReviews } from "../reviewsFirestore";
import { SITE_URL, SUPPORTED_LANGUAGES } from "../siteConfig";
import { tourPath, placePath } from "../slugs";

// Daily SEO health check over the real inventory and the live site. It does
// not change anything: it reports what a person should fix (a missing
// translation, a thin description, a page that stopped answering 200, the
// sitemap falling out of step with Firestore), because those are the things
// that quietly cost rankings.

const MIN_EN_DESCRIPTION = 300; // characters; shorter pages read as thin
const MIN_GALLERY = 3;
const FETCH_TIMEOUT_MS = 10000;
const CONCURRENCY = 6;

function missingLocales(value) {
  return SUPPORTED_LANGUAGES.filter(
    (lang) => !(value && typeof value === "object" && typeof value[lang] === "string" && value[lang].trim())
  );
}

function label(item) {
  const title = item?.title;
  return (typeof title === "object" ? title.en || title.ka : title) || item?.id || "untitled";
}

function contentIssues(item, kind) {
  const issues = [];
  const name = `${kind === "tour" ? "Tour" : "Place"} "${label(item)}"`;

  const missingTitle = missingLocales(item.title);
  const missingDesc = missingLocales(item.desc);
  if (missingTitle.length) issues.push(`${name}: title missing in ${missingTitle.join(", ")}`);
  if (missingDesc.length) issues.push(`${name}: description missing in ${missingDesc.join(", ")}`);

  const enDesc = typeof item.desc === "object" ? item.desc?.en || "" : "";
  if (enDesc && enDesc.trim().length < MIN_EN_DESCRIPTION) {
    issues.push(`${name}: English description is only ${enDesc.trim().length} characters (aim for ${MIN_EN_DESCRIPTION}+)`);
  }
  if (!item.img) issues.push(`${name}: no main photo`);
  const gallery = Array.isArray(item.gallery) ? item.gallery.length : 0;
  if (gallery < MIN_GALLERY) issues.push(`${name}: ${gallery} gallery photo(s), add at least ${MIN_GALLERY}`);
  if (kind === "tour" && !(Number(item.priceGroup) > 0 || Number(item.pricePrivate) > 0)) {
    issues.push(`${name}: no price, so search results cannot show one`);
  }
  return issues;
}

async function fetchStatus(url) {
  try {
    const res = await fetch(url, {
      redirect: "manual",
      headers: { "user-agent": "GeorgiaTrips-SEO-Health/1.0" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    return res.status;
  } catch {
    return 0;
  }
}

async function mapLimited(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export async function runSeoHealthCheck() {
  const [tours, places, reviews] = await Promise.all([
    listFirestoreTours(),
    listPlaces(true),
    listReviews().catch(() => []),
  ]);

  const issues = [
    ...tours.flatMap((tour) => contentIssues(tour, "tour")),
    ...places.flatMap((place) => contentIssues(place, "place")),
  ];

  // Items whose URL is still derived from the English title: renaming them
  // would change the URL. One line, not one per item.
  const unsaved = [...tours, ...places].filter((item) => !item.slug).map(label);
  if (unsaved.length > 0) {
    const names = unsaved.slice(0, 5).join(", ") + (unsaved.length > 5 ? ` and ${unsaved.length - 5} more` : "");
    issues.push(
      `${unsaved.length} tour/place URL(s) not saved yet (${names}) — open each in admin and press Save once, otherwise renaming it breaks its URL`
    );
  }

  // Sitemap must list every tour and place in every language.
  let sitemap = { ok: false, tours: 0, places: 0 };
  try {
    const res = await fetch(`${SITE_URL}/sitemap.xml`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    const xml = await res.text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    sitemap = {
      ok: res.ok,
      tours: locs.filter((loc) => /\/[a-z]{2}\/tours\/[^/]+$/.test(loc)).length,
      places: locs.filter((loc) => /\/[a-z]{2}\/places\/[^/]+$/.test(loc)).length,
    };
  } catch {
    // reported below as unreachable
  }
  const expectedTours = tours.length * SUPPORTED_LANGUAGES.length;
  const expectedPlaces = places.length * SUPPORTED_LANGUAGES.length;
  if (!sitemap.ok) {
    issues.unshift("sitemap.xml did not load");
  } else if (sitemap.tours !== expectedTours || sitemap.places !== expectedPlaces) {
    issues.unshift(
      `sitemap.xml is out of date: ${sitemap.tours}/${expectedTours} tour URLs, ${sitemap.places}/${expectedPlaces} place URLs`
    );
  }

  // robots.txt must load and point at the sitemap.
  try {
    const res = await fetch(`${SITE_URL}/robots.txt`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    const text = await res.text();
    if (!res.ok || !/sitemap:/i.test(text)) issues.unshift("robots.txt did not load or lost its Sitemap line");
  } catch {
    issues.unshift("robots.txt did not load");
  }

  // Every English tour and place page must answer 200 (one locale is enough:
  // all five render from the same document).
  const pages = [
    "/en",
    "/en/tours",
    "/en/places",
    ...tours.map((tour) => `/en${tourPath(tour)}`),
    ...places.map((place) => `/en${placePath(place)}`),
  ];
  const statuses = await mapLimited(pages, CONCURRENCY, (path) => fetchStatus(`${SITE_URL}${path}`));
  const broken = pages
    .map((path, index) => ({ path, status: statuses[index] }))
    .filter((page) => page.status !== 200);
  for (const page of broken) {
    issues.unshift(`${page.path} answers ${page.status || "nothing (timeout)"} instead of 200`);
  }

  const approved = reviews.filter((review) => review.approved !== false);
  const ratingSum = approved.reduce((sum, review) => sum + (Number(review.rating) || 0), 0);

  return {
    checkedAt: new Date().toISOString(),
    stats: {
      tours: tours.length,
      places: places.length,
      reviews: approved.length,
      averageRating: approved.length ? Math.round((ratingSum / approved.length) * 10) / 10 : null,
      pagesChecked: pages.length,
      sitemapTourUrls: sitemap.tours,
      sitemapPlaceUrls: sitemap.places,
    },
    issues,
  };
}

const MAX_LISTED_ISSUES = 15;

export function formatSeoReport(report) {
  const { stats, issues } = report;
  const head =
    `🔍 GeorgiaTrips SEO check\n\n` +
    `Tours: ${stats.tours} · Places: ${stats.places} · Pages checked: ${stats.pagesChecked}\n` +
    `Reviews: ${stats.reviews}${stats.averageRating ? ` (★ ${stats.averageRating})` : ""}\n`;
  if (issues.length === 0) return `${head}\n✅ No problems found.`;
  const listed = issues.slice(0, MAX_LISTED_ISSUES).map((issue) => `• ${issue}`).join("\n");
  const more = issues.length > MAX_LISTED_ISSUES ? `\n…and ${issues.length - MAX_LISTED_ISSUES} more` : "";
  return `${head}\n⚠️ ${issues.length} thing(s) to fix:\n${listed}${more}`;
}
