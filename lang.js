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

  function triggerReRender(lang) {
    // Expose current language globally for localize() helpers
    window.GT_CURRENT_LANG = lang;

    // Re-render dynamic Firebase data (tours, cars, posts, featured, detail pages)
    if (typeof window.reRenderAllData === 'function') {
      try { window.reRenderAllData(); } catch (e) { console.error('[lang] reRenderAllData error:', e); }
    }

    // Dispatch both old + new events for any listeners
    document.dispatchEvent(new CustomEvent('lang:change', { detail: { lang } }));
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
  }

  function setLang(lang) {
    if (!LANGUAGES[lang]) return;
    storeLang(lang);
    updateButton(lang);
    markActive(lang);
    applyDocAttrs(lang);
    triggerReRender(lang);
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
