/**
 * Transfer pricing — distance bands × vehicles, managed from the admin panel
 * (Firestore settings/transfer_pricing). Pure data helpers: no Firebase here,
 * so the public calculator can import this without pulling in the SDK.
 *
 * The owner's formula: fare = km × base price per km × (1 + markup %), where
 * the markup depends on the vehicle and on the band the WHOLE distance falls
 * into. With a 1 ₾ base, a 20 km sedan trip at +320% is 20 × 1 × 4.2 = 84 ₾.
 *
 * Band i covers [bands[i-1], bands[i]) km, so bands [16, 30, …] read as
 * "0–15", "16–29", …; the last band is open-ended ("300+ km").
 *
 * Because each band has its own markup, a trip just past a bound can cost
 * less than one just below it (sedan 99 km = 347 ₾, 100 km = 240 ₾). That is
 * the formula as given; the admin panel lists those spots (findFareDrops).
 *
 * Only the admin panel sees base price and markups. The public pages get
 * toPublicPricing(): finished ₾/km rates, no formula.
 */

export const TRANSFER_VEHICLE_KEYS = ["sedan", "minivan", "jeep", "sprinter"];

// Stored docs without this marker are replaced by the defaults below: the old
// per-km table, and "band-markup" tables saved before the 0–15 km band.
export const TRANSFER_PRICING_MODEL = "band-markup-2";

export const DEFAULT_TRANSFER_PRICING = {
  model: TRANSFER_PRICING_MODEL,
  baseRatePerKm: 1,
  bands: [16, 30, 50, 100, 150, 300],
  vehicles: {
    //          0–15  16–29  30–49  50–99  100–149  150–299  300+
    sedan: { markups: [370, 320, 300, 250, 140, 80, 50], minFare: null },
    minivan: { markups: [580, 530, 465, 390, 200, 135, 100], minFare: null },
    // Jeep: about three quarters of the way from sedan to minivan.
    jeep: { markups: [530, 480, 425, 355, 185, 120, 90], minFare: null },
    // Sprinter (up to 19 seats): about 1.3 × the minivan fare.
    sprinter: { markups: [785, 720, 635, 540, 290, 205, 170], minFare: null },
  },
  svanetiSurchargePct: 10,
};

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

const roundRate = (n) => Math.round(n * 10000) / 10000;

/** ₾ per km for a markup, e.g. base 1 and +320% → 4.2. */
export function rateFromMarkup(baseRatePerKm, markupPct) {
  if (baseRatePerKm == null || markupPct == null) return null;
  return roundRate(baseRatePerKm * (1 + markupPct / 100));
}

/**
 * Coerces a stored or edited pricing object into a consistent shape: sorted
 * unique positive band bounds and, per vehicle, exactly bands.length + 1
 * markups (null = not filled in yet), the ₾/km rates they give, and a minimum
 * fare (null = none). An old-format doc yields the defaults.
 */
export function normalizeTransferPricing(raw) {
  const src = raw && typeof raw === "object" && raw.model === TRANSFER_PRICING_MODEL ? raw : DEFAULT_TRANSFER_PRICING;

  const rawBands = Array.isArray(src.bands) ? src.bands : DEFAULT_TRANSFER_PRICING.bands;
  const bandPairs = rawBands
    .map((b, i) => ({ bound: toNumberOrNull(b), i }))
    .filter((p) => p.bound !== null && p.bound > 0)
    .sort((a, b) => a.bound - b.bound)
    .filter((p, idx, arr) => idx === 0 || p.bound !== arr[idx - 1].bound);
  const bands = bandPairs.map((p) => p.bound);
  const baseRatePerKm = toNumberOrNull(src.baseRatePerKm) ?? DEFAULT_TRANSFER_PRICING.baseRatePerKm;

  const vehicles = {};
  for (const key of TRANSFER_VEHICLE_KEYS) {
    const v = src.vehicles?.[key] || {};
    const oldMarkups = Array.isArray(v.markups) ? v.markups : [];
    // Band i ends at bound i; when bounds were reordered its markup follows
    // it. The open-ended last markup keeps its place.
    const markups = bandPairs.map((p) => toNumberOrNull(oldMarkups[p.i]));
    markups.push(toNumberOrNull(oldMarkups[rawBands.length]));
    vehicles[key] = {
      markups,
      rates: markups.map((m) => rateFromMarkup(baseRatePerKm, m)),
      minFare: toNumberOrNull(v.minFare),
    };
  }

  return {
    model: TRANSFER_PRICING_MODEL,
    baseRatePerKm,
    bands,
    vehicles,
    svanetiSurchargePct: toNumberOrNull(src.svanetiSurchargePct) ?? 0,
  };
}

