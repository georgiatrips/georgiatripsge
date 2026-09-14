// Firebase Configuration & Auth Helpers
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAuLpaONrIUwnJJ3ycgzWWlSTiujotfo4U",
  authDomain: "georgiatripsge.firebaseapp.com",
  projectId: "georgiatripsge",
  storageBucket: "georgiatripsge.firebasestorage.app",
  messagingSenderId: "458133209260",
  appId: "1:458133209260:web:884340052c037e6fcd9f09",
  measurementId: "G-KVGPVEVHQ0",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch(() => {});
}

export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// ── Google Sign In ───────────────────────────────────────────
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

// ── Facebook Sign In ─────────────────────────────────────────
export async function signInWithFacebook() {
  const result = await signInWithPopup(auth, facebookProvider);
  return result.user;
}

// ── Email Sign Up ────────────────────────────────────────────
export async function signUpWithEmail(email, password, displayName) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName });
  await sendEmailVerification(result.user);
  await signOut(auth);
  return null; // signed out until email verified
}

// ── Email Sign In ────────────────────────────────────────────
export async function signInWithEmail(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  if (!result.user.emailVerified) {
    await signOut(auth);
    throw Object.assign(new Error("email-not-verified"), { code: "auth/email-not-verified" });
  }
  return result.user;
}

// ── Password Reset ───────────────────────────────────────────
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

// ── Sign Out ─────────────────────────────────────────────────
export async function logOut() {
  await signOut(auth);
}

export { onAuthStateChanged };
