// Firebase Configuration & Auth Helpers
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  signInWithPopup,
  signInWithCredential,
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
  // Production sets NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=www.georgiatrips.ge: the
  // popup helper is then served from our own domain (/__/auth rewrite in
  // next.config.mjs) instead of firebaseapp.com.
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
// Desktop: Firebase popup. Phones (iOS Safari, Android Chrome, the Facebook /
// Instagram in-app browsers) block or lose popups, so there the whole tab goes
// to Facebook's login dialog and completeFacebookRedirect() finishes on /login.
//
// That redirect is ours rather than Firebase's signInWithRedirect: Firebase
// keeps the pending sign-in in sessionStorage, which belongs to a single tab,
// and on phones Facebook often hands the visitor back in another tab (or via
// its own app) — "missing initial state". Our CSRF state lives in
// localStorage, shared by every tab of the site. The redirect URI
// (<origin>/login) must be listed under Valid OAuth Redirect URIs in the
// Facebook app.
const FACEBOOK_APP_ID = "1676479996735231";
const FACEBOOK_STATE_KEY = "gt_fb_oauth_state";
const FACEBOOK_STATE_TTL_MS = 30 * 60 * 1000;
const FACEBOOK_RETURN_PARAMS = ["state", "error", "error_code", "error_reason", "error_description"];

function isMobileBrowser() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return /Android|iPhone|iPad|iPod|FBAN|FBAV|Instagram|Mobile/i.test(ua) || iPadOS;
}

function facebookRedirectUri() {
  return `${window.location.origin}/login`;
}

function randomState() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function redirectToFacebook() {
  const state = randomState();
  localStorage.setItem(FACEBOOK_STATE_KEY, JSON.stringify({ state, createdAt: Date.now() }));
  const params = new URLSearchParams({
    client_id: FACEBOOK_APP_ID,
    redirect_uri: facebookRedirectUri(),
    response_type: "token",
    scope: "email,public_profile",
    state,
  });
  window.location.assign(`https://www.facebook.com/dialog/oauth?${params}`);
}

function authError(code) {
  return Object.assign(new Error(code), { code });
}

// Resolves to the user when this page load is the return from Facebook's
// dialog, null otherwise. Sign-in errors are thrown.
export async function completeFacebookRedirect() {
  if (typeof window === "undefined") return null;
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const query = new URLSearchParams(window.location.search);
  const accessToken = hash.get("access_token");
  const error = query.get("error") || hash.get("error");
  if (!accessToken && !error) return null;

  const returnedState = hash.get("state") || query.get("state");
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(FACEBOOK_STATE_KEY) || "null");
    localStorage.removeItem(FACEBOOK_STATE_KEY);
  } catch (_) {}

  // The token must not stay in the address bar or the history.
  FACEBOOK_RETURN_PARAMS.forEach((name) => query.delete(name));
  const search = query.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${search ? `?${search}` : ""}`);

  if (error) {
    throw authError(error === "access_denied" ? "auth/popup-closed-by-user" : `auth/facebook-${error}`);
  }
  if (
    !saved ||
    saved.state !== returnedState ||
    Date.now() - saved.createdAt > FACEBOOK_STATE_TTL_MS
  ) {
    throw authError("auth/facebook-state-mismatch");
  }
  try {
    const result = await signInWithCredential(auth, FacebookAuthProvider.credential(accessToken));
    return result.user;
  } catch (e) {
    // The login page maps invalid-credential to "wrong email or password".
    if (e.code === "auth/invalid-credential") throw authError("auth/facebook-invalid-token");
    throw e;
  }
}

// Returns the user, or null when the page is navigating away to Facebook.
export async function signInWithFacebook() {
  if (isMobileBrowser()) {
    redirectToFacebook();
    return null;
  }
  try {
    const result = await signInWithPopup(auth, createFacebookProvider());
    return result.user;
  } catch (e) {
    if (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment") {
      redirectToFacebook();
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
