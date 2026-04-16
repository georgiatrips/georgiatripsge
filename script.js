﻿﻿﻿﻿﻿// ===== DATA (loaded from Firebase) =====
let toursData = [];
let carsData = [];
let postsData = [];
let featuredData = [];
let reviewsData = [];

// Firebase Firestore imports
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  query, 
  orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAuLpaONrIUwnJJ3ycgzWWlSTiujotfo4U",
  authDomain: "georgiatripsge.firebaseapp.com",
  projectId: "georgiatripsge",
  storageBucket: "georgiatripsge.firebasestorage.app",
  messagingSenderId: "458133209260",
  appId: "1:458133209260:web:884340052c037e6fcd9f09",
  measurementId: "G-KVGPVEVHQ0"
};

// Initialize Firebase (reuse existing default app if already initialized)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ===== FETCH DATA FROM FIREBASE =====
async function fetchToursFromFirebase() {
  try {
    const toursRef = collection(db, 'tours');
    const q = query(toursRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching tours:', error);
    return [];
  }
}

async function fetchCarsFromFirebase() {
  try {
    const carsRef = collection(db, 'cars');
    const q = query(carsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching cars:', error);
    return [];
  }
}

async function fetchPostsFromFirebase() {
  try {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

async function fetchFeaturedFromFirebase() {
  try {
    const featuredRef = collection(db, 'featuredTours');
    const q = query(featuredRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching featured tours:', error);
    return [];
  }
}

async function fetchReviewsFromFirebase() {
  try {
    const reviewsRef = collection(db, 'reviews');
    const q = query(reviewsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
}

// ===== GET FEATURED TOURS FROM TOURS DATA =====
function getFeaturedToursFromData(tours) {
  // Filter tours that have isFeatured = true
  const featured = tours.filter(tour => tour.isFeatured === true);
  
  // Transform tour data to featured card format
  return featured.map(tour => ({
    id: tour.id,
    title: tour.title,
    img: tour.img,
    desc: tour.desc,
    minPeople: tour.minPeople,
    maxPeople: tour.maxPeople,
    highlights: tour.highlights,
    tag: tour.category === 'one-day' ? 'One-Day Adventure' : 
         tour.category === 'multi-day' ? 'Multi-Day Experience' : 
         tour.category === 'upcoming' ? 'Upcoming Event' : 'Flexible Tour',
    badge: tour.type === 'domestic' ? 'Domestic' : 'International',
    meta: [
      tour.price,
      tour.duration || 'Flexible',
      Array.isArray(tour.season) ? tour.season.join(', ') : (tour.season || 'All Year')
    ]
  }));
}

function truncateText(text, maxLength = 150) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength).trimEnd() + '...' : text;
}

function renderHighlightsList(highlights, limit = 3, extraClass = '') {
  if (!Array.isArray(highlights) || highlights.length === 0) return '';

  const items = highlights
    .slice(0, limit)
    .map(h => `<li class="tour-highlight ${extraClass}"><span class="highlight-dot"></span>${h}</li>`)
    .join('');

  const more = highlights.length > limit
    ? `<li class="tour-highlight ${extraClass} tour-highlight--more">...</li>`
    : '';

  return items + more;
}

function renderFeaturedMeta(featured) {
  const meta = Array.isArray(featured.meta) ? featured.meta : [];
  const metaItems = [
    { icon: '💳', label: 'Price', value: window.PriceDisplay ? window.PriceDisplay.renderPriceMarkup(featured, { includeLabel: false }) : (meta[0] || 'On Request') },
    { icon: '⏱', label: 'Duration', value: meta[1] || 'Flexible' },
    { icon: '☀', label: 'Season', value: meta[2] || 'All Year' },
    { icon: '👥', label: 'Min', value: `${featured.minPeople || 1}` },
    { icon: '👥', label: 'Max', value: `${featured.maxPeople || 10}` }
  ];

  return metaItems.map(item => `
    <span class="featured-meta-item">
      <span class="icon">${item.icon}</span>
      <span class="featured-meta-text"><span class="featured-meta-label">${item.label}</span> ${item.value}</span>
    </span>
  `).join('');
}

function saveSelectedTour(tour) {
  if (!tour) return;
  sessionStorage.setItem('selectedTourId', tour.id || '');
  sessionStorage.setItem('selectedTourData', JSON.stringify(tour));
}

function getSafeAttr(value) {
  return String(value || '').replace(/'/g, '&#39;');
}

function goToTourDetail(tourId) {
  const tour = toursData.find(item => item.id === tourId);
  if (tour) {
    saveSelectedTour(tour);
  } else {
    sessionStorage.setItem('selectedTourId', tourId);
  }
  window.location.href = 'tour-detail.html';
}

/**
 * აჩვენებს შეტყობინებას ეკრანზე
 * @param {string} message - ტექსტი
 * @param {'success' | 'error' | 'info'} type - ტიპი
 */
function showToast(message, type = 'success') {
  let toast = document.getElementById('global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

/**
 * ამოწმებს ბაზაში შენახულ ტურებს და "აწითლებს" შესაბამის გულებს
 */
async function syncSaveButtons() {
  if (!auth.currentUser) {
    document.querySelectorAll('.save-tour-btn').forEach(btn => btn.classList.remove('active'));
    return;
  }
  try {
    const savedSnap = await getDocs(collection(db, 'users', auth.currentUser.uid, 'savedTours'));
    const savedIds = savedSnap.docs.map(doc => doc.id);
    document.querySelectorAll('.save-tour-btn').forEach(btn => {
      if (savedIds.includes(btn.dataset.saveId)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  } catch (e) {
    console.error("Sync error:", e);
  }
}

/**
 * ტურის შენახვა ან წაშლა ბაზიდან
 * @param {string} tourId - ტურის ID
 * @param {Event} event - კლიკის ივენთი
 */
async function toggleSaveTour(tourId, event) {
  if (event) event.stopPropagation();
  
  if (!auth.currentUser) {
    showToast("Please login to save tours!", "error");
    return;
  }

  const userId = auth.currentUser.uid;
  const saveRef = doc(db, 'users', userId, 'savedTours', tourId);
  
  try {
    const docSnap = await getDoc(saveRef);
    if (docSnap.exists()) {
      await deleteDoc(saveRef);
      showToast('Tour removed from saved', 'info');
      document.querySelectorAll(`[data-save-id="${tourId}"]`).forEach(btn => btn.classList.remove('active'));
    } else {
      await setDoc(saveRef, { savedAt: new Date().toISOString() });
      showToast('Tour saved successfully!', 'success');
      document.querySelectorAll(`[data-save-id="${tourId}"]`).forEach(btn => btn.classList.add('active'));
    }
  } catch (error) {
    console.error("Error toggling save:", error);
    showToast("Permission denied or database error", "error");
  }
}

// ფუნქციების გლობალურად გატანა
window.toggleSaveTour = toggleSaveTour;
window.syncSaveButtons = syncSaveButtons;
window.showToast = showToast;
window.goToTourDetail = goToTourDetail;

// renderTourCard ფუნქციის ქვემოთ განსაზღვრა (Hoisting-ისთვის)

// ===== NAVBAR =====
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  });

  if (toggle) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      links.classList.toggle('open');
    });
  }

  // კონსოლიდირებული Dropdown ლოგიკა (Event Delegation)
  // ეს აგვარებს პრობლემას, როცა ვალუტის ან სხვა მონაცემის შეცვლისას ღილაკები "ჭედავს"
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.nav-dropdown-btn, .nav-user-btn, .nav-cta');
    const dropdown = e.target.closest('.nav-dropdown, .nav-user-dropdown, .nav-currency-dropdown');
    const isLink = e.target.tagName === 'A';

    // ყველა სხვა ღია მენიუს დახურვა
    if (!dropdown || btn) {
      document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
        if (!dropdown || menu !== dropdown.querySelector('.dropdown-menu')) {
          menu.classList.remove('show');
        }
      });
    }

    // მიმდინარე მენიუს გადართვა (Toggle)
    if (btn && dropdown) {
      const menu = dropdown.querySelector('.dropdown-menu');
      // თუ მომხმარებელი არაა შესული, Login ღილაკზე არ ვხსნით მენიუს (auth.js გადაიყვანს login გვერდზე)
      if (btn.id === 'nav-user-btn' && !btn.classList.contains('logged-in')) return;
      
      e.preventDefault();
      if (menu) menu.classList.toggle('show');
    }

    // მენიუს დახურვა შიგნით არსებულ ლინკზე დაჭერისას
    if (isLink && dropdown) {
      const menu = dropdown.querySelector('.dropdown-menu');
      if (menu) menu.classList.remove('show');
    }
  });

  // Set active link
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path) a.classList.add('active');
  });
}

