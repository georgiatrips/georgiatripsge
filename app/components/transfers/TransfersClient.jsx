"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Navbar from "../Navbar";
import Footer from "../Footer";
import PageHero from "../PageHero";
import DatePicker from "../DatePicker";
import { WA_LINK, WhatsAppIcon } from "../../lib/shared";
import { CheckIcon } from "../Icons";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { isValidPhone } from "../../lib/bookingModel";
import { trackEvent } from "../../lib/analytics";
import {
  TRANSFER_LOCATIONS,
  VEHICLE_RATES,
  calculateTransferQuote,
  findLocation,
} from "../../lib/transfers/routeCalculator";

export default function TransfersClient() {
  const { t, lang, isEnglish } = useLanguage();

  const [pickupLoc, setPickupLoc] = useState("თბილისის აეროპორტი (TBS)");
  const [dropoffLoc, setDropoffLoc] = useState("ბათუმი");
  const [selectedVehicleKey, setSelectedVehicleKey] = useState("sedan");
  const [transferDate, setTransferDate] = useState("");
  const [transferTime, setTransferTime] = useState("12:00");
  const [passengerCount, setPassengerCount] = useState("2");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default localized locations when language changes
  useEffect(() => {
    if (lang === "en") {
      setPickupLoc("Tbilisi Airport (TBS)");
      setDropoffLoc("Batumi");
    } else if (lang === "ru") {
      setPickupLoc("Аэропорт Тбилиси (TBS)");
      setDropoffLoc("Батуми");
    } else if (lang === "tr") {
      setPickupLoc("Tiflis Havalimanı (TBS)");
      setDropoffLoc("Batum");
    } else if (lang === "ar") {
      setPickupLoc("مطار تبليسي (TBS)");
      setDropoffLoc("باتومي");
    } else {
      setPickupLoc("თბილისის აეროპორტი (TBS)");
      setDropoffLoc("ბათუმი");
    }
  }, [lang]);

  const fleetKeys = ["sedan", "minivan", "jeep", "sprinter"];

  // Calculate dynamic quote in real-time
  const quote = useMemo(() => {
    return calculateTransferQuote(pickupLoc, dropoffLoc, selectedVehicleKey, lang);
  }, [pickupLoc, dropoffLoc, selectedVehicleKey, lang]);

  const selectedVehicleName =
    t(`transfersPage.vehicles.${selectedVehicleKey}.name`) ||
    VEHICLE_RATES[selectedVehicleKey]?.nameKa ||
    selectedVehicleKey;

  const currentVehicleRate = VEHICLE_RATES[selectedVehicleKey]?.ratePerKm || 1.7;

  // PICKUP LOCATIONS: Strictly only the 3 airports and 3 major cities
  const pickupAirports = useMemo(() => {
    return TRANSFER_LOCATIONS.filter((l) => l.category === "airport");
  }, []);

  const pickupCities = useMemo(() => {
    return TRANSFER_LOCATIONS.filter((l) =>
      ["batumi_city", "kutaisi_city", "tbilisi_city"].includes(l.id)
    );
  }, []);

  // DROPOFF LOCATIONS: All airports and all destinations
  const dropoffAirports = useMemo(() => {
    return TRANSFER_LOCATIONS.filter((l) => l.category === "airport");
  }, []);

  const dropoffDestinations = useMemo(() => {
    return TRANSFER_LOCATIONS.filter((l) => l.category !== "airport");
  }, []);

  const getLocationLabel = (loc) => {
    return loc.names[lang] || loc.names.ka || loc.names.en;
  };

  const handleSelectPickup = (loc) => {
    setPickupLoc(typeof loc === "string" ? loc : getLocationLabel(loc));
  };

  const handleSelectDropoff = (loc) => {
    setDropoffLoc(typeof loc === "string" ? loc : getLocationLabel(loc));
  };

  const handleSwapLocations = () => {
    setPickupLoc(dropoffLoc);
    setDropoffLoc(pickupLoc);
  };

  const handleSelectVehicle = (key) => {
    setSelectedVehicleKey(key);
    const maxPax = VEHICLE_RATES[key]?.capacityPax || 4;
    if (parseInt(passengerCount, 10) > maxPax) {
      setPassengerCount(String(maxPax));
    }
  };

  const perks = [
    { icon: "🪧", title: t("transfersPage.p1Title") || "აეროპორტის დახვედრა", desc: t("transfersPage.p1Desc") || "მძღოლი დაგხვდებათ ჩამოსვლის დარბაზში სახელიანი აბრით." },
    { icon: "🛡️", title: t("transfersPage.p2Title") || "ფრენის მონიტორინგი", desc: t("transfersPage.p2Desc") || "თვალს ვადევნებთ თქვენს ფრენას. დაგვიანებაზე ლოდინი უფასოა." },
    { icon: "✈️", title: t("transfersPage.p3Title") || "ფიქსირებული ტარიფები", desc: t("transfersPage.p3Desc") || "ფასი ფიქსირებულია და არ იცვლება საცობების ან ამინდის გამო." },
    { icon: "💬", title: t("transfersPage.p4Title") || "24/7 მხარდაჭერა", desc: t("transfersPage.p4Desc") || "მყისიერი კომუნიკაცია და დახმარება WhatsApp-ის საშუალებით." },
  ];

  const TRANSFER_TRUST_LABELS = {
    ka: {
      cancellation: "უფასო გაუქმება 24 სთ-ით ადრე",
      payOnArrival: "გადახდა ადგილზე — წინასწარი გადახდის გარეშე",
      instantWa: "მყისიერი დასტური WhatsApp-ით",
      guaranteed: "გარანტირებული ტრანსფერი & პირადი მძღოლი",
      aiBadge: "✨ AI ჭკვიანი ტრანსფერის კალკულატორი",
      calcTitle: "გამოთვალეთ მარშრუტი და ზუსტი ფასი",
      calcSub: "აირჩიეთ აყვანისა და ჩასვლის ადგილი. მანძილი, დრო და ფასი დაითვლება ავტომატურად.",
      airportsTab: "✈️ აეროპორტები",
      citiesTab: "🏙️ ქალაქები",
      popularTab: "📍 პოპულარული მიმართულებები",
      distance: "მანძილი",
      estTime: "სავარაუდო დრო",
      totalPrice: "სრული ღირებულება",
      swap: "ადგილების გაცვლა",
      svanetiIncluded: "🏔️ სვანეთის ტარიფი (+10%)",
    },
    en: {
      cancellation: "Free cancellation up to 24h before",
      payOnArrival: "Pay on arrival — no prepayment needed",
      instantWa: "Instant WhatsApp confirmation",
      guaranteed: "Guaranteed transfer & private driver",
      aiBadge: "✨ AI Smart Transfer Calculator",
      calcTitle: "Estimate Route, Distance & Instant Price",
      calcSub: "Select pickup and dropoff locations. Distance, time and price are calculated automatically.",
      airportsTab: "✈️ Airports",
      citiesTab: "🏙️ Cities",
      popularTab: "📍 Popular Destinations",
      distance: "Distance",
      estTime: "Estimated Time",
      totalPrice: "Total Fare",
      swap: "Swap Locations",
      svanetiIncluded: "🏔️ Svaneti Rate (+10%)",
    },
    ru: {
      cancellation: "Бесплатная отмена за 24ч",
      payOnArrival: "Оплата на месте — без предоплаты",
      instantWa: "Мгновенное подтверждение в WhatsApp",
      guaranteed: "Гарантированный трансфер и личный водитель",
      aiBadge: "✨ Умный калькулятор трансферов AI",
      calcTitle: "Рассчитайте маршрут, километраж и цену",
      calcSub: "Выберите место подачи и пункт назначения. Расстояние, время и стоимость рассчитаются мгновенно.",
      airportsTab: "✈️ Аэропорты",
      citiesTab: "🏙️ Города",
      popularTab: "📍 Популярные направления",
      distance: "Расстояние",
      estTime: "Время в пути",
      totalPrice: "Итоговая стоимость",
      swap: "Поменять местами",
      svanetiIncluded: "🏔️ Тариф Сванетии (+10%)",
    },
    tr: {
      cancellation: "24 saat öncesine kadar ücretsiz iptal",
      payOnArrival: "Varışta ödeme — ön ödeme gerekmez",
      instantWa: "WhatsApp ile anında onay",
      guaranteed: "Garantili transfer ve özel sürücü",
      aiBadge: "✨ Akıllı Transfer Hesaplayıcı",
      calcTitle: "Mesafe, Süre ve Fiyatı Anında Hesaplayın",
      calcSub: "Alış ve varış noktanızı seçin. Kilometre, süre ve ücret otomatik hesaplanır.",
      airportsTab: "✈️ Havalimanları",
      citiesTab: "🏙️ Şehirler",
      popularTab: "📍 Popüler Noktalar",
      distance: "Mesafe",
      estTime: "Tahmini Süre",
      totalPrice: "Toplam Ücret",
      swap: "Konumları Değiştir",
      svanetiIncluded: "🏔️ Svaneti Tarifesi (+10%)",
    },
    ar: {
      cancellation: "إلغاء مجاني حتى 24 ساعة قبل الموعد",
      payOnArrival: "الدفع عند الوصول — بدون دفع مسبق",
      instantWa: "تأكيد فوري عبر واتساب",
      guaranteed: "توصيلة مضمونة وسائق خاص",
      aiBadge: "✨ حاسبة التوصيل الذكية",
      calcTitle: "احسب المسافة والوقت والسعر فوراً",
      calcSub: "اختر نقطة الانطلاق والوجهة لحساب المسافة والوقت والتكلفة تلقائياً.",
      airportsTab: "✈️ المطارات",
      citiesTab: "🏙️ المدن",
      popularTab: "📍 الوجهات الشهيرة",
      distance: "المسافة",
      estTime: "الوقت المقدر",
      totalPrice: "السعر الإجمالي",
      swap: "تبديل الوجهات",
      svanetiIncluded: "🏔️ تسعيرة سفانيتي (+10%)",
    },
  };

  const ui = TRANSFER_TRUST_LABELS[lang] || TRANSFER_TRUST_LABELS.ka;

  const handleTransferSubmit = async (e) => {
    e.preventDefault();

    const cleanPhone = contactPhone.trim();
    if (!isValidPhone(cleanPhone)) {
      setPhoneError(t("tourDetail.invalidPhoneError") || "გთხოვთ მიუთითოთ სწორი ტელეფონის ნომერი (მაგ: +995 5XX XX XX XX)");
      return;
    }
    setPhoneError("");
    setIsSubmitting(true);

    const calculatedFare = quote?.priceGEL || 0;
    const distanceText = quote ? `~${quote.distanceKm} km` : "";
    const durationText = quote?.formattedDuration || "";

    try {
      const { createBooking } = await import("../../lib/bookingsFirestore");
      const result = await createBooking({
        type: "transfer",
        name: contactName.trim() || `Passenger (${cleanPhone})`,
        vehicle: selectedVehicleKey,
        vehicleName: selectedVehicleName,
        pickup: pickupLoc,
        dropoff: dropoffLoc,
        distanceKm: quote?.distanceKm || null,
        duration: quote?.durationMinutes || null,
        priceGEL: calculatedFare,
        date: transferDate,
        time: transferTime,
        passengers: passengerCount,
        phone: cleanPhone,
        notes: notes,
        language: lang,
      });

      const bId = result?.bookingId || (typeof result === "string" ? result : null);
      const aToken = result?.accessToken || "";

      if (bId && typeof window !== "undefined") {
        try {
          if (aToken) localStorage.setItem(`gt_token_${bId}`, aToken);
          if (contactPhone) localStorage.setItem(`gt_phone_${bId}`, contactPhone);
        } catch (_) {}
      }

      if (bId) {
        if (typeof window !== "undefined" && window.fbq) {
          window.fbq("track", "Lead", {
            content_name: `Transfer: ${selectedVehicleName} (${pickupLoc} -> ${dropoffLoc})`,
            content_category: "Transfer",
            value: calculatedFare,
            currency: "GEL",
          }, { eventID: bId });
        }
        trackEvent("book_transfer_success", {
          eventId: bId,
          vehicle: selectedVehicleName,
          pickup: pickupLoc,
          dropoff: dropoffLoc,
          price: calculatedFare,
        });
      }
    } catch (err) {
      console.error("Transfer booking error:", err);
    } finally {
      setIsSubmitting(false);
    }

    // Build structured WhatsApp message (clean, without per-km formulas)
    const lines = isEnglish || lang === "en"
      ? [
          `🚗 *GeorgiaTrips — Transfer Booking Request*`,
          `━━━━━━━━━━━━━━━━━━━━━━━━`,
          `📍 *Pickup:* ${pickupLoc.trim() || "Not specified"}`,
          `🏁 *Dropoff:* ${dropoffLoc.trim() || "Not specified"}`,
          `📏 *Estimated Distance:* ${distanceText}`,
          `⏱️ *Estimated Duration:* ${durationText}`,
          `🚘 *Vehicle:* ${selectedVehicleName}`,
          `💰 *Total Price:* ~${calculatedFare} GEL`,
          `📅 *Date:* ${transferDate || "By agreement"}`,
          `⏰ *Time:* ${transferTime.trim() || "By agreement"}`,
          `👥 *Passengers:* ${passengerCount} travelers`,
          contactName.trim() ? `👤 *Name:* ${contactName.trim()}` : "",
          `📞 *Phone / WhatsApp:* ${contactPhone.trim() || "Not specified"}`,
          notes.trim() ? `📝 *Flight / Notes:* ${notes.trim()}` : "",
        ]
      : lang === "ru"
      ? [
          `🚗 *GeorgiaTrips — Запрос на трансфер*`,
          `━━━━━━━━━━━━━━━━━━━━━━━━`,
          `📍 *Откуда:* ${pickupLoc.trim() || "Не указано"}`,
          `🏁 *Куда:* ${dropoffLoc.trim() || "Не указано"}`,
          `📏 *Расстояние:* ${distanceText}`,
          `⏱️ *Время в пути:* ${durationText}`,
          `🚘 *Автомобиль:* ${selectedVehicleName}`,
          `💰 *Стоимость:* ~${calculatedFare} GEL`,
          `📅 *Дата:* ${transferDate || "По договоренности"}`,
          `⏰ *Время:* ${transferTime.trim() || "По договоренности"}`,
          `👥 *Пассажиры:* ${passengerCount} чел.`,
          contactName.trim() ? `👤 *Имя:* ${contactName.trim()}` : "",
          `📞 *Телефон / WhatsApp:* ${contactPhone.trim() || "Не указано"}`,
          notes.trim() ? `📝 *Рейс / Примечания:* ${notes.trim()}` : "",
        ]
      : lang === "tr"
      ? [
          `🚗 *GeorgiaTrips — Transfer Talebi*`,
          `━━━━━━━━━━━━━━━━━━━━━━━━`,
          `📍 *Nereden:* ${pickupLoc.trim() || "Belirtilmedi"}`,
          `🏁 *Nereye:* ${dropoffLoc.trim() || "Belirtilmedi"}`,
          `📏 *Mesafe:* ${distanceText}`,
          `⏱️ *Süre:* ${durationText}`,
          `🚘 *Araç:* ${selectedVehicleName}`,
          `💰 *Ücret:* ~${calculatedFare} GEL`,
          `📅 *Tarih:* ${transferDate || "Anlaşmaya göre"}`,
          `⏰ *Saat:* ${transferTime.trim() || "Anlaşmaya göre"}`,
          `👥 *Yolcu Sayısı:* ${passengerCount} kişi`,
          contactName.trim() ? `👤 *İsim:* ${contactName.trim()}` : "",
          `📞 *Telefon / WhatsApp:* ${contactPhone.trim() || "Belirtilmedi"}`,
          notes.trim() ? `📝 *Uçuş / Notlar:* ${notes.trim()}` : "",
        ]
      : lang === "ar"
      ? [
          `🚗 *GeorgiaTrips — طلب توصيل خاص*`,
          `━━━━━━━━━━━━━━━━━━━━━━━━`,
          `📍 *مكان الانطلاق:* ${pickupLoc.trim() || "غير محدد"}`,
          `🏁 *الوجهة:* ${dropoffLoc.trim() || "غير محدد"}`,
          `📏 *المسافة:* ${distanceText}`,
          `⏱️ *الوقت المقدر:* ${durationText}`,
          `🚘 *نوع السيارة:* ${selectedVehicleName}`,
          `💰 *التكلفة الإجمالية:* ~${calculatedFare} GEL`,
          `📅 *التاريخ:* ${transferDate || "بالاتفاق"}`,
          `⏰ *الوقت:* ${transferTime.trim() || "بالاتفاق"}`,
          `👥 *عدد الركاب:* ${passengerCount} أشخاص`,
          contactName.trim() ? `👤 *الاسم:* ${contactName.trim()}` : "",
          `📞 *رقم الهاتف / واتساب:* ${contactPhone.trim() || "غير محدد"}`,
          notes.trim() ? `📝 *رقم الرحلة / ملاحظات:* ${notes.trim()}` : "",
        ]
      : [
          `🚗 *GeorgiaTrips — ტრანსფერის მოთხოვნა*`,
          `━━━━━━━━━━━━━━━━━━━━━━━━`,
          `📍 *საიდან:* ${pickupLoc.trim() || "არ არის მითითებული"}`,
          `🏁 *სად:* ${dropoffLoc.trim() || "არ არის მითითებული"}`,
          `📏 *მანძილი:* ${distanceText}`,
          `⏱️ *მგზავრობის დრო:* ${durationText}`,
          `🚘 *ავტომობილი:* ${selectedVehicleName}`,
          `💰 *სრული ღირებულება:* ~${calculatedFare} GEL`,
          `📅 *თარიღი:* ${transferDate || "შეთანხმებით"}`,
          `⏰ *დრო:* ${transferTime.trim() || "შეთანხმებით"}`,
          `👥 *მგზავრები:* ${passengerCount} ადამიანი`,
          contactName.trim() ? `👤 *სახელი:* ${contactName.trim()}` : "",
          `📞 *ტელეფონი / WhatsApp:* ${contactPhone.trim() || "არ არის მითითებული"}`,
          notes.trim() ? `📝 *შენიშვნა:* ${notes.trim()}` : "",
        ];

    window.open(`${WA_LINK}?text=${encodeURIComponent(lines.filter(Boolean).join("\n"))}`, "_blank");
  };

  return (
    <div className="transfers-page-wrapper">
      <Navbar active="transfers" />

      {/* HERO SECTION */}
      <PageHero
        kicker={t("transfersPage.heroKicker") || "პრემიუმ ავტოპარკი და 24/7 ტრანსფერები"}
        title={t("transfersPage.heroTitle") || "კომფორტული და უსაფრთხო მგზავრობა საქართველოში"}
        subtitle={t("transfersPage.heroSubtitle") || "აეროპორტის დახვედრა სახელიანი აბრით, საქალაქთაშორისო ტრანსფერები და პირადი ავტომობილები გამოცდილ მძღოლებთან ერთად."}
        image="/hero.webp"
        alt={t("transfersPage.heroTitle")}
      />

      {/* SECTION 1: SMART AI ROUTE & PRICE CALCULATOR */}
      <section className="section tf-calculator-section" id="transfer-calculator">
        <div className="container" style={{ maxWidth: "1000px" }}>
          <div className="tf-calc-card">
            <div className="tf-calc-badge-row">
              <span className="tf-ai-badge">{ui.aiBadge}</span>
            </div>
            <h2 className="tf-calc-title">{ui.calcTitle}</h2>
            <p className="tf-calc-subtitle">{ui.calcSub}</p>

            <form onSubmit={handleTransferSubmit} className="tf-calc-form">
              {/* PICKUP & DROPOFF ROUTE BUILDER */}
              <div className="tf-route-builder">
                {/* PICKUP BOX (ONLY 3 AIRPORTS & 3 CITIES) */}
                <div className="tf-loc-box">
                  <div className="tf-loc-header">
                    <span className="tf-loc-dot tf-loc-dot--start" />
                    <label className="tf-loc-label">{t("transfersPage.pickupLabel") || "აყვანის მისამართი (საიდან)"}</label>
                  </div>

                  <input
                    type="text"
                    value={pickupLoc}
                    onChange={(e) => setPickupLoc(e.target.value)}
                    placeholder={t("transfersPage.pickupPlaceholder") || "მაგ: თბილისის აეროპორტი (TBS)"}
                    className="tf-loc-input"
                    required
                  />

                  {/* PICKUP: 3 AIRPORTS ONLY */}
                  <div className="tf-quick-chips">
                    <span className="tf-chips-group-title">{ui.airportsTab}:</span>
                    {pickupAirports.map((loc) => {
                      const name = getLocationLabel(loc);
                      const isSelected = pickupLoc.toLowerCase().includes(loc.id.split("_")[0]);
                      return (
                        <button
                          key={loc.id}
                          type="button"
                          className={`tf-chip${isSelected ? " is-active" : ""}`}
                          onClick={() => handleSelectPickup(loc)}
                        >
                          <span>{loc.icon}</span>
                          <span>{name}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* PICKUP: 3 CITIES ONLY (BATUMI, KUTAISI, TBILISI) */}
                  <div className="tf-quick-chips">
                    <span className="tf-chips-group-title">{ui.citiesTab}:</span>
                    {pickupCities.map((loc) => {
                      const name = getLocationLabel(loc);
                      const isSelected = pickupLoc.toLowerCase().includes(loc.id.split("_")[0]);
                      return (
                        <button
                          key={loc.id}
                          type="button"
                          className={`tf-chip${isSelected ? " is-active" : ""}`}
                          onClick={() => handleSelectPickup(loc)}
                        >
                          <span>{loc.icon}</span>
                          <span>{name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SWAP BUTTON */}
                <div className="tf-swap-wrap">
                  <button
                    type="button"
                    className="tf-btn-swap"
                    onClick={handleSwapLocations}
                    title={ui.swap}
                    aria-label={ui.swap}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16" />
                    </svg>
                  </button>
                </div>

                {/* DROPOFF BOX (ALL AIRPORTS & DESTINATIONS) */}
                <div className="tf-loc-box">
                  <div className="tf-loc-header">
                    <span className="tf-loc-dot tf-loc-dot--end" />
                    <label className="tf-loc-label">{t("transfersPage.dropoffLabel") || "ჩასვლის მისამართი (სად)"}</label>
                  </div>

                  <input
                    type="text"
                    value={dropoffLoc}
                    onChange={(e) => setDropoffLoc(e.target.value)}
                    placeholder={t("transfersPage.dropoffPlaceholder") || "მაგ: ბათუმი, ყაზბეგი, გუდაური..."}
                    className="tf-loc-input"
                    required
                  />

                  {/* DROPOFF: AIRPORTS */}
                  <div className="tf-quick-chips">
                    <span className="tf-chips-group-title">{ui.airportsTab}:</span>
                    {dropoffAirports.map((loc) => {
                      const name = getLocationLabel(loc);
                      const isSelected = dropoffLoc.toLowerCase().includes(loc.id.split("_")[0]);
                      return (
                        <button
                          key={loc.id}
                          type="button"
                          className={`tf-chip${isSelected ? " is-active" : ""}`}
                          onClick={() => handleSelectDropoff(loc)}
                        >
                          <span>{loc.icon}</span>
                          <span>{name}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* DROPOFF: ALL POPULAR DESTINATIONS */}
                  <div className="tf-quick-chips tf-quick-chips--cities">
                    <span className="tf-chips-group-title">{ui.popularTab}:</span>
                    {dropoffDestinations.map((loc) => {
                      const name = getLocationLabel(loc);
                      const isSelected = dropoffLoc.toLowerCase().includes(loc.id.split("_")[0]);
                      return (
                        <button
                          key={loc.id}
                          type="button"
                          className={`tf-chip tf-chip--sm${isSelected ? " is-active" : ""}`}
                          onClick={() => handleSelectDropoff(loc)}
                        >
                          <span>{loc.icon}</span>
                          <span>{name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* LIVE AI ROUTE SUMMARY BANNER */}
              {quote && (
                <div className="tf-live-summary">
                  <div className="tf-live-summary-left">
                    <div className="tf-summary-route-line">
                      <span className="tf-summary-loc">{pickupLoc || "..."}</span>
                      <span className="tf-summary-arrow">➔</span>
                      <span className="tf-summary-loc">{dropoffLoc || "..."}</span>
                    </div>
                    <div className="tf-summary-metrics">
                      <span className="tf-metric-badge">
                        📏 <strong>{quote.distanceKm} კმ</strong> ({ui.distance})
                      </span>
                      <span className="tf-metric-badge">
                        ⏱️ <strong>{quote.formattedDuration}</strong> ({ui.estTime})
                      </span>
                      <span className="tf-metric-badge tf-metric-badge--vehicle">
                        🚘 <strong>{selectedVehicleName}</strong>
                      </span>
                      {quote.isSvaneti && (
                        <span className="tf-metric-badge" style={{ background: "rgba(217, 119, 6, 0.12)", color: "#b45309", borderColor: "rgba(217, 119, 6, 0.3)" }}>
                          <strong>{ui.svanetiIncluded}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="tf-live-summary-right">
                    <span className="tf-price-label">{ui.totalPrice}</span>
                    <span className="tf-price-val">~{quote.priceGEL} ₾</span>
                  </div>
                </div>
              )}

              {/* VEHICLE SELECTION TILES (DYNAMIC TOTAL PRICES ONLY, NO KM RATES) */}
              <div className="tf-vehicles-wrapper">
                <label className="tf-section-label">{t("transfersPage.vehicleLabel") || "აირჩიეთ ავტომობილი"}</label>

                <div className="tf-vehicles-grid">
                  {fleetKeys.map((key) => {
                    const data = VEHICLE_RATES[key];
                    const vMeta = t(`transfersPage.vehicles.${key}`) || {};
                    const isSelected = selectedVehicleKey === key;
                    const calculatedPrice = quote?.allVehiclePrices[key] || Math.round(100 * data.ratePerKm);

                    return (
                      <div
                        key={key}
                        onClick={() => handleSelectVehicle(key)}
                        className={`tf-vehicle-tile${isSelected ? " is-selected" : ""}`}
                      >
                        <div className="tf-v-tile-top">
                          <div className="tf-v-img-wrap">
                            <Image
                              src={data.img}
                              alt={vMeta.name || data.nameKa}
                              width={130}
                              height={80}
                              style={{ objectFit: "contain" }}
                            />
                          </div>
                          {isSelected && <span className="tf-v-check"><CheckIcon size={14} /></span>}
                        </div>

                        <div className="tf-v-tile-body">
                          <h4 className="tf-v-name">{vMeta.name || data.nameKa}</h4>

                          <div className="tf-v-specs">
                            <span>👥 {data.capacityPax} pax</span>
                            <span>🧳 {data.capacityBags} bags</span>
                          </div>

                          <div className="tf-v-calculated-price">
                            <span className="tf-v-p-label">{ui.totalPrice}:</span>
                            <span className="tf-v-p-amount">~{calculatedPrice} ₾</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* DATE, TIME & PASSENGERS ROW */}
              <div className="tf-inputs-row">
                <div>
                  <label className="tf-label">{t("transfersPage.dateLabel") || "მგზავრობის თარიღი"}</label>
                  <DatePicker
                    value={transferDate}
                    onChange={(dStr) => setTransferDate(dStr)}
                    placeholder={t("transfersPage.datePlaceholder") || "აირჩიეთ თარიღი"}
                    direction="down"
                  />
                </div>

                <div>
                  <label className="tf-label">{t("transfersPage.timeLabel") || "მგზავრობის / ფრენის დრო"}</label>
                  <input
                    type="text"
                    placeholder={t("transfersPage.timePlaceholder") || "მაგ: 14:30"}
                    value={transferTime}
                    onChange={(e) => setTransferTime(e.target.value)}
                    className="tf-input-styled"
                  />
                </div>

                <div>
                  <label className="tf-label">{t("transfersPage.passengersLabel") || "მგზავრთა რაოდენობა"}</label>
                  <div className="tf-stepper-wrap">
                    <button
                      type="button"
                      className="tf-stepper-btn"
                      onClick={() => setPassengerCount(String(Math.max(1, parseInt(passengerCount || "1", 10) - 1)))}
                      disabled={parseInt(passengerCount, 10) <= 1}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={VEHICLE_RATES[selectedVehicleKey]?.capacityPax || 16}
                      value={passengerCount}
                      onChange={(e) => setPassengerCount(e.target.value)}
                      required
                      className="tf-stepper-input"
                    />
                    <button
                      type="button"
                      className="tf-stepper-btn"
                      onClick={() => {
                        const maxPax = VEHICLE_RATES[selectedVehicleKey]?.capacityPax || 16;
                        setPassengerCount(String(Math.min(maxPax, parseInt(passengerCount || "1", 10) + 1)));
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* CONTACT DETAILS */}
              <div className="tf-contact-grid">
                <div>
                  <label className="tf-label">{t("tourDetail.yourName") || "თქვენი სახელი"}</label>
                  <input
                    type="text"
                    placeholder={t("tourDetail.namePlaceholder") || "მაგ: გიორგი"}
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="tf-input-styled"
                  />
                </div>

                <div>
                  <label className="tf-label">{t("transfersPage.phoneLabel") || "ტელეფონის ნომერი / WhatsApp"}</label>
                  <input
                    type="tel"
                    placeholder={t("transfersPage.phonePlaceholder") || "+995 5XX XX XX XX"}
                    value={contactPhone}
                    onChange={(e) => {
                      setContactPhone(e.target.value);
                      if (phoneError) setPhoneError("");
                    }}
                    required
                    className="tf-input-styled"
                    style={phoneError ? { borderColor: "#ef4444", boxShadow: "0 0 0 3px rgba(239, 68, 68, 0.2)" } : {}}
                  />
                  {phoneError && (
                    <p style={{ color: "#ef4444", fontSize: "0.82rem", marginTop: "0.35rem", fontWeight: 600 }}>
                      ⚠️ {phoneError}
                    </p>
                  )}
                </div>

                <div className="tf-field-full">
                  <label className="tf-label">{t("transfersPage.flightLabel") || "ფრენის ნომერი / შენიშვნა"}</label>
                  <textarea
                    rows={2}
                    placeholder={t("transfersPage.flightPlaceholder") || "მაგ: ფრენის ნომერი TK382, 3 ჩემოდანი..."}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="tf-input-styled"
                  />
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="tf-submit-wrap">
                <button type="submit" className="btn-tf-whatsapp" disabled={isSubmitting}>
                  <WhatsAppIcon width={24} height={24} />
                  <span>
                    {quote?.priceGEL
                      ? `${t("transfersPage.submitBtn") || "დაჯავშნა WhatsApp-ზე"} (~${quote.priceGEL} ₾)`
                      : t("transfersPage.submitBtn") || "დაჯავშნა WhatsApp-ზე"}
                  </span>
                </button>

                {/* TRUST BADGES */}
                <div className="tf-trust-badges-grid" dir={lang === "ar" ? "rtl" : "ltr"}>
                  <div className="tf-trust-badge-item">
                    <span className="tf-trust-badge-icon"><CheckIcon size={16} /></span>
                    <span className="tf-trust-badge-text">{ui.cancellation}</span>
                  </div>
                  <div className="tf-trust-badge-item">
                    <span className="tf-trust-badge-icon"><CheckIcon size={16} /></span>
                    <span className="tf-trust-badge-text">{ui.payOnArrival}</span>
                  </div>
                  <div className="tf-trust-badge-item">
                    <span className="tf-trust-badge-icon"><CheckIcon size={16} /></span>
                    <span className="tf-trust-badge-text">{ui.instantWa}</span>
                  </div>
                  <div className="tf-trust-badge-item">
                    <span className="tf-trust-badge-icon"><CheckIcon size={16} /></span>
                    <span className="tf-trust-badge-text">{ui.guaranteed}</span>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* SECTION 2: LUXURY FLEET OVERVIEW */}
      <section className="section">
        <div className="container">
          <div className="section-header" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <span className="section-eyebrow">{t("transfersPage.fleetEyebrow") || "ჩვენი ავტოპარკი"}</span>
            <h2 className="section-title">{t("transfersPage.fleetTitle") || "პრემიუმ ავტომობილები მძღოლით"}</h2>
            <p className="section-desc">{t("transfersPage.fleetDesc") || "ყველა ავტომობილი აღჭურვილია კონდიციონერით, უფასო Wi-Fi-ით და გამოცდილი მძღოლით"}</p>
            <div className="gold-line" />
          </div>

          <div className="transfers-fleet-grid">
            {fleetKeys.map((key) => {
              const data = VEHICLE_RATES[key];
              const vMeta = t(`transfersPage.vehicles.${key}`) || {};
              const isSelected = selectedVehicleKey === key;
              const calculatedPrice = quote?.allVehiclePrices[key] || Math.round(100 * data.ratePerKm);

              return (
                <div key={key} className={`transfers-fleet-card${isSelected ? " is-selected" : ""}`}>
                  <div className="transfers-fleet-media" style={{ position: "relative", minHeight: "180px" }}>
                    <Image
                      src={data.img}
                      alt={vMeta.name || data.nameKa}
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      style={{ objectFit: "cover" }}
                    />
                    <span className="transfers-fleet-badge">{vMeta.badge || "VIP ტრანსფერი"}</span>
                  </div>

                  <div className="transfers-fleet-body">
                    <div>
                      <h3 className="transfers-fleet-name" style={{ margin: "0 0 0.35rem 0" }}>{vMeta.name || data.nameKa}</h3>
                      <span className="transfers-fleet-sub">{vMeta.subtitle || "კომფორტული მგზავრობა მძღოლით"}</span>

                      <div className="transfers-fleet-specs">
                        <span className="transfers-spec-pill">👥 {t("transfersPage.capacityPax")?.replace("{count}", data.capacityPax) || `${data.capacityPax} pax`}</span>
                        <span className="transfers-spec-pill">🧳 {t("transfersPage.capacityBags")?.replace("{count}", data.capacityBags) || `${data.capacityBags} bags`}</span>
                        <span className="transfers-spec-pill">❄️ {t("transfersPage.climate") || "კონდიციონერი"}</span>
                        <span className="transfers-spec-pill">📶 {t("transfersPage.wifi") || "უფასო Wi-Fi"}</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "0.8rem", paddingTop: "0.8rem", borderTop: "1px solid var(--gt-line)" }}>
                      <div>
                        <span style={{ fontSize: "0.75rem", color: "var(--gt-muted)", display: "block" }}>{ui.totalPrice}</span>
                        <span style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--gt-ink)" }}>~{calculatedPrice} ₾</span>
                      </div>
                      <button
                        type="button"
                        className="btn-fleet-select"
                        style={{ width: "auto", minHeight: "38px", padding: "0 1.2rem", fontSize: "0.88rem" }}
                        onClick={() => {
                          handleSelectVehicle(key);
                          const el = document.getElementById("transfer-calculator");
                          if (el) el.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        <span>{t("transfersPage.selectVehicle") || "არჩევა"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 3: VIP PERKS */}
      <section className="section">
        <div className="container">
          <div className="section-header" style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <span className="section-eyebrow">{t("transfersPage.perksEyebrow") || "VIP სერვისი"}</span>
            <h2 className="section-title">{t("transfersPage.perksTitle") || "რატომ ირჩევენ GeorgiaTrips ტრანსფერებს?"}</h2>
            <p className="section-desc">{t("transfersPage.perksDesc") || "მაქსიმალური კომფორტი და უსაფრთხოება თქვენი მოგზაურობისას"}</p>
            <div className="gold-line" />
          </div>

          <div className="transfers-perks-grid">
            {perks.map((perk, idx) => (
              <div key={idx} className="transfers-perk-card">
                <div className="transfers-perk-icon">{perk.icon}</div>
                <div>
                  <h3 className="transfers-perk-title">{perk.title}</h3>
                  <p className="transfers-perk-desc">{perk.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
