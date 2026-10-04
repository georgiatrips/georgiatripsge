// Recovery for errors that a page reload fixes. After a deploy, a page opened
// earlier asks for code files the new deployment no longer has; a flaky
// connection can fail a single file. One automatic reload loads a consistent
// version of the site. The cool-down (per browser tab) keeps a real bug from
// turning into a reload loop: the second time, the error page is shown.
//
// app/components/site/SiteDocument.jsx inlines the same rule for errors that
// happen before React starts, so keep the key, cool-down and pattern in sync.

export const RELOAD_KEY = "gt-error-reload-at";
export const RELOAD_COOLDOWN_MS = 30 * 1000;
export const CHUNK_ERROR_PATTERN =
  /ChunkLoadError|Loading (CSS )?chunk|Failed to load chunk|dynamically imported module|Importing a module script failed|Unable to preload CSS/i;

export function isChunkLoadError(error) {
  if (!error) return false;
  return CHUNK_ERROR_PATTERN.test(`${error.name || ""} ${error.message || ""}`);
}

/** Reloads the page unless this tab already did so within the cool-down. Returns whether it reloads. */
export function reloadOnce() {
  if (typeof window === "undefined") return false;
  try {
    const last = Number(window.sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < RELOAD_COOLDOWN_MS) return false;
    window.sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // Without storage a reload loop can't be ruled out, so don't reload.
    return false;
  }
  window.location.reload();
  return true;
}