// ===== TOUR CARDS =====
function renderTourCard(tour) {
  let badgeClass = 'badge-oneday';
  let badgeText = 'One Day';
  
  if (tour.category === 'multi-day' || tour.category === 'full') {
    badgeClass = 'badge-full';
    badgeText = 'Multi Day';
  } else if (tour.category === 'flexible') {
    badgeClass = 'badge-full';
    badgeText = 'Flexible';
  } else if (tour.category === 'upcoming') {
    badgeClass = 'badge-full';
    badgeText = 'Upcoming';
  }
  // დაცვა თუ desc არ არსებობს
  const description = (tour.desc || '').length > 200 ? tour.desc.substring(0, 200) + '...' : (tour.desc || '');
  
  return `
    <div class="tour-card" data-category="${tour.category}">
      <div class="tour-card-img">
        <img src="${tour.img}" alt="${tour.title}" loading="lazy">
        <span class="tour-card-badge ${badgeClass}">${badgeText}</span>
        <button class="save-tour-btn" data-save-id="${getSafeAttr(tour.id)}" onclick="toggleSaveTour('${getSafeAttr(tour.id)}', event)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
        </button>
      </div>
      <div class="tour-card-body">
        <h3 class="tour-card-title">${tour.title}</h3>
        <p class="tour-card-desc">${description}</p>
        <div class="tour-card-footer">
          <div class="tour-price-container">${window.PriceDisplay ? window.PriceDisplay.renderPriceMarkup(tour) : `${tour.price} <span class="separator">/</span> <span>person</span>`}</div>
          <button class="btn-sm" onclick="goToTourDetail('${getSafeAttr(tour.id)}')">Book Now</button>
        </div>
      </div>
    </div>`;
}

