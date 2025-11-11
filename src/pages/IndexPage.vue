<template>
  <q-page class="dynamic-bg">
    <!-- Theme Scene Background -->
    <div class="theme-scene">
      <!-- Tree Silhouette - appears in all scenes -->
      <div class="tree-silhouette">
        <img :src="treeImage" alt="Tree" />
      </div>

      <!-- Night Scene -->
      <div v-if="themeStore.period.key === 'night'" class="night-scene">
        <!-- Moon -->
        <div class="moon" style="color: #fffef0">
          <img :src="moonImage" alt="Moon" />
        </div>

        <!-- Stars -->
        <div
          v-for="star in stars"
          :key="star.id"
          class="star"
          :style="{
            left: star.x + '%',
            top: star.y + '%',
            animationDelay: star.delay + 's',
            animationDuration: star.duration + 's',
          }"
        ></div>
      </div>

      <!-- Dusk Scene -->
      <div v-if="themeStore.period.key === 'dusk'" class="dusk-scene">
        <!-- Fireflies -->
        <div
          v-for="firefly in fireflies"
          :key="firefly.id"
          class="firefly"
          :style="{
            left: firefly.x + '%',
            top: firefly.y + '%',
            animationDelay: firefly.delay + 's',
            animationDuration: firefly.duration + 's',
          }"
        ></div>

        <!-- First stars appearing -->
        <div
          v-for="star in earlyStars"
          :key="'early-' + star.id"
          class="early-star"
          :style="{
            left: star.x + '%',
            top: star.y + '%',
            animationDelay: star.delay + 's',
          }"
        ></div>
      </div>

      <!-- Dawn Scene -->
      <div v-if="themeStore.period.key === 'dawn'" class="dawn-scene">
        <!-- Rising Sun -->
        <div class="rising-sun">
          <div class="sun-glow"></div>
        </div>

        <!-- Sun Rays -->
        <div class="sun-rays">
          <div
            v-for="ray in 8"
            :key="'ray-' + ray"
            class="sun-ray"
            :style="{
              transform: `rotate(${ray * 45}deg)`,
              animationDelay: `${ray * 0.1}s`,
            }"
          ></div>
        </div>

        <!-- Dew Sparkles -->
        <div
          v-for="dew in dewdrops"
          :key="dew.id"
          class="dewdrop"
          :style="{
            left: dew.x + '%',
            top: dew.y + '%',
            animationDelay: dew.delay + 's',
            animationDuration: dew.duration + 's',
          }"
        ></div>

        <!-- Light Particles -->
        <div
          v-for="particle in lightParticles"
          :key="'particle-' + particle.id"
          class="light-particle"
          :style="{
            left: particle.x + '%',
            top: particle.y + '%',
            animationDelay: particle.delay + 's',
            animationDuration: particle.duration + 's',
          }"
        ></div>
      </div>

      <!-- Morning Scene -->
      <div v-if="themeStore.period.key === 'morning'" class="morning-scene">
        <!-- Clouds -->
        <div
          v-for="cloud in clouds"
          :key="cloud.id"
          class="cloud"
          :style="{
            left: cloud.x + '%',
            top: cloud.y + '%',
            animationDelay: cloud.delay + 's',
            animationDuration: cloud.duration + 's',
            transform: `scale(${cloud.scale})`,
          }"
        ></div>

        <!-- Birds -->
        <div
          v-for="bird in birds"
          :key="bird.id"
          class="bird-container"
          :style="{
            top: bird.y + '%',
            animationDelay: bird.delay + 's',
            animationDuration: bird.duration + 's',
          }"
        >
          <div
            class="bird"
            :style="{
              animationDuration: 0.9 + Math.random() * 0.4 + 's',
            }"
          ></div>
        </div>

        <!-- Butterflies -->
        <div
          v-for="butterfly in butterflies"
          :key="butterfly.id"
          class="butterfly"
          :style="{
            left: butterfly.x + '%',
            top: butterfly.y + '%',
            animationDelay: butterfly.delay + 's',
            animationDuration: butterfly.duration + 's',
          }"
        >
          <div class="butterfly-wing butterfly-wing-left"></div>
          <div class="butterfly-wing butterfly-wing-right"></div>
        </div>
      </div>

      <!-- Midday Scene -->
      <div v-if="themeStore.period.key === 'midday'" class="midday-scene">
        <!-- Bright Sun -->
        <div class="bright-sun">
          <div class="sun-core"></div>
        </div>

        <!-- Clouds -->
        <div
          v-for="cloud in middayClouds"
          :key="'midday-cloud-' + cloud.id"
          class="midday-cloud"
          :style="{
            top: cloud.y + '%',
            animationDuration: cloud.duration + 's',
            transform: `scale(${cloud.scale})`,
          }"
        ></div>

        <!-- Dragonflies -->
        <div
          v-for="dragonfly in dragonflies"
          :key="dragonfly.id"
          class="dragonfly"
          :style="{
            left: dragonfly.x + '%',
            top: dragonfly.y + '%',
            animationDuration: dragonfly.duration + 's',
          }"
        >
          <div class="dragonfly-body"></div>
          <div class="dragonfly-wings"></div>
        </div>

        <!-- Butterflies -->
        <div
          v-for="butterfly in middayButterflies"
          :key="'midday-bf-' + butterfly.id"
          class="midday-butterfly"
          :style="{
            left: butterfly.x + '%',
            top: butterfly.y + '%',
            animationDuration: butterfly.duration + 's',
          }"
        >
          <div class="butterfly-wing butterfly-wing-left"></div>
          <div class="butterfly-wing butterfly-wing-right"></div>
        </div>
      </div>

      <!-- Evening Scene -->
      <div v-if="themeStore.period.key === 'evening'" class="evening-scene">
        <!-- Golden Clouds -->
        <div
          v-for="cloud in eveningClouds"
          :key="'evening-cloud-' + cloud.id"
          class="evening-cloud"
          :style="{
            top: cloud.y + '%',
            animationDuration: cloud.duration + 's',
            transform: `scale(${cloud.scale})`,
          }"
        ></div>

        <!-- Fireflies -->
        <div
          v-for="firefly in eveningFireflies"
          :key="'evening-firefly-' + firefly.id"
          class="evening-firefly"
          :style="{
            left: firefly.x + '%',
            top: firefly.y + '%',
            animationDelay: firefly.delay + 's',
            animationDuration: firefly.duration + 's',
          }"
        ></div>

        <!-- Golden Dandelion Seeds -->
        <div
          v-for="seed in goldenSeeds"
          :key="'golden-seed-' + seed.id"
          class="golden-seed"
          :style="{
            left: seed.x + '%',
            top: seed.y + '%',
            animationDelay: seed.delay + 's',
            animationDuration: seed.duration + 's',
          }"
        ></div>

        <!-- Silhouette Birds -->
        <div
          v-for="bird in eveningBirds"
          :key="'evening-bird-' + bird.id"
          class="silhouette-bird-container"
          :style="{
            top: bird.y + '%',
            animationDelay: bird.delay + 's',
            animationDuration: bird.duration + 's',
          }"
        >
          <div
            class="silhouette-bird"
            :style="{
              animationDuration: 0.8 + Math.random() * 0.3 + 's',
            }"
          ></div>
        </div>
      </div>

      <!-- Afternoon Scene -->
      <div v-if="themeStore.period.key === 'afternoon'" class="afternoon-scene">
        <!-- Soft Sun -->
        <div class="afternoon-sun">
          <div class="sun-core"></div>
        </div>

        <!-- Clouds -->
        <div
          v-for="cloud in afternoonClouds"
          :key="'afternoon-cloud-' + cloud.id"
          class="afternoon-cloud"
          :style="{
            top: cloud.y + '%',
            animationDuration: cloud.duration + 's',
            transform: `scale(${cloud.scale})`,
          }"
        ></div>

        <!-- Bees -->
        <div
          v-for="bee in bees"
          :key="bee.id"
          class="bee"
          :style="{
            left: bee.x + '%',
            top: bee.y + '%',
            animationDuration: bee.duration + 's',
          }"
        >
          <div class="bee-body">
            <div class="bee-stripes"></div>
          </div>
          <div class="bee-wings"></div>
        </div>

        <!-- Butterflies -->
        <div
          v-for="butterfly in afternoonButterflies"
          :key="'afternoon-bf-' + butterfly.id"
          class="afternoon-butterfly"
          :style="{
            left: butterfly.x + '%',
            top: butterfly.y + '%',
            animationDuration: butterfly.duration + 's',
          }"
        >
          <div class="butterfly-wing butterfly-wing-left"></div>
          <div class="butterfly-wing butterfly-wing-right"></div>
        </div>

        <!-- Floating Seeds -->
        <div
          v-for="seed in floatingSeeds"
          :key="seed.id"
          class="floating-seed"
          :style="{
            left: seed.x + '%',
            top: seed.y + '%',
            animationDelay: seed.delay + 's',
            animationDuration: seed.duration + 's',
          }"
        ></div>

        <!-- Dust Particles -->
        <div
          v-for="dust in dustParticles"
          :key="dust.id"
          class="dust-particle"
          :style="{
            left: dust.x + '%',
            top: dust.y + '%',
            animationDelay: dust.delay + 's',
            animationDuration: dust.duration + 's',
          }"
        ></div>
      </div>
    </div>

    <div class="page-content">
      <!-- App Title - Show after loading transition -->
      <div class="title-container" :class="{ 'title-hidden': !showTitle }">
        <h1 class="app-title">
          <span class="zen-emphasis">Zen</span><span class="ith-subtle">ith</span>
        </h1>
        <p class="subtitle">Relaxing games for mindful moments</p>
      </div>

      <!-- Game Cards -->
      <div class="game-grid">
        <q-card
          v-for="game in games"
          :key="game.id"
          class="game-card card-hover cursor-pointer"
          @click="navigateToGame(game.id)"
        >
          <q-card-section>
            <div class="text-h5 text-weight-medium q-mb-sm">
              {{ game.name }}
            </div>
            <div class="text-caption text-grey-7">
              {{ game.description }}
            </div>
          </q-card-section>

          <q-card-section v-if="game.progress !== undefined && game.currentLevel !== null">
            <q-linear-progress
              :value="game.progress / 100"
              :color="progressColor"
              size="8px"
              rounded
            />
            <div class="text-caption text-grey-6 q-mt-xs">Level {{ game.currentLevel }}</div>
          </q-card-section>

          <q-badge v-if="!game.available" floating color="grey" label="Coming Soon" />
        </q-card>
      </div>

      <!-- Footer Actions -->
      <div class="footer-actions">
        <q-btn
          flat
          color="white"
          label="Statistics"
          icon="bar_chart"
          @click="navigateTo('stats')"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProgressStore } from 'src/stores/progress'
