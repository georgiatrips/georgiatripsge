import { SITE_URL, SUPPORTED_LANGUAGES } from "../siteConfig";

// IndexNow tells Bing, Yandex, Seznam, Naver and other participating engines
// about new, changed or deleted URLs immediately, instead of waiting for the
// next crawl. The key is public by design: search engines verify it by
// fetching /<key>.txt from this site (see public/).
export const INDEXNOW_KEY = "fea8c9c6ed06ed29e6320d0e64d9556e";

const ENDPOINT = "https://api.indexnow.org/indexnow";

// Only locale-free content paths like "/tours/<slug>" are accepted from the
// admin panel; each is submitted in every language.
const CONTENT_PATH = /^\/(tours|places)\/[a-z0-9-]+$/;

export function isIndexNowPath(path) {
  return typeof path === "string" && CONTENT_PATH.test(path);
}

/**
 * Submits `paths` (plus their listing pages) in every locale. Runs only on the
 * production deployment, so previews and local builds never ping search
 * engines about URLs that are not live.
 */
export async function submitToIndexNow(paths = []) {
  if (process.env.VERCEL_ENV !== "production") return { skipped: true };

  const contentPaths = paths.filter(isIndexNowPath);
  if (contentPaths.length === 0) return { skipped: true };

  const listingPaths = [...new Set(contentPaths.map((path) => `/${path.split("/")[1]}`))];
  const urlList = [...contentPaths, ...listingPaths].flatMap((path) =>
    SUPPORTED_LANGUAGES.map((locale) => `${SITE_URL}/${locale}${path}`)
  );

  const { host } = new URL(SITE_URL);
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host,
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList,
    }),
  });
  if (!res.ok && res.status !== 202) {
    console.warn(`[indexNow] submission failed: ${res.status}`);
  }
  return { status: res.status, submitted: urlList.length };
}
