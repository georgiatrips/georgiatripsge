import { BASE_METADATA, NOINDEX_ROBOTS } from "../lib/baseMetadata";
import { getCookieLocale } from "../lib/server/cookieLocale";
import SiteDocument from "../components/site/SiteDocument";

export { viewport } from "../lib/baseMetadata";

export const metadata = {
  ...BASE_METADATA,
  title: "Admin Panel | GeorgiaTrips",
  robots: NOINDEX_ROBOTS,
};

// Root layout for a non-localized route: the language comes from the
// visitor's saved preference.
export default async function AdminLayout({ children }) {
  return <SiteDocument lang={await getCookieLocale()}>{children}</SiteDocument>;
}
