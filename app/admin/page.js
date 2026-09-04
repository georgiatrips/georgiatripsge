"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DatePicker from "../components/DatePicker";
import { GEORGIA_REGIONS } from "../lib/placesMeta";
import { listPlaces } from "../lib/placesFirestore";
import { TOUR_BADGE_OPTIONS, TOUR_SECTIONS } from "../lib/tourMeta";
import PlaceManager from "./PlaceManager";
import HotelManager from "./HotelManager";
import ReviewManager from "./ReviewManager";
import AnalyticsManager from "./AnalyticsManager";
import CouponManager from "./CouponManager";
import BookingManager from "./BookingManager";
import { subscribeToLiveSessions } from "../lib/analytics";
import { subscribeToBookings } from "../lib/bookingsFirestore";
import LocalizedInputGroup, { emptyLangObj, parseLocal } from "./LocalizedInputGroup";
import { listHotels } from "../lib/hotelsFirestore";
import { listReviews } from "../lib/reviewsFirestore";
import { useAuth } from "../lib/AuthContext";
import { useCurrency } from "../lib/currency/CurrencyContext";
import { useLanguage } from "../lib/i18n/LanguageContext";
import { adminFetch } from "../lib/apiClient";
import {
  createTour,
  listFirestoreTours,
  deleteFirestoreTour,
  updateFirestoreTour,
  groupDepartureDates,
  asLocalizedText,
  matchesMultiLang,
  firestoreErrorMessage,
  extractImageUrl,
} from "../lib/toursFirestore";

const emptyLocation = () => ({ placeId: "", search: "", title: emptyLangObj(), desc: emptyLangObj(), img: "" });

async function uploadToCloudinary(file) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await adminFetch("/api/upload", { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "ატვირთვა ვერ მოხერხდა");
  return data.url;
}

