/* =========================================================
   ADMIN TRANSLATION EDITOR
   Shows language tabs for each admin modal (tour/car/post/featured).
   On "Auto-translate" it calls MyMemory (via translate.js) to
   translate Georgian inputs into all target languages. Admin can
   edit the generated translations before saving.

   On save, AdminI18n.pack(entity, fieldKey, georgianValue) returns
   either a multi-lang object { ka, en, ru, ... } (when translations
   exist) or the plain georgian value (for backwards compatibility).
   ========================================================= */
(function () {
  // Target display languages (excluding source KA)
  const LANG_META = [
    { code: 'en', name: 'English' },
    { code: 'ru', name: 'Русский' },
    { code: 'tr', name: 'Türkçe' },
    { code: 'ar', name: 'العربية',       rtl: true },
    { code: 'he', name: 'עברית',         rtl: true },
    { code: 'uk', name: 'Українська' },
  ];

  // Describes which fields of each entity should be translated
  const TRANSLATABLE_FIELDS = {
    tour: [
      { key: 'title',      inputId: 'tour-title',     label: 'Title',       type: 'input' },
      { key: 'desc',       inputId: 'tour-desc',      label: 'Description', type: 'textarea' },
      { key: 'duration',   inputId: 'tour-duration',  label: 'Duration',    type: 'input' },
      { key: 'highlights', inputId: null,             label: 'Highlights',  type: 'array' },
    ],
    car: [
      { key: 'title', inputId: 'car-title', label: 'Title',       type: 'input' },
      { key: 'info',  inputId: 'car-desc',  label: 'Description', type: 'textarea' },
    ],
    post: [
      { key: 'title',    inputId: 'post-title',    label: 'Title',    type: 'input' },
      { key: 'text',     inputId: 'post-content',  label: 'Content',  type: 'textarea' },
    ],
    featured: [
      { key: 'title', inputId: 'featured-title', label: 'Title',       type: 'input' },
      { key: 'desc',  inputId: 'featured-desc',  label: 'Description', type: 'textarea' },
      { key: 'tag',   inputId: 'featured-tag',   label: 'Tag',         type: 'input' },
      { key: 'meta',  inputId: 'featured-meta',  label: 'Meta (comma-separated)', type: 'array-csv' },
    ],
  };

  // per-entity state: { fieldKey: { en: ..., ru: ..., ... } }
  const state = { tour: {}, car: {}, post: {}, featured: {} };
  // active tab (lang code) per entity
  const activeTab = { tour: 'en', car: 'en', post: 'en', featured: 'en' };

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }
  function escapeAttr(str) {
    return escapeHTML(str).replace(/"/g, '&quot;');
  }

  function getStateValue(entity, key, lang) {
    const st = state[entity][key];
    if (!st) return '';
    return st[lang] != null ? st[lang] : '';
  }

  function setValue(entity, key, value) {
    const L = activeTab[entity];
    if (!state[entity][key]) state[entity][key] = {};
    state[entity][key][L] = value;
  }

  function setArrayValue(entity, key, csv) {
    const L = activeTab[entity];
    if (!state[entity][key]) state[entity][key] = {};
    state[entity][key][L] = String(csv || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function setActive(entity, lang) {
    activeTab[entity] = lang;
    render(entity);
  }

  function render(entity) {
    const fields = TRANSLATABLE_FIELDS[entity];
    const tabsEl = document.getElementById(`${entity}-lang-tabs`);
    const panelsEl = document.getElementById(`${entity}-lang-panels`);
    if (!tabsEl || !panelsEl) return;

    tabsEl.innerHTML = LANG_META.map(
      (l) =>
        `<button type="button" class="lang-tab ${
          activeTab[entity] === l.code ? 'active' : ''
        }" onclick="AdminI18n.setActive('${entity}','${l.code}')">${l.code.toUpperCase()}</button>`
    ).join('');

    const L = activeTab[entity];
    const meta = LANG_META.find((m) => m.code === L) || {};
    const dirAttr = meta.rtl ? 'dir="rtl"' : '';

    panelsEl.innerHTML = fields
      .map((f) => {
        const val = getStateValue(entity, f.key, L);
        if (f.type === 'textarea') {
          return `<div class="lang-field">
            <label>${f.label}</label>
            <textarea ${dirAttr} rows="4" placeholder="${escapeAttr(meta.name || '')}"
              oninput="AdminI18n.setValue('${entity}','${f.key}', this.value)">${escapeHTML(val)}</textarea>
          </div>`;
        }
        if (f.type === 'array' || f.type === 'array-csv') {
          const display = Array.isArray(val) ? val.join(', ') : String(val || '');
          return `<div class="lang-field">
            <label>${f.label}</label>
            <input type="text" ${dirAttr} value="${escapeAttr(display)}" placeholder="item1, item2, item3"
              oninput="AdminI18n.setArrayValue('${entity}','${f.key}', this.value)">
          </div>`;
        }
        return `<div class="lang-field">
          <label>${f.label}</label>
          <input type="text" ${dirAttr} value="${escapeAttr(val)}" placeholder="${escapeAttr(meta.name || '')}"
            oninput="AdminI18n.setValue('${entity}','${f.key}', this.value)">
        </div>`;
      })
      .join('');
  }

  function updateQuotaDisplay() {
    if (!window.GTTranslate || !window.GTTranslate.getQuotaStats || !window.GTTranslate.getEngine) return;
    const engine = window.GTTranslate.getEngine();
    const stats = window.GTTranslate.getQuotaStats(engine);
    const engineName = engine === 'mymemory' ? 'MyMemory' : 'Google';
    
    ['tour', 'car', 'post', 'featured'].forEach(entity => {
      const fill = document.getElementById(`${entity}-quota-fill`);
      const text = document.getElementById(`${entity}-quota-text`);
      const percent = document.getElementById(`${entity}-quota-percent`);
      
      if (!fill || !text || !percent) return;

      fill.style.width = `${stats.percent}%`;
      
      // Color logic: green > 40%, yellow 15-40%, red < 15%
      let color = '#28a745'; // Green
      if (stats.percent < 15) color = '#dc3545'; // Red
      else if (stats.percent < 40) color = '#ffc107'; // Yellow
      
      fill.style.backgroundColor = color;
      percent.style.color = color;
      percent.textContent = `${Math.round(stats.percent)}%`;
      text.textContent = `${engineName} Remaining: ${stats.remaining.toLocaleString()} words`;

      // განვაახლოთ ღილაკების "active" კლასი
      document.querySelectorAll(`.${entity}-engine-btn`).forEach(btn => {
        const btnEngine = btn.getAttribute('data-engine');
        btn.classList.toggle('active', btnEngine === engine);
      });
    });
  }

  // Listen for quota updates
  window.addEventListener('quota:updated', updateQuotaDisplay);
  document.addEventListener('DOMContentLoaded', updateQuotaDisplay);

  function reset(entity) {
    state[entity] = {};
    activeTab[entity] = 'en';
    const statusEl = document.getElementById(`${entity}-translate-status`);
    if (statusEl) {
      statusEl.textContent =
        'Fill the Georgian fields above, then click "Auto-translate" to generate translations for all languages.';
      statusEl.style.color = '';
    }
    render(entity);
  }

  // Read the source (Georgian) value for a field from the main form
  function readSource(entity, field) {
    if (entity === 'tour' && field.key === 'highlights') {
      const arr = (window.tourHighlights && Array.isArray(window.tourHighlights))
        ? window.tourHighlights.slice()
        : [];
      // include any pending text in the highlight input
      const pending = document.getElementById('tour-highlight-input');
      if (pending && pending.value && pending.value.trim()) {
        arr.push(pending.value.trim());
      }
      return arr;
    }
    if (field.type === 'array-csv') {
      const el = document.getElementById(field.inputId);
      if (!el) return [];
      return el.value.split(',').map((s) => s.trim()).filter(Boolean);
    }
    const el = document.getElementById(field.inputId);
    return el ? el.value : '';
  }

  async function generate(entity, engineOverride = null) {
    const statusEl = document.getElementById(`${entity}-translate-status`);
    if (!window.GTTranslate) {
      if (statusEl) { statusEl.textContent = 'Translation service not loaded.'; statusEl.style.color = '#dc3545'; }
      return;
    }

    if (engineOverride) window.GTTranslate.setEngine(engineOverride);
    const engine = window.GTTranslate.getEngine();

    const fields = TRANSLATABLE_FIELDS[entity];
    document.querySelectorAll(`.${entity}-translate-btn`).forEach(b => b.disabled = true);
    if (statusEl) { statusEl.textContent = 'Translating... please wait.'; statusEl.style.color = '#0b3c5d'; }

    try {
      for (const field of fields) {
        const src = readSource(entity, field);
        console.log(`[AdminI18n] Translating ${entity}.${field.key}...`);

        if (field.type === 'array' || field.type === 'array-csv') {
          if (!Array.isArray(src) || src.length === 0) continue;
          const perLang = {};
          LANG_META.forEach((l) => { perLang[l.code] = []; });
          for (let i = 0; i < src.length; i++) {
            try {
              // eslint-disable-next-line no-await-in-loop
              const obj = await window.GTTranslate.translateToAllLangs(src[i], 'ka', engine);
              LANG_META.forEach((l) => perLang[l.code].push(obj[l.code] || ''));
            } catch (e) {
              console.warn(`[AdminI18n] Failed to translate highlight item: ${src[i]}`, e);
            }
          }
          state[entity][field.key] = perLang;
        } else {
          const s = typeof src === 'string' ? src.trim() : '';
          if (!s) continue;
          try {
            // eslint-disable-next-line no-await-in-loop
            const obj = await window.GTTranslate.translateToAllLangs(s, 'ka', engine);
            const langs = {};
            LANG_META.forEach((l) => { langs[l.code] = obj[l.code] || ''; });
            state[entity][field.key] = langs;
          } catch (e) {
            console.error(`[AdminI18n] Failed to translate field ${field.key}:`, e);
          }
        }
        // Render after each field so the user sees progress
        render(entity);
      }
      if (statusEl) { statusEl.textContent = '✓ Translations generated. Click language tabs above to review & edit.'; statusEl.style.color = '#28a745'; }
    } catch (err) {
      console.error('[AdminI18n] translation error:', err);
      if (statusEl) { statusEl.textContent = 'Translation failed: ' + (err.message || err); statusEl.style.color = '#dc3545'; }
    } finally {
      document.querySelectorAll(`.${entity}-translate-btn`).forEach(b => b.disabled = false);
    }
  }

  /**
   * Pack the Georgian form value together with translation state
   * into a multi-lang object, or return the plain value if there
   * are no translations (backwards-compatible).
   */
  function pack(entity, fieldKey, georgianValue) {
    const s = state[entity][fieldKey];
    const isEmpty =
      !s ||
      !Object.keys(s).some((k) => {
        const v = s[k];
        if (Array.isArray(v)) return v.length > 0;
        return v && String(v).trim();
      });
    if (isEmpty) return georgianValue;
    const out = { ...s };
    out.ka = georgianValue;
    return out;
  }

  /**
   * When opening the edit modal, unpack any multi-lang objects
   * from the Firestore item into the translation state so the
   * tabs show existing translations.
   */
  function loadItem(entity, item) {
    reset(entity);
    const fields = TRANSLATABLE_FIELDS[entity];
    fields.forEach((f) => {
      const v = item ? item[f.key] : null;
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        const obj = {};
        LANG_META.forEach((l) => {
          if (v[l.code] !== undefined) obj[l.code] = v[l.code];
          else obj[l.code] = (f.type === 'array' || f.type === 'array-csv') ? [] : '';
        });
        state[entity][f.key] = obj;
      }
    });
    render(entity);
    const statusEl = document.getElementById(`${entity}-translate-status`);
    if (statusEl && hasTranslations(entity)) {
      statusEl.textContent = '✓ Existing translations loaded. You can edit or re-translate.';
      statusEl.style.color = '#28a745';
    }
  }

  function hasTranslations(entity) {
    const s = state[entity];
    if (!s) return false;
    return Object.keys(s).some((k) => {
      const v = s[k];
      if (!v) return false;
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === 'object') return Object.values(v).some((x) => (Array.isArray(x) ? x.length : String(x || '').trim()));
      return String(v).trim();
    });
  }

  /**
   * Extract the Georgian value out of a possibly multi-lang
   * Firestore value. isArray = true when the field stores arrays.
   */
  function extractGeorgian(value, isArray = false) {
    if (value == null) return isArray ? [] : '';
    if (Array.isArray(value)) return isArray ? value : value.join(', ');
    if (typeof value === 'object') {
      const ka = value.ka;
      if (ka == null) {
        // fallback to any non-empty lang
        for (const l of LANG_META) {
          if (value[l.code] != null) return isArray ? (Array.isArray(value[l.code]) ? value[l.code] : []) : String(value[l.code]);
        }
        return isArray ? [] : '';
      }
      return isArray ? (Array.isArray(ka) ? ka : []) : String(ka);
    }
    return isArray ? [] : String(value);
  }

  window.AdminI18n = {
    reset,
    render,
    setActive,
    setValue,
    setArrayValue,
    generate,
    pack,
    loadItem,
    extractGeorgian,
    hasTranslations,
    LANG_META,
    TRANSLATABLE_FIELDS,
  };
})();