import { useThemeStore } from 'src/stores/theme'
import { useHaptics } from 'src/composables/useHaptics'
import moonImage from 'src/assets/images/theme/night/moon.svg'
import treeImage from 'src/assets/images/theme/tree.svg'

const router = useRouter()
const progressStore = useProgressStore()
const themeStore = useThemeStore()
const haptics = useHaptics()

// Control title visibility for loading screen transition
// Check if this is initial app load or navigation back to page
const isInitialLoad = !window.__appLoaded
if (isInitialLoad) {
  window.__appLoaded = true
}

const showTitle = ref(!isInitialLoad) // Show immediately if not initial load

// Auto-show title after loading screen should be done (fallback for initial load)
onMounted(() => {
  if (isInitialLoad) {
    setTimeout(() => {
      showTitle.value = true
    }, 2100) // 1.5s loading + 0.6s for title to reach position
  }
})

const games = ref([
  {
    id: 'chain-reaction',
    name: 'Orbs',
    description: 'Create mesmerizing chain reactions',
    available: true,
    progress: 0,
    currentLevel: 1,
  },
  {
    id: 'solitaire',
    name: 'Solitude',
    description: "It's Solitaire, but even more zen",
    available: true,
    progress: 0,
    currentLevel: null,
  },
  {
    id: 'ripple',
    name: 'Ripple',
    description: 'Create waves to reach lotus flowers',
    available: true,
    progress: 0,
    currentLevel: 1,
  },
  {
    id: 'constellation',
    name: 'Constellation',
    description: 'Connect the stars and learn their stories',
    available: true,
    progress: 0,
    currentLevel: null,
  },
])

const progressColor = computed(() => themeStore.colors.accent)

// Generate stars for night scene
const stars = ref([])

function generateStars() {
  const starCount = 20
  const newStars = []

  for (let i = 0; i < starCount; i++) {
    newStars.push({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 50, // Keep stars in upper half
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 2, // 2-4 seconds
    })
  }

  stars.value = newStars
}

// Generate fireflies for dusk scene
const fireflies = ref([])

function generateFireflies() {
  const fireflyCount = 12
  const newFireflies = []

  for (let i = 0; i < fireflyCount; i++) {
    newFireflies.push({
      id: i,
      x: 10 + Math.random() * 80, // Keep away from edges
      y: 30 + Math.random() * 50, // Middle to lower area
      delay: Math.random() * 4,
      duration: 3 + Math.random() * 3, // 3-6 seconds
    })
  }

  fireflies.value = newFireflies
}

// Generate early stars for dusk scene
const earlyStars = ref([])

function generateEarlyStars() {
  const starCount = 5
  const newStars = []

  for (let i = 0; i < starCount; i++) {
    newStars.push({
      id: i,
      x: 20 + Math.random() * 60,
      y: Math.random() * 30, // Upper area only
      delay: Math.random() * 5,
    })
  }

  earlyStars.value = newStars
}

