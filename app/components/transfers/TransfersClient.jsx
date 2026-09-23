"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import Navbar from "../Navbar";
import Footer from "../Footer";
import PageHero from "../PageHero";
import DatePicker from "../DatePicker";
import { WA_LINK, WhatsAppIcon } from "../../lib/shared";
import { CheckIcon, ChevronDownIcon, SearchIcon } from "../Icons";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { isValidPhone } from "../../lib/bookingModel";
import { trackEvent } from "../../lib/analytics";
import {
  TRANSFER_LOCATIONS,
  TRANSFER_VEHICLES,
  LOCATION_BY_ID,
  PICKUP_LOCATION_IDS,
  estimateRouteDistance,
  isSvanetiRoute,
  quoteFromRoute,
} from "../../lib/transfers/routeCalculator";
import { TRANSFER_VEHICLE_KEYS, normalizeTransferPricing } from "../../lib/transfers/pricing";

const AIRPORT_IDS = PICKUP_LOCATION_IDS.filter((id) => LOCATION_BY_ID[id].category === "airport");
const PICKUP_CITY_IDS = PICKUP_LOCATION_IDS.filter((id) => LOCATION_BY_ID[id].category !== "airport");
const DESTINATION_IDS = TRANSFER_LOCATIONS.filter((l) => l.category !== "airport").map((l) => l.id);

function matchKnownLocations(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return TRANSFER_LOCATIONS.filter((l) => Object.values(l.names).some((n) => n.toLowerCase().includes(q)));
}

function exactKnownLocation(query) {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  return TRANSFER_LOCATIONS.find((l) => Object.values(l.names).some((n) => n.toLowerCase() === q)) || null;
}

// "Sarpi, Khelvachauri Municipality" — the region part is dropped as noise.
const shortDetail = (p) => (p.detail ? p.detail.split(", ")[0] : "");
const placeLabel = (p) => (shortDetail(p) ? `${p.name}, ${shortDetail(p)}` : p.name);

