"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import Navbar from "../Navbar";
import Footer from "../Footer";
import PageHero from "../PageHero";
import DatePicker from "../DatePicker";
import PlaceSearchField, { usePlaceField } from "./PlaceSearchField";
import { WA_LINK, WhatsAppIcon } from "../../lib/shared";
import { CheckIcon } from "../Icons";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { isValidPhone } from "../../lib/bookingModel";
import { trackEvent } from "../../lib/analytics";
import {
  TRANSFER_VEHICLES,
  estimateRouteDistance,
  isSvanetiRoute,
  quoteFromRoute,
} from "../../lib/transfers/routeCalculator";
import { TRANSFER_VEHICLE_KEYS, normalizeTransferPricing } from "../../lib/transfers/pricing";

export default function TransfersClient({ pricing: pricingProp }) {
  const { t, lang, isEnglish } = useLanguage();
  const pricing = useMemo(() => normalizeTransferPricing(pricingProp), [pricingProp]);

  const [openField, setOpenField] = useState(null); // "pickup" | "dropoff" | null
  const [mapRoutes, setMapRoutes] = useState({}); // routeKey -> route | "error"
  const pickupRef = useRef(null);
  const dropoffRef = useRef(null);
  const pickupInputRef = useRef(null);
  const dropoffInputRef = useRef(null);

  const [selectedVehicleKey, setSelectedVehicleKey] = useState("sedan");
  const [transferDate, setTransferDate] = useState("");
  const [transferTime, setTransferTime] = useState("12:00");
  const [passengerCount, setPassengerCount] = useState("2");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fleetKeys = TRANSFER_VEHICLE_KEYS;

  const getLocationLabel = (loc) => loc.names[lang] || loc.names.ka || loc.names.en;

  // Both ends accept a known location or any place in Georgia (hotel, sight, village...).
  const openSetter = (name) => (open) => setOpenField((cur) => (open ? name : cur === name ? null : cur));
  const from = usePlaceField({
    initial: { kind: "known", id: "tbilisi_airport" },
    mapPointId: "map_pickup",
    lang,
    getLocationLabel,
    isOpen: openField === "pickup",
    setOpen: openSetter("pickup"),
    inputRef: pickupInputRef,
  });
  const to = usePlaceField({
    initial: { kind: "known", id: "batumi_city" },
    mapPointId: "map_dropoff",
    lang,
    getLocationLabel,
    isOpen: openField === "dropoff",
    setOpen: openSetter("dropoff"),
    inputRef: dropoffInputRef,
  });

  const pickupPoint = from.point;
  const dropoffPoint = to.point;
  const pickupLabel = from.label;
  const dropoffLabel = to.label;

  // ── Route: exact table first, otherwise real road distance from the map ──
  const staticRoute = pickupPoint && dropoffPoint ? estimateRouteDistance(pickupPoint, dropoffPoint) : null;
  const needsMapRoute = !!staticRoute && staticRoute.source === "coordinates_heuristic";
  const routeKey = needsMapRoute ? `${pickupPoint.lat},${pickupPoint.lng}|${dropoffPoint.lat},${dropoffPoint.lng}` : null;
  const mapRoute = routeKey ? mapRoutes[routeKey] : undefined;
  const routeLoading = needsMapRoute && mapRoute === undefined;

  useEffect(() => {
    if (!routeKey || mapRoutes[routeKey] !== undefined) return;
    const [a, b] = routeKey.split("|");
    const ctrl = new AbortController();
    fetch(`/api/transfers/route?from=${a}&to=${b}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => setMapRoutes((m) => ({ ...m, [routeKey]: data })))
      .catch((err) => {
        if (err.name !== "AbortError") setMapRoutes((m) => ({ ...m, [routeKey]: "error" }));
      });
    return () => ctrl.abort();
  }, [routeKey, mapRoutes]);

  const route = !staticRoute
    ? null
    : !needsMapRoute
      ? staticRoute
      : mapRoute && mapRoute !== "error"
        ? { ...mapRoute, source: "map" }
        : mapRoute === "error"
          ? staticRoute
          : null;

  // Map labels end with the region ("Mingrelia-Upper Svaneti" also covers
  // Zugdidi), so only the place name and its coordinates decide Svaneti.
  const isSvaneti =
    pickupPoint && dropoffPoint ? isSvanetiRoute(from.name, to.name, pickupPoint, dropoffPoint) : false;

  const quote = useMemo(
    () => quoteFromRoute(route, pricing, { vehicleKey: selectedVehicleKey, isSvaneti, lang }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [route?.distanceKm, route?.durationMinutes, pricing, selectedVehicleKey, isSvaneti, lang]
  );

  // Close the open dropdown on an outside click / tap.
  useEffect(() => {
    if (!openField) return;
    const onDown = (e) => {
      const ref = openField === "pickup" ? pickupRef : dropoffRef;
      if (ref.current && !ref.current.contains(e.target)) setOpenField(null);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [openField]);

  const canSwap = !!from.value && !!to.value;
  const handleSwapLocations = () => {
    if (!canSwap) return;
    const prevFrom = from.value;
    from.assign(to.value);
    to.assign(prevFrom);
  };

  const selectedVehicleName =
    t(`transfersPage.vehicles.${selectedVehicleKey}.name`) ||
    TRANSFER_VEHICLES[selectedVehicleKey]?.nameKa ||
    selectedVehicleKey;

  const handleSelectVehicle = (key) => {
    setSelectedVehicleKey(key);
    const maxPax = TRANSFER_VEHICLES[key]?.capacityPax || 4;
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
      pickupSearchPlaceholder: "აეროპორტი, სასტუმრო, მისამართი ან ნებისმიერი ადგილი...",
      dropoffSearchPlaceholder: "ჩაწერეთ ნებისმიერი ადგილი: სოფელი, სასტუმრო, მისამართი...",
      anyPlaceHint: "ჩაწერეთ საქართველოს ნებისმიერი ადგილი — მანძილს და ფასს რუკიდან დავითვლით",
      mapResults: "📍 ადგილები რუკიდან",
      searching: "ვეძებთ...",
      noResults: "ვერაფერი მოიძებნა — სცადეთ სხვანაირად დაწერა",
      calculating: "მარშრუტი ითვლება რუკიდან...",
      pickDropoff: "აირჩიეთ აყვანისა და დანიშნულების ადგილი სიიდან, რომ ნახოთ ფასი",
      viaMap: "მანძილი დათვლილია რუკის მიხედვით",
      clear: "გასუფთავება",
      km: "კმ",
      pax: "მგზავრი",
      bags: "ჩემოდანი",
      stepRoute: "მარშრუტი",
      stepVehicle: "აირჩიეთ ავტომობილი",
      stepDetails: "მგზავრობის დეტალები",
      tripSummary: "თქვენი მგზავრობა",
      from: "საიდან",
      to: "სად",
      vehicle: "ავტომობილი",
      viaMapShort: "რუკით",
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
      pickupSearchPlaceholder: "Airport, hotel, address or any place...",
      dropoffSearchPlaceholder: "Type any place: village, hotel, address...",
      anyPlaceHint: "Type any place in Georgia — we calculate distance and price from the map",
      mapResults: "📍 Places on the map",
      searching: "Searching...",
      noResults: "Nothing found — try a different spelling",
      calculating: "Calculating route from the map...",
      pickDropoff: "Choose pickup and destination from the list to see the price",
      viaMap: "Road distance calculated from the map",
      clear: "Clear",
      km: "km",
      pax: "pax",
      bags: "bags",
      stepRoute: "Your route",
      stepVehicle: "Choose a vehicle",
      stepDetails: "Trip details",
      tripSummary: "Your trip",
      from: "From",
      to: "To",
      vehicle: "Vehicle",
      viaMapShort: "Map route",
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
      pickupSearchPlaceholder: "Аэропорт, отель, адрес или любое место...",
      dropoffSearchPlaceholder: "Введите любое место: село, отель, адрес...",
      anyPlaceHint: "Введите любое место в Грузии — расстояние и цену посчитаем по карте",
      mapResults: "📍 Места на карте",
      searching: "Ищем...",
      noResults: "Ничего не найдено — попробуйте написать иначе",
      calculating: "Считаем маршрут по карте...",
      pickDropoff: "Выберите место подачи и пункт назначения из списка, чтобы увидеть цену",
      viaMap: "Расстояние рассчитано по карте",
      clear: "Очистить",
      km: "км",
      pax: "пасс.",
      bags: "багаж",
      stepRoute: "Маршрут",
      stepVehicle: "Выберите автомобиль",
      stepDetails: "Детали поездки",
      tripSummary: "Ваша поездка",
      from: "Откуда",
      to: "Куда",
      vehicle: "Автомобиль",
      viaMapShort: "По карте",
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
      pickupSearchPlaceholder: "Havalimanı, otel, adres veya herhangi bir yer...",
      dropoffSearchPlaceholder: "Herhangi bir yer yazın: köy, otel, adres...",
      anyPlaceHint: "Gürcistan'da herhangi bir yer yazın — mesafe ve fiyatı haritadan hesaplarız",
      mapResults: "📍 Haritadaki yerler",
      searching: "Aranıyor...",
      noResults: "Sonuç bulunamadı — farklı yazmayı deneyin",
      calculating: "Rota haritadan hesaplanıyor...",
      pickDropoff: "Fiyatı görmek için listeden alış ve varış noktası seçin",
      viaMap: "Mesafe haritaya göre hesaplandı",
      clear: "Temizle",
      km: "km",
      pax: "yolcu",
      bags: "bavul",
      stepRoute: "Rota",
      stepVehicle: "Araç seçin",
      stepDetails: "Yolculuk detayları",
      tripSummary: "Yolculuğunuz",
      from: "Nereden",
      to: "Nereye",
      vehicle: "Araç",
      viaMapShort: "Harita",
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
      pickupSearchPlaceholder: "مطار، فندق، عنوان أو أي مكان...",
      dropoffSearchPlaceholder: "اكتب أي مكان: قرية، فندق، عنوان...",
      anyPlaceHint: "اكتب أي مكان في جورجيا — نحسب المسافة والسعر من الخريطة",
      mapResults: "📍 أماكن على الخريطة",
      searching: "جارٍ البحث...",
      noResults: "لم يتم العثور على نتائج — جرّب كتابة مختلفة",
      calculating: "جارٍ حساب المسار من الخريطة...",
      pickDropoff: "اختر نقطة الانطلاق والوجهة من القائمة لرؤية السعر",
      viaMap: "تم حساب المسافة من الخريطة",
      clear: "مسح",
      km: "كم",
      pax: "ركاب",
      bags: "حقائب",
      stepRoute: "المسار",
      stepVehicle: "اختر السيارة",
      stepDetails: "تفاصيل الرحلة",
      tripSummary: "رحلتك",
      from: "من",
      to: "إلى",
      vehicle: "السيارة",
      viaMapShort: "عبر الخريطة",
    },
  };

  const ui = TRANSFER_TRUST_LABELS[lang] || TRANSFER_TRUST_LABELS.ka;

  const handleTransferSubmit = async (e) => {
    e.preventDefault();

    if (!quote) {
      const pickupMissing = !from.value;
      (pickupMissing ? from : to).setError(true);
      (pickupMissing ? pickupInputRef : dropoffInputRef).current?.focus();
      return;
    }

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
        pickup: pickupLabel,
        dropoff: dropoffLabel,
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
            content_name: `Transfer: ${selectedVehicleName} (${pickupLabel} -> ${dropoffLabel})`,
            content_category: "Transfer",
            value: calculatedFare,
            currency: "GEL",
          }, { eventID: bId });
        }
        trackEvent("book_transfer_success", {
          eventId: bId,
          vehicle: selectedVehicleName,
          pickup: pickupLabel,
          dropoff: dropoffLabel,
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
          `📍 *Pickup:* ${pickupLabel.trim() || "Not specified"}`,
          `🏁 *Dropoff:* ${dropoffLabel.trim() || "Not specified"}`,
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
          `📍 *Откуда:* ${pickupLabel.trim() || "Не указано"}`,
          `🏁 *Куда:* ${dropoffLabel.trim() || "Не указано"}`,
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
          `📍 *Nereden:* ${pickupLabel.trim() || "Belirtilmedi"}`,
          `🏁 *Nereye:* ${dropoffLabel.trim() || "Belirtilmedi"}`,
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
          `📍 *مكان الانطلاق:* ${pickupLabel.trim() || "غير محدد"}`,
          `🏁 *الوجهة:* ${dropoffLabel.trim() || "غير محدد"}`,
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
          `📍 *საიდან:* ${pickupLabel.trim() || "არ არის მითითებული"}`,
          `🏁 *სად:* ${dropoffLabel.trim() || "არ არის მითითებული"}`,
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

    // A map pin helps the driver find villages and hotels picked from the map.
    if (from.value?.kind === "place") {
      lines.push(`🗺️ ${ui.from}: https://maps.google.com/?q=${from.value.lat},${from.value.lng}`);
    }
    if (to.value?.kind === "place") {
      lines.push(`🗺️ ${ui.to}: https://maps.google.com/?q=${to.value.lat},${to.value.lng}`);
    }

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
        <div className="container" style={{ maxWidth: "1200px" }}>
          <div className="tf-calc-card">
            <header className="tf-calc-head">
              <span className="tf-ai-badge">{ui.aiBadge}</span>
              <h2 className="tf-calc-title">{ui.calcTitle}</h2>
              <p className="tf-calc-subtitle">{ui.calcSub}</p>
            </header>

            <form onSubmit={handleTransferSubmit} className="tf-calc-form">
              <div className="tf-calc-main">
                <section className="tf-step tf-step--route">
                  <div className="tf-step-head">
                    <span className="tf-step-num">1</span>
                    <h3 className="tf-step-title">{ui.stepRoute}</h3>
                  </div>
                  {/* ROUTE BAR: FROM ⇄ TO, both accept any place in Georgia */}
                  <div className="tf-route-bar">
                    <PlaceSearchField
                      field={from}
                      id="tf-pickup"
                      label={t("transfersPage.pickupLabel") || "აყვანის მისამართი (საიდან)"}
                      placeholder={ui.pickupSearchPlaceholder}
                      dot="start"
                      fieldRef={pickupRef}
                      inputRef={pickupInputRef}
                      isOpen={openField === "pickup"}
                      setOpen={openSetter("pickup")}
                      ui={ui}
                      lang={lang}
                      getLocationLabel={getLocationLabel}
                    />

                    <button
                      type="button"
                      className="tf-btn-swap"
                      onClick={handleSwapLocations}
                      disabled={!canSwap}
                      title={ui.swap}
                      aria-label={ui.swap}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16" />
                      </svg>
                    </button>

                    <PlaceSearchField
                      field={to}
                      id="tf-dropoff"
                      label={t("transfersPage.dropoffLabel") || "ჩასვლის მისამართი (სად)"}
                      placeholder={ui.dropoffSearchPlaceholder}
                      dot="end"
                      fieldRef={dropoffRef}
                      inputRef={dropoffInputRef}
                      isOpen={openField === "dropoff"}
                      setOpen={openSetter("dropoff")}
                      ui={ui}
                      lang={lang}
                      getLocationLabel={getLocationLabel}
                    />
                  </div>

                  {(from.error || to.error) && <p className="tf-route-error">⚠️ {ui.pickDropoff}</p>}
                </section>

                <section className="tf-step">
                  <div className="tf-step-head">
                    <span className="tf-step-num">2</span>
                    <h3 className="tf-step-title">{ui.stepVehicle}</h3>
                  </div>
                  <div className="tf-vehicles-grid" role="radiogroup" aria-label={t("transfersPage.vehicleLabel") || "Vehicle"}>
                    {fleetKeys.map((key) => {
                      const data = TRANSFER_VEHICLES[key];
                      const vMeta = t(`transfersPage.vehicles.${key}`) || {};
                      const isSelected = selectedVehicleKey === key;
                      const calculatedPrice = quote?.allVehiclePrices[key];

                      return (
                        <div
                          key={key}
                          role="radio"
                          aria-checked={isSelected}
                          tabIndex={0}
                          onClick={() => handleSelectVehicle(key)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleSelectVehicle(key);
                            }
                          }}
                          className={`tf-vehicle-tile${isSelected ? " is-selected" : ""}`}
                        >
                          <span className={`tf-v-radio${isSelected ? " is-on" : ""}`} aria-hidden="true">
                            {isSelected && <CheckIcon size={12} />}
                          </span>
                          <div className="tf-v-img-wrap">
                            <Image
                              src={data.img}
                              alt={vMeta.name || data.nameKa}
                              width={130}
                              height={80}
                              style={{ objectFit: "contain" }}
                            />
                          </div>

                          <div className="tf-v-tile-body">
                            <h4 className="tf-v-name">{vMeta.name || data.nameKa}</h4>
                            <div className="tf-v-specs">
                              <span>👥 {data.capacityPax} {ui.pax}</span>
                              <span>🧳 {data.capacityBags} {ui.bags}</span>
                            </div>
                            <div className="tf-v-calculated-price">
                              <span className="tf-v-p-label">{ui.totalPrice}</span>
                              <span className="tf-v-p-amount">{calculatedPrice != null ? `~${calculatedPrice} ₾` : "—"}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="tf-step">
                  <div className="tf-step-head">
                    <span className="tf-step-num">3</span>
                    <h3 className="tf-step-title">{ui.stepDetails}</h3>
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
                          max={TRANSFER_VEHICLES[selectedVehicleKey]?.capacityPax || 16}
                          value={passengerCount}
                          onChange={(e) => setPassengerCount(e.target.value)}
                          required
                          className="tf-stepper-input"
                        />
                        <button
                          type="button"
                          className="tf-stepper-btn"
                          onClick={() => {
                            const maxPax = TRANSFER_VEHICLES[selectedVehicleKey]?.capacityPax || 16;
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
                </section>
              </div>

              <aside className="tf-calc-aside">
                <div
                  className={`tf-ticket${routeLoading ? " is-loading" : ""}${quote ? " has-quote" : ""}`}
                  aria-live="polite"
                  aria-busy={routeLoading}
                >
                  <div className="tf-ticket-head">
                    <span className="tf-ticket-kicker">{ui.tripSummary}</span>
                    {route?.source === "map" && !routeLoading && <span className="tf-ticket-chip">🗺️ {ui.viaMapShort}</span>}
                  </div>

                  <div className="tf-ticket-route">
                    <div className="tf-ticket-stop">
                      <span className="tf-ticket-dot tf-ticket-dot--start" aria-hidden="true" />
                      <div className="tf-ticket-stop-text">
                        <span className="tf-ticket-stop-label">{ui.from}</span>
                        <strong className="tf-ticket-stop-name">{from.name || "—"}</strong>
                        {from.detail && <span className="tf-ticket-stop-detail">{from.detail}</span>}
                      </div>
                    </div>
                    <div className="tf-ticket-track" aria-hidden="true">
                      <span className="tf-ticket-car" />
                    </div>
                    <div className="tf-ticket-stop">
                      <span className="tf-ticket-dot tf-ticket-dot--end" aria-hidden="true" />
                      <div className="tf-ticket-stop-text">
                        <span className="tf-ticket-stop-label">{ui.to}</span>
                        <strong className="tf-ticket-stop-name">{to.name || "—"}</strong>
                        {to.detail && <span className="tf-ticket-stop-detail">{to.detail}</span>}
                      </div>
                    </div>
                  </div>

                  {routeLoading ? (
                    <div className="tf-ticket-loading">
                      <div className="tf-radar" aria-hidden="true">
                        <span className="tf-radar-ring" />
                        <span className="tf-radar-ring tf-radar-ring--2" />
                        <span className="tf-radar-pin">📍</span>
                      </div>
                      <div className="tf-ticket-loading-text">
                        <strong>{ui.calculating}</strong>
                        <span className="tf-skel tf-skel--light" />
                        <span className="tf-skel tf-skel--light tf-skel--short" />
                      </div>
                    </div>
                  ) : quote ? (
                    <div className="tf-ticket-metrics">
                      <div className="tf-ticket-metric">
                        <span className="tf-ticket-metric-icon" aria-hidden="true">📏</span>
                        <strong>{quote.distanceKm} {ui.km}</strong>
                        <span>{ui.distance}</span>
                      </div>
                      <div className="tf-ticket-metric">
                        <span className="tf-ticket-metric-icon" aria-hidden="true">⏱️</span>
                        <strong>{quote.formattedDuration}</strong>
                        <span>{ui.estTime}</span>
                      </div>
                      <div className="tf-ticket-metric">
                        <span className="tf-ticket-metric-icon" aria-hidden="true">🚘</span>
                        <strong>{selectedVehicleName}</strong>
                        <span>{ui.vehicle}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="tf-ticket-empty">📍 {ui.pickDropoff}</p>
                  )}

                  <div className="tf-ticket-price">
                    <span className="tf-price-label">{ui.totalPrice}</span>
                    {routeLoading ? (
                      <span className="tf-skel tf-skel--price" aria-hidden="true" />
                    ) : (
                      <span key={`${quote?.priceGEL}-${selectedVehicleKey}`} className="tf-price-val">
                        {quote?.priceGEL != null ? `~${quote.priceGEL} ₾` : "—"}
                      </span>
                    )}
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
              </aside>
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
              const data = TRANSFER_VEHICLES[key];
              const vMeta = t(`transfersPage.vehicles.${key}`) || {};
              const isSelected = selectedVehicleKey === key;
              const calculatedPrice = quote?.allVehiclePrices[key];

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
                        <span style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--gt-ink)" }}>{calculatedPrice != null ? `~${calculatedPrice} ₾` : "—"}</span>
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
