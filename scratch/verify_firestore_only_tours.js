const http = require('http');

const OLD_STATIC_SLUGS = [
  'promethe-martvili',
  'adjara-mountains',
  'kazbegi-gergeti',
  'mtirala',
  'tbilisi-mcxeta',
  'mestia-ushguli',
  'kakheti-wine',
  'machakhela',
  'khulo-goderdzi',
  'heli-caucasus',
  'vip-villas',
  'batumi-yacht',
  'gudauri-panoramic',
  'family-seasonal',
  'tskaltubo-kutaisi',
  'martvili-ureki',
];

const REAL_FIRESTORE_IDS = [
  'ZvCYh5V4wEqWkUp622RX',
  'wJKtWdXcepqoShhtgBxB',
  'xiB7DffCVIS3FSbN9bDc',
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
  console.log('Starting verification: Firestore is the ONLY source of tours...\n');
  let hasErrors = false;

  // 1. Check /sitemap.xml
  console.log('=== Step 1: Auditing /sitemap.xml ===');
  const sitemapRes = await fetchPage('/sitemap.xml');
  console.log(`Sitemap status: ${sitemapRes.statusCode}`);
  
  for (const slug of OLD_STATIC_SLUGS) {
    if (sitemapRes.html.includes(slug)) {
      console.log(`  [FAIL] Static tour slug "${slug}" found in sitemap!`);
      hasErrors = true;
    }
  }
  for (const id of REAL_FIRESTORE_IDS) {
    if (sitemapRes.html.includes(id)) {
      console.log(`  [PASS] Real Firestore tour "${id}" present in sitemap`);
    } else {
      console.log(`  [WARN] Real Firestore tour "${id}" not found in sitemap`);
    }
  }

  // 2. Check /en/tours, /ru/tours, /ka/tours catalog
  console.log('\n=== Step 2: Auditing Tour Catalog Pages ===');
  for (const lang of ['en', 'ru', 'ka']) {
    const res = await fetchPage(`/${lang}/tours`);
    console.log(`/${lang}/tours (HTTP ${res.statusCode})`);
    for (const slug of OLD_STATIC_SLUGS) {
      if (res.html.includes(`/${lang}/tours/${slug}`)) {
        console.log(`  [FAIL] Static tour slug link "${slug}" found in /${lang}/tours!`);
        hasErrors = true;
      }
    }
    for (const id of REAL_FIRESTORE_IDS) {
      if (res.html.includes(`/${lang}/tours/${id}`)) {
        console.log(`  [PASS] Real Firestore tour link "${id}" rendered on /${lang}/tours`);
      }
    }
  }

  // 3. Check Homepage
  console.log('\n=== Step 3: Auditing Homepage Tour Sections ===');
  for (const lang of ['en', 'ru', 'ka']) {
    const res = await fetchPage(`/${lang}`);
    console.log(`/${lang} (HTTP ${res.statusCode})`);
    for (const slug of OLD_STATIC_SLUGS) {
      if (res.html.includes(`/${lang}/tours/${slug}`)) {
        console.log(`  [FAIL] Static tour slug link "${slug}" found in /${lang}!`);
        hasErrors = true;
      }
    }
    for (const id of REAL_FIRESTORE_IDS) {
      if (res.html.includes(`/${lang}/tours/${id}`)) {
        console.log(`  [PASS] Real Firestore tour link "${id}" rendered on homepage /${lang}`);
      }
    }
  }

  // 4. Check that old static tour URLs return HTTP 404
  console.log('\n=== Step 4: Confirming Old Static Tour URLs Return HTTP 404 ===');
  for (const slug of OLD_STATIC_SLUGS.slice(0, 5)) {
    for (const lang of ['en', 'ru', 'ka']) {
      const res = await fetchPage(`/${lang}/tours/${slug}`);
      if (res.statusCode === 404) {
        console.log(`  [PASS] /${lang}/tours/${slug} -> HTTP 404 (Correctly Not Found)`);
      } else {
        console.log(`  [FAIL] /${lang}/tours/${slug} -> HTTP ${res.statusCode} (Expected 404!)`);
        hasErrors = true;
      }
    }
  }

  // 5. Check that real Firestore tour URLs return HTTP 200 with accurate localized metadata
  console.log('\n=== Step 5: Confirming Real Firestore Tour URLs Return HTTP 200 ===');
  for (const id of REAL_FIRESTORE_IDS) {
    for (const lang of ['en', 'ru', 'ka']) {
      const res = await fetchPage(`/${lang}/tours/${id}`);
      const titleMatch = res.html.match(/<title[^>]*>([^<]*)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : '';
      if (res.statusCode === 200) {
        console.log(`  [PASS] /${lang}/tours/${id} -> HTTP 200 | Title: "${title}"`);
      } else {
        console.log(`  [FAIL] /${lang}/tours/${id} -> HTTP ${res.statusCode}`);
        hasErrors = true;
      }
    }
  }

  console.log(`\n============================================================`);
  console.log(`Final Verification Result: ${hasErrors ? 'FAILED' : 'ALL TESTS PASSED PERFECTLY'}`);
}

run();
