// Dictionary-free translation helpers. Safe to import from client components:
// they never pull the locale files into the bundle.

export function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;
  return path.split(".").reduce((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) return acc[key];
    return undefined;
  }, obj);
}

/** Resolves `key` in an already-merged message tree (see mergeMessages). */
export function lookup(messages, key, fallback) {
  if (!key) return "";
  const value = getNestedValue(messages, key);
  if (value !== undefined && value !== null) return value;
  if (fallback !== undefined && fallback !== null) return fallback;
  return key;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Deep-merges `own` over `base`, so a language with missing keys falls back
 * to the base (Georgian) strings — the same order translate() uses.
 */
export function mergeMessages(base, own) {
  if (!isPlainObject(own)) return own ?? base;
  if (!isPlainObject(base)) return own;
  const result = { ...base };
  for (const [key, value] of Object.entries(own)) {
    if (value === undefined || value === null) continue;
    result[key] = mergeMessages(base[key], value);
  }
  return result;
}

/** Replaces {name} placeholders; unknown placeholders are left untouched. */
export function interpolate(template, values = {}) {
  return String(template ?? "").replace(/\{(\w+)\}/g, (match, name) =>
    values[name] === undefined || values[name] === null ? match : String(values[name])
  );
}
