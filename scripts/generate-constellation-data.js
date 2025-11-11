/**
 * Script to generate authentic constellation data from Hipparcos catalog
 * and Stellarium FAB format constellation connections
 */

import https from 'https'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const HIPPARCOS_URL = 'https://raw.githubusercontent.com/svank/constellation-sketcher/master/constellation_data/hipparchos_catalog.tsv'
const CONSTELLATIONSHIP_URL = 'https://raw.githubusercontent.com/svank/constellation-sketcher/master/constellation_data/constellationship.fab'

// Constellations we want to generate (17 total across 4 tiers)
// Difficulty determines background star count and tier determines progression
const CONSTELLATIONS = {
  // Tier 1: Beginner (Simple shapes, few stars) - Difficulty 1-4
  Cru: { id: 'crux', name: 'Crux', latinName: 'Crux', tier: 1, difficulty: 1, hemisphere: 'southern' },
  Cas: { id: 'cassiopeia', name: 'Cassiopeia', latinName: 'Cassiopeia', tier: 1, difficulty: 2, hemisphere: 'northern' },
  Tri: { id: 'triangulum', name: 'Triangulum', latinName: 'Triangulum', tier: 1, difficulty: 3, hemisphere: 'northern' },
  Ari: { id: 'aries', name: 'Aries', latinName: 'Aries', tier: 1, difficulty: 4, hemisphere: 'both' },

  // Tier 2: Intermediate (Moderate complexity) - Difficulty 5-9
  Leo: { id: 'leo', name: 'Leo', latinName: 'Leo', tier: 2, difficulty: 5, hemisphere: 'both' },
  UMa: { id: 'ursa-major', name: 'Ursa Major', latinName: 'Ursa Major', tier: 2, difficulty: 6, hemisphere: 'northern' },
  Gem: { id: 'gemini', name: 'Gemini', latinName: 'Gemini', tier: 2, difficulty: 7, hemisphere: 'both' },
  Lyr: { id: 'lyra', name: 'Lyra', latinName: 'Lyra', tier: 2, difficulty: 8, hemisphere: 'northern' },
  Cyg: { id: 'cygnus', name: 'Cygnus', latinName: 'Cygnus', tier: 2, difficulty: 9, hemisphere: 'northern' },

  // Tier 3: Advanced (Complex patterns) - Difficulty 10-14
  Ori: { id: 'orion', name: 'Orion', latinName: 'Orion', tier: 3, difficulty: 10, hemisphere: 'both' },
  Sco: { id: 'scorpius', name: 'Scorpius', latinName: 'Scorpius', tier: 3, difficulty: 11, hemisphere: 'southern' },
  Sgr: { id: 'sagittarius', name: 'Sagittarius', latinName: 'Sagittarius', tier: 3, difficulty: 12, hemisphere: 'southern' },
  Per: { id: 'perseus', name: 'Perseus', latinName: 'Perseus', tier: 3, difficulty: 13, hemisphere: 'northern' },
  Aql: { id: 'aquila', name: 'Aquila', latinName: 'Aquila', tier: 3, difficulty: 14, hemisphere: 'both' },

  // Tier 4: Expert (Very complex) - Difficulty 15-17
  Eri: { id: 'eridanus', name: 'Eridanus', latinName: 'Eridanus', tier: 4, difficulty: 15, hemisphere: 'southern' },
  Dra: { id: 'draco', name: 'Draco', latinName: 'Draco', tier: 4, difficulty: 16, hemisphere: 'northern' },
  Hya: { id: 'hydra', name: 'Hydra', latinName: 'Hydra', tier: 4, difficulty: 17, hemisphere: 'southern' }
}

