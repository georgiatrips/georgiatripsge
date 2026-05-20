// ============================================================
//  GEORGIA TRIPS — Tour Detail Page Module
//  Handles: loading tour data, displaying details, booking
// ============================================================

let currentTour = null;
const calendarState = {
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),
  selectedStart: null,
  selectedEnd: null,
};

function getTourDaysCount() {
  // Prefer explicit numeric days saved from admin panel.
  const directDays = Number(currentTour?.days ?? currentTour?.durationDays);
  if (Number.isFinite(directDays) && directDays > 0) return directDays;

  const rawDuration = currentTour?.duration;
  const raw = (rawDuration && typeof rawDuration === 'object')
    ? (rawDuration.ka || rawDuration.en || Object.values(rawDuration)[0] || '')
    : (rawDuration ?? document.getElementById('detail-duration')?.textContent ?? '');
  const match = String(raw).match(/(\d+)/);
  const days = match ? Number(match[1]) : 1;
  return Number.isFinite(days) && days > 0 ? days : 1;
}

// ── INSTANT / RESILIENT LOAD ─────────────────────────────────
// Strategy: try every fast in-memory source first (sessionStorage,
// localStorage cache, static TOURS). If none of them have the
// requested tour yet, start a Firebase fetch AND schedule a retry
// every 1s. Keep retrying forever until the tour renders.
const TOUR_DETAIL_RETRY_MS = 1000;
let _tourDetailRetryTimer = null;
let _tourDetailFirebaseStarted = false;

function _tryGetTourFromAnySource(tourId) {
  // 1. sessionStorage full object (fastest — set on card click).
  //    IMPORTANT: only accept it if its id matches the requested tourId,
  //    otherwise we risk showing the previously opened tour.
  try {
    const storedTour = sessionStorage.getItem('selectedTourData');
    if (storedTour) {
      const parsed = JSON.parse(storedTour);
      if (parsed && tourId && parsed.id === tourId) return parsed;
      // Fallback: no tourId at all (legacy links) — still return cached.
      if (parsed && !tourId) return parsed;
    }
  } catch (e) {}

  // 2. localStorage cache written by index page (gt_data_cache_v1)
  try {
    const raw = localStorage.getItem('gt_data_cache_v1');
    if (raw) {
      const cache = JSON.parse(raw);
      if (cache && Array.isArray(cache.tours)) {
        const hit = tourId
          ? cache.tours.find(t => t && t.id === tourId)
          : cache.tours[0];
        if (hit) return hit;
      }
    }
  } catch (e) {}

  // 3. In-page arrays (when script.js is loaded on the same page)
  const dataList = (typeof toursData !== 'undefined' && Array.isArray(toursData))
    ? toursData
    : (typeof TOURS !== 'undefined' ? TOURS : []);
  if (tourId && dataList.length) {
    const hit = dataList.find(t => t && t.id === tourId);
    if (hit) return hit;
  }

  return null;
}

// Lazy Firebase fetch — only pulled in if no cached source had the tour.
async function _firebaseFetchTourById(tourId) {
  if (!tourId) return null;
  try {
    const [{ initializeApp, getApps, getApp }, { getFirestore, doc, getDoc, collection, getDocs }, cfgMod] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js'),
      import('./firebase-config.js').catch(() => null)
    ]);
    const firebaseConfig = cfgMod && (cfgMod.firebaseConfig || cfgMod.default);
    if (!firebaseConfig) return null;
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Try single-doc fetch first (fast path).
    try {
      const snap = await getDoc(doc(db, 'tours', tourId));
      if (snap.exists()) return { id: snap.id, ...snap.data() };
    } catch (e) {}

    // Fallback: full collection scan (covers legacy IDs).
    const snapshot = await getDocs(collection(db, 'tours'));
    const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    // Write-through to cache so future visits are instant.
    try {
      const raw = localStorage.getItem('gt_data_cache_v1');
      const cache = raw ? JSON.parse(raw) : {};
      cache.tours = list;
      cache.timestamp = Date.now();
      localStorage.setItem('gt_data_cache_v1', JSON.stringify(cache));
    } catch (e) {}
    return list.find(t => t.id === tourId) || null;
  } catch (err) {
    console.error('[tour-detail] Firebase lookup failed:', err);
    return null;
  }
}

function _showTourDetailLoader() {
  const titleEl = document.getElementById('detail-title');
  if (titleEl && !titleEl.textContent.trim()) {
    const loadingLabel = (window.t && window.t('loading')) || 'Loading';
    titleEl.innerHTML = `<span class="gt-inline-loader" style="display:inline-flex;align-items:center;gap:0.6rem;font-size:1rem;color:var(--text-mid);"><span class="gt-card-loader__spinner" aria-hidden="true"></span>${loadingLabel}…</span>`;
  }
}

