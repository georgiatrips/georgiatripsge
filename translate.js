/* =========================================================
   MYMEMORY TRANSLATION CLIENT
   Free API (no key needed). With `de=email` get 50k words/day.
   Docs: https://mymemory.translated.net/doc/spec.php
   ========================================================= */
(function () {
  const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';
  // Using admin email unlocks 50k words/day instead of 10k.
  const DE_EMAIL = 'georgiatrips5@gmail.com';

  // All supported site languages. Source is always KA.
  const SOURCE_LANG = 'ka';
  const TARGET_LANGS = ['en', 'ru', 'tr', 'ar', 'he', 'fa', 'uk'];
  const ALL_LANGS = [SOURCE_LANG, ...TARGET_LANGS];

  // In-memory cache (per session). Keyed by `src|tgt|text`.
  const cache = new Map();

  // Basic concurrency limiter so we don't hammer the API.
  const MAX_CONCURRENT = 4;
  let active = 0;
  const queue = [];

  function runNext() {
    if (active >= MAX_CONCURRENT) return;
    const job = queue.shift();
    if (!job) return;
    active++;
    job.fn().then(
      (res) => { active--; job.resolve(res); runNext(); },
      (err) => { active--; job.reject(err); runNext(); }
    );
  }

  function schedule(fn) {
    return new Promise((resolve, reject) => {
      queue.push({ fn, resolve, reject });
      runNext();
    });
  }

  /**
   * Translate a single string.
   * @param {string} text
   * @param {string} targetLang - 'en', 'ru', ...
   * @param {string} sourceLang - defaults to 'ka'
   * @returns {Promise<string>} - translated text (or original on failure)
   */
  async function translateText(text, targetLang, sourceLang = SOURCE_LANG) {
    if (text == null) return '';
    const str = String(text).trim();
    if (!str) return '';
    if (targetLang === sourceLang) return str;

    const key = `${sourceLang}|${targetLang}|${str}`;
    if (cache.has(key)) return cache.get(key);

    return schedule(async () => {
      try {
        const url = `${MYMEMORY_URL}?q=${encodeURIComponent(str)}&langpair=${sourceLang}|${targetLang}&de=${encodeURIComponent(DE_EMAIL)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        const translated =
          (data && data.responseData && data.responseData.translatedText) || str;
        // MyMemory sometimes returns warning strings when quota exceeded
        if (/MYMEMORY WARNING|QUERY LENGTH LIMIT|AUTO-DETECTED/i.test(translated)) {
          cache.set(key, str);
          return str;
        }
        cache.set(key, translated);
        return translated;
      } catch (err) {
        console.warn('[translate] failed', targetLang, err);
        return str;
      }
    });
  }

  /**
   * Translate one string into all target languages and return
   * an object { ka, en, ru, tr, ar, he, fa, uk }.
   */
  async function translateToAllLangs(text, sourceLang = SOURCE_LANG) {
    const result = { [sourceLang]: String(text || '') };
    const targets = ALL_LANGS.filter((l) => l !== sourceLang);
    await Promise.all(
      targets.map(async (lang) => {
        result[lang] = await translateText(text, lang, sourceLang);
      })
    );
    return result;
  }

  /**
   * Translate an array of strings (e.g. highlights).
   * Returns array of per-string language objects.
   */
  async function translateArrayToAllLangs(arr, sourceLang = SOURCE_LANG) {
    if (!Array.isArray(arr)) return [];
    return Promise.all(arr.map((s) => translateToAllLangs(s, sourceLang)));
  }

  // Expose on window
  window.GTTranslate = {
    translateText,
    translateToAllLangs,
    translateArrayToAllLangs,
    SOURCE_LANG,
    TARGET_LANGS,
    ALL_LANGS,
  };
})();
