// Editorial blog articles (/posts/<slug>). Each article lives in its own file
// under ./articles with its text in every site language; its photos come from
// ./photos.json, written by scripts/import-blog-photos.js together with each
// photo's author and licence.
import PHOTOS from "./photos.json";
import { getLocalizedHref } from "../siteConfig";
import { blogUi } from "./ui";
import machakhelaGorge from "./articles/machakhela-gorge-guide";
import batumiFirstTime from "./articles/batumi-first-time-guide";
import gonioSarpiCoast from "./articles/gonio-kvariati-sarpi-coast";
import upperAdjara from "./articles/upper-adjara-goderdzi-road-trip";
import vardziaDayTrip from "./articles/vardzia-day-trip-from-batumi";
import kutaisiTskaltubo from "./articles/kutaisi-tskaltubo-day-trip";
import guriaCoast from "./articles/guria-coast-gomis-mta";

export const BLOG_CATEGORIES = ["batumi", "mountains", "coast", "day-trips"];

// Newest first; ties keep this order, so the featured guide comes first.
const ARTICLES = [
  machakhelaGorge,
  batumiFirstTime,
  upperAdjara,
  gonioSarpiCoast,
  vardziaDayTrip,
  kutaisiTskaltubo,
  guriaCoast,
].sort((a, b) => b.published.localeCompare(a.published));

export const BLOG_SLUGS = ARTICLES.map((article) => article.slug);

export function getArticle(slug) {
  return ARTICLES.find((article) => article.slug === slug) || null;
}

export function articlePath(slug) {
  return `/posts/${slug}`;
}

function wordCount(text) {
  return String(text || "").split(/\s+/).filter(Boolean).length;
}

/** The article in `lang` (English when that language is missing). */
export function localizeArticle(article, lang) {
  if (!article) return null;
  const copy = article.i18n[lang] || article.i18n.en;
  const photos = (PHOTOS[article.slug] || []).map((photo, index) => ({
    ...photo,
    caption: copy.captions?.[index] || copy.title,
  }));
  const words = [
    ...copy.intro,
    ...copy.sections.flatMap((section) => [section.h, ...section.p, ...(section.list || [])]),
    ...copy.tips,
    ...copy.faqs.flatMap((faq) => [faq.q, faq.a]),
  ].reduce((sum, text) => sum + wordCount(text), 0);

  return {
    slug: article.slug,
    category: article.category,
    published: article.published,
    updated: article.updated || article.published,
    places: article.places || [],
    tours: article.tours || [],
    lang: article.i18n[lang] ? lang : "en",
    ...copy,
    photos,
    cover: photos[0] || null,
    readMinutes: Math.max(3, Math.round(words / 200)),
  };
}

/** Lightweight, serializable card data for every article, newest first. */
export function articleCards(lang) {
  const ui = blogUi(lang);
  return ARTICLES.map((article) => {
    const a = localizeArticle(article, lang);
    return {
      slug: a.slug,
      href: getLocalizedHref(articlePath(a.slug), lang),
      category: a.category,
      published: a.published,
      title: a.title,
      excerpt: a.excerpt,
      readLabel: ui.minRead(a.readMinutes),
      cover: a.cover ? { src: a.cover.src, width: a.cover.width, height: a.cover.height, caption: a.cover.caption } : null,
    };
  });
}

/** The plain-string labels BlogCard and BlogFilter need. */
export function blogCardLabels(lang) {
  const ui = blogUi(lang);
  return { all: ui.all, latest: ui.latest, empty: ui.empty, readMore: ui.readMore, categories: ui.categories };
}

/** Other articles, same category first. */
export function relatedArticles(slug, lang, count = 3) {
  const current = getArticle(slug);
  const cards = articleCards(lang).filter((card) => card.slug !== slug);
  return [
    ...cards.filter((card) => card.category === current?.category),
    ...cards.filter((card) => card.category !== current?.category),
  ].slice(0, count);
}

export function formatArticleDate(iso, lang) {
  const locales = { ka: "ka-GE", en: "en-GB", ru: "ru-RU", tr: "tr-TR", ar: "ar" };
  return new Intl.DateTimeFormat(locales[lang] || "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${iso}T00:00:00Z`));
}
