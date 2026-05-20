// ===== DATA (loaded from Firebase) =====
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
  orderBy,
  where
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
    throw error; // შეცდომის შემთხვევაში ვაგდებთ Error-ს, რომ ქეში არ გადაეწეროს
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
    throw error;
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
    throw error;
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
    throw error;
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
    throw error;
  }
}

// ===== i18n HELPERS =====
// Localize a multi-lingual value ({ ka, en, ru, ... }) or pass through plain string.
function L(val, fallback = '') {
  if (window.localize) return window.localize(val, fallback);
  if (val == null) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'object') return val.ka || val.en || fallback;
  return String(val);
}
// Localize an array field that might be { ka:[], en:[], ... } or a plain array.
function LA(val) {
  if (window.localizeArray) return window.localizeArray(val);
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'object') return Array.isArray(val.ka) ? val.ka : (Array.isArray(val.en) ? val.en : []);
  return [];
}
// Translate a common English duration / season string via window.t() when the
// value is stored as a plain English literal in Firestore (e.g. "1 Day",
// "5 Days", "All Year", "Flexible"). Leaves Georgian/other-language strings
// untouched so a tour authored in Georgian still renders correctly.
function translateCommonValue(str) {
  if (!str || typeof str !== 'string') return str;
  const t = window.t;
  if (!t) return str;
  const s = str.trim();
  // Simple fixed values
  const map = {
    'All Year': 'all_year',
    'Flexible': 'flexible',
    '1 Day': 'one_day',
    'One Day': 'one_day',
    'On Request': 'on_request',
    'Sedan': 'type_sedan',
    'SUV': 'type_suv',
    'Minivan': 'type_minivan',
    'Van': 'type_van',
    'Jeep': 'type_jeep',
    'Culture': 'cat_culture',
    'Food': 'cat_food',
    'Adventure': 'cat_adventure',
    'Travel Tips': 'cat_travel_tips',
    'Wine': 'cat_wine',
    'School Tours': 'cat_school_tours',
    'Automatic': 'automatic',
    'ავტომატური': 'automatic',
    'Manual': 'manual',
    'მექანიკური': 'manual',
    'Petrol': 'petrol',
    'ბენზინი': 'petrol',
    'Diesel': 'diesel',
    'დიზელი': 'diesel',
    'Hybrid': 'hybrid',
    'ჰიბრიდი': 'hybrid',
    'Black': 'black',
    'შავი': 'black',
    'White': 'white',
    'თეთრი': 'white',
    'Silver': 'silver',
    'ვერცხლისფერი': 'silver',
    'წითელი': 'red',
    'Red': 'red',
    'ლურჯი': 'blue',
    'Blue': 'blue',
    'Grey': 'grey',
    'ნაცრისფერი': 'grey'
  };
  if (map[s]) return t(map[s]);
  // "N Days" / "N Day" pattern
  const mDays = s.match(/^(\d+)\s*[Dd]ays?$/);
  if (mDays) return t('n_days', { n: mDays[1] });
  // Ranged "N–M Days" / "N-M Days"
  const mRange = s.match(/^(\d+)\s*[–-]\s*(\d+)\s*[Dd]ays?$/);
  if (mRange) return t('n_days', { n: `${mRange[1]}–${mRange[2]}` });
  return s;
}
// Localize (multilingual obj) + common-value translate (plain English).
function Lt(val, fallbackKey) {
  const localized = L(val, '');
  if (localized) return translateCommonValue(localized);
  if (fallbackKey && window.t) return window.t(fallbackKey);
  return localized;
}

