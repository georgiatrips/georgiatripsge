import { cookies } from "next/headers";
import { getRequestLocale } from "../siteConfig";

// Language for routes without a /[locale] segment (admin, login, booking,
// coupons), taken from the preference cookie the language switcher sets.
export async function getCookieLocale() {
  const cookieStore = await cookies();
  return getRequestLocale(cookieStore.get("gt_language")?.value);
}