// Mythology data for all 17 constellations
const MYTHOLOGY = {
  // Tier 1: Beginner
  crux: {
    culture: 'Various',
    title: 'The Southern Cross',
    shortDescription: 'The smallest yet most famous constellation in the southern sky, used for navigation for centuries.',
    fullStory: 'Crux, commonly known as the Southern Cross, is the smallest of all 88 constellations but one of the most distinctive. Ancient Greeks saw it as part of Centaurus, but it became a separate constellation in the 16th century. For centuries, sailors have used it to find true south, as it points toward the South Celestial Pole. The constellation holds deep cultural significance for many Southern Hemisphere cultures, appearing on the flags of Australia, New Zealand, Brazil, and Papua New Guinea.'
  },
  cassiopeia: {
    culture: 'Greek',
    title: 'The Vain Queen',
    shortDescription: 'Cassiopeia was a vain queen who boasted about her beauty, angering the sea god Poseidon.',
    fullStory: 'Queen Cassiopeia of Ethiopia was known for her extraordinary beauty, but also her vanity. She boasted that she and her daughter Andromeda were more beautiful than the Nereids, sea nymphs who served Poseidon. Angered by this insult, Poseidon sent a sea monster to ravage the coast of Ethiopia. To appease the god, Cassiopeia\'s daughter Andromeda was chained to a rock as a sacrifice. She was saved by the hero Perseus, but Cassiopeia was punished by being placed in the sky, where she circles the celestial pole, spending half the year upside down as a lesson in humility. The constellation is easily recognized by its distinctive \'W\' or \'M\' shape.'
  },
  triangulum: {
    culture: 'Greek',
    title: 'The Triangle',
    shortDescription: 'A small constellation representing the Greek letter Delta or the island of Sicily.',
    fullStory: 'Triangulum is one of the 48 constellations listed by Ptolemy in the 2nd century. Ancient Greeks called it Deltoton, after the Greek letter Delta (Δ), which it resembles. Some myths associate it with the island of Sicily, which Zeus placed in the heavens to honor the island\'s triangular shape. Despite its small size, Triangulum is home to the Triangulum Galaxy (M33), one of the closest spiral galaxies to our own Milky Way, visible to the naked eye under dark skies.'
  },
  aries: {
    culture: 'Greek',
    title: 'The Golden Ram',
    shortDescription: 'Aries represents the golden ram whose fleece became the legendary Golden Fleece sought by Jason.',
    fullStory: 'In Greek mythology, Aries represents Chrysomallus, the flying ram with golden fleece. The ram rescued Phrixus and Helle, carrying them away from their stepmother who plotted to kill them. While Helle fell into the sea (giving her name to the Hellespont), Phrixus arrived safely in Colchis, where he sacrificed the ram to Zeus. The Golden Fleece was hung in a sacred grove, guarded by a dragon, until Jason and the Argonauts came to claim it. Aries is one of the twelve zodiac constellations and was the location of the vernal equinox in ancient times.'
  },

  // Tier 2: Intermediate
  leo: {
    culture: 'Greek',
    title: 'The Nemean Lion',
    shortDescription: 'Leo represents the fearsome lion slain by Hercules as the first of his twelve labors.',
    fullStory: 'Leo represents the Nemean Lion, a fearsome beast with an impenetrable hide that terrorized the region of Nemea. As the first of his twelve labors, Hercules was tasked with slaying this invulnerable lion. Unable to harm it with weapons, Hercules wrestled the lion with his bare hands and strangled it. He then used the lion\'s own claws to skin it, and wore its hide as armor. Zeus honored the lion by placing it among the stars. Leo has been associated with lions since ancient times by many cultures, including the Egyptians and Mesopotamians. The constellation contains the bright star Regulus, known as the "heart of the lion."'
  },
  'ursa-major': {
    culture: 'Greek',
    title: 'The Great Bear',
    shortDescription: 'Ursa Major represents Callisto, a nymph who was turned into a bear by Zeus\'s jealous wife Hera.',
    fullStory: 'In Greek mythology, Callisto was a beautiful nymph and follower of Artemis. Zeus fell in love with her, which angered his wife Hera. As punishment, Hera transformed Callisto into a bear. Years later, Callisto\'s son Arcas nearly killed her while hunting, not recognizing his mother. To prevent this tragedy, Zeus placed them both in the heavens as Ursa Major (the Great Bear) and Ursa Minor (the Little Bear). The constellation is best known for containing the Big Dipper, one of the most recognizable star patterns in the sky. Ancient cultures worldwide have their own stories about this prominent constellation.'
  },
  gemini: {
    culture: 'Greek',
    title: 'The Twins',
    shortDescription: 'Gemini represents Castor and Pollux, twin brothers who were inseparable even in death.',
    fullStory: 'Gemini represents the twin brothers Castor and Pollux (known as the Dioscuri). Though twins, only Pollux was immortal, being the son of Zeus, while Castor was mortal. The brothers were inseparable, sailing with Jason and the Argonauts and participating in many adventures. When Castor was killed in battle, Pollux was devastated. He begged Zeus to let him share his immortality with his brother. Moved by this love, Zeus placed both brothers in the sky, where they remain together forever. Sailors considered the twins their patrons, and the appearance of their stars was thought to calm rough seas.'
  },
  lyra: {
    culture: 'Greek',
    title: 'The Lyre',
    shortDescription: 'Lyra represents the musical instrument of Orpheus, the legendary musician who could charm all living things.',
    fullStory: 'Lyra represents the lyre of Orpheus, the legendary musician whose songs could charm all living things and even stones. Apollo gave Orpheus the lyre, and he became the most talented musician in the world. When his wife Eurydice died, Orpheus descended to the underworld, and his music moved even Hades. The god of death agreed to return Eurydice on one condition: Orpheus must not look back at her until they reached the surface. Tragically, Orpheus looked back too soon, losing Eurydice forever. After his death, Zeus placed his lyre in the sky. The constellation contains Vega, one of the brightest stars in the night sky.'
  },
  cygnus: {
    culture: 'Greek',
    title: 'The Swan',
    shortDescription: 'Cygnus represents the form Zeus took to seduce Leda, or alternatively, the tragic Phaethon.',
    fullStory: 'Cygnus has multiple origin stories in Greek mythology. Most commonly, it represents Zeus in the form of a swan, who seduced Leda, the queen of Sparta. From this union came Helen of Troy and Pollux. Alternatively, Cygnus represents Phaethon\'s friend Cycnus, who searched the river Eridanus so devotedly for Phaethon\'s body that the gods transformed him into a swan. The constellation is also known as the Northern Cross due to its distinctive cross shape. It contains the star Deneb, one of the brightest stars visible from Earth and the most distant first-magnitude star, located about 2,600 light-years away.'
  },

  // Tier 3: Advanced
  orion: {
    culture: 'Greek',
    title: 'The Hunter',
    shortDescription: 'Orion was a legendary hunter who boasted he could kill any creature on Earth.',
    fullStory: 'In Greek mythology, Orion was a giant huntsman whom Zeus placed among the stars. He is often depicted as holding a club and shield, with a sword hanging from his belt (represented by the three stars of Orion\'s Belt). According to legend, Orion boasted that he could kill any animal on Earth. This angered Gaia, who sent a scorpion to kill him. Both Orion and the scorpion were placed in the sky, but on opposite sides, so when Scorpius rises in the east, Orion flees below the western horizon. Orion is one of the most recognizable constellations and has been identified by cultures worldwide throughout history.'
  },
  scorpius: {
    culture: 'Greek',
    title: 'The Scorpion',
    shortDescription: 'The deadly scorpion sent by Gaia to kill the boastful hunter Orion.',
    fullStory: 'Scorpius represents the scorpion that killed Orion. When the great hunter Orion boasted that he could kill any creature on Earth, the goddess Gaia became angry at his pride. She sent a giant scorpion to humble him. Despite Orion\'s great strength and skill, the scorpion\'s deadly sting proved fatal. Both were placed in the heavens, but as a reminder of their eternal chase, when Scorpius rises in the east, Orion sets in the west, fleeing his ancient enemy. The constellation contains Antares, a red supergiant star whose name means "rival of Mars" due to its distinctive red color.'
  },
  sagittarius: {
    culture: 'Greek',
    title: 'The Archer',
    shortDescription: 'Sagittarius represents Chiron, the wise centaur who trained many Greek heroes.',
    fullStory: 'Sagittarius is often associated with Chiron, the wisest and most civilized of the centaurs. Unlike his wild brethren, Chiron was a scholar, physician, and teacher who mentored many Greek heroes including Achilles, Jason, and Hercules. Tragically, Chiron was accidentally wounded by one of Hercules\' poisoned arrows. Being immortal, he could not die but suffered eternal agony. He eventually gave up his immortality to end his suffering, and Zeus honored him by placing him among the stars. The constellation points toward the center of our Milky Way galaxy and is best known for the "Teapot" asterism formed by its brightest stars.'
  },
  perseus: {
    culture: 'Greek',
    title: 'The Hero',
    shortDescription: 'Perseus, the hero who slew Medusa and rescued Andromeda from a sea monster.',
    fullStory: 'Perseus was one of the greatest heroes of Greek mythology. His most famous feat was slaying Medusa, one of the three Gorgons, whose gaze could turn people to stone. Using a polished shield to view her reflection, Perseus beheaded Medusa. On his journey home, he rescued Andromeda, who had been chained to a rock as a sacrifice to a sea monster. Perseus used Medusa\'s head to turn the monster to stone. He married Andromeda, and after their deaths, the gods placed them both in the sky along with Cassiopeia, Cepheus, and the sea monster Cetus. The constellation contains the famous variable star Algol, known as the "Demon Star."'
  },
  aquila: {
    culture: 'Greek',
    title: 'The Eagle',
    shortDescription: 'Aquila represents the eagle of Zeus, who carried the god\'s thunderbolts and performed his tasks.',
    fullStory: 'Aquila represents the eagle of Zeus, king of the gods. This mighty bird served as Zeus\'s messenger and the bearer of his thunderbolts. In one tale, Zeus sent the eagle to abduct Ganymede, the most beautiful youth in the world, to serve as cupbearer to the gods. In another story, Aquila represents the eagle that daily tormented Prometheus, eating his liver as punishment for giving fire to humanity. Each night Prometheus\'s liver would regenerate, only to be eaten again the next day, until Hercules finally freed him. The constellation contains Altair, one of the brightest stars in the sky and one of the vertices of the Summer Triangle.'
  },

  // Tier 4: Expert
  eridanus: {
    culture: 'Greek',
    title: 'The River',
    shortDescription: 'Eridanus represents the river where Phaethon fell after losing control of the sun chariot.',
    fullStory: 'Eridanus represents the river into which Phaethon fell when he lost control of his father Helios\'s sun chariot. Phaethon, son of the sun god Helios, demanded to drive his father\'s chariot across the sky to prove his divine parentage. Despite warnings, Helios reluctantly agreed. Phaethon quickly lost control of the powerful horses, careening wildly across the sky, scorching the earth and creating the Sahara desert. To prevent further destruction, Zeus struck Phaethon down with a thunderbolt, and he fell into the river Eridanus. Phaethon\'s sisters, the Heliades, mourned him so greatly that they were transformed into poplar trees, their tears becoming amber. Eridanus is the longest constellation in the sky, winding from Orion down to the southern horizon.'
  },
  draco: {
    culture: 'Greek',
    title: 'The Dragon',
    shortDescription: 'Draco represents Ladon, the hundred-headed dragon who guarded the golden apples of the Hesperides.',
    fullStory: 'Draco represents Ladon, the fearsome dragon with one hundred heads who never slept. Ladon guarded the golden apples in the Garden of the Hesperides, which Gaia gave to Hera as a wedding present. As one of his twelve labors, Hercules was tasked with stealing these apples. He either slew Ladon with poisoned arrows or convinced Atlas to get the apples while he held up the sky. Hera, saddened by the death of her faithful guardian, placed Ladon in the sky as the constellation Draco. The constellation winds around the north celestial pole, and thousands of years ago, the star Thuban in Draco served as the pole star, used by the ancient Egyptians to align the pyramids.'
  },
  hydra: {
    culture: 'Greek',
    title: 'The Water Serpent',
    shortDescription: 'Hydra represents the nine-headed serpent slain by Hercules as one of his twelve labors.',
    fullStory: 'Hydra represents the Lernaean Hydra, a monstrous serpent with nine heads that grew two more whenever one was cut off. Its breath and blood were so poisonous that even its scent was deadly. As the second of his twelve labors, Hercules was sent to kill this creature. Each time he cut off a head, two more grew back. Hercules realized he needed help and called upon his nephew Iolaus, who cauterized each neck stump with fire as Hercules cut off the heads, preventing them from regenerating. Hercules buried the final, immortal head under a massive rock. Hera, who sent the Hydra, placed it in the sky. Hydra is the largest constellation in the night sky, stretching across more than a quarter of the celestial sphere.'
  }
}

