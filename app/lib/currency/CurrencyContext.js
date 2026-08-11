"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

const CurrencyContext = createContext(null);

const STORAGE_KEY = "gt_currency";

export const CURRENCY_RATES = {
  GEL: { code: "GEL", symbol: "₾", rate: 1.0, label: "GEL (₾)", name: "ლარი" },
  USD: { code: "USD", symbol: "$", rate: 0.37, label: "USD ($)", name: "USD" },
  EUR: { code: "EUR", symbol: "€", rate: 0.34, label: "EUR (€)", name: "EUR" },
  AED: { code: "AED", symbol: "AED", rate: 1.36, label: "AED", name: "AED" },
};

/**
 * Intelligent Price Formatter & Converter
 * Converts numeric amounts or raw price strings (e.g. "₾100/კაცი", "50 GEL", "₾50-დან")
 * according to target currency and language.
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
    return `${converted} AED`;
  }

  const str = String(priceVal).trim();
  if (!str) return "";

  // Check if string contains numbers
  const numberRegex = /(\d+)/g;
  const matches = str.match(numberRegex);

  if (!matches || matches.length === 0) {
    return str;
  }

  let result = str;

  // Clean out GEL symbol or words before replacing converted numbers
  result = result.replace(/₾/g, "").replace(/GEL/gi, "").replace(/ლარი/g, "");

  // Convert numbers
  matches.forEach((numStr) => {
    const num = parseInt(numStr, 10);
    if (!isNaN(num)) {
      const convertedNum = Math.round(num * rate);
      result = result.replace(numStr, String(convertedNum));
    }
  });

  result = result.trim();

  // Handle /კაცი, /person, /чел, /kişi, /شخص replacement
  result = result
    .replace(/\/კაცი/g, personSuffix)
    .replace(/ \/ კაცი/g, ` ${personSuffix}`)
    .replace(/კაცი/g, personSuffix.replace("/", "").trim())
    .replace(/person/gi, personSuffix.replace("/", "").trim())
    .replace(/чел/gi, personSuffix.replace("/", "").trim())
    .replace(/kişi/gi, personSuffix.replace("/", "").trim())
    .replace(/شخص/gi, personSuffix.replace("/", "").trim());

  // Handle "-დან", "From", "от", "من"
  if (result.includes("-დან")) {
    if (lang === "en") {
      result = "From " + result.replace("-დან", "").trim();
    } else if (lang === "ru") {
      result = "от " + result.replace("-დან", "").trim();
    } else if (lang === "ar") {
      result = "من " + result.replace("-დან", "").trim();
    }
  }

  // Prepend symbol if not already present
  if (curr.code === "GEL") {
    if (!result.includes("₾")) result = `₾${result}`;
  } else if (curr.code === "USD") {
    if (!result.includes("$")) result = `$${result}`;
  } else if (curr.code === "EUR") {
    if (!result.includes("€")) result = `€${result}`;
  } else if (curr.code === "AED") {
    if (!result.includes("AED")) result = `${result} AED`;
  }

  return result;
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
