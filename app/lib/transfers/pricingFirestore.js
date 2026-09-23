import { db } from "../firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { DEFAULT_TRANSFER_PRICING, normalizeTransferPricing } from "./pricing";

const pricingRef = () => doc(db, "settings", "transfer_pricing");

/** Saved pricing, or the built-in defaults when nothing was saved yet. */
export async function getTransferPricing() {
  const snap = await getDoc(pricingRef());
  if (!snap.exists()) return normalizeTransferPricing(DEFAULT_TRANSFER_PRICING);
  return normalizeTransferPricing(snap.data());
}

export async function saveTransferPricing(pricing) {
  const clean = normalizeTransferPricing(pricing);
  await setDoc(pricingRef(), { ...clean, updatedAt: serverTimestamp() });
  return clean;
}
