// ============================================================
//  GEORGIA TRIPS — Tours Page Module
//  Handles: category filtering, card rendering, state, animations
//  Structure designed for easy React conversion
// ============================================================

// ── STATE ───────────────────────────────────────────────────
const ToursPageState = {
  activeCategory: 'one-day',  // default tab on load
  isAnimating: false,
};

// ── CATEGORY CONFIG ─────────────────────────────────────────
const TOUR_CATEGORIES = [
  {
    key: 'one-day',
    label: 'One-Day Tours',
  },
  {
    key: 'multi-day',
    label: 'Multi-Day Tours',
  },
  {
    key: 'fixed',
    label: 'Fixed Tours',
  },
];

// ── HELPERS ─────────────────────────────────────────────────
function getSpotsLabel(spotsLeft) {
  if (spotsLeft <= 3) return { text: `⚡ Only ${spotsLeft} spots left`, urgent: true };
  if (spotsLeft <= 6) return { text: `${spotsLeft} spots left`, urgent: false };
  return { text: `${spotsLeft} spots available`, urgent: false };
}

function formatHighlights(highlights) {
  return highlights
    .map(h => `<li class="tour-highlight"><span class="highlight-dot"></span>${h}</li>`)
    .join('');
}

// ── CARD RENDERERS ───────────────────────────────────────────

/** Renders a standard tour card (one-day, multi-day, flexible) */
function renderStandardCard(tour) {
  const description = tour.desc.length > 200 ? tour.desc.substring(0, 200) + '...' : tour.desc;
  return `
    <article class="tour-card tour-card--standard" data-id="${tour.id}" data-category="${tour.category}">
      <div class="tour-card__img-wrap">
        <img src="${tour.img}" alt="${tour.title}" loading="lazy" class="tour-card__img">
        <div class="tour-card__overlay"></div>
        <div class="tour-card__top-badges">
          <button class="save-tour-btn" data-save-id="${tour.id}" onclick="toggleSaveTour('${tour.id}', event)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
          </button>
          <span class="tour-badge tour-badge--duration">⏱ ${tour.duration}</span>
          <span class="tour-badge tour-badge--duration" style="background:var(--teal);">🌤 ${Array.isArray(tour.season) ? tour.season.join(', ') : (tour.season || 'All Year')}</span>
        </div>
      </div>
      <div class="tour-card__body">
        <h3 class="tour-card__title">${tour.title}</h3>
        <p class="tour-card__desc">${description}</p>
        <ul class="tour-highlights">
          ${formatHighlights(tour.highlights)}
        </ul>
        <div class="tour-card__footer">
          <div class="tour-card__meta">
            <span class="tour-meta-item">👥 Min People: ${tour.minPeople || 1}</span>
            <span class="tour-meta-item">👥 Max People: ${tour.maxPeople || 10}</span>
          </div>
          <div class="tour-card__price-block">
            <span class="tour-price">${tour.price}</span> <span class="price-separator">/</span> <span class="tour-price-label">per person</span>
          </div>
        </div>
        <div style="display: flex; gap: 0.75rem;">
          <button class="btn-details" onclick="goToTourDetail('${tour.id}')">
            Learn More <span class="btn-arrow">→</span>
          </button>
          <button class="btn-book" onclick="openBookModal('${tour.title}', '${tour.price}', '${tour.id}')">
            Book <span class="btn-arrow">→</span>
          </button>
        </div>
      </div>
    </article>`;
}

