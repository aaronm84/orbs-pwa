<template>
  <q-page class="constellation-page">
    <!-- Game Canvas -->
    <div class="canvas-container">
      <canvas
        ref="canvasRef"
        class="game-canvas"
        :class="{ 'canvas-drawing': isDrawing }"
      ></canvas>

      <!-- HUD Overlay -->
      <div class="hud-overlay">
        <!-- Top Bar -->
        <div class="top-bar">
          <q-btn
            flat
            dense
            round
            color="white"
            icon="arrow_back"
            @click="handleBack"
          />

          <div class="constellation-info">
            <div class="constellation-name">{{ currentConstellation?.name }}</div>
            <div class="progress-text">
              {{ completedConnections }}/{{ totalConnections }} connections
            </div>
          </div>

          <q-btn
            flat
            dense
            round
            color="white"
            icon="menu"
            @click="showMenu = true"
          />
        </div>

        <!-- Progress Bar -->
        <div class="progress-container">
          <q-linear-progress
            :value="progress"
            color="light-blue"
            size="6px"
            rounded
          />
        </div>

        <!-- Completion Message -->
        <div v-if="isCompleted" class="completion-overlay">
          <div class="completion-card">
            <div class="completion-icon">✨</div>
            <div class="completion-title">Constellation Complete!</div>
            <div class="completion-subtitle">{{ currentConstellation?.name }}</div>

            <div class="mythology-preview" v-if="currentConstellation?.mythology">
              <div class="mythology-title">{{ currentConstellation.mythology.title }}</div>
              <div class="mythology-text">
                {{ currentConstellation.mythology.shortDescription }}
              </div>
            </div>

            <div class="completion-actions">
              <q-btn
                unelevated
                color="primary"
                label="Learn More"
                @click="showMythologyDialog = true"
              />
              <q-btn
                flat
                color="white"
                label="Next"
                @click="handleNext"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Menu Dialog -->
    <q-dialog v-model="showMenu">
      <q-card class="menu-card">
        <q-card-section>
          <div class="text-h6">Menu</div>
        </q-card-section>

        <q-card-section>
          <q-list>
            <q-item clickable @click="handleRestart">
              <q-item-section avatar>
                <q-icon name="refresh" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Restart</q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable @click="handleHint" :disable="hintsRemaining <= 0">
              <q-item-section avatar>
                <q-icon name="lightbulb" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Hint ({{ hintsRemaining }} left)</q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable @click="showMythologyDialog = true">
              <q-item-section avatar>
                <q-icon name="menu_book" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Story</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Mythology Dialog -->
    <q-dialog v-model="showMythologyDialog">
      <q-card class="mythology-card">
        <q-card-section>
          <div class="text-h5">{{ currentConstellation?.mythology?.title }}</div>
          <div class="text-caption text-grey-7">
            {{ currentConstellation?.mythology?.culture }} Mythology
          </div>
        </q-card-section>

        <q-card-section class="mythology-content">
          <p>{{ currentConstellation?.mythology?.fullStory }}</p>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useConstellationStore } from 'src/stores/constellation'
import { useHaptics } from 'src/composables/useHaptics'
import { useGameAudio } from 'src/composables/useGameAudio'
import { ConstellationRenderer } from 'src/utils/ConstellationRenderer'
import { ConstellationInput } from 'src/utils/ConstellationInput'

const router = useRouter()
const $q = useQuasar()
const constellationStore = useConstellationStore()
const haptics = useHaptics()
const audio = useGameAudio()

// Current level (1-17)
const currentLevel = ref(1)

// Refs
const canvasRef = ref(null)
const showMenu = ref(false)
const showMythologyDialog = ref(false)

// Game state
const isDrawing = ref(false)
const completedConnections = ref(0)
const hintsRemaining = ref(3)
const isCompleted = ref(false)

// Renderer and input instances
let renderer = null
let inputHandler = null

// Game data
const stars = ref([])
const connections = ref([])
const playerConnections = ref([])
const levelData = ref(null)

// Current constellation (derived from level data)
const currentConstellation = computed(() => {
  if (!levelData.value) return null

  return {
    id: levelData.value.id,
    name: levelData.value.name,
    latinName: levelData.value.constellation.common_name,
    abbreviation: levelData.value.constellation.iau_code,
    connections: levelData.value.constellation.edges,
    stars: stars.value.filter(s => s.isConstellation),
    // TODO: Add mythology data
    mythology: null
  }
})

// Progress calculation
const totalConnections = computed(() => {
  return currentConstellation.value?.connections?.length || 0
})

