<template>
  <q-page class="game-page" :style="{ background: themeStore.colors.gradient }">
    <!-- Game Header (replaces MainLayout header for this page) -->
    <div class="game-header">
      <q-btn fab-mini flat icon="arrow_back" color="white" @click="goBack" />

      <div class="level-badge">
        <div class="text-caption text-white">Level {{ currentLevel }}</div>
        <div class="text-body2 text-white text-weight-bold">
          {{ capturedCount }}/{{ levelGoal }}
        </div>
      </div>

      <div class="header-menu">
        <!-- Menu trigger button (stays in place) -->
        <q-btn
          fab-mini
          flat
          icon="more_vert"
          color="white"
          @click="toggleMenu"
          :class="['menu-button', { 'menu-button-active': showMenu }]"
        />

        <!-- Expandable menu buttons (appear below) -->
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
            key="list"
            fab-mini
            flat
            icon="list"
            color="white"
            class="menu-item menu-item-2"
            @click="openLevelSelect"
          />
          <q-btn
            v-if="showMenu"
            key="help"
            fab-mini
            flat
            icon="help_outline"
            color="white"
            class="menu-item menu-item-3"
            @click="openInstructions"
          />
        </transition-group>
      </div>
    </div>

    <!-- Full Screen Canvas -->
    <canvas ref="gameCanvas" class="game-canvas" @click="handleCanvasClick"></canvas>

    <!-- Clicks Remaining Indicator -->
    <div v-if="clicksRemaining > 0 && !gameStarted && showTapHint" class="tap-hint">
      <q-icon name="touch_app" color="white" size="lg" />
      <div class="text-white text-h6 q-mt-sm">Tap to Start</div>
    </div>

    <!-- Level Select Dialog -->
    <q-dialog v-model="showLevelSelect">
      <q-card class="level-select-card">
        <q-card-section>
          <div class="text-h6 q-mb-sm">Select Level</div>
          <div class="text-caption text-grey-7">
            Highest level reached: {{ progressStore.orbs.highestLevel }}
          </div>
        </q-card-section>

        <q-card-section class="level-grid q-pt-none">
          <q-btn
            v-for="level in progressStore.orbs.highestLevel"
            :key="level"
            :label="level"
            :color="level === currentLevel ? 'primary' : 'grey-5'"
            :text-color="level === currentLevel ? 'white' : 'dark'"
            unelevated
            class="level-btn"
            @click="selectLevel(level)"
          />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-btn
            flat
            color="negative"
            label="Reset All Progress"
            icon="restart_alt"
            class="full-width"
            @click="() => { console.log('BUTTON CLICKED!'); confirmReset(); }"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey-7" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Instructions Dialog -->
    <q-dialog v-model="showInstructions">
      <q-card class="instructions-card">
        <q-card-section>
          <div class="text-h6">How to Play</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <ol class="instructions-list">
            <li>Tap the screen to create an explosion</li>
            <li>Explosions capture bouncing orbs</li>
            <li>Captured orbs create new explosions</li>
            <li>Create a chain reaction to reach your goal!</li>
          </ol>
          <p class="text-caption text-grey-7 q-mt-md">
            You only get <strong>one tap</strong> per level, so time it carefully!
          </p>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Got it!" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Level Complete Dialog -->
    <q-dialog v-model="showWinDialog" persistent>
      <q-card class="win-card">
        <q-card-section class="text-center">
          <div class="text-h4 text-positive q-mb-md">🎉 Level Complete!</div>
          <div class="text-h6 q-mb-sm">
            {{ capturedCount }}/{{ levelConfig.totalOrbs }} orbs captured
          </div>
          <div v-if="isPerfect" class="text-positive text-weight-bold">⭐ PERFECT! ⭐</div>
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
          <div class="text-h5 q-mb-md">Try Again</div>
          <div class="text-body1 q-mb-sm">Captured: {{ capturedCount }}/{{ levelGoal }}</div>
          <div class="text-caption text-grey-7">
            You need {{ levelGoal }} orbs to complete this level
          </div>
        </q-card-section>

        <q-card-actions align="center">
          <q-btn flat color="grey-7" label="Back" @click="goBack" />
          <q-btn unelevated color="primary" label="Retry" @click="retryLevel" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useThemeStore } from 'src/stores/theme'
import { useProgressStore } from 'src/stores/progress'
import { useHaptics } from 'src/composables/useHaptics'
import { useGameAudio } from 'src/composables/useGameAudio'

const $q = useQuasar()

const router = useRouter()
const route = useRoute()
const themeStore = useThemeStore()
const progressStore = useProgressStore()
const haptics = useHaptics()
const audio = useGameAudio()

