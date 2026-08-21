"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { MAP_PATHS } from "./mapPaths";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import DatePicker from "./components/DatePicker";
import HeroMosaicGrid from "./components/HeroMosaicGrid";
import { useAllTours } from "./lib/useAllTours";
import { groupDepartureDates, asLocalizedText, translateDuration, translateLocation, translateMonthName, formatLocationTag } from "./lib/toursFirestore";
import { listPlaces } from "./lib/placesFirestore";
import { GEORGIA_REGIONS, formatRegionName } from "./lib/placesMeta";
import { listPostSummaries } from "./lib/postsFirestore";
import { useLanguage } from "./lib/i18n/LanguageContext";
import { useCurrency } from "./lib/currency/CurrencyContext";
import { formatPriceStr } from "./lib/i18n/formatPriceStr";
import { LocationIcon, CalendarIcon, UsersIcon, SearchIcon, ClockIcon } from "./components/Icons";
import { BrandLogo, WA_LINK, WA_NUMBER, bookTourOnWhatsApp, getFaqs } from "./lib/shared";
import { createBooking } from "./lib/bookingsFirestore";
import { DEFAULT_WEATHER_DATA as WEATHER_DATA } from "./lib/weatherFallback";

const fetcher = (url) => fetch(url).then((r) => r.json());

