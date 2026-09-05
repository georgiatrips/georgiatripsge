const http = require('http');

const staticSlugs = [
  'tbilisi-city-tour',
  'kazbegi-tour',
  'kakheti-wine-tour',
  'martvili-canyon-tour',
  'mestia-svaneti-tour',
];

for (const slug of staticSlugs) {
  http.get(`http://localhost:3000/ka/tours/${slug}`, (res) => {
    let html = '';
    res.on('data', c => { html += c; });
    res.on('end', () => {
      console.log(`Slug "${slug}" -> Status: ${res.statusCode} | Length: ${html.length}`);
      console.log(`  - Has Hero (.tdp-hero): ${html.includes('tdp-hero')}`);
      console.log(`  - Has Booking Form: ${html.includes('id="tour-booking-form"') || html.includes('tdp-booking-form')}`);
      console.log(`  - Has Floating Bar: ${html.includes('tdp-mobile-floating-bar')}`);
      console.log(`  - Has WhatsApp Button: ${html.includes('btn-mobile-floating-wa')}`);
    });
  });
}
