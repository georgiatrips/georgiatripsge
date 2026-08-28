const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generate() {
  const src = path.join(__dirname, '../public/logo.webp');
  
  // 1. Generate clean square PNGs of various sizes
  const sizes = [
    { size: 16, name: 'favicon-16x16.png' },
    { size: 32, name: 'favicon-32x32.png' },
    { size: 48, name: 'favicon-48x48.png' },
    { size: 96, name: 'favicon-96x96.png' },
    { size: 144, name: 'favicon-144x144.png' },
    { size: 180, name: 'apple-touch-icon.png' },
    { size: 180, name: 'apple-touch-icon-precomposed.png' },
    { size: 192, name: 'icon-192.png' },
    { size: 512, name: 'icon-512.png' },
    { size: 512, name: 'logo.png' },
  ];

  for (const { size, name } of sizes) {
    const buffer = await sharp(src)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();

    fs.writeFileSync(path.join(__dirname, '../public', name), buffer);
    console.log(`Generated public/${name} (${size}x${size})`);
  }

  // Also generate app directory icons for Next.js App Router
  const appIcon512 = await sharp(src)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(__dirname, '../app/icon.png'), appIcon512);

  const appAppleIcon = await sharp(src)
    .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(__dirname, '../app/apple-icon.png'), appAppleIcon);

  // Generate a valid ICO file (contains 16x16, 32x32, 48x48 PNG frames inside ICO container or 32x32/48x48 PNG)
  // Standard ICO header:
  // 0-1: reserved (0)
  // 2-3: image type (1 for ico)
  // 4-5: number of images
  // For each image directory entry (16 bytes):
  // width (1B), height (1B), color count (1B), reserved (1B), color planes (2B), bpp (2B), size in bytes (4B), offset (4B)
  const icoSizes = [16, 32, 48];
  const pngBuffers = [];
  for (const s of icoSizes) {
    const buf = await sharp(src)
      .resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    pngBuffers.push({ size: s, buf });
  }

  const numImages = pngBuffers.length;
  const headerLen = 6;
  const dirEntryLen = 16;
  let offset = headerLen + dirEntryLen * numImages;

  const header = Buffer.alloc(headerLen);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = ICO
  header.writeUInt16LE(numImages, 4); // count

  const entries = [];
  for (const { size, buf } of pngBuffers) {
    const entry = Buffer.alloc(dirEntryLen);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buf.length, 8); // image size
    entry.writeUInt32LE(offset, 12); // image offset
    entries.push(entry);
    offset += buf.length;
  }

  const icoBuffer = Buffer.concat([
    header,
    ...entries,
    ...pngBuffers.map(p => p.buf)
  ]);

  fs.writeFileSync(path.join(__dirname, '../public/favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(__dirname, '../app/favicon.ico'), icoBuffer);
  console.log('Generated favicon.ico with 16x16, 32x32, 48x48 layers in public/ and app/');
}

generate().catch(err => {
  console.error(err);
  process.exit(1);
});
