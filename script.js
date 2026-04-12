// ===== DATA =====
const toursData = [
  {
    id: 1, category: 'oneday',
    title: 'Mtskheta & Jvari Monastery',
    price: '$49', perPerson: true,
    desc: 'Visit Georgia\'s ancient capital and the iconic Jvari Church overlooking the confluence of two great rivers.',
    img: 'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=600&q=80',
    duration: '1 Day', group: 'Up to 10'
  },
  {
    id: 2, category: 'oneday',
    title: 'Kakheti Wine Region',
    price: '$65', perPerson: true,
    desc: 'Explore the cradle of wine, visit cellars, taste local Rkatsiteli and Saperavi vintages in beautiful valleys.',
    img: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=600&q=80',
    duration: '1 Day', group: 'Up to 12'
  },
  {
    id: 3, category: 'oneday',
    title: 'Kazbegi Mountain Day',
    price: '$79', perPerson: true,
    desc: 'Journey to the majestic Kazbegi region, see Gergeti Trinity Church and breathtaking Caucasus peaks.',
    img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    duration: '1 Day', group: 'Up to 8'
  },
  {
    id: 4, category: 'full',
    title: 'Best of Georgia – 5 Days',
    price: '$420', perPerson: true,
    desc: 'Tbilisi, Mtskheta, Gori, Uplistsikhe cave city, Borjomi spa resort and the Surami Fortress. A journey through history.',
    img: 'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=600&q=80',
    duration: '5 Days', group: 'Up to 8'
  },
  {
    id: 5, category: 'full',
    title: 'Mountains & Coast – 7 Days',
    price: '$680', perPerson: true,
    desc: 'From the snowy peaks of Kazbegi to the subtropical beaches of Batumi — experience Georgia\'s full range.',
    img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
    duration: '7 Days', group: 'Up to 10'
  },
  {
    id: 6, category: 'full',
    title: 'Hidden Georgia – 10 Days',
    price: '$990', perPerson: true,
    desc: 'Off-the-beaten-path villages, Svaneti towers, Mestia, Ushguli, Tusheti highlands and secret gorges.',
    img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80',
    duration: '10 Days', group: 'Up to 6'
  }
];

const carsData = [
  {
    id: 1, type: 'SUV',
    title: 'Toyota Land Cruiser 200',
    info: 'Perfect for mountain roads and off-road adventures. Powerful, spacious and reliable for any terrain Georgia offers.',
    img: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&q=80',
    seats: '7 Seats', ac: 'Full A/C', drive: '4x4 Drive', price: '$180/day'
  },
  {
    id: 2, type: 'Minivan',
    title: 'Mercedes Sprinter',
    info: 'Ideal for group travel. Comfortable seating with luggage space, air conditioning, and WiFi on board.',
    img: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600&q=80',
    seats: '14 Seats', ac: 'Climate', drive: 'Auto', price: '$220/day'
  },
  {
    id: 3, type: 'Sedan',
    title: 'Mercedes E-Class',
    info: 'Premium comfort for VIP transfers and city tours. Professional driver, bottled water, and leather interior.',
    img: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&q=80',
    seats: '3 Seats', ac: 'Full A/C', drive: 'Auto', price: '$140/day'
  },
  {
    id: 4, type: 'SUV',
    title: 'Mitsubishi Delica',
    info: 'A beloved 4WD van for adventurous groups heading to Svaneti, Tusheti or any remote mountain destination.',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
    seats: '8 Seats', ac: 'A/C', drive: '4WD', price: '$160/day'
  }
];

