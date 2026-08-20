import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";

const REVIEWS_COLLECTION = "tour_reviews";
const SITE_REVIEWS_COLLECTION = "reviews";

/**
 * List all site-wide reviews from Firestore for Admin and Home.
 */
export async function listReviews() {
  try {
    const snap = await getDocs(collection(db, SITE_REVIEWS_COLLECTION));
    return snap.docs
      .map((d) => ({
        id: d.id,
        ...d.data(),
      }))
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  } catch (err) {
    console.warn("Could not load reviews:", err);
    return [];
  }
}

/**
 * Create a new review in Firestore.
 */
export async function createReview(data) {
  try {
    const docRef = await addDoc(collection(db, SITE_REVIEWS_COLLECTION), {
      ...data,
      rating: Number(data.rating) || 5,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (err) {
    console.error("Failed to create review:", err);
    throw err;
  }
}

/**
 * Update an existing review in Firestore.
 */
export async function updateReview(id, data) {
  try {
    const ref = doc(db, SITE_REVIEWS_COLLECTION, id);
    await updateDoc(ref, {
      ...data,
      rating: Number(data.rating) || 5,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to update review:", err);
    throw err;
  }
}

/**
 * Delete a review from Firestore.
 */
export async function deleteReview(id) {
  try {
    const ref = doc(db, SITE_REVIEWS_COLLECTION, id);
    await deleteDoc(ref);
  } catch (err) {
    console.error("Failed to delete review:", err);
    throw err;
  }
}

/**
 * Upsert Google reviews into Firestore.
 */
export async function upsertGoogleReviews(googleReviews = []) {
  const results = [];
  for (const item of googleReviews) {
    try {
      const q = query(
        collection(db, SITE_REVIEWS_COLLECTION),
        where("googleReviewId", "==", item.id || item.googleReviewId || "")
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const existingDoc = snap.docs[0];
        await updateDoc(doc(db, SITE_REVIEWS_COLLECTION, existingDoc.id), {
          name: item.author_name || item.name,
          rating: item.rating || 5,
          text: item.text || "",
          time: item.relative_time_description || item.time || "",
          avatar: item.profile_photo_url || item.avatar || "",
          source: "google",
          updatedAt: serverTimestamp(),
        });
        results.push({ action: "updated", id: existingDoc.id });
      } else {
        const newRef = await addDoc(collection(db, SITE_REVIEWS_COLLECTION), {
          name: item.author_name || item.name,
          rating: item.rating || 5,
          text: item.text || "",
          time: item.relative_time_description || item.time || "",
          avatar: item.profile_photo_url || item.avatar || "",
          source: "google",
          googleReviewId: item.id || item.googleReviewId || "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        results.push({ action: "created", id: newRef.id });
      }
    } catch (err) {
      console.warn("Failed to upsert review:", item, err);
    }
  }
  return results;
}

/**
 * List real reviews from Firestore for a specific tour.
 */
export async function listTourReviews(tourId) {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where("tourId", "==", tourId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      date: d.data().createdAt?.toDate ? d.data().createdAt.toDate().toLocaleDateString() : d.data().date || "Recently",
    }));
  } catch (err) {
    console.warn("Could not load Firestore reviews:", err);
    return [];
  }
}

/**
 * Submit a new tour review to Firestore.
 */
export async function addTourReview(reviewData) {
  try {
    const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), {
      ...reviewData,
      rating: Number(reviewData.rating) || 5,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (err) {
    console.error("Failed to save review:", err);
    throw err;
  }
}