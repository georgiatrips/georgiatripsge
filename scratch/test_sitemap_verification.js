import { listFirestoreTours } from "../app/lib/toursFirestore.js";

async function verifySitemap() {
  console.log("=== Testing GeorgiaTrips Sitemap (/sitemap.xml) ===\n");

  const res = await fetch("http://localhost:3000/sitemap.xml");
  console.log(`Response Status: ${res.status}`);
  console.log(`Content-Type: ${res.headers.get("content-type")}`);

  if (res.status !== 200) {
    console.error(`✗ Failed to fetch sitemap: Status ${res.status}`);
    process.exit(1);
  }

  const xml = await res.text();

  // Basic XML structure check
  if (!xml.startsWith("<?xml") || !xml.includes("<urlset")) {
    console.error("✗ Invalid XML or urlset missing!");
    process.exit(1);
  }
  console.log("✓ Valid XML format with <urlset>");

  // Extract all <loc>
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  console.log(`Total URLs in sitemap: ${locs.length}`);

  let failed = 0;

  // 1. Forbidden URLs check
  const forbiddenPatterns = [
    "/coupons",
    "/admin",
    "/login",
    "/booking",
    "/api",
    "/_next",
  ];

  for (const loc of locs) {
    for (const fp of forbiddenPatterns) {
      if (loc.includes(fp)) {
        console.error(`✗ Forbidden URL in sitemap: ${loc} (matches ${fp})`);
        failed++;
      }
    }
    // Check if /posts/{id} exists
    if (loc.match(/\/posts\/[^/?#]+/)) {
      console.error(`✗ Disallowed dynamic post detail URL in sitemap: ${loc}`);
      failed++;
    }
  }

  // 2. Verify all tours are strictly Firestore tours
  const firestoreTours = await listFirestoreTours();
  const firestoreTourIds = new Set(firestoreTours.map((t) => t.id));
  console.log(`\nActive Firestore Tours Count: ${firestoreTours.length}`);
  console.log(`Firestore Tour IDs: ${[...firestoreTourIds].join(", ")}`);

  const sitemapTourUrls = locs.filter((l) => l.includes("/tours/"));
  console.log(`Total Tour Detail URLs in sitemap: ${sitemapTourUrls.length}`);

  for (const tourUrl of sitemapTourUrls) {
    const match = tourUrl.match(/\/tours\/([^/?#]+)/);
    if (!match) continue;
    const id = decodeURIComponent(match[1]);
    if (!firestoreTourIds.has(id)) {
      console.error(`✗ Tour URL in sitemap does NOT exist in Firestore: ${tourUrl}`);
      failed++;
    }
  }
  console.log("✓ All tour URLs in sitemap match active Firestore inventory!");

  // 3. Verify Alternates / Hreflang and Dates
  const alternateMatches = [...xml.matchAll(/<xhtml:link[^>]+hreflang="([^"]+)"[^>]+href="([^"]+)"/g)];
  console.log(`Total hreflang alternate links: ${alternateMatches.length}`);

  const xDefaults = alternateMatches.filter((m) => m[1] === "x-default");
  console.log(`Total x-default hreflang links: ${xDefaults.length}`);
  if (xDefaults.length === 0) {
    console.error("✗ Missing x-default alternates in sitemap!");
    failed++;
  } else {
    console.log("✓ x-default alternates present and valid");
  }

  // 4. Sample HTTP Status check on representative URLs (confirm 200 and no redirects)
  const sampleUrls = [
    ...locs.filter((l) => l.endsWith("/en") || l.endsWith("/ka") || l.endsWith("/ru")).slice(0, 3),
    ...locs.filter((l) => l.includes("/tours") && !l.includes("/tours/")).slice(0, 3),
    ...locs.filter((l) => l.includes("/tours-from-batumi")).slice(0, 2),
    ...locs.filter((l) => l.includes("/places") && !l.includes("/places/")).slice(0, 2),
    ...locs.filter((l) => l.includes("/transfers")).slice(0, 2),
    ...sitemapTourUrls.slice(0, 6),
  ];

  console.log(`\n=== Testing HTTP 200 on ${sampleUrls.length} representative sitemap URLs ===`);
  for (const url of sampleUrls) {
    const localUrl = url.replace("https://www.georgiatrips.ge", "http://localhost:3000");
    const testRes = await fetch(localUrl, { redirect: "manual" });
    if (testRes.status === 200) {
      console.log(`✓ 200 OK: ${localUrl}`);
    } else {
      console.error(`✗ ${testRes.status} (Expected 200): ${localUrl} -> Location: ${testRes.headers.get("location")}`);
      failed++;
    }
  }

  console.log("\n==========================================");
  if (failed === 0) {
    console.log("Sitemap validation PASSED with 0 errors!");
  } else {
    console.error(`Sitemap validation FAILED with ${failed} errors.`);
    process.exit(1);
  }
}

verifySitemap();