// Read tour id from URL (?id=xxx or ?tour=xxx). This makes every tour have
// its own unique, shareable link and keeps the correct tour loaded after a
// language switch (which triggers location.reload()) — no more stale
// sessionStorage mixups between tours.
function _getTourIdFromURL() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || params.get('tour') || null;
  } catch (e) { return null; }
}

function loadTourDetail() {
  // Prefer URL id over sessionStorage so each tour link is unique & stable.
  const urlId = _getTourIdFromURL();
  const storedId = sessionStorage.getItem('selectedTourId');
  const tourId = urlId || storedId;

  // If URL id differs from stored id, the user navigated to a new tour —
  // wipe the cached object so we don't show the previous tour while the
  // correct one loads.
  if (urlId && storedId && urlId !== storedId) {
    try {
      sessionStorage.removeItem('selectedTourData');
      sessionStorage.setItem('selectedTourId', urlId);
    } catch (e) {}
  } else if (urlId && !storedId) {
    try { sessionStorage.setItem('selectedTourId', urlId); } catch (e) {}
  }

  // 1. Try every fast source first.
  const hit = _tryGetTourFromAnySource(tourId);
  if (hit) {
    currentTour = hit;
    try { populateTourDetail(); } catch (e) { console.error(e); }
    // Clear retry loop — we're done.
    if (_tourDetailRetryTimer) { clearTimeout(_tourDetailRetryTimer); _tourDetailRetryTimer = null; }
    return;
  }

  // 2. Nothing yet — show a lightweight loader so the page isn't blank.
  _showTourDetailLoader();

  // 3. Kick off Firebase fetch (single-flight). If the fetch fails or
  //    returns null we clear the flag so the next 1s retry can try again.
  if (tourId && !_tourDetailFirebaseStarted) {
    _tourDetailFirebaseStarted = true;
    _firebaseFetchTourById(tourId)
      .then(tour => {
        if (tour) {
          try {
            sessionStorage.setItem('selectedTourId', tour.id);
            sessionStorage.setItem('selectedTourData', JSON.stringify(tour));
          } catch (e) {}
        } else {
          _tourDetailFirebaseStarted = false; // allow retry on next tick
        }
        loadTourDetail(); // immediate attempt, don't wait 1s
      })
      .catch(() => {
        _tourDetailFirebaseStarted = false;
      });
  }

  // 4. Schedule the hard 1-second retry. If populateTourDetail still
  //    hasn't fired by then, this will restart the whole lookup.
  if (_tourDetailRetryTimer) clearTimeout(_tourDetailRetryTimer);
  _tourDetailRetryTimer = setTimeout(() => {
    _tourDetailRetryTimer = null;
    if (!currentTour) loadTourDetail();
  }, TOUR_DETAIL_RETRY_MS);
}

// ── POPULATE PAGE ────────────────────────────────────────────
// i18n helpers
function _L(val, fallback = '') {
  if (window.localize) return window.localize(val, fallback);
  if (val == null) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'object') return val.ka || val.en || fallback;
  return String(val);
}
function _LA(val) {
  if (window.localizeArray) return window.localizeArray(val);
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'object') return Array.isArray(val.ka) ? val.ka : (Array.isArray(val.en) ? val.en : []);
  return [];
}

// Common-value translator: maps plain English strings like "1 Day", "5 Days",
// "All Year", "Flexible" through window.t() when available.
function _translateCommonValue(str) {
  if (!str || typeof str !== 'string') return str;
  const t = window.t;
  if (!t) return str;
  const s = str.trim();
  const map = { 'All Year': 'all_year', 'Flexible': 'flexible', '1 Day': 'one_day', 'One Day': 'one_day', 'On Request': 'on_request' };
  if (map[s]) return t(map[s]);
  const mDays = s.match(/^(\d+)\s*[Dd]ays?$/);
  if (mDays) return t('n_days', { n: mDays[1] });
  const mRange = s.match(/^(\d+)\s*[–-]\s*(\d+)\s*[Dd]ays?$/);
  if (mRange) return t('n_days', { n: `${mRange[1]}–${mRange[2]}` });
  return s;
}

