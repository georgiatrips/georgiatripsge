"use client";

import React, { useEffect, useState } from "react";
import "./admin.css";
import Image from "next/image";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { BarChartIcon, BedIcon, CarIcon, ClipboardIcon, LocationIcon, MessageIcon, MountainIcon, TicketIcon } from "../components/Icons";
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
import TransferPricingManager from "./TransferPricingManager";
import { subscribeToLiveSessions } from "../lib/analytics";
import { subscribeToBookings } from "../lib/bookingsFirestore";
import LocalizedInputGroup, { emptyLangObj, parseLocal } from "./LocalizedInputGroup";
import { listHotels } from "../lib/hotelsFirestore";
import { listReviews } from "../lib/reviewsFirestore";
import { useAuth } from "../lib/AuthContext";
import { useCurrency } from "../lib/currency/CurrencyContext";
import { useLanguage } from "../lib/i18n/LanguageContext";
import { adminFetch } from "../lib/apiClient";
import { VEHICLES, VEHICLE_KEYS, getPrivateVehiclePrices } from "../lib/vehicles";
import { uploadImage, uploadImages } from "../lib/imageUpload";
import { tourPath, uniqueSlugFor } from "../lib/slugs";
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
  getTourRegions,
  isTourActive,
  formatTourNumber,
} from "../lib/toursFirestore";

const emptyVehiclePrices = () => Object.fromEntries(VEHICLE_KEYS.map((key) => [key, ""]));

// Every photo of a place (cover + gallery) as trimmed, de-duplicated URLs.
function placePhotoUrls(place) {
  const urls = [];
  const add = (u) => {
    const url = typeof u === "string" ? u.trim() : u?.url?.trim();
    if (url && !urls.includes(url)) urls.push(url);
  };
  add(place?.img);
  (Array.isArray(place?.gallery) ? place.gallery : []).forEach(add);
  return urls;
}

const emptyLocation = () => ({
  placeId: "",
  search: "",
  title: emptyLangObj(),
  desc: emptyLangObj(),
  img: "",
  mode: "place",
});

