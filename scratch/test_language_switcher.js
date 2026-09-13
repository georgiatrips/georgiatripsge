import { getLocalizedHref, stripLocaleFromPath, extractLocaleFromPath, HREFLANG_MAP, SUPPORTED_LANGUAGES } from "../app/lib/siteConfig.js";

console.log("=== Testing Language Switcher Utilities ===");

const testCases = [
  // 1. Homepage
  { input: "/", lang: "en", expected: "/en" },
  { input: "/ka", lang: "ru", expected: "/ru" },
  { input: "/en", lang: "ka", expected: "/ka" },
  { input: "/ru", lang: "tr", expected: "/tr" },
  { input: "/tr", lang: "ar", expected: "/ar" },

  // 2. Tour Listing
  { input: "/en/tours", lang: "ru", expected: "/ru/tours" },
  { input: "/ka/tours", lang: "en", expected: "/en/tours" },
  { input: "/tours", lang: "ka", expected: "/ka/tours" },

  // 3. Tour Detail
  { input: "/ru/tours/ZvCYh5V4wEqWkUp622RX", lang: "en", expected: "/en/tours/ZvCYh5V4wEqWkUp622RX" },
  { input: "/ka/tours/martvili-canyon-tour", lang: "ru", expected: "/ru/tours/martvili-canyon-tour" },

  // 4. Place Detail
  { input: "/en/places/vOFTdOn6pi5ixb8WB6UB", lang: "ru", expected: "/ru/places/vOFTdOn6pi5ixb8WB6UB" },
  { input: "/places/vOFTdOn6pi5ixb8WB6UB", lang: "en", expected: "/en/places/vOFTdOn6pi5ixb8WB6UB" },

  // 5. Transfers
  { input: "/ka/transfers", lang: "en", expected: "/en/transfers" },
  { input: "/en/transfers", lang: "ru", expected: "/ru/transfers" },

  // 6. Query params and hashes preserved
  { input: "/en/tours?price=asc&duration=1#faq", lang: "ru", expected: "/ru/tours?price=asc&duration=1#faq" },
  { input: "/ka/places/vOFTdOn6pi5ixb8WB6UB?ref=home#gallery", lang: "en", expected: "/en/places/vOFTdOn6pi5ixb8WB6UB?ref=home#gallery" },

  // 7. No double prefix
  { input: "/en/en/tours", lang: "ru", expected: "/ru/en/tours" }, // standard strip strips first locale
  { input: "/ru/tours", lang: "ru", expected: "/ru/tours" },
];

let failed = 0;
for (const tc of testCases) {
  const result = getLocalizedHref(tc.input, tc.lang);
  if (result === tc.expected) {
    console.log(`✓ PASS: ${tc.input} + [${tc.lang}] -> ${result}`);
  } else {
    console.error(`✗ FAIL: ${tc.input} + [${tc.lang}] -> got ${result}, expected ${tc.expected}`);
    failed++;
  }
}

// Check HREFLANG_MAP completeness
for (const lang of SUPPORTED_LANGUAGES) {
  if (HREFLANG_MAP[lang]) {
    console.log(`✓ HREFLANG for ${lang}: ${HREFLANG_MAP[lang]}`);
  } else {
    console.error(`✗ Missing HREFLANG for ${lang}`);
    failed++;
  }
}

if (failed === 0) {
  console.log("\nAll unit tests PASSED successfully!");
} else {
  console.error(`\n${failed} tests FAILED!`);
  process.exit(1);
}
