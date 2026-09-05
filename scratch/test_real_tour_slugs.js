const http = require('http');

const realSlugs = ['promethe-martvili', 'adjara-mountains', 'kazbegi-gergeti'];

for (const slug of realSlugs) {
  http.get(`http://localhost:3000/ka/tours/${slug}`, (res) => {
    let html = '';
    res.on('data', c => { html += c; });
    res.on('end', () => {
      console.log(`\n================== Real Tour: "${slug}" ==================`);
      console.log(`Status: ${res.statusCode} | Length: ${html.length}`);
      console.log(`- Has Hero Showcase (.tdp-hero): ${html.includes('tdp-hero')}`);
      console.log(`- Has Booking Form (id="tour-booking-form"): ${html.includes('id="tour-booking-form"')}`);
      console.log(`- Has Mobile Floating Bar (.tdp-mobile-floating-bar): ${html.includes('tdp-mobile-floating-bar')}`);
      console.log(`- Has WhatsApp Floating Action (btn-mobile-floating-wa): ${html.includes('btn-mobile-floating-wa')}`);
      console.log(`- Has Book Now Button (btn-mobile-floating-book): ${html.includes('btn-mobile-floating-book')}`);
      console.log(`- Has Schema.org JSON-LD TouristTrip: ${html.includes('TouristTrip')}`);
    });
  });
}
