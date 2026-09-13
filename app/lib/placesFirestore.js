import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "./firebase.js";
import { extractImageUrl } from "./toursFirestore.js";

const COLLECTION = "places";

let cachedPlaces = null;
let cachedPlacesTime = 0;
const PLACES_CACHE_TTL = 5 * 60 * 1000;

export async function listPlaces(forceRefresh = false) {
  if (!forceRefresh && cachedPlaces && Date.now() - cachedPlacesTime < PLACES_CACHE_TTL) {
    return cachedPlaces;
  }
  try {
    const snapshot = await getDocs(collection(db, COLLECTION));
    const list = snapshot.docs
      .map((item) => normalizePlace({ id: item.id, ...item.data() }))
      .sort((a, b) => Number(b.isPopular) - Number(a.isPopular) || (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    cachedPlaces = list;
    cachedPlacesTime = Date.now();
    return list;
  } catch (err) {
    console.warn("Could not load places:", err);
    return cachedPlaces || [];
  }
}

export async function getPlace(id) {
  if (cachedPlaces) {
    const found = cachedPlaces.find((p) => p.id === id);
    if (found) return found;
  }
  const snapshot = await getDoc(doc(db, COLLECTION, id));
  return snapshot.exists() ? normalizePlace({ id: snapshot.id, ...snapshot.data() }) : null;
}

export async function createPlace(data) {
  const ref = await addDoc(collection(db, COLLECTION), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  cachedPlaces = null;
  return ref.id;
}

export async function updatePlace(id, data) {
  await updateDoc(doc(db, COLLECTION, id), { ...data, updatedAt: serverTimestamp() });
  cachedPlaces = null;
}

export async function deletePlace(id) {
  await deleteDoc(doc(db, COLLECTION, id));
  cachedPlaces = null;
}

export function normalizePlace(place) {
  if (!place) return null;
  const gallery = Array.isArray(place.gallery)
    ? place.gallery.map(extractImageUrl).filter(Boolean)
    : [];
  const mainImg = extractImageUrl(place.img) || gallery[0] || "/hero.webp";
  return {
    ...place,
    id: place.id,
    title: place.title,
    desc: place.desc,
    region: place.region,
    gallery: gallery.length > 0 ? gallery : [mainImg],
    img: mainImg,
    isPopular: Boolean(place.isPopular),
  };
}