/** Renders an upcoming tour card (includes date badge + spots counter) */
function renderUpcomingCard(tour) {
  const spots = getSpotsLabel(tour.spotsLeft);
  const spotsClass = spots.urgent ? 'spots-label spots-label--urgent' : 'spots-label';
  const description = tour.desc.length > 200 ? tour.desc.substring(0, 200) + '...' : tour.desc;
  return `
    <article class="tour-card tour-card--upcoming" data-id="${tour.id}" data-category="${tour.category}">
      <div class="tour-card__img-wrap">
        <img src="${tour.img}" alt="${tour.title}" loading="lazy" class="tour-card__img">
        <div class="tour-card__overlay"></div>
        <div class="tour-card__top-badges">
          <button class="save-tour-btn" data-save-id="${tour.id}" onclick="toggleSaveTour('${tour.id}', event)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
          </button>
          <span class="tour-badge tour-badge--date">📅 ${tour.dateRange}</span>
        </div>
      </div>
      <div class="tour-card__body">
        <div class="upcoming-header">
          <h3 class="tour-card__title">${tour.title}</h3>
          <span class="${spotsClass}">${spots.text}</span>
        </div>
        <p class="tour-card__desc">${description}</p>
        <ul class="tour-highlights">
          ${formatHighlights(tour.highlights)}
        </ul>
        <div class="tour-card__footer">
          <div class="tour-card__meta">
            <span class="tour-meta-item">⏱ ${tour.duration}</span>
            <span class="tour-meta-item">👥 Min People: ${tour.minPeople || 1}</span>
            <span class="tour-meta-item">👥 Max People: ${tour.maxPeople || 10}</span>
          </div>
          <div class="tour-card__price-block">
            <span class="tour-price">${tour.price}</span> <span class="price-separator">/</span> <span class="tour-price-label">per person</span>
          </div>
        </div>
        <div style="display: flex; gap: 0.75rem;">
          <button class="btn-details" onclick="goToTourDetail('${tour.id}')">
            Learn More <span class="btn-arrow">→</span>
          </button>
          <button class="btn-book btn-book--upcoming" onclick="openBookModal('${tour.title}', '${tour.price}', '${tour.id}')">
            Reserve <span class="btn-arrow">→</span>
          </button>
        </div>
      </div>
    </article>`;
}

/** Dispatcher — picks the right renderer based on category */
function renderTourCard(tour) {
  if (tour.category === 'upcoming') return renderUpcomingCard(tour);
  return renderStandardCard(tour);
}

// ── EMPTY STATE ──────────────────────────────────────────────
function renderEmptyState(categoryLabel) {
  return `
    <div class="tours-empty">
      <div class="tours-empty__icon">🗺️</div>
      <h3>No tours found</h3>
      <p>No ${categoryLabel} are available right now.<br>Check back soon or <a href="contact.html">contact us</a> for a custom trip.</p>
    </div>`;
}

// ── COUNT BADGE ───────────────────────────────────────────────
function getTourCount(categoryKey) {
  return TOURS.filter(t => t.category === categoryKey).length;
}

// ── FILTER LOGIC ─────────────────────────────────────────────
function getFilteredTours(categoryKey) {
  const filtered = TOURS.filter(t => t.category === categoryKey);
  // For upcoming: sort by dateStart ascending
  if (categoryKey === 'upcoming') {
    return filtered.sort((a, b) => new Date(a.dateStart) - new Date(b.dateStart));
  }
  return filtered;
}

// ── RENDER GRID ───────────────────────────────────────────────
function renderToursGrid(categoryKey) {
  const grid = document.getElementById('tours-filter-grid');
  const descBar = document.getElementById('tours-category-bar');
  const countEl = document.getElementById('tours-result-count');
  if (!grid) return;

  const tours = getFilteredTours(categoryKey);
  const cat = TOUR_CATEGORIES.find(c => c.key === categoryKey);
  const label = cat ? cat.label : 'Tours';

  // Update count
  if (countEl) {
    countEl.textContent = tours.length === 1
      ? `1 tour found`
      : `${tours.length} tours found`;
  }

  // Animate out → swap content → animate in
  grid.classList.add('grid--exit');

  setTimeout(() => {
    if (tours.length === 0) {
      grid.innerHTML = renderEmptyState(label);
    } else {
      grid.innerHTML = tours.map(renderTourCard).join('');
    }
    grid.classList.remove('grid--exit');
    grid.classList.add('grid--enter');

    // Stagger card animations
    const cards = grid.querySelectorAll('.tour-card');
    cards.forEach((card, i) => {
      card.style.animationDelay = `${i * 60}ms`;
    });

    setTimeout(() => {
      grid.classList.remove('grid--enter');
      ToursPageState.isAnimating = false;
    }, 400 + cards.length * 60);

    if (window.syncSaveButtons) window.syncSaveButtons();
  }, 220);
}

