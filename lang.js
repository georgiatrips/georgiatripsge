/* ===== LANGUAGE SWITCHER =====
   Handles only the navbar language selector UI and persistence.
   Actual content translation will be wired in later.
================================ */
(function () {
  const LANGUAGES = {
    ka: { icon: 'ge.png', code: 'KA', name: 'ქართული' },
    en: { icon: 'gb.png', code: 'EN', name: 'English' },
    ru: { icon: 'ru.png', code: 'RU', name: 'Русский' },
    tr: { icon: 'tr.png', code: 'TR', name: 'Türkçe' },
    ar: { icon: 'sa.png', code: 'AR', name: 'العربية' },
    he: { icon: 'il.png', code: 'HE', name: 'עברית' },
    fa: { icon: 'ir.png', code: 'FA', name: 'فارسی' },
    uk: { icon: 'ua.png', code: 'UK', name: 'Українська' }
  };
  const STORAGE_KEY = 'gt_lang';
  const DEFAULT_LANG = 'ka';

  function getStoredLang() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && LANGUAGES[saved]) return saved;
    } catch (e) { /* ignore */ }
    return DEFAULT_LANG;
  }

  function storeLang(lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ }
  }

  function updateButton(lang) {
    const data = LANGUAGES[lang] || LANGUAGES[DEFAULT_LANG];
    const flagEl = document.getElementById('nav-lang-flag');
    const codeEl = document.getElementById('nav-lang-code');
    if (flagEl) flagEl.innerHTML = `<img src="https://flagcdn.com/w20/${data.icon}" alt="${data.name}">`;
    if (codeEl) codeEl.textContent = data.code;
  }

  function markActive(lang) {
    document.querySelectorAll('.lang-dropdown-menu a[data-lang]').forEach(a => {
      a.classList.toggle('active', a.dataset.lang === lang);
    });
  }

  // RTL languages
  const RTL_LANGS = ['ar', 'he', 'fa'];

  function applyDocAttrs(lang) {
    document.documentElement.setAttribute('data-lang', lang);
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', RTL_LANGS.includes(lang) ? 'rtl' : 'ltr');
  }

  // ---------- Loading overlay ----------
  let overlayEl = null;
  let hideTimer = null;
  function ensureOverlay() {
    if (overlayEl) return overlayEl;
    overlayEl = document.createElement('div');
    overlayEl.className = 'gt-lang-overlay';
    overlayEl.setAttribute('role', 'status');
    overlayEl.setAttribute('aria-live', 'polite');
    overlayEl.setAttribute('data-no-translate', '');
    overlayEl.innerHTML = '<span class="gt-lang-overlay__spinner" aria-hidden="true"></span><span class="gt-lang-overlay__text">…</span>';
    document.body.appendChild(overlayEl);
    return overlayEl;
  }
  function loaderLabel() {
    try { if (window.t) return window.t('loading'); } catch (e) { /* ignore */ }
    return 'Loading…';
  }
  function showOverlay() {
    const el = ensureOverlay();
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    el.classList.remove('is-hiding');
    el.classList.add('is-visible');
    const textEl = el.querySelector('.gt-lang-overlay__text');
    if (textEl) textEl.textContent = loaderLabel();
  }
  function hideOverlay() {
    if (!overlayEl) return;
    overlayEl.classList.add('is-hiding');
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (overlayEl) {
        overlayEl.classList.remove('is-visible', 'is-hiding');
      }
      hideTimer = null;
    }, 260);
  }

  function triggerReRender(lang) {
    // Expose current language globally for localize() helpers
    window.GT_CURRENT_LANG = lang;

    document.documentElement.classList.add('gt-rerendering');

    // Re-render dynamic Firebase data (tours, cars, posts, featured, detail pages)
    if (typeof window.reRenderAllData === 'function') {
      try { window.reRenderAllData(); } catch (e) { console.error('[lang] reRenderAllData error:', e); }
    }

    // Dispatch both old + new events for any listeners
    document.dispatchEvent(new CustomEvent('lang:change', { detail: { lang } }));
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
  }

  async function setLang(lang) {
    if (!LANGUAGES[lang]) return;
    storeLang(lang);
    updateButton(lang);
    markActive(lang);
    applyDocAttrs(lang);

    // Show the spinner pill immediately so the user sees feedback while the
    // DOM re-translator walks every node + the API fills in missing strings.
    showOverlay();

    triggerReRender(lang);

    // Wait for the static-HTML translator to finish (it may hit the API for
    // leftover phrases). Then hide the spinner and drop the dim-out class.
    try {
      if (window.GTUITranslate && typeof window.GTUITranslate.apply === 'function') {
        await window.GTUITranslate.apply(lang);
      }
    } catch (e) { /* ignore */ }

    // Keep the loader on-screen at least a tick so very fast paths still flash
    // the spinner visibly, rather than appearing and disappearing instantly.
    await new Promise((r) => setTimeout(r, 200));

    document.documentElement.classList.remove('gt-rerendering');
    hideOverlay();
  }

  function init() {
    const current = getStoredLang();
    window.GT_CURRENT_LANG = current;
    updateButton(current);
    markActive(current);
    applyDocAttrs(current);

    document.querySelectorAll('.lang-dropdown-menu a[data-lang]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        setLang(a.dataset.lang);
        const menu = a.closest('.dropdown-menu');
        if (menu) menu.classList.remove('show');
      });
    });
  }

  // Expose minimal API for future use
  window.GTLang = {
    get: getStoredLang,
    set: setLang,
    list: () => Object.keys(LANGUAGES),
    meta: (lang) => LANGUAGES[lang] || null
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
