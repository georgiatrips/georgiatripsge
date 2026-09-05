const http = require('http');

const endpoints = [
  { url: 'http://localhost:3000/ka', name: 'Home Page' },
  { url: 'http://localhost:3000/ka/tours', name: 'Tours Catalog' },
  { url: 'http://localhost:3000/ka/places', name: 'Places Catalog' },
  { url: 'http://localhost:3000/ka/posts', name: 'Posts/Community' },
  { url: 'http://localhost:3000/ka/hotels', name: 'Hotels Catalog' },
  { url: 'http://localhost:3000/ka/transfers', name: 'Transfers Page' },
];

function fetchEndpoint(endpoint) {
  return new Promise((resolve) => {
    http.get(endpoint.url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const hasOgTitle = data.includes('property="og:title"') || data.includes('name="og:title"');
        const hasOgImage = data.includes('property="og:image"') || data.includes('name="og:image"');
        const hasJsonLd = data.includes('application/ld+json');
        resolve({
          name: endpoint.name,
          url: endpoint.url,
          status: res.statusCode,
          hasOgTitle,
          hasOgImage,
          hasJsonLd,
          htmlLength: data.length,
        });
      });
    }).on('error', (err) => {
      resolve({
        name: endpoint.name,
        url: endpoint.url,
        error: err.message,
      });
    });
  });
}

async function run() {
  console.log('--- Testing All Routes for RSC, Dynamic SEO & Schema.org JSON-LD ---');
  for (const ep of endpoints) {
    const res = await fetchEndpoint(ep);
    console.log(JSON.stringify(res, null, 2));
  }
}

run();
