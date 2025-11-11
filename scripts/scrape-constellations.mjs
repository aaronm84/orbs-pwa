import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const CONSTELLATION_NAMES = [
  'Crux', 'Cassiopeia', 'Triangulum', 'Aries',
  'Leo', 'Ursa Major', 'Gemini', 'Lyra', 'Cygnus',
  'Orion', 'Scorpius', 'Sagittarius', 'Perseus', 'Aquila',
  'Eridanus', 'Draco', 'Hydra'
];

async function scrapeConstellations() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage']
  });
  const page = await browser.newPage();

  console.log('Navigating to star-registration.com...');
  try {
    await page.goto('https://www.star-registration.com/blogs/constellations-and-zodiac-signs/an-overview-of-all-88-constellations', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    await page.waitForTimeout(2000); // Wait for images to load
  } catch (error) {
    console.error('Error loading page:', error);
    await browser.close();
    throw error;
  }

  console.log('Page loaded. Extracting constellation data...');

  // Get all images on the page
  const allImages = await page.locator('img').all();
  console.log(`Found ${allImages.length} images on the page`);

  const constellationData = {};
  const imgDir = path.join(process.cwd(), 'constellation-images');
  if (!fs.existsSync(imgDir)) {
    fs.mkdirSync(imgDir);
  }

  for (const name of CONSTELLATION_NAMES) {
    console.log(`\nProcessing ${name}...`);

    // Find image with alt text containing the constellation name
    const nameVariants = [
      name,
      name.toLowerCase(),
      name.replace(' ', '-'),
      name.replace(' ', '_')
    ];

    let foundImg = null;
    for (const img of allImages) {
      const alt = await img.getAttribute('alt') || '';
      const src = await img.getAttribute('src') || '';

      for (const variant of nameVariants) {
        if (alt.toLowerCase().includes(variant.toLowerCase()) ||
            src.toLowerCase().includes(variant.toLowerCase())) {
          foundImg = img;
          break;
        }
      }
      if (foundImg) break;
    }

    if (foundImg) {
      const imgSrc = await foundImg.getAttribute('src');
      const imgAlt = await foundImg.getAttribute('alt');

      console.log(`  ✓ Found image: ${imgAlt}`);

      // Download the image
      const imgUrl = imgSrc.startsWith('http') ? imgSrc : `https:${imgSrc}`;
      console.log(`    Downloading: ${imgUrl}`);

      const imgResponse = await page.context().request.get(imgUrl);
      const buffer = await imgResponse.body();

      const ext = imgSrc.split('.').pop().split('?')[0];
      const imgPath = path.join(imgDir, `${name.toLowerCase().replace(' ', '-')}.${ext}`);
      fs.writeFileSync(imgPath, buffer);

      console.log(`  ✓ Saved to ${imgPath}`);

      constellationData[name] = {
        imagePath: imgPath,
        imageUrl: imgUrl
      };
    } else {
      console.log(`  ⚠️  No image found for ${name}`);
    }
  }

  await browser.close();

  // Save the data
  const outputPath = path.join(process.cwd(), 'constellation-images', 'data.json');
  fs.writeFileSync(outputPath, JSON.stringify(constellationData, null, 2));

  console.log(`\n✓ Constellation data saved to ${outputPath}`);
  console.log(`  Total constellations processed: ${Object.keys(constellationData).length}`);
}

scrapeConstellations().catch(console.error);