// ===== GET FEATURED TOURS FROM TOURS DATA =====
function getFeaturedToursFromData(tours) {
  // Filter tours that have isFeatured = true
  const featured = tours.filter(tour => tour.isFeatured === true);
  const tFn = (k) => (window.t ? window.t(k) : k);

  // Transform tour data to featured card format (keep multilingual fields as-is)
  return featured.map(tour => ({
    id: tour.id,
    title: tour.title,
    img: tour.img,
    desc: tour.desc,
    minPeople: tour.minPeople,
    maxPeople: tour.maxPeople,
    highlights: tour.highlights,
    // store the category key so we can re-translate on language change
    categoryKey: tour.category,
    tag: tour.category === 'one-day' ? tFn('tag_one_day') :
         tour.category === 'multi-day' ? tFn('tag_multi_day') :
         tour.category === 'upcoming' ? tFn('tag_upcoming') : tFn('tag_flexible'),
    typeKey: tour.type,
    badge: tour.type === 'domestic' ? tFn('badge_domestic') : tFn('badge_international'),
    duration: tour.duration,
    season: tour.season,
    price: tour.price,
    meta: [
      tour.price,
      Lt(tour.duration, 'flexible'),
      Array.isArray(tour.season) ? tour.season.map(translateCommonValue).join(', ')
        : (tour.season ? translateCommonValue(L(tour.season)) : tFn('all_year'))
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
  const meta = LA(featured.meta);
  const tFn = (k) => (window.t ? window.t(k) : k);
  const metaItems = [
    { icon: '💳', label: tFn('label_price'),    value: window.PriceDisplay ? window.PriceDisplay.renderPriceMarkup(featured, { includeLabel: false }) : (meta[0] || tFn('on_request')) },
    { icon: '⏱', label: tFn('label_duration'), value: meta[1] || tFn('flexible') },
    { icon: '☀', label: tFn('label_season'),   value: meta[2] || tFn('all_year') },
    { icon: '👥', label: tFn('label_min'),      value: `${featured.minPeople || 1}` },
    { icon: '👥', label: tFn('label_max'),      value: `${featured.maxPeople || 10}` }
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
  // Each tour gets its own unique URL (?id=...) so it's shareable and
  // survives language reloads without getting mixed up with other tours.
  window.location.href = `tour-detail.html?id=${encodeURIComponent(tourId)}`;
}

function goToCarDetail(carId) {
  const car = carsData.find(item => item.id === carId);
  if (car) {
    sessionStorage.setItem('selectedCarId', car.id);
    sessionStorage.setItem('selectedCarData', JSON.stringify(car));
  } else {
    sessionStorage.setItem('selectedCarId', carId);
  }
  // Each car has a unique, shareable URL (?id=...).
  window.location.href = `cars-detail.html?id=${encodeURIComponent(carId)}`;
}

function goToPostDetail(postId) {
  const post = postsData.find(item => item.id === postId);
  if (post) {
    sessionStorage.setItem('selectedPostId', post.id);
    sessionStorage.setItem('selectedPostData', JSON.stringify(post));
  } else {
    sessionStorage.setItem('selectedPostId', postId);
  }
  window.location.href = `posts-detail.html?id=${encodeURIComponent(postId)}`;
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
    const statEl = document.getElementById('stat-saved'); if (statEl) statEl.textContent = '0';
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
    // Update saved counter if present
    const statEl = document.getElementById('stat-saved');
    if (statEl) statEl.textContent = String(savedIds.length);
  } catch (e) {
    console.error("Sync error:", e);
  }
}

// Update bookings count for the current user
async function updateBookingCount(userId) {
  if (!userId) return;
  try {
    const tourQ = query(collection(db, 'tourBookings'), where('userId', '==', userId));
    const carQ = query(collection(db, 'carBookings'), where('userId', '==', userId));
    const [tourSnap, carSnap] = await Promise.all([getDocs(tourQ), getDocs(carQ)]);
    const total = (tourSnap?.size || 0) + (carSnap?.size || 0);
    const el = document.getElementById('stat-booked'); if (el) el.textContent = String(total);
  } catch (e) {
    console.error('Failed to update booking count:', e);
  }
}

// Update reviews count for the current user — tries userId then email
async function updateReviewCount(user) {
  if (!user) return;
  try {
    const uid = user.uid;
    const email = user.email;
    let count = 0;
    // Try fields commonly used for authors
    const q1 = query(collection(db, 'reviews'), where('userId', '==', uid));
    const snap1 = await getDocs(q1);
    count = snap1.size;
    if (count === 0 && email) {
      const q2 = query(collection(db, 'reviews'), where('email', '==', email));
      const snap2 = await getDocs(q2);
      count = snap2.size;
    }
    const el = document.getElementById('stat-reviews'); if (el) el.textContent = String(count);
  } catch (e) {
    console.error('Failed to update review count:', e);
  }
}

// Listen for events dispatched when data changes elsewhere in the app
window.addEventListener('savedToursChanged', (e) => {
  const userId = e?.detail?.userId || (auth && auth.currentUser && auth.currentUser.uid);
  if (userId) syncSaveButtons();
});
window.addEventListener('bookingsChanged', (e) => {
  const userId = e?.detail?.userId || (auth && auth.currentUser && auth.currentUser.uid);
  if (userId) updateBookingCount(userId);
});
window.addEventListener('reviewsChanged', (e) => {
  const user = (auth && auth.currentUser) || (e && e.detail && e.detail.user);
  if (user) updateReviewCount(user);
});


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
      // Notify other modules
      if (typeof window.syncSaveButtons === 'function') window.syncSaveButtons();
      if (auth.currentUser) window.dispatchEvent(new CustomEvent('savedToursChanged', { detail: { userId: auth.currentUser.uid } }));
    } else {
      await setDoc(saveRef, { savedAt: new Date().toISOString() });
      showToast('Tour saved successfully!', 'success');
      document.querySelectorAll(`[data-save-id="${tourId}"]`).forEach(btn => btn.classList.add('active'));
      // Notify other modules
      if (typeof window.syncSaveButtons === 'function') window.syncSaveButtons();
      if (auth.currentUser) window.dispatchEvent(new CustomEvent('savedToursChanged', { detail: { userId: auth.currentUser.uid } }));
    }
  } catch (error) {
    console.error("Error toggling save:", error);
    showToast("Permission denied or database error", "error");
  }
}

/**
 * ტურის გაზიარება
 * @param {string} id - ტურის ID
 * @param {string} title - ტურის სათაური
 * @param {Event} event - კლიკის ივენთი
 */
function shareTour(id, title, event) {
  if (event) event.stopPropagation();
  const url = `${window.location.origin}/tour-detail.html?id=${encodeURIComponent(id)}`;
  
  if (navigator.share) {
    navigator.share({ title: title, url: url }).catch(() => {});
  } else {
    navigator.clipboard.writeText(url).then(() => {
      showToast("Link copied! Share it on WhatsApp, Telegram or Facebook.", "info");
    });
  }
}

// ფუნქციების გლობალურად გატანა
window.toggleSaveTour = toggleSaveTour;
window.syncSaveButtons = syncSaveButtons;
window.showToast = showToast;
window.goToTourDetail = goToTourDetail;
window.goToCarDetail = goToCarDetail;
window.goToPostDetail = goToPostDetail;
window.shareTour = shareTour;
window.translateCommonValue = translateCommonValue;

// renderTourCard ფუნქციის ქვემოთ განსაზღვრა (Hoisting-ისთვის)

// ===== NAVBAR =====
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');

  // Throttled scroll handler via rAF for smooth mobile performance
  let _scrollTick = false;
  window.addEventListener('scroll', () => {
    if (_scrollTick) return;
    _scrollTick = true;
    requestAnimationFrame(() => {
      navbar.classList.toggle('scrolled', window.scrollY > 40);
      _scrollTick = false;
    });
  }, { passive: true });

  // Helper: close mobile menu
  function closeMobileMenu() {
    if (toggle && links) {
      toggle.classList.remove('open');
      links.classList.remove('open');
    }
  }

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      links.classList.toggle('open');
    });

    // Close mobile menu when any nav link is clicked
    links.querySelectorAll('a[href]').forEach(a => {
      a.addEventListener('click', () => {
        if (window.innerWidth <= 768) closeMobileMenu();
      });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && links.classList.contains('open')) {
        if (!navbar.contains(e.target) && !links.contains(e.target) && !toggle.contains(e.target)) {
          closeMobileMenu();
        }
      }
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
  const t = (k) => (window.t ? window.t(k) : k);
  let badgeClass = 'badge-oneday';
  let badgeText = t('badge_one_day');
  
  if (tour.category === 'multi-day' || tour.category === 'full') {
    badgeClass = 'badge-full';
    badgeText = t('badge_multi_day');
  } else if (tour.category === 'flexible') {
    badgeClass = 'badge-full';
    badgeText = t('badge_flexible');
  } else if (tour.category === 'upcoming') {
    badgeClass = 'badge-full';
    badgeText = t('badge_upcoming');
  }
  // Localize fields
  const title = L(tour.title);
  const desc = L(tour.desc);
  const description = desc.length > 200 ? desc.substring(0, 200) + '...' : desc;
  const batumiClass = tour.isBatumi ? 'tour-card--batumi' : '';

  return `
    <div class="tour-card ${batumiClass}" data-category="${tour.category}">
      <div class="tour-card-img">
        <img src="${tour.img}" alt="${title}" loading="lazy">
        <span class="tour-card-badge ${badgeClass}">${tour.isBatumi ? '🌊 ' + badgeText : badgeText}</span>
        <button class="save-tour-btn" data-save-id="${getSafeAttr(tour.id)}" onclick="toggleSaveTour('${getSafeAttr(tour.id)}', event)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
        </button>
        <button class="share-tour-btn" onclick="shareTour('${getSafeAttr(tour.id)}', '${title.replace(/'/g, "\\'")}', event)" style="position:absolute; top:12px; right:54px; width:32px; height:32px; border-radius:50%; border:none; background:rgba(255,255,255,0.9); display:flex; align-items:center; justify-content:center; cursor:pointer; color:var(--dark-blue); z-index:5;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px; height:16px;"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
        </button>
      </div>
      <div class="tour-card-body">
        <h3 class="tour-card-title">${title}</h3>
        <p class="tour-card-desc">${description}</p>
        <div class="tour-card-footer">
          <div class="tour-price-container">${window.PriceDisplay ? window.PriceDisplay.renderPriceMarkup(tour) : `${tour.price} <span class="separator">/</span> <span>${(window.t?window.t('per_person'):'per person')}</span>`}</div>
          <button class="btn-sm" onclick="goToTourDetail('${getSafeAttr(tour.id)}')">${(window.t?window.t('book_now'):'Book Now')}</button>
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
  const tEmpty2 = (k) => (window.t ? window.t(k) : k);
  grid.innerHTML = filtered.length > 0 ? filtered.map(renderTourCard).join('') : `<p style="text-align:center;color:var(--text-mid);grid-column:1/-1;">${tEmpty2('empty_tours')}</p>`;
  syncSaveButtons();
}

function renderDomesticTours() {
  const grid = document.getElementById('domestic-tours-grid');
  if (!grid) return;
  const tFn = (k) => (window.t ? window.t(k) : k);
  const domesticTours = toursData.filter(tour => (tour.type || tour.tourType) === 'domestic');
  grid.innerHTML = domesticTours.length > 0 ? domesticTours.map(renderTourCard).join('') : `<p style="text-align:center;color:var(--text-mid);">${tFn('empty_domestic')}</p>`;
  syncSaveButtons();
}

function renderInternationalTours() {
  const grid = document.getElementById('international-tours-grid');
  if (!grid) return;
  const tFn = (k) => (window.t ? window.t(k) : k);
  const internationalTours = toursData.filter(tour => (tour.type || tour.tourType) === 'international');
  grid.innerHTML = internationalTours.length > 0 ? internationalTours.map(renderTourCard).join('') : `<p style="text-align:center;color:var(--text-mid);">${tFn('empty_international')}</p>`;
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
  const title = L(car.title);
  const info = L(car.info || car.desc);
  const t = (k) => (window.t ? window.t(k) : k);

  return `
    <div class="car-card">
      <div class="car-card-img">
        <img src="${car.img}" alt="${title}" loading="lazy">
        <span class="car-type-badge" style="position:absolute; top:12px; left:12px; margin:0;">${translateCommonValue(car.type)}</span>
      </div>
      <div class="car-card-body">
        <h3 class="car-card-title">${title}</h3>
        <p class="car-card-info">${truncateText(info, 110)}</p>
        <div class="car-card-footer">
          <div class="car-price">
            ${window.PriceDisplay ? window.PriceDisplay.renderPriceMarkup(car, { includeLabel: false }) : (car.price || t('on_request'))}
          </div>
          <button class="btn-sm" onclick="goToCarDetail('${getSafeAttr(car.id)}')">
            ${t('view_details')}
          </button>
        </div>
      </div>
    </div>`;
}

function renderCars(containerId = 'cars-grid') {
  const grid = document.getElementById(containerId);
  if (!grid) return;
  const tFn = (k) => (window.t ? window.t(k) : k);
  grid.innerHTML = carsData.length > 0 ? carsData.map(renderCarCard).join('') : `<p style="text-align:center;color:rgba(255,255,255,0.6);">${tFn('empty_cars')}</p>`;
}

// ===== CAR FULL CARDS (cars page) =====
function renderCarFullCard(car) {
  const title = L(car.title);
  const info = L(car.info || car.desc);
  return `
    <article class="tour-card tour-card--standard car-full-card" data-id="${car.id}">
      <div class="tour-card__img-wrap">
        <img src="${car.img}" alt="${title}" loading="lazy" class="tour-card__img">
        <div class="tour-card__overlay"></div>
        <span class="tour-badge tour-badge--duration">${translateCommonValue(car.type)}</span>
      </div>
      <div class="tour-card__body">
        <h3 class="tour-card__title">${title}</h3>
        <p class="tour-card__desc">${info} Whether you need airport transfers, city tours, or multi-day mountain excursions, we ensure comfort and safety throughout.</p>
        <ul class="tour-highlights">
          <li class="tour-highlight"><span class="highlight-dot"></span>${car.seats || 'Comfortable seating'}</li>
          <li class="tour-highlight"><span class="highlight-dot"></span>Fuel: ${Lt(car.fuel, 'fuel')}</li>
          <li class="tour-highlight"><span class="highlight-dot"></span>Transmission: ${Lt(car.transmission, 'transmission')}</li>
          <li class="tour-highlight"><span class="highlight-dot"></span>Color: ${Lt(car.color, 'color')}</li>
        </ul>
        <div class="tour-card__footer">
          <div class="tour-card__meta">
            <span class="tour-meta-item">Driver included</span>
          </div>
          <div class="tour-card__price-block">
            ${window.PriceDisplay ? window.PriceDisplay.renderPriceMarkup(car, { defaultLabel: (window.t?window.t('per_day'):'per day') }) : `<span class="tour-price">${car.price || (window.t?window.t('on_request'):'On Request')}</span><span class="tour-price-label">${(window.t?window.t('per_day'):'per day')}</span>`}
          </div>
        </div>
        <button class="btn-book" onclick="openBookModal('${getSafeAttr(title)} Transfer','On Request')">
          ${(window.t?window.t('book_car'):'Book This Vehicle')} <span class="btn-arrow">-></span>
        </button>
      </div>
    </article>`;
}

// ===== POST CARDS =====
function renderPostCard(post) {
  const title = L(post.title);
  const text = truncateText(L(post.text || post.content), 120);
  const category = translateCommonValue(post.category);
  const postId = getSafeAttr(post.id);

  return `
    <article class="post-card" role="button" tabindex="0" onclick="goToPostDetail('${postId}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();goToPostDetail('${postId}');}">
      <div class="post-card-img">
        <img src="${post.img}" alt="${title}" loading="lazy">
        <span class="post-category">${category}</span>
      </div>
      <div class="post-card-body">
        <div class="post-meta">
          <span>${post.date || ''}</span>
        </div>
        <h3 class="post-card-title">${title}</h3>
        <p class="post-card-text">${text}</p>
        <a href="posts-detail.html?id=${encodeURIComponent(post.id || '')}" class="post-read-more" onclick="event.stopPropagation();goToPostDetail('${postId}');return false;">${(window.t?window.t('read_more'):'Read More')} -></a>
      </div>
    </article>`;
}

function renderPosts(containerId = 'posts-grid', count = null) {
  const grid = document.getElementById(containerId);
  if (!grid) return;
  const tFn = (k) => (window.t ? window.t(k) : k);
  const data = count ? postsData.slice(0, count) : postsData;
  grid.innerHTML = data.length > 0 ? data.map(renderPostCard).join('') : `<p style="text-align:center;color:var(--text-mid);grid-column:1/-1;">${tFn('empty_posts')}</p>`;
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

  const tFn = (k) => (window.t ? window.t(k) : k);

  if (featuredData.length === 0) {
    slider.innerHTML = `<p style="text-align:center;color:var(--text-mid);padding:3rem;">${tFn('empty_featured')}</p>`;
    return;
  }

  slider.innerHTML = featuredData.map((featured, index) => {
    const title = L(featured.title);
    // Always re-translate the category tag so it follows the current language.
    // Supports both the shaped object from getFeaturedToursFromData() (categoryKey)
    // and raw Firestore docs (featured.category).
    const catKey = featured.categoryKey || featured.category;
    const tag = catKey === 'one-day' ? tFn('tag_one_day')
              : catKey === 'multi-day' ? tFn('tag_multi_day')
              : catKey === 'upcoming' ? tFn('tag_upcoming')
              : catKey ? tFn('tag_flexible')
              : L(featured.tag);
    const highlightsHtml = renderHighlightsList(LA(featured.highlights), 3, 'tour-highlight--featured');
    const description = truncateText(L(featured.desc), 150);
    const typeKey = featured.typeKey || featured.type;
    const badgeText = typeKey === 'domestic' ? tFn('badge_domestic')
                    : typeKey === 'international' ? tFn('badge_international')
                    : (featured.badge || '');
    // Season may be: multilingual object, array, or plain English string like "All Year".
    let seasonText;
    if (Array.isArray(featured.season)) {
      seasonText = featured.season.map(translateCommonValue).join(', ');
    } else if (featured.season && typeof featured.season === 'object') {
      seasonText = translateCommonValue(L(featured.season)) || tFn('all_year');
    } else {
      seasonText = featured.season ? translateCommonValue(featured.season) : tFn('all_year');
    }
    const duration = Lt(featured.duration, 'one_day');

    return `
    <div class="featured-card" data-featured="${index}" ${index === 0 ? 'style="display:grid;"' : ''}>
      <div class="featured-ribbon">${tFn('best_deal')}</div>
      <div class="featured-img">
        <img src="${featured.img}" alt="${title}" loading="lazy">
        <span class="featured-badge">${badgeText}</span>
        <div class="featured-overlay">
          <div class="featured-quick-info">
            <div class="quick-stat">
              <span class="quick-icon">⏱</span>
              <span class="quick-text">${duration}</span>
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
          <div class="tag">${tag}</div>
          <div class="featured-price">
            <span class="price-label">${tFn('from_price')}</span>
            <span class="price-value">${featured.price || tFn('on_request')}</span>
          </div>
        </div>

        <h3 class="featured-title">${title}</h3>

        <p class="featured-description">${description}</p>

        <div class="featured-features">
          <div class="features-title">${tFn('highlights_title')}</div>
          <div class="features-grid">
            ${highlightsHtml}
          </div>
        </div>

        <div class="featured-actions">
          <div class="action-badges">
            <span class="action-badge">
              <span class="badge-icon">☀</span>
              <span class="badge-text">${seasonText}</span>
            </span>
            <span class="action-badge">
              <span class="badge-icon">📍</span>
              <span class="badge-text">${tFn('guided_tour')}</span>
            </span>
          </div>
          <a href="tour-detail.html?id=${encodeURIComponent(featured.id || '')}" class="btn-primary featured-cta" onclick="goToTourDetail('${getSafeAttr(featured.id)}'); return false;">
            <span>${tFn('explore_now')}</span>
            <span class="cta-arrow">→</span>
          </a>
        </div>
      </div>
    </div>`;
  }).join('');

  initFeaturedSlider();
}

// ===== BATUMI SLIDER =====
function renderBatumiSlider() {
  const slider = document.getElementById('batumi-slider');
  if (!slider) return;

  const tFn = (k) => (window.t ? window.t(k) : k);
  const batumiTours = toursData.filter(t => t.isBatumi === true);

  if (batumiTours.length === 0) {
    slider.innerHTML = `<p style="text-align:center;color:var(--text-mid);padding:3rem;">${tFn('empty_tours')}</p>`;
    const section = document.querySelector('.batumi-tours-section');
    if (section) section.style.display = 'none';
    return;
  } else {
    const section = document.querySelector('.batumi-tours-section');
    if (section) section.style.display = 'block';
  }

  const slides = [];
  for (let i = 0; i < batumiTours.length; i += 2) {
    const pair = batumiTours.slice(i, i + 2);
    const cardsHtml = pair.map((tour, index) => {
      const title = L(tour.title);
      const description = truncateText(L(tour.desc), 120);
      return `
        <div class="batumi-card">
          <div class="batumi-img">
            <img src="${tour.img}" alt="${title}" loading="lazy">
            <span class="batumi-badge">${tFn('batumi_badge')}</span>
          </div>
          <div class="batumi-body">
            <h3 class="batumi-title">${title}</h3>
            <p class="batumi-desc">${description}</p>
            <div class="batumi-info">
              ${tour.days ? `<div class="batumi-info-item"><span>🕒</span><strong>${tFn('n_days').replace('{n}', tour.days)}</strong></div>` : ''}
              ${tour.nights ? `<div class="batumi-info-item"><span>🌙</span><strong>${tFn('n_nights').replace('{n}', tour.nights)}</strong></div>` : ''}
              <div class="batumi-info-item"><span>👥</span><strong>${tFn('n_people_count').replace('{n}', tour.minPeople || '1')}</strong></div>
            </div>
            <div class="batumi-footer">
              <div>
                <div class="batumi-price-label">${tFn('from_price')}</div>
                <div class="batumi-price-value">${tour.price || tFn('on_request')}</div>
              </div>
              <a href="tour-detail.html?id=${encodeURIComponent(tour.id || '')}" class="batumi-cta" onclick="goToTourDetail('${getSafeAttr(tour.id)}'); return false;">
                ${tFn('explore_now')} →
              </a>
            </div>
          </div>
        </div>`;
    }).join('');

    slides.push(`<div class="batumi-slide">${cardsHtml}</div>`);
  }

  slider.innerHTML = slides.join('');

  initBatumiSlider();
}

function renderMapOverlay() {
  const overlay = document.getElementById('map-overlay-info');
  if (!overlay) return;

  const tFn = (k) => (window.t ? window.t(k) : k);

  // Filter featured domestic tours
  const domesticFeatured = toursData.filter(t => (t.type || t.tourType) === 'domestic' && t.isFeatured === true);

  if (domesticFeatured.length === 0) {
    overlay.innerHTML = `<h3>${tFn('our_destinations') || 'Our Destinations'}</h3><p>No featured domestic tours available.</p>`;
    return;
  }

  overlay.innerHTML = `
    <h3>${tFn('featured_destinations') || 'Featured Destinations'}</h3>
    ${domesticFeatured.map(featured => {
      const title = L(featured.title);
      return `<div class="map-location"><div class="map-dot"></div><a href="tour-detail.html?id=${encodeURIComponent(featured.id || '')}" class="map-link" onclick="goToTourDetail('${getSafeAttr(featured.id)}'); return false;">${title}</a></div>`;
    }).join('')}
  `;
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
  const tFn = window.t || ((k) => k);
  document.getElementById('modal-tour-price').textContent = price === 'Contact Us' || price === 'On Request'
    ? tFn('price_on_request')
    : `${tFn('from_price')} ${price} ${tFn('per_person')}`;
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
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('.form-submit');
    const success = form.querySelector('.form-success');
    btn.textContent = 'Sending...';
    btn.disabled = true;
    try {
      const mod = await import('./firebase-config.js');
      if (mod && typeof mod.addContactMessage === 'function') {
        await mod.addContactMessage({
          name: (document.getElementById('name')?.value || '').trim(),
          email: (document.getElementById('email')?.value || '').trim(),
          phone: (document.getElementById('phone')?.value || '').trim(),
          message: (document.getElementById('message')?.value || '').trim(),
          sourcePage: 'contact',
          status: 'new'
        });
      }
    } catch (err) {
      console.error('Failed to save contact message:', err);
    }
    setTimeout(() => {
      success.style.display = 'block';
      form.reset();
      btn.textContent = 'Send Message';
      btn.disabled = false;
      setTimeout(() => { success.style.display = 'none'; }, 4000);
    }, 1200);
  });
}

function initNewsletterForms() {
  const subscribeButtons = Array.from(document.querySelectorAll('button.btn-primary')).filter((btn) => {
    return /subscribe/i.test((btn.textContent || '').trim());
  });
  subscribeButtons.forEach((btn) => {
    if (btn.dataset.newsletterBound === '1') return;
    const wrapper = btn.parentElement;
    const emailInput = wrapper ? wrapper.querySelector('input[type="email"]') : null;
    if (!emailInput) return;
    btn.dataset.newsletterBound = '1';
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = (emailInput.value || '').trim();
      if (!email) {
        if (window.showToast) window.showToast('Please enter email first', 'error');
        return;
      }
      const original = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Subscribing...';
      try {
        const mod = await import('./firebase-config.js');
        if (mod && typeof mod.addSubscriber === 'function') {
          await mod.addSubscriber({
            email,
            sourcePage: window.location.pathname.split('/').pop() || 'unknown',
            status: 'active'
          });
        }
        emailInput.value = '';
        if (window.showToast) window.showToast('Subscribed successfully!', 'success');
      } catch (err) {
        console.error('Failed to save subscriber:', err);
        if (window.showToast) window.showToast('Failed to subscribe. Try again.', 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = original;
      }
    });
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

// ===== BATUMI SLIDER INIT =====
function initBatumiSlider() {
  const slider = document.getElementById('batumi-slider');
  const dotsContainer = document.getElementById('batumi-dots');
  
  if (!slider) return;
  
  const slides = slider.querySelectorAll('.batumi-slide');
  if (slides.length === 0) return;
  
  let currentIndex = 0;
  let autoplay = null;
  
  if (dotsContainer) {
    dotsContainer.innerHTML = '';
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.classList.add('slider-dot');
      if (i === 0) dot.classList.add('active');
      dot.addEventListener('click', () => goToSlide(i));
      dotsContainer.appendChild(dot);
    });
  }
  
  function updateSlider() {
    slides.forEach((slide, i) => {
      slide.style.display = i === currentIndex ? 'grid' : 'none';
      slide.classList.toggle('active', i === currentIndex);
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
    currentIndex = (currentIndex + 1) % slides.length;
    updateSlider();
  }
  
  function startAutoplay() {
    stopAutoplay();
    autoplay = setInterval(nextSlide, 7000);
  }
  
  function stopAutoplay() {
    if (autoplay) {
      clearInterval(autoplay);
      autoplay = null;
    }
  }
  
  slider.addEventListener('mouseenter', stopAutoplay);
  slider.addEventListener('mouseleave', startAutoplay);
  
  updateSlider();
  startAutoplay();
}

// ===== SCROLL SLIDER =====
function initScrollSlider(gridId, prevId, nextId) {
  const grid = document.getElementById(gridId);
  const prevBtn = document.getElementById(prevId);
  const nextBtn = document.getElementById(nextId);
  
  if (!grid || !prevBtn || !nextBtn) return;
  
  // გამოვთვალოთ ზუსტი მანძილი (ერთი ბარათის სიგანე + gap)
  // ეს აგვარებს მობილურზე ბარათების გადახტომის პრობლემას
  const getScrollStep = () => {
    const item = grid.firstElementChild;
    if (item && item.classList.contains('gt-card-loader')) return grid.clientWidth;
    if (item) {
      const gap = parseInt(window.getComputedStyle(grid).gap) || 0;
      return item.offsetWidth + gap;
    }
    return grid.clientWidth;
  };
  
  // Check if arrows are needed (more than 3 items or overflow)
  const updateArrowsVisibility = () => {
    const hasOverflow = grid.scrollWidth > grid.clientWidth;
    const hasMoreThan3 = grid.children.length > 3;
    const showArrows = hasOverflow || hasMoreThan3;
    prevBtn.style.display = showArrows ? 'flex' : 'none';
    nextBtn.style.display = showArrows ? 'flex' : 'none';
  };
  
  prevBtn.addEventListener('click', () => {
    grid.scrollBy({ left: -getScrollStep(), behavior: 'smooth' });
  });
  
  nextBtn.addEventListener('click', () => {
    grid.scrollBy({ left: getScrollStep(), behavior: 'smooth' });
  });
  
  // Initial check
  updateArrowsVisibility();
  
  // Update on window resize
  window.addEventListener('resize', updateArrowsVisibility);
}

// ===== DATA CACHE (localStorage) =====
// Cache-first strategy: on every page load, we immediately render any
// previously-seen cards from localStorage (0-ms paint) while we fetch
// fresh data from Firebase in the background. Once fresh data arrives
// we overwrite the cache and re-render only the content grids — init
// (navbar, modals, weather, etc.) runs exactly once.
const DATA_CACHE_KEY = 'gt_data_cache_v1';
const DATA_CACHE_MAX_AGE = Infinity; // Never expire — stale data is always better than an empty screen

function readDataCache() {
  try {
    const raw = localStorage.getItem(DATA_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    // Cache never expires — background fetch silently replaces stale data
    return parsed;
  } catch (e) { return null; }
}

function writeDataCache(payload) {
  try {
    localStorage.setItem(DATA_CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      tours: payload.tours || [],
      cars: payload.cars || [],
      posts: payload.posts || [],
      featured: payload.featured || [],
      reviews: payload.reviews || []
    }));
  } catch (e) { /* quota — ignore */ }
}

// Renders every content grid using the current in-memory data arrays.
// Called once on cache hydrate (instant) and once on fresh fetch.
function renderAllContent() {
  // If no featured data, derive from tours flagged isFeatured.
  if ((!featuredData || featuredData.length === 0) && toursData && toursData.length > 0) {
    featuredData = getFeaturedToursFromData(toursData);
  }

  try { renderDomesticTours(); } catch (e) {}
  try { renderInternationalTours(); } catch (e) {}
  try { renderCars('cars-grid'); } catch (e) {}
  try { renderPosts('stories-grid', 6); } catch (e) {}
  try { renderReviews(); } catch (e) {}
  try { renderFeaturedSlider(); } catch (e) {}
  try { renderBatumiSlider(); } catch (e) {}
  try { renderMapOverlay(); } catch (e) {}

  const tEmpty = (k) => (window.t ? window.t(k) : k);

  // Cars page full list
  const carsStack = document.getElementById('cars-stack');
  if (carsStack) {
    carsStack.innerHTML = carsData.length > 0
      ? carsData.map(renderCarFullCard).join('')
      : `<p style="text-align:center;color:var(--text-mid);padding:3rem;">${tEmpty('empty_cars')}</p>`;
  }

  // Tours page full list
  const toursPageGrid = document.getElementById('tours-page-grid');
  if (toursPageGrid) {
    toursPageGrid.innerHTML = toursData.length > 0
      ? toursData.map(renderTourCard).join('')
      : `<p style="text-align:center;color:var(--text-mid);">${tEmpty('empty_tours')}</p>`;
  }

  // Posts page
  try { renderPosts('posts-page-grid'); } catch (e) {}

  syncSaveButtons();
}

// ===== INDEX-PAGE CONTENT WATCHDOG =====
// Cold-load safety net: if cards haven't rendered on the homepage within
// ~1 s, keep retrying the Firebase fetch until at least one grid is
// populated with real cards. Stops immediately once cards appear.
let _idxWatchdog = null;
let _idxWatchdogBusy = false;
let _idxWatchdogAttempts = 0;
const IDX_WATCHDOG_MAX_ATTEMPTS = 10; // ~10 s hard cap for slow connections
const IDX_WATCHDOG_INTERVAL_MS = 1000;

function stopIndexWatchdog() {
  if (_idxWatchdog) { clearTimeout(_idxWatchdog); _idxWatchdog = null; }
}

function indexContentVisible() {
  const ids = ['domestic-tours-grid', 'international-tours-grid', 'cars-grid', 'stories-grid'];
  // Require at least one grid that exists on this page to have real cards.
  let foundAny = false;
  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) continue;
    foundAny = true;
    if (el.querySelector('.tour-card, .car-card, .post-card, .story-card, .featured-card')) return true;
  }
  // If none of the grids exist on this page, don't block.
  return !foundAny;
}

function scheduleIndexWatchdog() {
  stopIndexWatchdog();
  _idxWatchdog = setTimeout(tickIndexWatchdog, IDX_WATCHDOG_INTERVAL_MS);
}

async function fetchWithTimeout(promise, timeoutMs = 8000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Fetch timeout')), timeoutMs))
  ]);
}

async function tickIndexWatchdog() {
  if (indexContentVisible()) { stopIndexWatchdog(); return; }
  if (_idxWatchdogBusy) { scheduleIndexWatchdog(); return; }
  if (_idxWatchdogAttempts >= IDX_WATCHDOG_MAX_ATTEMPTS) { 
    stopIndexWatchdog(); 
    // Remove loaders so UI doesn't look frozen if network fails completely
    document.querySelectorAll('.gt-card-loader').forEach(l => l.remove());
    return; 
  }
  _idxWatchdogAttempts++;
  _idxWatchdogBusy = true;
  try {
    const [freshTours, freshCars, freshPosts, freshFeatured, freshReviews] = await Promise.all([
      fetchWithTimeout(fetchToursFromFirebase()).catch(() => null),
      fetchWithTimeout(fetchCarsFromFirebase()).catch(() => null),
      fetchWithTimeout(fetchPostsFromFirebase()).catch(() => null),
      fetchWithTimeout(fetchFeaturedFromFirebase()).catch(() => null),
      fetchWithTimeout(fetchReviewsFromFirebase()).catch(() => null)
    ]);

    let dataUpdated = false;
    if (freshTours && freshTours.length > 0) { toursData = freshTours; dataUpdated = true; }
    if (freshCars && freshCars.length > 0) { carsData = freshCars; dataUpdated = true; }
    if (freshPosts && freshPosts.length > 0) { postsData = freshPosts; dataUpdated = true; }
    if (freshFeatured && freshFeatured.length > 0) { featuredData = freshFeatured; dataUpdated = true; }
    if (freshReviews && freshReviews.length > 0) { reviewsData = freshReviews; dataUpdated = true; }

    if (dataUpdated) {
      writeDataCache({ tours: toursData, cars: carsData, posts: postsData, featured: featuredData, reviews: reviewsData });
      renderAllContent();
    }
  } catch (e) { /* retry on next tick */ }
  _idxWatchdogBusy = false;
  if (indexContentVisible()) stopIndexWatchdog();
  else scheduleIndexWatchdog();
}

// ===== LOAD ALL DATA AND INIT =====
async function loadDataAndInit() {
  // One-time init (runs regardless of whether we have cache)
  initTourTabs();
  fetchWeather();
  initModal();
  initContactForm();
  initNewsletterForms();
  initScrollSlider('domestic-tours-grid', 'domestic-prev', 'domestic-next');
  initScrollSlider('international-tours-grid', 'international-prev', 'international-next');
  initScrollSlider('cars-grid', 'cars-prev', 'cars-next');
  initScrollSlider('transport-photos-grid', 'transport-prev', 'transport-next');
  const toursPageGrid = document.getElementById('tours-page-grid');
  if (toursPageGrid) initTourTabsPage();

  // ---------- 1. Cache-first instant render ----------
  const cached = readDataCache();
  let renderedFromCache = false;
  if (cached && (cached.tours?.length || cached.cars?.length || cached.posts?.length)) {
    toursData    = cached.tours || [];
    carsData     = cached.cars || [];
    postsData    = cached.posts || [];
    featuredData = cached.featured || [];
    reviewsData  = cached.reviews || [];
    renderAllContent();
    renderedFromCache = true;
    setTimeout(initScrollAnimations, 50);
  } else {
    // No cache — keep the inline HTML loaders visible.
    const spinnerLight = '<div class="gt-card-loader"><span class="gt-card-loader__spinner" aria-hidden="true"></span><span>' + ((window.t && window.t('loading')) || 'Loading') + '<span class="gt-card-loader__dots" aria-hidden="true"></span></span></div>';
    const spinnerDark  = '<div class="gt-card-loader gt-card-loader--dark"><span class="gt-card-loader__spinner" aria-hidden="true"></span><span>' + ((window.t && window.t('loading')) || 'Loading') + '<span class="gt-card-loader__dots" aria-hidden="true"></span></span></div>';
    const domesticGrid = document.getElementById('domestic-tours-grid');
    const internationalGrid = document.getElementById('international-tours-grid');
    const carsGrid = document.getElementById('cars-grid');
    const storiesGrid = document.getElementById('stories-grid');
    if (domesticGrid && !domesticGrid.querySelector('.gt-card-loader')) domesticGrid.innerHTML = spinnerLight;
    if (internationalGrid && !internationalGrid.querySelector('.gt-card-loader')) internationalGrid.innerHTML = spinnerLight;
    if (carsGrid && !carsGrid.querySelector('.gt-card-loader')) carsGrid.innerHTML = spinnerDark;
    if (storiesGrid && !storiesGrid.querySelector('.gt-card-loader')) storiesGrid.innerHTML = spinnerLight;
  }

  // ---------- 2. Kick off the watchdog ----------
  // Runs in parallel with the fresh fetch below. If the fresh fetch succeeds
  // first, indexContentVisible() will return true and the watchdog self-stops.
  scheduleIndexWatchdog();

  // ---------- 3. Background fresh fetch ----------
  try {
    // Use Promise.allSettled and fetchWithTimeout so one slow or failing request doesn't block the entire data load
    const results = await Promise.allSettled([
      fetchWithTimeout(fetchToursFromFirebase()).catch(() => null),
      fetchWithTimeout(fetchCarsFromFirebase()).catch(() => null),
      fetchWithTimeout(fetchPostsFromFirebase()).catch(() => null),
      fetchWithTimeout(fetchFeaturedFromFirebase()).catch(() => null),
      fetchWithTimeout(fetchReviewsFromFirebase()).catch(() => null)
    ]);

    // Map settled results back to data variables
    // Map settled results back to data variables ONLY if they succeeded and have data
    if (results[0].status === 'fulfilled' && results[0].value) toursData = results[0].value;
    if (results[1].status === 'fulfilled' && results[1].value) carsData = results[1].value;
    if (results[2].status === 'fulfilled' && results[2].value) postsData = results[2].value;
    if (results[3].status === 'fulfilled' && results[3].value) featuredData = results[3].value;
    if (results[4].status === 'fulfilled' && results[4].value) reviewsData = results[4].value;

    // Persist the fresh snapshot for the NEXT page load.
    writeDataCache({
      tours: toursData,
      cars: carsData,
      posts: postsData,
      featured: featuredData,
      reviews: reviewsData
    });

    renderAllContent();
    if (!renderedFromCache) setTimeout(initScrollAnimations, 100);
    if (indexContentVisible()) stopIndexWatchdog();
  } catch (error) {
    console.error('Error loading data:', error);
    // Don't show an error UI — the watchdog will keep retrying.
  }
}

// ===== INIT =====
function insertWhatsAppFloatingButton() {
  if (document.getElementById('whatsapp-float-link')) return;
  const whatsappUrl = 'https://api.whatsapp.com/send/?phone=995504220020&text=Hello%2C%20I%20have%20a%20question%20about%20your%20trips.';
  const link = document.createElement('a');
  link.id = 'whatsapp-float-link';
  link.className = 'whatsapp-float';
  link.href = whatsappUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.setAttribute('aria-label', 'Chat on WhatsApp');
  link.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.41 0 .01 5.399 0 12.039c0 2.123.554 4.197 1.606 6.041l-1.706 6.23 6.375-1.671a11.8 11.8 0 005.772 1.503h.005c6.64 0 12.04-5.4 12.043-12.04a11.82 11.82 0 00-3.414-8.423z"/>
    </svg>
  `;
  document.body.appendChild(link);
}

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  insertWhatsAppFloatingButton();
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
      const tFn = (k) => (window.t ? window.t(k) : k);
      grid.innerHTML = filtered.length > 0 ? filtered.map(renderTourCard).join('') : `<p style="text-align:center;color:var(--text-mid);">${tFn('empty_tours_category')}</p>`;
      syncSaveButtons();
      setTimeout(initScrollAnimations, 50);
    });
  });
}

