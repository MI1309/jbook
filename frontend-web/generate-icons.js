const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const input = path.join(__dirname, 'public/logo_jbook.jpg');
const outputDir = path.join(__dirname, 'public');
const logoCrop = { left: 170, top: 171, width: 684, height: 684 };
async function generateIcons() {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const size of [192, 512]) {
        const mask = Buffer.from(
            `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${size}" rx="${Math.round(size * 0.21)}" fill="white"/></svg>`
        );
        const resizedLogo = await sharp(input).extract(logoCrop).resize(size, size).png().toBuffer();
        const maskedLogo = await sharp(resizedLogo)
            .composite([{ input: mask, blend: 'dest-in' }])
            .png()
            .toBuffer();

        await sharp({
            create: { width: size, height: size, channels: 3, background: '#172978' },
        })
            .composite([{ input: maskedLogo }])
            .toFile(path.join(outputDir, `icon-${size}.png`));
    }

    console.log('Icons generated successfully!');
}

generateIcons().catch(console.error);
