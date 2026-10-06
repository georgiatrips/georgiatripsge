"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import Navbar from "../Navbar";
import Footer from "../Footer";
import PageHero from "../PageHero";
import DatePicker from "../DatePicker";
import PlaceSearchField, { usePlaceField } from "./PlaceSearchField";
import { WA_LINK, WhatsAppIcon } from "../../lib/shared";
import { CalendarIcon, CarIcon, CheckIcon, ClockIcon, LuggageIcon, RouteIcon, UsersIcon } from "../Icons";
import { useLanguage } from "../../lib/i18n/LanguageContext";
import { useCurrency } from "../../lib/currency/CurrencyContext";
import { isValidPhone } from "../../lib/bookingModel";
import { trackEvent } from "../../lib/analytics";
import {
  LOCATION_BY_ID,
  TRANSFER_VEHICLES,
  estimateRouteDistance,
  isSvanetiRoute,
  quoteFromRoute,
} from "../../lib/transfers/routeCalculator";
import { TRANSFER_VEHICLE_KEYS, toPublicPricing } from "../../lib/transfers/pricing";

// Leaflet needs window and is only wanted on this page, so it loads on its own.
const TransferMap = dynamic(() => import("./TransferMap"), {
  ssr: false,
  loading: () => (
    <div className="tf-map" aria-hidden="true">
      <div className="tf-map-skeleton" />
    </div>
  ),
});

const MAX_PASSENGERS = Math.max(...TRANSFER_VEHICLE_KEYS.map((key) => TRANSFER_VEHICLES[key]?.capacityPax || 0));
// Smallest vehicle first, so a growing group moves to the next one that seats it.
const VEHICLES_BY_CAPACITY = [...TRANSFER_VEHICLE_KEYS].sort(
  (a, b) => TRANSFER_VEHICLES[a].capacityPax - TRANSFER_VEHICLES[b].capacityPax
);

const INTL_LOCALE = { ka: "ka-GE", en: "en-GB", ru: "ru-RU", tr: "tr-TR", ar: "ar-u-nu-latn" };

function formatTripDate(iso, lang) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  try {
    return new Intl.DateTimeFormat(INTL_LOCALE[lang] || "en-GB", { weekday: "short", day: "numeric", month: "short" }).format(
      new Date(y, m - 1, d)
    );
  } catch {
    return iso;
  }
}

