import { db } from "../firebase";
import { getDoc, doc, getDocs, collection } from "firebase/firestore";

const validTourIds = new Set();
const invalidTourIds = new Set();
const validPlaceIds = new Set();
const invalidPlaceIds = new Set();
let lastTourSync = 0;
let lastPlaceSync = 0;

export async function checkTourExists(id) {
  if (!id || typeof id !== "string") return false;
  const cleanId = id.trim();
  if (validTourIds.has(cleanId)) return true;
  if (invalidTourIds.has(cleanId) && Date.now() - lastTourSync < 30000) return false;

  try {
    const docSnap = await getDoc(doc(db, "tours", cleanId));
    if (docSnap.exists()) {
      validTourIds.add(cleanId);
      return true;
    }
    if (Date.now() - lastTourSync > 30000) {
      lastTourSync = Date.now();
      const all = await getDocs(collection(db, "tours"));
      all.docs.forEach((d) => {
        validTourIds.add(d.id);
        const data = d.data();
        if (data?.slug) validTourIds.add(data.slug);
      });
      if (validTourIds.has(cleanId)) return true;
    }
    invalidTourIds.add(cleanId);
    return false;
  } catch (err) {
    return validTourIds.has(cleanId);
  }
}

export async function checkPlaceExists(id) {
  if (!id || typeof id !== "string") return false;
  const cleanId = id.trim();
  if (validPlaceIds.has(cleanId)) return true;
  if (invalidPlaceIds.has(cleanId) && Date.now() - lastPlaceSync < 30000) return false;

  try {
    const docSnap = await getDoc(doc(db, "places", cleanId));
    if (docSnap.exists()) {
      validPlaceIds.add(cleanId);
      return true;
    }
    if (Date.now() - lastPlaceSync > 30000) {
      lastPlaceSync = Date.now();
      const all = await getDocs(collection(db, "places"));
      all.docs.forEach((d) => {
        validPlaceIds.add(d.id);
        const data = d.data();
        if (data?.slug) validPlaceIds.add(data.slug);
      });
      if (validPlaceIds.has(cleanId)) return true;
    }
    invalidPlaceIds.add(cleanId);
    return false;
  } catch (err) {
    return validPlaceIds.has(cleanId);
  }
}
