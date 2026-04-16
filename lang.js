/* ===== LANGUAGE SWITCHER =====
   Handles only the navbar language selector UI and persistence.
   Actual content translation will be wired in later.
================================ */
(function () {
  const LANGUAGES = {
    ka: { flag: '🇬🇪', code: 'KA', name: 'ქართული' },
    en: { flag: '🇬🇧', code: 'EN', name: 'English' },
    ru: { flag: '🇷🇺', code: 'RU', name: 'Русский' },
    tr: { flag: '🇹🇷', code: 'TR', name: 'Türkçe' },
    ar: { flag: '🇸🇦', code: 'AR', name: 'العربية' },
    he: { flag: '🇮🇱', code: 'HE', name: 'עברית' },
    fa: { flag: '🇮🇷', code: 'FA', name: 'فارسی' },
    uk: { flag: '🇺🇦', code: 'UK', name: 'Українська' }
  };
  const STORAGE_KEY = 'gt_lang';
  const DEFAULT_LANG = 'en';

  function getStoredLang() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && LANGUAGES[saved]) return saved;
    } catch (e) { /* ignore */ }
    // Fallback: browser language match
    const browser = (navigator.language || 'en').toLowerCase().split('-')[0];
    return LANGUAGES[browser] ? browser : DEFAULT_LANG;
  }

  function storeLang(lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ }
  }

  function updateButton(lang) {
    const data = LANGUAGES[lang] || LANGUAGES[DEFAULT_LANG];
    const flagEl = document.getElementById('nav-lang-flag');
    const codeEl = document.getElementById('nav-lang-code');
    if (flagEl) flagEl.textContent = data.flag;
    if (codeEl) codeEl.textContent = data.code;
  }

  function markActive(lang) {
    document.querySelectorAll('.lang-dropdown-menu a[data-lang]').forEach(a => {
      a.classList.toggle('active', a.dataset.lang === lang);
    });
  }

  function setLang(lang) {
    if (!LANGUAGES[lang]) return;
    storeLang(lang);
    updateButton(lang);
    markActive(lang);
    document.documentElement.setAttribute('data-lang', lang);
    // Fire a custom event so other scripts can react later (actual translation)
    document.dispatchEvent(new CustomEvent('lang:change', { detail: { lang } }));
  }

  function init() {
    const current = getStoredLang();
    updateButton(current);
    markActive(current);
    document.documentElement.setAttribute('data-lang', current);

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
