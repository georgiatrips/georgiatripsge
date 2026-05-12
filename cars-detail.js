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

const calendarState = {
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),
  selectedStart: null,
  selectedEnd: null,
  selectingRange: false // True if the user has clicked start and needs to click end
};

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
function _currentLang() {
  return window.GT_CURRENT_LANG ||
    (window.GTLang && typeof window.GTLang.get === 'function' ? window.GTLang.get() : null) ||
    document.documentElement.getAttribute('data-lang') ||
    'ka';
}

function _L(val, fallback = '') {
  if (val == null) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    const lang = _currentLang();
    // Try exact language, then English, then Georgian, then any non-empty value
    return val[lang] || val['en'] || val['ka'] || Object.values(val).find(v => v && String(v).trim()) || fallback;
  }
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

function _translateCommonValue(str) {
  // If already a multi-lang object, resolve it first
  if (str && typeof str === 'object') return _L(str);
  if (!str || typeof str !== 'string') return str;
  const t = window.t;
  if (!t) return str;
  const s = str.trim();
  const map = {
    'Automatic': 'automatic', 'ავტომატური': 'automatic',
    'Manual': 'manual', 'მექანიკური': 'manual',
    'Petrol': 'petrol', 'ბენზინი': 'petrol',
    'Diesel': 'diesel', 'დიზელი': 'diesel',
    'Hybrid': 'hybrid', 'ჰიბრიდი': 'hybrid',
    'Black': 'black', 'შავი': 'black', 'White': 'white', 'თეთრი': 'white', 'Silver': 'silver', 'ვერცხლისფერი': 'silver', 'Grey': 'grey', 'ნაცრისფერი': 'grey',
    'Red': 'red', 'წითელი': 'red', 'Blue': 'blue', 'ლურჯი': 'blue',
  };
  return map[s] ? t(map[s]) : s;
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
  setText('spec-seats', _L(car.seats));
  setText('spec-transmission', _translateCommonValue(_L(car.transmission)));
  setText('spec-fuel', _translateCommonValue(_L(car.fuel)));
  setText('spec-color', _translateCommonValue(_L(car.color)));

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

  // Lock passengers input to car's seat count
  const passInput = document.getElementById('cb-passengers');
  if (passInput && currentCar) {
    // seats can be a localized object {ka:'4',en:'4'} or a plain string/number
    const rawSeats = (typeof currentCar.seats === 'object' && currentCar.seats !== null)
      ? (currentCar.seats.ka || currentCar.seats.en || Object.values(currentCar.seats)[0] || '')
      : (currentCar.seats || '');
    let seats = parseInt(rawSeats, 10);
    // Final fallback: read what's already rendered in the spec tile
    if (isNaN(seats) || seats <= 0) {
      const specEl = document.getElementById('spec-seats');
      if (specEl) seats = parseInt(specEl.textContent.trim(), 10);
    }
    if (!isNaN(seats) && seats > 0) {
      passInput.max = seats;
      const cur = parseInt(passInput.value, 10);
      if (!isNaN(cur) && cur > seats) passInput.value = seats;
    }
  }
};
window.closeCarBookingModal = function() {
  const modal = document.getElementById('car-book-modal');
  if (!modal) return;
  modal.classList.remove('modal-open');
  modal.style.display = 'none';
  document.body.style.overflow = 'auto';
};

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
  const locale = CAR_CALENDAR_LOCALE[lang] || CAR_CALENDAR_LOCALE.en;
  const d = String(dateObj.getDate()).padStart(2, '0');
  const monthName = locale.months[dateObj.getMonth()];
  const y = dateObj.getFullYear();
  return lang === 'ka' ? `${d} ${monthName} ${y}` : `${d} ${monthName.slice(0, 3)} ${y}`;
}

