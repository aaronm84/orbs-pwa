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
let projectiles = [] // For special orb projectiles

// Special orb types
const SPECIAL_TYPES = {
  NONE: 'none',
  BIG_EXPLOSION: 'bigExplosion', // Larger explosion radius
  SPIKE_BURST: 'spikeBurst', // 12 directional spikes
  RANDOM_SHOT: 'randomShot', // Single projectile in random direction
  MINI_ORBS: 'miniOrbs', // Spawns smaller bouncing orbs
  CHAIN_BOOST: 'chainBoost', // Subsequent chain explosions linger longer
  MAGNET: 'magnet', // Pulls nearby orbs towards it
}

// Special orb morphing state
let morphState = {
  specialOrbs: [], // Array of { orbId, morphTimer, flickerStart }
  nextMorphTimer: null, // Timer for next morph event
  maxSimultaneousSpecial: 2, // Maximum special orbs at once
  multiMorphChance: 0.08, // 8% chance to allow a second morph while one exists
}

// Chain boost state - when active, all explosions linger longer
let chainBoostActive = false

// Active magnet effects
let magnetEffects = [] // Array of { x, y, color, startTime, duration, range, strength }

// Level structures (walls/barriers that orbs bounce off and explosions can't pass through)
let structures = [] // Array of { x1, y1, x2, y2, thickness }
let filledRegions = [] // Array of polygon points for filled areas (for rendering and spawn exclusion)

// Structure layouts for different levels
// 'segments' are collision line segments [x1%, y1%, x2%, y2%]
// 'polygons' are filled regions for rendering and spawn exclusion [[x1%, y1%], [x2%, y2%], ...]
const LEVEL_STRUCTURES = {
  // Levels 1-14: No structures
  // Level 15: Opposing ledges from side walls - filled triangles
  15: {
    segments: [
      // Left wall ledge - collision edges (not the wall-touching edge)
      [0, 0.4, 0.12, 0.5],    // Top edge
      [0.12, 0.5, 0, 0.6],    // Bottom edge
      // Right wall ledge
      [1, 0.4, 0.88, 0.5],    // Top edge
      [0.88, 0.5, 1, 0.6],    // Bottom edge
    ],
    polygons: [
      // Left ledge triangle (filled)
      [[0, 0.4], [0.12, 0.5], [0, 0.6]],
      // Right ledge triangle (filled)
      [[1, 0.4], [0.88, 0.5], [1, 0.6]],
    ],
  },
  // Level 16: Side ledges + top and bottom ledges
  16: {
    segments: [
      // Left wall ledge
      [0, 0.4, 0.12, 0.5],
      [0.12, 0.5, 0, 0.6],
      // Right wall ledge
      [1, 0.4, 0.88, 0.5],
      [0.88, 0.5, 1, 0.6],
      // Top wall ledge
      [0.4, 0, 0.5, 0.12],
      [0.5, 0.12, 0.6, 0],
      // Bottom wall ledge
      [0.4, 1, 0.5, 0.88],
      [0.5, 0.88, 0.6, 1],
    ],
    polygons: [
      [[0, 0.4], [0.12, 0.5], [0, 0.6]],           // Left
      [[1, 0.4], [0.88, 0.5], [1, 0.6]],           // Right
      [[0.4, 0], [0.5, 0.12], [0.6, 0]],           // Top
      [[0.4, 1], [0.5, 0.88], [0.6, 1]],           // Bottom
    ],
  },
  // Level 17: Corner cutoffs - filled triangles in each corner
  17: {
    segments: [
      [0, 0.12, 0.22, 0],       // Top-left corner cutoff
      [0.78, 0, 1, 0.12],       // Top-right corner cutoff
      [0, 0.88, 0.22, 1],       // Bottom-left corner cutoff
      [0.78, 1, 1, 0.88],       // Bottom-right corner cutoff
    ],
    polygons: [
      [[0, 0], [0.22, 0], [0, 0.12]],             // Top-left corner
      [[0.78, 0], [1, 0], [1, 0.12]],             // Top-right corner
      [[0, 0.88], [0.22, 1], [0, 1]],             // Bottom-left corner
      [[1, 0.88], [1, 1], [0.78, 1]],             // Bottom-right corner
    ],
  },
  // Level 18: Combined - side ledges + top/bottom ledges + corner cutoffs
  18: {
    segments: [
      // Side ledges
      [0, 0.4, 0.12, 0.5],
      [0.12, 0.5, 0, 0.6],
      [1, 0.4, 0.88, 0.5],
      [0.88, 0.5, 1, 0.6],
      // Top/bottom ledges
      [0.4, 0, 0.5, 0.12],
      [0.5, 0.12, 0.6, 0],
      [0.4, 1, 0.5, 0.88],
      [0.5, 0.88, 0.6, 1],
      // Corner cutoffs
      [0, 0.12, 0.22, 0],
      [0.78, 0, 1, 0.12],
      [0, 0.88, 0.22, 1],
      [0.78, 1, 1, 0.88],
    ],
    polygons: [
      [[0, 0.4], [0.12, 0.5], [0, 0.6]],           // Left ledge
      [[1, 0.4], [0.88, 0.5], [1, 0.6]],           // Right ledge
      [[0.4, 0], [0.5, 0.12], [0.6, 0]],           // Top ledge
      [[0.4, 1], [0.5, 0.88], [0.6, 1]],           // Bottom ledge
      [[0, 0], [0.22, 0], [0, 0.12]],             // Top-left corner
      [[0.78, 0], [1, 0], [1, 0.12]],             // Top-right corner
      [[0, 0.88], [0.22, 1], [0, 1]],             // Bottom-left corner
      [[1, 0.88], [1, 1], [0.78, 1]],             // Bottom-right corner
    ],
  },
  // Level 19+: Placeholder - will be designed later
  19: {
    segments: [
      [0.2, 0.3, 0.4, 0.5],
      [0.8, 0.3, 0.6, 0.5],
    ],
    polygons: [],
  },
  20: {
    segments: [
      [0.45, 0.2, 0.45, 0.4],
      [0.55, 0.2, 0.55, 0.4],
      [0.45, 0.6, 0.45, 0.8],
      [0.55, 0.6, 0.55, 0.8],
      [0.45, 0.4, 0.55, 0.4],
      [0.45, 0.6, 0.55, 0.6],
    ],
    polygons: [],
  },
  21: {
    segments: [
      [0.15, 0.33, 0.4, 0.33],
      [0.6, 0.33, 0.85, 0.33],
      [0.15, 0.67, 0.4, 0.67],
      [0.6, 0.67, 0.85, 0.67],
    ],
    polygons: [],
  },
  22: {
    segments: [
      [0.5, 0.15, 0.5, 0.35],
      [0.25, 0.5, 0.4, 0.5],
      [0.6, 0.5, 0.75, 0.5],
      [0.5, 0.65, 0.5, 0.85],
    ],
    polygons: [],
  },
  23: {
    segments: [
      [0.2, 0.2, 0.35, 0.35],
      [0.8, 0.2, 0.65, 0.35],
      [0.2, 0.8, 0.35, 0.65],
      [0.8, 0.8, 0.65, 0.65],
    ],
    polygons: [],
  },
  24: {
    segments: [
      [0.3, 0.25, 0.3, 0.75],
      [0.7, 0.25, 0.7, 0.75],
      [0.3, 0.5, 0.45, 0.5],
      [0.55, 0.5, 0.7, 0.5],
    ],
    polygons: [],
  },
  25: {
    segments: [
      [0.5, 0.3, 0.3, 0.5],
      [0.5, 0.3, 0.7, 0.5],
      [0.5, 0.7, 0.3, 0.5],
      [0.5, 0.7, 0.7, 0.5],
    ],
    polygons: [],
  },
}

