import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase.js";
import { cleanFirestorePayload } from "./toursShared.js";

export * from "./toursShared.js";

const TOURS_COLLECTION = "tours";

export async function createTour(tourData) {
  const sanitized = cleanFirestorePayload(tourData);
  const payload = {
    ...sanitized,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, TOURS_COLLECTION), payload);
  return { id: ref.id, ...sanitized };
}

export async function getFirestoreTourById(id) {
  if (!id) return null;
  const snap = await getDoc(doc(db, TOURS_COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function listFirestoreTours() {
  const snap = await getDocs(collection(db, TOURS_COLLECTION));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() ?? 0;
      const tb = b.createdAt?.toMillis?.() ?? 0;
      return tb - ta;
    });
}

export async function updateFirestoreTour(id, data) {
  if (!id) throw new Error("Tour ID is required for update");
  const sanitized = cleanFirestorePayload(data);
  await updateDoc(doc(db, TOURS_COLLECTION, id), {
    ...sanitized,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteFirestoreTour(id) {
  if (!id) return;
  await deleteDoc(doc(db, TOURS_COLLECTION, id));
}
