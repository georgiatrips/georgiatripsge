import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const DEFAULT_PROJECT_ID = "georgiatripsge";
const FIREBASE_WEB_API_KEY =
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
  process.env.FIREBASE_API_KEY ||
  "AIzaSyAuLpaONrIUwnJJ3ycgzWWlSTiujotfo4U";

// Short in-memory token cache to prevent redundant REST API roundtrips
const tokenCache = new Map();
const CACHE_TTL_MS = 60 * 1000;

function getCached(token) {
  const item = tokenCache.get(token);
  if (item && Date.now() - item.timestamp < CACHE_TTL_MS) {
    return item.data;
  }
  return null;
}

function setCached(token, data) {
  if (tokenCache.size > 200) {
    const oldestKey = tokenCache.keys().next().value;
    tokenCache.delete(oldestKey);
  }
  tokenCache.set(token, { timestamp: Date.now(), data });
}

function getAdminApp() {
  if (getApps().length) return getApps()[0];

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || DEFAULT_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) return null;

  try {
    return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  } catch (err) {
    console.error("[adminAuth] Failed to initialize Firebase Admin SDK:", err.message);
    return null;
  }
}

/**
 * Verifies a Firebase ID token via Google Identity Toolkit REST API
 * when Service Account credentials are not provided in environment variables.
 */
async function verifyTokenViaRest(token, projectId) {
  const cached = getCached(token);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_WEB_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) {
      return { error: "Invalid or expired authentication token", status: 401 };
    }

    const data = await res.json();
    const userData = data?.users?.[0];
    if (!userData) {
      return { error: "User not found", status: 401 };
    }

    let customClaims = {};
    if (userData.customAttributes) {
      try {
        customClaims = JSON.parse(userData.customAttributes);
      } catch (_) {}
    }

    const user = {
      uid: userData.localId,
      email: userData.email || "",
      displayName: userData.displayName || "",
      emailVerified: userData.emailVerified || false,
      admin: customClaims.admin === true,
      ...customClaims,
    };

    const result = { user };
    setCached(token, result);
    return result;
  } catch (err) {
    console.error("[adminAuth] Token REST verification error:", err.message);
    return { error: "Authentication verification failed", status: 500 };
  }
}

/**
 * Checks if a user has admin privileges by inspecting Firestore /users/{uid} document.
 */
async function checkIsAdminViaRest(user, token, projectId) {
  if (user.admin === true || user.isAdmin === true) return true;

  try {
    const fsUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${user.uid}`;
    const res = await fetch(fsUrl, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const docData = await res.json();
      const isAdmin = docData?.fields?.isAdmin?.booleanValue === true;
      if (isAdmin) {
        user.admin = true;
        user.isAdmin = true;
        return true;
      }
    }
  } catch (err) {
    console.error("[adminAuth] Firestore REST check error:", err.message);
  }

  return false;
}

export async function requireAdmin(request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return { error: "Authentication required", status: 401 };

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || DEFAULT_PROJECT_ID;
  const app = getAdminApp();

  if (app) {
    try {
      const decoded = await getAuth(app).verifyIdToken(token, true);

      // Check custom claims first, then Firestore users collection
      let isAdmin = decoded.admin === true;
      if (!isAdmin) {
        const userDoc = await getFirestore(app).collection("users").doc(decoded.uid).get();
        isAdmin = userDoc.exists && userDoc.data()?.isAdmin === true;
      }

      if (!isAdmin) return { error: "Admin access required", status: 403 };
      return { user: decoded };
    } catch (err) {
      console.error("[adminAuth] Admin SDK verification error:", err.message);
      // Fall through to REST verification in case of SDK token clock skew or cache error
    }
  }

  // Fallback to Google REST API token verification
  const restAuth = await verifyTokenViaRest(token, projectId);
  if (restAuth.error) return restAuth;

  const isAdmin = await checkIsAdminViaRest(restAuth.user, token, projectId);
  if (!isAdmin) return { error: "Admin access required", status: 403 };

  return { user: restAuth.user };
}

export async function requireAuthenticatedUser(request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return { error: "Authentication required", status: 401 };

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || DEFAULT_PROJECT_ID;
  const app = getAdminApp();

  if (app) {
    try {
      return { user: await getAuth(app).verifyIdToken(token, true) };
    } catch (err) {
      console.error("[adminAuth] Admin SDK user auth error:", err.message);
      // Fall through to REST verification
    }
  }

  // Fallback to Google REST API token verification
  return await verifyTokenViaRest(token, projectId);
}