/**
 * Fetch data from URL
 */
function fetchData(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = ''
      res.on('data', (chunk) => data += chunk)
      res.on('end', () => resolve(data))
    }).on('error', reject)
  })
}

/**
 * Parse RA in hms format to degrees
 * Format: "05 14 32.27" -> decimal degrees
 */
function parseRA(raStr) {
  const [hours, minutes, seconds] = raStr.trim().split(/\s+/).map(parseFloat)
  return (hours + minutes / 60 + seconds / 3600) * 15 // Convert to degrees
}

/**
 * Parse Dec in dms format to degrees
 * Format: "-08 12 05.9" -> decimal degrees
 */
function parseDec(decStr) {
  const parts = decStr.trim().split(/\s+/)
  const sign = parts[0].startsWith('-') ? -1 : 1
  const degrees = Math.abs(parseFloat(parts[0]))
  const minutes = parseFloat(parts[1])
  const seconds = parseFloat(parts[2])
  return sign * (degrees + minutes / 60 + seconds / 3600)
}

/**
 * Parse Hipparcos catalog TSV file
 * Returns a Map of HIP ID -> star data
 */
function parseHipparcosCatalog(tsvData) {
  const stars = new Map()
  const lines = tsvData.split('\n')

  for (const line of lines) {
    if (!line.trim() || line.startsWith('#')) continue

    const parts = line.split(';')
    if (parts.length < 4) continue

    const hip = parseInt(parts[0].trim())
    const ra = parts[1].trim()
    const dec = parts[2].trim()
    const vmag = parseFloat(parts[3].trim())

    if (isNaN(hip) || isNaN(vmag)) continue

    stars.set(hip, {
      hip,
      ra: parseRA(ra),
      dec: parseDec(dec),
      magnitude: vmag
    })
  }

  return stars
}