// Generate dewdrops for dawn scene
const dewdrops = ref([])

function generateDewdrops() {
  const dewCount = 15
  const newDewdrops = []

  for (let i = 0; i < dewCount; i++) {
    newDewdrops.push({
      id: i,
      x: Math.random() * 100,
      y: 40 + Math.random() * 50, // Lower half
      delay: Math.random() * 4,
      duration: 2 + Math.random() * 2, // 2-4 seconds
    })
  }

  dewdrops.value = newDewdrops
}

// Generate light particles for dawn scene
const lightParticles = ref([])

function generateLightParticles() {
  const particleCount = 10
  const newParticles = []

  for (let i = 0; i < particleCount; i++) {
    newParticles.push({
      id: i,
      x: 10 + Math.random() * 80,
      y: 20 + Math.random() * 60,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 3, // 3-6 seconds
    })
  }

  lightParticles.value = newParticles
}

// Generate clouds for morning scene
const clouds = ref([])
let cloudIdCounter = 0

function addCloud() {
  const duration = 30 + Math.random() * 20 // 30-50 seconds
  const newCloud = {
    id: cloudIdCounter++,
    y: Math.random() * 40, // Upper area
    duration: duration,
    scale: 0.5 + Math.random() * 0.5, // 0.5-1.0x scale
  }

  clouds.value.push(newCloud)

  // Remove cloud after animation completes
  setTimeout(() => {
    clouds.value = clouds.value.filter((c) => c.id !== newCloud.id)
  }, duration * 1000)
}

function startCloudGeneration() {
  // Add initial cloud
  addCloud()

  // Add new cloud every 8-12 seconds
  setInterval(
    () => {
      if (themeStore.period.key === 'morning') {
        addCloud()
      }
    },
    8000 + Math.random() * 4000,
  )
}

// Generate birds for morning scene
const birds = ref([])
let birdIdCounter = 0

function addBird() {
  const duration = 18 + Math.random() * 4 // 18-22 seconds
  const newBird = {
    id: birdIdCounter++,
    y: 5 + Math.random() * 35, // Random vertical position (5-40% from top)
    delay: Math.random() * 0.5, // Small random delay 0-0.5s
    duration: duration,
  }

  birds.value.push(newBird)

  // Remove bird after animation completes
  setTimeout(
    () => {
      birds.value = birds.value.filter((b) => b.id !== newBird.id)
    },
    (duration + newBird.delay) * 1000,
  )
}

function startBirdGeneration() {
  // Add initial birds
  addBird()
  setTimeout(() => addBird(), 3000)

  // Add new bird every 7-10 seconds
  setInterval(
    () => {
      if (themeStore.period.key === 'morning') {
        addBird()
      }
    },
    7000 + Math.random() * 3000,
  )
}

// Generate butterflies for morning scene
const butterflies = ref([])
let butterflyIdCounter = 0

function addButterfly() {
  const duration = 12 + Math.random() * 6 // 12-18 seconds
  const newButterfly = {
    id: butterflyIdCounter++,
    x: -5 + Math.random() * 30, // Start from left side
    y: 20 + Math.random() * 60,
    duration: duration,
  }

  butterflies.value.push(newButterfly)

  // Remove butterfly after animation completes
  setTimeout(() => {
    butterflies.value = butterflies.value.filter((bf) => bf.id !== newButterfly.id)
  }, duration * 1000)
}

function startButterflyGeneration() {
  // Add initial butterflies
  addButterfly()
  setTimeout(() => addButterfly(), 2000)

  // Add new butterfly every 5-8 seconds
  setInterval(
    () => {
      if (themeStore.period.key === 'morning') {
        addButterfly()
      }
    },
    5000 + Math.random() * 3000,
  )
}

// Generate midday clouds
const middayClouds = ref([])
let middayCloudIdCounter = 0

function addMiddayCloud() {
  const duration = 35 + Math.random() * 15 // 35-50 seconds
  const newCloud = {
    id: middayCloudIdCounter++,
    y: Math.random() * 30, // Upper area
    duration: duration,
    scale: 0.6 + Math.random() * 0.4, // 0.6-1.0x scale
  }

  middayClouds.value.push(newCloud)

  // Remove cloud after animation completes
  setTimeout(() => {
    middayClouds.value = middayClouds.value.filter((c) => c.id !== newCloud.id)
  }, duration * 1000)
}

function startMiddayCloudGeneration() {
  // Add initial cloud
  addMiddayCloud()

  // Add new cloud every 10-15 seconds
  setInterval(
    () => {
      if (themeStore.period.key === 'midday') {
        addMiddayCloud()
      }
    },
    10000 + Math.random() * 5000,
  )
}

// Generate dragonflies for midday scene
const dragonflies = ref([])
let dragonflyIdCounter = 0

function addDragonfly() {
  const duration = 3 + Math.random() * 2 // 3-5 seconds (fast!)
  const newDragonfly = {
    id: dragonflyIdCounter++,
    x: Math.random() * 100,
    y: 20 + Math.random() * 60,
    duration: duration,
  }

  dragonflies.value.push(newDragonfly)

  // Remove dragonfly after animation completes
  setTimeout(() => {
    dragonflies.value = dragonflies.value.filter((d) => d.id !== newDragonfly.id)
  }, duration * 1000)
}

function startDragonflyGeneration() {
  // Add initial dragonfly
  addDragonfly()

  // Add new dragonfly every 4-7 seconds
  setInterval(
    () => {
      if (themeStore.period.key === 'midday') {
        addDragonfly()
      }
    },
    4000 + Math.random() * 3000,
  )
}

// Generate butterflies for midday scene
const middayButterflies = ref([])
let middayButterflyIdCounter = 0

function addMiddayButterfly() {
  const duration = 12 + Math.random() * 6 // 12-18 seconds
  const newButterfly = {
    id: middayButterflyIdCounter++,
    x: -5 + Math.random() * 30,
    y: 25 + Math.random() * 50,
    duration: duration,
  }

  middayButterflies.value.push(newButterfly)

  // Remove butterfly after animation completes
  setTimeout(() => {
    middayButterflies.value = middayButterflies.value.filter((bf) => bf.id !== newButterfly.id)
  }, duration * 1000)
}

function startMiddayButterflyGeneration() {
  // Add initial butterfly
  addMiddayButterfly()

  // Add new butterfly every 8-12 seconds
  setInterval(
    () => {
      if (themeStore.period.key === 'midday') {
        addMiddayButterfly()
      }
    },
    8000 + Math.random() * 4000,
  )
}

// Generate afternoon clouds
const afternoonClouds = ref([])
let afternoonCloudIdCounter = 0

