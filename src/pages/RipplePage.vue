<template>
  <q-page class="ripple-page" :style="{ background: themeStore.colors.gradient }">
    <!-- Game Header -->
    <div class="game-header">
      <q-btn fab-mini flat icon="arrow_back" color="white" @click="goBack" />

      <div class="level-badge">
        <div class="text-caption text-white text-center q-mb-xs">Level {{ currentLevel }}</div>
        <div class="level-stats">
          <div class="stat-item">
            <q-icon name="touch_app" color="white" size="16px" />
            <span class="text-body2 text-white text-weight-bold">{{ tapsRemaining }}</span>
          </div>
          <div class="stat-item">
            <q-icon name="stars" color="amber" size="16px" />
            <span class="text-body2 text-white text-weight-bold">{{ totalScore }}</span>
          </div>
        </div>
      </div>

      <div class="header-menu">
        <q-btn
          fab-mini
          flat
          icon="more_vert"
          color="white"
          @click="toggleMenu"
          :class="['menu-button', { 'menu-button-active': showMenu }]"
        />

        <transition-group name="menu-fade" tag="div" class="menu-buttons-container">
          <q-btn
            v-if="showMenu"
            key="refresh"
            fab-mini
            flat
            icon="refresh"
            color="white"
            class="menu-item menu-item-1"
            @click="restartLevel"
          />
          <q-btn
            v-if="showMenu"
            key="help"
            fab-mini
            flat
            icon="help_outline"
            color="white"
            class="menu-item menu-item-2"
            @click="openInstructions"
          />
        </transition-group>
      </div>
    </div>

    <!-- Full Screen Canvas -->
    <canvas
      ref="gameCanvas"
      class="game-canvas"
      @touchstart="handleTouchStart"
      @touchend="handleTouchEnd"
      @mousedown="handleMouseDown"
      @mouseup="handleMouseUp"
    ></canvas>

    <!-- Tap to Start Hint -->
    <div v-if="clicksRemaining > 0 && !gameStarted && showTapHint" class="tap-hint">
      <q-icon name="touch_app" color="white" size="lg" />
      <div class="text-white text-h6 q-mt-sm">Tap to Create Ripples</div>
    </div>

    <!-- Instructions Dialog -->
    <q-dialog v-model="showInstructions">
      <q-card class="instructions-card">
        <q-card-section>
          <div class="text-h6 q-mb-md text-white">How to Play</div>
          <div class="text-body2 text-white">
            <p>• Tap the water to create ripples</p>
            <p>• Ripples must reach lotus flowers to activate them</p>
            <p>• Hold tap longer for stronger ripples</p>
            <p>• Stones reflect ripples</p>
            <p>• Lily pads absorb ripples</p>
            <p>• Multiple ripples combine their power</p>
            <p>• Activate all lotus flowers within tap limit</p>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat color="white" label="Close" @click="showInstructions = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Level Complete Dialog -->
    <q-dialog v-model="showWinDialog" persistent>
      <q-card class="win-card">
        <q-card-section class="text-center">
          <div class="text-h4 text-white q-mb-md">Level Complete!</div>

          <!-- Stars -->
          <div class="stars-container q-mb-md">
            <q-icon
              v-for="star in 3"
              :key="star"
              :name="star <= starsEarned ? 'star' : 'star_outline'"
              :color="star <= starsEarned ? 'amber' : 'grey-5'"
              size="3rem"
            />
          </div>

          <!-- Score -->
          <div class="text-h5 text-white q-mb-sm">+{{ levelScore }} points</div>

          <!-- Stats -->
          <div class="stats-grid q-mt-md">
            <div class="stat-item">
              <div class="text-caption text-grey-4">Taps Used</div>
              <div class="text-h6 text-white">{{ tapsUsed }}</div>
            </div>
            <div class="stat-item">
              <div class="text-caption text-grey-4">Optimal</div>
              <div class="text-h6 text-white">{{ level.optimalTaps }}</div>
            </div>
            <div class="stat-item">
              <div class="text-caption text-grey-4">Total Score</div>
              <div class="text-h6 text-white">{{ totalScore }}</div>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="center">
          <q-btn unelevated color="primary" label="Next Level" @click="nextLevel" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Level Failed Dialog -->
    <q-dialog v-model="showLoseDialog" persistent>
      <q-card class="lose-card">
        <q-card-section class="text-center">
          <div class="text-h5 text-white q-mb-md">Try Again</div>
          <div class="text-body1 text-white q-mb-sm">
            Activated: {{ activatedCount }}/{{ totalLotus }}
          </div>
          <div v-if="failureStreak >= 5" class="text-caption text-red-3 q-mt-sm">
            Failure streak: {{ failureStreak }}
            <div class="text-caption">(-1 point every 5 failures)</div>
          </div>
        </q-card-section>
        <q-card-actions align="center">
          <q-btn unelevated color="primary" label="Retry" @click="retryLevel" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useThemeStore } from 'src/stores/theme'
import { useProgressStore } from 'src/stores/progress'
import { useHaptics } from 'src/composables/useHaptics'

const router = useRouter()
const themeStore = useThemeStore()
const progressStore = useProgressStore()
const haptics = useHaptics()

// Canvas ref
const gameCanvas = ref(null)
let ctx = null
let animationId = null

// Game state
const currentLevel = ref(1)
const tapsRemaining = ref(3)
const tapsUsed = ref(0)
const clicksRemaining = ref(1)
const gameStarted = ref(false)
const showTapHint = ref(true)
const hasShownInitialHint = ref(false)

// Scoring
const totalScore = ref(0)
const levelScore = ref(0)
const starsEarned = ref(0)
const failureStreak = ref(0)

// Animation time for water effects
let animationTime = 0

// Dialogs
const showInstructions = ref(false)
const showWinDialog = ref(false)
const showLoseDialog = ref(false)
const showMenu = ref(false)

// Level data
const level = ref({
  lotusFlowers: [],
  obstacles: [],
  tapsAllowed: 3,
  optimalTaps: 2
})

// Game objects
let ripples = []

// Audio
let splashSounds = []
let lastAudioPlayTime = 0

// Asset images
let loadedImages = {
  flowers: [],
  lilyPads: [],
  rocks: [],
  reeds: [],
  fish: []
}
let imagesLoaded = false

// Tap tracking for strength detection
let touchStartTime = 0
let touchStartPos = { x: 0, y: 0 }
let isProcessingTap = false

// Tap strength configs
const TAP_CONFIGS = {
  light: {
    speed: 2,
    maxRadius: 250,
    peakRadius: 125,
    peakPower: 0.9,
    lineWidth: 2,
    glowIntensity: 15
  },
  medium: {
    speed: 1.5,
    maxRadius: 350,
    peakRadius: 150,
    peakPower: 1.0,
    lineWidth: 2.5,
    glowIntensity: 20
  },
  strong: {
    speed: 1.2,
    maxRadius: 450,
    peakRadius: 200,
    peakPower: 1.2,
    lineWidth: 3,
    glowIntensity: 30
  }
}

// Water colors based on time of day
const waterColors = computed(() => {
  const period = themeStore.period.key

  const colorSchemes = {
    night: {
      base: '#0a1628',
      gradientStart: '#1a2847',
      gradientMid: '#0f1e3a',
      gradientEnd: '#0a1628'
    },
    dawn: {
      base: '#4a2c5e',
      gradientStart: '#7a4c8e',
      gradientMid: '#5a3c7e',
      gradientEnd: '#4a2c5e'
    },
    morning: {
      base: '#1a5f7a',
      gradientStart: '#3a8faa',
      gradientMid: '#2a7f9a',
      gradientEnd: '#1a5f7a'
    },
    midday: {
      base: '#0a3a52',
      gradientStart: '#1a6a8a',
      gradientMid: '#155a7a',
      gradientEnd: '#0a3a52'
    },
    afternoon: {
      base: '#2a5f7a',
      gradientStart: '#4a8faa',
      gradientMid: '#3a7f9a',
      gradientEnd: '#2a5f7a'
    },
    evening: {
      base: '#3a2f52',
      gradientStart: '#5a4f7a',
      gradientMid: '#4a3f6a',
      gradientEnd: '#3a2f52'
    },
    dusk: {
      base: '#2a1f42',
      gradientStart: '#4a3f6a',
      gradientMid: '#3a2f5a',
      gradientEnd: '#2a1f42'
    }
  }

  return colorSchemes[period] || colorSchemes.midday
})

const activatedCount = computed(() => {
  return level.value.lotusFlowers.filter(l => l.isActivated).length
})

const totalLotus = computed(() => level.value.lotusFlowers.length)

// Initialize canvas
onMounted(async () => {
  if (!gameCanvas.value) return

  ctx = gameCanvas.value.getContext('2d')

  // Load assets
  await loadAssets()

  // Load splash sounds using Vite's import.meta.url for proper bundling
  try {
    const splashFiles = [
      new URL('../assets/audio/water/563858__nknverpacker__watersplash04.wav', import.meta.url).href,
      new URL('../assets/audio/water/563859__nknverpacker__watersplash03.wav', import.meta.url).href,
      new URL('../assets/audio/water/563860__nknverpacker__watersplash02.wav', import.meta.url).href,
      new URL('../assets/audio/water/563861__nknverpacker__watersplash01.wav', import.meta.url).href
    ]

    splashSounds = splashFiles.map(file => {
      const audio = new Audio(file)
      audio.volume = 0.3
      return audio
    })
    console.log('Loaded splash sounds:', splashSounds.length)
  } catch (error) {
    console.warn('Failed to load splash sounds:', error)
  }

  // Set canvas size
  const resizeCanvas = () => {
    gameCanvas.value.width = window.innerWidth
    gameCanvas.value.height = window.innerHeight
  }

  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)

  // Initialize first level
  initLevel()

  // Show tap hint only on first load, then auto-hide after 2 seconds
  if (!hasShownInitialHint.value) {
    showTapHint.value = true
    hasShownInitialHint.value = true
    setTimeout(() => {
      showTapHint.value = false
    }, 2000)
  }

  // Start game loop
  startGameLoop()

  // Cleanup
  onUnmounted(() => {
    window.removeEventListener('resize', resizeCanvas)
    stopGameLoop()
  })
})

