import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

const COLLECTION = "hotels";

export async function listHotels() {
  const snapshot = await getDocs(collection(db, COLLECTION));
  return snapshot.docs
    .map((item) => normalizeHotel({ id: item.id, ...item.data() }))
    .sort(
      (a, b) =>
        Number(b.isFeatured) - Number(a.isFeatured) ||
        (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
    );
}

export async function getHotel(id) {
  const snapshot = await getDoc(doc(db, COLLECTION, id));
  return snapshot.exists() ? normalizeHotel({ id: snapshot.id, ...snapshot.data() }) : null;
}

export async function createHotel(data) {
  const ref = await addDoc(collection(db, COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateHotel(id, data) {
  await updateDoc(doc(db, COLLECTION, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteHotel(id) {
  await deleteDoc(doc(db, COLLECTION, id));
}

// ლინკს ვასწორებთ — თუ პროტოკოლი არ არის, ვამატებთ https://-ს
export function normalizeBookingUrl(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw.replace(/^\/+/, "")}`;
}

export function normalizeHotel(hotel) {
  if (!hotel) return null;
  const gallery = Array.isArray(hotel.gallery)
    ? hotel.gallery.filter((image) => typeof image === "string" && image).slice(0, 2)
    : [];
  const rating = Number(hotel.rating);
  return {
    ...hotel,
    id: hotel.id,
    name: typeof hotel.name === "string" ? hotel.name : "",
    desc: typeof hotel.desc === "string" ? hotel.desc : "",
    city: typeof hotel.city === "string" ? hotel.city : "",
    priceFrom: typeof hotel.priceFrom === "string" ? hotel.priceFrom : "",
    rating: Number.isFinite(rating) && rating > 0 ? Math.min(rating, 10) : null,
    bookingUrl: normalizeBookingUrl(hotel.bookingUrl),
    gallery,
    img: gallery[0] || "/hero.png",
    isFeatured: Boolean(hotel.isFeatured),
    priceLabel: typeof hotel.priceLabel === "string" ? hotel.priceLabel : "",
    buttonText: typeof hotel.buttonText === "string" ? hotel.buttonText : "",
  };
}
