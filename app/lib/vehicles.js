// Fleet shared by transfers and private tours. Kept separate from the transfer
// route data so the tour page can import it without the location list.

export const VEHICLE_KEYS = ["sedan", "minivan", "jeep", "sprinter"];

export const VEHICLES = {
  sedan: {
    key: "sedan",
    nameKa: "სედანი",
    capacityPax: 3,
    capacityBags: 2,
    img: "/1car.webp",
  },
  minivan: {
    key: "minivan",
    nameKa: "მინივენი",
    capacityPax: 6,
    capacityBags: 5,
    img: "/2car.webp",
  },
  jeep: {
    key: "jeep",
    nameKa: "ჯიპი / SUV (4x4)",
    capacityPax: 4,
    capacityBags: 3,
    img: "/3car.webp",
  },
  sprinter: {
    key: "sprinter",
    nameKa: "VIP სპრინტერი",
    capacityPax: 16,
    capacityBags: 14,
    img: "/4car.webp",
  },
};

/**
 * Private-tour prices per vehicle from a tour document: { sedan: 350, … }
 * with only the vehicles the tour is offered in (a positive price).
 */
export function getPrivateVehiclePrices(tour) {
  const src = tour?.privateVehiclePrices;
  if (!src || typeof src !== "object") return {};
  const prices = {};
  for (const key of VEHICLE_KEYS) {
    const n = Number(src[key]);
    if (Number.isFinite(n) && n > 0) prices[key] = n;
  }
  return prices;
}

/** Cheapest offered vehicle that seats `people`, or null. */
export function cheapestVehicleFor(prices, people) {
  let best = null;
  for (const key of VEHICLE_KEYS) {
    if (prices[key] == null || VEHICLES[key].capacityPax < people) continue;
    if (!best || prices[key] < prices[best]) best = key;
  }
  return best;
}