function populateTourDetail() {
  const tour = currentTour;
  const title = _L(tour.title);
  const duration = _translateCommonValue(_L(tour.duration));
  const desc = _L(tour.desc);

  // Update page title
  document.title = title + ' – Georgia Trips';

  // Hero section
  document.getElementById('detail-hero-img').src = tour.img;
  document.getElementById('detail-title').textContent = title;

  // Quick info cards
  if (document.getElementById('detail-duration')) document.getElementById('detail-duration').textContent = duration || (window.t ? window.t('flexible') : 'Flexible');
  if (document.getElementById('detail-season')) {
    let seasonVal;
    if (Array.isArray(tour.season)) {
      seasonVal = tour.season.map(_translateCommonValue).join(', ');
    } else if (tour.season && typeof tour.season === 'object') {
      seasonVal = _translateCommonValue(_L(tour.season));
    } else {
      seasonVal = tour.season ? _translateCommonValue(tour.season) : (window.t ? window.t('all_year') : 'All Year');
    }
    document.getElementById('detail-season').textContent = seasonVal;
  }
  if (document.getElementById('detail-category')) {
    const catKey = (tour.category || 'general').toLowerCase();
    const catMap = {
      'one-day':  'badge_one_day',
      'multi-day':'badge_multi_day',
      'upcoming': 'badge_upcoming',
      'flexible': 'badge_flexible'
    };
    const catT = window.t && catMap[catKey] ? window.t(catMap[catKey]) : null;
    document.getElementById('detail-category').textContent = catT || catKey.toUpperCase().replace('-', ' ');
  }
  if (document.getElementById('detail-min-people')) document.getElementById('detail-min-people').textContent = tour.minPeople || '1';
  if (document.getElementById('detail-max-people')) document.getElementById('detail-max-people').textContent = tour.maxPeople || '10';

  // Description
  document.getElementById('detail-description').textContent = desc || 'No description available.';

  // Highlights
  const highlightsList = document.getElementById('detail-highlights');
  highlightsList.innerHTML = _LA(tour.highlights)
    .map(h => `<li class="highlight-item"><span class="highlight-dot"></span>${h}</li>`)
    .join('');

  // What's Included Section Logic
  const included = tour.included || {};
  const tFn = window.t || ((k) => k);
  const incItems = [
    { key: 'guide',     label: tFn('inc_guide')     || 'Expert local guide' },
    { key: 'tickets',   label: tFn('inc_tickets')   || 'All entrance fees' },
    { key: 'pickup',    label: tFn('inc_pickup')    || 'Hotel pickup & drop-off' },
    { key: 'food',      label: tFn('inc_food')      || 'Full board meals' },
    { key: 'hotel',     label: tFn('inc_hotel')     || 'Accommodation' },
    { key: 'water',     label: tFn('inc_water')     || 'Water and snacks' },
    { key: 'insurance', label: tFn('inc_insurance') || 'Travel insurance' },
    { key: 'emergency', label: tFn('inc_emergency') || 'Emergency support 24/7' }
  ];

  const includedList = document.querySelector('.included-list');
  if (includedList) {
    includedList.innerHTML = incItems.map(item => {
      const isInc = !!included[item.key];
      return `
        <li style="display:flex; align-items:center; gap:12px; margin-bottom:0.6rem; color: ${isInc ? 'var(--text-dark)' : 'var(--text-light)'};">
          <span style="display:flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:50%; background:${isInc ? 'rgba(40,167,69,0.1)' : 'rgba(220,53,69,0.1)'}; color:${isInc ? '#28a745' : '#dc3545'}; font-size:0.75rem; font-weight:bold;">
            ${isInc ? '✓' : '✕'}
          </span>
          <span style="${!isInc ? 'text-decoration:line-through; opacity:0.7;' : ''}">${item.label}</span>
        </li>`;
    }).join('');
  }

  // Price and badge
  const priceEl = document.getElementById('detail-price');
  const priceLabelEl = document.getElementById('detail-price-label');

  if (window.PriceDisplay) {
    const priceContainer = document.querySelector('.booking-card__price');
    if (priceContainer) {
      priceContainer.innerHTML = window.PriceDisplay.renderPriceMarkup(tour, { priceClass: 'booking-price', labelClass: 'booking-per-person' });
    }
  } else {
    priceEl.textContent = tour.priceOnRequest ? (window.t ? window.t('on_request') : 'On Request') : tour.price;
    if (priceLabelEl) {
      priceLabelEl.style.display = tour.priceOnRequest ? 'none' : 'inline';
      if (!tour.priceOnRequest) priceLabelEl.textContent = (window.t ? window.t('per_person') : 'per person');
    }
  }

  const isDomestic = (tour.type || tour.tourType) === 'domestic';
  const typeText = isDomestic
    ? (tFn('domestic_tour_badge') || '🏔️ Domestic Tour')
    : (tFn('international_tour_badge') || '✈️ International Tour');
  document.getElementById('detail-type-badge').textContent = typeText;

  // Modal tour name and price summary
  document.getElementById('modal-tour-name').textContent = title;
  refreshModalPriceSummary();
  updateBookingPriceBox();

  // Itinerary (if multi-day)
  if (tour.category === 'multi-day' || tour.category === 'upcoming') {
    showItinerary();
  }

  // Clear sessionStorage
  sessionStorage.removeItem('selectedTourId');
  sessionStorage.removeItem('selectedTourData');

  // Inject Schema.org JSON-LD Structured Data for Google Rich Snippets
  _injectSchemaJSONLD(tour);
}

