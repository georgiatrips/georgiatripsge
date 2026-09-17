"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db, onAuthStateChanged, logOut as fbLogOut } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading, null = logged out, object = logged in

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (cancelled) return;

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
              createdAt: new Date().toISOString(),
            });
          }
        } catch (e) {
          console.error("Error fetching/creating user data", e);
        }

        if (cancelled) return;

        // Add isAdmin to the user object
        const enhancedUser = Object.assign(firebaseUser, { isAdmin });
        setUser(enhancedUser);

        // Persist display name to localStorage for instant paint on next load
        try {
          const name = firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "";
          localStorage.setItem("gt_user_logged_in", "true");
          localStorage.setItem("gt_user_display_name", name);
          if (typeof document !== "undefined") {
            document.documentElement.setAttribute("data-auth", "in");
            document.documentElement.style.setProperty("--gt-user-name", JSON.stringify(name));
          }
        } catch (_) {}
      } else {
        setUser(null);
        if (typeof document !== "undefined") {
          document.documentElement.removeAttribute("data-auth");
          document.documentElement.style.removeProperty("--gt-user-name");
        }
        try {
          localStorage.removeItem("gt_user_logged_in");
          localStorage.removeItem("gt_user_display_name");
        } catch (_) {}
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const handleLogOut = async () => {
    try {
      await fbLogOut();
      setUser(null);
      if (typeof document !== "undefined") {
        document.documentElement.removeAttribute("data-auth");
        document.documentElement.style.removeProperty("--gt-user-name");
      }
      try {
        localStorage.removeItem("gt_user_logged_in");
        localStorage.removeItem("gt_user_display_name");
      } catch (_) {}
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading: user === undefined, logOut: handleLogOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
