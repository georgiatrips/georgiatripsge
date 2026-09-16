"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { whenIdle } from "./whenIdle";

// The Firebase SDK is loaded after the page is idle instead of with the page:
// the header already paints the signed-in state from localStorage (see the
// inline script in the root layout), so nothing visible waits for it.
let firebasePromise;
function loadFirebase() {
  firebasePromise ??= Promise.all([import("./firebase"), import("firebase/firestore")]).then(
    ([fb, fs]) => ({ ...fb, doc: fs.doc, getDoc: fs.getDoc, setDoc: fs.setDoc })
  );
  return firebasePromise;
}

async function logOut() {
  const fb = await loadFirebase();
  await fb.logOut();
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    let unsubscribe = () => {};
    let cancelled = false;
    const cancelIdle = whenIdle(async () => {
      const { auth, db, onAuthStateChanged, doc, getDoc, setDoc } = await loadFirebase();
      if (cancelled) return;
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          let isAdmin = false;
          try {
            const userRef = doc(db, "users", firebaseUser.uid);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
              isAdmin = userDoc.data().isAdmin === true;
            } else {
              // Create user document if it does not exist
              await setDoc(userRef, {
                uid: firebaseUser.uid,
                email: firebaseUser.email || "",
                displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "",
                isAdmin: false,
                createdAt: new Date().toISOString()
              });
            }
          } catch (e) {
            console.error("Error fetching/creating user data", e);
          }
          
          // Add isAdmin to the user object
          const enhancedUser = Object.assign(firebaseUser, { isAdmin });
          setUser(enhancedUser);

          // Persist display name to localStorage for instant paint on next load
          try {
            const name = firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "";
            localStorage.setItem("gt_user_logged_in", "true");
            localStorage.setItem("gt_user_display_name", name);
          } catch (_) {}
        } else {
          setUser(null);
          document.documentElement.removeAttribute("data-auth");
          try {
            localStorage.removeItem("gt_user_logged_in");
            localStorage.removeItem("gt_user_display_name");
          } catch (_) {}
        }
      });
    });
    return () => {
      cancelled = true;
      cancelIdle();
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