function _injectSchemaJSONLD(tour) {
  try {
    const existing = document.getElementById('gt-tour-schema-jsonld');
    if (existing) existing.remove();

    let cleanPrice = '100';
    if (tour.price) {
      const match = String(tour.price).match(/(\d+)/);
      if (match) cleanPrice = match[1];
    }
    
    let currentCurrency = 'USD';
    try {
      if (window.GT_CURRENT_CURRENCY) {
        currentCurrency = window.GT_CURRENT_CURRENCY;
      } else {
        const saved = localStorage.getItem('gt_currency');
        if (saved) currentCurrency = saved;
      }
    } catch(e) {}

    let isoDuration = 'P1D';
    if (tour.duration) {
      const match = String(tour.duration).match(/(\d+)/);
      if (match) isoDuration = 'P' + match[1] + 'D';
    }

    const title = _L(tour.title) || 'Tour';
    const desc = _L(tour.desc) || 'Georgia Trips Tour details';
    const imgUrl = tour.img ? (tour.img.startsWith('http') ? tour.img : window.location.origin + '/' + tour.img) : '';

    const schema = {
      "@context": "https://schema.org",
      "@type": "Tour",
      "name": title,
      "description": desc,
      "image": imgUrl,
      "tourDuration": isoDuration,
      "offers": {
        "@type": "Offer",
        "price": cleanPrice,
        "priceCurrency": currentCurrency,
        "availability": "https://schema.org/InStock",
        "url": window.location.href
      },
      "provider": {
        "@type": "TravelAgency",
        "name": "Georgia Trips",
        "url": "https://georgiatrips.ge",
        "logo": "https://georgiatrips.ge/logo.png",
        "sameAs": [
          "https://www.facebook.com/profile.php?id=61588059054976",
          "https://www.instagram.com/georgiatrips.ge/"
        ]
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "bestRating": "5",
        "worstRating": "1",
        "ratingCount": "38"
      }
    };

    const script = document.createElement('script');
    script.id = 'gt-tour-schema-jsonld';
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema, null, 2);
    document.head.appendChild(script);
  } catch (e) {
    console.error('[Schema JSON-LD] Error generating schema:', e);
  }
}

// ── SHOW ITINERARY (SAMPLE) ──────────────────────────────────
function showItinerary() {
  const itinerarySection = document.getElementById('itinerary-section');
  const itineraryContent = document.getElementById('itinerary-content');

  itinerarySection.style.display = 'block';

  // Sample itinerary structure
  const days = currentTour.duration ? parseInt(currentTour.duration) : 3;
  let html = '';

  const tourTitle = _L(currentTour.title);
  const tFn = window.t || ((k) => k);
  const includesLabel = tFn('itinerary_includes_label') || 'Includes:';
  const includesDetail = tFn('itinerary_includes_detail') || 'Guided tours, local meals, transportation between locations.';

  for (let i = 1; i <= days; i++) {
    const dayTitle = tFn('day_label', { n: i }) || `Day ${i}`;
    const dayDesc = tFn('itinerary_day_desc', { n: i, tour: tourTitle })
      || `Activities and highlights for Day ${i} of your ${tourTitle} tour.`;
    html += `
      <div class="itinerary-day">
        <h4 class="itinerary-day__title">${dayTitle}</h4>
        <p class="itinerary-day__content">
          ${dayDesc}
          <br><br>
          <strong>${includesLabel}</strong> ${includesDetail}
        </p>
      </div>
    `;
  }

  itineraryContent.innerHTML = html;
}

// ── BOOKING MODAL ───────────────────────────────────────────
function openBookingForm() {
  const modal = document.getElementById('book-modal');
  if (modal) {
    modal.classList.add('modal-open');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Lock people input to tour's min/max limits
    const peopleInput = document.getElementById('book-people');
    if (peopleInput && currentTour) {
      const maxP = parseInt(currentTour.maxPeople, 10);
      const minP = parseInt(currentTour.minPeople, 10);
      if (!isNaN(maxP) && maxP > 0) peopleInput.max = maxP;
      if (!isNaN(minP) && minP > 0) peopleInput.min = minP;

      // If current value exceeds new max, clamp it
      const cur = parseInt(peopleInput.value, 10);
      if (!isNaN(maxP) && !isNaN(cur) && cur > maxP) peopleInput.value = maxP;
    }

    // Show per-person price immediately on modal open
    updateBookingPriceBox();
  }
}

