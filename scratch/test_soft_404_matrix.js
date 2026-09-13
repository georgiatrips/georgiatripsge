const http = require('http');

const TEST_URLS = [
  // 1. Valid Firestore Tours (must be 200)
  { url: '/en/tours/ZvCYh5V4wEqWkUp622RX', expected: 200, label: 'Valid Tour (EN)', expectedTitleSnippet: 'Tropical Adjara' },
  { url: '/ru/tours/ZvCYh5V4wEqWkUp622RX', expected: 200, label: 'Valid Tour (RU)', expectedTitleSnippet: 'Тропическая Аджария' },
  { url: '/ka/tours/ZvCYh5V4wEqWkUp622RX', expected: 200, label: 'Valid Tour (KA)', expectedTitleSnippet: 'ტროპიკული აჭარა' },
  { url: '/en/tours/wJKtWdXcepqoShhtgBxB', expected: 200, label: 'Valid Tour (EN)', expectedTitleSnippet: 'Cave, canyon' },
  { url: '/ru/tours/wJKtWdXcepqoShhtgBxB', expected: 200, label: 'Valid Tour (RU)', expectedTitleSnippet: 'Пещера' },
  { url: '/ka/tours/wJKtWdXcepqoShhtgBxB', expected: 200, label: 'Valid Tour (KA)', expectedTitleSnippet: 'მღვიმე' },
  { url: '/en/tours/xiB7DffCVIS3FSbN9bDc', expected: 200, label: 'Valid Tour (EN)', expectedTitleSnippet: 'secrets of mountainous Adjara' },
  { url: '/ru/tours/xiB7DffCVIS3FSbN9bDc', expected: 200, label: 'Valid Tour (RU)', expectedTitleSnippet: 'тайны горной Аджарии' },
  { url: '/ka/tours/xiB7DffCVIS3FSbN9bDc', expected: 200, label: 'Valid Tour (KA)', expectedTitleSnippet: 'მთიანი აჭარის საიდუმლოებები' },

  // 2. Valid Places (must be 200)
  { url: '/en/places/vOFTdOn6pi5ixb8WB6UB', expected: 200, label: 'Valid Place (EN)', expectedTitleSnippet: 'Tsikhisdziri' },
  { url: '/ru/places/vOFTdOn6pi5ixb8WB6UB', expected: 200, label: 'Valid Place (RU)', expectedTitleSnippet: 'Цихисдзири' },
  { url: '/ka/places/vOFTdOn6pi5ixb8WB6UB', expected: 200, label: 'Valid Place (KA)', expectedTitleSnippet: 'ციხისძირის' },
  { url: '/en/places/VRkDXUdauIj1PJZ6egHg', expected: 200, label: 'Valid Place (EN)', expectedTitleSnippet: 'Martville Canyon' },
  { url: '/ru/places/VRkDXUdauIj1PJZ6egHg', expected: 200, label: 'Valid Place (RU)', expectedTitleSnippet: 'Мартвильский каньон' },
  { url: '/ka/places/VRkDXUdauIj1PJZ6egHg', expected: 200, label: 'Valid Place (KA)', expectedTitleSnippet: 'მარტვილის კანიონი' },

  // 3. Nonexistent / Random Tour IDs (must be 404)
  { url: '/en/tours/nonexistent', expected: 404, label: 'Missing Tour (EN)' },
  { url: '/ru/tours/nonexistent', expected: 404, label: 'Missing Tour (RU)' },
  { url: '/ka/tours/nonexistent', expected: 404, label: 'Missing Tour (KA)' },
  { url: '/en/tours/fake-random-tour-123', expected: 404, label: 'Random Tour (EN)' },
  { url: '/ru/tours/fake-random-tour-123', expected: 404, label: 'Random Tour (RU)' },
  { url: '/ka/tours/fake-random-tour-123', expected: 404, label: 'Random Tour (KA)' },
  { url: '/en/tours/promethe-martvili', expected: 404, label: 'Old Static Tour (EN)' },
  { url: '/ru/tours/adjara-mountains', expected: 404, label: 'Old Static Tour (RU)' },
  { url: '/ka/tours/kazbegi-gergeti', expected: 404, label: 'Old Static Tour (KA)' },

  // 4. Nonexistent / Random Place IDs (must be 404)
  { url: '/en/places/nonexistent', expected: 404, label: 'Missing Place (EN)' },
  { url: '/ru/places/nonexistent', expected: 404, label: 'Missing Place (RU)' },
  { url: '/ka/places/nonexistent', expected: 404, label: 'Missing Place (KA)' },
  { url: '/en/places/fake-random-place-456', expected: 404, label: 'Random Place (EN)' },
  { url: '/ru/places/fake-random-place-456', expected: 404, label: 'Random Place (RU)' },
  { url: '/ka/places/fake-random-place-456', expected: 404, label: 'Random Place (KA)' },
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

async function run() {
  console.log('Testing Soft 404 Prevention & Dynamic Entity Verification...\n');
  let hasErrors = false;

  for (const item of TEST_URLS) {
    try {
      const res = await fetchPage(item.url);
      const isStatusMatch = res.statusCode === item.expected;
      
      // Extract title
      const titleMatch = res.html.match(/<title[^>]*>([^<]*)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : '';

      let testPassed = isStatusMatch;

      // For 404s:
      if (item.expected === 404) {
        if (res.statusCode === 200) {
          console.log(`[FAIL] ${item.label}: ${item.url} -> Returned HTTP 200 instead of 404!`);
          testPassed = false;
        } else if (res.html.includes('id="tour-booking-form"')) {
          console.log(`[FAIL] ${item.label}: ${item.url} -> 404 response contains tour booking form!`);
          testPassed = false;
        } else {
          console.log(`[PASS] ${item.label}: ${item.url} -> HTTP ${res.statusCode} (Real 404 Not Found)`);
        }
      }

      // For 200s:
      if (item.expected === 200) {
        if (res.statusCode !== 200) {
          console.log(`[FAIL] ${item.label}: ${item.url} -> Expected 200, got ${res.statusCode}`);
          testPassed = false;
        } else if (item.expectedTitleSnippet && !title.toLowerCase().includes(item.expectedTitleSnippet.toLowerCase())) {
          console.log(`[FAIL] ${item.label}: ${item.url} -> Title "${title}" does not contain expected "${item.expectedTitleSnippet}"`);
          testPassed = false;
        } else {
          console.log(`[PASS] ${item.label}: ${item.url} -> HTTP 200 (OK) | Title: "${title}"`);
        }
      }

      if (!testPassed) hasErrors = true;
    } catch (err) {
      console.error(`Failed to test ${item.url}:`, err.message);
      hasErrors = true;
    }
  }

  console.log(`\n============================================================`);
  console.log(`Soft 404 Test Result: ${hasErrors ? 'FAILED' : 'ALL TESTS PASSED WITH REAL 404/200 STATUS CODES'}`);
}

run();