// renderTourCard-ის მიბმა window-ზე
window.renderTourCard = renderTourCard;

function renderTours(filter = 'all') {
  const grid = document.getElementById('tours-grid');
  if (!grid) return;
  const filtered = filter === 'all' ? toursData : toursData.filter(t => t.category === filter);
  grid.innerHTML = filtered.length > 0 ? filtered.map(renderTourCard).join('') : '<p style="text-align:center;color:var(--text-mid);grid-column:1/-1;">No tours available yet.</p>';
  syncSaveButtons();
}

function renderDomesticTours() {
  const grid = document.getElementById('domestic-tours-grid');
  if (!grid) return;
  const domesticTours = toursData.filter(tour => (tour.type || tour.tourType) === 'domestic' || tour.category === 'one-day' || tour.category === 'oneday');
  grid.innerHTML = domesticTours.length > 0 ? domesticTours.map(renderTourCard).join('') : '<p style="text-align:center;color:var(--text-mid);">No domestic tours available yet. Check back soon!</p>';
  syncSaveButtons();
}

function renderInternationalTours() {
  const grid = document.getElementById('international-tours-grid');
  if (!grid) return;
  const internationalTours = toursData.filter(tour => (tour.type || tour.tourType) === 'international' || tour.category === 'multi-day' || tour.category === 'full');
  grid.innerHTML = internationalTours.length > 0 ? internationalTours.map(renderTourCard).join('') : '<p style="text-align:center;color:var(--text-mid);">No international tours available yet. Check back soon!</p>';
  syncSaveButtons();
}

function initTourTabs() {
  const btns = document.querySelectorAll('.tab-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderTours(btn.dataset.filter);
    });
  });
}

// ===== CAR CARDS =====
function renderCarCard(car) {
  return `
    <div class="car-card">
      <div class="car-card-img">
        <img src="${car.img}" alt="${car.title}" loading="lazy">
      </div>
      <div class="car-card-body">
        <span class="car-type-badge">${car.type}</span>
        <h3 class="car-card-title">${car.title}</h3>
        <p class="car-card-info">${car.info || car.desc || ''}</p>
        <div class="car-features">
          <span class="car-feature">${car.seats || ''}</span>
          <span class="car-feature">${car.ac || ''}</span>
          <span class="car-feature">${car.drive || ''}</span>
        </div>
      </div>
    </div>`;
}