// Get structures for a level (cycles through patterns for levels beyond defined ones)
function getStructuresForLevel(level) {
  if (level < 15) return { segments: [], polygons: [] }

  // Direct lookup first
  if (LEVEL_STRUCTURES[level]) {
    return LEVEL_STRUCTURES[level]
  }

  // For levels beyond 25, cycle through patterns 15-25 with increasing complexity
  const patternKeys = Object.keys(LEVEL_STRUCTURES).map(Number).sort((a, b) => a - b)
  const cycleIndex = (level - 15) % patternKeys.length
  return LEVEL_STRUCTURES[patternKeys[cycleIndex]] || { segments: [], polygons: [] }
}

// Convert percentage-based structure to actual pixel coordinates
function buildStructures(level, canvasWidth, canvasHeight) {
  const structureData = getStructuresForLevel(level)
  const thickness = 6 // Wall thickness in pixels

  // Build collision segments
  const segments = (structureData.segments || []).map(([x1Pct, y1Pct, x2Pct, y2Pct]) => ({
    x1: x1Pct * canvasWidth,
    y1: y1Pct * canvasHeight,
    x2: x2Pct * canvasWidth,
    y2: y2Pct * canvasHeight,
    thickness,
  }))

  // Build filled polygons for rendering and spawn exclusion
  const polygons = (structureData.polygons || []).map((points) =>
    points.map(([xPct, yPct]) => ({
      x: xPct * canvasWidth,
      y: yPct * canvasHeight,
    }))
  )

  return { segments, polygons }
}

// Check if a point is inside a polygon using ray casting
function pointInPolygon(px, py, polygon) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y
    const xj = polygon[j].x, yj = polygon[j].y

    if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
      inside = !inside
    }
  }
  return inside
}

// Check if a point is inside any filled region
function pointInAnyFilledRegion(px, py, regions) {
  for (const polygon of regions) {
    if (pointInPolygon(px, py, polygon)) {
      return true
    }
  }
  return false
}

// Check if a point is too close to any structure segment
function pointTooCloseToStructures(px, py, structureList, minDistance) {
  for (const struct of structureList) {
    const closest = closestPointOnSegment(px, py, struct.x1, struct.y1, struct.x2, struct.y2)
    const dx = px - closest.x
    const dy = py - closest.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < minDistance) {
      return true
    }
  }
  return false
}

// === STRUCTURE COLLISION UTILITIES ===

// Get closest point on a line segment to a point
function closestPointOnSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const lengthSq = dx * dx + dy * dy

  if (lengthSq === 0) return { x: x1, y: y1 } // Segment is a point

  // Project point onto line, clamped to segment
  let t = ((px - x1) * dx + (py - y1) * dy) / lengthSq
  t = Math.max(0, Math.min(1, t))

  return {
    x: x1 + t * dx,
    y: y1 + t * dy,
  }
}

// Check if a circle collides with a line segment
function circleIntersectsSegment(cx, cy, radius, x1, y1, x2, y2) {
  const closest = closestPointOnSegment(cx, cy, x1, y1, x2, y2)
  const distX = cx - closest.x
  const distY = cy - closest.y
  const distance = Math.sqrt(distX * distX + distY * distY)

  return {
    collides: distance < radius,
    distance,
    closestX: closest.x,
    closestY: closest.y,
    normalX: distance > 0 ? distX / distance : 0,
    normalY: distance > 0 ? distY / distance : 1,
  }
}

// Reflect velocity off a surface normal
function reflectVelocity(vx, vy, normalX, normalY) {
  const dot = vx * normalX + vy * normalY
  return {
    vx: vx - 2 * dot * normalX,
    vy: vy - 2 * dot * normalY,
  }
}

// Check and resolve collision between two orbs (elastic collision)
function resolveOrbCollision(orb1, orb2) {
  const dx = orb2.x - orb1.x
  const dy = orb2.y - orb1.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  const minDist = orb1.radius + orb2.radius

  // Check if orbs are colliding
  if (distance < minDist && distance > 0) {
    // Normalize collision vector
    const nx = dx / distance
    const ny = dy / distance

    // Relative velocity
    const dvx = orb1.vx - orb2.vx
    const dvy = orb1.vy - orb2.vy

    // Relative velocity along collision normal
    const dvn = dvx * nx + dvy * ny

    // Only resolve if orbs are moving towards each other
    if (dvn > 0) {
      // For equal mass elastic collision, velocities are exchanged along normal
      // Using coefficient of restitution of 1.0 (perfectly elastic)
      const restitution = 0.95 // Slightly less than 1 for a more natural feel

      // Impulse magnitude
      const impulse = dvn * restitution

      // Apply impulse to both orbs (equal and opposite)
      orb1.vx -= impulse * nx
      orb1.vy -= impulse * ny
      orb2.vx += impulse * nx
      orb2.vy += impulse * ny
    }

    // Separate overlapping orbs to prevent sticking
    const overlap = minDist - distance
    const separationX = (overlap / 2 + 0.5) * nx
    const separationY = (overlap / 2 + 0.5) * ny

    orb1.x -= separationX
    orb1.y -= separationY
    orb2.x += separationX
    orb2.y += separationY

    return true // Collision occurred
  }

  return false // No collision
}

// Check if a line segment intersects with a structure (for explosion blocking)
function lineIntersectsSegment(ax, ay, bx, by, cx, cy, dx, dy) {
  // Returns true if line AB intersects line CD
  const denominator = (bx - ax) * (dy - cy) - (by - ay) * (dx - cx)
  if (Math.abs(denominator) < 0.0001) return false // Parallel lines

  const t = ((cx - ax) * (dy - cy) - (cy - ay) * (dx - cx)) / denominator
  const u = -((bx - ax) * (cy - ay) - (by - ay) * (cx - ax)) / denominator

  return t >= 0 && t <= 1 && u >= 0 && u <= 1
}