function addAfternoonCloud() {
  const duration = 40 + Math.random() * 20 // 40-60 seconds (slower)
  const newCloud = {
    id: afternoonCloudIdCounter++,
    y: Math.random() * 35, // Upper area
    duration: duration,
    scale: 0.7 + Math.random() * 0.5, // 0.7-1.2x scale
  }

  afternoonClouds.value.push(newCloud)

  // Remove cloud after animation completes
  setTimeout(() => {
    afternoonClouds.value = afternoonClouds.value.filter((c) => c.id !== newCloud.id)
  }, duration * 1000)
}

function startAfternoonCloudGeneration() {
  // Add initial clouds
  addAfternoonCloud()
  setTimeout(() => addAfternoonCloud(), 5000)

  // Add new cloud every 12-18 seconds
  setInterval(
    () => {
      if (themeStore.period.key === 'afternoon') {
        addAfternoonCloud()
      }
    },
    12000 + Math.random() * 6000,
  )
}

// Generate bees for afternoon scene
const bees = ref([])
let beeIdCounter = 0

function addBee() {
  const duration = 4 + Math.random() * 3 // 4-7 seconds
  const newBee = {
    id: beeIdCounter++,
    x: Math.random() * 100,
    y: 15 + Math.random() * 65, // Can fly from 15% to 80% height
    duration: duration,
  }

  bees.value.push(newBee)

  // Remove bee after animation completes
  setTimeout(() => {
    bees.value = bees.value.filter((b) => b.id !== newBee.id)
  }, duration * 1000)
}

function startBeeGeneration() {
  // Add initial bee
  addBee()

  // Add new bee every 5-8 seconds
  setInterval(
    () => {
      if (themeStore.period.key === 'afternoon') {
        addBee()
      }
    },
    5000 + Math.random() * 3000,
  )
}

// Generate butterflies for afternoon scene
const afternoonButterflies = ref([])
let afternoonButterflyIdCounter = 0

function addAfternoonButterfly() {
  const duration = 14 + Math.random() * 6 // 14-20 seconds (slower)
  const newButterfly = {
    id: afternoonButterflyIdCounter++,
    x: -5 + Math.random() * 30,
    y: 20 + Math.random() * 60,
    duration: duration,
  }

  afternoonButterflies.value.push(newButterfly)

  // Remove butterfly after animation completes
  setTimeout(() => {
    afternoonButterflies.value = afternoonButterflies.value.filter(
      (bf) => bf.id !== newButterfly.id,
    )
  }, duration * 1000)
}

function startAfternoonButterflyGeneration() {
  // Add initial butterfly
  addAfternoonButterfly()

  // Add new butterfly every 10-14 seconds
  setInterval(
    () => {
      if (themeStore.period.key === 'afternoon') {
        addAfternoonButterfly()
      }
    },
    10000 + Math.random() * 4000,
  )
}

// Generate floating seeds for afternoon scene
const floatingSeeds = ref([])
let seedIdCounter = 0

function addFloatingSeed() {
  const duration = 8 + Math.random() * 4 // 8-12 seconds
  const newSeed = {
    id: seedIdCounter++,
    x: Math.random() * 100,
    y: -5,
    delay: Math.random() * 2,
    duration: duration,
  }

  floatingSeeds.value.push(newSeed)

  // Remove seed after animation completes
  setTimeout(
    () => {
      floatingSeeds.value = floatingSeeds.value.filter((s) => s.id !== newSeed.id)
    },
    (duration + newSeed.delay) * 1000,
  )
}

function startFloatingSeedGeneration() {
  // Add initial seeds
  addFloatingSeed()
  setTimeout(() => addFloatingSeed(), 3000)

  // Add new seed every 6-10 seconds
  setInterval(
    () => {
      if (themeStore.period.key === 'afternoon') {
        addFloatingSeed()
      }
    },
    6000 + Math.random() * 4000,
  )
}

// Generate dust particles for afternoon scene
const dustParticles = ref([])
let dustIdCounter = 0

function addDustParticle() {
  const duration = 10 + Math.random() * 5 // 10-15 seconds
  const newDust = {
    id: dustIdCounter++,
    x: Math.random() * 100,
    y: 60 + Math.random() * 40, // Lower portion
    delay: Math.random() * 3,
    duration: duration,
  }

  dustParticles.value.push(newDust)

  // Remove dust after animation completes
  setTimeout(
    () => {
      dustParticles.value = dustParticles.value.filter((d) => d.id !== newDust.id)
    },
    (duration + newDust.delay) * 1000,
  )
}

function startDustParticleGeneration() {
  // Add initial dust particles
  for (let i = 0; i < 3; i++) {
    setTimeout(() => addDustParticle(), i * 2000)
  }

  // Add new dust particle every 8-12 seconds
  setInterval(
    () => {
      if (themeStore.period.key === 'afternoon') {
        addDustParticle()
      }
    },
    8000 + Math.random() * 4000,
  )
}

// Generate evening clouds
const eveningClouds = ref([])
let eveningCloudIdCounter = 0

function addEveningCloud() {
  const duration = 45 + Math.random() * 25 // 45-70 seconds (slow)
  const newCloud = {
    id: eveningCloudIdCounter++,
    y: 10 + Math.random() * 30, // Upper-middle area
    duration: duration,
    scale: 0.8 + Math.random() * 0.6, // 0.8-1.4x scale
  }

  eveningClouds.value.push(newCloud)

  // Remove cloud after animation completes
  setTimeout(() => {
    eveningClouds.value = eveningClouds.value.filter((c) => c.id !== newCloud.id)
  }, duration * 1000)
}

function startEveningCloudGeneration() {
  // Add initial clouds
  addEveningCloud()
  setTimeout(() => addEveningCloud(), 8000)

  // Add new cloud every 15-22 seconds
  setInterval(
    () => {
      if (themeStore.period.key === 'evening') {
        addEveningCloud()
      }
    },
    15000 + Math.random() * 7000,
  )
}

// Generate fireflies for evening scene
const eveningFireflies = ref([])
let eveningFireflyIdCounter = 0

function addEveningFirefly() {
  const duration = 3 + Math.random() * 3 // 3-6 seconds
  const newFirefly = {
    id: eveningFireflyIdCounter++,
    x: 10 + Math.random() * 80,
    y: 40 + Math.random() * 50, // Lower portion
    delay: Math.random() * 2,
    duration: duration,
  }

  eveningFireflies.value.push(newFirefly)

  // Remove firefly after animation completes
  setTimeout(
    () => {
      eveningFireflies.value = eveningFireflies.value.filter((f) => f.id !== newFirefly.id)
    },
    (duration + newFirefly.delay) * 1000,
  )
}

function startEveningFireflyGeneration() {
  // Add initial fireflies
  for (let i = 0; i < 5; i++) {
    setTimeout(() => addEveningFirefly(), i * 1000)
  }

  // Add new firefly every 2-4 seconds
  setInterval(
    () => {
      if (themeStore.period.key === 'evening') {
        addEveningFirefly()
      }
    },
    2000 + Math.random() * 2000,
  )
}

// Generate golden seeds for evening scene
const goldenSeeds = ref([])
let goldenSeedIdCounter = 0