function renderCars(containerId = 'cars-grid') {
  const grid = document.getElementById(containerId);
  if (!grid) return;
  grid.innerHTML = carsData.length > 0 ? carsData.map(renderCarCard).join('') : '<p style="text-align:center;color:rgba(255,255,255,0.6);">No vehicles available yet.</p>';
}

// ===== CAR FULL CARDS (cars page) =====
function renderCarFullCard(car) {
  return `
    <article class="tour-card tour-card--standard car-full-card" data-id="${car.id}">
      <div class="tour-card__img-wrap">
        <img src="${car.img}" alt="${car.title}" loading="lazy" class="tour-card__img">
        <div class="tour-card__overlay"></div>
        <span class="tour-badge tour-badge--duration">${car.type}</span>
      </div>
      <div class="tour-card__body">
        <h3 class="tour-card__title">${car.title}</h3>
        <p class="tour-card__desc">${car.info || car.desc || ''} Whether you need airport transfers, city tours, or multi-day mountain excursions, we ensure comfort and safety throughout.</p>
        <ul class="tour-highlights">
          <li class="tour-highlight"><span class="highlight-dot"></span>${car.seats || 'Comfortable seating'}</li>
          <li class="tour-highlight"><span class="highlight-dot"></span>${car.ac || 'Air Conditioning'}</li>
          <li class="tour-highlight"><span class="highlight-dot"></span>${car.drive || 'Professional Driver'}</li>
        </ul>
        <div class="tour-card__footer">
          <div class="tour-card__meta">
            <span class="tour-meta-item">Driver included</span>
          </div>
          <div class="tour-card__price-block">
            ${window.PriceDisplay ? window.PriceDisplay.renderPriceMarkup(car, { defaultLabel: 'per day' }) : `<span class="tour-price">${car.price || 'On Request'}</span><span class="tour-price-label">per day</span>`}
          </div>
        </div>
        <button class="btn-book" onclick="openBookModal('${car.title} Transfer','On Request')">
          Book This Vehicle <span class="btn-arrow">-></span>
        </button>
      </div>
    </article>`;
}

// ===== POST CARDS =====
function renderPostCard(post) {
  return `
    <div class="post-card">
      <div class="post-card-img">
        <img src="${post.img}" alt="${post.title}" loading="lazy">
        <span class="post-category">${post.category}</span>
      </div>
      <div class="post-card-body">
        <div class="post-meta">
          <span>${post.date || ''}</span>
          <span>${post.readTime || ''}</span>
        </div>
        <h3 class="post-card-title">${post.title}</h3>
        <p class="post-card-text">${post.text || post.content || ''}</p>
        <span class="post-read-more">Read More -></span>
      </div>
    </div>`;
}

function renderPosts(containerId = 'posts-grid', count = null) {
  const grid = document.getElementById(containerId);
  if (!grid) return;
  const data = count ? postsData.slice(0, count) : postsData;
  grid.innerHTML = data.length > 0 ? data.map(renderPostCard).join('') : '<p style="text-align:center;color:var(--text-mid);grid-column:1/-1;">No posts available yet.</p>';
}

// ===== REVIEW CARDS (Google Style) =====
function renderReviewCard(rev) {
  const stars = '★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating);
  
  return `
    <div class="google-review">
      <div class="review-header">
        <div class="reviewer-info">
          <h4>${rev.name}</h4>
          <div class="review-stars">${stars}</div>
        </div>
      </div>
      <p class="review-text">${rev.text}</p>
    </div>`;
}

function renderReviews() {
  const container = document.getElementById('reviews-slider');
  if (!container) return;
  container.innerHTML = reviewsData.length > 0 
    ? reviewsData.map(renderReviewCard).join('') 
    : '<p style="text-align:center;color:var(--text-mid);padding:2rem;width:100%;">No reviews yet. Be the first to share your experience!</p>';
}