// Canvas ref
const gameCanvas = ref(null)
let ctx = null
let animationId = null

// Game state
const currentLevel = ref(progressStore.orbs.currentLevel)
const capturedCount = ref(0)
const clicksRemaining = ref(1)
const isPlaying = ref(false)
const gameStarted = ref(false)
const gameEnded = ref(false) // Flag to prevent multiple game end checks
// Session-based flag: only show "Tap to Start" once per app session
const hasSeenTapHint = ref(false)
const showTapHint = computed(() => !hasSeenTapHint.value)

// Dialogs
const showInstructions = ref(false)
const showWinDialog = ref(false)
const showLoseDialog = ref(false)
const showLevelSelect = ref(false)
const showMenu = ref(false)

// Game objects
let orbs = []
let explosions = []

// Level configuration
const levelConfig = computed(() => {
  const canvas = gameCanvas.value
  const screenSize = canvas ? Math.min(canvas.width, canvas.height) : 400

  // Progressive difficulty: starts easy, gets significantly harder
  const level = currentLevel.value

  // Start at 22% of screen for level 1, shrink to ~8% by level 20
  // Using exponential decay for smooth difficulty curve
  const radiusPercent = 0.22 - (level - 1) * 0.007 // Decreases by 0.7% per level
  const baseRadius = screenSize * Math.max(radiusPercent, 0.08) // Min 8% of screen

  return {
    level: currentLevel.value,
    totalOrbs: 5 + (currentLevel.value - 1) * 5,
    goal: Math.ceil((5 + (currentLevel.value - 1) * 5) * (0.35 + currentLevel.value * 0.025)), // Balanced goals
    orbSpeed: 1.5 + currentLevel.value * 0.1, // Speed increases more noticeably
    orbRadius: 8,
    explosionMaxRadius: baseRadius,
    explosionGrowthRate: 2.5,
    clicksAllowed: 1,
  }
})

const levelGoal = computed(() => levelConfig.value.goal)
const isPerfect = computed(() => capturedCount.value === levelConfig.value.totalOrbs)

// Orb colors
const orbColors = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#FFA07A',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#FF6B9D',
]

// Initialize game
onMounted(() => {
  setupCanvas()
  loadProgress()
  initLevel()

  // Initialize audio context (required by browser autoplay policies)
  audio.init()

  // Check if level select was requested via query param
  if (route.query.selectLevel === 'true') {
    showLevelSelect.value = true
  }
  // Show instructions on first play
  else if (progressStore.orbs.totalPlays === 0) {
    showInstructions.value = true
  }

  // Handle window resize
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  // Clean up
  stopGameLoop()
  window.removeEventListener('resize', handleResize)
})

function handleResize() {
  setupCanvas()
  // Don't restart level, just resize canvas
}

function setupCanvas() {
  const canvas = gameCanvas.value
  if (!canvas) return

  // Set canvas to full screen
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  ctx = canvas.getContext('2d')
}

function loadProgress() {
  currentLevel.value = progressStore.orbs.currentLevel
}

function stopGameLoop() {
  isPlaying.value = false
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}

function initLevel() {
  // IMPORTANT: Stop any existing game loop first
  stopGameLoop()

  // Reset state completely
  orbs = []
  explosions = []
  capturedCount.value = 0
  clicksRemaining.value = levelConfig.value.clicksAllowed
  gameStarted.value = false
  gameEnded.value = false // Reset the game ended flag
  showTapHint.value = true

  // Reset bell sequence for musical chimes
  audio.resetBellSequence()

  // Fade out tap hint after 2.5 seconds
  setTimeout(() => {
    showTapHint.value = false
  }, 2500)

  // Create orbs
  const config = levelConfig.value

  for (let i = 0; i < config.totalOrbs; i++) {
    orbs.push(createOrb(i, config)) // ← Removed canvas parameter
  }

  // Start game loop
  isPlaying.value = true
  gameLoop()
}

function createOrb(index, config) {
  // ← Removed canvas parameter
  const canvas = gameCanvas.value // ← Access canvas here instead

  // Add margin to keep orbs away from edges
  const margin = config.orbRadius * 3

  return {
    id: `orb-${index}-${Date.now()}`,
    x: Math.random() * (canvas.width - margin * 2) + margin,
    y: Math.random() * (canvas.height - margin * 2) + margin,
    vx: (Math.random() - 0.5) * config.orbSpeed * 2,
    vy: (Math.random() - 0.5) * config.orbSpeed * 2,
    radius: config.orbRadius,
    color: orbColors[index % orbColors.length],
    captured: false,
  }
}

