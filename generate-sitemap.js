/**
 * Georgia Trips Dynamic XML Sitemap Generator
 * --------------------------------------------------
 * This script fetches all tours and blog posts directly from Firestore
 * using the public REST API (requiring no credentials or secrets!)
 * and writes a fully compliant, beautiful sitemap.xml to the workspace.
 * 
 * Usage: node generate-sitemap.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const PROJECT_ID = 'georgiatripsge';
const BASE_URL = 'https://georgiatrips.ge';
const OUTPUT_FILE = path.join(__dirname, 'sitemap.xml');

// Helper to perform simple GET requests returning JSON
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse response from ${url}`));
        }
      });
    }).on('error', reject);
  });
}

// Format date as YYYY-MM-DD
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

async function main() {
  console.log('--- STARTING DYNAMIC SITEMAP GENERATION ---');
  const today = getTodayDate();

  // 1. Define Static Core Pages
  const staticUrls = [
    { loc: `${BASE_URL}/index.html`, priority: '1.0', changefreq: 'weekly', lastmod: today },
    { loc: `${BASE_URL}/about.html`, priority: '0.8', changefreq: 'monthly', lastmod: '2026-05-18' },
    { loc: `${BASE_URL}/contact.html`, priority: '0.8', changefreq: 'monthly', lastmod: '2026-05-18' },
    { loc: `${BASE_URL}/domestic-tours.html`, priority: '0.9', changefreq: 'weekly', lastmod: today },
    { loc: `${BASE_URL}/international-tours.html`, priority: '0.9', changefreq: 'weekly', lastmod: today },
    { loc: `${BASE_URL}/cars.html`, priority: '0.8', changefreq: 'weekly', lastmod: today },
    { loc: `${BASE_URL}/posts.html`, priority: '0.7', changefreq: 'weekly', lastmod: today },
    { loc: `${BASE_URL}/privacy-policy.html`, priority: '0.3', changefreq: 'yearly', lastmod: '2026-04-22' },
    { loc: `${BASE_URL}/terms.html`, priority: '0.3', changefreq: 'yearly', lastmod: '2026-04-22' }
  ];

  const dynamicUrls = [];

  // 2. Fetch Active Tours from Firestore via REST API
  try {
    console.log('Fetching tours from Firestore...');
    const toursUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/tours`;
    const response = await fetchJson(toursUrl);

    if (response && response.documents) {
      console.log(`Found ${response.documents.length} tours in Firestore.`);
      response.documents.forEach(doc => {
        // Extract tour ID from the document resource name (projects/.../tours/{id})
        const docId = doc.name.split('/').pop();
        const fields = doc.fields || {};
        
        // Skip draft or inactive tours if attribute exists
        if (fields.status && fields.status.stringValue === 'draft') return;

        // Determine priority based on categories
        const category = fields.category ? fields.category.stringValue : 'domestic';
        const priority = (category === 'multi-day' || category === 'domestic') ? '0.8' : '0.7';

        // Extract last updated time or creation time
        let lastmod = today;
        if (doc.updateTime) {
          lastmod = doc.updateTime.split('T')[0];
        }

        dynamicUrls.push({
          loc: `${BASE_URL}/tour-detail.html?id=${docId}`,
          priority: priority,
          changefreq: 'weekly',
          lastmod: lastmod
        });
      });
    } else {
      console.log('No tours found or empty response.');
    }
  } catch (error) {
    console.error('Error fetching tours:', error.message);
  }

  // 3. Fetch Active Posts from Firestore via REST API
  try {
    console.log('Fetching blog posts from Firestore...');
    const postsUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/posts`;
    const response = await fetchJson(postsUrl);

    if (response && response.documents) {
      console.log(`Found ${response.documents.length} posts in Firestore.`);
      response.documents.forEach(doc => {
        const docId = doc.name.split('/').pop();
        const fields = doc.fields || {};
        
        if (fields.status && fields.status.stringValue === 'draft') return;

        let lastmod = today;
        if (doc.updateTime) {
          lastmod = doc.updateTime.split('T')[0];
        }

        dynamicUrls.push({
          loc: `${BASE_URL}/posts-detail.html?id=${docId}`,
          priority: '0.6',
          changefreq: 'monthly',
          lastmod: lastmod
        });
      });
    } else {
      console.log('No posts found or empty response.');
    }
  } catch (error) {
    console.error('Error fetching posts:', error.message);
  }

  // 4. Combine All URLs
  const allUrls = [...staticUrls, ...dynamicUrls];

  // 5. Generate XML Markup
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n\n';

  allUrls.forEach(url => {
    xml += '  <url>\n';
    xml += `    <loc>${url.loc}</loc>\n`;
    xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
    xml += `    <priority>${url.priority}</priority>\n`;
    xml += '  </url>\n\n';
  });

  xml += '</urlset>\n';

  // 6. Write to File
  try {
    fs.writeFileSync(OUTPUT_FILE, xml, 'utf8');
    console.log(`Successfully generated dynamic sitemap.xml with ${allUrls.length} pages!`);
    console.log(`Saved to: ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error writing sitemap.xml file:', error.message);
  }

  console.log('--- SITEMAP GENERATION COMPLETE ---');
}

main().catch(console.error);