// Check if explosion at (ex, ey) can reach point (px, py) without hitting structures
function explosionCanReach(ex, ey, px, py, structureList) {
  for (const struct of structureList) {
    if (lineIntersectsSegment(ex, ey, px, py, struct.x1, struct.y1, struct.x2, struct.y2)) {
      return false
    }
  }
  return true
}

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

  // Special orbs start at level 10
  const specialOrbsEnabled = level >= 10

  // Morph timing scales with difficulty (less frequent at higher levels)
  // Base: 8-15 seconds between morphs at level 10, scaling to 12-20 seconds at level 20+
  const difficultyScale = Math.min((level - 10) / 10, 1) // 0 at level 10, 1 at level 20+
  const morphIntervalMin = 8000 + difficultyScale * 4000 // 8s to 12s
  const morphIntervalMax = 15000 + difficultyScale * 5000 // 15s to 20s

  // Morph duration is random between 5-7 seconds
  const morphDuration = 5000 + Math.random() * 2000

  // Multi-morph chance increases after level 15
  // Level 10-14: 8% chance for second morph
  // Level 15-19: 15-25% chance (scales up)
  // Level 20+: 30% chance
  let multiMorphChance = 0.08
  if (level >= 20) {
    multiMorphChance = 0.30
  } else if (level >= 15) {
    multiMorphChance = 0.15 + (level - 15) * 0.03 // 15% at level 15, up to 27% at level 19
  }

  // Structures start at level 15
  const hasStructures = level >= 15

  // Calculate orb count
  let totalOrbs = 5 + (level - 1) * 5
  if (hasStructures) {
    // Level 15 starts at 35 orbs, can be customized per level
    // Orb counts for structure levels are more controlled
    const structureLevelOrbs = {
      15: 35,
      16: 38,
      17: 40,
      18: 42,
      // Other levels will be defined as we design them
    }
    if (structureLevelOrbs[level]) {
      totalOrbs = structureLevelOrbs[level]
    } else {
      // Default: cap at 40, then slowly increase after level 20
      totalOrbs = Math.min(40, totalOrbs) + Math.max(0, level - 20) * 2
      totalOrbs = Math.min(totalOrbs, 60) // Hard cap at 60
    }
  }

  // Calculate goal percentage - lower for structure levels since positioning matters more
  let goalPercent = 0.35 + level * 0.025
  if (hasStructures) {
    // Reduce goal requirement for structure levels (structures make it harder)
    goalPercent = Math.min(goalPercent, 0.55) // Cap at 55% for structure levels
  }

  const goal = Math.ceil(totalOrbs * goalPercent)

  return {
    level: currentLevel.value,
    totalOrbs,
    goal,
    hasStructures,
    orbSpeed: 1.5 + currentLevel.value * 0.1, // Speed increases more noticeably
    orbRadius: 8,
    explosionMaxRadius: baseRadius,
    explosionGrowthRate: 2.5,
    clicksAllowed: 1,
    // Special orb config
    specialOrbsEnabled,
    morphIntervalMin,
    morphIntervalMax,
    morphDuration, // 5-7 seconds
    multiMorphChance, // Chance for multiple simultaneous morphs
    flickerWarningTime: 1000, // Start flickering 1s before morph ends
    bigExplosionMultiplier: 2.5, // 2.5x larger explosion
    bigExplosionLingerMultiplier: 3, // 3x slower fade (lingers much longer)
    spikeCount: 12, // 12 directions like a clock
    spikeRange: baseRadius * 5, // 5x explosion radius
    spikeSpeed: 15, // Fast moving spikes
    randomShotSpeed: 12, // Slightly slower for visibility
    miniOrbCount: 8, // Number of mini orbs to spawn
    miniOrbDuration: 2000, // 2 seconds before mini orbs expire
    chainBoostLingerMultiplier: 2, // 2x longer explosions during chain boost
    magnetPullStrength: 0.5, // Base pull strength for magnet
    magnetRange: baseRadius * 4, // How far the magnet effect reaches
    magnetDuration: 4500, // How long the magnet effect lasts (ms)
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
  stopMorphSystem()
  window.removeEventListener('resize', handleResize)
  audio.cleanup()
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
  stopMorphSystem()

  // Reset state completely
  orbs = []
  explosions = []
  projectiles = []
  capturedCount.value = 0
  clicksRemaining.value = levelConfig.value.clicksAllowed
  gameStarted.value = false
  gameEnded.value = false // Reset the game ended flag
  showTapHint.value = true

  // Reset morph state
  morphState.specialOrbs = []
  chainBoostActive = false
  magnetEffects = []

  // Build level structures
  const canvas = gameCanvas.value
  if (canvas) {
    const built = buildStructures(currentLevel.value, canvas.width, canvas.height)
    structures = built.segments
    filledRegions = built.polygons
  } else {
    structures = []
    filledRegions = []
  }

  // Reset bell sequence for musical chimes
  audio.resetBellSequence()

  // Fade out tap hint after 2.5 seconds
  setTimeout(() => {
    showTapHint.value = false
  }, 2500)

  // Create orbs
  const config = levelConfig.value

  for (let i = 0; i < config.totalOrbs; i++) {
    orbs.push(createOrb(i, config))
  }

  // Start game loop
  isPlaying.value = true
  gameLoop()

  // Start special orb morphing system (level 10+)
  startMorphSystem()
}

function createOrb(index, config) {
  const canvas = gameCanvas.value

  // Add margin to keep orbs away from edges
  const margin = config.orbRadius * 3

  // Minimum distance from structure edges (orb radius + buffer)
  const structureBuffer = config.orbRadius * 2

  // Find a valid spawn position (not inside filled regions and not too close to structures)
  let x, y
  let attempts = 0
  const maxAttempts = 100

  do {
    x = Math.random() * (canvas.width - margin * 2) + margin
    y = Math.random() * (canvas.height - margin * 2) + margin
    attempts++
  } while (
    (pointInAnyFilledRegion(x, y, filledRegions) ||
     pointTooCloseToStructures(x, y, structures, structureBuffer)) &&
    attempts < maxAttempts
  )

  return {
    id: `orb-${index}-${Date.now()}`,
    x,
    y,
    vx: (Math.random() - 0.5) * config.orbSpeed * 2,
    vy: (Math.random() - 0.5) * config.orbSpeed * 2,
    radius: config.orbRadius,
    color: orbColors[index % orbColors.length],
    captured: false,
    // Special orb properties
    specialType: SPECIAL_TYPES.NONE,
    morphStartTime: null, // When the orb morphed into special
    shotAngle: Math.random() * Math.PI * 2, // Pre-determined shot direction for RANDOM_SHOT
    isMiniOrb: false, // Flag for mini orbs spawned by MINI_ORBS type
    expiresAt: null, // When mini orbs should expire
  }
}

// === SPECIAL ORB MORPHING SYSTEM ===

function startMorphSystem() {
  const config = levelConfig.value
  if (!config.specialOrbsEnabled) return

  // Start morphing quickly (1-3 seconds after level starts)
  const initialDelay = 1000 + Math.random() * 2000
  morphState.nextMorphTimer = setTimeout(() => {
    morphRandomOrb()
  }, initialDelay)
}

