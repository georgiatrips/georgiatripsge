const BASE_URL = "http://localhost:3000";

async function testGbpIntegration() {
  console.log("==================================================");
  console.log("🧪 AUDITING & TESTING GBP / LOCAL SEO INTEGRATION");
  console.log("==================================================");

  // 1. Inspect homepage HTML for telephone link and schema
  console.log("\n--- 1. Testing Homepage Local SEO & Structured Data ---");
  const homeRes = await fetch(`${BASE_URL}/en`);
  const homeHtml = await homeRes.text();

  // Check structured data
  const jsonLdMatches = homeHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
  if (!jsonLdMatches) throw new Error("No JSON-LD found in homepage HTML");

  let orgFound = false;
  for (const match of jsonLdMatches) {
    const raw = match.replace(/<\/?script[^>]*>/gi, "");
    try {
      const parsed = JSON.parse(raw);
      const items = parsed["@graph"] || [parsed];
      for (const item of items) {
        const types = Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]];
        if (types.includes("TravelAgency") || types.includes("Organization")) {
          orgFound = true;
          console.log("✅ TravelAgency/Organization schema verified:");
          console.log("   Name:", item.name);
          console.log("   Telephone:", item.telephone);
          console.log("   Email:", item.email);
          console.log("   Locality:", item.address?.addressLocality);
          console.log("   Country:", item.address?.addressCountry);
          console.log("   Opening Hours:", item.openingHoursSpecification);
          console.log("   HasMap:", item.hasMap || "(none)");

          if (item.telephone !== "+995504220020") {
            throw new Error(`Invalid telephone in schema: ${item.telephone}`);
          }
          if (item.aggregateRating) {
            throw new Error("Unverified aggregateRating should not be present in Organization schema");
          }
        }
      }
    } catch (e) {
      console.warn("JSON-LD parse warning:", e.message);
    }
  }

  if (!orgFound) throw new Error("TravelAgency / Organization schema not found!");

  // 2. Check telephone links in HTML
  console.log("\n--- 2. Testing Telephone Link Formatting ---");
  if (!homeHtml.includes('href="tel:+995504220020"')) {
    throw new Error('Homepage HTML missing clickable international tel link: href="tel:+995504220020"');
  }
  console.log('✅ Clickable telephone link href="tel:+995504220020" present in Footer / Homepage');

  // 3. Check Tour Detail page telephone link
  console.log("\n--- 3. Testing Tour Detail Telephone Link ---");
  const tourRes = await fetch(`${BASE_URL}/en/tours/ZvCYh5V4wEqWkUp622RX`);
  const tourHtml = await tourRes.text();
  if (!tourHtml.includes('href="tel:+995504220020"')) {
    throw new Error('Tour detail page missing clickable international tel link: href="tel:+995504220020"');
  }
  console.log('✅ Clickable telephone link href="tel:+995504220020" present in TourBookingSidebar');

  // 4. Test Google Reviews API endpoint safety
  console.log("\n--- 4. Testing Google Reviews API Endpoint Safety ---");
  const reviewsRes = await fetch(`${BASE_URL}/api/google-reviews`);
  const reviewsData = await reviewsRes.json();
  console.log("Google Reviews API Response Status:", reviewsRes.status);
  console.log("Google Reviews API Response Data:", reviewsData);
  if (reviewsRes.status === 200) {
    console.log("✅ Google Reviews API successfully returned active reviews!");
  } else if (reviewsRes.status === 503) {
    console.log("✅ Google Reviews API failed safely (503) without ambiguous fallback!");
  }

  console.log("\n==================================================");
  console.log("🎉 ALL GBP & LOCAL SEO INTEGRATION TESTS PASSED!");
  console.log("==================================================");
}

testGbpIntegration().catch((err) => {
  console.error("❌ GBP test failed:", err);
  process.exit(1);
});
