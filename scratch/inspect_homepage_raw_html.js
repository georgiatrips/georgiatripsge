const http = require('http');

function inspectHomepage(lang) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000/${lang}`, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        console.log(`\n================== Raw Server HTML for /${lang} (HTTP ${res.statusCode}) ==================`);
        console.log(`Total HTML Length: ${data.length} bytes`);
        
        // Find all links to /tours/... in raw server HTML
        const tourLinks = [...data.matchAll(new RegExp(`/${lang}/tours/([a-zA-Z0-9_-]+)`, 'g'))].map(m => m[0]);
        const uniqueTourLinks = [...new Set(tourLinks)];
        console.log(`Tour links found in server HTML (${uniqueTourLinks.length} unique):`);
        uniqueTourLinks.forEach(link => console.log('  -', link));

        // Check for presence of tour card titles / classes
        console.log('- Contains .pop-fc (Popular Tour Card):', data.includes('pop-fc'));
        console.log('- Contains .mini-cards-slider-track:', data.includes('mini-cards-slider-track'));
        console.log('- Contains .tc-card / .tb-card:', data.includes('tc-card') || data.includes('tb-card'));
        
        // Extract any tour titles inside server HTML
        const cardTitles = [...data.matchAll(/<h3[^>]*class=["'][^"']*pop-fc-title[^"']*["'][^>]*>([^<]+)<\/h3>/g)].map(m => m[1]);
        console.log('Server-rendered tour card titles:', cardTitles);

        resolve();
      });
    });
  });
}

async function main() {
  await inspectHomepage('en');
  await inspectHomepage('ru');
  await inspectHomepage('ka');
}

main();
