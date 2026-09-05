"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../Navbar";
import Footer from "../Footer";
import TourPrice from "../TourPrice";
import "../../tours/[id]/tourDetail.css";
import { getFirestoreTourById, normalizeFirestoreTour, groupDepartureDates, listFirestoreTours, asLocalizedText, translateDuration, translateLocation, translateMonthName, getPlaceLocalizedTitle, extractImageUrl } from "../../lib/toursFirestore";
import { listPlaces } from "../../lib/placesFirestore";
import { WA_LINK, WA_NUMBER, WhatsAppIcon, PHONE_DISPLAY, TELEGRAM_HANDLE, TELEGRAM_LINK, INSTAGRAM_HANDLE, INSTAGRAM_LINK, SOCIAL_PROFILES, FAQS } from "../../lib/shared";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { useCurrency } from "../../lib/currency/CurrencyContext";
import { formatPriceStr } from "../../lib/i18n/formatPriceStr";
import { createBooking } from "../../lib/bookingsFirestore";
import { isValidPhone } from "../../lib/bookingModel";
import { useAuth } from "../../lib/AuthContext";
import { useCoupon } from "../../lib/CouponContext";
import { getCouponByCode } from "../../lib/coupons";
import { trackMetaPurchase, trackMetaViewContent, trackMetaInitiateCheckout, trackEvent } from "../../lib/analytics";
import { getStoredMarketingAttribution } from "../../lib/utmTracker";

import TourDetailHero from "../tour-detail/TourDetailHero";
import TourDetailRouteMap from "../tour-detail/TourDetailRouteMap";
import TourDetailInfoTabs from "../tour-detail/TourDetailInfoTabs";
import TourDetailSchedule from "../tour-detail/TourDetailSchedule";
import TourDetailGallery from "../tour-detail/TourDetailGallery";
import TourBookingSidebar from "../tour-detail/TourBookingSidebar";
import TourDetailSimilarTours from "../tour-detail/TourDetailSimilarTours";
import TourDetailPromoBanners from "../tour-detail/TourDetailPromoBanners";
import TourDetailFaq from "../tour-detail/TourDetailFaq";

