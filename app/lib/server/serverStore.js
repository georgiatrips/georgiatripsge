// Firestore access for API routes that handle customer data (bookings and
// coupon-use records). With the Admin SDK configured (FIREBASE_ADMIN_CLIENT_EMAIL
// and FIREBASE_ADMIN_PRIVATE_KEY on Vercel) these reads and writes bypass the
// security rules, so firestore.rules can keep the collections closed to the
// public. Without it, the routes fall back to the browser SDK, which only works
// while the rules are still open.

import { FieldValue } from "firebase-admin/firestore";
import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db as clientDb } from "../firebase";
import { getAdminDb } from "./adminAuth";

// Placeholder for "the server's time", swapped for the right sentinel on write.
export const SERVER_TIME = Symbol("serverTime");

let warned = false;
function admin() {
  const firestore = getAdminDb();
  if (!firestore && !warned) {
    warned = true;
    console.warn("[serverStore] Firebase Admin SDK is not configured; using the public SDK. Closed Firestore rules will reject these writes.");
  }
  return firestore;
}

export const hasAdminStore = () => Boolean(getAdminDb());

function withTimestamps(value, sentinel) {
  if (value === SERVER_TIME) return sentinel();
  if (Array.isArray(value)) return value.map((v) => withTimestamps(v, sentinel));
  if (value && typeof value === "object" && value.constructor === Object) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, withTimestamps(v, sentinel)]));
  }
  return value;
}

/** The document's data, or null when it does not exist. */
export async function readDoc(collectionName, id) {
  const firestore = admin();
  if (firestore) {
    const snap = await firestore.collection(collectionName).doc(id).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
  }
  const snap = await getDoc(doc(clientDb, collectionName, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function writeDoc(collectionName, id, data, { merge = false } = {}) {
  const firestore = admin();
  if (firestore) {
    const payload = withTimestamps(data, () => FieldValue.serverTimestamp());
    await firestore.collection(collectionName).doc(id).set(payload, { merge });
    return;
  }
  await setDoc(doc(clientDb, collectionName, id), withTimestamps(data, serverTimestamp), { merge });
}

/** First document whose `field` equals `value`, or null. */
export async function findOne(collectionName, field, value) {
  const firestore = admin();
  if (firestore) {
    const snap = await firestore.collection(collectionName).where(field, "==", value).limit(1).get();
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
  }
  const snap = await getDocs(query(collection(clientDb, collectionName), where(field, "==", value), limit(1)));
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
}

/** Number of documents whose `field` equals `value`. */
export async function countWhere(collectionName, field, value) {
  const firestore = admin();
  if (firestore) {
    const snap = await firestore.collection(collectionName).where(field, "==", value).count().get();
    return snap.data().count || 0;
  }
  const snap = await getCountFromServer(query(collection(clientDb, collectionName), where(field, "==", value)));
  return snap.data().count || 0;
}