/**
 * Parse constellation connections from FAB format
 * Format: "Ori 23 26727 26311 26311 25930 ..."
 * Returns Map of constellation abbreviation -> array of [hip1, hip2] pairs
 */
function parseConstellationConnections(fabData) {
  const constellations = new Map()
  const lines = fabData.split('\n')

  for (const line of lines) {
    if (!line.trim()) continue

    const parts = line.trim().split(/\s+/)
    const abbr = parts[0]
    const numSegments = parseInt(parts[1])
    const hipIds = parts.slice(2).map(id => parseInt(id))

    // Convert to pairs
    const connections = []
    for (let i = 0; i < hipIds.length - 1; i += 2) {
      connections.push([hipIds[i], hipIds[i + 1]])
    }

    constellations.set(abbr, connections)
  }

  return constellations
}

/**
 * Convert RA/Dec to screen coordinates
 * Uses cos(dec) correction for RA to account for spherical distortion
 */
function projectToScreen(stars, width = 800, height = 600) {
  if (stars.length === 0) return stars

  // Find bounds
  const ras = stars.map(s => s.ra)
  const decs = stars.map(s => s.dec)
  const raMin = Math.min(...ras)
  const raMax = Math.max(...ras)
  const decMin = Math.min(...decs)
  const decMax = Math.max(...decs)

  const decCenter = (decMin + decMax) / 2

  // Convert to radians for cos correction
  const decCenterRad = decCenter * Math.PI / 180

  // Apply cos(dec) correction to RA
  // At higher declinations, degrees of RA represent smaller angular distances
  const projected = stars.map(star => ({
    ...star,
    projX: (star.ra - raMin) * Math.cos(decCenterRad),
    projY: star.dec - decMin
  }))

  // Find bounds of corrected coordinates
  const projXs = projected.map(s => s.projX)
  const projYs = projected.map(s => s.projY)
  const xMin = Math.min(...projXs)
  const xMax = Math.max(...projXs)
  const yMin = Math.min(...projYs)
  const yMax = Math.max(...projYs)

  const xSpan = xMax - xMin
  const ySpan = yMax - yMin

  // Add padding
  const padding = 50
  const availableWidth = width - 2 * padding
  const availableHeight = height - 2 * padding

  // Scale to fit (maintaining aspect ratio)
  const scale = Math.min(
    availableWidth / (xSpan || 1),
    availableHeight / (ySpan || 1)
  )

  return projected.map(star => ({
    ...star,
    x: padding + (xMax - star.projX) * scale, // Flip X: mirror horizontally
    y: padding + (yMax - star.projY) * scale  // Flip Y: higher dec = top
  }))
}

