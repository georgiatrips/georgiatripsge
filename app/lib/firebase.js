// Firebase Configuration & Auth Helpers
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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
  // Set NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=www.georgiatrips.ge once the /__/auth
  // proxy (next.config.mjs) and the OAuth redirect URIs are registered — see
  // the notes above signInWithFacebook.
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "georgiatripsge.firebaseapp.com",
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

function createFacebookProvider() {
  const provider = new FacebookAuthProvider();
  provider.addScope("email");
  provider.addScope("public_profile");
  return provider;
}

// ── Google Sign In ───────────────────────────────────────────
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

// ── Facebook Sign In ─────────────────────────────────────────
// Phones (iOS Safari, Android Chrome and above all the Facebook / Instagram
// in-app browsers) block or lose the popup window, so there we send the whole
// tab to Facebook and finish in completeFacebookRedirect() on return.
//
// The redirect flow keeps its state in storage that Safari and Chrome no
// longer share between two sites, so it only works when the Firebase auth
// handler is served from our own domain (authDomain === this host, see the
// /__/auth rewrite in next.config.mjs). Until that is configured the popup is
// used, exactly as before.
function isMobileBrowser() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return /Android|iPhone|iPad|iPod|FBAN|FBAV|Instagram|Mobile/i.test(ua) || iPadOS;
}

function canUseRedirect() {
  return typeof window !== "undefined" && auth.config.authDomain === window.location.hostname;
}

// Resolves to the user when returning from Facebook, null when this page load
// is not a redirect return. Sign-in errors are thrown.
export async function completeFacebookRedirect() {
  const result = await getRedirectResult(auth);
  return result?.user ?? null;
}

// Returns the user, or null when the page is navigating away to Facebook.
export async function signInWithFacebook() {
  const provider = createFacebookProvider();
  if (isMobileBrowser() && canUseRedirect()) {
    await signInWithRedirect(auth, provider);
    return null;
  }
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (e) {
    if (
      canUseRedirect() &&
      (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment")
    ) {
      await signInWithRedirect(auth, provider);
      return null;
    }
    throw e;
  }
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
