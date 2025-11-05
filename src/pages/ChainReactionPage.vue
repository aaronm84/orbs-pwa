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
            Highest level reached: {{ progressStore.chainReaction.highestLevel }}
          </div>
        </q-card-section>

        <q-card-section class="level-grid q-pt-none">
          <q-btn
            v-for="level in progressStore.chainReaction.highestLevel"
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
            @click="confirmReset"
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
            <li>Explosions capture bouncing balls</li>
            <li>Captured balls create new explosions</li>
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
            {{ capturedCount }}/{{ levelConfig.totalBalls }} balls captured
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
            You need {{ levelGoal }} balls to complete this level
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
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useThemeStore } from 'src/stores/theme'
import { useProgressStore } from 'src/stores/progress'
import { useHaptics } from 'src/composables/useHaptics'
import { useGameAudio } from 'src/composables/useGameAudio'

const $q = useQuasar()

const router = useRouter()
const themeStore = useThemeStore()
const progressStore = useProgressStore()
const haptics = useHaptics()
const audio = useGameAudio()

// Canvas ref
const gameCanvas = ref(null)
let ctx = null
let animationId = null

// Game state
const currentLevel = ref(1)
const capturedCount = ref(0)
const clicksRemaining = ref(1)
const isPlaying = ref(false)
const gameStarted = ref(false)
const showTapHint = ref(true)

// Dialogs
const showInstructions = ref(false)
const showWinDialog = ref(false)
const showLoseDialog = ref(false)
const showLevelSelect = ref(false)
const showMenu = ref(false)

// Game objects
let balls = []
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
    totalBalls: 5 + (currentLevel.value - 1) * 5,
    goal: Math.ceil((5 + (currentLevel.value - 1) * 5) * (0.35 + currentLevel.value * 0.025)), // Balanced goals
    ballSpeed: 1.5 + currentLevel.value * 0.1, // Speed increases more noticeably
    ballRadius: 8,
    explosionMaxRadius: baseRadius,
    explosionGrowthRate: 2.5,
    clicksAllowed: 1,
  }
})

const levelGoal = computed(() => levelConfig.value.goal)
const isPerfect = computed(() => capturedCount.value === levelConfig.value.totalBalls)

// Ball colors
const ballColors = [
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

  // Show instructions on first play
  if (progressStore.chainReaction.totalPlays === 0) {
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
  currentLevel.value = progressStore.chainReaction.currentLevel
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
  balls = []
  explosions = []
  capturedCount.value = 0
  clicksRemaining.value = levelConfig.value.clicksAllowed
  gameStarted.value = false
  showTapHint.value = true

  // Reset bell sequence for musical chimes
  audio.resetBellSequence()

  // Fade out tap hint after 2.5 seconds
  setTimeout(() => {
    showTapHint.value = false
  }, 2500)

  // Create balls
  const config = levelConfig.value

  for (let i = 0; i < config.totalBalls; i++) {
    balls.push(createBall(i, config)) // ← Removed canvas parameter
  }

  // Start game loop
  isPlaying.value = true
  gameLoop()
}

function createBall(index, config) {
  // ← Removed canvas parameter
  const canvas = gameCanvas.value // ← Access canvas here instead

  // Add margin to keep balls away from edges
  const margin = config.ballRadius * 3

  return {
    id: `ball-${index}-${Date.now()}`,
    x: Math.random() * (canvas.width - margin * 2) + margin,
    y: Math.random() * (canvas.height - margin * 2) + margin,
    vx: (Math.random() - 0.5) * config.ballSpeed * 2,
    vy: (Math.random() - 0.5) * config.ballSpeed * 2,
    radius: config.ballRadius,
    color: ballColors[index % ballColors.length],
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

  // Update balls
  balls.forEach((ball) => {
    if (ball.captured) return

    // Move ball
    ball.x += ball.vx
    ball.y += ball.vy

    // Bounce off walls
    if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
      ball.vx *= -1
      ball.x = Math.max(ball.radius, Math.min(canvas.width - ball.radius, ball.x))
    }
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
      ball.vy *= -1
      ball.y = Math.max(ball.radius, Math.min(canvas.height - ball.radius, ball.y))
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

    // Check collision with balls
    balls.forEach((ball) => {
      if (ball.captured) return

      const dx = ball.x - explosion.x
      const dy = ball.y - explosion.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < explosion.radius + ball.radius) {
        // Ball captured!
        ball.captured = true
        capturedCount.value++
        haptics.light()

        // Play bell chime sound (cycles through musical notes)
        audio.playCapture()

        // Create new explosion at ball position with the ball's color
        createExplosion(ball.x, ball.y, ball.color)
      }
    })
  })

  // Remove fully faded explosions
  explosions = explosions.filter((e) => e.active || e.alpha > 0)

  // Check win/lose conditions
  if (gameStarted.value && explosions.length === 0) {
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

  // Draw balls with enhanced glow
  balls.forEach((ball) => {
    if (ball.captured) return

    ctx.beginPath()
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)

    // Glow effect
    ctx.shadowBlur = 15
    ctx.shadowColor = ball.color
    ctx.fillStyle = ball.color
    ctx.fill()

    // Inner highlight for depth
    ctx.shadowBlur = 0
    ctx.beginPath()
    ctx.arc(ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, ball.radius * 0.4, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.fill()
  })
}

function checkGameEnd() {
  stopGameLoop()

  if (capturedCount.value >= levelGoal.value) {
    // Win!
    haptics.success()
    showWinDialog.value = true

    // Update progress - move to next level
    const nextLevelNumber = currentLevel.value + 1
    progressStore.updateChainReactionLevel(nextLevelNumber, capturedCount.value, isPerfect.value)
  } else {
    // Lose
    haptics.warning()
    showLoseDialog.value = true
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
  }).onOk(() => {
    resetProgress()
  })
}

function resetProgress() {
  haptics.heavy()
  // Reset progress store
  progressStore.chainReaction.currentLevel = 1
  progressStore.chainReaction.highestLevel = 1
  progressStore.chainReaction.bestScore = 0
  progressStore.chainReaction.totalPlays = 0
  progressStore.chainReaction.perfectLevels = []
  progressStore.saveToStorage()

  // Reset current game
  currentLevel.value = 1
  showLevelSelect.value = false
  initLevel()
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
  padding-top: max(16px, env(safe-area-inset-top));
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
    background: rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(10px);
    transition: background 0.2s ease;
  }

  .menu-button-active {
    background: rgba(255, 255, 255, 0.15) !important;
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
