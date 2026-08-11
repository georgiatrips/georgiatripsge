import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

const reviewsCollection = collection(db, "reviews");

const asText = (value, fallback = "") => {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    return value.ka || value.en || value.ru || Object.values(value).find((item) => typeof item === "string") || fallback;
  }
  return fallback;
};

// Convert a Firestore Timestamp / Date / epoch number to a JS Date safely
function toDate(value) {
  if (!value) return null;
  if (typeof value === "number") {
    // Could be seconds (Google) or milliseconds — assume ms if > 1e11, else seconds
    return new Date(value > 1e11 ? value : value * 1000);
  }
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") {
    try {
      return value.toDate();
    } catch {
      return null;
    }
  }
  if (typeof value?.toMillis === "function") {
    try {
      return new Date(value.toMillis());
    } catch {
      return null;
    }
  }
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function formatRelativeTime(date) {
  if (!date) return "ახლახან";
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (minutes < 1) return "ახლახან";
  if (minutes < 60) return `${minutes} წუთის წინ`;
  if (hours < 24) return `${hours} საათის წინ`;
  if (days < 7) return `${days} დღის წინ`;
  if (weeks < 5) return `${weeks} კვირის წინ`;
  if (months < 12) return `${months} თვის წინ`;
  return `${Math.floor(days / 365)} წლის წინ`;
}

const normalizeReview = (snapshot) => {
  const data = snapshot.data();
  // Prefer the original review date (from Google), then createdAt
  const reviewDate = toDate(data.reviewDate);
  const createdAt = toDate(data.createdAt);
  const storedTime = asText(data.time, "");
  const time =
    storedTime && storedTime !== "ახლახან"
      ? storedTime
      : formatRelativeTime(reviewDate || createdAt);
  return {
    id: snapshot.id,
    name: asText(data.name, "სტუმარი"),
    rating: Number(data.rating) || 5,
    text: asText(data.text),
    time,
    avatar: data.avatar || "",
    source: data.source || "google",
    googleReviewId: data.googleReviewId || "",
    createdAt: createdAt?.toISOString() || new Date().toISOString(),
    reviewDate: reviewDate?.toISOString() || createdAt?.toISOString() || new Date().toISOString(),
  };
};

export async function listReviews() {
  // Fetch ALL reviews (no orderBy — avoids dropping docs missing createdAt/reviewDate).
  // Sort newest first in JS using reviewDate (fallback createdAt).
  const snapshot = await getDocs(reviewsCollection);
  return snapshot.docs
    .map(normalizeReview)
    .sort((a, b) => new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime());
}

export async function createReview({ name, rating, text, time, avatar, source, googleReviewId, reviewDate }) {
  const ref = await addDoc(reviewsCollection, {
    name: name.trim(),
    rating: Math.min(5, Math.max(1, Number(rating) || 5)),
    text: text.trim(),
    time: time || "ახლახან",
    avatar: avatar || "",
    source: source || "google",
    googleReviewId: googleReviewId || "",
    reviewDate: reviewDate ? toDate(reviewDate) : serverTimestamp(),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateReview(reviewId, { name, rating, text, time, avatar, source, googleReviewId, reviewDate }) {
  await updateDoc(doc(db, "reviews", reviewId), {
    name: name.trim(),
    rating: Math.min(5, Math.max(1, Number(rating) || 5)),
    text: text.trim(),
    time: time || "ახლახან",
    avatar: avatar || "",
    source: source || "google",
    googleReviewId: googleReviewId || "",
    ...(reviewDate ? { reviewDate: toDate(reviewDate) } : {}),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteReview(reviewId) {
  await deleteDoc(doc(db, "reviews", reviewId));
}

export async function upsertGoogleReviews(googleReviews) {
  const existing = await listReviews();
  const existingByGoogleId = new Map(
    existing.filter((r) => r.googleReviewId).map((r) => [r.googleReviewId, r])
  );

  const results = [];
  for (const review of googleReviews) {
    const existingReview = existingByGoogleId.get(review.googleReviewId);
    const reviewDate = review.originalTimestamp ? toDate(review.originalTimestamp) : null;
    if (existingReview) {
      if (
        existingReview.text !== review.text ||
        existingReview.rating !== review.rating ||
        existingReview.time !== review.time
      ) {
        await updateReview(existingReview.id, {
          name: review.name,
          rating: review.rating,
          text: review.text,
          time: review.time,
          avatar: review.avatar,
          source: "google",
          googleReviewId: review.googleReviewId,
          reviewDate: reviewDate?.toISOString(),
        });
        results.push({ id: existingReview.id, action: "updated" });
      } else {
        results.push({ id: existingReview.id, action: "unchanged" });
      }
    } else {
      const id = await createReview({
        name: review.name,
        rating: review.rating,
        text: review.text,
        time: review.time,
        avatar: review.avatar,
        source: "google",
        googleReviewId: review.googleReviewId,
        reviewDate: reviewDate?.toISOString(),
      });
      results.push({ id, action: "created" });
    }
  }
  return results;
}