function addGoldenSeed() {
  const duration = 10 + Math.random() * 5 // 10-15 seconds
  const newSeed = {
    id: goldenSeedIdCounter++,
    x: Math.random() * 100,
    y: -5,
    delay: Math.random() * 3,
    duration: duration,
  }

  goldenSeeds.value.push(newSeed)

  // Remove seed after animation completes
  setTimeout(
    () => {
      goldenSeeds.value = goldenSeeds.value.filter((s) => s.id !== newSeed.id)
    },
    (duration + newSeed.delay) * 1000,
  )
}

function startGoldenSeedGeneration() {
  // Add initial seeds
  addGoldenSeed()
  setTimeout(() => addGoldenSeed(), 4000)

  // Add new seed every 7-12 seconds
  setInterval(
    () => {
      if (themeStore.period.key === 'evening') {
        addGoldenSeed()
      }
    },
    7000 + Math.random() * 5000,
  )
}

// Generate silhouette birds for evening scene
const eveningBirds = ref([])
let eveningBirdIdCounter = 0

function addEveningBird() {
  const duration = 20 + Math.random() * 5 // 20-25 seconds (slower)
  const newBird = {
    id: eveningBirdIdCounter++,
    y: 8 + Math.random() * 25, // Upper portion (flying home)
    delay: Math.random() * 0.5,
    duration: duration,
  }

  eveningBirds.value.push(newBird)

  // Remove bird after animation completes
  setTimeout(
    () => {
      eveningBirds.value = eveningBirds.value.filter((b) => b.id !== newBird.id)
    },
    (duration + newBird.delay) * 1000,
  )
}

function startEveningBirdGeneration() {
  // Add initial birds
  addEveningBird()
  setTimeout(() => addEveningBird(), 5000)

  // Add new bird every 10-15 seconds
  setInterval(
    () => {
      if (themeStore.period.key === 'evening') {
        addEveningBird()
      }
    },
    10000 + Math.random() * 5000,
  )
}

onMounted(async () => {
  await progressStore.loadFromStorage()
  updateGameProgress()
  generateStars()
  generateFireflies()
  generateEarlyStars()
  generateDewdrops()
  generateLightParticles()
  startCloudGeneration()
  startBirdGeneration()
  startButterflyGeneration()
  startMiddayCloudGeneration()
  startDragonflyGeneration()
  startMiddayButterflyGeneration()
  startAfternoonCloudGeneration()
  startBeeGeneration()
  startAfternoonButterflyGeneration()
  startFloatingSeedGeneration()
  startDustParticleGeneration()
  startEveningCloudGeneration()
  startEveningFireflyGeneration()
  startGoldenSeedGeneration()
  startEveningBirdGeneration()
})

function updateGameProgress() {
  // Update Chain Reaction (Orbs)
  const chainReactionGame = games.value.find((g) => g.id === 'chain-reaction')
  if (chainReactionGame) {
    chainReactionGame.currentLevel = progressStore.chainReaction.currentLevel
    chainReactionGame.progress = progressStore.chainReactionProgress
  }

  // Update Ripple
  const rippleGame = games.value.find((g) => g.id === 'ripple')
  if (rippleGame) {
    rippleGame.currentLevel = progressStore.ripple.currentLevel
    rippleGame.progress = progressStore.rippleProgress
  }

  // Update Solitaire - show win rate instead of level
  const solitaireGame = games.value.find((g) => g.id === 'solitaire')
  if (solitaireGame && progressStore.solitaire.gamesPlayed > 0) {
    solitaireGame.currentLevel = `${progressStore.solitaire.gamesWon}/${progressStore.solitaire.gamesPlayed} wins`
    solitaireGame.progress = progressStore.solitaireWinRate
  }
}

function navigateToGame(gameId) {
  const game = games.value.find((g) => g.id === gameId)
  if (!game?.available) {
    haptics.warning()
    return
  }

  haptics.medium()
  router.push({ name: gameId })
}

function navigateTo(routeName) {
  haptics.light()
  router.push({ name: routeName })
}

// Method to reveal title after loading screen transition
function revealTitle() {
  showTitle.value = true
}

// Expose method to parent
defineExpose({ revealTitle })
</script>

<style lang="scss" scoped>
.dynamic-bg {
  background: v-bind('themeStore.colors.gradient');
  min-height: 100vh;
  transition: background 2s ease;
  position: relative;
  overflow: hidden;
}

// Theme Scene Background
.theme-scene {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
}

// Night Scene
.night-scene {
  width: 100%;
  height: 100%;
  position: relative;
}

.moon {
  position: absolute;
  top: 40px;
  left: 40px;
  width: 80px;
  height: 80px;
  opacity: 1;

  img {
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.4));
  }
}

@keyframes gentleFloat {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.star {
  position: absolute;
  width: 2px;
  height: 2px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 0 4px 1px rgba(255, 255, 255, 0.8);
  animation: twinkle ease-in-out infinite;
}

@keyframes twinkle {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.5);
  }
}

// Dusk Scene
.dusk-scene {
  width: 100%;
  height: 100%;
  position: relative;
}

// Tree - appears in all scenes
.tree-silhouette {
  position: absolute;
  bottom: 0;
  right: 40px;
  width: 250px;
  height: auto;
  opacity: 0.7;
  filter: brightness(0.3);

  img {
    width: 100%;
    height: auto;
    display: block;
  }
}

.firefly {
  position: absolute;
  width: 4px;
  height: 4px;
  background: #f4ff81;
  border-radius: 50%;
  box-shadow:
    0 0 8px 2px rgba(244, 255, 129, 0.8),
    0 0 12px 4px rgba(244, 255, 129, 0.4);
  animation: fireflyGlow ease-in-out infinite;
}

@keyframes fireflyGlow {
  0%,
  100% {
    opacity: 0.2;
    transform: translate(0, 0) scale(0.8);
  }
  25% {
    opacity: 0.8;
    transform: translate(10px, -15px) scale(1.2);
  }
  50% {
    opacity: 1;
    transform: translate(20px, -5px) scale(1);
  }
  75% {
    opacity: 0.6;
    transform: translate(15px, 10px) scale(1.1);
  }
}

.early-star {
  position: absolute;
  width: 2px;
  height: 2px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 0 3px 1px rgba(255, 255, 255, 0.6);
  opacity: 0.4;
  animation: earlyStarTwinkle 4s ease-in-out infinite;
}

@keyframes earlyStarTwinkle {
  0%,
  100% {
    opacity: 0.2;
  }
  50% {
    opacity: 0.6;
  }
}

// Dawn Scene
.dawn-scene {
  width: 100%;
  height: 100%;
  position: relative;
}

.rising-sun {
  position: absolute;
  bottom: -75px;
  right: -75px;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 200, 100, 0.4) 0%,
    rgba(255, 150, 150, 0.2) 50%,
    rgba(255, 107, 157, 0.1) 100%
  );
  box-shadow: 0 0 40px 20px rgba(255, 180, 120, 0.15);
}

