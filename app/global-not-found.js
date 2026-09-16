import { BASE_METADATA, NOINDEX_ROBOTS } from "./lib/baseMetadata";
import SiteDocument from "./components/site/SiteDocument";
import NotFoundContent from "./components/site/NotFoundContent";

export { viewport } from "./lib/baseMetadata";

// 404 for URLs that match no route at all (there is no single root layout to
// build one from). Rendered in English, the site's x-default language.
export const metadata = {
  ...BASE_METADATA,
  title: "Page Not Found | GeorgiaTrips",
  robots: NOINDEX_ROBOTS,
};

export default function GlobalNotFound() {
  return (
    <SiteDocument lang="en">
      <NotFoundContent />
    </SiteDocument>
  );
}
