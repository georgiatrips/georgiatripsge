import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import { asLocalizedText } from "./toursFirestore";

const COLLECTION = "places";

export async function listPlaces() {
  const snapshot = await getDocs(collection(db, COLLECTION));
  return snapshot.docs.map((item) => normalizePlace({ id: item.id, ...item.data() }))
    .sort((a, b) => Number(b.isPopular) - Number(a.isPopular) || (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
}
export async function getPlace(id) {
  const snapshot = await getDoc(doc(db, COLLECTION, id));
  return snapshot.exists() ? normalizePlace({ id: snapshot.id, ...snapshot.data() }) : null;
}
export async function createPlace(data) {
  const ref = await addDoc(collection(db, COLLECTION), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}
export async function updatePlace(id, data) {
  await updateDoc(doc(db, COLLECTION, id), { ...data, updatedAt: serverTimestamp() });
}
export async function deletePlace(id) { await deleteDoc(doc(db, COLLECTION, id)); }
export function normalizePlace(place) {
  if (!place) return null;
  const gallery = Array.isArray(place.gallery) ? place.gallery.filter((image) => typeof image === "string" && image) : [];
  return {
    ...place,
    id: place.id,
    title: asLocalizedText(place.title),
    desc: asLocalizedText(place.desc),
    region: asLocalizedText(place.region),
    gallery,
    img: typeof place.img === "string" && place.img ? place.img : gallery[0] || "/hero.png",
    isPopular: Boolean(place.isPopular),
  };
}