function stopMorphSystem() {
  // Clear next morph timer
  if (morphState.nextMorphTimer) {
    clearTimeout(morphState.nextMorphTimer)
    morphState.nextMorphTimer = null
  }

  // Clear all special orb timers and revert them
  morphState.specialOrbs.forEach((special) => {
    if (special.morphTimer) {
      clearTimeout(special.morphTimer)
    }
    const orb = orbs.find((o) => o.id === special.orbId)
    if (orb) {
      orb.specialType = SPECIAL_TYPES.NONE
      orb.morphStartTime = null
    }
  })
  morphState.specialOrbs = []
}

function scheduleNextMorph() {
  const config = levelConfig.value
  if (!config.specialOrbsEnabled || !isPlaying.value) return

  // Random delay before next morph
  const delay =
    config.morphIntervalMin + Math.random() * (config.morphIntervalMax - config.morphIntervalMin)

  morphState.nextMorphTimer = setTimeout(() => {
    morphRandomOrb()
  }, delay)
}

function morphRandomOrb() {
  const config = levelConfig.value
  if (!isPlaying.value || gameEnded.value) return

  // Check if we already have max special orbs
  if (morphState.specialOrbs.length >= morphState.maxSimultaneousSpecial) {
    scheduleNextMorph()
    return
  }

  // If we already have a special orb, only allow another with level-scaled chance
  if (morphState.specialOrbs.length > 0 && Math.random() > config.multiMorphChance) {
    scheduleNextMorph()
    return
  }

  // Get uncaptured orbs that aren't already special
  const availableOrbs = orbs.filter((o) => !o.captured && o.specialType === SPECIAL_TYPES.NONE)
  if (availableOrbs.length === 0) {
    // No orbs available, try again later
    scheduleNextMorph()
    return
  }

  // Pick a random orb
  const orb = availableOrbs[Math.floor(Math.random() * availableOrbs.length)]

  // Pick a random special type
  const specialTypes = [
    SPECIAL_TYPES.BIG_EXPLOSION,
    SPECIAL_TYPES.SPIKE_BURST,
    SPECIAL_TYPES.RANDOM_SHOT,
    SPECIAL_TYPES.MINI_ORBS,
    SPECIAL_TYPES.CHAIN_BOOST,
    SPECIAL_TYPES.MAGNET,
  ]
  orb.specialType = specialTypes[Math.floor(Math.random() * specialTypes.length)]
  orb.morphStartTime = Date.now()

  const flickerStart = Date.now() + config.morphDuration - config.flickerWarningTime

  // Schedule revert back to normal
  const morphTimer = setTimeout(() => {
    revertSpecialOrb(orb.id)
  }, config.morphDuration)

  // Track this special orb
  morphState.specialOrbs.push({
    orbId: orb.id,
    morphTimer,
    flickerStart,
  })

  // Schedule next morph
  scheduleNextMorph()
}

function revertSpecialOrb(orbId) {
  const orb = orbs.find((o) => o.id === orbId)
  if (orb && !orb.captured) {
    orb.specialType = SPECIAL_TYPES.NONE
    orb.morphStartTime = null
  }

  // Remove from special orbs tracking
  const specialIndex = morphState.specialOrbs.findIndex((s) => s.orbId === orbId)
  if (specialIndex !== -1) {
    morphState.specialOrbs.splice(specialIndex, 1)
  }
}

// === PROJECTILE CREATION ===

function createSpikeBurst(x, y, color) {
  const config = levelConfig.value

  // Create 12 spikes in clock directions - they stop after traveling a set distance
  for (let i = 0; i < config.spikeCount; i++) {
    const angle = (i / config.spikeCount) * Math.PI * 2 - Math.PI / 2 // Start at 12 o'clock
    projectiles.push({
      id: `spike-${Date.now()}-${i}`,
      type: 'spike',
      x,
      y,
      startX: x,
      startY: y,
      vx: Math.cos(angle) * config.spikeSpeed,
      vy: Math.sin(angle) * config.spikeSpeed,
      maxDistance: config.spikeRange,
      color,
      alpha: 1,
      trail: [], // For visual trail effect
    })
  }
}

function createRandomShot(x, y, color, angle) {
  const config = levelConfig.value

  projectiles.push({
    id: `shot-${Date.now()}`,
    type: 'randomShot',
    x,
    y,
    startX: x,
    startY: y,
    vx: Math.cos(angle) * config.randomShotSpeed,
    vy: Math.sin(angle) * config.randomShotSpeed,
    maxDistance: Infinity, // Travels until hitting orb or wall
    color,
    alpha: 1,
    trail: [], // For comet tail effect
  })
}

function createMiniOrbs(x, y, color) {
  const config = levelConfig.value
  const now = Date.now()

  // Create mini orbs that bounce around until they trigger other orbs
  for (let i = 0; i < config.miniOrbCount; i++) {
    const angle = (i / config.miniOrbCount) * Math.PI * 2 + Math.random() * 0.5
    const speed = config.orbSpeed * 1.5 // Slightly faster than normal orbs

    orbs.push({
      id: `mini-orb-${now}-${i}`,
      x: x + Math.cos(angle) * 15,
      y: y + Math.sin(angle) * 15,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: config.orbRadius * 0.6, // Smaller than normal
      color: color,
      captured: false,
      specialType: SPECIAL_TYPES.NONE,
      morphStartTime: null,
      shotAngle: 0,
      isMiniOrb: true,
      expiresAt: null, // No expiration - bounce until they trigger orbs
    })
  }
}

function createMagnetEffect(x, y, color) {
  const config = levelConfig.value
  const now = Date.now()

  magnetEffects.push({
    x,
    y,
    color,
    startTime: now,
    duration: config.magnetDuration,
    range: config.magnetRange,
    strength: config.magnetPullStrength,
    // Center stays active until no orbs absorbed for this time after pull ends
    centerActiveTimeout: 1500, // 1.5 seconds
    lastAbsorptionTime: now,
    pullActive: true, // Pull phase is active
  })
}

