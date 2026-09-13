async function testRobotsTxt() {
  console.log("=== 1. Testing /robots.txt Output ===");
  const res = await fetch("http://localhost:3000/robots.txt");
  const text = await res.text();
  console.log(`Status: ${res.status}`);
  console.log(`Content-Type: ${res.headers.get("content-type")}`);
  console.log("\n--- robots.txt content ---");
  console.log(text);
  console.log("--------------------------\n");

  const requiredDisallows = [
    "/admin",
    "/login",
    "/coupons",
    "/booking",
    "/api",
    "/ka/admin",
    "/en/admin",
    "/ru/login",
    "/ka/coupons",
    "/en/coupons",
    "/ka/booking",
    "/en/booking",
  ];

  let missing = 0;
  for (const r of requiredDisallows) {
    if (text.includes(`Disallow: ${r}`) || text.includes(`Disallow: ${r}/`) || text.includes(`Disallow: ${r}/*`)) {
      console.log(`✓ Found disallow rule for: ${r}`);
    } else {
      console.error(`✗ Missing disallow rule for: ${r}`);
      missing++;
    }
  }

  if (text.includes("Allow: /")) {
    console.log("✓ Found Allow: / for public crawlability");
  } else {
    console.error("✗ Missing Allow: /");
    missing++;
  }

  if (text.includes("sitemap.xml")) {
    console.log("✓ Found Sitemap reference");
  } else {
    console.error("✗ Missing Sitemap reference");
    missing++;
  }

  return missing === 0;
}

async function testPageRobotsMeta() {
  console.log("\n=== 2. Testing Page Robots Metadata ===");

  const privatePages = [
    { url: "http://localhost:3000/ka/admin", name: "Admin KA" },
    { url: "http://localhost:3000/en/admin", name: "Admin EN" },
    { url: "http://localhost:3000/ka/login", name: "Login KA" },
    { url: "http://localhost:3000/ru/login", name: "Login RU" },
    { url: "http://localhost:3000/ka/coupons", name: "Coupons KA" },
    { url: "http://localhost:3000/en/coupons", name: "Coupons EN" },
    { url: "http://localhost:3000/ka/booking/status", name: "Booking Status KA" },
    { url: "http://localhost:3000/en/booking/status", name: "Booking Status EN" },
  ];

  const publicPages = [
    { url: "http://localhost:3000/ka", name: "Homepage KA" },
    { url: "http://localhost:3000/en/tours", name: "Tour Catalog EN" },
    { url: "http://localhost:3000/ru/places", name: "Places RU" },
    { url: "http://localhost:3000/ka/transfers", name: "Transfers KA" },
    { url: "http://localhost:3000/en/tours/ZvCYh5V4wEqWkUp622RX", name: "Tour Detail EN" },
  ];

  let failed = 0;

  // Test private pages: MUST have noindex
  for (const p of privatePages) {
    const res = await fetch(p.url);
    const html = await res.text();
    const hasNoIndex = html.includes('name="robots" content="noindex, nofollow"') ||
                       html.includes('content="noindex, nofollow"') ||
                       html.includes('name="robots" content="noindex');
    if (hasNoIndex) {
      console.log(`✓ PASS (Private): ${p.name} (${p.url}) -> contains noindex`);
    } else {
      console.error(`✗ FAIL (Private): ${p.name} (${p.url}) -> MISSING noindex metadata!`);
      failed++;
    }
  }

  // Test public pages: MUST NOT have noindex
  for (const p of publicPages) {
    const res = await fetch(p.url);
    const html = await res.text();
    const hasNoIndex = html.includes('content="noindex');
    if (!hasNoIndex) {
      console.log(`✓ PASS (Public): ${p.name} (${p.url}) -> indexable (no noindex tag)`);
    } else {
      console.error(`✗ FAIL (Public): ${p.name} (${p.url}) -> Accidental noindex detected!`);
      failed++;
    }
  }

  return failed === 0;
}

async function run() {
  const robotsOk = await testRobotsTxt();
  const metaOk = await testPageRobotsMeta();

  console.log("\n==========================================");
  if (robotsOk && metaOk) {
    console.log("All robots & private page indexing tests PASSED!");
  } else {
    console.error("Some tests FAILED!");
    process.exit(1);
  }
}

run();
