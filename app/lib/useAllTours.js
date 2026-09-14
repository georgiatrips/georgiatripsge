"use client";

import { useMemo, useEffect, useState, useRef } from "react";
import { listFirestoreTours, normalizeFirestoreTour } from "./toursFirestore";
import { useLanguage } from "./i18n/LanguageContext";

// Module-level cache for raw Firestore documents to avoid repeated fetches
let cachedRawTours = null;
let cachePromise = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let cacheTimestamp = 0;

/**
 * Returns ALL tours shown across the site with caching.
 * Matches local language dynamically.
 */
export function useAllTours() {
  const { lang } = useLanguage();
  const [firestoreTours, setFirestoreTours] = useState(cachedRawTours ?? []);
  const [loading, setLoading] = useState(!cachedRawTours);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // If we have a fresh cache, use it immediately
    if (cachedRawTours && Date.now() - cacheTimestamp < CACHE_TTL) {
      setFirestoreTours(cachedRawTours);
      setLoading(false);
      return;
    }

    // If a fetch is already in progress, reuse it
    if (cachePromise) {
      cachePromise.then((tours) => {
        if (mountedRef.current) {
          setFirestoreTours(tours);
          setLoading(false);
        }
      });
      return;
    }

    cachePromise = (async () => {
      try {
        const list = await listFirestoreTours();
        cachedRawTours = list;
        cacheTimestamp = Date.now();
        return list;
      } catch (err) {
        console.error("Firestore tours load failed:", err);
        return [];
      } finally {
        cachePromise = null;
      }
    })();

    cachePromise.then((tours) => {
      if (mountedRef.current) {
        setFirestoreTours(tours);
        setLoading(false);
      }
    });

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const allTours = useMemo(() => {
    return firestoreTours.map((t) => normalizeFirestoreTour(t, lang)).filter(Boolean);
  }, [firestoreTours, lang]);

  return { allTours, firestoreTours, loading };
}