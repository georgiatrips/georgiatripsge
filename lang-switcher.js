/*
 * Language Switcher for Georgia Trips
 * -----------------------------------
 * Injects a language dropdown into the navbar on every page and uses
 * Google's Website Translator to translate the page on-the-fly.
 *
 * Supported languages (main tourism markets for Georgia):
 *   en - English
 *   ru - Русский (Russian)
 *   ka - ქართული (Georgian)
 *   tr - Türkçe (Turkish)
 *   ar - العربية (Arabic)
 *   he - עברית (Hebrew)  - Israeli tourists
 *   fa - فارسی (Persian) - Iranian tourists
 *   de - Deutsch (German)
 *   fr - Français (French)
 *   es - Español (Spanish)
 *   pl - Polski (Polish)
 *   zh - 中文 (Chinese)
 */

(function () {
  const LANGS = [
    { code: 'en', label: 'EN', name: 'English' },
    { code: 'ka', label: 'KA', name: 'ქართული' },
    { code: 'ru', label: 'RU', name: 'Русский' },
    { code: 'tr', label: 'TR', name: 'Türkçe' },
    { code: 'ar', label: 'AR', name: 'العربية', rtl: true },
    { code: 'he', label: 'HE', name: 'עברית', rtl: true },
    { code: 'fa', label: 'FA', name: 'فارسی', rtl: true },
    { code: 'de', label: 'DE', name: 'Deutsch' },
    { code: 'fr', label: 'FR', name: 'Français' },
    { code: 'es', label: 'ES', name: 'Español' },
    { code: 'pl', label: 'PL', name: 'Polski' },
    { code: 'zh', label: 'ZH', name: '中文' },
  ];

  const STORAGE_KEY = 'gt_lang';
  const INCLUDED = LANGS.map(l => l.code).join(',');

  /* ---------------- CSS ---------------- */
  function injectStyles() {
    if (document.getElementById('gt-lang-switcher-styles')) return;
    const style = document.createElement('style');
    style.id = 'gt-lang-switcher-styles';
    style.textContent = `
      .nav-lang-dropdown {
        position: relative;
        display: inline-block;
      }
      .nav-lang-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        background: transparent;
        border: 1.5px solid rgba(11,60,93,0.18);
        color: var(--dark-blue, #0B3C5D);
        padding: 0.45rem 0.75rem;
        border-radius: 8px;
        font-family: 'Montserrat', sans-serif;
        font-weight: 700;
        font-size: 0.82rem;
        letter-spacing: 0.02em;
        cursor: pointer;
        transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
        line-height: 1;
      }
      .nav-lang-btn:hover,
      .nav-lang-btn[aria-expanded="true"] {
        background: var(--dark-blue, #0B3C5D);
        border-color: var(--dark-blue, #0B3C5D);
        color: #fff;
      }
      .nav-lang-btn svg {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }
      .nav-lang-btn .nav-lang-caret {
        width: 10px;
        height: 10px;
        transition: transform 0.2s ease;
      }
      .nav-lang-btn[aria-expanded="true"] .nav-lang-caret {
        transform: rotate(180deg);
      }
      .lang-dropdown-menu {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        min-width: 180px;
        background: #fff;
        border: 1px solid rgba(11,60,93,0.1);
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(11,60,93,0.12);
        padding: 0.4rem;
        display: none;
        z-index: 1000;
        max-height: 70vh;
        overflow-y: auto;
      }
      .lang-dropdown-menu.open {
        display: block;
      }
      .lang-option {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.55rem 0.75rem;
        border-radius: 6px;
        font-family: 'Montserrat', sans-serif;
        font-size: 0.88rem;
        font-weight: 600;
        color: var(--dark-blue, #0B3C5D);
        cursor: pointer;
        text-decoration: none;
        transition: background 0.15s ease, color 0.15s ease;
        background: transparent;
        border: none;
        width: 100%;
        text-align: left;
      }
      .lang-option:hover {
        background: rgba(46,196,182,0.12);
      }
      .lang-option.active {
        background: var(--dark-blue, #0B3C5D);
        color: #fff;
      }
      .lang-option .lang-code {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 32px;
        padding: 2px 6px;
        border-radius: 4px;
        background: rgba(11,60,93,0.08);
        color: var(--dark-blue, #0B3C5D);
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.04em;
      }
      .lang-option.active .lang-code {
        background: rgba(255,255,255,0.22);
        color: #fff;
      }

      /* Hide Google Translate's default UI */
      #google_translate_element { position: absolute; left: -9999px; top: -9999px; }
      .goog-te-banner-frame.skiptranslate,
      .goog-te-gadget-icon,
      .goog-logo-link,
      .goog-te-gadget > span > a { display: none !important; }
      .goog-te-gadget { color: transparent !important; font-size: 0 !important; }
      body { top: 0 !important; }
      .skiptranslate iframe { display: none !important; }

      /* Mobile: place language switcher nicely inside mobile menu */
      @media (max-width: 768px) {
        .nav-links .nav-lang-dropdown { width: 100%; }
        .nav-links .nav-lang-btn {
          width: 100%;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          font-size: 0.95rem;
        }
        .nav-links .lang-dropdown-menu {
          position: static;
          width: 100%;
          box-shadow: none;
          border: 1px solid rgba(11,60,93,0.08);
          margin-top: 0.5rem;
          max-height: 260px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /* ---------------- DOM ---------------- */
  function buildSwitcher() {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks || document.getElementById('nav-lang-dropdown')) return null;

    const current = getCurrentLang();

    const wrap = document.createElement('div');
    wrap.className = 'nav-lang-dropdown';
    wrap.id = 'nav-lang-dropdown';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nav-lang-btn';
    btn.id = 'nav-lang-btn';
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Change language');
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
      <span class="nav-lang-label">${escapeText(labelFor(current))}</span>
      <svg class="nav-lang-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    `;

    const menu = document.createElement('div');
    menu.className = 'dropdown-menu lang-dropdown-menu';
    menu.id = 'lang-dropdown-menu';
    menu.setAttribute('role', 'menu');
    LANGS.forEach(l => {
      const opt = document.createElement('button');
      opt.type = 'button';
      opt.className = 'lang-option' + (l.code === current ? ' active' : '');
      opt.setAttribute('role', 'menuitem');
      opt.setAttribute('data-lang', l.code);
      opt.innerHTML = `<span class="lang-code">${escapeText(l.label)}</span><span>${escapeText(l.name)}</span>`;
      opt.addEventListener('click', (e) => {
        e.preventDefault();
        setLanguage(l.code);
        closeMenu();
      });
      menu.appendChild(opt);
    });

    wrap.appendChild(btn);
    wrap.appendChild(menu);

    // Insert before the user dropdown if it exists, else append
    const userDropdown = navLinks.querySelector('#nav-user-dropdown');
    if (userDropdown) {
      navLinks.insertBefore(wrap, userDropdown);
    } else {
      navLinks.appendChild(wrap);
    }

    // Hidden Google Translate host
    if (!document.getElementById('google_translate_element')) {
      const host = document.createElement('div');
      host.id = 'google_translate_element';
      host.setAttribute('aria-hidden', 'true');
      document.body.appendChild(host);
    }

    // Toggle behavior
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menu.classList.contains('open');
      if (isOpen) closeMenu(); else openMenu();
    });

    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) closeMenu();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });

    function openMenu() {
      menu.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
    function closeMenu() {
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }

    return { btn, menu, wrap };
  }

  /* ---------------- Google Translate integration ---------------- */
  function loadGoogleTranslate() {
    if (window.__gtLoaded) return;
    window.__gtLoaded = true;

    window.googleTranslateElementInit = function () {
      try {
        new google.translate.TranslateElement({
          pageLanguage: 'en',
          includedLanguages: INCLUDED,
          layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        }, 'google_translate_element');
      } catch (err) {
        console.error('[v0] Google Translate init failed:', err);
      }
    };

    const s = document.createElement('script');
    s.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.async = true;
    s.onerror = () => console.error('[v0] Failed to load Google Translate');
    document.head.appendChild(s);
  }

  function setLanguage(code) {
    const prev = getCurrentLang();
    try { localStorage.setItem(STORAGE_KEY, code); } catch (e) {}

    // Set the googtrans cookie on all relevant domain scopes
    setGoogTransCookie(code);

    // Update UI immediately
    updateActiveState(code);

    // If Google Translate combo is already rendered, switch via it to avoid a full reload
    const combo = document.querySelector('select.goog-te-combo');
    if (combo) {
      combo.value = code === 'en' ? '' : code;
      combo.dispatchEvent(new Event('change'));
      // Ensure body direction is correct for RTL languages
      applyDirection(code);
      return;
    }

    // Otherwise reload so the googtrans cookie is picked up fresh
    if (prev !== code) {
      location.reload();
    }
  }

  function setGoogTransCookie(code) {
    const value = code === 'en' ? '/en/en' : `/en/${code}`;
    const host = location.hostname;
    const paths = [''];
    // Scope to current domain and, when applicable, its apex
    const hostParts = host.split('.');
    if (hostParts.length > 1) {
      paths.push('.' + hostParts.slice(-2).join('.'));
    }
    const cookieBase = `googtrans=${value}; path=/; max-age=${60 * 60 * 24 * 365}`;
    document.cookie = cookieBase;
    paths.forEach(p => {
      if (p) document.cookie = `${cookieBase}; domain=${p}`;
    });
  }

  function getCurrentLang() {
    // Prefer explicit localStorage
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v && LANGS.some(l => l.code === v)) return v;
    } catch (e) {}

    // Fall back to googtrans cookie
    const m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
    if (m) {
      const parts = decodeURIComponent(m[1]).split('/');
      const target = parts[2];
      if (target && LANGS.some(l => l.code === target)) return target;
    }
    return 'en';
  }

  function labelFor(code) {
    const l = LANGS.find(x => x.code === code);
    return l ? l.label : 'EN';
  }

  function updateActiveState(code) {
    const btnLabel = document.querySelector('#nav-lang-btn .nav-lang-label');
    if (btnLabel) btnLabel.textContent = labelFor(code);
    document.querySelectorAll('.lang-option').forEach(opt => {
      opt.classList.toggle('active', opt.getAttribute('data-lang') === code);
    });
  }

  function applyDirection(code) {
    const l = LANGS.find(x => x.code === code);
    if (l && l.rtl) {
      document.documentElement.setAttribute('dir', 'rtl');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
    }
  }

  function escapeText(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  /* ---------------- Init ---------------- */
  function init() {
    injectStyles();
    buildSwitcher();
    loadGoogleTranslate();
    applyDirection(getCurrentLang());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