// Make functions globally available
window.openBookModal = openBookModal;
window.closeModal = closeModal;

// ===== Re-render all dynamic data (called by lang.js when language changes) =====
window.reRenderAllData = function reRenderAllData() {
  // Skip if no data at all — avoid clearing already-rendered grids
  if ((!toursData || toursData.length === 0) && (!carsData || carsData.length === 0) && (!postsData || postsData.length === 0)) return;

  try { renderDomesticTours(); } catch {}
  try { renderInternationalTours(); } catch {}
  try { renderCars('cars-grid'); } catch {}
  try { renderPosts('stories-grid', 6); } catch {}
  try { renderFeaturedSlider(); } catch {}
  try { renderBatumiSlider(); } catch {}
  try { renderMapOverlay(); } catch {}

  // Cars page full list
  const carsStack = document.getElementById('cars-stack');
  if (carsStack && carsData.length > 0) {
    carsStack.innerHTML = carsData.map(renderCarFullCard).join('');
  }

  // Tours page full list
  const toursPageGrid = document.getElementById('tours-page-grid');
  if (toursPageGrid && toursData.length > 0) {
    const activeBtn = document.querySelector('.tab-btn[data-page-filter].active');
    const filter = activeBtn ? activeBtn.dataset.pageFilter : 'all';
    const filtered = filter === 'all' ? toursData : toursData.filter(t => t.category === filter);
    toursPageGrid.innerHTML = filtered.map(renderTourCard).join('');
  }

  // Posts page
  try { renderPosts('posts-page-grid'); } catch {}

  // Tours tab grid on home
  const toursGrid = document.getElementById('tours-grid');
  if (toursGrid && toursData.length > 0) {
    const activeBtn = document.querySelector('.tab-btn:not([data-page-filter]).active');
    const filter = activeBtn ? activeBtn.dataset.filter : 'all';
    renderTours(filter);
  }

  syncSaveButtons();
};

// ===== TAB VISIBILITY — re-fetch data when user returns =====
// Replaces periodic polling: only fetches when the user actually comes back
// to the tab after being away, ensuring data is always fresh and visible.
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState !== 'visible') return;
  // Only re-fetch if data arrays are empty (data disappeared)
  const needsRefresh = (!toursData || toursData.length === 0)
    && (!carsData || carsData.length === 0)
    && (!postsData || postsData.length === 0);
  if (!needsRefresh) return;
  // Try cache first
  const cached = readDataCache();
  if (cached && (cached.tours?.length || cached.cars?.length || cached.posts?.length)) {
    toursData    = cached.tours || [];
    carsData     = cached.cars || [];
    postsData    = cached.posts || [];
    featuredData = cached.featured || [];
    reviewsData  = cached.reviews || [];
    renderAllContent();
  }
  // Also kick off a fresh background fetch
  _idxWatchdogAttempts = 0;
  scheduleIndexWatchdog();
});
