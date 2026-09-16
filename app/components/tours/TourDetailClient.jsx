"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../Navbar";
import Footer from "../Footer";
import TourPrice from "../TourPrice";
import "../../[locale]/tours/[id]/tourDetail.css";
// Firebase-backed helpers (tour/place refetch, coupons, bookings) are imported
// on demand so the Firebase SDK is not part of the initial page bundle.
import { normalizeFirestoreTour, getContentSlug, groupDepartureDates, asLocalizedText, translateDuration, translateLocation, translateMonthName, getPlaceLocalizedTitle, extractImageUrl } from "../../lib/toursShared";
import { WA_LINK, WA_NUMBER, WhatsAppIcon, PHONE_DISPLAY, TELEGRAM_HANDLE, TELEGRAM_LINK, INSTAGRAM_HANDLE, INSTAGRAM_LINK, SOCIAL_PROFILES, FAQS } from "../../lib/shared";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { getLocalizedHref } from "../../lib/siteConfig";
import { useCurrency } from "../../lib/currency/CurrencyContext";
import { formatPriceStr } from "../../lib/i18n/formatPriceStr";
import { isValidPhone } from "../../lib/bookingModel";
import { useAuth } from "../../lib/AuthContext";
import { useCoupon } from "../../lib/CouponContext";
import { trackMetaPurchase, trackMetaViewContent, trackMetaInitiateCheckout, trackEvent } from "../../lib/analytics";
import { getStoredMarketingAttribution } from "../../lib/utmTracker";
import { toTourViews } from "../../lib/tourView";
import { interpolate } from "../../lib/i18n/translateCore";

import TourDetailHero from "../tour-detail/TourDetailHero";
import TourDetailRouteMap from "../tour-detail/TourDetailRouteMap";
import TourDetailInfoTabs from "../tour-detail/TourDetailInfoTabs";
import TourDetailSchedule from "../tour-detail/TourDetailSchedule";
import TourDetailGallery from "../tour-detail/TourDetailGallery";
import TourBookingSidebar from "../tour-detail/TourBookingSidebar";
import TourDetailSimilarTours from "../tour-detail/TourDetailSimilarTours";
import TourMobileBookingBar from "../tour-detail/TourMobileBookingBar";
import TourDetailPromoBanners from "../tour-detail/TourDetailPromoBanners";
import TourDetailFaq from "../tour-detail/TourDetailFaq";