/** What the public pages receive: finished ₾/km rates, no base or markups. */
export function toPublicPricing(pricing) {
  const p = normalizeTransferPricing(pricing);
  const vehicles = {};
  for (const key of TRANSFER_VEHICLE_KEYS) {
    vehicles[key] = { rates: p.vehicles[key].rates, minFare: p.vehicles[key].minFare };
  }
  return { bands: p.bands, vehicles, svanetiSurchargePct: p.svanetiSurchargePct };
}

export function bandIndexForDistance(bands, distanceKm) {
  const d = Math.max(0, Number(distanceKm) || 0);
  const idx = bands.findIndex((bound) => d < bound);
  return idx === -1 ? bands.length : idx;
}

// An empty band borrows the nearest filled band (shorter distance first), so a
// half-filled table still prices.
function pickFilled(values, idx) {
  if (values[idx] != null) return values[idx];
  for (let step = 1; step < values.length; step++) {
    if (values[idx - step] != null) return values[idx - step];
    if (values[idx + step] != null) return values[idx + step];
  }
  return null;
}

/** ₾ per km for the band a distance falls into. Works on full or public pricing. */
export function getRatePerKm(pricing, vehicleKey, distanceKm) {
  const rates = pricing?.vehicles?.[vehicleKey]?.rates || [];
  return pickFilled(rates, bandIndexForDistance(pricing?.bands || [], distanceKm));
}

/** Markup % for the band a distance falls into (full pricing only). */
export function getMarkupPct(pricing, vehicleKey, distanceKm) {
  const markups = pricing?.vehicles?.[vehicleKey]?.markups || [];
  return pickFilled(markups, bandIndexForDistance(pricing?.bands || [], distanceKm));
}

/** Total fare in GEL, or null when the vehicle has no rates at all. */
export function getTransferFare(pricing, vehicleKey, distanceKm, { isSvaneti = false } = {}) {
  const rate = getRatePerKm(pricing, vehicleKey, distanceKm);
  if (rate == null) return null;
  let raw = Math.max(0, Number(distanceKm) || 0) * rate;
  if (isSvaneti) raw *= 1 + (pricing.svanetiSurchargePct || 0) / 100;
  return Math.max(pricing.vehicles[vehicleKey]?.minFare || 0, Math.round(raw));
}

/**
 * Bounds where the next band's lower markup makes a longer trip cheaper than
 * a shorter one, e.g. sedan 99 km = 347 ₾ but 100 km = 240 ₾. Shown in the
 * admin panel for information.
 */
export function findFareDrops(pricing, vehicleKey) {
  const drops = [];
  for (const bound of pricing?.bands || []) {
    const before = getTransferFare(pricing, vehicleKey, bound - 1);
    const at = getTransferFare(pricing, vehicleKey, bound);
    if (before != null && at != null && at < before) drops.push({ bound, fare: at, prevKm: bound - 1, prevFare: before });
  }
  return drops;
}

/** "0–29", "30–49", …, "300+" labels for each band. */
export function bandLabels(bands) {
  const labels = bands.map((bound, i) => `${i === 0 ? 0 : bands[i - 1]}–${bound - 1}`);
  labels.push(`${bands.length ? bands[bands.length - 1] : 0}+`);
  return labels;
}
