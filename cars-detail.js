// ============================================================
//  GEORGIA TRIPS — Car Detail Page
//  Same resilient load strategy as tour-detail.js:
//    1. Try sessionStorage / localStorage cache first (instant paint)
//    2. Fall back to Firebase fetch
//    3. Keep retrying every 1s until data shows up
// ============================================================

let currentCar = null;
const CAR_RETRY_MS = 1000;
let _carRetryTimer = null;
let _carFirebaseStarted = false;

function _getCarIdFromURL() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || params.get('car') || null;
  } catch (e) { return null; }
}

function _tryGetCarFromAnySource(carId) {
  // 1. sessionStorage full object (fastest — set on card click)
  try {
    const stored = sessionStorage.getItem('selectedCarData');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && carId && parsed.id === carId) return parsed;
      if (parsed && !carId) return parsed;
    }
  } catch (e) {}

  // 2. Shared localStorage cache (gt_data_cache_v1)
  try {
    const raw = localStorage.getItem('gt_data_cache_v1');
    if (raw) {
      const cache = JSON.parse(raw);
      if (cache && Array.isArray(cache.cars)) {
        const hit = carId ? cache.cars.find(c => c && c.id === carId) : cache.cars[0];
        if (hit) return hit;
      }
    }
  } catch (e) {}

  return null;
}

async function _firebaseFetchCarById(carId) {
  if (!carId) return null;
  try {
    const [{ initializeApp, getApps, getApp }, { getFirestore, doc, getDoc, collection, getDocs }, cfgMod] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js'),
      import('./firebase-config.js').catch(() => null)
    ]);
    const firebaseConfig = cfgMod && (cfgMod.firebaseConfig || cfgMod.default);
    // We can initialize with the same static config if needed
    const FALLBACK_CONFIG = {
      apiKey: "AIzaSyAuLpaONrIUwnJJ3ycgzWWlSTiujotfo4U",
      authDomain: "georgiatripsge.firebaseapp.com",
      projectId: "georgiatripsge",
      storageBucket: "georgiatripsge.firebasestorage.app",
      messagingSenderId: "458133209260",
      appId: "1:458133209260:web:884340052c037e6fcd9f09"
    };
    const config = firebaseConfig || FALLBACK_CONFIG;
    const app = getApps().length ? getApp() : initializeApp(config);
    const db = getFirestore(app);

    try {
      const snap = await getDoc(doc(db, 'cars', carId));
      if (snap.exists()) return { id: snap.id, ...snap.data() };
    } catch (e) {}

    const snapshot = await getDocs(collection(db, 'cars'));
    const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    try {
      const raw = localStorage.getItem('gt_data_cache_v1');
      const cache = raw ? JSON.parse(raw) : {};
      cache.cars = list;
      cache.timestamp = Date.now();
      localStorage.setItem('gt_data_cache_v1', JSON.stringify(cache));
    } catch (e) {}
    return list.find(c => c.id === carId) || null;
  } catch (err) {
    console.error('[cars-detail] Firebase lookup failed:', err);
    return null;
  }
}

function _showCarLoader() {
  const titleEl = document.getElementById('car-hero-title');
  if (titleEl) {
    const loadingLabel = (window.t && window.t('loading')) || 'Loading';
    titleEl.textContent = loadingLabel + '…';
  }
}

function loadCarDetail() {
  const urlId = _getCarIdFromURL();
  const storedId = sessionStorage.getItem('selectedCarId');
  const carId = urlId || storedId;

  // If the URL id differs from stored id, clear the stale cache
  if (urlId && storedId && urlId !== storedId) {
    try {
      sessionStorage.removeItem('selectedCarData');
      sessionStorage.setItem('selectedCarId', urlId);
    } catch (e) {}
  } else if (urlId && !storedId) {
    try { sessionStorage.setItem('selectedCarId', urlId); } catch (e) {}
  }

  const hit = _tryGetCarFromAnySource(carId);
  if (hit) {
    currentCar = hit;
    try { populateCarDetail(); } catch (e) { console.error(e); }
    if (_carRetryTimer) { clearTimeout(_carRetryTimer); _carRetryTimer = null; }
    return;
  }

  _showCarLoader();

  if (carId && !_carFirebaseStarted) {
    _carFirebaseStarted = true;
    _firebaseFetchCarById(carId)
      .then(car => {
        if (car) {
          try {
            sessionStorage.setItem('selectedCarId', car.id);
            sessionStorage.setItem('selectedCarData', JSON.stringify(car));
          } catch (e) {}
        } else {
          _carFirebaseStarted = false;
        }
        loadCarDetail();
      })
      .catch(() => { _carFirebaseStarted = false; });
  }

  if (_carRetryTimer) clearTimeout(_carRetryTimer);
  _carRetryTimer = setTimeout(() => {
    _carRetryTimer = null;
    if (!currentCar) loadCarDetail();
  }, CAR_RETRY_MS);
}

