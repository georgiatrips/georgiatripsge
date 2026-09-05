const http = require('http');

http.get('http://localhost:3000/ka/tours', (res) => {
  let html = '';
  res.on('data', c => { html += c; });
  res.on('end', () => {
    // Look for href="/tours/..."
    const matches = [...html.matchAll(/href="\/tours\/([^"]+)"/g)];
    const tourId = matches[0] ? matches[0][1] : 'tbilisi-city-tour';
    console.log(`Found tourId from catalog: "${tourId}"`);

    http.get(`http://localhost:3000/ka/tours/${tourId}`, (detailRes) => {
      let detailHtml = '';
      detailRes.on('data', c => { detailHtml += c; });
      detailRes.on('end', () => {
        console.log(`Tour Page Status: ${detailRes.statusCode}`);
        console.log(`HTML Length: ${detailHtml.length}`);
        console.log(`- Has Booking Form: ${detailHtml.includes('id="tour-booking-form"') || detailHtml.includes('tdp-booking-form')}`);
        console.log(`- Has Floating Bar CSS: ${detailHtml.includes('tdp-mobile-floating-bar')}`);
        console.log(`- Has Schema.org TouristTrip: ${detailHtml.includes('TouristTrip')}`);
        console.log(`- Has OpenGraph Image: ${detailHtml.includes('og:image')}`);
      });
    });
  });
});
