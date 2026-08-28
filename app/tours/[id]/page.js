"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import DatePicker from "../../components/DatePicker";
import { getFirestoreTourById, normalizeFirestoreTour, groupDepartureDates, listFirestoreTours, asLocalizedText, translateDuration, translateLocation, translateMonthName } from "../../lib/toursFirestore";
import { WA_LINK, WA_NUMBER, PHONE_DISPLAY, TELEGRAM_HANDLE, TELEGRAM_LINK, INSTAGRAM_HANDLE, INSTAGRAM_LINK, SOCIAL_PROFILES, FAQS } from "../../lib/shared";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { useCurrency } from "../../lib/currency/CurrencyContext";
import { formatPriceStr } from "../../lib/i18n/formatPriceStr";
import { createBooking } from "../../lib/bookingsFirestore";
import { useAuth } from "../../lib/AuthContext";
import { ClockIcon, LocationIcon } from "../../components/Icons";

export default function TourDetailPage() {
  const params = useParams();
  const { user } = useAuth() ?? {};
  const { t, lang, isEnglish, isRussian } = useLanguage();
  const { format } = useCurrency();
  const routeId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const tourId = typeof routeId === "string" ? routeId : "";

  const [fsTour, setFsTour] = useState(null);
  const [fsLoading, setFsLoading] = useState(true);
  const [allFsTours, setAllFsTours] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [bookingName, setBookingName] = useState("");
  const [bookingPhone, setBookingPhone] = useState("");
  const [bookingPeople, setBookingPeople] = useState("2");
  const [messengerPref, setMessengerPref] = useState("WhatsApp");
  const [bookingNotes, setBookingNotes] = useState("");
  const [tourType, setTourType] = useState("group");
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [expandedStep, setExpandedStep] = useState(null);
  const [hoveredStop, setHoveredStop] = useState(null);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [activeDetailTab, setActiveDetailTab] = useState("includes");
  const [lightboxImgIndex, setLightboxImgIndex] = useState(null);
  const [showMobileStickyBtn, setShowMobileStickyBtn] = useState(false);
  const bookingSidebarRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setFsLoading(true);
    (async () => {
      try {
        // A direct document read is the fast path. If an old/deployed rule or
        // a transient client read fails, fall back to the collection already
        // used successfully by the public lists, so a valid card never leads
        // to a false “tour not found” page.
        let raw = await getFirestoreTourById(tourId);
        if (!raw) {
          const tours = await listFirestoreTours();
          raw = tours.find((item) => item.id === tourId) || null;
        }
        if (!cancelled) setFsTour(raw ? normalizeFirestoreTour(raw, lang) : null);
      } catch (error) {
        try {
          const tours = await listFirestoreTours();
          const raw = tours.find((item) => item.id === tourId) || null;
          if (!cancelled) setFsTour(raw ? normalizeFirestoreTour(raw, lang) : null);
        } catch {
          console.error("Unable to load tour details", error);
          if (!cancelled) setFsTour(null);
        }
      } finally {
        if (!cancelled) setFsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tourId, lang]);

  // Load all Firestore (Admin panel) tours for the similar/popular sections
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await listFirestoreTours();
        if (!cancelled) {
          setAllFsTours(list.map((t) => normalizeFirestoreTour(t, lang)).filter(Boolean));
        }
      } catch {
        if (!cancelled) setAllFsTours([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

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
  const rawTour = fsTour;

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

  const similarTours = (allFsTours || []).filter((t) => t.id !== rawTour?.id).slice(0, 3);
  const popularTours = (allFsTours || []).filter((t) => t.isPopular && t.id !== rawTour?.id);

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
  if (isFirestoreTour && Array.isArray(rawTour.departureDates)) {
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

  const parsePriceNumber = (str) => {
    const m = String(str || "").replace(/\s/g, "").match(/\d+/);
    return m ? parseInt(m[0], 10) : 0;
  };
  const groupUnitPrice = isFirestoreTour
    ? (rawTour?.priceGroupNum || parsePriceNumber(tour?.priceGroup))
    : parsePriceNumber(tour?.priceGroup);
  const privateTotalPrice = isFirestoreTour
    ? (rawTour?.pricePrivateNum || parsePriceNumber(tour?.pricePrivate))
    : parsePriceNumber(tour?.pricePrivate);
  const peopleCount = Math.max(peopleMin, parseInt(bookingPeople, 10) || peopleMin);
  const baseTotalPrice = tourType === "group" ? groupUnitPrice * peopleCount : privateTotalPrice;
  const discountPercent = appliedCoupon?.discountPercent || 0;
  const discountAmount = appliedCoupon && baseTotalPrice > 0 ? Math.round(baseTotalPrice * (discountPercent / 100)) : 0;
  const totalPrice = Math.max(0, baseTotalPrice - discountAmount);

  const handleApplyCoupon = (overrideCode) => {
    const code = (typeof overrideCode === "string" ? overrideCode : couponCodeInput).trim().toUpperCase();
    if (!code) {
      setCouponError(t("bookingCoupon.enterCode") || "შეიყვანეთ კუპონის კოდი");
      return;
    }
    const validCodes = ["WELCOME10", "GEO10", "COUPON10"];
    if (validCodes.includes(code)) {
      setAppliedCoupon({ code, discountPercent: 10 });
      setCouponError("");
      setCouponSuccess(t("bookingCoupon.appliedSuccess") || "10%-იანი ფასდაკლება გააქტიურებულია!");
      setCouponCodeInput("");
    } else {
      setCouponError(t("bookingCoupon.invalidCode") || "არასწორი კუპონის კოდი");
      setCouponSuccess("");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
    setCouponSuccess("");
  };

  // Auto-select nearest available date from today if not manually selected.
  // Only applies to GROUP tours — individual tours can pick any date.
  useEffect(() => {
    if (tourType === "group" && groupDatesMMDD.length > 0) {
      const findNearestDate = (dates) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const currentYear = now.getFullYear();
        let closestDate = null;
        let minDiff = Infinity;

        for (const dateStr of dates) {
          const parts = dateStr.split(".");
          if (parts.length !== 2) continue;
          const month = parseInt(parts[0], 10) - 1;
          const day = parseInt(parts[1], 10);

          let target = new Date(currentYear, month, day);
          target.setHours(0, 0, 0, 0);

          if (target <= now) {
            continue;
          }

          const diff = target.getTime() - now.getTime();
          if (diff >= 0 && diff < minDiff) {
            minDiff = diff;
            closestDate = target;
          }
        }

        if (!closestDate) return "";
        const yyyy = closestDate.getFullYear();
        const mm = String(closestDate.getMonth() + 1).padStart(2, "0");
        const dd = String(closestDate.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      };

      const nearest = findNearestDate(groupDatesMMDD);
      if (nearest) {
        setSelectedDate(nearest);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourId, tourType]);

  // When switching tour type, make sure the selected date is valid for group tours
  // When switching tour type, make sure the selected date is valid for group tours
  const handleTourTypeChange = (type) => {
    if (type === "group" && !hasGroupDates) return;
    setTourType(type);
    if (type === "group" && selectedDate) {
      // If currently selected date is not one of the group's free dates, clear it
      const [, mm, dd] = selectedDate.split("-");
      if (!groupDatesMMDD.includes(`${mm}.${dd}`)) {
        setSelectedDate("");
      }
    }
  };

  useEffect(() => {
    const sidebarElem = bookingSidebarRef.current;
    let isSidebarIntersecting = false;

    const checkStickyVisibility = () => {
      const isScrolledDown = window.scrollY > 100;
      setShowMobileStickyBtn(isScrolledDown && !isSidebarIntersecting);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isSidebarIntersecting = entry.isIntersecting;
        checkStickyVisibility();
      },
      { threshold: 0.15 }
    );

    if (sidebarElem) observer.observe(sidebarElem);
    window.addEventListener("scroll", checkStickyVisibility, { passive: true });
    checkStickyVisibility();

    return () => {
      if (sidebarElem) observer.unobserve(sidebarElem);
      window.removeEventListener("scroll", checkStickyVisibility);
      observer.disconnect();
    };
  }, []);

  const scrollToBooking = () => {
    if (bookingSidebarRef.current) {
      bookingSidebarRef.current.scrollIntoView({ behavior: "smooth" });
    } else {
      const elem = document.getElementById("mobile-booking-target");
      if (elem) elem.scrollIntoView({ behavior: "smooth" });
    }
  };

  const toggleStep = (idx) => {
    setExpandedStep(expandedStep === idx ? null : idx);
  };

  // Convert a "DD.MM" schedule chip into a "YYYY-MM-DD" value for the booking form
  const scheduleDateToIso = (chip) => {
    const [dd, mm] = String(chip).split(".");
    if (!dd || !mm) return "";
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const monthIndex = parseInt(mm, 10) - 1;
    const day = parseInt(dd, 10);
    let target = new Date(now.getFullYear(), monthIndex, day);
    target.setHours(0, 0, 0, 0);
    if (target <= now) return "";
    const yyyy = target.getFullYear();
    return `${yyyy}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const pickScheduleDate = (chip) => {
    if (isFirestoreTour && rawTour && Array.isArray(rawTour.departureDates)) {
      const match = rawTour.departureDates.find((e) => {
        if (!e?.date) return false;
        const [, mm, dd] = e.date.split("-");
        return `${dd}.${mm}` === chip;
      });
      if (match) {
        setTourType("group");
        setSelectedDate(match.date);
        scrollToBooking();
        return;
      }
    }
    const iso = scheduleDateToIso(chip);
    if (!iso) return;
    setTourType("group");
    setSelectedDate(iso);
    scrollToBooking();
  };

  const handleBookingSubmit = (e) => {
    e.preventDefault();

    const headers = {
      ka: "✈️ *GeorgiaTrips — ტურის ჯავშანი*",
      en: "✈️ *GeorgiaTrips — Tour Booking*",
      ru: "✈️ *GeorgiaTrips — Бронирование тура*",
      tr: "✈️ *GeorgiaTrips — Tur Rezervasyonu*",
      ar: "✈️ *GeorgiaTrips — حجز جولة سياحية*",
    };
    const labels = {
      ka: { tour: "ტური", type: "ტიპი", date: "თარიღი", name: "სახელი", phone: "ტელეფონი", people: "მგზავრები", price: "ფასი", notes: "შენიშვნები", group: "ჯგუფური", private: "ინდივიდუალური", agreement: "შეთანხმებით", unprovided: "არ არის მითითებული" },
      en: { tour: "Tour", type: "Type", date: "Date", name: "Name", phone: "Phone", people: "Passengers", price: "Price", notes: "Notes", group: "Group Tour", private: "Private Tour", agreement: "By Agreement", unprovided: "Not specified" },
      ru: { tour: "Тур", type: "Тип", date: "Дата", name: "Имя", phone: "Телефон", people: "Пассажиры", price: "Цена", notes: "Примечания", group: "Групповой тур", private: "Индивидуальный тур", agreement: "По договоренности", unprovided: "Не указано" },
      tr: { tour: "Tur", type: "Tür", date: "Tarih", name: "İsim", phone: "Telefon", people: "Yolcu Sayısı", price: "Fiyat", notes: "Notlar", group: "Grup Turu", private: "Özel Tur", agreement: "Anlaşmaya Göre", unprovided: "Belirtilmedi" },
      ar: { tour: "الجولة", type: "النوع", date: "التاريخ", name: "الاسم", phone: "الهاتف", people: "عدد الركاب", price: "السعر", notes: "ملاحظات", group: "جولة جماعية", private: "جولة خاصة", agreement: "حسب الاتفاق", unprovided: "غير محدد" },
    };
    const l = labels[lang] || labels.ka;

    // Save online booking to Firestore
    createBooking({
      type: "tour",
      tourId: tour?.id || tourId,
      tourTitle: asLocalizedText(tour.title, lang),
      tourType: tourType,
      date: selectedDate || "by_agreement",
      name: bookingName.trim(),
      phone: bookingPhone.trim(),
      people: Number(bookingPeople) || 1,
      channel: messengerPref,
      originalPrice: baseTotalPrice,
      price: totalPrice,
      couponCode: appliedCoupon ? appliedCoupon.code : null,
      discountAmount: discountAmount,
      notes: bookingNotes.trim(),
      language: lang,
    });

    const msgLines = [
      headers[lang] || headers.ka,
      `━━━━━━━━━━━━━━━━━━`,
      `📍 *${l.tour}:* ${asLocalizedText(tour.title, lang)}`,
      `🎫 *${l.type}:* ${tourType === "group" ? l.group : l.private}`,
      `📅 *${l.date}:* ${selectedDate || l.agreement}`,
      `👤 *${l.name}:* ${bookingName.trim() || l.unprovided}`,
      `📞 *${l.phone}:* ${bookingPhone.trim() || l.unprovided}`,
      `👥 *${l.people}:* ${bookingPeople}`,
      `💬 *Messenger:* ${messengerPref}`,
      tourType === "group" && groupUnitPrice
        ? `💰 *${l.price}:* ₾${groupUnitPrice} × ${peopleCount} = *₾${totalPrice}*`
        : "",
      tourType === "private" && privateTotalPrice
        ? `💰 *${l.price}:* *₾${totalPrice}*`
        : "",
      bookingNotes.trim() ? `📝 *${l.notes}:* ${bookingNotes.trim()}` : "",
    ].filter(Boolean);

    const fullMessage = msgLines.join("\n");
    window.open(`${WA_LINK}?text=${encodeURIComponent(fullMessage)}`, "_blank");
  };

  const openLightbox = (index) => {
    setLightboxImgIndex(index);
  };

  const closeLightbox = () => {
    setLightboxImgIndex(null);
  };

  const prevLightboxImg = (e) => {
    e.stopPropagation();
    if (lightboxImgIndex !== null && tour.gallery) {
      setLightboxImgIndex((lightboxImgIndex - 1 + tour.gallery.length) % tour.gallery.length);
    }
  };

  const nextLightboxImg = (e) => {
    e.stopPropagation();
    if (lightboxImgIndex !== null && tour.gallery) {
      setLightboxImgIndex((lightboxImgIndex + 1) % tour.gallery.length);
    }
  };

if (fsLoading) {
    return (
      <div className="tour-page-wrapper">
        <Navbar active="tours" />
        <div className="container" style={{ padding: "8rem 1.5rem", textAlign: "center" }}>
          <p style={{ color: "var(--text-mute)" }}>{t("common.loading")}</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!rawTour || !tour) {
    return (
      <div className="tour-page-wrapper">
        <Navbar active="tours" />
        <div className="container" style={{ padding: "8rem 1.5rem", textAlign: "center" }}>
          <h1 style={{ marginBottom: "1rem" }}>ტური ვერ მოიძებნა</h1>
          <Link href="/tours" style={{ color: "var(--blue)", fontWeight: 700 }}>← ტურების სია</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="tour-page-wrapper">
      <Navbar active="tours" />

      {tour && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": ["TouristTrip", "Product"],
                  "@id": `https://georgiatrips.ge/tours/${tourId}#tour`,
                  "name": asLocalizedText(tour.title, lang),
                  "description": asLocalizedText(tour.desc, lang),
                  "image": tour.img ? (tour.img.startsWith("http") ? tour.img : `https://georgiatrips.ge${tour.img.startsWith("/") ? "" : "/"}${tour.img}`) : "https://georgiatrips.ge/hero.webp",
                  "offers": {
                    "@type": "AggregateOffer",
                    "lowPrice": tour.priceNumber || (typeof tour.price === "number" ? tour.price : 80),
                    "highPrice": (tour.priceNumber || 100) * 4,
                    "priceCurrency": "GEL",
                    "offerCount": 2,
                    "availability": "https://schema.org/InStock",
                    "url": `https://georgiatrips.ge/tours/${tourId}`,
                  },
                  "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "4.9",
                    "reviewCount": "18",
                    "bestRating": "5",
                    "worstRating": "1",
                  },
                  "provider": {
                    "@type": "TravelAgency",
                    "name": "GeorgiaTrips",
                    "url": "https://georgiatrips.ge",
                    "telephone": "+995504220020",
                    "sameAs": SOCIAL_PROFILES,
                  },
                  "touristType": ["Adventure", "Cultural", "Sightseeing", "Nature"],
                  "itinerary": tour.itinerary?.map((item) => ({
                    "@type": "TouristDestination",
                    "name": asLocalizedText(item.title, lang),
                    "description": asLocalizedText(item.desc, lang),
                  })),
                },
                {
                  "@type": "BreadcrumbList",
                  "@id": `https://georgiatrips.ge/tours/${tourId}#breadcrumbs`,
                  "itemListElement": [
                    {
                      "@type": "ListItem",
                      "position": 1,
                      "name": lang === "ka" ? "მთავარი" : "Home",
                      "item": "https://georgiatrips.ge",
                    },
                    {
                      "@type": "ListItem",
                      "position": 2,
                      "name": lang === "ka" ? "ტურები" : "Tours",
                      "item": "https://georgiatrips.ge/tours",
                    },
                    {
                      "@type": "ListItem",
                      "position": 3,
                      "name": asLocalizedText(tour.title, lang),
                      "item": `https://georgiatrips.ge/tours/${tourId}`,
                    },
                  ],
                },
                {
                  "@type": "FAQPage",
                  "@id": `https://georgiatrips.ge/tours/${tourId}#faq`,
                  "mainEntity": tourFaqs.map((faq) => ({
                    "@type": "Question",
                    "name": faq.q,
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": faq.a,
                    },
                  })),
                },
              ],
            }),
          }}
        />
      )}

      {/* 1. HERO SHOWCASE SECTION — editorial media + overlapping info panel */}
      <section className="tdp-hero2">
        <div className="tdp-hero2-media">
          <Image
            src={tour.img || "/hero.webp"}
            alt={asLocalizedText(tour.title, lang)}
            fill
            priority
            sizes="100vw"
            style={{ objectFit: "cover" }}
          />
          <div className="tdp-hero2-scrim" />

          <div className="container tdp-hero2-topbar">
            <nav className="tdp-hero2-crumbs" aria-label="ნავიგაცია">
              <Link href="/">{t("tourDetail.crumbsHome")}</Link>
              <span className="sep">/</span>
              <Link href="/tours">{t("tourDetail.crumbsTours")}</Link>
              <span className="sep">/</span>
              <span className="active">{asLocalizedText(tour.title, lang)}</span>
            </nav>

            <span className="tdp-hero2-badge">
              {(t("tourBadges") || {})[asLocalizedText(tour.badge, lang)] || asLocalizedText(tour.badge, lang) || t("tourDetail.popularBadge")}
            </span>
          </div>

          <div className="container tdp-hero2-caption">
            <span className="tdp-hero2-kicker">
              {(() => {
                const isMultiday = tour.type === "multiday" || (tour.tourSectionLabel && tour.tourSectionLabel.includes("მრავალდღიანი"));
                if (lang === "en") return isMultiday ? "Multi-day Excursion" : "One-day Excursion";
                if (lang === "ru") return isMultiday ? "Многодневная экскурсия" : "Однодневная экскурсия";
                if (lang === "tr") return isMultiday ? "Çok Günlük Tur" : "Günübirlik Tur";
                if (lang === "ar") return isMultiday ? "رحلة متعددة الأيام" : "رحلة يومية";
                return isMultiday ? "მრავალდღიანი ექსკურსია" : "ერთდღიანი ექსკურსია";
              })()}
            </span>
            <h1 className="tdp-hero2-title">{asLocalizedText(tour.title, lang)}</h1>
          </div>
        </div>

        <div className="container">
          <div className="tdp-hero2-panel">
            <div className="tdp-hero2-facts">
              <div className="tdp-hero2-fact">
                <span className="fact-label">{t("tourDetail.duration")}</span>
                <strong className="fact-value">
                  {translateDuration(tour.duration, lang) || (lang === "en" ? "1 Day / 0 Nights" : lang === "ru" ? "1 день / 0 ночей" : lang === "tr" ? "1 Gün / 0 Gece" : lang === "ar" ? "1 يوم / 0 ليالي" : "1 დღე / 0 ღამე")}
                </strong>
              </div>
              <div className="tdp-hero2-fact">
                <span className="fact-label">{t("tourDetail.destination")}</span>
                <strong className="fact-value">{translateLocation(tour.location || tour.destination || t("common.georgia"), lang)}</strong>
              </div>
              <div className="tdp-hero2-fact">
                <span className="fact-label">{t("tourDetail.group")}</span>
                <strong className="fact-value">
                  {isFirestoreTour
                    ? `${configuredPeopleMin}-${groupMaxCap} ${t("tourDetail.peopleSuffix")}`
                    : `1-18 ${t("tourDetail.peopleSuffix")}`}
                </strong>
              </div>
              <div className="tdp-hero2-fact">
                <span className="fact-label">{t("tourDetail.price")}</span>
                <strong className="fact-value accent">{format(tour.priceGroup, lang)}</strong>
              </div>
            </div>

            <button type="button" className="tdp-hero2-cta" onClick={scrollToBooking}>
              {t("tourDetail.bookNow")}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* 2. MAIN CONTENT GRID SECTION */}
      <section className="tdp-main-section">
        <div className="container tdp-grid-layout">

          {/* LEFT COLUMN: Main Tour Details */}
          <div className="tdp-content-col">

            {/* SECTION 1: ABOUT EXCURSION */}
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

            {/* SECTION 2: ZIGZAG CONNECTED ROUTE MAP */}
            <article className="tdp-card-block">
              <div className="tdp-card-header">
                <div>
                  <h2>{t("tourDetail.routeTitle")}</h2>
                  <p className="subtitle">{t("tourDetail.routeSubtitle")}</p>
                </div>
              </div>

              <div className="tdp-card-body">
                <div className="tdp-zigzag-wrapper">
                  
                  {/* Dynamic Zigzag SVG Line Connecting Points */}
                  <svg className="tdp-zigzag-svg-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                    <path
                      d="M 22 8 L 78 24 L 22 40 L 78 56 L 22 72 L 78 88"
                      fill="none"
                      stroke="url(#zigzagTrailGrad)"
                      strokeWidth="2.5"
                      strokeDasharray="4 3"
                    />
                    <defs>
                      <linearGradient id="zigzagTrailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#106da4" />
                        <stop offset="50%" stopColor="#29b2b7" />
                        <stop offset="100%" stopColor="#fab418" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Connected Zigzag Nodes List */}
                  <div className="tdp-zigzag-nodes-list">
                    {tour.itinerary && tour.itinerary.map((item, idx) => {
                      const stopImg = item.img || tour.gallery?.[idx % (tour.gallery?.length || 1)] || tour.img;
                      const isHovered = hoveredStop === idx;
                      const isRight = idx % 2 !== 0;

                      return (
                        <div
                          key={idx}
                          className={`tdp-zigzag-node-item ${isRight ? "pos-right" : "pos-left"} ${isHovered ? "is-active" : ""}`}
                          onMouseEnter={() => setHoveredStop(idx)}
                          onMouseLeave={() => setHoveredStop(null)}
                          onClick={() => {
                            if (item.placeId) {
                              window.location.href = "/places/" + item.placeId;
                              return;
                            }
                            const galIdx = tour.gallery?.indexOf(stopImg);
                            openLightbox(galIdx >= 0 ? galIdx : 0);
                          }}
                          role={item.placeId ? "link" : undefined}
                          tabIndex={item.placeId ? 0 : undefined}
                        >
                          {/* Circular Point Dot Button */}
                          <div className="tdp-zigzag-dot-btn">
                            <span className="zigzag-dot-ring" />
                            <span className="zigzag-dot-num">{idx + 1}</span>
                          </div>

                          {/* Short Label Beside Dot */}
                          <div className="tdp-zigzag-label">
                            <small>{t("tourDetail.locationPrefix")}{idx + 1}</small>
                            <strong>{asLocalizedText(item.title, lang)}</strong>
                          </div>

                          {/* Hover Popover Tooltip Card */}
                          {isHovered && (
                            <div className="tdp-dot-hover-popover" onClick={(e) => e.stopPropagation()}>
                              <div className="popover-triangle" />
                              <div className="popover-content">
                                <span className="popover-tag">📍 {t("tourDetail.locationPrefix")}{idx + 1}</span>
                                <h4>{asLocalizedText(item.title, lang)}</h4>
                                <p>{asLocalizedText(item.desc, lang)}</p>
                                {item.placeId && (
                                  <Link href={"/places/" + item.placeId} className="tdp-place-detail-link" onClick={(e) => e.stopPropagation()}>
                                    {t("tourDetail.placeDetails")} <span>→</span>
                                  </Link>
                                )}

                                <div className="popover-photo-box">
                                  <Image
                                    src={stopImg}
                                    alt={asLocalizedText(item.title, lang)}
                                    fill
                                    style={{ objectFit: "cover" }}
                                    sizes="300px"
                                  />
                                  <div className="popover-photo-overlay">
                                    <button
                                      type="button"
                                      className="btn-popover-zoom"
                                      onClick={() => {
                                        const galIdx = tour.gallery?.indexOf(stopImg);
                                        openLightbox(galIdx >= 0 ? galIdx : 0);
                                      }}
                                    >
                                      {t("tourDetail.viewPhoto")}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>
            </article>

            {/* SECTION 3: MINIMALIST & ORIGINAL EXCURSION DETAILS */}
            <article className="tdp-card-block tdp-minimalist-details-block">
              <div className="tdp-minimalist-header">
                <h2>{t("tourDetail.detailsTitle")}</h2>
              </div>

              <div className="tdp-minimalist-grid">
                {/* 1. Departure */}
                <div className="tdp-min-card">
                  <div className="tdp-min-icon-box">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div className="tdp-min-info">
                    <span className="tdp-min-label">{t("tourDetail.departure")}</span>
                    <strong className="tdp-min-value">{translateLocation(tour.departure || tour.location || tour.destination || "Batumi", lang)}</strong>
                  </div>
                </div>

                {/* 2. Departure time */}
                <div className="tdp-min-card">
                  <div className="tdp-min-icon-box">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <div className="tdp-min-info">
                    <span className="tdp-min-label">{t("tourDetail.departureTime")}</span>
                    <strong className="tdp-min-value">{t("tourDetail.byAgreement")}</strong>
                  </div>
                </div>

                {/* 3. Payment */}
                <div className="tdp-min-card">
                  <div className="tdp-min-icon-box">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="5" width="20" height="14" rx="3" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                  </div>
                  <div className="tdp-min-info">
                    <span className="tdp-min-label">{t("tourDetail.payment")}</span>
                    <strong className="tdp-min-value">{t("tourDetail.paymentDesc")}</strong>
                  </div>
                </div>
              </div>
            </article>

            {/* SECTION 4: THIS TOUR'S SCHEDULE & FREE DATES */}
            {tourSchedule.length > 0 ? (
              <article className="tdp-card-block tdp-schedule-block">
                <div className="tdp-card-header">
                  <div>
                    <h2>{t("tourDetail.scheduleTitle")}</h2>
                    <p className="subtitle">{t("tourDetail.scheduleSubtitle")}</p>
                  </div>
                </div>

                <div className="tdp-card-body">
                  <div className="tdp-schedule-months">
                    {tourSchedule.map((mGroup) => (
                      <div key={mGroup.monthName} className="tdp-schedule-month">
                        <span className="tdp-schedule-month-pill">{translateMonthName(mGroup.monthName, lang)}</span>
                        <div className="tdp-schedule-days">
                          {mGroup.dates.map((d) => {
                            const iso = scheduleDateToIso(d);
                            const isActive = iso && iso === selectedDate;
                            return (
                              <button
                                key={d}
                                type="button"
                                className={`tdp-schedule-chip${isActive ? " is-active" : ""}`}
                                onClick={() => pickScheduleDate(d)}
                                title={`${d} — ${asLocalizedText(tour.title, lang)}`}
                              >
                                {d}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="tdp-schedule-legend">
                    <span className="legend-item">
                      <i className="legend-dot free" /> {t("tourDetail.freeDay")}
                    </span>
                    <span className="legend-item">
                      <i className="legend-dot picked" /> {t("tourDetail.selectedDate")}
                    </span>
                    <span className="legend-note">{t("tourDetail.otherDatesNote")}</span>
                  </div>
                </div>
              </article>
            ) : (
              <article className="tdp-card-block tdp-schedule-block">
                <div className="tdp-card-header">
                  <div>
                    <h2>{t("tourDetail.scheduleTitle")}</h2>
                  </div>
                </div>
                <div className="tdp-card-body">
                  <div className="tdp-no-schedule-box">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                      <line x1="9" y1="15" x2="15" y2="19" />
                      <line x1="15" y1="15" x2="9" y2="19" />
                    </svg>
                    <div>
                      <strong>{t("tourDetail.noScheduleTitle")}</strong>
                      <p>{t("tourDetail.noScheduleDesc")}</p>
                    </div>
                  </div>
                </div>
              </article>
            )}

            {/* SECTION 5: PHOTO GALLERY */}
            {tour.gallery && tour.gallery.length > 0 && (
              <article className="tdp-card-block">
                <div className="tdp-card-header">
                  <div>
                    <h2>{t("tourDetail.galleryTitle")}</h2>
                    <p className="subtitle">{t("tourDetail.gallerySubtitle")}</p>
                  </div>
                </div>

                <div className="tdp-card-body">
                  <div className="tdp-gallery-grid">
                    {tour.gallery.map((gImg, idx) => {
                      const item = tour.galleryItems?.[idx];
                      const locTitle = item?.locationTitle;
                      return (
                        <div
                          key={idx}
                          className="tdp-gallery-item"
                          onClick={() => openLightbox(idx)}
                          style={{ position: "relative" }}
                        >
                          <Image
                            src={gImg}
                            alt={`${asLocalizedText(tour.title, lang)} ${idx + 1}`}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            style={{ objectFit: "cover" }}
                          />
                          {locTitle && (
                            <div style={{ position: "absolute", top: "10px", left: "10px", zIndex: 2, pointerEvents: "none", maxWidth: "calc(100% - 20px)" }}>
                              <span style={{ 
                                background: "rgba(13, 35, 58, 0.8)", 
                                backdropFilter: "blur(6px)", 
                                color: "#ffffff", 
                                fontSize: "0.78rem", 
                                fontWeight: 700, 
                                padding: "4px 10px", 
                                borderRadius: "6px",
                                border: "1px solid rgba(255,255,255,0.2)",
                                display: "inline-block",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: "100%",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
                              }}>
                                📍 {locTitle}
                              </span>
                            </div>
                          )}
                          <div className="gallery-zoom-badge">
                            <span>{t("tourDetail.enlarge")}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </article>
            )}

          </div>

          {/* RIGHT COLUMN: STICKY BOOKING & PRICING SIDEBAR */}
          <aside className="tdp-sidebar-col" ref={bookingSidebarRef} id="mobile-booking-target">
            <div className="tdp-sticky-card">
              
              {/* Pricing Banner Box */}
              <div className="tdp-price-box">
                <span className="price-header-label">{t("tourDetail.priceHeader")}</span>
                
                <div className="price-cards-stack">
                  {/* Group Tour Price */}
                  {hasGroupSupport && tour.priceGroup && (
                    <button
                      type="button"
                      className={`price-tier-card group${tourType === "group" ? " is-selected" : ""}${!hasGroupDates ? " is-unavailable" : ""}`}
                      onClick={() => handleTourTypeChange("group")}
                      disabled={!hasGroupDates}
                      aria-pressed={tourType === "group"}
                    >
                      <div className="tier-info">
                        <strong>{t("tourDetail.groupTour")}</strong>
                        <small>{hasGroupDates ? t("tourDetail.fixedSchedule") : t("tourDetail.notScheduled")}</small>
                      </div>
                      <div className="tier-amount">{format(tour.priceGroup, lang)}</div>
                    </button>
                  )}

                  {/* Private Tour Price */}
                  {hasPrivateSupport && tour.pricePrivate && (
                    <button
                      type="button"
                      className={`price-tier-card private${tourType === "private" ? " is-selected" : ""}`}
                      onClick={() => handleTourTypeChange("private")}
                      aria-pressed={tourType === "private"}
                    >
                      <div className="tier-info">
                        <strong>{t("tourDetail.privateTour")}</strong>
                        <small>{t("tourDetail.onlyYourGroup")}</small>
                      </div>
                      <div className="tier-amount">{format(tour.pricePrivate, lang)}</div>
                    </button>
                  )}
                </div>
              </div>

              {/* High Conversion Booking Form */}
              <form className="tdp-booking-form" onSubmit={handleBookingSubmit}>
                <h3>{t("tourDetail.onlineBooking")}</h3>
                <p className="form-sub">{t("tourDetail.formSubtitle")}</p>

                <div className="tdp-form-group">
                  <label>{t("tourDetail.yourName")}</label>
                  <input
                    type="text"
                    placeholder={t("tourDetail.namePlaceholder")}
                    value={bookingName}
                    onChange={(e) => setBookingName(e.target.value)}
                    required
                  />
                </div>

                <div className="tdp-form-group">
                  <label>{t("tourDetail.tourType")}</label>
                  <div className="tdp-tour-type-switch" role="radiogroup" aria-label={t("tourDetail.tourType")}>
                    {hasGroupSupport && (
                      <button
                        type="button"
                        role="radio"
                        aria-checked={tourType === "group"}
                        className={`tdp-type-option${tourType === "group" ? " is-active" : ""}${!hasGroupDates ? " is-disabled" : ""}`}
                        onClick={() => handleTourTypeChange("group")}
                        disabled={!hasGroupDates}
                      >
                        <strong>{t("tourDetail.groupType")}</strong>
                        <small>{groupUnitPrice ? `${format(groupUnitPrice, lang)}/${t("tourDetail.perPerson")}` : "—"}</small>
                      </button>
                    )}
                    {hasPrivateSupport && (
                      <button
                        type="button"
                        role="radio"
                        aria-checked={tourType === "private"}
                        className={`tdp-type-option${tourType === "private" ? " is-active" : ""}`}
                        onClick={() => handleTourTypeChange("private")}
                      >
                        <strong>{t("tourDetail.privateType")}</strong>
                        <small>{privateTotalPrice ? `${format(privateTotalPrice, lang)} ${t("tourDetail.total")}` : t("tourDetail.byAgreement")}</small>
                      </button>
                    )}
                  </div>
                  {hasGroupSupport && !hasGroupDates && (
                    <p className="tdp-no-group-note">
                      {t("tourDetail.noScheduleDesc")}
                    </p>
                  )}
                </div>

                <div className="tdp-form-group">
                  <label>{t("tourDetail.departureDate")}</label>
                  <DatePicker
                    value={selectedDate}
                    onChange={(dStr) => setSelectedDate(dStr)}
                    placeholder={t("tourDetail.selectDatePlaceholder")}
                    direction="down"
                    availableDates={tourType === "group" ? groupDatesMMDD : null}
                  />
                  {tourType === "private" && (
                    <p className="tdp-type-hint">{t("tourDetail.privateDateHint")}</p>
                  )}
                </div>

                <div className="tdp-form-group">
                  <label>{t("tourDetail.peopleCount")}</label>
                  <input
                    type="number"
                    min={peopleMin}
                    max={peopleMax}
                    placeholder="2"
                    value={bookingPeople}
                    onChange={(e) => {
                      const v = e.target.value;
                      const n = parseInt(v, 10);
                      if (v !== "" && !isNaN(n) && n > peopleMax) {
                        setBookingPeople(String(peopleMax));
                      } else {
                        setBookingPeople(v);
                      }
                    }}
                    required
                  />
                  {tourType === "group" && freeSeatsForSelected != null && (
                    <p className="tdp-type-hint">
                      {t("tourDetail.groupSeatsHint").replace("{seats}", freeSeatsForSelected).replace("{max}", peopleMax)}
                    </p>
                  )}
                </div>

                <div className="tdp-form-group">
                  <label>{t("tourDetail.phoneLabel")}</label>
                  <input
                    type="tel"
                    placeholder="+995 5XX XX XX XX"
                    value={bookingPhone}
                    onChange={(e) => setBookingPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="tdp-form-group">
                  <label>{t("tourDetail.preferredContact")}</label>
                  <select
                    value={messengerPref}
                    onChange={(e) => setMessengerPref(e.target.value)}
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Viber">Viber</option>
                    <option value="Telegram">Telegram</option>
                    <option value="Direct Call">{t("tourDetail.phoneCall")}</option>
                  </select>
                </div>

                <div className="tdp-form-group">
                  <label>{t("tourDetail.notesLabel")}</label>
                  <textarea
                    rows={2}
                    placeholder={t("tourDetail.notesPlaceholder")}
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                  />
                </div>

                {/* Coupon Apply Section */}
                <div className="tdp-coupon-section">
                  <div className="tdp-coupon-label-row">
                    <label>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                      </svg>
                      <span>{t("bookingCoupon.title") || "ფასდაკლების კუპონი"}</span>
                    </label>
                    {appliedCoupon && (
                      <span className="tdp-coupon-active-badge">
                        ✓ 10% OFF
                      </span>
                    )}
                  </div>

                  {appliedCoupon ? (
                    <div className="tdp-coupon-applied-box">
                      <div className="tdp-coupon-applied-info">
                        <span className="tdp-coupon-applied-code">🎟️ {appliedCoupon.code}</span>
                        <span className="tdp-coupon-applied-desc">
                          {t("bookingCoupon.discountApplied") || "10%-იანი ფასდაკლება გააქტიურებულია"} (-{format(discountAmount, lang)})
                        </span>
                      </div>
                      <button
                        type="button"
                        className="tdp-coupon-remove-btn"
                        onClick={handleRemoveCoupon}
                        aria-label="Remove coupon"
                      >
                        {t("bookingCoupon.remove") || "გაუქმება"}
                      </button>
                    </div>
                  ) : (
                    <div className="tdp-coupon-input-wrap">
                      <div className="tdp-coupon-input-row">
                        <input
                          type="text"
                          placeholder={t("bookingCoupon.placeholder") || "მაგ: WELCOME10"}
                          value={couponCodeInput}
                          onChange={(e) => {
                            setCouponCodeInput(e.target.value);
                            setCouponError("");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleApplyCoupon();
                            }
                          }}
                          className="tdp-coupon-input"
                        />
                        <button
                          type="button"
                          className="tdp-coupon-apply-btn"
                          onClick={() => handleApplyCoupon()}
                        >
                          {t("bookingCoupon.applyBtn") || "გამოყენება"}
                        </button>
                      </div>

                      {user && (
                        <button
                          type="button"
                          className="tdp-coupon-quick-apply"
                          onClick={() => handleApplyCoupon("WELCOME10")}
                        >
                          <span>✨ {t("bookingCoupon.useMyWelcome") || "ჩემი 10%-იანი კუპონი (WELCOME10)"}</span>
                          <span className="tdp-quick-apply-tag">{t("bookingCoupon.apply") || "გამოყენება"}</span>
                        </button>
                      )}

                      {couponError && <p className="tdp-coupon-err-msg">{couponError}</p>}
                      {couponSuccess && <p className="tdp-coupon-success-msg">{couponSuccess}</p>}
                    </div>
                  )}
                </div>

                {baseTotalPrice > 0 && (
                  <div className="tdp-total-price-row">
                    <div className="total-price-label">
                      <span>{t("tourDetail.totalCost")}</span>
                      <small>
                        {tourType === "group"
                          ? t("tourDetail.groupPriceCalc").replace("{price}", groupUnitPrice).replace("{count}", peopleCount)
                          : t("tourDetail.privatePriceCalc")}
                      </small>
                    </div>
                    <div className="total-price-values">
                      {appliedCoupon && discountAmount > 0 ? (
                        <div className="tdp-discounted-price-box">
                          <span className="tdp-old-price">{format(baseTotalPrice, lang)}</span>
                          <span className="tdp-discount-tag">-10%</span>
                          <strong className="total-price-amount">{format(totalPrice, lang)}</strong>
                        </div>
                      ) : (
                        <strong className="total-price-amount">{format(totalPrice, lang)}</strong>
                      )}
                    </div>
                  </div>
                )}

                <button type="submit" className="btn-tdp-submit">
                  <span>{t("tourDetail.bookNow")}{totalPrice > 0 ? ` — ${format(totalPrice, lang)}` : ""}</span>
                </button>
              </form>

              {/* Direct Contacts Box */}
              <div className="tdp-direct-contacts">
                <p>{t("tourDetail.contactDirectly")}</p>
                <div className="contacts-btns-row">
                  <a
                    href={`${WA_LINK}?text=${encodeURIComponent(`Hello! I'm interested in tour: "${asLocalizedText(tour.title, lang)}"`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="contact-btn wa"
                  >
                    <span>💬 WhatsApp</span>
                  </a>
                  <a href={`tel:${WA_NUMBER}`} className="contact-btn phone">
                    <span>{t("tourDetail.callNow")}</span>
                  </a>
                </div>
              </div>

            </div>
          </aside>

        </div>
      </section>

      {/* ==================== SIMILAR TOURS SECTION ==================== */}
      {similarTours && similarTours.length > 0 && (
        <section className="similar-tours-section">
          <div className="similar-tours-container">
            <div className="similar-tours-header">
              <span className="similar-eyebrow">{t("tourDetail.discoverOther")}</span>
              <h2 className="similar-main-title">{t("tourDetail.similarTours")}</h2>
            </div>
            <div className="similar-tours-grid">
              {similarTours.map((item) => (
                <Link
                  key={item.id}
                  href={`/tours/${item.id}`}
                  className="tb-card"
                  style={{ textDecoration: "none" }}
                >
                  <div className="tb-card-img-wrap">
                    <Image
                      src={item.img || "/hero.png"}
                      alt={asLocalizedText(item.title, lang)}
                      className="tb-card-img"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      style={{ objectFit: "cover" }}
                      loading="lazy"
                    />
                    {item.badge && <span className="tb-badge">{(t("tourBadges") || {})[asLocalizedText(item.badge, lang)] || asLocalizedText(item.badge, lang)}</span>}
                    <div className="tb-overlay-right">
                      {item.pricePrivate && (
                        <div className="tb-price-tag tb-price-priv">
                          <small>{t("popular.privateLabel")}</small>
                          <strong>{item.pricePrivate}</strong>
                        </div>
                      )}
                      {item.priceGroup && (
                        <div className="tb-price-tag tb-price-group">
                          <small>{t("popular.groupPrice")}</small>
                          <strong>{item.priceGroup}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="tb-card-body">
                    <h3 className="tb-card-title">{asLocalizedText(item.title, lang)}</h3>
                    <p className="tb-card-annotation">{asLocalizedText(item.desc, lang)}</p>
                    <div className="tb-card-line"></div>
                    <div className="tb-card-facilities">
                      {item.duration && (
                        <span className="tb-facility-item" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                          <ClockIcon size={14} color="var(--teal)" />
                          <span>{translateDuration(item.duration, lang)}</span>
                        </span>
                      )}
                      {item.location && (
                        <span className="tb-facility-item" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                          <LocationIcon size={14} color="var(--teal)" />
                          <span>{(translateLocation(item.location, lang) || "").replace(/^📍\s*/, "")}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ==================== POPULAR TOURS SECTION ==================== */}
      {popularTours && popularTours.length > 0 && (
        <section className="similar-tours-section" style={{ borderTop: "1px solid #e2e8f0", background: "#f8fafc" }}>
          <div className="similar-tours-container">
            <div className="similar-tours-header">
              <span className="similar-eyebrow">{t("tourDetail.mostRequested")}</span>
              <h2 className="similar-main-title">{t("tourDetail.popularTours")}</h2>
            </div>
            <div className="similar-tours-grid">
              {popularTours.map((item) => (
                <Link
                  key={item.id}
                  href={`/tours/${item.id}`}
                  className="tb-card"
                  style={{ textDecoration: "none" }}
                >
                  <div className="tb-card-img-wrap">
                    <Image
                      src={item.img || "/hero.png"}
                      alt={asLocalizedText(item.title, lang)}
                      className="tb-card-img"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      style={{ objectFit: "cover" }}
                      loading="lazy"
                    />
                    {item.badge && <span className="tb-badge">{(t("tourBadges") || {})[asLocalizedText(item.badge, lang)] || asLocalizedText(item.badge, lang)}</span>}
                    <div className="tb-overlay-right">
                      {item.pricePrivate && (
                        <div className="tb-price-tag tb-price-priv">
                          <small>{t("popular.privateLabel")}</small>
                          <strong>{item.pricePrivate}</strong>
                        </div>
                      )}
                      {item.priceGroup && (
                        <div className="tb-price-tag tb-price-group">
                          <small>{t("popular.groupPrice")}</small>
                          <strong>{item.priceGroup}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="tb-card-body">
                    <h3 className="tb-card-title">{asLocalizedText(item.title, lang)}</h3>
                    <p className="tb-card-annotation">{asLocalizedText(item.desc, lang)}</p>
                    <div className="tb-card-line"></div>
                    <div className="tb-card-facilities">
                      {item.duration && (
                        <span className="tb-facility-item" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                          <ClockIcon size={14} color="var(--teal)" />
                          <span>{translateDuration(item.duration, lang)}</span>
                        </span>
                      )}
                      {item.location && (
                        <span className="tb-facility-item" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                          <LocationIcon size={14} color="var(--teal)" />
                          <span>{(translateLocation(item.location, lang) || "").replace(/^📍\s*/, "")}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ==================== SPECIAL EXCURSIONS CONTACT BANNER ==================== */}
      <section className="tdp-promo-contact-section">
        <div className="tdp-promo-contact-container">
          <div className="tdp-promo-contact-card">
            <div className="tdp-promo-header">
              <span className="tdp-promo-badge">{t("tourDetail.contactUs")}</span>
              <h2 className="tdp-promo-title">
                {t("tourDetail.promoTitle")}
              </h2>
              <p className="tdp-promo-subtitle">
                {t("tourDetail.promoSubtitle")}
              </p>
            </div>

            <div className="tdp-promo-contact-grid">
              {/* WhatsApp */}
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="tdp-social-box wa-box"
              >
                <div className="tdp-social-icon wa-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                  </svg>
                </div>
                <div className="tdp-social-details">
                  <span className="tdp-social-name">WhatsApp</span>
                  <strong className="tdp-social-val">{PHONE_DISPLAY}</strong>
                </div>
                <span className="tdp-social-arrow">→</span>
              </a>

              {/* Telegram */}
              <a
                href={TELEGRAM_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="tdp-social-box tg-box"
              >
                <div className="tdp-social-icon tg-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.25.38-.51 1.07-.78 4.18-1.82 6.97-3.02 8.37-3.61 3.99-1.66 4.82-1.95 5.36-1.96.12 0 .38.03.55.17.14.12.18.28.2.45-.02.07-.02.16-.04.29z" />
                  </svg>
                </div>
                <div className="tdp-social-details">
                  <span className="tdp-social-name">Telegram</span>
                  <strong className="tdp-social-val">{TELEGRAM_HANDLE}</strong>
                </div>
                <span className="tdp-social-arrow">→</span>
              </a>

              {/* Instagram */}
              <a
                href={INSTAGRAM_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="tdp-social-box ig-box"
              >
                <div className="tdp-social-icon ig-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                  </svg>
                </div>
                <div className="tdp-social-details">
                  <span className="tdp-social-name">Instagram</span>
                  <strong className="tdp-social-val">{INSTAGRAM_HANDLE}</strong>
                </div>
                <span className="tdp-social-arrow">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FAQ SECTION ==================== */}
      <section className="section" id="faq" style={{ borderTop: "1px solid #e2e8f0", background: "#ffffff" }}>
        <div className="section-inner">
          <div className="section-header">
            <span className="section-eyebrow">{t("faq.eyebrow")}</span>
            <h2 className="section-title">{t("faq.title")}</h2>
            <p className="section-desc">{t("faq.desc")}</p>
            <div className="gold-line"></div>
          </div>
          <div className="faq-list">
            {tourFaqs.map((faq, idx) => (
              <div key={idx} className={`faq-item ${openFaqIndex === idx ? "open" : ""}`}>
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  aria-expanded={openFaqIndex === idx}
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

      {/* LIGHTBOX MODAL */}
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
              {tour.galleryItems?.[lightboxImgIndex]?.locationTitle && (
                <span style={{ color: "var(--teal, #29b2b7)", fontWeight: 700, fontSize: "0.95rem" }}>
                  📍 {tour.galleryItems[lightboxImgIndex].locationTitle}
                </span>
              )}
              <span>{lightboxImgIndex + 1} / {tour.gallery.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* STICKY MOBILE FLOATING BOOKING BAR */}
      {showMobileStickyBtn && (
        <div className="tdp-mobile-floating-bar">
          <div className="mobile-floating-price">
            <small>{t("tourDetail.pricePerPerson")}</small>
            <strong>{format(tour.priceGroup || tour.price || "₾70", lang)}</strong>
          </div>
          <button
            type="button"
            className="btn-mobile-floating-book"
            onClick={scrollToBooking}
          >
            {t("tourDetail.bookNow")}
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
}
