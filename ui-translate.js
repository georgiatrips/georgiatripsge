/* =========================================================
   UI AUTO-TRANSLATOR (static HTML chrome)
   -----------------------------------------------------------
   Walks the DOM, captures every English text node + a small
   set of translatable attributes, and – whenever the selected
   site language changes – rewrites them via MyMemory (see
   translate.js). Results are cached in localStorage so that
   subsequent page loads render instantly in the chosen lang.

   Dynamic Firebase content (tour cards, cars, posts, etc.)
   is ALREADY translated via `window.localize()` per language
   object, so those containers must be marked with
   `data-no-translate` to opt out of this runtime translator.
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

  // ---------- persistent cache ----------
  const CACHE_KEY = 'gt_ui_translations_v1';
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

  // A string is worth translating if it has at least one letter and is >1 char.
  function isTranslatable(text) {
    if (text == null) return false;
    const t = String(text).trim();
    if (t.length < 2) return false;
    if (!/[\p{L}]/u.test(t)) return false;
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

  // ---------- node discovery ----------
  /**
   * Walk the DOM and return every TEXT node we should translate.
   * As a side effect, remembers each node's original English text on
   * the node itself (expando) the first time we encounter it.
   */
  function collectTextNodes(root) {
    const out = [];
    if (!root) return out;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        const parent = n.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
        if (parent.closest && parent.closest('[data-no-translate]')) {
          return NodeFilter.FILTER_REJECT;
        }
        // Use the already-cached original when available so we don't
        // reject nodes that were just translated into e.g. Russian.
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

  /**
   * Walk the DOM and return every { element, attr } pair whose attribute
   * value we should translate. Also remembers the original values.
   */
  function collectAttrSpecs(root) {
    const out = [];
    if (!root) return out;
    const all = root.querySelectorAll('*');
    all.forEach((el) => {
      if (SKIP_TAGS.has(el.tagName)) return;
      if (el.closest('[data-no-translate]')) return;
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

  async function apply(targetLang) {
    const myRun = ++runToken;
    const lang = targetLang || currentLang();
    const textNodes = collectTextNodes(document.body);
    const attrSpecs = collectAttrSpecs(document.body);

    // 1) Restoring to source — just dump originals back and exit.
    if (lang === SRC) {
      textNodes.forEach((n) => {
        if (n.__i18nOrig != null) n.nodeValue = n.__i18nOrig;
      });
      attrSpecs.forEach(({ el, attr }) => {
        const v = el.__i18nOrigAttrs && el.__i18nOrigAttrs[attr];
        if (v != null) el.setAttribute(attr, v);
      });
      return;
    }

    // 2) Render cached translations immediately and collect what's missing.
    const missing = new Set();

    textNodes.forEach((n) => {
      const orig = n.__i18nOrig;
      if (orig == null) return;
      const trimmed = orig.trim();
      const key = cacheKey(lang, trimmed);
      if (cache[key] != null) {
        n.nodeValue = preserveWhitespace(orig, cache[key]);
      } else {
        missing.add(trimmed);
      }
    });

    attrSpecs.forEach(({ el, attr }) => {
      const orig = el.__i18nOrigAttrs[attr];
      if (orig == null) return;
      const trimmed = String(orig).trim();
      const key = cacheKey(lang, trimmed);
      if (cache[key] != null) {
        el.setAttribute(attr, cache[key]);
      } else {
        missing.add(trimmed);
      }
    });

    if (!missing.size || !window.GTTranslate) return;

    // 3) Fetch missing translations in parallel (translate.js throttles to 4).
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

    // Abort if a newer apply() has started (e.g. user flipped language again).
    if (myRun !== runToken) return;

    // 4) Re-apply now that cache is populated.
    textNodes.forEach((n) => {
      const orig = n.__i18nOrig;
      if (orig == null) return;
      const key = cacheKey(lang, orig.trim());
      if (cache[key] != null) n.nodeValue = preserveWhitespace(orig, cache[key]);
    });
    attrSpecs.forEach(({ el, attr }) => {
      const orig = el.__i18nOrigAttrs[attr];
      if (orig == null) return;
      const key = cacheKey(lang, String(orig).trim());
      if (cache[key] != null) el.setAttribute(attr, cache[key]);
    });
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