const truncateText = (value, maxLength = 100) => {
  const text = String(value || "").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}...` : text;
};

const HERO_SLIDES = [
  { image: "/hero.png", label: "Kazbegi, Georgia" },
  { image: "/tbilisi.png", label: "Tbilisi, Georgia" },
  { image: "/gudauri.png", label: "Gudauri, Georgia" },
  { image: "/mestia.png", label: "Svaneti, Georgia" },
  { image: "/batumi.png", label: "Batumi, Georgia" }
];

const ICONS = {
  sun: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fab418" strokeWidth="2" strokeLinecap="round" className="weather-svg-sun" aria-hidden="true"><circle cx="12" cy="12" r="5" fill="#fab418" fillOpacity="0.1" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>,
  "cloud-sun": <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5" stroke="#fab418" /><path d="M5.5 8.5 4 7M12.5 8.5 14 7M9 3v2" stroke="#fab418" /><path d="M20 17.5A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" fill="var(--blue)" fillOpacity="0.1" stroke="var(--blue)" /></svg>,
  rain: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" fill="var(--blue)" fillOpacity="0.1" /><path d="m8 18-1 3m6-3-1 3m6-3-1 3" /></svg>,
  storm: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" fill="var(--text-mute)" fillOpacity="0.1" stroke="var(--text-mute)" /><path d="m13 12-4 5h3l-2 5 5-7h-3z" fill="#fab418" stroke="#fab418" /></svg>,
};

// Animated counter that starts when it scrolls into view
const CountUp = ({ end, suffix = "", duration = 1800 }) => {
  const ref = useRef(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let rafId;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(Math.round(eased * end));
          if (progress < 1) rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [end, duration]);

  return (
    <span ref={ref} className="stat-value">
      {value}
      <em>{suffix}</em>
    </span>
  );
};

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
  const { t, lang, isEnglish, isRussian } = useLanguage();
  const { format } = useCurrency();
  const [navScrolled, setNavScrolled] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  const [previousHeroSlide, setPreviousHeroSlide] = useState(0);
  const [isHeroTransitioning, setIsHeroTransitioning] = useState(false);
  const heroTransitionTimeout = useRef(null);

  const goToHeroSlide = useCallback((nextIdx) => {
    if (isHeroTransitioning || nextIdx === currentHeroSlide) return;
    setPreviousHeroSlide(currentHeroSlide);
    setIsHeroTransitioning(true);
    setCurrentHeroSlide(nextIdx);
    if (heroTransitionTimeout.current) clearTimeout(heroTransitionTimeout.current);
    heroTransitionTimeout.current = setTimeout(() => {
      setIsHeroTransitioning(false);
    }, 1600);
  }, [currentHeroSlide, isHeroTransitioning]);

  const [showAllSocial, setShowAllSocial] = useState(false);
  const [activeMapRegion, setActiveMapRegion] = useState(null);
  const [activeWeatherTab, setActiveWeatherTab] = useState("tbilisi");
  const [openFaq, setOpenFaq] = useState(0);

  const faqs = useMemo(() => getFaqs(lang), [lang]);

  const [popTourSlide, setPopTourSlide] = useState(0);
  const [places, setPlaces] = useState([]);
  const [posts, setPosts] = useState([]);

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
  const { allTours, firestoreTours } = useAllTours();

  // Use the normalized version here. Admin-created tours store gallery entries
  // with metadata objects ({ url, locationTitle }); passing those raw values to
  // next/image can result in an empty img src and prevent the photo from loading.
  const popularTours = useMemo(() => allTours.filter((tour) => tour.isPopular), [allTours]);
  const popularTourPairs = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < popularTours.length; i += 2) {
      pairs.push(popularTours.slice(i, i + 2));
    }
    return pairs;
  }, [popularTours]);

  const categoriesList = useMemo(() => [
    {
      title: t("home.cat1Title"),
      desc: t("home.cat1Desc"),
      link: "#popular",
    },
    {
      title: t("home.cat2Title"),
      desc: t("home.cat2Desc"),
      link: "#hotels",
    },
    {
      title: t("home.cat3Title"),
      desc: t("home.cat3Desc"),
      link: "#booking",
    },
    {
      title: t("home.cat4Title"),
      desc: t("home.cat4Desc"),
      link: "#booking",
    },
  ], [t]);

  const sectionsData = useMemo(() => [
    { id: "popular", title: t("home.sectionPopular"), tours: [] },
    { id: "nature", title: t("home.sectionNature"), tours: [] },
    { id: "culture", title: t("home.sectionCulture"), tours: [] },
    { id: "taste", title: t("home.sectionTaste"), tours: [] },
    { id: "adventure", title: t("home.sectionAdventure"), tours: [] },
    { id: "luxury", title: t("home.sectionLuxury"), tours: [] },
    { id: "seasons", title: t("home.sectionSeasons"), tours: [] },
  ], [t]);

  // Build the themed sections from the same normalized data used by every
  // public tour card. This keeps image URLs, localized fields and IDs valid
  // regardless of whether the Firestore record is old or newly created.
  const dynamicSections = useMemo(() => {
    if (allTours.length === 0) return sectionsData;
    return sectionsData.map((sec) => {
      if (sec.id === "popular") return sec;
      const dynamicTours = allTours.filter(
        (tour) => FIREBASE_SECTION_TO_HOME[tour.tourSection || tour.category] === sec.id
      );
      if (dynamicTours.length === 0) return null;
      return { ...sec, tours: dynamicTours };
    }).filter(Boolean);
  }, [allTours, sectionsData]);

  // Group tours created in the admin panel into the public schedule.
  // Their departure dates are stored as ISO dates in Firestore, so convert
  // them to the same month/date shape.
  const scheduleTours = useMemo(() => {
    const firestoreScheduleTours = firestoreTours
      .filter((tour) => tour.hasGroup && tour.departureDates?.length > 0)
      .map((tour) => ({
        id: tour.id,
        title: tour.title,
        priceGroup: tour.priceGroup || tour.pricePrivate || "",
        priceNote: tour.hasPrivate ? t("tourDetail.otherDatesNote") : "",
        locationShort: translateLocation(tour.destinationLabel || tour.destination, lang),
        desc: asLocalizedText(tour.desc, lang),
        months: groupDepartureDates(tour.departureDates).map((month) => ({
          ...month,
          dates: month.dates.map((date) => date.chip),
        })),
      }))
      .filter((tour) => tour.months.length > 0);

    return firestoreScheduleTours;
  }, [firestoreTours, lang, t]);

  useEffect(() => {
    if (popularTourPairs.length < 2) return undefined;
    const popTourInterval = setInterval(() => {
      setPopTourSlide((prev) => (prev + 1) % popularTourPairs.length);
    }, 3500);
    return () => clearInterval(popTourInterval);
  }, [popularTourPairs.length]);

  const router = useRouter();
  const [heroDestination, setHeroDestination] = useState("all");
  const [heroDate, setHeroDate] = useState("");
  const [heroFormat, setHeroFormat] = useState("all");

  const allAvailableDates = useMemo(() => {
    const datesSet = new Set();
    allTours.forEach((t) => {
      if (t.dates) t.dates.forEach((d) => datesSet.add(d));
      if (t.departureDates) t.departureDates.forEach((entry) => {
        const iso = typeof entry === "string" ? entry : entry?.date;
        if (iso) datesSet.add(iso);
      });
    });
    return Array.from(datesSet);
  }, [allTours]);

  const handleHeroSearch = (e) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (heroDestination && heroDestination !== "all") params.set("destination", heroDestination);
    if (heroFormat && heroFormat !== "all") params.set("format", heroFormat);
    if (heroDate) params.set("date", heroDate);
    const qStr = params.toString();
    router.push(`/tours${qStr ? `?${qStr}` : ""}`);
  };

  // Live weather — refreshes every 15 min, falls back to static data
  const { data: weatherResp, isLoading: weatherLoading } = useSWR("/api/weather", fetcher, {
    refreshInterval: 900000,
    revalidateOnFocus: false,
  });
  const weatherData = weatherResp?.data || WEATHER_DATA;
  const isLiveWeather = Boolean(weatherResp?.data);

  const [formData, setFormData] = useState({
    name: "",
    country: "",
    dateFrom: "",
    dateTo: "",
    people: "",
    budget: "",
    notes: ""
  });

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const isScrolled = window.scrollY > 50;
          setNavScrolled((prev) => (prev !== isScrolled ? isScrolled : prev));
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Hero Background Slider Auto Play (7s)
    const heroInterval = setInterval(() => {
      goToHeroSlide((currentHeroSlide + 1) % HERO_SLIDES.length);
    }, 7000);

    return () => clearInterval(heroInterval);
  }, [currentHeroSlide, goToHeroSlide]);

  const handleBookNow = (tourTitle, tourPrice) => {
    bookTourOnWhatsApp(tourTitle, tourPrice, lang);
  };

  const handleTourClick = (tour) => {
    const id = tour.id || allTours.find((t) => t.title === tour.title)?.id || "promethe-martvili";
    router.push(`/tours/${id}`);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const { name, country, dateFrom, dateTo, people, budget, notes } = formData;
    const headers = {
      ka: "✈️ *GeorgiaTrips — ახალი ჯავშანი*",
      en: "✈️ *GeorgiaTrips — New Reservation Request*",
      ru: "✈️ *GeorgiaTrips — Новая заявка на бронирование*",
      tr: "✈️ *GeorgiaTrips — Yeni Rezervasyon Talebi*",
      ar: "✈️ *GeorgiaTrips — طلب حجز جديد*",
    };
    const labels = {
      ka: { name: "სახელი", country: "ქვეყანა", from: "გამგზავრება", to: "დაბრუნება", people: "მოგზაურები", budget: "ბიუჯეტი", notes: "შენიშვნა" },
      en: { name: "Name", country: "Country", from: "Departure", to: "Return", people: "Travelers", budget: "Budget", notes: "Notes" },
      ru: { name: "Имя", country: "Страна", from: "Отправление", to: "Возвращение", people: "Туристы", budget: "Бюджет", notes: "Примечание" },
      tr: { name: "İsim", country: "Ülke", from: "Gidiş", to: "Dönüş", people: "Kişi Sayısı", budget: "Bütçe", notes: "Not" },
      ar: { name: "الاسم", country: "الدولة", from: "المغادرة", to: "العودة", people: "عدد المسافرين", budget: "الميزانية", notes: "ملاحظات" },
    };
    const l = labels[lang] || labels.ka;

    // Save online booking request to Firestore
    createBooking({
      type: "custom_request",
      name: name.trim(),
      country: country.trim(),
      dateFrom,
      dateTo,
      people,
      budget,
      notes: notes.trim(),
      language: lang,
    });

    const msg = [
      headers[lang] || headers.ka,
      "",
      `👤 ${l.name}: ${name}`,
      country ? `🌍 ${l.country}: ${country}` : "",
      dateFrom ? `📅 ${l.from}: ${dateFrom}` : "",
      dateTo ? `📅 ${l.to}: ${dateTo}` : "",
      `👥 ${l.people}: ${people}`,
      budget ? `💰 ${l.budget}: ${budget}` : "",
      notes ? `📝 ${l.notes}: ${notes}` : "",
    ].filter(Boolean).join("\n");

    window.open(`${WA_LINK}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      {/* ==================== NAVIGATION ==================== */}
      <Navbar active="home" />

      {/* ==================== HERO — CINEMATIC ==================== */}
      <section className="hero" id="home">
        {HERO_SLIDES.map((slide, idx) => (
          <div
            key={idx}
            className={`hero-bg ${idx === currentHeroSlide ? "loaded active" : ""}`}
            style={{ backgroundImage: `url('${slide.image}')` }}
          ></div>
        ))}

        {/* 252-Box Blur & Opacity Mosaic Matrix Transition */}
        <HeroMosaicGrid
          isTransitioning={isHeroTransitioning}
          currentSlide={currentHeroSlide}
          outgoingImage={HERO_SLIDES[previousHeroSlide].image}
        />

        <div className="hero-content">
          <div className="hero-badge">
            <span>{t("hero.badge")}</span>
          </div>

          <h1 className="hero-title">
            {t("hero.titleLine1")}<br />
            <em>{t("hero.titleLine2")}</em>
          </h1>

          <div className="hero-locations">
            <span className="hero-loc-tag">{t("hero.kazbegi")}</span>
            <span className="hero-loc-divider"></span>
            <span className="hero-loc-tag">{t("hero.tbilisi")}</span>
            <span className="hero-loc-divider"></span>
            <span className="hero-loc-tag featured">{t("hero.batumi")}</span>
            <span className="hero-loc-divider"></span>
            <span className="hero-loc-tag">{t("hero.kakheti")}</span>
            <span className="hero-loc-divider"></span>
            <span className="hero-loc-tag">{t("hero.svaneti")}</span>
          </div>

          {/* Minimalist Quick Search Widget */}
          <div className="hero-search-bar">
            <div className="hero-search-field">
              <span className="hero-search-icon">
                <LocationIcon size={16} color="var(--teal)" />
              </span>
              <div className="hero-search-input-wrap">
                <label>{t("hero.destination")}</label>
                <select
                  className="hero-search-select"
                  value={heroDestination}
                  onChange={(e) => setHeroDestination(e.target.value)}
                >
                  <option value="all">{t("hero.allRegions")}</option>
                  {GEORGIA_REGIONS.map((region) => (
                    <option key={region} value={region}>{formatRegionName(region, lang)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="hero-search-divider" />

            <div className="hero-search-field"><span className="hero-search-icon"><CalendarIcon size={16} color="var(--teal)" /></span><div className="hero-search-input-wrap"><label>{t("hero.date")}</label><DatePicker value={heroDate} onChange={setHeroDate} availableDates={allAvailableDates} variant="hero" /></div></div>
            <div className="hero-search-divider" />
            <div className="hero-search-field"><span className="hero-search-icon"><UsersIcon size={16} color="var(--teal)" /></span><div className="hero-search-input-wrap"><label>{t("hero.tourFormat")}</label><select className="hero-search-select" value={heroFormat} onChange={(e) => setHeroFormat(e.target.value)}><option value="all">{t("hero.allFormats")}</option><option value="individual">{t("hero.individual")}</option><option value="group">{t("hero.group")}</option></select></div></div>
            <button type="button" onClick={handleHeroSearch} className="hero-search-btn"><SearchIcon size={16} color="currentColor" strokeWidth={2.5} /><span>{t("hero.search")}</span></button>
          </div>
        </div>
        <div className="hero-location-badge">
          <span className="loc-pin" aria-hidden="true">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--yellow)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
          </span>
          <span className="loc-text">{HERO_SLIDES[currentHeroSlide].label}</span>
        </div>
        <div className="hero-dots" role="tablist" aria-label="slides">{HERO_SLIDES.map((slide, idx) => <button key={idx} className={`hero-dot ${idx === currentHeroSlide ? "active" : ""}`} onClick={() => goToHeroSlide(idx)} aria-label={slide.label} aria-selected={idx === currentHeroSlide} role="tab" />)}</div>
      </section>
      <section className="about-section" id="about" aria-label="about"><div className="about-inner"><div className="about-photo-wrap"><div className="about-photo-frame"><Image src="/profile.png" alt="GeorgiaTrips travel company" fill style={{ objectFit: "cover", objectPosition: "center 35%" }} sizes="(max-width: 768px) 100vw, 50vw" priority /></div><div className="about-photo-accent" aria-hidden="true">GeorgiaTrips</div></div>
          {/*

                alt="GeorgiaTrips — პროფესიონალი სამოგზაურო კომპანია საქართველოში"
                fill
                style={{ objectFit: "cover", objectPosition: "center 35%" }}
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
            <div className="about-photo-accent" aria-hidden="true">GeorgiaTrips</div>
          </div>

          {/* Right — Text content */}
          <div className="about-text">
            <span className="about-eyebrow">{t("about.eyebrow")}</span>
            <h2 className="about-heading">
              {t("about.heading1")}<br />
              {t("about.heading2")}
            </h2>

            <p className="about-desc">
              {t("about.desc1")}
            </p>
            <p className="about-desc">
              {t("about.desc2")}
            </p>

            <ul className="about-checks" aria-label={t("about.eyebrow")}>
              <li><span className="about-check-icon" aria-hidden="true">✓</span>{t("about.check1")}</li>
              <li><span className="about-check-icon" aria-hidden="true">✓</span>{t("about.check2")}</li>
              <li><span className="about-check-icon" aria-hidden="true">✓</span>{t("about.check3")}</li>
              <li><span className="about-check-icon" aria-hidden="true">✓</span>{t("about.check4")}</li>
            </ul>

            <div className="about-socials" aria-label="სოციალური ქსელები">
              <a
                href="https://www.facebook.com/people/Georgia-Trips/61588059054976/"
                target="_blank"
                rel="noopener noreferrer"
                className="about-social-link about-social-fb"
                aria-label="Facebook — Georgia Trips"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                Facebook
              </a>
              <a
                href="https://www.instagram.com/georgiatrips.ge/"
                target="_blank"
                rel="noopener noreferrer"
                className="about-social-link about-social-ig"
                aria-label="Instagram — georgiatrips.ge"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                Instagram
              </a>
              <a
                href="https://api.whatsapp.com/send/?phone=995504220020&text&type=phone_number&app_absent=0"
                target="_blank"
                rel="noopener noreferrer"
                className="about-social-link about-social-wa"
                aria-label="WhatsApp — +995 504 22 00 20"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                WhatsApp
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* ==================== TOUR CATEGORIES ==================== */}
      <section className="section" id="categories">
        <div className="section-inner">
          <div className="section-header">
            <span className="section-eyebrow">{t("categories.eyebrow")}</span>
            <h2 className="section-title">{t("categories.title")}</h2>
            <div className="gold-line"></div>
          </div>
          <div className="categories-grid">
            {categoriesList.map((cat, idx) => (
              <div
                key={idx}
                className="category-card"
                onClick={() => document.querySelector(cat.link)?.scrollIntoView({ behavior: "smooth" })}
              >
                <span className="cat-num">0{idx + 1}</span>
                <h3 className="category-title">{cat.title}</h3>
                <p className="category-desc">{cat.desc}</p>
                <div className="cat-arrow">→</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ==================== THEMED TOUR SECTIONS ==================== */}
      <div className="themed-sections-container">
        {dynamicSections.map((sec) =>
          sec.id === "popular" ? (
            <section key={sec.id} className="popular-destinations-section" id={sec.id}>
              <div className="popular-destinations-inner">
                {/* Section Header */}
                <div className="popular-destinations-header">
                  <span className="pop-eyebrow">{t("popular.eyebrow")}</span>
                  <h2 className="pop-main-title"><span className="teal-accent">{t("popular.titleHighlight")}</span> {t("popular.titleRest")}</h2>
                </div>

                <div className="pop-content-layout pop-layout-swapped">
                  {/* Left Column: Asymmetrical/Staggered Cards */}
                  <div className="pop-cards-col">
                    <div className="pop-cards-wrapper">
                      {popularPlaces.map((place, index) => (
                        <a key={place.id} href={"/places/" + place.id} className={"pop-card" + (index === 1 ? " pop-card-staggered" : "")}>
                          <div className="pop-card-img-wrap">
                            <Image src={place.img} alt={asLocalizedText(place.title, lang)} fill sizes="(max-width: 768px) 100vw, 30vw" style={{ objectFit: "cover" }} loading="lazy" />
                            <div className="pop-card-badge">{t("popular.topPopularBadge").replace("{index}", index + 1)}</div>
                            <div className="pop-card-gradient"></div>
                            <div className="pop-card-footer-info">
                              <h4 className="pop-card-title">{asLocalizedText(place.title, lang)}</h4>
                              <span className="pop-card-sub">{translateLocation(place.region, lang) || t("common.georgia")}</span>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>

                    <div className="pop-dots">
                      <span className="pop-dot active"></span>
                    </div>
                  </div>

                  {/* Right Column: Information & Attractions Grid */}
                  <div className="pop-info-col">
                    <p className="pop-description">
                      {t("popular.description")}
                    </p>

                    <div className="pop-attractions-grid">
                      {latestPlaces.map((place) => (
                        <a key={place.id} href={"/places/" + place.id} className="pop-attraction-item">
                          <span className="pop-name">{asLocalizedText(place.title, lang)}</span>
                          <span className="pop-pin" aria-hidden="true">📍</span>
                        </a>
                      ))}
                    </div>

                    <a href="/places" className="pop-all-btn">
                      {t("popular.allLocations")} <span>→</span>
                    </a>
                  </div>
                </div>

                {/* Popular Tours Auto-Sliding 2-Card Pair Carousel */}
                <div className="pop-tours-grid-wrapper">
                  <div className="pop-grid-header-row">
                    <div className="pop-grid-header">
                      <h3 className="pop-grid-title">{t("popular.popularToursTitle")} <span className="teal-accent">{t("popular.popularToursHighlight")}</span></h3>
                      <p className="pop-grid-subtitle">{t("popular.popularToursSubtitle")}</p>
                    </div>

                    <div className="pop-tour-slider-dots">
                      {popularTourPairs.map((_, idx) => (
                        <button
                          key={idx}
                          className={`pop-tour-dot ${idx === popTourSlide ? "active" : ""}`}
                          onClick={() => setPopTourSlide(idx)}
                          aria-label={t("popular.slideLabel").replace("{idx}", idx + 1)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="mini-cards-slider-container">
                    <div
                      className="mini-cards-slider-track"
                      style={{ transform: `translateX(-${popTourSlide * 100}%)` }}
                    >
                      {popularTourPairs.map((pair, pIdx) => (
                        <div key={pIdx} className="mini-cards-pair-slide">
                          {pair.map((tour, index) => (
                            <article
                              key={tour.id}
                              className="pop-fc"
                              onClick={() => handleTourClick(tour)}
                            >
                              {/* Full-bleed Image */}
                              <Image
                                src={tour.img}
                                alt={asLocalizedText(tour.title, lang)}
                                fill
                                style={{ objectFit: "cover" }}
                                sizes="(max-width: 768px) 100vw, 50vw"
                                loading={pIdx === 0 && index === 0 ? "eager" : "lazy"}
                                className="pop-fc-img"
                              />

                              {/* Dark gradient overlay */}
                              <div className="pop-fc-gradient" />

                              {/* Top row: badge + dates */}
                              <div className="pop-fc-top">
                                <span className="pop-fc-badge">
                                  {(t("tourBadges") || {})[asLocalizedText(tour.badge, lang)] ||
                                    (t("tourBadges") || {})[asLocalizedText(tour.badge, "ka")] ||
                                    asLocalizedText(tour.badge, lang)}
                                </span>
                                <div className="pop-fc-dates">
                                  {tour.dates?.slice(0, 3).map((d, i) => (
                                    <span key={i} className="pop-fc-date">{d}</span>
                                  ))}
                                </div>
                              </div>

                              {/* Bottom overlay body */}
                              <div className="pop-fc-body">
                                <div className="pop-fc-meta">
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                    <ClockIcon size={13} color="var(--yellow)" />
                                    {translateDuration(tour.duration, lang)}
                                  </span>
                                  {((translateLocation(tour.destinationLabel || tour.destination || tour.location || tour.region, lang) || "").replace(/^📍\s*/, "")) && (
                                    <>
                                      <span className="pop-fc-dot">•</span>
                                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                        <LocationIcon size={13} color="var(--yellow)" />
                                        {(translateLocation(tour.destinationLabel || tour.destination || tour.location || tour.region, lang) || "").replace(/^📍\s*/, "")}
                                      </span>
                                    </>
                                  )}
                                </div>
                                <h3 className="pop-fc-title">{asLocalizedText(tour.title, lang)}</h3>
                                <p className="pop-fc-desc">{asLocalizedText(tour.desc, lang)}</p>
                                <div className="pop-fc-footer">
                                  <div className="pop-fc-prices">
                                    {tour.priceGroup && (
                                      <div className="pop-fc-price-item">
                                        <small>{t("popular.groupPrice")}</small>
                                        <strong>{format(tour.priceGroup, lang)}</strong>
                                      </div>
                                    )}
                                    {tour.pricePrivate && (
                                      <div className="pop-fc-price-item">
                                        <small>{t("popular.privatePrice")}</small>
                                        <strong>{format(tour.pricePrivate, lang)}</strong>
                                      </div>
                                    )}
                                  </div>
                                  <button className="pop-fc-btn">{t("popular.book")} →</button>
                                </div>
                              </div>
                            </article>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section key={sec.id} className="themed-tours-section" id={sec.id}>
              <div className="themed-section-header">
                <h2 className="themed-section-title">{asLocalizedText(sec.title, lang)}</h2>
              </div>

              <div className="themed-tours-grid">
                {sec.tours.map((tour) => (
                  <Link
                    key={tour.id}
                    href={`/tours/${encodeURIComponent(tour.id)}`}
                    className="tb-card"
                    style={{ textDecoration: "none" }}
                  >
                    <div className="tb-card-img-wrap">
                      <Image
                        src={tour.img || "/hero.png"}
                        alt={asLocalizedText(tour.title, lang)}
                        className="tb-card-img"
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        style={{ objectFit: "cover" }}
                        loading="lazy"
                      />
                      <span className="tb-badge">{(t("tourBadges") || {})[asLocalizedText(tour.badge, lang)] || asLocalizedText(tour.badge, lang)}</span>
                      <div className="tb-overlay-right">
                        {tour.pricePrivate && (
                          <div className="tb-price-tag tb-price-priv">
                            <small>{t("popular.privateLabel")}</small>
                            <strong>{format(tour.pricePrivate, lang)}</strong>
                          </div>
                        )}
                        {tour.priceGroup && (
                          <div className="tb-price-tag tb-price-group">
                            <small>{t("popular.groupPrice")}</small>
                            <strong>{format(tour.priceGroup, lang)}</strong>
                          </div>
                        )}
                        {tour.dates && tour.dates.length > 0 && (
                          <div className="tb-dates-row">
                            {tour.dates.slice(0, 4).map((d, i) => (
                              <span key={i} className="tb-date-chip">{d}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                            <div className="tb-card-body">
                              <h3 className="tb-card-title">{asLocalizedText(tour.title, lang)}</h3>
                              <p className="tb-card-annotation">{asLocalizedText(tour.desc, lang)}</p>
                              <div className="tb-card-line"></div>
                              <div className="tb-card-facilities">
                                <span className="tb-facility-item" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                  <ClockIcon size={14} color="var(--teal)" />
                                  <span>{translateDuration(tour.duration, lang)}</span>
                                </span>
                                <span className="tb-facility-item" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                  <LocationIcon size={14} color="var(--teal)" />
                                  <span>{(translateLocation(tour.destinationLabel || tour.destination || tour.location || tour.region, lang) || t("popular.fromBatumiShort")).replace(/^📍\s*/, "")}</span>
                                </span>
                              </div>
                            </div>
                  </Link>
                ))}
              </div>
            </section>
          )
        )}
      </div>
      {/* ==================== TOUR SCHEDULE & FREE DATES SECTION ==================== */}
      <section className="tour-schedule-section" id="schedule">
        <div className="section-inner">
          <div className="themed-section-header schedule-header">
            <span className="schedule-eyebrow">{t("popular.scheduleEyebrow")}</span>
            <h2 className="themed-section-title">{t("popular.scheduleTitle")}</h2>
            <p className="schedule-subdesc">
              {t("popular.scheduleDesc")}
            </p>
          </div>

          <div className="schedule-list-container">
            {scheduleTours.map((item) => (
              <article key={item.id} className="schedule-card-row">
                <h3 className="schedule-tour-title" onClick={() => handleTourClick(item)}>
                  {asLocalizedText(item.title, lang)}
                </h3>
                <div className="schedule-tour-price">
                  <strong>{item.priceGroup}</strong>, <span>{item.priceNote}</span>
                </div>
                <p className="schedule-tour-desc">{truncateText([item.locationShort, item.desc].filter(Boolean).join(". "))}</p>

                <div className="schedule-months-flex">
                  {item.months.map((mGroup, mIdx) => (
                    <div key={mIdx} className="schedule-month-block">
                      <span className="schedule-month-pill">{translateMonthName(mGroup.monthName, lang)}</span>
                      <div className="schedule-days-grid">
                        {mGroup.dates.map((d, dIdx) => (
                          <button
                            key={dIdx}
                            className="schedule-day-chip"
                            onClick={() => handleBookNow(`${asLocalizedText(item.title, lang)} (${d})`, item.priceGroup)}
                            title={t("popular.scheduleBookTooltip").replace("{title}", asLocalizedText(item.title, lang)).replace("{date}", d)}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== TRANSPORT SECTION ==================== */}
      <section className="transport-section" id="batumi-tours">
        <div className="container transport-hero">
          <div className="transport-slider-wrapper">
            <button
              className="slider-arrow slider-arrow-left"
              id="transport-prev"
              aria-label="Previous"
              onClick={() => {
                const el = document.getElementById('transport-photos-grid');
                if (el) el.scrollBy({ left: -300, behavior: 'smooth' });
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <div className="transport-photos-row" id="transport-photos-grid">
              <a href="#booking" onClick={() => handleBookNow(t("popular.transportLabel").replace("{num}", "1"), format("₾50-დან", lang))} className="transport-photo transport-photo-1" style={{ position: "relative", minHeight: "220px", display: "block" }}>
                <Image src="/1car.webp" fill sizes="(max-width: 768px) 100vw, 25vw" style={{ objectFit: "cover" }} alt="GeorgiaTrips Transport 1" />
              </a>
              <a href="#booking" onClick={() => handleBookNow(t("popular.transportLabel").replace("{num}", "2"), format("₾90-დან", lang))} className="transport-photo transport-photo-2" style={{ position: "relative", minHeight: "220px", display: "block" }}>
                <Image src="/2car.webp" fill sizes="(max-width: 768px) 100vw, 25vw" style={{ objectFit: "cover" }} alt="GeorgiaTrips Transport 2" />
              </a>
              <a href="#booking" onClick={() => handleBookNow(t("popular.transportLabel").replace("{num}", "3"), format("₾180-დან", lang))} className="transport-photo transport-photo-3" style={{ position: "relative", minHeight: "220px", display: "block" }}>
                <Image src="/3car.webp" fill sizes="(max-width: 768px) 100vw, 25vw" style={{ objectFit: "cover" }} alt="GeorgiaTrips Transport 3" />
              </a>
              <a href="#booking" onClick={() => handleBookNow(t("popular.transportLabel").replace("{num}", "4"), format("₾220-დან", lang))} className="transport-photo transport-photo-4" style={{ position: "relative", minHeight: "220px", display: "block" }}>
                <Image src="/4car.webp" fill sizes="(max-width: 768px) 100vw, 25vw" style={{ objectFit: "cover" }} alt="GeorgiaTrips Transport 4" />
              </a>
            </div>
            <button
              className="slider-arrow slider-arrow-right"
              id="transport-next"
              aria-label="Next"
              onClick={() => {
                const el = document.getElementById('transport-photos-grid');
                if (el) el.scrollBy({ left: 300, behavior: 'smooth' });
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </section>


      {/* ==================== GALLERY SECTION (FIREBASE POSTS) ==================== */}
      <section className="section gallery-bg" id="gallery">
          <div className="section-inner">
            <div className="section-header">
              <span className="section-eyebrow">{t("popular.galleryEyebrow")}</span>
              <h2 className="section-title">{t("popular.galleryTitle")}</h2>
              <p className="section-desc">{t("popular.galleryDesc")}</p>
              <div className="gold-line"></div>
            </div>

          {posts.length > 0 ? (
            <div className="posts-home-grid">
              {posts.map((post) => (
                <article key={post.id} className="facebook-post-card">
                  <div className="fb-post-header">
                    <div className="fb-author-wrap">
                      <div className="fb-avatar">
                        {post.avatar ? <img src={post.avatar} alt="" className="posts-author-avatar" /> : <BrandLogo width={40} height={40} />}
                      </div>
                      <div className="fb-author-info">
                        <div className="fb-name-row">
                          <strong className="fb-author-name">{post.author}</strong>
                          {post.verified && <span className="fb-verified-badge" title={t("popular.verifiedBadge")}>✓</span>}
                        </div>
                        <div className="fb-meta-row">
                          <span className="fb-time">{post.timeTag}</span>
                          <span className="fb-dot">•</span>
                          <span className="fb-public-icon" title={t("popular.publicPost")}>🌐</span>
                          <span className="fb-dot">•</span>
                          <span className="fb-location-tag">{formatLocationTag(post.location)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="fb-post-body">
                    <p className="fb-post-text">{post.content && post.content.length > 100 ? post.content.slice(0, 100) + "..." : post.content}</p>
                    {post.hashtags && <p className="fb-post-hashtags">{post.hashtags}</p>}
                    {post.feeling && <span className="post-feeling-badge">{post.feeling}</span>}
                  </div>

                  {post.img && (
                    <div className="fb-post-media">
                      <img src={post.img} alt={post.title} className="fb-media-img" />
                    </div>
                  )}

                  <div className="fb-reactions-bar">
                    <div className="fb-reactions-icons">
                      <svg className="fb-like-summary-icon" width="18" height="18" viewBox="0 0 24 24" fill="#29b2b7" stroke="#29b2b7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                      </svg>
                      <span className="fb-reactions-count">{post.initialLikes}</span>
                    </div>
                    <div className="fb-counts-group">
                      <span className="fb-count-item">{(post.comments || []).length} {t("popular.comments")}</span>
                      <span className="fb-dot">•</span>
                      <span className="fb-count-item">{post.sharesCount} {t("popular.shares")}</span>
                    </div>
                  </div>

                  <div className="fb-action-btns">
                    <a href="/posts" className="fb-action-btn">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                      </svg>
                       <span>{t("popular.like")}</span>
                     </a>
                     <a href="/posts" className="fb-action-btn">
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                         <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                       </svg>
                       <span>{t("popular.comments")}</span>
                     </a>
                     <a href="/posts" className="fb-action-btn">
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                         <circle cx="18" cy="5" r="3"/>
                         <circle cx="6" cy="12" r="3"/>
                         <circle cx="18" cy="19" r="3"/>
                         <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                         <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                       </svg>
                       <span>{t("popular.shares")}</span>
                     </a>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="posts-empty-state" style={{ margin: "0 auto" }}>
              <h2>{t("popular.emptyPostsTitle")}</h2>
              <p>{t("popular.emptyPostsDesc")}</p>
            </div>
          )}

          <div className="social-feed-more-wrap">
            <a href="/posts" className="social-feed-more-btn" style={{ textDecoration: "none" }}>
              {t("popular.viewAll")}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </a>
          </div>
        </div>
      </section>


      {/* ==================== GEORGIA MAP SECTION ==================== */}
      <section className="section map-section" id="map">

        <div className="section-inner">
          <div className="section-header">
            <span className="section-eyebrow">{t("popular.mapEyebrow")}</span>
            <h2 className="section-title">{t("popular.mapTitle")}</h2>
            <p className="section-desc">{t("popular.mapDesc")}</p>
            <div className="gold-line"></div>
          </div>
          <div className="map-wrap">
            <div className="map-svg-wrap">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 820 430"
                className="georgia-map-svg"
              >
                {[
                  { id: "GE-AB", name: "აფხაზეთი", desc: "მდინარე ენგურიდან შავ ზღვამდე", color: "#29b2b7" },
                  { id: "GE-AJ", name: "აჭარა", desc: "ბათუმი, შავი ზღვა, მთები", color: "#fab418" },
                  { id: "GE-GU", name: "გურია", desc: "მწვანე მიდამოები დასავლეთ საქართველოში", color: "#29b2b7" },
                  { id: "GE-IM", name: "იმერეთი", desc: "ქუთაისი, ისტორიული ცენტრი", color: "#106da4" },
                  { id: "GE-KA", name: "კახეთი", desc: "ქართული ღვინის სამეფო", color: "#fab418" },
                  { id: "GE-KK", name: "ქვემო ქართლი", desc: "მრავალფეროვანი კულტურა", color: "#106da4" },
                  { id: "GE-MM", name: "მცხეთა-მთიანეთი", desc: "ყაზბეგი, გერგეთი, ჯვარი", color: "#29b2b7" },
                  { id: "GE-RL", name: "რაჭა-ლეჩხუმი", desc: "მთიანი სილამაზე", color: "#106da4" },
                  { id: "GE-SJ", name: "სამცხე-ჯავახეთი", desc: "ვარძია, ბორჯომი", color: "#29b2b7" },
                  { id: "GE-SK", name: "შიდა ქართლი", desc: "გორი, ქართული ვაკე", color: "#fab418" },
                  { id: "GE-SZ", name: "სამეგრელო-ზემო სვანეთი", desc: "მესტია, სვანური კოშკები", color: "#106da4" },
                  { id: "GE-TB", name: "თბილისი", desc: "საქართველოს დედაქალაქი", color: "#fab418" },
                ].map((region) => (
                  <path
                    key={region.id}
                    id={region.id}
                    d={MAP_PATHS[region.id]}
                    className={`map-region${activeMapRegion === region.id ? " map-region-active" : ""}`}
                    style={{ "--region-color": region.color }}
                    onMouseEnter={() => setActiveMapRegion(region.id)}
                    onMouseLeave={() => setActiveMapRegion(null)}
                    onClick={() => setActiveMapRegion(activeMapRegion === region.id ? null : region.id)}
                  />
                ))}
              </svg>
              {/* Region tooltip panel */}
              {activeMapRegion && (() => {
                const regObj = t(`map.regions.${activeMapRegion}`);
                const nameFromObj = typeof regObj === 'object' ? regObj?.name : null;
                const descFromObj = typeof regObj === 'object' ? regObj?.desc : null;
                const directTranslation = t(`mapRegions.${activeMapRegion}`);
                const regionName = nameFromObj || (typeof directTranslation === 'string' && directTranslation !== `mapRegions.${activeMapRegion}` ? directTranslation : activeMapRegion);
                const regionDesc = descFromObj || '';
                return regionName ? (
                  <div className="map-tooltip">
                    <span className="map-tooltip-name">{regionName}</span>
                    {regionDesc && <span className="map-tooltip-desc">{regionDesc}</span>}
                  </div>
                ) : null;
              })()}
            </div>
            {/* Region legend chips */}
            <div className="map-legend">
              {[
                "GE-AB", "GE-AJ", "GE-GU", "GE-IM", "GE-KA", "GE-KK",
                "GE-MM", "GE-RL", "GE-SJ", "GE-SK", "GE-SZ", "GE-TB"
              ].map((id) => {
                const regObj = t(`map.regions.${id}`);
                const nameFromObj = typeof regObj === 'object' ? regObj?.name : null;
                const directTranslation = t(`mapRegions.${id}`);
                const label = nameFromObj || (typeof directTranslation === 'string' && directTranslation !== `mapRegions.${id}` ? directTranslation : id);
                return (
                  <button
                    key={id}
                    className={`map-chip${activeMapRegion === id ? " map-chip-active" : ""}`}
                    onMouseEnter={() => setActiveMapRegion(id)}
                    onMouseLeave={() => setActiveMapRegion(null)}
                    onClick={() => setActiveMapRegion(activeMapRegion === id ? null : id)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FAQ SECTION ==================== */}
      <section className="section" id="faq">
        <div className="section-inner">
          <div className="section-header">
            <span className="section-eyebrow">{t("popular.faqEyebrow")}</span>
            <h2 className="section-title">{t("popular.faqTitle")}</h2>
            <p className="section-desc">{t("popular.faqDesc")}</p>
            <div className="gold-line"></div>
          </div>
          <div className="faq-list">
            {faqs.map((faq, idx) => (
              <div key={idx} className={`faq-item ${openFaq === idx ? "open" : ""}`}>
                <button
                  className="faq-question"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  aria-expanded={openFaq === idx}
                  aria-controls={`faq-answer-${idx}`}
                >
                  <span>{faq.q}</span>
                  <svg className="faq-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                <div className="faq-answer" id={`faq-answer-${idx}`}>
                  <div className="faq-answer-inner">
                    <p>{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ==================== WEATHER SECTION ==================== */}
      <section className="section weather-section" id="weather">
        <div className="section-inner">
          <div className="section-header">
            <span className="section-eyebrow">{t("popular.weatherEyebrow")}</span>
            <h2 className="section-title">{t("popular.weatherTitle")}</h2>
            <p className="section-desc">{t("popular.weatherDesc")}</p>
            <div className="gold-line"></div>
            <div className={`weather-live-badge ${isLiveWeather ? "on" : ""}`}>
              <span className="weather-live-dot" aria-hidden="true"></span>
              {weatherLoading
                ? t("popular.weatherLoading")
                : isLiveWeather
                  ? t("popular.weatherLive")
                  : t("popular.weatherApprox")}
            </div>
          </div>

          <div className="weather-wrap">
            {/* Location selector tabs */}
            <div className="weather-tabs">
              {Object.keys(weatherData).map((key) => {
                const cityTranslation = t(`weather.cities.${key}`);
                const cityName = typeof cityTranslation === 'string' && cityTranslation !== `weather.cities.${key}`
                  ? cityTranslation
                  : weatherData[key].name;
                return (
                  <button
                    key={key}
                    className={`weather-tab-btn ${activeWeatherTab === key ? "active" : ""}`}
                    onClick={() => setActiveWeatherTab(key)}
                  >
                    {cityName}
                  </button>
                );
              })}
            </div>

            {/* Weather Dashboard Card */}
            {(() => {
              const current = weatherData[activeWeatherTab];
              const cityTranslation = t(`weather.cities.${activeWeatherTab}`);
              const cityName = typeof cityTranslation === 'string' && cityTranslation !== `weather.cities.${activeWeatherTab}`
                ? cityTranslation
                : current.name;

              const condTranslation = t(`weather.conditions.${current.icon}`);
              const conditionLabel = typeof condTranslation === 'string' && condTranslation !== `weather.conditions.${current.icon}`
                ? condTranslation
                : current.condition;

              const descTranslation = t(`weather.descs.${activeWeatherTab}`);
              const descLabel = typeof descTranslation === 'string' && descTranslation !== `weather.descs.${activeWeatherTab}`
                ? descTranslation
                : current.desc;

              const uvNum = parseInt(current.uv, 10);
              let uvKey = 'medium';
              if (uvNum <= 2) uvKey = 'low';
              else if (uvNum <= 5) uvKey = 'medium';
              else if (uvNum <= 7) uvKey = 'high';
              else if (uvNum <= 10) uvKey = 'veryHigh';
              else uvKey = 'extreme';
              const uvTranslation = t(`weather.uv.${uvKey}`);
              const uvLabel = typeof uvTranslation === 'string' && uvTranslation !== `weather.uv.${uvKey}`
                ? `${uvNum} (${uvTranslation})`
                : current.uv;

              return (
                <div className="weather-dashboard">
                  <div className="weather-main-card">
                    <div className="weather-main-header">
                      <div className="weather-main-icon">
                        {ICONS[current.icon]}
                      </div>
                      <div className="weather-main-temp-row">
                        <span className="weather-main-temp">{current.temp}</span>
                        <span className="weather-main-cond">{conditionLabel}</span>
                      </div>
                    </div>
                    <p className="weather-main-desc">{descLabel}</p>

                    <div className="weather-metrics">
                      <div className="weather-metric">
                        <span className="metric-label">{t("popular.humidity")}</span>
                        <span className="metric-val">{current.humidity}</span>
                      </div>
                      <div className="weather-metric">
                        <span className="metric-label">{t("popular.wind")}</span>
                        <span className="metric-val">
                          {typeof current.wind === 'string'
                            ? current.wind.replace("კმ/სთ", t("weather.units.kmh"))
                            : current.wind}
                        </span>
                      </div>
                      <div className="weather-metric">
                        <span className="metric-label">{t("popular.uvIndex")}</span>
                        <span className="metric-val">{uvLabel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="weather-forecast-side">
                     <h4 className="forecast-title">{t("popular.forecastTitle")}</h4>
                    <div className="forecast-list">
                      {current.forecast.map((f, fIdx) => {
                        const dayKey = fIdx === 0 ? "d1" : fIdx === 1 ? "d2" : "d3";
                        const dayTranslation = t(`weather.days.${dayKey}`);
                        const dayLabel = typeof dayTranslation === 'string' && dayTranslation !== `weather.days.${dayKey}`
                          ? dayTranslation
                          : f.day;
                        return (
                          <div key={fIdx} className="forecast-row">
                            <span className="forecast-day">{dayLabel}</span>
                            <span className="forecast-icon">{ICONS[f.condition]}</span>
                            <span className="forecast-temp">{f.temp}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </section>

      {/* ==================== BACK TO TOP ==================== */}
      <button
        className={`back-to-top ${navScrolled ? "visible" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label={t("popular.backToTop")}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>

      {/* ==================== FLOATING WHATSAPP BUTTON ==================== */}
      <div className="floating-wa">
        <span className="floating-wa-tooltip">{t("popular.whatsappTooltip")}</span>
        <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="floating-wa-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12.003 2C6.477 2 2 6.477 2 12c0 1.989.574 3.842 1.563 5.406L2 22l4.682-1.528A9.956 9.956 0 0012.003 22C17.529 22 22 17.523 22 12S17.529 2 12.003 2zm0 18c-1.676 0-3.26-.455-4.627-1.247l-.331-.198-3.454 1.128 1.156-3.366-.215-.348A7.957 7.957 0 014.003 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" />
          </svg>
        </a>
      </div>

      {/* ==================== FOOTER ==================== */}
      <Footer />
    </>
  );
}
