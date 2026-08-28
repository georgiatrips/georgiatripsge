"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

const CurrencyContext = createContext(null);

const STORAGE_KEY = "gt_currency";

export const CURRENCY_RATES = {
  GEL: { code: "GEL", symbol: "₾", rate: 1.0, label: "GEL (₾)", name: "GEL", icon: "₾" },
  USD: { code: "USD", symbol: "$", rate: 0.37, label: "USD ($)", name: "USD", icon: "$" },
  EUR: { code: "EUR", symbol: "€", rate: 0.34, label: "EUR (€)", name: "EUR", icon: "€" },
};

/**
 * Intelligent Price Formatter & Converter
 * Converts numeric amounts or genuine price strings (e.g. "₾100/კაცი", "50 GEL", "₾50-დან")
 * according to target currency (GEL, USD, EUR) and language.
 */
export function formatPrice(priceVal, targetCurrency = "GEL", lang = "ka") {
  if (priceVal === null || priceVal === undefined || priceVal === "") return "";

  const curr = CURRENCY_RATES[targetCurrency] || CURRENCY_RATES.GEL;
  const rate = curr.rate;
  const symbol = curr.symbol;

  // Helper for language-specific suffixes
  const personSuffix =
    lang === "en" ? "/person" : lang === "ru" ? "/чел" : lang === "tr" ? "/kişi" : lang === "ar" ? "/شخص" : "/კაცი";

  // If passed a pure number
  if (typeof priceVal === "number") {
    if (priceVal === 0) return `0 ${symbol}`;
    const converted = Math.round(priceVal * rate);
    if (curr.code === "GEL") return `₾${converted}`;
    if (curr.code === "USD") return `$${converted}`;
    if (curr.code === "EUR") return `€${converted}`;
    return `${converted} ${curr.code}`;
  }

  const str = String(priceVal).trim();
  if (!str) return "";

  // Guard against non-price strings: Dates, Phone numbers, Times, UUIDs
  if (
    /^\+?\d{2,4}[\s\d-]{6,}$/.test(str) || // Phone number
    /^\d{4}-\d{2}-\d{2}/.test(str) || // ISO date
    /^\d{1,2}\.\d{1,2}(\.\d{2,4})?$/.test(str) || // Date dot format
    /^\d{1,2}:\d{2}/.test(str) // Time format
  ) {
    return str;
  }

  // Check if string contains currency indicator or is a plain price number string
  const isExplicitPrice =
    /[₾$€]|GEL|USD|EUR|ლარი|კაცი|person|чел|kişi|شخص|-დან|from|от|من/i.test(str) ||
    /^\d+(\.\d+)?$/.test(str);

  if (!isExplicitPrice) {
    return str;
  }

  // Extract the primary numeric price value
  const numMatch = str.match(/(\d+(?:\.\d+)?)/);
  if (!numMatch) return str;

  const rawNum = parseFloat(numMatch[0]);
  if (isNaN(rawNum)) return str;

  const convertedNum = Math.round(rawNum * rate);

  // Check for person / per group / from modifiers
  const isPerPerson = /კაცი|person|чел|kişi|شخص/i.test(str);
  const isFrom = /-დან|from|от|من/i.test(str);

  let formatted = "";
  if (curr.code === "GEL") formatted = `₾${convertedNum}`;
  else if (curr.code === "USD") formatted = `$${convertedNum}`;
  else if (curr.code === "EUR") formatted = `€${convertedNum}`;
  else formatted = `${convertedNum} ${curr.code}`;

  if (isFrom) {
    if (lang === "en") formatted = `From ${formatted}`;
    else if (lang === "ru") formatted = `от ${formatted}`;
    else if (lang === "tr") formatted = `${formatted}'den başlayan`;
    else if (lang === "ar") formatted = `من ${formatted}`;
    else formatted = `${formatted}-დან`;
  }

  if (isPerPerson) {
    formatted += personSuffix;
  }

  return formatted;
}

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState("GEL");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && CURRENCY_RATES[saved]) {
        setCurrencyState(saved);
      }
    } catch (_) {}
    setHydrated(true);
  }, []);

  const changeCurrency = useCallback((newCurrency) => {
    if (!CURRENCY_RATES[newCurrency]) return;
    setCurrencyState(newCurrency);
    try {
      localStorage.setItem(STORAGE_KEY, newCurrency);
    } catch (_) {}
  }, []);

  const format = useCallback(
    (priceVal, lang = "ka") => {
      return formatPrice(priceVal, currency, lang);
    },
    [currency]
  );

  const value = {
    currency,
    setCurrency: changeCurrency,
    format,
    rates: CURRENCY_RATES,
    activeSymbol: CURRENCY_RATES[currency]?.symbol || "₾",
    activeRate: CURRENCY_RATES[currency]?.rate || 1.0,
    hydrated,
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    return {
      currency: "GEL",
      setCurrency: () => {},
      format: (val, lang) => formatPrice(val, "GEL", lang || "ka"),
      rates: CURRENCY_RATES,
      activeSymbol: "₾",
      activeRate: 1.0,
      hydrated: false,
    };
  }
  return ctx;
}
