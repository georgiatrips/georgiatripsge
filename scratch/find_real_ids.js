const http = require('http');

http.get('http://localhost:3000/ka/tours', (res) => {
  let html = '';
  res.on('data', c => { html += c; });
  res.on('end', () => {
    const tourLinks = [...html.matchAll(/\/ka\/tours\/([^"'\s?#]+)/g)].map(m => m[1]);
    const uniqueTourLinks = [...new Set(tourLinks)];
    console.log('Discovered Tour IDs/slugs on /ka/tours:', uniqueTourLinks);
  });
});

http.get('http://localhost:3000/ka/places', (res) => {
  let html = '';
  res.on('data', c => { html += c; });
  res.on('end', () => {
    const placeLinks = [...html.matchAll(/\/ka\/places\/([^"'\s?#]+)/g)].map(m => m[1]);
    const uniquePlaceLinks = [...new Set(placeLinks)];
    console.log('Discovered Place IDs/slugs on /ka/places:', uniquePlaceLinks);
  });
});