function closeBookingModal() {
  const modal = document.getElementById('book-modal');
  if (modal) {
    modal.classList.remove('modal-open');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

function openDatePicker() {
  const calendar = document.getElementById('custom-calendar');
  if (!calendar) return;
  calendar.classList.toggle('open');
  calendar.setAttribute('aria-hidden', calendar.classList.contains('open') ? 'false' : 'true');
}

function formatDateISO(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateReadable(dateObj) {
  const lang = window.GT_CURRENT_LANG || document.documentElement.getAttribute('data-lang') || 'ka';
  const locale = CALENDAR_LOCALE_DATA[lang] || CALENDAR_LOCALE_DATA.en;
  const d = String(dateObj.getDate()).padStart(2, '0');
  const monthName = locale.months[dateObj.getMonth()];
  const y = dateObj.getFullYear();
  return lang === 'ka' ? `${d} ${monthName} ${y}` : `${d} ${monthName.slice(0, 3)} ${y}`;
}

// Static month & weekday names — never depends on browser Intl locale loading
const CALENDAR_LOCALE_DATA = {
  ka: {
    months: ['იანვარი','თებერვალი','მარტი','აპრილი','მაისი','ივნისი',
             'ივლისი','აგვისტო','სექტემბერი','ოქტომბერი','ნოემბერი','დეკემბერი'],
    weekdays: ['ორშ','სამ','ოთხ','ხუთ','პარ','შაბ','კვი']
  },
  en: {
    months: ['January','February','March','April','May','June',
             'July','August','September','October','November','December'],
    weekdays: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
  },
  ru: {
    months: ['Январь','Февраль','Март','Апрель','Май','Июнь',
             'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],
    weekdays: ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']
  },
  tr: {
    months: ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran',
             'Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'],
    weekdays: ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz']
  },
  ar: {
    months: ['يناير','فبراير','مارس','أبريل','مايو','يونيو',
             'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'],
    weekdays: ['اثن','ثلا','أرب','خمي','جمع','سبت','أحد']
  },
  uk: {
    months: ['Січень','Лютий','Березень','Квітень','Травень','Червень',
             'Липень','Серпень','Вересень','Жовтень','Листопад','Грудень'],
    weekdays: ['Пн','Вт','Ср','Чт','Пт','Сб','Нд']
  }
};

function renderCustomCalendar() {
  const monthTitle = document.getElementById('calendar-month-year');
  const daysRoot = document.getElementById('calendar-days');
  const weekdaysRoot = document.getElementById('calendar-weekdays');
  if (!monthTitle || !daysRoot || !weekdaysRoot) return;

  const lang = window.GT_CURRENT_LANG || document.documentElement.getAttribute('data-lang') || 'ka';
  const locale = CALENDAR_LOCALE_DATA[lang] || CALENDAR_LOCALE_DATA.ka;

  // Weekday headers — always start from Monday
  weekdaysRoot.innerHTML = locale.weekdays.map((d) => `<span>${d}</span>`).join('');

  const { currentMonth, currentYear, selectedStart, selectedEnd } = calendarState;
  // Month + year title — fully static, zero Intl dependency
  const monthName = locale.months[currentMonth];
  const monthYearText = lang === 'ka'
    ? `${currentYear} წლის ${monthName}`
    : `${monthName} ${currentYear}`;
  monthTitle.textContent = monthYearText;

  const firstDay = new Date(currentYear, currentMonth, 1);
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells = [];
  for (let i = 0; i < startOffset; i++) {
    cells.push('<button type="button" class="calendar-day muted" disabled></button>');
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(currentYear, currentMonth, day);
    cellDate.setHours(0, 0, 0, 0);
    const isPast = cellDate < today;
    const iso = formatDateISO(cellDate);
    const isRangeStart = selectedStart === iso;
    const isRangeEnd = selectedEnd === iso;
    const inRange = selectedStart && selectedEnd && iso >= selectedStart && iso <= selectedEnd;
    cells.push(
      `<button type="button" class="calendar-day ${isPast ? 'muted' : ''} ${inRange ? 'inrange' : ''} ${isRangeStart ? 'range-start' : ''} ${isRangeEnd ? 'range-end' : ''}" data-date="${iso}" ${isPast ? 'disabled' : ''}>${day}</button>`
    );
  }

  daysRoot.innerHTML = cells.join('');
}

function setModalDateRange(startISO, endISO, daysCount) {
  const hiddenDate = document.getElementById('book-date');
  const hiddenEnd = document.getElementById('book-date-end');
  const displayDate = document.getElementById('book-date-display');
  const dateSummary = document.getElementById('modal-date-summary');
  if (!hiddenDate || !displayDate || !hiddenEnd) return;
  hiddenDate.value = startISO;
  hiddenEnd.value = endISO;
  const start = new Date(`${startISO}T00:00:00`);
  const end = new Date(`${endISO}T00:00:00`);
  const startText = formatDateReadable(start);
  const endText = formatDateReadable(end);
  displayDate.value = daysCount > 1 ? `${startText} – ${endText} (${daysCount} დღე)` : `${startText} (1 დღე)`;
  if (dateSummary) {
    dateSummary.textContent = `ტური: ${daysCount} დღე (${startText} - ${endText})`;
  }
}

function refreshModalPriceSummary() {
  if (!currentTour) return;
  const priceEl = document.getElementById('modal-price-summary');
  const currencyEl = document.getElementById('modal-currency-summary');
  if (!priceEl || !currencyEl) return;
  const tFn = window.t || ((k) => k);

  if (window.PriceDisplay) {
    const selectedCurrency = window.PriceDisplay.getSelectedCurrency();
    const currencyMeta = window.PriceDisplay.currencies?.[selectedCurrency];
    const priceText = window.PriceDisplay.formatConvertedPrice(currentTour);
    const label = window.PriceDisplay.getPriceLabel(currentTour, tFn('per_person') || 'per person');
    priceEl.textContent = `${priceText} / ${label}`;
    currencyEl.textContent = `${tFn('Selected Currency') || 'Selected Currency'}: ${selectedCurrency} (${currencyMeta?.label || selectedCurrency})`;
    return;
  }

  priceEl.textContent = currentTour.price || '-';
  currencyEl.textContent = `${tFn('Selected Currency') || 'Selected Currency'}: -`;
}

// ── LIVE PRICE CALCULATOR ────────────────────────────────────
function updateBookingPriceBox() {
  const box = document.getElementById('modal-price-box');
  if (!box || !currentTour) return;

  // If tour is on-request, hide the box
  if (currentTour.priceOnRequest) { box.style.display = 'none'; return; }

  const peopleInput = document.getElementById('book-people');
  const people = peopleInput ? parseInt(peopleInput.value, 10) : 0;

  // Resolve numeric per-person price
  let pricePerPerson = 0;
  let currencySymbol = '$';
  let currencyCode = 'USD';

  if (window.PriceDisplay) {
    const cur = window.PriceDisplay.getSelectedCurrency();
    const curMeta = window.PriceDisplay.currencies?.[cur];
    currencySymbol = curMeta?.symbol || cur;
    currencyCode = cur;

    const meta = window.PriceDisplay.getPriceMeta(currentTour);
    if (meta && meta.amount !== null) {
      if (window.PriceDisplay.convertAmount) {
        pricePerPerson = window.PriceDisplay.convertAmount(meta.amount, meta.currency, cur);
      } else {
        pricePerPerson = meta.amount;
      }
    } else {
      pricePerPerson = parseFloat(currentTour.price) || 0;
    }
  } else {
    pricePerPerson = parseFloat(currentTour.price) || 0;
    currencySymbol = '$';
  }

  const perPersonLabel = document.getElementById('modal-price-per-label');
  const countLabel = document.getElementById('modal-price-count-label');
  const totalLabel = document.getElementById('modal-price-total-label');
  
  if (perPersonLabel) perPersonLabel.textContent = window.t ? window.t('price_per_person') || 'ფასი ადამიანზე' : 'ფასი ადამიანზე';
  if (countLabel) countLabel.textContent = window.t ? window.t('number_of_people') || 'ადამიანების რაოდენობა' : 'ადამიანების რაოდენობა';
  if (totalLabel) totalLabel.textContent = window.t ? window.t('total') || 'სულ' : 'სულ';

  if (!pricePerPerson || pricePerPerson <= 0) { box.style.display = 'none'; return; }

  const fmt = (n) => currencySymbol + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  document.getElementById('modal-price-per-value').textContent = fmt(pricePerPerson);
  document.getElementById('modal-price-count-value').textContent = (people > 0 ? `× ${people}` : '—');
  document.getElementById('modal-price-total-value').textContent = (people > 0 ? fmt(pricePerPerson * people) : '—');

  box.style.display = 'block';
}

// Close modal when backdrop is clicked
document.addEventListener('DOMContentLoaded', function() {
  const backdrop = document.getElementById('book-modal');
  if (backdrop) {
    backdrop.addEventListener('click', function(e) {
      if (e.target === backdrop) {
        closeBookingModal();
      }
    });
  }

  // Live price calculation on people count change
  const peopleInput = document.getElementById('book-people');
  if (peopleInput) {
    peopleInput.addEventListener('input', updateBookingPriceBox);
  }
  const today = new Date();
  calendarState.currentMonth = today.getMonth();
  calendarState.currentYear = today.getFullYear();
  renderCustomCalendar();

  const prevBtn = document.getElementById('calendar-prev');
  const nextBtn = document.getElementById('calendar-next');
  const daysRoot = document.getElementById('calendar-days');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      calendarState.currentMonth -= 1;
      if (calendarState.currentMonth < 0) {
        calendarState.currentMonth = 11;
        calendarState.currentYear -= 1;
      }
      renderCustomCalendar();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      calendarState.currentMonth += 1;
      if (calendarState.currentMonth > 11) {
        calendarState.currentMonth = 0;
        calendarState.currentYear += 1;
      }
      renderCustomCalendar();
    });
  }

  if (daysRoot) {
    daysRoot.addEventListener('click', (e) => {
      e.stopPropagation();
      const dayBtn = e.target.closest('.calendar-day[data-date]');
      if (!dayBtn || dayBtn.disabled) return;
      const selectedStart = dayBtn.dataset.date;
      const daysCount = getTourDaysCount();
      const startDate = new Date(`${selectedStart}T00:00:00`);
      const endDate = new Date(startDate);
      // Days-based selection: 3-day tour should highlight exactly 3 calendar days.
      endDate.setDate(endDate.getDate() + Math.max(daysCount - 1, 0));
      const selectedEnd = formatDateISO(endDate);

      calendarState.selectedStart = selectedStart;
      calendarState.selectedEnd = selectedEnd;
      setModalDateRange(selectedStart, selectedEnd, daysCount);
      renderCustomCalendar();
    });
  }

  document.addEventListener('click', (e) => {
    if (!(e.target instanceof Element)) return;
    const clickedInsidePicker = e.target.closest('.date-input-wrap, #custom-calendar');
    if (clickedInsidePicker) return;
    const cal = document.getElementById('custom-calendar');
    if (cal) cal.classList.remove('open');
  });

  window.addEventListener('gt:currencychange', () => {
    refreshModalPriceSummary();
    updateBookingPriceBox();
  });

  const displayDate = document.getElementById('book-date-display');
  if (displayDate) {
    displayDate.addEventListener('click', openDatePicker);
  }
});

