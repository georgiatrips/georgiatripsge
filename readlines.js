const fs = require('fs');
const path = 'app/globals.css';
const lines = fs.readFileSync(path, 'utf8').split('\n');
// Print lines from 9810 to 9930 (1-indexed)
console.log('=== LINES 9810-9930 (mobile filter base) ===');
for (let i = 9809; i <= 9929 && i < lines.length; i++) {
  console.log((i + 1) + ': ' + lines[i]);
}
console.log('\n=== LINES 17060-17140 (mobile media query) ===');
for (let i = 17059; i <= 17139 && i < lines.length; i++) {
  console.log((i + 1) + ': ' + lines[i]);
}
console.log('\n=== LINES 18720-18740 ===');
for (let i = 18719; i <= 18739 && i < lines.length; i++) {
  console.log((i + 1) + ': ' + lines[i]);
}
console.log('\n=== LINES 21340-21460 ===');
for (let i = 21339; i <= 21459 && i < lines.length; i++) {
  console.log((i + 1) + ': ' + lines[i]);
}