const progress = computed(() => {
  if (totalConnections.value === 0) return 0
  return completedConnections.value / totalConnections.value
})

// Get next constellation in difficulty order
const nextConstellation = computed(() => {
  if (currentLevel.value >= 25) return null
  return { level: currentLevel.value + 1 }
})

/**
 * Load level data from JSON file
 */
async function loadLevel(level) {
  const levelId = `constellation_lv${String(level).padStart(2, '0')}`
  const response = await fetch(`/constellation/levels/${levelId}.json`)
  if (!response.ok) {
    throw new Error(`Failed to load level ${level}`)
  }
  return await response.json()
}

/**
 * Calculate optimal scale to balance star spacing and keeping constellation visible
 * Returns scale factor and padding that work together
 */
function calculateScaleAndPadding(constellationStars, bounds, canvasWidth, canvasHeight) {
  // Target minimum pixel distance between any two stars
  const MIN_PIXEL_DISTANCE = 50 // pixels

  // Calculate minimum angular distance between any two constellation stars (in degrees)
  let minAngularDistance = Infinity

  for (let i = 0; i < constellationStars.length; i++) {
    for (let j = i + 1; j < constellationStars.length; j++) {
      const star1 = constellationStars[i]
      const star2 = constellationStars[j]

      const raDistance = Math.abs(star1.ra - star2.ra)
      const decDistance = Math.abs(star1.dec - star2.dec)
      const distance = Math.sqrt(raDistance * raDistance + decDistance * decDistance)

      if (distance > 0) {
        minAngularDistance = Math.min(minAngularDistance, distance)
      }
    }
  }

  // Calculate bounding box size in degrees
  const raRange = bounds.maxRa - bounds.minRa
  const decRange = bounds.maxDec - bounds.minDec
  const avgRange = (raRange + decRange) / 2

  // Use the smaller dimension to ensure constellation fits
  const minCanvasSize = Math.min(canvasWidth, canvasHeight)

  // Calculate base pixels per degree (with some initial padding for safety)
  const basePadding = 0.15 // 15% padding on each side
  const usableCanvasSize = minCanvasSize * (1 - 2 * basePadding)
  const basePixelsPerDegree = usableCanvasSize / avgRange

  // Current pixel distance at scale 1.0 with base padding
  const currentPixelDistance = minAngularDistance * basePixelsPerDegree

  // Calculate desired scale
  let scale = 1.0
  if (currentPixelDistance < MIN_PIXEL_DISTANCE) {
    scale = MIN_PIXEL_DISTANCE / currentPixelDistance
  }

  // Limit scale to prevent stars going off-screen
  // At scale > 1, we need more padding to keep stars visible
  const maxSafeScale = 2.5
  scale = Math.min(maxSafeScale, scale)

  // Adjust padding based on scale - more zoom needs more padding
  const padding = basePadding + (scale - 1.0) * 0.1

  console.log(`Scale calculation: minDist=${minAngularDistance.toFixed(3)}°, currentPx=${currentPixelDistance.toFixed(1)}px, scale=${scale.toFixed(2)}x, padding=${(padding * 100).toFixed(1)}%`)

  return { scale, padding }
}

/**
 * Project RA/Dec to canvas x/y using equirectangular projection with scaling
 */
function projectStar(ra, dec, canvasWidth, canvasHeight, safeAreaTop, safeAreaHeight, bounds, scale = 1.0, padding = 0.15) {
  // Calculate position within the bounding box (0-1 range)
  const normalizedX = (ra - bounds.minRa) / (bounds.maxRa - bounds.minRa)
  const normalizedY = (dec - bounds.minDec) / (bounds.maxDec - bounds.minDec)

  // Apply scale factor (zoom in by scaling around center)
  const centerX = 0.5
  const centerY = 0.5
  const scaledX = centerX + (normalizedX - centerX) * scale
  const scaledY = centerY + (normalizedY - centerY) * scale

  // Apply padding
  const paddedX = padding + scaledX * (1 - 2 * padding)
  const paddedY = padding + scaledY * (1 - 2 * padding)

  // Map to canvas coordinates
  const x = paddedX * canvasWidth
  const y = safeAreaTop + ((1 - paddedY) * safeAreaHeight) // Flip Y so higher Dec is at top

  return { x, y }
}

/**
 * Initialize the game
 */
async function initGame() {
  try {
    // Load level data
    levelData.value = await loadLevel(currentLevel.value)

    // Setup canvas first so we have dimensions
    setupCanvas()

    // Initialize game state with scaled positions
    await initializeConstellation()

    // Setup renderer and input
    setupRenderer()
    setupInput()
  } catch (error) {
    console.error('Failed to initialize game:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to load constellation data',
      position: 'top'
    })
  }
}