/**
 * Get star color based on magnitude
 */
function getStarColor(magnitude) {
  if (magnitude < 1.0) return '#ffffff'  // Brightest - white
  if (magnitude < 2.0) return '#e8f4f8'  // Very bright - blue-white
  if (magnitude < 3.0) return '#ffffff'  // Bright - white
  return '#d0d0d0'  // Dimmer - gray
}

/**
 * Generate constellation data
 */
async function generateConstellationData() {
  console.log('Fetching Hipparcos catalog...')
  const hipparcosData = await fetchData(HIPPARCOS_URL)

  console.log('Fetching constellation connections...')
  const fabData = await fetchData(CONSTELLATIONSHIP_URL)

  console.log('Parsing data...')
  const starCatalog = parseHipparcosCatalog(hipparcosData)
  const connections = parseConstellationConnections(fabData)

  console.log(`Loaded ${starCatalog.size} stars`)

  const constellationData = []

  for (const [abbr, info] of Object.entries(CONSTELLATIONS)) {
    console.log(`\nProcessing ${info.name}...`)

    const constellationConnections = connections.get(abbr)
    if (!constellationConnections) {
      console.log(`  No connections found for ${abbr}`)
      continue
    }

    // Get unique HIP IDs
    const hipIds = new Set()
    constellationConnections.forEach(([hip1, hip2]) => {
      hipIds.add(hip1)
      hipIds.add(hip2)
    })

    console.log(`  Found ${hipIds.size} stars and ${constellationConnections.length} connections`)

    // Get star data
    const stars = []
    for (const hip of hipIds) {
      const star = starCatalog.get(hip)
      if (star) {
        stars.push(star)
      } else {
        console.log(`  Warning: Star ${hip} not found in catalog`)
      }
    }

    // Project to screen coordinates
    const projectedStars = projectToScreen(stars)

    // Build constellation object
    const constellation = {
      id: info.id,
      name: info.name,
      latinName: info.latinName,
      abbreviation: abbr,
      hemisphere: info.hemisphere,
      tier: info.tier,
      difficulty: info.difficulty,
      stars: projectedStars.map(star => ({
        id: `hip-${star.hip}`,
        name: `HIP ${star.hip}`,
        hip: star.hip,
        position: { x: star.x, y: star.y },
        magnitude: star.magnitude,
        color: getStarColor(star.magnitude),
        ra: star.ra,
        dec: star.dec
      })),
      connections: constellationConnections.map(([hip1, hip2]) => [
        `hip-${hip1}`,
        `hip-${hip2}`
      ]),
      mythology: MYTHOLOGY[info.id]
    }

    constellationData.push(constellation)
  }

  // Write to file
  const outputPath = path.join(__dirname, '../src/assets/data/constellations.json')
  fs.writeFileSync(outputPath, JSON.stringify(constellationData, null, 2))

  console.log(`\n✓ Generated constellation data saved to ${outputPath}`)
  console.log(`  Total constellations: ${constellationData.length}`)
}

// Run the script
generateConstellationData().catch(console.error)