// ── i18n helpers ─────────────────────────────────────────────
function _L(val, fallback = '') {
  if (window.localize) return window.localize(val, fallback);
  if (val == null) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'object') return val.ka || val.en || fallback;
  return String(val);
}
function _T(key, tokens) {
  return (window.t ? window.t(key, tokens) : key);
}
function _translateCarType(type) {
  if (!type || typeof type !== 'string') return type || '';
  const tt = window.t;
  if (!tt) return type;
  const s = type.trim();
  const map = {
    'Sedan': 'type_sedan',
    'SUV': 'type_suv',
    'Minivan': 'type_minivan',
    'Van': 'type_van',
    'Jeep': 'type_jeep'
  };
  return map[s] ? tt(map[s]) : s;
}

// ── POPULATE ─────────────────────────────────────────────────
function populateCarDetail() {
  const car = currentCar;
  if (!car) return;

  const title = _L(car.title);
  const desc = _L(car.info || car.desc);
  const type = _translateCarType(car.type || '');

  document.title = title + ' – Georgia Trips';

  // Hero
  const heroImg = document.getElementById('car-hero-img');
  if (heroImg) heroImg.src = car.img || '';
  const heroTitle = document.getElementById('car-hero-title');
  if (heroTitle) heroTitle.textContent = title;
  const heroBadge = document.getElementById('car-hero-type');
  if (heroBadge) heroBadge.textContent = type || '';

  // Spec tiles (use dashes for missing values)
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value || '—';
  };
  setText('spec-seats', car.seats);
  setText('spec-transmission', car.transmission);
  setText('spec-fuel', car.fuel);
  setText('spec-color', car.color);

  // Description
  const descEl = document.getElementById('car-description');
  if (descEl) descEl.textContent = desc || _T('no_car_description') || 'No description available.';

  // Price block
  const priceBlock = document.getElementById('car-price-block');
  if (priceBlock) {
    if (window.PriceDisplay) {
      priceBlock.innerHTML = window.PriceDisplay.renderPriceMarkup(car, {
        priceClass: 'car-booking-card__price-value',
        labelClass: 'car-booking-card__price-label',
        defaultLabel: _T('per_day') || 'per day'
      });
    } else {
      const valueEl = document.getElementById('car-price-value');
      const labelEl = document.getElementById('car-price-label');
      if (valueEl) valueEl.textContent = car.priceOnRequest ? (_T('on_request') || 'On Request') : (car.price || '—');
      if (labelEl) {
        if (car.priceOnRequest) {
          labelEl.style.display = 'none';
        } else {
          labelEl.style.display = '';
          labelEl.textContent = _T('per_day') || 'per day';
        }
      }
    }
  }

  // Modal title
  const modalName = document.getElementById('modal-car-name');
  if (modalName) modalName.textContent = title;

  // Clear sessionStorage so a stale object doesn't pollute future visits
  try {
    sessionStorage.removeItem('selectedCarId');
    sessionStorage.removeItem('selectedCarData');
  } catch (e) {}
}

// ── BOOKING MODAL ────────────────────────────────────────────
window.openCarBookingModal = function() {
  const modal = document.getElementById('car-book-modal');
  if (!modal) return;
  modal.classList.add('modal-open');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
};
window.closeCarBookingModal = function() {
  const modal = document.getElementById('car-book-modal');
  if (!modal) return;
  modal.classList.remove('modal-open');
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
};

document.addEventListener('DOMContentLoaded', function() {
  const backdrop = document.getElementById('car-book-modal');
  if (backdrop) {
    backdrop.addEventListener('click', function(e) {
      if (e.target === backdrop) window.closeCarBookingModal();
    });
  }
});

window.submitCarBooking = function(event) {
  event.preventDefault();
  const form = document.getElementById('car-booking-form');
  const data = {
    name: document.getElementById('cb-name').value,
    email: document.getElementById('cb-email').value,
    phone: document.getElementById('cb-phone').value,
    passengers: document.getElementById('cb-passengers').value,
    date: document.getElementById('cb-date').value,
    pickup: document.getElementById('cb-pickup').value,
    notes: document.getElementById('cb-notes').value,
    carName: currentCar ? _L(currentCar.title) : '',
    carId: currentCar ? currentCar.id : ''
  };
  console.log('Car booking submitted:', data);
  const carTitle = currentCar ? _L(currentCar.title) : '';
  const template = _T('car_booking_success') ||
    'Thank you for booking "{car}"!\n\nWe received your request and will confirm within 24 hours.\n\nCheck your email for details.';
  const msg = template.replace('{car}', carTitle);
  alert(msg);
  window.closeCarBookingModal();
  if (form) form.reset();
};

// ── SHARE ────────────────────────────────────────────────────
window.shareCurrentCar = function(event) {
  if (event) event.preventDefault();
  if (!currentCar) return;
  const title = _L(currentCar.title);
  const url = `${window.location.origin}/cars-detail.html?id=${encodeURIComponent(currentCar.id)}`;
  if (navigator.share) {
    navigator.share({ title: title, url: url }).catch(() => {});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      if (window.showToast) window.showToast('Link copied to clipboard!', 'info');
      else alert('Link copied: ' + url);
    });
  }
};

// ── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadCarDetail);

// Re-populate when user switches language
window.addEventListener('languageChanged', function() {
  if (currentCar) populateCarDetail();
});
window.reRenderAllData = function() {
  if (currentCar) populateCarDetail();
};