async function loadAssets() {
  // Import all assets explicitly - Vite requires this for proper bundling
  const assetImports = {
    flowers: [
      new URL('../assets/images/ripple/flower-1.svg', import.meta.url).href,
      new URL('../assets/images/ripple/flower-2.svg', import.meta.url).href,
      new URL('../assets/images/ripple/flower-3.svg', import.meta.url).href,
      new URL('../assets/images/ripple/flower-4.svg', import.meta.url).href
    ],
    lilyPads: [
      new URL('../assets/images/ripple/lily-pad-1.svg', import.meta.url).href,
      new URL('../assets/images/ripple/lily-pad-2.svg', import.meta.url).href,
      new URL('../assets/images/ripple/lily-pad-3.svg', import.meta.url).href,
      new URL('../assets/images/ripple/lily-pad-4.svg', import.meta.url).href,
      new URL('../assets/images/ripple/lily-pad-5.svg', import.meta.url).href,
      new URL('../assets/images/ripple/lily-pad-6.svg', import.meta.url).href
    ],
    rocks: [
      new URL('../assets/images/ripple/rock-1.svg', import.meta.url).href,
      new URL('../assets/images/ripple/rock-2.svg', import.meta.url).href,
      new URL('../assets/images/ripple/rock-3.svg', import.meta.url).href,
      new URL('../assets/images/ripple/rock-4.svg', import.meta.url).href
    ],
    reeds: [
      new URL('../assets/images/ripple/reed-1.svg', import.meta.url).href,
      new URL('../assets/images/ripple/reed-2.svg', import.meta.url).href,
      new URL('../assets/images/ripple/reed-3.svg', import.meta.url).href
    ],
    fish: [
      new URL('../assets/images/ripple/fish-1.svg', import.meta.url).href,
      new URL('../assets/images/ripple/fish-2.svg', import.meta.url).href,
      new URL('../assets/images/ripple/fish-3.svg', import.meta.url).href
    ]
  }

  const loadPromises = []

  for (const [type, paths] of Object.entries(assetImports)) {
    for (const path of paths) {
      const img = new Image()
      img.src = path

      const loadPromise = new Promise((resolve) => {
        img.onload = () => {
          console.log(`Loaded: ${path}`)
          resolve()
        }
        img.onerror = () => {
          console.warn(`Failed to load ${path}`)
          resolve() // Resolve anyway to not block other images
        }
        // Timeout after 5 seconds
        setTimeout(() => resolve(), 5000)
      })

      loadPromises.push(loadPromise)
      loadedImages[type].push(img)
    }
  }

  // Wait for all images to load
  await Promise.all(loadPromises)
  imagesLoaded = true
  console.log('All assets loaded:', loadedImages)
}

function initLevel() {
  generateLevel(currentLevel.value)

  tapsRemaining.value = level.value.tapsAllowed
  tapsUsed.value = 0
  ripples = []
  gameStarted.value = false
}

// Seeded random number generator
function seededRandom(seed) {
  let value = seed
  return () => {
    value = (value * 9301 + 49297) % 233280
    return value / 233280
  }
}

function generateLevel(levelNum) {
  const canvas = gameCanvas.value
  const width = canvas.width
  const height = canvas.height

  // Use level number as seed for consistent level generation
  const rng = seededRandom(levelNum * 12345)

  // Calculate level difficulty with gentler curve
  const lotusCount = Math.min(2 + Math.floor(levelNum / 4), 5) // Slower flower increase
  const stoneCount = Math.min(Math.floor((levelNum - 1) / 3), 3) // Fewer stones, start later
  const extraLilypadGroupCount = Math.min(Math.floor((levelNum - 2) / 4), 2) // Even fewer lily pad groups
  const leafCount = 0 // Disabled - leaves were using lily pad images and causing confusion

  // Tighter tap allowance - typically just 1-2 taps per lotus
  level.value.tapsAllowed = Math.max(2, Math.ceil(lotusCount * 0.6) + Math.floor(levelNum / 8))
  level.value.optimalTaps = Math.max(1, Math.ceil(lotusCount * 0.5))

  // Generate obstacles first (we'll add lily pads for flowers later)
  level.value.obstacles = []
  level.value.lotusFlowers = []
  const minSpacing = 150 // Increased spacing between flowers
  const margin = 80
  const topMargin = 180 // Extra margin at top for header + status bar

  // Generate lotus flowers WITH lily pads underneath
  for (let i = 0; i < lotusCount; i++) {
    let attempts = 0
    let position

    while (attempts < 100) {
      position = {
        x: margin + rng() * (width - 2 * margin),
        y: topMargin + rng() * (height - topMargin - margin)
      }

      // Check spacing from other lotus flowers and obstacles
      const tooCloseToLotus = level.value.lotusFlowers.some(
        lotus => distance(position, lotus.position) < minSpacing
      )
      const tooCloseToObstacle = level.value.obstacles.some(
        obs => distance(position, obs.position) < 100 // Increased minimum distance
      )

      if (!tooCloseToLotus && !tooCloseToObstacle) break
      attempts++
    }

    // First create the lily pad base (doesn't block waves)
    const lilyPadIndex = loadedImages.lilyPads.length > 0 ? Math.floor(rng() * loadedImages.lilyPads.length) : 0
    const lilyPadRotation = rng() * Math.PI * 2
    const lilyPadScale = 1.2 + rng() * 0.4 // Larger: 1.2-1.6

    level.value.obstacles.push({
      id: `lilypad_lotus_${i}`,
      type: 'lilypad-base', // Special type that doesn't block waves
      position,
      radius: 50, // Bigger radius so lily pad is larger
      imageIndex: lilyPadIndex,
      rotation: lilyPadRotation,
      scale: lilyPadScale
    })

    // Then create the lotus flower on top
    level.value.lotusFlowers.push({
      id: `lotus_${i}`,
      position,
      activationThreshold: 0.65 + rng() * 0.15,
      protectedRadius: 50,
      isActivated: false,
      glowIntensity: 0.3,
      currentPower: 0,
      imageIndex: loadedImages.flowers.length > 0 ? Math.floor(rng() * loadedImages.flowers.length) : 0,
      rotation: rng() * Math.PI * 2,
      scale: 0.6 + rng() * 0.3 // Smaller flower: 0.6-0.9
    })
  }

  // Stones (block waves) - keep them away from flowers
  for (let i = 0; i < stoneCount; i++) {
    let attempts = 0
    let position

    while (attempts < 100) {
      position = {
        x: margin + rng() * (width - 2 * margin),
        y: topMargin + rng() * (height - topMargin - margin)
      }

      const minDistToLotus = 180 // Much larger buffer around flowers
      const minDistToObstacle = 80 // Increased spacing between obstacles

      const tooCloseToLotus = level.value.lotusFlowers.some(
        lotus => distance(position, lotus.position) < minDistToLotus
      )
      const tooCloseToObstacle = level.value.obstacles.some(
        obs => distance(position, obs.position) < minDistToObstacle
      )

      // Also ensure stones don't block paths between flowers
      const blocksFlowerPath = level.value.lotusFlowers.some((lotus1, idx1) => {
        return level.value.lotusFlowers.some((lotus2, idx2) => {
          if (idx1 >= idx2) return false
          // Check if stone is on the line between two flowers
          const lineToFlower = pointToLineDistance(position, lotus1.position, lotus2.position)
          return lineToFlower < 120 // Keep stones away from flower-to-flower paths
        })
      })

      if (!tooCloseToLotus && !tooCloseToObstacle && !blocksFlowerPath) break
      attempts++
    }

    level.value.obstacles.push({
      id: `stone_${i}`,
      type: 'stone',
      position,
      radius: 25 + rng() * 10,
      imageIndex: loadedImages.rocks.length > 0 ? Math.floor(rng() * loadedImages.rocks.length) : 0,
      rotation: rng() * Math.PI * 2,
      scale: 0.8 + rng() * 0.4
    })
  }

  // Decorative lily pad groups (block waves) - place carefully to not block flowers
  for (let g = 0; g < extraLilypadGroupCount; g++) {
    // Pick a random spot for the group
    let groupCenter
    let attempts = 0

    while (attempts < 100) {
      groupCenter = {
        x: margin + rng() * (width - 2 * margin),
        y: topMargin + rng() * (height - topMargin - margin)
      }

      const minDistToLotus = 200 // Much larger buffer - these move and can block flowers
      const minDistToObstacle = 100

      const tooCloseToLotus = level.value.lotusFlowers.some(
        lotus => distance(groupCenter, lotus.position) < minDistToLotus
      )
      const tooCloseToObstacle = level.value.obstacles.some(
        obs => obs.type !== 'lilypad-base' && distance(groupCenter, obs.position) < minDistToObstacle
      )

      // Ensure lily pad groups don't block paths between flowers
      const blocksFlowerPath = level.value.lotusFlowers.some((lotus1, idx1) => {
        return level.value.lotusFlowers.some((lotus2, idx2) => {
          if (idx1 >= idx2) return false
          const lineToFlower = pointToLineDistance(groupCenter, lotus1.position, lotus2.position)
          return lineToFlower < 150 // Large buffer for moving obstacles
        })
      })

      if (!tooCloseToLotus && !tooCloseToObstacle && !blocksFlowerPath) break
      attempts++
    }

    // Create 2-3 lily pads in a cluster (reduced from 2-4)
    const groupSize = 2 + Math.floor(rng() * 2)
    const boundsSize = 120 + rng() * 80 // Larger movement area to spread them out

    // Calculate bounds that avoid static lily pads
    let boundsCenterX = groupCenter.x
    let boundsCenterY = groupCenter.y

    // Check if bounds would overlap any static lily pad bases and adjust if needed
    const staticLilyPads = level.value.obstacles.filter(obs => obs.type === 'lilypad-base')
    staticLilyPads.forEach(staticPad => {
      const dx = staticPad.position.x - groupCenter.x
      const dy = staticPad.position.y - groupCenter.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      // If static lily pad is too close, shift bounds center away from it
      if (dist < boundsSize + 80) {
        const pushDist = boundsSize + 80 - dist
        const angle = Math.atan2(dy, dx)
        boundsCenterX -= Math.cos(angle) * pushDist * 0.5
        boundsCenterY -= Math.sin(angle) * pushDist * 0.5
      }
    })

    for (let i = 0; i < groupSize; i++) {
      const angle = (i / groupSize) * Math.PI * 2 + rng() * 0.5
      const dist = 60 + rng() * 60 // Increased spacing (was 30 + rng() * 40)
      const position = {
        x: groupCenter.x + Math.cos(angle) * dist,
        y: groupCenter.y + Math.sin(angle) * dist
      }

      // Create velocity for moving lily pads (very slow drift)
      // Give them a slight initial velocity away from group center to help spread out
      const initialAngle = Math.atan2(position.y - groupCenter.y, position.x - groupCenter.x)
      const velocity = {
        x: (rng() - 0.5) * 0.01 + Math.cos(initialAngle) * 0.015,
        y: (rng() - 0.5) * 0.01 + Math.sin(initialAngle) * 0.015
      }

      level.value.obstacles.push({
        id: `lilypad_group_${g}_${i}`,
        type: 'lilypad',
        position,
        radius: 40 + rng() * 15, // Increased from 20-28 to 40-55
        imageIndex: loadedImages.lilyPads.length > 0 ? Math.floor(rng() * loadedImages.lilyPads.length) : 0,
        rotation: rng() * Math.PI * 2,
        targetRotation: rng() * Math.PI * 2,
        scale: 1.0 + rng() * 0.5, // Increased from 0.7-1.1 to 1.0-1.5
        rotationSpeed: (rng() - 0.5) * 0.015, // Slow passive rotation
        velocity,
        bounds: {
          minX: boundsCenterX - boundsSize,
          maxX: boundsCenterX + boundsSize,
          minY: boundsCenterY - boundsSize,
          maxY: boundsCenterY + boundsSize
        }
      })
    }
  }

  // Floating leaves (moving obstacles, block waves)
  for (let i = 0; i < leafCount; i++) {
    const position = {
      x: margin + rng() * (width - 2 * margin),
      y: topMargin + rng() * (height - topMargin - margin)
    }

    const boundsSize = 80 + rng() * 80
    const velocity = {
      x: (rng() - 0.5) * 0.5,
      y: (rng() - 0.5) * 0.5
    }

    level.value.obstacles.push({
      id: `leaf_${i}`,
      type: 'leaf',
      position,
      radius: 18 + rng() * 6,
      velocity,
      bounds: {
        minX: Math.max(margin, position.x - boundsSize / 2),
        maxX: Math.min(width - margin, position.x + boundsSize / 2),
        minY: Math.max(margin, position.y - boundsSize / 2), // Can move into top area
        maxY: Math.min(height - margin, position.y + boundsSize / 2)
      },
      imageIndex: loadedImages.lilyPads.length > 0 ? Math.floor(rng() * loadedImages.lilyPads.length) : 0,
      rotation: rng() * Math.PI * 2,
      scale: 0.6 + rng() * 0.3
    })
  }

  // Add decorative reeds and fish
  addDecorativeElements(rng, width, height, margin, topMargin)
}