export default function TransfersClient({ pricing: pricingProp, children }) {
  const { t, lang, isEnglish } = useLanguage();
  const { currency, format: formatCurrency } = useCurrency();
  const pricing = useMemo(() => pricingProp || toPublicPricing(null), [pricingProp]);

  const [openField, setOpenField] = useState(null); // "pickup" | "dropoff" | null
  const [mapRoutes, setMapRoutes] = useState({}); // routeKey -> route | "error"
  const pickupRef = useRef(null);
  const dropoffRef = useRef(null);
  const pickupInputRef = useRef(null);
  const dropoffInputRef = useRef(null);
  const phoneInputRef = useRef(null);

  const [selectedVehicleKey, setSelectedVehicleKey] = useState("sedan");
  const [transferDate, setTransferDate] = useState("");
  const [transferTime, setTransferTime] = useState("");
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
  // Map places (searched or pinned) also carry a map link, so the driver gets
  // the exact spot, not just a name.
  const withMapLink = (field) =>
    field.value?.kind === "place" ? `${field.label} — https://maps.google.com/?q=${field.value.lat},${field.value.lng}` : field.label;
  const pickupForDriver = withMapLink(from);
  const dropoffForDriver = withMapLink(to);

  // ── Route: exact table first, otherwise real road distance from the map ──
  // The road itself is always fetched: the mini map draws it.
  const staticRoute = pickupPoint && dropoffPoint ? estimateRouteDistance(pickupPoint, dropoffPoint) : null;
  const needsMapRoute = !!staticRoute && staticRoute.source === "coordinates_heuristic";
  const routeKey = staticRoute ? `${pickupPoint.lat},${pickupPoint.lng}|${dropoffPoint.lat},${dropoffPoint.lng}` : null;
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

  // Route pages (/transfers/<route>) link here as ?from=<id>&to=<id>. Read
  // after mount: the page itself is static, so the server render keeps the
  // default route and the link's route replaces it on the client.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromId = params.get("from");
    const toId = params.get("to");
    if (fromId && LOCATION_BY_ID[fromId]) from.assign({ kind: "known", id: fromId });
    if (toId && LOCATION_BY_ID[toId] && toId !== fromId) to.assign({ kind: "known", id: toId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const passengers = Math.min(MAX_PASSENGERS, Math.max(1, parseInt(passengerCount, 10) || 1));

  // A group that outgrows the selected vehicle moves to the smallest one that seats it.
  const setPassengers = (count) => {
    const next = Math.min(MAX_PASSENGERS, Math.max(1, count || 1));
    setPassengerCount(String(next));
    if (TRANSFER_VEHICLES[selectedVehicleKey].capacityPax < next) {
      const fit = VEHICLES_BY_CAPACITY.find((key) => TRANSFER_VEHICLES[key].capacityPax >= next);
      if (fit) setSelectedVehicleKey(fit);
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
      mapHint: "📌 ვერ იპოვეთ? გადაათრიეთ A ან B ნიშნული ზუსტ ადგილზე რუკაზე.",
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
      passengers: "მგზავრები",
      maxPax: "მაქს. {n} მგზავრი",
      date: "თარიღი",
      time: "დრო",
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
      mapHint: "📌 Can't find it? Drag pin A or B to the exact spot on the map.",
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
      passengers: "Passengers",
      maxPax: "Max {n} passengers",
      date: "Date",
      time: "Time",
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
      mapHint: "📌 Не нашли? Перетащите метку A или B в нужное место на карте.",
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
      passengers: "Пассажиры",
      maxPax: "Макс. {n} пасс.",
      date: "Дата",
      time: "Время",
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
      mapHint: "📌 Bulamadınız mı? A veya B işaretini haritada tam yere sürükleyin.",
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
      passengers: "Yolcu",
      maxPax: "En fazla {n} yolcu",
      date: "Tarih",
      time: "Saat",
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
      mapHint: "📌 لم تجده؟ اسحب العلامة A أو B إلى المكان الدقيق على الخريطة.",
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
      passengers: "الركاب",
      maxPax: "حتى {n} ركاب",
      date: "التاريخ",
      time: "الوقت",
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
      // On phones the button sits far below the field; bring the error into view.
      phoneInputRef.current?.focus();
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
        pickup: pickupForDriver,
        dropoff: dropoffForDriver,
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
          `📍 *Pickup:* ${pickupForDriver.trim() || "Not specified"}`,
          `🏁 *Dropoff:* ${dropoffForDriver.trim() || "Not specified"}`,
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
          `📍 *Откуда:* ${pickupForDriver.trim() || "Не указано"}`,
          `🏁 *Куда:* ${dropoffForDriver.trim() || "Не указано"}`,
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
          `📍 *Nereden:* ${pickupForDriver.trim() || "Belirtilmedi"}`,
          `🏁 *Nereye:* ${dropoffForDriver.trim() || "Belirtilmedi"}`,
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
          `📍 *مكان الانطلاق:* ${pickupForDriver.trim() || "غير محدد"}`,
          `🏁 *الوجهة:* ${dropoffForDriver.trim() || "غير محدد"}`,
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
          `📍 *საიდან:* ${pickupForDriver.trim() || "არ არის მითითებული"}`,
          `🏁 *სად:* ${dropoffForDriver.trim() || "არ არის მითითებული"}`,
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

    // Safari blocks a new tab opened after the awaited booking call; fall back to this tab.
    const waUrl = `${WA_LINK}?text=${encodeURIComponent(lines.filter(Boolean).join("\n"))}`;
    const waTab = window.open(waUrl, "_blank");
    if (!waTab) window.location.href = waUrl;
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

                {(from.error || to.error) && <p className="tf-route-error" role="alert">{ui.pickDropoff}</p>}

                <TransferMap
                  from={pickupPoint}
                  to={dropoffPoint}
                  path={mapRoute && mapRoute !== "error" ? mapRoute.path : null}
                  onPick={(which, lat, lng) => (which === "from" ? from : to).setPin(lat, lng)}
                  hint={ui.mapHint}
                />
              </section>

              <section className="tf-step">
                <div className="tf-step-head">
                  <span className="tf-step-num">2</span>
                  <h3 className="tf-step-title">{ui.stepVehicle}</h3>

                  {/* Passengers sit with the vehicles: the group size decides which ones fit. */}
                  <div className="tf-pax">
                    <label className="tf-pax-label" htmlFor="tf-passengers">
                      <UsersIcon size={15} />
                      {ui.passengers}
                    </label>
                    <div className="tf-stepper-wrap">
                      <button
                        type="button"
                        className="tf-stepper-btn"
                        onClick={() => setPassengers(passengers - 1)}
                        disabled={passengers <= 1}
                        aria-label={`${ui.passengers} −1`}
                      >
                        −
                      </button>
                      <input
                        id="tf-passengers"
                        type="number"
                        inputMode="numeric"
                        min="1"
                        max={MAX_PASSENGERS}
                        value={passengerCount}
                        onChange={(e) => (e.target.value === "" ? setPassengerCount("") : setPassengers(parseInt(e.target.value, 10)))}
                        onBlur={() => setPassengerCount(String(passengers))}
                        required
                        className="tf-stepper-input"
                      />
                      <button
                        type="button"
                        className="tf-stepper-btn"
                        onClick={() => setPassengers(passengers + 1)}
                        disabled={passengers >= MAX_PASSENGERS}
                        aria-label={`${ui.passengers} +1`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="tf-vehicles-grid" role="radiogroup" aria-label={t("transfersPage.vehicleLabel") || "Vehicle"}>
                  {fleetKeys.map((key) => {
                    const data = TRANSFER_VEHICLES[key];
                    const vMeta = t(`transfersPage.vehicles.${key}`) || {};
                    const isSelected = selectedVehicleKey === key;
                    const fits = data.capacityPax >= passengers;
                    const calculatedPrice = quote?.allVehiclePrices[key];

                    return (
                      <button
                        key={key}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        aria-disabled={!fits}
                        onClick={() => fits && handleSelectVehicle(key)}
                        className={`tf-vehicle-tile${isSelected ? " is-selected" : ""}${fits ? "" : " is-unfit"}`}
                      >
                        <span className="tf-v-radio" aria-hidden="true">
                          {isSelected && <CheckIcon size={12} />}
                        </span>
                        <span className="tf-v-img-wrap">
                          <Image
                            src={data.img}
                            alt=""
                            width={130}
                            height={80}
                            style={{ objectFit: "contain" }}
                          />
                        </span>

                        <span className="tf-v-tile-body">
                          <span className="tf-v-name">{vMeta.name || data.nameKa}</span>
                          {fits ? (
                            <span className="tf-v-specs">
                              <span><UsersIcon size={13} /> {data.capacityPax} {ui.pax}</span>
                              <span><LuggageIcon size={13} /> {data.capacityBags} {ui.bags}</span>
                            </span>
                          ) : (
                            <span className="tf-v-unfit">{ui.maxPax.replace("{n}", data.capacityPax)}</span>
                          )}
                        </span>

                        <span className="tf-v-price">
                          {routeLoading ? (
                            <span className="tf-skel tf-skel--tile-price" aria-hidden="true" />
                          ) : calculatedPrice != null ? (
                            `~${calculatedPrice} ₾`
                          ) : (
                            "—"
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="tf-step">
                <div className="tf-step-head">
                  <span className="tf-step-num">3</span>
                  <h3 className="tf-step-title">{ui.stepDetails}</h3>
                </div>

                <div className="tf-details-grid">
                  <div>
                    <label className="tf-label" htmlFor="tf-date">{t("transfersPage.dateLabel") || "მგზავრობის თარიღი"}</label>
                    <DatePicker
                      id="tf-date"
                      value={transferDate}
                      onChange={(dStr) => setTransferDate(dStr)}
                      placeholder={t("transfersPage.datePlaceholder") || "აირჩიეთ თარიღი"}
                      direction="down"
                    />
                  </div>

                  <div>
                    <label className="tf-label" htmlFor="tf-time">{t("transfersPage.timeLabel") || "მგზავრობის / ფრენის დრო"}</label>
                    <input
                      id="tf-time"
                      type="time"
                      value={transferTime}
                      onChange={(e) => setTransferTime(e.target.value)}
                      className="tf-input-styled"
                    />
                  </div>

                  <div>
                    <label className="tf-label" htmlFor="tf-name">{t("tourDetail.yourName") || "თქვენი სახელი"}</label>
                    <input
                      id="tf-name"
                      type="text"
                      autoComplete="name"
                      placeholder={t("tourDetail.namePlaceholder") || "მაგ: გიორგი"}
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="tf-input-styled"
                    />
                  </div>

                  <div>
                    <label className="tf-label" htmlFor="tf-phone">{t("transfersPage.phoneLabel") || "ტელეფონის ნომერი / WhatsApp"}</label>
                    <input
                      id="tf-phone"
                      ref={phoneInputRef}
                      type="tel"
                      autoComplete="tel"
                      placeholder={t("transfersPage.phonePlaceholder") || "+995 5XX XX XX XX"}
                      value={contactPhone}
                      onChange={(e) => {
                        setContactPhone(e.target.value);
                        if (phoneError) setPhoneError("");
                      }}
                      required
                      aria-invalid={!!phoneError}
                      aria-describedby={phoneError ? "tf-phone-error" : undefined}
                      className={`tf-input-styled${phoneError ? " has-error" : ""}`}
                    />
                    {phoneError && (
                      <p id="tf-phone-error" className="tf-input-error" role="alert">
                        {phoneError}
                      </p>
                    )}
                  </div>

                  <div className="tf-field-full">
                    <label className="tf-label" htmlFor="tf-notes">{t("transfersPage.flightLabel") || "ფრენის ნომერი / შენიშვნა"}</label>
                    <textarea
                      id="tf-notes"
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
              <div className={`tf-summary${routeLoading ? " is-loading" : ""}`} aria-busy={routeLoading}>
                <div className="tf-summary-top">
                  <div className="tf-summary-head">
                    <span className="tf-summary-kicker">{ui.tripSummary}</span>
                    {route?.source === "map" && !routeLoading && <span className="tf-summary-chip">{ui.viaMapShort}</span>}
                  </div>

                  <ol className="tf-summary-route">
                    <li className="tf-summary-stop tf-summary-stop--start">
                      <span className="tf-summary-dot" aria-hidden="true" />
                      <div className="tf-summary-stop-text">
                        <span className="tf-summary-stop-label">{ui.from}</span>
                        <strong className="tf-summary-stop-name">{from.name || "—"}</strong>
                        {from.detail && <span className="tf-summary-stop-detail">{from.detail}</span>}
                      </div>
                    </li>

                    <li className="tf-summary-leg">
                      {routeLoading ? (
                        <span className="tf-summary-leg-info">
                          <span className="tf-mini-radar" aria-hidden="true"><span /></span>
                          {ui.calculating}
                        </span>
                      ) : quote ? (
                        <span className="tf-summary-leg-info">
                          <span title={ui.distance}><RouteIcon size={14} /> {quote.distanceKm} {ui.km}</span>
                          <span title={ui.estTime}><ClockIcon size={14} /> {quote.formattedDuration}</span>
                        </span>
                      ) : (
                        <span className="tf-summary-leg-empty">{ui.pickDropoff}</span>
                      )}
                    </li>

                    <li className="tf-summary-stop tf-summary-stop--end">
                      <span className="tf-summary-dot" aria-hidden="true" />
                      <div className="tf-summary-stop-text">
                        <span className="tf-summary-stop-label">{ui.to}</span>
                        <strong className="tf-summary-stop-name">{to.name || "—"}</strong>
                        {to.detail && <span className="tf-summary-stop-detail">{to.detail}</span>}
                      </div>
                    </li>
                  </ol>
                </div>

                <dl className="tf-summary-rows">
                  <div className="tf-summary-row">
                    <dt><CarIcon size={16} /> {ui.vehicle}</dt>
                    <dd>{selectedVehicleName}</dd>
                  </div>
                  <div className="tf-summary-row">
                    <dt><UsersIcon size={16} /> {ui.passengers}</dt>
                    <dd>{passengers}</dd>
                  </div>
                  <div className="tf-summary-row">
                    <dt><CalendarIcon size={16} /> {ui.date}</dt>
                    <dd className={transferDate ? "" : "is-empty"}>{formatTripDate(transferDate, lang) || "—"}</dd>
                  </div>
                  <div className="tf-summary-row">
                    <dt><ClockIcon size={16} /> {ui.time}</dt>
                    <dd className={transferTime ? "" : "is-empty"}>{transferTime || "—"}</dd>
                  </div>
                </dl>

                <div className="tf-summary-total" aria-live="polite">
                  <span className="tf-price-label">{ui.totalPrice}</span>
                  {routeLoading ? (
                    <span className="tf-skel tf-skel--price" aria-hidden="true" />
                  ) : (
                    <span key={`${quote?.priceGEL}-${selectedVehicleKey}`} className="tf-price">
                      <span className="tf-price-val">{quote?.priceGEL != null ? `~${quote.priceGEL} ₾` : "—"}</span>
                      {quote?.priceGEL != null && currency !== "GEL" && (
                        <span className="tf-price-alt">≈ {formatCurrency(quote.priceGEL, lang)}</span>
                      )}
                    </span>
                  )}
                </div>

                {/* SUBMIT BUTTON */}
                <div className="tf-submit-wrap">
                  <button type="submit" className="btn-tf-whatsapp" disabled={isSubmitting}>
                    <WhatsAppIcon />
                    <span>{t("transfersPage.submitBtn") || "დაჯავშნა WhatsApp-ზე"}</span>
                  </button>

                  {/* TRUST BADGES */}
                  <ul className="tf-trust-badges-grid">
                    {[ui.cancellation, ui.payOnArrival, ui.instantWa, ui.guaranteed].map((text) => (
                      <li key={text} className="tf-trust-badge-item">
                        <span className="tf-trust-badge-icon"><CheckIcon size={14} /></span>
                        <span className="tf-trust-badge-text">{text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </aside>
          </form>
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

      {/* Server-rendered extras from the page, e.g. the popular routes list. */}
      {children}

      <Footer />
    </div>
  );
}
