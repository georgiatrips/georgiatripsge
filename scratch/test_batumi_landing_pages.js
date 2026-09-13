const BASE_URL = "http://localhost:3000";
const SITE_URL = "https://www.georgiatrips.ge";

const LANDING_ROUTES = [
  "/tours-from-batumi",
  "/private-tours-batumi",
  "/things-to-do-in-batumi",
  "/waterfalls-near-batumi",
  "/batumi-airport-transfer",
];

const LOCALES = ["en", "ru", "ka"];

async function testBatumiLandingPages() {
  console.log("==================================================");
  console.log("🧪 TESTING BATUMI HIGH-VALUE LANDING PAGES");
  console.log("==================================================");

  // 1. Verify HTTP 200, Canonical URLs, and Localized Titles
  console.log("\n--- 1. Testing HTTP Status, Canonical URLs & Titles ---");
  for (const route of LANDING_ROUTES) {
    for (const lang of LOCALES) {
      const url = `${BASE_URL}/${lang}${route}`;
      const res = await fetch(url, {
        headers: {
          "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
          "x-forwarded-for": "66.249.66.50",
        },
      });
      if (res.status !== 200) {
        throw new Error(`Expected 200 for ${url}, got ${res.status}`);
      }

      const html = await res.text();

      // Check self-canonical tag
      const canonicalMatch = html.match(/<link rel="canonical" href="([^"]+)"/i);
      if (!canonicalMatch) {
        throw new Error(`Missing canonical link on ${url}`);
      }
      const canonical = canonicalMatch[1];
      const expectedCanonical = `${SITE_URL}/${lang}${route}`;
      if (canonical !== expectedCanonical) {
        throw new Error(`Canonical mismatch on ${url}: got ${canonical}, expected ${expectedCanonical}`);
      }

      // Check Title
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : "";
      if (!title || title.includes("GeorgiaTrips | GeorgiaTrips")) {
        throw new Error(`Invalid title on ${url}: ${title}`);
      }

      // Check JSON-LD Structured Data
      const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
      if (!jsonLdMatches) {
        throw new Error(`Missing JSON-LD on ${url}`);
      }

      let parsedCount = 0;
      let hasFaq = false;
      for (const block of jsonLdMatches) {
        const rawJson = block.replace(/<\/?script[^>]*>/gi, "");
        try {
          const parsed = JSON.parse(rawJson);
          parsedCount++;
          const items = parsed["@graph"] || [parsed];
          for (const item of items) {
            const types = Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]];
            if (types.includes("FAQPage")) hasFaq = true;
            if (item.aggregateRating) {
              throw new Error(`Unverified aggregateRating found on ${url}`);
            }
          }
        } catch (e) {
          throw new Error(`Invalid JSON-LD on ${url}: ${e.message}`);
        }
      }

      console.log(`✅ [${res.status}] ${url} | Canonical: OK (${canonical}) | Title: "${title.slice(0, 40)}..." | FAQ schema: ${hasFaq}`);
    }
  }

  // 2. Check Sitemap XML for landing page entries
  console.log("\n--- 2. Testing Sitemap.xml Entries ---");
  const sitemapRes = await fetch(`${BASE_URL}/sitemap.xml`, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" },
  });
  const sitemapXml = await sitemapRes.text();

  for (const route of LANDING_ROUTES) {
    for (const lang of LOCALES) {
      const expectedLoc = `${SITE_URL}/${lang}${route}`;
      if (!sitemapXml.includes(expectedLoc)) {
        throw new Error(`Sitemap missing entry for: ${expectedLoc}`);
      }
    }
    console.log(`✅ Sitemap contains all multilingual URLs for ${route}`);
  }

  console.log("\n==================================================");
  console.log("🎉 ALL 5 BATUMI LANDING PAGES VERIFIED SUCCESSFULLY!");
  console.log("==================================================");
}

testBatumiLandingPages().catch((err) => {
  console.error("❌ Test error:", err);
  process.exit(1);
});