function addDecorativeElements(rng, width, height, margin, topMargin) {
  level.value.decorations = []

  // Get all lily pad positions (including bases and groups)
  const lilyPadPositions = level.value.obstacles
    .filter(obs => obs.type === 'lilypad' || obs.type === 'lilypad-base')
    .map(obs => obs.position)

  console.log('Found lily pads for reed placement:', lilyPadPositions.length)

  // Add reeds near lily pads (2-3 reeds per lily pad)
  // Get all lily pad obstacles (both moving and static bases)
  const lilyPadObstacles = level.value.obstacles.filter(obs =>
    obs.type === 'lilypad' || obs.type === 'lilypad-base'
  )

  if (lilyPadPositions.length > 0) {
    const reedsPerPad = 2 + Math.floor(rng() * 2) // 2-3 reeds per lily pad
    const reedCount = Math.min(lilyPadPositions.length * reedsPerPad, 15) // Cap at 15 reeds

    for (let i = 0; i < reedCount; i++) {
      let position
      let attempts = 0
      const maxAttempts = 50

      // Try to find a position that doesn't overlap with lily pad bounds
      while (attempts < maxAttempts) {
        // Pick a random lily pad to place reed near
        const nearLilyPad = lilyPadPositions[Math.floor(rng() * lilyPadPositions.length)]

        // Place reed near this lily pad
        const angle = rng() * Math.PI * 2
        const dist = 50 + rng() * 70 // 50-120 pixels from lily pad
        position = {
          x: nearLilyPad.x + Math.cos(angle) * dist,
          y: nearLilyPad.y + Math.sin(angle) * dist
        }

        // Keep within bounds (with extra top margin for header)
        position.x = Math.max(margin, Math.min(width - margin, position.x))
        position.y = Math.max(topMargin, Math.min(height - margin, position.y))

        // Check if the bottom 50% of the reed overlaps with any lily pad
        const reedSize = 120
        const reedHalfSize = reedSize / 2

        const overlapsBounds = lilyPadObstacles.some(lilyPad => {
          // For moving lily pads with bounds
          if (lilyPad.bounds) {
            // Check if the bottom 50% of the reed overlaps with lily pad bounds
            const reedLeft = position.x - reedHalfSize
            const reedRight = position.x + reedHalfSize
            const reedBottom50Top = position.y // Start of bottom 50% (center)
            const reedBottom50Bottom = position.y + reedHalfSize // End of bottom 50%

            // Rectangle overlap check for bottom 50% only
            return !(reedRight < lilyPad.bounds.minX ||
                     reedLeft > lilyPad.bounds.maxX ||
                     reedBottom50Bottom < lilyPad.bounds.minY ||
                     reedBottom50Top > lilyPad.bounds.maxY)
          }

          // For static lily pad bases (circular collision with bottom 50% of reed)
          if (lilyPad.type === 'lilypad-base' && lilyPad.radius) {
            // Check if lily pad circle overlaps with bottom 50% rectangle of reed
            const reedLeft = position.x - reedHalfSize
            const reedRight = position.x + reedHalfSize
            const reedBottom50Top = position.y // Start of bottom 50% (center)
            const reedBottom50Bottom = position.y + reedHalfSize // End of bottom 50%

            // Find closest point on the rectangle to the circle center
            const closestX = Math.max(reedLeft, Math.min(lilyPad.position.x, reedRight))
            const closestY = Math.max(reedBottom50Top, Math.min(lilyPad.position.y, reedBottom50Bottom))

            // Calculate distance from closest point to circle center
            const distX = lilyPad.position.x - closestX
            const distY = lilyPad.position.y - closestY
            const distanceSquared = distX * distX + distY * distY

            // Check if distance is less than radius (collision)
            return distanceSquared < (lilyPad.radius * lilyPad.radius)
          }

          return false
        })

        if (!overlapsBounds) break
        attempts++
      }

      // Only add the reed if we found a valid position
      if (attempts < maxAttempts) {
        level.value.decorations.push({
          id: `reed_${i}`,
          type: 'reed',
          position,
          imageIndex: loadedImages.reeds.length > 0 ? Math.floor(rng() * loadedImages.reeds.length) : 0,
          rotation: (rng() - 0.5) * 0.4,
          scale: 0.7 + rng() * 0.5
        })
      }
    }
  }

  // Add swimming fish
  const fishCount = 1 + Math.floor(rng() * 2) // 1-2 fish

  for (let i = 0; i < fishCount; i++) {
    const position = {
      x: margin + rng() * (width - 2 * margin),
      y: topMargin + rng() * (height - topMargin - margin)
    }

    const velocity = {
      x: (rng() - 0.5) * 0.3,
      y: (rng() - 0.5) * 0.3
    }

    level.value.decorations.push({
      id: `fish_${i}`,
      type: 'fish',
      position,
      imageIndex: loadedImages.fish.length > 0 ? Math.floor(rng() * loadedImages.fish.length) : 0,
      rotation: Math.atan2(velocity.y, velocity.x) + Math.PI, // Flip 180 degrees so fish faces forward
      scale: 0.6 + rng() * 0.3,
      velocity,
      bounds: {
        minX: margin,
        maxX: width - margin,
        minY: margin, // Fish can swim into top area
        maxY: height - margin
      },
      // Fish behavior properties
      baseSpeed: Math.sqrt(velocity.x ** 2 + velocity.y ** 2),
      speedMultiplier: 1,
      behaviorState: 'swimming', // swimming, hiding, scurrying
      behaviorTimer: 0,
      opacity: 0.85,
      targetOpacity: 0.85
    })
  }
}

function handleTouchStart(event) {
  event.preventDefault()
  touchStartTime = Date.now()

  const rect = gameCanvas.value.getBoundingClientRect()
  const touch = event.touches[0]
  touchStartPos = {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top
  }
}

function handleTouchEnd(event) {
  event.preventDefault()
  if (tapsRemaining.value <= 0 || isProcessingTap) return

  isProcessingTap = true

  const holdDuration = Date.now() - touchStartTime
  const rect = gameCanvas.value.getBoundingClientRect()
  const touch = event.changedTouches[0]
  const x = touch.clientX - rect.left
  const y = touch.clientY - rect.top

  // Check if tap moved too much (should be a tap, not a drag)
  const moveDistance = distance(touchStartPos, { x, y })
  if (moveDistance > 20) {
    isProcessingTap = false
    return
  }

  // Determine tap strength based on hold duration
  let strength = 'medium'
  if (holdDuration < 150) {
    strength = 'light'
    haptics.light()
  } else if (holdDuration > 400) {
    strength = 'strong'
    haptics.medium()
  } else {
    haptics.medium()
  }

  showMenu.value = false

  // Check protected zones (only for non-activated flowers)
  for (const lotus of level.value.lotusFlowers) {
    // Skip activated flowers - user can click where they used to be
    if (lotus.isActivated) continue

    const dist = distance({ x, y }, lotus.position)
    if (dist < lotus.protectedRadius) {
      haptics.warning()
      isProcessingTap = false
      return
    }
  }

  // Create ripple with appropriate strength
  createRipple(x, y, strength)

  tapsRemaining.value--
  tapsUsed.value++
  gameStarted.value = true

  // Reset flag after a short delay to allow next tap
  setTimeout(() => {
    isProcessingTap = false
  }, 100)
}

function handleMouseDown(event) {
  touchStartTime = Date.now()

  const rect = gameCanvas.value.getBoundingClientRect()
  touchStartPos = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
}

function handleMouseUp(event) {
  if (tapsRemaining.value <= 0 || isProcessingTap) return

  isProcessingTap = true

  const holdDuration = Date.now() - touchStartTime
  const rect = gameCanvas.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  // Check if tap moved too much
  const moveDistance = distance(touchStartPos, { x, y })
  if (moveDistance > 20) {
    isProcessingTap = false
    return
  }

  // Determine tap strength based on hold duration
  let strength = 'medium'
  if (holdDuration < 150) {
    strength = 'light'
    haptics.light()
  } else if (holdDuration > 400) {
    strength = 'strong'
    haptics.medium()
  } else {
    haptics.medium()
  }

  showMenu.value = false

  // Check protected zones (only for non-activated flowers)
  for (const lotus of level.value.lotusFlowers) {
    // Skip activated flowers - user can click where they used to be
    if (lotus.isActivated) continue

    const dist = distance({ x, y }, lotus.position)
    if (dist < lotus.protectedRadius) {
      haptics.warning()
      isProcessingTap = false
      return
    }
  }

  // Create ripple with appropriate strength
  createRipple(x, y, strength)

  tapsRemaining.value--
  tapsUsed.value++
  gameStarted.value = true

  // Reset flag after a short delay to allow next tap
  setTimeout(() => {
    isProcessingTap = false
  }, 100)
}