export default function AdminPage() {
  const { format } = useCurrency();
  const [title, setTitle] = useState(emptyLangObj());
  const [desc, setDesc] = useState(emptyLangObj());
  const [type, setType] = useState("oneday");
  const [durationMode, setDurationMode] = useState("days");
  const [durationDays, setDurationDays] = useState("");
  const [durationNights, setDurationNights] = useState("");
  const [durationHours, setDurationHours] = useState("");
  const [destination, setDestination] = useState(GEORGIA_REGIONS[0]);
  const [groupMin, setGroupMin] = useState("1");
  const [groupMax, setGroupMax] = useState("18");
  const [privateGroupMin, setPrivateGroupMin] = useState("1");
  const [privateGroupMax, setPrivateGroupMax] = useState("18");
  const [hasGroup, setHasGroup] = useState(true);
  const [hasPrivate, setHasPrivate] = useState(true);
  const [priceGroup, setPriceGroup] = useState("");
  const [pricePrivate, setPricePrivate] = useState("");
  const [isVip, setIsVip] = useState(false);
  const [isPopular, setIsPopular] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState(TOUR_BADGE_OPTIONS[0]);
  const [tourSection, setTourSection] = useState("");
  const [locations, setLocations] = useState([emptyLocation()]);
  const [availablePlaces, setAvailablePlaces] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [datePick, setDatePick] = useState("");
  const [departureDates, setDepartureDates] = useState([]);
  const [saving, setSaving] = useState(false);
  const [editingTourId, setEditingTourId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const { user } = useAuth() ?? {};
  const { t } = useLanguage();
  const [existingTours, setExistingTours] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const destinationLabel = destination;

  const [activeTab, setActiveTab] = useState("tours");
  const [tourSearchQuery, setTourSearchQuery] = useState("");
  const [tourRegionFilter, setTourRegionFilter] = useState("all");
  const [hotelsCount, setHotelsCount] = useState(0);
  const [placesCount, setPlacesCount] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [liveVisitorsCount, setLiveVisitorsCount] = useState(0);
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);

  useEffect(() => {
    let active = true;
    listPlaces()
      .then((items) => {
        if (active) {
          setAvailablePlaces(items);
          setPlacesCount(items.length);
        }
      })
      .catch((error) => console.error("Places ვერ ჩაიტვირთა", error));
    listHotels()
      .then((items) => {
        if (active) setHotelsCount(items.length);
      })
      .catch(() => {});
    listReviews()
      .then((items) => {
        if (active) setReviewsCount(items.length);
      })
      .catch(() => {});

    // Live Analytics real-time listener for badge
    const unsubSessions = subscribeToLiveSessions((sessions) => {
      if (!active) return;
      const now = Date.now();
      const online = sessions.filter((s) => now - (s.lastActiveMillis || 0) <= 4 * 60 * 1000).length;
      setLiveVisitorsCount(online);
    });

    // Bookings real-time listener for badge
    const unsubBookings = subscribeToBookings((items) => {
      if (!active) return;
      const pendingCount = items.filter((b) => (b.status || "pending") === "pending").length;
      setPendingBookingsCount(pendingCount);
    });

    return () => {
      active = false;
      unsubSessions();
      unsubBookings();
    };
  }, []);


  const schedulePreview = groupDepartureDates(departureDates);

  const refreshList = async () => {
    if (!user || !user.isAdmin) {
      setExistingTours([]);
      setLoadingList(false);
      return;
    }

    try {
      setLoadingList(true);
      const list = await listFirestoreTours();
      setExistingTours(list);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: firestoreErrorMessage(err) });
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (user === undefined) return;
    if (!user || !user.isAdmin) {
      setExistingTours([]);
      setLoadingList(false);
      return;
    }

    refreshList();
  }, [user]);

  const updateLocation = (idx, field, value) => {
    setLocations((prev) =>
      prev.map((loc, i) => (i === idx ? { ...loc, [field]: value } : loc))
    );
  };

  const addLocation = () => setLocations((prev) => [...prev, emptyLocation()]);

  const selectPlaceForLocation = (idx, place) => {
    const placeTitle = asLocalizedText(place.title, "ka") || "ადგილი";
    const mainImg = place.img || place.gallery?.[0] || "";

    setLocations((prev) =>
      prev.map((loc, i) =>
        i === idx
          ? {
              ...loc,
              placeId: place.id,
              search: placeTitle,
              title: parseLocal(place.title),
              desc: parseLocal(place.desc),
              img: mainImg,
            }
          : loc
      )
    );

    // Extract all photos of this location (place.img and place.gallery) without re-uploading to Cloudinary
    const placePhotos = [];
    if (place.img && typeof place.img === "string" && place.img.trim()) {
      placePhotos.push(place.img.trim());
    }
    if (Array.isArray(place.gallery)) {
      place.gallery.forEach((g) => {
        const u = typeof g === "string" ? g.trim() : g?.url?.trim();
        if (u && !placePhotos.includes(u)) {
          placePhotos.push(u);
        }
      });
    }

    if (placePhotos.length > 0) {
      setGallery((prev) => {
        const existingUrls = new Set(
          prev.map((item) => (typeof item === "string" ? item : item?.url))
        );
        const toAdd = [];
        for (const pUrl of placePhotos) {
          if (!existingUrls.has(pUrl)) {
            toAdd.push({
              url: pUrl,
              locationTitle: placeTitle,
              placeId: place.id,
            });
            existingUrls.add(pUrl);
          }
        }
        return [...prev, ...toAdd];
      });
    }
  };

  const removeLocation = (idx) => {
    setLocations((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  };

  const handleLocationPhoto = async (idx, file) => {
    if (!file) return;
    try {
      setUploading(true);
      const url = await uploadToCloudinary(file);
      updateLocation(idx, "img", url);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      setUploading(true);
      const newItems = [];
      for (const file of files) {
        const url = await uploadToCloudinary(file);
        newItems.push({
          url,
          locationTitle: "დამატებითი ფოტო",
          placeId: "",
        });
      }
      setGallery((prev) => [...prev, ...newItems]);
      setMessage({ type: "success", text: `${newItems.length} ფოტო წარმატებით აიტვირთა!` });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeGalleryImage = (idx) => {
    setGallery((prev) => prev.filter((_, i) => i !== idx));
  };

  const setCoverImage = (idx) => {
    if (idx === 0) return;
    setGallery((prev) => {
      const item = prev[idx];
      const rest = prev.filter((_, i) => i !== idx);
      return [item, ...rest];
    });
    setMessage({ type: "success", text: "მთავარი ფოტო არჩეულია!" });
  };

  const moveGalleryImage = (idx, direction) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= gallery.length) return;
    setGallery((prev) => {
      const updated = [...prev];
      const temp = updated[idx];
      updated[idx] = updated[targetIdx];
      updated[targetIdx] = temp;
      return updated;
    });
  };

  const addDepartureDate = () => {
    if (!datePick) return;
    if (departureDates.some((d) => d.date === datePick)) {
      setMessage({ type: "error", text: "ეს თარიღი უკვე დამატებულია" });
      return;
    }
    const maxSeats = Math.max(1, parseInt(groupMax, 10) || 18);
    setDepartureDates((prev) =>
      [...prev, { date: datePick, freeSeats: maxSeats }].sort((a, b) =>
        a.date.localeCompare(b.date)
      )
    );
    setDatePick("");
    setMessage(null);
  };

  const updateFreeSeats = (date, seats) => {
    setDepartureDates((prev) =>
      prev.map((d) => (d.date === date ? { ...d, freeSeats: seats } : d))
    );
  };

  const removeDepartureDate = (date) => {
    setDepartureDates((prev) => prev.filter((d) => d.date !== date));
  };

  const resetForm = () => {
    setTitle(emptyLangObj());
    setDesc(emptyLangObj());
    setType("oneday");
    setDurationMode("days");
    setDurationDays("");
    setDurationNights("");
    setDurationHours("");
    setDestination(GEORGIA_REGIONS[0]);
    setGroupMin("1");
    setGroupMax("18");
    setPrivateGroupMin("1");
    setPrivateGroupMax("18");
    setHasGroup(true);
    setHasPrivate(true);
    setPriceGroup("");
    setPricePrivate("");
    setIsVip(false);
    setIsPopular(false);
    setIsPopular(false);
    setSelectedBadge(TOUR_BADGE_OPTIONS[0]);
    setTourSection("");
    setLocations([emptyLocation()]);
    setGallery([]);
    setDatePick("");
    setDepartureDates([]);
    setEditingTourId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!title.ka.trim() || !desc.ka.trim()) {
      setMessage({ type: "error", text: "ტურის სახელი და აღწერა სავალდებულოა" });
      return;
    }
    if (!hasGroup && !hasPrivate) {
      setMessage({ type: "error", text: "აირჩიეთ ჯგუფური და/ან ინდივიდუალური ტური" });
      return;
    }
    if (hasGroup && !priceGroup) {
      setMessage({ type: "error", text: "შეიყვანეთ ჯგუფური ფასი" });
      return;
    }
    if (hasPrivate && !pricePrivate) {
      setMessage({ type: "error", text: "შეიყვანეთ ინდივიდუალური ფასი" });
      return;
    }
    if (hasGroup && departureDates.length === 0) {
      setMessage({ type: "error", text: "ჯგუფური ტურისთვის დაამატეთ გამგზავრების თარიღები" });
      return;
    }

    const itinerary = locations
      .filter((l) => l.title.ka?.trim())
      .map((l) => ({
        placeId: l.placeId || "",
        title: {
          ka: l.title.ka?.trim() || "",
          en: l.title.en?.trim() || "",
          ru: l.title.ru?.trim() || "",
          tr: l.title.tr?.trim() || "",
          ar: l.title.ar?.trim() || "",
        },
        desc: {
          ka: l.desc.ka?.trim() || "",
          en: l.desc.en?.trim() || "",
          ru: l.desc.ru?.trim() || "",
          tr: l.desc.tr?.trim() || "",
          ar: l.desc.ar?.trim() || "",
        },
        img: l.img || "",
      }));

    if (itinerary.length === 0 || itinerary.some((location) => !location.placeId)) {
      setMessage({ type: "error", text: "აირჩიეთ მარშრუტის ყველა ლოკაცია Places-დან" });
      return;
    }
    if (!selectedBadge) {
      setMessage({ type: "error", text: "აირჩიეთ badge ტურისთვის" });
      return;
    }
    const sectionLabel =
      TOUR_SECTIONS.find((s) => s.value === tourSection)?.label || "";

    const minN = Math.max(1, parseInt(groupMin, 10) || 1);
    const maxN = Math.max(minN, parseInt(groupMax, 10) || minN);
    const privateMinN = Math.max(1, parseInt(privateGroupMin, 10) || 1);
    const privateMaxN = Math.max(privateMinN, parseInt(privateGroupMax, 10) || privateMinN);
    const durationValue = durationMode === "hours"
      ? `${Math.max(1, parseInt(durationHours, 10) || 1)} საათი`
      : `${Math.max(1, parseInt(durationDays, 10) || 1)} დღე / ${Math.max(0, parseInt(durationNights, 10) || 0)} ღამე`;

    const cleanedGallery = gallery
      .map((item) => {
        const url = extractImageUrl(item);
        if (typeof item === "string" && url) return { url, locationTitle: "", placeId: "" };
        if (item && typeof item === "object" && url) {
          return {
            url,
            locationTitle: item.locationTitle || "",
            placeId: item.placeId || "",
          };
        }
        return null;
      })
      .filter((i) => i?.url);

    const payload = {
      title,
      desc,
      itinerary: locations
        .filter((l) => l.title?.ka || l.title?.en || l.placeId)
        .map((l) => ({
          placeId: l.placeId || "",
          title: l.title,
          desc: l.desc,
          img: l.img || "",
        })),
      departure: {
        ka: destinationLabel,
        en: destinationLabel,
        ru: destinationLabel,
        tr: destinationLabel,
        ar: destinationLabel,
      },
      type,
      duration: durationValue,
      destination,
      destinationLabel,
      groupMin: minN,
      groupMax: maxN,
      privateGroupMin: privateMinN,
      privateGroupMax: privateMaxN,
      hasGroup,
      hasPrivate,
      priceGroup: hasGroup ? Number(priceGroup) : null,
      pricePrivate: hasPrivate ? Number(pricePrivate) : null,
      isVip,
      isPopular,
      itinerary,
      // Store a URL, never the gallery object itself. Older records can contain
      // gallery metadata objects, while next/image requires a string source.
      gallery: cleanedGallery,
      img: cleanedGallery[0]?.url || extractImageUrl(itinerary[0]?.img) || "/hero.png",
      departureDates: hasGroup
        ? departureDates.map((d) => ({
            date: d.date,
            freeSeats: Math.max(0, Number(d.freeSeats) || 0),
          }))
        : [],
      badge: selectedBadge,
      tourSection,
      tourSectionLabel: sectionLabel,
      category: tourSection,
    };

    try {
      setSaving(true);
      const created = editingTourId ? null : await createTour(payload);
      if (editingTourId) await updateFirestoreTour(editingTourId, payload);
      setMessage({ type: "success", text: editingTourId ? "ტური განახლებულია!" : `ტური შენახულია! ID: ${created.id}` });
      resetForm();
      await refreshList();
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: firestoreErrorMessage(err),
      });
    } finally {
      setSaving(false);
    }
  };

  const startTourEdit = (tour) => {
    setEditingTourId(tour.id);
    setTitle(parseLocal(tour.title));
    setDesc(parseLocal(tour.desc));
    setType(tour.type || "oneday");
    const savedDuration = asLocalizedText(tour.duration);
    const durationNumbers = savedDuration.match(/\d+(?:[.,]\d+)?/g) || [];
    const isHours = savedDuration.includes("საათი");
    setDurationMode(isHours ? "hours" : "days");
    if (isHours) {
      setDurationHours(durationNumbers[0] || "");
      setDurationDays("");
      setDurationNights("");
    } else {
      setDurationDays(durationNumbers[0] || "");
      setDurationNights(durationNumbers[1] || "0");
      setDurationHours("");
    }
    setDestination(GEORGIA_REGIONS.includes(asLocalizedText(tour.destination)) ? asLocalizedText(tour.destination) : GEORGIA_REGIONS[0]);
    setGroupMin(String(tour.groupMin || 1)); setGroupMax(String(tour.groupMax || 18));
    setPrivateGroupMin(String(tour.privateGroupMin || tour.groupMin || 1));
    setPrivateGroupMax(String(tour.privateGroupMax || tour.groupMax || 18));
    setHasGroup(!!tour.hasGroup); setHasPrivate(!!tour.hasPrivate);
    setPriceGroup(tour.priceGroup ?? ""); setPricePrivate(tour.pricePrivate ?? "");
    setIsVip(!!tour.isVip); setIsPopular(!!tour.isPopular); setSelectedBadge(asLocalizedText(tour.badge) || TOUR_BADGE_OPTIONS[0]);
    setTourSection(tour.tourSection || tour.category || "");
    setLocations(Array.isArray(tour.itinerary) && tour.itinerary.length ? tour.itinerary.map((location) => ({ 
      ...location, 
      placeId: location.placeId || "", 
      search: asLocalizedText(location.title, "ka") || "",
      title: parseLocal(location.title),
      desc: parseLocal(location.desc)
    })) : [emptyLocation()]);
    setGallery(
      (Array.isArray(tour.gallery) ? tour.gallery : [])
        .map((item) => {
          const url = extractImageUrl(item);
          if (typeof item === "string" && url) return { url, locationTitle: "", placeId: "" };
          if (item && typeof item === "object" && url) {
            return {
              url,
              locationTitle: typeof item.locationTitle === "string" ? item.locationTitle : asLocalizedText(item.locationTitle, "ka") || "",
              placeId: item.placeId || "",
            };
          }
          return null;
        })
        .filter(Boolean)
    );
    setDepartureDates(Array.isArray(tour.departureDates) ? tour.departureDates : []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!confirm("წავშალოთ ეს ტური?")) return;
    try {
      await deleteFirestoreTour(id);
      await refreshList();
    } catch (err) {
      setMessage({ type: "error", text: firestoreErrorMessage(err) });
    }
  };

  if (user === undefined) {
    return (
      <div className="admin-page">
        <Navbar active="admin" />
        <section className="admin-section">
          <div className="container admin-layout">
            <div className="admin-loading-state">
              <h2>სისტემასთან დაკავშირება...</h2>
              <p>დაიცადეთ, ვამოწმებთ თქვენს ანგარიშს.</p>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="admin-page">
        <Navbar active="admin" />
        <section className="admin-section">
          <div className="container admin-layout">
            <div className="admin-login-prompt">
              <h2>თქვენ ჯერ არ ხართ შესული</h2>
              <p>
                ეს გვერდი ხელმისაწვდომია მხოლოდ ავტორიზებული მომხმარებლებისთვის. შესვლა შეგიძლიათ ქვემოთ.
              </p>
              <Link href="/login" className="admin-btn-primary">
                შესვლა
              </Link>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div className="admin-page">
        <Navbar active="admin" />
        <section className="admin-section">
          <div className="container admin-layout">
            <div className="admin-login-prompt">
              <h2>წვდომა შეზღუდულია</h2>
              <p>
                ადმინ პანელზე წვდომა დაშვებულია მხოლოდ ადმინისტრატორის ანგარიშისთვის.
              </p>
              <Link href="/" className="admin-btn-primary" style={{ marginTop: "1rem" }}>
                მთავარ გვერდზე დაბრუნება
              </Link>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <Navbar active="admin" />

      <section className="admin-hero">
        <div className="admin-hero-bg">
          <Image
            src="/hero.png"
            alt=""
            fill
            priority
            style={{ objectFit: "cover" }}
            sizes="100vw"
          />
        </div>
        <div className="admin-hero-scrim" />
        <div className="admin-hero-content">
          <span className="admin-hero-eyebrow">მართვის პანელი</span>
          <h1 className="admin-hero-title">ადმინ პანელი</h1>
          <p className="admin-hero-sub">მართეთ ტურები, სასტუმროები, ადგილები და მიმოხილვები მარტივად</p>
        </div>
      </section>

      <section className="admin-section">
        <div className="container">
          {/* CATEGORY TABS SWITCHER */}
          <div className="admin-tabs-container">
            <button
              type="button"
              className={`admin-nav-tab ${activeTab === "tours" ? "is-active" : ""}`}
              onClick={() => setActiveTab("tours")}
            >
              <span style={{ fontSize: "1.2rem" }}>🏔️</span>
              <span>ტურები</span>
              <span className="admin-tab-count">{existingTours.length}</span>
            </button>
            <button
              type="button"
              className={`admin-nav-tab ${activeTab === "hotels" ? "is-active" : ""}`}
              onClick={() => setActiveTab("hotels")}
            >
              <span style={{ fontSize: "1.2rem" }}>🏨</span>
              <span>სასტუმროები</span>
              <span className="admin-tab-count">{hotelsCount}</span>
            </button>
            <button
              type="button"
              className={`admin-nav-tab ${activeTab === "places" ? "is-active" : ""}`}
              onClick={() => setActiveTab("places")}
            >
              <span style={{ fontSize: "1.2rem" }}>📍</span>
              <span>ადგილები</span>
              <span className="admin-tab-count">{placesCount}</span>
            </button>
            <button
              type="button"
              className={`admin-nav-tab ${activeTab === "reviews" ? "is-active" : ""}`}
              onClick={() => setActiveTab("reviews")}
            >
              <span style={{ fontSize: "1.2rem" }}>⭐</span>
              <span>მიმოხილვები</span>
              <span className="admin-tab-count">{reviewsCount}</span>
            </button>
            <button
              type="button"
              className={`admin-nav-tab admin-nav-tab-analytics ${activeTab === "analytics" ? "is-active" : ""}`}
              onClick={() => setActiveTab("analytics")}
            >
              <span style={{ fontSize: "1.2rem" }}>📊</span>
              <span>Live ანალიტიკა</span>
              <span className="admin-tab-count live-pill">
                <span className="admin-live-dot" />
                {liveVisitorsCount}
              </span>
            </button>
            <button
              type="button"
              className={`admin-nav-tab ${activeTab === "coupons" ? "is-active" : ""}`}
              onClick={() => setActiveTab("coupons")}
            >
              <span style={{ fontSize: "1.2rem" }}>🎟️</span>
              <span>კუპონები & IP</span>
              <span className="admin-tab-count" style={{ background: "#fab418", color: "#0f172a", fontWeight: 800 }}>10%</span>
            </button>
            <button
              type="button"
              className={`admin-nav-tab ${activeTab === "bookings" ? "is-active" : ""}`}
              onClick={() => setActiveTab("bookings")}
            >
              <span style={{ fontSize: "1.2rem" }}>📋</span>
              <span>ჯავშნები</span>
              {pendingBookingsCount > 0 ? (
                <span className="admin-tab-count" style={{ background: "#eab308", color: "#0f172a", fontWeight: 800 }}>
                  {pendingBookingsCount}
                </span>
              ) : (
                <span className="admin-tab-count">0</span>
              )}
            </button>
          </div>

          {/* DASHBOARD STATS ROW */}
          <div className="admin-stats-row">
            <div
              className={`admin-stat-card ${activeTab === "bookings" ? "is-active" : ""}`}
              onClick={() => setActiveTab("bookings")}
            >
              <div className="admin-stat-icon">📋</div>
              <div className="admin-stat-info">
                <strong style={{ color: pendingBookingsCount > 0 ? "#eab308" : "#0d9488" }}>
                  {pendingBookingsCount > 0 ? `⏳ ${pendingBookingsCount} ახალი` : "ჯავშნები"}
                </strong>
                <span>ჯავშნების მართვა</span>
              </div>
            </div>
            <div
              className={`admin-stat-card ${activeTab === "tours" ? "is-active" : ""}`}
              onClick={() => setActiveTab("tours")}
            >
              <div className="admin-stat-icon">🏔️</div>
              <div className="admin-stat-info">
                <strong>{existingTours.length}</strong>
                <span>ტურები კატალოგში</span>
              </div>
            </div>
            <div
              className={`admin-stat-card ${activeTab === "hotels" ? "is-active" : ""}`}
              onClick={() => setActiveTab("hotels")}
            >
              <div className="admin-stat-icon">🏨</div>
              <div className="admin-stat-info">
                <strong>{hotelsCount}</strong>
                <span>სასტუმროები</span>
              </div>
            </div>
            <div
              className={`admin-stat-card ${activeTab === "places" ? "is-active" : ""}`}
              onClick={() => setActiveTab("places")}
            >
              <div className="admin-stat-icon">📍</div>
              <div className="admin-stat-info">
                <strong>{placesCount}</strong>
                <span>ტურისტული ადგილები</span>
              </div>
            </div>
            <div
              className={`admin-stat-card ${activeTab === "reviews" ? "is-active" : ""}`}
              onClick={() => setActiveTab("reviews")}
            >
              <div className="admin-stat-icon">⭐</div>
              <div className="admin-stat-info">
                <strong>{reviewsCount}</strong>
                <span>მიმოხილვები</span>
              </div>
            </div>
            <div
              className={`admin-stat-card ${activeTab === "analytics" ? "is-active" : ""}`}
              onClick={() => setActiveTab("analytics")}
            >
              <div className="admin-stat-icon">📊</div>
              <div className="admin-stat-info">
                <strong style={{ color: "#25d366" }}>
                  🟢 {liveVisitorsCount} Online
                </strong>
                <span>Live ანალიტიკა</span>
              </div>
            </div>
            <div
              className={`admin-stat-card ${activeTab === "coupons" ? "is-active" : ""}`}
              onClick={() => setActiveTab("coupons")}
            >
              <div className="admin-stat-icon">🎟️</div>
              <div className="admin-stat-info">
                <strong style={{ color: "var(--teal)" }}>10% OFF</strong>
                <span>კუპონის მართვა & IP</span>
              </div>
            </div>
          </div>

          {/* TAB 1: TOURS MANAGEMENT */}
          {activeTab === "tours" && (
            <div className="admin-layout">
              <form className="admin-form" onSubmit={handleSubmit}>
                <header className="admin-form-header">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2>{editingTourId ? "🏔️ ტურის რედაქტირება" : "🏔️ ახალი ტურის დამატება"}</h2>
                    {editingTourId && (
                      <span className="admin-tag-pill" style={{ background: "rgba(41,178,183,0.2)", color: "#29b2b7" }}>
                        რედაქტირების რეჟიმი
                      </span>
                    )}
                  </div>
                  <p>შეავსეთ ველები და შეინახეთ. ფოტოები ინახება Cloudinary-ში.</p>
                </header>

            {message && (
              <div className={`admin-alert ${message.type}`} role="status">
                {message.text}
              </div>
            )}

            {/* Basic info */}
            <fieldset className="admin-fieldset">
              <legend>ძირითადი ინფორმაცია</legend>
              <LocalizedInputGroup
                label="ტურის სახელი"
                value={title}
                onChange={setTitle}
                placeholder="მაგ: პრომეთეს მღვიმე & მარტვილის კანიონი"
                required
              />
              <LocalizedInputGroup
                label="ექსკურსიის შესახებ"
                type="textarea"
                value={desc}
                onChange={setDesc}
                placeholder="მოკლე აღწერა ტურის შესახებ..."
                required
              />
              <div className="admin-grid-2">
                <div className="admin-field">
                  <label>ტიპი</label>
                  <div className="admin-segment">
                    <button
                      type="button"
                      className={type === "oneday" ? "is-active" : ""}
                      onClick={() => setType("oneday")}
                    >
                      ერთდღიანი
                    </button>
                    <button
                      type="button"
                      className={type === "multiday" ? "is-active" : ""}
                      onClick={() => setType("multiday")}
                    >
                      მრავალდღიანი
                    </button>
                  </div>
                </div>
                <div className="admin-field">
                  <label htmlFor="tour-duration">ხანგრძლივობა</label>
                  <div className="admin-duration-mode admin-segment">
                    <button type="button" className={durationMode === "days" ? "is-active" : ""} onClick={() => setDurationMode("days")}>დღე / ღამე</button>
                    <button type="button" className={durationMode === "hours" ? "is-active" : ""} onClick={() => setDurationMode("hours")}>საათი</button>
                  </div>
                  {durationMode === "hours" ? (
                    <input id="tour-duration-hours" type="number" min="1" value={durationHours} onChange={(e) => setDurationHours(e.target.value)} placeholder="მაგ: 12" required />
                  ) : (
                    <div className="admin-inline-inputs">
                      <input id="tour-duration-days" type="number" min="1" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} placeholder="დღე" required />
                      <span>/</span>
                      <input id="tour-duration-nights" type="number" min="0" value={durationNights} onChange={(e) => setDurationNights(e.target.value)} placeholder="ღამე" required />
                    </div>
                  )}                </div>
              </div>
              <div className="admin-grid-2">
                <div className="admin-field">
                  <label htmlFor="tour-dest">მიმართულება</label>
                  <select
                    id="tour-dest"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  >
                    {GEORGIA_REGIONS.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="admin-field">
                  <label>ჯგუფის ზომა (მინ / მაქს)</label>
                  <div className="admin-inline-inputs">
                    <input
                      type="number"
                      min="1"
                      value={groupMin}
                      onChange={(e) => setGroupMin(e.target.value)}
                      aria-label="მინიმუმი"
                    />
                    <span>—</span>
                    <input
                      type="number"
                      min="1"
                      value={groupMax}
                      onChange={(e) => setGroupMax(e.target.value)}
                      aria-label="მაქსიმუმი"
                    />
                  </div>
                </div>
              </div>

              <div className="admin-field">
                <label>ინდივიდუალური ტურის ჯგუფის ზომა (მინ / მაქს)</label>
                <div className="admin-inline-inputs">
                  <input type="number" min="1" value={privateGroupMin} onChange={(e) => setPrivateGroupMin(e.target.value)} aria-label="ინდივიდუალური მინიმუმი" />
                  <span>—</span>
                  <input type="number" min="1" value={privateGroupMax} onChange={(e) => setPrivateGroupMax(e.target.value)} aria-label="ინდივიდუალური მაქსიმუმი" />
                </div>
              </div>
              <label className="admin-check">
                <input
                  type="checkbox"
                  checked={isVip}
                  onChange={(e) => {
                    setIsVip(e.target.checked);
                    if (e.target.checked) setSelectedBadge("პრემიუმ ტური");
                  }}
                />
                <span>VIP ტური</span>
              </label>
            </fieldset>

            <fieldset className="admin-fieldset">
              <legend>Badge (ბარათზე და ტურის გვერდზე)</legend>
              <p className="admin-hint">აირჩიეთ ერთ-ერთი მზა badge — გამოჩნდება ტურის hero-ში და ბარათებზე.</p>
              <div className="admin-badge-grid">
                {TOUR_BADGE_OPTIONS.map((label) => (
                  <button
                    key={label}
                    type="button"
                    className={`admin-pick-chip${selectedBadge === label ? " is-active" : ""}`}
                    onClick={() => setSelectedBadge(label)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="admin-fieldset">
              <legend>ტურის კატეგორია</legend>
              <label className="admin-check admin-popular-tour-check">
                <input type="checkbox" checked={isPopular} onChange={(e) => setIsPopular(e.target.checked)} />
                <span>პოპულარული ტური — გამოჩნდეს მთავარ გვერდზე</span>
              </label>
              <p className="admin-hint">სად უნდა გამოჩნდეს ტური — აირჩიეთ შესაბამისი სექცია.</p>
              <div className="admin-section-grid">
                <button
                  type="button"
                  className={`admin-section-card${!tourSection ? " is-active" : ""}`}
                  onClick={() => setTourSection("")}
                >
                  კატეგორიის გარეშე
                </button>
                {TOUR_SECTIONS.map((sec) => (
                  <button
                    key={sec.value}
                    type="button"
                    className={`admin-section-card${tourSection === sec.value ? " is-active" : ""}`}
                    onClick={() => setTourSection(sec.value)}
                  >
                    {sec.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Pricing */}
            <fieldset className="admin-fieldset">
              <legend>ფასები</legend>
              <p className="admin-hint">შეგიძლიათ ჩართოთ მხოლოდ ერთი ტიპი — მაგ. მხოლოდ ჯგუფური.</p>
              <div className="admin-price-row">
                <label className="admin-check">
                  <input
                    type="checkbox"
                    checked={hasGroup}
                    onChange={(e) => setHasGroup(e.target.checked)}
                  />
                  <span>ჯგუფური ტური</span>
                </label>
                {hasGroup && (
                  <div className="admin-field admin-field-inline">
                    <label htmlFor="price-group">ფასი ჯგუფური (₾ / კაცი)</label>
                    <input
                      id="price-group"
                      type="number"
                      min="0"
                      value={priceGroup}
                      onChange={(e) => setPriceGroup(e.target.value)}
                      placeholder="100"
                    />
                    {Number(priceGroup) > 0 && (
                      <div style={{ fontSize: "0.85rem", color: "#38bdf8", marginTop: 4, display: "flex", gap: "10px", fontWeight: 500 }}>
                        <span>⇄ <strong>${Math.round(priceGroup * 0.37)}</strong> USD</span>
                        <span><strong>€{Math.round(priceGroup * 0.34)}</strong> EUR</span>
                        <span><strong>{Math.round(priceGroup * 1.36)}</strong> AED</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="admin-price-row">
                <label className="admin-check">
                  <input
                    type="checkbox"
                    checked={hasPrivate}
                    onChange={(e) => setHasPrivate(e.target.checked)}
                  />
                  <span>ინდივიდუალური ტური</span>
                </label>
                {hasPrivate && (
                  <div className="admin-field admin-field-inline">
                    <label htmlFor="price-private">ფასი ინდივიდუალური (₾)</label>
                    <input
                      id="price-private"
                      type="number"
                      min="0"
                      value={pricePrivate}
                      onChange={(e) => setPricePrivate(e.target.value)}
                      placeholder="500"
                    />
                    {Number(pricePrivate) > 0 && (
                      <div style={{ fontSize: "0.85rem", color: "#38bdf8", marginTop: 4, display: "flex", gap: "10px", fontWeight: 500 }}>
                        <span>⇄ <strong>${Math.round(pricePrivate * 0.37)}</strong> USD</span>
                        <span><strong>€{Math.round(pricePrivate * 0.34)}</strong> EUR</span>
                        <span><strong>{Math.round(pricePrivate * 1.36)}</strong> AED</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </fieldset>

            {/* Route */}
            <fieldset className="admin-fieldset">
              <legend>მარშრუტი & სანახავი ადგილები</legend>
              <p className="admin-hint">
                მიიტანეთ კურსორი წერტილზე დეტალებისა და ფოტოს სანახავად — აქ დაამატეთ ლოკაციები.
              </p>
              {locations.map((loc, idx) => (
                <div key={idx} className="admin-location-card">
                  <div className="admin-location-head">
                    <strong>ლოკაცია #{idx + 1}</strong>
                    {locations.length > 1 && (
                      <button
                        type="button"
                        className="admin-btn-ghost"
                        onClick={() => removeLocation(idx)}
                      >
                        წაშლა
                      </button>
                    )}
                  </div>
                  <div className="admin-field admin-place-search-field">
                    <label>ადგილის მოძებნა</label>
                    <input
                      value={loc.search || ""}
                      onChange={(e) => updateLocation(idx, "search", e.target.value)}
                      placeholder="მოძებნეთ დამატებული ადგილი..."
                    />
                    {loc.search && !loc.placeId && (
                      <div className="admin-place-search-results">
                        {availablePlaces
                          .filter((place) => matchesMultiLang(place.title, loc.search) || matchesMultiLang(place.region, loc.search))
                          .slice(0, 6)
                          .map((place) => (
                            <button type="button" key={place.id} className="admin-place-search-result" onClick={() => selectPlaceForLocation(idx, place)}>
                              <span className="admin-place-result-thumb">
                                <Image src={extractImageUrl(place.img) || extractImageUrl(place.gallery?.[0]) || "/hero.png"} alt="" fill sizes="42px" style={{ objectFit: "cover" }} />
                              </span>
                              <span><strong>{asLocalizedText(place.title, "ka")}</strong><small>{asLocalizedText(place.region, "ka")}</small></span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                  {loc.placeId ? (
                    <div
                      className="admin-location-selected-card"
                      style={{
                        marginTop: "0.75rem",
                        padding: "0.75rem 1rem",
                        borderRadius: "10px",
                        background: "rgba(41, 178, 183, 0.08)",
                        border: "1px solid rgba(41, 178, 183, 0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "1rem"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", minWidth: 0 }}>
                        <div style={{ position: "relative", width: "52px", height: "52px", borderRadius: "8px", overflow: "hidden", flexShrink: 0, border: "1px solid rgba(255,255,255,0.2)" }}>
                          <Image src={extractImageUrl(loc.img) || "/hero.png"} alt="" fill sizes="52px" style={{ objectFit: "cover" }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                            <strong style={{ fontSize: "0.95rem", color: "#ffffff" }}>
                              {asLocalizedText(loc.title, "ka") || "დამატებული ადგილი"}
                            </strong>
                            <span style={{ fontSize: "0.72rem", background: "rgba(16, 185, 129, 0.25)", color: "#34d399", padding: "1px 6px", borderRadius: "4px", fontWeight: 600 }}>
                              ✓ მრავალენოვანი
                            </span>
                          </div>
                          <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "rgba(255,255,255,0.65)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "420px" }}>
                            {asLocalizedText(loc.desc, "ka") || "აღწერა შენახულია ბაზაში"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          updateLocation(idx, "placeId", "");
                          updateLocation(idx, "search", "");
                        }}
                        style={{
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          color: "#ffffff",
                          padding: "5px 12px",
                          borderRadius: "6px",
                          fontSize: "0.78rem",
                          cursor: "pointer",
                          flexShrink: 0
                        }}
                      >
                        შეცვლა
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
              <button type="button" className="admin-btn-add" onClick={addLocation}>
                + შემდეგი ლოკაცია
              </button>
            </fieldset>

            {/* Gallery */}
            <fieldset className="admin-fieldset">
              <legend>📸 ფოტოგალერეა (Cloudinary & ლოკაციების ფოტოები)</legend>
              <p className="admin-hint" style={{ marginBottom: "1rem" }}>
                💡 ლოკაციის არჩევისას მისი ყველა ფოტო ავტომატურად გადმოყვება აქ (ხელახლა ატვირთვის გარეშე). ასევე შეგიძლიათ დაამატოთ ნებისმიერი სხვა ფოტო.
              </p>
              
              <div className="admin-gallery-controls" style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap" }}>
                <label
                  htmlFor="gallery-upload"
                  className="admin-btn-add"
                  style={{
                    margin: 0,
                    cursor: uploading ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "rgba(41, 178, 183, 0.2)",
                    border: "1px solid rgba(41, 178, 183, 0.4)",
                    color: "#fff",
                    padding: "0.55rem 1.1rem",
                    borderRadius: "8px",
                    fontWeight: 600
                  }}
                >
                  <span>+ დამატებითი ფოტოების ატვირთვა</span>
                  <input
                    id="gallery-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryUpload}
                    disabled={uploading}
                    style={{ display: "none" }}
                  />
                </label>
                {uploading && <span className="admin-hint" style={{ margin: 0, color: "#fab418" }}>⏳ იტვირთება Cloudinary-ზე...</span>}
                {gallery.length > 0 && <span className="admin-hint" style={{ margin: 0 }}>სულ: {gallery.length} ფოტო</span>}
              </div>

              {gallery.length > 0 ? (
                <div
                  className="admin-gallery-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                    gap: "1rem",
                    marginTop: "0.5rem"
                  }}
                >
                  {gallery
                    .filter((item) => {
                      const u = typeof item === "string" ? item : item?.url;
                      return Boolean(u && u.trim());
                    })
                    .map((item, idx) => {
                      const url = (typeof item === "string" ? item : item?.url) || "/hero.png";
                      const locTitle = typeof item === "string" ? "" : item?.locationTitle;
                      const isCover = idx === 0;

                      return (
                        <div
                          key={`${url}-${idx}`}
                          className="admin-gallery-item"
                          style={{
                            position: "relative",
                            aspectRatio: "1",
                            borderRadius: "12px",
                            overflow: "hidden",
                            border: isCover ? "2.5px solid #fab418" : "1px solid rgba(255, 255, 255, 0.15)",
                            boxShadow: isCover ? "0 0 16px rgba(250, 180, 24, 0.45)" : "none",
                            background: "rgba(13, 35, 58, 0.5)",
                            display: "flex",
                            flexDirection: "column"
                          }}
                        >
                          <Image src={url} alt="" fill sizes="180px" style={{ objectFit: "cover" }} />
                        
                        {/* Top Location Badge */}
                        <div
                          style={{
                            position: "absolute",
                            top: "6px",
                            left: "6px",
                            right: "32px",
                            zIndex: 2,
                            pointerEvents: "none"
                          }}
                        >
                          <span
                            title={locTitle || "ტურის ფოტო"}
                            style={{
                              display: "inline-block",
                              maxWidth: "100%",
                              whiteSpace: "nowrap",
                              textOverflow: "ellipsis",
                              overflow: "hidden",
                              background: locTitle && locTitle !== "დამატებითი ფოტო"
                                ? "rgba(41, 178, 183, 0.9)"
                                : "rgba(0, 0, 0, 0.65)",
                              color: "#ffffff",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: "4px",
                              backdropFilter: "blur(4px)"
                            }}
                          >
                            {locTitle ? (locTitle === "დამატებითი ფოტო" ? "✨ დამატებითი" : `📍 ${locTitle}`) : "✨ ტურის ფოტო"}
                          </span>
                        </div>

                        {/* Remove button */}
                        <button
                          type="button"
                          className="admin-gallery-remove"
                          onClick={() => removeGalleryImage(idx)}
                          aria-label="წაშლა"
                          style={{
                            position: "absolute",
                            top: "5px",
                            right: "5px",
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            background: "rgba(220, 38, 38, 0.9)",
                            color: "#ffffff",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "14px",
                            fontWeight: "bold",
                            zIndex: 3
                          }}
                        >
                          ×
                        </button>

                        {/* Bottom Actions Bar (Cover & Reorder) */}
                        <div
                          style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: "6px 8px",
                            background: "linear-gradient(to top, rgba(13,35,58,0.95), rgba(13,35,58,0.4))",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "4px",
                            zIndex: 2
                          }}
                        >
                          {isCover ? (
                            <span
                              style={{
                                fontSize: "0.72rem",
                                fontWeight: 800,
                                color: "#fab418",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "3px"
                              }}
                            >
                              ⭐ მთავარი
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setCoverImage(idx)}
                              style={{
                                background: "rgba(250, 180, 24, 0.2)",
                                border: "1px solid rgba(250, 180, 24, 0.6)",
                                color: "#fab418",
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                padding: "2px 6px",
                                borderRadius: "4px",
                                cursor: "pointer"
                              }}
                              title="დააყენეთ მთავარ ფოტოდ (გამოჩნდება ბარათებზე და მთავარ გვერდზე)"
                            >
                              ⭐ მთავარად
                            </button>
                          )}

                          {/* Reorder arrows */}
                          <div style={{ display: "flex", gap: "3px" }}>
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => moveGalleryImage(idx, -1)}
                                title="გადატანა მარცხნივ"
                                style={{
                                  background: "rgba(255,255,255,0.15)",
                                  border: "none",
                                  color: "#fff",
                                  width: "20px",
                                  height: "20px",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center"
                                }}
                              >
                                ◀
                              </button>
                            )}
                            {idx < gallery.length - 1 && (
                              <button
                                type="button"
                                onClick={() => moveGalleryImage(idx, 1)}
                                title="გადატანა მარჯვნივ"
                                style={{
                                  background: "rgba(255,255,255,0.15)",
                                  border: "none",
                                  color: "#fff",
                                  width: "20px",
                                  height: "20px",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center"
                                }}
                              >
                                ▶
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="admin-hint" style={{ textAlign: "center", padding: "1.5rem", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: "10px" }}>
                  გალერეაში ფოტოები ჯერ არ არის. აირჩიეთ ლოკაცია ზემოთ ან დააჭირეთ „+ დამატებითი ფოტოების ატვირთვა“-ს.
                </p>
              )}
            </fieldset>

            {/* Group departure dates */}
            {hasGroup && (
              <fieldset className="admin-fieldset">
                <legend>გამგზავრების თარიღები (ჯგუფური)</legend>
                <p className="admin-hint">
                  მხოლოდ ჯგუფური ტურისთვის. აირჩიეთ თარიღი და დააჭირეთ დამატებას, შემდეგ მიუთითეთ თავისუფალი ადგილები.
                </p>
                <div className="admin-date-add-row">
                  <DatePicker
                    value={datePick}
                    onChange={setDatePick}
                    placeholder="აირჩიეთ თარიღი"
                    direction="down"
                  />
                  <button type="button" className="admin-btn-add" onClick={addDepartureDate}>
                    + თარიღის დამატება
                  </button>
                </div>

                {schedulePreview.length > 0 && (
                  <div className="admin-schedule-preview">
                    <h3>ამ ტურის განრიგი & თავისუფალი დღეები</h3>
                    {schedulePreview.map((mGroup) => (
                      <div key={mGroup.monthName} className="admin-schedule-month">
                        <span className="admin-month-pill">{mGroup.monthName}</span>
                        <div className="admin-schedule-days">
                          {mGroup.dates.map((d) => {
                            const entry = departureDates.find((x) => x.date === d.date);
                            return (
                              <div key={d.date} className="admin-schedule-chip-edit">
                                <span className="chip-date">{d.chip}</span>
                                <label>
                                  თავისუფალი ადგილი
                                  <input
                                    type="number"
                                    min="0"
                                    max={groupMax || 99}
                                    value={entry?.freeSeats ?? 0}
                                    onChange={(e) =>
                                      updateFreeSeats(d.date, Number(e.target.value) || 0)
                                    }
                                  />
                                </label>
                                <button
                                  type="button"
                                  className="admin-btn-ghost"
                                  onClick={() => removeDepartureDate(d.date)}
                                >
                                  წაშლა
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </fieldset>
            )}

            <div className="admin-form-actions">
              <button type="submit" className="admin-btn-primary" disabled={saving || uploading}>
                {saving ? "ინახება..." : editingTourId ? "ცვლილებების შენახვა" : "ტურის შენახვა"}
              </button>
              <button type="button" className="admin-btn-ghost" onClick={resetForm}>
                გასუფთავება
              </button>
            </div>
          </form>

          {/* TOURS CATALOG SIDEBAR CARDS */}
          <aside className="admin-sidebar" style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2>ტურების კატალოგი</h2>
              <span className="admin-tab-count">{existingTours.length}</span>
            </div>

            {/* Search & Filter */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1.25rem" }}>
              <input
                type="text"
                placeholder="🔍 მოძებნეთ ტური..."
                value={tourSearchQuery}
                onChange={(e) => setTourSearchQuery(e.target.value)}
                style={{
                  padding: "0.55rem 0.8rem",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.06)",
                  color: "#fff",
                  fontSize: "0.88rem",
                }}
              />
              <select
                value={tourRegionFilter}
                onChange={(e) => setTourRegionFilter(e.target.value)}
                style={{
                  padding: "0.5rem 0.8rem",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(15,23,42,0.8)",
                  color: "#fff",
                  fontSize: "0.85rem",
                }}
              >
                <option value="all">ყველა რეგიონი ({existingTours.length})</option>
                {GEORGIA_REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {loadingList ? (
              <p className="admin-hint">{t("common.loading")}</p>
            ) : existingTours.length === 0 ? (
              <p className="admin-hint">ჯერ ტურები არ არის დამატებული.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "850px", overflowY: "auto", paddingRight: "4px" }}>
                {existingTours
                  .filter((tour) => {
                    const titleKa = asLocalizedText(tour.title, "ka").toLowerCase();
                    const titleEn = asLocalizedText(tour.title, "en").toLowerCase();
                    const dest = asLocalizedText(tour.destination || tour.destinationLabel);
                    const q = tourSearchQuery.toLowerCase();
                    const matchesSearch = !q || titleKa.includes(q) || titleEn.includes(q) || dest.toLowerCase().includes(q);
                    const matchesRegion = tourRegionFilter === "all" || dest === tourRegionFilter;
                    return matchesSearch && matchesRegion;
                  })
                  .map((tItem) => {
                    const mainImg =
                      extractImageUrl(tItem.img) ||
                      extractImageUrl(tItem.image) ||
                      (tItem.gallery && extractImageUrl(tItem.gallery[0])) ||
                      "/hero.png";
                    return (
                      <div key={tItem.id} className="admin-entry-card">
                        <div style={{ display: "flex", gap: "0.8rem", padding: "0.8rem" }}>
                          <div
                            style={{
                              position: "relative",
                              width: "72px",
                              height: "72px",
                              borderRadius: "8px",
                              overflow: "hidden",
                              flexShrink: 0,
                            }}
                          >
                            <Image src={mainImg} alt="" fill sizes="72px" style={{ objectFit: "cover" }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{ margin: 0, fontSize: "0.92rem", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {asLocalizedText(tItem.title)}
                            </h4>
                            <div className="admin-entry-tags">
                              <span className="admin-tag-pill">
                                {asLocalizedText(tItem.destinationLabel) || asLocalizedText(tItem.destination)}
                              </span>
                              {(tItem.priceGroup || tItem.pricePrivate) && (
                                <span className="admin-tag-pill price">
                                  💰 {format(tItem.priceGroup || tItem.pricePrivate)}
                                </span>
                              )}
                              {tItem.badge && <span className="admin-tag-pill badge">{asLocalizedText(tItem.badge)}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="admin-entry-actions">
                          <Link href={`/tours/${tItem.id}`} className="admin-action-btn link" target="_blank">
                            საიტზე ნახვა →
                          </Link>
                          <div style={{ display: "flex", gap: "0.4rem" }}>
                            <button type="button" className="admin-action-btn edit" onClick={() => startTourEdit(tItem)}>
                              რედაქტირება
                            </button>
                            <button type="button" className="admin-action-btn delete" onClick={() => handleDelete(tItem.id)}>
                              წაშლა
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </aside>
        </div>
          )}

          {/* TAB 2: HOTELS MANAGEMENT */}
          {activeTab === "hotels" && (
            <HotelManager onHotelsCountChange={setHotelsCount} />
          )}

          {/* TAB 3: PLACES MANAGEMENT */}
          {activeTab === "places" && (
            <PlaceManager onPlacesCountChange={setPlacesCount} />
          )}

          {/* TAB 4: REVIEWS MANAGEMENT */}
          {activeTab === "reviews" && (
            <ReviewManager onReviewsCountChange={setReviewsCount} />
          )}

          {/* TAB 5: LIVE ANALYTICS */}
          {activeTab === "analytics" && (
            <AnalyticsManager />
          )}

          {/* TAB 6: COUPONS & IP MANAGEMENT */}
          {activeTab === "coupons" && (
            <CouponManager />
          )}

          {/* TAB 7: BOOKINGS MANAGEMENT */}
          {activeTab === "bookings" && (
            <BookingManager />
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
