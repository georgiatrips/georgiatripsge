const { getCachedTours } = require('./app/lib/server/cachedData');
const http = require('http');

async function test() {
  const tours = await getCachedTours();
  console.log(`Loaded ${tours.length} tours from cachedData.`);
  const tour = tours[0];
  if (!tour) {
    console.log("No tours found!");
    return;
  }
  console.log(`Testing with real tour: "${tour.id}" (${tour.title?.ka || tour.title})`);

  http.get(`http://localhost:3000/ka/tours/${tour.id}`, (res) => {
    let html = '';
    res.on('data', (c) => { html += c; });
    res.on('end', () => {
      console.log(`HTTP Status: ${res.statusCode}`);
      console.log(`HTML Length: ${html.length}`);
      console.log(`- Has Form ID (id="tour-booking-form"): ${html.includes('id="tour-booking-form"')}`);
      console.log(`- Has Mobile Floating Bar CSS (.tdp-mobile-floating-bar): ${html.includes('tdp-mobile-floating-bar')}`);
      console.log(`- Has WhatsApp Link / Shared Icon: ${html.includes('wa.me') || html.includes('WhatsApp')}`);
    });
  });
}

test();