// ── FILTER TABS ───────────────────────────────────────────────
function buildFilterTabs() {
  const container = document.getElementById('tours-filter-tabs');
  if (!container) return;

  container.innerHTML = TOUR_CATEGORIES.map(cat => {
    const count = getTourCount(cat.key);
    const isActive = cat.key === ToursPageState.activeCategory;
    return `
      <button
        class="filter-tab${isActive ? ' filter-tab--active' : ''}"
        data-category="${cat.key}"
        aria-pressed="${isActive}"
        aria-label="${cat.label} — ${count} tours"
      >
        <span class="filter-tab__label">${cat.label}</span>
        <span class="filter-tab__count">${count}</span>
      </button>`;
  }).join('');

  // Attach click handlers
  container.querySelectorAll('.filter-tab').forEach(btn => {
    btn.addEventListener('click', () => handleTabClick(btn.dataset.category));
  });
}

function handleTabClick(categoryKey) {
  if (categoryKey === ToursPageState.activeCategory) return;
  if (ToursPageState.isAnimating) return;

  ToursPageState.isAnimating = true;
  ToursPageState.activeCategory = categoryKey;

  // Update tab UI
  document.querySelectorAll('.filter-tab').forEach(btn => {
    const isActive = btn.dataset.category === categoryKey;
    btn.classList.toggle('filter-tab--active', isActive);
    btn.setAttribute('aria-pressed', isActive);
  });

  // Move the active indicator
  moveActiveIndicator(categoryKey);

  // Re-render grid
  renderToursGrid(categoryKey);
}

function moveActiveIndicator(categoryKey) {
  const activeBtn = document.querySelector(`.filter-tab[data-category="${categoryKey}"]`);
  const indicator = document.getElementById('tab-indicator');
  if (!activeBtn || !indicator) return;

  const btnRect = activeBtn.getBoundingClientRect();
  const containerRect = activeBtn.closest('.filter-tabs-wrapper').getBoundingClientRect();

  indicator.style.left = `${btnRect.left - containerRect.left}px`;
  indicator.style.width = `${btnRect.width}px`;
}

// ── INIT ──────────────────────────────────────────────────────
function initToursPage() {
  buildFilterTabs();
  renderToursGrid(ToursPageState.activeCategory);

  // Position indicator after layout
  requestAnimationFrame(() => moveActiveIndicator(ToursPageState.activeCategory));

  // Re-position on resize
  window.addEventListener('resize', () => {
    moveActiveIndicator(ToursPageState.activeCategory);
  });
}

// ── GENERIC TOUR CARD CREATOR (for domestic/international pages) ──
function createTourCard(tour) {
  const badgeClass = tour.category === 'oneday' ? 'badge-oneday' : 'badge-full';
  const badgeText = tour.category === 'oneday' ? '1 DAY' : tour.duration;
  
  const card = document.createElement('article');
  card.className = 'tour-card';
  card.role = 'listitem';
  card.innerHTML = `
    <div class="tour-card-img">
      <img src="${tour.img}" alt="${tour.title}" loading="lazy">
      <button class="save-tour-btn" data-save-id="${tour.id}" onclick="toggleSaveTour('${tour.id}', event)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
      </button>
      <span class="tour-card-badge ${badgeClass}">${badgeText}</span>
    </div>
    <div class="tour-card-body">
      <h3 class="tour-card-title">${tour.title}</h3>
      <p class="tour-card-desc">${tour.desc}</p>
      <div class="tour-card-footer">
        <span class="tour-meta">⏱ ${tour.duration}</span>
        <span class="tour-meta">👥 ${tour.group}</span>
        <div class="tour-price-box">
          <span class="tour-price">${tour.price}</span>
          <${tour.perPerson ? 'span' : ''} class="tour-per-person">${tour.perPerson ? '/person' : ''}</${tour.perPerson ? 'span' : ''}>
        </div>
      </div>
      <button class="btn-book" onclick="alert('Tour: ${tour.title} at ${tour.price}')">
        Book Tour <span style="margin-left:0.3rem;">→</span>
      </button>
    </div>
  `;
  return card;
}

// ── NAVIGATION FUNCTIONS ────────────────────────────────────
function goToTourDetail(tourId) {
  // Save the tour ID in sessionStorage for the detail page
  sessionStorage.setItem('selectedTourId', tourId);
  window.location.href = 'tour-detail.html';
}

// ── RUN WHEN DOM IS READY ────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initToursPage);
} else {
  initToursPage();
}
