/**
 * Transfer pricing — distance bands × vehicles, managed from the admin panel
 * (Firestore settings/transfer_pricing). Pure data helpers: no Firebase here,
 * so the public calculator can import this without pulling in the SDK.
 *
 * Band i covers (bands[i-1], bands[i]] km; the last rate covers everything
 * above the last bound ("300+ km"). A band's rate sets the fare at the band's
 * upper bound (100–150 km at 2 ₾/km: 150 km costs 300 ₾). Between two bounds
 * the fare rises evenly from one to the other, and above the last bound every
 * extra km adds the last rate.
 *
 * Pricing the whole trip at its band's rate (the earlier model) made the fare
 * drop at every bound: 100 km = 220 ₾ but 101 km = 202 ₾. Now a longer trip
 * never costs less than a shorter one, even when the table itself says so
 * (see findFareDrops), and no trip costs less than the vehicle's minimum fare.
 */

export const TRANSFER_VEHICLE_KEYS = ["sedan", "minivan", "jeep", "sprinter"];

export const DEFAULT_TRANSFER_PRICING = {
  bands: [50, 100, 150, 200, 300],
  vehicles: {
    sedan: { rates: [2.5, 2.2, 2.0, 1.8, 1.7, 1.2], minFare: 50 },
    minivan: { rates: [2.0, 2.0, 2.0, 2.0, 2.0, 2.0], minFare: 100 },
    jeep: { rates: [2.5, 2.5, 2.5, 2.5, 2.5, 2.5], minFare: 95 },
    sprinter: { rates: [3.0, 3.0, 3.0, 3.0, 3.0, 3.0], minFare: 110 },
  },
  svanetiSurchargePct: 10,
};

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Coerces a stored or edited pricing object into a consistent shape: sorted
 * unique positive band bounds and, per vehicle, exactly bands.length + 1 rates
 * (null = not filled in yet) plus a minimum fare (null = none).
 */
export function normalizeTransferPricing(raw) {
  const src = raw && typeof raw === "object" ? raw : DEFAULT_TRANSFER_PRICING;

  const rawBands = Array.isArray(src.bands) ? src.bands : DEFAULT_TRANSFER_PRICING.bands;
  const bandPairs = rawBands
    .map((b, i) => ({ bound: toNumberOrNull(b), i }))
    .filter((p) => p.bound !== null && p.bound > 0)
    .sort((a, b) => a.bound - b.bound)
    .filter((p, idx, arr) => idx === 0 || p.bound !== arr[idx - 1].bound);
  const bands = bandPairs.map((p) => p.bound);

  const vehicles = {};
  for (const key of TRANSFER_VEHICLE_KEYS) {
    const v = src.vehicles?.[key] || {};
    const oldRates = Array.isArray(v.rates) ? v.rates : [];
    // Rates follow their band when bounds were reordered; the open-ended
    // last rate keeps its place.
    const rates = bandPairs.map((p) => toNumberOrNull(oldRates[p.i]));
    rates.push(toNumberOrNull(oldRates[rawBands.length]));
    vehicles[key] = { rates, minFare: toNumberOrNull(v.minFare) };
  }

  return {
    bands,
    vehicles,
    svanetiSurchargePct: toNumberOrNull(src.svanetiSurchargePct) ?? 0,
  };
}

export function bandIndexForDistance(bands, distanceKm) {
  const d = Math.max(0, Number(distanceKm) || 0);
  const idx = bands.findIndex((bound) => d <= bound);
  return idx === -1 ? bands.length : idx;
}

// An empty band borrows the nearest filled band (shorter distance first), so a
// half-filled table still prices.
function rateForBand(rates, idx) {
  if (rates[idx] != null) return rates[idx];
  for (let step = 1; step < rates.length; step++) {
    if (rates[idx - step] != null) return rates[idx - step];
    if (rates[idx + step] != null) return rates[idx + step];
  }
  return null;
}

/** The table's per-km rate for the band a distance falls into. */
export function getRatePerKm(pricing, vehicleKey, distanceKm) {
  const rates = pricing?.vehicles?.[vehicleKey]?.rates || [];
  return rateForBand(rates, bandIndexForDistance(pricing?.bands || [], distanceKm));
}

// Fare before the surcharge and the minimum: bound × rate at each bound (never
// below the previous bound's fare), a straight line between two bounds.
function baseFare(pricing, vehicleKey, distanceKm) {
  const bands = pricing?.bands || [];
  const rates = pricing?.vehicles?.[vehicleKey]?.rates || [];
  const d = Math.max(0, Number(distanceKm) || 0);
  let prevBound = 0;
  let prevFare = 0;
  for (let i = 0; i < bands.length; i++) {
    const rate = rateForBand(rates, i);
    if (rate == null) return null;
    const fare = Math.max(prevFare, bands[i] * rate);
    if (d <= bands[i]) return prevFare + ((fare - prevFare) * (d - prevBound)) / (bands[i] - prevBound);
    prevBound = bands[i];
    prevFare = fare;
  }
  const lastRate = rateForBand(rates, bands.length);
  return lastRate == null ? null : prevFare + (d - prevBound) * lastRate;
}

/** Total fare in GEL, or null when the vehicle has no rates at all. */
export function getTransferFare(pricing, vehicleKey, distanceKm, { isSvaneti = false } = {}) {
  let raw = baseFare(pricing, vehicleKey, distanceKm);
  if (raw == null) return null;
  if (isSvaneti) raw *= 1 + (pricing.svanetiSurchargePct || 0) / 100;
  return Math.max(pricing.vehicles[vehicleKey]?.minFare || 0, Math.round(raw));
}

/**
 * Bounds where the table prices a longer trip below a shorter one, e.g.
 * 30 km × 10 ₾ = 300 ₾ but 50 km × 2.5 ₾ = 125 ₾. The fare stays at the
 * higher amount there; the admin panel lists these so the rates can be fixed.
 */
export function findFareDrops(pricing, vehicleKey) {
  const bands = pricing?.bands || [];
  const rates = pricing?.vehicles?.[vehicleKey]?.rates || [];
  const drops = [];
  let high = { bound: 0, fare: 0 };
  bands.forEach((bound, i) => {
    const rate = rateForBand(rates, i);
    if (rate == null) return;
    const fare = bound * rate;
    if (fare < high.fare) drops.push({ bound, fare: Math.round(fare), prevBound: high.bound, prevFare: Math.round(high.fare) });
    else high = { bound, fare };
  });
  return drops;
}

/** "0–50", "50–100", …, "300+" labels for each rate slot. */
export function bandLabels(bands) {
  const labels = bands.map((bound, i) => `${i === 0 ? 0 : bands[i - 1]}–${bound}`);
  labels.push(`${bands.length ? bands[bands.length - 1] : 0}+`);
  return labels;
}
