import Link from "next/link";
import { getLocalizedHref } from "../../lib/siteConfig";
import { locationName, quoteRoutePage, routePagePath } from "../../lib/transfers/routePages";

// Links to transfer route pages with each route's starting price. Used on the
// route pages ("other transfers from …") and under the transfer calculator.
export default function RouteLinks({ routes, lang, pricing }) {
  if (!routes.length) return null;
  return (
    <ul className="landing-route-links">
      {routes.map((route) => {
        const quote = quoteRoutePage(route, pricing, lang);
        return (
          <li key={route.slug}>
            <Link href={getLocalizedHref(routePagePath(route), lang)} prefetch={false}>
              <span>
                {locationName(route.from, lang)} → {locationName(route.to, lang)}
              </span>
              {quote?.minFare != null ? <small dir="ltr">₾{quote.minFare}+</small> : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
