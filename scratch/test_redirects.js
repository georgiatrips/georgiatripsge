const tests = [
  // Uppercase & Mixed-case Locales
  { url: "http://localhost:3000/EN/tours", expectedStatus: 308, expectedLocation: "/en/tours" },
  { url: "http://localhost:3000/RU/tours", expectedStatus: 308, expectedLocation: "/ru/tours" },
  { url: "http://localhost:3000/KA/tours", expectedStatus: 308, expectedLocation: "/ka/tours" },
  { url: "http://localhost:3000/TR/tours", expectedStatus: 308, expectedLocation: "/tr/tours" },
  { url: "http://localhost:3000/AR/tours", expectedStatus: 308, expectedLocation: "/ar/tours" },
  { url: "http://localhost:3000/En/places/vOFTdOn6pi5ixb8WB6UB", expectedStatus: 308, expectedLocation: "/en/places/vOFTdOn6pi5ixb8WB6UB" },
  { url: "http://localhost:3000/rU/tours/ZvCYh5V4wEqWkUp622RX", expectedStatus: 308, expectedLocation: "/ru/tours/ZvCYh5V4wEqWkUp622RX" },

  // Legacy Transport Under Locales
  { url: "http://localhost:3000/ka/transport", expectedStatus: 308, expectedLocation: "/ka/transfers" },
  { url: "http://localhost:3000/en/transport", expectedStatus: 308, expectedLocation: "/en/transfers" },
  { url: "http://localhost:3000/ru/transport", expectedStatus: 308, expectedLocation: "/ru/transfers" },
  { url: "http://localhost:3000/tr/transport", expectedStatus: 308, expectedLocation: "/tr/transfers" },
  { url: "http://localhost:3000/ar/transport", expectedStatus: 308, expectedLocation: "/ar/transfers" },

  // Combined Uppercase + Transport
  { url: "http://localhost:3000/EN/transport", expectedStatus: 308, expectedLocation: "/en/transfers" },
  { url: "http://localhost:3000/RU/transport", expectedStatus: 308, expectedLocation: "/ru/transfers" },
  { url: "http://localhost:3000/KA/transport", expectedStatus: 308, expectedLocation: "/ka/transfers" },

  // Existing Correct /{locale}/transfers (should NOT redirect)
  { url: "http://localhost:3000/ka/transfers", expectedStatus: 200, expectedLocation: null },
  { url: "http://localhost:3000/en/transfers", expectedStatus: 200, expectedLocation: null },
  { url: "http://localhost:3000/ru/transfers", expectedStatus: 200, expectedLocation: null },
  { url: "http://localhost:3000/tr/transfers", expectedStatus: 200, expectedLocation: null },
  { url: "http://localhost:3000/ar/transfers", expectedStatus: 200, expectedLocation: null },

  // Legacy Unprefixed URLs
  { url: "http://localhost:3000/transport", expectedStatus: 308, expectedLocationPrefix: "/transfers" },
  { url: "http://localhost:3000/tours", expectedStatus: 307, expectedLocationPrefix: "/tours" },
];

async function run() {
  console.log("=== Running Comprehensive Locale & Redirect Tests ===\n");
  let failed = 0;

  for (const t of tests) {
    try {
      const res = await fetch(t.url, { redirect: "manual" });
      const location = res.headers.get("location");
      let pass = true;

      if (res.status !== t.expectedStatus) {
        pass = false;
      }
      if (t.expectedLocation !== undefined && location !== t.expectedLocation) {
        pass = false;
      }
      if (t.expectedLocationPrefix !== undefined && (!location || !location.endsWith(t.expectedLocationPrefix))) {
        pass = false;
      }

      if (pass) {
        console.log(`✓ PASS: ${t.url} -> Status ${res.status}${location ? ` -> ${location}` : ""}`);
      } else {
        console.error(`✗ FAIL: ${t.url} -> Got Status ${res.status}, Location ${location} | Expected Status ${t.expectedStatus}, Location ${t.expectedLocation || t.expectedLocationPrefix}`);
        failed++;
      }
    } catch (err) {
      console.error(`✗ ERROR: ${t.url} -> ${err.message}`);
      failed++;
    }
  }

  console.log(`\n========================================`);
  if (failed === 0) {
    console.log(`All ${tests.length} redirect tests PASSED successfully!`);
  } else {
    console.error(`${failed} tests FAILED.`);
    process.exit(1);
  }
}

run();
