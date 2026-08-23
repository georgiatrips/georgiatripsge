"use client";

import { auth } from "./firebase";

export async function adminFetch(url, options = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Authentication required");

  const token = await user.getIdToken();
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  return fetch(url, { ...options, headers });
}
