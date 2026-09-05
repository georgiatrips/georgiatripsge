"use client";

import "./home.css";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomeHeroSection from "./components/home/HomeHeroSection";
import HomeAboutSection from "./components/home/HomeAboutSection";
import HomePopularToursSection from "./components/home/HomePopularToursSection";
import HomeCategoriesSection from "./components/home/HomeCategoriesSection";
import HomeDestinationsSection from "./components/home/HomeDestinationsSection";
import HomeScheduleSection from "./components/home/HomeScheduleSection";
import HomeFleetSection from "./components/home/HomeFleetSection";
import HomeGallerySection from "./components/home/HomeGallerySection";
import HomeMapSection from "./components/home/HomeMapSection";
import HomeFaqSection from "./components/home/HomeFaqSection";
import HomeWeatherSection from "./components/home/HomeWeatherSection";
import { useAllTours } from "./lib/useAllTours";
import { groupDepartureDates, asLocalizedText } from "./lib/toursFirestore";
import { listPlaces } from "./lib/placesFirestore";
import { listPostSummaries } from "./lib/postsFirestore";
import { useLanguage } from "./lib/i18n/LanguageContext";
import { WA_LINK, bookTourOnWhatsApp, getFaqs } from "./lib/shared";
import { DEFAULT_WEATHER_DATA as WEATHER_DATA } from "./lib/weatherFallback";

const fetcher = (url) => fetch(url).then((r) => r.json());

// Map Firestore tourSection values → home page themed section ids
const FIREBASE_SECTION_TO_HOME = {
  "mountains-nature": "nature",
  "batumi-city": "culture",
  "wine": "taste",
  "exotic-parks": "adventure",
  "sea": "luxury",
  "seasonal": "seasons",
};

