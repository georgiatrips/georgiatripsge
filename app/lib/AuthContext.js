"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db, onAuthStateChanged, logOut } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
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
        try {
          localStorage.removeItem("gt_user_logged_in");
          localStorage.removeItem("gt_user_display_name");
        } catch (_) {}
      }
    });
    return unsubscribe;
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
