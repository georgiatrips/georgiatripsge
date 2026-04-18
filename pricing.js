(() => {
  const CURRENCIES = {
    GEL: { code: 'GEL', symbol: '₾', label: 'Lari' },
    USD: { code: 'USD', symbol: '$', label: 'Dollar' },
    EUR: { code: 'EUR', symbol: '€', label: 'Euro' },
    TRY: { code: 'TRY', symbol: '₺', label: 'Lira' },
  };

  const SELECTED_CURRENCY_KEY = 'gt_selected_currency';
  const RATES_CACHE_KEY = 'gt_currency_rates';
  const DEFAULT_CURRENCY = 'GEL';
  const FALLBACK_RATES = {
    GEL: 1,
    USD: 0.37,
    EUR: 0.34,
    TRY: 14.25,
  };

  const savedCurrency = localStorage.getItem(SELECTED_CURRENCY_KEY);
  const state = {
    selectedCurrency: CURRENCIES[savedCurrency] ? savedCurrency : DEFAULT_CURRENCY,
    rates: { ...FALLBACK_RATES },
    lastUpdated: null,
    live: false,
  };

  let refreshTimer = null;

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function loadCachedRates() {
    try {
      const cached = JSON.parse(localStorage.getItem(RATES_CACHE_KEY) || 'null');
      if (!cached || !cached.rates) return;
      state.rates = { ...state.rates, ...cached.rates, GEL: 1 };
      state.lastUpdated = cached.lastUpdated || null;
      state.live = Boolean(cached.live);
    } catch (error) {
      console.warn('Failed to parse cached currency rates:', error);
    }
  }

  function persistRates() {
    try {
      localStorage.setItem(RATES_CACHE_KEY, JSON.stringify({
        rates: state.rates,
        lastUpdated: state.lastUpdated,
        live: state.live,
      }));
    } catch (error) {
      console.warn('Failed to cache currency rates:', error);
    }
  }

  function inferCurrency(priceText) {
    const value = String(priceText || '').trim();
    if (value.includes('₾')) return 'GEL';
    if (value.includes('€')) return 'EUR';
    if (value.includes('₺')) return 'TRY';
    if (value.includes('$')) return 'USD';
    return DEFAULT_CURRENCY;
  }

  function parseAmount(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const normalized = String(value || '').replace(/,/g, '.');
    const match = normalized.match(/-?\d+(?:\.\d+)?/);
    if (!match) return null;
    const amount = Number(match[0]);
    return Number.isFinite(amount) ? amount : null;
  }

  function getPriceMeta(item) {
    if (!item) return null;

    const explicitAmount = parseAmount(item.priceValue ?? item.basePrice ?? item.amount);
    const explicitCurrency = item.priceCurrency || item.currency;
    if (explicitAmount !== null) {
      return {
        amount: explicitAmount,
        currency: CURRENCIES[explicitCurrency] ? explicitCurrency : inferCurrency(item.price),
        prefix: item.pricePrefix || '',
      };
    }

    const rawPrice = String(item.price || (Array.isArray(item.meta) ? item.meta[0] : '') || '').trim();
    if (!rawPrice || /contact/i.test(rawPrice)) return null;

    return {
      amount: parseAmount(rawPrice),
      currency: inferCurrency(rawPrice),
      prefix: /^\s*from\b/i.test(rawPrice) ? 'From ' : '',
    };
  }

  function getPriceAppliesTo(item) {
    const count = Number(item?.priceAppliesTo ?? item?.priceForPeople ?? item?.peopleForPrice ?? 1);
    return Number.isFinite(count) && count > 0 ? count : 1;
  }

  function tr(key, tokens, fallback) {
    if (window.t) {
      const v = window.t(key, tokens);
      if (v) return v;
    }
    return fallback;
  }

  function getPriceLabel(item, fallbackLabel) {
    const defaultPerPerson = tr('per_person', null, 'per person');
    if (item?.priceLabel) return item.priceLabel;
    const peopleCount = getPriceAppliesTo(item);
    if (peopleCount > 1) return tr('for_n_people', { n: peopleCount }, `for ${peopleCount} people`);
    return fallbackLabel || defaultPerPerson;
  }

  function convertAmount(amount, fromCurrency, toCurrency) {
    if (!Number.isFinite(amount)) return amount;
    if (fromCurrency === toCurrency) return amount;

    const fromRate = state.rates[fromCurrency];
    const toRate = state.rates[toCurrency];
    if (!fromRate || !toRate) return amount;

    const gelAmount = fromCurrency === 'GEL' ? amount : amount / fromRate;
    return toCurrency === 'GEL' ? gelAmount : gelAmount * toRate;
  }

  function formatAmount(amount, currency) {
    if (!Number.isFinite(amount)) return '';
    
    // ვამოწმებთ ვართ თუ არა ადმინ პანელში
    const isAdminPage = window.location.pathname.includes('admin.html');
    
    // თუ ადმინი არაა, ვამრგვალებთ მთელამდე, თუ ადმინია - ვტოვებთ მეათედებს (2 ციფრს)
    const displayAmount = isAdminPage ? amount : Math.round(amount);
    const decimals = isAdminPage ? (amount % 1 === 0 ? 0 : 2) : 0;

    return `${CURRENCIES[currency]?.symbol || ''}${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(displayAmount)}`;
  }

  function formatStoredPrice(amount, currency, prefix = '') {
    if (!Number.isFinite(amount)) return tr('on_request', null, 'On Request');
    return `${prefix}${formatAmount(amount, currency)}`;
  }

  function formatConvertedPrice(item) {
    const meta = getPriceMeta(item);
    const onRequest = tr('on_request', null, 'On Request');
    if (!meta || meta.amount === null) return String(item?.price || onRequest);
    const converted = convertAmount(meta.amount, meta.currency, state.selectedCurrency);
    return `${meta.prefix || ''}${formatAmount(converted, state.selectedCurrency)}`;
  }

  function renderPriceMarkup(item, options = {}) {
    const priceClass = options.priceClass || 'tour-price';
    const labelClass = options.labelClass || 'tour-price-label';
    const fallbackLabel = options.defaultLabel || tr('per_person', null, 'per person');
    const includeLabel = options.includeLabel !== false;
    const meta = getPriceMeta(item);
    const label = getPriceLabel(item, fallbackLabel);
    const onRequestLabel = tr('on_request', null, 'On Request');

    if (!meta || meta.amount === null || item.priceOnRequest) {
      const safeText = item.priceOnRequest ? onRequestLabel : escapeHtml(String(item?.price || onRequestLabel));
      return includeLabel
        ? `<span class="${priceClass}">${safeText}</span> <span class="price-separator">/</span> <span class="${labelClass}">${escapeHtml(label)}</span>`
        : `<span class="${priceClass}">${safeText}</span>`;
    }

    const amountText = escapeHtml(formatConvertedPrice(item));
    return includeLabel
      ? `<span class="${priceClass} js-price-value" data-price-value="${meta.amount}" data-price-currency="${meta.currency}" data-price-prefix="${escapeHtml(meta.prefix || '')}">${amountText}</span> <span class="price-separator">/</span> <span class="${labelClass}">${escapeHtml(label)}</span>`
      : `<span class="${priceClass} js-price-value" data-price-value="${meta.amount}" data-price-currency="${meta.currency}" data-price-prefix="${escapeHtml(meta.prefix || '')}">${amountText}</span>`;
  }

  function refreshVisiblePrices(root = document) {
    root.querySelectorAll('.js-price-value').forEach((node) => {
      const amount = parseAmount(node.dataset.priceValue);
      const currency = node.dataset.priceCurrency || DEFAULT_CURRENCY;
      const prefix = node.dataset.pricePrefix || '';
      if (amount === null) return;

      const converted = convertAmount(amount, currency, state.selectedCurrency);
      node.textContent = `${prefix}${formatAmount(converted, state.selectedCurrency)}`;
    });

    document.querySelectorAll('[data-currency-button]').forEach((button) => {
      button.textContent = `${state.selectedCurrency} ▼`;
    });

    document.querySelectorAll('[data-currency-option]').forEach((option) => {
      option.classList.toggle('active', option.dataset.currencyOption === state.selectedCurrency);
    });

    renderRatesBoard();
    renderTourPricePreview();
  }

  function queueRefresh(root = document) {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => refreshVisiblePrices(root), 20);
  }

  function setSelectedCurrency(currency) {
    if (!CURRENCIES[currency]) return;
    state.selectedCurrency = currency;
    localStorage.setItem(SELECTED_CURRENCY_KEY, currency);
    refreshVisiblePrices();
    window.dispatchEvent(new CustomEvent('gt:currencychange', { detail: { currency } }));
  }

  async function fetchLiveRates() {
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/GEL');
      const payload = await response.json();
      if (!payload?.rates) throw new Error('Invalid exchange response');

      state.rates = {
        GEL: 1,
        USD: payload.rates.USD,
        EUR: payload.rates.EUR,
        TRY: payload.rates.TRY,
      };
      state.lastUpdated = payload.time_last_update_utc || new Date().toISOString();
      state.live = true;
      persistRates();
      refreshVisiblePrices();
      window.dispatchEvent(new CustomEvent('gt:ratesupdate', { detail: { rates: state.rates } }));
    } catch (error) {
      console.warn('Live currency rates unavailable, using cached/fallback values.', error);
      state.live = false;
      refreshVisiblePrices();
    }
  }

  function renderRatesBoard() {
    const board = document.getElementById('currency-rates-board');
    if (!board) return;

    const timestamp = state.lastUpdated
      ? new Date(state.lastUpdated).toLocaleString('en-GB', { hour12: false })
      : 'Unavailable';
    const status = state.live ? 'Live' : 'Cached';

    board.innerHTML = `
      <div class="currency-board__header">
        <div>
          <h3>Live Exchange Rates</h3>
          <p>Base: 1 GEL</p>
        </div>
        <span class="currency-board__badge">${status}</span>
      </div>
      <div class="currency-board__grid">
        <div class="currency-board__item"><strong>${formatAmount(state.rates.USD, 'USD')}</strong><span>USD</span></div>
        <div class="currency-board__item"><strong>${formatAmount(state.rates.EUR, 'EUR')}</strong><span>EUR</span></div>
        <div class="currency-board__item"><strong>${formatAmount(state.rates.TRY, 'TRY')}</strong><span>TRY</span></div>
      </div>
      <p class="currency-board__note">Updated: ${timestamp}</p>
    `;
  }

  function renderTourPricePreview() {
    const preview = document.getElementById('tour-price-preview');
    if (!preview) return;

    const amount = parseAmount(document.getElementById('tour-price-value')?.value);
    const currency = document.getElementById('tour-price-currency')?.value || DEFAULT_CURRENCY;
    const appliesTo = Number(document.getElementById('tour-price-applies-to')?.value || 1);

    if (amount === null) {
      preview.textContent = 'Enter a base amount to preview converted prices.';
      return;
    }

    const item = { priceValue: amount, priceCurrency: currency, priceAppliesTo: appliesTo };
    preview.textContent = `${formatConvertedPrice(item)} ${getPriceLabel(item)}`;
  }

  function insertCurrencySelector() {
    const navLinks = document.querySelector('.navbar .nav-links');
    if (!navLinks || navLinks.querySelector('.nav-currency-dropdown')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'nav-currency-dropdown';
    wrapper.innerHTML = `
      <button class="nav-dropdown-btn" type="button" data-currency-button>${state.selectedCurrency} ▼</button>
      <div class="dropdown-menu">
        ${Object.keys(CURRENCIES).map((code) => `
          <a href="#" data-currency-option="${code}">${CURRENCIES[code].symbol} ${code}</a>
        `).join('')}
      </div>
    `;

    const userDropdown = navLinks.querySelector('.nav-user-dropdown');
    if (userDropdown) {
      navLinks.insertBefore(wrapper, userDropdown);
    } else {
      navLinks.appendChild(wrapper);
    }

    // კლიკის მოსმენა ვალუტის შეცვლისთვის. 
    // გახსნა/დახურვას მართავს script.js (Event Delegation)
    wrapper.addEventListener('click', (event) => {
      const option = event.target.closest('[data-currency-option]');
      if (option) {
        event.preventDefault();
        setSelectedCurrency(option.dataset.currencyOption);
        // script.js ავტომატურად დახურავს მენიუს, რადგან ეს არის 'A' თეგი
      }
    });
  }

  function insertAdminBoard() {
    const adminTabs = document.querySelector('.admin-tabs');
    if (!adminTabs || document.getElementById('currency-rates-board')) return;

    const board = document.createElement('section');
    board.id = 'currency-rates-board';
    board.className = 'currency-board';
    adminTabs.insertAdjacentElement('afterend', board);
    renderRatesBoard();
  }

  function initAdminFormHelpers() {
    ['tour-price-value', 'tour-price-currency', 'tour-price-applies-to'].forEach((id) => {
      const input = document.getElementById(id);
      if (input) {
        input.addEventListener('input', renderTourPricePreview);
        input.addEventListener('change', renderTourPricePreview);
      }
    });
    renderTourPricePreview();
  }

  function initObservers() {
    if (!document.body) return;

    const observer = new MutationObserver(() => {
      queueRefresh();
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  loadCachedRates();

  window.PriceDisplay = {
    currencies: CURRENCIES,
    getPriceMeta,
    getPriceLabel,
    renderPriceMarkup,
    formatStoredPrice,
    formatConvertedPrice,
    getSelectedCurrency: () => state.selectedCurrency,
    setSelectedCurrency,
    refreshVisiblePrices,
  };

  document.addEventListener('DOMContentLoaded', () => {
    insertCurrencySelector();
    insertAdminBoard();
    initAdminFormHelpers();
    refreshVisiblePrices();
    initObservers();
    fetchLiveRates();
  });
})();