function handleCanvasClick(event) {
  if (clicksRemaining.value <= 0) return

  // Close menu if open
  showMenu.value = false

  haptics.medium()

  const x = event.clientX
  const y = event.clientY

  // Create initial explosion (white for user tap)
  createExplosion(x, y, '#ffffff')

  clicksRemaining.value--
  gameStarted.value = true
  // Mark that user has seen the tap hint
  hasSeenTapHint.value = true
}

function createExplosion(x, y, color = '#ffffff') {
  const config = levelConfig.value

  explosions.push({
    id: `explosion-${Date.now()}-${Math.random()}`,
    x,
    y,
    radius: 0,
    maxRadius: config.explosionMaxRadius,
    growthRate: config.explosionGrowthRate,
    active: true,
    alpha: 1,
    color: color, // Store the color for this explosion
  })
}

function gameLoop() {
  if (!isPlaying.value) return

  update()
  render()

  animationId = requestAnimationFrame(gameLoop)
}

function update() {
  const canvas = gameCanvas.value

  // Update orbs
  orbs.forEach((orb) => {
    if (orb.captured) return

    // Move orb
    orb.x += orb.vx
    orb.y += orb.vy

    // Bounce off walls
    if (orb.x - orb.radius < 0 || orb.x + orb.radius > canvas.width) {
      orb.vx *= -1
      orb.x = Math.max(orb.radius, Math.min(canvas.width - orb.radius, orb.x))
    }
    if (orb.y - orb.radius < 0 || orb.y + orb.radius > canvas.height) {
      orb.vy *= -1
      orb.y = Math.max(orb.radius, Math.min(canvas.height - orb.radius, orb.y))
    }
  })

  // Update explosions
  explosions.forEach((explosion) => {
    if (!explosion.active) {
      // Fade out
      explosion.alpha = Math.max(0, explosion.alpha - 0.05)
      return
    }

    // Grow explosion
    explosion.radius += explosion.growthRate

    // Check if explosion has reached max size
    if (explosion.radius >= explosion.maxRadius) {
      explosion.active = false
    }

    // Check collision with orbs
    orbs.forEach((orb) => {
      if (orb.captured) return

      const dx = orb.x - explosion.x
      const dy = orb.y - explosion.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < explosion.radius + orb.radius) {
        // Orb captured!
        orb.captured = true
        capturedCount.value++
        haptics.light()

        // Play bell chime sound (cycles through musical notes)
        audio.playCapture()

        // Create new explosion at orb position with the orb's color
        createExplosion(orb.x, orb.y, orb.color)
      }
    })
  })

  // Remove fully faded explosions
  explosions = explosions.filter((e) => e.active || e.alpha > 0)

  // Check win/lose conditions (only once)
  if (gameStarted.value && !gameEnded.value && explosions.length === 0) {
    checkGameEnd()
  }
}