// ── BOOKING MODALS (warn + success) ─────────────────────────
function closeWarnModal() {
  const m = document.getElementById('whatsapp-warn-modal');
  if (m) { m.style.display = 'none'; document.body.style.overflow = 'auto'; }
}
function closeSuccessModal() {
  const m = document.getElementById('booking-success-modal');
  if (m) { m.style.display = 'none'; document.body.style.overflow = 'auto'; }
}

// ── SUBMIT BOOKING ───────────────────────────────────────────
// Step 1 — intercept submit: show WhatsApp/Telegram warning first
async function submitBooking(event) {
  event.preventDefault();

  const tFn = window.t || ((k) => k);

  // Localize the warning modal text
  const warnTitle = document.getElementById('warn-modal-title');
  const warnBody  = document.getElementById('warn-modal-body');
  const warnOk    = document.getElementById('warn-modal-confirm');
  const warnCancel = document.getElementById('warn-modal-cancel');

  if (warnTitle) warnTitle.textContent = tFn('booking_whatsapp_warning')?.split('\n')[0]?.replace('📱 ','') || 'მნიშვნელოვანი ინფორმაცია';
  if (warnBody) {
    const lang = window.GT_CURRENT_LANG || 'ka';
    const bodyMap = {
      ka: 'დარწმუნდით, რომ თქვენს მოცემულ ტელეფონის ნომერზე გაქვთ <strong>WhatsApp</strong> ან <strong>Telegram</strong> დაინსტალირებული.<br><br>ჯავშნის დადასტურების შემთხვევაში ამ არხებით დაგიკავშირდებით.',
      en: 'Please make sure your provided phone number has <strong>WhatsApp</strong> or <strong>Telegram</strong> installed.<br><br>We will contact you through these channels to confirm your booking.',
      ru: 'Пожалуйста, убедитесь, что на вашем номере телефона установлен <strong>WhatsApp</strong> или <strong>Telegram</strong>.<br><br>Мы свяжемся с вами для подтверждения бронирования.',
      tr: 'Lütfen verdiğiniz telefon numarasında <strong>WhatsApp</strong> veya <strong>Telegram</strong> yüklü olduğundan emin olun.<br><br>Rezervasyonunuzu onaylamak için bu kanallar üzerinden iletişime geçeceğiz.',
      ar: 'يرجى التأكد من أن رقم هاتفك به <strong>WhatsApp</strong> أو <strong>Telegram</strong>.<br><br>سنتواصل معك عبر هذه القنوات لتأكيد الحجز.',
      he: 'אנא ודאו שמספר הטלפון שלכם מותקן עליו <strong>WhatsApp</strong> או <strong>Telegram</strong>.<br><br>ניצור אתכם קשר דרך ערוצים אלה לאישור ההזמנה.',
      uk: 'Будь ласка, переконайтеся, що на вашому номері встановлено <strong>WhatsApp</strong> або <strong>Telegram</strong>.<br><br>Ми зв\'яжемося з вами для підтвердження бронювання.',
    };
    warnBody.innerHTML = bodyMap[lang] || bodyMap.ka;
  }
  if (warnOk)    warnOk.textContent    = tFn('booking_confirm_btn') || 'გაგზავნა';
  if (warnCancel) warnCancel.textContent = tFn('booking_cancel_btn') || 'გაუქმება';

  const warnModal = document.getElementById('whatsapp-warn-modal');
  if (warnModal) {
    warnModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

// Step 2 — user confirmed: actually send the booking
async function confirmAndSubmitBooking() {
  closeWarnModal();

  const form = document.getElementById('booking-form');
  const data = {
    name:      document.getElementById('book-name').value,
    email:     document.getElementById('book-email').value,
    phone:     document.getElementById('book-phone').value,
    people:    document.getElementById('book-people').value,
    dateStart: document.getElementById('book-date').value,
    dateEnd:   document.getElementById('book-date-end').value,
    notes:     document.getElementById('book-notes').value,
    tourName:  _L(currentTour.title),
    tourPrice: currentTour.price,
  };

  console.log('Booking submitted:', data);
  try {
    const mod = await import('./firebase-config.js');
    if (mod && typeof mod.addTourBooking === 'function') {
      // Attach userId when available and persist booking
      try {
        const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js');
        const current = getAuth().currentUser;
        const userId = current ? current.uid : null;
        await mod.addTourBooking({
          ...data,
          userId: userId,
          sourcePage: 'tour-detail',
          tourId: currentTour?.id || '',
          status: 'new'
        });
        // Notify other modules to refresh counts
        window.dispatchEvent(new CustomEvent('bookingsChanged', { detail: { userId } }));
      } catch (innerErr) {
        console.error('Failed to attach userId for booking:', innerErr);
        await mod.addTourBooking({
          ...data,
          sourcePage: 'tour-detail',
          tourId: currentTour?.id || '',
          status: 'new'
        });
        window.dispatchEvent(new CustomEvent('bookingsChanged', { detail: { userId: null } }));
      }
    }
  } catch (err) {
    console.error('Failed to persist tour booking:', err);
  }

  // Close booking form
  closeBookingModal();
  if (form) form.reset();

  // Show styled success modal
  const tFn = window.t || ((k) => k);
  const tourTitle = _L(currentTour.title);

  const successTitle = document.getElementById('success-modal-title');
  const successBody  = document.getElementById('success-modal-body');
  const successOk    = document.querySelector('#booking-success-modal .btn-primary');

  if (successTitle) successTitle.textContent = tFn('booking_success_title') || 'გმადლობთ ჯავშნისთვის!';
  if (successBody)  successBody.innerHTML    = tFn('booking_success_body')  ||
    'მივიღეთ თქვენი მოთხოვნა და დავადასტურებთ <strong>24 საათის განმავლობაში</strong>. შეამოწმეთ <strong>WhatsApp</strong> ან <strong>Telegram</strong> თქვენს მოცემულ ნომერზე.';

  // Localize "ან" divider
  const orSpan = document.querySelector('#booking-success-modal span[style*="text-mid"]');
  if (orSpan) {
    const lang = window.GT_CURRENT_LANG || 'ka';
    const orMap = { ka:'ან', en:'or', ru:'или', tr:'veya', ar:'أو', he:'או', uk:'або' };
    orSpan.textContent = orMap[lang] || 'ან';
  }

  const successModal = document.getElementById('booking-success-modal');
  if (successModal) {
    successModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}


window.shareCurrentTour = function(event) {
  if (!currentTour) return;
  const title = _L(currentTour.title);
  if (window.shareTour) {
    window.shareTour(currentTour.id, title, event);
  }
};

// ── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadTourDetail);

// Re-populate & re-render calendar when user switches language
window.addEventListener('languageChanged', function () {
  renderCustomCalendar();
  if (currentTour) populateTourDetail();
});
window.reRenderAllData = function () {
  renderCustomCalendar();
  if (currentTour) populateTourDetail();
};
