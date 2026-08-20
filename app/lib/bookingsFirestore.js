import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, where, doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

const BOOKINGS_COLLECTION = "bookings";

/**
 * Save an online booking to Firestore.
 */
export async function createBooking(data) {
  try {
    const docRef = await addDoc(collection(db, BOOKINGS_COLLECTION), {
      ...data,
      status: data.status || "pending",
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (err) {
    console.error("Failed to save booking to Firestore:", err);
    return null;
  }
}

/**
 * List bookings (optional admin or user filter)
 */
export async function listUserBookings(userEmail) {
  try {
    const q = query(
      collection(db, BOOKINGS_COLLECTION),
      where("email", "==", userEmail),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.warn("Could not fetch user bookings:", err);
    return [];
  }
}