export default function TourDetailClient({
  initialTour = null,
  initialPlaces = [],
  initialAllTours = [],
}) {
  const params = useParams();
  const router = useRouter();
  const tourId = params?.id || initialTour?.id;
  const { lang, t, isEnglish } = useLanguage();
  const { format } = useCurrency();
  const { user } = useAuth() ?? {};
  const { coupons } = useCoupon() ?? {};

  const [rawFsDoc, setRawFsDoc] = useState(initialTour);
  const [placesList, setPlacesList] = useState(initialPlaces);
  const fsTour = useMemo(() => (rawFsDoc ? normalizeFirestoreTour(rawFsDoc, lang, placesList) : null), [rawFsDoc, lang, placesList]);
  const [fsLoading, setFsLoading] = useState(!initialTour);
  const [allFsTours, setAllFsTours] = useState(initialAllTours);
  const [selectedDate, setSelectedDate] = useState("");
  const [bookingName, setBookingName] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [bookingPeople, setBookingPeople] = useState("2");
  const [messengerPref, setMessengerPref] = useState("WhatsApp");
  const [bookingNotes, setBookingNotes] = useState("");
  const [tourType, setTourType] = useState("group");
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [lightboxImgIndex, setLightboxImgIndex] = useState(null);
  const [isHeroInView, setIsHeroInView] = useState(true);
  const [isFormInView, setIsFormInView] = useState(false);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const bookingSidebarRef = useRef(null);

  // IntersectionObserver to show mobile sticky bar only when hero is scrolled past AND booking form is not visible
  useEffect(() => {
    let heroObserver, formObserver;

    const heroEl = document.querySelector(".tdp-hero");
    const formEl = document.getElementById("tour-booking-form") || document.getElementById("mobile-booking-target") || bookingSidebarRef.current;

    if (heroEl && typeof IntersectionObserver !== "undefined") {
      heroObserver = new IntersectionObserver(
        ([entry]) => {
          setIsHeroInView(entry.isIntersecting);
        },
        { threshold: 0.1 }
      );
      heroObserver.observe(heroEl);
    }

    if (formEl && typeof IntersectionObserver !== "undefined") {
      formObserver = new IntersectionObserver(
        ([entry]) => {
          setIsFormInView(entry.isIntersecting);
        },
        { threshold: 0.15 }
      );
      formObserver.observe(formEl);
    }

    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      if (scrollY > 320 && isHeroInView) {
        setIsHeroInView(false);
      } else if (scrollY <= 320 && !isHeroInView) {
        setIsHeroInView(true);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      heroObserver?.disconnect();
      formObserver?.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [tourId, isHeroInView]);

  useEffect(() => {
    if (initialTour) return;
    let cancelled = false;
    setFsLoading(true);
    (async () => {
      try {
        let raw = await getFirestoreTourById(tourId);
        if (!raw) {
          const tours = await listFirestoreTours();
          raw = tours.find((item) => item.id === tourId) || null;
        }
        if (!cancelled) setRawFsDoc(raw || null);
      } catch (error) {
        console.error("Unable to load tour details", error);
        if (!cancelled) setRawFsDoc(null);
      } finally {
        if (!cancelled) setFsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tourId, initialTour]);

  useEffect(() => {
    if (initialPlaces && initialPlaces.length > 0) return;
    let cancelled = false;
    listPlaces().then((list) => {
      if (!cancelled && Array.isArray(list)) setPlacesList(list);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [initialPlaces]);

  const TOUR_DEFAULTS = {
    ka: {
      meetingPoint: "სასტუმროდან ან მითითებული მისამართიდან გაყვანა",
      dressCode: "კომფორტული ტანსაცმელი და მოსახერხებელი ფეხსაცმელი",
      includes: ["კომფორტული ტრანსპორტირება", "გამოცდილი მძღოლისა და გიდის მომსახურება", "უფასო Wi-Fi და სასმელი წყალი"],
      excludes: ["ლოკაციების შესასვლელი ბილეთები", "პირადი ხარჯები და კვება"],
      payment: "გადახდა გამგზავრების დღეს (ნაღდი ანგარიშსწორებით)",
    },
    en: {
      meetingPoint: "Pickup from your hotel or specified address",
      dressCode: "Comfortable casual clothes and walking shoes",
      includes: ["Comfortable transportation", "Professional driver and guide service", "Free Wi-Fi & Bottled Water"],
      excludes: ["Entrance tickets to attractions", "Personal expenses and meals"],
      payment: "Payment on the day of departure (Cash or Transfer)",
    },
    ru: {
      meetingPoint: "Трансфер из отеля или по указанному адресу",
      dressCode: "Удобная одежда и комфортная обувь",
      includes: ["Комфортабельный транспорт", "Услуги опытного водителя и гида", "Бесплатный Wi-Fi и питьевая вода"],
      excludes: ["Входные билеты на локации", "Личные расходы и питание"],
      payment: "Оплата в день выезда (наличными или переводом)",
    },
    tr: {
      meetingPoint: "Otelinizden veya belirtilen adresten karşılama",
      dressCode: "Rahat kıyafetler ve yürüyüş ayakkabısı",
      includes: ["Konforlu ulaşım", "Deneyimli sürücü ve rehber hizmeti", "Ücretsiz Wi-Fi ve şişe su"],
      excludes: ["Giriş biletleri", "Kişisel harcamalar ve yemekler"],
      payment: "Tur günü kalkışta ödeme (Nakit veya Havale)",
    },
    ar: {
      meetingPoint: "الاستقبال من الفندق أو العنوان المحدد",
      dressCode: "ملابس مريحة وأحذية مناسبة للمشي",
      includes: ["مواصلات مريحة ومكيفة", "سائق ومرشد ذو خبرة", "واي فاي مجاني ومياه شرب"],
      excludes: ["تذاكر دخول المعالم السياحية", "المصاريف الشخصية والوجبات"],
      payment: "الدفع يوم الانطلاق (نقداً)",
    },
  };

  const currDefaults = TOUR_DEFAULTS[lang] || TOUR_DEFAULTS.ka;
  const isFirestoreTour = !!fsTour;
  const rawTour = fsTour || rawFsDoc;

  const tour = !rawTour
    ? null
    : {
        ...rawTour,
        departure: translateLocation(rawTour.destinationLabel || rawTour.destination || "ბათუმი", lang),
        meetingPoint: currDefaults.meetingPoint,
        dressCode: currDefaults.dressCode,
        includes: Array.isArray(rawTour.includes) && rawTour.includes.length ? rawTour.includes.map((i) => asLocalizedText(i, lang)) : currDefaults.includes,
        excludes: Array.isArray(rawTour.excludes) && rawTour.excludes.length ? rawTour.excludes.map((i) => asLocalizedText(i, lang)) : currDefaults.excludes,
        payment: currDefaults.payment,
        highlights: [asLocalizedText(rawTour.desc, lang)],
        gallery: rawTour.gallery?.length ? rawTour.gallery : [rawTour.img].filter(Boolean),
        itinerary: rawTour.itinerary?.length
          ? rawTour.itinerary
          : [{ title: asLocalizedText(rawTour.title, lang), desc: asLocalizedText(rawTour.desc, lang), img: rawTour.img }],
        tourSectionLabel: rawTour.tourSectionLabel,
      };

  const firestoreSchedule = rawTour
    ? groupDepartureDates(rawTour.departureDates || [], lang).map((m) => ({
        monthName: m.monthName,
        monthIndex: m.monthIndex,
        dates: m.dates.map((d) => d.chip),
        seatsByChip: Object.fromEntries(m.dates.map((d) => [d.chip, d.freeSeats])),
      }))
    : [];

  const tourSchedule = firestoreSchedule;
  const normalizedAllTours = useMemo(() => {
    return (allFsTours || []).map(t => normalizeFirestoreTour(t, lang, placesList)).filter(Boolean);
  }, [allFsTours, lang, placesList]);

  const similarTours = normalizedAllTours.filter((t) => t.id !== rawTour?.id).slice(0, 3);
  const popularTours = normalizedAllTours.filter((t) => t.isPopular && t.id !== rawTour?.id);

  const tourFaqs = [
    { q: t("faq.q1"), a: t("faq.a1") },
    { q: t("faq.q2"), a: t("faq.a2") },
    { q: t("faq.q3"), a: t("faq.a3") },
    { q: t("faq.q4"), a: t("faq.a4") },
    { q: t("faq.q5"), a: t("faq.a5") },
    { q: t("faq.q6"), a: t("faq.a6") },
  ];

  const groupDatesMMDD = tourSchedule.flatMap((mGroup) =>
    (mGroup?.dates || []).map((d) => {
      const [dd, mm] = String(d).split(".");
      return `${mm}.${dd}`;
    })
  );
  const hasGroupSupport = isFirestoreTour && rawTour ? !!rawTour.hasGroup : true;
  const hasPrivateSupport = isFirestoreTour && rawTour ? !!rawTour.hasPrivate : true;
  const hasGroupDates = hasGroupSupport && groupDatesMMDD.length > 0;

  const seatsByChip = {};
  if (firestoreSchedule) {
    firestoreSchedule.forEach((m) => {
      Object.assign(seatsByChip, m.seatsByChip || {});
    });
  }
  const seatsByIso = {};
  if (isFirestoreTour && Array.isArray(rawTour?.departureDates)) {
    rawTour.departureDates.forEach((e) => {
      if (e?.date) seatsByIso[e.date] = Number(e.freeSeats) || 0;
    });
  }

  useEffect(() => {
    if (hasGroupDates) setTourType("group");
    else if (hasPrivateSupport) setTourType("private");
  }, [tourId, hasGroupDates, hasPrivateSupport]);

  const freeSeatsForSelected =
    tourType === "group" && selectedDate
      ? seatsByIso[selectedDate] ?? (() => {
          const [, mm, dd] = selectedDate.split("-");
          return seatsByChip[`${dd}.${mm}`];
        })()
      : null;

  const configuredPeopleMin = isFirestoreTour
    ? Number(tourType === "private" ? rawTour?.privateGroupMin : rawTour?.groupMin) || 1
    : 1;
  const groupMaxCap = isFirestoreTour
    ? Math.max(configuredPeopleMin, Number(tourType === "private" ? rawTour?.privateGroupMax : rawTour?.groupMax) || 50)
    : 50;
  const peopleMax =
    tourType === "group" && freeSeatsForSelected != null
      ? Math.max(configuredPeopleMin, Math.min(groupMaxCap, freeSeatsForSelected))
      : groupMaxCap;
  const peopleMin = configuredPeopleMin;

  useEffect(() => {
    const n = parseInt(bookingPeople, 10) || peopleMin;
    if (n < peopleMin) setBookingPeople(String(peopleMin));
    if (n > peopleMax) setBookingPeople(String(peopleMax));
  }, [peopleMin, peopleMax, bookingPeople]);

  const parsePriceNum = (str) => {
    if (!str) return 0;
    const clean = String(str).replace(/[^\d.]/g, "");
    return parseFloat(clean) || 0;
  };

  const groupUnitPrice = parsePriceNum(tour?.priceGroup || tour?.price);
  const privateTotalPrice = parsePriceNum(tour?.pricePrivate);
  const peopleCount = parseInt(bookingPeople, 10) || peopleMin;

  const baseTotalPrice =
    tourType === "group"
      ? groupUnitPrice * peopleCount
      : privateTotalPrice > 0
        ? privateTotalPrice
        : 0;

  const discountPercent = appliedCoupon ? Number(appliedCoupon.discount || 10) : 0;
  let discountAmount = appliedCoupon ? Math.round(baseTotalPrice * (discountPercent / 100)) : 0;
  if (appliedCoupon?.maxDiscountGEL && appliedCoupon.maxDiscountGEL > 0) {
    discountAmount = Math.min(discountAmount, appliedCoupon.maxDiscountGEL);
  }
  const totalPrice = Math.max(0, baseTotalPrice - discountAmount);

  const handleApplyCoupon = async (codeToApply) => {
    const code = (codeToApply || couponCodeInput).trim().toUpperCase();
    if (!code) {
      setCouponError(t("bookingCoupon.enterCode") || "შეიყვანეთ კუპონის კოდი");
      return;
    }
    try {
      const foundCoupon = (coupons || []).find(
        (c) => c.code.toUpperCase() === code && c.active !== false
      ) || (await getCouponByCode(code));

      if (foundCoupon && foundCoupon.active !== false) {
        const pct = Number(foundCoupon.discountPercent) || 10;
        setAppliedCoupon({
          code: foundCoupon.code,
          discount: pct,
          maxDiscountGEL: foundCoupon.maxDiscountGEL,
        });
        setCouponError("");
        setCouponSuccess(t("bookingCoupon.success") || `${pct}%-იანი ფასდაკლება წარმატებით გააქტიურდა!`);
      } else {
        setCouponError(t("bookingCoupon.invalid") || "არასწორი ან ვადაგასული კუპონი");
        setCouponSuccess("");
      }
    } catch (_) {
      setCouponError(t("bookingCoupon.invalid") || "არასწორი ან ვადაგასული კუპონი");
      setCouponSuccess("");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponSuccess("");
    setCouponError("");
    setCouponCodeInput("");
  };

  const handleTourTypeChange = (newType) => {
    setTourType(newType);
    setSelectedDate("");
  };

  const scheduleDateToIso = (chipDate) => {
    if (!chipDate) return "";
    const [dd, mm] = String(chipDate).split(".");
    if (!dd || !mm) return "";
    const yr = new Date().getFullYear();
    return `${yr}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  };

  const pickScheduleDate = (chipDate) => {
    const iso = scheduleDateToIso(chipDate);
    if (iso) {
      setSelectedDate(iso);
      if (tourType !== "group") setTourType("group");
      scrollToBooking();
    }
  };

  const resolvePhotoPlaceTitle = (imgUrl, idx) => {
    if (!imgUrl || !tour) return "";
    if (Array.isArray(tour.galleryMeta) && tour.galleryMeta[idx]?.locationTitle) {
      return asLocalizedText(tour.galleryMeta[idx].locationTitle, lang);
    }
    const matchingStop = tour.itinerary?.find(
      (it) => extractImageUrl(it.img) === extractImageUrl(imgUrl)
    );
    if (matchingStop) return asLocalizedText(matchingStop.title, lang);
    return "";
  };

  const scrollToBooking = () => {
    const el = document.getElementById("tour-booking-form") || document.getElementById("mobile-booking-target") || bookingSidebarRef.current;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      const firstInput = el.querySelector("input:not([type=hidden]), select");
      if (firstInput) {
        setTimeout(() => firstInput.focus({ preventScroll: true }), 400);
      }
    }
  };

  const openLightbox = (idx) => setLightboxImgIndex(idx);
  const closeLightbox = () => setLightboxImgIndex(null);
  const prevLightboxImg = (e) => {
    e.stopPropagation();
    if (tour?.gallery?.length) {
      setLightboxImgIndex((prev) => (prev > 0 ? prev - 1 : tour.gallery.length - 1));
    }
  };
  const nextLightboxImg = (e) => {
    e.stopPropagation();
    if (tour?.gallery?.length) {
      setLightboxImgIndex((prev) => (prev < tour.gallery.length - 1 ? prev + 1 : 0));
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!bookingPhone.trim() || !isValidPhone(bookingPhone)) {
      setPhoneError(t("tourDetail.phoneError") || "გთხოვთ შეიყვანოთ სწორი მობილურის ნომერი");
      return;
    }
    setPhoneError("");
    setBookingSubmitting(true);

    try {
      const tourTitle = asLocalizedText(tour.title, lang);
      const bookingData = {
        tourId: tour.id,
        tourTitle,
        customerName: bookingName,
        customerPhone: bookingPhone,
        peopleCount: parseInt(bookingPeople, 10) || peopleMin,
        tourType,
        departureDate: selectedDate,
        messengerPref,
        notes: bookingNotes,
        appliedCoupon: appliedCoupon ? appliedCoupon.code : null,
        totalPrice,
        lang,
        createdAt: new Date().toISOString(),
      };

      await createBooking(bookingData);
      setBookingSubmitted(true);
      router.push(`/booking/success/${tour.id}`);
    } catch (err) {
      console.error("Booking error:", err);
      // Fallback to WhatsApp
      const tourTitle = asLocalizedText(tour.title, lang);
      const waMsg = `Hello! I would like to book tour: "${tourTitle}" on ${selectedDate} for ${bookingPeople} people.`;
      window.open(`${WA_LINK}?text=${encodeURIComponent(waMsg)}`, "_blank");
    } finally {
      setBookingSubmitting(false);
    }
  };

  if (fsLoading && !tour) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ textAlign: "center", color: "#0d233a" }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🏔️</div>
          <h3>{t("tourDetail.loadingTour") || "ტური იტვირთება..."}</h3>
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ textAlign: "center", color: "#0d233a" }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔍</div>
          <h3>{t("tourDetail.tourNotFound") || "ტური ვერ მოიძებნა"}</h3>
          <Link href="/tours" style={{ color: "var(--teal)", textDecoration: "underline", marginTop: "1rem", display: "inline-block" }}>
            {t("tourDetail.backToTours") || "ყველა ტურის ნახვა"}
          </Link>
        </div>
      </div>
    );
  }

  const priceTypeLabels = {
    ka: tourType === "private" || (!hasGroupSupport && hasPrivateSupport) ? "ინდივიდუალური" : "1 ადამიანზე",
    en: tourType === "private" || (!hasGroupSupport && hasPrivateSupport) ? "Private Tour" : "Per Person",
    ru: tourType === "private" || (!hasGroupSupport && hasPrivateSupport) ? "Индивидуальный" : "За человека",
    tr: tourType === "private" || (!hasGroupSupport && hasPrivateSupport) ? "Özel Tur" : "Kişi Başı",
    ar: tourType === "private" || (!hasGroupSupport && hasPrivateSupport) ? "جولة خاصة" : "للشخص الواحد",
  };
  const priceTypeLabel = priceTypeLabels[lang] || priceTypeLabels.ka;

  const bookBtnTexts = {
    ka: "დაჯავშნა",
    en: "Book Now",
    ru: "Забронировать",
    tr: "Rezervasyon",
    ar: "احجز الآن",
  };
  const bookBtnText = t("toursPage.bookNow") || bookBtnTexts[lang] || "Book Now";

  const activePrice = tourType === "private" || (!hasGroupSupport && hasPrivateSupport)
    ? (tour?.pricePrivate || tour?.price)
    : (tour?.priceGroup || tour?.price);

  const tourLocalizedTitle = asLocalizedText(tour?.title, lang);
  const waMsg = lang === "ka"
    ? `გამარჯობა! მაინტერესებს ტური: "${tourLocalizedTitle}"`
    : `Hello! I would like more information about the tour: "${tourLocalizedTitle}"`;
  const waUrl = `${WA_LINK}?text=${encodeURIComponent(waMsg)}`;

  const showMobileStickyBar = !isHeroInView && !isFormInView;

  return (
    <div className="tdp-layout">
      <Navbar active="tours" />

      {/* 1. Hero Showcase Section */}
      <TourDetailHero
        tour={tour}
        isFirestoreTour={isFirestoreTour}
        configuredPeopleMin={configuredPeopleMin}
        groupMaxCap={groupMaxCap}
        scrollToBooking={scrollToBooking}
      />

      {/* 2. Main Content Grid */}
      <section className="tdp-main-section">
        <div className="container tdp-grid-2col">
          
          {/* Left Column: Details, Itinerary, Schedule, Gallery */}
          <div className="tdp-content-col">
            
            {/* About Excursion */}
            <article className="tdp-card-block">
              <div className="tdp-card-header">
                <div>
                  <h2>{t("tourDetail.aboutTitle")}</h2>
                  <p className="subtitle">{t("tourDetail.aboutSubtitle")}</p>
                </div>
              </div>
              <div className="tdp-card-body">
                <p className="tdp-about-lead">{asLocalizedText(tour.desc, lang)}</p>
              </div>
            </article>

            {/* Zigzag Connected Route Map */}
            <TourDetailRouteMap
              tour={tour}
              openLightbox={openLightbox}
            />

            {/* Departure, Time & Payment Details */}
            <TourDetailInfoTabs tour={tour} />

            {/* Tour Schedule & Free Dates */}
            <TourDetailSchedule
              tour={tour}
              tourSchedule={tourSchedule}
              selectedDate={selectedDate}
              pickScheduleDate={pickScheduleDate}
              scheduleDateToIso={scheduleDateToIso}
            />

            {/* Photo Gallery */}
            <TourDetailGallery
              tour={tour}
              resolvePhotoPlaceTitle={resolvePhotoPlaceTitle}
              openLightbox={openLightbox}
            />

          </div>

          {/* Right Column: Sticky Booking Sidebar */}
          <TourBookingSidebar
            tour={tour}
            bookingSidebarRef={bookingSidebarRef}
            hasGroupSupport={hasGroupSupport}
            hasPrivateSupport={hasPrivateSupport}
            hasGroupDates={hasGroupDates}
            groupDatesMMDD={groupDatesMMDD}
            tourType={tourType}
            handleTourTypeChange={handleTourTypeChange}
            groupUnitPrice={groupUnitPrice}
            privateTotalPrice={privateTotalPrice}
            bookingName={bookingName}
            setBookingName={setBookingName}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            bookingPeople={bookingPeople}
            setBookingPeople={setBookingPeople}
            peopleMin={peopleMin}
            peopleMax={peopleMax}
            freeSeatsForSelected={freeSeatsForSelected}
            bookingPhone={bookingPhone}
            setBookingPhone={setBookingPhone}
            phoneError={phoneError}
            setPhoneError={setPhoneError}
            messengerPref={messengerPref}
            setMessengerPref={setMessengerPref}
            bookingNotes={bookingNotes}
            setBookingNotes={setBookingNotes}
            couponCodeInput={couponCodeInput}
            setCouponCodeInput={setCouponCodeInput}
            setCouponError={setCouponError}
            appliedCoupon={appliedCoupon}
            discountAmount={discountAmount}
            handleRemoveCoupon={handleRemoveCoupon}
            handleApplyCoupon={handleApplyCoupon}
            couponError={couponError}
            couponSuccess={couponSuccess}
            baseTotalPrice={baseTotalPrice}
            totalPrice={totalPrice}
            peopleCount={peopleCount}
            bookingSubmitting={bookingSubmitting}
            handleBookingSubmit={handleBookingSubmit}
            user={user}
          />

        </div>
      </section>

      {/* 3. Similar & Popular Tours Section */}
      <TourDetailSimilarTours
        similarTours={similarTours}
        popularTours={popularTours}
      />

      {/* 4. Special Excursions Contact Banner */}
      <TourDetailPromoBanners />

      {/* 5. FAQ Section */}
      <TourDetailFaq
        tourFaqs={tourFaqs}
        openFaqIndex={openFaqIndex}
        setOpenFaqIndex={setOpenFaqIndex}
      />

      {/* Lightbox Modal */}
      {lightboxImgIndex !== null && tour.gallery && (
        <div className="tdp-lightbox-overlay" onClick={closeLightbox}>
          <div className="tdp-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="lb-close" onClick={closeLightbox}>✕</button>
            <button type="button" className="lb-nav lb-prev" onClick={prevLightboxImg}>‹</button>
            <div className="lb-image-wrapper">
              <Image
                src={tour.gallery[lightboxImgIndex]}
                alt="Enlarge"
                width={1200}
                height={800}
                style={{ objectFit: "contain", maxHeight: "85vh", width: "auto" }}
              />
            </div>
            <button type="button" className="lb-nav lb-next" onClick={nextLightboxImg}>›</button>
            <div className="lb-counter" style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
              {(() => {
                const cleanLoc = resolvePhotoPlaceTitle(tour.gallery[lightboxImgIndex], lightboxImgIndex);
                return cleanLoc ? (
                  <span style={{ color: "var(--teal, #29b2b7)", fontWeight: 700, fontSize: "0.95rem" }}>
                    📍 {cleanLoc}
                  </span>
                ) : null;
              })()}
              <span>{lightboxImgIndex + 1} / {tour.gallery.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Mobile Floating Booking Bar */}
      {showMobileStickyBar && (
        <aside
          className="tdp-mobile-floating-bar"
          aria-label="Quick Tour Booking Bar"
          dir={lang === "ar" ? "rtl" : "ltr"}
        >
          <div className="mobile-floating-price">
            <small className="mobile-floating-price-label">{priceTypeLabel}</small>
            <div className="mobile-floating-price-val">
              <TourPrice price={activePrice} lang={lang} variant="card" />
            </div>
          </div>

          <div className="mobile-floating-actions">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-mobile-floating-wa"
              aria-label="Contact via WhatsApp"
            >
              <WhatsAppIcon width={20} height={20} />
            </a>

            <button
              type="button"
              className="btn-mobile-floating-book"
              onClick={scrollToBooking}
            >
              <span>{bookBtnText}</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: lang === "ar" ? "scaleX(-1)" : "none" }}>
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </aside>
      )}

      <Footer />
    </div>
  );
}
