import { NextResponse } from "next/server";

const TTL_MS = 6 * 60 * 60 * 1000;
const FALLBACK_RATES = { USD: 0.37, EUR: 0.34, AED: 1.36, TRY: 12.5, SAR: 1.39 };

function getCache() {
  if (!globalThis.__georgiaTripsCurrencyCache) {
    globalThis.__georgiaTripsCurrencyCache = { updatedAt: 0, rates: FALLBACK_RATES };
  }
  return globalThis.__georgiaTripsCurrencyCache;
}

export async function GET() {
  const cache = getCache();
  const now = Date.now();

  if (now - cache.updatedAt >= TTL_MS) {
    try {
      const response = await fetch("https://open.er-api.com/v6/latest/GEL", {
        next: { revalidate: 21600 },
      });
      const data = await response.json();
      if (response.ok && data?.rates) {
        cache.rates = {
          USD: data.rates.USD || FALLBACK_RATES.USD,
          EUR: data.rates.EUR || FALLBACK_RATES.EUR,
          AED: data.rates.AED || FALLBACK_RATES.AED,
          TRY: data.rates.TRY || FALLBACK_RATES.TRY,
          SAR: data.rates.SAR || FALLBACK_RATES.SAR,
        };
        cache.updatedAt = now;
      }
    } catch (_) {
      // Keep the last successful values (or safe fallbacks) during an outage.
      cache.updatedAt = now;
    }
  }

  return NextResponse.json(
    { base: "GEL", rates: cache.rates, updatedAt: cache.updatedAt || null },
    { headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" } }
  );
}