/**
 * Initialize constellation data for gameplay
 */
function initializeConstellation() {
  if (!levelData.value) return

  // Get canvas dimensions
  const canvasWidth = canvasRef.value?.width || 800
  const canvasHeight = canvasRef.value?.height || 600

  // Define safe area (avoid toolbar at top)
  const TOOLBAR_HEIGHT = 100 // Top bar + progress bar + padding
  const safeAreaTop = TOOLBAR_HEIGHT
  const safeAreaHeight = canvasHeight - TOOLBAR_HEIGHT

  // Get constellation star HIP IDs
  const constellationHips = new Set()
  for (const [hip1, hip2] of levelData.value.constellation.edges) {
    constellationHips.add(hip1)
    constellationHips.add(hip2)
  }

  // Calculate bounding box from all stars in the level
  let minRa = Infinity, maxRa = -Infinity
  let minDec = Infinity, maxDec = -Infinity

  for (const star of levelData.value.stars) {
    minRa = Math.min(minRa, star.ra)
    maxRa = Math.max(maxRa, star.ra)
    minDec = Math.min(minDec, star.dec)
    maxDec = Math.max(maxDec, star.dec)
  }

  const bounds = { minRa, maxRa, minDec, maxDec }

  // Separate constellation stars from distractors
  const constellationStars = []
  const distractorStars = []

  for (const star of levelData.value.stars) {
    if (constellationHips.has(star.hip)) {
      constellationStars.push(star)
    } else {
      distractorStars.push(star)
    }
  }

  // Scale distractor count based on level (1-17)
  // Level 1: 5 distractors, Level 17: 90 distractors
  const maxDistractors = Math.min(5 + (currentLevel.value - 1) * 5, 90)

  // Filter to brightest distractors only
  const selectedDistractors = distractorStars
    .sort((a, b) => a.mag - b.mag) // Sort by magnitude (brighter = lower number)
    .slice(0, maxDistractors)

  // Calculate scale and padding to ensure good star spacing while keeping constellation visible
  const { scale, padding } = calculateScaleAndPadding(constellationStars, bounds, canvasWidth, canvasHeight - TOOLBAR_HEIGHT)

  // Combine constellation stars with limited distractors
  const starsToRender = [...constellationStars, ...selectedDistractors]

  // Add faint background stars for visual atmosphere (non-interactive)
  // Use dimmer stars from the remaining distractors
  const backgroundStarCount = 50 + currentLevel.value * 5 // 55-135 background stars
  const remainingDistractors = distractorStars.filter(
    s => !selectedDistractors.includes(s)
  )
  const faintBackgroundStars = remainingDistractors
    .slice(0, backgroundStarCount)
    .map(star => {
      const { x, y } = projectStar(
        star.ra,
        star.dec,
        canvasWidth,
        canvasHeight,
        safeAreaTop,
        safeAreaHeight,
        bounds,
        scale,
        padding
      )

      return {
        id: `bg-${star.hip}`,
        hip: star.hip,
        name: null,
        ra: star.ra,
        dec: star.dec,
        x,
        y,
        magnitude: star.mag + 2, // Make them appear 2 magnitudes dimmer
        color: '#ffffff',
        isConstellation: false,
        isBackground: true, // Flag as pure background
        isConnected: false,
        isSelected: false,
        isHovered: false,
        isHint: false
      }
    })

  // Project all interactive stars from RA/Dec to x/y
  const interactiveStars = starsToRender.map(star => {
    let x, y

    // Check if star has manual positioning (0-1 range)
    if (star.manual_x !== undefined && star.manual_y !== undefined) {
      // Use manual positioning - convert from 0-1 range to canvas coordinates
      x = star.manual_x * canvasWidth
      y = safeAreaTop + star.manual_y * safeAreaHeight
      console.log(`Using manual position for HIP ${star.hip}: (${star.manual_x}, ${star.manual_y}) -> (${x.toFixed(0)}, ${y.toFixed(0)})`)
    } else {
      // Use automatic projection from RA/Dec
      const projected = projectStar(
        star.ra,
        star.dec,
        canvasWidth,
        canvasHeight,
        safeAreaTop,
        safeAreaHeight,
        bounds,
        scale,
        padding
      )
      x = projected.x
      y = projected.y
    }

    return {
      id: star.hip, // Use HIP ID
      hip: star.hip,
      name: null, // TODO: Add proper names from HYG
      ra: star.ra,
      dec: star.dec,
      x,
      y,
      magnitude: star.mag,
      color: '#ffffff', // TODO: Add color based on spectral type
      isConstellation: constellationHips.has(star.hip),
      isBackground: false,
      isConnected: false,
      isSelected: false,
      isHovered: false,
      isHint: false
    }
  })

  // Combine all stars (background first so they render behind)
  stars.value = [...faintBackgroundStars, ...interactiveStars]

  // Store required connections using HIP IDs
  connections.value = levelData.value.constellation.edges.map(([hip1, hip2]) => ({
    from: hip1,
    to: hip2,
    completed: false
  }))

  // Reset state
  playerConnections.value = []
  completedConnections.value = 0
  hintsRemaining.value = 3
  isCompleted.value = false
}

