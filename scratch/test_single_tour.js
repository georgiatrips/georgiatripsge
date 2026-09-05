const http = require('http');

http.get('http://localhost:3000/ka/tours/ZvCYh5V4wEqWkUp622RX', (res) => {
  let html = '';
  res.on('data', c => { html += c; });
  res.on('end', () => {
    console.log("Status:", res.statusCode);
    console.log("Includes tdp-hero:", html.includes('tdp-hero'));
    console.log("Includes tdp-booking-form:", html.includes('tdp-booking-form'));
    console.log("Includes tdp-mobile-floating-bar:", html.includes('tdp-mobile-floating-bar'));
    console.log("Includes tourNotFound:", html.includes('tourNotFound') || html.includes('ტური ვერ მოიძებნა'));
    console.log("Includes loadingTour:", html.includes('loadingTour') || html.includes('ტური იტვირთება'));
  });
});
