// ============================================================
//  GEORGIA TRIPS — Tour Detail Page Module
//  Handles: loading tour data, displaying details, booking
// ============================================================

let currentTour = null;

// ── LOAD TOUR DATA ───────────────────────────────────────────
function loadTourDetail() {
  const tourId = sessionStorage.getItem('selectedTourId');
  const storedTour = sessionStorage.getItem('selectedTourData');
  let parsedTour = null;

  if (storedTour) {
    try {
      parsedTour = JSON.parse(storedTour);
    } catch (error) {
      console.error('Failed to parse selected tour data:', error);
    }
  }
  
  if (parsedTour) {
    currentTour = parsedTour;
    populateTourDetail();
    return;
  }

  // ვამოწმებთ ორივე შესაძლო წყაროს (ლოკალურს და სტატიკურს)
  const dataList = (typeof toursData !== 'undefined') ? toursData : (typeof TOURS !== 'undefined' ? TOURS : []);

  if (!tourId || dataList.length === 0) {
    console.error('Tour ID not found or data not available');
    return;
  }

  // Find the tour by ID
  currentTour = dataList.find(tour => tour.id === tourId);
  
  if (!currentTour) {
    console.error('Tour with ID ' + tourId + ' not found');
    document.body.innerHTML = '<div style="text-align:center;padding:4rem;"><h2>Tour not found</h2><a href="domestic-tours.html">Back to Tours</a></div>';
    return;
  }

  // Populate the page
  populateTourDetail();
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

function populateTourDetail() {
  const tour = currentTour;
  const title = _L(tour.title);
  const duration = _L(tour.duration);
  const desc = _L(tour.desc);

  // Update page title
  document.title = title + ' – Georgia Trips';

  // Hero section
  document.getElementById('detail-hero-img').src = tour.img;
  document.getElementById('detail-title').textContent = title;

  // Quick info cards
  if (document.getElementById('detail-duration')) document.getElementById('detail-duration').textContent = duration || 'Flexible';
  if (document.getElementById('detail-season')) document.getElementById('detail-season').textContent = Array.isArray(tour.season) ? tour.season.join(', ') : (tour.season || 'All Year');
  if (document.getElementById('detail-category')) document.getElementById('detail-category').textContent = (tour.category || 'general').toUpperCase().replace('-', ' ');
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
  const incItems = [
    { key: 'guide', label: 'Expert local guide' },
    { key: 'tickets', label: 'All entrance fees' },
    { key: 'pickup', label: 'Hotel pickup & drop-off' },
    { key: 'food', label: 'Full board meals' },
    { key: 'hotel', label: 'Accommodation' },
    { key: 'water', label: 'Water and snacks' },
    { key: 'insurance', label: 'Travel insurance' },
    { key: 'emergency', label: 'Emergency support 24/7' }
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

  const typeText = (tour.type || tour.tourType) === 'domestic' ? '🏔️ Domestic Tour' : '✈️ International Tour';
  document.getElementById('detail-type-badge').textContent = typeText;

  // Modal tour name
  const tFn = window.t || ((k) => k);
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
  for (let i = 1; i <= days; i++) {
    html += `
      <div class="itinerary-day">
        <h4 class="itinerary-day__title">Day ${i}</h4>
        <p class="itinerary-day__content">
          Activities and highlights for Day ${i} of your ${tourTitle} tour.
          <br><br>
          <strong>Includes:</strong> Guided tours, local meals, transportation between locations.
        </p>
      </div>
    `;
  }
  
  itineraryContent.innerHTML = html;
}

// ── BOOKING MODAL ──────────────────────────────────���─────────
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

  // Show success message
  alert(`Thank you for booking "${_L(currentTour.title)}"!\n\nWe've received your request and will confirm within 24 hours.\n\nCheck your email for details.`);
  
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
