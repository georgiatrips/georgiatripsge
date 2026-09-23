/**
 * Transfer pricing — distance bands × vehicles, managed from the admin panel
 * (Firestore settings/transfer_pricing). Pure data helpers: no Firebase here,
 * so the public calculator can import this without pulling in the SDK.
 *
 * A trip is priced at the per-km rate of the band its whole distance falls
 * into (not marginally per band): 120 km by sedan = 120 × the 100–150 km rate.
 * Band i covers (bands[i-1], bands[i]] km; the last rate covers everything
 * above the last bound ("300+ km").
 */

export const TRANSFER_VEHICLE_KEYS = ["sedan", "minivan", "jeep", "sprinter"];

export const DEFAULT_TRANSFER_PRICING = {
  bands: [50, 100, 150, 200, 300],
  vehicles: {
    sedan: { rates: [2.5, 2.2, 2.0, 1.8, 1.7, 1.2], minFare: 35 },
    minivan: { rates: [2.0, 2.0, 2.0, 2.0, 2.0, 2.0], minFare: 55 },
    jeep: { rates: [2.5, 2.5, 2.5, 2.5, 2.5, 2.5], minFare: 65 },
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
 * (null = not filled in yet).
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
    vehicles[key] = {
      rates,
      minFare: toNumberOrNull(v.minFare) ?? 0,
    };
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

/**
 * Per-km rate for a vehicle at a distance. An empty band borrows the nearest
 * filled band (shorter distance first), so a half-filled table still prices.
 */
export function getRatePerKm(pricing, vehicleKey, distanceKm) {
  const rates = pricing?.vehicles?.[vehicleKey]?.rates || [];
  const idx = bandIndexForDistance(pricing?.bands || [], distanceKm);
  if (rates[idx] != null) return rates[idx];
  for (let step = 1; step < rates.length; step++) {
    if (rates[idx - step] != null) return rates[idx - step];
    if (rates[idx + step] != null) return rates[idx + step];
  }
  return null;
}

/** Total fare in GEL, or null when the vehicle has no rates at all. */
export function getTransferFare(pricing, vehicleKey, distanceKm, { isSvaneti = false } = {}) {
  const rate = getRatePerKm(pricing, vehicleKey, distanceKm);
  if (rate == null) return null;
  let raw = Math.max(0, Number(distanceKm) || 0) * rate;
  if (isSvaneti) raw *= 1 + (pricing.svanetiSurchargePct || 0) / 100;
  const minFare = pricing.vehicles?.[vehicleKey]?.minFare || 0;
  return Math.max(minFare, Math.round(raw));
}

/** "0–50", "50–100", …, "300+" labels for each rate slot. */
export function bandLabels(bands) {
  const labels = bands.map((bound, i) => `${i === 0 ? 0 : bands[i - 1]}–${bound}`);
  labels.push(`${bands.length ? bands[bands.length - 1] : 0}+`);
  return labels;
}