.sun-glow {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 220, 150, 0.3) 0%, transparent 70%);
  animation: sunGlow 4s ease-in-out infinite;
}

@keyframes sunGlow {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.75;
  }
}

.sun-rays {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 400px;
  height: 400px;
  pointer-events: none;
}

.sun-ray {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 2px;
  height: 200px;
  background: linear-gradient(to top, rgba(255, 200, 150, 0.15), transparent);
  transform-origin: bottom center;
  animation: rayPulse 6s ease-in-out infinite;
}

@keyframes rayPulse {
  0%,
  100% {
    opacity: 0.2;
    height: 200px;
  }
  50% {
    opacity: 0.4;
    height: 250px;
  }
}

.dewdrop {
  position: absolute;
  width: 3px;
  height: 3px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  box-shadow:
    0 0 4px 1px rgba(255, 220, 180, 0.6),
    0 0 8px 2px rgba(255, 180, 150, 0.3);
  animation: dewSparkle ease-in-out infinite;
}

@keyframes dewSparkle {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

.light-particle {
  position: absolute;
  width: 6px;
  height: 6px;
  background: radial-gradient(circle, rgba(255, 220, 180, 0.6) 0%, rgba(255, 180, 150, 0.2) 100%);
  border-radius: 50%;
  animation: particleFloat ease-in-out infinite;
}

@keyframes particleFloat {
  0%,
  100% {
    opacity: 0.2;
    transform: translateY(0) scale(1);
  }
  50% {
    opacity: 0.7;
    transform: translateY(-20px) scale(1.3);
  }
}

// Morning Scene
.morning-scene {
  width: 100%;
  height: 100%;
  position: relative;
}

.cloud {
  position: absolute;
  width: 80px;
  height: 25px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 100px;
  filter: blur(1px);
  animation: cloudDrift linear forwards;

  &::before,
  &::after {
    content: '';
    position: absolute;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 50%;
    filter: blur(1px);
  }

  &::before {
    width: 35px;
    height: 35px;
    top: -15px;
    left: 15px;
    box-shadow: 20px 0 0 -3px rgba(255, 255, 255, 0.5);
  }

  &::after {
    width: 28px;
    height: 28px;
    top: -10px;
    right: 12px;
  }
}

@keyframes cloudDrift {
  0% {
    transform: translateX(-10vw);
    opacity: 0;
  }
  5% {
    opacity: 0.6;
  }
  95% {
    opacity: 0.6;
  }
  100% {
    transform: translateX(110vw);
    opacity: 0;
  }
}

.bird-container {
  position: absolute;
  top: 10%;
  left: -10%;
  transform: scale(0) translateX(-10vw);
  will-change: transform;
  animation-name: fly-right;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
  opacity: 0.5;
}

.bird {
  background-image: url('https://s3-us-west-2.amazonaws.com/s.cdpn.io/174479/bird-cells-new.svg');
  filter: brightness(0.3);
  background-size: auto 100%;
  width: 44px;
  height: 62px;
  will-change: background-position;
  animation-name: fly-cycle;
  animation-timing-function: steps(10);
  animation-iteration-count: infinite;
}

@keyframes fly-cycle {
  100% {
    background-position: -450px 0;
  }
}

@keyframes fly-right {
  0% {
    transform: scale(0.15) translateX(-10vw) translateY(0vh);
  }
  10% {
    transform: translateY(-2vh) translateX(15vw) scale(0.18);
  }
  25% {
    transform: translateY(1vh) translateX(35vw) scale(0.2);
  }
  40% {
    transform: translateY(-1vh) translateX(55vw) scale(0.22);
  }
  55% {
    transform: translateY(2vh) translateX(75vw) scale(0.25);
  }
  70% {
    transform: translateY(0vh) translateX(95vw) scale(0.25);
  }
  85% {
    transform: translateY(-1vh) translateX(110vw) scale(0.25);
  }
  100% {
    transform: translateY(0vh) translateX(120vw) scale(0.25);
  }
}

.butterfly {
  position: absolute;
  width: 20px;
  height: 20px;
  animation: butterflyFloat ease-in-out forwards;
}

.butterfly-wing {
  position: absolute;
  width: 10px;
  height: 15px;
  border-radius: 50% 50% 50% 0;
  animation: butterflyWingFlap 0.3s ease-in-out infinite;
}

.butterfly-wing-left {
  left: 0;
  background: linear-gradient(135deg, rgba(255, 182, 193, 0.8) 0%, rgba(255, 105, 180, 0.6) 100%);
  transform-origin: right center;
}

.butterfly-wing-right {
  right: 0;
  background: linear-gradient(225deg, rgba(255, 182, 193, 0.8) 0%, rgba(255, 105, 180, 0.6) 100%);
  transform-origin: left center;
  transform: scaleX(-1);
}

@keyframes butterflyFloat {
  0% {
    transform: translate(0, 0);
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  20% {
    transform: translate(20vw, -5vh);
  }
  40% {
    transform: translate(40vw, 3vh);
  }
  60% {
    transform: translate(60vw, -2vh);
  }
  80% {
    transform: translate(80vw, 4vh);
  }
  93% {
    opacity: 1;
  }
  100% {
    transform: translate(105vw, 0vh);
    opacity: 0;
  }
}

@keyframes butterflyWingFlap {
  0%,
  100% {
    transform: rotateY(0deg);
  }
  50% {
    transform: rotateY(60deg);
  }
}

// Midday Scene
.midday-scene {
  width: 100%;
  height: 100%;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(ellipse at 85% 20%, rgba(255, 255, 220, 0.25) 0%, transparent 55%),
      radial-gradient(ellipse at 20% 80%, rgba(100, 180, 255, 0.15) 0%, transparent 55%);
    animation: gradientShift 20s ease-in-out infinite;
    pointer-events: none;
  }
}

@keyframes gradientShift {
  0%,
  100% {
    opacity: 0.8;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.15);
  }
}

.bright-sun {
  position: absolute;
  top: 8%;
  right: 15%;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 220, 0.6) 0%,
    rgba(255, 255, 180, 0.3) 50%,
    transparent 70%
  );
  animation: sunGlow 3s ease-in-out infinite;
}

.sun-core {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(255, 255, 200, 0.8);
  box-shadow: 0 0 20px 5px rgba(255, 255, 180, 0.4);
}

.midday-cloud {
  position: absolute;
  width: 70px;
  height: 22px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 100px;
  filter: blur(0.5px);
  animation: cloudDrift linear forwards;

  &::before,
  &::after {
    content: '';
    position: absolute;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    filter: blur(0.5px);
  }

  &::before {
    width: 32px;
    height: 32px;
    top: -13px;
    left: 12px;
    box-shadow: 18px 0 0 -2px rgba(255, 255, 255, 0.75);
  }

  &::after {
    width: 26px;
    height: 26px;
    top: -9px;
    right: 10px;
  }
}

