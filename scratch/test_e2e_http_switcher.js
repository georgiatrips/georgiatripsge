const routes = [
  { url: "http://localhost:3000/ka", name: "Homepage KA" },
  { url: "http://localhost:3000/en", name: "Homepage EN" },
  { url: "http://localhost:3000/ru", name: "Homepage RU" },
  { url: "http://localhost:3000/en/tours", name: "Tour Catalog EN" },
  { url: "http://localhost:3000/ru/tours", name: "Tour Catalog RU" },
  { url: "http://localhost:3000/ka/transfers", name: "Transfers KA" },
  { url: "http://localhost:3000/en/tours/ZvCYh5V4wEqWkUp622RX", name: "Tour Detail EN" },
  { url: "http://localhost:3000/ru/places/vOFTdOn6pi5ixb8WB6UB", name: "Place Detail RU" },
];

async function run() {
  console.log("=== Testing Language Switcher HTTP Responses ===");
  let failed = 0;

  for (const r of routes) {
    try {
      const res = await fetch(r.url);
      const html = await res.text();
      console.log(`\nRoute: ${r.name} (${r.url}) -> Status: ${res.status}`);

      if (res.status !== 200) {
        console.error(`✗ Expected 200, got ${res.status}`);
        failed++;
        continue;
      }

      // Check for <html lang="...">
      const langMatch = html.match(/<html[^>]*lang=["']([^"']+)["']/i);
      console.log(`  HTML lang attribute: ${langMatch ? langMatch[1] : "not found"}`);

      // Check for alternates / hreflang links in <head>
      const hreflangs = [...html.matchAll(/<link[^>]*hreflang=["']([^"']+)["'][^>]*href=["']([^"']+)["']/gi)];
      console.log(`  Head alternate hreflang count: ${hreflangs.length}`);

      // Check navbar language switch links
      const navLangLinks = [...html.matchAll(/href=["']([^"']+)["'][^>]*hreflang=["']([^"']+)["']/gi)];
      console.log(`  Navbar crawlable hreflang links: ${navLangLinks.length}`);
      for (const nl of navLangLinks) {
        console.log(`    -> hreflang="${nl[2]}" href="${nl[1]}"`);
      }

      if (navLangLinks.length === 0) {
        // Look for reversed attributes: hreflang before href
        const reverseLinks = [...html.matchAll(/hreflang=["']([^"']+)["'][^>]*href=["']([^"']+)["']/gi)];
        console.log(`  Navbar crawlable links (reversed attr order): ${reverseLinks.length}`);
        for (const nl of reverseLinks) {
          console.log(`    -> hreflang="${nl[1]}" href="${nl[2]}"`);
        }
      }
    } catch (err) {
      console.error(`✗ Error requesting ${r.url}:`, err.message);
      failed++;
    }
  }

  if (failed === 0) {
    console.log("\nAll HTTP route tests PASSED!");
  } else {
    console.error(`\n${failed} HTTP tests FAILED!`);
    process.exit(1);
  }
}

run();
