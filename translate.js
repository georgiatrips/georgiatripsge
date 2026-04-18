/* =========================================================
   MYMEMORY TRANSLATION CLIENT
   Free API (no key needed). With `de=email` get 50k words/day.
   Docs: https://mymemory.translated.net/doc/spec.php
   ========================================================= */
(function () {
  const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';
  const GOOGLE_URL = 'https://translate.googleapis.com/translate_a/single';
  // Using admin email unlocks 50k words/day instead of 10k.
  const DE_EMAIL = 'georgiatrips5@gmail.com';

  // All supported site languages. Source is always KA.
  const SOURCE_LANG = 'ka';
  const TARGET_LANGS = ['en', 'ru', 'tr', 'ar', 'he', 'uk'];
  const ALL_LANGS = [SOURCE_LANG, ...TARGET_LANGS];

  let currentEngine = localStorage.getItem('gt_active_engine') || 'mymemory';

  // In-memory cache (per session). Keyed by `src|tgt|text`.
  const cache = new Map();

  // Basic concurrency limiter so we don't hammer the API. Lowered to 1
  // because MyMemory comfortably handles parallel requests from one IP and the
  // language-switch overlay is blocking until this finishes.
  const MAX_CONCURRENT = 1;
  const COOLDOWN_MS = 500; // პაუზა მოთხოვნებს შორის
  let active = 0;
  const queue = [];

  // Quota Tracking (Local Estimator)
  const QUOTA_LIMIT = 50000;
  const QUOTA_KEYS = {
    mymemory: 'gt_translate_used_today_mm',
    google: 'gt_translate_used_today_gg'
  };
  const DATE_KEY = 'gt_translate_last_reset';

  function getUsedQuota(engine = currentEngine) {
    const today = new Date().toDateString();
    if (localStorage.getItem(DATE_KEY) !== today) {
      localStorage.setItem(DATE_KEY, today);
      localStorage.setItem(QUOTA_KEYS.mymemory, '0');
      localStorage.setItem(QUOTA_KEYS.google, '0');
      return 0;
    }
    return parseInt(localStorage.getItem(QUOTA_KEYS[engine]) || '0', 10);
  }

  function addUsedQuota(text, engine = currentEngine) {
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    const used = getUsedQuota(engine) + words;
    localStorage.setItem(QUOTA_KEYS[engine], used.toString());
    window.dispatchEvent(new CustomEvent('quota:updated'));
  }

  function runNext() {
    if (active >= MAX_CONCURRENT) return;
    const job = queue.shift();
    if (!job) return;
    active++;
    job.fn().then(
      (res) => { 
        active--; job.resolve(res); 
        setTimeout(runNext, COOLDOWN_MS); // დაველოდოთ ცოტა ხანი შემდეგ მოთხოვნამდე
      },
      (err) => { 
        active--; job.reject(err); 
        setTimeout(runNext, COOLDOWN_MS); 
      }
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
   * @param {string} engineOverride - 'mymemory' or 'google'
   * @returns {Promise<string>} - translated text (or original on failure)
   */
  async function translateText(text, targetLang, sourceLang = SOURCE_LANG, engineOverride = null) {
    if (text == null) return '';
    const str = String(text).trim();
    if (!str) return '';
    if (targetLang === sourceLang) return str;

    const engine = engineOverride || currentEngine;
    const key = `${engine}|${sourceLang}|${targetLang}|${str}`;
    if (cache.has(key)) return cache.get(key);

    return schedule(async () => {
      let retries = 0;
      const maxRetries = 2;

      const fetchTranslation = async () => {
        if (engine === 'google') {
          const url = `${GOOGLE_URL}?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(str)}`;
          const res = await fetch(url);
          if (!res.ok) throw new Error('Google HTTP ' + res.status);
          const data = await res.json();
          const translated = data && data[0] && data[0][0] && data[0][0][0] ? data[0][0][0] : str;
          cache.set(key, translated);
          addUsedQuota(str, 'google');
          return translated;
        }

        // MyMemory Logic
        const url = `${MYMEMORY_URL}?q=${encodeURIComponent(str)}&langpair=${sourceLang}|${targetLang}&de=${encodeURIComponent(DE_EMAIL)}`;
        const res = await fetch(url);

        // Handle rate limiting (429) with a retry after delay
        if (res.status === 429 && retries < maxRetries) {
          retries++;
          const wait = retries * 2000;
          console.warn(`[translate] Rate limited (429) for ${targetLang}. Retrying in ${wait}ms...`);
          await new Promise(resolve => setTimeout(resolve, wait));
          return fetchTranslation();
        }

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
      };

      try {
        return await fetchTranslation();
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
  async function translateToAllLangs(text, sourceLang = SOURCE_LANG, engine = null) {
    const result = { [sourceLang]: String(text || '') };
    const targets = ALL_LANGS.filter((l) => l !== sourceLang);
    await Promise.all(
      targets.map(async (lang) => {
        result[lang] = await translateText(text, lang, sourceLang, engine);
      })
    );
    return result;
  }

  /**
   * Translate an array of strings (e.g. highlights).
   * Returns array of per-string language objects.
   */
  async function translateArrayToAllLangs(arr, sourceLang = SOURCE_LANG, engine = null) {
    if (!Array.isArray(arr)) return [];
    return Promise.all(arr.map((s) => translateToAllLangs(s, sourceLang, engine)));
  }

  // Export quota info
  function getQuotaStats(engine = currentEngine) {
    const used = getUsedQuota(engine);
    const remaining = Math.max(0, QUOTA_LIMIT - used);
    const percent = Math.max(0, Math.min(100, (remaining / QUOTA_LIMIT) * 100));
    return { used, remaining, percent, limit: QUOTA_LIMIT };
  }

  // Expose on window
  window.GTTranslate = {
    translateText,
    translateToAllLangs,
    translateArrayToAllLangs,
    setEngine: (engine) => { 
      if (['mymemory', 'google'].includes(engine)) {
        currentEngine = engine; 
        localStorage.setItem('gt_active_engine', engine);
        window.dispatchEvent(new CustomEvent('quota:updated'));
      }
    },
    getEngine: () => currentEngine,
    SOURCE_LANG,
    TARGET_LANGS,
    ALL_LANGS,
    getQuotaStats
  };
})();
