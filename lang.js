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

  // ---------- Full-page loading overlay ----------
  // Per-language labels for the overlay so the text itself is immediately
  // readable in the target language (no wait for translation).
  const OVERLAY_LABELS = {
    ka: { text: 'ითარგმნება...',        sub: 'გთხოვთ დაელოდოთ, საიტი იტვირთება თქვენს ენაზე.' },
    en: { text: 'Translating...',       sub: 'Please wait, the site is loading in your language.' },
    ru: { text: 'Переводим...',         sub: 'Пожалуйста, подождите, сайт загружается на вашем языке.' },
    tr: { text: 'Çevriliyor...',        sub: 'Lütfen bekleyin, site dilinize yükleniyor.' },
    ar: { text: 'جاري الترجمة...',      sub: 'يرجى الانتظار، يتم تحميل الموقع بلغتك.' },
    he: { text: 'מתרגם...',             sub: 'אנא המתן, האתר נטען בשפה שלך.' },
    fa: { text: 'در حال ترجمه...',      sub: 'لطفاً صبر کنید، سایت در حال بارگذاری به زبان شما است.' },
    uk: { text: 'Переклад...',          sub: 'Будь ласка, зачекайте, сайт завантажується вашою мовою.' }
  };

  let overlayEl = null;
  let hideTimer = null;
  function ensureOverlay() {
    if (overlayEl) return overlayEl;
    overlayEl = document.createElement('div');
    overlayEl.className = 'gt-lang-overlay';
    overlayEl.setAttribute('role', 'status');
    overlayEl.setAttribute('aria-live', 'polite');
    overlayEl.setAttribute('data-no-translate', '');
    overlayEl.innerHTML = [
      '<div class="gt-lang-overlay__brand">Georgia Trips</div>',
      '<span class="gt-lang-overlay__spinner" aria-hidden="true"></span>',
      '<span class="gt-lang-overlay__text"></span>',
      '<span class="gt-lang-overlay__subtext"></span>'
    ].join('');
    document.body.appendChild(overlayEl);
    return overlayEl;
  }
  function showOverlay(lang) {
    const el = ensureOverlay();
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    const labels = OVERLAY_LABELS[lang] || OVERLAY_LABELS.en;
    const textEl = el.querySelector('.gt-lang-overlay__text');
    const subEl  = el.querySelector('.gt-lang-overlay__subtext');
    if (textEl) textEl.textContent = labels.text;
    if (subEl)  subEl.textContent  = labels.sub;
    el.classList.remove('is-hiding');
    el.classList.add('is-visible');
    document.documentElement.classList.add('gt-lang-switching');
  }
  function hideOverlay() {
    if (!overlayEl) {
      document.documentElement.classList.remove('gt-lang-switching');
      return;
    }
    overlayEl.classList.add('is-hiding');
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (overlayEl) {
        overlayEl.classList.remove('is-visible', 'is-hiding');
      }
      document.documentElement.classList.remove('gt-lang-switching');
      hideTimer = null;
    }, 220);
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
    const current = getStoredLang();
    if (current === lang) {
      // No change — just close the menu cleanly.
      return;
    }

    // 1. Show the full-page blocking overlay BEFORE we touch the DOM so the
    //    user never sees partially-translated content.
    showOverlay(lang);

    // Give the overlay one frame to actually paint before we start the heavy
    // re-render work on the main thread.
    await new Promise((r) => requestAnimationFrame(() => r()));

    storeLang(lang);
    updateButton(lang);
    markActive(lang);
    applyDocAttrs(lang);

    // 2. Re-render Firestore-backed content + dispatch lang:change events.
    triggerReRender(lang);

    // 3. Wait for the static-HTML translator to finish (it may hit the API
    //    for leftover phrases). Runs in parallel with the Firestore render.
    try {
      if (window.GTUITranslate && typeof window.GTUITranslate.apply === 'function') {
        await window.GTUITranslate.apply(lang);
      }
    } catch (e) { /* ignore */ }

    // 4. Give the browser one more frame to paint the fully-translated DOM
    //    before we lift the overlay. No artificial delay.
    await new Promise((r) => requestAnimationFrame(() => r()));

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
