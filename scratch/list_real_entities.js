const { listFirestoreTours } = require('./app/lib/toursFirestore');
const { listPlaces } = require('./app/lib/placesFirestore');

async function test() {
  try {
    const tours = await listFirestoreTours();
    console.log('Tours count:', tours.length);
    tours.slice(0, 5).forEach(t => console.log('Tour ID:', t.id, 'slug:', t.slug, 'title:', t.title));
    
    const places = await listPlaces();
    console.log('Places count:', places.length);
    places.slice(0, 5).forEach(p => console.log('Place ID:', p.id, 'slug:', p.slug, 'title:', p.title));
  } catch (e) {
    console.error(e);
  }
}

test();
