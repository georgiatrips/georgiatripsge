const http = require('http');

const PAGES_TO_TEST = [
  { url: '/en', name: 'Homepage (EN)', shouldHaveFaq: true },
  { url: '/ru', name: 'Homepage (RU)', shouldHaveFaq: true },
  { url: '/ka', name: 'Homepage (KA)', shouldHaveFaq: true },
  { url: '/en/tours/ZvCYh5V4wEqWkUp622RX', name: 'Tour Detail (EN)', shouldHaveFaq: false },
  { url: '/ru/tours/ZvCYh5V4wEqWkUp622RX', name: 'Tour Detail (RU)', shouldHaveFaq: false },
  { url: '/en/places/vOFTdOn6pi5ixb8WB6UB', name: 'Place Detail (EN)', shouldHaveFaq: false },
  { url: '/ru/places/vOFTdOn6pi5ixb8WB6UB', name: 'Place Detail (RU)', shouldHaveFaq: false },
  { url: '/en/tours', name: 'Tours Catalog (EN)', shouldHaveFaq: false },
  { url: '/en/transfers', name: 'Transfers (EN)', shouldHaveFaq: false },
  { url: '/en/hotels', name: 'Hotels (EN)', shouldHaveFaq: false },
  { url: '/en/terms', name: 'Terms (EN)', shouldHaveFaq: false },
  { url: '/en/privacy-policy', name: 'Privacy Policy (EN)', shouldHaveFaq: false },
];

function fetchPage(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({ path, statusCode: res.statusCode, html: data });
      });
    }).on('error', reject);
  });
}

function extractAllJsonLd(html) {
  const matches = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  return matches.map(m => m[1]);
}

async function run() {
  console.log('Validating JSON-LD Structured Data across GeorgiaTrips...\n');
  let hasErrors = false;

  for (const page of PAGES_TO_TEST) {
    try {
      const { statusCode, html } = await fetchPage(page.url);
      console.log(`------------------------------------------------------------`);
      console.log(`Page: ${page.name} (${page.url}) [HTTP ${statusCode}]`);

      const jsonLdScripts = extractAllJsonLd(html);
      console.log(`  Found ${jsonLdScripts.length} JSON-LD script block(s)`);

      let hasFaq = false;
      let hasAggregateRating = false;

      for (let i = 0; i < jsonLdScripts.length; i++) {
        const rawJson = jsonLdScripts[i];
        let parsed;
        try {
          parsed = JSON.parse(rawJson);
        } catch (e) {
          console.log(`  [ERROR] JSON-LD Block ${i + 1} Failed to parse JSON: ${e.message}`);
          hasErrors = true;
          continue;
        }

        // Check for aggregateRating
        const jsonString = JSON.stringify(parsed);
        if (jsonString.includes('aggregateRating') || jsonString.includes('ratingValue')) {
          hasAggregateRating = true;
        }

        // Check for FAQPage
        if (jsonString.includes('FAQPage') || jsonString.includes('Question') || jsonString.includes('acceptedAnswer')) {
          hasFaq = true;
        }

        // Output summary of schema types
        const types = [];
        if (parsed['@type']) types.push(parsed['@type']);
        if (Array.isArray(parsed['@graph'])) {
          parsed['@graph'].forEach(g => {
            if (g['@type']) types.push(g['@type']);
          });
        }
        console.log(`  Block ${i + 1} Types:`, JSON.stringify(types));
      }

      // Check aggregateRating rule
      if (hasAggregateRating) {
        console.log(`  [FAIL] Unverified / hard-coded aggregateRating found in JSON-LD!`);
        hasErrors = true;
      } else {
        console.log(`  [PASS] No fake/hard-coded aggregateRating present`);
      }

      // Check FAQPage rule
      if (page.shouldHaveFaq) {
        if (hasFaq) {
          console.log(`  [PASS] FAQPage schema correctly present for visible FAQ content`);
        } else {
          console.log(`  [WARN] Expected FAQPage schema on homepage`);
        }
      } else {
        if (hasFaq) {
          console.log(`  [FAIL] FAQPage schema unexpectedly emitted on non-FAQ page!`);
          hasErrors = true;
        } else {
          console.log(`  [PASS] No unwanted FAQPage schema on this page`);
        }
      }
    } catch (err) {
      console.error(`Failed to fetch ${page.url}:`, err.message);
      hasErrors = true;
    }
  }

  console.log(`\n============================================================`);
  console.log(`Structured Data Validation Result: ${hasErrors ? 'FAILED' : 'ALL TESTS PASSED WITH CLEAN STRUCTURED DATA'}`);
}

run();