function createRipple(x, y, strength = 'medium') {
  const config = TAP_CONFIGS[strength]

  console.log('Creating ripple at', x, y, 'with strength', strength)

  // Play random splash sound with debounce
  const now = Date.now()
  if (splashSounds.length > 0 && now - lastAudioPlayTime > 50) {
    lastAudioPlayTime = now
    try {
      // Pick a random splash sound
      const randomIndex = Math.floor(Math.random() * splashSounds.length)
      const sound = splashSounds[randomIndex]

      // Reset to beginning and play
      sound.currentTime = 0
      sound.play().catch(err => console.warn('Audio play failed:', err))
    } catch (error) {
      console.warn('Failed to play splash sound:', error)
    }
  }

  const newRipple = {
    id: `ripple_${Date.now()}`,
    origin: { x, y },
    radius: 0,
    maxRadius: config.maxRadius,
    speed: config.speed * (0.9 + Math.random() * 0.2), // Vary speed slightly
    peakRadius: config.peakRadius,
    peakPower: config.peakPower,
    lineWidth: config.lineWidth,
    glowIntensity: config.glowIntensity,
    isActive: true,
    absorbedBy: [], // Track which obstacles have absorbed this ripple
    // Dynamic properties for varied ripple appearance
    wobbleFreq: 3 + Math.random() * 4, // Random wobble frequency (3-7)
    wobbleAmp: 1 + Math.random() * 2.5, // Random wobble amplitude (1-3.5)
    phaseOffset: Math.random() * Math.PI * 2, // Random phase offset
    ringSpacing: 12 + Math.random() * 8 // Vary ring spacing (12-20)
  }

  ripples.push(newRipple)
  console.log('Ripple created, total ripples:', ripples.length)
}

function startGameLoop() {
  function gameLoop() {
    if (!ctx) return

    // Update animation time
    animationTime += 0.016 // ~60fps

    // Update physics
    updateObstacles()
    updateRipples()
    handleObstacleCollisions()

    // Check lotus activations
    checkLotusActivations()

    // Update sinking animations (must run every frame, not just when ripples exist)
    updateSinkingAnimations()

    // Check win/lose
    checkGameState()

    // Render
    render()

    animationId = requestAnimationFrame(gameLoop)
  }

  gameLoop()
}

function stopGameLoop() {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}

function updateObstacles() {
  level.value.obstacles.forEach(obstacle => {
    // Update lily pads - float naturally like inanimate objects
    if (obstacle.type === 'lilypad' && obstacle.velocity) {
      // Apply ripple forces to lily pads (pushed by waves)
      ripples.forEach(ripple => {
        const dist = distance(ripple.origin, obstacle.position)

        // Check if ripple is near this lily pad
        if (dist < ripple.radius + 80 && dist > ripple.radius - 80) {
          const power = calculateRipplePower(ripple.radius, ripple.peakRadius, ripple.peakPower)
          const angle = Math.atan2(obstacle.position.y - ripple.origin.y, obstacle.position.x - ripple.origin.x)

          const distFromEdge = Math.abs(dist - ripple.radius)
          const proximityFactor = 1 - (distFromEdge / 80)

          // Push lily pad with wave force
          const pushForce = power * proximityFactor * 0.5
          obstacle.velocity.x += Math.cos(angle) * pushForce * 0.08
          obstacle.velocity.y += Math.sin(angle) * pushForce * 0.08

          // Also rotate slightly from wave impact
          if (obstacle.rotationSpeed !== undefined) {
            obstacle.rotationSpeed += (Math.random() - 0.5) * pushForce * 0.003
          }
        }
      })

      // Cap maximum velocity to prevent them from moving too fast
      const maxVelocity = 0.3
      const minVelocity = 0.02 // Minimum drift speed to prevent getting stuck
      const currentSpeed = Math.sqrt(obstacle.velocity.x ** 2 + obstacle.velocity.y ** 2)

      if (currentSpeed > maxVelocity) {
        // If moving too fast (from wave impacts), scale down
        const scale = maxVelocity / currentSpeed
        obstacle.velocity.x *= scale
        obstacle.velocity.y *= scale
      } else if (currentSpeed > 0.05) {
        // Only apply dampening if moving faster than base drift speed
        // This prevents the slow drift from stopping while still slowing down wave impacts
        obstacle.velocity.x *= 0.97
        obstacle.velocity.y *= 0.97
      } else if (currentSpeed < minVelocity) {
        // If moving too slowly, add a small random drift to prevent getting stuck
        const angle = Math.random() * Math.PI * 2
        obstacle.velocity.x += Math.cos(angle) * 0.015
        obstacle.velocity.y += Math.sin(angle) * 0.015
      }

      // Update position
      obstacle.position.x += obstacle.velocity.x
      obstacle.position.y += obstacle.velocity.y

      // Very slow passive rotation (like floating on water)
      if (obstacle.rotationSpeed) {
        obstacle.rotation += obstacle.rotationSpeed * 0.1 // Much slower rotation
        // Very gentle dampening of rotation
        obstacle.rotationSpeed *= 0.998
      }

      // Bounce off bounds - gentle reflection like water current
      if (obstacle.position.x <= obstacle.bounds.minX || obstacle.position.x >= obstacle.bounds.maxX) {
        obstacle.velocity.x *= -1
        // Add slight randomness to make it more natural
        obstacle.velocity.x += (Math.random() - 0.5) * 0.02
        obstacle.velocity.y += (Math.random() - 0.5) * 0.02
      }
      if (obstacle.position.y <= obstacle.bounds.minY || obstacle.position.y >= obstacle.bounds.maxY) {
        obstacle.velocity.y *= -1
        // Add slight randomness to make it more natural
        obstacle.velocity.x += (Math.random() - 0.5) * 0.02
        obstacle.velocity.y += (Math.random() - 0.5) * 0.02
      }

      // Check collision with other lily pads and stones to prevent overlap
      level.value.obstacles.forEach(other => {
        if (other.type === 'lilypad' && other.id !== obstacle.id) {
          const dx = other.position.x - obstacle.position.x
          const dy = other.position.y - obstacle.position.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const minDist = (obstacle.radius + other.radius) * 1.3 // Increased buffer to prevent clumping

          if (dist < minDist && dist > 0) {
            // Stronger push force to actively separate them
            const separationForce = (minDist - dist) / minDist // 0 to 1, stronger when closer
            const pushX = (dx / dist) * (minDist - dist)
            const pushY = (dy / dist) * (minDist - dist)

            // Push positions apart
            obstacle.position.x -= pushX * 0.6
            obstacle.position.y -= pushY * 0.6
            other.position.x += pushX * 0.6
            other.position.y += pushY * 0.6

            // Add repulsion velocity to actively move away from each other
            // Increased strength when very close to prevent sticking
            const repulsionStrength = 0.08 * separationForce
            obstacle.velocity.x -= (dx / dist) * repulsionStrength
            obstacle.velocity.y -= (dy / dist) * repulsionStrength
            other.velocity.x += (dx / dist) * repulsionStrength
            other.velocity.y += (dy / dist) * repulsionStrength

            // Add a small random tangential force to help them slide past each other
            const tangentX = -dy / dist
            const tangentY = dx / dist
            const slideForce = (Math.random() - 0.5) * 0.03
            obstacle.velocity.x += tangentX * slideForce
            obstacle.velocity.y += tangentY * slideForce
          }
        }

        // Collision with stones - lily pads bounce off
        if (other.type === 'stone') {
          const dx = other.position.x - obstacle.position.x
          const dy = other.position.y - obstacle.position.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const minDist = obstacle.radius + other.radius

          if (dist < minDist && dist > 0) {
            // Push lily pad away from stone
            const pushX = (dx / dist) * (minDist - dist)
            const pushY = (dy / dist) * (minDist - dist)

            obstacle.position.x -= pushX
            obstacle.position.y -= pushY

            // Bounce velocity away from stone
            const dotProduct = obstacle.velocity.x * dx + obstacle.velocity.y * dy
            obstacle.velocity.x -= 2 * dotProduct * dx / (dist * dist)
            obstacle.velocity.y -= 2 * dotProduct * dy / (dist * dist)

            // Add slight randomness
            obstacle.velocity.x += (Math.random() - 0.5) * 0.02
            obstacle.velocity.y += (Math.random() - 0.5) * 0.02
          }
        }

        // Collision with static lily pad bases - lily pads bounce off
        if (other.type === 'lilypad-base') {
          const dx = other.position.x - obstacle.position.x
          const dy = other.position.y - obstacle.position.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const minDist = obstacle.radius + other.radius

          if (dist < minDist && dist > 0) {
            // Push lily pad away from static lily pad
            const pushX = (dx / dist) * (minDist - dist)
            const pushY = (dy / dist) * (minDist - dist)

            obstacle.position.x -= pushX
            obstacle.position.y -= pushY

            // Bounce velocity away from static lily pad
            const dotProduct = obstacle.velocity.x * dx + obstacle.velocity.y * dy
            obstacle.velocity.x -= 2 * dotProduct * dx / (dist * dist)
            obstacle.velocity.y -= 2 * dotProduct * dy / (dist * dist)

            // Add slight randomness
            obstacle.velocity.x += (Math.random() - 0.5) * 0.02
            obstacle.velocity.y += (Math.random() - 0.5) * 0.02
          }
        }
      })
    }

    // Update leaves
    if (obstacle.type === 'leaf' && obstacle.velocity) {
      // Update position
      obstacle.position.x += obstacle.velocity.x
      obstacle.position.y += obstacle.velocity.y

      // Bounce off bounds
      if (obstacle.position.x <= obstacle.bounds.minX || obstacle.position.x >= obstacle.bounds.maxX) {
        obstacle.velocity.x *= -1
        obstacle.rotation = Math.atan2(obstacle.velocity.y, obstacle.velocity.x)
      }
      if (obstacle.position.y <= obstacle.bounds.minY || obstacle.position.y >= obstacle.bounds.maxY) {
        obstacle.velocity.y *= -1
        obstacle.rotation = Math.atan2(obstacle.velocity.y, obstacle.velocity.x)
      }
    }
  })

  // Update decorative fish movement with dynamic behavior
  if (level.value.decorations) {
    level.value.decorations.forEach(decoration => {
      if (decoration.type === 'fish' && decoration.velocity) {
        // Update behavior timer
        decoration.behaviorTimer++

        // Check for ripples nearby - fish get scared and scurry
        let scaredByWave = false
        ripples.forEach(ripple => {
          const dist = distance(ripple.origin, decoration.position)
          if (dist < ripple.radius + 100 && dist > ripple.radius - 100) {
            scaredByWave = true
          }
        })

        // Behavior state machine
        if (scaredByWave && decoration.behaviorState !== 'scurrying') {
          // Fish gets scared - scurry away!
          decoration.behaviorState = 'scurrying'
          decoration.speedMultiplier = 3.5
          decoration.targetOpacity = 0.95
          decoration.behaviorTimer = 0
        } else if (decoration.behaviorState === 'scurrying' && decoration.behaviorTimer > 60) {
          // Done scurrying, go back to swimming
          decoration.behaviorState = 'swimming'
          decoration.speedMultiplier = 1
          decoration.targetOpacity = 0.85
          decoration.behaviorTimer = 0
        } else if (decoration.behaviorState === 'swimming') {
          // Random behavior changes
          if (Math.random() < 0.005) {
            // Occasionally speed up
            decoration.behaviorState = 'fast'
            decoration.speedMultiplier = 2
            decoration.targetOpacity = 0.9
            decoration.behaviorTimer = 0
          } else if (Math.random() < 0.008) {
            // Occasionally slow down
            decoration.behaviorState = 'slow'
            decoration.speedMultiplier = 0.4
            decoration.targetOpacity = 0.75
            decoration.behaviorTimer = 0
          }
        } else if (decoration.behaviorState === 'slow' && decoration.behaviorTimer > 50) {
          // Speed back up to normal
          decoration.behaviorState = 'swimming'
          decoration.speedMultiplier = 1
          decoration.targetOpacity = 0.85
          decoration.behaviorTimer = 0
        } else if (decoration.behaviorState === 'fast' && decoration.behaviorTimer > 40) {
          // Slow down to normal
          decoration.behaviorState = 'swimming'
          decoration.speedMultiplier = 1
          decoration.targetOpacity = 0.85
          decoration.behaviorTimer = 0
        }

        // Gradually transition speed and opacity
        const currentSpeed = Math.sqrt(decoration.velocity.x ** 2 + decoration.velocity.y ** 2)
        const targetSpeed = decoration.baseSpeed * decoration.speedMultiplier
        if (currentSpeed < targetSpeed) {
          const speedIncrease = 1.05
          decoration.velocity.x *= speedIncrease
          decoration.velocity.y *= speedIncrease
        } else if (currentSpeed > targetSpeed) {
          const speedDecrease = 0.95
          decoration.velocity.x *= speedDecrease
          decoration.velocity.y *= speedDecrease
        }

        // Smooth opacity transition
        decoration.opacity += (decoration.targetOpacity - decoration.opacity) * 0.05

        // Check collision with stones - fish avoid swimming under them
        level.value.obstacles.forEach(obstacle => {
          if (obstacle.type === 'stone') {
            const dx = obstacle.position.x - decoration.position.x
            const dy = obstacle.position.y - decoration.position.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            const fishRadius = 30 // Approximate fish size
            const minDist = obstacle.radius + fishRadius

            if (dist < minDist && dist > 0) {
              // Push fish away from stone
              const pushX = (dx / dist) * (minDist - dist)
              const pushY = (dy / dist) * (minDist - dist)

              decoration.position.x -= pushX
              decoration.position.y -= pushY

              // Redirect velocity away from stone
              const dotProduct = decoration.velocity.x * dx + decoration.velocity.y * dy
              decoration.velocity.x -= 2 * dotProduct * dx / (dist * dist)
              decoration.velocity.y -= 2 * dotProduct * dy / (dist * dist)

              // Update rotation to face new direction
              decoration.rotation = Math.atan2(decoration.velocity.y, decoration.velocity.x) + Math.PI
            }
          }
        })

        // Update position
        decoration.position.x += decoration.velocity.x
        decoration.position.y += decoration.velocity.y

        // Bounce off bounds
        if (decoration.position.x <= decoration.bounds.minX || decoration.position.x >= decoration.bounds.maxX) {
          decoration.velocity.x *= -1
          decoration.rotation = Math.atan2(decoration.velocity.y, decoration.velocity.x) + Math.PI
        }
        if (decoration.position.y <= decoration.bounds.minY || decoration.position.y >= decoration.bounds.maxY) {
          decoration.velocity.y *= -1
          decoration.rotation = Math.atan2(decoration.velocity.y, decoration.velocity.x) + Math.PI
        }
      }
    })
  }
}