/**
 * Setup canvas
 */
function setupCanvas() {
  if (!canvasRef.value) return

  const container = canvasRef.value.parentElement
  const width = container.clientWidth
  const height = container.clientHeight

  canvasRef.value.width = width
  canvasRef.value.height = height
}

/**
 * Setup renderer
 */
function setupRenderer() {
  if (!canvasRef.value) return

  renderer = new ConstellationRenderer(canvasRef.value)
  renderer.setStars(stars.value)
  renderer.setConnections(connections.value)
  renderer.start()
}

/**
 * Setup input handling
 */
function setupInput() {
  if (!canvasRef.value || !renderer) return

  inputHandler = new ConstellationInput(canvasRef.value, renderer)

  // Set callbacks
  inputHandler.onStarSelected = handleStarSelected
  inputHandler.onConnectionComplete = handleConnectionComplete
  inputHandler.onConnectionCanceled = handleConnectionCanceled
}

/**
 * Check if a star is part of any completed connection
 */
function isStarInCompletedConnection(starId) {
  return connections.value.some(conn =>
    conn.completed && (conn.from === starId || conn.to === starId)
  )
}

/**
 * Handle star selected
 */
function handleStarSelected(star) {
  isDrawing.value = true
  haptics.light()
}

/**
 * Handle connection complete
 */
function handleConnectionComplete(connection) {
  isDrawing.value = false

  // Check if both stars are constellation stars (not background stars)
  const star1 = stars.value.find(s => s.id === connection.from)
  const star2 = stars.value.find(s => s.id === connection.to)

  if (!star1?.isConstellation || !star2?.isConstellation) {
    // One or both stars are background stars
    haptics.warning()
    audio.playLevelFailed()

    // Only reset isConnected if the star isn't part of any completed connections
    if (star1 && !isStarInCompletedConnection(star1.id)) {
      star1.isConnected = false
    }
    if (star2 && !isStarInCompletedConnection(star2.id)) {
      star2.isConnected = false
    }

    $q.notify({
      type: 'negative',
      message: 'Not a constellation star',
      position: 'top',
      timeout: 1000
    })

    renderer.setConnections(connections.value)
    return
  }

  // Check if this is a valid connection
  const isValid = connections.value.some(conn =>
    (conn.from === connection.from && conn.to === connection.to) ||
    (conn.from === connection.to && conn.to === connection.from)
  )

  console.log('Checking connection:', connection, 'Valid:', isValid)
  console.log('All required connections:', connections.value)
  console.log('Completed so far:', completedConnections.value, '/', totalConnections.value)

  if (isValid) {
    // Valid connection!
    haptics.medium()
    audio.playStarConnect()

    // Mark connection as completed
    const conn = connections.value.find(c =>
      (c.from === connection.from && c.to === connection.to) ||
      (c.from === connection.to && c.to === connection.from)
    )

    if (conn && !conn.completed) {
      conn.completed = true
      playerConnections.value.push(connection)
      completedConnections.value++

      console.log('Connection marked complete! Total:', completedConnections.value, '/', totalConnections.value)

      // Check if constellation is complete
      if (completedConnections.value === totalConnections.value) {
        console.log('ALL CONNECTIONS COMPLETE - triggering handleCompletion()')
        handleCompletion()
      }
    } else {
      console.log('Connection already completed or not found')
    }
  } else {
    // Invalid connection (wrong pair of constellation stars)
    haptics.warning()
    audio.playLevelFailed()

    // Only reset isConnected if the star isn't part of any completed connections
    if (star1 && !isStarInCompletedConnection(star1.id)) {
      star1.isConnected = false
    }
    if (star2 && !isStarInCompletedConnection(star2.id)) {
      star2.isConnected = false
    }

    $q.notify({
      type: 'negative',
      message: 'These stars don\'t connect',
      position: 'top',
      timeout: 1000
    })
  }

  renderer.setConnections(connections.value)
}

