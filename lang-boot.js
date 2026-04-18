/* =========================================================
   LANG BOOT  —  must be the FIRST script in <head>.
   -----------------------------------------------------------
   Reads the user's saved language *synchronously* before any
   body content paints, hides the page, and shows a spinner
   in the correct language. The overlay is lifted as soon as
   `ui-translate.js` finishes its first apply() pass, so the
   user never sees a flash of the original English chrome.
   ========================================================= */
(function () {
  var STORAGE_KEY = 'gt_lang';
  var SRC_LANG    = 'en';           // language the static HTML is authored in
  var DEFAULT     = 'ka';           // site default for first-time visitors
  var RTL         = { ar: 1, he: 1 };
  var SUPPORTED   = { ka: 1, en: 1, ru: 1, tr: 1, ar: 1, he: 1, uk: 1 };

  var lang = DEFAULT;
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED[saved]) lang = saved;
  } catch (e) { /* ignore */ }

  var html = document.documentElement;
  html.setAttribute('lang', lang);
  html.setAttribute('data-lang', lang);
  html.setAttribute('dir', RTL[lang] ? 'rtl' : 'ltr');
  window.GT_BOOT_LANG = lang;

  // English users see no FOUC because the HTML is already English.
  if (lang === SRC_LANG) {
    window.GTLangBoot = { done: function () {} };
    return;
  }

  html.classList.add('gt-pretranslate');

  /* Critical CSS — injected before style.css is even parsed so the hide
     kicks in on the very first paint. */
  var css =
    'html.gt-pretranslate{background:#0b3c5d;}' +
    'html.gt-pretranslate body > *:not(.gt-lang-boot-overlay){visibility:hidden!important;}' +
    'html.gt-pretranslate body{overflow:hidden!important;}' +
    '.gt-lang-boot-overlay{' +
      'position:fixed;inset:0;z-index:2147483647;display:flex;' +
      'align-items:center;justify-content:center;flex-direction:column;' +
      'gap:1.25rem;padding:2rem;background:rgba(11,60,93,0.97);color:#fff;' +
      'text-align:center;font-family:\'Poppins\',\'Montserrat\',sans-serif;' +
      '-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);' +
      'opacity:1;transition:opacity 0.22s ease;' +
    '}' +
    '.gt-lang-boot-overlay.is-hiding{opacity:0;pointer-events:none;}' +
    '.gt-lang-boot-overlay__brand{' +
      'font-family:\'Montserrat\',sans-serif;font-weight:800;font-size:1.25rem;' +
      'letter-spacing:-0.3px;color:#2ec4b6;' +
    '}' +
    '.gt-lang-boot-overlay__spinner{' +
      'width:56px;height:56px;border-radius:50%;' +
      'border:4px solid rgba(46,196,182,0.25);border-top-color:#2ec4b6;' +
      'animation:gtBootSpin 0.85s linear infinite;' +
    '}' +
    '.gt-lang-boot-overlay__text{font-size:1rem;font-weight:600;letter-spacing:0.01em;}' +
    '.gt-lang-boot-overlay__sub{' +
      'font-size:0.82rem;font-weight:400;opacity:0.7;max-width:280px;line-height:1.5;' +
    '}' +
    '@keyframes gtBootSpin{to{transform:rotate(360deg);}}';

  var style = document.createElement('style');
  style.id = 'gt-lang-boot-css';
  style.appendChild(document.createTextNode(css));
  (document.head || document.documentElement).appendChild(style);

  /* Localized loader strings — inlined so they paint instantly, with no
     translation API call required. */
  var LABELS = {
    ka: { t: 'იტვირთება...',       s: 'გთხოვთ დაელოდოთ.' },
    ru: { t: 'Загрузка...',        s: 'Пожалуйста, подождите.' },
    tr: { t: 'Yükleniyor...',      s: 'Lütfen bekleyin.' },
    ar: { t: 'جاري التحميل...',    s: 'يرجى الانتظار.' },
    he: { t: 'טוען...',            s: 'אנא המתן.' },
    uk: { t: 'Завантаження...',    s: 'Будь ласка, зачекайте.' }
  };

  var overlayEl = null;
  function injectOverlay() {
    if (overlayEl || !document.body) return;
    var l = LABELS[lang] || LABELS.ka;
    overlayEl = document.createElement('div');
    overlayEl.className = 'gt-lang-boot-overlay';
    overlayEl.setAttribute('data-no-translate', '');
    overlayEl.setAttribute('role', 'status');
    overlayEl.setAttribute('aria-live', 'polite');
    overlayEl.innerHTML =
      '<div class="gt-lang-boot-overlay__brand">Georgia Trips</div>' +
      '<span class="gt-lang-boot-overlay__spinner" aria-hidden="true"></span>' +
      '<span class="gt-lang-boot-overlay__text">' + l.t + '</span>' +
      '<span class="gt-lang-boot-overlay__sub">' + l.s + '</span>';
    document.body.appendChild(overlayEl);
  }

  // Poll for <body> so the overlay appears the instant it's available.
  (function waitForBody() {
    if (document.body) { injectOverlay(); return; }
    setTimeout(waitForBody, 0);
  })();

  function finish() {
    html.classList.remove('gt-pretranslate');
    if (overlayEl) {
      overlayEl.classList.add('is-hiding');
      setTimeout(function () {
        if (overlayEl && overlayEl.parentNode) {
          overlayEl.parentNode.removeChild(overlayEl);
        }
        overlayEl = null;
      }, 240);
    }
  }

  window.GTLangBoot = { done: finish };

  /* Safety net — never leave the user stuck behind the overlay if the
     translation scripts fail to load. */
  setTimeout(function () {
    if (html.classList.contains('gt-pretranslate')) finish();
  }, 4000);
})();