export default function TransfersClient({ pricing: pricingProp }) {
  const { t, lang, isEnglish } = useLanguage();
  const pricing = useMemo(() => normalizeTransferPricing(pricingProp), [pricingProp]);

  const [pickupId, setPickupId] = useState("tbilisi_airport");
  // { kind: "known", id } | { kind: "place", name, detail, lat, lng } | null while typing
  const [dropoff, setDropoff] = useState({ kind: "known", id: "batumi_city" });
  const [dropoffText, setDropoffText] = useState("");
  const [dropoffError, setDropoffError] = useState(false);
  const [openField, setOpenField] = useState(null); // "pickup" | "dropoff" | null
  const [mapSearch, setMapSearch] = useState({ query: "", items: [] });
  const [mapRoutes, setMapRoutes] = useState({}); // routeKey -> route | "error"
  const pickupRef = useRef(null);
  const dropoffRef = useRef(null);
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

  const pickup = LOCATION_BY_ID[pickupId];
  const pickupLabel = getLocationLabel(pickup);
  const dropoffPoint =
    dropoff?.kind === "known" ? LOCATION_BY_ID[dropoff.id] : dropoff ? { id: "map_place", lat: dropoff.lat, lng: dropoff.lng } : null;
  const dropoffLabel =
    dropoff?.kind === "known" ? getLocationLabel(LOCATION_BY_ID[dropoff.id]) : dropoff ? placeLabel(dropoff) : "";
  const dropoffName = dropoff?.kind === "place" ? dropoff.name : dropoffLabel;
  const dropoffDetail = dropoff?.kind === "place" ? shortDetail(dropoff) : "";

  // Keep the input text in the visitor's language for picked known places.
  useEffect(() => {
    if (dropoff?.kind === "known") setDropoffText(getLocationLabel(LOCATION_BY_ID[dropoff.id]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // ── Route: exact table first, otherwise real road distance from the map ──
  const staticRoute = dropoffPoint ? estimateRouteDistance(pickup, dropoffPoint) : null;
  const needsMapRoute = !!staticRoute && staticRoute.source === "coordinates_heuristic";
  const routeKey = needsMapRoute ? `${pickup.lat},${pickup.lng}|${dropoffPoint.lat},${dropoffPoint.lng}` : null;
  const mapRoute = routeKey ? mapRoutes[routeKey] : undefined;
  const routeLoading = needsMapRoute && mapRoute === undefined;

  useEffect(() => {
    if (!routeKey || mapRoutes[routeKey] !== undefined) return;
    const [from, to] = routeKey.split("|");
    const ctrl = new AbortController();
    fetch(`/api/transfers/route?from=${from}&to=${to}`, { signal: ctrl.signal })
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
  const isSvaneti = dropoffPoint
    ? isSvanetiRoute(pickupLabel, dropoff.kind === "place" ? dropoff.name : dropoffLabel, pickup, dropoffPoint)
    : false;

  const quote = useMemo(
    () => quoteFromRoute(route, pricing, { vehicleKey: selectedVehicleKey, isSvaneti, lang }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [route?.distanceKm, route?.durationMinutes, pricing, selectedVehicleKey, isSvaneti, lang]
  );

  // ── "To" search: known destinations + any place in Georgia from the map ──
  const typedQuery = dropoff ? "" : dropoffText.trim();
  const knownMatches = useMemo(() => matchKnownLocations(typedQuery), [typedQuery]);

  useEffect(() => {
    if (typedQuery.length < 2) {
      setMapSearch({ query: "", items: [] });
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/transfers/places?q=${encodeURIComponent(typedQuery)}&lang=${lang}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((data) => setMapSearch({ query: typedQuery, items: data.results || [] }))
        .catch((err) => {
          if (err.name !== "AbortError") setMapSearch({ query: typedQuery, items: [] });
        });
    }, 350);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [typedQuery, lang]);

  const mapItems = mapSearch.query === typedQuery ? mapSearch.items : [];

  // Leaving the field with typed text picks the best match automatically.
  useEffect(() => {
    if (openField === "dropoff" || dropoff || !typedQuery) return;
    if (knownMatches.length) {
      selectKnownDropoff(knownMatches[0].id);
    } else if (mapItems.length) {
      selectPlace(mapItems[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openField, dropoff, typedQuery, knownMatches, mapItems]);

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

  const handleSelectPickup = (id) => {
    setPickupId(id);
    setOpenField(null);
  };

  const selectKnownDropoff = (id) => {
    setDropoff({ kind: "known", id });
    setDropoffText(getLocationLabel(LOCATION_BY_ID[id]));
    setDropoffError(false);
    setOpenField(null);
  };

  function selectPlace(place) {
    setDropoff({ kind: "place", name: place.name, detail: place.detail, lat: place.lat, lng: place.lng });
    setDropoffText(placeLabel(place));
    setDropoffError(false);
    setOpenField(null);
  }

  const handleDropoffChange = (value) => {
    setDropoffText(value);
    setDropoffError(false);
    setOpenField("dropoff");
    const exact = exactKnownLocation(value);
    setDropoff(exact ? { kind: "known", id: exact.id } : null);
  };

  const handleDropoffKeyDown = (e) => {
    if (e.key === "Escape") {
      setOpenField(null);
      return;
    }
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (dropoff) {
      setOpenField(null);
    } else if (knownMatches.length) {
      selectKnownDropoff(knownMatches[0].id);
    } else if (mapItems.length) {
      selectPlace(mapItems[0]);
    }
  };

  const clearDropoff = () => {
    setDropoff(null);
    setDropoffText("");
    setOpenField("dropoff");
    dropoffInputRef.current?.focus();
  };

  // Pickup is limited to airports and the three main cities, so swapping only
  // works when the destination is one of those.
  const canSwap = dropoff?.kind === "known" && PICKUP_LOCATION_IDS.includes(dropoff.id);
  const handleSwapLocations = () => {
    if (!canSwap) return;
    const nextPickup = dropoff.id;
    setDropoff({ kind: "known", id: pickupId });
    setDropoffText(getLocationLabel(LOCATION_BY_ID[pickupId]));
    setPickupId(nextPickup);
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
      swapDisabled: "გაცვლა შესაძლებელია მხოლოდ აეროპორტსა და დიდ ქალაქებს შორის",
      dropoffSearchPlaceholder: "ჩაწერეთ ნებისმიერი ადგილი: სოფელი, სასტუმრო, მისამართი...",
      anyPlaceHint: "ჩაწერეთ საქართველოს ნებისმიერი ადგილი — მანძილს და ფასს რუკიდან დავითვლით",
      mapResults: "📍 ადგილები რუკიდან",
      searching: "ვეძებთ...",
      noResults: "ვერაფერი მოიძებნა — სცადეთ სხვანაირად დაწერა",
      calculating: "მარშრუტი ითვლება რუკიდან...",
      pickDropoff: "აირჩიეთ დანიშნულების ადგილი სიიდან, რომ ნახოთ ფასი",
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
      swapDisabled: "Swap works only between airports and the main cities",
      dropoffSearchPlaceholder: "Type any place: village, hotel, address...",
      anyPlaceHint: "Type any place in Georgia — we calculate distance and price from the map",
      mapResults: "📍 Places on the map",
      searching: "Searching...",
      noResults: "Nothing found — try a different spelling",
      calculating: "Calculating route from the map...",
      pickDropoff: "Choose a destination from the list to see the price",
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
      swapDisabled: "Поменять можно только аэропорты и крупные города",
      dropoffSearchPlaceholder: "Введите любое место: село, отель, адрес...",
      anyPlaceHint: "Введите любое место в Грузии — расстояние и цену посчитаем по карте",
      mapResults: "📍 Места на карте",
      searching: "Ищем...",
      noResults: "Ничего не найдено — попробуйте написать иначе",
      calculating: "Считаем маршрут по карте...",
      pickDropoff: "Выберите пункт назначения из списка, чтобы увидеть цену",
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
      swapDisabled: "Değiştirme yalnızca havalimanları ve büyük şehirler arasında yapılabilir",
      dropoffSearchPlaceholder: "Herhangi bir yer yazın: köy, otel, adres...",
      anyPlaceHint: "Gürcistan'da herhangi bir yer yazın — mesafe ve fiyatı haritadan hesaplarız",
      mapResults: "📍 Haritadaki yerler",
      searching: "Aranıyor...",
      noResults: "Sonuç bulunamadı — farklı yazmayı deneyin",
      calculating: "Rota haritadan hesaplanıyor...",
      pickDropoff: "Fiyatı görmek için listeden bir varış noktası seçin",
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
      swapDisabled: "التبديل متاح فقط بين المطارات والمدن الرئيسية",
      dropoffSearchPlaceholder: "اكتب أي مكان: قرية، فندق، عنوان...",
      anyPlaceHint: "اكتب أي مكان في جورجيا — نحسب المسافة والسعر من الخريطة",
      mapResults: "📍 أماكن على الخريطة",
      searching: "جارٍ البحث...",
      noResults: "لم يتم العثور على نتائج — جرّب كتابة مختلفة",
      calculating: "جارٍ حساب المسار من الخريطة...",
      pickDropoff: "اختر الوجهة من القائمة لرؤية السعر",
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
      setDropoffError(true);
      dropoffInputRef.current?.focus();
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
    if (dropoff?.kind === "place") {
      lines.push(`🗺️ https://maps.google.com/?q=${dropoff.lat},${dropoff.lng}`);
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
                  {/* ROUTE BAR: FROM (fixed list) ⇄ TO (any place in Georgia) */}
                  <div className="tf-route-bar">
                    <div
                      ref={pickupRef}
                      className={`tf-field${openField === "pickup" ? " is-open" : ""}`}
                    >
                      <span className="tf-field-dot tf-field-dot--start" aria-hidden="true" />
                      <div className="tf-field-main">
                        <label className="tf-field-label" htmlFor="tf-pickup">
                          {t("transfersPage.pickupLabel") || "აყვანის მისამართი (საიდან)"}
                        </label>
                        <button
                          id="tf-pickup"
                          type="button"
                          className="tf-field-select"
                          aria-haspopup="listbox"
                          aria-expanded={openField === "pickup"}
                          onClick={() => setOpenField(openField === "pickup" ? null : "pickup")}
                        >
                          <span className="tf-field-select-text">
                            <span aria-hidden="true">{pickup.icon}</span> {pickupLabel}
                          </span>
                          <ChevronDownIcon size={14} className="tf-field-chevron" />
                        </button>
                      </div>

                      {openField === "pickup" && (
                        <div className="tf-dd" role="listbox" aria-label={t("transfersPage.pickupLabel") || "Pickup"}>
                          {[
                            { title: ui.airportsTab, ids: AIRPORT_IDS },
                            { title: ui.citiesTab, ids: PICKUP_CITY_IDS },
                          ].map((group) => (
                            <div key={group.title} className="tf-dd-group">
                              <span className="tf-dd-title">{group.title}</span>
                              <div className="tf-dd-options">
                                {group.ids.map((id) => {
                                  const loc = LOCATION_BY_ID[id];
                                  const active = id === pickupId;
                                  return (
                                    <button
                                      key={id}
                                      type="button"
                                      role="option"
                                      aria-selected={active}
                                      className={`tf-dd-option${active ? " is-active" : ""}`}
                                      onClick={() => handleSelectPickup(id)}
                                    >
                                      <span className="tf-dd-option-icon" aria-hidden="true">{loc.icon}</span>
                                      <span className="tf-dd-option-name">{getLocationLabel(loc)}</span>
                                      {active && <CheckIcon size={14} />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="tf-btn-swap"
                      onClick={handleSwapLocations}
                      disabled={!canSwap}
                      title={canSwap ? ui.swap : ui.swapDisabled}
                      aria-label={ui.swap}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16" />
                      </svg>
                    </button>

                    <div
                      ref={dropoffRef}
                      className={`tf-field${openField === "dropoff" ? " is-open" : ""}${dropoffError ? " has-error" : ""}`}
                      onBlur={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget)) setOpenField(null);
                      }}
                    >
                      <span className="tf-field-dot tf-field-dot--end" aria-hidden="true" />
                      <div className="tf-field-main">
                        <label className="tf-field-label" htmlFor="tf-dropoff">
                          {t("transfersPage.dropoffLabel") || "ჩასვლის მისამართი (სად)"}
                        </label>
                        <div className="tf-field-input-wrap">
                          <SearchIcon size={16} className="tf-field-search-icon" />
                          <input
                            id="tf-dropoff"
                            ref={dropoffInputRef}
                            type="text"
                            role="combobox"
                            aria-expanded={openField === "dropoff"}
                            aria-autocomplete="list"
                            autoComplete="off"
                            value={dropoffText}
                            onFocus={(e) => {
                              setOpenField("dropoff");
                              e.target.select();
                            }}
                            onChange={(e) => handleDropoffChange(e.target.value)}
                            onKeyDown={handleDropoffKeyDown}
                            placeholder={ui.dropoffSearchPlaceholder}
                            className="tf-field-input"
                          />
                          {dropoffText && (
                            <button type="button" className="tf-field-clear" onClick={clearDropoff} aria-label={ui.clear}>
                              ×
                            </button>
                          )}
                        </div>
                      </div>

                      {openField === "dropoff" && (
                        // preventDefault keeps focus in the input, so picking an option never blurs it first.
                        <div className="tf-dd" role="listbox" onMouseDown={(e) => e.preventDefault()}>
                          {!typedQuery ? (
                            <>
                              <p className="tf-dd-hint">🗺️ {ui.anyPlaceHint}</p>
                              {[
                                { title: ui.airportsTab, ids: AIRPORT_IDS },
                                { title: ui.popularTab, ids: DESTINATION_IDS },
                              ].map((group) => (
                                <div key={group.title} className="tf-dd-group">
                                  <span className="tf-dd-title">{group.title}</span>
                                  <div className="tf-dd-options">
                                    {group.ids.map((id) => {
                                      const loc = LOCATION_BY_ID[id];
                                      const active = dropoff?.kind === "known" && dropoff.id === id;
                                      return (
                                        <button
                                          key={id}
                                          type="button"
                                          role="option"
                                          aria-selected={active}
                                          className={`tf-dd-option${active ? " is-active" : ""}`}
                                          onClick={() => selectKnownDropoff(id)}
                                        >
                                          <span className="tf-dd-option-icon" aria-hidden="true">{loc.icon}</span>
                                          <span className="tf-dd-option-name">{getLocationLabel(loc)}</span>
                                          {active && <CheckIcon size={14} />}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </>
                          ) : (
                            <>
                              {knownMatches.length > 0 && (
                                <div className="tf-dd-group">
                                  <span className="tf-dd-title">{ui.popularTab}</span>
                                  <div className="tf-dd-options">
                                    {knownMatches.map((loc) => (
                                      <button
                                        key={loc.id}
                                        type="button"
                                        role="option"
                                        aria-selected={false}
                                        className="tf-dd-option"
                                        onClick={() => selectKnownDropoff(loc.id)}
                                      >
                                        <span className="tf-dd-option-icon" aria-hidden="true">{loc.icon}</span>
                                        <span className="tf-dd-option-name">{getLocationLabel(loc)}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="tf-dd-group">
                                <span className="tf-dd-title">{ui.mapResults}</span>
                                {mapItems.length > 0 ? (
                                  <div className="tf-dd-list">
                                    {mapItems.map((place) => (
                                      <button
                                        key={place.id}
                                        type="button"
                                        role="option"
                                        aria-selected={false}
                                        className="tf-dd-place"
                                        onClick={() => selectPlace(place)}
                                      >
                                        <span className="tf-dd-place-pin" aria-hidden="true">📍</span>
                                        <span className="tf-dd-place-text">
                                          <span className="tf-dd-place-name">{place.name}</span>
                                          {place.detail && <span className="tf-dd-place-detail">{place.detail}</span>}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                ) : typedQuery.length >= 2 && mapSearch.query !== typedQuery ? (
                                  <div className="tf-dd-searching" role="status">
                                    <div className="tf-dd-searching-head">
                                      <span className="tf-mini-radar" aria-hidden="true"><span /></span>
                                      {ui.searching}
                                    </div>
                                    {[0, 1, 2].map((i) => (
                                      <div key={i} className="tf-skel-row" aria-hidden="true">
                                        <span className="tf-skel tf-skel--pin" />
                                        <span className="tf-skel-lines">
                                          <span className="tf-skel" />
                                          <span className="tf-skel tf-skel--short" />
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="tf-dd-status">
                                    {typedQuery.length < 2 ? ui.anyPlaceHint : ui.noResults}
                                  </p>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {dropoffError && <p className="tf-route-error">⚠️ {ui.pickDropoff}</p>}
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
                        <strong className="tf-ticket-stop-name">{pickupLabel}</strong>
                      </div>
                    </div>
                    <div className="tf-ticket-track" aria-hidden="true">
                      <span className="tf-ticket-car" />
                    </div>
                    <div className="tf-ticket-stop">
                      <span className="tf-ticket-dot tf-ticket-dot--end" aria-hidden="true" />
                      <div className="tf-ticket-stop-text">
                        <span className="tf-ticket-stop-label">{ui.to}</span>
                        <strong className="tf-ticket-stop-name">{dropoffName || "—"}</strong>
                        {dropoffDetail && <span className="tf-ticket-stop-detail">{dropoffDetail}</span>}
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