const postsData = [
  {
    id: 1, category: 'Culture',
    title: 'Georgian Polyphonic Singing: A Living Heritage',
    text: 'Discover the ancient art of Georgian polyphony, recognized by UNESCO, and where to experience it live in Tbilisi and the villages.',
    img: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80',
    date: 'Apr 2025', readTime: '5 min read'
  },
  {
    id: 2, category: 'Food',
    title: 'The Ultimate Guide to Georgian Food & Khinkali',
    text: 'From khachapuri to churchkhela, we guide you through the unmissable dishes and the best spots to eat like a local in Tbilisi.',
    img: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=600&q=80',
    date: 'Mar 2025', readTime: '7 min read'
  },
  {
    id: 3, category: 'Adventure',
    title: 'Trekking in Svaneti: What No One Tells You',
    text: 'Honest advice about trekking Georgia\'s most remote highland — the trails, weather, guesthouses, and the incredible Ushguli village.',
    img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
    date: 'Feb 2025', readTime: '9 min read'
  },
  {
    id: 4, category: 'Travel Tips',
    title: 'Tbilisi in 48 Hours: The Perfect Itinerary',
    text: 'Two days isn\'t long, but with this guide you\'ll cover the Old Town, Narikala, Rustaveli Avenue, and the best rooftop bars.',
    img: 'https://images.unsplash.com/photo-1565008576549-57569a49371d?w=600&q=80',
    date: 'Jan 2025', readTime: '6 min read'
  },
  {
    id: 5, category: 'Wine',
    title: 'Qvevri Wine: Ancient Tradition in a Clay Pot',
    text: 'Georgia invented wine 8,000 years ago. We explore the Kakheti region\'s natural winemakers and the unique qvevri clay vessel method.',
    img: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=600&q=80',
    date: 'Dec 2024', readTime: '8 min read'
  },
  {
    id: 6, category: 'School Tours',
    title: 'Planning a School Excursion to Georgia: Full Guide',
    text: 'Everything teachers and parents need to know about bringing students to Georgia — safety, logistics, educational value, and budgeting.',
    img: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=600&q=80',
    date: 'Nov 2024', readTime: '10 min read'
  }
];

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

  // Dropdown menu functionality
  const dropdowns = document.querySelectorAll('.nav-dropdown');
  dropdowns.forEach(dropdown => {
    const btn = dropdown.querySelector('.nav-dropdown-btn, .nav-user-btn');
    const menu = dropdown.querySelector('.dropdown-menu');
    
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        menu.style.opacity = menu.style.opacity === '1' ? '0' : '1';
        menu.style.visibility = menu.style.visibility === 'visible' ? 'hidden' : 'visible';
      });
    }
    
    // Close dropdown when clicking a link
    const links = dropdown.querySelectorAll('.dropdown-menu a');
    links.forEach(link => {
      link.addEventListener('click', () => {
        menu.style.opacity = '0';
        menu.style.visibility = 'hidden';
      });
    });
  });

  // Set active link
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === path) a.classList.add('active');
  });
}

// ===== TOUR CARDS =====
function renderTourCard(tour) {
  const badge = tour.category === 'oneday'
    ? `<span class="tour-card-badge badge-oneday">One Day</span>`
    : `<span class="tour-card-badge badge-full">Full Package</span>`;
  return `
    <div class="tour-card" data-category="${tour.category}">
      <div class="tour-card-img">
        <img src="${tour.img}" alt="${tour.title}" loading="lazy">
        ${badge}
      </div>
      <div class="tour-card-body">
        <h3 class="tour-card-title">${tour.title}</h3>
        <p class="tour-card-desc">${tour.desc}</p>
        <div class="tour-card-footer">
          <div class="tour-price">${tour.price}<span>/person</span></div>
          <button class="btn-sm" onclick="openBookModal('${tour.title}','${tour.price}')">Book Now</button>
        </div>
      </div>
    </div>`;
}

function renderTours(filter = 'all') {
  const grid = document.getElementById('tours-grid');
  if (!grid) return;
  const filtered = filter === 'all' ? toursData : toursData.filter(t => t.category === filter);
  grid.innerHTML = filtered.map(renderTourCard).join('');
}

function renderDomesticTours() {
  const grid = document.getElementById('domestic-tours-grid');
  if (!grid) return;
  const domesticTours = toursData.filter(tour => tour.category === 'oneday');
  grid.innerHTML = domesticTours.map(renderTourCard).join('');
}

function renderInternationalTours() {
  const grid = document.getElementById('international-tours-grid');
  if (!grid) return;
  const internationalTours = toursData.filter(tour => tour.category === 'full');
  grid.innerHTML = internationalTours.map(renderTourCard).join('');
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
        <p class="car-card-info">${car.info}</p>
        <div class="car-features">
          <span class="car-feature">🪑 ${car.seats}</span>
          <span class="car-feature">❄️ ${car.ac}</span>
          <span class="car-feature">🚗 ${car.drive}</span>
        </div>
      </div>
    </div>`;
}

function renderCars(containerId = 'cars-grid') {
  const grid = document.getElementById(containerId);
  if (!grid) return;
  grid.innerHTML = carsData.map(renderCarCard).join('');
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
        <p class="tour-card__desc">${car.info} Whether you need airport transfers, city tours, or multi-day mountain excursions, we ensure comfort and safety throughout.</p>
        <ul class="tour-highlights">
          <li class="tour-highlight"><span class="highlight-dot"></span>${car.seats}</li>
          <li class="tour-highlight"><span class="highlight-dot"></span>${car.ac}</li>
          <li class="tour-highlight"><span class="highlight-dot"></span>${car.drive}</li>
        </ul>
        <div class="tour-card__footer">
          <div class="tour-card__meta">
            <span class="tour-meta-item">✅ Driver included</span>
          </div>
          <div class="tour-card__price-block">
            <span class="tour-price">${car.price}</span>
            <span class="tour-price-label">per day</span>
          </div>
        </div>
        <button class="btn-book" onclick="openBookModal('${car.title} Transfer','Contact Us')">
          Book This Vehicle <span class="btn-arrow">→</span>
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
          <span>📅 ${post.date}</span>
          <span>⏱ ${post.readTime}</span>
        </div>
        <h3 class="post-card-title">${post.title}</h3>
        <p class="post-card-text">${post.text}</p>
        <span class="post-read-more">Read More →</span>
      </div>
    </div>`;
}

