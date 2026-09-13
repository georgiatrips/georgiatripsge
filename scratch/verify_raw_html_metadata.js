const http = require('http');

const URLS = [
  // Homepages
  '/ka',
  '/en',
  '/ru',
  '/tr',
  '/ar',
  
  // Catalogues
  '/en/tours',
  '/ru/tours',
  '/ka/tours',
  '/en/places',
  '/ru/places',
  '/en/hotels',
  '/ru/hotels',
  '/en/transfers',
  '/ru/transfers',
  '/en/posts',
  '/ru/posts',

  // Static info pages
  '/en/terms',
  '/ru/terms',
  '/en/privacy-policy',
  '/ru/privacy-policy',
  '/en/coupons',
  '/ru/coupons',
  '/en/booking/status',
  '/ru/booking/status',

  // Real Dynamic Tour Details
  '/en/tours/ZvCYh5V4wEqWkUp622RX',
  '/ru/tours/ZvCYh5V4wEqWkUp622RX',
  '/ka/tours/ZvCYh5V4wEqWkUp622RX',
  '/en/tours/wJKtWdXcepqoShhtgBxB',
  '/ru/tours/wJKtWdXcepqoShhtgBxB',

  // Real Dynamic Place Details
  '/en/places/vOFTdOn6pi5ixb8WB6UB',
  '/ru/places/vOFTdOn6pi5ixb8WB6UB',
  '/ka/places/vOFTdOn6pi5ixb8WB6UB',
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

function extractTag(html, regex) {
  const m = html.match(regex);
  return m ? m[1] : null;
}

async function run() {
  console.log('Fetching raw server HTML and validating SEO metadata...\n');
  let hasErrors = false;

  for (const urlPath of URLS) {
    try {
      const { statusCode, html } = await fetchPage(urlPath);
      
      const title = extractTag(html, /<title[^>]*>([^<]*)<\/title>/i);
      const description = extractTag(html, /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) 
                       || extractTag(html, /<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
      const ogTitle = extractTag(html, /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i)
                   || extractTag(html, /<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:title["']/i);
      const ogDesc = extractTag(html, /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i)
                  || extractTag(html, /<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:description["']/i);
      const ogLocale = extractTag(html, /<meta[^>]*property=["']og:locale["'][^>]*content=["']([^"']*)["']/i)
                    || extractTag(html, /<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:locale["']/i);
      const canonical = extractTag(html, /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i)
                     || extractTag(html, /<link[^>]*href=["']([^"']*)["'][^>]*rel=["']canonical["']/i);

      const isDuplicatedSuffix = /GeorgiaTrips.*GeorgiaTrips/i.test(title || '');

      console.log(`------------------------------------------------------------`);
      console.log(`URL: ${urlPath} (HTTP ${statusCode})`);
      console.log(`  <title>: ${title}`);
      console.log(`  description: ${description}`);
      console.log(`  og:title: ${ogTitle}`);
      console.log(`  og:description: ${ogDesc}`);
      console.log(`  og:locale: ${ogLocale}`);
      console.log(`  canonical: ${canonical}`);
      console.log(`  Duplicated Brand Suffix: ${isDuplicatedSuffix ? 'FAIL (DUPLICATED)' : 'OK (CLEAN)'}`);

      if (statusCode !== 200) {
        console.log(`  [ERROR] Status is not 200 (got ${statusCode})`);
        hasErrors = true;
      }

      if (isDuplicatedSuffix) {
        console.log(`  [ERROR] Brand suffix duplicated in title!`);
        hasErrors = true;
      }

      // Check locale match for og:locale
      const expectedLocaleMap = {
        '/en': 'en_US',
        '/ru': 'ru_RU',
        '/ka': 'ka_GE',
        '/tr': 'tr_TR',
        '/ar': 'ar_SA'
      };
      const prefix = urlPath.slice(0, 3);
      if (expectedLocaleMap[prefix] && ogLocale !== expectedLocaleMap[prefix]) {
        console.log(`  [ERROR] Expected og:locale ${expectedLocaleMap[prefix]} but got ${ogLocale}`);
        hasErrors = true;
      }
    } catch (err) {
      console.error(`Failed to fetch ${urlPath}:`, err.message);
      hasErrors = true;
    }
  }

  console.log(`\n============================================================`);
  console.log(`Verification completed. Any issues found: ${hasErrors ? 'YES' : 'NO'}`);
}

run();