.dragonfly {
  position: absolute;
  width: 16px;
  height: 16px;
  animation: dragonflyZip linear forwards;
}

.dragonfly-body {
  position: absolute;
  width: 12px;
  height: 3px;
  background: rgba(60, 120, 180, 0.8);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 2px;

  &::after {
    content: '';
    position: absolute;
    width: 4px;
    height: 4px;
    background: rgba(60, 120, 180, 0.9);
    border-radius: 50%;
    left: -2px;
    top: 50%;
    transform: translateY(-50%);
  }
}

.dragonfly-wings {
  position: absolute;
  width: 100%;
  height: 100%;
  animation: dragonflyWingBuzz 0.05s ease-in-out infinite;

  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 8px;
    height: 12px;
    background: rgba(180, 220, 255, 0.4);
    border-radius: 50%;
    top: 50%;
  }

  &::before {
    left: -2px;
    transform: translateY(-50%) rotate(-20deg);
  }

  &::after {
    right: -2px;
    transform: translateY(-50%) rotate(20deg);
  }
}

@keyframes dragonflyZip {
  0% {
    transform: translate(0, 0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  25% {
    transform: translate(20vw, -10vh);
  }
  50% {
    transform: translate(50vw, 5vh);
  }
  75% {
    transform: translate(80vw, -8vh);
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translate(110vw, 3vh);
    opacity: 0;
  }
}

@keyframes dragonflyWingBuzz {
  0%,
  100% {
    transform: scaleX(1);
    opacity: 0.4;
  }
  50% {
    transform: scaleX(0.7);
    opacity: 0.6;
  }
}

.midday-butterfly {
  position: absolute;
  width: 18px;
  height: 18px;
  animation: butterflyFloat ease-in-out forwards;
}

// Evening Scene
.evening-scene {
  width: 100%;
  height: 100%;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(ellipse at 20% 40%, rgba(255, 160, 100, 0.3) 0%, transparent 60%),
      radial-gradient(ellipse at 80% 70%, rgba(255, 200, 150, 0.2) 0%, transparent 50%);
    animation: goldenGlow 15s ease-in-out infinite;
    pointer-events: none;
  }
}

@keyframes goldenGlow {
  0%,
  100% {
    opacity: 0.7;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

.setting-sun {
  position: absolute;
  bottom: 5%;
  left: 15%;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 180, 100, 0.8) 0%,
    rgba(255, 140, 80, 0.5) 40%,
    transparent 70%
  );
  animation: sunSet 5s ease-in-out infinite;
  box-shadow: 0 0 40px 15px rgba(255, 150, 80, 0.4);
}

@keyframes sunSet {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.9;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
}

.golden-rays {
  position: absolute;
  bottom: 5%;
  left: 15%;
  width: 400px;
  height: 400px;
  transform: translate(-50%, 50%);
  pointer-events: none;
}

.golden-ray {
  position: absolute;
  bottom: 50%;
  left: 50%;
  width: 4px;
  height: 150px;
  background: linear-gradient(
    to top,
    rgba(255, 180, 100, 0.3),
    rgba(255, 160, 80, 0.15),
    transparent
  );
  transform-origin: bottom center;
  filter: blur(2px);
  animation: goldenRayPulse 8s ease-in-out infinite;
}

@keyframes goldenRayPulse {
  0%,
  100% {
    opacity: 0.3;
    height: 150px;
  }
  50% {
    opacity: 0.6;
    height: 200px;
  }
}

.evening-cloud {
  position: absolute;
  width: 90px;
  height: 28px;
  background: linear-gradient(
    135deg,
    rgba(255, 180, 140, 0.7) 0%,
    rgba(255, 200, 160, 0.6) 50%,
    rgba(255, 220, 180, 0.5) 100%
  );
  border-radius: 100px;
  filter: blur(1.5px);
  animation: cloudDrift linear forwards;
  box-shadow: inset 0 -5px 10px rgba(255, 140, 80, 0.3);

  &::before,
  &::after {
    content: '';
    position: absolute;
    background: linear-gradient(135deg, rgba(255, 170, 130, 0.7) 0%, rgba(255, 190, 150, 0.6) 100%);
    border-radius: 50%;
    filter: blur(1.5px);
  }

  &::before {
    width: 40px;
    height: 40px;
    top: -16px;
    left: 16px;
    box-shadow: 22px 0 0 -3px rgba(255, 180, 140, 0.65);
  }

  &::after {
    width: 32px;
    height: 32px;
    top: -12px;
    right: 14px;
  }
}

.evening-firefly {
  position: absolute;
  width: 4px;
  height: 4px;
  background: #f4ff81;
  border-radius: 50%;
  box-shadow:
    0 0 10px 3px rgba(244, 255, 129, 0.9),
    0 0 15px 5px rgba(244, 255, 129, 0.5);
  animation: fireflyGlow ease-in-out infinite;
}

.golden-seed {
  position: absolute;
  width: 5px;
  height: 5px;
  background: rgba(255, 220, 150, 0.8);
  border-radius: 50%;
  box-shadow: 0 0 6px 2px rgba(255, 200, 120, 0.6);
  animation: goldenSeedFloat ease-in-out forwards;
  filter: brightness(1.3);

  &::before {
    content: '';
    position: absolute;
    width: 10px;
    height: 1px;
    background: linear-gradient(90deg, rgba(255, 220, 150, 0.6) 0%, rgba(255, 200, 120, 0.3) 100%);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(45deg);
    box-shadow: 0 0 4px rgba(255, 200, 120, 0.4);
  }

  &::after {
    content: '';
    position: absolute;
    width: 8px;
    height: 1px;
    background: linear-gradient(90deg, rgba(255, 220, 150, 0.5) 0%, rgba(255, 200, 120, 0.2) 100%);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-30deg);
    box-shadow: 0 0 3px rgba(255, 200, 120, 0.3);
  }
}

@keyframes goldenSeedFloat {
  0% {
    transform: translate(0, 0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 0.9;
  }
  20% {
    transform: translate(6vw, 18vh) rotate(50deg);
  }
  35% {
    transform: translate(-4vw, 32vh) rotate(120deg);
  }
  50% {
    transform: translate(10vw, 48vh) rotate(180deg);
  }
  65% {
    transform: translate(-6vw, 62vh) rotate(250deg);
  }
  80% {
    transform: translate(5vw, 80vh) rotate(320deg);
  }
  90% {
    opacity: 0.9;
  }
  100% {
    transform: translate(-3vw, 105vh) rotate(390deg);
    opacity: 0;
  }
}

.silhouette-bird-container {
  position: absolute;
  top: 10%;
  left: -10%;
  transform: scale(0) translateX(-10vw);
  will-change: transform;
  animation-name: fly-right;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

.silhouette-bird {
  background-image: url('https://s3-us-west-2.amazonaws.com/s.cdpn.io/174479/bird-cells-new.svg');
  filter: brightness(0) saturate(0);
  background-size: auto 100%;
  width: 50px;
  height: 70px;
  will-change: background-position;
  animation-name: fly-cycle;
  animation-timing-function: steps(10);
  animation-iteration-count: infinite;
  opacity: 0.6;
}

// Afternoon Scene
.afternoon-scene {
  width: 100%;
  height: 100%;
  position: relative;
}

.afternoon-sun {
  position: absolute;
  top: 12%;
  right: 20%;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 240, 180, 0.4) 0%,
    rgba(255, 230, 150, 0.2) 50%,
    transparent 70%
  );
  animation: sunGlow 4s ease-in-out infinite;
}

