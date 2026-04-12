// ============================================================
//  GEORGIA TRIPS — Tour Detail Page Module
//  Handles: loading tour data, displaying details, booking
// ============================================================

let currentTour = null;

// ── LOAD TOUR DATA ───────────────────────────────────────────
function loadTourDetail() {
  const tourId = sessionStorage.getItem('selectedTourId');
  
  if (!tourId || !toursData) {
    console.error('Tour ID not found or data not available');
    document.body.innerHTML = '<div style="text-align:center;padding:4rem;"><h2>Tour not found</h2><a href="tours.html">Back to Tours</a></div>';
    return;
  }

  // Find the tour by ID
  currentTour = toursData.find(tour => tour.id === tourId);
  
  if (!currentTour) {
    console.error('Tour with ID ' + tourId + ' not found');
    document.body.innerHTML = '<div style="text-align:center;padding:4rem;"><h2>Tour not found</h2><a href="tours.html">Back to Tours</a></div>';
    return;
  }

  // Populate the page
  populateTourDetail();
}

// ── POPULATE PAGE ────────────────────────────────────────────
function populateTourDetail() {
  const tour = currentTour;

  // Update page title
  document.title = tour.title + ' – Georgia Trips';

  // Hero section
  document.getElementById('detail-hero-img').src = tour.img;
  document.getElementById('detail-title').textContent = tour.title;

  // Quick info cards
  document.getElementById('detail-duration').textContent = tour.duration || 'Flexible';
  document.getElementById('detail-group').textContent = tour.groupSize || 'Variable';
  document.getElementById('detail-difficulty').textContent = tour.difficulty || 'Easy';
  document.getElementById('detail-category').textContent = (tour.category || 'general').toUpperCase().replace('-', ' ');

  // Description
  document.getElementById('detail-description').textContent = tour.desc || 'No description available.';

  // Highlights
  const highlightsList = document.getElementById('detail-highlights');
  highlightsList.innerHTML = (tour.highlights || [])
    .map(h => `<li class="highlight-item"><span class="highlight-icon">✓</span>${h}</li>`)
    .join('');

  // Price and badge
  document.getElementById('detail-price').textContent = tour.price;
  const typeText = (tour.type || tour.tourType) === 'domestic' ? '🏔️ Domestic Tour' : '✈️ International Tour';
  document.getElementById('detail-type-badge').textContent = typeText;

  // Modal tour name
  document.getElementById('modal-tour-name').textContent = `${tour.title} - ${tour.price} per person`;

  // Itinerary (if multi-day)
  if (tour.category === 'multi-day' || tour.category === 'upcoming') {
    showItinerary();
  }

  // Clear sessionStorage
  sessionStorage.removeItem('selectedTourId');
}

// ── SHOW ITINERARY (SAMPLE) ──────────────────────────────────
function showItinerary() {
  const itinerarySection = document.getElementById('itinerary-section');
  const itineraryContent = document.getElementById('itinerary-content');
  
  itinerarySection.style.display = 'block';
  
  // Sample itinerary structure
  const days = currentTour.duration ? parseInt(currentTour.duration) : 3;
  let html = '';
  
  for (let i = 1; i <= days; i++) {
    html += `
      <div class="itinerary-day">
        <h4 class="itinerary-day__title">Day ${i}</h4>
        <p class="itinerary-day__content">
          Activities and highlights for Day ${i} of your ${currentTour.title} tour.
          <br><br>
          <strong>Includes:</strong> Guided tours, local meals, transportation between locations.
        </p>
      </div>
    `;
  }
  
  itineraryContent.innerHTML = html;
}

// ── BOOKING MODAL ────────────────────────────────────────────
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
    tourName: currentTour.title,
    tourPrice: currentTour.price,
  };

  console.log('Booking submitted:', data);
  
  // Show success message
  alert(`Thank you for booking "${currentTour.title}"!\n\nWe've received your request and will confirm within 24 hours.\n\nCheck your email for details.`);
  
  // Close modal and reset form
  closeBookingModal();
  form.reset();
}

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', loadTourDetail);