function render() {
  if (!ctx) return

  const canvas = gameCanvas.value

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Draw explosions with graceful, colored animations
  explosions.forEach((explosion) => {
    // Convert hex color to RGB for alpha manipulation
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : { r: 255, g: 255, b: 255 }
    }

    const rgb = hexToRgb(explosion.color)
    const growthProgress = explosion.radius / explosion.maxRadius

    // Inner fill - fades faster
    ctx.beginPath()
    ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2)
    const fillAlpha = explosion.alpha * (1 - growthProgress * 0.8) * 0.4
    ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${fillAlpha})`
    ctx.fill()

    // Outer glow ring - more prominent
    ctx.beginPath()
    ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2)
    const strokeAlpha = explosion.alpha * (1 - growthProgress * 0.5)
    ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${strokeAlpha})`
    ctx.lineWidth = 3
    ctx.shadowBlur = 15
    ctx.shadowColor = explosion.color
    ctx.stroke()
    ctx.shadowBlur = 0

    // Inner bright ring for more depth
    if (explosion.active && explosion.radius > 5) {
      ctx.beginPath()
      ctx.arc(explosion.x, explosion.y, explosion.radius * 0.7, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(255, 255, 255, ${strokeAlpha * 0.6})`
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
  })

  // Draw orbs with enhanced glow
  orbs.forEach((orb) => {
    if (orb.captured) return

    ctx.beginPath()
    ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2)

    // Glow effect
    ctx.shadowBlur = 15
    ctx.shadowColor = orb.color
    ctx.fillStyle = orb.color
    ctx.fill()

    // Inner highlight for depth
    ctx.shadowBlur = 0
    ctx.beginPath()
    ctx.arc(orb.x - orb.radius * 0.3, orb.y - orb.radius * 0.3, orb.radius * 0.4, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.fill()
  })
}

function checkGameEnd() {
  gameEnded.value = true // Mark game as ended to prevent repeated checks

  if (capturedCount.value >= levelGoal.value) {
    // Win!
    stopGameLoop()
    haptics.success()
    showWinDialog.value = true

    // Update progress - move to next level
    const nextLevelNumber = currentLevel.value + 1
    progressStore.updateOrbsLevel(nextLevelNumber, capturedCount.value, isPerfect.value)
  } else {
    // Lose - keep game animating for a less abrupt feel
    haptics.warning()
    showLoseDialog.value = true
    // Game continues animating in background
  }
}

function nextLevel() {
  showWinDialog.value = false
  currentLevel.value++
  initLevel()
}

function retryLevel() {
  haptics.light()
  showLoseDialog.value = false
  stopGameLoop() // Stop the background animation before reinitializing
  initLevel()
}

function toggleMenu() {
  haptics.light()
  showMenu.value = !showMenu.value
}

function restartLevel() {
  haptics.light()
  showMenu.value = false
  initLevel()
}

function openLevelSelect() {
  haptics.light()
  showMenu.value = false
  showLevelSelect.value = true
}

function openInstructions() {
  haptics.light()
  showMenu.value = false
  showInstructions.value = true
}

function selectLevel(level) {
  haptics.light()
  showLevelSelect.value = false
  currentLevel.value = level
  initLevel()
}

function confirmReset() {
  console.log('[Game] confirmReset called')
  haptics.warning()
  $q.dialog({
    title: 'Reset Progress',
    message: 'Are you sure you want to reset all progress? This cannot be undone.',
    cancel: {
      flat: true,
      label: 'Cancel',
      color: 'grey-7',
    },
    ok: {
      unelevated: true,
      label: 'Reset',
      color: 'negative',
    },
  }).onOk(async () => {
    console.log('[Game] Reset confirmed by user')
    await resetProgress()
  })
}

async function resetProgress() {
  console.log('[Game] resetProgress function called')
  haptics.heavy()

  // Close the level select dialog first
  showLevelSelect.value = false
  console.log('[Game] Level select dialog closed')

  try {
    console.log('[Game] Calling progressStore.resetOrbsProgress()')
    // Reset progress store using the proper method
    await progressStore.resetOrbsProgress()

    // Reset current game state
    currentLevel.value = 1

    // Reinitialize the level with fresh state
    initLevel()

    // Show success notification
    $q.notify({
      type: 'positive',
      message: 'Progress reset to Level 1',
      position: 'top',
      timeout: 2000,
    })

    console.log('[Game] Reset complete. Current level:', currentLevel.value)
    console.log('[Game] Highest level:', progressStore.orbs.highestLevel)
  } catch (error) {
    console.error('[Game] Failed to reset progress:', error)
    $q.notify({
      type: 'negative',
      message: 'Failed to reset progress. Please try again.',
      position: 'top',
      timeout: 3000,
    })
  }
}

function goBack() {
  stopGameLoop()
  router.back()
}
</script>

<style lang="scss" scoped>
.game-page {
  position: relative;
  width: 100vw;
  height: 100vh;
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

  // Allow interaction with buttons only
  > * {
    pointer-events: all;
  }
}

.level-badge {
  text-align: center;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
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

// Staggered delays for sequential appearance
.menu-item-1 {
  &.menu-fade-enter-active {
    transition-delay: 0ms;
  }
  &.menu-fade-leave-active {
    transition-delay: 100ms;
  }
}

.menu-item-2 {
  &.menu-fade-enter-active {
    transition-delay: 50ms;
  }
  &.menu-fade-leave-active {
    transition-delay: 50ms;
  }
}

.menu-item-3 {
  &.menu-fade-enter-active {
    transition-delay: 100ms;
  }
  &.menu-fade-leave-active {
    transition-delay: 0ms;
  }
}

// Prevent layout shift during transition
.menu-fade-move {
  transition: transform 0.2s ease;
}

.tap-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 5;
  pointer-events: none;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  animation: pulseAndFade 2.5s ease-in-out forwards;
}

@keyframes pulseAndFade {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  40% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.05);
  }
  60% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.95);
  }
}

.instructions-card,
.win-card,
.lose-card,
.level-select-card {
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

.level-select-card {
  max-width: 500px;
}

.level-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.level-btn {
  min-width: 50px;
  font-weight: 600;
}

.instructions-list {
  padding-left: 20px;

  li {
    margin-bottom: 8px;
  }
}
</style>
