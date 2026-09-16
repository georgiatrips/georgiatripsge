import { getContentIndex } from "../lib/server/cachedData";

// Slug/ID pairs for every tour and place, read by proxy.js to 308-redirect old
// ID URLs to their slug and to answer unknown ones with a real 404 before any
// HTML is streamed. Static (CDN-cached) and refreshed hourly or when the admin
// panel saves content. The ".json" path keeps it outside the proxy matcher.
export const revalidate = 3600;

export async function GET() {
  const index = await getContentIndex();
  return Response.json(index, {
    headers: { "X-Robots-Tag": "noindex" },
  });
}