function activateChainBoost() {
  chainBoostActive = true
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

function createExplosion(x, y, color = '#ffffff', radiusMultiplier = 1, lingerMultiplier = 1) {
  const config = levelConfig.value

  // Apply chain boost if active
  let effectiveLingerMultiplier = lingerMultiplier
  if (chainBoostActive) {
    effectiveLingerMultiplier *= config.chainBoostLingerMultiplier
  }

  explosions.push({
    id: `explosion-${Date.now()}-${Math.random()}`,
    x,
    y,
    radius: 0,
    maxRadius: config.explosionMaxRadius * radiusMultiplier,
    growthRate: config.explosionGrowthRate * (radiusMultiplier > 1 ? 1.2 : 1), // Slightly faster growth for big explosions
    active: true,
    alpha: 1,
    color: color,
    isBigExplosion: radiusMultiplier > 1, // Track for special rendering
    fadeRate: 0.05 / effectiveLingerMultiplier, // Slower fade for lingering explosions
    isChainBoosted: chainBoostActive, // Track for visual effect
  })
}

function gameLoop() {
  if (!isPlaying.value) return

  update()
  render()

  animationId = requestAnimationFrame(gameLoop)
}

// === ORB CAPTURE WITH SPECIAL ABILITIES ===

// triggerSource: 'explosion' (default), 'spike', 'randomShot', 'miniOrb', 'magnet'
function captureOrb(orb, triggerSource = 'explosion') {
  if (orb.captured) return

  const config = levelConfig.value

  // Projectile/miniOrb/magnet-triggered orbs get extra linger time so they can trigger more orbs
  const projectileLingerBonus = (triggerSource === 'spike' || triggerSource === 'randomShot' || triggerSource === 'miniOrb' || triggerSource === 'magnet') ? 1.5 : 1

  orb.captured = true
  capturedCount.value++
  haptics.light()
  audio.playCapture()

  // Clear morph state if this was a special orb
  const specialIndex = morphState.specialOrbs.findIndex((s) => s.orbId === orb.id)
  if (specialIndex !== -1) {
    const special = morphState.specialOrbs[specialIndex]
    if (special.morphTimer) {
      clearTimeout(special.morphTimer)
    }
    morphState.specialOrbs.splice(specialIndex, 1)
  }

  // Handle special orb abilities
  switch (orb.specialType) {
    case SPECIAL_TYPES.BIG_EXPLOSION:
      // Create a larger explosion that lingers longer
      createExplosion(orb.x, orb.y, orb.color, config.bigExplosionMultiplier, config.bigExplosionLingerMultiplier * projectileLingerBonus)
      haptics.medium() // Extra feedback for special
      break

    case SPECIAL_TYPES.SPIKE_BURST:
      // Create normal explosion + 12 directional spikes
      createExplosion(orb.x, orb.y, orb.color, 1, projectileLingerBonus)
      createSpikeBurst(orb.x, orb.y, orb.color)
      haptics.medium()
      break

    case SPECIAL_TYPES.RANDOM_SHOT:
      // Create normal explosion + directional projectile (uses pre-determined angle)
      createExplosion(orb.x, orb.y, orb.color, 1, projectileLingerBonus)
      createRandomShot(orb.x, orb.y, orb.color, orb.shotAngle)
      haptics.medium()
      break

    case SPECIAL_TYPES.MINI_ORBS:
      // Create normal explosion + spawn mini bouncing orbs
      createExplosion(orb.x, orb.y, orb.color, 1, projectileLingerBonus)
      createMiniOrbs(orb.x, orb.y, orb.color)
      haptics.medium()
      break

    case SPECIAL_TYPES.CHAIN_BOOST:
      // Activate chain boost - all subsequent explosions linger longer
      activateChainBoost()
      createExplosion(orb.x, orb.y, orb.color, 1, projectileLingerBonus)
      haptics.medium()
      break

    case SPECIAL_TYPES.MAGNET:
      // Create normal explosion + magnet effect that pulls orbs
      createExplosion(orb.x, orb.y, orb.color, 1, projectileLingerBonus)
      createMagnetEffect(orb.x, orb.y, orb.color)
      haptics.medium()
      break

    default:
      // Normal orb - just create explosion with projectile linger bonus if applicable
      createExplosion(orb.x, orb.y, orb.color, 1, projectileLingerBonus)
  }
}

function update() {
  const canvas = gameCanvas.value
  const now = Date.now()

  // Update magnet effects - handle pull phase and center-only phase
  magnetEffects.forEach((magnet) => {
    const elapsed = now - magnet.startTime

    // Check if pull phase has ended
    if (elapsed >= magnet.duration && magnet.pullActive) {
      magnet.pullActive = false
    }
  })

  // Remove magnets that have no pull AND center has been inactive for timeout period
  magnetEffects = magnetEffects.filter((magnet) => {
    if (magnet.pullActive) return true // Still in pull phase
    // In center-only phase - keep active until no absorption for centerActiveTimeout
    return (now - magnet.lastAbsorptionTime) < magnet.centerActiveTimeout
  })

  // Update orbs
  orbs.forEach((orb) => {
    if (orb.captured) return

    // Check if mini orb has expired
    if (orb.isMiniOrb && orb.expiresAt && now >= orb.expiresAt) {
      orb.captured = true // Mark as captured so it's removed
      return
    }

    // Apply magnet pull effects
    magnetEffects.forEach((magnet) => {
      const dx = magnet.x - orb.x
      const dy = magnet.y - orb.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      // Check if orb reached the center - trigger capture/explosion
      // Center is active during both pull phase and center-only phase
      const captureRadius = 15 // Orbs within this distance get captured
      if (distance < captureRadius) {
        captureOrb(orb, 'magnet')
        // Update last absorption time to keep center active
        magnet.lastAbsorptionTime = now
        return
      }

      // Only apply pull if in pull phase
      if (magnet.pullActive && distance < magnet.range) {
        // Calculate pull strength - stronger when closer (inverse square with cap)
        const normalizedDist = distance / magnet.range
        const pullIntensity = magnet.strength * (1 - normalizedDist) * (1 - normalizedDist)

        // Apply pull towards magnet center
        const pullX = (dx / distance) * pullIntensity
        const pullY = (dy / distance) * pullIntensity

        orb.vx += pullX
        orb.vy += pullY
      }
    })

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

    // Bounce off structures
    for (const struct of structures) {
      const collision = circleIntersectsSegment(
        orb.x, orb.y, orb.radius,
        struct.x1, struct.y1, struct.x2, struct.y2
      )

      if (collision.collides) {
        // Reflect velocity off the structure
        const reflected = reflectVelocity(orb.vx, orb.vy, collision.normalX, collision.normalY)
        orb.vx = reflected.vx
        orb.vy = reflected.vy

        // Push orb out of the structure
        const overlap = orb.radius - collision.distance
        orb.x += collision.normalX * (overlap + 1)
        orb.y += collision.normalY * (overlap + 1)
      }
    }

    // Mini orbs can trigger other orbs on collision
    if (orb.isMiniOrb && !orb.captured) {
      orbs.forEach((targetOrb) => {
        if (targetOrb.captured || targetOrb.isMiniOrb || targetOrb.id === orb.id) return

        const dx = targetOrb.x - orb.x
        const dy = targetOrb.y - orb.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < orb.radius + targetOrb.radius) {
          // Mini orb triggers the target orb with linger bonus
          captureOrb(targetOrb, 'miniOrb')
          // Mini orb is also consumed
          orb.captured = true
        }
      })
    }
  })

  // === ORB-TO-ORB COLLISION DETECTION ===
  // Check all pairs of orbs for collisions and resolve them
  for (let i = 0; i < orbs.length; i++) {
    const orb1 = orbs[i]
    if (orb1.captured) continue

    for (let j = i + 1; j < orbs.length; j++) {
      const orb2 = orbs[j]
      if (orb2.captured) continue

      // Skip mini orb vs mini orb collisions (they pass through each other)
      if (orb1.isMiniOrb && orb2.isMiniOrb) continue

      resolveOrbCollision(orb1, orb2)
    }
  }

  // Update explosions
  explosions.forEach((explosion) => {
    if (explosion.active) {
      // Grow explosion
      explosion.radius += explosion.growthRate

      // Check if explosion has reached max size
      if (explosion.radius >= explosion.maxRadius) {
        explosion.active = false
      }
    } else {
      // Fade out
      explosion.alpha = Math.max(0, explosion.alpha - (explosion.fadeRate || 0.05))
    }

    // Check collision with orbs - EVEN while fading (as long as visible)
    // This allows orbs to be triggered by explosions that are still visible
    if (explosion.alpha > 0.1) {
      orbs.forEach((orb) => {
        if (orb.captured) return

        const dx = orb.x - explosion.x
        const dy = orb.y - explosion.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < explosion.radius + orb.radius) {
          // Check if a structure blocks the explosion from reaching this orb
          if (explosionCanReach(explosion.x, explosion.y, orb.x, orb.y, structures)) {
            captureOrb(orb)
          }
        }
      })
    }
  })

  // Remove fully faded explosions
  explosions = explosions.filter((e) => e.active || e.alpha > 0)

  // Remove expired magnet effects
  magnetEffects = magnetEffects.filter((m) => now - m.startTime < m.duration)

  // === UPDATE PROJECTILES ===
  projectiles.forEach((proj) => {
    if (proj.alpha <= 0) return

    // Store trail position
    proj.trail.unshift({ x: proj.x, y: proj.y, alpha: 1 })
    if (proj.trail.length > 8) proj.trail.pop()

    // Fade trail
    proj.trail.forEach((t, i) => {
      t.alpha = 1 - i / proj.trail.length
    })

    // Move projectile
    proj.x += proj.vx
    proj.y += proj.vy

    // Check wall collision - all projectiles end at walls
    if (proj.x < 0 || proj.x > canvas.width || proj.y < 0 || proj.y > canvas.height) {
      proj.alpha = 0
      return
    }

    // Check structure collision - projectiles end at structures
    for (const struct of structures) {
      const collision = circleIntersectsSegment(
        proj.x, proj.y, 4, // 4px projectile radius
        struct.x1, struct.y1, struct.x2, struct.y2
      )
      if (collision.collides) {
        proj.alpha = 0
        return
      }
    }

    // Spikes have max distance limit
    if (proj.type === 'spike' && proj.maxDistance) {
      const distX = proj.x - proj.startX
      const distY = proj.y - proj.startY
      const distTraveled = Math.sqrt(distX * distX + distY * distY)
      if (distTraveled >= proj.maxDistance) {
        proj.alpha = 0
        return
      }
    }

    // Check collision with orbs
    orbs.forEach((orb) => {
      if (orb.captured || proj.alpha <= 0) return

      const dx = orb.x - proj.x
      const dy = orb.y - proj.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance < orb.radius + 4) {
        // 4px projectile collision radius
        // Pass trigger source for linger bonus
        captureOrb(orb, proj.type) // 'spike' or 'randomShot'
        // Spikes stop on first orb hit
        if (proj.type === 'spike') {
          proj.alpha = 0
        }
        // Random shot cuts through - continues until hitting a wall
      }
    })
  })

  // Remove dead projectiles
  projectiles = projectiles.filter((p) => p.alpha > 0)

  // Check win/lose conditions (only once)
  // Must wait for ALL chain reaction elements to complete:
  // - No active explosions (still growing or fading)
  // - No projectiles in flight
  // - No active magnet effects (can still pull and capture orbs)
  // - No mini orbs still bouncing (can trigger other orbs)
  const hasActiveExplosions = explosions.length > 0
  const hasActiveProjectiles = projectiles.length > 0
  const hasActiveMagnets = magnetEffects.length > 0
  const hasActiveMiniOrbs = orbs.some((o) => o.isMiniOrb && !o.captured)

  const allChainReactionsComplete =
    !hasActiveExplosions && !hasActiveProjectiles && !hasActiveMagnets && !hasActiveMiniOrbs

  if (gameStarted.value && !gameEnded.value && allChainReactionsComplete) {
    checkGameEnd()
  }
}