function updateRipples() {
  ripples.forEach(ripple => {
    if (!ripple.isActive) return

    ripple.radius += ripple.speed

    if (ripple.radius >= ripple.maxRadius) {
      ripple.isActive = false
    }
  })

  // Remove inactive ripples
  ripples = ripples.filter(r => r.isActive)
}

function handleObstacleCollisions() {
  ripples.forEach(ripple => {
    if (!ripple.isActive) return

    level.value.obstacles.forEach(obstacle => {
      // Skip lily-pad-base (they don't block waves, only hold flowers)
      if (obstacle.type === 'lilypad-base') return

      const dist = distance(ripple.origin, obstacle.position)

      // Check if ripple is touching obstacle
      if (Math.abs(dist - ripple.radius) <= obstacle.radius) {
        if (obstacle.type === 'stone') {
          // Stone reflects - create new ripple
          const angle = Math.atan2(
            obstacle.position.y - ripple.origin.y,
            obstacle.position.x - ripple.origin.x
          )
          const reflectionPoint = {
            x: obstacle.position.x + Math.cos(angle) * obstacle.radius,
            y: obstacle.position.y + Math.sin(angle) * obstacle.radius
          }

          // Mark this collision so we don't reflect multiple times
          if (!ripple.reflectedFrom?.includes(obstacle.id)) {
            if (!ripple.reflectedFrom) ripple.reflectedFrom = []
            ripple.reflectedFrom.push(obstacle.id)

            // Create reflected ripple
            const reflectedRipple = {
              id: `ripple_reflected_${Date.now()}`,
              origin: reflectionPoint,
              radius: 0,
              maxRadius: ripple.maxRadius - ripple.radius,
              speed: ripple.speed,
              peakRadius: ripple.peakRadius,
              peakPower: ripple.peakPower * 0.7, // Reduce power on reflection
              lineWidth: ripple.lineWidth,
              glowIntensity: ripple.glowIntensity * 0.7,
              isActive: true,
              createdAt: Date.now(),
              strength: ripple.strength,
              reflectedFrom: [obstacle.id]
            }
            ripples.push(reflectedRipple)
          }
        } else if (obstacle.type === 'lilypad') {
          // Lily pad absorbs - mark ripple segment as absorbed
          if (!ripple.absorbedBy?.includes(obstacle.id)) {
            if (!ripple.absorbedBy) ripple.absorbedBy = []
            ripple.absorbedBy.push(obstacle.id)
            ripple.peakPower *= 0.5 // Reduce power
          }
        } else if (obstacle.type === 'leaf') {
          // Leaf partially absorbs
          if (!ripple.absorbedBy?.includes(obstacle.id)) {
            if (!ripple.absorbedBy) ripple.absorbedBy = []
            ripple.absorbedBy.push(obstacle.id)
            ripple.peakPower *= 0.8 // Slight reduction
          }
        }
      }
    })
  })
}

function checkLotusActivations() {
  level.value.lotusFlowers.forEach(lotus => {
    if (lotus.isActivated) return

    // Initialize accumulated power if needed
    if (lotus.accumulatedPower === undefined) {
      lotus.accumulatedPower = 0
    }

    // Calculate combined power from all touching ripples (wave interference)
    let combinedPower = 0
    const touchingRipples = []

    for (const ripple of ripples) {
      const dist = distance(ripple.origin, lotus.position)
      const tolerance = 15

      if (Math.abs(dist - ripple.radius) <= tolerance) {
        const power = calculateRipplePower(ripple.radius, ripple.peakRadius, ripple.peakPower)
        combinedPower += power
        touchingRipples.push({ ripple, power })
      }
    }

    // Apply wave interference bonus if multiple ripples
    if (touchingRipples.length > 1) {
      // Constructive interference: bonus for multiple waves
      const interferenceBonus = Math.min(0.3, (touchingRipples.length - 1) * 0.15)
      combinedPower *= (1 + interferenceBonus)
    }

    // Accumulate power over time (with slow decay)
    // This ensures flowers can be activated even if obstacles push them around
    if (combinedPower > 0) {
      lotus.accumulatedPower += combinedPower * 0.02 // Accumulate 2% of current power each frame
      lotus.accumulatedPower = Math.min(lotus.accumulatedPower, 1.5) // Cap at 1.5
    } else {
      // Slow decay when not being hit by waves
      lotus.accumulatedPower *= 0.995 // Very slow decay (0.5% per frame)
    }

    // Check if instant power OR accumulated power activates the lotus
    const shouldActivate = combinedPower >= lotus.activationThreshold ||
                          lotus.accumulatedPower >= lotus.activationThreshold * 0.8 // Easier threshold for accumulated

    if (shouldActivate && !lotus.isActivated) {
      lotus.isActivated = true
      lotus.activatedAt = Date.now()
      lotus.glowIntensity = 1.0
      lotus.sinkProgress = 0 // Start sinking animation
      console.log('Lotus activated! Starting sink animation', lotus.id)
      haptics.success()
    }

    // Update current power level for visual feedback (with smooth decay)
    if (combinedPower > (lotus.currentPower || 0)) {
      lotus.currentPower = Math.min(combinedPower, 1.5)
    } else {
      // Decay current power smoothly
      lotus.currentPower = (lotus.currentPower || 0) * 0.85
      if (lotus.currentPower < 0.01) lotus.currentPower = 0
    }
  })
}

function updateSinkingAnimations() {
  // Update sinking progress for all activated flowers
  level.value.lotusFlowers.forEach(lotus => {
    if (lotus.isActivated && lotus.sinkProgress !== undefined && lotus.sinkProgress < 1) {
      lotus.sinkProgress += 0.008 // Sink over ~125 frames (about 2 seconds)
      if (Math.random() < 0.05) { // Log occasionally
        console.log('Sinking progress:', lotus.id, lotus.sinkProgress.toFixed(3))
      }
    }
  })
}

function checkGameState() {
  // Don't check game state if dialogs are already showing
  if (showWinDialog.value || showLoseDialog.value) return

  const allActivated = level.value.lotusFlowers.every(l => l.isActivated)
  const allFullySunk = level.value.lotusFlowers.every(l => !l.isActivated || (l.sinkProgress || 0) >= 1)

  // Only show win dialog when all flowers are activated AND fully sunk
  if (allActivated && allFullySunk) {
    stopGameLoop()
    calculateScore()
    failureStreak.value = 0 // Reset streak on success

    // Check if level was completed perfectly (minimum taps used)
    const isPerfect = tapsUsed.value <= level.value.goal

    // Update progress
    progressStore.updateRippleLevel(currentLevel.value, isPerfect)

    showWinDialog.value = true
  } else if (tapsRemaining.value === 0 && ripples.length === 0 && !allActivated) {
    // Only trigger loss if not all flowers are activated
    stopGameLoop()
    handleFailure()
    showLoseDialog.value = true
  }
}