// ===== FEATURED SLIDER =====
function renderFeaturedSlider() {
  const slider = document.getElementById('featured-slider');
  if (!slider) return;

  if (featuredData.length === 0) {
    slider.innerHTML = '<p style="text-align:center;color:var(--text-mid);padding:3rem;">No featured offers available yet.</p>';
    return;
  }

  slider.innerHTML = featuredData.map((featured, index) => {
    const highlightsHtml = renderHighlightsList(featured.highlights || [], 3, 'tour-highlight--featured');
    const description = truncateText(featured.desc, 150);

    return `
    <div class="featured-card" data-featured="${index}" ${index === 0 ? 'style="display:grid;"' : ''}>
      <div class="featured-ribbon">⭐ Best Deal</div>
      <div class="featured-img">
        <img src="${featured.img}" alt="${featured.title}" loading="lazy">
        <span class="featured-badge">${featured.badge}</span>
        <div class="featured-overlay">
          <div class="featured-quick-info">
            <div class="quick-stat">
              <span class="quick-icon">⏱</span>
              <span class="quick-text">${featured.duration || '1 Day'}</span>
            </div>
            <div class="quick-stat">
              <span class="quick-icon">👥</span>
              <span class="quick-text">${featured.minPeople || '3'}-${featured.maxPeople || '7'}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="featured-body">
        <div class="featured-header">
          <div class="tag">${featured.tag}</div>
          <div class="featured-price">
            <span class="price-label">From</span>
            <span class="price-value">${featured.price || 'On Request'}</span>
          </div>
        </div>

        <h3 class="featured-title">${featured.title}</h3>

        <p class="featured-description">${description}</p>

        <div class="featured-features">
          <div class="features-title">✨ Highlights</div>
          <div class="features-grid">
            ${highlightsHtml}
          </div>
        </div>

        <div class="featured-actions">
          <div class="action-badges">
            <span class="action-badge">
              <span class="badge-icon">☀</span>
              <span class="badge-text">${featured.season || 'All Year'}</span>
            </span>
            <span class="action-badge">
              <span class="badge-icon">📍</span>
              <span class="badge-text">Guided Tour</span>
            </span>
          </div>
          <a href="tour-detail.html" class="btn-primary featured-cta" onclick="goToTourDetail('${getSafeAttr(featured.id)}'); return false;">
            <span>Explore Now</span>
            <span class="cta-arrow">→</span>
          </a>
        </div>
      </div>
    </div>`;
  }).join('');

  initFeaturedSlider();
}

