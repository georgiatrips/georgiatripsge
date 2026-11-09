import { db } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

// Seasonal decoration (snow in winter, etc.), switched on and off from the
// admin. Stored in settings/site_effects, which the public can read.
const SETTINGS_COLLECTION = "settings";
const SETTINGS_DOC = "site_effects";

export const SITE_EFFECTS = [
  { value: "off", label: "გამორთული", hint: "საიტზე ეფექტი არ ჩანს." },
  { value: "snow", label: "❄️ თოვლი", hint: "ზამთარი — თეთრი ფიფქები ნელა ცვივა." },
  { value: "petals", label: "🌸 ყვავილის ფურცლები", hint: "გაზაფხული — ვარდისფერი ფურცლები." },
  { value: "sparkles", label: "☀️ მზის ნაპერწკლები", hint: "ზაფხული — ოქროსფერი წერტილები ნელა ადის ზემოთ." },
  { value: "leaves", label: "🍂 შემოდგომის ფოთლები", hint: "შემოდგომა — ნარინჯისფერი ფოთლები." },
];

export const SITE_EFFECT_DENSITIES = [
  { value: "rare", label: "ძალიან იშვიათი" },
  { value: "normal", label: "ცოტა მეტი" },
];

export const SITE_EFFECT_PAGES = [
  { value: "all", label: "ყველა გვერდზე" },
  { value: "home", label: "მხოლოდ მთავარ გვერდზე" },
];

export const DEFAULT_SITE_EFFECTS = { effect: "off", density: "rare", pages: "all" };

const oneOf = (value, list, fallback) => (list.some((item) => item.value === value) ? value : fallback);

export function normalizeSiteEffects(data) {
  const src = data && typeof data === "object" ? data : {};
  return {
    effect: oneOf(src.effect, SITE_EFFECTS, DEFAULT_SITE_EFFECTS.effect),
    density: oneOf(src.density, SITE_EFFECT_DENSITIES, DEFAULT_SITE_EFFECTS.density),
    pages: oneOf(src.pages, SITE_EFFECT_PAGES, DEFAULT_SITE_EFFECTS.pages),
  };
}

export async function getSiteEffects() {
  const snap = await getDoc(doc(db, SETTINGS_COLLECTION, SETTINGS_DOC));
  return normalizeSiteEffects(snap.exists() ? snap.data() : null);
}

export async function updateSiteEffects(settings) {
  const clean = normalizeSiteEffects(settings);
  await setDoc(doc(db, SETTINGS_COLLECTION, SETTINGS_DOC), { ...clean, updatedAt: serverTimestamp() }, { merge: true });
  return clean;
}