function handleFailure() {
  failureStreak.value++

  // Lose 1 point for every 5 consecutive failures
  if (failureStreak.value % 5 === 0) {
    totalScore.value = Math.max(0, totalScore.value - 1)
  }
}

function calculateScore() {
  const optimalTaps = level.value.optimalTaps
  const actualTaps = tapsUsed.value

  // Simple scoring based on performance
  if (actualTaps <= optimalTaps) {
    // Perfect! 3 stars
    levelScore.value = 3
    starsEarned.value = 3
  } else if (actualTaps <= optimalTaps + 1) {
    // Very good! 2 stars
    levelScore.value = 2
    starsEarned.value = 2
  } else if (actualTaps <= level.value.tapsAllowed) {
    // Completed, 1 star
    levelScore.value = 1
    starsEarned.value = 1
  }

  totalScore.value += levelScore.value
}

function calculateRipplePower(radius, peakRadius = 150, peakPower = 1.0) {
  const r = radius
  const birthZone = peakRadius * 0.33
  const riseZone = peakRadius * 0.67
  const peakZone = peakRadius * 1.33
  const fadeZone = peakRadius * 2.0
  const deathZone = peakRadius * 2.33

  // Zone 1: Birth
  if (r < birthZone) {
    return (r / birthZone) * (peakPower * 0.4)
  }

  // Zone 2: Rise
  if (r < riseZone) {
    return (peakPower * 0.4) + ((r - birthZone) / (riseZone - birthZone)) * (peakPower * 0.4)
  }

  // Zone 3: Peak
  if (r < peakZone) {
    const distFromPeak = Math.abs(r - peakRadius)
    return peakPower - (distFromPeak / (peakZone - peakRadius)) * (peakPower * 0.2)
  }

  // Zone 4: Fade
  if (r < fadeZone) {
    return (peakPower * 0.8) - ((r - peakZone) / (fadeZone - peakZone)) * (peakPower * 0.4)
  }

  // Zone 5: Death
  if (r < deathZone) {
    return (peakPower * 0.4) - ((r - fadeZone) / (deathZone - fadeZone)) * (peakPower * 0.3)
  }

  return 0
}

function getRippleColor(radius) {
  const r = radius

  if (r < 50) return 'rgba(255, 100, 100, 0.6)'
  if (r < 100) return 'rgba(255, 255, 100, 0.7)'
  if (r < 200) return 'rgba(100, 255, 200, 0.8)'
  if (r < 300) return 'rgba(255, 255, 100, 0.6)'
  return 'rgba(255, 100, 100, 0.4)'
}