function renderPosts(containerId = 'posts-grid', count = null) {
  const grid = document.getElementById(containerId);
  if (!grid) return;
  const data = count ? postsData.slice(0, count) : postsData;
  grid.innerHTML = data.map(renderPostCard).join('');
}

// ===== WEATHER =====
async function fetchWeather() {
  const widget = document.getElementById('weather-widget');
  if (!widget) return;

  // Using Open-Meteo (free, no key needed) for Tbilisi
  const lat = 41.6938, lon = 44.8015, city = 'Tbilisi, Georgia';
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m,windspeed_10m&timezone=Asia%2FTbilisi`;

  const weatherIcons = { 0:'☀️', 1:'🌤️', 2:'⛅', 3:'☁️', 45:'🌫️', 48:'🌫️', 51:'🌦️', 53:'🌦️', 55:'🌧️', 61:'🌧️', 63:'🌧️', 65:'🌧️', 71:'❄️', 73:'❄️', 75:'❄️', 80:'🌦️', 81:'🌧️', 82:'⛈️', 95:'⛈️', 96:'⛈️', 99:'⛈️' };
  const weatherDescs = { 0:'Clear sky', 1:'Mainly clear', 2:'Partly cloudy', 3:'Overcast', 45:'Foggy', 48:'Foggy', 51:'Light drizzle', 53:'Drizzle', 55:'Heavy drizzle', 61:'Slight rain', 63:'Moderate rain', 65:'Heavy rain', 71:'Light snow', 73:'Moderate snow', 75:'Heavy snow', 80:'Light showers', 81:'Moderate showers', 82:'Heavy showers', 95:'Thunderstorm', 96:'Thunderstorm', 99:'Thunderstorm' };

  try {
    const res = await fetch(url);
    const data = await res.json();
    const cw = data.current_weather;
    const code = cw.weathercode;
    const icon = weatherIcons[code] || '🌡️';
    const desc = weatherDescs[code] || 'Unknown';
    const wind = Math.round(cw.windspeed);

    widget.innerHTML = `
      <div class="weather-left">
        <h3>Current Weather</h3>
        <div class="city">${city}</div>
        <div class="weather-temp">${Math.round(cw.temperature)}°C</div>
        <div class="weather-desc">${desc}</div>
        <div class="weather-details">
          <div class="weather-detail"><span>💨 Wind: ${wind} km/h</span></div>
          <div class="weather-detail"><span>🕐 Updated live</span></div>
        </div>
      </div>
      <div class="weather-icon-large">${icon}</div>`;
  } catch {
    widget.innerHTML = `<p class="weather-error">Live weather temporarily unavailable. Tbilisi is typically warm and sunny — perfect for exploring!</p>`;
  }
}

// ===== MODAL =====
function openBookModal(tourName, price) {
  const modal = document.getElementById('book-modal');
  if (!modal) return;
  document.getElementById('modal-tour-name').textContent = tourName;
  document.getElementById('modal-tour-price').textContent = price === 'Contact Us' ? 'Contact Us for Pricing' : `From ${price} per person`;
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
  let currentIndex = 0;
  
  // Create dots
  cards.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.classList.add('slider-dot');
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goToSlide(i));
    dotsContainer.appendChild(dot);
  });
  
  function updateSlider() {
    cards.forEach((card, i) => {
      card.classList.toggle('active', i === currentIndex);
    });
    const dots = dotsContainer.querySelectorAll('.slider-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
    });
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
  
  const scrollAmount = 340;
  
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

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  renderDomesticTours();
  renderInternationalTours();
  renderCars('cars-grid');
  renderPosts('stories-grid', 6);
  initTourTabs();
  fetchWeather();
  initModal();
  initContactForm();
  
  // Initialize sliders
  initFeaturedSlider();
  initScrollSlider('domestic-tours-grid', 'domestic-prev', 'domestic-next');
  initScrollSlider('international-tours-grid', 'international-prev', 'international-next');
  initScrollSlider('cars-grid', 'cars-prev', 'cars-next');

  // Cars page full list
  const carsStack = document.getElementById('cars-stack');
  if (carsStack) carsStack.innerHTML = carsData.map(renderCarFullCard).join('');

  // Tours page full list
  const toursPageGrid = document.getElementById('tours-page-grid');
  if (toursPageGrid) {
    toursPageGrid.innerHTML = toursData.map(renderTourCard).join('');
    initTourTabsPage();
  }

  // Posts page
  renderPosts('posts-page-grid');

  setTimeout(initScrollAnimations, 100);
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
      grid.innerHTML = filtered.map(renderTourCard).join('');
      setTimeout(initScrollAnimations, 50);
    });
  });
}
