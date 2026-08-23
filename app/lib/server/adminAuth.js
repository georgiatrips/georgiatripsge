import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp() {
  if (getApps().length) return getApps()[0];

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || "georgiatripsge";
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) return null;

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

export async function requireAdmin(request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return { error: "Authentication required", status: 401 };

  const app = getAdminApp();
  if (!app) {
    return {
      error: "Firebase Admin SDK is not configured in environment variables (FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY)",
      status: 503,
    };
  }

  try {
    const decoded = await getAuth(app).verifyIdToken(token, true);
    
    // Check both custom claims and Firestore users collection
    let isAdmin = decoded.admin === true;
    if (!isAdmin) {
      const userDoc = await getFirestore(app).collection("users").doc(decoded.uid).get();
      isAdmin = userDoc.exists && userDoc.data()?.isAdmin === true;
    }

    if (!isAdmin) return { error: "Admin access required", status: 403 };
    return { user: decoded };
  } catch (err) {
    console.error("[adminAuth] Verification error:", err.message);
    return { error: "Invalid or expired authentication token", status: 401 };
  }
}

export async function requireAuthenticatedUser(request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) return { error: "Authentication required", status: 401 };

  const app = getAdminApp();
  if (!app) {
    return {
      error: "Firebase Admin SDK is not configured in environment variables (FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY)",
      status: 503,
    };
  }

  try {
    return { user: await getAuth(app).verifyIdToken(token, true) };
  } catch (err) {
    console.error("[adminAuth] User auth error:", err.message);
    return { error: "Invalid or expired authentication token", status: 401 };
  }
}