function render() {
  if (!ctx || !gameCanvas.value) return

  const { width, height } = gameCanvas.value

  // Clear canvas with water color
  ctx.fillStyle = waterColors.value.base
  ctx.fillRect(0, 0, width, height)

  // Draw animated water gradient with subtle waves
  const gradient = ctx.createRadialGradient(
    width / 2 + Math.sin(animationTime * 0.5) * 20,
    height / 2 + Math.cos(animationTime * 0.3) * 20,
    0,
    width / 2,
    height / 2,
    Math.max(width, height)
  )
  gradient.addColorStop(0, waterColors.value.gradientStart)
  gradient.addColorStop(0.5, waterColors.value.gradientMid)
  gradient.addColorStop(1, waterColors.value.gradientEnd)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // Add subtle water surface texture
  drawWaterSurface(ctx, width, height)

  // Draw fish in background (underwater)
  if (level.value.decorations && imagesLoaded) {
    level.value.decorations.forEach(decoration => {
      if (decoration.type === 'fish') {
        drawDecoration(ctx, decoration)
      }
    })
  }

  // Draw BOTTOM HALF of reeds (can be covered by lily pads)
  if (level.value.decorations && imagesLoaded) {
    level.value.decorations.forEach(decoration => {
      if (decoration.type === 'reed') {
        drawDecorationClipped(ctx, decoration, 'bottom')
      }
    })
  }

  // Draw moving lily pads (before flowers and stones)
  level.value.obstacles.forEach(obstacle => {
    if (obstacle.type === 'lilypad') {
      if (imagesLoaded) {
        drawObstacleImageWithDisplacement(ctx, obstacle)
      } else {
        drawObstacle(ctx, obstacle)
      }
    }
  })

  // Draw stones (under lotus flowers and leaves)
  level.value.obstacles.forEach(obstacle => {
    if (obstacle.type === 'stone') {
      if (imagesLoaded) {
        drawObstacleImageWithDisplacement(ctx, obstacle)
      } else {
        drawObstacle(ctx, obstacle)
      }
    }
  })

  // Draw lotus flowers WITH their lily pad bases (combined sinking effect)
  level.value.lotusFlowers.forEach(lotus => {
    // Find corresponding lily pad base
    const lilyPadBase = level.value.obstacles.find(obs =>
      obs.type === 'lilypad-base' &&
      obs.position.x === lotus.position.x &&
      obs.position.y === lotus.position.y
    )

    // Only draw if not fully sunk
    if (!lotus.isActivated || (lotus.sinkProgress || 0) < 1) {
      if (imagesLoaded) {
        drawLotusWithLilyPadSinking(ctx, lotus, lilyPadBase)
      } else {
        drawLotus(ctx, lotus)
      }
    }
  })

  // Draw leaves (on top of everything except reeds)
  level.value.obstacles.forEach(obstacle => {
    if (obstacle.type === 'leaf') {
      if (imagesLoaded) {
        drawObstacleImageWithDisplacement(ctx, obstacle)
      } else {
        drawObstacle(ctx, obstacle)
      }
    }
  })

  // Draw TOP HALF of reeds last (always on top of everything)
  if (level.value.decorations && imagesLoaded) {
    level.value.decorations.forEach(decoration => {
      if (decoration.type === 'reed') {
        drawDecorationClipped(ctx, decoration, 'top')
      }
    })
  }

  // Draw protected zones (subtle)
  level.value.lotusFlowers.forEach(lotus => {
    if (lotus.isActivated) return

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.arc(lotus.position.x, lotus.position.y, lotus.protectedRadius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
  })

  // Draw ripples with multiple rings and distortion
  ripples.forEach(ripple => {
    drawRipple(ctx, ripple)
  })
}

function drawWaterSurface(ctx, width, height) {
  // Draw subtle animated waves on water surface
  ctx.globalAlpha = 0.03

  for (let i = 0; i < 3; i++) {
    const offset = i * 80
    const waveY = Math.sin(animationTime * 0.8 + offset) * 3

    ctx.beginPath()
    for (let x = 0; x < width; x += 10) {
      const y = height / 3 + Math.sin(x * 0.02 + animationTime + offset) * 15 + waveY
      if (x === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    ctx.fillStyle = '#3a9aba'
    ctx.fill()
  }

  ctx.globalAlpha = 1.0
}

function drawRipple(ctx, ripple) {
  const color = getRippleColor(ripple.radius)

  // Draw multiple concentric rings with dynamic spacing
  const ringCount = 3 + Math.floor(Math.random() * 2) // 3-4 rings

  for (let ring = 0; ring < ringCount; ring++) {
    // Use ripple's unique ring spacing
    const ringOffset = ring * ripple.ringSpacing
    const currentRadius = ripple.radius - ringOffset

    if (currentRadius <= 0) continue

    const ringPower = calculateRipplePower(currentRadius, ripple.peakRadius, ripple.peakPower)
    const ringAlpha = (1 - ring / ringCount) * ringPower

    if (ringAlpha <= 0.05) continue

    // Add dynamic distortion unique to each ripple
    ctx.save()
    ctx.beginPath()

    const segments = 32
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2

      // Use ripple's unique wobble properties
      const wobble1 = Math.sin(angle * ripple.wobbleFreq + animationTime * 3 + ripple.phaseOffset) * ripple.wobbleAmp
      const wobble2 = Math.cos(angle * (ripple.wobbleFreq * 0.7) + animationTime * 2.5) * (ripple.wobbleAmp * 0.6)

      // Combine wobbles for more organic distortion
      const distortedRadius = currentRadius + wobble1 + wobble2

      // Add slight asymmetry
      const asymmetry = Math.sin(angle * 2 + ripple.phaseOffset) * (ripple.wobbleAmp * 0.3)

      const x = ripple.origin.x + Math.cos(angle) * (distortedRadius + asymmetry)
      const y = ripple.origin.y + Math.sin(angle) * (distortedRadius + asymmetry)

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }

    ctx.closePath()

    // Dynamic glow effect - varies per ring
    const glowVariation = 0.8 + Math.sin(animationTime * 2 + ring + ripple.phaseOffset) * 0.2
    ctx.shadowBlur = ripple.glowIntensity * ringPower * glowVariation
    ctx.shadowColor = color

    // Stroke with fade and slight variation
    const rgbaColor = color.replace(')', `, ${ringAlpha})`)
    ctx.strokeStyle = rgbaColor
    const lineWidthVariation = 0.9 + Math.sin(animationTime + ring * 0.5) * 0.1
    ctx.lineWidth = ripple.lineWidth * (1 - ring / ringCount * 0.5) * lineWidthVariation
    ctx.stroke()

    ctx.shadowBlur = 0
    ctx.restore()
  }
}

function drawObstacle(ctx, obstacle) {
  const { x, y } = obstacle.position

  if (obstacle.type === 'stone') {
    // Draw stone
    ctx.beginPath()
    ctx.arc(x, y, obstacle.radius, 0, Math.PI * 2)

    // Gradient for 3D effect
    const gradient = ctx.createRadialGradient(
      x - obstacle.radius * 0.3,
      y - obstacle.radius * 0.3,
      0,
      x,
      y,
      obstacle.radius
    )
    gradient.addColorStop(0, '#999999')
    gradient.addColorStop(1, '#444444')
    ctx.fillStyle = gradient
    ctx.fill()

    ctx.strokeStyle = '#222222'
    ctx.lineWidth = 2
    ctx.stroke()
  } else if (obstacle.type === 'lilypad') {
    // Draw lily pad
    ctx.beginPath()
    ctx.arc(x, y, obstacle.radius, 0, Math.PI * 2)
    ctx.fillStyle = '#2d5016'
    ctx.fill()

    // Add darker edge
    ctx.strokeStyle = '#1a3009'
    ctx.lineWidth = 2
    ctx.stroke()

    // Add center vein
    ctx.beginPath()
    ctx.moveTo(x, y - obstacle.radius)
    ctx.lineTo(x, y + obstacle.radius)
    ctx.strokeStyle = '#1a3009'
    ctx.lineWidth = 1
    ctx.stroke()
  } else if (obstacle.type === 'leaf') {
    // Draw floating leaf
    ctx.save()
    ctx.translate(x, y)

    // Leaf shape (ellipse)
    ctx.beginPath()
    ctx.ellipse(0, 0, obstacle.radius, obstacle.radius * 0.6, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#4a7c2f'
    ctx.fill()

    ctx.strokeStyle = '#2d5016'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.restore()
  }
}

function drawLotus(ctx, lotus) {
  const { x, y } = lotus.position
  const size = 30

  // Show power level with glow (even when not activated)
  if (lotus.isActivated) {
    ctx.shadowBlur = 30
    ctx.shadowColor = 'rgba(255, 215, 0, 0.8)'
  } else if (lotus.currentPower > 0) {
    // Show current power with time-of-day water color glow
    const glowIntensity = Math.min(lotus.currentPower / lotus.activationThreshold, 1)
    ctx.shadowBlur = 20 * glowIntensity
    // Use time-of-day water color for glow
    const glowColor = waterColors.value.gradientStart
    const r = parseInt(glowColor.slice(1, 3), 16)
    const g = parseInt(glowColor.slice(3, 5), 16)
    const b = parseInt(glowColor.slice(5, 7), 16)
    ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${glowIntensity * 0.6})`
  }

  // Draw petals
  const petalCount = 8
  let petalColor = lotus.isActivated ? '#FFD700' : '#FFB6C1'

  // Tint petals based on current power (when receiving ripples)
  if (!lotus.isActivated && lotus.currentPower > 0) {
    const powerRatio = Math.min(lotus.currentPower / lotus.activationThreshold, 1)
    const r = Math.floor(255 * (1 - powerRatio * 0.3))
    const g = Math.floor(182 + 73 * powerRatio)
    const b = Math.floor(193 + 62 * powerRatio)
    petalColor = `rgb(${r}, ${g}, ${b})`
  }

  for (let i = 0; i < petalCount; i++) {
    const angle = (Math.PI * 2 / petalCount) * i
    const px = x + Math.cos(angle) * size * 0.7
    const py = y + Math.sin(angle) * size * 0.7

    ctx.save()
    ctx.translate(px, py)
    ctx.rotate(angle)

    ctx.beginPath()
    ctx.ellipse(0, 0, size * 0.3, size * 0.5, 0, 0, Math.PI * 2)
    ctx.fillStyle = petalColor
    ctx.fill()

    ctx.restore()
  }

  // Center
  ctx.beginPath()
  ctx.arc(x, y, size * 0.3, 0, Math.PI * 2)
  ctx.fillStyle = '#FFEB3B'
  ctx.fill()

  ctx.shadowBlur = 0
}

function drawObstacleImage(ctx, obstacle) {
  const { x, y } = obstacle.position
  let img

  if (obstacle.type === 'stone') {
    img = loadedImages.rocks[obstacle.imageIndex]
  } else if (obstacle.type === 'lilypad' || obstacle.type === 'lilypad-base') {
    img = loadedImages.lilyPads[obstacle.imageIndex]
  } else if (obstacle.type === 'leaf') {
    // Use lily pads for leaves too (smaller ones)
    img = loadedImages.lilyPads[obstacle.imageIndex]
  }

  if (!img || !img.complete) {
    // Fallback to geometric shapes if image not loaded
    drawObstacle(ctx, obstacle)
    return
  }

  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(obstacle.rotation)
  ctx.scale(obstacle.scale, obstacle.scale)

  // Scale image to fit the obstacle size
  const imgSize = obstacle.radius * 2
  ctx.drawImage(img, -imgSize / 2, -imgSize / 2, imgSize, imgSize)

  ctx.restore()
}

function drawObstacleImageWithDisplacement(ctx, obstacle) {
  // Stones don't move with waves
  if (obstacle.type === 'stone') {
    drawObstacleImage(ctx, obstacle)
    return
  }

  // Calculate smooth wave displacement with circular motion
  let displacement = { x: 0, y: 0 }
  let totalRotation = 0

  ripples.forEach(ripple => {
    const dist = distance(ripple.origin, obstacle.position)

    // Larger tolerance for smoother effect
    if (dist < ripple.radius + 80 && dist > ripple.radius - 80) {
      const power = calculateRipplePower(ripple.radius, ripple.peakRadius, ripple.peakPower)
      const angle = Math.atan2(obstacle.position.y - ripple.origin.y, obstacle.position.x - ripple.origin.x)

      // Distance from ripple edge (negative when inside, positive when outside)
      const distFromEdge = Math.abs(dist - ripple.radius)
      const proximityFactor = 1 - (distFromEdge / 80) // Smoother falloff

      // Circular motion: up and down as wave passes
      const wavePhase = (dist - ripple.radius) / 20 // Creates wave pattern
      const verticalMove = Math.sin(wavePhase) * power * proximityFactor * 4
      const horizontalMove = Math.cos(wavePhase) * power * proximityFactor * 2

      // Move in radial direction with smooth easing
      const moveAmount = power * proximityFactor * (obstacle.type === 'lilypad-base' ? 2 : 1.5)
      displacement.x += Math.cos(angle) * moveAmount + horizontalMove
      displacement.y += Math.sin(angle) * moveAmount + verticalMove

      // Gentle rotation based on wave
      totalRotation += Math.sin(wavePhase) * power * proximityFactor * 0.05
    }
  })

  const { x, y } = obstacle.position
  let img

  if (obstacle.type === 'lilypad' || obstacle.type === 'lilypad-base') {
    img = loadedImages.lilyPads[obstacle.imageIndex]
  } else if (obstacle.type === 'leaf') {
    img = loadedImages.lilyPads[obstacle.imageIndex]
  }

  if (!img || !img.complete) {
    drawObstacle(ctx, obstacle)
    return
  }

  ctx.save()
  ctx.translate(x + displacement.x, y + displacement.y)
  ctx.rotate(obstacle.rotation + totalRotation) // Add wave-induced rotation
  ctx.scale(obstacle.scale, obstacle.scale)

  const imgSize = obstacle.radius * 2
  ctx.drawImage(img, -imgSize / 2, -imgSize / 2, imgSize, imgSize)

  ctx.restore()
}

function drawLotusWithLilyPadSinking(ctx, lotus, lilyPadBase) {
  const { x, y } = lotus.position
  const flowerImg = loadedImages.flowers[lotus.imageIndex]
  const lilyPadImg = lilyPadBase && loadedImages.lilyPads[lilyPadBase.imageIndex]

  if (!flowerImg || !flowerImg.complete) {
    drawLotus(ctx, lotus)
    return
  }

  const sinkProgress = lotus.sinkProgress || 0

  // Calculate wave displacement (only if not sinking)
  let displacement = { x: 0, y: 0 }
  let totalRotation = 0

  // Only move with waves if not activated or just starting to sink
  if (!lotus.isActivated || sinkProgress < 0.1) {
    ripples.forEach(ripple => {
      const dist = distance(ripple.origin, lotus.position)

      if (dist < ripple.radius + 80 && dist > ripple.radius - 80) {
        const power = calculateRipplePower(ripple.radius, ripple.peakRadius, ripple.peakPower)
        const angle = Math.atan2(lotus.position.y - ripple.origin.y, lotus.position.x - ripple.origin.x)

        const distFromEdge = Math.abs(dist - ripple.radius)
        const proximityFactor = 1 - (distFromEdge / 80)

        const wavePhase = (dist - ripple.radius) / 20
        const verticalMove = Math.sin(wavePhase) * power * proximityFactor * 3
        const horizontalMove = Math.cos(wavePhase) * power * proximityFactor * 1.5

        const moveAmount = power * proximityFactor * 1.5

        // Reduce displacement as sinking progresses
        const displacementFactor = lotus.isActivated ? (1 - sinkProgress * 10) : 1
        displacement.x += (Math.cos(angle) * moveAmount + horizontalMove) * displacementFactor
        displacement.y += (Math.sin(angle) * moveAmount + verticalMove) * displacementFactor

        totalRotation += Math.sin(wavePhase) * power * proximityFactor * 0.08 * displacementFactor
      }
    })
  }

  // Show power level with glow (only when not activated)
  if (!lotus.isActivated && lotus.currentPower > 0) {
    const glowIntensity = Math.min(lotus.currentPower / lotus.activationThreshold, 1)
    ctx.shadowBlur = 20 * glowIntensity
    // Use time-of-day water color for glow
    const glowColor = waterColors.value.gradientStart
    const r = parseInt(glowColor.slice(1, 3), 16)
    const g = parseInt(glowColor.slice(3, 5), 16)
    const b = parseInt(glowColor.slice(5, 7), 16)
    ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${glowIntensity * 0.6})`
  }

  // Draw splash ripples when first activated
  if (lotus.isActivated && sinkProgress < 0.3) {
    ctx.save()
    const splashAlpha = 0.8 * (1 - sinkProgress / 0.3)

    // Use time-of-day water color for splash
    const splashColor = waterColors.value.gradientStart
    const r = parseInt(splashColor.slice(1, 3), 16)
    const g = parseInt(splashColor.slice(3, 5), 16)
    const b = parseInt(splashColor.slice(5, 7), 16)

    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${splashAlpha})`
    ctx.lineWidth = 3
    const splashRadius = 40 + sinkProgress * 60
    ctx.beginPath()
    ctx.arc(x, y, splashRadius, 0, Math.PI * 2)
    ctx.stroke()

    // Inner splash ring - lighter version
    const innerR = Math.min(255, r + 50)
    const innerG = Math.min(255, g + 20)
    const innerB = Math.min(255, b + 55)
    ctx.strokeStyle = `rgba(${innerR}, ${innerG}, ${innerB}, ${splashAlpha * 0.6})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, splashRadius * 0.6, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }

  // Debug logging
  if (lotus.isActivated && Math.random() < 0.02) {
    console.log('Drawing activated lotus:', lotus.id, 'sinkProgress:', sinkProgress.toFixed(3))
  }

  // Draw lily pad base
  if (lilyPadBase && lilyPadImg && lilyPadImg.complete) {
    ctx.save()
    ctx.translate(x + displacement.x, y + displacement.y)
    ctx.rotate(lilyPadBase.rotation + totalRotation)
    ctx.scale(lilyPadBase.scale, lilyPadBase.scale)

    // Fade and shrink when activated
    if (lotus.isActivated && sinkProgress > 0) {
      const fadeAlpha = 1 - sinkProgress
      ctx.globalAlpha = fadeAlpha
      const shrinkScale = 1 - sinkProgress * 0.3
      ctx.scale(shrinkScale, shrinkScale)

      if (Math.random() < 0.02) {
        console.log('Lily pad alpha:', fadeAlpha.toFixed(3), 'scale:', shrinkScale.toFixed(3))
      }
    }

    const lilyPadSize = lilyPadBase.radius * 2
    ctx.drawImage(lilyPadImg, -lilyPadSize / 2, -lilyPadSize / 2, lilyPadSize, lilyPadSize)
    ctx.restore()
  }

  // Draw flower
  ctx.save()
  ctx.translate(x + displacement.x, y + displacement.y)
  ctx.rotate(lotus.rotation + totalRotation)
  ctx.scale(lotus.scale, lotus.scale)

  // Fade and shrink when activated
  if (lotus.isActivated && sinkProgress > 0) {
    const fadeAlpha = 1 - sinkProgress
    ctx.globalAlpha = fadeAlpha
    const shrinkScale = 1 - sinkProgress * 0.3
    ctx.scale(shrinkScale, shrinkScale)
  }

  const flowerSize = 60
  ctx.drawImage(flowerImg, -flowerSize / 2, -flowerSize / 2, flowerSize, flowerSize)
  ctx.restore()

  // Draw water closing in effect
  if (lotus.isActivated && sinkProgress > 0.1 && sinkProgress < 1) {
    ctx.save()
    ctx.translate(x, y)

    const maxRadius = 70
    const waterRadius = maxRadius * sinkProgress // Water grows from 0 to maxRadius

    // Draw semi-transparent water circle with time-of-day color
    const waterAlpha = Math.min(0.6, sinkProgress * 0.6)
    // Convert hex to rgb for dynamic coloring
    const baseColor = waterColors.value.gradientMid
    const r = parseInt(baseColor.slice(1, 3), 16)
    const g = parseInt(baseColor.slice(3, 5), 16)
    const b = parseInt(baseColor.slice(5, 7), 16)
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${waterAlpha})`
    ctx.beginPath()
    ctx.arc(0, 0, waterRadius, 0, Math.PI * 2)
    ctx.fill()

    // Draw bright animated edge with lighter color
    const edgeColor = waterColors.value.gradientStart
    const r2 = parseInt(edgeColor.slice(1, 3), 16)
    const g2 = parseInt(edgeColor.slice(3, 5), 16)
    const b2 = parseInt(edgeColor.slice(5, 7), 16)
    ctx.strokeStyle = `rgba(${r2}, ${g2}, ${b2}, ${0.7 * sinkProgress})`
    ctx.lineWidth = 2
    ctx.shadowBlur = 6
    ctx.shadowColor = `rgba(${r2}, ${g2}, ${b2}, 0.5)`

    ctx.beginPath()
    const segments = 24
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      const wave = Math.sin(i * 0.7 + animationTime * 5) * 1.5
      const r = waterRadius + wave
      const xPos = Math.cos(angle) * r
      const yPos = Math.sin(angle) * r

      if (i === 0) {
        ctx.moveTo(xPos, yPos)
      } else {
        ctx.lineTo(xPos, yPos)
      }
    }
    ctx.closePath()
    ctx.stroke()

    ctx.restore()
  }

  ctx.shadowBlur = 0
}

function drawDecoration(ctx, decoration) {
  const { x, y } = decoration.position
  let img

  if (decoration.type === 'reed') {
    img = loadedImages.reeds[decoration.imageIndex]
  } else if (decoration.type === 'fish') {
    img = loadedImages.fish[decoration.imageIndex]
  }

  if (!img || !img.complete) return

  // Apply some transparency to make decorations subtle
  ctx.save()

  if (decoration.type === 'reed') {
    ctx.globalAlpha = 0.7
  } else if (decoration.type === 'fish') {
    // Use dynamic opacity for fish behavior
    ctx.globalAlpha = decoration.opacity || 0.85
  }

  ctx.translate(x, y)
  ctx.rotate(decoration.rotation)
  ctx.scale(decoration.scale, decoration.scale)

  // Size based on decoration type
  const imgSize = decoration.type === 'reed' ? 120 : 60
  ctx.drawImage(img, -imgSize / 2, -imgSize / 2, imgSize, imgSize)

  ctx.restore()
}

function drawDecorationClipped(ctx, decoration, half) {
  const { x, y } = decoration.position
  let img

  if (decoration.type === 'reed') {
    img = loadedImages.reeds[decoration.imageIndex]
  } else if (decoration.type === 'fish') {
    img = loadedImages.fish[decoration.imageIndex]
  }

  if (!img || !img.complete) return

  // Calculate wave displacement for reeds (gentle swaying)
  let displacement = { x: 0, y: 0 }
  let totalRotation = 0

  if (decoration.type === 'reed') {
    ripples.forEach(ripple => {
      const dist = distance(ripple.origin, decoration.position)

      if (dist < ripple.radius + 80 && dist > ripple.radius - 80) {
        const power = calculateRipplePower(ripple.radius, ripple.peakRadius, ripple.peakPower)
        const angle = Math.atan2(decoration.position.y - ripple.origin.y, decoration.position.x - ripple.origin.x)

        const distFromEdge = Math.abs(dist - ripple.radius)
        const proximityFactor = 1 - (distFromEdge / 80)

        const wavePhase = (dist - ripple.radius) / 20
        const verticalMove = Math.sin(wavePhase) * power * proximityFactor * 2
        const horizontalMove = Math.cos(wavePhase) * power * proximityFactor * 1

        // Reeds sway gently
        const moveAmount = power * proximityFactor * 0.8
        displacement.x += Math.cos(angle) * moveAmount + horizontalMove
        displacement.y += Math.sin(angle) * moveAmount + verticalMove

        // Gentle sway rotation
        totalRotation += Math.sin(wavePhase) * power * proximityFactor * 0.06
      }
    })
  }

  ctx.save()

  // Apply transparency only to fish
  if (decoration.type === 'fish') {
    ctx.globalAlpha = 0.85 // Increased from 0.5 to show true colors better
  }
  // Reeds are fully opaque (no transparency)

  ctx.translate(x + displacement.x, y + displacement.y)
  ctx.rotate(decoration.rotation + totalRotation)
  ctx.scale(decoration.scale, decoration.scale)

  const imgSize = decoration.type === 'reed' ? 120 : 60

  // Create clipping region for top or bottom
  // Top is 75% of the reed (protected from lily pads)
  // Bottom is 25% of the reed (can be behind lily pads)
  ctx.beginPath()
  if (half === 'bottom') {
    // Bottom 25%: from 25% point down to bottom
    ctx.rect(-imgSize / 2, imgSize / 4, imgSize, imgSize / 4)
  } else {
    // Top 75%: from top to 25% point
    ctx.rect(-imgSize / 2, -imgSize / 2, imgSize, imgSize * 0.75)
  }
  ctx.clip()

  // Draw the image
  ctx.drawImage(img, -imgSize / 2, -imgSize / 2, imgSize, imgSize)

  ctx.restore()
}

function distance(p1, p2) {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return Math.sqrt(dx * dx + dy * dy)
}

// Calculate distance from a point to a line segment
function pointToLineDistance(point, lineStart, lineEnd) {
  const dx = lineEnd.x - lineStart.x
  const dy = lineEnd.y - lineStart.y
  const lengthSquared = dx * dx + dy * dy

  if (lengthSquared === 0) return distance(point, lineStart)

  // Calculate parameter t for the projection of point onto the line
  const t = Math.max(0, Math.min(1, ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSquared))

  // Calculate the closest point on the line segment
  const closestPoint = {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy
  }

  return distance(point, closestPoint)
}

function goBack() {
  haptics.light()
  stopGameLoop()
  router.back()
}

function toggleMenu() {
  haptics.light()
  showMenu.value = !showMenu.value
}

function restartLevel() {
  haptics.light()
  showMenu.value = false
  stopGameLoop()
  initLevel()
  startGameLoop()
}

function nextLevel() {
  haptics.light()
  showWinDialog.value = false
  currentLevel.value++
  stopGameLoop()
  initLevel()
  startGameLoop()
}

function retryLevel() {
  haptics.light()
  showLoseDialog.value = false
  stopGameLoop()
  initLevel()
  startGameLoop()
}

function openInstructions() {
  haptics.light()
  showMenu.value = false
  showInstructions.value = true
}
</script>

<style lang="scss" scoped>
.ripple-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  transition: background 2s ease;
}

.game-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  cursor: crosshair;
  touch-action: none;
}

.game-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  padding: 16px;
  padding-top: max(56px, calc(env(safe-area-inset-top) + 16px));
  padding-left: max(16px, env(safe-area-inset-left));
  padding-right: max(16px, env(safe-area-inset-right));
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  pointer-events: none;

  > * {
    pointer-events: all;
  }
}

.level-badge {
  background: rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  padding: 8px 16px;
  border-radius: 20px;
  min-width: 140px;
}

.level-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;

  .stat-item {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.header-menu {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-end;

  .menu-button {
    background: transparent;
    transition: background 0.2s ease;
  }

  .menu-button-active {
    background: rgba(255, 255, 255, 0.15) !important;
    backdrop-filter: blur(10px);
  }

  .menu-buttons-container {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    z-index: 20;
  }

  .menu-buttons-container:has(.menu-item) {
    padding: 8px;
    background: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(10px);
    border-radius: 12px;
  }

  .menu-item {
    background: rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(10px);
  }
}

// Menu fade transitions
.menu-fade-enter-active {
  transition: all 0.2s ease-out;
}

.menu-fade-leave-active {
  transition: all 0.15s ease-in;
}

.menu-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.8);
}

.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.8);
}

.menu-item-1 {
  &.menu-fade-enter-active {
    transition-delay: 0ms;
  }
  &.menu-fade-leave-active {
    transition-delay: 50ms;
  }
}

.menu-item-2 {
  &.menu-fade-enter-active {
    transition-delay: 50ms;
  }
  &.menu-fade-leave-active {
    transition-delay: 0ms;
  }
}

.menu-fade-move {
  transition: transform 0.2s ease;
}

.tap-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.7;
    transform: translate(-50%, -50%) scale(0.95);
  }
}

.instructions-card,
.win-card,
.lose-card {
  min-width: 300px;
  max-width: 400px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);

  :deep(*) {
    color: white !important;
  }
}

.stars-container {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 16px 0;
}

.stat-item {
  text-align: center;
}
</style>
