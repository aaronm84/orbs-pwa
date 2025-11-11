#!/usr/bin/env node

/**
 * Generate Constellation Level JSON files from Stellarium IAU data and HYG database
 *
 * Input:
 * - data-sources/stellarium_iau_constellations.json (Stellarium IAU constellation lines)
 * - data-sources/hygdata_v41.csv (HYG star database)
 *
 * Output:
 * - public/levels/constellation_lv01.json, lv02.json, etc.
 *
 * Each level JSON contains:
 * - Constellation edges (HIP star pairs)
 * - All constellation stars with RA/Dec/Mag
 * - Distractor stars (mag ≤ 5.5) within bounding box
 * - Win-detection parameters
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Target constellations - ordered from easiest (small, simple) to hardest (large, complex)
const TARGET_CONSTELLATIONS = [
  // Tier 1: Very Easy (Small, simple shapes - 3-5 stars)
  { iau: 'Cru', name: 'Crux', level: 1 },              // Southern Cross - 4 stars
  { iau: 'Tri', name: 'Triangulum', level: 2 },        // Triangle - 3 stars
  { iau: 'Ari', name: 'Aries', level: 3 },             // Ram - 4 stars
  { iau: 'CrB', name: 'Corona Borealis', level: 4 },   // Northern Crown - 7 stars

  // Tier 2: Easy (Recognizable shapes - 5-8 stars)
  { iau: 'Cas', name: 'Cassiopeia', level: 5 },        // W shape - 5 stars
  { iau: 'Lyr', name: 'Lyra', level: 6 },              // Harp - 5 stars
  { iau: 'Del', name: 'Delphinus', level: 7 },         // Dolphin - 5 stars
  { iau: 'Sge', name: 'Sagitta', level: 8 },           // Arrow - 4 stars

  // Tier 3: Medium (Well-known constellations)
  { iau: 'Leo', name: 'Leo', level: 9 },               // Lion - 9 stars
  { iau: 'Cyg', name: 'Cygnus', level: 10 },           // Swan - 9 stars
  { iau: 'Aql', name: 'Aquila', level: 11 },           // Eagle - 9 stars
  { iau: 'Peg', name: 'Pegasus', level: 12 },          // Winged Horse - 9 stars

  // Tier 4: Medium-Hard (Larger zodiac constellations)
  { iau: 'Tau', name: 'Taurus', level: 13 },           // Bull - 19 stars
  { iau: 'Gem', name: 'Gemini', level: 14 },           // Twins - 18 stars
  { iau: 'Cnc', name: 'Cancer', level: 15 },           // Crab - 9 stars
  { iau: 'Lib', name: 'Libra', level: 16 },            // Scales - 8 stars

  // Tier 5: Hard (Large, complex constellations)
  { iau: 'Sco', name: 'Scorpius', level: 17 },         // Scorpion - 18 stars
  { iau: 'Sgr', name: 'Sagittarius', level: 18 },      // Archer - 20 stars
  { iau: 'Cap', name: 'Capricornus', level: 19 },      // Sea Goat - 10 stars
  { iau: 'Aqr', name: 'Aquarius', level: 20 },         // Water Bearer - 22 stars

  // Tier 6: Very Hard (Famous but complex)
  { iau: 'Ori', name: 'Orion', level: 21 },            // Hunter - 20 stars
  { iau: 'UMa', name: 'Ursa Major', level: 22 },       // Great Bear - 20 stars
  { iau: 'Vir', name: 'Virgo', level: 23 },            // Maiden - 20 stars
  { iau: 'Psc', name: 'Pisces', level: 24 },           // Fish - 18 stars
  { iau: 'And', name: 'Andromeda', level: 25 },        // Chained Maiden - 16 stars
];

// Constants
const DISTRACTOR_MAG_LIMIT = 5.5;
const BOUNDING_BOX_PADDING_DEG = 10; // Degrees of padding around constellation

async function loadStellarium() {
  const filePath = path.join(projectRoot, 'data-sources', 'stellarium_iau_constellations.json');
  const data = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(data);
}

async function loadHYG() {
  const filePath = path.join(projectRoot, 'data-sources', 'hygdata_v41.csv');
  const csvContent = await fs.readFile(filePath, 'utf-8');

  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true
  });

  // Index by HIP ID for fast lookup
  const hipIndex = new Map();
  for (const record of records) {
    if (record.hip) {
      const hip = parseInt(record.hip);
      hipIndex.set(hip, {
        hip,
        ra: parseFloat(record.ra) || 0,
        dec: parseFloat(record.dec) || 0,
        mag: parseFloat(record.mag) || 99,
        proper: record.proper || '',
        bayer: record.bayer || '',
        flam: record.flam || '',
        con: record.con || ''
      });
    }
  }

  console.log(`Loaded ${hipIndex.size} stars from HYG database`);
  return hipIndex;
}

function extractEdgesFromLines(linesArrays) {
  // Stellarium format: "lines" is array of arrays, each subarray is a connected path
  // Convert to individual edges (pairs of HIP IDs)
  const edges = [];
  const edgeSet = new Set(); // Track unique edges

  for (const line of linesArrays) {
    for (let i = 0; i < line.length - 1; i++) {
      const hip1 = line[i];
      const hip2 = line[i + 1];

      // Create a normalized edge key (smaller HIP first)
      const edgeKey = hip1 < hip2 ? `${hip1}-${hip2}` : `${hip2}-${hip1}`;

      // Only add if we haven't seen this edge before
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey);
        edges.push([hip1, hip2]);
      }
    }
  }

  return edges;
}

function getUniqueStars(edges) {
  const starSet = new Set();
  for (const [hip1, hip2] of edges) {
    starSet.add(hip1);
    starSet.add(hip2);
  }
  return Array.from(starSet);
}

function calculateBoundingBox(stars, hipIndex, padding) {
  let minRa = Infinity, maxRa = -Infinity;
  let minDec = Infinity, maxDec = -Infinity;

  for (const hip of stars) {
    const star = hipIndex.get(hip);
    if (!star) continue;

    minRa = Math.min(minRa, star.ra);
    maxRa = Math.max(maxRa, star.ra);
    minDec = Math.min(minDec, star.dec);
    maxDec = Math.max(maxDec, star.dec);
  }

  // Add padding
  minRa -= padding;
  maxRa += padding;
  minDec -= padding;
  maxDec += padding;

  // Clamp declination to valid range
  minDec = Math.max(-90, minDec);
  maxDec = Math.min(90, maxDec);

  // Handle RA wrapping around 360/0
  if (minRa < 0) minRa += 360;
  if (maxRa > 360) maxRa -= 360;

  return { minRa, maxRa, minDec, maxDec };
}

function isInBoundingBox(ra, dec, bbox) {
  const { minRa, maxRa, minDec, maxDec } = bbox;

  // Check declination (simple range)
  if (dec < minDec || dec > maxDec) return false;

  // Check RA (handle wrapping)
  if (minRa <= maxRa) {
    // Normal case: no wrapping
    return ra >= minRa && ra <= maxRa;
  } else {
    // Wrapping case: bbox crosses 0/360 boundary
    return ra >= minRa || ra <= maxRa;
  }
}

function findDistractorStars(constellationStars, bbox, hipIndex) {
  const constellationHips = new Set(constellationStars);
  const distractors = [];

  for (const [hip, star] of hipIndex.entries()) {
    // Skip if already in constellation
    if (constellationHips.has(hip)) continue;

    // Skip if too faint
    if (star.mag > DISTRACTOR_MAG_LIMIT) continue;

    // Check if in bounding box
    if (isInBoundingBox(star.ra, star.dec, bbox)) {
      distractors.push(hip);
    }
  }

  return distractors;
}

function generateLevelJSON(constellationData, edges, allStars, hipIndex, level, iauCode, commonName) {
  const levelId = `constellation_lv${String(level).padStart(2, '0')}`;

  // Build stars array with RA/Dec/Mag
  const starsArray = allStars.map(hip => {
    const star = hipIndex.get(hip);
    if (!star) {
      console.warn(`Warning: HIP ${hip} not found in database`);
      return null;
    }

    return {
      hip,
      ra: star.ra,
      dec: star.dec,
      mag: star.mag
    };
  }).filter(s => s !== null);

  return {
    id: levelId,
    name: `Find ${commonName}`,
    epoch: 'J2000',
    projection: 'equirect',
    win: {
      tolerance_px: 12,
      edge_samples: 30,
      coverage_threshold: 0.8
    },
    constellation: {
      iau_code: iauCode,
      common_name: commonName,
      edges
    },
    stars: starsArray
  };
}

async function main() {
  console.log('Loading data sources...');
  const stellariumData = await loadStellarium();
  const hipIndex = await loadHYG();

  console.log(`Stellarium has ${stellariumData.constellations.length} constellations`);

  // Create output directory
  const outputDir = path.join(projectRoot, 'public', 'constellation', 'levels');
  await fs.mkdir(outputDir, { recursive: true });

  // Process each target constellation
  for (const target of TARGET_CONSTELLATIONS) {
    console.log(`\nProcessing ${target.name} (${target.iau})...`);

    // Find constellation in Stellarium data
    const constellation = stellariumData.constellations.find(c => {
      const match = c.id.match(/CON modern_iau (\w+)/);
      return match && match[1] === target.iau;
    });

    if (!constellation) {
      console.error(`ERROR: Constellation ${target.iau} not found in Stellarium data`);
      continue;
    }

    // Extract edges from Stellarium lines format
    const edges = extractEdgesFromLines(constellation.lines);
    console.log(`  - ${edges.length} edges`);

    // Get unique stars
    const constellationStars = getUniqueStars(edges);
    console.log(`  - ${constellationStars.length} constellation stars`);

    // Calculate bounding box
    const bbox = calculateBoundingBox(constellationStars, hipIndex, BOUNDING_BOX_PADDING_DEG);
    console.log(`  - Bounding box: RA ${bbox.minRa.toFixed(2)}° to ${bbox.maxRa.toFixed(2)}°, Dec ${bbox.minDec.toFixed(2)}° to ${bbox.maxDec.toFixed(2)}°`);

    // Find distractor stars
    const distractors = findDistractorStars(constellationStars, bbox, hipIndex);
    console.log(`  - ${distractors.length} distractor stars (mag ≤ ${DISTRACTOR_MAG_LIMIT})`);

    // Combine all stars
    const allStars = [...constellationStars, ...distractors];
    console.log(`  - ${allStars.length} total stars`);

    // Generate level JSON
    const levelJSON = generateLevelJSON(
      constellation,
      edges,
      allStars,
      hipIndex,
      target.level,
      target.iau,
      target.name
    );

    // Write to file
    const outputPath = path.join(outputDir, `${levelJSON.id}.json`);
    await fs.writeFile(outputPath, JSON.stringify(levelJSON, null, 2));
    console.log(`  ✓ Written to ${outputPath}`);
  }

  console.log('\n✓ All levels generated successfully!');
}

main().catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
