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

    <!-- Taps Remaining Indicator -->
    <div v-if="tapsRemaining > 0 && !showTapHint" class="taps-indicator">
      <q-icon name="touch_app" color="white" size="md" />
      <span class="text-white text-h6">{{ tapsRemaining }}</span>
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
import { useHaptics } from 'src/composables/useHaptics'

const router = useRouter()
const themeStore = useThemeStore()
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

const activatedCount = computed(() => {
  return level.value.lotusFlowers.filter(l => l.isActivated).length
})

const totalLotus = computed(() => level.value.lotusFlowers.length)

// Initialize canvas
onMounted(async () => {
  if (!gameCanvas.value) return

  ctx = gameCanvas.value.getContext('2d')

  // Load splash sounds
  try {
    const splashFiles = [
      '/src/assets/audio/water/563858__nknverpacker__watersplash04.wav',
      '/src/assets/audio/water/563859__nknverpacker__watersplash03.wav',
      '/src/assets/audio/water/563860__nknverpacker__watersplash02.wav',
      '/src/assets/audio/water/563861__nknverpacker__watersplash01.wav'
    ]

    splashSounds = splashFiles.map(file => {
      const audio = new Audio(file)
      audio.volume = 0.3
      return audio
    })
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

  // Start game loop
  startGameLoop()

  // Cleanup
  onUnmounted(() => {
    window.removeEventListener('resize', resizeCanvas)
    stopGameLoop()
  })
})

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

  // Calculate level difficulty
  const lotusCount = Math.min(2 + Math.floor(levelNum / 3), 6)
  const stoneCount = Math.min(Math.floor(levelNum / 2), 4)
  const lilypadCount = Math.min(Math.floor(levelNum / 3), 3)
  const leafCount = levelNum >= 5 ? Math.min(Math.floor((levelNum - 4) / 2), 2) : 0

  // Tighter tap allowance - typically just 1-2 taps per lotus
  level.value.tapsAllowed = Math.max(2, Math.ceil(lotusCount * 0.6) + Math.floor(levelNum / 8))
  level.value.optimalTaps = Math.max(1, Math.ceil(lotusCount * 0.5))

  // Generate lotus flowers
  level.value.lotusFlowers = []
  const minSpacing = 120
  const margin = 80

  for (let i = 0; i < lotusCount; i++) {
    let attempts = 0
    let position

    while (attempts < 50) {
      position = {
        x: margin + rng() * (width - 2 * margin),
        y: margin + rng() * (height - 2 * margin)
      }

      // Check spacing from other lotus flowers
      const tooClose = level.value.lotusFlowers.some(
        lotus => distance(position, lotus.position) < minSpacing
      )

      if (!tooClose) break
      attempts++
    }

    level.value.lotusFlowers.push({
      id: `lotus_${i}`,
      position,
      activationThreshold: 0.65 + rng() * 0.15, // 0.65-0.8
      protectedRadius: 50,
      isActivated: false,
      glowIntensity: 0.3,
      currentPower: 0
    })
  }

  // Generate obstacles
  level.value.obstacles = []

  // Stones
  for (let i = 0; i < stoneCount; i++) {
    let attempts = 0
    let position

    while (attempts < 50) {
      position = {
        x: margin + rng() * (width - 2 * margin),
        y: margin + rng() * (height - 2 * margin)
      }

      // Check spacing from lotus flowers and other obstacles
      const minDistToLotus = 80
      const minDistToObstacle = 60

      const tooCloseToLotus = level.value.lotusFlowers.some(
        lotus => distance(position, lotus.position) < minDistToLotus
      )
      const tooCloseToObstacle = level.value.obstacles.some(
        obs => distance(position, obs.position) < minDistToObstacle
      )

      if (!tooCloseToLotus && !tooCloseToObstacle) break
      attempts++
    }

    level.value.obstacles.push({
      id: `stone_${i}`,
      type: 'stone',
      position,
      radius: 25 + rng() * 10 // 25-35
    })
  }

  // Lily pads
  for (let i = 0; i < lilypadCount; i++) {
    let attempts = 0
    let position

    while (attempts < 50) {
      position = {
        x: margin + rng() * (width - 2 * margin),
        y: margin + rng() * (height - 2 * margin)
      }

      const minDistToLotus = 80
      const minDistToObstacle = 50

      const tooCloseToLotus = level.value.lotusFlowers.some(
        lotus => distance(position, lotus.position) < minDistToLotus
      )
      const tooCloseToObstacle = level.value.obstacles.some(
        obs => distance(position, obs.position) < minDistToObstacle
      )

      if (!tooCloseToLotus && !tooCloseToObstacle) break
      attempts++
    }

    level.value.obstacles.push({
      id: `lilypad_${i}`,
      type: 'lilypad',
      position,
      radius: 20 + rng() * 8 // 20-28
    })
  }

  // Floating leaves (moving obstacles)
  for (let i = 0; i < leafCount; i++) {
    const position = {
      x: margin + rng() * (width - 2 * margin),
      y: margin + rng() * (height - 2 * margin)
    }

    const boundsSize = 80 + rng() * 80 // 80-160 (smaller range)
    const velocity = {
      x: (rng() - 0.5) * 0.5, // Much slower: 0.5 instead of 1.5
      y: (rng() - 0.5) * 0.5
    }

    level.value.obstacles.push({
      id: `leaf_${i}`,
      type: 'leaf',
      position,
      radius: 18 + rng() * 6, // 18-24
      velocity,
      bounds: {
        minX: Math.max(margin, position.x - boundsSize / 2),
        maxX: Math.min(width - margin, position.x + boundsSize / 2),
        minY: Math.max(margin, position.y - boundsSize / 2),
        maxY: Math.min(height - margin, position.y + boundsSize / 2)
      }
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

  // Check protected zones
  for (const lotus of level.value.lotusFlowers) {
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
  showTapHint.value = false

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

  // Check protected zones
  for (const lotus of level.value.lotusFlowers) {
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
  showTapHint.value = false

  // Reset flag after a short delay to allow next tap
  setTimeout(() => {
    isProcessingTap = false
  }, 100)
}

function createRipple(x, y, strength = 'medium') {
  const config = TAP_CONFIGS[strength]

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

  ripples.push({
    id: `ripple_${Date.now()}`,
    origin: { x, y },
    radius: 0,
    maxRadius: config.maxRadius,
    speed: config.speed,
    peakRadius: config.peakRadius,
    peakPower: config.peakPower,
    lineWidth: config.lineWidth,
    glowIntensity: config.glowIntensity,
    isActive: true,
    createdAt: Date.now(),
    strength
  })
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
    if (obstacle.type === 'leaf' && obstacle.velocity) {
      // Update position
      obstacle.position.x += obstacle.velocity.x
      obstacle.position.y += obstacle.velocity.y

      // Bounce off bounds
      if (obstacle.position.x <= obstacle.bounds.minX || obstacle.position.x >= obstacle.bounds.maxX) {
        obstacle.velocity.x *= -1
      }
      if (obstacle.position.y <= obstacle.bounds.minY || obstacle.position.y >= obstacle.bounds.maxY) {
        obstacle.velocity.y *= -1
      }
    }
  })
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

    // Check if combined power activates the lotus
    if (combinedPower >= lotus.activationThreshold) {
      lotus.isActivated = true
      lotus.activatedAt = Date.now()
      lotus.glowIntensity = 1.0
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

function checkGameState() {
  // Don't check game state if dialogs are already showing
  if (showWinDialog.value || showLoseDialog.value) return

  const allActivated = level.value.lotusFlowers.every(l => l.isActivated)

  if (allActivated) {
    stopGameLoop()
    calculateScore()
    failureStreak.value = 0 // Reset streak on success
    showWinDialog.value = true
  } else if (tapsRemaining.value === 0 && ripples.length === 0) {
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
  ctx.fillStyle = '#0a3a52'
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
  gradient.addColorStop(0, '#1a6a8a')
  gradient.addColorStop(0.5, '#155a7a')
  gradient.addColorStop(1, '#0a3a52')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // Add subtle water surface texture
  drawWaterSurface(ctx, width, height)

  // Draw obstacles
  level.value.obstacles.forEach(obstacle => {
    drawObstacle(ctx, obstacle)
  })

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

  // Draw lotus flowers
  level.value.lotusFlowers.forEach(lotus => {
    drawLotus(ctx, lotus)
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

  // Draw multiple concentric rings for more liquid feel
  const ringCount = 3

  for (let ring = 0; ring < ringCount; ring++) {
    const ringOffset = ring * 15
    const currentRadius = ripple.radius - ringOffset

    if (currentRadius <= 0) continue

    const ringPower = calculateRipplePower(currentRadius, ripple.peakRadius, ripple.peakPower)
    const ringAlpha = (1 - ring / ringCount) * ringPower

    if (ringAlpha <= 0.05) continue

    // Add slight distortion for organic feel
    ctx.save()
    ctx.beginPath()

    const segments = 32
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      const wobble = Math.sin(angle * 4 + animationTime * 3) * 2
      const distortedRadius = currentRadius + wobble

      const x = ripple.origin.x + Math.cos(angle) * distortedRadius
      const y = ripple.origin.y + Math.sin(angle) * distortedRadius

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }

    ctx.closePath()

    // Glow effect
    ctx.shadowBlur = ripple.glowIntensity * ringPower
    ctx.shadowColor = color

    // Stroke with fade
    const rgbaColor = color.replace(')', `, ${ringAlpha})`)
    ctx.strokeStyle = rgbaColor
    ctx.lineWidth = ripple.lineWidth * (1 - ring / ringCount * 0.5)
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
    // Show current power as blue/cyan glow
    const glowIntensity = Math.min(lotus.currentPower / lotus.activationThreshold, 1)
    ctx.shadowBlur = 20 * glowIntensity
    ctx.shadowColor = `rgba(100, 200, 255, ${glowIntensity * 0.6})`
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

function distance(p1, p2) {
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  return Math.sqrt(dx * dx + dy * dy)
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
  padding-top: max(16px, env(safe-area-inset-top));
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

.taps-indicator {
  position: absolute;
  top: 120px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  padding: 8px 16px;
  border-radius: 20px;
  pointer-events: none;
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