// Static month & weekday names — never depends on browser Intl locale loading
const CAR_CALENDAR_LOCALE = {
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
  const locale = CAR_CALENDAR_LOCALE[lang] || CAR_CALENDAR_LOCALE.ka;

  // Weekday headers — always start from Monday
  weekdaysRoot.innerHTML = locale.weekdays.map((d) => `<span>${d}</span>`).join('');

  const { currentMonth, currentYear, selectedStart, selectedEnd } = calendarState;
  // Month + year — fully static, zero Intl dependency
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
    
    let isRangeStart = false, isRangeEnd = false, inRange = false;
    
    if (selectedStart && selectedEnd) {
      const minDate = selectedStart < selectedEnd ? selectedStart : selectedEnd;
      const maxDate = selectedStart > selectedEnd ? selectedStart : selectedEnd;
      isRangeStart = iso === minDate;
      isRangeEnd = iso === maxDate;
      inRange = iso >= minDate && iso <= maxDate;
    } else if (selectedStart) {
      isRangeStart = iso === selectedStart;
      isRangeEnd = iso === selectedStart;
      inRange = iso === selectedStart;
    }
    
    cells.push(
      `<button type="button" class="calendar-day ${isPast ? 'muted' : ''} ${inRange ? 'inrange' : ''} ${isRangeStart ? 'range-start' : ''} ${isRangeEnd ? 'range-end' : ''}" data-date="${iso}" ${isPast ? 'disabled' : ''}>${day}</button>`
    );
  }

  daysRoot.innerHTML = cells.join('');
}

function setModalDateRange(startISO, endISO) {
  const hiddenDate = document.getElementById('cb-date');
  const hiddenEnd = document.getElementById('cb-date-end');
  const displayDate = document.getElementById('cb-date-display');
  if (!hiddenDate || !displayDate || !hiddenEnd) return;
  
  const minISO = startISO < endISO ? startISO : endISO;
  const maxISO = startISO > endISO ? startISO : endISO;
  
  hiddenDate.value = minISO;
  hiddenEnd.value = maxISO;
  
  const start = new Date(`${minISO}T00:00:00`);
  const end = new Date(`${maxISO}T00:00:00`);
  
  // Calculate difference in days + 1
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  const startText = formatDateReadable(start);
  const endText = formatDateReadable(end);
  displayDate.value = diffDays > 1 ? `${startText} – ${endText} (${diffDays} დღე)` : `${startText} (1 დღე)`;
}

document.addEventListener('DOMContentLoaded', function() {
  const backdrop = document.getElementById('car-book-modal');
  if (backdrop) {
    backdrop.addEventListener('click', function(e) {
      if (e.target === backdrop) window.closeCarBookingModal();
    });
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
      
      const clickedDate = dayBtn.dataset.date;
      
      if (!calendarState.selectingRange) {
        // First click
        calendarState.selectedStart = clickedDate;
        calendarState.selectedEnd = clickedDate; // Temporarily same
        calendarState.selectingRange = true;
        setModalDateRange(clickedDate, clickedDate);
      } else {
        // Second click
        calendarState.selectedEnd = clickedDate;
        calendarState.selectingRange = false;
        
        // ensure start is before end
        let sDate = calendarState.selectedStart;
        let eDate = calendarState.selectedEnd;
        if (sDate > eDate) {
           calendarState.selectedStart = eDate;
           calendarState.selectedEnd = sDate;
        }
        
        setModalDateRange(calendarState.selectedStart, calendarState.selectedEnd);
        
        // Auto-close calendar after selection
        const cal = document.getElementById('custom-calendar');
        if (cal) {
          setTimeout(() => {
            cal.classList.remove('open');
          }, 300);
        }
      }
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

  const displayDate = document.getElementById('cb-date-display');
  if (displayDate) {
    displayDate.addEventListener('click', openDatePicker);
  }
});

window.submitCarBooking = async function(event) {
  event.preventDefault();
  const form = document.getElementById('car-booking-form');
  const data = {
    name: document.getElementById('cb-name').value,
    email: document.getElementById('cb-email').value,
    phone: document.getElementById('cb-phone').value,
    passengers: document.getElementById('cb-passengers').value,
    dateStart: document.getElementById('cb-date').value,
    dateEnd: document.getElementById('cb-date-end').value,
    pickup: document.getElementById('cb-pickup').value,
    notes: document.getElementById('cb-notes').value,
    carName: currentCar ? _L(currentCar.title) : '',
    carId: currentCar ? currentCar.id : ''
  };
  console.log('Car booking submitted:', data);
  try {
    const mod = await import('./firebase-config.js');
    if (mod && typeof mod.addCarBooking === 'function') {
      await mod.addCarBooking({
        ...data,
        sourcePage: 'cars-detail',
        status: 'new'
      });
    }
  } catch (err) {
    console.error('Failed to persist car booking:', err);
  }
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

// Re-render calendar + repopulate when user switches language
window.addEventListener('languageChanged', function() {
  renderCustomCalendar();
  if (currentCar) populateCarDetail();
});
window.reRenderAllData = function() {
  renderCustomCalendar();
  if (currentCar) populateCarDetail();
};