// ===== WEATHER =====
async function fetchWeather() {
  const widget = document.getElementById('weather-widget');
  if (!widget) return;

  // Using Open-Meteo (free, no key needed) for Tbilisi
  const lat = 41.6938, lon = 44.8015, city = 'Tbilisi, Georgia';
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m,windspeed_10m&timezone=Asia%2FTbilisi`;

  const weatherIcons = { 0:'Clear', 1:'Mainly clear', 2:'Partly cloudy', 3:'Overcast', 45:'Foggy', 48:'Foggy', 51:'Light drizzle', 53:'Drizzle', 55:'Heavy drizzle', 61:'Slight rain', 63:'Moderate rain', 65:'Heavy rain', 71:'Light snow', 73:'Moderate snow', 75:'Heavy snow', 80:'Light showers', 81:'Moderate showers', 82:'Heavy showers', 95:'Thunderstorm', 96:'Thunderstorm', 99:'Thunderstorm' };
  const weatherDescs = { 0:'Clear sky', 1:'Mainly clear', 2:'Partly cloudy', 3:'Overcast', 45:'Foggy', 48:'Foggy', 51:'Light drizzle', 53:'Drizzle', 55:'Heavy drizzle', 61:'Slight rain', 63:'Moderate rain', 65:'Heavy rain', 71:'Light snow', 73:'Moderate snow', 75:'Heavy snow', 80:'Light showers', 81:'Moderate showers', 82:'Heavy showers', 95:'Thunderstorm', 96:'Thunderstorm', 99:'Thunderstorm' };

  try {
    const res = await fetch(url);
    const data = await res.json();
    const cw = data.current_weather;
    const code = cw.weathercode;
    const icon = getWeatherIcon(code);
    const desc = weatherDescs[code] || 'Unknown';
    const wind = Math.round(cw.windspeed);

    widget.innerHTML = `
      <div class="weather-left">
        <h3>Current Weather</h3>
        <div class="city">${city}</div>
        <div class="weather-temp">${Math.round(cw.temperature)}C</div>
        <div class="weather-desc">${desc}</div>
        <div class="weather-details">
          <div class="weather-detail"><span>Wind: ${wind} km/h</span></div>
          <div class="weather-detail"><span>Updated live</span></div>
        </div>
      </div>
      <div class="weather-icon-large">${icon}</div>`;
  } catch {
    widget.innerHTML = `<p class="weather-error">Live weather temporarily unavailable. Tbilisi is typically warm and sunny - perfect for exploring!</p>`;
  }
}

function getWeatherIcon(code) {
  const icons = { 
    0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️', 
    45: '🌫️', 48: '🌫️', 
    51: '🌦️', 53: '🌦️', 55: '🌦️', 
    61: '🌧️', 63: '🌧️', 65: '🌧️', 
    71: '❄️', 73: '❄️', 75: '❄️', 
    80: '🌦️', 81: '🌦️', 82: '🌧️', 
    95: '⛈️', 96: '⛈️', 99: '⛈️' 
  };
  return icons[code] || '🌡️';
}

// ===== MODAL =====
function openBookModal(tourName, price, tourId) {
  // If tourId provided, save and navigate to detail page
  if (tourId) {
    goToTourDetail(tourId);
    return;
  }
  
  // Otherwise show modal on current page
  const modal = document.getElementById('book-modal');
  if (!modal) return;
  document.getElementById('modal-tour-name').textContent = tourName;
  document.getElementById('modal-tour-price').textContent = price === 'Contact Us' || price === 'On Request' ? 'Price On Request' : `From ${price} per person`;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('book-modal');
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

function initModal() {
  const backdrop = document.getElementById('book-modal');
  if (!backdrop) return;
  backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });
  const closeBtn = backdrop.querySelector('.modal-close');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

// ===== CONTACT FORM =====
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('.form-submit');
    const success = form.querySelector('.form-success');
    btn.textContent = 'Sending...';
    btn.disabled = true;
    setTimeout(() => {
      success.style.display = 'block';
      form.reset();
      btn.textContent = 'Send Message';
      btn.disabled = false;
      setTimeout(() => { success.style.display = 'none'; }, 4000);
    }, 1200);
  });
}

// ===== SCROLL ANIMATIONS =====
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.tour-card, .car-card, .post-card, .featured-card, .team-card, .car-full-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease, box-shadow 0.28s cubic-bezier(0.4,0,0.2,1)';
    observer.observe(el);
  });
}

// ===== FEATURED SLIDER =====
function initFeaturedSlider() {
  const slider = document.getElementById('featured-slider');
  const prevBtn = document.getElementById('featured-prev');
  const nextBtn = document.getElementById('featured-next');
  const dotsContainer = document.getElementById('featured-dots');
  
  if (!slider || !prevBtn || !nextBtn) return;
  
  const cards = slider.querySelectorAll('.featured-card');
  if (cards.length === 0) return;
  
  let currentIndex = 0;
  
  // Clear and create dots
  if (dotsContainer) {
    dotsContainer.innerHTML = '';
    cards.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.classList.add('slider-dot');
      if (i === 0) dot.classList.add('active');
      dot.addEventListener('click', () => goToSlide(i));
      dotsContainer.appendChild(dot);
    });
  }
  
  function updateSlider() {
    cards.forEach((card, i) => {
      card.style.display = i === currentIndex ? 'grid' : 'none';
      card.classList.toggle('active', i === currentIndex);
    });
    if (dotsContainer) {
      const dots = dotsContainer.querySelectorAll('.slider-dot');
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentIndex);
      });
    }
  }
  
  function goToSlide(index) {
    currentIndex = index;
    updateSlider();
  }
  
  function nextSlide() {
    currentIndex = (currentIndex + 1) % cards.length;
    updateSlider();
  }
  
  function prevSlide() {
    currentIndex = (currentIndex - 1 + cards.length) % cards.length;
    updateSlider();
  }
  
  prevBtn.addEventListener('click', prevSlide);
  nextBtn.addEventListener('click', nextSlide);
  
  // Initialize first slide
  updateSlider();
}

// ===== SCROLL SLIDER =====
function initScrollSlider(gridId, prevId, nextId) {
  const grid = document.getElementById(gridId);
  const prevBtn = document.getElementById(prevId);
  const nextBtn = document.getElementById(nextId);
  
  if (!grid || !prevBtn || !nextBtn) return;
  
  const scrollAmount = grid.clientWidth;
  
  // Check if arrows are needed (more than 3 items or overflow)
  const updateArrowsVisibility = () => {
    const hasOverflow = grid.scrollWidth > grid.clientWidth;
    const hasMoreThan3 = grid.children.length > 3;
    const showArrows = hasOverflow || hasMoreThan3;
    prevBtn.style.display = showArrows ? 'flex' : 'none';
    nextBtn.style.display = showArrows ? 'flex' : 'none';
  };
  
  prevBtn.addEventListener('click', () => {
    grid.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  });
  
  nextBtn.addEventListener('click', () => {
    grid.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  });
  
  // Initial check
  updateArrowsVisibility();
  
  // Update on window resize
  window.addEventListener('resize', updateArrowsVisibility);
}

// ===== LOAD ALL DATA AND INIT =====
async function loadDataAndInit() {
  // Show loading state
  const domesticGrid = document.getElementById('domestic-tours-grid');
  const internationalGrid = document.getElementById('international-tours-grid');
  const carsGrid = document.getElementById('cars-grid');
  const storiesGrid = document.getElementById('stories-grid');
  
  if (domesticGrid) domesticGrid.innerHTML = '<p style="text-align:center;color:var(--text-mid);padding:2rem;">Loading tours...</p>';
  if (internationalGrid) internationalGrid.innerHTML = '<p style="text-align:center;color:var(--text-mid);padding:2rem;">Loading tours...</p>';
  if (carsGrid) carsGrid.innerHTML = '<p style="text-align:center;color:rgba(255,255,255,0.6);padding:2rem;">Loading vehicles...</p>';
  if (storiesGrid) storiesGrid.innerHTML = '<p style="text-align:center;color:var(--text-mid);padding:2rem;">Loading stories...</p>';

  // Fetch all data from Firebase
  try {
    [toursData, carsData, postsData, featuredData, reviewsData] = await Promise.all([
      fetchToursFromFirebase(),
      fetchCarsFromFirebase(),
      fetchPostsFromFirebase(),
      fetchFeaturedFromFirebase(),
      fetchReviewsFromFirebase()
    ]);
  } catch (error) {
    console.error('Error loading data:', error);
  }

  // If no featured data from Firebase, use tours data with isFeatured flag
  if (featuredData.length === 0 && toursData.length > 0) {
    featuredData = getFeaturedToursFromData(toursData);
  }

  // Render everything
  renderDomesticTours();
  renderInternationalTours();
  renderCars('cars-grid');
  renderPosts('stories-grid', 6);
  renderReviews();
  renderFeaturedSlider();
  
  initTourTabs();
  syncSaveButtons();
  fetchWeather();
  initModal();
  initContactForm();

  // Initialize sliders
  initScrollSlider('domestic-tours-grid', 'domestic-prev', 'domestic-next');
  initScrollSlider('international-tours-grid', 'international-prev', 'international-next');
  initScrollSlider('cars-grid', 'cars-prev', 'cars-next');

  // Cars page full list
  const carsStack = document.getElementById('cars-stack');
  if (carsStack) {
    carsStack.innerHTML = carsData.length > 0 ? carsData.map(renderCarFullCard).join('') : '<p style="text-align:center;color:var(--text-mid);padding:3rem;">No vehicles available yet.</p>';
  }

  // Tours page full list
  const toursPageGrid = document.getElementById('tours-page-grid');
  if (toursPageGrid) {
    toursPageGrid.innerHTML = toursData.length > 0 ? toursData.map(renderTourCard).join('') : '<p style="text-align:center;color:var(--text-mid);">No tours available yet.</p>';
    initTourTabsPage();
  }

  // Posts page
  renderPosts('posts-page-grid');

  setTimeout(initScrollAnimations, 100);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  // ავტორიზაციის სტატუსის მოსმენა
  onAuthStateChanged(auth, (user) => {
    // ყოველთვის გავუშვათ sync, რომ თუ გამოვიდა სისტემიდან, გულები გათეთრდეს
    syncSaveButtons();
  });
  loadDataAndInit();
});

function initTourTabsPage() {
  const btns = document.querySelectorAll('.tab-btn[data-page-filter]');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.pageFilter;
      const grid = document.getElementById('tours-page-grid');
      const filtered = filter === 'all' ? toursData : toursData.filter(t => t.category === filter);
      grid.innerHTML = filtered.length > 0 ? filtered.map(renderTourCard).join('') : '<p style="text-align:center;color:var(--text-mid);">No tours in this category yet.</p>';
      syncSaveButtons();
      setTimeout(initScrollAnimations, 50);
    });
  });
}

// Make functions globally available
window.openBookModal = openBookModal;
window.closeModal = closeModal;
