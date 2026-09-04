import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  doc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import { normalizeBooking, BOOKING_STATUSES } from "./bookingModel";

const BOOKINGS_COLLECTION = "bookings";

/**
 * Submit an online booking via the secure API endpoint.
 * Falls back to direct Firestore write if API is unreachable.
 */
export async function createBooking(payload) {
  try {
    const res = await fetch("/api/bookings/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return {
        bookingId: data.bookingId,
        accessToken: data.accessToken,
        booking: data.booking,
      };
    }
    throw new Error(data.error || "Booking submission failed");
  } catch (err) {
    console.warn("API booking failed, attempting fallback:", err.message);

    // Fallback direct write to Firestore (with normalized structure & accessToken)
    try {
      const bId = payload.bookingId || `GT-${Date.now().toString().slice(-6)}`;
      const aToken = payload.accessToken || `sec_${Math.random().toString(36).substring(2, 15)}${Date.now().toString(36)}`;
      const docRef = await addDoc(collection(db, BOOKINGS_COLLECTION), {
        ...payload,
        bookingId: bId,
        accessToken: aToken,
        status: payload.status || BOOKING_STATUSES.PENDING,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { bookingId: bId, accessToken: aToken, id: docRef.id };
    } catch (fsErr) {
      console.error("Critical: failed to save booking to Firestore:", fsErr);
      return null;
    }
  }
}

/**
 * List all bookings for the Admin Panel.
 */
export async function listAllBookingsAdmin() {
  try {
    const q = query(
      collection(db, BOOKINGS_COLLECTION),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((docSnap) => normalizeBooking(docSnap.data(), docSnap.id));
  } catch (err) {
    // If createdAt index is building or missing, fetch unsorted and sort locally
    try {
      const snap = await getDocs(collection(db, BOOKINGS_COLLECTION));
      const list = snap.docs.map((docSnap) => normalizeBooking(docSnap.data(), docSnap.id));
      list.sort((a, b) => (b.createdAtMillis || 0) - (a.createdAtMillis || 0));
      return list;
    } catch (innerErr) {
      console.error("Failed to list admin bookings:", innerErr);
      return [];
    }
  }
}

/**
 * Real-time subscription to bookings for the Admin Dashboard.
 */
export function subscribeToBookings(callback) {
  if (!db || typeof window === "undefined") return () => {};

  try {
    const q = query(
      collection(db, BOOKINGS_COLLECTION),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) =>
          normalizeBooking(docSnap.data(), docSnap.id)
        );
        callback(items);
      },
      (err) => {
        console.warn("Bookings real-time error, falling back:", err);
        // Fallback unsorted snapshot
        return onSnapshot(collection(db, BOOKINGS_COLLECTION), (snapshot) => {
          const items = snapshot.docs.map((docSnap) =>
            normalizeBooking(docSnap.data(), docSnap.id)
          );
          items.sort((a, b) => (b.createdAtMillis || 0) - (a.createdAtMillis || 0));
          callback(items);
        });
      }
    );
  } catch (err) {
    console.error("subscribeToBookings error:", err);
    return () => {};
  }
}

/**
 * Admin action: Update booking status with metadata (confirmedAt, cancelledAt, cancellationReason, etc.)
 */
export async function updateBookingStatusAdmin(docId, newStatus, meta = {}) {
  try {
    const bookingRef = doc(db, BOOKINGS_COLLECTION, docId);
    const updatePayload = {
      status: newStatus,
      updatedAt: serverTimestamp(),
    };

    if (newStatus === BOOKING_STATUSES.CONFIRMED) {
      updatePayload["admin.confirmedAt"] = serverTimestamp();
      updatePayload["admin.confirmedBy"] = meta.confirmedBy || "Admin";
    } else if (newStatus === BOOKING_STATUSES.CANCELLED) {
      updatePayload["admin.cancelledAt"] = serverTimestamp();
      updatePayload["admin.cancelledBy"] = meta.cancelledBy || "Admin";
      updatePayload["admin.cancellationReason"] = meta.cancellationReason || "No reason provided";
    } else if (newStatus === BOOKING_STATUSES.COMPLETED) {
      updatePayload["admin.completedAt"] = serverTimestamp();
    }

    await updateDoc(bookingRef, updatePayload);
    return true;
  } catch (err) {
    console.error("updateBookingStatusAdmin error:", err);
    throw err;
  }
}

/**
 * Admin action: Update internal admin notes on a booking
 */
export async function updateBookingNotesAdmin(docId, notes) {
  try {
    const bookingRef = doc(db, BOOKINGS_COLLECTION, docId);
    await updateDoc(bookingRef, {
      "notes.adminNotes": notes,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.error("updateBookingNotesAdmin error:", err);
    throw err;
  }
}

/**
 * List bookings for a logged-in user
 */
export async function listUserBookings(userEmail) {
  if (!userEmail) return [];
  try {
    const q = query(
      collection(db, BOOKINGS_COLLECTION),
      where("customer.email", "==", userEmail),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((docSnap) => normalizeBooking(docSnap.data(), docSnap.id));
  } catch (err) {
    return [];
  }
}