/**
 * Handle connection canceled
 */
function handleConnectionCanceled() {
  isDrawing.value = false
}

/**
 * Handle constellation completion
 */
function handleCompletion() {
  isCompleted.value = true
  haptics.success()
  audio.playLevelComplete()

  // Update progress in store
  constellationStore.updateProgress(currentConstellation.value.id, {
    completed: true,
    mode: 'guided',
    time: 0 // TODO: Add timer
  })

  $q.notify({
    type: 'positive',
    message: 'Constellation completed!',
    icon: 'stars',
    position: 'top',
    timeout: 2000
  })
}

/**
 * Handle hint request
 */
function handleHint() {
  if (hintsRemaining.value <= 0) return

  // Find an incomplete connection
  const incompleteConn = connections.value.find(c => !c.completed)

  if (incompleteConn) {
    // Highlight the stars in this connection
    const star1 = stars.value.find(s => s.id === incompleteConn.from)
    const star2 = stars.value.find(s => s.id === incompleteConn.to)

    if (star1 && star2) {
      star1.isHint = true
      star2.isHint = true

      // Remove hint after 3 seconds
      setTimeout(() => {
        star1.isHint = false
        star2.isHint = false
      }, 3000)

      hintsRemaining.value--
      haptics.light()

      $q.notify({
        message: 'Hint: Connect the highlighted stars',
        icon: 'lightbulb',
        position: 'top',
        timeout: 3000
      })
    }
  }

  showMenu.value = false
}

/**
 * Handle restart
 */
function handleRestart() {
  initializeConstellation()
  renderer.setStars(stars.value)
  renderer.setConnections(connections.value)
  showMenu.value = false
  haptics.light()
}

/**
 * Handle back navigation
 */
function handleBack() {
  haptics.light()
  router.push({ name: 'home' })
}

/**
 * Handle next constellation
 */
async function handleNext() {
  if (nextConstellation.value) {
    // Load next level
    isCompleted.value = false
    currentLevel.value = nextConstellation.value.level

    try {
      levelData.value = await loadLevel(currentLevel.value)
      initializeConstellation()
      renderer.setStars(stars.value)
      renderer.setConnections(connections.value)
      showMythologyDialog.value = false
      haptics.light()
    } catch (error) {
      console.error('Failed to load next level:', error)
      $q.notify({
        type: 'negative',
        message: 'Failed to load next constellation',
        position: 'top'
      })
    }
  } else {
    // No more constellations, go back to home
    router.push({ name: 'home' })
  }
}

/**
 * Handle window resize
 */
function handleResize() {
  setupCanvas()
  if (renderer) {
    const width = canvasRef.value.width
    const height = canvasRef.value.height
    renderer.setSize(width, height)
  }
}

// Lifecycle
onMounted(() => {
  // Initialize audio
  audio.init()

  // Start background music
  audio.playBackgroundMusic()

  // Initialize game
  initGame()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  // Stop background music
  audio.stopBackgroundMusic()

  if (renderer) {
    renderer.destroy()
  }
  if (inputHandler) {
    inputHandler.destroy()
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
.constellation-page {
  background: radial-gradient(ellipse at center, #1a237e 0%, #0a0e27 100%);
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.canvas-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
}

.game-canvas {
  width: 100%;
  height: 100%;
  cursor: crosshair;

  &.canvas-drawing {
    cursor: grabbing;
  }
}

.hud-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 10;

  > * {
    pointer-events: auto;
  }
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.5) 0%, transparent 100%);
}

.constellation-info {
  flex: 1;
  text-align: center;
  color: white;
}

.constellation-name {
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 4px;
}

.progress-text {
  font-size: 14px;
  opacity: 0.8;
}

.progress-container {
  padding: 0 16px;
  margin-top: 8px;
}

.completion-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.completion-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 32px;
  max-width: 400px;
  text-align: center;
  animation: scaleIn 0.3s ease;
}

@keyframes scaleIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.completion-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.completion-title {
  font-size: 24px;
  font-weight: 600;
  color: #1a237e;
  margin-bottom: 8px;
}

.completion-subtitle {
  font-size: 18px;
  color: #666;
  margin-bottom: 24px;
}

.mythology-preview {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  text-align: left;
}

.mythology-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a237e;
  margin-bottom: 8px;
}

.mythology-text {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.completion-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.menu-card,
.mythology-card {
  min-width: 300px;
  max-width: 500px;
}

.mythology-content {
  max-height: 400px;
  overflow-y: auto;

  p {
    line-height: 1.6;
    color: #333;
  }
}
</style>
