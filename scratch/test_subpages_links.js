const http = require('http');

function fetchHtml(urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: urlPath,
      method: 'GET',
      headers: {
        'Accept-Language': 'en-US,en;q=0.9',
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
  if (href.startsWith('#')) return false;
  if (href.startsWith('/api/') || href.startsWith('/_next/')) return false;
  return true;
}

async function testDetailPages() {
  const pages = [
    '/en/hotels',
    '/ru/hotels',
    '/en/transfers',
    '/ru/transfers',
    '/en/posts',
    '/ru/posts',
    '/en/terms',
    '/ru/terms',
    '/en/privacy-policy',
    '/ru/privacy-policy',
  ];

  let errors = 0;
  for (const page of pages) {
    const res = await fetchHtml(page);
    const hrefs = extractHrefs(res.html);
    const internal = hrefs.filter(isInternalPageLink);
    for (const h of internal) {
      if (!/^(\/(ka|en|ru|tr|ar))(\/|$|\?|#)/.test(h)) {
        console.error(`❌ Unlocalized link on ${page}: ${h}`);
        errors++;
      }
    }
  }

  if (errors === 0) {
    console.log('✅ All tested pages have 100% properly localized internal links!');
  } else {
    console.error(`❌ Found ${errors} unlocalized link errors across pages`);
    process.exit(1);
  }
}

testDetailPages();