.afternoon-cloud {
  position: absolute;
  width: 80px;
  height: 24px;
  background: rgba(255, 255, 255, 0.75);
  border-radius: 100px;
  filter: blur(0.8px);
  animation: cloudDrift linear forwards;

  &::before,
  &::after {
    content: '';
    position: absolute;
    background: rgba(255, 255, 255, 0.75);
    border-radius: 50%;
    filter: blur(0.8px);
  }

  &::before {
    width: 36px;
    height: 36px;
    top: -14px;
    left: 14px;
    box-shadow: 20px 0 0 -2px rgba(255, 255, 255, 0.7);
  }

  &::after {
    width: 28px;
    height: 28px;
    top: -10px;
    right: 12px;
  }
}

.bee {
  position: absolute;
  width: 14px;
  height: 14px;
  animation: beeZigZag ease-in-out forwards;
}

.bee-body {
  position: absolute;
  width: 10px;
  height: 6px;
  background: rgba(255, 200, 0, 0.9);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);

  &::before {
    content: '';
    position: absolute;
    width: 4px;
    height: 4px;
    background: rgba(50, 50, 50, 0.9);
    border-radius: 50%;
    left: -2px;
    top: 50%;
    transform: translateY(-50%);
  }
}

.bee-stripes {
  position: absolute;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    90deg,
    transparent 0px,
    transparent 2px,
    rgba(50, 50, 50, 0.6) 2px,
    rgba(50, 50, 50, 0.6) 3px
  );
}

.bee-wings {
  position: absolute;
  width: 100%;
  height: 100%;
  animation: beeWingBuzz 0.03s ease-in-out infinite;

  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 6px;
    height: 8px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    top: 50%;
  }

  &::before {
    left: -1px;
    transform: translateY(-50%) rotate(-15deg);
  }

  &::after {
    right: -1px;
    transform: translateY(-50%) rotate(15deg);
  }
}

@keyframes beeZigZag {
  0% {
    transform: translate(0, 0);
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  15% {
    transform: translate(15vw, -8vh);
  }
  30% {
    transform: translate(25vw, 5vh);
  }
  45% {
    transform: translate(40vw, -6vh);
  }
  60% {
    transform: translate(55vw, 8vh);
  }
  75% {
    transform: translate(70vw, -4vh);
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translate(110vw, 2vh);
    opacity: 0;
  }
}

@keyframes beeWingBuzz {
  0%,
  100% {
    transform: scaleY(1);
    opacity: 0.3;
  }
  50% {
    transform: scaleY(0.5);
    opacity: 0.5;
  }
}

.afternoon-butterfly {
  position: absolute;
  width: 18px;
  height: 18px;
  animation: butterflyFloat ease-in-out forwards;
}

.floating-seed {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  animation: seedFloat ease-in-out forwards;

  &::before {
    content: '';
    position: absolute;
    width: 8px;
    height: 1px;
    background: rgba(255, 255, 255, 0.3);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(45deg);
  }

  &::after {
    content: '';
    position: absolute;
    width: 6px;
    height: 1px;
    background: rgba(255, 255, 255, 0.2);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-30deg);
  }
}

@keyframes seedFloat {
  0% {
    transform: translate(0, 0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 0.8;
  }
  20% {
    transform: translate(8vw, 20vh) rotate(60deg);
  }
  35% {
    transform: translate(-5vw, 35vh) rotate(140deg);
  }
  50% {
    transform: translate(12vw, 50vh) rotate(200deg);
  }
  65% {
    transform: translate(-8vw, 65vh) rotate(280deg);
  }
  80% {
    transform: translate(6vw, 85vh) rotate(340deg);
  }
  90% {
    opacity: 0.8;
  }
  100% {
    transform: translate(-4vw, 110vh) rotate(420deg);
    opacity: 0;
  }
}

.dust-particle {
  position: absolute;
  width: 2px;
  height: 2px;
  background: rgba(255, 230, 180, 0.5);
  border-radius: 50%;
  box-shadow: 0 0 3px 1px rgba(255, 230, 180, 0.3);
  animation: dustRise linear forwards;
}

@keyframes dustRise {
  0% {
    transform: translate(0, 0);
    opacity: 0;
  }
  10% {
    opacity: 0.6;
  }
  50% {
    transform: translate(5vw, -30vh);
    opacity: 0.6;
  }
  90% {
    opacity: 0.4;
  }
  100% {
    transform: translate(-3vw, -60vh);
    opacity: 0;
  }
}

.page-content {
  width: 100%;
  max-width: 600px;
  padding: 76.35px 24px 24px 24px; // Fine-tuned to match loading screen final position exactly
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.title-hidden {
  opacity: 0 !important;
}

.title-container {
  text-align: center;
  margin-bottom: 48px;
  margin-top: 0;
  transition: opacity 0.2s ease; // Faster fade to reduce flicker
}

.app-title {
  font-size: 64px !important;
  font-weight: 300 !important;
  margin: 0 !important;
  margin-bottom: 8px !important;
  padding: 0 !important;
  letter-spacing: 4px !important;
  color: white !important;
  text-shadow: none !important;
  line-height: 1 !important;
  font-family: inherit !important;

  .zen-emphasis {
    font-weight: 700 !important;
    letter-spacing: 8px !important;
  }

  .ith-subtle {
    font-weight: 200 !important;
    letter-spacing: 2px !important;
  }
}

.subtitle {
  font-size: 16px;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.9);
  margin: 8px 0 0 0;
  letter-spacing: 0.5px;
  text-align: center;
}

// Mobile responsiveness - match LoadingScreen
@media (max-width: 600px) {
  .app-title {
    font-size: 48px !important;
  }

  .subtitle {
    font-size: 14px;
  }
}

.time-badge {
  display: inline-block;
  padding: 8px 16px;
  background: v-bind('themeStore.colors.cardBg');
  color: v-bind('themeStore.colors.text');
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  backdrop-filter: blur(10px);
  transition: all 2s ease;
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.game-card {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: v-bind('themeStore.colors.cardBg');
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  // Make all text white
  :deep(*) {
    color: white !important;
  }
}

.footer-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
}
</style>