// Helper function to convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 255, g: 255, b: 255 }
}

function render() {
  if (!ctx) return

  const canvas = gameCanvas.value
  const now = Date.now()

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // === DRAW STRUCTURES ===
  // Draw filled polygons first (the solid regions)
  if (filledRegions.length > 0) {
    filledRegions.forEach((polygon) => {
      if (polygon.length < 3) return

      // Filled region with gradient
      ctx.beginPath()
      ctx.moveTo(polygon[0].x, polygon[0].y)
      for (let i = 1; i < polygon.length; i++) {
        ctx.lineTo(polygon[i].x, polygon[i].y)
      }
      ctx.closePath()

      // Semi-transparent fill matching the background theme
      ctx.fillStyle = 'rgba(20, 20, 40, 0.85)'
      ctx.fill()

      // Subtle inner glow
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.lineWidth = 2
      ctx.stroke()
    })
  }

  // Draw collision edge lines (the visible edges that orbs bounce off)
  if (structures.length > 0) {
    ctx.lineCap = 'round'

    structures.forEach((struct) => {
      // Outer glow
      ctx.beginPath()
      ctx.moveTo(struct.x1, struct.y1)
      ctx.lineTo(struct.x2, struct.y2)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
      ctx.lineWidth = struct.thickness + 6
      ctx.shadowBlur = 12
      ctx.shadowColor = 'rgba(255, 255, 255, 0.4)'
      ctx.stroke()

      // Main edge line
      ctx.beginPath()
      ctx.moveTo(struct.x1, struct.y1)
      ctx.lineTo(struct.x2, struct.y2)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
      ctx.lineWidth = struct.thickness
      ctx.shadowBlur = 0
      ctx.stroke()

      // Inner bright core
      ctx.beginPath()
      ctx.moveTo(struct.x1, struct.y1)
      ctx.lineTo(struct.x2, struct.y2)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)'
      ctx.lineWidth = struct.thickness * 0.4
      ctx.stroke()
    })

    ctx.lineCap = 'butt' // Reset
  }

  // Draw explosions with graceful, colored animations
  explosions.forEach((explosion) => {
    const rgb = hexToRgb(explosion.color)
    const growthProgress = explosion.radius / explosion.maxRadius

    // Extra glow for big explosions
    if (explosion.isBigExplosion) {
      ctx.beginPath()
      ctx.arc(explosion.x, explosion.y, explosion.radius * 1.1, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, 255, 255, ${explosion.alpha * 0.15})`
      ctx.fill()
    }

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
    ctx.lineWidth = explosion.isBigExplosion ? 4 : 3
    ctx.shadowBlur = explosion.isBigExplosion ? 25 : 15
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

  // === DRAW CHAIN BOOST INDICATOR ===
  if (chainBoostActive) {
    // Subtle golden shimmer at edges to indicate chain boost is active
    const shimmerPhase = (now % 2000) / 2000
    const shimmerAlpha = 0.1 + Math.sin(shimmerPhase * Math.PI * 2) * 0.05

    // Draw corner accents
    const cornerSize = 60
    ctx.strokeStyle = `rgba(255, 215, 0, ${shimmerAlpha})`
    ctx.lineWidth = 3
    ctx.shadowBlur = 10
    ctx.shadowColor = 'rgba(255, 215, 0, 0.5)'

    // Top-left corner
    ctx.beginPath()
    ctx.moveTo(0, cornerSize)
    ctx.lineTo(0, 0)
    ctx.lineTo(cornerSize, 0)
    ctx.stroke()

    // Top-right corner
    ctx.beginPath()
    ctx.moveTo(canvas.width - cornerSize, 0)
    ctx.lineTo(canvas.width, 0)
    ctx.lineTo(canvas.width, cornerSize)
    ctx.stroke()

    // Bottom-left corner
    ctx.beginPath()
    ctx.moveTo(0, canvas.height - cornerSize)
    ctx.lineTo(0, canvas.height)
    ctx.lineTo(cornerSize, canvas.height)
    ctx.stroke()

    // Bottom-right corner
    ctx.beginPath()
    ctx.moveTo(canvas.width - cornerSize, canvas.height)
    ctx.lineTo(canvas.width, canvas.height)
    ctx.lineTo(canvas.width, canvas.height - cornerSize)
    ctx.stroke()

    ctx.shadowBlur = 0
  }

  // === DRAW MAGNET EFFECTS ===
  magnetEffects.forEach((magnet) => {
    const elapsed = now - magnet.startTime

    // Only draw pull rings during pull phase
    if (magnet.pullActive) {
      const progress = Math.min(elapsed / magnet.duration, 1)
      const fadeAlpha = 1 - progress // Fade out over time

      // Draw concentric rings being pulled inward (visual representation of pull field)
      for (let i = 0; i < 4; i++) {
        const ringProgress = ((progress * 3 + i / 4) % 1)
        const ringRadius = magnet.range * (1 - ringProgress * 0.8)
        const ringAlpha = fadeAlpha * 0.4 * (1 - ringProgress)

        if (ringAlpha > 0.02 && ringRadius > 10) {
          ctx.beginPath()
          ctx.arc(magnet.x, magnet.y, ringRadius, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(150, 200, 255, ${ringAlpha})`
          ctx.lineWidth = 2
          ctx.stroke()
        }
      }
    }

    // Draw central glow - always visible while magnet is active (pull or center-only phase)
    // Pulse faster in center-only phase to indicate it's still active
    const pulseSpeed = magnet.pullActive ? 100 : 50
    const glowRadius = magnet.pullActive ? (20 + Math.sin(elapsed / pulseSpeed) * 5) : (15 + Math.sin(elapsed / pulseSpeed) * 8)

    // Center glow is brighter/different color in center-only phase
    const centerAlpha = magnet.pullActive ? 0.5 : 0.7
    const centerColor = magnet.pullActive ? '150, 200, 255' : '200, 150, 255' // Purple tint when center-only

    const gradient = ctx.createRadialGradient(magnet.x, magnet.y, 0, magnet.x, magnet.y, glowRadius)
    gradient.addColorStop(0, `rgba(${centerColor}, ${centerAlpha})`)
    gradient.addColorStop(1, `rgba(${centerColor}, 0)`)
    ctx.beginPath()
    ctx.arc(magnet.x, magnet.y, glowRadius, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()
  })

  // === DRAW PROJECTILES ===
  projectiles.forEach((proj) => {
    if (proj.alpha <= 0) return

    const rgb = hexToRgb(proj.color)

    // Draw trail (comet tail effect)
    proj.trail.forEach((t, i) => {
      const trailAlpha = t.alpha * proj.alpha * 0.6
      const trailSize = proj.type === 'randomShot' ? 4 - i * 0.4 : 3 - i * 0.3
      if (trailSize > 0) {
        ctx.beginPath()
        ctx.arc(t.x, t.y, trailSize, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${trailAlpha})`
        ctx.fill()
      }
    })

    // Draw projectile head
    ctx.beginPath()
    const headSize = proj.type === 'randomShot' ? 5 : 4
    ctx.arc(proj.x, proj.y, headSize, 0, Math.PI * 2)
    ctx.shadowBlur = 10
    ctx.shadowColor = proj.color
    ctx.fillStyle = proj.color
    ctx.fill()

    // Bright center
    ctx.shadowBlur = 0
    ctx.beginPath()
    ctx.arc(proj.x, proj.y, headSize * 0.5, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.fill()
  })

  // === DRAW ORBS ===
  orbs.forEach((orb) => {
    if (orb.captured) return

    const isSpecial = orb.specialType !== SPECIAL_TYPES.NONE

    // Handle mini orb fade-out as they approach expiration
    let miniOrbAlpha = 1
    if (orb.isMiniOrb && orb.expiresAt) {
      const timeLeft = orb.expiresAt - now
      const config = levelConfig.value
      // Start fading in the last 500ms
      if (timeLeft < 500) {
        miniOrbAlpha = Math.max(0.2, timeLeft / 500)
      }
      // Flicker rapidly in the last 300ms
      if (timeLeft < 300) {
        miniOrbAlpha *= Math.floor((now / 50) % 2) === 0 ? 1 : 0.5
      }
      ctx.globalAlpha = miniOrbAlpha
    }

    // Check if flickering (warning before morph ends)
    let shouldFlicker = false
    if (isSpecial) {
      const specialState = morphState.specialOrbs.find((s) => s.orbId === orb.id)
      if (specialState && specialState.flickerStart && now >= specialState.flickerStart) {
        // Flicker at ~10Hz
        shouldFlicker = Math.floor((now - specialState.flickerStart) / 50) % 2 === 0
      }
    }

    // Skip drawing on flicker-off frames
    if (shouldFlicker) {
      // Draw dimmed version during flicker
      ctx.globalAlpha = 0.3
    }

    // Special orb enhanced glow
    if (isSpecial) {
      // Outer pulsing glow
      const pulsePhase = (now % 1000) / 1000
      const pulseScale = 1 + Math.sin(pulsePhase * Math.PI * 2) * 0.2

      ctx.beginPath()
      ctx.arc(orb.x, orb.y, orb.radius * 2 * pulseScale, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, 255, 255, 0.15)`
      ctx.fill()

      ctx.beginPath()
      ctx.arc(orb.x, orb.y, orb.radius * 1.5 * pulseScale, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, 255, 255, 0.2)`
      ctx.fill()
    }

    // Main orb
    ctx.beginPath()
    ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2)

    // Enhanced glow for special orbs, extra sparkle for mini orbs
    ctx.shadowBlur = isSpecial ? 30 : (orb.isMiniOrb ? 20 : 15)
    ctx.shadowColor = isSpecial ? '#ffffff' : orb.color
    ctx.fillStyle = orb.color
    ctx.fill()

    // Inner highlight for depth
    ctx.shadowBlur = 0
    ctx.beginPath()
    ctx.arc(orb.x - orb.radius * 0.3, orb.y - orb.radius * 0.3, orb.radius * 0.4, 0, Math.PI * 2)
    ctx.fillStyle = isSpecial ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.4)'
    ctx.fill()

    // Draw special orb indicator
    if (isSpecial) {
      ctx.globalAlpha = 1 // Reset for indicator

      switch (orb.specialType) {
        case SPECIAL_TYPES.BIG_EXPLOSION:
          // Draw expanding rings indicator
          const ringPhase = (now % 800) / 800
          ctx.beginPath()
          ctx.arc(orb.x, orb.y, orb.radius * (1.3 + ringPhase * 0.5), 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 * (1 - ringPhase)})`
          ctx.lineWidth = 2
          ctx.stroke()
          break

        case SPECIAL_TYPES.SPIKE_BURST:
          // Draw star/rays indicator
          for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2 - Math.PI / 2
            const rayLength = orb.radius * 1.8
            const innerRadius = orb.radius * 1.2
            ctx.beginPath()
            ctx.moveTo(orb.x + Math.cos(angle) * innerRadius, orb.y + Math.sin(angle) * innerRadius)
            ctx.lineTo(orb.x + Math.cos(angle) * rayLength, orb.y + Math.sin(angle) * rayLength)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
            ctx.lineWidth = 1.5
            ctx.stroke()
          }
          break

        case SPECIAL_TYPES.RANDOM_SHOT:
          // Draw single rotating arrow pointing in shot direction
          // Arrow rotates as orb moves (based on velocity direction)
          const moveAngle = Math.atan2(orb.vy, orb.vx)
          const displayAngle = orb.shotAngle + moveAngle * 0.3 // Subtle rotation based on movement

          const arrowDist = orb.radius * 1.8
          const arrowTipX = orb.x + Math.cos(displayAngle) * arrowDist
          const arrowTipY = orb.y + Math.sin(displayAngle) * arrowDist
          const perpAngle = displayAngle + Math.PI / 2
          const baseOffset = 5

          // Pulsing effect
          const arrowPulse = 0.6 + Math.sin((now % 500) / 500 * Math.PI * 2) * 0.3

          ctx.beginPath()
          ctx.moveTo(
            arrowTipX - Math.cos(displayAngle) * 10 + Math.cos(perpAngle) * baseOffset,
            arrowTipY - Math.sin(displayAngle) * 10 + Math.sin(perpAngle) * baseOffset,
          )
          ctx.lineTo(arrowTipX, arrowTipY)
          ctx.lineTo(
            arrowTipX - Math.cos(displayAngle) * 10 - Math.cos(perpAngle) * baseOffset,
            arrowTipY - Math.sin(displayAngle) * 10 - Math.sin(perpAngle) * baseOffset,
          )
          ctx.strokeStyle = `rgba(255, 255, 255, ${arrowPulse})`
          ctx.lineWidth = 2.5
          ctx.stroke()
          break

        case SPECIAL_TYPES.MINI_ORBS:
          // Draw small orbiting circles to indicate mini orbs will spawn
          const orbitPhase = (now % 1200) / 1200
          for (let i = 0; i < 4; i++) {
            const orbitAngle = orbitPhase * Math.PI * 2 + (i / 4) * Math.PI * 2
            const orbitDist = orb.radius * 1.6
            const miniX = orb.x + Math.cos(orbitAngle) * orbitDist
            const miniY = orb.y + Math.sin(orbitAngle) * orbitDist

            ctx.beginPath()
            ctx.arc(miniX, miniY, 3, 0, Math.PI * 2)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
            ctx.fill()
          }
          break

        case SPECIAL_TYPES.CHAIN_BOOST:
          // Draw chain/infinity symbol with energy waves
          const boostPhase = (now % 1000) / 1000
          const wavePhase = (now % 600) / 600

          // Draw infinity/chain symbol (two interlocking loops)
          const loopRadius = orb.radius * 0.5
          const loopOffset = orb.radius * 0.4
          ctx.strokeStyle = 'rgba(255, 215, 0, 0.9)'
          ctx.lineWidth = 2.5
          ctx.shadowBlur = 8
          ctx.shadowColor = 'rgba(255, 215, 0, 0.6)'

          // Left loop
          ctx.beginPath()
          ctx.arc(orb.x - loopOffset, orb.y, loopRadius, 0, Math.PI * 2)
          ctx.stroke()

          // Right loop
          ctx.beginPath()
          ctx.arc(orb.x + loopOffset, orb.y, loopRadius, 0, Math.PI * 2)
          ctx.stroke()

          ctx.shadowBlur = 0

          // Energy particles traveling along the infinity path
          for (let p = 0; p < 3; p++) {
            const particlePhase = (wavePhase + p / 3) % 1
            const angle = particlePhase * Math.PI * 2
            // Figure-8 path
            const px = orb.x + Math.sin(angle) * loopOffset * 1.2
            const py = orb.y + Math.sin(angle * 2) * loopRadius * 0.6

            ctx.beginPath()
            ctx.arc(px, py, 2.5, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(255, 255, 255, ${0.8 - particlePhase * 0.3})`
            ctx.fill()
          }

          // Outer golden glow ring
          ctx.beginPath()
          ctx.arc(orb.x, orb.y, orb.radius * (1.4 + boostPhase * 0.3), 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(255, 215, 0, ${0.5 * (1 - boostPhase)})`
          ctx.lineWidth = 2
          ctx.stroke()
          break

        case SPECIAL_TYPES.MAGNET:
          // Draw magnet indicator - concentric rings being pulled inward
          const magnetPhase = (now % 800) / 800
          for (let i = 0; i < 3; i++) {
            const ringProgress = (magnetPhase + i / 3) % 1
            const ringRadius = orb.radius * (2.5 - ringProgress * 1.5) // Rings shrink inward
            const ringAlpha = ringProgress < 0.8 ? 0.5 * (1 - ringProgress) : 0

            if (ringAlpha > 0) {
              ctx.beginPath()
              ctx.arc(orb.x, orb.y, ringRadius, 0, Math.PI * 2)
              ctx.strokeStyle = `rgba(150, 200, 255, ${ringAlpha})`
              ctx.lineWidth = 2
              ctx.stroke()
            }
          }
          break
      }
    }

    // Reset alpha
    ctx.globalAlpha = 1
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
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
