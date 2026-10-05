import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/server/adminAuth";
import { nameFromMapLink, parseMapCoordinates } from "../../../lib/transfers/customPlaces";

// Opens a Google Maps share link for the admin's "transfer places" form:
// follows maps.app.goo.gl redirects to the full URL and reads the place name
// and, when the URL has them, the coordinates. Links shared from the phone
// app often carry only ?q=Name&ftid=…; the form then looks the name up and
// lets the admin confirm the pin.
export const dynamic = "force-dynamic";

const ALLOWED_HOST = /^(maps\.app\.goo\.gl|goo\.gl|(www\.|maps\.)?google\.[a-z.]+)$/i;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36";

function allowed(raw) {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && ALLOWED_HOST.test(u.hostname) ? u : null;
  } catch {
    return null;
  }
}

export async function POST(request) {
  const admin = await requireAdmin(request);
  if (admin.error) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const { url } = await request.json().catch(() => ({}));
  let current = allowed(String(url || "").trim());
  if (!current) return NextResponse.json({ error: "not_a_google_maps_link" }, { status: 400 });

  try {
    // Redirects are followed by hand so every hop stays on Google.
    for (let hop = 0; hop < 6; hop++) {
      const res = await fetch(current, {
        redirect: "manual",
        headers: { "User-Agent": UA, "Accept-Language": "en" },
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      });
      const next = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null;
      // A hop off Google Maps (e.g. consent.google.com) ends the walk; the
      // last Maps URL usually already holds the name or coordinates.
      const nextUrl = next ? allowed(new URL(next, current).href) : null;
      if (!nextUrl) break;
      current = nextUrl;
    }

    const finalUrl = current.href;
    const point = parseMapCoordinates(finalUrl);
    const q = current.searchParams.get("q");
    const name = nameFromMapLink(finalUrl) || (q && !parseMapCoordinates(q) ? q : "");
    return NextResponse.json({ url: finalUrl, name, ...(point || {}) });
  } catch (err) {
    console.warn("[api/admin/map-link]", err.message);
    return NextResponse.json({ error: "fetch_failed" }, { status: 502 });
  }
}
