// ============================================================
//  GEORGIA TRIPS — Tour Detail Page Module
//  Handles: loading tour data, displaying details, booking
// ============================================================

let currentTour = null;

// ── INSTANT / RESILIENT LOAD ─────────────────────────────────
// Strategy: try every fast in-memory source first (sessionStorage,
// localStorage cache, static TOURS). If none of them have the
// requested tour yet, start a Firebase fetch AND schedule a retry
// every 1s. Keep retrying forever until the tour renders.
const TOUR_DETAIL_RETRY_MS = 1000;
let _tourDetailRetryTimer = null;
let _tourDetailFirebaseStarted = false;

function _tryGetTourFromAnySource(tourId) {
  // 1. sessionStorage full object (fastest — set on card click)
  try {
    const storedTour = sessionStorage.getItem('selectedTourData');
    if (storedTour) {
      const parsed = JSON.parse(storedTour);
      if (parsed && (!tourId || parsed.id === tourId)) return parsed;
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

function loadTourDetail() {
  const tourId = sessionStorage.getItem('selectedTourId');

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

  // Modal tour name
  const modalPriceDisplay = tour.priceOnRequest
    ? tFn('price_on_request')
    : `${tour.price} ${tFn('per_person')}`;
  document.getElementById('modal-tour-name').textContent = `${title} - ${modalPriceDisplay}`;

  // Itinerary (if multi-day)
  if (tour.category === 'multi-day' || tour.category === 'upcoming') {
    showItinerary();
  }

  // Clear sessionStorage
  sessionStorage.removeItem('selectedTourId');
  sessionStorage.removeItem('selectedTourData');
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
});

// ── SUBMIT BOOKING ───────────────────────────────────────────
function submitBooking(event) {
  event.preventDefault();
  
  const form = document.getElementById('booking-form');
  const data = {
    name: document.getElementById('book-name').value,
    email: document.getElementById('book-email').value,
    phone: document.getElementById('book-phone').value,
    people: document.getElementById('book-people').value,
    date: document.getElementById('book-date').value,
    notes: document.getElementById('book-notes').value,
    tourName: _L(currentTour.title),
    tourPrice: currentTour.price,
  };

  console.log('Booking submitted:', data);

  // Show success message (localized)
  const tourTitle = _L(currentTour.title);
  const tFn = window.t || ((k) => k);
  const successMsg = tFn('booking_success_alert', { tour: tourTitle })
    || `Thank you for booking "${tourTitle}"!\n\nWe've received your request and will confirm within 24 hours.\n\nCheck your email for details.`;
  alert(successMsg);
  
  // Close modal and reset form
  closeBookingModal();
  form.reset();
}

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadTourDetail);

// Re-populate when user switches language
window.addEventListener('languageChanged', function () {
  if (currentTour) populateTourDetail();
});
window.reRenderAllData = function () {
  if (currentTour) populateTourDetail();
};