export default function TourDetailClient({
  initialTour = null,
  initialPlaces = [],
  initialAllTours = [],
}) {
  const params = useParams();
  const router = useRouter();
  // The URL segment is usually the slug; the Firestore ID comes from the tour.
  const tourId = initialTour?.id || params?.id;
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
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const bookingSidebarRef = useRef(null);

  // The phone booking bar tracks the hero and the booking form itself
  // (TourMobileBookingBar). This page used to do it with a scroll listener
  // and two observers that disagreed and re-created each other on every
  // flip, re-rendering the whole page while the visitor scrolled.

  useEffect(() => {
    if (initialTour) return;
    let cancelled = false;
    setFsLoading(true);
    (async () => {
      try {
        const { getFirestoreTourById, listFirestoreTours } = await import("../../lib/toursFirestore");
        let raw = await getFirestoreTourById(tourId);
        if (!raw) {
          const tours = await listFirestoreTours();
          raw = tours.find((item) => item.id === tourId || getContentSlug(item) === tourId) || null;
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
    import("../../lib/placesFirestore").then(({ listPlaces }) => listPlaces()).then((list) => {
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
        isoByChip: Object.fromEntries(m.dates.map((d) => [d.chip, d.date])),
      }))
    : [];

  const tourSchedule = firestoreSchedule;
  // Other tours as card view models (popular first). One section only: with a
  // small catalogue, "similar" and "popular" used to repeat the same tours.
  const currentTourId = rawTour?.id;
  const otherTourViews = useMemo(
    () =>
      toTourViews((allFsTours || []).filter((item) => item?.id !== currentTourId), lang, placesList, t("tourBadges"))
        .sort((a, b) => Number(b.isPopular) - Number(a.isPopular))
        .slice(0, 3),
    [allFsTours, currentTourId, lang, placesList, t]
  );

  const tourFaqs = [
    { q: t("faq.q1"), a: t("faq.a1") },
    { q: t("faq.q2"), a: t("faq.a2") },
    { q: t("faq.q3"), a: t("faq.a3") },
    { q: t("faq.q4"), a: t("faq.a4") },
    { q: t("faq.q5"), a: t("faq.a5") },
    { q: t("faq.q6"), a: t("faq.a6") },
  ];

  // Upcoming group departures as full ISO dates (no year guessing).
  const groupDatesIso = tourSchedule.flatMap((mGroup) => Object.values(mGroup?.isoByChip || {})).sort();
  const hasGroupSupport = isFirestoreTour && rawTour ? !!rawTour.hasGroup : true;
  const hasPrivateSupport = isFirestoreTour && rawTour ? !!rawTour.hasPrivate : true;
  const hasGroupDates = hasGroupSupport && groupDatesIso.length > 0;

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
      ) || (await import("../../lib/coupons").then((m) => m.getCouponByCode(code)));

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
    const exact = tourSchedule.find((mGroup) => mGroup?.isoByChip?.[chipDate])?.isoByChip[chipDate];
    if (exact) return exact;
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
    
    // 1. From normalized galleryItems
    if (Array.isArray(tour.galleryItems) && tour.galleryItems[idx]?.locationTitle) {
      return tour.galleryItems[idx].locationTitle;
    }
    
    // 2. From raw gallery array if it contains objects
    if (Array.isArray(rawFsDoc?.gallery) && typeof rawFsDoc.gallery[idx] === "object" && rawFsDoc.gallery[idx]?.locationTitle) {
      return asLocalizedText(rawFsDoc.gallery[idx].locationTitle, lang);
    }

    // 3. Search matching URL in galleryItems
    if (Array.isArray(tour.galleryItems)) {
      const cleanTarget = extractImageUrl(imgUrl);
      const gMatch = tour.galleryItems.find((gi) => {
        const u = typeof gi === "string" ? gi : gi?.url;
        return extractImageUrl(u) === cleanTarget;
      });
      if (gMatch?.locationTitle) return gMatch.locationTitle;
    }

    // 4. Search matching URL in itinerary stops
    const matchingStop = tour.itinerary?.find(
      (it) => extractImageUrl(it?.img || it?.image) === extractImageUrl(imgUrl)
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

      // The success page looks the booking up by its booking ID (plus the
      // access token / phone kept in localStorage). It previously received
      // the tour ID, so it could never find the booking.
      const { createBooking } = await import("../../lib/bookingsFirestore");
      const result = await createBooking(bookingData);
      const bookingId = result?.bookingId;
      if (!bookingId) throw new Error("Booking was not saved");
      try {
        if (result.accessToken) localStorage.setItem(`gt_token_${bookingId}`, result.accessToken);
        if (bookingPhone) localStorage.setItem(`gt_phone_${bookingId}`, bookingPhone);
      } catch (_) {}
      setBookingSubmitted(true);
      router.push(`/booking/success/${encodeURIComponent(bookingId)}`);
    } catch (err) {
      console.error("Booking error:", err);
      // Fallback to WhatsApp
      const tourTitle = asLocalizedText(tour.title, lang);
      const waMsg = interpolate(t("tourDetail.bookingFallbackWa"), { title: tourTitle, date: selectedDate || "—", people: bookingPeople });
      window.open(`${WA_LINK}?text=${encodeURIComponent(waMsg)}`, "_blank", "noopener,noreferrer");
    } finally {
      setBookingSubmitting(false);
    }
  };

  if (fsLoading && !tour) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--gt-paper)" }}>
        <div style={{ textAlign: "center", color: "#1f2d3d" }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🏔️</div>
          <h3>{t("tourDetail.loadingTour") || "ტური იტვირთება..."}</h3>
        </div>
      </div>
    );
  }

  if (!tour) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--gt-paper)" }}>
        <div style={{ textAlign: "center", color: "#1f2d3d" }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔍</div>
          <h3>{t("tourDetail.tourNotFound") || "ტური ვერ მოიძებნა"}</h3>
          <Link href={getLocalizedHref("/tours", lang)} style={{ color: "var(--gt-primary)", textDecoration: "underline", marginTop: "1rem", display: "inline-block" }}>
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
  const rawBookBtn = t("toursPage.bookNow");
  const bookBtnText = (rawBookBtn && rawBookBtn !== "toursPage.bookNow")
    ? rawBookBtn
    : (bookBtnTexts[lang] || "დაჯავშნა");

  const activePrice = tourType === "private" || (!hasGroupSupport && hasPrivateSupport)
    ? (tour?.pricePrivate || tour?.price)
    : (tour?.priceGroup || tour?.price);

  const tourLocalizedTitle = asLocalizedText(tour?.title, lang);
  const waMsg = interpolate(t("tourCard.waMessage"), { title: tourLocalizedTitle });
  const waUrl = `${WA_LINK}?text=${encodeURIComponent(waMsg)}`;


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
        openLightbox={openLightbox}
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
                {/* The description is stored with blank lines between paragraphs. */}
                <div className="tdp-about-text">
                  {String(asLocalizedText(tour.desc, lang) || "")
                    .split(/\n\s*\n/)
                    .map((para) => para.trim())
                    .filter(Boolean)
                    .map((para, index) => (
                      <p key={index} className={index === 0 ? "tdp-about-lead" : undefined}>{para}</p>
                    ))}
                </div>
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
            groupDatesIso={groupDatesIso}
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
      <TourDetailSimilarTours tours={otherTourViews} />

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
            <button type="button" className="lb-close" onClick={closeLightbox} aria-label={t("common.close")}>✕</button>
            <button type="button" className="lb-nav lb-prev" onClick={prevLightboxImg} aria-label={t("datePicker.prevMonth")}>‹</button>
            <div className="lb-image-wrapper">
              <Image
                src={tour.gallery[lightboxImgIndex]}
                alt={resolvePhotoPlaceTitle(tour.gallery[lightboxImgIndex], lightboxImgIndex) || asLocalizedText(tour.title, lang)}
                width={1200}
                height={800}
                style={{ objectFit: "contain", maxHeight: "85vh", width: "auto" }}
              />
            </div>
            <button type="button" className="lb-nav lb-next" onClick={nextLightboxImg} aria-label={t("datePicker.nextMonth")}>›</button>
            <div className="lb-counter" style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
              {(() => {
                const cleanLoc = resolvePhotoPlaceTitle(tour.gallery[lightboxImgIndex], lightboxImgIndex);
                return cleanLoc ? (
                  <span style={{ color: "var(--gt-primary, #2a6592)", fontWeight: 700, fontSize: "0.95rem" }}>
                    📍 {cleanLoc}
                  </span>
                ) : null;
              })()}
              <span>{lightboxImgIndex + 1} / {tour.gallery.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Booking bar for phones: price, WhatsApp and a jump to the booking form */}
      <TourMobileBookingBar
        price={activePrice}
        label={priceTypeLabel}
        waUrl={waUrl}
        bookLabel={bookBtnText}
        onBook={scrollToBooking}
      />

      {/* No site navigation bar here: the booking bar owns the bottom of the screen. */}
      <Footer mobileNav={false} />
    </div>
  );
}
