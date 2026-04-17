/* =========================================================
   DYNAMIC CONTENT LOCALIZATION HELPER
   Picks the correct language string out of a Firestore value
   that may be either a plain string (legacy data) or a
   language object like { ka, en, ru, ... }.
   ========================================================= */
(function () {
  const DEFAULT_LANG = 'ka';
  const FALLBACK_ORDER = ['ka', 'en', 'ru', 'tr', 'uk', 'ar', 'he', 'fa'];

  function currentLang() {
    try {
      if (window.GTLang && typeof window.GTLang.get === 'function') {
        return window.GTLang.get() || DEFAULT_LANG;
      }
    } catch (e) { /* ignore */ }
    return document.documentElement.getAttribute('data-lang') || DEFAULT_LANG;
  }

  /**
   * Return a localized string from a plain string OR a {ka,en,...} object.
   * @param {string|object|null|undefined} value
   * @param {string} [lang] - override current language
   */
  function localize(value, lang) {
    if (value == null) return '';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (Array.isArray(value)) {
      // For arrays we localize each element and join fallback handled by caller
      return value.map((v) => localize(v, lang));
    }
    if (typeof value === 'object') {
      const L = lang || currentLang();
      if (value[L] && String(value[L]).trim()) return value[L];
      // fallback chain
      for (const f of FALLBACK_ORDER) {
        if (value[f] && String(value[f]).trim()) return value[f];
      }
      // last resort – first non-empty value
      for (const k in value) {
        if (value[k] && String(value[k]).trim()) return value[k];
      }
      return '';
    }
    return String(value);
  }

  /**
   * Localize an array value (e.g. highlights). Always returns array of strings.
   */
  function localizeArray(value, lang) {
    if (!Array.isArray(value)) return [];
    return value.map((item) => {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        return localize(item, lang);
      }
      return String(item || '');
    });
  }

  window.localize = localize;
  window.localizeArray = localizeArray;
  window.i18nData = { localize, localizeArray, currentLang };
})();
