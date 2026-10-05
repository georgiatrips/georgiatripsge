import { db } from "../firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { normalizeCustomPlaces } from "./customPlaces";

// One doc under settings/ (public read, admin write) is plenty: even a few
// thousand places stay far below Firestore's 1 MB document limit.
const placesRef = () => doc(db, "settings", "transfer_places");

export async function getCustomTransferPlaces() {
  const snap = await getDoc(placesRef());
  return snap.exists() ? normalizeCustomPlaces(snap.data().places) : [];
}

export async function saveCustomTransferPlaces(places) {
  const clean = normalizeCustomPlaces(places);
  await setDoc(placesRef(), { places: clean, updatedAt: serverTimestamp() });
  return clean;
}
