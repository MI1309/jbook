const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const input = path.join(__dirname, 'public/icon.svg');
const outputDir = path.join(__dirname, 'public');

async function generateIcons() {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    await sharp(input)
        .resize(192, 192)
        .toFile(path.join(outputDir, 'icon-192.png'));

    await sharp(input)
        .resize(512, 512)
        .toFile(path.join(outputDir, 'icon-512.png'));

    console.log('Icons generated successfully!');
}

generateIcons().catch(console.error);