export default function AdminPage() {
  const { format } = useCurrency();
  const [title, setTitle] = useState(emptyLangObj());
  const [desc, setDesc] = useState(emptyLangObj());
  // Practical details shown on the tour page only when filled in.
  const [startTime, setStartTime] = useState("");
  const [meetingPoint, setMeetingPoint] = useState(emptyLangObj());
  const [includedText, setIncludedText] = useState(emptyLangObj());
  const [excludedText, setExcludedText] = useState(emptyLangObj());
  const [type, setType] = useState("oneday");
  const [durationMode, setDurationMode] = useState("days");
  const [durationDays, setDurationDays] = useState("");
  const [durationNights, setDurationNights] = useState("");
  const [durationHours, setDurationHours] = useState("");
  // Regions the tour covers, primary first (it also fills the legacy
  // single `destination` field that older code and filters still read).
  const [destinations, setDestinations] = useState([GEORGIA_REGIONS[0]]);
  const [groupMin, setGroupMin] = useState("1");
  const [groupMax, setGroupMax] = useState("19");
  const [privateGroupMin, setPrivateGroupMin] = useState("1");
  const [privateGroupMax, setPrivateGroupMax] = useState("19");
  const [hasGroup, setHasGroup] = useState(true);
  const [hasPrivate, setHasPrivate] = useState(true);
  const [priceGroup, setPriceGroup] = useState("");
  const [pricePrivate, setPricePrivate] = useState("");
  // Private price per vehicle ("" = the tour isn't offered in that vehicle).
  const [vehiclePrices, setVehiclePrices] = useState(emptyVehiclePrices);
  const filledVehiclePrices = Object.fromEntries(
    VEHICLE_KEYS.filter((key) => Number(vehiclePrices[key]) > 0).map((key) => [key, Number(vehiclePrices[key])])
  );
  const hasVehiclePrices = Object.keys(filledVehiclePrices).length > 0;
  // With vehicle prices, the tour's private price is the cheapest vehicle
  // (what cards show as the starting price).
  const effectivePricePrivate = hasVehiclePrices ? Math.min(...Object.values(filledVehiclePrices)) : pricePrivate;
  const [isVip, setIsVip] = useState(false);
  const [isPopular, setIsPopular] = useState(false);
  // "" = no badge. A badge is a claim ("top pick"), so it is opt-in.
  const [selectedBadge, setSelectedBadge] = useState("");
  const [tourSection, setTourSection] = useState("");
  // Our internal number (GT-07), the same one the tour has in the tour list
  // files, so a tour on the site and its entry there can be matched.
  const [tourNumber, setTourNumber] = useState("");
  // Off = the tour stays in the admin but disappears from the site.
  const [isActive, setIsActive] = useState(true);
  const [locations, setLocations] = useState([emptyLocation()]);
  const [availablePlaces, setAvailablePlaces] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [datePick, setDatePick] = useState("");
  const [departureDates, setDepartureDates] = useState([]);
  const [saving, setSaving] = useState(false);
  const [editingTourId, setEditingTourId] = useState(null);
  const [view, setView] = useState("list");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [message, setMessage] = useState(null);
  const { user } = useAuth() ?? {};
  const { t } = useLanguage();
  const [existingTours, setExistingTours] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const destination = destinations[0] || GEORGIA_REGIONS[0];
  const destinationLabel = destination;
  const toggleDestination = (region) =>
    setDestinations((prev) => {
      if (!prev.includes(region)) return [...prev, region];
      // Keep at least one region selected.
      return prev.length > 1 ? prev.filter((item) => item !== region) : prev;
    });

  const [activeTab, setActiveTab] = useState("tours");
  const [tourSearchQuery, setTourSearchQuery] = useState("");
  const [tourRegionFilter, setTourRegionFilter] = useState("all");
  const [tourStatusFilter, setTourStatusFilter] = useState("all");
  const [togglingTourId, setTogglingTourId] = useState(null);
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

    return () => {
      active = false;
    };
  }, []);

  // Live visitors and pending bookings (tab badges). Only admins may list
  // these collections, so the listeners wait until Firebase has restored the
  // session and confirmed the admin flag; subscribing on first render ran
  // them signed-out and Firestore answered permission-denied.
  const isAdminUser = Boolean(user?.isAdmin);
  useEffect(() => {
    if (!isAdminUser) return undefined;
    let active = true;

    const unsubSessions = subscribeToLiveSessions((sessions) => {
      if (!active) return;
      const now = Date.now();
      const online = sessions.filter((s) => now - (s.lastActiveMillis || 0) <= 4 * 60 * 1000).length;
      setLiveVisitorsCount(online);
    });

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
  }, [isAdminUser]);


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
              mode: "place",
              placeId: place.id,
              search: placeTitle,
              title: parseLocal(place.title),
              desc: parseLocal(place.desc),
              img: mainImg,
            }
          : loc
      )
    );

    // All photos of this location (place.img and place.gallery), reused without re-uploading to Cloudinary
    const placePhotos = placePhotoUrls(place);

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

  const moveLocation = (fromIdx, toIdx) => {
    setLocations((prev) => {
      if (toIdx < 0 || toIdx >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, item);
      return copy;
    });
  };

  const handleLocationPhoto = async (idx, file) => {
    if (!file) return;
    try {
      setUploading(true);
      const url = await uploadImage(file);
      updateLocation(idx, "img", url);
      setGallery((prev) => {
        const existingUrls = new Set(
          prev.map((item) => (typeof item === "string" ? item : item?.url))
        );
        if (!existingUrls.has(url)) {
          return [
            ...prev,
            {
              url,
              locationTitle: locations[idx]?.title?.ka || "ლოკაცია",
              placeId: locations[idx]?.placeId || "",
            },
          ];
        }
        return prev;
      });
    } catch (err) {
      setMessage({ type: "error", text: err.message || "ფოტოს ატვირთვა ვერ მოხერხდა" });
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      setUploading(true);
      const { urls, errors } = await uploadImages(files, {
        onProgress: (done, total) => setUploadProgress({ done, total }),
      });
      const newItems = urls.map((url) => ({ url, locationTitle: "", placeId: "" }));
      setGallery((prev) => [...prev, ...newItems]);
      if (errors.length) {
        setMessage({ type: "error", text: `${newItems.length}/${files.length} ფოტო აიტვირთა. შეცდომა: ${errors.join("; ")}` });
      } else {
        setMessage({ type: "success", text: `${newItems.length} ფოტო წარმატებით აიტვირთა!` });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err.message || "ფოტოს ატვირთვა ვერ მოხერხდა" });
    } finally {
      setUploading(false);
      setUploadProgress(null);
      e.target.value = "";
    }
  };

  const updateGalleryItemTitle = (idx, newTitle) => {
    setGallery((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        if (typeof item === "string") {
          return { url: item, locationTitle: newTitle, placeId: "" };
        }
        return { ...item, locationTitle: newTitle };
      })
    );
  };

  const updateGalleryItemPlace = (idx, placeId, placeTitle) => {
    setGallery((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const url = extractImageUrl(item);
        return { url, locationTitle: placeTitle, placeId };
      })
    );
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
    const maxSeats = Math.max(1, parseInt(groupMax, 10) || 19);
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
    setStartTime("");
    setMeetingPoint(emptyLangObj());
    setIncludedText(emptyLangObj());
    setExcludedText(emptyLangObj());
    setType("oneday");
    setDurationMode("days");
    setDurationDays("");
    setDurationNights("");
    setDurationHours("");
    setDestinations([GEORGIA_REGIONS[0]]);
    setGroupMin("1");
    setGroupMax("19");
    setPrivateGroupMin("1");
    setPrivateGroupMax("19");
    setHasGroup(true);
    setHasPrivate(true);
    setPriceGroup("");
    setPricePrivate("");
    setVehiclePrices(emptyVehiclePrices());
    setIsVip(false);
    setIsPopular(false);
    setSelectedBadge("");
    setTourSection("");
    setTourNumber("");
    setIsActive(true);
    setLocations([emptyLocation()]);
    setGallery([]);
    setDatePick("");
    setDepartureDates([]);
    setEditingTourId(null);
  };

  // Fills the whole form from a prepared tour file (.json), so a tour drafted
  // outside the admin is saved here under the admin's own login. Stops name a
  // place by id (resolved from the Places catalog, photos included, exactly as
  // when picked by hand) or carry their own title/desc as a custom stop.
  const importTourFromFile = async (event) => {
    const input = event.target;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const placesById = new Map(availablePlaces.map((place) => [place.id, place]));
      const stops = Array.isArray(data.itinerary) ? data.itinerary : [];
      const missing = stops.filter((stop) => stop.placeId && !placesById.has(stop.placeId));
      if (missing.length) {
        throw new Error(`ადგილები ვერ მოიძებნა კატალოგში: ${missing.map((stop) => stop.placeId).join(", ")}`);
      }

      resetForm();
      setTitle(parseLocal(data.title));
      setDesc(parseLocal(data.desc));
      setStartTime(typeof data.startTime === "string" ? data.startTime : "");
      setMeetingPoint(parseLocal(data.meetingPoint));
      setIncludedText(parseLocal(data.includedText));
      setExcludedText(parseLocal(data.excludedText));
      setType(data.type === "multiday" ? "multiday" : "oneday");
      if (data.durationHours) {
        setDurationMode("hours");
        setDurationHours(String(data.durationHours));
      } else {
        setDurationMode("days");
        setDurationDays(String(data.durationDays || 1));
        setDurationNights(String(data.durationNights ?? 0));
      }
      const regions = (Array.isArray(data.destinations) ? data.destinations : []).filter((r) => GEORGIA_REGIONS.includes(r));
      if (regions.length) setDestinations(regions);
      setHasGroup(Boolean(data.hasGroup));
      setHasPrivate(data.hasPrivate !== false);
      setPriceGroup(data.priceGroup != null ? String(data.priceGroup) : "");
      setPricePrivate(data.pricePrivate != null ? String(data.pricePrivate) : "");
      setVehiclePrices(
        Object.fromEntries(VEHICLE_KEYS.map((key) => [key, Number(data.privateVehiclePrices?.[key]) > 0 ? String(data.privateVehiclePrices[key]) : ""]))
      );
      if (data.groupMin) setGroupMin(String(data.groupMin));
      if (data.groupMax) setGroupMax(String(data.groupMax));
      if (data.privateGroupMin) setPrivateGroupMin(String(data.privateGroupMin));
      if (data.privateGroupMax) setPrivateGroupMax(String(data.privateGroupMax));
      setIsPopular(Boolean(data.isPopular));
      setIsVip(Boolean(data.isVip));
      setSelectedBadge(TOUR_BADGE_OPTIONS.includes(data.badge) ? data.badge : "");
      setTourSection(TOUR_SECTIONS.some((section) => section.value === data.tourSection) ? data.tourSection : "");
      setTourNumber(parseInt(data.tourNumber, 10) > 0 ? String(parseInt(data.tourNumber, 10)) : "");
      setIsActive(data.active !== false);

      const newLocations = [];
      const newGallery = [];
      const seenPhotos = new Set();
      for (const stop of stops) {
        const place = stop.placeId ? placesById.get(stop.placeId) : null;
        if (place) {
          const placeTitle = asLocalizedText(place.title, "ka") || "ადგილი";
          const photos = placePhotoUrls(place);
          newLocations.push({
            ...emptyLocation(),
            mode: "place",
            placeId: place.id,
            search: placeTitle,
            title: parseLocal(place.title),
            desc: parseLocal(place.desc),
            img: photos[0] || "",
          });
          photos.forEach((url) => {
            if (seenPhotos.has(url)) return;
            seenPhotos.add(url);
            newGallery.push({ url, locationTitle: placeTitle, placeId: place.id });
          });
        } else {
          newLocations.push({
            ...emptyLocation(),
            mode: "custom",
            title: parseLocal(stop.title),
            desc: parseLocal(stop.desc),
            img: typeof stop.img === "string" ? stop.img : "",
          });
        }
      }
      setLocations(newLocations.length ? newLocations : [emptyLocation()]);
      setGallery(newGallery);
      setMessage({
        type: "success",
        text: `ტური ჩაიტვირთა ფაილიდან: ${newLocations.length} გაჩერება, ${newGallery.length} ფოტო. გადაამოწმეთ და დააჭირეთ „შენახვას“ — მანამდე საიტზე არაფერი ემატება.`,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setMessage({ type: "error", text: `იმპორტი ვერ მოხერხდა: ${err.message}` });
    }
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
    if (hasPrivate && !effectivePricePrivate) {
      setMessage({ type: "error", text: "შეიყვანეთ ინდივიდუალური ფასი" });
      return;
    }
    if (hasGroup && departureDates.length === 0) {
      setMessage({ type: "error", text: "ჯგუფური ტურისთვის დაამატეთ გამგზავრების თარიღები" });
      return;
    }

    const itinerary = locations
      .filter((l) => (l.title?.ka && l.title.ka.trim()) || (l.title?.en && l.title.en.trim()) || l.placeId)
      .map((l) => ({
        placeId: l.placeId || "",
        title: {
          ka: l.title?.ka?.trim() || "",
          en: l.title?.en?.trim() || "",
          ru: l.title?.ru?.trim() || "",
          tr: l.title?.tr?.trim() || "",
          ar: l.title?.ar?.trim() || "",
        },
        desc: {
          ka: l.desc?.ka?.trim() || "",
          en: l.desc?.en?.trim() || "",
          ru: l.desc?.ru?.trim() || "",
          tr: l.desc?.tr?.trim() || "",
          ar: l.desc?.ar?.trim() || "",
        },
        img: l.img || "",
      }));

    if (itinerary.length === 0 || itinerary.some((location) => !location.title?.ka)) {
      setMessage({ type: "error", text: "შეიყვანეთ მარშრუტის ყველა ლოკაციის სახელი (ქართულად მაინც)" });
      return;
    }
    const sectionLabel =
      TOUR_SECTIONS.find((s) => s.value === tourSection)?.label || "";

    const tourNumberValue = parseInt(tourNumber, 10) > 0 ? parseInt(tourNumber, 10) : null;
    const numberOwner = tourNumberValue
      ? existingTours.find((item) => item.id !== editingTourId && Number(item.tourNumber) === tourNumberValue)
      : null;
    if (numberOwner) {
      setMessage({
        type: "error",
        text: `${formatTourNumber(tourNumberValue)} უკვე აქვს ტურს „${asLocalizedText(numberOwner.title, "ka")}“ — აირჩიეთ სხვა ნომერი`,
      });
      return;
    }

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

    // The public URL is /tours/<slug>. Store it once, derived from the tour as
    // it was before this edit, so renaming a tour never breaks its URL.
    const previousTour = editingTourId ? existingTours.find((item) => item.id === editingTourId) : null;
    const slug = previousTour?.slug || uniqueSlugFor(previousTour || { title }, existingTours);

    const payload = {
      slug,
      title,
      desc,
      itinerary,
      departure: {
        ka: destinationLabel,
        en: destinationLabel,
        ru: destinationLabel,
        tr: destinationLabel,
        ar: destinationLabel,
      },
      // 2+ days is always multi-day, even if the type toggle was left alone.
      type: durationMode === "days" && (parseInt(durationDays, 10) || 0) >= 2 ? "multiday" : type,
      duration: durationValue,
      destination,
      destinations,
      destinationLabel,
      groupMin: minN,
      groupMax: maxN,
      privateGroupMin: privateMinN,
      privateGroupMax: privateMaxN,
      hasGroup,
      hasPrivate,
      priceGroup: hasGroup ? Number(priceGroup) : null,
      pricePrivate: hasPrivate ? Number(effectivePricePrivate) : null,
      privateVehiclePrices: hasPrivate && hasVehiclePrices ? filledVehiclePrices : null,
      isVip,
      isPopular,
      itinerary,
      // Store a URL, never the gallery object itself. Older records can contain
      // gallery metadata objects, while next/image requires a string source.
      gallery: cleanedGallery,
      img: cleanedGallery[0]?.url || extractImageUrl(itinerary[0]?.img) || "/hero.webp",
      departureDates: hasGroup
        ? departureDates.map((d) => ({
            date: d.date,
            freeSeats: Math.max(0, Number(d.freeSeats) || 0),
          }))
        : [],
      badge: selectedBadge || "",
      startTime: startTime.trim(),
      meetingPoint,
      includedText,
      excludedText,
      tourSection,
      tourSectionLabel: sectionLabel,
      category: tourSection,
      tourNumber: tourNumberValue,
      active: isActive,
    };

    try {
      setSaving(true);
      const created = editingTourId ? null : await createTour(payload);
      if (editingTourId) await updateFirestoreTour(editingTourId, payload);
      try {
        await adminFetch("/api/admin/revalidate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tag: "tours", changed: [`/tours/${slug}`] }),
        });
      } catch (_) {}
      setMessage({ type: "success", text: editingTourId ? "ტური განახლებულია!" : `ტური შენახულია! ID: ${created.id}` });
      resetForm();
      setView("list");
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
    setView("form");
    setTitle(parseLocal(tour.title));
    setDesc(parseLocal(tour.desc));
    setStartTime(typeof tour.startTime === "string" ? tour.startTime : "");
    setMeetingPoint(parseLocal(tour.meetingPoint));
    setIncludedText(parseLocal(tour.includedText));
    setExcludedText(parseLocal(tour.excludedText));
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
    const savedRegions = getTourRegions(tour).filter((region) => GEORGIA_REGIONS.includes(region));
    setDestinations(savedRegions.length ? savedRegions : [GEORGIA_REGIONS[0]]);
    setGroupMin(String(tour.groupMin || 1)); setGroupMax(String(tour.groupMax || 19));
    setPrivateGroupMin(String(tour.privateGroupMin || tour.groupMin || 1));
    setPrivateGroupMax(String(tour.privateGroupMax || tour.groupMax || 19));
    setHasGroup(!!tour.hasGroup); setHasPrivate(!!tour.hasPrivate);
    setPriceGroup(tour.priceGroup ?? ""); setPricePrivate(tour.pricePrivate ?? "");
    const savedVehiclePrices = getPrivateVehiclePrices(tour);
    setVehiclePrices(Object.fromEntries(VEHICLE_KEYS.map((key) => [key, savedVehiclePrices[key] != null ? String(savedVehiclePrices[key]) : ""])));
    setIsVip(!!tour.isVip); setIsPopular(!!tour.isPopular); setSelectedBadge(asLocalizedText(tour.badge) || "");
    setTourSection(tour.tourSection || tour.category || "");
    setTourNumber(parseInt(tour.tourNumber, 10) > 0 ? String(parseInt(tour.tourNumber, 10)) : "");
    setIsActive(isTourActive(tour));
    setLocations(
      Array.isArray(tour.itinerary) && tour.itinerary.length
        ? tour.itinerary.map((location) => ({
            ...location,
            mode: location.placeId ? "place" : "custom",
            placeId: location.placeId || "",
            search: asLocalizedText(location.title, "ka") || "",
            title: parseLocal(location.title),
            desc: parseLocal(location.desc),
            img: location.img || "",
          }))
        : [emptyLocation()]
    );
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

  // Switches a tour on/off the site without touching anything else in it.
  const toggleTourActive = async (tour) => {
    const nextActive = !isTourActive(tour);
    setTogglingTourId(tour.id);
    setMessage(null);
    try {
      await updateFirestoreTour(tour.id, { active: nextActive });
      setExistingTours((prev) => prev.map((item) => (item.id === tour.id ? { ...item, active: nextActive } : item)));
      try {
        await adminFetch("/api/admin/revalidate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tag: "tours", changed: [tourPath(tour)] }),
        });
      } catch (_) {}
      setMessage({
        type: "success",
        text: `„${asLocalizedText(tour.title, "ka")}“ ${nextActive ? "ჩაირთო — ისევ ჩანს საიტზე" : "გაითიშა — საიტზე აღარ ჩანს და არ იჯავშნება"}`,
      });
    } catch (err) {
      setMessage({ type: "error", text: firestoreErrorMessage(err) });
    } finally {
      setTogglingTourId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("წავშალოთ ეს ტური?")) return;
    // Captured before deletion: search engines are told the URL is gone.
    const deletedTour = existingTours.find((item) => item.id === id);
    try {
      await deleteFirestoreTour(id);
      try {
        await adminFetch("/api/admin/revalidate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tag: "tours", changed: deletedTour ? [tourPath(deletedTour)] : [] }),
        });
      } catch (_) {}
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

  const navGroups = [
    {
      label: "მიმოხილვა",
      items: [
        { key: "analytics", label: "ანალიტიკა", Icon: BarChartIcon, badge: liveVisitorsCount > 0 ? { text: `${liveVisitorsCount} ონლაინ`, tone: "live" } : null },
      ],
    },
    {
      label: "გაყიდვები",
      items: [
        { key: "bookings", label: "ჯავშნები", Icon: ClipboardIcon, badge: pendingBookingsCount > 0 ? { text: String(pendingBookingsCount), tone: "warn" } : null },
        { key: "coupons", label: "კუპონები", Icon: TicketIcon },
        { key: "transfers", label: "ტრანსფერის ფასები", Icon: CarIcon },
      ],
    },
    {
      label: "კონტენტი",
      items: [
        { key: "tours", label: "ტურები", Icon: MountainIcon, badge: { text: String(existingTours.length) } },
        { key: "hotels", label: "სასტუმროები", Icon: BedIcon, badge: { text: String(hotelsCount) } },
        { key: "places", label: "ადგილები", Icon: LocationIcon, badge: { text: String(placesCount) } },
        { key: "reviews", label: "მიმოხილვები", Icon: MessageIcon, badge: { text: String(reviewsCount) } },
      ],
    },
  ];

  const SECTION_INFO = {
    analytics: ["ანალიტიკა", "ვინ არის საიტზე, საიდან მოვიდა და რას აკეთებს."],
    bookings: ["ჯავშნები", "ახალი მოთხოვნები, დადასტურება და სტატუსები."],
    coupons: ["კუპონები", "ფასდაკლების კოდები და IP შეზღუდვები."],
    transfers: ["ტრანსფერის ფასები", "ფასები მანძილისა და ავტომობილის მიხედვით."],
    tours: ["ტურები", "ტურის დამატება, რედაქტირება და კატალოგი."],
    hotels: ["სასტუმროები", "სასტუმროების სია საიტზე."],
    places: ["ადგილები", "ტურისტული ადგილები ფოტოებითა და აღწერით."],
    reviews: ["მიმოხილვები", "სტუმრების შეფასებები და Google-ის სინქრონიზაცია."],
  };
  const [sectionTitle, sectionText] = SECTION_INFO[activeTab] || SECTION_INFO.tours;

  return (
    <div className="admin-page">
      <Navbar active="admin" />

      <div className="adm-shell">
        {/* Grouped section menu: a side column on desktop, a scrolling strip on phones. */}
        <nav className="adm-nav" aria-label="ადმინ პანელის განყოფილებები">
          <p className="adm-nav-brand">მართვის პანელი</p>
          {navGroups.map((group) => (
            <div key={group.label} className="adm-nav-group">
              <p className="adm-nav-label">{group.label}</p>
              <ul>
                {group.items.map(({ key, label, Icon, badge }) => (
                  <li key={key}>
                    <button
                      type="button"
                      className={`adm-nav-item${activeTab === key ? " is-active" : ""}`}
                      aria-current={activeTab === key ? "page" : undefined}
                      onClick={() => setActiveTab(key)}
                    >
                      <Icon size={18} />
                      <span className="adm-nav-text">{label}</span>
                      {badge && <span className={`adm-badge${badge.tone ? ` is-${badge.tone}` : ""}`}>{badge.text}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <main className="adm-main">
          <header className="adm-page-head">
            <h1>{sectionTitle}</h1>
            <p>{sectionText}</p>
          </header>

          {/* TAB 1: TOURS MANAGEMENT */}
          {activeTab === "tours" && (
            <div className="admin-catalog-wrap">
              <div className="admin-catalog-bar">
                <div className="admin-segment admin-catalog-switch" role="tablist">
                  <button type="button" role="tab" aria-selected={view === "list"} className={view === "list" ? "is-active" : ""} onClick={() => setView("list")}>
                    კატალოგი <span className="adm-badge">{existingTours.length}</span>
                  </button>
                  <button type="button" role="tab" aria-selected={view === "form"} className={view === "form" ? "is-active" : ""} onClick={() => setView("form")}>
                    {editingTourId ? "რედაქტირება" : "+ დამატება"}
                  </button>
                </div>
              </div>
            {message && (
              <div className={`admin-alert ${message.type}`} role="status">
                {message.text}
              </div>
            )}
              {view === "form" && (

              <form className="admin-form" onSubmit={handleSubmit}>
                <header className="admin-form-header">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2>{editingTourId ? "ტურის რედაქტირება" : "ახალი ტურის დამატება"}</h2>
                    {!editingTourId && (
                      <label className="admin-import-btn" title="მზა ტურის ფაილით (.json) ფორმის შევსება">
                        იმპორტი ფაილიდან
                        <input type="file" accept="application/json,.json" onChange={importTourFromFile} hidden />
                      </label>
                    )}
                    {editingTourId && (
                      <span className="admin-tag-pill price">
                        რედაქტირების რეჟიმი
                      </span>
                    )}
                  </div>
                  <p>შეავსეთ ველები და შეინახეთ. ფოტოები ინახება Cloudinary-ში.</p>
                </header>


            {/* Basic info */}
            <fieldset className="admin-fieldset">
              <legend>ძირითადი ინფორმაცია</legend>
              <div className="admin-field">
                <label htmlFor="tour-number">ტურის ნომერი</label>
                <div className="admin-inline-inputs">
                  <span>GT-</span>
                  <input
                    id="tour-number"
                    type="number"
                    min="1"
                    step="1"
                    value={tourNumber}
                    onChange={(e) => setTourNumber(e.target.value)}
                    placeholder={String(
                      Math.max(0, ...existingTours.map((item) => Number(item.tourNumber) || 0)) + 1
                    )}
                  />
                </div>
                <p className="admin-hint">ჩვენი შიდა ნომერი — იგივე, რაც ტურების სიის ფაილში (travel-batumi-tours.md). საიტის სტუმრებს არ უჩანთ.</p>
              </div>
              <label className="admin-check">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                <span>ტური ჩართულია — ჩანს საიტზე და იჯავშნება</span>
              </label>
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
            </fieldset>

            {/* What travellers ask before booking. Each block appears on the
                tour page only when filled in; nothing generic is shown instead. */}
            <fieldset className="admin-fieldset">
              <legend>პრაქტიკული ინფორმაცია (ტურისტისთვის)</legend>
              <p className="admin-hint">
                ეს ველები ჩანს ტურის გვერდზე მხოლოდ შევსების შემთხვევაში. „ფასში შედის“ / „არ შედის“ — თითო პუნქტი ცალკე ხაზზე.
              </p>
              <div className="admin-field">
                <label htmlFor="tour-start-time">გასვლის დრო</label>
                <input
                  id="tour-start-time"
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder="მაგ: 09:00"
                  maxLength={40}
                />
              </div>
              <LocalizedInputGroup
                label="აყვანის / შეხვედრის ადგილი"
                value={meetingPoint}
                onChange={setMeetingPoint}
                placeholder="მაგ: აყვანა ბათუმის ნებისმიერი სასტუმროდან"
              />
              <LocalizedInputGroup
                label="ფასში შედის (თითო ხაზზე ერთი)"
                type="textarea"
                value={includedText}
                onChange={setIncludedText}
                placeholder={"ტრანსპორტი\nმძღოლი\nღვინის დეგუსტაცია"}
              />
              <LocalizedInputGroup
                label="ფასში არ შედის (თითო ხაზზე ერთი)"
                type="textarea"
                value={excludedText}
                onChange={setExcludedText}
                placeholder={"სადილი\nშესასვლელი ბილეთები"}
              />
            </fieldset>

            <fieldset className="admin-fieldset">
              <legend>ტურის პარამეტრები</legend>
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
                      <input
                        id="tour-duration-days"
                        type="number"
                        min="1"
                        value={durationDays}
                        onChange={(e) => {
                          setDurationDays(e.target.value);
                          const days = parseInt(e.target.value, 10) || 0;
                          if (days >= 2) setType("multiday");
                          else if (days === 1) setType("oneday");
                        }}
                        placeholder="დღე"
                        required
                      />
                      <span>/</span>
                      <input id="tour-duration-nights" type="number" min="0" value={durationNights} onChange={(e) => setDurationNights(e.target.value)} placeholder="ღამე" required />
                    </div>
                  )}                </div>
              </div>
              <div className="admin-grid-2">
                <div className="admin-field">
                  <label id="tour-dest-label">მიმართულება (რეგიონები)</label>
                  <div className="admin-region-picker" role="group" aria-labelledby="tour-dest-label">
                    {GEORGIA_REGIONS.map((region) => {
                      const order = destinations.indexOf(region);
                      return (
                        <button
                          key={region}
                          type="button"
                          className={`admin-region-chip${order >= 0 ? " is-active" : ""}`}
                          aria-pressed={order >= 0}
                          onClick={() => toggleDestination(region)}
                        >
                          {order === 0 && <span className="admin-region-chip-main">მთავარი</span>}
                          {region}
                        </button>
                      );
                    })}
                  </div>
                  <p className="admin-hint" style={{ margin: "0.4rem 0 0", fontSize: "0.78rem" }}>
                    აირჩიეთ ერთი ან რამდენიმე. პირველი არჩეული მთავარია: ის ჩანს ბარათზე, დანარჩენები „+N“-ით.
                  </p>
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
              <p className="admin-hint">არასავალდებულო. badge გამოჩნდება ტურის hero-ში და ბარათებზე — გამოიყენეთ მხოლოდ მაშინ, როცა მართალია (მაგ. „მაღალი შეფასება“ მხოლოდ რეალური შეფასებებით).</p>
              <div className="admin-badge-grid">
                <button
                  type="button"
                  className={`admin-pick-chip${!selectedBadge ? " is-active" : ""}`}
                  onClick={() => setSelectedBadge("")}
                >
                  badge-ის გარეშე
                </button>
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
                      <div style={{ fontSize: "0.85rem", color: "var(--gt-primary)", marginTop: 4, display: "flex", gap: "10px", fontWeight: 500 }}>
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
                      value={hasVehiclePrices ? effectivePricePrivate : pricePrivate}
                      onChange={(e) => setPricePrivate(e.target.value)}
                      placeholder="500"
                      disabled={hasVehiclePrices}
                    />
                    {hasVehiclePrices && (
                      <p className="admin-hint" style={{ margin: "0.3rem 0 0", fontSize: "0.78rem" }}>
                        ავტომატურად: ყველაზე იაფი მანქანის ფასი (ბარათზე „დან“ ფასად ჩანს).
                      </p>
                    )}
                    {Number(effectivePricePrivate) > 0 && (
                      <div style={{ fontSize: "0.85rem", color: "var(--gt-primary)", marginTop: 4, display: "flex", gap: "10px", fontWeight: 500 }}>
                        <span>⇄ <strong>${Math.round(effectivePricePrivate * 0.37)}</strong> USD</span>
                        <span><strong>€{Math.round(effectivePricePrivate * 0.34)}</strong> EUR</span>
                        <span><strong>{Math.round(effectivePricePrivate * 1.36)}</strong> AED</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {hasPrivate && (
                <div className="admin-vehicle-prices">
                  <p className="admin-vehicle-prices-title">ფასი მანქანის მიხედვით (არასავალდებულო)</p>
                  <p className="admin-hint" style={{ margin: "0 0 0.6rem", fontSize: "0.8rem" }}>
                    შეავსეთ მხოლოდ ის მანქანები, რითაც ეს ტური ტარდება. ცარიელი ველი = ეს მანქანა არ შეთავაზდება.
                    თუ ყველა ცარიელია, მოქმედებს ზემოთ მითითებული ერთი ფასი.
                  </p>
                  <div className="admin-vehicle-prices-grid">
                    {VEHICLE_KEYS.map((key) => (
                      <div className="admin-field" key={key} style={{ marginBottom: 0 }}>
                        <label htmlFor={`vehicle-price-${key}`}>
                          {VEHICLES[key].nameKa} <small>(მაქს. {VEHICLES[key].capacityPax})</small>
                        </label>
                        <input
                          id={`vehicle-price-${key}`}
                          type="number"
                          min="0"
                          value={vehiclePrices[key]}
                          onChange={(e) => setVehiclePrices((prev) => ({ ...prev, [key]: e.target.value }))}
                          placeholder="₾"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </fieldset>

            {/* Route */}
            <fieldset className="admin-fieldset">
              <legend>მარშრუტი & სანახავი ადგილები</legend>
              <p className="admin-hint">
                მიიტანეთ კურსორი წერტილზე დეტალებისა და ფოტოს სანახავად — აქ დაამატეთ ლოკაციები.
              </p>
              {locations.map((loc, idx) => {
                const isCustom = loc.mode === "custom";
                return (
                  <div
                    key={idx}
                    className="admin-location-card"
                    style={{
                      border: "1px solid var(--gt-line)",
                      borderRadius: "12px",
                      padding: "1.25rem",
                      marginBottom: "1.25rem",
                      background: "var(--gt-paper)",
                    }}
                  >
                    <div
                      className="admin-location-head"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.9rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <strong style={{ fontSize: "1rem", color: "var(--gt-primary)" }}>
                          ლოკაცია #{idx + 1}
                        </strong>
                        {loc.placeId ? (
                          <span
                            style={{
                              fontSize: "0.75rem",
                              background: "var(--gt-primary-soft)",
                              color: "var(--gt-primary-700)",
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontWeight: 600,
                            }}
                          >
                            ბაზიდან (Places)
                          </span>
                        ) : isCustom ? (
                          <span
                            style={{
                              fontSize: "0.75rem",
                              background: "var(--gt-stone)",
                              color: "var(--gt-ink)",
                              padding: "2px 8px",
                              borderRadius: "12px",
                              fontWeight: 600,
                            }}
                          >
                            ინდივიდუალური / აქტივობა
                          </span>
                        ) : null}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveLocation(idx, idx - 1)}
                          title="გადატანა ზემოთ"
                          style={{
                            background: idx === 0 ? "#fff" : "var(--gt-primary-soft)",
                            border: idx === 0 ? "1px solid var(--gt-line)" : "1px solid #b9cfe0",
                            color: idx === 0 ? "#b8c2cc" : "var(--gt-primary)",
                            borderRadius: "6px",
                            padding: "0.3rem 0.6rem",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            cursor: idx === 0 ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                        >
                          ზემოთ
                        </button>
                        <button
                          type="button"
                          disabled={idx === locations.length - 1}
                          onClick={() => moveLocation(idx, idx + 1)}
                          title="გადატანა ქვემოთ"
                          style={{
                            background: idx === locations.length - 1 ? "#fff" : "var(--gt-primary-soft)",
                            border: idx === locations.length - 1 ? "1px solid var(--gt-line)" : "1px solid #b9cfe0",
                            color: idx === locations.length - 1 ? "#b8c2cc" : "var(--gt-primary)",
                            borderRadius: "6px",
                            padding: "0.3rem 0.6rem",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            cursor: idx === locations.length - 1 ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                          }}
                        >
                          ქვემოთ
                        </button>
                        {locations.length > 1 && (
                          <button
                            type="button"
                            className="admin-btn-ghost"
                            style={{
                              color: "#b42318",
                              borderColor: "#f1c4bf",
                              padding: "0.3rem 0.6rem",
                              fontSize: "0.8rem",
                            }}
                            onClick={() => removeLocation(idx)}
                            title="ლოკაციის წაშლა"
                          >
                            წაშლა
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Mode Segment Switcher */}
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => {
                          updateLocation(idx, "mode", "place");
                        }}
                        style={{
                          flex: 1,
                          minWidth: "180px",
                          padding: "0.5rem 0.75rem",
                          borderRadius: "8px",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          background: !isCustom ? "var(--gt-primary-soft)" : "#fff",
                          color: !isCustom ? "var(--gt-primary)" : "var(--gt-muted)",
                          border: !isCustom ? "1px solid #b9cfe0" : "1px solid var(--gt-line)",
                          transition: "all 0.2s",
                        }}
                      >
                        არსებული ადგილი (Places ბაზიდან)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateLocation(idx, "mode", "custom");
                          updateLocation(idx, "placeId", "");
                        }}
                        style={{
                          flex: 1,
                          minWidth: "180px",
                          padding: "0.5rem 0.75rem",
                          borderRadius: "8px",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          background: isCustom ? "var(--gt-stone)" : "#fff",
                          color: isCustom ? "var(--gt-ink)" : "var(--gt-muted)",
                          border: isCustom ? "1px solid var(--gt-line-strong)" : "1px solid var(--gt-line)",
                          transition: "all 0.2s",
                        }}
                      >
                        ინდივიდუალური ლოკაცია / აქტივობა (დეგუსტაცია, დაბრუნება...)
                      </button>
                    </div>

                    {/* Mode Content */}
                    {!isCustom ? (
                      <div>
                        <div className="admin-field admin-place-search-field" style={{ position: "relative", marginBottom: "0.75rem" }}>
                          <label style={{ fontSize: "0.88rem", color: "var(--gt-ink-2)" }}>ადგილის მოძებნა</label>
                          <input
                            value={loc.search || ""}
                            onChange={(e) => updateLocation(idx, "search", e.target.value)}
                            placeholder="მოძებნეთ დამატებული ადგილი (მაგ: მარტვილი, ყაზბეგი)..."
                          />
                          {loc.search?.trim() && !loc.placeId && (() => {
                            const matches = availablePlaces
                              .filter((place) => matchesMultiLang(place.title, loc.search) || matchesMultiLang(place.region, loc.search))
                              .slice(0, 12);
                            return (
                            <div className="admin-place-search-results">
                              {matches.length === 0 && (
                                <p className="admin-place-search-empty">ადგილი ვერ მოიძებნა</p>
                              )}
                              {matches.map((place) => (
                                  <button type="button" key={place.id} className="admin-place-search-result" onClick={() => selectPlaceForLocation(idx, place)}>
                                    <span className="admin-place-result-thumb">
                                      <Image src={extractImageUrl(place.img) || extractImageUrl(place.gallery?.[0]) || "/hero.webp"} alt="" fill sizes="42px" style={{ objectFit: "cover" }} />
                                    </span>
                                    <span><strong>{asLocalizedText(place.title, "ka")}</strong><small>{asLocalizedText(place.region, "ka")}</small></span>
                                  </button>
                                ))}
                            </div>
                            );
                          })()}
                        </div>

                        {loc.placeId ? (
                          <div
                            className="admin-location-selected-card"
                            style={{
                              marginTop: "0.75rem",
                              padding: "0.75rem 1rem",
                              borderRadius: "10px",
                              background: "var(--gt-primary-soft)",
                              border: "1px solid #b9cfe0",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "1rem",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", minWidth: 0 }}>
                              <div style={{ position: "relative", width: "52px", height: "52px", borderRadius: "8px", overflow: "hidden", flexShrink: 0, border: "1px solid var(--gt-line)" }}>
                                <Image src={extractImageUrl(loc.img) || "/hero.webp"} alt="" fill sizes="52px" style={{ objectFit: "cover" }} />
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                  <strong style={{ fontSize: "0.95rem", color: "var(--gt-ink)" }}>
                                    {asLocalizedText(loc.title, "ka") || "დამატებული ადგილი"}
                                  </strong>
                                  <span style={{ fontSize: "0.72rem", background: "#e4f2ea", color: "#236b48", padding: "1px 6px", borderRadius: "4px", fontWeight: 600 }}>
                                    ✓ მრავალენოვანი
                                  </span>
                                </div>
                                <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "var(--gt-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "420px" }}>
                                  {asLocalizedText(loc.desc, "ka") || "აღწერა შენახულია ბაზაში"}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setLocations((prev) =>
                                  prev.map((l, i) =>
                                    i === idx
                                      ? {
                                          ...l,
                                          mode: "place",
                                          placeId: "",
                                          search: "",
                                          title: emptyLangObj(),
                                          desc: emptyLangObj(),
                                          img: "",
                                        }
                                      : l
                                  )
                                );
                              }}
                              style={{
                                background: "#fff",
                                border: "1px solid var(--gt-line)",
                                color: "var(--gt-ink)",
                                padding: "5px 12px",
                                borderRadius: "6px",
                                fontSize: "0.78rem",
                                cursor: "pointer",
                                flexShrink: 0,
                              }}
                            >
                              შეცვლა
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      /* CUSTOM LOCATION / ACTIVITY MODE */
                      <div style={{ background: "var(--gt-paper)", padding: "1rem", borderRadius: "10px", border: "1px solid var(--gt-line)" }}>
                        <LocalizedInputGroup
                          label="ლოკაციის / აქტივობის სახელი"
                          value={loc.title}
                          onChange={(val) => updateLocation(idx, "title", val)}
                          placeholder="მაგ: ღვინის დეგუსტაცია მარანში, დაბრუნება ბათუმში, ლანჩი..."
                          required
                        />

                        <LocalizedInputGroup
                          label="მოკლე აღწერა (არასავალდებულო)"
                          type="textarea"
                          rows={2}
                          value={loc.desc}
                          onChange={(val) => updateLocation(idx, "desc", val)}
                          placeholder="მაგ: ადგილობრივი ოჯახური ღვინის და ჭაჭის დაგემოვნება, მასტერკლასი..."
                        />

                        {/* Image upload / preview */}
                        <div style={{ marginTop: "0.5rem" }}>
                          <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.85rem", color: "var(--gt-ink-2)", fontWeight: 600 }}>
                            ლოკაციის ფოტო (არასავალდებულო)
                          </label>
                          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                            {loc.img ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "#fff", padding: "6px 12px", borderRadius: "8px", border: "1px solid var(--gt-line)" }}>
                                <div style={{ position: "relative", width: "48px", height: "48px", borderRadius: "6px", overflow: "hidden" }}>
                                  <Image src={extractImageUrl(loc.img)} alt="" fill sizes="48px" style={{ objectFit: "cover" }} />
                                </div>
                                <span style={{ fontSize: "0.8rem", color: "var(--gt-muted)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  ფოტო დამატებულია
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateLocation(idx, "img", "")}
                                  style={{ background: "#fdecea", border: "1px solid #f1c4bf", color: "#b42318", padding: "3px 8px", borderRadius: "4px", fontSize: "0.75rem", cursor: "pointer" }}
                                >
                                  ✕ წაშლა
                                </button>
                              </div>
                            ) : null}

                            <label
                              style={{
                                padding: "0.4rem 0.85rem",
                                background: "var(--gt-primary-soft)",
                                border: "1px solid #b9cfe0",
                                color: "var(--gt-primary)",
                                borderRadius: "6px",
                                fontSize: "0.82rem",
                                fontWeight: 600,
                                cursor: uploading ? "not-allowed" : "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              {uploading ? "იტვირთება..." : loc.img ? "ფოტოს შეცვლა" : "ფოტოს ატვირთვა"}
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                disabled={uploading}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleLocationPhoto(idx, file);
                                  e.target.value = "";
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <button type="button" className="admin-btn-add" onClick={addLocation}>
                + შემდეგი ლოკაცია
              </button>
            </fieldset>

            {/* Gallery */}
            <fieldset className="admin-fieldset">
              <legend>ფოტოგალერეა (Cloudinary & ლოკაციების ფოტოები)</legend>
              <p className="admin-hint" style={{ marginBottom: "1rem" }}>
                ლოკაციის არჩევისას მისი ყველა ფოტო ავტომატურად გადმოყვება აქ (ხელახლა ატვირთვის გარეშე). ასევე შეგიძლიათ დაამატოთ ნებისმიერი სხვა ფოტო.
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
                    background: "var(--gt-primary-soft)",
                    border: "1px solid #b9cfe0",
                    color: "var(--gt-ink)",
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
                {uploading && <span className="admin-hint" style={{ margin: 0, color: "#8a6116" }}>იტვირთება{uploadProgress ? ` ${uploadProgress.done}/${uploadProgress.total}` : ""}...</span>}
                {gallery.length > 0 && <span className="admin-hint" style={{ margin: 0 }}>სულ: {gallery.length} ფოტო</span>}
              </div>

              {gallery.length > 0 ? (
                <div
                  className="admin-gallery-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
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
                      const url = (typeof item === "string" ? item : item?.url) || "/hero.webp";
                      const locTitle = typeof item === "string" ? "" : (item?.locationTitle || "");
                      const isCover = idx === 0;

                      return (
                        <div
                          key={`${url}-${idx}`}
                          className="admin-gallery-card"
                          style={{
                            background: "#fff",
                            border: isCover ? "2px solid var(--gt-primary)" : "1px solid var(--gt-line)",
                            borderRadius: "12px",
                            padding: "0.6rem",
                            boxShadow: isCover ? "0 0 0 3px rgba(42, 101, 146, 0.18)" : "none",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.5rem",
                          }}
                        >
                          {/* Photo Container */}
                          <div
                            style={{
                              position: "relative",
                              width: "100%",
                              aspectRatio: "16/10",
                              borderRadius: "8px",
                              overflow: "hidden",
                              background: "var(--gt-stone)",
                            }}
                          >
                            <Image src={url} alt="" fill sizes="240px" style={{ objectFit: "cover" }} />
                            
                            {/* Cover Badge */}
                            {isCover && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: "6px",
                                  left: "6px",
                                  zIndex: 2,
                                  background: "var(--gt-primary)",
                                  color: "#fff",
                                  fontSize: "0.72rem",
                                  fontWeight: 800,
                                  padding: "3px 7px",
                                  borderRadius: "4px",
                                  boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
                                }}
                              >
                                მთავარი ფოტო
                              </div>
                            )}

                            {/* Remove button */}
                            <button
                              type="button"
                              className="admin-gallery-remove"
                              onClick={() => removeGalleryImage(idx)}
                              aria-label="წაშლა"
                              style={{
                                position: "absolute",
                                top: "6px",
                                right: "6px",
                                width: "26px",
                                height: "26px",
                                borderRadius: "50%",
                                background: "rgba(220, 38, 38, 0.9)",
                                color: "#ffffff",
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyItems: "center",
                                justifyContent: "center",
                                fontSize: "14px",
                                fontWeight: "bold",
                                zIndex: 3,
                                boxShadow: "0 2px 6px rgba(0,0,0,0.4)"
                              }}
                            >
                              ✕
                            </button>
                          </div>

                          {/* Place Name Edit Input */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                            <label style={{ fontSize: "0.74rem", color: "var(--gt-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                              ადგილის სახელი:
                            </label>
                            <input
                              type="text"
                              value={locTitle}
                              onChange={(e) => updateGalleryItemTitle(idx, e.target.value)}
                              placeholder="მაგ: გერგეტის სამება, ყაზბეგი..."
                              style={{
                                width: "100%",
                                padding: "0.35rem 0.5rem",
                                fontSize: "0.8rem",
                                borderRadius: "6px",
                                background: "#fff",
                                border: "1px solid var(--gt-line)",
                                color: "var(--gt-ink)",
                              }}
                            />
                            
                            {/* Quick Place Pick from Itinerary */}
                            {locations.filter((l) => asLocalizedText(l.title, "ka")).length > 0 && (
                              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "2px" }}>
                                {locations
                                  .map((l) => ({
                                    id: l.placeId || "",
                                    name: asLocalizedText(l.title, "ka"),
                                  }))
                                  .filter((l) => l.name)
                                  .slice(0, 4)
                                  .map((loc, lIdx) => (
                                    <button
                                      type="button"
                                      key={lIdx}
                                      onClick={() => updateGalleryItemPlace(idx, loc.id, loc.name)}
                                      style={{
                                        fontSize: "0.68rem",
                                        padding: "2px 6px",
                                        borderRadius: "4px",
                                        background: locTitle === loc.name ? "var(--gt-primary-soft)" : "#fff",
                                        border: locTitle === loc.name ? "1px solid var(--gt-primary)" : "1px solid var(--gt-line)",
                                        color: locTitle === loc.name ? "var(--gt-primary)" : "var(--gt-muted)",
                                        cursor: "pointer",
                                        whiteSpace: "nowrap",
                                        maxWidth: "100%",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                      }}
                                      title={`დააყენეთ: ${loc.name}`}
                                    >
                                      + {loc.name}
                                    </button>
                                  ))}
                              </div>
                            )}
                          </div>

                          {/* Actions Row */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginTop: "auto",
                              paddingTop: "4px",
                              borderTop: "1px solid var(--gt-line)",
                            }}
                          >
                            {!isCover ? (
                              <button
                                type="button"
                                onClick={() => setCoverImage(idx)}
                                style={{
                                  background: "#fbefd5",
                                  border: "1px solid #ecd39c",
                                  color: "#8a6116",
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  padding: "3px 8px",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                }}
                              >
                                მთავარად
                              </button>
                            ) : (
                              <span style={{ fontSize: "0.72rem", color: "#8a6116", fontWeight: 700 }}>
                                ✓ მთავარი
                              </span>
                            )}

                            {/* Reorder Buttons */}
                            <div style={{ display: "flex", gap: "4px" }}>
                              {idx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => moveGalleryImage(idx, -1)}
                                  title="მარცხნივ"
                                  style={{
                                    background: "#fff",
                                    border: "1px solid var(--gt-line)",
                                    color: "var(--gt-ink)",
                                    width: "24px",
                                    height: "24px",
                                    borderRadius: "4px",
                                    fontSize: "12px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  ◀
                                </button>
                              )}
                              {idx < gallery.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => moveGalleryImage(idx, 1)}
                                  title="მარჯვნივ"
                                  style={{
                                    background: "#fff",
                                    border: "1px solid var(--gt-line)",
                                    color: "var(--gt-ink)",
                                    width: "24px",
                                    height: "24px",
                                    borderRadius: "4px",
                                    fontSize: "12px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
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
                <p className="admin-hint" style={{ textAlign: "center", padding: "1.5rem", border: "1px dashed var(--gt-line-strong)", borderRadius: "10px" }}>
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
              <button type="button" className="admin-btn-ghost" onClick={() => { resetForm(); setView("list"); }}>
                გასუფთავება
              </button>
            </div>
          </form>
          )}

          {/* TOURS CATALOG SIDEBAR CARDS */}
          {view === "list" && (
          <aside className="admin-catalog">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2>ტურების კატალოგი</h2>
              <span className="adm-badge">{existingTours.length}</span>
            </div>

            {/* Search & Filter */}
            <div className="admin-catalog-filters">
              <input
                type="search"
                className="adm-input"
                placeholder="მოძებნეთ ტური..."
                value={tourSearchQuery}
                onChange={(e) => setTourSearchQuery(e.target.value)}
              />
              <select
                className="adm-input"
                value={tourRegionFilter}
                onChange={(e) => setTourRegionFilter(e.target.value)}
              >
                <option value="all">ყველა რეგიონი ({existingTours.length})</option>
                {GEORGIA_REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <select
                className="adm-input"
                value={tourStatusFilter}
                onChange={(e) => setTourStatusFilter(e.target.value)}
              >
                <option value="all">ყველა სტატუსი</option>
                <option value="active">ჩართული ({existingTours.filter(isTourActive).length})</option>
                <option value="inactive">გათიშული ({existingTours.filter((tour) => !isTourActive(tour)).length})</option>
              </select>
            </div>

            {loadingList ? (
              <p className="admin-hint">{t("common.loading")}</p>
            ) : existingTours.length === 0 ? (
              <p className="admin-hint">ჯერ ტურები არ არის დამატებული.</p>
            ) : (
              <div className="admin-catalog-grid">
                {existingTours
                  .filter((tour) => {
                    const titleKa = asLocalizedText(tour.title, "ka").toLowerCase();
                    const titleEn = asLocalizedText(tour.title, "en").toLowerCase();
                    const regions = getTourRegions(tour);
                    const q = tourSearchQuery.toLowerCase();
                    const matchesSearch = !q || titleKa.includes(q) || titleEn.includes(q) || regions.some((r) => r.toLowerCase().includes(q));
                    const matchesRegion = tourRegionFilter === "all" || regions.includes(tourRegionFilter);
                    const matchesStatus =
                      tourStatusFilter === "all" || (tourStatusFilter === "active") === isTourActive(tour);
                    const code = formatTourNumber(tour.tourNumber).toLowerCase();
                    return (matchesSearch || (q && code.includes(q))) && matchesRegion && matchesStatus;
                  })
                  // Numbered tours in number order, then the rest newest first.
                  .sort((a, b) => (Number(a.tourNumber) || Infinity) - (Number(b.tourNumber) || Infinity))
                  .map((tItem) => {
                    const active = isTourActive(tItem);
                    const mainImg =
                      extractImageUrl(tItem.img) ||
                      extractImageUrl(tItem.image) ||
                      (tItem.gallery && extractImageUrl(tItem.gallery[0])) ||
                      "/hero.webp";
                    return (
                      <div key={tItem.id} className={`admin-entry-card${active ? "" : " is-inactive"}`}>
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
                            <h4 className="adm-entry-title">
                              {formatTourNumber(tItem.tourNumber) && (
                                <span className="admin-tour-number">{formatTourNumber(tItem.tourNumber)}</span>
                              )}
                              {asLocalizedText(tItem.title)}
                            </h4>
                            <div className="admin-entry-tags">
                              {!active && <span className="admin-tag-pill is-off">გათიშულია</span>}
                              {(() => {
                                const regions = getTourRegions(tItem);
                                return (
                                  <span className="admin-tag-pill" title={regions.join(", ")}>
                                    {regions[0]}
                                    {regions.length > 1 ? ` +${regions.length - 1}` : ""}
                                  </span>
                                );
                              })()}
                              {(tItem.priceGroup || tItem.pricePrivate) && (
                                <span className="admin-tag-pill price">
                                  {format(tItem.priceGroup || tItem.pricePrivate)}
                                </span>
                              )}
                              {tItem.badge && <span className="admin-tag-pill badge">{asLocalizedText(tItem.badge)}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="admin-entry-actions">
                          {active ? (
                            <Link href={`/ka/tours/${tItem.id}`} className="admin-action-btn link" target="_blank">
                              ნახვა ↗
                            </Link>
                          ) : (
                            <span />
                          )}
                          <div style={{ display: "flex", gap: "0.4rem" }}>
                            <button
                              type="button"
                              className={`admin-action-btn ${active ? "toggle-off" : "toggle-on"}`}
                              onClick={() => toggleTourActive(tItem)}
                              disabled={togglingTourId === tItem.id}
                            >
                              {togglingTourId === tItem.id ? "..." : active ? "გათიშვა" : "ჩართვა"}
                            </button>
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
          )}
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

          {/* TAB: TRANSFER PRICES (distance bands per vehicle) */}
          {activeTab === "transfers" && (
            <TransferPricingManager />
          )}

          {/* TAB 7: BOOKINGS MANAGEMENT */}
          {activeTab === "bookings" && (
            <BookingManager />
          )}
        </main>
      </div>

      <Footer />
    </div>
  );
}
