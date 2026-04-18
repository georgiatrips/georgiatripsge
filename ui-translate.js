/* =========================================================
   UI AUTO-TRANSLATOR (static HTML chrome)
   -----------------------------------------------------------
   Walks the DOM, captures every English text node + a small
   set of translatable attributes, and whenever the selected
   site language changes, rewrites them.

   Speed strategy:
     1. Check `window.GTUIStrings.lookupPhrase()` – instant,
        covers every nav / hero / section phrase on the site.
     2. Fall back to the persistent localStorage cache.
     3. Only call the MyMemory API for leftover strings.

   Skip strategy (things we NEVER translate):
     * `GeorgiaTrips` brand text inside `.nav-logo`
     * language switcher button + dropdown (`.nav-lang-dropdown`)
     * currency switcher (`.nav-currency-dropdown`,
       `[data-currency-button]`)
     * any user-marked `[data-no-translate]` container
       (dynamic Firestore content renders its own localized
       copy through `window.localize()`).
   ========================================================= */
(function () {
  // Source language of the static HTML (all hand-written chrome is English).
  const SRC = 'en';

  // Attributes whose values should be translated if they contain user-facing text.
  const ATTRS = ['placeholder', 'title', 'aria-label'];

  // Nodes whose textual contents must be left alone.
  const SKIP_TAGS = new Set([
    'SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA'
  ]);

  // Any element matching this selector (or a descendant of one) is opted out
  // of runtime translation. Brand names, language and currency switchers live
  // here.
  const SKIP_SELECTOR = [
    '[data-no-translate]',
    '.nav-logo',                // header + footer brand
    '.nav-lang-dropdown',       // full language switcher (button + menu)
    '.nav-currency-dropdown',   // full currency switcher (button + menu)
    '[data-currency-button]',   // paranoia guard for currency button
    '.lang-flag',
    '.lang-code',
    '.lang-caret',
    '.lang-name'                // native language names inside the menu
  ].join(',');

  // Regex of brand tokens that must never be translated, even if they slip
  // through one of the skip selectors (e.g. appear in a freeform sentence).
  const BRAND_REGEX = /\b(Georgia\s*Trips|GeorgiaTrips|georgiatrips)\b/i;

  // ---------- persistent cache ----------
  const CACHE_KEY = 'gt_ui_translations_v2';
  let cache = {};
  try {
    cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') || {};
  } catch (e) { cache = {}; }

  let saveTimer = null;
  function saveCacheSoon() {
    if (saveTimer) return;
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch (e) { /* quota */ }
      saveTimer = null;
    }, 400);
  }

  // ---------- helpers ----------
  function currentLang() {
    try {
      if (window.GTLang && typeof window.GTLang.get === 'function') {
        return window.GTLang.get() || SRC;
      }
    } catch (e) { /* ignore */ }
    const attr = document.documentElement.getAttribute('data-lang');
    return attr || SRC;
  }

  // A string is worth translating if it has at least one letter, is >1 char,
  // and is not a brand-only phrase.
  function isTranslatable(text) {
    if (text == null) return false;
    const t = String(text).trim();
    if (t.length < 2) return false;
    if (!/[\p{L}]/u.test(t)) return false;

    // Protect brand-only strings ("GeorgiaTrips", "Georgia Trips").
    const stripped = t.replace(BRAND_REGEX, '').trim();
    if (!stripped || stripped.length < 2 || !/[\p{L}]/u.test(stripped)) {
      return false;
    }
    return true;
  }

  function cacheKey(lang, src) {
    return SRC + '|' + lang + '|' + src;
  }

  function preserveWhitespace(originalFull, translated) {
    const lead  = (originalFull.match(/^\s+/) || [''])[0];
    const trail = (originalFull.match(/\s+$/) || [''])[0];
    return lead + translated + trail;
  }

  // Phrase-dictionary lookup (instant, no network).
  function dictLookup(trimmed, lang) {
    if (window.GTUIStrings && typeof window.GTUIStrings.lookupPhrase === 'function') {
      return window.GTUIStrings.lookupPhrase(trimmed, lang);
    }
    return null;
  }

  // ---------- node discovery ----------
  function collectTextNodes(root) {
    const out = [];
    if (!root) return out;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        const parent = n.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
        if (parent.closest && parent.closest(SKIP_SELECTOR)) {
          return NodeFilter.FILTER_REJECT;
        }
        const check = n.__i18nOrig != null ? n.__i18nOrig : n.nodeValue;
        if (!isTranslatable(check)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let n;
    while ((n = walker.nextNode())) {
      if (n.__i18nOrig == null) n.__i18nOrig = n.nodeValue;
      out.push(n);
    }
    return out;
  }

  function collectAttrSpecs(root) {
    const out = [];
    if (!root) return out;
    const all = root.querySelectorAll('*');
    all.forEach((el) => {
      if (SKIP_TAGS.has(el.tagName)) return;
      if (el.closest(SKIP_SELECTOR)) return;
      for (let i = 0; i < ATTRS.length; i++) {
        const attr = ATTRS[i];
        if (!el.hasAttribute(attr)) continue;
        if (!el.__i18nOrigAttrs) el.__i18nOrigAttrs = {};
        const cached = el.__i18nOrigAttrs[attr];
        const live = el.getAttribute(attr);
        const source = cached != null ? cached : live;
        if (!isTranslatable(source)) continue;
        if (cached == null) el.__i18nOrigAttrs[attr] = live;
        out.push({ el: el, attr: attr });
      }
    });
    return out;
  }

  // ---------- apply ----------
  let runToken = 0;

  /**
   * Synchronous phase: translate every node we can from the in-memory
   * dictionary + persistent cache. Returns the list of strings that still
   * need an API call. Runs in a single pass — no awaits, no microtasks —
   * so the page is visually localized the instant this function returns.
   */
  function applySync(targetLang) {
    const lang = targetLang || currentLang();
    const textNodes = collectTextNodes(document.body);
    const attrSpecs = collectAttrSpecs(document.body);

    // Restoring to source — dump originals back and exit.
    if (lang === SRC) {
      textNodes.forEach((n) => {
        if (n.__i18nOrig != null) n.nodeValue = n.__i18nOrig;
      });
      attrSpecs.forEach(({ el, attr }) => {
        const v = el.__i18nOrigAttrs && el.__i18nOrigAttrs[attr];
        if (v != null) el.setAttribute(attr, v);
      });
      return { lang, missing: new Set(), textNodes, attrSpecs };
    }

    const missing = new Set();

    function resolve(trimmed) {
      const fromDict = dictLookup(trimmed, lang);
      if (fromDict) return fromDict;
      const key = cacheKey(lang, trimmed);
      if (cache[key] != null) return cache[key];
      return null;
    }

    textNodes.forEach((n) => {
      const orig = n.__i18nOrig;
      if (orig == null) return;
      const trimmed = orig.trim();
      const hit = resolve(trimmed);
      if (hit != null) {
        n.nodeValue = preserveWhitespace(orig, hit);
      } else {
        missing.add(trimmed);
      }
    });

    attrSpecs.forEach(({ el, attr }) => {
      const orig = el.__i18nOrigAttrs[attr];
      if (orig == null) return;
      const trimmed = String(orig).trim();
      const hit = resolve(trimmed);
      if (hit != null) {
        el.setAttribute(attr, hit);
      } else {
        missing.add(trimmed);
      }
    });

    return { lang, missing, textNodes, attrSpecs };
  }

  /**
   * Full apply: runs the sync pass, then fires API fallback in the
   * background for anything the dictionary didn't cover. Returns
   * immediately after the sync pass — the API fallback continues in
   * the background and re-renders on completion, so the user never
   * waits on the network.
   */
  function apply(targetLang) {
    const myRun = ++runToken;
    const { lang, missing, textNodes, attrSpecs } = applySync(targetLang);

    if (lang === SRC || !missing.size || !window.GTTranslate) {
      return Promise.resolve();
    }

    // Fetch missing translations in the background — do NOT block.
    const fallback = (async () => {
      const jobs = Array.from(missing).map(async (src) => {
        const key = cacheKey(lang, src);
        try {
          const tr = await window.GTTranslate.translateText(src, lang, SRC);
          cache[key] = tr || src;
        } catch (e) {
          cache[key] = src;
        }
      });
      await Promise.all(jobs);
      saveCacheSoon();

      // Abort if a newer apply() has started.
      if (myRun !== runToken) return;

      function resolve(trimmed) {
        const fromDict = dictLookup(trimmed, lang);
        if (fromDict) return fromDict;
        const key = cacheKey(lang, trimmed);
        if (cache[key] != null) return cache[key];
        return null;
      }
      textNodes.forEach((n) => {
        const orig = n.__i18nOrig;
        if (orig == null) return;
        const hit = resolve(orig.trim());
        if (hit != null) n.nodeValue = preserveWhitespace(orig, hit);
      });
      attrSpecs.forEach(({ el, attr }) => {
        const orig = el.__i18nOrigAttrs[attr];
        if (orig == null) return;
        const hit = resolve(String(orig).trim());
        if (hit != null) el.setAttribute(attr, hit);
      });
    })();

    return fallback;
  }

  // ---------- mutation observer (handle dynamically-inserted content) ----------
  let moTimer = null;
  function scheduleReapply() {
    if (moTimer) return;
    moTimer = setTimeout(() => {
      moTimer = null;
      apply(currentLang());
    }, 250);
  }

  function initObserver() {
    const mo = new MutationObserver((muts) => {
      for (let i = 0; i < muts.length; i++) {
        const m = muts[i];
        if (m.type === 'childList' && (m.addedNodes.length || m.removedNodes.length)) {
          scheduleReapply();
          return;
        }
      }
    });
    mo.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: false,
      attributes: false
    });
  }

  function init() {
    // Sync dictionary pass — the page is visually localized the moment
    // this returns (no awaits, no network).
    applySync(currentLang());

    // Lift the anti-FOUC boot overlay NOW — don't wait for the background
    // API fallback for stragglers.
    if (window.GTLangBoot && typeof window.GTLangBoot.done === 'function') {
      window.GTLangBoot.done();
    }

    // Kick off observer + background API fallback for anything the
    // dictionary didn't cover.
    initObserver();
    apply(currentLang());
  }

  // Public API (optional)
  window.GTUITranslate = {
    apply: apply,
    refresh: function () { return apply(currentLang()); },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-translate whenever the site language changes.
  window.addEventListener('languageChanged', function (e) {
    apply((e && e.detail && e.detail.lang) || currentLang());
  });
  document.addEventListener('lang:change', function (e) {
    apply((e && e.detail && e.detail.lang) || currentLang());
  });
})();
