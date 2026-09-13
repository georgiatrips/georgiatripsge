const http = require('http');

function fetchHtml(urlPath, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: urlPath,
      method: 'GET',
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
        ...options.headers,
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, html: data }));
    });
    req.on('error', reject);
    req.end();
  });
}

function extractHrefs(html) {
  const matches = [...html.matchAll(/<a\s+[^>]*href="([^"]+)"[^>]*>/gi)];
  return matches.map(m => m[1]);
}

function isInternalPageLink(href) {
  if (href.startsWith('http://') || href.startsWith('https://')) return false;
  if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('whatsapp:')) return false;
  if (href.startsWith('#')) return false; // same-page hash anchor
  if (href.startsWith('/api/') || href.startsWith('/_next/')) return false;
  return true;
}

async function waitForServer(retries = 30) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetchHtml('/en');
      if (res.status === 200 || res.status === 308 || res.status === 307) {
        console.log('Server is ready!');
        return true;
      }
    } catch (e) {
      // wait 1s
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error('Server did not start in time');
}

async function runTests() {
  await waitForServer();

  const pagesToTest = [
    { url: '/en/tours', expectedLocale: 'en' },
    { url: '/ru/tours', expectedLocale: 'ru' },
    { url: '/ka/tours', expectedLocale: 'ka' },
    { url: '/en/places', expectedLocale: 'en' },
    { url: '/ru/places', expectedLocale: 'ru' },
    { url: '/en', expectedLocale: 'en' },
    { url: '/ru', expectedLocale: 'ru' },
  ];

  let totalFailures = 0;

  for (const { url, expectedLocale } of pagesToTest) {
    console.log(`\n========================================`);
    console.log(`Testing page: ${url} (expected base locale: /${expectedLocale})`);
    console.log(`========================================`);
    
    const res = await fetchHtml(url);
    console.log(`HTTP Status: ${res.status}`);
    if (res.status !== 200) {
      console.error(`ERROR: Expected 200, got ${res.status}`);
      totalFailures++;
      continue;
    }

    const hrefs = extractHrefs(res.html);
    console.log(`Total <a> tags found: ${hrefs.length}`);

    const internalLinks = hrefs.filter(isInternalPageLink);
    console.log(`Internal page links found: ${internalLinks.length}`);

    let unlocalizedCount = 0;
    const sampleHrefs = [];

    for (const href of internalLinks) {
      // A valid internal link should start with /ka, /en, /ru, /tr, or /ar
      const isLocalized = /^(\/(ka|en|ru|tr|ar))(\/|$|\?|#)/.test(href);
      if (!isLocalized) {
        console.error(`❌ UNLOCALIZED LINK DETECTED: "${href}" on page ${url}`);
        unlocalizedCount++;
        totalFailures++;
      } else {
        // If it's a general page link (not a language switcher), it should match current locale
        const isLangSwitcher = ['/ka', '/en', '/ru', '/tr', '/ar'].some(l => href === l || href.startsWith(`${l}/`) || href.startsWith(`${l}?`));
        sampleHrefs.push(href);
      }
    }

    if (unlocalizedCount === 0) {
      console.log(`✅ All ${internalLinks.length} internal links are properly localized!`);
      console.log('Sample links:', [...new Set(sampleHrefs)].slice(0, 10));
    }
  }

  // Test redirects on unprefixed URLs
  console.log(`\n========================================`);
  console.log(`Testing legacy redirects (safety net)`);
  console.log(`========================================`);

  const redirectTests = [
    { url: '/tours?lang=en', expectedStatus: 308, expectedLocation: '/en/tours' },
    { url: '/tours?lang=ru', expectedStatus: 308, expectedLocation: '/ru/tours' },
    { url: '/transport', expectedStatus: 308, expectedLocation: '/en/transfers' },
    { url: '/ka/transport', expectedStatus: 308, expectedLocation: '/ka/transfers' },
  ];

  for (const { url, expectedStatus, expectedLocation } of redirectTests) {
    const res = await fetchHtml(url);
    const loc = res.headers['location'] || '';
    const locPath = loc.replace('http://localhost:3000', '');
    console.log(`Test redirect: ${url} -> Status: ${res.status}, Location: ${locPath}`);
    if (res.status === expectedStatus && locPath === expectedLocation) {
      console.log(`✅ Passed redirect test for ${url}`);
    } else {
      console.error(`❌ FAILED redirect test for ${url}. Got status ${res.status}, location ${locPath}`);
      totalFailures++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Final Result: ${totalFailures === 0 ? 'ALL TESTS PASSED! 🎉' : `FAILED with ${totalFailures} errors`}`);
  console.log(`========================================`);

  if (totalFailures > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