export default function Home() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [navScrolled, setNavScrolled] = useState(false);
  const [activeMapRegion, setActiveMapRegion] = useState(null);
  const [activeWeatherTab, setActiveWeatherTab] = useState("tbilisi");
  const [openFaq, setOpenFaq] = useState(0);
  const [popTourSlide, setPopTourSlide] = useState(0);
  const [places, setPlaces] = useState([]);
  const [posts, setPosts] = useState([]);

  const faqs = useMemo(() => getFaqs(lang), [lang]);

  useEffect(() => {
    let active = true;
    listPlaces()
      .then((items) => { if (active) setPlaces(items); })
      .catch((error) => console.error("Failed to load places for homepage", error));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    listPostSummaries(6)
      .then((items) => { if (active) setPosts(items); })
      .catch((error) => console.error("Failed to load posts for homepage", error));
    return () => { active = false; };
  }, []);

  const popularPlaces = useMemo(
    () => places.filter((place) => place.isPopular).slice(0, 2),
    [places]
  );
  const latestPlaces = useMemo(() => {
    return [...places]
      .sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const bTime = b.createdAt?.toMillis?.() || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return bTime - aTime;
      })
      .slice(0, 6);
  }, [places]);

  // Static tours + Firestore tours added from Admin panel
  const { allTours } = useAllTours();

  const allAvailableDates = useMemo(() => {
    const datesSet = new Set();
    allTours.forEach((tour) => {
      if (tour.dates) tour.dates.forEach((d) => datesSet.add(d));
      if (tour.departureDates) tour.departureDates.forEach((entry) => {
        const iso = typeof entry === "string" ? entry : entry?.date;
        if (iso) datesSet.add(iso);
      });
    });
    return Array.from(datesSet);
  }, [allTours]);

  const popularTours = useMemo(() => allTours.filter((tour) => tour.isPopular), [allTours]);
  const popularTourPairs = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < popularTours.length; i += 2) {
      pairs.push(popularTours.slice(i, i + 2));
    }
    return pairs;
  }, [popularTours]);

  const sectionsData = useMemo(() => [
    { id: "popular", title: t("home.sectionPopular"), tours: [] },
    { id: "nature", title: t("home.sectionNature"), tours: [] },
    { id: "culture", title: t("home.sectionCulture"), tours: [] },
    { id: "taste", title: t("home.sectionTaste"), tours: [] },
    { id: "adventure", title: t("home.sectionAdventure"), tours: [] },
    { id: "luxury", title: t("home.sectionLuxury"), tours: [] },
    { id: "seasons", title: t("home.sectionSeasons"), tours: [] },
  ], [t]);

  const dynamicSections = useMemo(() => {
    const map = new Map(sectionsData.map((s) => [s.id, { ...s, tours: [] }]));
    allTours.forEach((tour) => {
      let targetSectionId = FIREBASE_SECTION_TO_HOME[tour.tourSection] || "popular";
      if (!map.has(targetSectionId)) targetSectionId = "popular";
      map.get(targetSectionId).tours.push(tour);
    });
    return Array.from(map.values()).filter((s) => s.tours.length > 0);
  }, [allTours, sectionsData]);

  const scheduleTours = useMemo(() => {
    return allTours.map((tour) => {
      let months = [];
      if (tour.departureDates && tour.departureDates.length > 0) {
        months = groupDepartureDates(tour.departureDates, lang).map((m) => ({
          monthName: m.monthName,
          dates: m.dates.map((d) => d.chip),
        }));
      } else if (tour.dates && tour.dates.length > 0) {
        months = [{ monthName: "იანვარი", dates: tour.dates }];
      }
      return {
        id: tour.id,
        title: tour.title,
        desc: tour.desc,
        locationShort: tour.destinationLabel || tour.destination || tour.location || "",
        priceGroup: tour.priceGroup ? `₾${tour.priceGroup}` : "₾0",
        priceNote: tour.priceNote || t("popular.perPerson"),
        months,
      };
    }).filter((t) => t.months.length > 0);
  }, [allTours, lang, t]);

  // Live weather from Open-Meteo API
  const { data: liveWeather, error: weatherError, isLoading: weatherLoading } = useSWR(
    "/api/weather",
    fetcher,
    { revalidateOnFocus: false, revalidateIfStale: false, dedupingInterval: 300000 }
  );

  const weatherData = useMemo(() => {
    if (liveWeather && !weatherError && Object.keys(liveWeather).length > 0) {
      return liveWeather;
    }
    return WEATHER_DATA;
  }, [liveWeather, weatherError]);

  const isLiveWeather = !!(liveWeather && !weatherError && Object.keys(liveWeather).length > 0);

  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleTourClick = useCallback((tour) => {
    router.push(`/tours/${encodeURIComponent(tour.id)}`);
  }, [router]);

  const handleBookNow = useCallback((title, price) => {
    bookTourOnWhatsApp(title, price, lang);
  }, [lang]);

  return (
    <>
      <Navbar active="home" />

      {/* 1. Hero Section */}
      <HomeHeroSection allAvailableDates={allAvailableDates} />

      {/* 2. About Us Section */}
      <HomeAboutSection />

      {/* 3. Popular Tours & Themed Sections */}
      <HomePopularToursSection
        popularTourPairs={popularTourPairs}
        dynamicSections={dynamicSections}
        popTourSlide={popTourSlide}
        setPopTourSlide={setPopTourSlide}
        handleTourClick={handleTourClick}
      />

      {/* 4. Tour Categories */}
      <HomeCategoriesSection />

      {/* 5. Popular Destinations */}
      <HomeDestinationsSection
        popularPlaces={popularPlaces}
        latestPlaces={latestPlaces}
      />

      {/* 6. Tour Schedule & Free Dates */}
      <HomeScheduleSection
        scheduleTours={scheduleTours}
        handleTourClick={handleTourClick}
        handleBookNow={handleBookNow}
      />

      {/* 7. Transport & Fleet Section */}
      <HomeFleetSection handleBookNow={handleBookNow} />

      {/* 8. Gallery & Facebook Posts */}
      <HomeGallerySection posts={posts} />

      {/* 9. Interactive Georgia Map */}
      <HomeMapSection
        activeMapRegion={activeMapRegion}
        setActiveMapRegion={setActiveMapRegion}
      />

      {/* 10. FAQ Section */}
      <HomeFaqSection
        faqs={faqs}
        openFaq={openFaq}
        setOpenFaq={setOpenFaq}
      />

      {/* 11. Weather Section */}
      <HomeWeatherSection
        weatherData={weatherData}
        isLiveWeather={isLiveWeather}
        weatherLoading={weatherLoading}
        activeWeatherTab={activeWeatherTab}
        setActiveWeatherTab={setActiveWeatherTab}
      />

      {/* Back to top button */}
      <button
        className={`back-to-top ${navScrolled ? "visible" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label={t("popular.backToTop")}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>

      {/* Floating WhatsApp button */}
      <div className="floating-wa">
        <span className="floating-wa-tooltip">{t("popular.whatsappTooltip")}</span>
        <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="floating-wa-btn" aria-label="WhatsApp — GeorgiaTrips">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12.003 2C6.477 2 2 6.477 2 12c0 1.989.574 3.842 1.563 5.406L2 22l4.682-1.528A9.956 9.956 0 0012.003 22C17.529 22 22 17.523 22 12S17.529 2 12.003 2zm0 18c-1.676 0-3.26-.455-4.627-1.247l-.331-.198-3.454 1.128 1.156-3.366-.215-.348A7.957 7.957 0 014.003 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" />
          </svg>
        </a>
      </div>

      <Footer />
    </>
  );
}
