const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = 'static/textures';
const outputDir = 'static/thumbnails';

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Process each texture
fs.readdirSync(inputDir)
  .filter((file) => file.endsWith('.webp'))
  .forEach((file) => {
    sharp(path.join(inputDir, file))
      .resize(100, 100, { fit: 'cover' })
      .toFile(path.join(outputDir, file))
      .then(() => console.log(`Generated thumbnail for ${file}`))
      .catch((err) => console.error(`Error processing ${file}:`, err));
  });
