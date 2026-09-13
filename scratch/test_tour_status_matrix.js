const http = require('http');

const TEST_CASES = [
  // Known Valid Firestore Tours
  { id: 'ZvCYh5V4wEqWkUp622RX', expectedStatus: 200, type: 'VALID_FIRESTORE' },
  { id: 'wJKtWdXcepqoShhtgBxB', expectedStatus: 200, type: 'VALID_FIRESTORE' },
  { id: 'xiB7DffCVIS3FSbN9bDc', expectedStatus: 200, type: 'VALID_FIRESTORE' },

  // Old / Removed Static Tour IDs
  { id: 'promethe-martvili', expectedStatus: 404, type: 'REMOVED_STATIC' },
  { id: 'adjara-mountains', expectedStatus: 404, type: 'REMOVED_STATIC' },
  { id: 'kazbegi-gergeti', expectedStatus: 404, type: 'REMOVED_STATIC' },
  { id: 'mtirala', expectedStatus: 404, type: 'REMOVED_STATIC' },
  { id: 'tbilisi-mcxeta', expectedStatus: 404, type: 'REMOVED_STATIC' },
  { id: 'mestia-ushguli', expectedStatus: 404, type: 'REMOVED_STATIC' },
  { id: 'kakheti-wine', expectedStatus: 404, type: 'REMOVED_STATIC' },
  { id: 'machakhela', expectedStatus: 404, type: 'REMOVED_STATIC' },
  { id: 'khulo-goderdzi', expectedStatus: 404, type: 'REMOVED_STATIC' },
  { id: 'heli-caucasus', expectedStatus: 404, type: 'REMOVED_STATIC' },
  { id: 'vip-villas', expectedStatus: 404, type: 'REMOVED_STATIC' },
  { id: 'batumi-yacht', expectedStatus: 404, type: 'REMOVED_STATIC' },
  { id: 'gudauri-panoramic', expectedStatus: 404, type: 'REMOVED_STATIC' },
  { id: 'family-seasonal', expectedStatus: 404, type: 'REMOVED_STATIC' },
  { id: 'tskaltubo-kutaisi', expectedStatus: 404, type: 'REMOVED_STATIC' },
  { id: 'martvili-ureki', expectedStatus: 404, type: 'REMOVED_STATIC' },

  // Completely Nonexistent Random IDs
  { id: 'random-unknown-tour-999', expectedStatus: 404, type: 'NONEXISTENT' },
  { id: 'fake-tour-id-xyz', expectedStatus: 404, type: 'NONEXISTENT' },
];

const LOCALES = ['en', 'ru', 'ka'];

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
  console.log('Testing Tour Status Code Matrix...\n');
  let hasFailures = false;

  for (const testCase of TEST_CASES) {
    for (const lang of LOCALES) {
      const url = `/${lang}/tours/${testCase.id}`;
      try {
        const res = await fetchPage(url);
        const titleMatch = res.html.match(/<title[^>]*>([^<]*)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : '';
        const isMatch = res.statusCode === testCase.expectedStatus;

        if (isMatch) {
          console.log(`[PASS] [${testCase.type}] ${url} -> HTTP ${res.statusCode} | Title: "${title}"`);
        } else {
          console.log(`[FAIL] [${testCase.type}] ${url} -> Expected HTTP ${testCase.expectedStatus}, got ${res.statusCode}`);
          hasFailures = true;
        }

        // For 404s, ensure no indexable metadata or 200 soft-404 fake page
        if (testCase.expectedStatus === 404) {
          if (res.html.includes('id="tour-booking-form"')) {
            console.log(`  [FAIL] 404 page unexpectedly rendered a booking form!`);
            hasFailures = true;
          }
        }
      } catch (err) {
        console.error(`[ERROR] Fetching ${url} failed:`, err.message);
        hasFailures = true;
      }
    }
  }

  console.log('\n============================================================');
  console.log(`Overall Result: ${hasFailures ? 'FAILURES DETECTED' : 'ALL MATRIX TESTS PASSED'}`);
}

run();
